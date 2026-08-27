# 🧭 TripPlanner Studio · Screenshot-to-Itinerary Engine

**TripPlanner** is a modern, AI Vision-powered travel planning web application. It transforms camera-roll screenshots (from Instagram Reels, TikToks, or travel clips) into distance-optimized, day-by-day travel itineraries.

---

## ✨ Features

- **📸 Camera Roll Screenshot Parsing**: Upload travel screenshots and extract place titles, categories, and notes using Google Gemini Vision.
- **🌍 Global Geographic Geocoding & Enrichment**: Geocodes landmarks worldwide using Nominatim OpenStreetMap with automatic geographic boundary validation.
- **📍 Smart Distance-Optimized Scheduling**: Haversine clustering algorithms automatically group nearby spots into morning, afternoon, and evening slots while calculating transit distances & travel times.
- **✏️ Interactive Dynamic Itinerary Editor**: Reorder places (`▲`/`▼`), move spots across days/time slots, adjust total trip duration (+/- Days), and add custom places manually.
- **👤 Guest-First & Supabase Auth**: Guests can build and edit itineraries locally. Authentication (Email + Password) with Supabase enables cloud persistence across devices.
- **⚡ Automatic Database Profile Triggers**: Instant 1-to-1 `public.profiles` row creation upon user sign-up via PostgreSQL database triggers.
- **🎨 Editorial Emerald & Warm Cream Design System**: Built with modern typography (Outfit + Plus Jakarta Sans), dark green accents (`#073B3A`), vibrant pink highlights (`#FF2D78`), and glassmorphism cards.

---

## 🗺️ Application Routes

- `/` — **Homepage**: Editorial showcase, vision features, and curated destinations.
- `/planner` — **Trip Planner Studio**: Interactive camera-roll upload, text planning, dynamic place editor, and distance-optimized day schedules.
- `/trips` — **My Saved Trips**: Saved passport archive, guest mode indicator, and trip management.
- `/destinations` — **Destinations**: Explore global travel destinations with pre-filtered itinerary templates.
- `/about` — **About**: The story behind TripPlanner, problem statement, and engine architecture.
- `/contact` — **Contact & Feedback**: Interactive contact form and feedback submission.
- `/login` — **Authentication**: Email + Password sign-in and account registration.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router, Turbopack, React 19)
- **Styling**: Tailwind CSS, Lucide React Icons
- **Database & Auth**: Supabase (PostgreSQL, Row Level Security, Database Triggers)
- **AI & Geocoding**: Google Gemini Vision API, Nominatim OpenStreetMap API
- **Testing**: Node / `tsx` test suite (36 offline engine tests)

---

## 🚀 Getting Started

### 1. Prerequisites

Node.js `v18.x` or later.

### 2. Environment Setup

Create a `.env.local` file in the project root:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Gemini AI Vision Key
GEMINI_API_KEY=your-gemini-api-key-here
```

### 3. Installation & Run

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Production Build
npm run build
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🗄️ Database Setup (Supabase SQL Script)

Run the following script in the **[Supabase SQL Editor](https://supabase.com/dashboard)** to set up the database schema, RLS policies, and profile trigger:

```sql
-- 1. Trips Table
CREATE TABLE IF NOT EXISTS public.trips (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  destination TEXT NOT NULL,
  start_date DATE,
  end_date DATE,
  is_itinerary_generated BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Places Table
CREATE TABLE IF NOT EXISTS public.places (
  id UUID PRIMARY KEY,
  trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT DEFAULT 'sightseeing',
  address TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  image_url TEXT,
  rating DOUBLE PRECISION,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Itinerary Items Table
CREATE TABLE IF NOT EXISTS public.itinerary_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE,
  place_id UUID REFERENCES public.places(id) ON DELETE CASCADE,
  day_number INT NOT NULL,
  slot TEXT NOT NULL, -- 'morning', 'afternoon', 'evening', 'accommodations'
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. User Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Enable Row Level Security (RLS)
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.places ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itinerary_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies
CREATE POLICY "Users access own trips" ON public.trips
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users access own places" ON public.places
  FOR ALL USING (EXISTS (SELECT 1 FROM public.trips WHERE trips.id = places.trip_id AND trips.user_id = auth.uid()));

CREATE POLICY "Users access own itinerary items" ON public.itinerary_items
  FOR ALL USING (EXISTS (SELECT 1 FROM public.trips WHERE trips.id = itinerary_items.trip_id AND trips.user_id = auth.uid()));

CREATE POLICY "Users access own profile" ON public.profiles
  FOR ALL USING (auth.uid() = id);

-- 7. Automatic Profile Creation Trigger Function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO UPDATE SET display_name = EXCLUDED.display_name, updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

---

## 🧪 Testing

Run the automated test suite containing 36 offline unit & engine tests:

```bash
npx tsx lib/engine.test.ts
```

All 36 test suites verify scheduling algorithms, Haversine clustering, boundary filtering, slot balancing, UUID normalization, and Supabase persistence lifecycle offline.

---

## 📝 License

Licensed under the MIT License.
