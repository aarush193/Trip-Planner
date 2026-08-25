"use client";

import React from "react";
import Link from "next/link";
import { Compass, Palmtree, Heart, Globe, Sparkles } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-white border-t border-[#e6dfd5] mt-16 text-stone-700 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[#0d9488] to-[#0f766e] text-white flex items-center justify-center shadow-xs">
                <Compass className="w-5 h-5 text-white" />
              </div>
              <span className="font-display font-extrabold text-xl text-stone-900">
                Trip<span className="text-[#0d9488]">Planner</span>
              </span>
            </div>
            <p className="text-xs text-stone-600 leading-relaxed max-w-sm font-normal">
              Camera roll screenshot to day-by-day vacation itinerary engine. Powered by Gemini Vision API and OpenStreetMap Nominatim place enrichment.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-teal-50 text-teal-900 border border-teal-200">
                <Sparkles className="w-3 h-3 text-teal-600" /> AI Vision Engine
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-900 border border-amber-200">
                <Globe className="w-3 h-3 text-amber-600" /> Nominatim OSM
              </span>
            </div>
          </div>

          {/* Quick Navigation Links */}
          <div className="space-y-3">
            <h4 className="font-display font-bold text-xs uppercase tracking-wider text-stone-900">
              Quick Navigation
            </h4>
            <ul className="space-y-2 text-xs font-semibold">
              <li>
                <Link href="/" className="hover:text-[#0d9488] transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/planner" className="hover:text-[#0d9488] transition-colors">
                  Trip Planner
                </Link>
              </li>
              <li>
                <Link href="/trips" className="hover:text-[#0d9488] transition-colors">
                  My Saved Trips
                </Link>
              </li>
              <li>
                <Link href="/destinations" className="hover:text-[#0d9488] transition-colors">
                  Explore Destinations
                </Link>
              </li>
            </ul>
          </div>

          {/* Product & Support Links */}
          <div className="space-y-3">
            <h4 className="font-display font-bold text-xs uppercase tracking-wider text-stone-900">
              Company
            </h4>
            <ul className="space-y-2 text-xs font-semibold">
              <li>
                <Link href="/about" className="hover:text-[#0d9488] transition-colors">
                  About TripPlanner
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-[#0d9488] transition-colors">
                  Contact & Feedback
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-[#f4eee6] flex flex-col sm:flex-row items-center justify-between text-xs text-stone-500 gap-3">
          <p>© {new Date().getFullYear()} TripPlanner AI. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Built with <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" /> for wanderlust travelers.
          </p>
        </div>
      </div>
    </footer>
  );
}
