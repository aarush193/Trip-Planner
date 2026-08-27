import { NextResponse } from "next/server";
import { GoogleGenAI, Type } from "@google/genai";
import { ExtractedPlace, PlaceCategory } from "@/lib/vision";
import fs from "fs";
import path from "path";

const VALID_CATEGORIES: PlaceCategory[] = [
  "sightseeing",
  "food",
  "activity",
  "stay",
  "culture",
  "shopping",
];

function getApiKey(): string {
  const envKeys = [
    process.env.GEMINI_API_KEY,
    process.env.GOOGLE_GENAI_API_KEY,
    process.env.GOOGLE_API_KEY,
    process.env.NEXT_PUBLIC_GEMINI_API_KEY,
  ];

  for (const raw of envKeys) {
    if (raw) {
      const clean = raw.trim().replace(/^["']|["']$/g, "");
      if (
        clean &&
        clean !== "your_gemini_api_key_here" &&
        !clean.startsWith("your_gemini_api_key")
      ) {
        return clean;
      }
    }
  }

  try {
    const envPaths = [
      path.join(process.cwd(), ".env.local"),
      path.join(process.cwd(), ".env"),
      path.join(process.cwd(), ".env.development"),
    ];

    for (const envPath of envPaths) {
      if (fs.existsSync(/*turbopackIgnore: true*/ envPath)) {
        const content = fs.readFileSync(/*turbopackIgnore: true*/ envPath, "utf-8");
        const lines = content.split(/\r?\n/);
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith("#") || !trimmed.includes("=")) continue;
          const [key, ...valParts] = trimmed.split("=");
          const keyName = key.trim();
          if (
            ["GEMINI_API_KEY", "GOOGLE_GENAI_API_KEY", "GOOGLE_API_KEY", "NEXT_PUBLIC_GEMINI_API_KEY"].includes(
              keyName
            )
          ) {
            const rawVal = valParts.join("=").trim().replace(/^["']|["']$/g, "");
            if (
              rawVal &&
              rawVal !== "your_gemini_api_key_here" &&
              !rawVal.startsWith("your_gemini_api_key")
            ) {
              return rawVal;
            }
          }
        }
      }
    }
  } catch (err) {
    console.error("Error reading env files from disk:", err);
  }

  return "";
}

function isValidCoordinate(lat?: number, lon?: number): boolean {
  return (
    typeof lat === "number" &&
    typeof lon === "number" &&
    !isNaN(lat) &&
    !isNaN(lon) &&
    lat >= -90 &&
    lat <= 90 &&
    lon >= -180 &&
    lon <= 180
  );
}

/**
 * OpenStreetMap Nominatim & Overpass API dynamic place discovery.
 * Queries real-world geographic databases for arbitrary cities/regions globally.
 */
async function discoverViaOpenStreetMap(
  destination: string,
  targetCount: number = 10
): Promise<ExtractedPlace[]> {
  try {
    const targetCity = destination.split(",")[0].trim();
    const searchTerms = [
      `museums in ${targetCity}`,
      `monuments in ${targetCity}`,
      `parks in ${targetCity}`,
      `attractions in ${targetCity}`,
    ];

    const timestamp = Date.now();
    const places: ExtractedPlace[] = [];
    const seenTitles = new Set<string>();

    for (const term of searchTerms) {
      if (places.length >= targetCount) break;

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
          for (let idx = 0; idx < rawData.length && places.length < targetCount; idx++) {
            const item = rawData[idx];
            const lat = parseFloat(item.lat);
            const lon = parseFloat(item.lon);
            if (!isValidCoordinate(lat, lon)) continue;

            const displayName = item.display_name || item.name || "";
            const rawName = item.name || displayName.split(",")[0].trim();
            const title = (rawName.toLowerCase() === targetCity.toLowerCase() || rawName.length < 3)
              ? (displayName.split(",")[0].trim() !== targetCity ? displayName.split(",")[0].trim() : (displayName.split(",")[1] || rawName).trim())
              : rawName;

            const normTitle = (title || "").toLowerCase().trim().replace(/[^a-z0-9]/g, "");
            if (!title || title.length < 3 || seenTitles.has(normTitle)) continue;

            seenTitles.add(normTitle);
            const rawType = (item.type || item.class || "").toLowerCase();

            let category: PlaceCategory = "sightseeing";
            if (rawType.includes("museum") || rawType.includes("historic") || rawType.includes("monument") || rawType.includes("artwork")) {
              category = "culture";
            } else if (rawType.includes("restaurant") || rawType.includes("cafe") || rawType.includes("food") || rawType.includes("pub")) {
              category = "food";
            } else if (rawType.includes("shop") || rawType.includes("mall") || rawType.includes("market")) {
              category = "shopping";
            } else if (rawType.includes("park") || rawType.includes("tour") || rawType.includes("attraction")) {
              category = "activity";
            }

            places.push({
              id: `osm-${timestamp}-${places.length}`,
              title,
              category,
              locationHint: destination,
              city: targetCity,
              confidence: 0.9,
              rawDetectedText: `OpenStreetMap POI (${rawType})`,
              notes: item.display_name,
              latitude: lat,
              longitude: lon,
              enrichmentStatus: "enriched",
            });
          }
        }
      }
    }

    return places;
  } catch (err) {
    console.warn("OpenStreetMap discovery query failed:", err);
    return [];
  }
}

export interface DiscoverPlacesRequest {
  destination?: string;
  anchorPlaces?: ExtractedPlace[];
  tripDays?: number;
}

export interface DiscoverPlacesResponse {
  success: boolean;
  places: ExtractedPlace[];
  error?: string;
}

