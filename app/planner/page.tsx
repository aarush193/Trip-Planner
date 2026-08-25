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
  Search,
  ChevronDown,
  Palmtree,
} from "lucide-react";
import {
  PlaceCategory,
  ExtractedPlace,
  UploadedScreenshot,
  analyzeScreenshotPlaces,
} from "@/lib/vision";
import { buildItinerary } from "@/lib/itineraryEngine";
import { enrichPlace } from "@/lib/enrichment";
import { useTripContext } from "@/context/TripContext";

const CATEGORY_CONFIG: Record<
  PlaceCategory,
  { label: string; icon: React.ReactNode; badgeClass: string; cardBorderClass: string }
> = {
  sightseeing: {
    label: "Sightseeing",
    icon: <Landmark className="w-3.5 h-3.5 text-teal-700" />,
    badgeClass: "bg-teal-100/90 text-teal-900 border-teal-300/80 shadow-2xs",
    cardBorderClass: "border-teal-200/90 hover:border-teal-400 bg-teal-50/20 card-hover",
  },
  food: {
    label: "Food & Dining",
    icon: <Utensils className="w-3.5 h-3.5 text-amber-700" />,
    badgeClass: "bg-amber-100/90 text-amber-900 border-amber-300/80 shadow-2xs",
    cardBorderClass: "border-amber-200/90 hover:border-amber-400 bg-amber-50/30 card-hover",
  },
  activity: {
    label: "Activity",
    icon: <ActivityIcon className="w-3.5 h-3.5 text-emerald-700" />,
    badgeClass: "bg-emerald-100/90 text-emerald-900 border-emerald-300/80 shadow-2xs",
    cardBorderClass: "border-emerald-200/90 hover:border-emerald-400 bg-emerald-50/20 card-hover",
  },
  stay: {
    label: "Stay",
    icon: <Hotel className="w-3.5 h-3.5 text-purple-700" />,
    badgeClass: "bg-purple-100/90 text-purple-900 border-purple-300/80 shadow-2xs",
    cardBorderClass: "border-purple-200/90 hover:border-purple-400 bg-purple-50/20 card-hover",
  },
  culture: {
    label: "Culture & Art",
    icon: <Palette className="w-3.5 h-3.5 text-rose-700" />,
    badgeClass: "bg-rose-100/90 text-rose-900 border-rose-300/80 shadow-2xs",
    cardBorderClass: "border-rose-200/90 hover:border-rose-400 bg-rose-50/20 card-hover",
  },
  shopping: {
    label: "Shopping",
    icon: <ShoppingBag className="w-3.5 h-3.5 text-stone-700" />,
    badgeClass: "bg-stone-200/90 text-stone-900 border-stone-300/80 shadow-2xs",
    cardBorderClass: "border-stone-300 hover:border-stone-400 bg-stone-50/40 card-hover",
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
    name: "taj_mahal_agra_photo.jpg",
    previewUrl: "https://images.unsplash.com/photo-1564507592333-c60657eea523?w=400&q=80",
    label: "Taj Mahal & Agra",
    defaultDestination: "Agra, India",
  },
  {
    name: "tokyo_spots_camera_roll.jpg",
    previewUrl: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&q=80",
    label: "Tokyo Travel Spots",
    defaultDestination: "Tokyo, Japan",
  },
];

const DESTINATION_CARDS = [
  {
    name: "Paris",
    country: "France",
    label: "Paris, France",
    imageUrl: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600&q=80",
    tagline: "Eiffel Tower, Louvre & Cozy Cafés",
  },
  {
    name: "Agra",
    country: "India",
    label: "Agra, India",
    imageUrl: "https://images.unsplash.com/photo-1564507592333-c60657eea523?w=600&q=80",
    tagline: "Taj Mahal, Agra Fort & Heritage",
  },
  {
    name: "Tokyo",
    country: "Japan",
    label: "Tokyo, Japan",
    imageUrl: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=600&q=80",
    tagline: "Shibuya Crossing, Temples & Ramen",
  },
  {
    name: "Rome",
    country: "Italy",
    label: "Rome, Italy",
    imageUrl: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=600&q=80",
    tagline: "Colosseum, Vatican & Gelato",
  },
  {
    name: "Bali",
    country: "Indonesia",
    label: "Bali, Indonesia",
    imageUrl: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=600&q=80",
    tagline: "Tropical Beaches & Rice Terraces",
  },
];

