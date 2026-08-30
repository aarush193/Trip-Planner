import { NextResponse } from "next/server";
import { GoogleGenAI, Type } from "@google/genai";
import { ExtractedPlace, PlaceCategory } from "@/lib/vision";
import { getApiKey, generateContentWithFallback, PRIMARY_MODEL } from "@/lib/geminiClient";

const VALID_CATEGORIES: PlaceCategory[] = [
  "sightseeing",
  "food",
  "activity",
  "stay",
  "culture",
  "shopping",
];
export interface PlanTripTextResponse {
  success: boolean;
  destination?: string;
  tripDays?: number;
  pace?: string;
  preferences?: string;
  optionalConstraints?: string;
  places: ExtractedPlace[];
  error?: string;
}

export async function POST(request: Request) {
  try {
    const apiKey = getApiKey();
    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          places: [],
          error: "GEMINI_API_KEY is missing or invalid in .env.local.",
        },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { prompt } = body || {};

    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      return NextResponse.json(
        {
          success: false,
          places: [],
          error: "A valid prompt is required for AI trip planning.",
        },
        { status: 400 }
      );
    }

    const ai = new GoogleGenAI({ apiKey });

    const systemPrompt = `You are a travel planning assistant. The user will give a natural language request for a trip (e.g. "I'm going to Agra for 3 days. I want Taj Mahal, Agra Fort, Mehtab Bagh and good local food. Keep day 1 relaxed.").
Extract the structured parameters and specific places mentioned or implied by the request.
Do NOT generate a final day-by-day itinerary or time schedule.

For each place:
- "title": Name of landmark, venue, activity, restaurant, or hotel.
- "category": Must be one of ["sightseeing", "food", "activity", "stay", "culture", "shopping"].
- "locationHint": City/Region and Country (e.g. "Agra, India").
- "notes": User preferences or specific instructions for this spot (e.g. "Relaxed day 1", "Sunrise view").
- "estimatedCost": Price hint if mentioned or typical cost (e.g. "Free", "$20", "€15").

Return ONLY structured JSON adhering to the schema.`;

    const result = await generateContentWithFallback(ai, {
      model: PRIMARY_MODEL,
      contents: [
        {
          role: "user",
          parts: [
            { text: systemPrompt },
            { text: `USER TRIP REQUEST: "${prompt.trim()}"` },
          ],
        },
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            destination: { type: Type.STRING },
            tripDays: { type: Type.NUMBER },
            pace: { type: Type.STRING },
            preferences: { type: Type.STRING },
            optionalConstraints: { type: Type.STRING },
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
                },
                required: ["title", "category"],
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

    const extractedPlaces: ExtractedPlace[] = rawPlaces.map(
      (p: Record<string, unknown>, idx: number) => {
        const cat = String(p.category || "sightseeing").toLowerCase() as PlaceCategory;
        const validCategory: PlaceCategory = VALID_CATEGORIES.includes(cat) ? cat : "sightseeing";

        return {
          id: `ai-text-${timestamp}-${idx}`,
          title: String(p.title || "Target Attraction"),
          category: validCategory,
          locationHint: p.locationHint ? String(p.locationHint) : (parsed.destination || undefined),
          confidence: 0.95,
          rawDetectedText: `AI Request: "${prompt.slice(0, 60)}..."`,
          notes: p.notes ? String(p.notes) : undefined,
          estimatedCost: p.estimatedCost ? String(p.estimatedCost) : undefined,
        };
      }
    );

    const response: PlanTripTextResponse = {
      success: true,
      destination: parsed.destination || undefined,
      tripDays: typeof parsed.tripDays === "number" && parsed.tripDays > 0 ? Math.round(parsed.tripDays) : undefined,
      pace: parsed.pace || undefined,
      preferences: parsed.preferences || undefined,
      optionalConstraints: parsed.optionalConstraints || undefined,
      places: extractedPlaces,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("AI Plan Trip Text Error:", error);
    const errMessage = error instanceof Error ? error.message : String(error);
    const isRateLimit =
      errMessage.includes("429") ||
      errMessage.includes("RESOURCE_EXHAUSTED") ||
      errMessage.toLowerCase().includes("quota") ||
      errMessage.toLowerCase().includes("rate limit");

    const isHighDemand =
      errMessage.includes("503") ||
      errMessage.includes("UNAVAILABLE") ||
      errMessage.includes("high demand") ||
      errMessage.includes("Spikes in demand");

    let userFriendlyError = errMessage || "Failed to process AI trip request";
    if (isRateLimit) {
      userFriendlyError = "AI quota temporarily exceeded (Rate Limit). Please wait a few seconds before trying again.";
    } else if (isHighDemand) {
      userFriendlyError = "Google AI service is experiencing temporary high demand. Please try again in a few moments.";
    }

    return NextResponse.json(
      {
        success: false,
        places: [],
        error: userFriendlyError,
      },
      { status: isRateLimit ? 429 : isHighDemand ? 503 : 500 }
    );
  }
}
