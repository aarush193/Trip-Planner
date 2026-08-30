"use client";

import React, { createContext, useContext, useState, useMemo, useEffect } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { fetchUserTripsFromSupabase, saveTripToSupabase, deleteTripFromSupabase, fetchUserProfile, UserProfile } from "@/lib/supabaseService";
import { ExtractedPlace, UploadedScreenshot } from "@/lib/vision";
import { enrichPlaces } from "@/lib/enrichment";
import { deduplicatePlaces, TripSchedule, DaySchedule, recalculateDayMetrics, buildItinerary } from "@/lib/itineraryEngine";
import { AuthGateModal } from "@/components/AuthGateModal";

export interface TripContext {
  id: string;
  destination: string;
  startDate: string;
  endDate: string;
  screenshots: UploadedScreenshot[];
  extractedPlaces: ExtractedPlace[];
  customSchedule?: TripSchedule;
  isItineraryGenerated: boolean;
  createdAt: Date;
}

interface TripContextType {
  trips: TripContext[];
  activeTripId: string;
  activeTrip: TripContext;
  user: User | null;
  session: Session | null;
  userProfile: UserProfile | null;
  isLoadingAuth: boolean;
  handleSignOut: () => Promise<void>;
  setActiveTripId: (id: string) => void;
  setTrips: React.Dispatch<React.SetStateAction<TripContext[]>>;
  updateActiveTrip: (
    updates: Partial<TripContext> | ((prev: TripContext) => Partial<TripContext>)
  ) => void;
  handleCreateNewTrip: () => void;
  handleSelectDestination: (targetDest: string) => void;
  commitAnalysisResults: (
    sourceTripId: string,
    screenshotsAnalyzed: UploadedScreenshot[],
    extractedPlaces: ExtractedPlace[],
    fallbackDest?: string,
    tripDays?: number
  ) => void;
  inferDestinationFromPlaces: (places: ExtractedPlace[]) => string | undefined;
  movePlaceInSchedule: (
    fromDay: number,
    fromSlot: "morning" | "afternoon" | "evening",
    toDay: number,
    toSlot: "morning" | "afternoon" | "evening",
    placeId: string
  ) => void;
  removePlaceFromSchedule: (
    day: number,
    slot: "morning" | "afternoon" | "evening",
    placeId: string
  ) => void;
  reorderPlaceInSlot: (
    day: number,
    slot: "morning" | "afternoon" | "evening",
    fromIndex: number,
    toIndex: number
  ) => void;
  addPlaceToSchedule: (
    day: number,
    slot: "morning" | "afternoon" | "evening",
    newPlace: ExtractedPlace
  ) => void;
  updateTripDuration: (newDays: number, newStartDate?: string) => void;
  resetActiveTrip: () => void;
  clearPlannerPlaces: () => void;
  deleteTrip: (tripId: string) => Promise<void>;
  deletePlaceFromTrip: (tripId: string, placeId: string) => void;
  updatePlaceInTrip: (tripId: string, placeId: string, updates: Partial<ExtractedPlace>) => void;
  clearPlacesFromTrip: (tripId: string) => void;
  isAuthGateModalOpen: boolean;
  authGateReason: "save_trip" | "my_trips" | null;
  openAuthGate: (reason?: "save_trip" | "my_trips") => void;
  closeAuthGate: () => void;
  handleSaveTripToCloud: () => Promise<boolean>;
}

const TripStateContext = createContext<TripContextType | undefined>(undefined);

