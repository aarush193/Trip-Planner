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
 * Generates an intelligent, deterministic day-by-day itinerary based ONLY on user's places.
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

  // Group activities by locationHint if available
  const locationGroups: Map<string, ExtractedPlace[]> = new Map();
  activities.forEach((place) => {
    const locKey = (place.locationHint || "general").toLowerCase().trim();
    if (!locationGroups.has(locKey)) {
      locationGroups.set(locKey, []);
    }
    locationGroups.get(locKey)!.push(place);
  });

  // Target places per day
  const targetPerDay = Math.max(1, Math.ceil(activities.length / numDays));

  // Helper to count places in a day
  const getDayCount = (dayNum: number) =>
    schedule[dayNum].morning.length +
    schedule[dayNum].afternoon.length +
    schedule[dayNum].evening.length;

  // Track assigned place IDs
  const assignedPlaceIds = new Set<string>();

  // Process location groups to keep nearby places together on the same day when possible
  for (const [, groupPlaces] of locationGroups.entries()) {
    for (const place of groupPlaces) {
      if (assignedPlaceIds.has(place.id)) continue;

      // Find best candidate day: has fewest places, preferred day <= numDays
      let bestDay = 1;
      let minCount = Infinity;

      for (let d = 1; d <= numDays; d++) {
        const count = getDayCount(d);
        if (count < minCount && count < targetPerDay * 2) {
          minCount = count;
          bestDay = d;
        }
      }

      // Slot preference order based on category
      const slotPreferences = getPreferredSlots(place.category);

      // Find available slot on bestDay
      let assignedSlot: "morning" | "afternoon" | "evening" | null = null;
      for (const slot of slotPreferences) {
        if (schedule[bestDay][slot].length < 2) {
          assignedSlot = slot;
          break;
        }
      }

      // Fallback if preferred day is full: try any day with open slot
      if (!assignedSlot) {
        for (let d = 1; d <= numDays; d++) {
          for (const slot of slotPreferences) {
            if (schedule[d][slot].length < 3) {
              bestDay = d;
              assignedSlot = slot;
              break;
            }
          }
          if (assignedSlot) break;
        }
      }

      // Fallback slot if all preferred slots have items
      if (!assignedSlot) {
        assignedSlot = "afternoon";
      }

      schedule[bestDay][assignedSlot].push(place);
      assignedPlaceIds.add(place.id);
    }
  }

  return schedule;
}
