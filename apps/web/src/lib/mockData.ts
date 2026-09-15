import { Product, Seller, Plan } from "./types";

export const categories = [
  "Ceramics",
  "Jewelry",
  "Candles & Home",
  "Leather Goods",
  "Art Prints",
  "Textiles",
];

export const sellers: Seller[] = [
  {
    id: "willow-clay",
    name: "Willow & Clay Studio",
    tagline: "Wheel-thrown stoneware, made in small batches",
    location: "Chiang Mai, TH",
    avatarSeed: "willow-clay-avatar",
    bannerSeed: "willow-clay-banner",
    rating: 4.9,
    reviewCount: 812,
    productCount: 34,
    verified: true,
    isPro: true,
    joined: "2023",
  },
  {
    id: "north-ridge",
    name: "North Ridge Leather",
    tagline: "Full-grain leather goods, hand-stitched to order",
    location: "Portland, US",
    avatarSeed: "north-ridge-avatar",
    bannerSeed: "north-ridge-banner",
    rating: 4.8,
    reviewCount: 431,
    productCount: 21,
    verified: true,
    isPro: true,
    joined: "2022",
  },
  {
    id: "ember-wick",
    name: "Ember & Wick",
    tagline: "Small-batch soy candles, botanical scents",
    location: "Bristol, UK",
    avatarSeed: "ember-wick-avatar",
    bannerSeed: "ember-wick-banner",
    rating: 4.7,
    reviewCount: 288,
    productCount: 18,
    verified: false,
    isPro: false,
    joined: "2024",
  },
  {
    id: "paper-fox",
    name: "Paper Fox Prints",
    tagline: "Original linocut & riso prints",
    location: "Kyoto, JP",
    avatarSeed: "paper-fox-avatar",
    bannerSeed: "paper-fox-banner",
    rating: 5.0,
    reviewCount: 156,
    productCount: 42,
    verified: true,
    isPro: false,
    joined: "2023",
  },
];

export const products: Product[] = [
  { id: "p1", title: "Speckled Stoneware Mug", price: 28, imageSeed: "mug1", sellerId: "willow-clay", category: "Ceramics", rating: 4.9, reviewCount: 214, badge: "Bestseller" },
  { id: "p2", title: "Matte Cream Dinner Bowl Set", price: 64, compareAtPrice: 78, imageSeed: "bowl1", sellerId: "willow-clay", category: "Ceramics", rating: 4.8, reviewCount: 97, badge: "Member Deal" },
  { id: "p3", title: "Hand-Stitched Card Wallet", price: 46, imageSeed: "wallet1", sellerId: "north-ridge", category: "Leather Goods", rating: 4.9, reviewCount: 152, badge: "New" },
  { id: "p4", title: "Weekender Leather Duffel", price: 218, imageSeed: "duffel1", sellerId: "north-ridge", category: "Leather Goods", rating: 4.7, reviewCount: 63 },
  { id: "p5", title: "Cedar & Fig Soy Candle", price: 24, imageSeed: "candle1", sellerId: "ember-wick", category: "Candles & Home", rating: 4.6, reviewCount: 88 },
  { id: "p6", title: "Amber Glass Candle Trio", price: 58, compareAtPrice: 68, imageSeed: "candle2", sellerId: "ember-wick", category: "Candles & Home", rating: 4.8, reviewCount: 41, badge: "Member Deal" },
  { id: "p7", title: "Quiet Morning — Linocut Print", price: 38, imageSeed: "print1", sellerId: "paper-fox", category: "Art Prints", rating: 5.0, reviewCount: 76, badge: "Bestseller" },
  { id: "p8", title: "Terraced Hills Riso Print, A3", price: 32, imageSeed: "print2", sellerId: "paper-fox", category: "Art Prints", rating: 4.9, reviewCount: 54 },
  { id: "p9", title: "Hammered Brass Hoop Earrings", price: 36, imageSeed: "earrings1", sellerId: "willow-clay", category: "Jewelry", rating: 4.7, reviewCount: 121, badge: "New" },
  { id: "p10", title: "Chunky Wool Throw Blanket", price: 89, imageSeed: "throw1", sellerId: "ember-wick", category: "Textiles", rating: 4.8, reviewCount: 33, badge: "Low Stock" },
  { id: "p11", title: "Raw-Edge Ceramic Vase", price: 52, imageSeed: "vase1", sellerId: "willow-clay", category: "Ceramics", rating: 4.9, reviewCount: 189 },
  { id: "p12", title: "Minimal Leather Watch Strap", price: 34, imageSeed: "strap1", sellerId: "north-ridge", category: "Leather Goods", rating: 4.6, reviewCount: 47 },
];

export const plans: Plan[] = [
  {
    id: "buyer-free",
    audience: "buyer",
    name: "Free",
    price: 0,
    interval: "mo",
    tagline: "Browse and shop the full marketplace",
    features: ["Full marketplace access", "Standard shipping rates", "Order tracking", "Save favorite shops"],
  },
  {
    id: "buyer-plus",
    audience: "buyer",
    name: "Shoppan+",
    price: 6,
    interval: "mo",
    tagline: "For people who shop small often",
    features: [
      "Free shipping on every order",
      "Early access to new drops & sales",
      "10% member discount storewide",
      "Ad-free browsing",
      "60-day extended returns",
    ],
    highlighted: true,
  },
  {
    id: "seller-starter",
    audience: "seller",
    name: "Starter",
    price: 0,
    interval: "mo",
    tagline: "Everything you need to open your shop",
    features: ["Up to 25 active listings", "8% commission per sale", "Standard search placement", "Basic sales summary"],
  },
  {
    id: "seller-pro",
    audience: "seller",
    name: "Pro",
    price: 15,
    interval: "mo",
    tagline: "For shops ready to grow",
    features: [
      "Unlimited listings",
      "5% commission per sale",
      "Priority placement in search & category pages",
      "Full analytics dashboard",
      "Run promotions & discount codes",
    ],
    highlighted: true,
  },
];

export function getProductsBySeller(sellerId: string) {
  return products.filter((p) => p.sellerId === sellerId);
}

export function getSeller(sellerId: string) {
  return sellers.find((s) => s.id === sellerId);
}

export function getProduct(productId: string) {
  return products.find((p) => p.id === productId);
}
