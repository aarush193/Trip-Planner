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
  Ticket,
  SlidersHorizontal,
  Layers,
  ArrowRight,
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
    icon: <Landmark className="w-3.5 h-3.5 text-[#073B3A]" />,
    badgeClass: "bg-[#19D3C5] text-[#073B3A] border-[#073B3A]/30 font-extrabold shadow-2xs",
    cardBorderClass: "border-[#19D3C5]/50 hover:border-[#073B3A] bg-white card-hover-magazine",
  },
  food: {
    label: "Food & Dining",
    icon: <Utensils className="w-3.5 h-3.5 text-amber-900" />,
    badgeClass: "bg-amber-300 text-amber-950 border-amber-500/50 font-extrabold shadow-2xs",
    cardBorderClass: "border-amber-300 hover:border-amber-600 bg-white card-hover-magazine",
  },
  activity: {
    label: "Activity",
    icon: <ActivityIcon className="w-3.5 h-3.5 text-emerald-950" />,
    badgeClass: "bg-emerald-300 text-emerald-950 border-emerald-500/50 font-extrabold shadow-2xs",
    cardBorderClass: "border-emerald-300 hover:border-emerald-600 bg-white card-hover-magazine",
  },
  stay: {
    label: "Stay & Hotels",
    icon: <Hotel className="w-3.5 h-3.5 text-purple-950" />,
    badgeClass: "bg-purple-300 text-purple-950 border-purple-500/50 font-extrabold shadow-2xs",
    cardBorderClass: "border-purple-300 hover:border-purple-600 bg-white card-hover-magazine",
  },
  culture: {
    label: "Culture & Art",
    icon: <Palette className="w-3.5 h-3.5 text-white" />,
    badgeClass: "bg-[#FF2D78] text-white border-pink-400 font-extrabold shadow-2xs",
    cardBorderClass: "border-rose-300 hover:border-[#FF2D78] bg-white card-hover-magazine",
  },
  shopping: {
    label: "Shopping",
    icon: <ShoppingBag className="w-3.5 h-3.5 text-stone-900" />,
    badgeClass: "bg-stone-300 text-stone-950 border-stone-400 font-extrabold shadow-2xs",
    cardBorderClass: "border-stone-300 hover:border-stone-600 bg-white card-hover-magazine",
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
    <div className="w-full min-h-screen bg-[#F2EBDD] text-[#111318]">
      <main className="max-w-[1520px] w-full mx-auto px-4 sm:px-6 lg:px-12 xl:px-16 2xl:px-20 py-8 space-y-10 contain-paint">
      {/* STUDIO HEADER BANNER */}
      <section className="bg-[#073B3A] text-white rounded-[2rem] p-8 sm:p-12 shadow-2xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-[10px] font-black tracking-widest text-[#073B3A] uppercase bg-[#19D3C5] px-3.5 py-1 rounded-full shadow-xs">
                TRAVEL STUDIO · EDITORIAL WORKSPACE
              </span>
            </div>

            <h1 className="font-display font-black text-4xl sm:text-6xl text-white leading-tight">
              Craft your next <br />
              <span className="bg-gradient-to-r from-[#FF2D78] via-[#FF6B5B] to-[#19D3C5] bg-clip-text text-transparent italic font-normal">
                day-by-day voyage.
              </span>
            </h1>

            <p className="text-sm sm:text-base text-emerald-100/90 leading-relaxed font-medium">
              Transform saved camera roll screenshots into a geographic, distance-optimized trip schedule.
            </p>
          </div>

          {/* Active Trip Status Summary Widget */}
          <div className="bg-[#052e2c] border border-emerald-700/80 p-5 rounded-2xl space-y-3 shrink-0 shadow-lg min-w-[260px]">
            <div className="flex items-center justify-between border-b border-emerald-800 pb-2">
              <span className="text-[10px] font-black tracking-widest uppercase text-emerald-300">
                ACTIVE VOYAGE
              </span>
              <span className="text-[10px] font-bold text-white bg-[#FF2D78] px-2 py-0.5 rounded-full">
                {trips.length} {trips.length === 1 ? "Trip" : "Trips"} Saved
              </span>
            </div>

            <div className="space-y-1">
              <p className="font-display font-black text-base text-white flex items-center gap-1.5 truncate">
                <MapPin className="w-4 h-4 text-[#FF2D78] shrink-0" />
                <span className="truncate">{destination || "Unspecified City"}</span>
              </p>
              <div className="flex items-center justify-between text-xs text-emerald-200/80 font-medium">
                <span>{extractedPlaces.length} Places Detected</span>
                {tripDaysCount > 0 && <span>{tripDaysCount} Days</span>}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STEP 1: DESTINATION & DATES (STUDIO SETUP) */}
      <section
        id="destination-selector-section"
        className="bg-white rounded-3xl border-2 border-[#e2d9cc] p-6 sm:p-8 shadow-xl space-y-8 transition-all hover:border-[#073B3A]/40"
      >
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#e2d9cc] pb-4">
          <div className="flex items-center gap-3">
            <span className="h-9 w-9 rounded-xl bg-[#073B3A] text-white font-display font-black text-sm flex items-center justify-center shadow-md">
              01
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display font-black text-2xl text-[#073B3A] leading-none">
                  Destination & Travel Dates
                </h2>
                <span className="text-[10px] font-black tracking-widest uppercase bg-[#073B3A] text-white px-2.5 py-0.5 rounded-full">
                  STEP 01
                </span>
              </div>
              <p className="text-xs text-[#073B3A] font-semibold mt-1">
                Select a featured city or search your target destination
              </p>
            </div>
          </div>

          {tripDaysCount > 0 && (
            <span className="text-xs font-black px-4 py-1.5 rounded-full bg-[#19D3C5] text-[#073B3A] border border-[#073B3A]/30 flex items-center gap-1.5 shadow-xs">
              <Calendar className="w-3.5 h-3.5 text-[#073B3A]" />
              {tripDaysCount} {tripDaysCount === 1 ? "Day" : "Days"} Vacation Planned
            </span>
          )}
        </div>

        {/* Active Trip Selector Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-[#F5EFE5] border-2 border-[#e2d9cc] rounded-2xl">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="text-xs font-black text-[#073B3A] uppercase tracking-wider shrink-0">
              Current Voyage:
            </span>
            <span className="font-display font-black text-sm text-[#073B3A] bg-white px-4 py-1.5 rounded-xl border border-[#e2d9cc] flex items-center gap-2 shadow-xs truncate">
              <MapPin className="w-4 h-4 text-[#FF2D78] shrink-0" />
              <span className="truncate">{destination || "Unspecified Destination"}</span>
              {extractedPlaces.length > 0 && (
                <span className="text-[10px] font-black bg-[#FF2D78] text-white px-2 py-0.5 rounded-md">
                  {extractedPlaces.length} Places
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
                  className="pl-3.5 pr-8 py-2 rounded-xl text-xs font-black bg-white text-[#073B3A] border-2 border-[#073B3A] focus:outline-none focus:ring-2 focus:ring-[#FF2D78] shadow-xs appearance-none cursor-pointer"
                >
                  {trips.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.destination.trim() || `Trip #${t.id.slice(-4)}`} ({t.extractedPlaces.length} places)
                    </option>
                  ))}
                  <option value="__NEW__">+ Plan Another Trip</option>
                </select>
                <ChevronDown className="w-4 h-4 text-[#073B3A] absolute right-2.5 top-2.5 pointer-events-none" />
              </div>
            )}

            <button
              type="button"
              onClick={handleCreateNewTrip}
              className="px-4 py-2 rounded-xl bg-white hover:bg-stone-50 text-[#073B3A] text-xs font-extrabold border-2 border-[#073B3A] shadow-xs transition-all flex items-center gap-1.5 shrink-0 active:scale-95"
            >
              <Plus className="w-4 h-4 text-[#FF2D78]" />
              <span>+ Plan Another Trip</span>
            </button>
          </div>
        </div>

        {/* Search Input field */}
        <div className="space-y-3">
          <label className="block text-xs font-black uppercase tracking-wider text-[#073B3A]">
            Search Destination City or Country:
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
              placeholder="Type city or country (e.g. Paris, Tokyo, Agra, Rome, Bali)"
              className="w-full pl-11 pr-4 py-3.5 rounded-2xl border-2 border-[#e2d9cc] bg-white text-[#073B3A] text-sm font-extrabold placeholder-stone-400 focus:outline-none focus:border-[#073B3A] focus:ring-2 focus:ring-[#FF2D78] transition-all shadow-xs"
            />
            <Search className="w-5 h-5 text-[#FF2D78] absolute left-3.5 top-3.5" />

            {isDestDropdownOpen && filteredDestinationCards.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border-2 border-[#073B3A] rounded-2xl shadow-2xl z-30 overflow-hidden animate-fade-in">
                <div className="p-2 space-y-1">
                  {filteredDestinationCards.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        handleSelectDestination(item.label);
                        setIsDestDropdownOpen(false);
                      }}
                      className="w-full px-4 py-2.5 rounded-xl text-left text-xs font-extrabold text-[#073B3A] hover:bg-[#F5EFE5] flex items-center justify-between transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-[#FF2D78]" />
                        {item.label}
                      </span>
                      <span className="text-[10px] text-white bg-[#073B3A] px-2 py-0.5 rounded font-black uppercase">
                        {item.country}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Featured Travel Destination Cards Grid */}
        <div className="space-y-3">
          <span className="text-xs font-black uppercase tracking-wider text-[#073B3A] block">
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
                  className={`relative rounded-2xl overflow-hidden border-2 cursor-pointer transition-all duration-300 shadow-md group ${
                    isSelected
                      ? "border-[#FF2D78] ring-4 ring-[#FF2D78]/30 glow-pink-shadow"
                      : "border-[#e2d9cc] hover:border-[#073B3A]"
                  }`}
                >
                  <div className="h-36 w-full relative overflow-hidden bg-stone-900">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={card.imageUrl}
                      alt={card.label}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 opacity-90"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#073B3A]/80 via-transparent to-transparent" />

                    {isSelected && (
                      <span className="absolute top-2 right-2 px-2.5 py-0.5 rounded-full text-[9px] font-black bg-[#FF2D78] text-white shadow-md border border-white">
                        ACTIVE
                      </span>
                    )}

                    <div className="absolute bottom-2.5 left-3 right-3 text-white space-y-0.5">
                      <p className="font-display font-black text-sm leading-tight flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-[#FF2D78]" /> {card.name}
                      </p>
                      <p className="text-[10px] text-stone-200 font-medium line-clamp-1">
                        {card.tagline}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Dates Selection */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-[#F5EFE5] p-5 rounded-2xl border-2 border-[#e2d9cc]">
          <div className="space-y-1.5">
            <label className="block text-xs font-black text-[#073B3A] uppercase tracking-wider">
              Start Vacation Date:
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                updateActiveTrip({ startDate: e.target.value });
                setFormError(null);
              }}
              className="w-full px-4 py-2.5 rounded-xl border-2 border-[#073B3A] bg-white text-[#073B3A] text-xs font-black focus:outline-none focus:ring-2 focus:ring-[#FF2D78]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-black text-[#073B3A] uppercase tracking-wider">
              End Vacation Date:
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                updateActiveTrip({ endDate: e.target.value });
                setFormError(null);
              }}
              className="w-full px-4 py-2.5 rounded-xl border-2 border-[#073B3A] bg-white text-[#073B3A] text-xs font-black focus:outline-none focus:ring-2 focus:ring-[#FF2D78]"
            />
          </div>
        </div>
      </section>

      {/* STEP 2: AI TRAVEL STUDIO UPLOAD SECTION */}
      <section className="bg-white rounded-3xl border-2 border-[#e2d9cc] p-6 sm:p-8 shadow-xl space-y-6 transition-all hover:border-[#073B3A]/40">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#e2d9cc] pb-4">
          <div className="flex items-center gap-3">
            <span className="h-9 w-9 rounded-xl bg-[#073B3A] text-white font-display font-black text-sm flex items-center justify-center shadow-md">
              02
            </span>
              <div>
                <h2 className="font-display font-black text-2xl text-[#073B3A] leading-none">
                  Screenshot Processing Studio — {destination || "Selected Trip"}
                </h2>
                <p className="text-xs text-[#073B3A] font-semibold mt-1 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#FF2D78] shrink-0" />
                  <span>Upload saved reels, camera-roll screenshots, or place photos to analyze landmarks & map metadata</span>
                </p>
              </div>
          </div>

          <div className="flex items-center p-1 bg-[#F5EFE5] rounded-xl text-xs font-black border border-[#e2d9cc]">
            <button
              type="button"
              onClick={() => setActiveWorkflow("upload")}
              className={`px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-1.5 ${
                activeWorkflow === "upload"
                  ? "bg-[#FF2D78] text-white shadow-md"
                  : "text-[#073B3A] hover:bg-white/60"
              }`}
            >
              <UploadCloud className="w-4 h-4" />
              <span>Upload Screenshots</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveWorkflow("manual")}
              className={`px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-1.5 ${
                activeWorkflow === "manual"
                  ? "bg-[#FF2D78] text-white shadow-md"
                  : "text-[#073B3A] hover:bg-white/60"
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>Manual Place Entry</span>
            </button>
          </div>
        </div>

        {/* Quick Demo Sample Upload Chips */}
        <div className="space-y-2 bg-[#F5EFE5] p-4 rounded-2xl border-2 border-[#e2d9cc]">
          <span className="text-xs font-black text-[#073B3A] uppercase tracking-wider block">
            Try Sample Travel Screenshots:
          </span>
          <div className="flex flex-wrap gap-2.5">
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
                  className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all duration-200 flex items-center gap-2 shadow-xs ${
                    isDoneThisSample
                      ? "bg-[#19D3C5] text-[#073B3A] border border-[#073B3A]"
                      : isProcessing
                      ? "bg-stone-200 text-stone-400 border border-stone-300 cursor-not-allowed opacity-50"
                      : "bg-white hover:bg-emerald-50 text-[#073B3A] border-2 border-[#073B3A] active:scale-95"
                  }`}
                >
                  {isAnalyzingThisSample ? (
                    <RefreshCw className="w-4 h-4 text-[#073B3A] animate-spin" />
                  ) : isDoneThisSample ? (
                    <Check className="w-4 h-4 text-[#073B3A]" />
                  ) : (
                    <ImageIcon className="w-4 h-4 text-[#FF2D78]" />
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
              className={`group border-3 border-dashed rounded-3xl p-10 text-center transition-all duration-300 flex flex-col items-center justify-center gap-4 ${
                isProcessing
                  ? "border-[#19D3C5] bg-[#19D3C5]/10 cursor-not-allowed opacity-80"
                  : "border-[#FF2D78]/60 hover:border-[#FF2D78] bg-[#FFF0F5]/50 hover:bg-[#FFF0F5] cursor-pointer"
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

              <div className="h-16 w-16 rounded-2xl bg-white border-2 border-[#FF2D78] flex items-center justify-center text-[#FF2D78] shadow-lg transition-all duration-300 group-hover:scale-105 glow-pink-shadow">
                {isProcessing ? (
                  <RefreshCw className="w-8 h-8 text-[#073B3A] animate-spin" />
                ) : (
                  <UploadCloud className="w-8 h-8 text-[#FF2D78]" />
                )}
              </div>

              <div className="space-y-1 max-w-md">
                <p className="font-display font-black text-lg text-[#073B3A]">
                  {isProcessing
                    ? "Analyzing screenshot with Gemini Vision API..."
                    : `Drop screenshots for ${destination || "your vacation"}`}
                </p>
                <p className="text-xs text-[#073B3A] leading-relaxed font-medium">
                  {isProcessing
                    ? "Extracting landmarks, restaurant names, and addresses..."
                    : "Drag and drop camera roll photos, saved Instagram Reels, or TikTok clips here (PNG, JPG, WEBP)."}
                </p>
              </div>

              <button
                type="button"
                disabled={isProcessing}
                className="px-6 py-2.5 rounded-full text-xs font-black bg-[#073B3A] text-white border border-[#073B3A] shadow-md inline-flex items-center gap-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#FF2D78]"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-white" /> Analyzing...
                  </>
                ) : (
                  <>
                    <Camera className="w-4 h-4 text-[#19D3C5]" /> Select Photos From Phone
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
                    <h3 className="text-xs font-black uppercase tracking-wider text-[#073B3A]">
                      Uploaded Scrapbook Content ({screenshots.length})
                    </h3>
                    {isProcessing && (
                      <span className="text-xs text-[#FF2D78] font-black flex items-center gap-1.5">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#FF2D78]" />
                        Extracting places from images...
                      </span>
                    )}
                  </div>

                  {zeroResultScreenshots.length > 0 && (
                    <div className="space-y-2">
                      {zeroResultScreenshots.map((scr) => (
                        <div
                          key={scr.id}
                          className="flex items-center justify-between p-3 rounded-xl bg-amber-100 border-2 border-amber-400 text-xs text-amber-950 shadow-xs"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="h-8 w-8 rounded-md bg-amber-200 border border-amber-400 overflow-hidden shrink-0">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={scr.previewUrl}
                                alt={scr.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="truncate min-w-0">
                              <span className="font-extrabold text-stone-900 truncate block">
                                {scr.name}
                              </span>
                              <span className="text-[11px] text-amber-900 font-bold block">
                                No travel places detected in this image.
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveScreenshot(scr.id)}
                            className="px-3 py-1 rounded-lg bg-amber-300 hover:bg-amber-400 text-amber-950 font-black text-xs transition-colors ml-3 shrink-0"
                          >
                            Clear
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {normalScreenshots.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                      {normalScreenshots.map((scr) => (
                        <div
                          key={scr.id}
                          className="relative group rounded-2xl border-2 border-[#e2d9cc] bg-white overflow-hidden shadow-md flex flex-col"
                        >
                          <div className="h-32 w-full bg-stone-100 relative overflow-hidden">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={scr.previewUrl}
                              alt={scr.name}
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveScreenshot(scr.id)}
                              className="absolute top-2 right-2 p-1.5 rounded-lg bg-[#073B3A]/90 hover:bg-rose-700 text-white backdrop-blur-xs transition-colors shadow-md"
                              title="Remove screenshot"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <div className="p-3 text-xs space-y-1">
                            <p className="font-black text-[#073B3A] truncate" title={scr.name}>
                              {scr.name}
                            </p>
                            <div className="flex items-center justify-between text-[11px]">
                              {scr.status === "analyzing" ? (
                                <span className="text-amber-700 font-extrabold flex items-center gap-1">
                                  <RefreshCw className="w-3 h-3 animate-spin" /> Analyzing
                                </span>
                              ) : (
                                <span className="text-[#073B3A] font-extrabold flex items-center gap-1">
                                  <Check className="w-3.5 h-3.5 text-[#19D3C5]" /> {scr.extractedCount || 0} places
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
          <form onSubmit={handleAddManualPlace} className="space-y-4 animate-fade-in bg-[#F5EFE5] p-5 rounded-2xl border-2 border-[#e2d9cc]">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-black text-[#073B3A] uppercase tracking-wider">
                  Attraction / Spot Name <span className="text-[#FF2D78]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={manualTitle}
                  onChange={(e) => setManualTitle(e.target.value)}
                  placeholder="e.g. Louvre Museum, Eiffel Tower, Taj Mahal"
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-[#073B3A] bg-white text-xs font-black text-[#073B3A] focus:outline-none focus:ring-2 focus:ring-[#FF2D78]"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-black text-[#073B3A] uppercase tracking-wider">Category</label>
                <select
                  value={manualCategory}
                  onChange={(e) => setManualCategory(e.target.value as PlaceCategory)}
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-[#073B3A] bg-white text-xs font-black text-[#073B3A] focus:outline-none focus:ring-2 focus:ring-[#FF2D78]"
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
                <label className="block text-xs font-black text-[#073B3A] uppercase tracking-wider">Notes / Tips</label>
                <input
                  type="text"
                  value={manualNotes}
                  onChange={(e) => setManualNotes(e.target.value)}
                  placeholder="e.g. Sunset view point, buy advance tickets"
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-[#073B3A] bg-white text-xs font-bold text-[#073B3A] focus:outline-none focus:ring-2 focus:ring-[#FF2D78]"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-black text-[#073B3A] uppercase tracking-wider">Estimated Cost</label>
                <input
                  type="text"
                  value={manualCost}
                  onChange={(e) => setManualCost(e.target.value)}
                  placeholder="e.g. $25 / €20"
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-[#073B3A] bg-white text-xs font-bold text-[#073B3A] focus:outline-none focus:ring-2 focus:ring-[#FF2D78]"
                />
              </div>
            </div>

            <button
              type="submit"
              className="px-6 py-3 rounded-xl bg-[#FF2D78] hover:bg-[#e02068] text-white text-xs font-black shadow-md transition-all flex items-center gap-2 glow-pink-shadow active:scale-95"
            >
              <Plus className="w-4 h-4" /> Add Spot to {destination || "Trip"}
            </button>
          </form>
        )}
      </section>

      {/* STEP 3: IDENTIFIED PLACES REVIEW ARCHIVE */}
      <section
        id="identified-places-section"
        className="bg-white rounded-3xl border-2 border-[#e2d9cc] p-6 sm:p-8 shadow-xl space-y-6 transition-all hover:border-[#073B3A]/40"
      >
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#e2d9cc] pb-4">
          <div className="flex items-center gap-3">
            <span className="h-9 w-9 rounded-xl bg-[#073B3A] text-white font-display font-black text-sm flex items-center justify-center shadow-md">
              03
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display font-black text-2xl text-[#073B3A] leading-none">
                  Identified Places Archive ({extractedPlaces.length})
                </h2>
                <span className="text-[10px] font-black tracking-widest text-[#073B3A] uppercase bg-[#19D3C5] px-2.5 py-0.5 rounded-full">
                  CURATED COLLECTION
                </span>
              </div>
              <p className="text-xs text-[#073B3A] font-semibold mt-1">
                Review, edit, and organize extracted places for {destination || "this trip"}
              </p>
            </div>
          </div>
        </div>

        {formError && (
          <div className="p-4 rounded-2xl bg-rose-100 text-rose-950 text-xs border-2 border-rose-400 flex items-center gap-2.5 animate-fade-in font-extrabold shadow-xs">
            <Info className="w-5 h-5 text-rose-700 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        {extractedPlaces.length === 0 ? (
          screenshots.length > 0 ? (
            <div className="py-10 text-center space-y-2 border-2 border-dashed border-amber-400 rounded-3xl bg-amber-50 px-4">
              <Info className="w-8 h-8 text-amber-800 mx-auto" />
              <p className="text-sm font-black text-stone-900">
                No travel places detected in this uploaded image
              </p>
              <p className="text-xs text-stone-700 max-w-md mx-auto leading-relaxed font-medium">
                Try uploading a travel screenshot showing a landmark, cafe, hotel, or attraction.
              </p>
            </div>
          ) : (
            <div className="py-12 text-center space-y-3 border-2 border-dashed border-[#073B3A]/30 rounded-3xl bg-[#F5EFE5]">
              <MapPin className="w-8 h-8 text-[#FF2D78] mx-auto" />
              <p className="text-sm font-black text-[#073B3A]">
                No places identified yet — upload screenshots above to get started.
              </p>
              <p className="text-xs text-[#073B3A] font-medium max-w-md mx-auto">
                Upload your camera roll screenshots or saved Reels in Step 02 to extract spots automatically.
              </p>
            </div>
          )
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {extractedPlaces.map((place) => {
              const catInfo = CATEGORY_CONFIG[place.category];
              const isEditing = editingPlaceId === place.id;

              return (
                <div
                  key={place.id}
                  className={`p-5 rounded-2xl border-2 transition-all duration-200 shadow-md flex items-start justify-between gap-4 ${catInfo.cardBorderClass}`}
                >
                  <div className="space-y-2 flex-1 min-w-0">
                    {isEditing ? (
                      <div className="space-y-2.5">
                        <input
                          type="text"
                          value={place.title}
                          onChange={(e) =>
                            handleUpdatePlace(place.id, { title: e.target.value })
                          }
                          className="w-full px-3.5 py-2 rounded-xl border-2 border-[#073B3A] bg-white text-xs font-black text-[#073B3A] focus:outline-none focus:ring-2 focus:ring-[#FF2D78]"
                        />
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={place.notes || ""}
                            placeholder="Notes"
                            onChange={(e) =>
                              handleUpdatePlace(place.id, { notes: e.target.value })
                            }
                            className="w-1/2 px-3 py-2 rounded-xl border-2 border-[#073B3A] bg-white text-xs font-bold text-[#073B3A] focus:outline-none focus:ring-2 focus:ring-[#FF2D78]"
                          />
                          <button
                            type="button"
                            onClick={() => setEditingPlaceId(null)}
                            className="px-4 py-2 rounded-xl bg-[#FF2D78] text-white text-xs font-black shadow-xs hover:bg-[#e02068]"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-display font-black text-lg text-[#073B3A] leading-snug">
                            {place.title}
                          </h3>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs border ${catInfo.badgeClass}`}
                          >
                            {catInfo.icon}
                            <span>{catInfo.label}</span>
                          </span>
                          {place.confidence && (
                            <span className="text-[10px] font-black text-[#073B3A] bg-[#19D3C5] px-2.5 py-0.5 rounded-full border border-[#073B3A]/30">
                              {Math.round(place.confidence * 100)}% match
                            </span>
                          )}
                        </div>

                        {place.notes && (
                          <p className="text-xs text-[#073B3A] leading-normal font-medium pt-1">
                            📝 {place.notes}
                          </p>
                        )}

                        {place.enrichmentStatus === "pending" && (
                          <p className="text-[11px] text-amber-800 flex items-center gap-1 font-bold pt-0.5">
                            <RefreshCw className="w-3 h-3 animate-spin shrink-0 text-amber-700" />
                            Enriching address metadata...
                          </p>
                        )}

                        {(place.city || place.address) && (
                          <div className="text-xs text-[#073B3A] flex items-start gap-2 font-semibold bg-[#F5EFE5] p-2.5 rounded-xl border border-[#e2d9cc] mt-1">
                            <MapPin className="w-4 h-4 text-[#FF2D78] shrink-0 mt-0.5" />
                            <div className="space-y-0.5 min-w-0 flex-1">
                              {place.city && (
                                <span className="font-black text-[#073B3A] block text-xs">
                                  {place.city}
                                </span>
                              )}
                              {place.address && (
                                <span className="text-[11px] text-stone-700 block line-clamp-2 leading-tight">
                                  {place.address}
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {place.rawDetectedText && (
                          <p className="text-[11px] text-stone-600 italic">
                            Source: &quot;{place.rawDetectedText}&quot;
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
                      className="p-2 text-stone-600 hover:text-[#073B3A] hover:bg-stone-100 rounded-xl transition-colors"
                      title="Edit place details"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeletePlace(place.id)}
                      className="p-2 text-stone-600 hover:text-rose-700 hover:bg-rose-100 rounded-xl transition-colors"
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

        {/* Action Bar: Generate Itinerary Button Payoff */}
        <div className="pt-4 border-t border-[#e2d9cc]">
          <button
            type="button"
            disabled={isProcessing}
            onClick={handleGenerateItinerary}
            className="w-full py-4.5 px-8 rounded-full bg-[#FF2D78] hover:bg-[#e02068] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed text-white font-display font-black text-lg shadow-xl glow-pink-shadow transition-all duration-200 flex items-center justify-center gap-3 border-2 border-pink-400"
          >
            <Sparkles className="w-6 h-6 text-white" />
            <span>
              {isProcessing
                ? "Analyzing Screenshot Image..."
                : `Generate Day-by-Day Itinerary (${extractedPlaces.length} Places)`}
            </span>
            <ChevronRight className="w-6 h-6 text-white" />
          </button>
        </div>
      </section>

      {/* STEP 4: GENERATED ITINERARY OUTPUT */}
      {isProcessing ? (
        <section className="bg-[#19D3C5]/20 border-2 border-[#19D3C5] rounded-3xl p-8 text-center space-y-2 shadow-sm">
          <RefreshCw className="w-7 h-7 text-[#073B3A] animate-spin mx-auto" />
          <h3 className="font-display font-black text-[#073B3A] text-lg">
            Analyzing screenshot with Gemini Vision API...
          </h3>
          <p className="text-xs text-[#073B3A] font-semibold">
            Itinerary generation will automatically unlock once place detection completes.
          </p>
        </section>
      ) : isItineraryGenerated ? (
        <section
          id="itinerary-output"
          className="bg-white rounded-3xl border-2 border-[#e2d9cc] p-6 sm:p-10 shadow-2xl space-y-8 animate-fade-in"
        >
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#e2d9cc] pb-6">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-black bg-[#19D3C5] text-[#073B3A] border border-[#073B3A]/30">
                <Check className="w-4 h-4 text-[#073B3A]" /> ITINERARY GENERATED
              </div>
              <h2 className="font-display text-3xl sm:text-4xl font-black text-[#073B3A] mt-1">
                {destination || "Trip"} Day-by-Day Voyage Map
              </h2>
              <p className="text-xs text-[#073B3A] font-bold">
                {startDate} to {endDate} &bull; {tripDaysCount} Days &bull; {extractedPlaces.length} Spots Clustered
              </p>
            </div>

            <button
              type="button"
              onClick={() => updateActiveTrip({ isItineraryGenerated: false })}
              className="px-5 py-2.5 rounded-full text-xs font-black border-2 border-[#073B3A] hover:bg-[#F5EFE5] text-[#073B3A] transition-colors"
            >
              Close Itinerary View
            </button>
          </div>

          {/* Day Tabs */}
          <div className="flex items-center gap-2.5 border-b border-[#e2d9cc] pb-3 overflow-x-auto">
            {Array.from({ length: Math.max(1, tripDaysCount) }, (_, i) => i + 1).map((dayNum) => (
              <button
                key={dayNum}
                type="button"
                onClick={() => setActiveDay(dayNum)}
                className={`px-5 py-2.5 rounded-2xl text-xs font-black transition-all duration-200 border-2 ${
                  activeDay === dayNum
                    ? "bg-[#FF2D78] text-white border-[#FF2D78] shadow-md glow-pink-shadow"
                    : "bg-[#F5EFE5] text-[#073B3A] border-[#e2d9cc] hover:bg-emerald-50"
                }`}
              >
                Day {dayNum}
              </button>
            ))}
          </div>

          {/* Daily Schedule Slots */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-black text-xl text-[#073B3A]">
                Day {activeDay} Schedule
              </h3>
              <span className="text-xs text-[#073B3A] font-bold bg-[#19D3C5] px-3 py-1 rounded-full border border-[#073B3A]/20">
                Geographically Clustered Routes
              </span>
            </div>

            {dailySchedule[activeDay]?.accommodations &&
              dailySchedule[activeDay].accommodations.length > 0 && (
                <div className="p-4 rounded-2xl bg-purple-100 border-2 border-purple-400 flex items-center justify-between gap-3 text-xs text-purple-950 shadow-xs">
                  <div className="flex items-center gap-2 font-bold">
                    <Hotel className="w-5 h-5 text-purple-900 shrink-0" />
                    <span>
                      Recommended Hotel / Base:{" "}
                      <strong className="font-black text-stone-900">
                        {dailySchedule[activeDay].accommodations.map((acc) => acc.title).join(", ")}
                      </strong>
                    </span>
                  </div>
                  <span className="text-[10px] bg-purple-300 text-purple-950 px-2.5 py-1 rounded-md font-black shrink-0 border border-purple-500/40">
                    ACCOMMODATION
                  </span>
                </div>
              )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Morning Slot */}
              <div className="p-5 rounded-3xl bg-[#F5EFE5] border-2 border-amber-300 space-y-4 shadow-sm">
                <div className="flex items-center gap-2 font-display font-black text-xs text-amber-950 border-b-2 border-amber-300 pb-2">
                  <Clock className="w-4 h-4 text-amber-800" />
                  <span>Morning (9:00 AM - 12:00 PM)</span>
                </div>
                {dailySchedule[activeDay]?.morning.length === 0 ? (
                  <div className="py-8 px-3 text-center border-2 border-dashed border-amber-300 rounded-2xl bg-white/70 space-y-1">
                    <Clock className="w-5 h-5 text-amber-800/40 mx-auto" />
                    <p className="text-xs font-black text-stone-800">No saved spots for morning</p>
                    <p className="text-[11px] text-stone-600 font-medium">Upload screenshot or add place manually</p>
                  </div>
                ) : (
                  dailySchedule[activeDay].morning.map((place) => {
                    const catInfo = CATEGORY_CONFIG[place.category];
                    return (
                      <div
                        key={place.id}
                        className="p-4 rounded-2xl bg-white border-2 border-amber-300 shadow-xs space-y-2 hover:border-amber-500 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2 text-xs font-black text-[#073B3A]">
                          <span className="leading-snug">{place.title}</span>
                          <span className="shrink-0">{catInfo?.icon}</span>
                        </div>
                        {(place.city || place.locationHint) && (
                          <p className="text-[11px] text-[#FF2D78] font-black flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 shrink-0" /> {place.city || place.locationHint}
                          </p>
                        )}
                        {place.notes && (
                          <p className="text-[11px] text-stone-700 font-medium">📝 {place.notes}</p>
                        )}
                        {place.estimatedCost && (
                          <span className="inline-block text-[10px] font-black px-2.5 py-0.5 rounded bg-amber-200 text-amber-950 border border-amber-400">
                            Cost: {place.estimatedCost}
                          </span>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Afternoon Slot */}
              <div className="p-5 rounded-3xl bg-[#F5EFE5] border-2 border-emerald-300 space-y-4 shadow-sm">
                <div className="flex items-center gap-2 font-display font-black text-xs text-emerald-950 border-b-2 border-emerald-300 pb-2">
                  <Clock className="w-4 h-4 text-emerald-800" />
                  <span>Afternoon (1:00 PM - 5:00 PM)</span>
                </div>
                {dailySchedule[activeDay]?.afternoon.length === 0 ? (
                  <div className="py-8 px-3 text-center border-2 border-dashed border-emerald-300 rounded-2xl bg-white/70 space-y-1">
                    <Clock className="w-5 h-5 text-emerald-800/40 mx-auto" />
                    <p className="text-xs font-black text-stone-800">No saved spots for afternoon</p>
                    <p className="text-[11px] text-stone-600 font-medium">Upload screenshot or add place manually</p>
                  </div>
                ) : (
                  dailySchedule[activeDay].afternoon.map((place) => {
                    const catInfo = CATEGORY_CONFIG[place.category];
                    return (
                      <div
                        key={place.id}
                        className="p-4 rounded-2xl bg-white border-2 border-emerald-300 shadow-xs space-y-2 hover:border-emerald-500 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2 text-xs font-black text-[#073B3A]">
                          <span className="leading-snug">{place.title}</span>
                          <span className="shrink-0">{catInfo?.icon}</span>
                        </div>
                        {(place.city || place.locationHint) && (
                          <p className="text-[11px] text-[#073B3A] font-black flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 shrink-0" /> {place.city || place.locationHint}
                          </p>
                        )}
                        {place.notes && (
                          <p className="text-[11px] text-stone-700 font-medium">📝 {place.notes}</p>
                        )}
                        {place.estimatedCost && (
                          <span className="inline-block text-[10px] font-black px-2.5 py-0.5 rounded bg-emerald-200 text-emerald-950 border border-emerald-400">
                            Cost: {place.estimatedCost}
                          </span>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Evening Slot */}
              <div className="p-5 rounded-3xl bg-[#F5EFE5] border-2 border-rose-300 space-y-4 shadow-sm">
                <div className="flex items-center gap-2 font-display font-black text-xs text-rose-950 border-b-2 border-rose-300 pb-2">
                  <Clock className="w-4 h-4 text-[#FF2D78]" />
                  <span>Evening (6:00 PM - 10:00 PM)</span>
                </div>
                {dailySchedule[activeDay]?.evening.length === 0 ? (
                  <div className="py-8 px-3 text-center border-2 border-dashed border-rose-300 rounded-2xl bg-white/70 space-y-1">
                    <Clock className="w-5 h-5 text-[#FF2D78]/40 mx-auto" />
                    <p className="text-xs font-black text-stone-800">No saved spots for evening</p>
                    <p className="text-[11px] text-stone-600 font-medium">Upload screenshot or add place manually</p>
                  </div>
                ) : (
                  dailySchedule[activeDay].evening.map((place) => {
                    const catInfo = CATEGORY_CONFIG[place.category];
                    return (
                      <div
                        key={place.id}
                        className="p-4 rounded-2xl bg-white border-2 border-rose-300 shadow-xs space-y-2 hover:border-[#FF2D78] transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2 text-xs font-black text-[#073B3A]">
                          <span className="leading-snug">{place.title}</span>
                          <span className="shrink-0">{catInfo?.icon}</span>
                        </div>
                        {(place.city || place.locationHint) && (
                          <p className="text-[11px] text-[#FF2D78] font-black flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 shrink-0" /> {place.city || place.locationHint}
                          </p>
                        )}
                        {place.notes && (
                          <p className="text-[11px] text-stone-700 font-medium">📝 {place.notes}</p>
                        )}
                        {place.estimatedCost && (
                          <span className="inline-block text-[10px] font-black px-2.5 py-0.5 rounded bg-rose-200 text-rose-950 border border-rose-400">
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
    </div>
  );
}
