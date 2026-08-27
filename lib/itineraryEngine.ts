import { ExtractedPlace } from "@/lib/vision";

export interface DaySchedule {
  dayNumber: number;
  morning: ExtractedPlace[];
  afternoon: ExtractedPlace[];
  evening: ExtractedPlace[];
  accommodations: ExtractedPlace[];
  totalDistanceKm?: number;
  totalTravelMinutes?: number;
}

export type TripSchedule = Record<number, DaySchedule>;

/**
 * Deduplicates places based on normalized title or ID.
 * Preserves initial order after sorting for determinism.
 */
export function deduplicatePlaces(places: ExtractedPlace[]): ExtractedPlace[] {
  const seenIds = new Set<string>();
  const seenTitles = new Set<string>();
  const result: ExtractedPlace[] = [];

  for (const place of places) {
    const titleKey = (place.title || "").toLowerCase().trim().replace(/[^a-z0-9]/g, "");
    const idKey = place.id ? place.id.toLowerCase().trim() : "";

    if (idKey && seenIds.has(idKey)) continue;
    if (titleKey && seenTitles.has(titleKey)) continue;

    if (idKey) seenIds.add(idKey);
    if (titleKey) seenTitles.add(titleKey);
    result.push(place);
  }

  return result;
}

/**
 * Haversine formula to compute distance (in kilometers) between two geographic coordinates.
 */
