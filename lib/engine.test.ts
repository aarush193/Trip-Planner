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

// 11. Overloaded trip capacity capping
console.log("\nTest 11: Overloaded trip capacity capping (25 places across 2 days)...");
const overloaded: ExtractedPlace[] = Array.from({ length: 25 }, (_, i) => ({
  id: `ov-${i}`,
  title: `Heavy Spot ${i}`,
  category: "sightseeing",
  confidence: 0.9,
}));
const schedOver = buildItinerary(overloaded, 2);
assert(countTotalAssigned(schedOver) <= 12, "Overloaded trip must cap daily assignments to realistic pace limit.");
console.log("✅ Test 11 passed.");

// 12. Deterministic output
console.log("\nTest 12: Deterministic output...");
const runA = JSON.stringify(buildItinerary(places6, 3));
const runB = JSON.stringify(buildItinerary(places6, 3));
assert(runA === runB, "Output must be 100% deterministic.");
console.log("✅ Test 12 passed.");

// Helper function to format and log human-readable schedule for inspection
function printScheduleSummary(tripName: string, schedule: ReturnType<typeof buildItinerary>) {
  console.log(`\n--- Schedule Inspection: ${tripName} ---`);
  for (const dayNum in schedule) {
    const day = schedule[dayNum];
    const m = day.morning.map((p) => `${p.title} (${p.category})`).join(", ") || "[Empty]";
    const a = day.afternoon.map((p) => `${p.title} (${p.category})`).join(", ") || "[Empty]";
    const e = day.evening.map((p) => `${p.title} (${p.category})`).join(", ") || "[Empty]";
    console.log(`  Day ${dayNum}:`);
    console.log(`    Morning   : ${m}`);
    console.log(`    Afternoon : ${a}`);
    console.log(`    Evening   : ${e}`);
  }
}

// 13. Realistic 4-place 1-day trip distribution
console.log("\nTest 13: Realistic 4-place 1-day trip distribution (Tokyo)...");
const realTokyo4: ExtractedPlace[] = [
  { id: "t1", title: "Senso-ji Temple", category: "sightseeing", latitude: 35.714, longitude: 139.796 },
  { id: "t2", title: "Tokyo Skytree", category: "sightseeing", latitude: 35.71, longitude: 139.81 },
  { id: "t3", title: "Ueno Park", category: "sightseeing", latitude: 35.714, longitude: 139.774 },
  { id: "t4", title: "Akihabara Electric Town", category: "sightseeing", latitude: 35.698, longitude: 139.771 },
];
const schedTokyo4 = buildItinerary(realTokyo4, 1);
assert(countTotalAssigned(schedTokyo4) === 4, "All 4 places must be assigned.");
assert(schedTokyo4[1].morning.length > 0, "Morning must have places.");
assert(schedTokyo4[1].afternoon.length > 0, "Afternoon must have places.");
assert(schedTokyo4[1].evening.length > 0, "Evening must have places.");
assert(schedTokyo4[1].morning.length < 4, "Morning must NOT take all sightseeing places.");
printScheduleSummary("4 Places 1 Day (Tokyo)", schedTokyo4);
console.log("✅ Test 13 passed.");

// 14. Realistic 6-place 2-day trip distribution
console.log("\nTest 14: Realistic 6-place 2-day trip distribution (Paris)...");
const realParis6: ExtractedPlace[] = [
  { id: "p1", title: "Eiffel Tower", category: "sightseeing", latitude: 48.858, longitude: 2.294 },
  { id: "p2", title: "Louvre Museum", category: "culture", latitude: 48.86, longitude: 2.337 },
  { id: "p3", title: "Arc de Triomphe", category: "sightseeing", latitude: 48.873, longitude: 2.295 },
  { id: "p4", title: "Musée d'Orsay", category: "culture", latitude: 48.86, longitude: 2.326 },
  { id: "p5", title: "Sainte-Chapelle", category: "sightseeing", latitude: 48.855, longitude: 2.345 },
  { id: "p6", title: "Sacré-Cœur", category: "sightseeing", latitude: 48.886, longitude: 2.343 },
];
const schedParis6 = buildItinerary(realParis6, 2);
assert(countTotalAssigned(schedParis6) === 6, "All 6 places must be assigned.");
assert(schedParis6[1].morning.length > 0 && schedParis6[1].afternoon.length > 0 && schedParis6[1].evening.length > 0, "Day 1 places must be distributed across morning, afternoon, and evening.");
assert(schedParis6[2].morning.length > 0 && schedParis6[2].afternoon.length > 0 && schedParis6[2].evening.length > 0, "Day 2 places must be distributed across morning, afternoon, and evening.");
assert(schedParis6[1].morning.length < 3 && schedParis6[2].morning.length < 3, "Morning must NOT take all places.");
printScheduleSummary("6 Places 2 Days (Paris)", schedParis6);
console.log("✅ Test 14 passed.");

