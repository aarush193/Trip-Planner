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
      "User-Agent": "TripPlanner/1.0 (contact@tripplanner.app)",
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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, locationHint } = body || {};

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
    const cleanHint =
      typeof locationHint === "string" ? locationHint.trim() : "";

    let result: NominatimResult | null = null;

    // Try combined query first if locationHint exists
    if (cleanHint) {
      try {
        result = await fetchNominatim(`${cleanTitle}, ${cleanHint}`);
      } catch (err) {
        console.warn(
          `Combined search failed for "${cleanTitle}, ${cleanHint}":`,
          err
        );
      }
    }

    // Fallback to title search if combined search returned no result
    if (!result) {
      try {
        result = await fetchNominatim(cleanTitle);
      } catch (err) {
        console.warn(`Title search failed for "${cleanTitle}":`, err);
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
