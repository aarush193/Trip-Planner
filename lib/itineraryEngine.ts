import { ExtractedPlace } from "./vision";

export interface DaySchedule {
  dayNumber: number;
  morning: ExtractedPlace[];
  afternoon: ExtractedPlace[];
  evening: ExtractedPlace[];
  accommodations: ExtractedPlace[];
}

export type TripSchedule = Record<number, DaySchedule>;

/**
 * Deduplicates places based on normalized title.
 */
export function deduplicatePlaces(places: ExtractedPlace[]): ExtractedPlace[] {
  const seen = new Set<string>();
  return places.filter((place) => {
    const key = place.title.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Haversine formula to compute distance (in kilometers) between two geographic coordinates.
 */
function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Maps place categories to preferred time slots in priority order.
 */
function getPreferredSlots(category: string): Array<"morning" | "afternoon" | "evening"> {
  switch (category) {
    case "sightseeing":
    case "culture":
      return ["morning", "afternoon", "evening"];
    case "activity":
      return ["afternoon", "morning", "evening"];
    case "shopping":
      return ["afternoon", "evening", "morning"];
    case "food":
      return ["evening", "afternoon", "morning"];
    default:
      return ["morning", "afternoon", "evening"];
  }
}

/**
 * Generates an intelligent, geographic & category-aware day-by-day itinerary.
 * Uses enriched latitude/longitude when available, falls back to locationHint/city,
 * balances load evenly across trip days, and respects category slot preferences.
 */
export function buildItinerary(
  places: ExtractedPlace[],
  totalDays: number
): TripSchedule {
  const numDays = Math.max(1, totalDays);
  const schedule: TripSchedule = {};

  for (let d = 1; d <= numDays; d++) {
    schedule[d] = {
      dayNumber: d,
      morning: [],
      afternoon: [],
      evening: [],
      accommodations: [],
    };
  }

  const uniquePlaces = deduplicatePlaces(places);
  if (uniquePlaces.length === 0) return schedule;

  // Separate stays (accommodations) from general activity places
  const stays = uniquePlaces.filter((p) => p.category === "stay");
  const activities = uniquePlaces.filter((p) => p.category !== "stay");

  // Accommodations are attached as daily hotel references
  if (stays.length > 0) {
    for (let d = 1; d <= numDays; d++) {
      schedule[d].accommodations = stays;
    }
  }

  if (activities.length === 0) return schedule;

  // Sort activities into geographically-ordered sequence using nearest-neighbor route heuristic
  const unvisited = [...activities];
  const orderedActivities: ExtractedPlace[] = [];

  // Start with the first place that has valid coordinates (or the first place in list)
  let current =
    unvisited.find(
      (p) => typeof p.latitude === "number" && typeof p.longitude === "number"
    ) || unvisited[0];

  orderedActivities.push(current);
  unvisited.splice(unvisited.indexOf(current), 1);

  while (unvisited.length > 0) {
    let nearestIndex = 0;
    let minDistance = Infinity;

    for (let i = 0; i < unvisited.length; i++) {
      const candidate = unvisited[i];

      if (
        typeof current.latitude === "number" &&
        typeof current.longitude === "number" &&
        typeof candidate.latitude === "number" &&
        typeof candidate.longitude === "number"
      ) {
        const dist = haversineDistance(
          current.latitude,
          current.longitude,
          candidate.latitude,
          candidate.longitude
        );
        if (dist < minDistance) {
          minDistance = dist;
          nearestIndex = i;
        }
      } else {
        // Fallback: check matching city or locationHint
        const currHint = (current.city || current.locationHint || "").toLowerCase().trim();
        const candHint = (candidate.city || candidate.locationHint || "").toLowerCase().trim();

        if (currHint && candHint && currHint === candHint) {
          minDistance = 0.1;
          nearestIndex = i;
          break;
        }
      }
    }

    current = unvisited[nearestIndex];
    orderedActivities.push(current);
    unvisited.splice(nearestIndex, 1);
  }

  // Distribute ordered places across trip days to balance load evenly
  const targetPerDay = Math.ceil(orderedActivities.length / numDays);

  const getDayCount = (dayNum: number) =>
    schedule[dayNum].morning.length +
    schedule[dayNum].afternoon.length +
    schedule[dayNum].evening.length;

  for (const place of orderedActivities) {
    // Select best day that has not exceeded targetPerDay places
    let bestDay = 1;
    let minCount = Infinity;

    for (let d = 1; d <= numDays; d++) {
      const count = getDayCount(d);
      if (count < minCount && count < targetPerDay) {
        minCount = count;
        bestDay = d;
      }
    }

    // Fallback if all days reached targetPerDay: pick day with absolute minimum count
    if (minCount === Infinity) {
      for (let d = 1; d <= numDays; d++) {
        const count = getDayCount(d);
        if (count < minCount) {
          minCount = count;
          bestDay = d;
        }
      }
    }

    // Slot preference order based on place category
    const slotPreferences = getPreferredSlots(place.category);

    // Find open preferred slot on bestDay (prefer <= 2 items per slot first)
    let assignedSlot: "morning" | "afternoon" | "evening" | null = null;
    for (const slot of slotPreferences) {
      if (schedule[bestDay][slot].length < 2) {
        assignedSlot = slot;
        break;
      }
    }

    // Fallback slot search if preferred slots are full
    if (!assignedSlot) {
      for (const slot of slotPreferences) {
        if (schedule[bestDay][slot].length < 4) {
          assignedSlot = slot;
          break;
        }
      }
    }

    if (!assignedSlot) {
      assignedSlot = "afternoon";
    }

    schedule[bestDay][assignedSlot].push(place);
  }

  return schedule;
}
