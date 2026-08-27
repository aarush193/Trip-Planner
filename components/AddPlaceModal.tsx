"use client";

import React, { useState } from "react";
import { ExtractedPlace, PlaceCategory } from "@/lib/vision";

interface AddPlaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalDays: number;
  activeDay: number;
  onAddPlace: (
    day: number,
    slot: "morning" | "afternoon" | "evening",
    place: ExtractedPlace
  ) => void;
}

export default function AddPlaceModal({
  isOpen,
  onClose,
  totalDays,
  activeDay,
  onAddPlace,
}: AddPlaceModalProps) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<PlaceCategory>("sightseeing");
  const [selectedDay, setSelectedDay] = useState(activeDay || 1);
  const [selectedSlot, setSelectedSlot] = useState<"morning" | "afternoon" | "evening">("afternoon");
  const [locationHint, setLocationHint] = useState("");
  const [notes, setNotes] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newPlace: ExtractedPlace = {
      id: `manual-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      title: title.trim(),
      category,
      locationHint: locationHint.trim() || undefined,
      notes: notes.trim() || undefined,
      confidence: 1.0,
      enrichmentStatus: "pending",
    };

    onAddPlace(selectedDay, selectedSlot, newPlace);

    // Reset form
    setTitle("");
    setLocationHint("");
    setNotes("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-[#FAF6EE] rounded-3xl border border-[#E8DFC8] shadow-2xl p-6 md:p-8">
        <div className="flex items-center justify-between pb-4 border-b border-[#E8DFC8]/60 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#0F4C3A]/10 text-[#0F4C3A] flex items-center justify-center font-bold text-lg">
              +
            </div>
            <div>
              <h3 className="text-xl font-bold text-[#111318] tracking-tight">Add Place to Itinerary</h3>
              <p className="text-xs text-[#111318]/60 font-medium">Manually insert an attraction or activity</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#E8DFC8]/40 hover:bg-[#E8DFC8] text-[#111318]/70 flex items-center justify-center font-bold transition-all"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase text-[#111318]/70 tracking-wider mb-1">
              Place Name *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Belém Tower, Time Out Market..."
              className="w-full px-4 py-3 rounded-2xl border border-[#E8DFC8] bg-white text-[#111318] font-medium text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C3A] transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase text-[#111318]/70 tracking-wider mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as PlaceCategory)}
                className="w-full px-3 py-3 rounded-2xl border border-[#E8DFC8] bg-white text-[#111318] font-medium text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C3A] transition-all"
              >
                <option value="sightseeing">Sightseeing</option>
                <option value="culture">Culture & Art</option>
                <option value="food">Food & Dining</option>
                <option value="activity">Activity & Nature</option>
                <option value="shopping">Shopping</option>
                <option value="stay">Hotel / Stay</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-[#111318]/70 tracking-wider mb-1">
                Target Day
              </label>
              <select
                value={selectedDay}
                onChange={(e) => setSelectedDay(parseInt(e.target.value, 10))}
                className="w-full px-3 py-3 rounded-2xl border border-[#E8DFC8] bg-white text-[#111318] font-medium text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C3A] transition-all"
              >
                {Array.from({ length: totalDays }, (_, i) => i + 1).map((d) => (
                  <option key={d} value={d}>
                    Day {d}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase text-[#111318]/70 tracking-wider mb-1">
                Time Slot
              </label>
              <select
                value={selectedSlot}
                onChange={(e) => setSelectedSlot(e.target.value as "morning" | "afternoon" | "evening")}
                className="w-full px-3 py-3 rounded-2xl border border-[#E8DFC8] bg-white text-[#111318] font-medium text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C3A] transition-all"
              >
                <option value="morning">Morning 🌅</option>
                <option value="afternoon">Afternoon ☀️</option>
                <option value="evening">Evening 🌙</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-[#111318]/70 tracking-wider mb-1">
                Location Hint
              </label>
              <input
                type="text"
                value={locationHint}
                onChange={(e) => setLocationHint(e.target.value)}
                placeholder="e.g. Lisbon, Portugal"
                className="w-full px-4 py-3 rounded-2xl border border-[#E8DFC8] bg-white text-[#111318] font-medium text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C3A] transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-[#111318]/70 tracking-wider mb-1">
              Notes / Tip (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Book tickets in advance, Best sunset view"
              className="w-full px-4 py-3 rounded-2xl border border-[#E8DFC8] bg-white text-[#111318] font-medium text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C3A] transition-all"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E8DFC8]/60 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-3 rounded-2xl bg-[#E8DFC8]/40 hover:bg-[#E8DFC8] text-[#111318] font-bold text-sm transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-3 rounded-2xl bg-[#0F4C3A] hover:bg-[#0A3629] text-white font-bold text-sm shadow-md transition-all"
            >
              Add to Itinerary
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
