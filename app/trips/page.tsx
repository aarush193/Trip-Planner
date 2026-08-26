"use client";

import React, { useState, useMemo } from "react";
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
} from "lucide-react";
import { useTripContext } from "@/context/TripContext";

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

export default function MyTripsPage() {
  const { trips, activeTripId, setActiveTripId, handleCreateNewTrip, setTrips } = useTripContext();
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<"all" | "ready" | "draft">("all");
  const [expandedTripId, setExpandedTripId] = useState<string | null>(null);

  const handleOpenTrip = (tripId: string) => {
    setActiveTripId(tripId);
    router.push("/planner");
  };

  const handleDeleteTrip = (tripId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (trips.length <= 1) {
      alert("You must keep at least one active trip context in your journal.");
      return;
    }
    setTrips((prev) => prev.filter((t) => t.id !== tripId));
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
      {filteredTrips.length === 0 ? (
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
                onClick={() => handleOpenTrip(trip.id)}
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
                          <span>Preview Spots</span> <ChevronDown className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => handleDeleteTrip(trip.id, e)}
                        className="p-2 rounded-xl text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Delete trip context"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenTrip(trip.id)}
                        className="px-4 py-2 rounded-xl bg-[#073B3A] hover:bg-[#FF2D78] text-white font-black text-xs transition-all flex items-center gap-1 shadow-md active:scale-95"
                      >
                        <span>Open Studio</span>
                        <ChevronRight className="w-4 h-4 text-[#19D3C5]" />
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
    </div>
  );
}

