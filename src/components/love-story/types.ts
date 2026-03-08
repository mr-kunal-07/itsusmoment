import { Heart, Star, Plane, Trophy, CalendarHeart, Camera, MapPin, Gift } from "lucide-react";

export type TemplateId = "eternal" | "polaroid" | "bold" | "cinema" | "bloom";

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

export const DEFAULT_CUSTOMIZATION: Customization = {
  title: "",
  tagline: "Forever and always ❤️",
  startDate: "",
  showStats: true,
  showTimeline: true,
  paletteId: "",
};

export const PALETTES: Record<TemplateId, PaletteData[]> = {
  eternal: [
    { id: "rose", label: "Rose", swatch: "linear-gradient(135deg,#ffd6e0,#ffacc7)", bg: "linear-gradient(135deg,#fff0f3 0%,#ffe4ef 50%,#fce7ff 100%)", accent: "#f43f5e", accentRgb: "244,63,94", text: "#1a0a0f", subtext: "#7a3050", card: "rgba(255,255,255,0.72)", line: "#fecdd3", isDark: false },
    { id: "violet", label: "Violet", swatch: "linear-gradient(135deg,#c4b5fd,#a78bfa)", bg: "linear-gradient(135deg,#f5f0ff 0%,#ede9ff 50%,#fae8ff 100%)", accent: "#7c3aed", accentRgb: "124,58,237", text: "#1a0a2e", subtext: "#5b3d8a", card: "rgba(255,255,255,0.72)", line: "#ddd6fe", isDark: false },
    { id: "peach", label: "Peach", swatch: "linear-gradient(135deg,#fdba74,#fb923c)", bg: "linear-gradient(135deg,#fff7ed 0%,#ffedd5 50%,#ffe4e6 100%)", accent: "#ea580c", accentRgb: "234,88,12", text: "#1a0f00", subtext: "#6b4020", card: "rgba(255,255,255,0.72)", line: "#fed7aa", isDark: false },
    { id: "midnight", label: "Midnight", swatch: "linear-gradient(135deg,#312e81,#1e1b4b)", bg: "linear-gradient(135deg,#0f0c29 0%,#302b63 50%,#24243e 100%)", accent: "#f472b6", accentRgb: "244,114,182", text: "#ffffff", subtext: "#c4b5fd", card: "rgba(255,255,255,0.07)", line: "rgba(244,114,182,0.3)", isDark: true },
  ],
  polaroid: [
    { id: "cream", label: "Cream", swatch: "#fdf8f0", bg: "linear-gradient(160deg,#fdf8f0 0%,#f5ead8 100%)", accent: "#d97706", accentRgb: "217,119,6", text: "#2c1a0a", subtext: "#7c5a3a", card: "#ffffff", line: "#fde68a", isDark: false },
    { id: "vintage", label: "Vintage", swatch: "#f0e0c8", bg: "linear-gradient(160deg,#f9f0e3 0%,#f0e0c8 100%)", accent: "#92400e", accentRgb: "146,64,14", text: "#1c0f00", subtext: "#6b4a2a", card: "#fffdf8", line: "#fcd34d", isDark: false },
    { id: "summer", label: "Summer", swatch: "linear-gradient(135deg,#fbbf24,#f59e0b)", bg: "linear-gradient(160deg,#fffbeb 0%,#fef3c7 100%)", accent: "#d97706", accentRgb: "217,119,6", text: "#1c1300", subtext: "#6b5010", card: "#ffffff", line: "#fef3c7", isDark: false },
  ],
  bold: [
    { id: "pure", label: "Pure", swatch: "#f8fafc", bg: "#f8fafc", accent: "#e11d48", accentRgb: "225,29,72", text: "#0f172a", subtext: "#475569", card: "#ffffff", line: "#fecdd3", isDark: false },
    { id: "noir", label: "Noir", swatch: "linear-gradient(135deg,#1e293b,#0f172a)", bg: "#0f172a", accent: "#fbbf24", accentRgb: "251,191,36", text: "#f8fafc", subtext: "#94a3b8", card: "rgba(255,255,255,0.05)", line: "rgba(251,191,36,0.3)", isDark: true },
    { id: "bold-blush", label: "Blush", swatch: "linear-gradient(135deg,#fce7f3,#fdf2f8)", bg: "linear-gradient(160deg,#fdf2f8 0%,#f0f9ff 100%)", accent: "#db2777", accentRgb: "219,39,119", text: "#1e0a14", subtext: "#6b3a55", card: "rgba(255,255,255,0.9)", line: "#fbcfe8", isDark: false },
  ],
  cinema: [
    { id: "gold", label: "Gold", swatch: "linear-gradient(135deg,#d97706,#92400e)", bg: "linear-gradient(160deg,#080810 0%,#14100a 50%,#080810 100%)", accent: "#f59e0b", accentRgb: "245,158,11", text: "#fef3c7", subtext: "#d97706", card: "rgba(245,158,11,0.08)", line: "rgba(245,158,11,0.25)", isDark: true },
    { id: "silver", label: "Silver", swatch: "linear-gradient(135deg,#e2e8f0,#94a3b8)", bg: "linear-gradient(160deg,#080814 0%,#0f172a 100%)", accent: "#e2e8f0", accentRgb: "226,232,240", text: "#f1f5f9", subtext: "#94a3b8", card: "rgba(255,255,255,0.05)", line: "rgba(226,232,240,0.15)", isDark: true },
    { id: "cinema-rose", label: "Crimson", swatch: "linear-gradient(135deg,#fb7185,#e11d48)", bg: "linear-gradient(160deg,#0a0008 0%,#1a0015 100%)", accent: "#fb7185", accentRgb: "251,113,133", text: "#fff1f2", subtext: "#fda4af", card: "rgba(251,113,133,0.06)", line: "rgba(251,113,133,0.2)", isDark: true },
  ],
  bloom: [
    { id: "blush-bloom", label: "Blush", swatch: "linear-gradient(135deg,#fce7f3,#fbcfe8)", bg: "linear-gradient(135deg,#fff1f7 0%,#fce7f3 50%,#f5f0ff 100%)", accent: "#db2777", accentRgb: "219,39,119", text: "#1e0a14", subtext: "#7a3050", card: "rgba(255,255,255,0.65)", line: "#fecdd3", isDark: false },
    { id: "lavender", label: "Lavender", swatch: "linear-gradient(135deg,#e9d5ff,#c4b5fd)", bg: "linear-gradient(135deg,#fdf4ff 0%,#ede9fe 50%,#e0f2fe 100%)", accent: "#7c3aed", accentRgb: "124,58,237", text: "#1a0a2e", subtext: "#5b3d8a", card: "rgba(255,255,255,0.65)", line: "#ddd6fe", isDark: false },
    { id: "mint", label: "Mint", swatch: "linear-gradient(135deg,#a7f3d0,#6ee7b7)", bg: "linear-gradient(135deg,#ecfdf5 0%,#d1fae5 50%,#cffafe 100%)", accent: "#059669", accentRgb: "5,150,105", text: "#0a1f17", subtext: "#3a6a5a", card: "rgba(255,255,255,0.65)", line: "#a7f3d0", isDark: false },
  ],
};

