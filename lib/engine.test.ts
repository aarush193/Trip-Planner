import { buildItinerary, deduplicatePlaces, haversineDistance } from "./itineraryEngine";
import { ExtractedPlace, PlaceCategory } from "./vision";

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`TEST FAILED: ${message}`);
  }
}

function countTotalAssigned(schedule: ReturnType<typeof buildItinerary>): number {
  let count = 0;
  for (const d in schedule) {
    count += schedule[d].morning.length + schedule[d].afternoon.length + schedule[d].evening.length;
  }
  return count;
}

console.log("=== EXPANDED ITINERARY ENGINE SUITE (12 MANDATORY TESTS) ===");

// 1. 4 places across 3 days
console.log("\nTest 1: 4 places across 3 days...");
const places4: ExtractedPlace[] = [
  { id: "p1", title: "Taj Mahal", category: "sightseeing", latitude: 27.175, longitude: 78.042, confidence: 0.9 },
  { id: "p2", title: "Agra Fort", category: "culture", latitude: 27.179, longitude: 78.021, confidence: 0.9 },
  { id: "p3", title: "Mehtab Bagh", category: "sightseeing", latitude: 27.18, longitude: 78.044, confidence: 0.9 },
  { id: "p4", title: "Pinch of Spice", category: "food", latitude: 27.19, longitude: 78.01, confidence: 0.9 },
];
const sched4 = buildItinerary(places4, 3);
assert(countTotalAssigned(sched4) === 4, "All 4 places must be assigned.");
assert(Boolean(sched4[1] && sched4[2] && sched4[3]), "3 days must be present in schedule.");
console.log("✅ Test 1 passed.");

// 2. 6 places across 3 days
console.log("\nTest 2: 6 places across 3 days...");
const places6: ExtractedPlace[] = [
  { id: "p1", title: "Eiffel Tower", category: "sightseeing", latitude: 48.858, longitude: 2.294, confidence: 0.9 },
  { id: "p2", title: "Louvre Museum", category: "culture", latitude: 48.86, longitude: 2.337, confidence: 0.9 },
  { id: "p3", title: "Vintage Shop", category: "shopping", latitude: 48.857, longitude: 2.359, confidence: 0.9 },
  { id: "p4", title: "Seine Dinner Cruise", category: "food", latitude: 48.858, longitude: 2.294, confidence: 0.9 },
  { id: "p5", title: "Montmartre Tour", category: "activity", latitude: 48.886, longitude: 2.343, confidence: 0.9 },
  { id: "p6", title: "Sacré-Cœur", category: "sightseeing", latitude: 48.887, longitude: 2.343, confidence: 0.9 },
];
const sched6 = buildItinerary(places6, 3);
assert(countTotalAssigned(sched6) === 6, "All 6 places must be assigned.");
const day1Count = sched6[1].morning.length + sched6[1].afternoon.length + sched6[1].evening.length;
const day2Count = sched6[2].morning.length + sched6[2].afternoon.length + sched6[2].evening.length;
const day3Count = sched6[3].morning.length + sched6[3].afternoon.length + sched6[3].evening.length;
assert(day1Count >= 1 && day2Count >= 1 && day3Count >= 1, "6 places should distribute balanced across 3 days.");
console.log("✅ Test 2 passed.");

// 3. 10 places across 4 days
console.log("\nTest 3: 10 places across 4 days...");
const places10: ExtractedPlace[] = Array.from({ length: 10 }, (_, i) => ({
  id: `p10-${i}`,
  title: `Attraction ${i + 1}`,
  category: i % 2 === 0 ? "sightseeing" : "food",
  latitude: 35.68 + i * 0.005,
  longitude: 139.76 + i * 0.005,
  confidence: 0.9,
}));
const sched10 = buildItinerary(places10, 4);
assert(countTotalAssigned(sched10) === 10, "All 10 places must be assigned.");
assert(Boolean(sched10[1] && sched10[2] && sched10[3] && sched10[4]), "4 days schedule must be created.");
console.log("✅ Test 3 passed.");

// 4. 1 place across 3 days
console.log("\nTest 4: 1 place across 3 days...");
const places1 = [{ id: "p1-single", title: "Taj Mahal", category: "sightseeing" as PlaceCategory, confidence: 0.9 }];
const sched1 = buildItinerary(places1, 3);
assert(countTotalAssigned(sched1) === 1, "Only 1 place should be assigned.");
assert(sched1[1].morning.length === 1 || sched1[1].afternoon.length === 1, "Single place should land on Day 1.");
assert(countTotalAssigned({ 2: sched1[2], 3: sched1[3] }) === 0, "Days 2 and 3 should remain empty without forced filler.");
console.log("✅ Test 4 passed.");

// 5. Geographically separated places
console.log("\nTest 5: Geographically separated places...");
const geoPlaces: ExtractedPlace[] = [
  { id: "g1", title: "Asakusa Temple (North)", category: "sightseeing", latitude: 35.714, longitude: 139.796, confidence: 0.9 },
  { id: "g2", title: "Ueno Park (North)", category: "sightseeing", latitude: 35.714, longitude: 139.774, confidence: 0.9 },
  { id: "g3", title: "Shibuya Crossing (South)", category: "activity", latitude: 35.659, longitude: 139.700, confidence: 0.9 },
  { id: "g4", title: "Harajuku (South)", category: "shopping", latitude: 35.67, longitude: 139.702, confidence: 0.9 },
];
const schedGeo = buildItinerary(geoPlaces, 2);
assert(countTotalAssigned(schedGeo) === 4, "All 4 geo places assigned.");
const clusterDay1 = [...schedGeo[1].morning, ...schedGeo[1].afternoon, ...schedGeo[1].evening];
const clusterDay2 = [...schedGeo[2].morning, ...schedGeo[2].afternoon, ...schedGeo[2].evening];
assert(clusterDay1.length === 2 && clusterDay2.length === 2, "Geographically separated places must cluster 2 per day.");
console.log("✅ Test 5 passed.");

