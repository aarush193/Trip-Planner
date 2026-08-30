import { GoogleGenAI } from "@google/genai";
import fs from "fs";
import path from "path";

export const PRIMARY_MODEL = "gemini-3.7-flash";
export const FALLBACK_MODELS = ["gemini-3.5-flash-lite"];

/**
 * Robust API key retriever across environment variables and local .env files.
 */
export function getApiKey(): string {
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
        const content = fs.readFileSync(envPath, "utf-8");
        for (const line of content.split("\n")) {
          const trimmed = line.trim();
          if (
            trimmed.startsWith("GEMINI_API_KEY=") ||
            trimmed.startsWith("GOOGLE_GENAI_API_KEY=") ||
            trimmed.startsWith("GOOGLE_API_KEY=") ||
            trimmed.startsWith("NEXT_PUBLIC_GEMINI_API_KEY=")
          ) {
            const val = trimmed
              .split("=")
              .slice(1)
              .join("=")
              .trim()
              .replace(/^["']|["']$/g, "");
            if (
              val &&
              val !== "your_gemini_api_key_here" &&
              !val.startsWith("your_gemini_api_key")
            ) {
              return val;
            }
          }
        }
      }
    }
  } catch (err) {
    console.warn("Could not read local env file:", err);
  }

  return "";
}

/**
 * Detects if an error is caused by temporary 503 high demand, 429 quota exhaustion, 404 model unavailability, or server capacity limits.
 */
export function isOverloadError(err: unknown): boolean {
  const msg = (err instanceof Error ? err.message : String(err)).toLowerCase();
  return (
    msg.includes("503") ||
    msg.includes("unavailable") ||
    msg.includes("high demand") ||
    msg.includes("spikes in demand") ||
    msg.includes("resource_exhausted") ||
    msg.includes("429") ||
    msg.includes("500") ||
    msg.includes("overloaded") ||
    msg.includes("not_found") ||
    msg.includes("404")
  );
}

/**
 * Calls Gemini generateContent with primary model (gemini-3.7-flash) and automatically
 * falls back to standby models (gemini-2.0-flash, gemini-1.5-flash) if 503 / high demand spikes occur.
 */
export async function generateContentWithFallback(
  ai: GoogleGenAI,
  requestParams: Parameters<GoogleGenAI["models"]["generateContent"]>[0]
) {
  const requestedModel = (requestParams.model as string) || PRIMARY_MODEL;
  const modelsToTry = [
    requestedModel,
    ...FALLBACK_MODELS.filter((m) => m !== requestedModel),
  ];

  let lastError: unknown = null;

  for (let i = 0; i < modelsToTry.length; i++) {
    const currentModel = modelsToTry[i];
    try {
      const result = await ai.models.generateContent({
        ...requestParams,
        model: currentModel,
      });
      return result;
    } catch (err) {
      lastError = err;
      console.warn(`Gemini generation error with model ${currentModel}:`, err);

      // If it's a 503 high demand or temporary overload error, try next standby model
      if (isOverloadError(err) && i < modelsToTry.length - 1) {
        console.info(
          `Model ${currentModel} unavailable/experiencing high demand, falling back to ${modelsToTry[i + 1]}...`
        );
        await new Promise((res) => setTimeout(res, 500));
        continue;
      }

      throw err;
    }
  }

  throw lastError;
}