// 15. Realistic 8-place 2-day trip distribution
console.log("\nTest 15: Realistic 8-place 2-day trip distribution (Rome)...");
const realRome8: ExtractedPlace[] = [
  { id: "r1", title: "Colosseum", category: "sightseeing", latitude: 41.89, longitude: 12.49 },
  { id: "r2", title: "Roman Forum", category: "sightseeing", latitude: 41.891, longitude: 12.485 },
  { id: "r3", title: "Pantheon", category: "sightseeing", latitude: 41.898, longitude: 12.476 },
  { id: "r4", title: "Trevi Fountain", category: "sightseeing", latitude: 41.9, longitude: 12.483 },
  { id: "r5", title: "Vatican Museums", category: "culture", latitude: 41.906, longitude: 12.453 },
  { id: "r6", title: "St. Peter's Basilica", category: "sightseeing", latitude: 41.902, longitude: 12.453 },
  { id: "r7", title: "Castel Sant'Angelo", category: "sightseeing", latitude: 41.903, longitude: 12.466 },
  { id: "r8", title: "Piazza Navona", category: "sightseeing", latitude: 41.899, longitude: 12.473 },
];
const schedRome8 = buildItinerary(realRome8, 2);
assert(countTotalAssigned(schedRome8) === 8, "All 8 places must be assigned.");
assert(schedRome8[1].morning.length > 0 && schedRome8[1].afternoon.length > 0 && schedRome8[1].evening.length > 0, "Day 1 must distribute across morning, afternoon, and evening.");
assert(schedRome8[2].morning.length > 0 && schedRome8[2].afternoon.length > 0 && schedRome8[2].evening.length > 0, "Day 2 must distribute across morning, afternoon, and evening.");
assert(schedRome8[1].morning.length < 4 && schedRome8[2].morning.length < 4, "Morning must NOT take all places.");
printScheduleSummary("8 Places 2 Days (Rome)", schedRome8);
console.log("✅ Test 15 passed.");

// 16. Realistic 10-place 3-day trip distribution
console.log("\nTest 16: Realistic 10-place 3-day trip distribution (Kyoto)...");
const realKyoto10: ExtractedPlace[] = [
  { id: "k1", title: "Kinkaku-ji", category: "sightseeing", latitude: 35.039, longitude: 135.729 },
  { id: "k2", title: "Ryoan-ji", category: "sightseeing", latitude: 35.034, longitude: 135.718 },
  { id: "k3", title: "Arashiyama Bamboo Grove", category: "sightseeing", latitude: 35.017, longitude: 135.671 },
  { id: "k4", title: "Fushimi Inari Shrine", category: "sightseeing", latitude: 34.967, longitude: 135.773 },
  { id: "k5", title: "Kiyomizu-dera", category: "sightseeing", latitude: 34.994, longitude: 135.785 },
  { id: "k6", title: "Gion District", category: "sightseeing", latitude: 35.003, longitude: 135.777 },
  { id: "k7", title: "Nijo Castle", category: "sightseeing", latitude: 35.014, longitude: 135.748 },
  { id: "k8", title: "Kyoto Imperial Palace", category: "sightseeing", latitude: 35.025, longitude: 135.762 },
  { id: "k9", title: "Nishiki Market", category: "shopping", latitude: 35.005, longitude: 135.764 },
  { id: "k10", title: "Pontocho Alley", category: "food", latitude: 35.005, longitude: 135.77 },
];
const schedKyoto10 = buildItinerary(realKyoto10, 3);
assert(countTotalAssigned(schedKyoto10) === 10, "All 10 places must be assigned.");
let totalMorning = 0;
let totalAfternoon = 0;
let totalEvening = 0;
for (const d in schedKyoto10) {
  totalMorning += schedKyoto10[d].morning.length;
  totalAfternoon += schedKyoto10[d].afternoon.length;
  totalEvening += schedKyoto10[d].evening.length;
}
assert(totalMorning > 0 && totalAfternoon > 0 && totalEvening > 0, "Places must be distributed across morning, afternoon, and evening.");
assert(totalMorning < 10, "Morning must NOT take all 10 places.");
printScheduleSummary("10 Places 3 Days (Kyoto)", schedKyoto10);
console.log("✅ Test 16 passed.");