export async function POST(request: Request) {
  try {
    const body: DiscoverPlacesRequest = await request.json();
    const { destination, anchorPlaces = [], tripDays = 3 } = body || {};

    const targetCity =
      destination ||
      (anchorPlaces.length > 0
        ? anchorPlaces[0].locationHint || anchorPlaces[0].city || anchorPlaces[0].title
        : "Paris, France");

    const targetCount = Math.max(8, Math.min(24, Math.max(1, tripDays) * 4 - anchorPlaces.length));
    const apiKey = getApiKey();

    // 1. Primary Discovery Engine: Gemini 3.6 Flash
    if (apiKey) {
      try {
        const anchorsText = anchorPlaces
          .map((p) => `${p.title} (${p.category}${p.locationHint ? `, ${p.locationHint}` : ""})`)
          .join("; ");

        const ai = new GoogleGenAI({ apiKey });

        const prompt = `You are a world-class local travel guide and geographic discovery engine.
Destination City/Region: "${targetCity}"
Anchor Places provided by user: "${anchorsText || "None specified"}"
Trip Duration: ${tripDays} days.

Discover exactly ${targetCount} famous, authentic, real-world travel attractions, cultural landmarks, activities, local food/dining spots, and shopping locations in and around "${targetCity}".
Requirements:
1. Do NOT invent fake places. All places MUST be real, famous, well-known locations in "${targetCity}".
2. Provide accurate, real-world latitude and longitude coordinates for each discovered place in "${targetCity}".
3. Ensure a balanced mix of categories across "sightseeing", "culture", "activity", "food", and "shopping".
4. Do NOT duplicate any of the provided anchor places (${anchorsText}).
5. STRICT DESTINATION BOUNDARY: The requested destination is strictly "${targetCity}". All discovered places MUST be physically located within the city limits, administrative bounds, or immediate local area of "${targetCity}". Do NOT include attractions or landmarks from neighboring distinct cities or separate destinations unless explicitly requested.

For each place:
- "title": Exact official name of the landmark/restaurant/activity.
- "category": Must be one of ["sightseeing", "food", "activity", "stay", "culture", "shopping"].
- "locationHint": City and Country (e.g. "${targetCity}").
- "notes": Concise recommendation or tip (e.g. "Iconic museum", "Popular evening bistro").
- "estimatedCost": Typical cost (e.g. "Free", "€15", "$25").
- "latitude": Accurate numeric latitude coordinate.
- "longitude": Accurate numeric longitude coordinate.

Return structured JSON adhering to the schema.`;

        const result = await ai.models.generateContent({
          model: "gemini-3.6-flash",
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                places: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      title: { type: Type.STRING },
                      category: {
                        type: Type.STRING,
                        enum: ["sightseeing", "food", "activity", "stay", "culture", "shopping"],
                      },
                      locationHint: { type: Type.STRING },
                      notes: { type: Type.STRING },
                      estimatedCost: { type: Type.STRING },
                      latitude: { type: Type.NUMBER },
                      longitude: { type: Type.NUMBER },
                    },
                    required: ["title", "category", "latitude", "longitude"],
                  },
                },
              },
              required: ["places"],
            },
          },
        });

        const responseText = result.text || "{}";
        const parsed = JSON.parse(responseText);
        const rawPlaces = Array.isArray(parsed.places) ? parsed.places : [];
        const timestamp = Date.now();

        const discoveredPlaces: ExtractedPlace[] = rawPlaces
          .map((p: Record<string, unknown>, idx: number) => {
            const cat = String(p.category || "sightseeing").toLowerCase() as PlaceCategory;
            const validCategory: PlaceCategory = VALID_CATEGORIES.includes(cat) ? cat : "sightseeing";
            const lat = typeof p.latitude === "number" ? p.latitude : undefined;
            const lon = typeof p.longitude === "number" ? p.longitude : undefined;

            return {
              id: `gemini-discovered-${timestamp}-${idx}`,
              title: String(p.title || "Discovered Attraction"),
              category: validCategory,
              locationHint: p.locationHint ? String(p.locationHint) : targetCity,
              city: targetCity.split(",")[0].trim(),
              confidence: 0.95,
              rawDetectedText: `Discovered nearby ${targetCity}`,
              notes: p.notes ? String(p.notes) : undefined,
              estimatedCost: p.estimatedCost ? String(p.estimatedCost) : undefined,
              latitude: isValidCoordinate(lat, lon) ? lat : undefined,
              longitude: isValidCoordinate(lat, lon) ? lon : undefined,
              enrichmentStatus: isValidCoordinate(lat, lon) ? ("enriched" as const) : ("pending" as const),
            };
          })
          .filter((p: ExtractedPlace) => Boolean(p.title));

        if (discoveredPlaces.length > 0) {
          return NextResponse.json({
            success: true,
            places: discoveredPlaces,
          });
        }
      } catch (geminiErr) {
        console.warn("Gemini Discovery API hit exception, falling back to OpenStreetMap:", geminiErr);
      }
    }

    // 2. Secondary Engine / Fallback: OpenStreetMap Overpass Spatial Engine
    const osmPlaces = await discoverViaOpenStreetMap(targetCity, targetCount);
    if (osmPlaces.length > 0) {
      return NextResponse.json({
        success: true,
        places: osmPlaces,
      });
    }

    return NextResponse.json(
      {
        success: false,
        places: [],
        error: `Could not discover places for "${targetCity}". Please check destination spelling or network access.`,
      },
      { status: 500 }
    );
  } catch (error) {
    console.error("Discover Places API Error:", error);
    return NextResponse.json(
      {
        success: false,
        places: [],
        error: error instanceof Error ? error.message : "Failed to discover nearby places",
      },
      { status: 500 }
    );
  }
}
