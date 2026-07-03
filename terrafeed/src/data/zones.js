// Climate zone crop knowledge base for the Local Food Stability advisor.
// Zones follow Köppen climate groups, mapped to practical grower guidance.
// Sources: USDA plant hardiness guidance, FAO crop calendars, extension service data.

export const CLIMATE_ZONES = [
  {
    id: "tropical",
    name: "Tropical",
    koppen: "A",
    latBand: [-23.5, 23.5],
    description: "Year-round warmth, high humidity, wet/dry seasons rather than winters.",
    staples: ["Cassava", "Rice", "Plantains", "Yams", "Taro"],
    highValue: ["Mangoes", "Papaya", "Coconut", "Cacao", "Coffee (highlands)"],
    fastFood: ["Sweet potato greens", "Amaranth", "Okra", "Cowpeas"],
    risks: ["Cyclone/hurricane crop loss", "Flooding during wet season", "Fungal disease pressure"],
    stabilityMoves: [
      "Stagger plantings across wet/dry season boundary to avoid total-loss events",
      "Prioritize root crops (cassava, yams) — they survive storms that flatten grain",
      "Community seed banks matter most here: post-cyclone replanting speed decides recovery",
    ],
    waterNote: "Rainfall usually sufficient; drainage is the bigger engineering problem.",
  },
  {
    id: "arid",
    name: "Arid / Semi-Arid",
    koppen: "B",
    latBand: null, // determined by precipitation, not latitude
    description: "Low rainfall, high evaporation, large day-night temperature swings.",
    staples: ["Sorghum", "Pearl millet", "Teff", "Drought-tolerant maize"],
    highValue: ["Dates", "Pomegranates", "Pistachios", "Dragon fruit"],
    fastFood: ["Tepary beans", "Moringa", "Prickly pear (nopal)", "Purslane"],
    risks: ["Multi-year drought", "Well/aquifer depletion", "Heat waves during flowering"],
    stabilityMoves: [
      "Sorghum and millet over maize — same use cases, half the water",
      "Drip irrigation + mulching cuts water use 40-60% vs flood irrigation",
      "Zai pits and half-moon berms (proven in the Sahel) rebuild soil water retention",
    ],
    waterNote: "Water is the binding constraint. Every crop decision is a water decision first.",
  },
  {
    id: "temperate",
    name: "Temperate",
    koppen: "C",
    latBand: [[23.5, 45], [-45, -23.5]],
    description: "Mild winters, warm summers, reliable growing season of 6-9 months.",
    staples: ["Wheat", "Potatoes", "Corn", "Soybeans", "Rice (warm temperate)"],
    highValue: ["Citrus (frost-free zones)", "Wine grapes", "Berries", "Stone fruit"],
    fastFood: ["Leafy greens (year-round in mild zones)", "Radishes", "Bush beans", "Squash"],
    risks: ["Late spring frost", "Summer drought", "Shifting hardiness zones"],
    stabilityMoves: [
      "Season extension (row covers, low tunnels) adds 6-10 weeks of local production",
      "Diversify beyond the county's dominant crop — monoculture regions crash together",
      "Cold storage co-ops let small growers hold harvest instead of dumping at peak",
    ],
    waterNote: "Generally adequate; irrigation needed for summer vegetables in Mediterranean subtypes.",
  },
  {
    id: "continental",
    name: "Continental",
    koppen: "D",
    latBand: [[45, 60], [-60, -45]],
    description: "Cold winters, short intense summers, 3-5 month growing season.",
    staples: ["Wheat", "Barley", "Oats", "Potatoes", "Rye"],
    highValue: ["Canola", "Sugar beets", "Apples (hardy varieties)", "Sour cherries"],
    fastFood: ["Peas", "Lettuce", "Kale", "Turnips", "Storage cabbage"],
    risks: ["Short season — one bad month is the season", "Early fall frost", "Winterkill"],
    stabilityMoves: [
      "Root cellars and storage crops (cabbage, potatoes, roots) cover the 7-month gap",
      "Greenhouse/high-tunnel infrastructure has the highest food-security ROI in this zone",
      "Fast-maturing varieties (60-75 day) beat high-yield slow varieties on risk",
    ],
    waterNote: "Snowmelt usually provides spring moisture; late-summer drought is the watch item.",
  },
  {
    id: "polar_highland",
    name: "Polar / Highland",
    koppen: "E/H",
    latBand: [[60, 90], [-90, -60]],
    description: "Growing season under 3 months or high-altitude conditions.",
    staples: ["Potatoes (short season)", "Barley (hardiest grain)", "Quinoa (Andean highlands)"],
    highValue: ["Greenhouse greens", "Berries (cloudberry, lingonberry)", "Cold-water aquaculture"],
    fastFood: ["Sprouts and microgreens (indoor)", "Radishes", "Spinach"],
    risks: ["Frost any month of the year", "Extreme import dependence", "Supply line fragility"],
    stabilityMoves: [
      "Indoor/greenhouse production is not optional here — it's the core strategy",
      "Preservation infrastructure (freezing, drying, fermenting) multiplies short-season output",
      "Community-scale hydroponics beats individual gardens on energy cost per calorie",
    ],
    waterNote: "Water abundant; usable heat and light are the constraints.",
  },
];

// Rough zone lookup from latitude (arid zones need precipitation data to refine —
// the UI pairs this with live Open-Meteo data to adjust).
export function zoneFromLatitude(lat) {
  const a = Math.abs(lat);
  if (a <= 23.5) return CLIMATE_ZONES[0];
  if (a <= 45) return CLIMATE_ZONES[2];
  if (a <= 60) return CLIMATE_ZONES[3];
  return CLIMATE_ZONES[4];
}

// Refine with live precipitation: if 7-day precip is very low and temps high, lean arid.
export function refineZone(baseZone, weeklyPrecipInches, avgHighF) {
  if (baseZone.id !== "polar_highland" && weeklyPrecipInches < 0.15 && avgHighF > 85) {
    return CLIMATE_ZONES[1]; // arid
  }
  return baseZone;
}

// What growers in any zone need, ranked - shown as the universal layer.
export const UNIVERSAL_GROWER_NEEDS = [
  { need: "Market access", detail: "A grower 30 minutes from buyers with no aggregation point loses 20-40% of value to middlemen or waste." },
  { need: "Storage & cold chain", detail: "Post-harvest loss runs 15-30% in most regions. Storage is cheaper than growing more." },
  { need: "Water security", detail: "Predictable water beats abundant water. Small-scale irrigation is the highest-yield-per-dollar input." },
  { need: "Seed & input access", detail: "Locally-adapted seed varieties outperform imported 'improved' varieties in stress years." },
  { need: "Price information", detail: "Growers with market price data negotiate 10-25% better prices. This is what this platform provides." },
];
