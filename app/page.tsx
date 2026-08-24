"use client";

import React, { useState, useMemo, useRef } from "react";
import {
  Compass,
  MapPin,
  Calendar,
  UploadCloud,
  Image as ImageIcon,
  Sparkles,
  Plus,
  Trash2,
  Check,
  ChevronRight,
  Clock,
  Info,
  X,
  Camera,
  Edit3,
  RefreshCw,
  Utensils,
  Landmark,
  Compass as ActivityIcon,
  Hotel,
  Palette,
  ShoppingBag,
} from "lucide-react";
import {
  PlaceCategory,
  ExtractedPlace,
  UploadedScreenshot,
  analyzeScreenshotPlaces,
} from "@/lib/vision";
import { buildItinerary } from "@/lib/itineraryEngine";

// Category configurations with distinct Earth Tone borders and badges
const CATEGORY_CONFIG: Record<
  PlaceCategory,
  { label: string; icon: React.ReactNode; badgeClass: string; cardBorderClass: string }
> = {
  sightseeing: {
    label: "Sightseeing",
    icon: <Landmark className="w-3.5 h-3.5 text-blue-700" />,
    badgeClass: "bg-blue-100/90 text-blue-900 border-blue-300/80 shadow-2xs",
    cardBorderClass: "border-blue-200/90 hover:border-blue-400 bg-blue-50/20 hover:shadow-sm",
  },
  food: {
    label: "Food & Dining",
    icon: <Utensils className="w-3.5 h-3.5 text-amber-700" />,
    badgeClass: "bg-amber-100/90 text-amber-900 border-amber-300/80 shadow-2xs",
    cardBorderClass: "border-amber-200/90 hover:border-amber-400 bg-amber-50/30 hover:shadow-sm",
  },
  activity: {
    label: "Activity",
    icon: <ActivityIcon className="w-3.5 h-3.5 text-emerald-700" />,
    badgeClass: "bg-emerald-100/90 text-emerald-900 border-emerald-300/80 shadow-2xs",
    cardBorderClass: "border-emerald-200/90 hover:border-emerald-400 bg-emerald-50/20 hover:shadow-sm",
  },
  stay: {
    label: "Stay",
    icon: <Hotel className="w-3.5 h-3.5 text-purple-700" />,
    badgeClass: "bg-purple-100/90 text-purple-900 border-purple-300/80 shadow-2xs",
    cardBorderClass: "border-purple-200/90 hover:border-purple-400 bg-purple-50/20 hover:shadow-sm",
  },
  culture: {
    label: "Culture & Art",
    icon: <Palette className="w-3.5 h-3.5 text-rose-700" />,
    badgeClass: "bg-rose-100/90 text-rose-900 border-rose-300/80 shadow-2xs",
    cardBorderClass: "border-rose-200/90 hover:border-rose-400 bg-rose-50/20 hover:shadow-sm",
  },
  shopping: {
    label: "Shopping",
    icon: <ShoppingBag className="w-3.5 h-3.5 text-stone-700" />,
    badgeClass: "bg-stone-200/90 text-stone-900 border-stone-300/80 shadow-2xs",
    cardBorderClass: "border-stone-300 hover:border-stone-400 bg-stone-50/40 hover:shadow-sm",
  },
};

const SAMPLE_SCREENSHOTS = [
  {
    name: "paris_reels_saved.jpg",
    previewUrl: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400&q=80",
    label: "Paris Saved Reels",
    defaultDestination: "Paris, France",
  },
  {
    name: "tokyo_spots_camera_roll.jpg",
    previewUrl: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&q=80",
    label: "Tokyo Travel Spots",
    defaultDestination: "Tokyo, Japan",
  },
];

