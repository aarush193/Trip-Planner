"use client";

import React, { useState, useMemo, memo } from "react";
import { useRouter } from "next/navigation";
import {
  MapPin,
  Calendar,
  Plus,
  Trash2,
  ChevronRight,
  Luggage,
  Sparkles,
  Search,
  Compass,
  CheckCircle2,
  Clock,
  Layers,
  ChevronDown,
  ChevronUp,
  Ticket,
  SlidersHorizontal,
  Bookmark,
  Share2,
  FileText,
  X,
  Utensils,
  Landmark,
  Compass as ActivityIcon,
  Hotel,
  Palette,
  ShoppingBag,
  Eye,
  Edit3,
  Printer,
} from "lucide-react";
import { useTripContext, TripContext } from "@/context/TripContext";
import { buildItinerary, TripSchedule } from "@/lib/itineraryEngine";
import { PlaceCategory, ExtractedPlace } from "@/lib/vision";

const CATEGORY_CONFIG: Record<
  PlaceCategory,
  { label: string; icon: React.ReactNode; badgeClass: string; cardBorderClass: string }
> = {
  sightseeing: {
    label: "Sightseeing",
    icon: <Landmark className="w-3.5 h-3.5 text-[#073B3A]" />,
    badgeClass: "bg-[#19D3C5] text-[#073B3A] border-[#073B3A]/30 font-extrabold shadow-2xs",
    cardBorderClass: "border-[#19D3C5]/50 hover:border-[#073B3A] bg-white",
  },
  food: {
    label: "Food & Dining",
    icon: <Utensils className="w-3.5 h-3.5 text-amber-900" />,
    badgeClass: "bg-amber-300 text-amber-950 border-amber-500/50 font-extrabold shadow-2xs",
    cardBorderClass: "border-amber-300 hover:border-amber-600 bg-white",
  },
  activity: {
    label: "Activity",
    icon: <ActivityIcon className="w-3.5 h-3.5 text-emerald-950" />,
    badgeClass: "bg-emerald-300 text-emerald-950 border-emerald-500/50 font-extrabold shadow-2xs",
    cardBorderClass: "border-emerald-300 hover:border-emerald-600 bg-white",
  },
  stay: {
    label: "Stay & Hotels",
    icon: <Hotel className="w-3.5 h-3.5 text-purple-950" />,
    badgeClass: "bg-purple-300 text-purple-950 border-purple-500/50 font-extrabold shadow-2xs",
    cardBorderClass: "border-purple-300 hover:border-purple-600 bg-white",
  },
  culture: {
    label: "Culture & Art",
    icon: <Palette className="w-3.5 h-3.5 text-indigo-950" />,
    badgeClass: "bg-indigo-300 text-indigo-950 border-indigo-500/50 font-extrabold shadow-2xs",
    cardBorderClass: "border-indigo-300 hover:border-indigo-600 bg-white",
  },
  shopping: {
    label: "Shopping",
    icon: <ShoppingBag className="w-3.5 h-3.5 text-rose-950" />,
    badgeClass: "bg-rose-300 text-rose-950 border-rose-500/50 font-extrabold shadow-2xs",
    cardBorderClass: "border-rose-300 hover:border-rose-600 bg-white",
  },
};

const DESTINATION_IMAGES: Record<string, string> = {
  paris: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600&q=80",
  agra: "https://images.unsplash.com/photo-1564507592333-c60657eea523?w=600&q=80",
  tokyo: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=600&q=80",
  rome: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=600&q=80",
  bali: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=600&q=80",
  london: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=600&q=80",
  "new york": "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=600&q=80",
  barcelona: "https://images.unsplash.com/photo-1583422409516-2895a77efded?w=600&q=80",
};

const DEFAULT_COVER = "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=600&q=80";