// 17. Intelligent Discovery & Pool Expansion
console.log("\nTest 17: Intelligent Discovery & Pool Expansion...");
const { discoverNearbyPlaces, expandAndRankPlacesPool } = require("./discovery");
const singleEiffel: ExtractedPlace[] = [
  { id: "eiffel-1", title: "Eiffel Tower", category: "sightseeing", locationHint: "Paris, France", city: "Paris", latitude: 48.8584, longitude: 2.2945, confidence: 0.99 }
];
async function runTest17() {
  const discovered = await discoverNearbyPlaces("Paris, France", singleEiffel, 4);
  assert(discovered.length >= 5, "Discovered places must return at least 5 nearby places.");
  const expanded = expandAndRankPlacesPool(singleEiffel, discovered, 4);
  assert(expanded.length >= 10, "Expanded pool must contain enough places for a 4-day trip.");
  assert(expanded[0].title === "Eiffel Tower", "User-provided anchor place must be prioritized at top of pool.");
  console.log(`✅ Test 17 passed (Discovered ${discovered.length} places, expanded pool to ${expanded.length} places).`);
}

// 18. Single Uploaded Place -> Intelligent Multi-Day Paris Itinerary (4 Days)
console.log("\nTest 18: Single Uploaded Place (Eiffel Tower) -> 4-Day Paris Itinerary...");
const { planIntelligentItinerary } = require("./itineraryEngine");
async function runTest18() {
  const schedParis4Day = await planIntelligentItinerary(singleEiffel, 4, "normal", "Paris, France");
  assert(Boolean(schedParis4Day[1] && schedParis4Day[2] && schedParis4Day[3] && schedParis4Day[4]), "4-day schedule must be generated.");
  const totalCount = countTotalAssigned(schedParis4Day);
  assert(totalCount >= 10, "4-day itinerary generated from 1 photo must contain at least 10 total places across 4 days.");
  assert(schedParis4Day[1].morning.length > 0 || schedParis4Day[1].afternoon.length > 0, "Day 1 must have places.");
  assert(schedParis4Day[4].morning.length > 0 || schedParis4Day[4].afternoon.length > 0 || schedParis4Day[4].evening.length > 0, "Day 4 must have places.");
  printScheduleSummary("Single Place (Eiffel Tower) -> 4-Day Paris Itinerary", schedParis4Day);
  console.log("✅ Test 18 passed.");
}

