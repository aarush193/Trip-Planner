"use client";

import React from "react";
import Link from "next/link";
import { Compass, Sparkles, Globe, MapPin, CheckCircle2, Palmtree, ArrowRight } from "lucide-react";

export default function AboutPage() {
  return (
    <main className="max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-extrabold bg-teal-50 text-teal-900 border border-teal-200">
          <Palmtree className="w-3.5 h-3.5 text-[#0d9488]" /> About TripPlanner AI
        </div>
        <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-stone-900">
          Camera Roll Screenshot to Day-by-Day Travel Engine
        </h1>
        <p className="text-xs sm:text-sm text-stone-600 max-w-xl mx-auto leading-relaxed">
          We built TripPlanner to solve the messy gap between saved travel screenshots on social media and actual day-by-day vacation planning.
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-[#e6dfd5] p-6 sm:p-10 shadow-travel space-y-6">
        <h2 className="font-display font-bold text-xl text-stone-900">
          Key Technology Features
        </h2>

        <div className="space-y-4 text-xs sm:text-sm text-stone-700 leading-relaxed">
          <div className="flex items-start gap-3 p-4 rounded-2xl bg-[#faf7f2] border border-[#e6dfd5]">
            <CheckCircle2 className="w-5 h-5 text-[#0d9488] shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold text-stone-900 block">Gemini Vision AI Extraction</strong>
              Extracts place titles, categories (sightseeing, food, activity, stay, culture, shopping), notes, and cost estimates directly from uploaded camera roll images.
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 rounded-2xl bg-[#faf7f2] border border-[#e6dfd5]">
            <CheckCircle2 className="w-5 h-5 text-[#0d9488] shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold text-stone-900 block">OpenStreetMap Nominatim Place Enrichment</strong>
              Enriches extracted places with canonical names, cities, formatted addresses, and internal geographic coordinates.
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 rounded-2xl bg-[#faf7f2] border border-[#e6dfd5]">
            <CheckCircle2 className="w-5 h-5 text-[#0d9488] shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold text-stone-900 block">Geographic Haversine Route & Load Balancing Engine</strong>
              Clusters geographically close places on the same day, orders routes via nearest-neighbor distance, and balances activities evenly into morning, afternoon, and evening slots.
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-[#f4eee6] text-center">
          <Link
            href="/planner"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-[#0d9488] hover:bg-[#0f766e] text-white font-extrabold text-xs shadow-travel transition-all"
          >
            <Sparkles className="w-4 h-4 text-amber-200" /> Start Planning Your Vacation <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </main>
  );
}
