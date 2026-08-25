"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Compass,
  MapPin,
  Calendar,
  Plus,
  Trash2,
  ChevronRight,
  Sparkles,
  Luggage,
  Clock,
} from "lucide-react";
import { useTripContext } from "@/context/TripContext";

export default function MyTripsPage() {
  const { trips, activeTripId, setActiveTripId, handleCreateNewTrip, setTrips } = useTripContext();
  const router = useRouter();

  const handleOpenTrip = (tripId: string) => {
    setActiveTripId(tripId);
    router.push("/planner");
  };

  const handleDeleteTrip = (tripId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (trips.length <= 1) {
      alert("You must keep at least one trip context.");
      return;
    }
    setTrips((prev) => prev.filter((t) => t.id !== tripId));
  };

  return (
    <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#e6dfd5] pb-6">
        <div>
          <h1 className="font-display font-extrabold text-3xl text-stone-900 flex items-center gap-2.5">
            <Luggage className="w-7 h-7 text-[#0d9488]" />
            My Saved Trips ({trips.length})
          </h1>
          <p className="text-xs text-stone-600 font-medium mt-1">
            Manage your vacation trip contexts, extracted places, and itineraries
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            handleCreateNewTrip();
            router.push("/planner");
          }}
          className="px-5 py-2.5 rounded-2xl bg-[#0d9488] hover:bg-[#0f766e] text-white text-xs font-extrabold shadow-travel transition-all flex items-center gap-1.5 active:scale-95"
        >
          <Plus className="w-4 h-4" /> Create New Trip
        </button>
      </div>

      {/* Trips Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {trips.map((trip) => {
          const isActive = trip.id === activeTripId;
          const placeCount = trip.extractedPlaces.length;
          const screenshotCount = trip.screenshots.length;

          return (
            <div
              key={trip.id}
              onClick={() => handleOpenTrip(trip.id)}
              className={`bg-white rounded-3xl border p-6 space-y-4 cursor-pointer transition-all duration-300 card-hover shadow-card flex flex-col justify-between ${
                isActive
                  ? "border-[#0d9488] ring-2 ring-[#0d9488]/30 shadow-travel"
                  : "border-[#e6dfd5] hover:border-teal-300"
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <span className="text-[10px] font-extrabold text-stone-500 uppercase tracking-wider block">
                      Destination
                    </span>
                    <h3 className="font-display font-extrabold text-xl text-stone-900 flex items-center gap-1.5 leading-tight">
                      <MapPin className="w-4 h-4 text-[#ff6b5b] shrink-0" />
                      <span>{trip.destination.trim() || `Trip #${trip.id.slice(-4)}`}</span>
                    </h3>
                  </div>

                  {isActive && (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-teal-100 text-teal-900 border border-teal-300">
                      Active
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-4 text-xs font-semibold text-stone-600 pt-1">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-stone-400" />
                    {trip.startDate} - {trip.endDate}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 text-xs">
                  <div className="p-3 rounded-2xl bg-[#faf7f2] border border-[#e6dfd5]">
                    <span className="text-[10px] text-stone-500 font-bold block">Places Saved</span>
                    <span className="font-display font-extrabold text-lg text-stone-900">{placeCount}</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-[#faf7f2] border border-[#e6dfd5]">
                    <span className="text-[10px] text-stone-500 font-bold block">Screenshots</span>
                    <span className="font-display font-extrabold text-lg text-stone-900">{screenshotCount}</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-[#f4eee6] flex items-center justify-between">
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
                  className="px-4 py-2 rounded-xl bg-teal-50 text-[#0d9488] hover:bg-[#0d9488] hover:text-white font-bold text-xs transition-colors flex items-center gap-1 border border-teal-200"
                >
                  <span>Open in Planner</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