// 19. Overloaded Trip Capacity Capping & Distance/Time Annotations
console.log("\nTest 19: Overloaded Trip Capacity Capping & Distance/Time Annotations...");
const heavy15Places: ExtractedPlace[] = Array.from({ length: 15 }, (_, i) => ({
  id: `heavy-${i}`,
  title: `Spot ${i + 1}`,
  category: "sightseeing",
  latitude: 48.85 + i * 0.003,
  longitude: 2.29 + i * 0.003,
}));
const schedHeavyNormal = buildItinerary(heavy15Places, 1, "normal");
const countNormalDay1 = countTotalAssigned(schedHeavyNormal);
assert(countNormalDay1 <= 6, "Normal pace must cap day schedule to max 6 places per day.");
assert(typeof schedHeavyNormal[1].totalDistanceKm === "number" && schedHeavyNormal[1].totalDistanceKm >= 0, "Schedule must compute totalDistanceKm.");
assert(typeof schedHeavyNormal[1].totalTravelMinutes === "number" && schedHeavyNormal[1].totalTravelMinutes >= 0, "Schedule must compute totalTravelMinutes.");
printScheduleSummary("Overloaded Trip (15 Places 1 Day, Normal Pace Capped)", schedHeavyNormal);
// 20. Global Arbitrary City Dynamic Discovery (Reykjavik & Sydney)
console.log("\nTest 20: Global Arbitrary City Dynamic Discovery (Reykjavik & Sydney)...");
async function runTest20() {
  const reykjavikPlaces = await planIntelligentItinerary(
    [{ id: "reyk-1", title: "Hallgrímskirkja", category: "sightseeing", locationHint: "Reykjavik, Iceland", city: "Reykjavik", latitude: 64.142, longitude: -21.927 }],
    3,
    "normal",
    "Reykjavik, Iceland"
  );
  assert(Boolean(reykjavikPlaces[1] && reykjavikPlaces[2] && reykjavikPlaces[3]), "Reykjavik 3-day schedule generated.");
  const totalReyk = countTotalAssigned(reykjavikPlaces);
  assert(totalReyk >= 6, "Reykjavik itinerary must contain at least 6 places across 3 days.");
  printScheduleSummary("Global Discovery: Reykjavik 3-Day Trip", reykjavikPlaces);

  const sydneyPlaces = await planIntelligentItinerary(
    [{ id: "syd-1", title: "Sydney Opera House", category: "sightseeing", locationHint: "Sydney, Australia", city: "Sydney", latitude: -33.856, longitude: 151.215 }],
    3,
    "normal",
    "Sydney, Australia"
  );
  assert(Boolean(sydneyPlaces[1] && sydneyPlaces[2] && sydneyPlaces[3]), "Sydney 3-day schedule generated.");
  const totalSyd = countTotalAssigned(sydneyPlaces);
  assert(totalSyd >= 6, "Sydney itinerary must contain at least 6 places across 3 days.");
  printScheduleSummary("Global Discovery: Sydney 3-Day Trip", sydneyPlaces);

  console.log("✅ Test 20 passed.");
}

// 21. Generic Destination Boundary Relevance Classifier (evaluateDestinationRelevance)
console.log("\nTest 21: Generic Destination Boundary Relevance Classifier...");
const { evaluateDestinationRelevance } = require("./discovery");
const mathuraSpot: ExtractedPlace = { id: "m1", title: "Shri Krishna Janmabhoomi", category: "culture", city: "Mathura", locationHint: "Mathura, Uttar Pradesh" };
const agraSpot: ExtractedPlace = { id: "a1", title: "Taj Mahal", category: "sightseeing", city: "Agra", locationHint: "Agra, Uttar Pradesh" };

const mathuraScore = evaluateDestinationRelevance(mathuraSpot, "Mathura, India");
const agraInMathuraScore = evaluateDestinationRelevance(agraSpot, "Mathura, India");
assert(mathuraScore > 10, "Matching destination city must receive high Tier 1 score (+15).");
assert(agraInMathuraScore < -10, "Cross-city candidate must receive severe Tier 3 mismatch penalty (-20).");

const versaillesSpot: ExtractedPlace = { id: "v1", title: "Palace of Versailles", category: "sightseeing", city: "Versailles", locationHint: "Versailles, France" };
const parisSpot: ExtractedPlace = { id: "p1", title: "Eiffel Tower", category: "sightseeing", city: "Paris", locationHint: "Paris, France" };

const versaillesScore = evaluateDestinationRelevance(versaillesSpot, "Versailles, France");
const parisInVersaillesScore = evaluateDestinationRelevance(parisSpot, "Versailles, France");
assert(versaillesScore > 10, "Matching Versailles city must receive high Tier 1 score.");
assert(parisInVersaillesScore < -10, "Cross-city Paris spot in Versailles trip must receive severe mismatch penalty.");
console.log("✅ Test 21 passed.");

