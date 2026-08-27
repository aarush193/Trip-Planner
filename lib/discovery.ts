import { ExtractedPlace, PlaceCategory } from "./vision";
import { DiscoverPlacesResponse } from "@/app/api/discover-places/route";
import { haversineDistance } from "./itineraryEngine";

/**
 * Calls server API endpoint (/api/discover-places) to dynamically discover authentic nearby places
 * for any arbitrary destination city or geographic coordinates globally.
 */
export async function discoverNearbyPlaces(
  destination: string,
  anchorPlaces: ExtractedPlace[] = [],
  tripDays: number = 3
): Promise<ExtractedPlace[]> {
  try {
    let apiUrl = "/api/discover-places";
    if (typeof window === "undefined") {
      const port = process.env.PORT || 3000;
      apiUrl = `http://localhost:${port}/api/discover-places`;
    }

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        destination,
        anchorPlaces,
        tripDays,
      }),
    });

    if (response.ok) {
      const data: DiscoverPlacesResponse = await response.json();
      if (data.success && Array.isArray(data.places) && data.places.length > 0) {
        return data.places;
      }
    }
  } catch (err) {
    console.warn("Dynamic discovery API call encountered an error, falling back to OSM query:", err);
  }

  // Direct OpenStreetMap POI fallback query for CLI & offline execution environments
  try {
    const targetCity = destination.split(",")[0].trim();
    const searchTerms = [
      `museums in ${targetCity}`,
      `monuments in ${targetCity}`,
      `parks in ${targetCity}`,
      `attractions in ${targetCity}`,
    ];

    const timestamp = Date.now();
    const osmPlaces: ExtractedPlace[] = [];
    const seenTitles = new Set<string>();

    for (const term of searchTerms) {
      if (osmPlaces.length >= 10) break;

      const searchUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
        term
      )}&format=json&addressdetails=1&extratags=1&limit=15`;

      const res = await fetch(searchUrl, {
        headers: {
          "User-Agent": "TripPlannerApp/2.0 (contact@tripplanner.app)",
          "Accept-Language": "en-US,en;q=0.9",
        },
      });

      if (res.ok) {
        const rawData = await res.json();
        if (Array.isArray(rawData)) {
          for (let idx = 0; idx < rawData.length; idx++) {
            const item = rawData[idx];
            const lat = parseFloat(item.lat);
            const lon = parseFloat(item.lon);
            const displayName = item.display_name || item.name || "";
            const rawName = item.name || displayName.split(",")[0].trim();
            const title = (rawName.toLowerCase() === targetCity.toLowerCase() || rawName.length < 3)
              ? (displayName.split(",")[0].trim() !== targetCity ? displayName.split(",")[0].trim() : (displayName.split(",")[1] || rawName).trim())
              : rawName;

            const normTitle = (title || "").toLowerCase().trim().replace(/[^a-z0-9]/g, "");

            if (!title || title.length < 3 || isNaN(lat) || isNaN(lon) || seenTitles.has(normTitle)) continue;

            seenTitles.add(normTitle);
            const rawType = (item.type || item.class || "").toLowerCase();

            let category: PlaceCategory = "sightseeing";
            if (rawType.includes("museum") || rawType.includes("historic") || rawType.includes("monument")) category = "culture";
            else if (rawType.includes("restaurant") || rawType.includes("cafe") || rawType.includes("food")) category = "food";
            else if (rawType.includes("shop") || rawType.includes("market")) category = "shopping";
            else if (rawType.includes("park") || rawType.includes("tour")) category = "activity";

            osmPlaces.push({
              id: `osm-direct-${timestamp}-${osmPlaces.length}`,
              title,
              category,
              locationHint: destination,
              city: targetCity,
              confidence: 0.9,
              latitude: lat,
              longitude: lon,
              enrichmentStatus: "enriched",
            });
          }
        }
      }
    }

    if (osmPlaces.length > 0) return osmPlaces;
  } catch (osmErr) {
    console.warn("Direct OSM discovery fallback failed:", osmErr);
  }

  return [];
}

/**
 * Generic 3-Tier Destination Boundary Relevance Classifier.
 * Evaluates whether a place candidate belongs to the requested destination scope,
 * a regional suburb, or a distinctly separate city.
 * Completely generic - NO hardcoded city names or exclusion lists.
 */
export function evaluateDestinationRelevance(
  place: ExtractedPlace,
  targetDestination?: string
): number {
  if (!targetDestination || !targetDestination.trim()) return 0;

  const targetClean = targetDestination.toLowerCase().trim();
  const primaryTarget = targetClean.split(",")[0].trim().replace(/[^a-z0-9]/g, "");

  if (!primaryTarget || primaryTarget.length < 3) return 0;

  const placeCity = (place.city || "").toLowerCase().trim().replace(/[^a-z0-9]/g, "");
  const placeHint = (place.locationHint || "").toLowerCase().trim().replace(/[^a-z0-9]/g, "");

  // TIER 1: Direct Destination Match (+15 pts)
  const isDirectCityMatch =
    placeCity.includes(primaryTarget) ||
    primaryTarget.includes(placeCity && placeCity.length >= 3 ? placeCity : "___none___");
  const isDirectHintMatch =
    placeHint.includes(primaryTarget) ||
    primaryTarget.includes(placeHint && placeHint.length >= 3 ? placeHint : "___none___");

  if (isDirectCityMatch || isDirectHintMatch) {
    return 15.0;
  }

  // TIER 3: Mismatch / Separate City Penalty (-20 pts)
  // If place.city explicitly names a DIFFERENT distinct city (length >= 3) that does NOT match primaryTarget:
  if (placeCity && placeCity.length >= 3 && !placeCity.includes(primaryTarget) && !primaryTarget.includes(placeCity)) {
    return -20.0;
  }

  // Check if locationHint explicitly names a different distinct city before comma
  if (placeHint && placeHint.length >= 3) {
    const hintCity = placeHint.split(",")[0].trim().replace(/[^a-z0-9]/g, "");
    if (hintCity && hintCity.length >= 3 && !hintCity.includes(primaryTarget) && !primaryTarget.includes(hintCity)) {
      return -20.0;
    }
  }

  // TIER 2: Regional Suburb / Neutral (0 to +2 pts)
  return 2.0;
}

/**
 * Combines user-provided anchor places with discovered places, deduplicates,
 * ranks by destination boundary relevance, proximity to anchor centroids, and category diversity,
 * and yields an optimal pool size for the requested trip length.
 */
export function expandAndRankPlacesPool(
  userPlaces: ExtractedPlace[],
  discoveredPlaces: ExtractedPlace[],
  totalDays: number,
  destination?: string
): ExtractedPlace[] {
  const targetDest =
    destination ||
    (userPlaces.length > 0
      ? userPlaces[0].locationHint || userPlaces[0].city || userPlaces[0].title
      : undefined);

  const normUserTitles = new Set(
    userPlaces.map((p) => (p.title || "").toLowerCase().trim().replace(/[^a-z0-9]/g, ""))
  );

  // Keep user places as highest priority (rank index 0)
  const pool: ExtractedPlace[] = [...userPlaces];

  // Filter out duplicates from discovered places
  const uniqueDiscovered: ExtractedPlace[] = [];
  for (const place of discoveredPlaces) {
    const titleKey = (place.title || "").toLowerCase().trim().replace(/[^a-z0-9]/g, "");
    if (!titleKey || normUserTitles.has(titleKey)) continue;

    normUserTitles.add(titleKey);
    uniqueDiscovered.push(place);
  }

  // Compute anchor geographic centroid if coordinates exist
  const geoAnchors = userPlaces.filter(
    (p) => typeof p.latitude === "number" && typeof p.longitude === "number"
  );

  let centroidLat = 0;
  let centroidLng = 0;
  if (geoAnchors.length > 0) {
    centroidLat = geoAnchors.reduce((s, p) => s + p.latitude!, 0) / geoAnchors.length;
    centroidLng = geoAnchors.reduce((s, p) => s + p.longitude!, 0) / geoAnchors.length;
  }

  // Rank discovered places by destination boundary relevance, proximity to anchor centroid & category diversity
  const categoryCounts: Record<string, number> = {};
  userPlaces.forEach((p) => {
    categoryCounts[p.category] = (categoryCounts[p.category] || 0) + 1;
  });

  const rankedDiscovered = uniqueDiscovered.sort((a, b) => {
    let scoreA = evaluateDestinationRelevance(a, targetDest);
    let scoreB = evaluateDestinationRelevance(b, targetDest);

    // Proximity to anchor centroid
    if (geoAnchors.length > 0 && typeof a.latitude === "number" && typeof a.longitude === "number") {
      const distA = haversineDistance(centroidLat, centroidLng, a.latitude, a.longitude);
      scoreA += Math.max(0, 10 - distA * 0.5);
    }
    if (geoAnchors.length > 0 && typeof b.latitude === "number" && typeof b.longitude === "number") {
      const distB = haversineDistance(centroidLat, centroidLng, b.latitude, b.longitude);
      scoreB += Math.max(0, 10 - distB * 0.5);
    }

    // Category balance score (boost categories under-represented in user pool)
    const countCatA = categoryCounts[a.category] || 0;
    const countCatB = categoryCounts[b.category] || 0;
    scoreA += Math.max(0, 5 - countCatA * 1.5);
    scoreB += Math.max(0, 5 - countCatB * 1.5);

    return scoreB - scoreA;
  });

  // Filter out candidates with severe destination mismatch penalties (< -10) unless user pool is starving
  const validDiscovered = rankedDiscovered.filter(
    (p) => evaluateDestinationRelevance(p, targetDest) > -10
  );
  const candidatesToUse = validDiscovered.length > 0 ? validDiscovered : rankedDiscovered;

  // Determine target pool size: ~3-4 places per day
  const targetPoolSize = Math.max(userPlaces.length, totalDays * 3.5);
  const neededFromDiscovered = Math.max(0, Math.ceil(targetPoolSize - userPlaces.length));

  pool.push(...candidatesToUse.slice(0, neededFromDiscovered));

  return pool;
}
