"use client";

import React from "react";
import Link from "next/link";
import { Compass, Palmtree, Heart, Globe, Sparkles } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-[#073B3A] border-t border-emerald-800/60 text-emerald-100/90 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[#FF2D78] to-[#19D3C5] text-white flex items-center justify-center shadow-md">
                <Compass className="w-5 h-5 text-white" />
              </div>
              <div className="flex items-center gap-2">
                <span className="font-display font-extrabold text-xl text-white">
                  Trip<span className="text-[#FF2D78]">Planner</span>
                </span>
                <span className="stamp-badge stamp-turquoise text-[9px] py-0.5 px-2">
                  VACATION ENGINE
                </span>
              </div>
            </div>
            <p className="text-xs text-emerald-100/80 leading-relaxed max-w-sm font-normal">
              Camera roll screenshot to day-by-day vacation itinerary engine. Powered by Gemini Vision AI and OpenStreetMap Nominatim place enrichment.
            </p>
            <div className="flex items-center gap-2 pt-1 flex-wrap">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#052e2c] text-[#19D3C5] border border-emerald-700/50">
                <Sparkles className="w-3 h-3 text-[#19D3C5]" /> Gemini Vision AI
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#052e2c] text-[#FF2D78] border border-emerald-700/50">
                <Globe className="w-3 h-3 text-[#FF2D78]" /> Nominatim OSM
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#052e2c] text-amber-300 border border-emerald-700/50">
                <Palmtree className="w-3 h-3 text-amber-300" /> Vacation Vibe
              </span>
            </div>
          </div>

          {/* Quick Navigation Links */}
          <div className="space-y-3">
            <h4 className="font-display font-extrabold text-xs uppercase tracking-wider text-white">
              Quick Navigation
            </h4>
            <ul className="space-y-2 text-xs font-semibold">
              <li>
                <Link href="/" className="hover:text-[#FF2D78] transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/planner" className="hover:text-[#FF2D78] transition-colors">
                  Trip Planner Workspace
                </Link>
              </li>
              <li>
                <Link href="/trips" className="hover:text-[#FF2D78] transition-colors">
                  My Saved Trips
                </Link>
              </li>
              <li>
                <Link href="/destinations" className="hover:text-[#FF2D78] transition-colors">
                  Explore Destinations
                </Link>
              </li>
            </ul>
          </div>

          {/* Product & Support Links */}
          <div className="space-y-3">
            <h4 className="font-display font-extrabold text-xs uppercase tracking-wider text-white">
              Company & Info
            </h4>
            <ul className="space-y-2 text-xs font-semibold">
              <li>
                <Link href="/about" className="hover:text-[#FF2D78] transition-colors">
                  About TripPlanner
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-[#FF2D78] transition-colors">
                  Contact & Feedback
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-emerald-800/60 flex flex-col sm:flex-row items-center justify-between text-xs text-emerald-200/70 gap-3">
          <p>© {new Date().getFullYear()} TripPlanner AI. All rights reserved.</p>
          <p className="flex items-center gap-1 font-medium text-emerald-100">
            Built with <Heart className="w-3.5 h-3.5 text-[#FF2D78] fill-[#FF2D78]" /> for wanderlust travelers.
          </p>
        </div>
      </div>
    </footer>
  );
}