export function TripProvider({ children }: { children: React.ReactNode }) {
  const [trips, setTrips] = useState<TripContext[]>([]);
  const [activeTripId, setActiveTripId] = useState<string>("");
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState<boolean>(true);
  const [isAuthGateModalOpen, setIsAuthGateModalOpen] = useState<boolean>(false);
  const [authGateReason, setAuthGateReason] = useState<"save_trip" | "my_trips" | null>(null);

  const openAuthGate = (reason: "save_trip" | "my_trips" = "save_trip") => {
    setAuthGateReason(reason);
    setIsAuthGateModalOpen(true);
  };

  const closeAuthGate = () => {
    setIsAuthGateModalOpen(false);
    setAuthGateReason(null);
  };

  // Hydrate trips from localStorage on client mount (guest persistence)
  useEffect(() => {
    try {
      const savedLocal = typeof window !== "undefined" ? localStorage.getItem("tripplanner_saved_trips") : null;
      if (savedLocal) {
        const parsed = JSON.parse(savedLocal);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setTrips((prev) => (prev.length === 0 ? parsed : prev));
          setActiveTripId((prev) => (!prev ? parsed[0].id : prev));
        }
      }
    } catch (e) {
      console.warn("Could not load trips from localStorage:", e);
    }
  }, []);

  // Sync trips to localStorage on state changes
  useEffect(() => {
    if (typeof window !== "undefined" && trips.length > 0) {
      try {
        localStorage.setItem("tripplanner_saved_trips", JSON.stringify(trips));
      } catch (e) {
        console.warn("Could not write trips to localStorage:", e);
      }
    }
  }, [trips]);

  // Hydrate trips & profile from Supabase and listen to auth state changes
  useEffect(() => {
    if (!isSupabaseConfigured() || !supabase) {
      setIsLoadingAuth(false);
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoadingAuth(false);

      if (session?.user) {
        fetchUserProfile(session.user.id).then((profile) => setUserProfile(profile));
        fetchUserTripsFromSupabase().then((dbTrips) => {
          if (dbTrips && dbTrips.length > 0) {
            setTrips(dbTrips);
            setActiveTripId(dbTrips[0].id);
          }
        });
      }
    });

    // Listen for auth state changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoadingAuth(false);

      if (session?.user) {
        fetchUserProfile(session.user.id).then((profile) => setUserProfile(profile));
        fetchUserTripsFromSupabase().then(async (dbTrips) => {
          if (dbTrips && dbTrips.length > 0) {
            setTrips(dbTrips);
            setActiveTripId(dbTrips[0].id);
          } else {
            // Auto-migrate guest trip if existing on fresh signup
            setTrips((prevTrips) => {
              const currentActive = prevTrips.find((t) => t.id === activeTripId) || prevTrips[0];
              if (currentActive && currentActive.extractedPlaces.length > 0) {
                saveTripToSupabase(currentActive, session.user.id);
              }
              return prevTrips;
            });
          }
        });
      } else {
        setUserProfile(null);
        // Reset trips on sign out
        setTrips([]);
        setActiveTripId("");
        try {
          if (typeof window !== "undefined") {
            localStorage.removeItem("tripplanner_saved_trips");
          }
        } catch (e) {}
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSaveTripToCloud = async (): Promise<boolean> => {
    if (!user) {
      openAuthGate("save_trip");
      return false;
    }

    const currentTrip = trips.find((t) => t.id === activeTripId) || trips[0];
    if (currentTrip) {
      const success = await saveTripToSupabase(currentTrip, user.id);
      return success;
    }
    return false;
  };

  const handleSignOut = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
  };

  const fallbackBlankTrip = useMemo<TripContext>(() => ({
    id: activeTripId || "trip-guest-draft",
    destination: "",
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date(Date.now() + 3 * 86400000).toISOString().split("T")[0],
    screenshots: [],
    extractedPlaces: [],
    isItineraryGenerated: false,
    createdAt: new Date(),
  }), [activeTripId]);

  const activeTrip = useMemo(() => {
    if (trips.length === 0) return fallbackBlankTrip;
    return trips.find((t) => t.id === activeTripId) || trips[0];
  }, [trips, activeTripId, fallbackBlankTrip]);

  // Debounced cloud sync only when user is authenticated
  useEffect(() => {
    if (!user || !activeTrip || !activeTrip.destination) return;
    const timer = setTimeout(() => {
      saveTripToSupabase(activeTrip, user.id);
    }, 2500);
    return () => clearTimeout(timer);
  }, [activeTrip, user]);

  const updateActiveTrip = (
    updates: Partial<TripContext> | ((prev: TripContext) => Partial<TripContext>)
  ) => {
    setTrips((prevTrips) => {
      const targetId = activeTripId || activeTrip.id;
      const targetIndex = prevTrips.findIndex((t) => t.id === targetId);

      if (targetIndex === -1) {
        const currentBase = activeTrip;
        const patch = typeof updates === "function" ? updates(currentBase) : updates;
        const newTrip = { ...currentBase, ...patch, id: targetId };
        if (!activeTripId) setActiveTripId(targetId);
        return [...prevTrips, newTrip];
      }

      return prevTrips.map((t) => {
        if (t.id !== targetId) return t;
        const patch = typeof updates === "function" ? updates(t) : updates;
        return { ...t, ...patch };
      });
    });
  };

  const handleCreateNewTrip = () => {
    const newTripId = `trip-${Date.now()}`;
    const today = new Date();
    const startIso = today.toISOString().split("T")[0];
    const endObj = new Date(today);
    endObj.setDate(today.getDate() + 3);
    const endIso = endObj.toISOString().split("T")[0];

    const newTrip: TripContext = {
      id: newTripId,
      destination: "",
      startDate: startIso,
      endDate: endIso,
      screenshots: [],
      extractedPlaces: [],
      isItineraryGenerated: false,
      createdAt: new Date(),
    };
    setTrips((prev) => [...prev, newTrip]);
    setActiveTripId(newTripId);
    return newTripId;
  };

  const handleSelectDestination = (targetDest: string) => {
    if (!targetDest.trim()) return;

    const targetNorm = targetDest.toLowerCase().trim();
    const existing = trips.find((t) => {
      const dNorm = t.destination.toLowerCase().trim();
      return dNorm && (dNorm.includes(targetNorm) || targetNorm.includes(dNorm));
    });

    if (existing) {
      setActiveTripId(existing.id);
    } else if (!activeTrip.destination.trim()) {
      updateActiveTrip({ destination: targetDest });
    } else {
      const newTripId = `trip-${Date.now()}`;
      const today = new Date();
      const startIso = today.toISOString().split("T")[0];
      const endObj = new Date(today);
      endObj.setDate(today.getDate() + 3);
      const endIso = endObj.toISOString().split("T")[0];

      const newTrip: TripContext = {
        id: newTripId,
        destination: targetDest,
        startDate: startIso,
        endDate: endIso,
        screenshots: [],
        extractedPlaces: [],
        isItineraryGenerated: false,
        createdAt: new Date(),
      };
      setTrips((prev) => [...prev, newTrip]);
      setActiveTripId(newTripId);
    }
  };

  const inferDestinationFromPlaces = (places: ExtractedPlace[]): string | undefined => {
    if (!places || places.length === 0) return undefined;

    // Count occurrences of locationHint or city dynamically across places
    const counts: Record<string, number> = {};
    for (const place of places) {
      const hint = (place.locationHint || place.city || "").trim();
      if (hint && hint.length > 2) {
        counts[hint] = (counts[hint] || 0) + 1;
      }
    }

    let topHint: string | undefined = undefined;
    let maxCount = 0;
    for (const hint in counts) {
      if (counts[hint] > maxCount) {
        maxCount = counts[hint];
        topHint = hint;
      }
    }

    if (topHint) return topHint;

    for (const place of places) {
      const text = `${place.title} ${place.notes || ""} ${place.rawDetectedText || ""}`;
      const match = text.match(/([A-Z][a-zA-Z\s]+,\s*[A-Z][a-zA-Z\s]+)/);
      if (match && match[1]) return match[1].trim();
    }
    return undefined;
  };

  const commitAnalysisResults = (
    sourceTripId: string,
    screenshotsAnalyzed: UploadedScreenshot[],
    extractedPlaces: ExtractedPlace[],
    fallbackDest?: string,
    tripDays?: number
  ) => {
    // Canonical destination precedence: explicit user request/selection takes absolute priority!
    const canonicalDest = (fallbackDest && fallbackDest.trim()) || inferDestinationFromPlaces(extractedPlaces) || "";
    const inferredDest = canonicalDest;
    const scrIds = new Set(screenshotsAnalyzed.map((s) => s.id));

    const calculateDates = (daysCount: number) => {
      const today = new Date();
      const startIso = today.toISOString().split("T")[0];
      const endDateObj = new Date(today);
      endDateObj.setDate(today.getDate() + Math.max(1, daysCount) - 1);
      const endIso = endDateObj.toISOString().split("T")[0];
      return { startIso, endIso };
    };

    setTrips((prevTrips) => {
      let targetTripId: string | null = null;
      const sourceTrip = prevTrips.find((t) => t.id === sourceTripId);

      if (sourceTrip) {
        const sourceDestNorm = sourceTrip.destination.toLowerCase().trim();
        const inferredNorm = inferredDest.toLowerCase().trim();

        if (
          !sourceDestNorm ||
          (inferredNorm && (sourceDestNorm.includes(inferredNorm) || inferredNorm.includes(sourceDestNorm)))
        ) {
          targetTripId = sourceTrip.id;
        }
      }

      if (!targetTripId && inferredDest) {
        const inferredNorm = inferredDest.toLowerCase().trim();
        const match = prevTrips.find((t) => {
          const dNorm = t.destination.toLowerCase().trim();
          return dNorm && (dNorm.includes(inferredNorm) || inferredNorm.includes(dNorm));
        });
        if (match) targetTripId = match.id;
      }

      const completedScreenshots: UploadedScreenshot[] = screenshotsAnalyzed.map((s) => ({
        ...s,
        status: "completed" as const,
        extractedCount: extractedPlaces.length,
      }));

      const daysToUse = tripDays && tripDays > 0 ? tripDays : undefined;
      const newDates = daysToUse ? calculateDates(daysToUse) : null;

      // Case 1: Target trip is an existing trip
      if (targetTripId) {
        const finalTargetId = targetTripId;
        setTimeout(() => setActiveTripId(finalTargetId), 0);

        return prevTrips.map((t) => {
          if (t.id === sourceTripId && sourceTripId !== finalTargetId) {
            return {
              ...t,
              screenshots: t.screenshots.filter((s) => !scrIds.has(s.id)),
            };
          }

          if (t.id === finalTargetId) {
            const updatedDest = t.destination.trim() || inferredDest || t.destination;
            const remainingScreenshots = t.screenshots.filter((s) => !scrIds.has(s.id));
            return {
              ...t,
              destination: updatedDest,
              startDate: newDates ? newDates.startIso : t.startDate,
              endDate: newDates ? newDates.endIso : t.endDate,
              screenshots: [...remainingScreenshots, ...completedScreenshots],
              extractedPlaces: deduplicatePlaces([...t.extractedPlaces, ...extractedPlaces]),
              isItineraryGenerated: true,
            };
          }

          return t;
        });
      }

      // Case 2: Create a NEW trip context for the different destination
      const initialDays = tripDays && tripDays > 0 ? tripDays : 3;
      const initialDates = calculateDates(initialDays);
      const newTripId = `trip-${Date.now()}`;
      const newTrip: TripContext = {
        id: newTripId,
        destination: inferredDest || "New Trip",
        startDate: initialDates.startIso,
        endDate: initialDates.endIso,
        screenshots: completedScreenshots,
        extractedPlaces: deduplicatePlaces(extractedPlaces),
        isItineraryGenerated: true,
        createdAt: new Date(),
      };

      setTimeout(() => setActiveTripId(newTripId), 0);

      return prevTrips
        .map((t) => {
          if (t.id === sourceTripId) {
            return {
              ...t,
              screenshots: t.screenshots.filter((s) => !scrIds.has(s.id)),
            };
          }
          return t;
        })
        .concat(newTrip);
    });

    if (extractedPlaces.length > 0) {
      enrichPlaces(
        extractedPlaces,
        (updatedPlace) => {
          setTrips((prevTrips) =>
            prevTrips.map((t) => ({
              ...t,
              extractedPlaces: t.extractedPlaces.map((p) =>
                p.id === updatedPlace.id ? updatedPlace : p
              ),
            }))
          );
        },
        canonicalDest
      );
    }
  };

  const movePlaceInSchedule = (
    fromDay: number,
    fromSlot: "morning" | "afternoon" | "evening",
    toDay: number,
    toSlot: "morning" | "afternoon" | "evening",
    placeId: string
  ) => {
    updateActiveTrip((prev) => {
      if (!prev.customSchedule) return {};
      const sched: TripSchedule = JSON.parse(JSON.stringify(prev.customSchedule));

      if (!sched[fromDay] || !sched[toDay]) return {};

      const sourceList = sched[fromDay][fromSlot] || [];
      const placeIndex = sourceList.findIndex((p) => p.id === placeId);
      if (placeIndex === -1) return {};

      const [targetPlace] = sourceList.splice(placeIndex, 1);
      if (!sched[toDay][toSlot]) sched[toDay][toSlot] = [];
      sched[toDay][toSlot].push(targetPlace);

      sched[fromDay] = recalculateDayMetrics(sched[fromDay]);
      sched[toDay] = recalculateDayMetrics(sched[toDay]);

      return { customSchedule: sched };
    });
  };

  const removePlaceFromSchedule = (
    day: number,
    slot: "morning" | "afternoon" | "evening",
    placeId: string
  ) => {
    updateActiveTrip((prev) => {
      if (!prev.customSchedule || !prev.customSchedule[day]) return {};
      const sched: TripSchedule = JSON.parse(JSON.stringify(prev.customSchedule));

      sched[day][slot] = (sched[day][slot] || []).filter((p) => p.id !== placeId);
      sched[day] = recalculateDayMetrics(sched[day]);

      return { customSchedule: sched };
    });
  };

  const reorderPlaceInSlot = (
    day: number,
    slot: "morning" | "afternoon" | "evening",
    fromIndex: number,
    toIndex: number
  ) => {
    updateActiveTrip((prev) => {
      if (!prev.customSchedule || !prev.customSchedule[day]) return {};
      const sched: TripSchedule = JSON.parse(JSON.stringify(prev.customSchedule));

      const list = sched[day][slot] || [];
      if (fromIndex < 0 || fromIndex >= list.length || toIndex < 0 || toIndex >= list.length) return {};

      const [item] = list.splice(fromIndex, 1);
      list.splice(toIndex, 0, item);
      sched[day] = recalculateDayMetrics(sched[day]);

      return { customSchedule: sched };
    });
  };

  const addPlaceToSchedule = (
    day: number,
    slot: "morning" | "afternoon" | "evening",
    newPlace: ExtractedPlace
  ) => {
    updateActiveTrip((prev) => {
      let sched: TripSchedule;
      if (prev.customSchedule && Object.keys(prev.customSchedule).length > 0) {
        sched = JSON.parse(JSON.stringify(prev.customSchedule));
      } else {
        sched = {};
      }

      if (!sched[day]) {
        sched[day] = {
          dayNumber: day,
          morning: [],
          afternoon: [],
          evening: [],
          accommodations: [],
          totalDistanceKm: 0,
          totalTravelMinutes: 0,
        };
      }

      if (!sched[day][slot]) sched[day][slot] = [];
      sched[day][slot].push(newPlace);
      sched[day] = recalculateDayMetrics(sched[day]);

      const updatedPlaces = deduplicatePlaces([...prev.extractedPlaces, newPlace]);

      return {
        customSchedule: sched,
        extractedPlaces: updatedPlaces,
        isItineraryGenerated: true,
      };
    });
  };

  const updateTripDuration = (newDays: number, newStartDate?: string) => {
    updateActiveTrip((prev) => {
      const daysCount = Math.max(1, newDays);
      const startIso = newStartDate || prev.startDate || new Date().toISOString().split("T")[0];
      const startDateObj = new Date(startIso);
      const endDateObj = new Date(startDateObj);
      endDateObj.setDate(startDateObj.getDate() + daysCount - 1);
      const endIso = endDateObj.toISOString().split("T")[0];

      // Rebuild and rebalance all places intelligently across the new duration
      let sched: TripSchedule = {};
      if (prev.extractedPlaces && prev.extractedPlaces.length > 0) {
        sched = buildItinerary(prev.extractedPlaces, daysCount, "normal", prev.destination);
      } else {
        for (let d = 1; d <= daysCount; d++) {
          sched[d] = {
            dayNumber: d,
            morning: [],
            afternoon: [],
            evening: [],
            accommodations: [],
            totalDistanceKm: 0,
            totalTravelMinutes: 0,
          };
        }
      }

      return {
        startDate: startIso,
        endDate: endIso,
        customSchedule: sched,
        isItineraryGenerated: true,
      };
    });
  };

  const clearPlannerPlaces = () => {
    // Check if the active trip has saved places in the trips list
    const existingIndex = trips.findIndex((t) => t.id === activeTripId);
    const hasData =
      existingIndex !== -1 &&
      (trips[existingIndex].extractedPlaces.length > 0 ||
        trips[existingIndex].destination.trim() !== "");

    if (hasData) {
      // Create a fresh new draft trip for the planner workspace so the saved trip in My Trips is untouched!
      const newDraftId = `trip-draft-${Date.now()}`;
      const newDraftTrip: TripContext = {
        id: newDraftId,
        destination: activeTrip.destination || "",
        startDate: activeTrip.startDate,
        endDate: activeTrip.endDate,
        screenshots: [],
        extractedPlaces: [],
        customSchedule: undefined,
        isItineraryGenerated: false,
        createdAt: new Date(),
      };
      setTrips((prev) => [...prev, newDraftTrip]);
      setActiveTripId(newDraftId);
    } else {
      updateActiveTrip(() => ({
        extractedPlaces: [],
        screenshots: [],
        customSchedule: undefined,
        isItineraryGenerated: false,
      }));
    }
  };

  const resetActiveTrip = () => {
    const isSavedTripWithData = trips.some(
      (t) => t.id === activeTripId && (t.extractedPlaces.length > 0 || t.destination.trim() !== "")
    );

    if (isSavedTripWithData) {
      handleCreateNewTrip();
    } else {
      const today = new Date();
      const startIso = today.toISOString().split("T")[0];
      const endObj = new Date(today);
      endObj.setDate(today.getDate() + 3);
      const endIso = endObj.toISOString().split("T")[0];

      updateActiveTrip(() => ({
        destination: "",
        extractedPlaces: [],
        screenshots: [],
        customSchedule: undefined,
        isItineraryGenerated: false,
        startDate: startIso,
        endDate: endIso,
      }));
    }
  };

  const deleteTrip = async (tripId: string) => {
    setTrips((prev) => {
      const remaining = prev.filter((t) => t.id !== tripId);
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("tripplanner_saved_trips", JSON.stringify(remaining));
        } catch (e) {}
      }
      return remaining;
    });

    if (activeTripId === tripId) {
      setActiveTripId("");
    }

    if (user) {
      await deleteTripFromSupabase(tripId);
    }
  };

  const deletePlaceFromTrip = (tripId: string, placeId: string) => {
    setTrips((prevTrips) => {
      return prevTrips.map((trip) => {
        if (trip.id !== tripId) return trip;

        const updatedPlaces = trip.extractedPlaces.filter((p) => p.id !== placeId);
        let updatedSchedule = trip.customSchedule;

        if (updatedSchedule) {
          const newSched: TripSchedule = {};
          for (const dKey in updatedSchedule) {
            const dNum = parseInt(dKey, 10);
            const dayObj = updatedSchedule[dNum];
            if (!dayObj) continue;

            const filteredMorning = dayObj.morning.filter((p) => p.id !== placeId);
            const filteredAfternoon = dayObj.afternoon.filter((p) => p.id !== placeId);
            const filteredEvening = dayObj.evening.filter((p) => p.id !== placeId);
            const filteredAccommodations = (dayObj.accommodations || []).filter((p) => p.id !== placeId);

            newSched[dNum] = recalculateDayMetrics({
              ...dayObj,
              morning: filteredMorning,
              afternoon: filteredAfternoon,
              evening: filteredEvening,
              accommodations: filteredAccommodations,
            });
          }
          updatedSchedule = newSched;
        }

        const updatedTrip: TripContext = {
          ...trip,
          extractedPlaces: updatedPlaces,
          customSchedule: updatedSchedule,
          isItineraryGenerated: updatedPlaces.length > 0 && trip.isItineraryGenerated,
        };

        if (user) {
          saveTripToSupabase(updatedTrip, user.id);
        }

        return updatedTrip;
      });
    });
  };

  const updatePlaceInTrip = (tripId: string, placeId: string, updates: Partial<ExtractedPlace>) => {
    setTrips((prevTrips) => {
      return prevTrips.map((trip) => {
        if (trip.id !== tripId) return trip;

        const updatedPlaces = trip.extractedPlaces.map((p) =>
          p.id === placeId ? { ...p, ...updates } : p
        );

        let updatedSchedule = trip.customSchedule;
        if (updatedSchedule) {
          const newSched: TripSchedule = {};
          for (const dKey in updatedSchedule) {
            const dNum = parseInt(dKey, 10);
            const dayObj = updatedSchedule[dNum];
            if (!dayObj) continue;

            const updateSlotList = (list: ExtractedPlace[]) =>
              list.map((p) => (p.id === placeId ? { ...p, ...updates } : p));

            newSched[dNum] = {
              ...dayObj,
              morning: updateSlotList(dayObj.morning),
              afternoon: updateSlotList(dayObj.afternoon),
              evening: updateSlotList(dayObj.evening),
              accommodations: updateSlotList(dayObj.accommodations || []),
            };
          }
          updatedSchedule = newSched;
        }

        const updatedTrip: TripContext = {
          ...trip,
          extractedPlaces: updatedPlaces,
          customSchedule: updatedSchedule,
        };

        if (user) {
          saveTripToSupabase(updatedTrip, user.id);
        }

        return updatedTrip;
      });
    });
  };

  const clearPlacesFromTrip = (tripId: string) => {
    setTrips((prevTrips) => {
      return prevTrips.map((trip) => {
        if (trip.id !== tripId) return trip;

        const updatedTrip: TripContext = {
          ...trip,
          extractedPlaces: [],
          customSchedule: undefined,
          isItineraryGenerated: false,
        };

        if (user) {
          saveTripToSupabase(updatedTrip, user.id);
        }

        return updatedTrip;
      });
    });
  };

  return (
    <TripStateContext.Provider
      value={{
        trips,
        activeTripId,
        activeTrip,
        user,
        session,
        userProfile,
        isLoadingAuth,
        handleSignOut,
        setActiveTripId,
        setTrips,
        updateActiveTrip,
        handleCreateNewTrip,
        handleSelectDestination,
        commitAnalysisResults,
        inferDestinationFromPlaces,
        movePlaceInSchedule,
        removePlaceFromSchedule,
        reorderPlaceInSlot,
        addPlaceToSchedule,
        updateTripDuration,
        resetActiveTrip,
        clearPlannerPlaces,
        deleteTrip,
        deletePlaceFromTrip,
        updatePlaceInTrip,
        clearPlacesFromTrip,
        isAuthGateModalOpen,
        authGateReason,
        openAuthGate,
        closeAuthGate,
        handleSaveTripToCloud,
      }}
    >
      {children}
      <AuthGateModal
        isOpen={isAuthGateModalOpen}
        onClose={closeAuthGate}
        reason={authGateReason}
        tripDestination={activeTrip?.destination || "Trip"}
      />
    </TripStateContext.Provider>
  );
}

export function useTripContext() {
  const context = useContext(TripStateContext);
  if (!context) {
    throw new Error("useTripContext must be used within a TripProvider");
  }
  return context;
}
