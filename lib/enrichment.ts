import { ExtractedPlace } from "./vision";
import { EnrichPlaceResponse } from "@/app/api/enrich-place/route";

/**
 * Calls the server-side /api/enrich-place endpoint to enrich a single place.
 */
export async function enrichPlace(place: ExtractedPlace): Promise<ExtractedPlace> {
  try {
    const response = await fetch("/api/enrich-place", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: place.title,
        locationHint: place.locationHint,
      }),
    });

    if (!response.ok) {
      return {
        ...place,
        enrichmentStatus: "failed",
      };
    }

    const data: EnrichPlaceResponse = await response.json();

    if (data.success && data.enrichment) {
      return {
        ...place,
        canonicalName: data.enrichment.canonicalName,
        city: data.enrichment.city,
        address: data.enrichment.address,
        latitude: data.enrichment.latitude,
        longitude: data.enrichment.longitude,
        enrichmentStatus: data.enrichment.enrichmentStatus,
      };
    }

    return {
      ...place,
      enrichmentStatus: "failed",
    };
  } catch (err) {
    console.error(`Failed to enrich place "${place.title}":`, err);
    return {
      ...place,
      enrichmentStatus: "failed",
    };
  }
}

/**
 * Enriches an array of ExtractedPlaces sequentially with a small delay
 * to respect rate limits.
 */
export async function enrichPlaces(
  places: ExtractedPlace[],
  onPlaceEnriched?: (updatedPlace: ExtractedPlace) => void
): Promise<ExtractedPlace[]> {
  const enrichedList: ExtractedPlace[] = [];

  for (const place of places) {
    // Skip if already enriched
    if (place.enrichmentStatus === "enriched") {
      enrichedList.push(place);
      continue;
    }

    const enriched = await enrichPlace(place);
    enrichedList.push(enriched);

    if (onPlaceEnriched) {
      onPlaceEnriched(enriched);
    }

    // Small 250ms pause between requests to respect Nominatim usage rate guidelines
    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  return enrichedList;
}
