"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Globe, ArrowRight, Search, Sparkles } from "lucide-react";
import { useTripContext } from "@/context/TripContext";

const ALL_DESTINATIONS = [
  {
    name: "Paris",
    country: "France",
    label: "Paris, France",
    imageUrl: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600&q=80",
    tagline: "Eiffel Tower, Louvre Museum & Cozy Cafés",
    category: "Europe",
  },
  {
    name: "Agra",
    country: "India",
    label: "Agra, India",
    imageUrl: "https://images.unsplash.com/photo-1564507592333-c60657eea523?w=600&q=80",
    tagline: "Taj Mahal, Agra Fort & Mughal Heritage",
    category: "Asia",
  },
  {
    name: "Tokyo",
    country: "Japan",
    label: "Tokyo, Japan",
    imageUrl: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=600&q=80",
    tagline: "Shibuya Crossing, Historic Temples & Ramen",
    category: "Asia",
  },
  {
    name: "Rome",
    country: "Italy",
    label: "Rome, Italy",
    imageUrl: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=600&q=80",
    tagline: "Colosseum, Vatican Museums & Gelato",
    category: "Europe",
  },
  {
    name: "Bali",
    country: "Indonesia",
    label: "Bali, Indonesia",
    imageUrl: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=600&q=80",
    tagline: "Tropical Beaches, Rice Terraces & Temples",
    category: "Asia",
  },
  {
    name: "New York",
    country: "USA",
    label: "New York, USA",
    imageUrl: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=600&q=80",
    tagline: "Times Square, Central Park & Broadway",
    category: "North America",
  },
];

export default function DestinationsPage() {
  const { handleSelectDestination } = useTripContext();
  const router = useRouter();
  const [search, setSearch] = useState("");

  const filtered = ALL_DESTINATIONS.filter(
    (d) =>
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.country.toLowerCase().includes(search.toLowerCase()) ||
      d.label.toLowerCase().includes(search.toLowerCase())
  );

  const handlePlanDestination = (destLabel: string) => {
    handleSelectDestination(destLabel);
    router.push("/planner");
  };

  return (
    <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#e6dfd5] pb-6">
        <div>
          <h1 className="font-display font-extrabold text-3xl text-stone-900 flex items-center gap-2.5">
            <Globe className="w-7 h-7 text-[#0d9488]" />
            Explore Travel Destinations
          </h1>
          <p className="text-xs text-stone-600 font-medium mt-1">
            Pick a destination to instantly initialize a vacation trip context in your planner
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search destinations..."
            className="w-full pl-9 pr-4 py-2.5 rounded-2xl border border-[#e6dfd5] bg-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#0d9488]"
          />
          <Search className="w-4 h-4 text-[#0d9488] absolute left-3 top-3" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((dest, idx) => (
          <div
            key={idx}
            className="bg-white rounded-3xl overflow-hidden border border-[#e6dfd5] shadow-card card-hover flex flex-col justify-between"
          >
            <div className="h-44 w-full relative overflow-hidden bg-stone-900">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={dest.imageUrl}
                alt={dest.name}
                className="w-full h-full object-cover opacity-90 transition-transform duration-500 hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-transparent to-transparent" />
              <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-white/20 text-white backdrop-blur-xs">
                {dest.category}
              </span>
              <div className="absolute bottom-3 left-3 text-white">
                <p className="font-display font-extrabold text-lg leading-tight flex items-center gap-1">
                  <MapPin className="w-4 h-4 text-[#ff6b5b]" /> {dest.name}
                </p>
                <p className="text-xs text-stone-200">{dest.country}</p>
              </div>
            </div>

            <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
              <p className="text-xs text-stone-600 leading-relaxed font-normal">{dest.tagline}</p>
              <button
                type="button"
                onClick={() => handlePlanDestination(dest.label)}
                className="w-full py-3 rounded-2xl bg-[#0d9488] hover:bg-[#0f766e] text-white font-extrabold text-xs shadow-travel transition-all flex items-center justify-center gap-1.5 active:scale-95"
              >
                <Sparkles className="w-4 h-4 text-amber-200" /> Plan Trip to {dest.name}
              </button>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
