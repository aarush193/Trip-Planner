"use client";

import React, { useState } from "react";
import { Send, CheckCircle2, MessageSquare, Sparkles, HelpCircle, Mail, User, LifeBuoy } from "lucide-react";

const QUICK_TEMPLATES = [
  {
    label: "💡 Feature Suggestion",
    category: "feature",
    text: "Hi TripPlanner team, I love the screenshot parsing engine! It would be fantastic if we could export generated itineraries to Google Maps or PDF.",
  },
  {
    label: "🔍 Screenshot Issue",
    category: "bug",
    text: "Hello, I uploaded a travel reel screenshot and wanted to share feedback regarding landmark detection accuracy for my destination.",
  },
  {
    label: "🤝 Partnership Inquiry",
    category: "feedback",
    text: "Hi team, I represent a travel publication and would love to discuss integrating TripPlanner's itinerary engine with our content.",
  },
];

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [category, setCategory] = useState("feedback");
  const [message, setMessage] = useState("");

  const applyTemplate = (tmpl: typeof QUICK_TEMPLATES[0]) => {
    setCategory(tmpl.category);
    setMessage(tmpl.text);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) return;
    setSubmitted(true);
  };

  return (
    <div className="w-full min-h-screen bg-[#F5EFE5] text-[#111318]">
      <main className="max-w-[1050px] w-full mx-auto px-4 sm:px-6 lg:px-12 py-12 space-y-10 contain-paint">
        {/* PAGE HEADER */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-[10px] font-black tracking-widest bg-[#073B3A] text-white uppercase shadow-xs">
            <Sparkles className="w-3 h-3 text-[#19D3C5]" /> CONCIERGE & SUPPORT
          </div>
          <h1 className="font-display font-extrabold text-4xl sm:text-6xl text-[#073B3A] tracking-tight">
            Connect with the TripPlanner Team
          </h1>
          <p className="text-sm sm:text-base text-[#073B3A]/80 font-medium max-w-xl mx-auto leading-relaxed">
            Have questions about screenshot Vision AI parsing, feature requests, or custom itinerary logic? We are here to help.
          </p>
        </div>

        {/* QUICK SUGGESTION TEMPLATE CHIPS */}
        <div className="bg-[#FAF6EE] rounded-3xl border-2 border-[#E8DFC8] p-6 shadow-sm space-y-3">
          <p className="text-xs font-black uppercase text-[#073B3A] tracking-wider flex items-center gap-1.5">
            <HelpCircle className="w-4 h-4 text-[#FF2D78]" /> Quick Message Templates (Click to fill):
          </p>
          <div className="flex flex-wrap gap-2.5">
            {QUICK_TEMPLATES.map((tmpl, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => applyTemplate(tmpl)}
                className="px-4 py-2 rounded-2xl bg-white hover:bg-[#073B3A] hover:text-white border-2 border-[#E8DFC8] text-[#073B3A] text-xs font-extrabold transition-all shadow-2xs active:scale-95"
              >
                {tmpl.label}
              </button>
            ))}
          </div>
        </div>

        {/* FORM CONTAINER */}
        <div className="bg-white rounded-[2.5rem] border-2 border-[#E8DFC8] p-8 sm:p-12 shadow-2xl space-y-6">
          {submitted ? (
            <div className="py-16 text-center space-y-4 animate-fade-in">
              <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto shadow-md">
                <CheckCircle2 className="w-9 h-9 text-emerald-600" />
              </div>
              <div className="space-y-1">
                <h3 className="font-display font-black text-2xl text-[#073B3A]">
                  Message Successfully Dispatched
                </h3>
                <p className="text-xs text-[#073B3A]/80 max-w-md mx-auto font-medium leading-relaxed">
                  Thank you for reaching out, {name || "Voyageur"}. Our team has received your message regarding {category} and will follow up with you at {email}.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSubmitted(false);
                  setName("");
                  setEmail("");
                  setCategory("feedback");
                  setMessage("");
                }}
                className="mt-4 px-6 py-3 rounded-2xl bg-[#073B3A] hover:bg-[#FF2D78] text-white font-extrabold text-xs shadow-md transition-colors"
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="block text-xs font-black uppercase tracking-wider text-[#073B3A]">
                    Full Name *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-[#073B3A]/40 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Alex Rivera"
                      className="w-full pl-11 pr-4 py-3 rounded-2xl border-2 border-[#E8DFC8] bg-white text-xs font-bold text-[#073B3A] focus:outline-none focus:border-[#073B3A] transition-all shadow-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-black uppercase tracking-wider text-[#073B3A]">
                    Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-[#073B3A]/40 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="alex.rivera@voyageur.com"
                      className="w-full pl-11 pr-4 py-3 rounded-2xl border-2 border-[#E8DFC8] bg-white text-xs font-bold text-[#073B3A] focus:outline-none focus:border-[#073B3A] transition-all shadow-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-black uppercase tracking-wider text-[#073B3A]">
                  Topic / Area of Inquiry *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border-2 border-[#E8DFC8] bg-white text-xs font-bold text-[#073B3A] focus:outline-none focus:border-[#073B3A] transition-all shadow-xs"
                >
                  <option value="feedback">General Feedback & Experience</option>
                  <option value="feature">Feature Request or Export Integration</option>
                  <option value="bug">Report Landmark Parsing Issue</option>
                  <option value="partnership">Partnership & Media Inquiry</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-black uppercase tracking-wider text-[#073B3A]">
                  Your Detailed Message *
                </label>
                <textarea
                  required
                  rows={5}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe your suggestion, technical question, or feedback in detail..."
                  className="w-full p-4 rounded-2xl border-2 border-[#E8DFC8] bg-white text-xs font-medium text-[#073B3A] focus:outline-none focus:border-[#073B3A] transition-all shadow-xs leading-relaxed"
                />
              </div>

              <button
                type="submit"
                className="w-full py-4 rounded-2xl bg-[#FF2D78] hover:bg-[#E02068] text-white font-black text-xs shadow-lg glow-pink-shadow transition-all flex items-center justify-center gap-2 active:scale-95 mt-4"
              >
                <Send className="w-4 h-4 text-white" />
                <span>Submit Inquiry to Concierge</span>
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
