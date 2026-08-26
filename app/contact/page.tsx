"use client";

import React, { useState } from "react";
import { Send, CheckCircle2, MessageSquare, Sparkles } from "lucide-react";

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [category, setCategory] = useState("feedback");
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) return;
    setSubmitted(true);
  };

  return (
    <div className="w-full min-h-screen bg-[#FAEEE6] text-[#111318]">
      <main className="max-w-[1000px] w-full mx-auto px-4 sm:px-6 lg:px-12 py-12 space-y-8 contain-paint">
      <div className="text-center space-y-2">
        <span className="stamp-badge stamp-pink">GET IN TOUCH</span>
        <h1 className="font-display font-extrabold text-3xl sm:text-5xl text-[#073B3A] pt-1">
          Got a bug? Found a hidden gem? <br /> Just want to say hi?
        </h1>
        <p className="text-xs text-[#073B3A]/80 font-normal">
          We’d love to hear your travel feedback, feature ideas, or screenshot processing questions!
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-[#e2d9cc] p-6 sm:p-8 shadow-2xl">
        {submitted ? (
          <div className="py-12 text-center space-y-3 animate-fade-in">
            <CheckCircle2 className="w-12 h-12 text-[#FF2D78] mx-auto" />
            <h3 className="font-display font-bold text-xl text-[#073B3A]">
              Message Received!
            </h3>
            <p className="text-xs text-[#073B3A]/80 max-w-sm mx-auto font-normal">
              Thank you for reaching out. We appreciate your feedback and will get back to you shortly.
            </p>
            <button
              type="button"
              onClick={() => {
                setSubmitted(false);
                setName("");
                setEmail("");
                setCategory("feedback");
                setMessage("");
              }}
              className="mt-4 px-4 py-2 rounded-xl bg-[#073B3A] text-white font-bold text-xs shadow-sm"
            >
              Send Another Message
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#073B3A]">Your Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jane Doe"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#e2d9cc] bg-white text-xs font-bold text-[#073B3A] focus:outline-none focus:ring-2 focus:ring-[#FF2D78]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#073B3A]">Your Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jane@example.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#e2d9cc] bg-white text-xs font-bold text-[#073B3A] focus:outline-none focus:ring-2 focus:ring-[#FF2D78]"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#073B3A]">What is this regarding?</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#e2d9cc] bg-white text-xs font-bold text-[#073B3A] focus:outline-none focus:ring-2 focus:ring-[#FF2D78]"
              >
                <option value="feedback">General Feedback & Ideas</option>
                <option value="bug">Report an Issue / Bug</option>
                <option value="feature">Suggest a Feature</option>
                <option value="hello">Just Saying Hi!</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#073B3A]">Message / Feedback</label>
              <textarea
                required
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Share your thoughts, suggest a feature, or report an issue..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#e2d9cc] bg-white text-xs text-[#073B3A] focus:outline-none focus:ring-2 focus:ring-[#FF2D78]"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl bg-[#FF2D78] hover:bg-[#e02068] text-white font-extrabold text-xs shadow-lg glow-pink-shadow transition-all flex items-center justify-center gap-2 active:scale-95"
            >
              <Send className="w-4 h-4" /> Send Message
            </button>
          </form>
        )}
      </div>
    </main>
    </div>
  );
}