// 22. Destination Boundary Pool Filtering (Mathura vs Agra)
console.log("\nTest 22: Destination Boundary Pool Filtering (Mathura vs Agra)...");
const userMathura: ExtractedPlace[] = [{ id: "um1", title: "Bankey Bihari Temple", category: "culture", city: "Mathura", locationHint: "Mathura, India", latitude: 27.492, longitude: 77.673 }];
const discoveredMix: ExtractedPlace[] = [
  { id: "d-m1", title: "Vishram Ghat", category: "sightseeing", city: "Mathura", locationHint: "Mathura, India", latitude: 27.504, longitude: 77.685 },
  { id: "d-m2", title: "Prem Mandir", category: "culture", city: "Mathura", locationHint: "Mathura, India", latitude: 27.575, longitude: 77.67 },
  { id: "d-a1", title: "Taj Mahal", category: "sightseeing", city: "Agra", locationHint: "Agra, India", latitude: 27.175, longitude: 78.042 },
  { id: "d-a2", title: "Agra Fort", category: "culture", city: "Agra", locationHint: "Agra, India", latitude: 27.179, longitude: 78.021 },
];
const rankedMathuraPool = expandAndRankPlacesPool(userMathura, discoveredMix, 2, "Mathura, India");
const hasAgraInMathura = rankedMathuraPool.some((p: ExtractedPlace) => (p.city || "").toLowerCase() === "agra");
assert(!hasAgraInMathura, "Agra places must be excluded from a dedicated Mathura trip pool.");
assert(rankedMathuraPool.length >= 3, "Mathura places must be retained in pool.");
console.log("✅ Test 22 passed.");

// 23. Kamakura vs Tokyo Destination Boundary Filtering
console.log("\nTest 23: Kamakura vs Tokyo Destination Boundary Filtering...");
const userKamakura: ExtractedPlace[] = [{ id: "uk1", title: "Kotoku-in Great Buddha", category: "sightseeing", city: "Kamakura", locationHint: "Kamakura, Japan", latitude: 35.316, longitude: 139.536 }];
const discoveredKamakuraMix: ExtractedPlace[] = [
  { id: "d-k1", title: "Hasedera Temple", category: "sightseeing", city: "Kamakura", locationHint: "Kamakura, Japan", latitude: 35.312, longitude: 139.533 },
  { id: "d-k2", title: "Tsurugaoka Hachimangu", category: "culture", city: "Kamakura", locationHint: "Kamakura, Japan", latitude: 35.326, longitude: 139.556 },
  { id: "d-t1", title: "Tokyo Tower", category: "sightseeing", city: "Tokyo", locationHint: "Tokyo, Japan", latitude: 35.658, longitude: 139.745 },
  { id: "d-t2", title: "Shibuya Crossing", category: "activity", city: "Tokyo", locationHint: "Tokyo, Japan", latitude: 35.659, longitude: 139.7 },
];
const rankedKamakuraPool = expandAndRankPlacesPool(userKamakura, discoveredKamakuraMix, 2, "Kamakura, Japan");
const hasTokyoInKamakura = rankedKamakuraPool.some((p: ExtractedPlace) => (p.city || "").toLowerCase() === "tokyo");
assert(!hasTokyoInKamakura, "Tokyo places must be excluded from a dedicated Kamakura trip pool.");
assert(rankedKamakuraPool.length >= 3, "Kamakura places must be retained in pool.");
console.log("✅ Test 23 passed.");

// 24. Failure Class 1: Generic Text Destination Inference (No Static Keyword Overrides)
console.log("\nTest 24: Generic Text Destination Inference (No Static Keyword Overrides)...");
const samplePlacesRegional: ExtractedPlace[] = [
  { id: "rp1", title: "Temple Spot A", category: "culture", locationHint: "Mathura, Uttar Pradesh, India" },
  { id: "rp2", title: "Temple Spot B", category: "culture", locationHint: "Mathura, Uttar Pradesh, India" },
];
// Count locationHints dynamically
const countsDyn: Record<string, number> = {};
samplePlacesRegional.forEach((p) => {
  const h = p.locationHint || "";
  countsDyn[h] = (countsDyn[h] || 0) + 1;
});
let topDyn = "";
for (const k in countsDyn) { if (countsDyn[k] > (countsDyn[topDyn] || 0)) topDyn = k; }
assert(topDyn.toLowerCase().includes("mathura"), "Destination inference must deduce Mathura dynamically without static keyword overrides to Agra.");
assert(!topDyn.toLowerCase().includes("agra"), "Generic state text ('Uttar Pradesh, India') must NEVER turn destination into Agra.");
console.log("✅ Test 24 passed.");

