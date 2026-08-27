import { supabase, isSupabaseConfigured } from "./supabase";
import { TripContext } from "@/context/TripContext";
import { ExtractedPlace, PlaceCategory } from "@/lib/vision";
import { TripSchedule, recalculateDayMetrics } from "@/lib/itineraryEngine";

/**
 * Ensures any string ID (e.g. "trip-default", "ai-text-123", "manual-456")
 * is converted to a valid PostgreSQL UUID format deterministically.
 */
export function ensureValidUuid(id: string): string {
  if (!id) return "00000000-0000-4000-8000-000000000000";
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return id;
  }
  let hash1 = 0;
  let hash2 = 0;
  for (let i = 0; i < id.length; i++) {
    const char = id.charCodeAt(i);
    hash1 = (hash1 << 5) - hash1 + char;
    hash1 |= 0;
    hash2 = (hash2 << 7) - hash2 + char;
    hash2 |= 0;
  }
  const hex1 = Math.abs(hash1).toString(16).padStart(8, "0").slice(0, 8);
  const hex2 = Math.abs(hash2).toString(16).padStart(4, "0").slice(0, 4);
  const hex3 = Math.abs(hash1 ^ hash2).toString(16).padStart(4, "0").slice(0, 4);
  const hex4 = Math.abs(hash2).toString(16).padStart(12, "0").slice(0, 12);
  return `${hex1}-${hex2}-4${hex3.slice(1)}-8${hex4.slice(1, 4)}-${hex4}`;
}

export async function fetchUserTripsFromSupabase(): Promise<TripContext[] | null> {
  if (!isSupabaseConfigured() || !supabase) return null;

  try {
    const { data: tripsData, error: tripsError } = await supabase
      .from("trips")
      .select("*")
      .order("created_at", { ascending: false });

    if (tripsError || !tripsData) {
      console.warn("Supabase fetch trips error:", tripsError);
      return null;
    }

    const loadedTrips: TripContext[] = [];

    for (const rawTrip of tripsData) {
      const tripId = rawTrip.id;

      // Fetch places for this trip
      const { data: placesData } = await supabase
        .from("places")
        .select("*")
        .eq("trip_id", tripId);

      // Fetch itinerary items for this trip
      const { data: itemsData } = await supabase
        .from("itinerary_items")
        .select("*")
        .eq("trip_id", tripId)
        .order("sort_order", { ascending: true });

      const placesMap = new Map<string, ExtractedPlace>();
      const extractedPlaces: ExtractedPlace[] = [];

      if (Array.isArray(placesData)) {
        for (const p of placesData) {
          const placeObj: ExtractedPlace = {
            id: p.id,
            title: p.title,
            category: p.category as PlaceCategory,
            locationHint: p.location_hint || undefined,
            address: p.address || undefined,
            city: p.city || undefined,
            latitude: p.latitude || undefined,
            longitude: p.longitude || undefined,
            confidence: p.confidence || undefined,
            rawDetectedText: p.raw_detected_text || undefined,
            notes: p.notes || undefined,
            estimatedCost: p.estimated_cost || undefined,
            enrichmentStatus: p.enrichment_status || "pending",
          };
          placesMap.set(p.id, placeObj);
          extractedPlaces.push(placeObj);
        }
      }

      // Reconstruct customSchedule
      let customSchedule: TripSchedule | undefined;

      if (Array.isArray(itemsData) && itemsData.length > 0) {
        customSchedule = {};
        for (const item of itemsData) {
          const dayNum = item.day_number;
          const slot = item.slot as "morning" | "afternoon" | "evening" | "accommodations";
          const placeObj = placesMap.get(item.place_id);

          if (!placeObj) continue;

          if (!customSchedule[dayNum]) {
            customSchedule[dayNum] = {
              dayNumber: dayNum,
              morning: [],
              afternoon: [],
              evening: [],
              accommodations: [],
              totalDistanceKm: 0,
              totalTravelMinutes: 0,
            };
          }

          if (slot === "accommodations") {
            if (!customSchedule[dayNum].accommodations) customSchedule[dayNum].accommodations = [];
            customSchedule[dayNum].accommodations!.push(placeObj);
          } else {
            customSchedule[dayNum][slot].push(placeObj);
          }
        }

        // Recalculate travel metrics for each day schedule
        for (const dKey in customSchedule) {
          const dNum = parseInt(dKey, 10);
          customSchedule[dNum] = recalculateDayMetrics(customSchedule[dNum]);
        }
      }

      loadedTrips.push({
        id: tripId,
        destination: rawTrip.destination,
        startDate: rawTrip.start_date,
        endDate: rawTrip.end_date,
        screenshots: [],
        extractedPlaces,
        customSchedule,
        isItineraryGenerated: rawTrip.is_itinerary_generated || false,
        createdAt: new Date(rawTrip.created_at),
      });
    }

    return loadedTrips;
  } catch (err) {
    console.error("Supabase load exception:", err);
    return null;
  }
}

