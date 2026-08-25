import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Outfit } from "next/font/google";
import "./globals.css";
import { TripProvider } from "@/context/TripContext";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const outfit = Outfit({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "TripPlanner | Camera Roll Screenshot to Day-by-Day Itinerary Engine",
  description: "Upload travel screenshots from your camera roll and generate custom day-by-day travel itineraries.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${plusJakartaSans.variable} ${outfit.variable} h-full antialiased scroll-smooth`}
    >
      <body className="min-h-full flex flex-col font-sans bg-[#faf7f2] text-stone-900 selection:bg-teal-500/20 selection:text-teal-900">
        <TripProvider>
          <Navbar />
          <div className="flex-1">{children}</div>
          <Footer />
        </TripProvider>
      </body>
    </html>
  );
}