export default function Home() {
  const [destination, setDestination] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("2026-09-15");
  const [endDate, setEndDate] = useState<string>("2026-09-18");

  const [activeWorkflow, setActiveWorkflow] = useState<"upload" | "manual">("upload");

  const [screenshots, setScreenshots] = useState<UploadedScreenshot[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [extractedPlaces, setExtractedPlaces] = useState<ExtractedPlace[]>([]);

  const [editingPlaceId, setEditingPlaceId] = useState<string | null>(null);

  const [manualTitle, setManualTitle] = useState<string>("");
  const [manualCategory, setManualCategory] = useState<PlaceCategory>("sightseeing");
  const [manualNotes, setManualNotes] = useState<string>("");
  const [manualCost, setManualCost] = useState<string>("");

  const [isItineraryGenerated, setIsItineraryGenerated] = useState<boolean>(false);
  const [activeDay, setActiveDay] = useState<number>(1);
  const [formError, setFormError] = useState<string | null>(null);

  const tripDaysCount = useMemo(() => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = end.getTime() - start.getTime();
    if (diffTime < 0) return 0;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  }, [startDate, endDate]);

  const inferDestinationFromPlaces = (places: ExtractedPlace[]): string | undefined => {
    if (!places || places.length === 0) return undefined;

    // 1. Check for explicit Paris or Tokyo keywords in extracted places text
    for (const place of places) {
      const fullText = `${place.locationHint || ""} ${place.title} ${place.notes || ""} ${place.rawDetectedText || ""}`.toLowerCase();
      if (fullText.includes("paris") || fullText.includes("eiffel") || fullText.includes("louvre") || fullText.includes("france")) {
        return "Paris, France";
      }
      if (fullText.includes("tokyo") || fullText.includes("shibuya") || fullText.includes("shinjuku") || fullText.includes("japan")) {
        return "Tokyo, Japan";
      }
    }

    // 2. Prefer explicit locationHint from Gemini
    for (const place of places) {
      if (place.locationHint && place.locationHint.trim()) {
        return place.locationHint.trim();
      }
    }

    // 3. Check notes, title, or raw text for location patterns (City, Country)
    for (const place of places) {
      const text = `${place.title} ${place.notes || ""} ${place.rawDetectedText || ""}`;
      const match = text.match(/([A-Z][a-zA-Z\s]+,\s*[A-Z][a-zA-Z\s]+)/);
      if (match && match[1]) return match[1].trim();
    }
    return undefined;
  };

  const handleFileUpload = async (files: FileList | File[]) => {
    if (isProcessing) return;

    const newFiles = Array.from(files);
    if (newFiles.length === 0) return;

    // Filter out duplicate files currently in progress or completed
    const existingNames = new Set(screenshots.map((s) => s.name));
    const uniqueFiles = newFiles.filter((f) => !existingNames.has(f.name));

    if (uniqueFiles.length === 0) {
      setFormError("The selected screenshot(s) have already been uploaded or analyzed.");
      setTimeout(() => {
        document.getElementById("identified-places-section")?.scrollIntoView({ behavior: "smooth" });
      }, 100);
      return;
    }

    setIsProcessing(true);
    setFormError(null);

    // Scroll down to vision generation section so user can watch places extract in real-time
    setTimeout(() => {
      document.getElementById("identified-places-section")?.scrollIntoView({ behavior: "smooth" });
    }, 100);

    const newScreenshots: UploadedScreenshot[] = uniqueFiles.map((file, idx) => ({
      id: `scr-${Date.now()}-${idx}`,
      file,
      previewUrl: URL.createObjectURL(file),
      name: file.name,
      size: file.size,
      uploadedAt: new Date(),
      status: "analyzing",
    }));

    setScreenshots((prev) => [...prev, ...newScreenshots]);

    let allNewExtractedPlaces: ExtractedPlace[] = [];

    for (const screenshot of newScreenshots) {
      try {
        const places = await analyzeScreenshotPlaces(screenshot);
        allNewExtractedPlaces = [...allNewExtractedPlaces, ...places];

        setScreenshots((prev) =>
          prev.map((s) =>
            s.id === screenshot.id
              ? { ...s, status: "completed", extractedCount: places.length }
              : s
          )
        );
      } catch (err: unknown) {
        const rawMsg = err instanceof Error ? err.message : "Failed to extract places from image";
        const isQuotaErr =
          rawMsg.includes("429") ||
          rawMsg.includes("RESOURCE_EXHAUSTED") ||
          rawMsg.toLowerCase().includes("quota") ||
          rawMsg.toLowerCase().includes("rate limit");

        const friendlyMsg = isQuotaErr
          ? "AI quota temporarily exceeded (Rate Limit). Please wait a few seconds before uploading again."
          : rawMsg;

        setFormError(friendlyMsg);
        setScreenshots((prev) =>
          prev.map((s) =>
            s.id === screenshot.id
              ? { ...s, status: "error", errorMessage: friendlyMsg }
              : s
          )
        );
      }
    }

    if (allNewExtractedPlaces.length > 0) {
      setExtractedPlaces((prev) => [...allNewExtractedPlaces, ...prev]);
      setDestination((currentDest) => {
        const inferred = inferDestinationFromPlaces(allNewExtractedPlaces);
        return inferred || currentDest;
      });
    }

    setIsProcessing(false);
  };

  const handleAddSampleScreenshot = async (sample: (typeof SAMPLE_SCREENSHOTS)[0]) => {
    if (isProcessing) return;

    // Check if this sample has already been uploaded/analyzed
    const isAlreadyAdded = screenshots.some((s) => s.name === sample.name);
    if (isAlreadyAdded) {
      setFormError(`"${sample.label}" has already been uploaded and analyzed.`);
      setTimeout(() => {
        document.getElementById("identified-places-section")?.scrollIntoView({ behavior: "smooth" });
      }, 100);
      return;
    }

    setIsProcessing(true);
    setFormError(null);

    // Set destination immediately based on sample chosen
    setDestination(sample.defaultDestination);

    // Scroll down to vision generation section so user sees the extracted places appearing
    setTimeout(() => {
      document.getElementById("identified-places-section")?.scrollIntoView({ behavior: "smooth" });
    }, 100);

    const mockScreenshot: UploadedScreenshot = {
      id: `sample-${Date.now()}`,
      previewUrl: sample.previewUrl,
      name: sample.name,
      size: 1024 * 450,
      uploadedAt: new Date(),
      status: "analyzing",
    };

    setScreenshots((prev) => [mockScreenshot, ...prev]);

    try {
      const places = await analyzeScreenshotPlaces(mockScreenshot);
      setExtractedPlaces((prev) => [...places, ...prev]);

      setDestination((currentDest) => {
        const inferred = inferDestinationFromPlaces(places);
        return inferred || sample.defaultDestination || currentDest;
      });

      setScreenshots((prev) =>
        prev.map((s) =>
          s.id === mockScreenshot.id
            ? { ...s, status: "completed", extractedCount: places.length }
            : s
        )
      );
    } catch (err: unknown) {
      const rawMsg = err instanceof Error ? err.message : "Failed to analyze sample image";
      const isQuotaErr =
        rawMsg.includes("429") ||
        rawMsg.includes("RESOURCE_EXHAUSTED") ||
        rawMsg.toLowerCase().includes("quota") ||
        rawMsg.toLowerCase().includes("rate limit");

      const friendlyMsg = isQuotaErr
        ? "AI quota temporarily exceeded (Rate Limit). Please wait a few seconds before uploading again."
        : rawMsg;

      setFormError(friendlyMsg);
      setScreenshots((prev) =>
        prev.map((s) =>
          s.id === mockScreenshot.id
            ? { ...s, status: "error", errorMessage: friendlyMsg }
            : s
        )
      );
    }
    setIsProcessing(false);
  };

  const handleRemoveScreenshot = (id: string) => {
    setScreenshots((prev) => prev.filter((s) => s.id !== id));
    setExtractedPlaces((prev) => prev.filter((p) => p.sourceImageId !== id));
  };

  const handleAddManualPlace = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTitle.trim()) return;

    const newPlace: ExtractedPlace = {
      id: `manual-${Date.now()}`,
      title: manualTitle.trim(),
      category: manualCategory,
      notes: manualNotes.trim() || undefined,
      estimatedCost: manualCost.trim() || undefined,
      confidence: 1.0,
      rawDetectedText: "Manually added by user",
    };

    setExtractedPlaces((prev) => [newPlace, ...prev]);
    setManualTitle("");
    setManualNotes("");
    setManualCost("");
  };

  const handleDeletePlace = (id: string) => {
    setExtractedPlaces((prev) => prev.filter((p) => p.id !== id));
  };

  const handleUpdatePlace = (id: string, updates: Partial<ExtractedPlace>) => {
    setExtractedPlaces((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );
  };

  const handleGenerateItinerary = () => {
    let activeDest = destination.trim();

    // Infer destination automatically if user didn't enter one manually
    if (!activeDest && extractedPlaces.length > 0) {
      const inferred = inferDestinationFromPlaces(extractedPlaces);
      if (inferred) {
        activeDest = inferred;
        setDestination(inferred);
      }
    }

    if (!activeDest) {
      setFormError("Please enter a destination city or country.");
      return;
    }
    if (tripDaysCount <= 0) {
      setFormError("Please select a valid start and end date.");
      return;
    }
    if (extractedPlaces.length === 0) {
      setFormError("Please upload at least one screenshot or add a place first.");
      return;
    }

    setFormError(null);
    setIsItineraryGenerated(true);
    setActiveDay(1);

    setTimeout(() => {
      document.getElementById("itinerary-output")?.scrollIntoView({ behavior: "smooth" });
    }, 150);
  };

  const dailySchedule = useMemo(() => {
    return buildItinerary(extractedPlaces, tripDaysCount);
  }, [extractedPlaces, tripDaysCount]);

  return (
    <div className="min-h-screen bg-[#fbf9f5] text-stone-800 flex flex-col font-sans selection:bg-[#c25e40]/20 selection:text-[#a84e32]">
      {/* Header with Warm Terracotta Accent */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-[#e7e0d6] px-4 sm:px-8 py-3.5 flex items-center justify-between transition-all">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[#d97354] to-[#c25e40] text-white flex items-center justify-center shadow-sm transform transition-transform hover:scale-105">
            <Compass className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-display font-extrabold text-lg tracking-tight text-stone-900 leading-none">
              TripPlanner
            </h1>
            <p className="text-[11px] text-stone-500 font-medium mt-0.5">
              Camera Roll Screenshot → Itinerary Engine
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-900 border border-emerald-300/80 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
            AI Vision Connected
          </span>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 space-y-8">
        
        {/* Rich Warm Earth Tone Hero */}
        <section className="relative overflow-hidden bg-gradient-to-r from-[#f7f2ea] via-[#f2e7d8] to-[#eaddca] rounded-3xl border border-[#dcd0bf] p-6 sm:p-8 shadow-card space-y-4 transition-all duration-300">
          <div className="flex items-start justify-between flex-wrap gap-4 relative z-10">
            <div className="space-y-2.5 max-w-xl">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-[#c25e40]/15 text-[#a84e32] border border-[#c25e40]/30 shadow-2xs">
                <Camera className="w-3.5 h-3.5 text-[#c25e40]" />
                Screenshot-First Workflow
              </div>
              <h2 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-stone-900 leading-tight">
                Turn camera roll screenshots into a day-by-day itinerary.
              </h2>
              <p className="text-sm text-stone-700 leading-relaxed font-normal">
                Upload screenshots from Instagram reels, TikToks, or saved place photos. We extract locations and organize them automatically into your daily schedule.
              </p>
            </div>
            
            {/* Quick Demo Sample Upload Chips */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-stone-700 block">Try with sample uploads:</span>
              <div className="flex flex-wrap gap-2">
                {SAMPLE_SCREENSHOTS.map((sample, idx) => {
                  const isAnalyzingThisSample = screenshots.some(
                    (s) => s.name === sample.name && s.status === "analyzing"
                  );
                  const isDoneThisSample = screenshots.some(
                    (s) => s.name === sample.name && s.status === "completed"
                  );

                  return (
                    <button
                      key={idx}
                      type="button"
                      disabled={isProcessing || isDoneThisSample}
                      onClick={() => handleAddSampleScreenshot(sample)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-2 shadow-2xs ${
                        isDoneThisSample
                          ? "bg-emerald-50 text-emerald-900 border border-emerald-300 cursor-not-allowed opacity-80"
                          : isProcessing
                          ? "bg-stone-100 text-stone-400 border border-stone-300 cursor-not-allowed opacity-50"
                          : "bg-white hover:bg-[#faf6f0] text-stone-800 border border-[#c9bdac] hover:-translate-y-0.5 active:scale-[0.98]"
                      }`}
                    >
                      {isAnalyzingThisSample ? (
                        <RefreshCw className="w-3.5 h-3.5 text-[#c25e40] animate-spin" />
                      ) : isDoneThisSample ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <ImageIcon className="w-3.5 h-3.5 text-[#c25e40]" />
                      )}
                      <span>
                        {sample.label}
                        {isDoneThisSample ? " (Added)" : isAnalyzingThisSample ? " (Analyzing...)" : ""}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Step 1: Trip Destination & Dates */}
        <section className="bg-white rounded-2xl border border-[#e5ded4] p-6 shadow-card space-y-5 transition-all hover:border-[#d6ceb8]">
          <div className="flex items-center justify-between border-b border-[#f0e9df] pb-3.5">
            <div className="flex items-center gap-2.5">
              <span className="h-7 w-7 rounded-lg bg-[#c25e40] text-white font-display font-extrabold text-xs flex items-center justify-center shadow-2xs">
                1
              </span>
              <h3 className="font-display font-bold text-lg text-stone-900">
                Trip Details
              </h3>
            </div>
            {tripDaysCount > 0 && (
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-50 text-amber-900 border border-amber-300/80 flex items-center gap-1.5 shadow-2xs">
                <Calendar className="w-3.5 h-3.5 text-amber-700" />
                {tripDaysCount} {tripDaysCount === 1 ? "Day" : "Days"} Trip
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Destination */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-600">
                Destination
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={destination}
                  onChange={(e) => {
                    setDestination(e.target.value);
                    setFormError(null);
                  }}
                  placeholder="e.g. Paris, Tokyo, Rome"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#d6ceb8] bg-[#fbf9f5] text-stone-900 text-sm placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#c25e40]/50 focus:border-[#c25e40] focus:bg-white transition-all font-medium"
                />
                <MapPin className="w-4 h-4 text-[#c25e40] absolute left-3 top-3" />
              </div>
            </div>

            {/* Start Date */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-600">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setFormError(null);
                }}
                className="w-full px-3 py-2.5 rounded-xl border border-[#d6ceb8] bg-[#fbf9f5] text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#c25e40]/50 focus:border-[#c25e40] focus:bg-white transition-all font-medium"
              />
            </div>

            {/* End Date */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-600">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setFormError(null);
                }}
                className="w-full px-3 py-2.5 rounded-xl border border-[#d6ceb8] bg-[#fbf9f5] text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#c25e40]/50 focus:border-[#c25e40] focus:bg-white transition-all font-medium"
              />
            </div>
          </div>
        </section>

        {/* Step 2: Main Workflow Selector (Upload Screenshots vs Manual) */}
        <section className="bg-white rounded-2xl border border-[#e5ded4] p-6 shadow-card space-y-6 transition-all hover:border-[#d6ceb8]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#f0e9df] pb-3.5">
            <div className="flex items-center gap-2.5">
              <span className="h-7 w-7 rounded-lg bg-[#c25e40] text-white font-display font-extrabold text-xs flex items-center justify-center shadow-2xs">
                2
              </span>
              <h3 className="font-display font-bold text-lg text-stone-900">
                Add Travel Content & Places
              </h3>
            </div>

            {/* Workflow Mode Tabs */}
            <div className="flex items-center p-1 bg-[#f4eee6] rounded-xl text-xs font-bold border border-[#e0d6c8]">
              <button
                type="button"
                onClick={() => setActiveWorkflow("upload")}
                className={`px-3.5 py-1.5 rounded-lg transition-all duration-200 flex items-center gap-1.5 ${
                  activeWorkflow === "upload"
                    ? "bg-[#c25e40] text-white shadow-xs"
                    : "text-stone-700 hover:text-stone-900"
                }`}
              >
                <UploadCloud className="w-3.5 h-3.5" />
                <span>Upload Screenshots (Main)</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveWorkflow("manual")}
                className={`px-3.5 py-1.5 rounded-lg transition-all duration-200 flex items-center gap-1.5 ${
                  activeWorkflow === "manual"
                    ? "bg-[#c25e40] text-white shadow-xs"
                    : "text-stone-700 hover:text-stone-900"
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Manual Place Entry</span>
              </button>
            </div>
          </div>

          {/* Workflow A: Upload Screenshots (Primary) */}
          {activeWorkflow === "upload" && (
            <div className="space-y-6 animate-fade-in">
              {/* Drag and Drop Zone */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (!isProcessing && e.dataTransfer.files) handleFileUpload(e.dataTransfer.files);
                }}
                onClick={() => !isProcessing && fileInputRef.current?.click()}
                className={`group border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 flex flex-col items-center justify-center gap-3 ${
                  isProcessing
                    ? "border-amber-300 bg-amber-50/50 cursor-not-allowed opacity-80"
                    : "border-[#d8ccbc] hover:border-[#c25e40] bg-[#faf6f0]/70 hover:bg-[#f7efe6] cursor-pointer transform hover:-translate-y-0.5"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  disabled={isProcessing}
                  accept="image/*"
                  onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                  className="hidden"
                />

                <div className="h-14 w-14 rounded-2xl bg-white border border-[#d6ceb8] flex items-center justify-center text-[#c25e40] shadow-xs transition-all duration-300">
                  {isProcessing ? (
                    <RefreshCw className="w-7 h-7 text-[#c25e40] animate-spin" />
                  ) : (
                    <UploadCloud className="w-7 h-7 text-[#c25e40]" />
                  )}
                </div>

                <div className="space-y-1 max-w-md">
                  <p className="font-display font-bold text-base text-stone-900">
                    {isProcessing
                      ? "Analyzing screenshot with Gemini Vision API..."
                      : "Click to select screenshots or drag and drop"}
                  </p>
                  <p className="text-xs text-stone-600 leading-relaxed font-normal">
                    {isProcessing
                      ? "Please wait while Gemini Vision extracts places, categories, and locations."
                      : "Upload camera roll screenshots, saved reels, TikToks, or place photos. Supports PNG, JPG, WEBP."}
                  </p>
                </div>

                <button
                  type="button"
                  disabled={isProcessing}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-white text-[#c25e40] border border-[#d6ceb8] shadow-xs inline-flex items-center gap-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-[#c25e40]" /> Analyzing...
                    </>
                  ) : (
                    <>
                      <Camera className="w-4 h-4" /> Choose Camera Roll Photos
                    </>
                  )}
                </button>
              </div>

              {/* Uploaded Screenshots Grid Preview */}
              {screenshots.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-stone-600">
                      Uploaded Content ({screenshots.length})
                    </h4>
                    {isProcessing && (
                      <span className="text-xs text-stone-700 font-bold flex items-center gap-1.5">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#c25e40]" />
                        Extracting places from images...
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {screenshots.map((scr) => (
                      <div
                        key={scr.id}
                        className="relative group rounded-xl border border-[#d8ccbc] bg-white overflow-hidden shadow-card hover:shadow-md transition-all duration-200 flex flex-col hover:-translate-y-0.5"
                      >
                        <div className="h-28 w-full bg-stone-100 relative overflow-hidden">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={scr.previewUrl}
                            alt={scr.name}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveScreenshot(scr.id)}
                            className="absolute top-1.5 right-1.5 p-1 rounded-lg bg-stone-900/70 hover:bg-rose-700 text-white backdrop-blur-xs transition-colors"
                            title="Remove screenshot"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="p-2.5 text-xs space-y-1">
                          <p className="font-bold text-stone-900 truncate" title={scr.name}>
                            {scr.name}
                          </p>
                          <div className="flex items-center justify-between text-[11px]">
                            {scr.status === "analyzing" ? (
                              <span className="text-amber-700 font-semibold flex items-center gap-1">
                                <RefreshCw className="w-3 h-3 animate-spin" /> Analyzing
                              </span>
                            ) : (
                              <span className="text-emerald-800 font-semibold flex items-center gap-1">
                                <Check className="w-3 h-3 text-emerald-600" /> {scr.extractedCount || 0} places
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Workflow B: Manual Entry Form (Secondary) */}
          {activeWorkflow === "manual" && (
            <form onSubmit={handleAddManualPlace} className="space-y-4 animate-fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-stone-700">
                    Place or Attraction Name <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={manualTitle}
                    onChange={(e) => setManualTitle(e.target.value)}
                    placeholder="e.g. Louvre Museum, Tsukiji Outer Market"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#d6ceb8] bg-[#fbf9f5] text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#c25e40]/50 transition"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-stone-700">
                    Category
                  </label>
                  <select
                    value={manualCategory}
                    onChange={(e) => setManualCategory(e.target.value as PlaceCategory)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#d6ceb8] bg-[#fbf9f5] text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#c25e40]/50 transition"
                  >
                    {(Object.keys(CATEGORY_CONFIG) as PlaceCategory[]).map((cat) => (
                      <option key={cat} value={cat}>
                        {CATEGORY_CONFIG[cat].label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-stone-700">
                    Estimated Cost (Optional)
                  </label>
                  <input
                    type="text"
                    value={manualCost}
                    onChange={(e) => setManualCost(e.target.value)}
                    placeholder="e.g. €25 or Free"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#d6ceb8] bg-[#fbf9f5] text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#c25e40]/50 transition"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-stone-700">
                    Notes / Tip (Optional)
                  </label>
                  <input
                    type="text"
                    value={manualNotes}
                    onChange={(e) => setManualNotes(e.target.value)}
                    placeholder="e.g. Reserve online in advance"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#d6ceb8] bg-[#fbf9f5] text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#c25e40]/50 transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="px-4 py-2.5 rounded-xl bg-[#c25e40] hover:bg-[#a84e32] text-white font-bold text-xs shadow-sm hover:shadow-md active:scale-[0.98] transition-all duration-200 inline-flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Place Manually</span>
              </button>
            </form>
          )}
        </section>

        {/* Step 3: Extracted & Identified Places Review List with Colored Earth Tone Cards */}
        <section
          id="identified-places-section"
          className="bg-white rounded-2xl border border-[#e5ded4] p-6 shadow-card space-y-5 transition-all hover:border-[#d6ceb8]"
        >
          <div className="flex items-center justify-between border-b border-[#f0e9df] pb-3.5">
            <div className="flex items-center gap-2.5">
              <span className="h-7 w-7 rounded-lg bg-[#c25e40] text-white font-display font-extrabold text-xs flex items-center justify-center shadow-2xs">
                3
              </span>
              <h3 className="font-display font-bold text-lg text-stone-900">
                Identified Places ({extractedPlaces.length})
              </h3>
            </div>
            <span className="text-xs text-stone-600 font-medium">
              Review and edit detected places before generating itinerary
            </span>
          </div>

          {formError && (
            <div className="p-3.5 rounded-xl bg-rose-50 text-rose-900 text-xs border border-rose-300 flex items-center gap-2 animate-fade-in font-semibold">
              <Info className="w-4 h-4 text-rose-700 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {extractedPlaces.length === 0 ? (
            <div className="py-10 text-center space-y-2 border border-dashed border-[#d8ccbc] rounded-2xl bg-[#faf6f0]/50">
              <MapPin className="w-6 h-6 text-[#c25e40] mx-auto animate-bounce" />
              <p className="text-xs font-bold text-stone-800">No places identified yet — upload screenshots to get started.</p>
              <p className="text-xs text-stone-500">
                Upload screenshots from your camera roll above or add places manually.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {extractedPlaces.map((place) => {
                const catInfo = CATEGORY_CONFIG[place.category];
                const isEditing = editingPlaceId === place.id;

                return (
                  <div
                    key={place.id}
                    className={`p-4 rounded-2xl border transition-all duration-200 shadow-2xs hover:shadow-sm flex items-start justify-between gap-4 ${catInfo.cardBorderClass}`}
                  >
                    <div className="space-y-1.5 flex-1 min-w-0">
                      {isEditing ? (
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={place.title}
                            onChange={(e) =>
                              handleUpdatePlace(place.id, { title: e.target.value })
                            }
                            className="w-full px-3 py-1.5 rounded-xl border border-[#d6ceb8] text-xs font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#c25e40]"
                          />
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={place.notes || ""}
                              placeholder="Notes"
                              onChange={(e) =>
                                handleUpdatePlace(place.id, { notes: e.target.value })
                              }
                              className="w-1/2 px-3 py-1.5 rounded-xl border border-[#d6ceb8] text-xs text-stone-700 focus:outline-none focus:ring-2 focus:ring-[#c25e40]"
                            />
                            <button
                              type="button"
                              onClick={() => setEditingPlaceId(null)}
                              className="px-3.5 py-1.5 rounded-xl bg-[#c25e40] text-white text-xs font-bold"
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-display font-bold text-base text-stone-900">
                              {place.title}
                            </span>
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-bold border ${catInfo.badgeClass}`}
                            >
                              {catInfo.icon}
                              <span>{catInfo.label}</span>
                            </span>
                            {place.confidence && (
                              <span className="text-[10px] font-bold text-emerald-900 bg-emerald-100/90 px-2 py-0.5 rounded-md border border-emerald-300 shadow-2xs">
                                {Math.round(place.confidence * 100)}% vision match
                              </span>
                            )}
                          </div>

                          {place.notes && (
                            <p className="text-xs text-stone-700 leading-normal font-medium">
                              📝 {place.notes}
                            </p>
                          )}

                          {place.rawDetectedText && (
                            <p className="text-[11px] text-stone-500 italic">
                              Source text: &quot;{place.rawDetectedText}&quot;
                            </p>
                          )}
                        </>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() =>
                          setEditingPlaceId(editingPlaceId === place.id ? null : place.id)
                        }
                        className="p-2 text-stone-500 hover:text-stone-900 hover:bg-stone-200/60 rounded-lg transition-colors"
                        title="Edit place details"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeletePlace(place.id)}
                        className="p-2 text-stone-500 hover:text-rose-700 hover:bg-rose-100 rounded-lg transition-colors"
                        title="Remove place"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Action Bar: Generate Itinerary Button with Warm Terracotta Palette */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleGenerateItinerary}
              className="w-full py-4 px-6 rounded-2xl bg-[#c25e40] hover:bg-[#a84e32] active:scale-[0.99] text-white font-display font-extrabold text-base shadow-earth transition-all duration-200 flex items-center justify-center gap-2.5 border border-[#a64e32]"
            >
              <Sparkles className="w-5 h-5 text-amber-200" />
              <span>Generate Day-by-Day Itinerary ({extractedPlaces.length} Places)</span>
              <ChevronRight className="w-5 h-5 text-amber-100" />
            </button>
          </div>
        </section>

        {/* Step 4: Generated Itinerary View Output with Earth Tone Day Breakdown */}
        {isItineraryGenerated && (
          <section
            id="itinerary-output"
            className="bg-white rounded-3xl border border-[#d6ceb8] p-6 sm:p-8 shadow-card space-y-6 animate-fade-in"
          >
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#f0e9df] pb-5">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                  <Check className="w-3.5 h-3.5 text-emerald-700" /> Itinerary Ready
                </div>
                <h3 className="font-display text-2xl sm:text-3xl font-extrabold text-stone-900">
                  {destination} Daily Schedule
                </h3>
                <p className="text-xs text-stone-600 font-medium">
                  {startDate} to {endDate} &bull; {tripDaysCount} Days &bull; {extractedPlaces.length} Places scheduled
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsItineraryGenerated(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold border border-[#d6ceb8] hover:bg-stone-100 text-stone-700 transition-colors"
              >
                Close View
              </button>
            </div>

            {/* Day Tabs with Warm Earth Accent */}
            <div className="flex items-center gap-2 border-b border-[#f0e9df] pb-2 overflow-x-auto">
              {Array.from({ length: Math.max(1, tripDaysCount) }, (_, i) => i + 1).map((dayNum) => (
                <button
                  key={dayNum}
                  type="button"
                  onClick={() => setActiveDay(dayNum)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 border ${
                    activeDay === dayNum
                      ? "bg-[#c25e40] text-white border-[#a84e32] shadow-xs"
                      : "bg-[#f4eee6] text-stone-700 border-[#e2d8ca] hover:bg-[#ebdcc9]"
                  }`}
                >
                  Day {dayNum}
                </button>
              ))}
            </div>

            {/* Daily Schedule Slots in Earth Tone Cards */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-display font-bold text-base text-stone-900">
                  Day {activeDay} Breakdown
                </h4>
              </div>

              {/* Accommodations Reference Banner */}
              {dailySchedule[activeDay]?.accommodations && dailySchedule[activeDay].accommodations.length > 0 && (
                <div className="p-3.5 rounded-xl bg-purple-50/90 border border-purple-200 flex items-center justify-between gap-3 text-xs font-semibold text-purple-950 shadow-2xs">
                  <div className="flex items-center gap-2">
                    <Hotel className="w-4 h-4 text-purple-700 shrink-0" />
                    <span>
                      Hotel / Stay:{" "}
                      <strong>
                        {dailySchedule[activeDay].accommodations.map((acc) => acc.title).join(", ")}
                      </strong>
                    </span>
                  </div>
                  <span className="text-[10px] bg-purple-200 text-purple-900 px-2 py-0.5 rounded-md font-bold shrink-0">
                    Stay Reserved
                  </span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Morning Slot - Warm Sand */}
                <div className="p-4.5 rounded-2xl bg-[#faf5ec] border border-[#e8ddcc] space-y-3 shadow-2xs">
                  <div className="flex items-center gap-2 font-display font-bold text-xs text-amber-900 border-b border-[#e2d5c3] pb-2">
                    <Clock className="w-3.5 h-3.5 text-amber-700" />
                    <span>Morning (9:00 AM - 12:00 PM)</span>
                  </div>
                  {dailySchedule[activeDay]?.morning.length === 0 ? (
                    <div className="py-6 px-3 text-center border border-dashed border-[#e2d5c3] rounded-xl bg-white/40 space-y-1">
                      <Clock className="w-4 h-4 text-amber-700/40 mx-auto" />
                      <p className="text-xs font-bold text-stone-600">No saved places for this slot</p>
                      <p className="text-[11px] text-stone-500">Upload screenshot or add place manually</p>
                    </div>
                  ) : (
                    dailySchedule[activeDay].morning.map((place) => {
                      const catInfo = CATEGORY_CONFIG[place.category];
                      return (
                        <div
                          key={place.id}
                          className="p-3.5 rounded-xl bg-white border border-[#e2d5c3] shadow-card space-y-1.5 hover:border-[#c25e40]/50 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-2 text-xs font-bold text-stone-900">
                            <span className="leading-snug">{place.title}</span>
                            <span className="shrink-0">{catInfo?.icon}</span>
                          </div>
                          {place.locationHint && (
                            <p className="text-[11px] text-[#c25e40] font-semibold flex items-center gap-1">
                              <MapPin className="w-3 h-3 shrink-0" /> {place.locationHint}
                            </p>
                          )}
                          {place.notes && (
                            <p className="text-[11px] text-stone-600 font-medium">📝 {place.notes}</p>
                          )}
                          {place.estimatedCost && (
                            <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100/80 text-amber-900 border border-amber-300/60">
                              Cost: {place.estimatedCost}
                            </span>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Afternoon Slot - Soft Sage */}
                <div className="p-4.5 rounded-2xl bg-[#f2f6f3] border border-[#d2e0d8] space-y-3 shadow-2xs">
                  <div className="flex items-center gap-2 font-display font-bold text-xs text-emerald-900 border-b border-[#c2d4cb] pb-2">
                    <Clock className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Afternoon (1:00 PM - 5:00 PM)</span>
                  </div>
                  {dailySchedule[activeDay]?.afternoon.length === 0 ? (
                    <div className="py-6 px-3 text-center border border-dashed border-[#c2d4cb] rounded-xl bg-white/40 space-y-1">
                      <Clock className="w-4 h-4 text-emerald-700/40 mx-auto" />
                      <p className="text-xs font-bold text-stone-600">No saved places for this slot</p>
                      <p className="text-[11px] text-stone-500">Upload screenshot or add place manually</p>
                    </div>
                  ) : (
                    dailySchedule[activeDay].afternoon.map((place) => {
                      const catInfo = CATEGORY_CONFIG[place.category];
                      return (
                        <div
                          key={place.id}
                          className="p-3.5 rounded-xl bg-white border border-[#c2d4cb] shadow-card space-y-1.5 hover:border-emerald-400 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-2 text-xs font-bold text-stone-900">
                            <span className="leading-snug">{place.title}</span>
                            <span className="shrink-0">{catInfo?.icon}</span>
                          </div>
                          {place.locationHint && (
                            <p className="text-[11px] text-emerald-800 font-semibold flex items-center gap-1">
                              <MapPin className="w-3 h-3 shrink-0" /> {place.locationHint}
                            </p>
                          )}
                          {place.notes && (
                            <p className="text-[11px] text-stone-600 font-medium">📝 {place.notes}</p>
                          )}
                          {place.estimatedCost && (
                            <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100/80 text-emerald-900 border border-emerald-300/60">
                              Cost: {place.estimatedCost}
                            </span>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Evening Slot - Warm Terracotta/Clay Tint */}
                <div className="p-4.5 rounded-2xl bg-[#fbf4f2] border border-[#ead8d3] space-y-3 shadow-2xs">
                  <div className="flex items-center gap-2 font-display font-bold text-xs text-[#a84e32] border-b border-[#dfccc7] pb-2">
                    <Clock className="w-3.5 h-3.5 text-[#c25e40]" />
                    <span>Evening (6:00 PM - 10:00 PM)</span>
                  </div>
                  {dailySchedule[activeDay]?.evening.length === 0 ? (
                    <div className="py-6 px-3 text-center border border-dashed border-[#dfccc7] rounded-xl bg-white/40 space-y-1">
                      <Clock className="w-4 h-4 text-[#c25e40]/40 mx-auto" />
                      <p className="text-xs font-bold text-stone-600">No saved places for this slot</p>
                      <p className="text-[11px] text-stone-500">Upload screenshot or add place manually</p>
                    </div>
                  ) : (
                    dailySchedule[activeDay].evening.map((place) => {
                      const catInfo = CATEGORY_CONFIG[place.category];
                      return (
                        <div
                          key={place.id}
                          className="p-3.5 rounded-xl bg-white border border-[#dfccc7] shadow-card space-y-1.5 hover:border-[#c25e40]/50 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-2 text-xs font-bold text-stone-900">
                            <span className="leading-snug">{place.title}</span>
                            <span className="shrink-0">{catInfo?.icon}</span>
                          </div>
                          {place.locationHint && (
                            <p className="text-[11px] text-[#c25e40] font-semibold flex items-center gap-1">
                              <MapPin className="w-3 h-3 shrink-0" /> {place.locationHint}
                            </p>
                          )}
                          {place.notes && (
                            <p className="text-[11px] text-stone-600 font-medium">📝 {place.notes}</p>
                          )}
                          {place.estimatedCost && (
                            <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded bg-[#c25e40]/15 text-[#a84e32] border border-[#c25e40]/30">
                              Cost: {place.estimatedCost}
                            </span>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      <footer className="mt-12 border-t border-[#e7e0d6] py-6 text-center text-xs text-stone-600 font-medium">
        <p>TripPlanner &bull; Premium Outfit & Plus Jakarta Typography &bull; Screenshot to Itinerary Engine</p>
      </footer>
    </div>
  );
}