// 6. Mixed categories
console.log("\nTest 6: Mixed categories suitability...");
const mixed: ExtractedPlace[] = [
  { id: "m1", title: "Morning Temple", category: "sightseeing", confidence: 0.9 },
  { id: "m2", title: "Afternoon Tour", category: "activity", confidence: 0.9 },
  { id: "m3", title: "Night Bistro", category: "food", confidence: 0.9 },
  { id: "m4", title: "Grand Hotel", category: "stay", confidence: 0.9 },
];
const schedMixed = buildItinerary(mixed, 1);
assert(schedMixed[1].morning.length === 1 && schedMixed[1].morning[0].title === "Morning Temple", "Sightseeing prefers morning.");
assert(schedMixed[1].afternoon.length === 1 && schedMixed[1].afternoon[0].title === "Afternoon Tour", "Activity prefers afternoon.");
assert(schedMixed[1].evening.length === 1 && schedMixed[1].evening[0].title === "Night Bistro", "Food prefers evening.");
assert(schedMixed[1].accommodations.length === 1, "Stay stored in accommodations.");
console.log("✅ Test 6 passed.");

// 7. Relaxed vs Normal vs Packed pace
console.log("\nTest 7: Relaxed vs Normal vs Packed pace...");
const pacePlaces: ExtractedPlace[] = Array.from({ length: 8 }, (_, i) => ({
  id: `pace-${i}`,
  title: `Spot ${i}`,
  category: "sightseeing",
  confidence: 0.9,
}));
const schedRelaxed = buildItinerary(pacePlaces, 2, "relaxed");
const schedPacked = buildItinerary(pacePlaces, 2, "packed");
assert(countTotalAssigned(schedRelaxed) === 8, "Relaxed pace preserves all 8 places.");
assert(countTotalAssigned(schedPacked) === 8, "Packed pace preserves all 8 places.");
console.log("✅ Test 7 passed.");

// 8. Missing coordinates
console.log("\nTest 8: Missing coordinates...");
const noCoords: ExtractedPlace[] = [
  { id: "nc1", title: "Alley Cafe", category: "food", confidence: 0.9, city: "Agra" },
  { id: "nc2", title: "Local Market", category: "shopping", confidence: 0.9, city: "Agra" },
  { id: "nc3", title: "Art Gallery", category: "culture", confidence: 0.9, city: "Agra" },
];
const schedNoCoords = buildItinerary(noCoords, 3);
assert(countTotalAssigned(schedNoCoords) === 3, "All non-coord places distributed.");
console.log("✅ Test 8 passed.");

// 9. Duplicate places
console.log("\nTest 9: Duplicate places...");
const dups: ExtractedPlace[] = [
  { id: "d1", title: "Taj Mahal", category: "sightseeing", confidence: 0.9 },
  { id: "d2", title: "Taj Mahal", category: "sightseeing", confidence: 0.8 },
  { id: "d3", title: "taj mahal ", category: "sightseeing", confidence: 0.7 },
];
const schedDups = buildItinerary(dups, 2);
assert(countTotalAssigned(schedDups) === 1, "Duplicates must be reduced to 1 unique place.");
console.log("✅ Test 9 passed.");

// 10. Hotel/Stay handling
console.log("\nTest 10: Hotel/Stay handling...");
const staysOnly: ExtractedPlace[] = [
  { id: "s1", title: "Ritz Paris", category: "stay", confidence: 0.9 },
  { id: "s2", title: "Eiffel Tower", category: "sightseeing", confidence: 0.9 },
];
const schedStays = buildItinerary(staysOnly, 3);
assert(countTotalAssigned(schedStays) === 1, "Only non-stay activity counted in slots.");
assert(schedStays[1].accommodations.length === 1 && schedStays[2].accommodations.length === 1, "Hotel present in daily accommodations.");
console.log("✅ Test 10 passed.");

// 11. Overloaded trip
console.log("\nTest 11: Overloaded trip (25 places across 2 days)...");
const overloaded: ExtractedPlace[] = Array.from({ length: 25 }, (_, i) => ({
  id: `ov-${i}`,
  title: `Heavy Spot ${i}`,
  category: "sightseeing",
  confidence: 0.9,
}));
const schedOver = buildItinerary(overloaded, 2);
assert(countTotalAssigned(schedOver) === 25, "All 25 places preserved without data loss.");
console.log("✅ Test 11 passed.");

// 12. Deterministic output
console.log("\nTest 12: Deterministic output...");
const runA = JSON.stringify(buildItinerary(places6, 3));
const runB = JSON.stringify(buildItinerary(places6, 3));
assert(runA === runB, "Output must be 100% deterministic.");
console.log("✅ Test 12 passed.");

console.log("\n=== ALL 12 MANDATORY TEST SUITES PASSED PASSED ✅ ===");
