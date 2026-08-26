"use client";

import React, { createContext, useContext, useState, useMemo } from "react";
import { ExtractedPlace, UploadedScreenshot } from "@/lib/vision";
import { enrichPlaces } from "@/lib/enrichment";
import { deduplicatePlaces } from "@/lib/itineraryEngine";

export interface TripContext {
  id: string;
  destination: string;
  startDate: string;
  endDate: string;
  screenshots: UploadedScreenshot[];
  extractedPlaces: ExtractedPlace[];
  isItineraryGenerated: boolean;
  createdAt: Date;
}

interface TripContextType {
  trips: TripContext[];
  activeTripId: string;
  activeTrip: TripContext;
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
    fallbackDest?: string
  ) => void;
  inferDestinationFromPlaces: (places: ExtractedPlace[]) => string | undefined;
}

const TripStateContext = createContext<TripContextType | undefined>(undefined);

export function TripProvider({ children }: { children: React.ReactNode }) {
  const [trips, setTrips] = useState<TripContext[]>([
    {
      id: "trip-default",
      destination: "Paris, France",
      startDate: "2026-09-15",
      endDate: "2026-09-18",
      screenshots: [],
      extractedPlaces: [],
      isItineraryGenerated: false,
      createdAt: new Date(),
    },
  ]);

  const [activeTripId, setActiveTripId] = useState<string>("trip-default");

  const activeTrip = useMemo(() => {
    return trips.find((t) => t.id === activeTripId) || trips[0];
  }, [trips, activeTripId]);

  const updateActiveTrip = (
    updates: Partial<TripContext> | ((prev: TripContext) => Partial<TripContext>)
  ) => {
    setTrips((prevTrips) =>
      prevTrips.map((t) => {
        if (t.id !== activeTripId) return t;
        const patch = typeof updates === "function" ? updates(t) : updates;
        return { ...t, ...patch };
      })
    );
  };

  const handleCreateNewTrip = () => {
    const newTripId = `trip-${Date.now()}`;
    const newTrip: TripContext = {
      id: newTripId,
      destination: "",
      startDate: "2026-09-15",
      endDate: "2026-09-18",
      screenshots: [],
      extractedPlaces: [],
      isItineraryGenerated: false,
      createdAt: new Date(),
    };
    setTrips((prev) => [...prev, newTrip]);
    setActiveTripId(newTripId);
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
      const newTrip: TripContext = {
        id: newTripId,
        destination: targetDest,
        startDate: "2026-09-15",
        endDate: "2026-09-18",
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

    for (const place of places) {
      const fullText = `${place.locationHint || ""} ${place.title} ${place.notes || ""} ${place.rawDetectedText || ""}`.toLowerCase();
      if (
        fullText.includes("taj mahal") ||
        fullText.includes("agra") ||
        fullText.includes("uttar pradesh") ||
        fullText.includes("india")
      ) {
        return "Agra, India";
      }
      if (
        fullText.includes("paris") ||
        fullText.includes("eiffel") ||
        fullText.includes("louvre") ||
        fullText.includes("france")
      ) {
        return "Paris, France";
      }
      if (
        fullText.includes("tokyo") ||
        fullText.includes("shibuya") ||
        fullText.includes("shinjuku") ||
        fullText.includes("japan")
      ) {
        return "Tokyo, Japan";
      }
      if (
        fullText.includes("rome") ||
        fullText.includes("colosseum") ||
        fullText.includes("vatican") ||
        fullText.includes("italy")
      ) {
        return "Rome, Italy";
      }
      if (
        fullText.includes("bali") ||
        fullText.includes("ubud") ||
        fullText.includes("denpasar") ||
        fullText.includes("indonesia")
      ) {
        return "Bali, Indonesia";
      }
      if (
        fullText.includes("new york") ||
        fullText.includes("nyc") ||
        fullText.includes("manhattan") ||
        fullText.includes("times square") ||
        fullText.includes("broadway")
      ) {
        return "New York, USA";
      }
    }

    for (const place of places) {
      if (place.locationHint && place.locationHint.trim()) {
        return place.locationHint.trim();
      }
      if (place.city && place.city.trim()) {
        return place.city.trim();
      }
    }

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
    fallbackDest?: string
  ) => {
    const inferredDest = inferDestinationFromPlaces(extractedPlaces) || fallbackDest || "";
    const scrIds = new Set(screenshotsAnalyzed.map((s) => s.id));

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
              screenshots: [...remainingScreenshots, ...completedScreenshots],
              extractedPlaces: deduplicatePlaces([...t.extractedPlaces, ...extractedPlaces]),
              isItineraryGenerated: true,
            };
          }

          return t;
        });
      }

      // Case 2: Create a NEW trip context for the different destination
      const newTripId = `trip-${Date.now()}`;
      const newTrip: TripContext = {
        id: newTripId,
        destination: inferredDest || "New Trip",
        startDate: "2026-09-15",
        endDate: "2026-09-18",
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
      enrichPlaces(extractedPlaces, (updatedPlace) => {
        setTrips((prevTrips) =>
          prevTrips.map((t) => ({
            ...t,
            extractedPlaces: t.extractedPlaces.map((p) =>
              p.id === updatedPlace.id ? updatedPlace : p
            ),
          }))
        );
      });
    }
  };

  return (
    <TripStateContext.Provider
      value={{
        trips,
        activeTripId,
        activeTrip,
        setActiveTripId,
        setTrips,
        updateActiveTrip,
        handleCreateNewTrip,
        handleSelectDestination,
        commitAnalysisResults,
        inferDestinationFromPlaces,
      }}
    >
      {children}
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
