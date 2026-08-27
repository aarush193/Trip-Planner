import { NextResponse } from "next/server";
import { EnrichmentStatus } from "@/lib/vision";

export interface PlaceEnrichmentResult {
  canonicalName?: string;
  city?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  enrichmentStatus: EnrichmentStatus;
}

export interface EnrichPlaceResponse {
  success: boolean;
  enrichment: PlaceEnrichmentResult;
  error?: string;
}

interface NominatimAddress {
  city?: string;
  town?: string;
  village?: string;
  municipality?: string;
  county?: string;
  state?: string;
  country?: string;
  [key: string]: string | undefined;
}

interface NominatimResult {
  place_id: number;
  licence: string;
  osm_type: string;
  osm_id: number;
  boundingbox: string[];
  lat: string;
  lon: string;
  display_name: string;
  class: string;
  type: string;
  importance: number;
  name?: string;
  address?: NominatimAddress;
}

async function fetchNominatim(query: string): Promise<NominatimResult | null> {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
    query
  )}&format=json&addressdetails=1&limit=1`;

  const response = await fetch(url, {
    headers: {
      "User-Agent": "TripPlanner/2.0 (contact@tripplanner.app)",
      "Accept-Language": "en-US,en;q=0.9",
    },
  });

  if (!response.ok) {
    throw new Error(`Nominatim returned HTTP ${response.status}`);
  }

  const data: NominatimResult[] = await response.json();
  if (Array.isArray(data) && data.length > 0) {
    return data[0];
  }

  return null;
}

/**
 * Checks if a geocoded Nominatim result is geographically consistent with target destination.
 * Generically rejects results that resolved to a completely different state/province or distant city.
 */
function isGeographicallyConsistent(result: NominatimResult, targetDestination?: string): boolean {
  if (!targetDestination || !targetDestination.trim()) return true;

  const targetClean = targetDestination.toLowerCase().trim();
  const primaryTarget = targetClean.split(",")[0].trim().replace(/[^a-z0-9]/g, "");

  if (!primaryTarget || primaryTarget.length < 3) return true;

  const addr = result.address || {};
  const resCity = (addr.city || addr.town || addr.village || addr.municipality || addr.county || "").toLowerCase().trim().replace(/[^a-z0-9]/g, "");
  const resState = (addr.state || "").toLowerCase().trim().replace(/[^a-z0-9]/g, "");
  const displayName = (result.display_name || "").toLowerCase().trim().replace(/[^a-z0-9]/g, "");

  // If display_name or city contains primary target, it's consistent
  if (displayName.includes(primaryTarget) || resCity.includes(primaryTarget) || primaryTarget.includes(resCity && resCity.length >= 3 ? resCity : "___none___")) {
    return true;
  }

  // If target specified a state/country (e.g. "Mathura, Uttar Pradesh, India"), check if result state matches
  const targetParts = targetClean.split(",").map((s) => s.trim().replace(/[^a-z0-9]/g, "")).filter((s) => s.length >= 3);
  if (targetParts.length > 1 && resState) {
    const stateMatches = targetParts.some((part) => resState.includes(part) || part.includes(resState));
    if (stateMatches) return true;
  }

  // If result resolved to a distinct city in a completely different state, reject false match
  if (resCity && resCity.length >= 3 && !resCity.includes(primaryTarget) && !primaryTarget.includes(resCity)) {
    // Severe mismatch: candidate city does not match target city
    return false;
  }

  return true;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, locationHint, destination } = body || {};

    if (!title || typeof title !== "string" || !title.trim()) {
      return NextResponse.json(
        {
          success: false,
          enrichment: { enrichmentStatus: "failed" },
          error: "Title is required for place enrichment",
        },
        { status: 400 }
      );
    }

    const cleanTitle = title.trim();
    const cleanHint = typeof locationHint === "string" ? locationHint.trim() : "";
    const cleanDest = typeof destination === "string" ? destination.trim() : "";

    let result: NominatimResult | null = null;

    // 1. Primary Query: Search title with explicit destination context to resolve ambiguous places accurately
    const primaryQuery = cleanHint
      ? `${cleanTitle}, ${cleanHint}`
      : cleanDest
      ? `${cleanTitle}, ${cleanDest}`
      : cleanTitle;

    try {
      result = await fetchNominatim(primaryQuery);
    } catch (err) {
      console.warn(`Primary Nominatim search failed for "${primaryQuery}":`, err);
    }

    // 2. Secondary Query: Try title + target destination if primary query with locationHint gave no result
    if (!result && cleanDest && primaryQuery !== `${cleanTitle}, ${cleanDest}`) {
      try {
        result = await fetchNominatim(`${cleanTitle}, ${cleanDest}`);
      } catch (err) {
        console.warn(`Secondary Nominatim search failed for "${cleanTitle}, ${cleanDest}":`, err);
      }
    }

    // 3. Fallback: Search clean title
    if (!result) {
      try {
        result = await fetchNominatim(cleanTitle);
      } catch (err) {
        console.warn(`Fallback title search failed for "${cleanTitle}":`, err);
      }
    }

    if (!result) {
      return NextResponse.json({
        success: true,
        enrichment: {
          enrichmentStatus: "failed",
        },
      });
    }

    // Validate geographic consistency against requested destination
    const targetScope = cleanDest || cleanHint;
    if (targetScope && !isGeographicallyConsistent(result, targetScope)) {
      console.warn(`Rejecting false geocoding match "${result.display_name}" for place "${cleanTitle}" because it is outside requested scope "${targetScope}".`);
      return NextResponse.json({
        success: true,
        enrichment: {
          enrichmentStatus: "failed",
        },
      });
    }

    const addr = result.address || {};
    const city =
      addr.city ||
      addr.town ||
      addr.village ||
      addr.municipality ||
      addr.county ||
      addr.state ||
      undefined;

    const canonicalName =
      result.name || result.display_name.split(",")[0].trim();
    const address = result.display_name;
    const latitude = parseFloat(result.lat);
    const longitude = parseFloat(result.lon);

    const enrichment: PlaceEnrichmentResult = {
      canonicalName,
      city,
      address,
      latitude: isNaN(latitude) ? undefined : latitude,
      longitude: isNaN(longitude) ? undefined : longitude,
      enrichmentStatus: "enriched",
    };

    return NextResponse.json({
      success: true,
      enrichment,
    });
  } catch (error) {
    console.error("Place enrichment API error:", error);
    return NextResponse.json(
      {
        success: false,
        enrichment: { enrichmentStatus: "failed" },
        error: error instanceof Error ? error.message : "Failed to enrich place",
      },
      { status: 500 }
    );
  }
}
