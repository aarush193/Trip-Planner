export type PlaceCategory =
  | "sightseeing"
  | "food"
  | "activity"
  | "stay"
  | "culture"
  | "shopping";

export type EnrichmentStatus = "pending" | "enriched" | "failed";

export interface ExtractedPlace {
  id: string;
  sourceImageId?: string;
  sourceImageName?: string;
  title: string;
  category: PlaceCategory;
  locationHint?: string;
  confidence: number;
  rawDetectedText?: string;
  notes?: string;
  estimatedCost?: string;
  canonicalName?: string;
  city?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  enrichmentStatus?: EnrichmentStatus;
}

export interface UploadedScreenshot {
  id: string;
  file?: File;
  previewUrl: string;
  name: string;
  size: number;
  uploadedAt: Date;
  status: "uploading" | "analyzing" | "completed" | "error";
  extractedCount?: number;
  errorMessage?: string;
}

export interface VisionAnalysisResponse {
  success: boolean;
  places: ExtractedPlace[];
  error?: string;
}

/**
 * Sends screenshot image to /api/extract-places to run Gemini Vision analysis.
 */
export async function analyzeScreenshotPlaces(
  screenshot: UploadedScreenshot
): Promise<ExtractedPlace[]> {
  const formData = new FormData();

  if (screenshot.file) {
    formData.append("file", screenshot.file);
  } else {
    // For sample preset screenshots without a File object, fetch the sample image blob
    try {
      const resp = await fetch(screenshot.previewUrl);
      const blob = await resp.blob();
      const sampleFile = new File([blob], screenshot.name, { type: blob.type || "image/jpeg" });
      formData.append("file", sampleFile);
    } catch {
      throw new Error(`Failed to load sample image "${screenshot.name}" for analysis.`);
    }
  }

  formData.append("imageId", screenshot.id);
  formData.append("imageName", screenshot.name);

  const res = await fetch("/api/extract-places", {
    method: "POST",
    body: formData,
  });

  const data: VisionAnalysisResponse = await res.json();

  if (!res.ok || !data.success) {
    throw new Error(data.error || "Failed to extract places from screenshot");
  }

  return data.places;
}
