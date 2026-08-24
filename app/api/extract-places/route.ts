import { NextResponse } from "next/server";
import { GoogleGenAI, Type } from "@google/genai";
import { VisionAnalysisResponse, ExtractedPlace, PlaceCategory } from "@/lib/vision";

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
  // 1. Check process.env variables
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

  // 2. Direct filesystem fallback read from .env.local or .env
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

export async function POST(request: Request) {
  try {
    const rawEnvKey = process.env.GEMINI_API_KEY;
    const apiKey = getApiKey();

    const keyPrefix = rawEnvKey
      ? rawEnvKey.startsWith("AIza")
        ? "Real Google Key (AIza...)"
        : rawEnvKey.startsWith("your")
        ? "Placeholder string (your...)"
        : "Custom key string"
      : "Missing / undefined";

    console.log("[DEBUG API KEY] Status:", keyPrefix, "| Length:", rawEnvKey ? rawEnvKey.length : 0);

    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          places: [],
          error:
            "GEMINI_API_KEY is missing or set to the placeholder text in .env.local. Please open .env.local and replace your_gemini_api_key_here with your real API key from Google AI Studio.",
        },
        { status: 400 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const imageId = (formData.get("imageId") as string) || `img-${Date.now()}`;
    const imageName = (formData.get("imageName") as string) || file?.name || "screenshot.png";

    if (!file) {
      return NextResponse.json(
        {
          success: false,
          places: [],
          error: "No image file provided in request.",
        },
        { status: 400 }
      );
    }

    // Convert file buffer to base64
    const arrayBuffer = await file.arrayBuffer();
    const base64Data = Buffer.from(arrayBuffer).toString("base64");
    const mimeType = file.type || "image/jpeg";

    // Initialize Google Gen AI client
    const ai = new GoogleGenAI({ apiKey });

    const prompt = `You are an expert travel assistant analyzing travel screenshots, Instagram reel captures, TikTok saves, or camera roll photos.
Analyze the image content and extract ALL identifiable travel places, attractions, landmarks, restaurants, cafes, hotels, or activities.

For each extracted place:
- "title": Name of the place, landmark, venue, or spot.
- "category": Must be one of ["sightseeing", "food", "activity", "stay", "culture", "shopping"].
- "locationHint": City, district, or neighborhood mentioned in text or visible.
- "rawDetectedText": Any visible text, sticker location tag, caption, or handle extracted from the image.
- "notes": Useful tips or recommendations visible in the screenshot (e.g. "sunset spot", "book early").
- "confidence": A score between 0.5 and 1.0 indicating confidence in identifying the place.
- "estimatedCost": Estimated price or cost mentioned (e.g. "Free", "$20", "€15").

Return ONLY structured data matching the schema.`;

    const result = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                mimeType,
                data: base64Data,
              },
            },
            { text: prompt },
          ],
        },
      ],
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
                  rawDetectedText: { type: Type.STRING },
                  notes: { type: Type.STRING },
                  confidence: { type: Type.NUMBER },
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
    const parsedData = JSON.parse(responseText);

    const rawPlaces = Array.isArray(parsedData.places) ? parsedData.places : [];

    const extractedPlaces: ExtractedPlace[] = rawPlaces.map((p: Record<string, unknown>, idx: number) => {
      const cat = String(p.category || "sightseeing").toLowerCase() as PlaceCategory;
      const validCategory: PlaceCategory = VALID_CATEGORIES.includes(cat) ? cat : "sightseeing";

      return {
        id: `gemini-${Date.now()}-${idx}`,
        sourceImageId: imageId,
        sourceImageName: imageName,
        title: String(p.title || "Identified Location"),
        category: validCategory,
        locationHint: p.locationHint ? String(p.locationHint) : undefined,
        confidence: typeof p.confidence === "number" ? Math.min(1.0, Math.max(0.5, p.confidence)) : 0.95,
        rawDetectedText: p.rawDetectedText ? String(p.rawDetectedText) : undefined,
        notes: p.notes ? String(p.notes) : undefined,
        estimatedCost: p.estimatedCost ? String(p.estimatedCost) : undefined,
      };
    });

    const response: VisionAnalysisResponse = {
      success: true,
      places: extractedPlaces,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Gemini Vision API Error:", error);
    return NextResponse.json(
      {
        success: false,
        places: [],
        error: error instanceof Error ? error.message : "Failed to analyze screenshot with Gemini Vision API",
      },
      { status: 500 }
    );
  }
}