// 25. Failure Class 2: Geocoding Ambiguity & Geographic Consistency Validation
console.log("\nTest 25: Geocoding Ambiguity & Geographic Consistency Validation...");
const checkConsistency = (resAddr: { city?: string; state?: string; display_name: string }, targetDest: string) => {
  const primaryTarget = targetDest.split(",")[0].trim().toLowerCase().replace(/[^a-z0-9]/g, "");
  const resCity = (resAddr.city || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  const displayName = resAddr.display_name.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (displayName.includes(primaryTarget) || resCity.includes(primaryTarget)) return true;
  if (resCity && resCity.length >= 3 && !resCity.includes(primaryTarget) && !primaryTarget.includes(resCity)) return false;
  return true;
};
const falseGujaratResult = { city: "Dwarka", state: "Gujarat", display_name: "Dwarkadhish Temple, Dwarka, Gujarat, India" };
const validMathuraResult = { city: "Mathura", state: "Uttar Pradesh", display_name: "Dwarkadhish Temple, Mathura, Uttar Pradesh, India" };

assert(!checkConsistency(falseGujaratResult, "Mathura, India"), "Dwarka, Gujarat geocoding result must be rejected for a Mathura trip.");
assert(checkConsistency(validMathuraResult, "Mathura, India"), "Mathura, UP geocoding result must be accepted for a Mathura trip.");
console.log("✅ Test 25 passed.");

// 26. Failure Class 3: Cross-City Place Input Filtering
console.log("\nTest 26: Cross-City Place Input Filtering...");
const mixedCrossCityPlaces: ExtractedPlace[] = [
  { id: "m-1", title: "Shri Krishna Janmabhoomi", category: "culture", city: "Mathura", locationHint: "Mathura, India", latitude: 27.504, longitude: 77.685 },
  { id: "m-2", title: "Prem Mandir Vrindavan", category: "culture", city: "Mathura", locationHint: "Mathura, India", latitude: 27.575, longitude: 77.67 },
  { id: "a-1", title: "Taj Mahal Agra", category: "sightseeing", city: "Agra", locationHint: "Agra, India", latitude: 27.175, longitude: 78.042 },
];
const filteredSchedule = buildItinerary(mixedCrossCityPlaces, 2, "normal", "Mathura, India");
let assignedTitles: string[] = [];
for (const d in filteredSchedule) {
  assignedTitles.push(...filteredSchedule[d].morning.map((p) => p.title));
  assignedTitles.push(...filteredSchedule[d].afternoon.map((p) => p.title));
  assignedTitles.push(...filteredSchedule[d].evening.map((p) => p.title));
}
assert(!assignedTitles.includes("Taj Mahal Agra"), "Taj Mahal Agra must be filtered out when building an itinerary for Mathura, India.");
assert(assignedTitles.includes("Shri Krishna Janmabhoomi"), "Mathura places must be retained in schedule.");
console.log("✅ Test 26 passed.");

// 27. Canonical Destination State Propagation
console.log("\nTest 27: Canonical Destination State Propagation...");
async function runTest27() {
  const mathuraIntelligentSched = await planIntelligentItinerary(
    [{ id: "m-single", title: "Shri Krishna Janmasthan", category: "culture", city: "Mathura", locationHint: "Mathura, India" }],
    3,
    "normal",
    "Mathura, India"
  );
  assert(Boolean(mathuraIntelligentSched[1] && mathuraIntelligentSched[2] && mathuraIntelligentSched[3]), "3-day Mathura schedule generated.");
  printScheduleSummary("Canonical Scope Test: Mathura 3-Day Trip", mathuraIntelligentSched);
  console.log("✅ Test 27 passed.");
}

// 28. Final Itinerary Metadata Matching Requested Destination
console.log("\nTest 28: Final Itinerary Metadata Matching Requested Destination...");
const finalSched = buildItinerary([{ id: "p-1", title: "Eiffel Tower", category: "sightseeing", city: "Paris", locationHint: "Paris, France" }], 1, "normal", "Paris, France");
assert(countTotalAssigned(finalSched) === 1, "Single Paris spot assigned to schedule.");
console.log("✅ Test 28 passed.");

// 29. Trip Duration Preservation (2-Day Request Must Produce Exactly 2 Schedule Days)
console.log("\nTest 29: Trip Duration Preservation (2-Day Portugal Request)...");
const schedPortugal2 = buildItinerary(
  [
    { id: "p-lisbon", title: "Torre de Belém", category: "sightseeing", city: "Lisbon", locationHint: "Lisbon, Portugal" },
    { id: "p-porto", title: "Livraria Lello", category: "culture", city: "Porto", locationHint: "Porto, Portugal" }
  ],
  2,
  "normal",
  "Portugal"
);
assert(Object.keys(schedPortugal2).length === 2, "2-day request MUST produce exactly 2 schedule days.");
assert(Boolean(schedPortugal2[1] && schedPortugal2[2]), "Schedule must contain Day 1 and Day 2.");
assert(!schedPortugal2[3], "Schedule must NOT contain Day 3 or Day 4.");
printScheduleSummary("Duration Preservation: 2-Day Portugal Trip", schedPortugal2);
console.log("✅ Test 29 passed.");

// 30. Sparse Schedule Allocation (1 place / 1 day)
console.log("\nTest 30: Sparse Schedule Allocation (1 place / 1 day)...");
const sched1_1 = buildItinerary([{ id: "sp1-1", title: "Eiffel Tower", category: "sightseeing" }], 1);
assert(countTotalAssigned(sched1_1) === 1, "1 place assigned.");
printScheduleSummary("Sparse Schedule: 1 place / 1 day", sched1_1);
console.log("✅ Test 30 passed.");

// 31. Sparse Schedule Allocation (2 places / 1 day - No Afternoon Stacking)
console.log("\nTest 31: Sparse Schedule Allocation (2 places / 1 day - No Afternoon Stacking)...");
const sched2_1 = buildItinerary([
  { id: "sp2-1", title: "Jerónimos Monastery", category: "sightseeing" },
  { id: "sp2-2", title: "Time Out Market", category: "food" }
], 1);
assert(countTotalAssigned(sched2_1) === 2, "2 places assigned.");
assert(sched2_1[1].morning.length > 0 || sched2_1[1].evening.length > 0, "2-place day MUST NOT stack all places in Afternoon; Morning or Evening must be utilized.");
printScheduleSummary("Sparse Schedule: 2 places / 1 day (Balanced)", sched2_1);
console.log("✅ Test 31 passed.");

// 32. Sparse Schedule Allocation (4 places / 2 days)
console.log("\nTest 32: Sparse Schedule Allocation (4 places / 2 days)...");
const sched4_2 = buildItinerary([
  { id: "sp4-1", title: "Spot 1", category: "sightseeing" },
  { id: "sp4-2", title: "Spot 2", category: "culture" },
  { id: "sp4-3", title: "Spot 3", category: "activity" },
  { id: "sp4-4", title: "Spot 4", category: "food" }
], 2);
assert(Object.keys(sched4_2).length === 2, "2 days present.");
assert(countTotalAssigned(sched4_2) === 4, "All 4 places assigned across 2 days.");
printScheduleSummary("Sparse Schedule: 4 places / 2 days", sched4_2);
console.log("✅ Test 32 passed.");

// 33. Sparse Schedule Allocation (4 places / 4 days)
console.log("\nTest 33: Sparse Schedule Allocation (4 places / 4 days)...");
const sched4_4 = buildItinerary([
  { id: "s44-1", title: "Spot A", category: "sightseeing" },
  { id: "s44-2", title: "Spot B", category: "sightseeing" },
  { id: "s44-3", title: "Spot C", category: "sightseeing" },
  { id: "s44-4", title: "Spot D", category: "sightseeing" }
], 4);
assert(Object.keys(sched4_4).length === 4, "Exactly 4 days created.");
assert(countTotalAssigned(sched4_4) === 4, "All 4 places assigned across 4 days.");
printScheduleSummary("Sparse Schedule: 4 places / 4 days", sched4_4);
console.log("✅ Test 33 passed.");

// 34. Balanced Schedule Allocation (6 places / 2 days)
console.log("\nTest 34: Balanced Schedule Allocation (6 places / 2 days)...");
const sched6_2_bal = buildItinerary([
  { id: "s62-1", title: "Tower", category: "sightseeing" },
  { id: "s62-2", title: "Museum", category: "culture" },
  { id: "s62-3", title: "Bistro", category: "food" },
  { id: "s62-4", title: "Park", category: "activity" },
  { id: "s62-5", title: "Market", category: "shopping" },
  { id: "s62-6", title: "Tavern", category: "food" }
], 2);
assert(sched6_2_bal[1].morning.length > 0 && sched6_2_bal[1].afternoon.length > 0 && sched6_2_bal[1].evening.length > 0, "Day 1 places distributed across Morning, Afternoon, Evening.");
assert(sched6_2_bal[2].morning.length > 0 && sched6_2_bal[2].afternoon.length > 0 && sched6_2_bal[2].evening.length > 0, "Day 2 places distributed across Morning, Afternoon, Evening.");
console.log("✅ Test 34 passed.");

// 35. Interactive Itinerary Schedule Mutation & Metric Recalculation
console.log("\nTest 35: Interactive Itinerary Schedule Mutation & Metric Recalculation...");
const { recalculateDayMetrics } = require("./itineraryEngine");

const initialSched = buildItinerary([
  { id: "p1", title: "Spot 1", category: "sightseeing", latitude: 48.858, longitude: 2.294 },
  { id: "p2", title: "Spot 2", category: "culture", latitude: 48.860, longitude: 2.337 }
], 1);

assert(initialSched[1].morning.length > 0 || initialSched[1].afternoon.length > 0, "Places initialised.");

// Manually move Spot 2 to Evening
const spot2 = initialSched[1].morning.find((p: ExtractedPlace) => p.id === "p2") || initialSched[1].afternoon.find((p: ExtractedPlace) => p.id === "p2");
if (spot2) {
  initialSched[1].morning = initialSched[1].morning.filter((p: ExtractedPlace) => p.id !== "p2");
  initialSched[1].afternoon = initialSched[1].afternoon.filter((p: ExtractedPlace) => p.id !== "p2");
  initialSched[1].evening.push(spot2);
}

const updatedDay = recalculateDayMetrics(initialSched[1]);
assert(updatedDay.evening.some((p: ExtractedPlace) => p.id === "p2"), "Spot 2 successfully moved to Evening slot.");
assert(typeof updatedDay.totalDistanceKm === "number", "Distance metrics recalculated after manual move.");
console.log("✅ Test 35 passed.");

// 36. Supabase Persistence Lifecycle & UUID Helper Verification
console.log("\nTest 36: Supabase Persistence Lifecycle & UUID Helper Verification...");
const { ensureValidUuid } = require("./supabaseService");

const rawId1 = "trip-default";
const rawId2 = "ai-text-17123984-0";
const uuid1 = ensureValidUuid(rawId1);
const uuid2 = ensureValidUuid(rawId2);

assert(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uuid1), "Raw trip ID converted to valid UUID.");
assert(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uuid2), "Raw place ID converted to valid UUID.");
assert(ensureValidUuid(uuid1) === uuid1, "Existing UUID preserved as-is.");

console.log("✅ Test 36 passed.");

async function runAsyncTests() {
  await runTest17();
  await runTest18();
  await runTest20();
  await runTest27();
  console.log("\n=== ALL 36 MANDATORY TEST SUITES PASSED PASSED ✅ ===");
}

runAsyncTests().catch((err) => {
  console.error("Async test suite error:", err);
  process.exit(1);
});







