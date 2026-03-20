// ============================================================
//  ZUNITRA — Firestore Seed Script
//  Run this ONCE in your browser console (on any page of the site)
//  after replacing Firebase config, to populate product data.
//  Call: seedProducts()
// ============================================================

import { db } from "./firebase-config.js";
import { collection, doc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

export const PRODUCTS = [
  {
    id: "hg-7201",
    brand: "Zunitra",
    name: "Perpetuelle Noire",
    ref: "ZN-7201",
    category: "dress",
    price: 18500,
    originalPrice: null,
    badge: "new",
    rating: 5,
    reviews: 42,
    stock: 8,
    color: "#1A0A00",
    accentColor: "#C9A84C",
    desc: "The Perpetuelle Noire is our most celebrated dress watch — a masterwork of restraint. Its onyx-lacquered dial features hand-applied gold indices and a self-winding movement with 72-hour power reserve.",
    longDesc: "Conceived in our Geneva atelier over three years, the Perpetuelle Noire represents the pinnacle of understated luxury. The dial is formed from a single piece of Tahitian onyx, polished over 120 hours to achieve its mirror-like depth. Each gold index is hand-applied by a single craftsman who has dedicated 30 years to this singular art. The self-winding movement — Calibre ZN-500 — features a micro-rotor in 18k rose gold and a patented shock-absorption system that ensures timekeeping precision to ±2 seconds per day.",
    specs: { "Case Material": "42mm Rose Gold 18k", "Movement": "Cal. ZN-500 Automatic", "Power Reserve": "72 Hours", "Water Resistance": "50m / 5 ATM", "Crystal": "Sapphire AR Double-Coated", "Strap": "Alligator Noir, Pin Buckle", "Dial": "Tahitian Onyx", "Indices": "Hand-applied 18k Gold" }
  },
  {
    id: "hg-4455",
    brand: "Zunitra",
    name: "Chrono Impérial",
    ref: "ZN-4455",
    category: "complications",
    price: 32000,
    originalPrice: 36000,
    badge: "sale",
    rating: 5,
    reviews: 18,
    stock: 3,
    color: "#1A0D00",
    accentColor: "#E8A050",
    desc: "A split-seconds chronograph of breathtaking complexity. The rose gold case houses a manually wound movement requiring 850 hours of hand-finishing by a single master watchmaker.",
    longDesc: "The Chrono Impérial is not merely a watch — it is a declaration. Requiring 850 hours of hand-finishing by a single master watchmaker, its split-seconds mechanism allows the simultaneous timing of two events without interrupting the primary chronograph. The column wheel, constructed from 47 individual components, is visible through the sapphire case-back, rhodium-plated to a mirror shine that serves no practical purpose beyond beauty.",
    specs: { "Case Material": "40mm Rose Gold 18k", "Movement": "Cal. ZN-750 Manual Wind", "Power Reserve": "55 Hours", "Water Resistance": "30m / 3 ATM", "Crystal": "Box-form Sapphire", "Strap": "Tobacco Alligator, Deployant", "Complication": "Split-seconds Chronograph", "Finishing": "850 hours hand-finishing" }
  },
  {
    id: "hg-9900",
    brand: "Zunitra",
    name: "Aqua Profonde",
    ref: "ZN-9900",
    category: "sport",
    price: 12800,
    originalPrice: null,
    badge: "",
    rating: 4,
    reviews: 76,
    stock: 15,
    color: "#001A20",
    accentColor: "#4ABCD4",
    desc: "Born from deep-sea exploration and refined over six decades, the Aqua Profonde withstands depths to 600m while maintaining elegance befitting a formal dinner.",
    longDesc: "The Aqua Profonde was first conceived in 1962 when master watchmaker Jules Harmon descended to 580 metres in a research submersible wearing an early prototype strapped to the hull. Today's edition maintains that spirit of adventure while adding six decades of refinement. The titanium case — grade 5 aerospace alloy — is paired with a ceramic bezel insert whose graduation cannot fade. A helium escape valve at 10 o'clock enables saturation diving.",
    specs: { "Case Material": "44mm Grade 5 Titanium", "Movement": "Cal. ZN-300 Automatic", "Power Reserve": "60 Hours", "Water Resistance": "600m / 60 ATM", "Crystal": "Domed Sapphire with AR", "Bracelet": "Titanium with Wetsuit Clasp", "Bezel": "Unidirectional Ceramic", "Helium Valve": "Yes, 10 o'clock position" }
  },
  {
    id: "hg-0001",
    brand: "Zunitra",
    name: "Grande Complication",
    ref: "ZN-0001",
    category: "limited",
    price: 125000,
    originalPrice: null,
    badge: "limited",
    rating: 5,
    reviews: 7,
    stock: 2,
    color: "#0A0A1A",
    accentColor: "#B0C4DE",
    desc: "Our magnum opus. Features perpetual calendar, minute repeater, and tourbillon in an 18k white gold case.",
    longDesc: "There are fewer than 12 watchmakers alive who can assemble the Grande Complication. Its 712 components — each hand-finished to a standard exceeding any industrial benchmark — must be assembled in a temperature-controlled room where even the watchmaker's breath could disturb the balance. The tourbillon cage rotates once per minute; the minute repeater strikes the hours, quarter-hours and minutes on two cathedral gongs; and the perpetual calendar will not require adjustment until the year 2100.",
    specs: { "Case Material": "45mm White Gold 18k", "Movement": "Cal. ZN-Grand Manual", "Power Reserve": "48 Hours", "Water Resistance": "30m", "Complications": "Perp. Calendar, Min. Repeater, Tourbillon", "Crystal": "Anti-reflective Sapphire", "Strap": "Handstitched Ostrich", "Components": "712 individual parts" }
  },
  {
    id: "hg-1020",
    brand: "Zunitra",
    name: "Classique Slim",
    ref: "ZN-1020",
    category: "dress",
    price: 8900,
    originalPrice: null,
    badge: "",
    rating: 5,
    reviews: 94,
    stock: 20,
    color: "#1A1500",
    accentColor: "#D4A820",
    desc: "Ultra-thin at 5.8mm, the Classique Slim is the quintessence of horological elegance with a champagne sunburst dial.",
    longDesc: "At 5.8mm, the Classique Slim slides beneath a shirt cuff like a whispered secret. Its champagne sunburst dial — achieved by spinning a brass blank against a diamond-tipped wheel — changes colour with the light, shifting from warm gold at noon to deep amber by candlelight. The Breguet numerals are engraved directly into the dial using a rose engine dating to 1889. The hand-wound movement, just 2.1mm thick, is wound each morning as a ritual of intention.",
    specs: { "Case Material": "38mm Yellow Gold 18k", "Movement": "Cal. ZN-Slim Manual", "Thickness": "5.8mm total", "Water Resistance": "30m", "Crystal": "Flat Sapphire", "Strap": "Havana Alligator, Ardillon Buckle", "Dial": "Champagne Sunburst", "Numerals": "Breguet, Rose-engine engraved" }
  },
  {
    id: "hg-6600",
    brand: "Zunitra",
    name: "GMT Voyageur",
    ref: "ZN-6600",
    category: "sport",
    price: 15200,
    originalPrice: null,
    badge: "new",
    rating: 4,
    reviews: 33,
    stock: 10,
    color: "#001A10",
    accentColor: "#60D080",
    desc: "Designed for the globe-trotting connoisseur. Tracks four time zones simultaneously with independent hour adjustment.",
    longDesc: "The GMT Voyageur was developed in consultation with commercial airline captains who complained that existing GMT watches required setting the time to change zones, disrupting the running seconds display. Our patented quick-set mechanism allows the local hour hand to jump in 1-hour increments independently of the movement, while the home-time hand continues its immutable course. The world-time disc features 24 city names hand-engraved in two fonts: Roman for the eastern hemisphere, italic for the western.",
    specs: { "Case Material": "42mm Steel & Rose Gold", "Movement": "Cal. ZN-GMT Automatic", "Power Reserve": "68 Hours", "Water Resistance": "100m / 10 ATM", "Crystal": "Anti-reflective Sapphire", "Bracelet": "Oyster-link Steel", "Time Zones": "4 simultaneous", "GMT Hand": "Independently adjustable" }
  },
  {
    id: "hg-3300",
    brand: "Zunitra",
    name: "Squelette Royal",
    ref: "ZN-3300",
    category: "complications",
    price: 48500,
    originalPrice: null,
    badge: "limited",
    rating: 5,
    reviews: 12,
    stock: 4,
    color: "#0A0A0A",
    accentColor: "#C0C0C0",
    desc: "The Squelette Royal removes all non-essential material to reveal the ballet of 312 components with hand-engraved bridges.",
    longDesc: "Skeletonisation is the most unforgiving art in watchmaking. Every gram removed must be precisely calculated against the structural integrity of the movement; every edge must be bevelled and polished to a standard that can only be verified under 30x magnification. Our master engraver — one of three in the world trained in this specific school — spends six weeks on each Squelette Royal, carving botanical motifs inspired by the flora of the Jura mountains into the platinum bridges.",
    specs: { "Case Material": "41mm Platinum 950", "Movement": "Cal. ZN-Skel Manual", "Power Reserve": "50 Hours", "Water Resistance": "30m", "Crystal": "Sapphire Front & Case-Back", "Strap": "Navy Alligator, Platinum Buckle", "Engraving": "Hand-engraved botanical motifs", "Finishing": "Six weeks per piece" }
  },
  {
    id: "hg-2211",
    brand: "Zunitra",
    name: "Régulateur Moderne",
    ref: "ZN-2211",
    category: "dress",
    price: 22000,
    originalPrice: null,
    badge: "",
    rating: 5,
    reviews: 28,
    stock: 6,
    color: "#080808",
    accentColor: "#9090A0",
    desc: "Separates hours, minutes and seconds onto distinct axes for maximum legibility. Features a meteorite dial.",
    longDesc: "In the 19th century, master clock-makers separated hours, minutes and seconds onto individual dials to eliminate the visual confusion of overlapping hands — the Régulateur. We have translated this tradition into a wristwatch for the modern age, using a natural meteorite dial cut from the Gibeon iron meteorite discovered in Namibia in 1836. Every dial is unique; the Widmanstätten pattern — formed over billions of years as iron cooled in space — ensures no two are alike.",
    specs: { "Case Material": "40mm Grade 5 Titanium", "Movement": "Cal. ZN-Reg Automatic", "Power Reserve": "80 Hours", "Water Resistance": "50m / 5 ATM", "Crystal": "Sapphire with AR", "Strap": "Anthracite Alligator, Deployant", "Dial": "Gibeon Meteorite, Natural Pattern", "Layout": "Regulator (separated H/M/S)" }
  }
];

export async function seedProducts() {
  console.log("🌱 Seeding Firestore with product data...");
  for (const product of PRODUCTS) {
    await setDoc(doc(db, "products", product.id), {
      ...product,
      createdAt: serverTimestamp()
    });
    console.log(`✅ Added: ${product.name}`);
  }
  console.log("🎉 Seed complete! All products added to Firestore.");
}

// Expose to window for console usage
window.seedProducts = seedProducts;
