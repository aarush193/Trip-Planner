"use client";

import React from "react";
import Link from "next/link";
import {
  Compass,
  MapPin,
  Sparkles,
  Plane,
  Palmtree,
  Camera,
  Calendar,
  Globe,
  ArrowRight,
  CheckCircle2,
  UploadCloud,
  ChevronRight,
} from "lucide-react";
import { useTripContext } from "@/context/TripContext";

export default function HomePage() {
  const { handleSelectDestination } = useTripContext();

  const featuredDestinations = [
    {
      name: "Paris",
      country: "France",
      label: "Paris, France",
      imageUrl: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600&q=80",
      tagline: "Eiffel Tower, Louvre Museum & Cozy Cafés",
    },
    {
      name: "Taj Mahal & Agra",
      country: "India",
      label: "Agra, India",
      imageUrl: "https://images.unsplash.com/photo-1564507592333-c60657eea523?w=600&q=80",
      tagline: "Wonders of Agra, Taj Mahal & Heritage",
    },
    {
      name: "Tokyo",
      country: "Japan",
      label: "Tokyo, Japan",
      imageUrl: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=600&q=80",
      tagline: "Shibuya Crossing, Historic Temples & Street Food",
    },
    {
      name: "Rome",
      country: "Italy",
      label: "Rome, Italy",
      imageUrl: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=600&q=80",
      tagline: "Colosseum, Vatican Museums & Gelato",
    },
  ];

  return (
    <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      {/* HERO BANNER */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#134e4a] via-[#0f766e] to-[#0d9488] text-white p-8 sm:p-14 shadow-travel border border-teal-800/60">
        <div className="absolute right-0 top-0 bottom-0 opacity-15 pointer-events-none flex items-center pr-6">
          <Palmtree className="w-96 h-96 text-emerald-200 transform translate-x-12 translate-y-6 rotate-12" />
        </div>

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-extrabold bg-white/15 text-teal-100 backdrop-blur-xs border border-white/20 shadow-2xs">
              <Sparkles className="w-4 h-4 text-amber-300" />
              AI Vision Camera Roll Engine
            </div>

            <h1 className="font-display text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.12]">
              Turn your saved travel screenshots into day-by-day itineraries.
            </h1>

            <p className="text-base sm:text-lg text-teal-50/90 leading-relaxed font-normal max-w-xl">
              Upload saved travel reels from Instagram, TikTok, or your camera roll. Gemini Vision AI identifies locations and constructs an optimized daily trip schedule.
            </p>

            <div className="pt-2 flex flex-wrap gap-3 items-center">
              <Link
                href="/planner"
                className="px-7 py-4 rounded-2xl bg-[#ff6b5b] hover:bg-[#e05343] text-white font-display font-extrabold text-base shadow-lg transition-all duration-200 flex items-center gap-2.5 border border-coral-400 active:scale-95"
              >
                <Plane className="w-5 h-5" /> Launch Trip Planner
              </Link>
              <Link
                href="/destinations"
                className="px-6 py-4 rounded-2xl bg-white/15 hover:bg-white/25 text-white font-display font-bold text-base backdrop-blur-xs transition-all duration-200 flex items-center gap-2 border border-white/20"
              >
                Explore Destinations <ArrowRight className="w-4 h-4 text-amber-300" />
              </Link>
            </div>
          </div>

          <div className="lg:col-span-5 grid grid-cols-2 gap-3 relative">
            <div className="space-y-3">
              <div className="rounded-2xl overflow-hidden shadow-lg border border-white/30 transform hover:-rotate-1 transition-transform duration-300">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400&q=80"
                  alt="Paris"
                  className="w-full h-40 object-cover"
                />
                <div className="p-2.5 bg-white/95 text-stone-900 text-xs font-bold flex items-center justify-between">
                  <span>Paris, France</span>
                  <span className="text-[10px] text-teal-800 font-extrabold bg-teal-100 px-1.5 py-0.5 rounded">4 Places</span>
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-6">
              <div className="rounded-2xl overflow-hidden shadow-lg border border-white/30 transform hover:rotate-1 transition-transform duration-300">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&q=80"
                  alt="Tokyo"
                  className="w-full h-44 object-cover"
                />
                <div className="p-2.5 bg-white/95 text-stone-900 text-xs font-bold flex items-center justify-between">
                  <span>Tokyo, Japan</span>
                  <span className="text-[10px] text-rose-800 font-extrabold bg-rose-100 px-1.5 py-0.5 rounded">3 Places</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS SECTION */}
      <section className="bg-white rounded-3xl border border-[#e6dfd5] p-6 sm:p-10 shadow-travel space-y-8">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <span className="text-xs font-extrabold text-[#0d9488] uppercase tracking-wider">
            Simple 3-Step Process
          </span>
          <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-stone-900">
            How TripPlanner Works
          </h2>
          <p className="text-xs sm:text-sm text-stone-600">
            From random saved reel screenshots to a structured, category-sorted daily itinerary.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-[#faf7f2] border border-[#e6dfd5] space-y-3 card-hover">
            <div className="h-10 w-10 rounded-xl bg-teal-100 text-[#0d9488] flex items-center justify-center font-display font-extrabold text-base">
              1
            </div>
            <h3 className="font-display font-bold text-lg text-stone-900">
              Select Destination & Upload
            </h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              Pick your destination city or country. Drag & drop saved reel screenshots or travel photos from your camera roll.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#faf7f2] border border-[#e6dfd5] space-y-3 card-hover">
            <div className="h-10 w-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-display font-extrabold text-base">
              2
            </div>
            <h3 className="font-display font-bold text-lg text-stone-900">
              AI Vision & Enrichment
            </h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              Gemini Vision AI extracts place names, categories, and costs. OpenStreetMap Nominatim enriches city addresses internally.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#faf7f2] border border-[#e6dfd5] space-y-3 card-hover">
            <div className="h-10 w-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-display font-extrabold text-base">
              3
            </div>
            <h3 className="font-display font-bold text-lg text-stone-900">
              Generate Daily Schedule
            </h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              Our geographic engine clusters nearby spots together, balancing activities into morning, afternoon, and evening slots.
            </p>
          </div>
        </div>
      </section>

      {/* FEATURED DESTINATIONS PREVIEW */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display font-extrabold text-2xl text-stone-900">
              Popular Vacation Destinations
            </h2>
            <p className="text-xs text-stone-600">Browse destinations ready for screenshot itinerary planning</p>
          </div>
          <Link
            href="/destinations"
            className="text-xs font-bold text-[#0d9488] hover:underline flex items-center gap-1"
          >
            View All <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {featuredDestinations.map((dest, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl overflow-hidden border border-[#e6dfd5] shadow-card card-hover flex flex-col justify-between"
            >
              <div className="h-36 w-full relative overflow-hidden bg-stone-900">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={dest.imageUrl}
                  alt={dest.name}
                  className="w-full h-full object-cover opacity-90 transition-transform duration-500 hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950/70 via-transparent to-transparent" />
                <div className="absolute bottom-2.5 left-3 text-white">
                  <p className="font-display font-extrabold text-base leading-tight flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-[#ff6b5b]" /> {dest.name}
                  </p>
                  <p className="text-[11px] text-stone-200">{dest.country}</p>
                </div>
              </div>

              <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                <p className="text-xs text-stone-600 leading-normal">{dest.tagline}</p>
                <Link
                  href="/planner"
                  onClick={() => handleSelectDestination(dest.label)}
                  className="w-full py-2 rounded-xl bg-teal-50 hover:bg-[#0d9488] hover:text-white text-[#0d9488] font-bold text-xs transition-colors flex items-center justify-center gap-1 border border-teal-200"
                >
                  Plan Trip to {dest.name} <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
