"use client";

import React from "react";
import Link from "next/link";
import {
  MapPin,
  Plane,
  ArrowRight,
  ChevronRight,
  Sparkles,
  Compass,
  Camera,
  Map,
  Ticket,
  Route,
  Globe,
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
      tagline: "Eiffel Tower views, Louvre galleries & cobblestone cafés",
      category: "EUROPE",
      spots: "8 CURATED SPOTS",
    },
    {
      name: "Agra",
      country: "India",
      label: "Agra, India",
      imageUrl: "https://images.unsplash.com/photo-1564507592333-c60657eea523?w=600&q=80",
      tagline: "Taj Mahal sunrise, Agra Fort & Mughal heritage quarters",
      category: "ASIA",
      spots: "5 CURATED SPOTS",
    },
    {
      name: "Tokyo",
      country: "Japan",
      label: "Tokyo, Japan",
      imageUrl: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=600&q=80",
      tagline: "Shibuya lights, ancient Senso-ji temple & midnight ramen",
      category: "ASIA",
      spots: "9 CURATED SPOTS",
    },
    {
      name: "Rome",
      country: "Italy",
      label: "Rome, Italy",
      imageUrl: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=600&q=80",
      tagline: "Cobblestone piazzas, Colosseum shadows & twilight gelato walks",
      category: "EUROPE",
      spots: "6 CURATED SPOTS",
    },
  ];

  return (
    <main className="w-full min-h-screen bg-[#F5EFE5] text-[#111318] relative overflow-hidden pb-24 contain-paint">
      {/* EDITORIAL HERO SECTION */}
      <section className="relative pt-10 pb-16 px-4 sm:px-6 lg:px-12 xl:px-16 2xl:px-20 max-w-[1520px] mx-auto z-10">
        {/* Editorial Top Bar / Issue Label */}
        <div className="flex items-center justify-between border-b border-[#073B3A]/20 pb-4 mb-10">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-black tracking-widest text-[#F5EFE5] uppercase bg-[#073B3A] px-3.5 py-1 rounded-full shadow-xs">
              VOL. 04 · 2026 EDITION
            </span>
            <span className="hidden sm:inline text-xs font-bold text-[#073B3A]">
              AI-POWERED REEL TO TRIP ENGINE
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-black text-white bg-[#FF2D78] px-3 py-1 rounded-full shadow-xs">
            <Sparkles className="w-3.5 h-3.5" />
            <span>SCREENSHOT → ITINERARY</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Main Editorial Copy */}
          <div className="lg:col-span-7 space-y-8">
            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white border-2 border-[#073B3A] shadow-md">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FF2D78] shrink-0" />
              <span className="text-xs font-black text-[#073B3A] uppercase tracking-wide">
                Screenshot-to-Itinerary Studio
              </span>
            </div>

            <h1 className="font-display text-5xl sm:text-7xl lg:text-8xl font-black tracking-tight text-[#073B3A] leading-[1.02]">
              Wanderlust <br />
              <span className="bg-gradient-to-r from-[#FF2D78] via-[#FF6B5B] to-[#19D3C5] bg-clip-text text-transparent italic font-normal">
                uncoded.
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-[#073B3A]/90 leading-relaxed font-medium max-w-2xl">
              Stop letting saved travel clips sit forgotten in your camera roll. Drop your screenshots, and let our AI Vision engine curate a crisp, geographically map-optimized daily itinerary.
            </p>

            <div className="pt-2 flex flex-wrap gap-4 items-center">
              <Link
                href="/planner"
                className="px-8 py-4 rounded-full bg-[#FF2D78] hover:bg-[#e02068] text-white font-display font-extrabold text-base shadow-lg glow-pink-shadow transition-all duration-200 flex items-center gap-3 active:scale-95 hover:-translate-y-0.5"
              >
                <Plane className="w-5 h-5" /> Start Crafting Your Trip
              </Link>
              <Link
                href="/destinations"
                className="px-7 py-4 rounded-full bg-white hover:bg-stone-50 text-[#073B3A] font-display font-bold text-base transition-all duration-200 flex items-center gap-2 border-2 border-[#073B3A] shadow-sm hover:shadow-md"
              >
                Explore Destinations <ArrowRight className="w-4 h-4 text-[#FF2D78]" />
              </Link>
            </div>

            {/* Micro Stats Bar */}
            <div className="pt-6 border-t border-[#073B3A]/15 grid grid-cols-3 gap-4 max-w-lg">
              <div>
                <p className="font-display font-black text-2xl text-[#073B3A]">100%</p>
                <p className="text-xs text-[#073B3A] font-bold">Vision Powered</p>
              </div>
              <div>
                <p className="font-display font-black text-2xl text-[#FF2D78]">0s</p>
                <p className="text-xs text-[#073B3A] font-bold">Manual Search</p>
              </div>
              <div>
                <p className="font-display font-black text-2xl text-[#073B3A]">Day-by-Day</p>
                <p className="text-xs text-[#073B3A] font-bold">Smart Routes</p>
              </div>
            </div>
          </div>

          {/* Asymmetric Magazine Layered Photo Collage */}
          <div className="lg:col-span-5 relative">
            <div className="relative w-full max-w-md mx-auto aspect-[4/5]">
              {/* Paris Card (Background Layer) */}
              <div className="absolute top-0 left-0 w-64 sm:w-72 rounded-2xl overflow-hidden polaroid-card transform -rotate-6 hover:-rotate-2 transition-transform duration-300 z-10">
                <div className="h-56 sm:h-64 w-full relative overflow-hidden rounded-lg">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600&q=80"
                    alt="Paris, France"
                    loading="eager"
                    decoding="async"
                    width={400}
                    height={300}
                    className="w-full h-full object-cover bright-photo"
                  />
                  <div className="absolute bottom-2 left-2 bg-[#073B3A] border border-white/30 px-2.5 py-1 rounded-md text-white text-[10px] font-black tracking-wider">
                    PARIS, FRANCE
                  </div>
                </div>
                <div className="pt-3 px-1 flex justify-between items-center text-xs">
                  <span className="font-display font-bold text-[#073B3A]">Eiffel & Cafe Culture</span>
                  <span className="text-[10px] font-black text-white bg-[#FF2D78] px-2.5 py-1 rounded-md shadow-xs">
                    4 SPOTS
                  </span>
                </div>
              </div>

              {/* Tokyo Card (Foreground Layer) */}
              <div className="absolute bottom-4 right-0 w-64 sm:w-72 rounded-2xl overflow-hidden polaroid-card transform rotate-6 hover:rotate-2 transition-transform duration-300 z-20">
                <div className="h-56 sm:h-64 w-full relative overflow-hidden rounded-lg">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=600&q=80"
                    alt="Tokyo, Japan"
                    loading="eager"
                    decoding="async"
                    width={400}
                    height={300}
                    className="w-full h-full object-cover bright-photo"
                  />
                  <div className="absolute bottom-2 left-2 bg-[#FF2D78] border border-white/30 px-2.5 py-1 rounded-md text-white text-[10px] font-black tracking-wider">
                    TOKYO, JAPAN
                  </div>
                </div>
                <div className="pt-3 px-1 flex justify-between items-center text-xs">
                  <span className="font-display font-bold text-[#073B3A]">Shibuya & Temples</span>
                  <span className="text-[10px] font-black text-[#073B3A] bg-[#19D3C5] border border-[#073B3A]/30 px-2.5 py-1 rounded-md shadow-xs">
                    3 SPOTS
                  </span>
                </div>
              </div>

              {/* Floating Editorial Ticket Accent */}
              <div className="absolute top-1/2 left-12 -translate-y-1/2 z-30 bg-white border-2 border-[#073B3A] p-3.5 rounded-2xl shadow-xl transform -rotate-3 hover:scale-102 transition-transform duration-200">
                <div className="flex items-center gap-2 text-[#073B3A]">
                  <Ticket className="w-4 h-4 text-[#FF2D78]" />
                  <span className="text-[11px] font-black tracking-wider uppercase">BOARDING PASS</span>
                </div>
                <p className="text-xs font-black text-[#073B3A] mt-1">REELS → ITINERARY</p>
                <div className="mt-2 text-[9px] text-[#073B3A] font-mono font-bold tracking-tighter border-t border-stone-200 pt-1 flex justify-between">
                  <span>DEST: PAR ✈ TYO</span>
                  <span className="text-[#FF2D78] font-extrabold">READY</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CONNECTED EDITORIAL HOW IT WORKS SECTION */}
      <section className="max-w-[1520px] mx-auto px-4 sm:px-6 lg:px-12 xl:px-16 2xl:px-20 py-12">
        <div className="bg-[#073B3A] rounded-[2.5rem] text-white p-8 sm:p-16 shadow-xl relative overflow-hidden">
          {/* Section Header */}
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-16 relative z-10">
            <span className="text-[11px] font-black tracking-widest text-[#073B3A] uppercase bg-[#19D3C5] border border-[#073B3A] px-4 py-1.5 rounded-full shadow-sm">
              THE EDITORIAL PROCESS
            </span>
            <h2 className="font-display font-black text-3xl sm:text-5xl text-white pt-1">
              From saved clip to day-by-day map
            </h2>
            <p className="text-sm sm:text-base text-emerald-100 font-medium">
              Three seamless chapters that turn raw travel inspiration into an effortless, location-clustered schedule.
            </p>
          </div>

          {/* Connected 3-Chapter Storyline */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
            {/* Chapter 01 */}
            <div className="relative group">
              <div className="p-8 rounded-3xl bg-[#052e2c] border border-emerald-700/80 space-y-6 transition-all duration-200 group-hover:-translate-y-1 h-full flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-display font-black text-4xl text-[#FF2D78]">01</span>
                    <div className="p-3 rounded-2xl bg-[#FF2D78] text-white shadow-sm">
                      <Camera className="w-5 h-5" />
                    </div>
                  </div>
                  <h3 className="font-display font-bold text-2xl text-white">
                    Drop Your Screenshots
                  </h3>
                  <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed">
                    Select your target city and upload saved Instagram Reels, TikTok clips, or camera-roll snapshots of places you want to visit.
                  </p>
                </div>
                <div className="pt-4 border-t border-emerald-800/80 text-[11px] font-extrabold text-[#19D3C5] flex items-center gap-1">
                  <span>CHAPTER 01</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>

            {/* Chapter 02 */}
            <div className="relative group">
              <div className="p-8 rounded-3xl bg-[#052e2c] border border-emerald-700/80 space-y-6 transition-all duration-200 group-hover:-translate-y-1 h-full flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-display font-black text-4xl text-[#19D3C5]">02</span>
                    <div className="p-3 rounded-2xl bg-[#19D3C5] text-[#073B3A] shadow-sm">
                      <Sparkles className="w-5 h-5" />
                    </div>
                  </div>
                  <h3 className="font-display font-bold text-2xl text-white">
                    AI Vision Intelligence
                  </h3>
                  <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed">
                    Gemini Vision identifies landmarks & hidden spots, while Nominatim enriches exact geographic addresses and map metadata.
                  </p>
                </div>
                <div className="pt-4 border-t border-emerald-800/80 text-[11px] font-extrabold text-[#19D3C5] flex items-center gap-1">
                  <span>CHAPTER 02</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>

            {/* Chapter 03 */}
            <div className="relative group">
              <div className="p-8 rounded-3xl bg-[#052e2c] border border-emerald-700/80 space-y-6 transition-all duration-200 group-hover:-translate-y-1 h-full flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-display font-black text-4xl text-amber-400">03</span>
                    <div className="p-3 rounded-2xl bg-amber-400 text-[#073B3A] shadow-sm">
                      <Map className="w-5 h-5" />
                    </div>
                  </div>
                  <h3 className="font-display font-bold text-2xl text-white">
                    Clustered Daily Plan
                  </h3>
                  <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed">
                    Our Haversine distance engine clusters nearby spots together, optimizing transit time between morning, afternoon & night slots.
                  </p>
                </div>
                <div className="pt-4 border-t border-emerald-800/80 text-[11px] font-extrabold text-[#19D3C5] flex items-center gap-1">
                  <span>CHAPTER 03</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURED DESTINATIONS EDITORIAL GALLERY */}
      <section className="max-w-[1520px] mx-auto px-4 sm:px-6 lg:px-12 xl:px-16 2xl:px-20 py-12 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#073B3A]/15 pb-4">
          <div>
            <span className="text-[10px] font-black tracking-widest text-white uppercase bg-[#FF2D78] px-3 py-1 rounded-full shadow-xs">
              CURATED ESSENTIALS
            </span>
            <h2 className="font-display font-black text-3xl sm:text-4xl text-[#073B3A] mt-2">
              Featured Destinations
            </h2>
          </div>
          <Link
            href="/destinations"
            className="text-xs font-black text-[#073B3A] hover:text-[#FF2D78] flex items-center gap-1 transition-colors group"
          >
            <span>VIEW ALL DESTINATIONS</span>
            <ChevronRight className="w-4 h-4 text-[#FF2D78] group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Immersive Destination Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-7">
          {featuredDestinations.map((dest, idx) => (
            <div
              key={idx}
              className="group bg-white rounded-3xl overflow-hidden border-2 border-[#e2d9cc] shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between hover:-translate-y-1"
            >
              {/* Photo Area with Bright Vivid Image */}
              <div className="h-64 w-full relative overflow-hidden bg-stone-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={dest.imageUrl}
                  alt={dest.name}
                  loading="lazy"
                  decoding="async"
                  width={400}
                  height={300}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ease-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#073B3A]/80 via-transparent to-transparent opacity-90 group-hover:opacity-75 transition-opacity" />

                {/* Floating Top Category Stamp */}
                <div className="absolute top-3.5 right-3.5 bg-[#073B3A] text-white border border-emerald-500/50 font-black text-[10px] tracking-widest px-3 py-1 rounded-full shadow-md">
                  {dest.category}
                </div>

                {/* Destination Name Overlay */}
                <div className="absolute bottom-3.5 left-3.5 right-3.5 text-white">
                  <span className="text-[10px] font-black text-[#19D3C5] tracking-widest uppercase block mb-0.5 bg-[#073B3A]/80 backdrop-blur-xs px-2 py-0.5 rounded w-max">
                    {dest.spots}
                  </span>
                  <h3 className="font-display font-black text-xl leading-tight flex items-center gap-1.5 mt-1">
                    <MapPin className="w-4 h-4 text-[#FF2D78] shrink-0" /> {dest.name}
                  </h3>
                  <p className="text-xs text-stone-200 font-semibold">{dest.country}</p>
                </div>
              </div>

              {/* Editorial Description & CTA */}
              <div className="p-5 space-y-4 flex-1 flex flex-col justify-between bg-white">
                <p className="text-xs text-[#073B3A] leading-relaxed font-medium">
                  {dest.tagline}
                </p>
                <Link
                  href="/planner"
                  onClick={() => handleSelectDestination(dest.label)}
                  className="w-full py-3 rounded-2xl bg-[#073B3A] hover:bg-[#FF2D78] text-white font-display font-extrabold text-xs shadow-sm hover:shadow-md transition-colors duration-200 flex items-center justify-center gap-2 group/btn active:scale-95"
                >
                  <span>Plan Trip to {dest.name}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#19D3C5] group-hover/btn:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER CALLOUT / MAGAZINE FINALE */}
      <section className="max-w-[1520px] mx-auto px-4 sm:px-6 lg:px-12 xl:px-16 2xl:px-20 pt-8">
        <div className="bg-gradient-to-br from-white to-[#F5EFE5] border-2 border-[#073B3A]/20 rounded-3xl p-8 sm:p-12 text-center space-y-6 shadow-sm relative overflow-hidden">
          <div className="max-w-xl mx-auto space-y-3">
            <span className="text-[10px] font-black tracking-widest text-white uppercase bg-[#FF2D78] px-4 py-1.5 rounded-full shadow-xs">
              READY WHEN YOU ARE
            </span>
            <h3 className="font-display font-black text-2xl sm:text-4xl text-[#073B3A] pt-1">
              Got saved reels sitting in your phone?
            </h3>
            <p className="text-xs sm:text-sm text-[#073B3A] font-medium">
              Turn your camera roll screenshot collection into an interactive, map-enriched itinerary in under a minute.
            </p>
          </div>
          <div className="pt-2 flex justify-center">
            <Link
              href="/planner"
              className="px-8 py-4 rounded-full bg-[#073B3A] hover:bg-[#FF2D78] text-white font-display font-extrabold text-sm transition-colors duration-200 flex items-center gap-2.5 shadow-md active:scale-95"
            >
              <Compass className="w-4 h-4 text-[#19D3C5]" /> Launch Itinerary Builder
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}


