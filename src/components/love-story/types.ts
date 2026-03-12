import { Heart, Star, Plane, Trophy, CalendarHeart, Camera, MapPin, Gift, Music, Sunset } from "lucide-react";

// ─── Core Types ────────────────────────────────────────────────────────────────

export type TemplateId =
  | "eternal"
  | "polaroid"
  | "bold"
  | "cinema"
  | "bloom"
  | "neon"
  | "wabi"
  | "journal";

export interface Milestone {
  id: string;
  title: string;
  date: string;
  description: string | null;
  type: string;
}

export interface Profile {
  display_name: string | null;
  avatar_url: string | null;
}

export interface PaletteData {
  id: string;
  label: string;
  swatch: string;
  bg: string;
  accent: string;
  accentRgb: string;
  text: string;
  subtext: string;
  card: string;
  line: string;
  isDark: boolean;
}

export interface Customization {
  title: string;
  tagline: string;
  startDate: string;
  showStats: boolean;
  showTimeline: boolean;
  paletteId: string;
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

export const DEFAULT_CUSTOMIZATION: Customization = {
  title: "",
  tagline: "Forever and always ❤️",
  startDate: "",
  showStats: true,
  showTimeline: true,
  paletteId: "",
};

// ─── Palettes ─────────────────────────────────────────────────────────────────

export const PALETTES: Record<TemplateId, PaletteData[]> = {
  eternal: [
    { id: "rose", label: "Rose Quartz", swatch: "linear-gradient(135deg,#ffd6e0,#ffacc7)", bg: "linear-gradient(135deg,#fff0f3 0%,#ffe4ef 50%,#fce7ff 100%)", accent: "#f43f5e", accentRgb: "244,63,94", text: "#1a0a0f", subtext: "#7a3050", card: "rgba(255,255,255,0.72)", line: "#fecdd3", isDark: false },
    { id: "violet", label: "Amethyst", swatch: "linear-gradient(135deg,#c4b5fd,#a78bfa)", bg: "linear-gradient(135deg,#f5f0ff 0%,#ede9ff 50%,#fae8ff 100%)", accent: "#7c3aed", accentRgb: "124,58,237", text: "#1a0a2e", subtext: "#5b3d8a", card: "rgba(255,255,255,0.72)", line: "#ddd6fe", isDark: false },
    { id: "peach", label: "Peach Nectar", swatch: "linear-gradient(135deg,#fdba74,#fb923c)", bg: "linear-gradient(135deg,#fff7ed 0%,#ffedd5 50%,#ffe4e6 100%)", accent: "#ea580c", accentRgb: "234,88,12", text: "#1a0f00", subtext: "#6b4020", card: "rgba(255,255,255,0.72)", line: "#fed7aa", isDark: false },
    { id: "midnight", label: "Midnight Blush", swatch: "linear-gradient(135deg,#312e81,#1e1b4b)", bg: "linear-gradient(135deg,#0f0c29 0%,#302b63 50%,#24243e 100%)", accent: "#f472b6", accentRgb: "244,114,182", text: "#ffffff", subtext: "#c4b5fd", card: "rgba(255,255,255,0.07)", line: "rgba(244,114,182,0.3)", isDark: true },
    { id: "coral", label: "Coral Bliss", swatch: "linear-gradient(135deg,#ff9a9e,#fad0c4)", bg: "linear-gradient(135deg,#fff5f5 0%,#ffe0e0 50%,#fff0f5 100%)", accent: "#e05c6a", accentRgb: "224,92,106", text: "#1a0808", subtext: "#7a3040", card: "rgba(255,255,255,0.75)", line: "#ffc0cb", isDark: false },
  ],

  polaroid: [
    { id: "cream", label: "Classic Cream", swatch: "#fdf8f0", bg: "linear-gradient(160deg,#fdf8f0 0%,#f5ead8 100%)", accent: "#d97706", accentRgb: "217,119,6", text: "#2c1a0a", subtext: "#7c5a3a", card: "#ffffff", line: "#fde68a", isDark: false },
    { id: "vintage", label: "Aged Sepia", swatch: "#f0e0c8", bg: "linear-gradient(160deg,#f9f0e3 0%,#f0e0c8 100%)", accent: "#92400e", accentRgb: "146,64,14", text: "#1c0f00", subtext: "#6b4a2a", card: "#fffdf8", line: "#fcd34d", isDark: false },
    { id: "summer", label: "Golden Hour", swatch: "linear-gradient(135deg,#fbbf24,#f59e0b)", bg: "linear-gradient(160deg,#fffbeb 0%,#fef3c7 100%)", accent: "#d97706", accentRgb: "217,119,6", text: "#1c1300", subtext: "#6b5010", card: "#ffffff", line: "#fef3c7", isDark: false },
    { id: "dusk", label: "Dusk Film", swatch: "linear-gradient(135deg,#b45309,#78350f)", bg: "linear-gradient(160deg,#1a0f00 0%,#2d1a00 100%)", accent: "#fbbf24", accentRgb: "251,191,36", text: "#fef3c7", subtext: "#d97706", card: "rgba(255,255,255,0.06)", line: "rgba(251,191,36,0.25)", isDark: true },
  ],

  bold: [
    { id: "pure", label: "Arctic White", swatch: "#f8fafc", bg: "#f8fafc", accent: "#e11d48", accentRgb: "225,29,72", text: "#0f172a", subtext: "#475569", card: "#ffffff", line: "#fecdd3", isDark: false },
    { id: "noir", label: "Ink Black", swatch: "linear-gradient(135deg,#1e293b,#0f172a)", bg: "#0f172a", accent: "#fbbf24", accentRgb: "251,191,36", text: "#f8fafc", subtext: "#94a3b8", card: "rgba(255,255,255,0.05)", line: "rgba(251,191,36,0.3)", isDark: true },
    { id: "bold-blush", label: "Soft Blush", swatch: "linear-gradient(135deg,#fce7f3,#fdf2f8)", bg: "linear-gradient(160deg,#fdf2f8 0%,#f0f9ff 100%)", accent: "#db2777", accentRgb: "219,39,119", text: "#1e0a14", subtext: "#6b3a55", card: "rgba(255,255,255,0.9)", line: "#fbcfe8", isDark: false },
    { id: "electric", label: "Electric Blue", swatch: "linear-gradient(135deg,#1d4ed8,#2563eb)", bg: "linear-gradient(160deg,#eff6ff 0%,#dbeafe 100%)", accent: "#1d4ed8", accentRgb: "29,78,216", text: "#0a0f1e", subtext: "#3b4f8a", card: "rgba(255,255,255,0.9)", line: "#bfdbfe", isDark: false },
    { id: "slate-red", label: "Slate & Red", swatch: "linear-gradient(135deg,#334155,#e11d48)", bg: "linear-gradient(160deg,#1e293b 0%,#0f172a 100%)", accent: "#f43f5e", accentRgb: "244,63,94", text: "#f8fafc", subtext: "#94a3b8", card: "rgba(255,255,255,0.05)", line: "rgba(244,63,94,0.25)", isDark: true },
  ],

  cinema: [
    { id: "gold", label: "Hollywood Gold", swatch: "linear-gradient(135deg,#d97706,#92400e)", bg: "linear-gradient(160deg,#080810 0%,#14100a 50%,#080810 100%)", accent: "#f59e0b", accentRgb: "245,158,11", text: "#fef3c7", subtext: "#d97706", card: "rgba(245,158,11,0.08)", line: "rgba(245,158,11,0.25)", isDark: true },
    { id: "silver", label: "Silver Screen", swatch: "linear-gradient(135deg,#e2e8f0,#94a3b8)", bg: "linear-gradient(160deg,#080814 0%,#0f172a 100%)", accent: "#e2e8f0", accentRgb: "226,232,240", text: "#f1f5f9", subtext: "#94a3b8", card: "rgba(255,255,255,0.05)", line: "rgba(226,232,240,0.15)", isDark: true },
    { id: "cinema-rose", label: "Crimson Velvet", swatch: "linear-gradient(135deg,#fb7185,#e11d48)", bg: "linear-gradient(160deg,#0a0008 0%,#1a0015 100%)", accent: "#fb7185", accentRgb: "251,113,133", text: "#fff1f2", subtext: "#fda4af", card: "rgba(251,113,133,0.06)", line: "rgba(251,113,133,0.2)", isDark: true },
    { id: "teal-noir", label: "Teal Noir", swatch: "linear-gradient(135deg,#0d9488,#0f766e)", bg: "linear-gradient(160deg,#020d0c 0%,#0a1f1e 100%)", accent: "#2dd4bf", accentRgb: "45,212,191", text: "#f0fdfa", subtext: "#5eead4", card: "rgba(45,212,191,0.06)", line: "rgba(45,212,191,0.2)", isDark: true },
  ],

  bloom: [
    { id: "blush-bloom", label: "Cherry Bloom", swatch: "linear-gradient(135deg,#fce7f3,#fbcfe8)", bg: "linear-gradient(135deg,#fff1f7 0%,#fce7f3 50%,#f5f0ff 100%)", accent: "#db2777", accentRgb: "219,39,119", text: "#1e0a14", subtext: "#7a3050", card: "rgba(255,255,255,0.65)", line: "#fecdd3", isDark: false },
    { id: "lavender", label: "Wisteria", swatch: "linear-gradient(135deg,#e9d5ff,#c4b5fd)", bg: "linear-gradient(135deg,#fdf4ff 0%,#ede9fe 50%,#e0f2fe 100%)", accent: "#7c3aed", accentRgb: "124,58,237", text: "#1a0a2e", subtext: "#5b3d8a", card: "rgba(255,255,255,0.65)", line: "#ddd6fe", isDark: false },
    { id: "mint", label: "Eucalyptus", swatch: "linear-gradient(135deg,#a7f3d0,#6ee7b7)", bg: "linear-gradient(135deg,#ecfdf5 0%,#d1fae5 50%,#cffafe 100%)", accent: "#059669", accentRgb: "5,150,105", text: "#0a1f17", subtext: "#3a6a5a", card: "rgba(255,255,255,0.65)", line: "#a7f3d0", isDark: false },
    { id: "terra", label: "Terracotta", swatch: "linear-gradient(135deg,#fb923c,#f97316)", bg: "linear-gradient(135deg,#fff7f0 0%,#ffe8d6 50%,#fef3c7 100%)", accent: "#c2410c", accentRgb: "194,65,12", text: "#1a0800", subtext: "#6b3010", card: "rgba(255,255,255,0.65)", line: "#fed7aa", isDark: false },
  ],

  neon: [
    { id: "neon-pink", label: "Neon Haze", swatch: "linear-gradient(135deg,#ec4899,#8b5cf6)", bg: "linear-gradient(135deg,#0d0015 0%,#120025 50%,#0a0a1a 100%)", accent: "#f0abfc", accentRgb: "240,171,252", text: "#fdf4ff", subtext: "#c084fc", card: "rgba(240,171,252,0.07)", line: "rgba(240,171,252,0.2)", isDark: true },
    { id: "neon-cyan", label: "Cyber Teal", swatch: "linear-gradient(135deg,#06b6d4,#0ea5e9)", bg: "linear-gradient(135deg,#000d14 0%,#001a24 50%,#000d14 100%)", accent: "#22d3ee", accentRgb: "34,211,238", text: "#ecfeff", subtext: "#67e8f9", card: "rgba(34,211,238,0.06)", line: "rgba(34,211,238,0.18)", isDark: true },
    { id: "neon-green", label: "Matrix Green", swatch: "linear-gradient(135deg,#16a34a,#15803d)", bg: "linear-gradient(135deg,#000d05 0%,#001a0a 50%,#000d05 100%)", accent: "#4ade80", accentRgb: "74,222,128", text: "#f0fdf4", subtext: "#86efac", card: "rgba(74,222,128,0.06)", line: "rgba(74,222,128,0.18)", isDark: true },
    { id: "neon-sunset", label: "Retrowave", swatch: "linear-gradient(135deg,#f97316,#ec4899)", bg: "linear-gradient(135deg,#0f0005 0%,#1a000f 50%,#0a0510 100%)", accent: "#fb923c", accentRgb: "249,146,60", text: "#fff7ed", subtext: "#fdba74", card: "rgba(249,146,60,0.07)", line: "rgba(249,146,60,0.2)", isDark: true },
  ],

  wabi: [
    { id: "wabi-ash", label: "Warm Ash", swatch: "linear-gradient(135deg,#d6d3d1,#a8a29e)", bg: "linear-gradient(135deg,#fafaf9 0%,#f5f5f4 100%)", accent: "#78716c", accentRgb: "120,113,108", text: "#1c1917", subtext: "#57534e", card: "rgba(255,255,255,0.8)", line: "#e7e5e4", isDark: false },
    { id: "wabi-clay", label: "Clay Earth", swatch: "linear-gradient(135deg,#c2a27a,#a37c50)", bg: "linear-gradient(135deg,#fdf6ee 0%,#f5ead8 100%)", accent: "#92400e", accentRgb: "146,64,14", text: "#1c0f00", subtext: "#5c4033", card: "rgba(255,255,255,0.75)", line: "#e5c9a0", isDark: false },
    { id: "wabi-ink", label: "Sumi Ink", swatch: "linear-gradient(135deg,#3f3f46,#18181b)", bg: "linear-gradient(135deg,#09090b 0%,#18181b 100%)", accent: "#d4d4d8", accentRgb: "212,212,216", text: "#fafafa", subtext: "#a1a1aa", card: "rgba(255,255,255,0.05)", line: "rgba(212,212,216,0.15)", isDark: true },
    { id: "wabi-sage", label: "Sage Forest", swatch: "linear-gradient(135deg,#84cc16,#65a30d)", bg: "linear-gradient(135deg,#f7fee7 0%,#ecfccb 100%)", accent: "#4d7c0f", accentRgb: "77,124,15", text: "#0f1a00", subtext: "#3a5c10", card: "rgba(255,255,255,0.75)", line: "#bef264", isDark: false },
  ],

  journal: [
    { id: "journal-ivory", label: "Cream Pages", swatch: "#fefce8", bg: "linear-gradient(160deg,#fefce8 0%,#fef9c3 100%)", accent: "#854d0e", accentRgb: "133,77,14", text: "#1c0f00", subtext: "#6b4a1a", card: "rgba(255,255,255,0.85)", line: "#fde047", isDark: false },
    { id: "journal-blue", label: "Blueprint", swatch: "linear-gradient(135deg,#dbeafe,#bfdbfe)", bg: "linear-gradient(160deg,#eff6ff 0%,#dbeafe 100%)", accent: "#1d4ed8", accentRgb: "29,78,216", text: "#0a0f1e", subtext: "#3b4f8a", card: "rgba(255,255,255,0.85)", line: "#93c5fd", isDark: false },
    { id: "journal-rose", label: "Love Letter", swatch: "linear-gradient(135deg,#ffe4e6,#fecdd3)", bg: "linear-gradient(160deg,#fff1f2 0%,#ffe4e6 100%)", accent: "#be123c", accentRgb: "190,18,60", text: "#1a0008", subtext: "#6b1030", card: "rgba(255,255,255,0.85)", line: "#fda4af", isDark: false },
    { id: "journal-night", label: "Night Ink", swatch: "linear-gradient(135deg,#1e3a5f,#0f2040)", bg: "linear-gradient(160deg,#060e1c 0%,#0f2040 100%)", accent: "#93c5fd", accentRgb: "147,197,253", text: "#eff6ff", subtext: "#93c5fd", card: "rgba(147,197,253,0.06)", line: "rgba(147,197,253,0.2)", isDark: true },
  ],
};

// ─── Template Metadata ─────────────────────────────────────────────────────────

export const TEMPLATE_META: Record<TemplateId, { label: string; description: string; emoji: string }> = {
  eternal: { label: "Eternal", description: "Soft gradients, floating hearts, romantic timeline", emoji: "🌸" },
  polaroid: { label: "Polaroid", description: "Warm cream, scattered polaroid memories", emoji: "📸" },
  bold: { label: "Bold", description: "High-impact typography, dramatic & minimal", emoji: "✦" },
  cinema: { label: "Cinema", description: "Dark luxury, film aesthetic, gold accents", emoji: "🎬" },
  bloom: { label: "Bloom", description: "Botanical pastels, floral ornaments, elegant", emoji: "🌺" },
  neon: { label: "Neon", description: "Dark cyberpunk, glowing accents, futuristic vibes", emoji: "💜" },
  wabi: { label: "Wabi", description: "Wabi-sabi minimalism, earthy tones, raw beauty", emoji: "🪨" },
  journal: { label: "Journal", description: "Handwritten diary aesthetic, paper textures", emoji: "📖" },
};

// ─── Icons ─────────────────────────────────────────────────────────────────────

export const MILESTONE_ICONS: Record<string, typeof Heart> = {
  anniversary: CalendarHeart,
  milestone: Star,
  trip: Plane,
  birthday: Gift,
  photo: Camera,
  place: MapPin,
  music: Music,
  sunset: Sunset,
  default: Trophy,
};

export const HEARTS_POS = [
  { top: "7%", left: "6%", sz: 12, op: 0.14, d: "0s" },
  { top: "13%", right: "8%", sz: 18, op: 0.11, d: "0.8s" },
  { top: "35%", left: "4%", sz: 10, op: 0.09, d: "1.4s" },
  { top: "55%", right: "5%", sz: 14, op: 0.12, d: "0.3s" },
  { top: "72%", left: "7%", sz: 15, op: 0.09, d: "1.1s" },
  { top: "84%", right: "10%", sz: 11, op: 0.11, d: "0.6s" },
];