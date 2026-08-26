"use client";

import React from "react";
import Link from "next/link";
import {
  Sparkles,
  Plane,
  Camera,
  ArrowRight,
  Bookmark,
  Film,
  Heart,
  MapPin,
  CheckCircle2,
  Zap,
  Globe,
  Navigation,
} from "lucide-react";

export default function AboutPage() {
  return (
    <main className="w-full min-h-screen bg-[#F5EFE5] text-[#111318] space-y-20 pb-20 contain-paint">
      {/* 1. MAGAZINE HERO SECTION */}
      <section className="relative overflow-hidden pt-12 pb-16 px-4 sm:px-6 lg:px-12 xl:px-16 2xl:px-20 max-w-[1520px] mx-auto text-center space-y-6">

        <div className="relative z-10 space-y-6 max-w-4xl mx-auto">
          <div className="flex items-center justify-center gap-2">
            <span className="stamp-badge stamp-pink">THE TRIPPLANNER STORY</span>
          </div>

          <h1 className="font-display text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-[#073B3A] leading-[1.08]">
            &quot;Travel inspiration is everywhere. <br className="hidden sm:inline" />
            Your itinerary <span className="bg-gradient-to-r from-[#FF2D78] via-[#FF6B5B] to-[#19D3C5] bg-clip-text text-transparent">shouldn’t be.&quot;</span>
          </h1>

          <p className="text-base sm:text-xl text-[#073B3A]/85 leading-relaxed font-normal max-w-2xl mx-auto">
            We built TripPlanner to rescue your favorite Instagram reels, TikToks, and camera-roll screenshots from becoming an overwhelming bookmark graveyard.
          </p>

          <div className="pt-4 flex justify-center">
            <Link
              href="/planner"
              className="px-8 py-4 rounded-2xl bg-[#FF2D78] hover:bg-[#e02068] text-white font-display font-extrabold text-base shadow-lg glow-pink-shadow transition-all duration-300 flex items-center gap-3 border border-pink-400 active:scale-95 hover:scale-105"
            >
              <Plane className="w-5 h-5" /> Turn Screenshots Into Trips
            </Link>
          </div>
        </div>
      </section>

      {/* 2. THE PROBLEM SECTION */}
      <section className="max-w-[1520px] mx-auto px-4 sm:px-6 lg:px-12 xl:px-16 2xl:px-20">
        <div className="bg-[#073B3A] rounded-3xl text-white p-8 sm:p-14 shadow-2xl space-y-8 relative overflow-hidden">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="stamp-badge stamp-turquoise">THE GRAVEYARD PROBLEM</span>
            <h2 className="font-display font-extrabold text-3xl sm:text-5xl text-white pt-1">
              &quot;Saved 247 posts. Planned 0 trips.&quot;
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed font-normal">
              Social media is full of incredible travel recommendations. But when vacation time comes, scrolling through hundreds of unsorted screenshots becomes overwhelming.
            </p>
          </div>

          {/* Visual Camera Roll Graveyard Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
            <div className="p-6 rounded-2xl bg-[#052e2c] border border-emerald-700/50 space-y-3 card-hover-magazine">
              <div className="flex items-center justify-between text-emerald-200 text-xs">
                <span className="flex items-center gap-1.5 font-bold text-rose-300">
                  <Film className="w-4 h-4" /> Saved Reel
                </span>
                <span className="text-[10px]">Saved 3 months ago</span>
              </div>
              <p className="font-display font-bold text-base text-white">
                &quot;Top 5 Hidden Gem Cafés in Montmartre You Can’t Miss&quot;
              </p>
              <div className="p-2.5 rounded-xl bg-white/10 text-[11px] text-emerald-100 flex items-center gap-2">
                <Bookmark className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                <span>Buried in your social bookmarks</span>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-[#052e2c] border border-emerald-700/50 space-y-3 card-hover-magazine">
              <div className="flex items-center justify-between text-emerald-200 text-xs">
                <span className="flex items-center gap-1.5 font-bold text-[#19D3C5]">
                  <Camera className="w-4 h-4" /> Camera Roll Screenshot
                </span>
                <span className="text-[10px]">Screenshot #412</span>
              </div>
              <p className="font-display font-bold text-base text-white">
                &quot;Sunset view point near Taj Mahal fort gate 4&quot;
              </p>
              <div className="p-2.5 rounded-xl bg-white/10 text-[11px] text-emerald-100 flex items-center gap-2">
                <Bookmark className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                <span>Lost between grocery lists & memes</span>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-[#052e2c] border border-emerald-700/50 space-y-3 card-hover-magazine sm:col-span-2 lg:col-span-1">
              <div className="flex items-center justify-between text-emerald-200 text-xs">
                <span className="flex items-center gap-1.5 font-bold text-amber-300">
                  <Heart className="w-4 h-4" /> Saved Video Place
                </span>
                <span className="text-[10px]">Favorite #89</span>
              </div>
              <p className="font-display font-bold text-base text-white">
                &quot;Late night ramen spot in Shibuya open until 3am&quot;
              </p>
              <div className="p-2.5 rounded-xl bg-white/10 text-[11px] text-emerald-100 flex items-center gap-2">
                <Bookmark className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                <span>Forgotten before flight booking</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. THE IDEA SECTION */}
      <section className="max-w-[1520px] mx-auto px-4 sm:px-6 lg:px-12 xl:px-16 2xl:px-20">
        <div className="bg-white rounded-3xl border border-[#e2d9cc] p-8 sm:p-14 shadow-2xl space-y-8 relative overflow-hidden">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="stamp-badge stamp-pink">THE SOLUTION</span>
            <h2 className="font-display font-extrabold text-3xl sm:text-5xl text-[#073B3A] pt-1">
              Save it. Upload it. Go.
            </h2>
            <p className="text-xs sm:text-sm text-[#073B3A]/80 leading-relaxed font-normal">
              Instead of spending hours manually searching for addresses and plotting locations on a map, simply upload your screenshots. We do the heavy lifting in seconds.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 text-center">
            <div className="p-6 rounded-2xl bg-[#F5EFE5] border border-[#e2d9cc] space-y-3 card-hover-magazine">
              <div className="h-12 w-12 rounded-2xl bg-[#FF2D78]/15 text-[#FF2D78] flex items-center justify-center mx-auto text-xl font-bold border border-[#FF2D78]/30">
                📷
              </div>
              <h3 className="font-display font-bold text-lg text-[#073B3A]">1. Messy Inspiration</h3>
              <p className="text-xs text-[#073B3A]/70 leading-relaxed font-normal">
                Random screenshots, saved reels, restaurant names, and landmarks scattered across apps.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#F5EFE5] border border-[#e2d9cc] space-y-3 card-hover-magazine">
              <div className="h-12 w-12 rounded-2xl bg-[#19D3C5]/20 text-[#073B3A] flex items-center justify-center mx-auto text-xl font-bold border border-[#19D3C5]/50">
                ⚡
              </div>
              <h3 className="font-display font-bold text-lg text-[#073B3A]">2. AI Vision & Geocoding</h3>
              <p className="text-xs text-[#073B3A]/70 leading-relaxed font-normal">
                Gemini Vision extracts titles while Nominatim enriches city addresses and location coordinates.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#F5EFE5] border border-[#e2d9cc] space-y-3 card-hover-magazine">
              <div className="h-12 w-12 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center mx-auto text-xl font-bold border border-amber-300">
                🗺️
              </div>
              <h3 className="font-display font-bold text-lg text-[#073B3A]">3. Optimized Itinerary</h3>
              <p className="text-xs text-[#073B3A]/70 leading-relaxed font-normal">
                Clustered geographically into a balanced day-by-day morning, afternoon, and evening plan.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. WHAT POWERS IT SECTION */}
      <section className="max-w-[1520px] mx-auto px-4 sm:px-6 lg:px-12 xl:px-16 2xl:px-20 space-y-8">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <span className="stamp-badge stamp-turquoise">ENGINE ARCHITECTURE</span>
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-[#073B3A] pt-1">
            What Powers TripPlanner
          </h2>
          <p className="text-xs sm:text-sm text-[#073B3A]/80 font-normal">
            Intelligent technology under the hood to ensure accurate place extraction and sensible routing.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-white border border-[#e2d9cc] space-y-3 card-hover-magazine shadow-lg">
            <div className="h-10 w-10 rounded-xl bg-[#FF2D78]/15 text-[#FF2D78] flex items-center justify-center font-bold">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="font-display font-bold text-lg text-[#073B3A]">Gemini Vision AI</h3>
            <p className="text-xs text-[#073B3A]/80 leading-relaxed font-normal">
              Multimodal AI vision reads text, recognizes landmark architecture, and infers categories (dining, sightseeing, activity, hotel).
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-[#e2d9cc] space-y-3 card-hover-magazine shadow-lg">
            <div className="h-10 w-10 rounded-xl bg-[#19D3C5]/20 text-[#073B3A] flex items-center justify-center font-bold">
              <Globe className="w-5 h-5" />
            </div>
            <h3 className="font-display font-bold text-lg text-[#073B3A]">OpenStreetMap Nominatim</h3>
            <p className="text-xs text-[#073B3A]/80 leading-relaxed font-normal">
              Enriches places with canonical location names, cities, formatted addresses, and internal geographic coordinates.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-[#e2d9cc] space-y-3 card-hover-magazine shadow-lg">
            <div className="h-10 w-10 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center font-bold">
              <Navigation className="w-5 h-5" />
            </div>
            <h3 className="font-display font-bold text-lg text-[#073B3A]">Geographic Distance Engine</h3>
            <p className="text-xs text-[#073B3A]/80 leading-relaxed font-normal">
              Haversine distance calculations order places using nearest-neighbor logic, grouping nearby spots together on the same day.
            </p>
          </div>
        </div>
      </section>

      {/* 5. THE TRAVEL PHILOSOPHY SECTION */}
      <section className="max-w-[1520px] mx-auto px-4 sm:px-6 lg:px-12 xl:px-16 2xl:px-20 text-center">
        <div className="p-10 sm:p-16 rounded-3xl bg-[#073B3A] text-white border border-emerald-700/50 space-y-4 shadow-2xl">
          <span className="stamp-badge stamp-pink">OUR PHILOSOPHY</span>
          <h2 className="font-display font-extrabold text-2xl sm:text-4xl text-white max-w-2xl mx-auto leading-snug">
            &quot;Your camera roll already knows where you want to go. We just help you get there.&quot;
          </h2>
        </div>
      </section>

      {/* 6. FINAL CTA SECTION */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
        <div className="p-10 rounded-3xl bg-white border border-[#e2d9cc] shadow-2xl space-y-6">
          <div className="space-y-2">
            <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-[#073B3A]">
              Got a camera roll full of places you’ve been meaning to visit?
            </h2>
            <p className="text-xs sm:text-sm text-[#073B3A]/80 font-normal">
              Stop bookmarking. Start traveling. Plan your vacation itinerary in seconds.
            </p>
          </div>

          <div className="pt-2 flex justify-center">
            <Link
              href="/planner"
              className="px-8 py-4 rounded-2xl bg-[#FF2D78] hover:bg-[#e02068] text-white font-display font-extrabold text-base shadow-xl glow-pink-shadow transition-all duration-300 flex items-center gap-3 active:scale-95 hover:scale-105"
            >
              <Sparkles className="w-5 h-5 text-white" /> Plan My Trip Now
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