export default function PlannerPage() {
  const {
    trips,
    activeTripId,
    activeTrip,
    setActiveTripId,
    setTrips,
    updateActiveTrip,
    handleCreateNewTrip,
    handleSelectDestination,
    commitAnalysisResults,
    inferDestinationFromPlaces,
  } = useTripContext();

  const [destSearchQuery, setDestSearchQuery] = useState<string>("");
  const [isDestDropdownOpen, setIsDestDropdownOpen] = useState<boolean>(false);

  const [activeWorkflow, setActiveWorkflow] = useState<"upload" | "manual">("upload");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [editingPlaceId, setEditingPlaceId] = useState<string | null>(null);

  const [manualTitle, setManualTitle] = useState<string>("");
  const [manualCategory, setManualCategory] = useState<PlaceCategory>("sightseeing");
  const [manualNotes, setManualNotes] = useState<string>("");
  const [manualCost, setManualCost] = useState<string>("");

  const [activeDay, setActiveDay] = useState<number>(1);
  const [formError, setFormError] = useState<string | null>(null);

  const destination = activeTrip.destination;
  const startDate = activeTrip.startDate;
  const endDate = activeTrip.endDate;
  const screenshots = activeTrip.screenshots;
  const extractedPlaces = activeTrip.extractedPlaces;
  const isItineraryGenerated = activeTrip.isItineraryGenerated;

  const tripDaysCount = useMemo(() => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = end.getTime() - start.getTime();
    if (diffTime < 0) return 0;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  }, [startDate, endDate]);

  const filteredDestinationCards = useMemo(() => {
    if (!destSearchQuery.trim()) return DESTINATION_CARDS;
    const q = destSearchQuery.toLowerCase();
    return DESTINATION_CARDS.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        d.country.toLowerCase().includes(q) ||
        d.label.toLowerCase().includes(q)
    );
  }, [destSearchQuery]);

  const handleFileUpload = async (files: FileList | File[]) => {
    if (isProcessing) return;

    const newFiles = Array.from(files);
    if (newFiles.length === 0) return;

    const existingNames = new Set(screenshots.map((s) => s.name));
    const uniqueFiles = newFiles.filter((f) => !existingNames.has(f.name));

    if (uniqueFiles.length === 0) {
      setFormError("The selected screenshot(s) have already been uploaded or analyzed.");
      return;
    }

    const sourceTripId = activeTripId;
    setIsProcessing(true);
    setFormError(null);

    const newScreenshots: UploadedScreenshot[] = uniqueFiles.map((file, idx) => ({
      id: `scr-${Date.now()}-${idx}`,
      file,
      previewUrl: URL.createObjectURL(file),
      name: file.name,
      size: file.size,
      uploadedAt: new Date(),
      status: "analyzing",
    }));

    updateActiveTrip((prev) => ({
      screenshots: [...prev.screenshots, ...newScreenshots],
    }));

    let allNewExtractedPlaces: ExtractedPlace[] = [];

    for (const screenshot of newScreenshots) {
      try {
        const places = await analyzeScreenshotPlaces(screenshot);
        allNewExtractedPlaces = [...allNewExtractedPlaces, ...places];
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
        updateActiveTrip((prev) => ({
          screenshots: prev.screenshots.map((s) =>
            s.id === screenshot.id
              ? { ...s, status: "error", errorMessage: friendlyMsg }
              : s
          ),
        }));
      }
    }

    commitAnalysisResults(sourceTripId, newScreenshots, allNewExtractedPlaces);
    setIsProcessing(false);
  };

  const handleAddSampleScreenshot = async (sample: (typeof SAMPLE_SCREENSHOTS)[0]) => {
    if (isProcessing) return;

    const existingTripWithSample = trips.find((t) =>
      t.screenshots.some((s) => s.name === sample.name)
    );

    if (existingTripWithSample) {
      setActiveTripId(existingTripWithSample.id);
      setFormError(`Switched to your existing ${existingTripWithSample.destination || "trip"}.`);
      setTimeout(() => setFormError(null), 3500);
      return;
    }

    const sourceTripId = activeTripId;
    setIsProcessing(true);
    setFormError(null);

    const mockScreenshot: UploadedScreenshot = {
      id: `sample-${Date.now()}`,
      previewUrl: sample.previewUrl,
      name: sample.name,
      size: 1024 * 450,
      uploadedAt: new Date(),
      status: "analyzing",
    };

    updateActiveTrip((prev) => ({
      screenshots: [mockScreenshot, ...prev.screenshots],
    }));

    try {
      const places = await analyzeScreenshotPlaces(mockScreenshot);
      commitAnalysisResults(sourceTripId, [mockScreenshot], places, sample.defaultDestination);
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
      updateActiveTrip((prev) => ({
        screenshots: prev.screenshots.map((s) =>
          s.id === mockScreenshot.id
            ? { ...s, status: "error", errorMessage: friendlyMsg }
            : s
        ),
      }));
    }

    setIsProcessing(false);
  };

  const handleRemoveScreenshot = (id: string) => {
    updateActiveTrip((prev) => ({
      screenshots: prev.screenshots.filter((s) => s.id !== id),
      extractedPlaces: prev.extractedPlaces.filter((p) => p.sourceImageId !== id),
    }));
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

    updateActiveTrip((prev) => ({
      extractedPlaces: [newPlace, ...prev.extractedPlaces],
    }));

    enrichPlace(newPlace).then((enriched) => {
      setTrips((prevTrips) =>
        prevTrips.map((t) => ({
          ...t,
          extractedPlaces: t.extractedPlaces.map((p) =>
            p.id === enriched.id ? enriched : p
          ),
        }))
      );
    });

    setManualTitle("");
    setManualNotes("");
    setManualCost("");
  };

  const handleDeletePlace = (id: string) => {
    updateActiveTrip((prev) => ({
      extractedPlaces: prev.extractedPlaces.filter((p) => p.id !== id),
    }));
  };

  const handleUpdatePlace = (id: string, updates: Partial<ExtractedPlace>) => {
    updateActiveTrip((prev) => ({
      extractedPlaces: prev.extractedPlaces.map((p) =>
        p.id === id ? { ...p, ...updates } : p
      ),
    }));
  };

  const handleGenerateItinerary = () => {
    if (isProcessing) return;

    let activeDest = destination.trim();

    if (!activeDest && extractedPlaces.length > 0) {
      const inferred = inferDestinationFromPlaces(extractedPlaces);
      if (inferred) {
        activeDest = inferred;
        updateActiveTrip({ destination: inferred });
      }
    }

    if (!activeDest) {
      setFormError("Please select or enter a trip destination first.");
      return;
    }
    if (tripDaysCount <= 0) {
      setFormError("Please select a valid start and end date.");
      return;
    }
    if (extractedPlaces.length === 0) {
      setFormError("Please upload screenshots or add places for this destination first.");
      return;
    }

    setFormError(null);
    updateActiveTrip({ isItineraryGenerated: true });
    setActiveDay(1);

    setTimeout(() => {
      document.getElementById("itinerary-output")?.scrollIntoView({ behavior: "smooth" });
    }, 150);
  };

  const dailySchedule = useMemo(() => {
    if (isProcessing || !isItineraryGenerated) return {};
    return buildItinerary(extractedPlaces, tripDaysCount);
  }, [extractedPlaces, tripDaysCount, isProcessing, isItineraryGenerated]);

  return (
    <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* STEP 1: DESTINATIONS & TRIPS SELECTION */}
      <section
        id="destination-selector-section"
        className="bg-white rounded-3xl border border-[#e6dfd5] p-6 sm:p-8 shadow-travel space-y-6 transition-all hover:border-teal-300/80"
      >
        <div className="flex items-center justify-between border-b border-[#f4eee6] pb-4">
          <div className="flex items-center gap-3">
            <span className="h-8 w-8 rounded-xl bg-[#0d9488] text-white font-display font-extrabold text-xs flex items-center justify-center shadow-2xs">
              1
            </span>
            <div>
              <h3 className="font-display font-bold text-xl text-stone-900 leading-none">
                Select Vacation Destination
              </h3>
              <p className="text-xs text-stone-500 font-medium mt-1">
                Choose a featured destination or search for your planned trip city
              </p>
            </div>
          </div>

          {tripDaysCount > 0 && (
            <span className="text-xs font-bold px-3.5 py-1.5 rounded-full bg-teal-50 text-teal-900 border border-teal-200 flex items-center gap-1.5 shadow-2xs">
              <Calendar className="w-3.5 h-3.5 text-teal-700" />
              {tripDaysCount} {tripDaysCount === 1 ? "Day" : "Days"} Vacation
            </span>
          )}
        </div>

        {/* Active Trip Status Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-[#f7f2ea] border border-[#e6dfd5] rounded-2xl">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="text-xs font-bold text-stone-600 uppercase tracking-wider shrink-0">
              Active Destination:
            </span>
            <span className="font-display font-extrabold text-sm text-stone-900 bg-white px-3.5 py-1.5 rounded-xl border border-[#e0d6c8] flex items-center gap-2 shadow-2xs truncate">
              <MapPin className="w-4 h-4 text-[#ff6b5b] shrink-0" />
              <span className="truncate">{destination || "Unspecified Destination"}</span>
              {extractedPlaces.length > 0 && (
                <span className="text-[10px] font-extrabold bg-[#0d9488] text-white px-2 py-0.5 rounded-md">
                  {extractedPlaces.length} places
                </span>
              )}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {trips.length > 1 && (
              <div className="relative">
                <select
                  value={activeTripId}
                  onChange={(e) => {
                    if (e.target.value === "__NEW__") {
                      handleCreateNewTrip();
                    } else {
                      setActiveTripId(e.target.value);
                      setFormError(null);
                    }
                  }}
                  className="pl-3 pr-8 py-1.5 rounded-xl text-xs font-bold bg-white text-stone-800 border border-[#e0d6c8] focus:outline-none focus:ring-2 focus:ring-[#0d9488] shadow-2xs appearance-none cursor-pointer"
                >
                  {trips.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.destination.trim() || `Trip #${t.id.slice(-4)}`} ({t.extractedPlaces.length} places)
                    </option>
                  ))}
                  <option value="__NEW__">+ Plan Another Trip</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-stone-500 absolute right-2.5 top-2.5 pointer-events-none" />
              </div>
            )}

            <button
              type="button"
              onClick={handleCreateNewTrip}
              className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-teal-50 text-stone-800 text-xs font-bold border border-[#e0d6c8] shadow-2xs transition-all flex items-center gap-1 shrink-0 active:scale-[0.98]"
            >
              <Plus className="w-3.5 h-3.5 text-[#0d9488]" />
              <span>+ Plan Another Trip</span>
            </button>
          </div>
        </div>

        {/* Search Input field */}
        <div className="space-y-3">
          <label className="block text-xs font-bold uppercase tracking-wider text-stone-700">
            Where are you traveling to?
          </label>

          <div className="relative max-w-2xl">
            <input
              type="text"
              value={destSearchQuery || destination}
              onFocus={() => setIsDestDropdownOpen(true)}
              onChange={(e) => {
                setDestSearchQuery(e.target.value);
                updateActiveTrip({ destination: e.target.value });
                setIsDestDropdownOpen(true);
                setFormError(null);
              }}
              placeholder="Search city or country (e.g. Paris, Tokyo, Agra, Rome, Bali)"
              className="w-full pl-10 pr-4 py-3 rounded-2xl border border-[#e6dfd5] bg-[#fbf9f5] text-stone-900 text-sm font-bold placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#0d9488]/50 focus:border-[#0d9488] focus:bg-white transition-all shadow-2xs"
            />
            <Search className="w-4 h-4 text-[#0d9488] absolute left-3.5 top-3.5" />

            {isDestDropdownOpen && filteredDestinationCards.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#e6dfd5] rounded-2xl shadow-lg z-20 overflow-hidden animate-fade-in">
                <div className="p-2 space-y-1">
                  {filteredDestinationCards.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        handleSelectDestination(item.label);
                        setIsDestDropdownOpen(false);
                      }}
                      className="w-full px-3.5 py-2 rounded-xl text-left text-xs font-bold text-stone-800 hover:bg-teal-50 hover:text-[#0d9488] flex items-center justify-between transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-[#ff6b5b]" />
                        {item.label}
                      </span>
                      <span className="text-[10px] text-stone-600 uppercase font-semibold">
                        {item.country}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Featured Travel Destination Cards */}
        <div className="space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-stone-700 block">
            Featured Vacation Destinations:
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {DESTINATION_CARDS.map((card, idx) => {
              const isSelected =
                destination.toLowerCase().trim() === card.label.toLowerCase().trim();

              return (
                <div
                  key={idx}
                  onClick={() => handleSelectDestination(card.label)}
                  className={`relative rounded-2xl overflow-hidden border cursor-pointer transition-all duration-300 card-hover shadow-card group ${
                    isSelected
                      ? "border-[#0d9488] ring-2 ring-[#0d9488]/40 shadow-travel"
                      : "border-[#e6dfd5] hover:border-teal-300"
                  }`}
                >
                  <div className="h-32 w-full relative overflow-hidden bg-stone-900">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={card.imageUrl}
                      alt={card.label}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 opacity-90"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-stone-950/20 to-transparent" />

                    {isSelected && (
                      <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-[#0d9488] text-white shadow-2xs">
                        Active
                      </span>
                    )}

                    <div className="absolute bottom-2 left-2.5 right-2.5 text-white space-y-0.5">
                      <p className="font-display font-extrabold text-sm leading-tight flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-[#ff6b5b]" /> {card.name}
                      </p>
                      <p className="text-[10px] text-stone-200 line-clamp-1">{card.tagline}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Dates Selection */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#f7f2ea] p-4 rounded-2xl border border-[#e6dfd5]">
          <div className="space-y-1">
            <span className="text-xs font-bold text-stone-700 block">Start Date</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                updateActiveTrip({ startDate: e.target.value });
                setFormError(null);
              }}
              className="w-full px-3 py-2 rounded-xl border border-[#e6dfd5] bg-white text-stone-900 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#0d9488]"
            />
          </div>

          <div className="space-y-1">
            <span className="text-xs font-bold text-stone-700 block">End Date</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                updateActiveTrip({ endDate: e.target.value });
                setFormError(null);
              }}
              className="w-full px-3 py-2 rounded-xl border border-[#e6dfd5] bg-white text-stone-900 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#0d9488]"
            />
          </div>
        </div>
      </section>

      {/* STEP 2: Add Travel Content */}
      <section className="bg-white rounded-3xl border border-[#e6dfd5] p-6 sm:p-8 shadow-travel space-y-6 transition-all hover:border-teal-300/80">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#f4eee6] pb-3.5">
          <div className="flex items-center gap-3">
            <span className="h-8 w-8 rounded-xl bg-[#0d9488] text-white font-display font-extrabold text-xs flex items-center justify-center shadow-2xs">
              2
            </span>
            <div>
              <h3 className="font-display font-bold text-lg text-stone-900 leading-none">
                Add Content for {destination || "Selected Destination"}
              </h3>
              <p className="text-xs text-stone-500 font-medium mt-1">
                Upload screenshots, reels, or photos to extract places for this trip
              </p>
            </div>
          </div>

          <div className="flex items-center p-1 bg-[#f4eee6] rounded-xl text-xs font-bold border border-[#e0d6c8]">
            <button
              type="button"
              onClick={() => setActiveWorkflow("upload")}
              className={`px-3.5 py-1.5 rounded-lg transition-all duration-200 flex items-center gap-1.5 ${
                activeWorkflow === "upload"
                  ? "bg-[#0d9488] text-white shadow-xs"
                  : "text-stone-700 hover:text-stone-900"
              }`}
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Upload Screenshots</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveWorkflow("manual")}
              className={`px-3.5 py-1.5 rounded-lg transition-all duration-200 flex items-center gap-1.5 ${
                activeWorkflow === "manual"
                  ? "bg-[#0d9488] text-white shadow-xs"
                  : "text-stone-700 hover:text-stone-900"
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Manual Place Entry</span>
            </button>
          </div>
        </div>

        {/* Quick Demo Sample Upload Chips */}
        <div className="space-y-2 bg-[#f7f2ea] p-4 rounded-2xl border border-[#e6dfd5]">
          <span className="text-xs font-bold text-stone-700 block">Try with sample travel screenshots:</span>
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
                  disabled={isProcessing}
                  onClick={() => handleAddSampleScreenshot(sample)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-2 shadow-2xs card-hover ${
                    isDoneThisSample
                      ? "bg-teal-50 text-teal-900 border border-teal-300"
                      : isProcessing
                      ? "bg-stone-100 text-stone-400 border border-stone-300 cursor-not-allowed opacity-50"
                      : "bg-white hover:bg-teal-50 text-stone-800 border border-[#e0d6c8] active:scale-[0.98]"
                  }`}
                >
                  {isAnalyzingThisSample ? (
                    <RefreshCw className="w-3.5 h-3.5 text-[#0d9488] animate-spin" />
                  ) : isDoneThisSample ? (
                    <Check className="w-3.5 h-3.5 text-teal-600" />
                  ) : (
                    <ImageIcon className="w-3.5 h-3.5 text-[#ff6b5b]" />
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

        {/* Workflow A: Upload Screenshots */}
        {activeWorkflow === "upload" && (
          <div className="space-y-6 animate-fade-in">
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (!isProcessing && e.dataTransfer.files) handleFileUpload(e.dataTransfer.files);
              }}
              onClick={() => !isProcessing && fileInputRef.current?.click()}
              className={`group border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 flex flex-col items-center justify-center gap-3 ${
                isProcessing
                  ? "border-teal-300 bg-teal-50/40 cursor-not-allowed opacity-80"
                  : "border-[#e0d6c8] hover:border-[#0d9488] bg-[#fdfaf5] hover:bg-[#f0fdfa]/60 cursor-pointer card-hover"
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

              <div className="h-14 w-14 rounded-2xl bg-white border border-[#e0d6c8] flex items-center justify-center text-[#0d9488] shadow-2xs transition-all duration-300 group-hover:scale-105">
                {isProcessing ? (
                  <RefreshCw className="w-7 h-7 text-[#0d9488] animate-spin" />
                ) : (
                  <UploadCloud className="w-7 h-7 text-[#0d9488]" />
                )}
              </div>

              <div className="space-y-1 max-w-md">
                <p className="font-display font-bold text-base text-stone-900">
                  {isProcessing
                    ? "Analyzing screenshot with Gemini Vision API..."
                    : `Upload screenshots for ${destination || "your trip"}`}
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
                className="px-4.5 py-2 rounded-xl text-xs font-bold bg-white text-[#0d9488] border border-[#e0d6c8] shadow-2xs inline-flex items-center gap-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-[#0d9488]" /> Analyzing...
                  </>
                ) : (
                  <>
                    <Camera className="w-4 h-4" /> Choose Camera Roll Photos
                  </>
                )}
              </button>
            </div>

            {/* Uploaded Screenshots Grid Preview */}
            {screenshots.length > 0 && (() => {
              const normalScreenshots = screenshots.filter(
                (s) => s.status !== "completed" || (s.extractedCount || 0) > 0
              );
              const zeroResultScreenshots = screenshots.filter(
                (s) => s.status === "completed" && (s.extractedCount || 0) === 0
              );

              return (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-stone-600">
                      Uploaded Content for {destination || "Trip"} ({screenshots.length})
                    </h4>
                    {isProcessing && (
                      <span className="text-xs text-teal-800 font-bold flex items-center gap-1.5">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#0d9488]" />
                        Extracting places from images...
                      </span>
                    )}
                  </div>

                  {zeroResultScreenshots.length > 0 && (
                    <div className="space-y-2">
                      {zeroResultScreenshots.map((scr) => (
                        <div
                          key={scr.id}
                          className="flex items-center justify-between p-2.5 px-3.5 rounded-xl bg-amber-50/80 border border-amber-200 text-xs text-stone-700 shadow-2xs"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="h-6 w-6 rounded-md bg-amber-100 border border-amber-200 overflow-hidden shrink-0">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={scr.previewUrl}
                                alt={scr.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="truncate min-w-0">
                              <span className="font-semibold text-stone-900 truncate block">
                                {scr.name}
                              </span>
                              <span className="text-[11px] text-amber-900 font-medium block">
                                1 image had no travel places detected.
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveScreenshot(scr.id)}
                            className="px-2.5 py-1 rounded-lg bg-amber-200/70 hover:bg-amber-200 text-amber-950 font-bold text-[11px] transition-colors ml-3 shrink-0"
                          >
                            Clear
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {normalScreenshots.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                      {normalScreenshots.map((scr) => (
                        <div
                          key={scr.id}
                          className="relative group rounded-2xl border border-[#e6dfd5] bg-white overflow-hidden shadow-card card-hover flex flex-col"
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
                                <span className="text-teal-800 font-semibold flex items-center gap-1">
                                  <Check className="w-3 h-3 text-teal-600" /> {scr.extractedCount || 0} places
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}

        {/* Workflow B: Manual Entry Form */}
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
                  placeholder="e.g. Louvre Museum, Eiffel Tower, Taj Mahal"
                  className="w-full px-3 py-2 rounded-xl border border-[#e6dfd5] text-xs font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#0d9488]"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-stone-700">Category</label>
                <select
                  value={manualCategory}
                  onChange={(e) => setManualCategory(e.target.value as PlaceCategory)}
                  className="w-full px-3 py-2 rounded-xl border border-[#e6dfd5] text-xs font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#0d9488]"
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
                <label className="block text-xs font-bold text-stone-700">Notes / Details</label>
                <input
                  type="text"
                  value={manualNotes}
                  onChange={(e) => setManualNotes(e.target.value)}
                  placeholder="e.g. Open 9am-6pm, buy tickets in advance"
                  className="w-full px-3 py-2 rounded-xl border border-[#e6dfd5] text-xs text-stone-700 focus:outline-none focus:ring-2 focus:ring-[#0d9488]"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-stone-700">Estimated Cost</label>
                <input
                  type="text"
                  value={manualCost}
                  onChange={(e) => setManualCost(e.target.value)}
                  placeholder="e.g. $20 / €17"
                  className="w-full px-3 py-2 rounded-xl border border-[#e6dfd5] text-xs text-stone-700 focus:outline-none focus:ring-2 focus:ring-[#0d9488]"
                />
              </div>
            </div>

            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-[#0d9488] hover:bg-[#0f766e] text-white text-xs font-bold shadow-travel transition-all flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Add Place to {destination || "Trip"}
            </button>
          </form>
        )}
      </section>

      {/* STEP 3: Identified Places Review List */}
      <section
        id="identified-places-section"
        className="bg-white rounded-3xl border border-[#e6dfd5] p-6 sm:p-8 shadow-travel space-y-5 transition-all hover:border-teal-300/80"
      >
        <div className="flex items-center justify-between border-b border-[#f4eee6] pb-3.5">
          <div className="flex items-center gap-3">
            <span className="h-8 w-8 rounded-xl bg-[#0d9488] text-white font-display font-extrabold text-xs flex items-center justify-center shadow-2xs">
              3
            </span>
            <div>
              <h3 className="font-display font-bold text-lg text-stone-900 leading-none">
                Identified Places ({extractedPlaces.length})
              </h3>
              <p className="text-xs text-stone-500 font-medium mt-1">
                Review and edit detected places for {destination || "this trip"}
              </p>
            </div>
          </div>
        </div>

        {formError && (
          <div className="p-3.5 rounded-xl bg-rose-50 text-rose-900 text-xs border border-rose-300 flex items-center gap-2 animate-fade-in font-semibold">
            <Info className="w-4 h-4 text-rose-700 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        {extractedPlaces.length === 0 ? (
          screenshots.length > 0 ? (
            <div className="py-10 text-center space-y-2 border border-dashed border-amber-300 rounded-2xl bg-amber-50/50 px-4">
              <Info className="w-6 h-6 text-amber-700 mx-auto" />
              <p className="text-xs font-bold text-stone-900">
                No travel places found in this image
              </p>
              <p className="text-xs text-stone-600 max-w-md mx-auto leading-relaxed">
                Try uploading a travel screenshot, landmark photo, restaurant, hotel, or itinerary.
              </p>
            </div>
          ) : (
            <div className="py-10 text-center space-y-2 border border-dashed border-[#e0d6c8] rounded-2xl bg-[#faf7f2]">
              <MapPin className="w-6 h-6 text-[#ff6b5b] mx-auto animate-bounce" />
              <p className="text-xs font-bold text-stone-800">No places identified yet — upload screenshots above to get started.</p>
              <p className="text-xs text-stone-500">
                Upload screenshots from your camera roll above or add places manually.
              </p>
            </div>
          )
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {extractedPlaces.map((place) => {
              const catInfo = CATEGORY_CONFIG[place.category];
              const isEditing = editingPlaceId === place.id;

              return (
                <div
                  key={place.id}
                  className={`p-4 rounded-2xl border transition-all duration-200 shadow-2xs flex items-start justify-between gap-4 ${catInfo.cardBorderClass}`}
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
                          className="w-full px-3 py-1.5 rounded-xl border border-[#e6dfd5] text-xs font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#0d9488]"
                        />
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={place.notes || ""}
                            placeholder="Notes"
                            onChange={(e) =>
                              handleUpdatePlace(place.id, { notes: e.target.value })
                            }
                            className="w-1/2 px-3 py-1.5 rounded-xl border border-[#e6dfd5] text-xs text-stone-700 focus:outline-none focus:ring-2 focus:ring-[#0d9488]"
                          />
                          <button
                            type="button"
                            onClick={() => setEditingPlaceId(null)}
                            className="px-3.5 py-1.5 rounded-xl bg-[#0d9488] text-white text-xs font-bold"
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
                            <span className="text-[10px] font-bold text-teal-900 bg-teal-100/90 px-2 py-0.5 rounded-md border border-teal-300 shadow-2xs">
                              {Math.round(place.confidence * 100)}% vision match
                            </span>
                          )}
                        </div>

                        {place.notes && (
                          <p className="text-xs text-stone-700 leading-normal font-medium">
                            📝 {place.notes}
                          </p>
                        )}

                        {place.enrichmentStatus === "pending" && (
                          <p className="text-[11px] text-amber-700 animate-pulse flex items-center gap-1 font-medium pt-0.5">
                            <RefreshCw className="w-3 h-3 animate-spin shrink-0" />
                            Enriching location details...
                          </p>
                        )}

                        {(place.city || place.address) && (
                          <div className="text-xs text-stone-700 flex items-start gap-1.5 font-medium bg-[#f7f2ea] p-2 rounded-xl border border-[#e6dfd5] mt-1">
                            <MapPin className="w-3.5 h-3.5 text-[#ff6b5b] shrink-0 mt-0.5" />
                            <div className="space-y-0.5 min-w-0 flex-1">
                              {place.city && (
                                <span className="font-bold text-stone-900 block text-xs">
                                  {place.city}
                                </span>
                              )}
                              {place.address && (
                                <span className="text-[11px] text-stone-600 block line-clamp-2 leading-tight">
                                  {place.address}
                                </span>
                              )}
                            </div>
                          </div>
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

        {/* Action Bar: Generate Itinerary Button */}
        <div className="pt-2">
          <button
            type="button"
            disabled={isProcessing}
            onClick={handleGenerateItinerary}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-[#0d9488] via-[#0f766e] to-[#064e3b] hover:opacity-95 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed text-white font-display font-extrabold text-base shadow-travel transition-all duration-200 flex items-center justify-center gap-2.5 border border-[#0f766e]"
          >
            <Sparkles className="w-5 h-5 text-amber-200" />
            <span>
              {isProcessing
                ? "Analyzing Screenshot Image..."
                : `Generate Day-by-Day Itinerary (${extractedPlaces.length} Places)`}
            </span>
            <ChevronRight className="w-5 h-5 text-amber-100" />
          </button>
        </div>
      </section>

      {/* STEP 4: Generated Itinerary Output */}
      {isProcessing ? (
        <section className="bg-teal-50/70 border border-teal-200 rounded-3xl p-6 text-center space-y-2 shadow-2xs">
          <RefreshCw className="w-6 h-6 text-[#0d9488] animate-spin mx-auto" />
          <h4 className="font-display font-bold text-stone-900 text-sm">
            Analyzing screenshot with Gemini Vision API...
          </h4>
          <p className="text-xs text-stone-600">
            Itinerary generation is paused while image analysis completes.
          </p>
        </section>
      ) : isItineraryGenerated ? (
        <section
          id="itinerary-output"
          className="bg-white rounded-3xl border border-[#e6dfd5] p-6 sm:p-8 shadow-travel space-y-6 animate-fade-in"
        >
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#f4eee6] pb-5">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold bg-teal-100 text-teal-900 border border-teal-300">
                <Check className="w-3.5 h-3.5 text-teal-700" /> Itinerary Ready
              </div>
              <h3 className="font-display text-2xl sm:text-3xl font-extrabold text-stone-900">
                {destination || "Trip"} Daily Schedule
              </h3>
              <p className="text-xs text-stone-600 font-medium">
                {startDate} to {endDate} &bull; {tripDaysCount} Days &bull; {extractedPlaces.length} Places scheduled
              </p>
            </div>

            <button
              type="button"
              onClick={() => updateActiveTrip({ isItineraryGenerated: false })}
              className="px-4 py-2 rounded-xl text-xs font-bold border border-[#e6dfd5] hover:bg-stone-100 text-stone-700 transition-colors"
            >
              Close View
            </button>
          </div>

          {/* Day Tabs */}
          <div className="flex items-center gap-2 border-b border-[#f4eee6] pb-2 overflow-x-auto">
            {Array.from({ length: Math.max(1, tripDaysCount) }, (_, i) => i + 1).map((dayNum) => (
              <button
                key={dayNum}
                type="button"
                onClick={() => setActiveDay(dayNum)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 border ${
                  activeDay === dayNum
                    ? "bg-[#0d9488] text-white border-[#0f766e] shadow-xs"
                    : "bg-[#f7f2ea] text-stone-700 border-[#e6dfd5] hover:bg-teal-50"
                }`}
              >
                Day {dayNum}
              </button>
            ))}
          </div>

          {/* Daily Schedule Slots */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-display font-bold text-base text-stone-900">
                Day {activeDay} Plan
              </h4>
              <span className="text-xs text-stone-500 font-medium">
                Geographically clustered & category prioritized
              </span>
            </div>

            {dailySchedule[activeDay]?.accommodations &&
              dailySchedule[activeDay].accommodations.length > 0 && (
                <div className="p-3.5 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-between gap-3 text-xs text-purple-900 shadow-2xs">
                  <div className="flex items-center gap-2 font-medium">
                    <Hotel className="w-4 h-4 text-purple-700 shrink-0" />
                    <span>
                      Recommended Hotel / Base:{" "}
                      <strong className="font-bold">
                        {dailySchedule[activeDay].accommodations.map((acc) => acc.title).join(", ")}
                      </strong>
                    </span>
                  </div>
                  <span className="text-[10px] bg-purple-200 text-purple-900 px-2 py-0.5 rounded-md font-bold shrink-0">
                    Stay Reserved
                  </span>
                </div>
              )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
              {/* Morning Slot */}
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
                        className="p-3.5 rounded-xl bg-white border border-[#e2d5c3] shadow-card space-y-1.5 hover:border-[#0d9488]/50 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2 text-xs font-bold text-stone-900">
                          <span className="leading-snug">{place.title}</span>
                          <span className="shrink-0">{catInfo?.icon}</span>
                        </div>
                        {(place.city || place.locationHint) && (
                          <p className="text-[11px] text-[#ff6b5b] font-semibold flex items-center gap-1">
                            <MapPin className="w-3 h-3 shrink-0" /> {place.city || place.locationHint}
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

              {/* Afternoon Slot */}
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
                        {(place.city || place.locationHint) && (
                          <p className="text-[11px] text-emerald-800 font-semibold flex items-center gap-1">
                            <MapPin className="w-3 h-3 shrink-0" /> {place.city || place.locationHint}
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

              {/* Evening Slot */}
              <div className="p-4.5 rounded-2xl bg-[#fbf4f2] border border-[#ead8d3] space-y-3 shadow-2xs">
                <div className="flex items-center gap-2 font-display font-bold text-xs text-rose-900 border-b border-[#dfccc7] pb-2">
                  <Clock className="w-3.5 h-3.5 text-rose-700" />
                  <span>Evening (6:00 PM - 10:00 PM)</span>
                </div>
                {dailySchedule[activeDay]?.evening.length === 0 ? (
                  <div className="py-6 px-3 text-center border border-dashed border-[#dfccc7] rounded-xl bg-white/40 space-y-1">
                    <Clock className="w-4 h-4 text-rose-700/40 mx-auto" />
                    <p className="text-xs font-bold text-stone-600">No saved places for this slot</p>
                    <p className="text-[11px] text-stone-500">Upload screenshot or add place manually</p>
                  </div>
                ) : (
                  dailySchedule[activeDay].evening.map((place) => {
                    const catInfo = CATEGORY_CONFIG[place.category];
                    return (
                      <div
                        key={place.id}
                        className="p-3.5 rounded-xl bg-white border border-[#dfccc7] shadow-card space-y-1.5 hover:border-rose-400 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2 text-xs font-bold text-stone-900">
                          <span className="leading-snug">{place.title}</span>
                          <span className="shrink-0">{catInfo?.icon}</span>
                        </div>
                        {(place.city || place.locationHint) && (
                          <p className="text-[11px] text-rose-800 font-semibold flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 shrink-0" /> {place.city || place.locationHint}
                          </p>
                        )}
                        {place.notes && (
                          <p className="text-[11px] text-stone-600 font-medium">📝 {place.notes}</p>
                        )}
                        {place.estimatedCost && (
                          <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100/80 text-rose-900 border border-rose-300/60">
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
      ) : null}
    </main>
  );
}
