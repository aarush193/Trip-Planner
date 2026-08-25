"use client";

import React, { useState } from "react";
import { Mail, Send, CheckCircle2, MessageSquare } from "lucide-react";

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) return;
    setSubmitted(true);
  };

  return (
    <main className="max-w-2xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-extrabold bg-teal-50 text-teal-900 border border-teal-200">
          <MessageSquare className="w-3.5 h-3.5 text-[#0d9488]" /> Get in Touch
        </div>
        <h1 className="font-display font-extrabold text-3xl text-stone-900">
          Contact & Feedback
        </h1>
        <p className="text-xs text-stone-600">
          Have feedback, feature requests, or questions about TripPlanner AI? Send us a message!
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-[#e6dfd5] p-6 sm:p-8 shadow-travel">
        {submitted ? (
          <div className="py-12 text-center space-y-3 animate-fade-in">
            <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
            <h3 className="font-display font-bold text-xl text-stone-900">
              Message Received!
            </h3>
            <p className="text-xs text-stone-600 max-w-sm mx-auto">
              Thank you for reaching out. We appreciate your feedback and will get back to you shortly.
            </p>
            <button
              type="button"
              onClick={() => {
                setSubmitted(false);
                setName("");
                setEmail("");
                setMessage("");
              }}
              className="mt-4 px-4 py-2 rounded-xl bg-teal-50 text-[#0d9488] font-bold text-xs border border-teal-200"
            >
              Send Another Message
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-stone-700">Your Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Doe"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#e6dfd5] text-xs font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#0d9488]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-stone-700">Your Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jane@example.com"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#e6dfd5] text-xs font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#0d9488]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-stone-700">Message / Feedback</label>
              <textarea
                required
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Share your thoughts, suggest a feature, or report an issue..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#e6dfd5] text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#0d9488]"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl bg-[#0d9488] hover:bg-[#0f766e] text-white font-extrabold text-xs shadow-travel transition-all flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" /> Send Message
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