export const TEMPLATE_META: Record<TemplateId, { label: string; description: string; emoji: string }> = {
  eternal:  { label: "Eternal",  description: "Soft gradients, floating hearts, romantic timeline", emoji: "🌸" },
  polaroid: { label: "Polaroid", description: "Warm cream, scattered polaroid memories",           emoji: "📸" },
  bold:     { label: "Bold",     description: "High-impact typography, dramatic & minimal",        emoji: "✦" },
  cinema:   { label: "Cinema",   description: "Dark luxury, film aesthetic, gold accents",         emoji: "🎬" },
  bloom:    { label: "Bloom",    description: "Botanical pastels, floral ornaments, elegant",      emoji: "🌺" },
};

export const MILESTONE_ICONS: Record<string, typeof Heart> = {
  anniversary: CalendarHeart,
  milestone:   Star,
  trip:        Plane,
  birthday:    Gift,
  photo:       Camera,
  place:       MapPin,
  default:     Trophy,
};

export const HEARTS_POS = [
  { top: "7%",  left: "6%",   sz: 12, op: 0.14, d: "0s"   },
  { top: "13%", right: "8%",  sz: 18, op: 0.11, d: "0.8s" },
  { top: "35%", left: "4%",   sz: 10, op: 0.09, d: "1.4s" },
  { top: "55%", right: "5%",  sz: 14, op: 0.12, d: "0.3s" },
  { top: "72%", left: "7%",   sz: 15, op: 0.09, d: "1.1s" },
  { top: "84%", right: "10%", sz: 11, op: 0.11, d: "0.6s" },
];