export function haversineDistance(
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
 * Checks if a place has valid numeric latitude & longitude coordinates.
 */
function hasValidCoordinates(place: ExtractedPlace): boolean {
  return (
    typeof place.latitude === "number" &&
    typeof place.longitude === "number" &&
    !isNaN(place.latitude) &&
    !isNaN(place.longitude) &&
    place.latitude >= -90 &&
    place.latitude <= 90 &&
    place.longitude >= -180 &&
    place.longitude <= 180
  );
}

/**
 * Deterministic K-Means / Medoid Geographic Clustering
 * Clusters coordinate-equipped places into K geographic day groups while balancing load.
 */
function clusterGeographicPlaces(
  geoPlaces: ExtractedPlace[],
  kClusters: number
): Map<number, ExtractedPlace[]> {
  const clusters = new Map<number, ExtractedPlace[]>();
  for (let i = 0; i < kClusters; i++) {
    clusters.set(i, []);
  }

  if (geoPlaces.length === 0 || kClusters <= 0) return clusters;
  if (kClusters === 1 || geoPlaces.length <= kClusters) {
    geoPlaces.forEach((place, idx) => {
      const clusterIdx = idx % kClusters;
      clusters.get(clusterIdx)!.push(place);
    });
    return clusters;
  }

  // Step A: Select initial cluster centroids deterministically using Farthest-First Traversal
  const centroids: { lat: number; lng: number }[] = [];

  // Seed 1: Place closest to geographic center of all points
  const avgLat = geoPlaces.reduce((sum, p) => sum + p.latitude!, 0) / geoPlaces.length;
  const avgLng = geoPlaces.reduce((sum, p) => sum + p.longitude!, 0) / geoPlaces.length;

  let firstSeed = geoPlaces[0];
  let minDistToAvg = Infinity;
  for (const p of geoPlaces) {
    const d = haversineDistance(avgLat, avgLng, p.latitude!, p.longitude!);
    if (d < minDistToAvg) {
      minDistToAvg = d;
      firstSeed = p;
    }
  }
  centroids.push({ lat: firstSeed.latitude!, lng: firstSeed.longitude! });

  // Seeds 2..K: Choose place furthest from existing centroids
  while (centroids.length < kClusters) {
    let maxMinDist = -1;
    let nextSeed = geoPlaces[0];

    for (const p of geoPlaces) {
      let minDistToAnyCentroid = Infinity;
      for (const c of centroids) {
        const dist = haversineDistance(c.lat, c.lng, p.latitude!, p.longitude!);
        if (dist < minDistToAnyCentroid) {
          minDistToAnyCentroid = dist;
        }
      }
      if (minDistToAnyCentroid > maxMinDist) {
        maxMinDist = minDistToAnyCentroid;
        nextSeed = p;
      }
    }
    centroids.push({ lat: nextSeed.latitude!, lng: nextSeed.longitude! });
  }

  // Step B: K-Means Iteration (max 15 passes)
  const maxIterations = 15;
  const idealPerCluster = geoPlaces.length / kClusters;

  for (let iter = 0; iter < maxIterations; iter++) {
    for (let i = 0; i < kClusters; i++) {
      clusters.set(i, []);
    }

    for (const place of geoPlaces) {
      let bestClusterIdx = 0;
      let minDistance = Infinity;

      for (let cIdx = 0; cIdx < kClusters; cIdx++) {
        const centroid = centroids[cIdx];
        const dist = haversineDistance(
          centroid.lat,
          centroid.lng,
          place.latitude!,
          place.longitude!
        );
        const count = clusters.get(cIdx)!.length;
        const minTarget = Math.floor(idealPerCluster);
        const capacityPenalty = count >= minTarget ? (count - minTarget + 0.5) * 6 : 0;
        const adjustedDist = dist + capacityPenalty;

        if (adjustedDist < minDistance) {
          minDistance = adjustedDist;
          bestClusterIdx = cIdx;
        }
      }

      clusters.get(bestClusterIdx)!.push(place);
    }

    let converged = true;
    for (let cIdx = 0; cIdx < kClusters; cIdx++) {
      const clusterPlaces = clusters.get(cIdx)!;
      if (clusterPlaces.length === 0) continue;

      const newLat = clusterPlaces.reduce((sum, p) => sum + p.latitude!, 0) / clusterPlaces.length;
      const newLng = clusterPlaces.reduce((sum, p) => sum + p.longitude!, 0) / clusterPlaces.length;

      const shift = haversineDistance(centroids[cIdx].lat, centroids[cIdx].lng, newLat, newLng);
      if (shift > 0.05) {
        converged = false;
      }

      centroids[cIdx] = { lat: newLat, lng: newLng };
    }

    if (converged) break;
  }

  return clusters;
}

/**
 * Sequences a day's places into an optimal spatial route to minimize backtracking.
 */
function sequenceDayPlaces(places: ExtractedPlace[]): ExtractedPlace[] {
  if (places.length <= 1) return [...places];

  const unvisited = [...places];
  const route: ExtractedPlace[] = [];

  // Start with northernmost place for consistent spatial progression
  unvisited.sort((a, b) => (b.latitude || 0) - (a.latitude || 0));
  let current = unvisited.shift()!;
  route.push(current);

  while (unvisited.length > 0) {
    let nearestIdx = 0;
    let minDistance = Infinity;

    for (let i = 0; i < unvisited.length; i++) {
      const candidate = unvisited[i];
      if (hasValidCoordinates(current) && hasValidCoordinates(candidate)) {
        const dist = haversineDistance(
          current.latitude!,
          current.longitude!,
          candidate.latitude!,
          candidate.longitude!
        );
        if (dist < minDistance) {
          minDistance = dist;
          nearestIdx = i;
        }
      } else {
        const cHint = (current.city || current.locationHint || "").toLowerCase().trim();
        const candHint = (candidate.city || candidate.locationHint || "").toLowerCase().trim();
        if (cHint && candHint && cHint === candHint) {
          minDistance = 0.5;
          nearestIdx = i;
          break;
        }
      }
    }

    current = unvisited.splice(nearestIdx, 1)[0];
    route.push(current);
  }

  return route;
}

/**
 * Internal scoring function to compute time-slot suitability.
 * Considers category preference as a scoring factor (not hard rule), spatial sequence position,
 * substantial attraction protection, and pace/slot load balancing.
 */
function evaluateSlotScore(
  place: ExtractedPlace,
  slot: "morning" | "afternoon" | "evening",
  seqPos: number,
  currentSlotPlaces: ExtractedPlace[],
  paceNorm: "relaxed" | "normal" | "packed" = "normal",
  totalDayPlaces: number = 3
): number {
  const category = place.category;
  const currentSlotCount = currentSlotPlaces.length;
  let score = 0;

  // 1. Category-to-Time-Slot Base Suitability
  switch (category) {
    case "sightseeing":
    case "culture":
      if (slot === "morning") score += 4.0;
      else if (slot === "afternoon") score += 2.0;
      else if (slot === "evening") score += 1.0;
      break;
    case "activity":
      if (slot === "afternoon") score += 4.0;
      else if (slot === "morning") score += 1.5;
      else if (slot === "evening") score += 1.0;
      break;
    case "shopping":
      if (slot === "afternoon") score += 3.5;
      else if (slot === "evening") score += 2.5;
      else if (slot === "morning") score += 1.0;
      break;
    case "food":
      if (slot === "evening") score += 4.5;
      else if (slot === "afternoon") score += 2.0;
      else if (slot === "morning") score += 0.5;
      break;
    default:
      if (slot === "morning") score += 2.0;
      else if (slot === "afternoon") score += 2.0;
      else if (slot === "evening") score += 2.0;
      break;
  }

  // 2. Spatial Sequence Alignment
  if (seqPos <= 0.35) {
    if (slot === "morning") score += 3.0;
    else if (slot === "afternoon") score += 1.5;
    else if (slot === "evening") score += 0.0;
  } else if (seqPos >= 0.65) {
    if (slot === "evening") score += 3.0;
    else if (slot === "afternoon") score += 1.5;
    else if (slot === "morning") score += 0.0;
  } else {
    if (slot === "afternoon") score += 2.5;
    else if (slot === "morning") score += 1.5;
    else if (slot === "evening") score += 1.5;
  }

  // 3. Substantial Attraction Protection
  if (category === "sightseeing" || category === "culture") {
    const substantialCount = currentSlotPlaces.filter(
      (p) => p.category === "sightseeing" || p.category === "culture"
    ).length;
    score -= substantialCount * 3.0;
  }

  // 4. Capacity & Empty Slot Load Balancing
  if (currentSlotCount === 0) {
    if (totalDayPlaces >= 2) {
      score += 4.5;
    } else {
      score += 1.5;
    }
  } else {
    if (totalDayPlaces <= 3) {
      score -= currentSlotCount * 4.0;
    } else {
      const targetPerSlot = Math.max(1, Math.ceil(totalDayPlaces / 3));
      const softLimit =
        paceNorm === "relaxed"
          ? 1
          : paceNorm === "packed"
          ? Math.max(2, targetPerSlot + 1)
          : targetPerSlot;
      if (currentSlotCount >= softLimit) {
        score -= (currentSlotCount - softLimit + 1) * 3.5;
      }
    }
  }

  return score;
}

/**
 * Intelligent, geographic & category-aware itinerary builder engine.
 *
 * Algorithm Highlights:
 * 1. Deterministic sorting & deduplication of input places.
 * 2. Accommodation isolation as daily hotel references.
 * 3. Pace-aware daily capacity capping (relaxed: 3, normal: 5, packed: 7).
 * 4. K-Means / Medoid geographic day clustering for coordinate-equipped places.
 * 5. City/locationHint fallback distribution for non-coordinate places.
 * 6. Intra-day spatial route sequencing (nearest-neighbor TSP) to avoid backtracking.
 * 7. Realistic time-slot allocation (morning anchor -> afternoon activity -> evening food/relaxation).
 * 8. Inter-place distance (km) and estimated travel time (minutes) calculations.
 */
export function buildItinerary(
  places: ExtractedPlace[],
  totalDays: number,
  pace?: "relaxed" | "normal" | "packed" | string,
  destinationName?: string
): TripSchedule {
  const numDays = Math.max(1, totalDays);
  const schedule: TripSchedule = {};

  const paceNorm: "relaxed" | "normal" | "packed" =
    pace === "relaxed" ? "relaxed" : pace === "packed" ? "packed" : "normal";

  for (let d = 1; d <= numDays; d++) {
    schedule[d] = {
      dayNumber: d,
      morning: [],
      afternoon: [],
      evening: [],
      accommodations: [],
      totalDistanceKm: 0,
      totalTravelMinutes: 0,
    };
  }

  if (!places || places.length === 0) return schedule;

  // Filter input places to ensure destination boundary consistency if destinationName provided
  let filteredPlaces = places;
  if (destinationName && destinationName.trim()) {
    const { evaluateDestinationRelevance } = require("./discovery");
    const valid = places.filter((p) => evaluateDestinationRelevance(p, destinationName) > -10);
    if (valid.length > 0) {
      filteredPlaces = valid;
    }
  }

  // Step 1: Deterministic sorting before deduplication
  const sortedRaw = [...filteredPlaces].sort((a, b) => {
    const titleA = (a.title || "").toLowerCase();
    const titleB = (b.title || "").toLowerCase();
    if (titleA < titleB) return -1;
    if (titleA > titleB) return 1;
    return (a.id || "").localeCompare(b.id || "");
  });

  const uniquePlaces = deduplicatePlaces(sortedRaw);
  if (uniquePlaces.length === 0) return schedule;

  // Step 2: Separate accommodations ("stay") from activities
  const stays = uniquePlaces.filter((p) => p.category === "stay");
  const activities = uniquePlaces.filter((p) => p.category !== "stay");

  if (stays.length > 0) {
    for (let d = 1; d <= numDays; d++) {
      schedule[d].accommodations = stays;
    }
  }

  if (activities.length === 0) return schedule;

  // Compute realistic max capacity per day based on pace limits
  const maxDayCapacity =
    paceNorm === "relaxed" ? 4 : paceNorm === "packed" ? 8 : 6;

  // Step 3: Partition activities into coordinate and non-coordinate groups
  const geoActivities = activities.filter(hasValidCoordinates);
  const nonGeoActivities = activities.filter((p) => !hasValidCoordinates(p));

  const dayAssignments = new Map<number, ExtractedPlace[]>();
  for (let d = 1; d <= numDays; d++) {
    dayAssignments.set(d, []);
  }

  const activeDaysNeeded = Math.min(numDays, activities.length);

  // Step 4: Geographic day clustering for coordinate-equipped places with capacity cap
  if (geoActivities.length > 0) {
    const kClusters = Math.min(activeDaysNeeded, geoActivities.length);
    const clusterMap = clusterGeographicPlaces(geoActivities, kClusters);

    for (let cIdx = 0; cIdx < kClusters; cIdx++) {
      const targetDay = cIdx + 1;
      const assigned = clusterMap.get(cIdx) || [];
      // Respect max daily capacity to avoid unrealistic overpacking
      const cappedAssigned = assigned.slice(0, maxDayCapacity);
      dayAssignments.get(targetDay)!.push(...cappedAssigned);
    }
  }

  // Step 5: Distribute non-coordinate places using city/locationHint grouping & load balancing
  if (nonGeoActivities.length > 0) {
    const hintGroups = new Map<string, ExtractedPlace[]>();
    for (const place of nonGeoActivities) {
      const hintKey = (place.city || place.locationHint || "general").toLowerCase().trim();
      if (!hintGroups.has(hintKey)) {
        hintGroups.set(hintKey, []);
      }
      hintGroups.get(hintKey)!.push(place);
    }

    for (const [, groupPlaces] of hintGroups) {
      for (const place of groupPlaces) {
        let minDay = 1;
        let minCount = Infinity;
        for (let d = 1; d <= activeDaysNeeded; d++) {
          const count = dayAssignments.get(d)!.length;
          if (count < minCount) {
            minCount = count;
            minDay = d;
          }
        }
        if (dayAssignments.get(minDay)!.length < maxDayCapacity) {
          dayAssignments.get(minDay)!.push(place);
        }
      }
    }
  }

  // Step 6: For each day, sequence places spatially, assign time slots & calculate transit times
  for (let d = 1; d <= numDays; d++) {
    const dayPlaces = dayAssignments.get(d) || [];
    if (dayPlaces.length === 0) continue;

    const sequencedRoute = sequenceDayPlaces(dayPlaces);
    const totalRouteItems = sequencedRoute.length;

    for (let idx = 0; idx < totalRouteItems; idx++) {
      const place = sequencedRoute[idx];
      const seqPos = (idx + 0.5) / totalRouteItems;

      const morningPlaces = schedule[d].morning;
      const afternoonPlaces = schedule[d].afternoon;
      const eveningPlaces = schedule[d].evening;

      const morningScore = evaluateSlotScore(
        place,
        "morning",
        seqPos,
        morningPlaces,
        paceNorm,
        totalRouteItems
      );
      const afternoonScore = evaluateSlotScore(
        place,
        "afternoon",
        seqPos,
        afternoonPlaces,
        paceNorm,
        totalRouteItems
      );
      const eveningScore = evaluateSlotScore(
        place,
        "evening",
        seqPos,
        eveningPlaces,
        paceNorm,
        totalRouteItems
      );

      const category = place.category;
      let chosenSlot: "morning" | "afternoon" | "evening" = "morning";
      const maxScore = Math.max(morningScore, afternoonScore, eveningScore);
      const eps = 0.001;

      if (Math.abs(morningScore - maxScore) < eps && (seqPos <= 0.4 || category === "sightseeing" || category === "culture")) {
        chosenSlot = "morning";
      } else if (Math.abs(eveningScore - maxScore) < eps && (seqPos >= 0.6 || category === "food")) {
        chosenSlot = "evening";
      } else if (Math.abs(afternoonScore - maxScore) < eps) {
        chosenSlot = "afternoon";
      } else if (Math.abs(morningScore - maxScore) < eps) {
        chosenSlot = "morning";
      } else {
        chosenSlot = "evening";
      }

      schedule[d][chosenSlot].push(place);
    }

    // Calculate inter-place travel distance (km) and estimated transit minutes for the day
    const dayOrderedPlaces = [
      ...schedule[d].morning,
      ...schedule[d].afternoon,
      ...schedule[d].evening,
    ];

    let totalDist = 0;
    let totalMins = 0;

    for (let i = 0; i < dayOrderedPlaces.length - 1; i++) {
      const p1 = dayOrderedPlaces[i];
      const p2 = dayOrderedPlaces[i + 1];
      if (hasValidCoordinates(p1) && hasValidCoordinates(p2)) {
        const legDist = haversineDistance(p1.latitude!, p1.longitude!, p2.latitude!, p2.longitude!);
        totalDist += legDist;
        // Urban travel estimate ~25 km/h + 5 min buffer per hop
        const legMins = Math.round((legDist / 25) * 60 + 5);
        totalMins += legMins;
      }
    }

    schedule[d].totalDistanceKm = Math.round(totalDist * 10) / 10;
    schedule[d].totalTravelMinutes = totalMins;
  }

  return schedule;
}

/**
 * Intelligent Itinerary Planner with automatic place discovery and expansion.
 * If user-provided places are sparse (e.g. 1 place for a 4-day trip), discovers nearby authentic
 * attractions/activities in the destination city to build a complete multi-day schedule.
 */
export async function planIntelligentItinerary(
  places: ExtractedPlace[],
  totalDays: number,
  pace?: string,
  destination?: string
): Promise<TripSchedule> {
  const numDays = Math.max(1, totalDays);
  const targetCity =
    destination ||
    (places && places.length > 0
      ? places[0].locationHint || places[0].city || places[0].title
      : "Paris, France");

  // Filter out any invalid cross-city places from input pool before scheduling
  const { evaluateDestinationRelevance } = await import("./discovery");
  const validPlaces = (places || []).filter((p) => evaluateDestinationRelevance(p, targetCity) > -10);
  const placesToUse = validPlaces.length > 0 ? validPlaces : places || [];

  const isSparse = !placesToUse || placesToUse.length < Math.max(2, numDays * 2.5);

  if (isSparse) {
    const { discoverNearbyPlaces, expandAndRankPlacesPool } = await import("./discovery");

    const discovered = await discoverNearbyPlaces(targetCity, placesToUse, numDays);
    const expandedPool = expandAndRankPlacesPool(placesToUse, discovered, numDays, targetCity);
    return buildItinerary(expandedPool, numDays, pace, targetCity);
  }

  return buildItinerary(placesToUse, numDays, pace, targetCity);
}

/**
 * Recalculates travel distance (km) and estimated minutes for a day schedule after manual edits.
 */
export function recalculateDayMetrics(day: DaySchedule): DaySchedule {
  const dayOrderedPlaces = [
    ...(day.morning || []),
    ...(day.afternoon || []),
    ...(day.evening || []),
  ];

  let totalDist = 0;
  let totalMins = 0;

  for (let i = 0; i < dayOrderedPlaces.length - 1; i++) {
    const p1 = dayOrderedPlaces[i];
    const p2 = dayOrderedPlaces[i + 1];
    if (hasValidCoordinates(p1) && hasValidCoordinates(p2)) {
      const legDist = haversineDistance(p1.latitude!, p1.longitude!, p2.latitude!, p2.longitude!);
      totalDist += legDist;
      const legMins = Math.round((legDist / 25) * 60 + 5);
      totalMins += legMins;
    }
  }

  return {
    ...day,
    totalDistanceKm: Math.round(totalDist * 10) / 10,
    totalTravelMinutes: totalMins,
  };
}