// Memoized Place Card with in-place Edit & Delete
const SavedPlaceCard = memo(function SavedPlaceCard({
  place,
  onEdit,
  onDelete,
}: {
  place: ExtractedPlace;
  onEdit?: (place: ExtractedPlace) => void;
  onDelete?: (placeId: string) => void;
}) {
  const catInfo = CATEGORY_CONFIG[place.category] || CATEGORY_CONFIG.sightseeing;
  return (
    <div className={`p-4 rounded-2xl border-2 transition-all shadow-xs space-y-2.5 ${catInfo.cardBorderClass}`}>
      <div className="flex items-start justify-between gap-2">
        <span className="font-display font-black text-sm text-[#073B3A] leading-tight">
          {place.title}
        </span>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className={`px-2.5 py-0.5 rounded-full text-[10px] border ${catInfo.badgeClass}`}>
            {catInfo.label}
          </span>
          {onEdit && (
            <button
              type="button"
              onClick={() => onEdit(place)}
              className="p-1 rounded-lg text-stone-400 hover:text-[#073B3A] hover:bg-stone-100 transition-colors"
              title="Edit place details"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={() => onDelete(place.id)}
              className="p-1 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
              title="Delete place from itinerary"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {place.notes && (
        <p className="text-xs text-stone-600 font-medium leading-relaxed">
          {place.notes}
        </p>
      )}

      <div className="flex items-center justify-between gap-2 text-[11px] font-bold text-stone-500 pt-1 border-t border-stone-100">
        {place.address || place.locationHint ? (
          <span className="truncate flex items-center gap-1">
            <MapPin className="w-3 h-3 text-[#FF2D78] shrink-0" />
            <span className="truncate">{place.address || place.locationHint}</span>
          </span>
        ) : (
          <span />
        )}

        {place.estimatedCost && (
          <span className="text-[#073B3A] font-black bg-stone-100 px-2 py-0.5 rounded shrink-0">
            💰 {place.estimatedCost}
          </span>
        )}
      </div>
    </div>
  );
});

// Memoized Slot Column
const SavedSlotColumn = memo(function SavedSlotColumn({
  title,
  icon,
  places,
  headerClass,
  onEdit,
  onDelete,
}: {
  title: string;
  icon: React.ReactNode;
  places: ExtractedPlace[];
  headerClass: string;
  onEdit?: (place: ExtractedPlace) => void;
  onDelete?: (placeId: string) => void;
}) {
  return (
    <div className="p-5 rounded-3xl bg-white border-2 border-[#e2d9cc] space-y-4 shadow-sm flex-1 flex flex-col justify-between">
      <div className={`flex items-center justify-between font-display font-black text-xs pb-2 border-b-2 ${headerClass}`}>
        <div className="flex items-center gap-2">
          {icon}
          <span>{title}</span>
        </div>
        <span className="bg-stone-100 text-stone-800 px-2 py-0.5 rounded text-[10px] font-black">
          {places.length}
        </span>
      </div>

      {places.length === 0 ? (
        <div className="py-8 text-center text-stone-400 text-xs italic font-medium">
          No places scheduled for this slot
        </div>
      ) : (
        <div className="space-y-3">
          {places.map((p) => (
            <SavedPlaceCard
              key={p.id}
              place={p}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
});

export default function MyTripsPage() {
  const {
    trips,
    activeTripId,
    setActiveTripId,
    handleCreateNewTrip,
    deleteTrip,
    deletePlaceFromTrip,
    updatePlaceInTrip,
    clearPlacesFromTrip,
    user,
    openAuthGate,
  } = useTripContext();
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<"all" | "ready" | "draft">("all");
  const [expandedTripId, setExpandedTripId] = useState<string | null>(null);
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
  const [modalActiveDay, setModalActiveDay] = useState<number>(1);

  // In-place place editing state
  const [editingPlace, setEditingPlace] = useState<ExtractedPlace | null>(null);
  const [editTitle, setEditTitle] = useState<string>("");
  const [editCategory, setEditCategory] = useState<PlaceCategory>("sightseeing");
  const [editNotes, setEditNotes] = useState<string>("");
  const [editCost, setEditCost] = useState<string>("");
  const [editAddress, setEditAddress] = useState<string>("");

  const selectedTrip = useMemo(() => {
    if (!selectedTripId) return null;
    return trips.find((t) => t.id === selectedTripId) || null;
  }, [trips, selectedTripId]);

  const handleOpenTripModal = (tripId: string) => {
    setSelectedTripId(tripId);
    setModalActiveDay(1);
  };

  const handleEditInStudio = (tripId: string) => {
    setActiveTripId(tripId);
    router.push("/planner");
  };

  const handleDeleteTrip = async (tripId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (window.confirm("Are you sure you want to permanently delete this voyage?")) {
      if (selectedTripId === tripId) {
        setSelectedTripId(null);
      }
      await deleteTrip(tripId);
    }
  };

  const handleStartEditPlace = (place: ExtractedPlace) => {
    setEditingPlace(place);
    setEditTitle(place.title);
    setEditCategory(place.category);
    setEditNotes(place.notes || "");
    setEditCost(place.estimatedCost || "");
    setEditAddress(place.address || place.locationHint || "");
  };

  const handleSavePlaceEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTrip || !editingPlace) return;

    updatePlaceInTrip(selectedTrip.id, editingPlace.id, {
      title: editTitle.trim() || editingPlace.title,
      category: editCategory,
      notes: editNotes.trim() || undefined,
      estimatedCost: editCost.trim() || undefined,
      address: editAddress.trim() || undefined,
      locationHint: editAddress.trim() || undefined,
    });

    setEditingPlace(null);
  };

  const handleDeletePlaceInModal = (placeId: string) => {
    if (!selectedTrip) return;
    if (window.confirm("Are you sure you want to delete this place from this itinerary?")) {
      deletePlaceFromTrip(selectedTrip.id, placeId);
    }
  };

  const handleClearAllPlacesInModal = () => {
    if (!selectedTrip) return;
    if (window.confirm(`Clear all places and schedules from "${selectedTrip.destination || "Saved Voyage"}"?`)) {
      clearPlacesFromTrip(selectedTrip.id);
    }
  };

  const filteredTrips = useMemo(() => {
    return trips.filter((t) => {
      const matchSearch =
        !searchQuery.trim() ||
        t.destination.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
        t.id.toLowerCase().includes(searchQuery.toLowerCase().trim());

      const isReady = t.isItineraryGenerated;
      const matchStatus =
        filterStatus === "all" ||
        (filterStatus === "ready" && isReady) ||
        (filterStatus === "draft" && !isReady);

      return matchSearch && matchStatus;
    });
  }, [trips, searchQuery, filterStatus]);

  const totalPlacesCollected = useMemo(() => {
    return trips.reduce((acc, t) => acc + t.extractedPlaces.length, 0);
  }, [trips]);

  const totalScreenshotsUploaded = useMemo(() => {
    return trips.reduce((acc, t) => acc + t.screenshots.length, 0);
  }, [trips]);

  const modalTripDaysCount = useMemo(() => {
    if (!selectedTrip) return 1;
    if (selectedTrip.startDate && selectedTrip.endDate) {
      const start = new Date(selectedTrip.startDate);
      const end = new Date(selectedTrip.endDate);
      const diff = end.getTime() - start.getTime();
      if (diff >= 0) {
        return Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1;
      }
    }
    if (selectedTrip.customSchedule && Object.keys(selectedTrip.customSchedule).length > 0) {
      return Object.keys(selectedTrip.customSchedule).length;
    }
    return 1;
  }, [selectedTrip]);

  const modalTripSchedule: TripSchedule = useMemo(() => {
    if (!selectedTrip) return {};
    if (selectedTrip.customSchedule && Object.keys(selectedTrip.customSchedule).length > 0) {
      return selectedTrip.customSchedule;
    }
    return buildItinerary(
      selectedTrip.extractedPlaces,
      modalTripDaysCount,
      "normal",
      selectedTrip.destination
    );
  }, [
    selectedTrip?.id,
    selectedTrip?.customSchedule,
    selectedTrip?.extractedPlaces,
    selectedTrip?.destination,
    modalTripDaysCount,
  ]);

  const currentDaySchedule = useMemo(() => {
    return modalTripSchedule[modalActiveDay] || modalTripSchedule[1] || {
      dayNumber: modalActiveDay,
      morning: [],
      afternoon: [],
      evening: [],
      accommodations: [],
      totalDistanceKm: 0,
      totalTravelMinutes: 0,
    };
  }, [modalTripSchedule, modalActiveDay]);

  return (
    <div className="w-full min-h-screen bg-[#F7EDE8] text-[#111318]">
      <main className="max-w-[1520px] w-full mx-auto px-4 sm:px-6 lg:px-12 xl:px-16 2xl:px-20 py-8 space-y-10 contain-paint">
        {/* EDITORIAL HERO BANNER - SUNSET PERSONALITY */}
        <section className="bg-gradient-to-br from-[#FF6B5B] via-[#FF2D78] to-[#073B3A] text-white rounded-[2.5rem] p-8 sm:p-12 shadow-2xl relative overflow-hidden">
          {/* Postcard Stamps Background Graphics */}
          <div className="absolute right-6 top-6 opacity-15 pointer-events-none flex gap-4">
            <Ticket className="w-48 h-48 text-[#FFE5D9] transform rotate-12" />
          </div>

          <div className="relative z-10 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/20 pb-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="text-[10px] font-black tracking-widest text-[#073B3A] uppercase bg-[#FFE5D9] px-3.5 py-1 rounded-full shadow-xs">
                    PERSONAL TRAVEL LOG · ISSUE N° 04
                  </span>
                  <span className="text-[10px] font-black tracking-widest text-white uppercase bg-[#19D3C5] px-3 py-1 rounded-full text-[#073B3A] shadow-xs">
                    {trips.length} VOYAGES SAVED
                  </span>
                </div>

                <h1 className="font-display font-black text-4xl sm:text-6xl text-white leading-tight">
                  My Travel Journal <br />
                  <span className="italic font-normal text-[#FFE5D9] opacity-95">
                    & Boarding Pass Archive.
                  </span>
                </h1>
              </div>

              <button
                type="button"
                onClick={() => {
                  handleCreateNewTrip();
                  router.push("/planner");
                }}
                className="px-6 py-3.5 rounded-full bg-white hover:bg-[#FFE5D9] text-[#073B3A] text-xs font-black shadow-xl transition-all flex items-center gap-2 active:scale-95 border-2 border-white"
              >
                <Plus className="w-4.5 h-4.5 text-[#FF2D78]" />
                <span>Start New Voyage</span>
              </button>
            </div>

            {/* Journal Dashboard Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-white/15 border border-white/25 shadow-xs">
                <span className="text-[10px] font-black text-rose-100 uppercase tracking-wider block">
                  Total Voyages
                </span>
                <p className="font-display font-black text-2xl text-white mt-0.5">{trips.length}</p>
              </div>

              <div className="p-4 rounded-2xl bg-white/15 border border-white/25 shadow-xs">
                <span className="text-[10px] font-black text-rose-100 uppercase tracking-wider block">
                  Extracted Places
                </span>
                <p className="font-display font-black text-2xl text-[#19D3C5] mt-0.5">
                  {totalPlacesCollected}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white/15 border border-white/25 shadow-xs">
                <span className="text-[10px] font-black text-rose-100 uppercase tracking-wider block">
                  Camera Roll Shots
                </span>
                <p className="font-display font-black text-2xl text-[#FFE5D9] mt-0.5">
                  {totalScreenshotsUploaded}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white/15 border border-white/25 shadow-xs">
                <span className="text-[10px] font-black text-rose-100 uppercase tracking-wider block">
                  Active Destination
                </span>
                <p className="font-display font-black text-base text-white truncate mt-1">
                  {trips.find((t) => t.id === activeTripId)?.destination || "None Selected"}
                </p>
              </div>
            </div>
          </div>
        </section>

        {!user && (
          <section className="bg-[#FAF6EE] rounded-3xl border-2 border-[#E8DFC8] p-6 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="font-display font-black text-lg text-[#073B3A] flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#FF2D78]" /> Currently Browsing in Guest Mode
              </h3>
              <p className="text-xs font-semibold text-[#073B3A]/80">
                Trips are saved in your browser. Sign in to back up your itineraries and sync trips to the cloud across all your devices.
              </p>
            </div>
            <button
              type="button"
              onClick={() => openAuthGate("my_trips")}
              className="px-5 py-2.5 rounded-2xl bg-[#FF2D78] hover:bg-[#E02068] text-white font-black text-xs shadow-md transition-all shrink-0 active:scale-95"
            >
              Sign In to Sync Trips
            </button>
          </section>
        )}

        {/* FILTER & SEARCH TOOLBAR */}
        <section className="bg-white rounded-3xl border-2 border-[#FFE5D9] p-6 shadow-lg flex flex-wrap items-center justify-between gap-4">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search saved trips by city or destination..."
              className="w-full pl-11 pr-4 py-3 rounded-2xl border-2 border-[#FFE5D9] bg-[#FDFBF7] text-[#073B3A] text-xs font-black placeholder-stone-400 focus:outline-none focus:border-[#FF2D78] focus:ring-2 focus:ring-[#FF2D78]/20 transition-all shadow-xs"
            />
            <Search className="w-4.5 h-4.5 text-[#FF2D78] absolute left-3.5 top-3.5" />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-black text-[#073B3A] uppercase tracking-wider mr-1">
              Filter:
            </span>
            <button
              type="button"
              onClick={() => setFilterStatus("all")}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                filterStatus === "all"
                  ? "bg-[#FF2D78] text-white shadow-md"
                  : "bg-[#FFE5D9]/60 text-[#073B3A] hover:bg-[#FFE5D9]"
              }`}
            >
              All Voyages ({trips.length})
            </button>

            <button
              type="button"
              onClick={() => setFilterStatus("ready")}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                filterStatus === "ready"
                  ? "bg-[#073B3A] text-white shadow-md"
                  : "bg-[#FFE5D9]/60 text-[#073B3A] hover:bg-[#FFE5D9]"
              }`}
            >
              Itinerary Ready ({trips.filter((t) => t.isItineraryGenerated).length})
            </button>

            <button
              type="button"
              onClick={() => setFilterStatus("draft")}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                filterStatus === "draft"
                  ? "bg-amber-500 text-white shadow-md"
                  : "bg-[#FFE5D9]/60 text-[#073B3A] hover:bg-[#FFE5D9]"
              }`}
            >
              Drafts ({trips.filter((t) => !t.isItineraryGenerated).length})
            </button>
          </div>
        </section>

        {/* SAVED TRIPS BOARDING PASS / POSTCARD CARDS GRID */}
        {trips.length === 0 ? (
          <section className="py-16 text-center space-y-5 border-3 border-dashed border-[#073B3A]/20 rounded-[2.5rem] bg-[#FAF6EE] p-8 shadow-sm">
            <div className="w-16 h-16 rounded-3xl bg-[#073B3A] text-white flex items-center justify-center mx-auto shadow-md">
              <Luggage className="w-8 h-8 text-[#19D3C5]" />
            </div>
            <div className="space-y-2 max-w-md mx-auto">
              <h3 className="font-display font-black text-2xl text-[#073B3A]">
                Your Travel Journal is Empty
              </h3>
              <p className="text-xs text-[#073B3A]/80 font-semibold leading-relaxed">
                You currently have 0 saved trips. Upload camera roll screenshots or select a city in the Planner to generate your first custom day-by-day itinerary.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                handleCreateNewTrip();
                router.push("/planner");
              }}
              className="px-8 py-3.5 rounded-full bg-[#FF2D78] hover:bg-[#E02068] text-white text-xs font-black shadow-lg glow-pink-shadow transition-all inline-flex items-center gap-2 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Create Your First Trip</span>
            </button>
          </section>
        ) : filteredTrips.length === 0 ? (
          <section className="py-16 text-center space-y-4 border-3 border-dashed border-[#FF6B5B]/30 rounded-3xl bg-[#FFE5D9]/30 p-8">
            <Luggage className="w-12 h-12 text-[#FF2D78] mx-auto" />
            <div className="space-y-1">
              <h3 className="font-display font-black text-xl text-[#073B3A]">
                No Voyages Match Your Criteria
              </h3>
              <p className="text-xs text-[#073B3A] font-medium max-w-sm mx-auto">
                Try adjusting your search terms or filter selection above.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setFilterStatus("all");
              }}
              className="px-5 py-2.5 rounded-full bg-[#073B3A] text-white text-xs font-black shadow-md hover:bg-[#FF2D78] transition-colors"
            >
              Reset Filters
            </button>
          </section>
        ) : (
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTrips.map((trip) => {
              const isActive = trip.id === activeTripId;
              const isExpanded = expandedTripId === trip.id;
              const placeCount = trip.extractedPlaces.length;
              const screenshotCount = trip.screenshots.length;
              const isReady = trip.isItineraryGenerated;

              const destKey = trip.destination.toLowerCase().trim();
              const coverImage = DESTINATION_IMAGES[destKey] || DEFAULT_COVER;

              return (
                <div
                  key={trip.id}
                  onClick={() => handleOpenTripModal(trip.id)}
                  className={`group bg-white rounded-3xl border-2 overflow-hidden cursor-pointer transition-all duration-200 shadow-md hover:shadow-xl flex flex-col justify-between relative ${
                    isActive
                      ? "border-[#FF2D78] ring-4 ring-[#FF2D78]/30 glow-pink-shadow"
                      : "border-[#FFE5D9] hover:border-[#073B3A]"
                  }`}
                >
                  {/* Boarding Pass Cover Header */}
                  <div className="h-44 w-full relative overflow-hidden bg-stone-900">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={coverImage}
                      alt={trip.destination}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 opacity-90"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#073B3A] via-[#073B3A]/40 to-transparent" />

                    {/* Status Badges */}
                    <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
                      <span className="px-3 py-1 rounded-full text-[10px] font-black bg-[#073B3A] text-white border border-white/40 shadow-xs">
                        PASSPORT N° {trip.id.slice(-6).toUpperCase()}
                      </span>

                      {isActive ? (
                        <span className="px-3 py-1 rounded-full text-[10px] font-black bg-[#FF2D78] text-white shadow-md border border-white">
                          ACTIVE VOYAGE
                        </span>
                      ) : isReady ? (
                        <span className="px-3 py-1 rounded-full text-[10px] font-black bg-[#19D3C5] text-[#073B3A] shadow-md border border-white">
                          ITINERARY READY
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full text-[10px] font-black bg-amber-400 text-amber-950 shadow-md border border-white">
                          DRAFT
                        </span>
                      )}
                    </div>

                    <div className="absolute bottom-3 left-4 right-4 text-white space-y-1">
                      <p className="font-display font-black text-2xl leading-none flex items-center gap-1.5 truncate">
                        <MapPin className="w-5 h-5 text-[#FF2D78] shrink-0" />
                        <span className="truncate">{trip.destination.trim() || `Trip #${trip.id.slice(-4)}`}</span>
                      </p>
                      <p className="text-xs text-rose-100 font-bold flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-[#19D3C5]" />
                        {trip.startDate && trip.endDate
                          ? `${trip.startDate} to ${trip.endDate}`
                          : "Dates not set yet"}
                      </p>
                    </div>
                  </div>

                  {/* Card Body - Travel Postcard Stub */}
                  <div className="p-5 space-y-4 bg-white flex-1 flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="p-3 rounded-2xl bg-[#FDFBF7] border-2 border-[#FFE5D9] flex items-center justify-between">
                          <div>
                            <span className="text-[10px] text-stone-500 font-bold uppercase block">
                              Places Saved
                            </span>
                            <span className="font-display font-black text-lg text-[#073B3A]">
                              {placeCount}
                            </span>
                          </div>
                          <Compass className="w-5 h-5 text-[#FF2D78]/60" />
                        </div>

                        <div className="p-3 rounded-2xl bg-[#FDFBF7] border-2 border-[#FFE5D9] flex items-center justify-between">
                          <div>
                            <span className="text-[10px] text-stone-500 font-bold uppercase block">
                              Camera Roll
                            </span>
                            <span className="font-display font-black text-lg text-[#FF2D78]">
                              {screenshotCount}
                            </span>
                          </div>
                          <FileText className="w-5 h-5 text-[#19D3C5]" />
                        </div>
                      </div>

                      {/* Expandable Preview Section */}
                      {isExpanded && (
                        <div className="p-4 rounded-2xl bg-[#FDFBF7] border-2 border-[#FFE5D9] space-y-2 animate-fade-in text-xs">
                          <span className="font-black text-[#073B3A] block uppercase text-[10px] tracking-wider">
                            Saved Spots Overview:
                          </span>
                          {placeCount === 0 ? (
                            <p className="text-stone-500 italic">No spots saved in this trip yet.</p>
                          ) : (
                            <div className="space-y-1 max-h-32 overflow-y-auto">
                              {trip.extractedPlaces.slice(0, 4).map((p) => (
                                <div
                                  key={p.id}
                                  className="flex items-center justify-between text-stone-800 font-bold text-[11px]"
                                >
                                  <span className="truncate">&bull; {p.title}</span>
                                  <span className="text-[9px] bg-stone-200 px-2 py-0.5 rounded uppercase shrink-0">
                                    {p.category}
                                  </span>
                                </div>
                              ))}
                              {placeCount > 4 && (
                                <p className="text-[10px] text-[#FF2D78] font-black pt-1">
                                  + {placeCount - 4} more spots saved...
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Card Bottom Controls */}
                    <div className="pt-3 border-t-2 border-dashed border-[#FFE5D9] flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedTripId(isExpanded ? null : trip.id);
                        }}
                        className="text-[11px] font-black text-[#073B3A] hover:text-[#FF2D78] flex items-center gap-1 transition-colors"
                      >
                        {isExpanded ? (
                          <>
                            <span>Hide Details</span> <ChevronUp className="w-3.5 h-3.5" />
                          </>
                        ) : (
                          <>
                            <span>Preview</span> <ChevronDown className="w-3.5 h-3.5" />
                          </>
                        )}
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => handleDeleteTrip(trip.id, e)}
                          className="p-2 rounded-xl text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Delete trip permanently"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditInStudio(trip.id);
                          }}
                          className="p-2 rounded-xl text-[#073B3A] hover:text-[#FF2D78] hover:bg-[#FFE5D9]/50 transition-colors"
                          title="Edit in Planner Studio"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenTripModal(trip.id);
                          }}
                          className="px-4 py-2 rounded-xl bg-[#073B3A] hover:bg-[#FF2D78] text-white font-black text-xs transition-all flex items-center gap-1.5 shadow-md active:scale-95"
                        >
                          <Eye className="w-3.5 h-3.5 text-[#19D3C5]" />
                          <span>View Itinerary</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </section>
        )}
      </main>

      {/* FULL SAVED ITINERARY MODAL / VIEWER DIRECTLY ON MY TRIPS PAGE */}
      {selectedTrip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/70 overflow-y-auto">
          <div
            className="bg-[#F7EDE8] text-[#111318] rounded-[2.5rem] border-3 border-[#073B3A] max-w-5xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-[#073B3A] text-white p-6 sm:p-8 flex items-start justify-between gap-4 shrink-0 relative overflow-hidden">
              <div className="space-y-2 z-10">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="text-[10px] font-black tracking-widest text-[#073B3A] uppercase bg-[#19D3C5] px-3 py-1 rounded-full shadow-xs">
                    SAVED ITINERARY DOSSIER
                  </span>
                  <span className="text-[10px] font-black tracking-widest text-white uppercase bg-[#FF2D78] px-3 py-1 rounded-full shadow-xs">
                    PASSPORT N° {selectedTrip.id.slice(-6).toUpperCase()}
                  </span>
                </div>

                <h2 className="font-display font-black text-2xl sm:text-4xl text-white flex items-center gap-2">
                  <MapPin className="w-6 h-6 sm:w-8 sm:h-8 text-[#FF2D78] shrink-0" />
                  <span>{selectedTrip.destination || "Saved Voyage"}</span>
                </h2>

                <div className="flex items-center gap-4 flex-wrap text-xs text-emerald-200/90 font-bold">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-[#19D3C5]" />
                    {selectedTrip.startDate && selectedTrip.endDate
                      ? `${selectedTrip.startDate} to ${selectedTrip.endDate} (${modalTripDaysCount} Days)`
                      : `${modalTripDaysCount} Days Scheduled`}
                  </span>
                  <span>&bull;</span>
                  <span>{selectedTrip.extractedPlaces.length} Curated Places</span>
                </div>
              </div>

              <div className="flex items-center gap-2 z-10 flex-wrap">
                <button
                  type="button"
                  onClick={handleClearAllPlacesInModal}
                  className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-rose-500/80 text-white text-xs font-bold transition-all flex items-center gap-1.5"
                  title="Clear all places for this trip"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear Places</span>
                </button>

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all"
                  title="Print Itinerary"
                >
                  <Printer className="w-4.5 h-4.5" />
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedTripId(null)}
                  className="p-2.5 rounded-full bg-white/10 hover:bg-rose-600 text-white transition-all"
                  title="Close Itinerary"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 sm:p-8 space-y-6 overflow-y-auto flex-1">
              {/* Day Tabs */}
              <div className="flex items-center gap-2.5 border-b-2 border-[#e2d9cc] pb-3 overflow-x-auto">
                {Array.from({ length: Math.max(1, modalTripDaysCount) }, (_, i) => i + 1).map((dayNum) => (
                  <button
                    key={dayNum}
                    type="button"
                    onClick={() => setModalActiveDay(dayNum)}
                    className={`px-5 py-2.5 rounded-2xl text-xs font-black transition-all duration-150 border-2 shrink-0 ${
                      modalActiveDay === dayNum
                        ? "bg-[#FF2D78] text-white border-[#FF2D78] shadow-md glow-pink-shadow"
                        : "bg-white text-[#073B3A] border-[#e2d9cc] hover:bg-emerald-50"
                    }`}
                  >
                    Day {dayNum} Schedule
                  </button>
                ))}
              </div>

              {/* Day Schedule Content */}
              <div className="space-y-6">
                {/* Day Metrics Header */}
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h3 className="font-display font-black text-xl text-[#073B3A]">
                    Day {modalActiveDay} Timeline
                  </h3>
                  {typeof currentDaySchedule.totalDistanceKm === "number" && currentDaySchedule.totalDistanceKm > 0 && (
                    <span className="text-xs font-black text-[#073B3A] bg-emerald-100 px-3.5 py-1.5 rounded-full border border-emerald-300 shadow-xs">
                      🚗 ~{currentDaySchedule.totalDistanceKm} km ({currentDaySchedule.totalTravelMinutes} mins travel time)
                    </span>
                  )}
                </div>

                {/* Accommodation Base */}
                {currentDaySchedule.accommodations && currentDaySchedule.accommodations.length > 0 && (
                  <div className="p-4 rounded-2xl bg-purple-100 border-2 border-purple-400 flex items-center justify-between gap-3 text-xs text-purple-950 shadow-xs">
                    <div className="flex items-center gap-2 font-bold">
                      <Hotel className="w-5 h-5 text-purple-900 shrink-0" />
                      <span>
                        Hotel / Base Anchor:{" "}
                        <strong className="font-black text-stone-900">
                          {currentDaySchedule.accommodations.map((acc) => acc.title).join(", ")}
                        </strong>
                      </span>
                    </div>
                    <span className="text-[10px] bg-purple-300 text-purple-950 px-2.5 py-1 rounded-md font-black shrink-0 border border-purple-500/40">
                      HOTEL
                    </span>
                  </div>
                )}

                {/* Slots Grid with direct in-place editing & deletion */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <SavedSlotColumn
                    title="Morning (9:00 AM - 12:00 PM)"
                    icon={<Clock className="w-4 h-4 text-amber-800" />}
                    places={currentDaySchedule.morning}
                    headerClass="text-amber-950 border-amber-300"
                    onEdit={handleStartEditPlace}
                    onDelete={handleDeletePlaceInModal}
                  />
                  <SavedSlotColumn
                    title="Afternoon (1:00 PM - 5:00 PM)"
                    icon={<Clock className="w-4 h-4 text-emerald-800" />}
                    places={currentDaySchedule.afternoon}
                    headerClass="text-emerald-950 border-emerald-300"
                    onEdit={handleStartEditPlace}
                    onDelete={handleDeletePlaceInModal}
                  />
                  <SavedSlotColumn
                    title="Evening (6:00 PM - 10:00 PM)"
                    icon={<Clock className="w-4 h-4 text-[#FF2D78]" />}
                    places={currentDaySchedule.evening}
                    headerClass="text-rose-950 border-rose-300"
                    onEdit={handleStartEditPlace}
                    onDelete={handleDeletePlaceInModal}
                  />
                </div>
              </div>
            </div>

            {/* Modal Bottom Bar */}
            <div className="p-5 sm:p-6 bg-white border-t-2 border-[#e2d9cc] flex items-center justify-between gap-4 shrink-0 flex-wrap">
              <button
                type="button"
                onClick={() => setSelectedTripId(null)}
                className="px-6 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-black text-xs transition-colors"
              >
                Close Itinerary
              </button>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleDeleteTrip(selectedTrip.id)}
                  className="px-4 py-2.5 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-800 font-black text-xs transition-colors flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Voyage</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleEditInStudio(selectedTrip.id)}
                  className="px-6 py-2.5 rounded-xl bg-[#FF2D78] hover:bg-[#E02068] text-white font-black text-xs shadow-md glow-pink-shadow transition-all flex items-center gap-2 active:scale-95"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>Open in Planner Studio</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* IN-PLACE PLACE EDIT MODAL DIRECTLY IN MY TRIPS */}
      {editingPlace && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80">
          <div
            className="bg-white rounded-3xl border-3 border-[#073B3A] max-w-lg w-full p-6 sm:p-8 space-y-5 shadow-2xl animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-display font-black text-lg text-[#073B3A] flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-[#FF2D78]" />
                <span>Edit Place Information</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingPlace(null)}
                className="p-1 rounded-full text-stone-400 hover:text-stone-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePlaceEdit} className="space-y-4 text-xs font-bold">
              <div className="space-y-1">
                <label className="text-stone-700">Place Title / Name *</label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-stone-200 focus:border-[#FF2D78] focus:outline-none"
                  placeholder="e.g. Louvre Museum"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-stone-700">Category</label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value as PlaceCategory)}
                    className="w-full px-4 py-2.5 rounded-xl border-2 border-stone-200 focus:border-[#FF2D78] focus:outline-none bg-white text-stone-800"
                  >
                    <option value="sightseeing">Sightseeing</option>
                    <option value="food">Food & Dining</option>
                    <option value="activity">Activity</option>
                    <option value="culture">Culture & Art</option>
                    <option value="shopping">Shopping</option>
                    <option value="stay">Stay & Hotels</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-stone-700">Estimated Cost</label>
                  <input
                    type="text"
                    value={editCost}
                    onChange={(e) => setEditCost(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border-2 border-stone-200 focus:border-[#FF2D78] focus:outline-none"
                    placeholder="e.g. €17 / Free"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-stone-700">Location / Address</label>
                <input
                  type="text"
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-stone-200 focus:border-[#FF2D78] focus:outline-none"
                  placeholder="e.g. Rue de Rivoli, Paris"
                />
              </div>

              <div className="space-y-1">
                <label className="text-stone-700">Editorial Notes & Tips</label>
                <textarea
                  rows={3}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-stone-200 focus:border-[#FF2D78] focus:outline-none resize-none"
                  placeholder="Add custom notes, opening hours, booking reminders..."
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setEditingPlace(null)}
                  className="px-5 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-[#073B3A] hover:bg-[#FF2D78] text-white font-black text-xs shadow-md transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