export async function saveTripToSupabase(trip: TripContext, userId?: string): Promise<boolean> {
  if (!isSupabaseConfigured() || !supabase) return false;

  try {
    const dbTripId = ensureValidUuid(trip.id);
    let targetUserId = userId;
    if (!targetUserId) {
      const { data: authData } = await supabase.auth.getUser();
      targetUserId = authData?.user?.id;
    }

    // 1. Upsert trip record
    const tripPayload: Record<string, unknown> = {
      id: dbTripId,
      destination: trip.destination || "Trip",
      start_date: trip.startDate,
      end_date: trip.endDate,
      is_itinerary_generated: trip.isItineraryGenerated,
      updated_at: new Date().toISOString(),
    };

    if (targetUserId) {
      tripPayload.user_id = targetUserId;
    }

    const { error: tripError } = await supabase
      .from("trips")
      .upsert(tripPayload);

    if (tripError) {
      console.warn("Error upserting trip to Supabase:", tripError);
      return false;
    }

    // 2. Upsert places
    if (trip.extractedPlaces && trip.extractedPlaces.length > 0) {
      const placesPayload = trip.extractedPlaces.map((p) => ({
        id: ensureValidUuid(p.id),
        trip_id: dbTripId,
        title: p.title,
        category: p.category,
        location_hint: p.locationHint || null,
        address: p.address || null,
        city: p.city || null,
        latitude: p.latitude || null,
        longitude: p.longitude || null,
        confidence: p.confidence || null,
        raw_detected_text: p.rawDetectedText || null,
        notes: p.notes || null,
        estimated_cost: p.estimatedCost || null,
        enrichment_status: p.enrichmentStatus || "pending",
      }));

      await supabase.from("places").upsert(placesPayload);
    }

    // 3. Sync itinerary items if customSchedule exists
    if (trip.customSchedule) {
      // Clear existing items for clean sync
      await supabase.from("itinerary_items").delete().eq("trip_id", dbTripId);

      const itemsPayload: Record<string, unknown>[] = [];

      for (const dKey in trip.customSchedule) {
        const dayNum = parseInt(dKey, 10);
        const daySched = trip.customSchedule[dayNum];
        if (!daySched) continue;

        const slots: ("morning" | "afternoon" | "evening" | "accommodations")[] = [
          "morning",
          "afternoon",
          "evening",
          "accommodations",
        ];

        for (const slot of slots) {
          const list = daySched[slot] || [];
          list.forEach((p, idx) => {
            itemsPayload.push({
              trip_id: dbTripId,
              place_id: ensureValidUuid(p.id),
              day_number: dayNum,
              slot,
              sort_order: idx,
            });
          });
        }
      }

      if (itemsPayload.length > 0) {
        await supabase.from("itinerary_items").insert(itemsPayload);
      }
    }

    return true;
  } catch (err) {
    console.error("Supabase save exception:", err);
    return false;
  }
}

export async function deleteTripFromSupabase(tripId: string): Promise<boolean> {
  if (!isSupabaseConfigured() || !supabase) return false;

  try {
    const dbTripId = ensureValidUuid(tripId);
    const { error } = await supabase.from("trips").delete().eq("id", dbTripId);
    return !error;
  } catch (err) {
    console.error("Supabase delete exception:", err);
    return false;
  }
}

export interface UserProfile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at?: string;
  updated_at?: string;
}

export async function fetchUserProfile(userId: string): Promise<UserProfile | null> {
  if (!isSupabaseConfigured() || !supabase || !userId) return null;

  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error || !data) return null;

    return {
      id: data.id,
      display_name: data.display_name || null,
      avatar_url: data.avatar_url || null,
      created_at: data.created_at,
      updated_at: data.updated_at,
    };
  } catch (err) {
    console.error("Error fetching user profile:", err);
    return null;
  }
}

export async function updateUserProfile(
  userId: string,
  updates: Partial<UserProfile>
): Promise<boolean> {
  if (!isSupabaseConfigured() || !supabase || !userId) return false;

  try {
    const { error } = await supabase
      .from("profiles")
      .upsert({
        id: userId,
        ...updates,
        updated_at: new Date().toISOString(),
      });

    return !error;
  } catch (err) {
    console.error("Error updating user profile:", err);
    return false;
  }
}
