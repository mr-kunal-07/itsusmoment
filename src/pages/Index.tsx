import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Heart, ArrowRight, Check, Lock, Shield, Star, Menu, X as XIcon,
  Camera, MessageCircle, Calendar, Sparkles, Image, Mic, Bell, Users,
  ChevronRight, MapPin, Zap, Crown, HardDrive, Upload, Globe, Infinity,
  Play, Quote, ChevronDown, Smartphone, Layers, BookHeart, Music,
  Eye, EyeOff, Flame, Gift
} from "lucide-react";
import dashboardImg from "@/assets/dashboard-preview.png";
import memoriesTimelineImg from "@/assets/memories-timeline.png";

/* ═══════════════════════════════════════════════
   DESIGN TOKENS  — Light editorial palette
═══════════════════════════════════════════════ */
const C = {
  white:      "#ffffff",
  bg:         "#fafafa",
  bgAlt:      "#f5f5f5",
  surface:    "#f0f0f0",
  ink:        "#0a0a0a",
  ink2:       "#1a1a1a",
  body:       "#3a3a3a",
  muted:      "#6b6b6b",
  subtle:     "#9b9b9b",
  border:     "#e2e2e2",
  borderDark: "#cccccc",
  rose:       "#e11d48",
  roseLight:  "#fdf2f5",
  roseMid:    "#fce7ef",
  dark:       "#111111",
  darkCard:   "#1a1a1a",
  darkBorder: "rgba(255,255,255,0.08)",
  gold:       "#f59e0b",
};

/* ═══════════════════════════════════════════════
   SCROLL REVEAL HOOK
═══════════════════════════════════════════════ */
function useInView(threshold = 0.06) {
  const ref = useRef<HTMLDivElement>(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setVis(true); obs.disconnect(); }
    }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, vis };
}

function Reveal({ children, delay = 0, className = "", up = true, style }: {
  children: React.ReactNode; delay?: number; className?: string; up?: boolean; style?: React.CSSProperties;
}) {
  const { ref, vis } = useInView();
  return (
    <div ref={ref} className={className}
      style={{
        transition: `opacity 0.65s ease ${delay}ms, transform 0.65s ease ${delay}ms`,
        opacity: vis ? 1 : 0,
        transform: vis ? "none" : up ? "translateY(22px)" : "none",
        ...style,
      }}>
      {children}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   TYPOGRAPHY HELPERS
═══════════════════════════════════════════════ */
const SG: React.CSSProperties = { fontFamily: "'Space Grotesk', system-ui, sans-serif" };
const INTER: React.CSSProperties = { fontFamily: "'Inter', system-ui, sans-serif" };

/* ═══════════════════════════════════════════════
   STATIC DATA
═══════════════════════════════════════════════ */
const NAV_LINKS = [
  ["#features",     "Features"],
  ["#how-it-works", "How it works"],
  ["#pricing",      "Pricing"],
  ["#faq",          "FAQ"],
];

const STATS = [
  { val: "50,000+", label: "Couples", sub: "trusting usMoment daily" },
  { val: "2M+",     label: "Memories", sub: "safely stored & encrypted" },
  { val: "4.9★",    label: "Rating",   sub: "from verified couples" },
  { val: "100%",    label: "Private",  sub: "no ads, no tracking ever" },
];

const FEATURES_GRID = [
  { icon: Lock,           title: "End-to-end encrypted",      desc: "Every photo, video, note and message is encrypted before it leaves your device. Nobody — not even us — can read it.", tag: "Privacy" },
  { icon: Image,          title: "Private media vault",        desc: "Upload photos & videos in original quality. Organize into folders, star favourites, and browse a chronological timeline.", tag: "Memories" },
  { icon: MessageCircle,  title: "Exclusive private chat",     desc: "A dedicated chat room just for the two of you. Voice messages, emoji reactions, reply threads, read receipts.", tag: "Chat" },
  { icon: Calendar,       title: "Milestones & anniversaries", desc: "Log every first — first date, first trip, first 'I love you'. Get smart reminders before every special date.", tag: "Timeline" },
  { icon: MapPin,         title: "Travel map",                 desc: "Pin every place you've visited together on a beautiful interactive map. Draw custom geofenced areas for your favourite spots.", tag: "Travel" },
  { icon: BookHeart,      title: "Love notes on photos",       desc: "Attach a heartfelt note to any photo you share. Visible only to your partner, forever stored with the memory.", tag: "Notes" },
  { icon: Mic,            title: "Voice messages",             desc: "Send warm, personalised voice notes directly in the chat. Richer than text, more intimate than ever.", tag: "Chat" },
  { icon: Layers,         title: "Bucket list together",       desc: "Build a shared bucket list of things to do, places to visit, experiences to collect as a couple.", tag: "Goals" },
  { icon: Sparkles,       title: "Love story card",            desc: "A beautiful shareable card generated from your story — your milestones, your photos, your timeline.", tag: "Special" },
  { icon: Bell,           title: "Partner notifications",      desc: "Get notified instantly when your partner uploads a memory, writes a love note, or adds a reaction.", tag: "Social" },
  { icon: Star,           title: "Star favourites",            desc: "Bookmark the moments that mean the most. Access your starred memories in one tap from anywhere.", tag: "Memories" },
  { icon: Shield,         title: "App lock with biometrics",   desc: "Secure the app with a PIN or biometric lock. Even on a shared phone, your vault stays private.", tag: "Privacy" },
];

const SHOWCASE_ITEMS = [
  {
    tag: "PRIVATE MEMORIES",
    headline: "Every memory.\nOne beautiful place.",
    sub: "Upload photos and videos in original quality. Browse a Google Photos-style timeline, add love notes, emoji react, and star the moments that matter most.",
    bullets: [
      "Chronological timeline view with smart date grouping",
      "Love notes pinned to any photo or video",
      "Emoji reactions from your partner",
      "Soft-delete & 14-day recovery window",
    ],
  },
  {
    tag: "PRIVATE CHAT",
    headline: "Your own corner\nof the internet.",
    sub: "A fully private chat room, just for the two of you. Send text, voice messages, emoji reactions, and reply to specific messages — with total privacy.",
    bullets: [
      "Messages are end-to-end encrypted at rest",
      "Voice messages with waveform visualisation",
      "Swipe-to-reply on any message",
      "Auto-purge option for ephemeral conversations",
    ],
  },
  {
    tag: "TRAVEL MAP",
    headline: "Every place you've\nbeen, beautifully mapped.",
    sub: "Pin cities, countries, or hidden gems to your shared travel map. Draw custom geofenced areas for your favourite neighbourhoods and relive every journey.",
    bullets: [
      "Interactive world map with heart pins",
      "Custom geofenced areas by drawing on map",
      "Statistics — countries, cities, distance",
      "Timeline view of travel memories",
    ],
  },
  {
    tag: "MILESTONES",
    headline: "Log every first.\nRelive every one.",
    sub: "From your first date to your 10th anniversary — every milestone on a beautiful timeline, with smart reminders so you never miss a special date.",
    bullets: [
      "Custom milestone types — first date, trips, moments",
      "Smart anniversary reminders",
      "Attach photos to any milestone",
      "Days-together counter always visible",
    ],
  },
];

const PLANS = [
  {
    id: "single",
    name: "Single",
    emoji: "🌱",
    price: "Free",
    priceNum: null,
    period: "forever",
    tagline: "Start your journey together.",
    badge: null,
    highlight: false,
    features: [
      { text: "1 GB shared storage",    ok: true },
      { text: "50 + 50 uploads / month",ok: true },
      { text: "Private media vault",    ok: true },
      { text: "Private chat",           ok: true },
      { text: "Milestone calendar",     ok: true },
      { text: "Travel map",             ok: true },
      { text: "Bucket list",            ok: true },
      { text: "Voice messages",         ok: false },
      { text: "Reactions & love notes", ok: false },
      { text: "All new features",       ok: false },
    ],
  },
  {
    id: "dating",
    name: "Dating",
    emoji: "💑",
    price: "₹29",
    priceNum: "₹29",
    period: "/ month",
    tagline: "Unlock more experiences together.",
    badge: "Best value",
    highlight: false,
    features: [
      { text: "10 GB shared storage",        ok: true },
      { text: "Unlimited uploads",           ok: true },
      { text: "Everything in Free",          ok: true },
      { text: "Voice messages",              ok: true },
      { text: "Emoji reactions",             ok: true },
      { text: "Love notes on photos",        ok: true },
      { text: "Activity feed",               ok: true },
      { text: "Love story card",             ok: false },
      { text: "Slideshow mode",              ok: false },
      { text: "Priority support",            ok: false },
    ],
  },
  {
    id: "soulmate",
    name: "Soulmate",
    emoji: "💎",
    price: "₹99",
    priceNum: "₹99",
    period: "/ month",
    tagline: "Everything. No limits. Forever.",
    badge: "Most popular",
    highlight: true,
    features: [
      { text: "50 GB shared storage",        ok: true },
      { text: "Unlimited uploads",           ok: true },
      { text: "Everything in Dating",        ok: true },
      { text: "Love story card",             ok: true },
      { text: "Slideshow mode",              ok: true },
      { text: "All new features first",      ok: true },
      { text: "Priority support",            ok: true },
      { text: "Early access to beta",        ok: true },
      { text: "Partner plan sharing",        ok: true },
      { text: "Lifetime discount lock-in",   ok: true },
    ],
  },
];

const TESTIMONIALS = [
  {
    quote: "We live in different cities and usMoment is the only place we genuinely feel close. The voice messages make it feel like they're right there with me.",
    name: "Priya & Arjun",
    meta: "487 days together · Long-distance",
    init: "P",
    plan: "Soulmate",
    stars: 5,
  },
  {
    quote: "Every trip, every date night, every little note — it's all here. We open it every morning over coffee. It's our private little world.",
    name: "Sneha & Rahul",
    meta: "1,204 days together · Mumbai",
    init: "S",
    plan: "Dating",
    stars: 5,
  },
  {
    quote: "I wrote a love note on our first photo together. She cried. That moment alone was worth every rupee. Nothing else comes close.",
    name: "Rohan M.",
    meta: "Dating plan · Bangalore",
    init: "R",
    plan: "Dating",
    stars: 5,
  },
  {
    quote: "The travel map is our favourite feature. We pin every place we visit and it's beautiful to look back at all the places we've explored together.",
    name: "Kavya & Nikhil",
    meta: "831 days together · Soulmate plan",
    init: "K",
    plan: "Soulmate",
    stars: 5,
  },
  {
    quote: "Simple, private, and beautiful. No social media clutter. Just us. The milestone reminders mean we never forget our special dates anymore.",
    name: "Aditya & Meera",
    meta: "289 days together · Pune",
    init: "A",
    plan: "Single",
    stars: 5,
  },
  {
    quote: "usMoment feels like a real product built by people who understand relationships. The design is stunning and it just works. Highly recommend.",
    name: "Tanya & Sameer",
    meta: "2,100+ days together · Delhi",
    init: "T",
    plan: "Soulmate",
    stars: 5,
  },
];

const STEPS = [
  { n: "01", icon: Users,  title: "Create your account",    desc: "Sign up free in under 60 seconds. No credit card, no commitment." },
  { n: "02", icon: Heart,  title: "Invite your partner",    desc: "Share a unique 8-digit invite code. They join in one tap." },
  { n: "03", icon: Camera, title: "Start building together",desc: "Upload photos, chat, add milestones. Your story begins now." },
];

const FAQ = [
  { q: "Is usMoment really 100% private?",  a: "Absolutely. All messages and notes are end-to-end encrypted before they leave your device using AES-256-GCM. Even our team cannot read your content. Your photos are stored in a private vault accessible only to you and your linked partner." },
  { q: "How does the shared plan work?",     a: "When either partner upgrades to a paid tier, both partners automatically get all the benefits — no need for both to pay. One subscription covers both of you completely." },
  { q: "Can I cancel anytime?",              a: "Yes. You can cancel your subscription from the Billing page at any time. There are no lock-in periods, no cancellation fees, and no hidden charges." },
  { q: "What happens to my data if I cancel?",a: "Your vault and all your memories remain accessible on the Free plan indefinitely. You'll be moved to the 1 GB storage limit, but nothing is deleted." },
  { q: "Is usMoment available on mobile?",   a: "usMoment is a Progressive Web App (PWA) — install it from your browser on iOS and Android for a native-like experience, including offline access and push notifications." },
  { q: "How is storage calculated?",         a: "Both partners share a single storage pool. For example, on the Soulmate plan, you and your partner together have 50 GB shared — both of your uploads count toward that single total." },
];

/* ═══════════════════════════════════════════════
   MINI CARD COMPONENTS  (app UI mockups)
═══════════════════════════════════════════════ */
function AppCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={className} style={{
      background: C.dark, borderRadius: 20, overflow: "hidden",
      boxShadow: "0 24px 64px rgba(0,0,0,0.30)", border: `1px solid ${C.darkBorder}`,
    }}>
      {children}
    </div>
  );
}

function CardHeader({ icon, title, badge }: { icon?: React.ReactNode; title: string; badge?: string }) {
  return (
    <div style={{ padding: "13px 16px", borderBottom: `1px solid ${C.darkBorder}`, display: "flex", alignItems: "center", gap: 10 }}>
      {icon && <div style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(255,255,255,0.10)", display: "flex", alignItems: "center", justifyContent: "center" }}>{icon}</div>}
      <span style={{ ...SG, fontSize: 13, fontWeight: 700, color: "#fff", letterSpacing: "-0.02em", flex: 1 }}>{title}</span>
      {badge && <span style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.4)", background: "rgba(255,255,255,0.07)", padding: "3px 10px", borderRadius: 99 }}>{badge}</span>}
    </div>
  );
}

function MemoriesCard() {
  const photos = [
    "linear-gradient(135deg,#c97b4b,#5c2d0e)",
    "linear-gradient(135deg,#d4845a,#6b3320)",
    "linear-gradient(135deg,#7c9e7a,#2d5a3d)",
    "linear-gradient(135deg,#b08a6e,#5c3d2a)",
  ];
  return (
    <AppCard>
      <CardHeader icon={<Heart style={{ width: 12, height: 12, fill: "#e11d48", color: "#e11d48" }} />} title="Our Memories" badge="47 photos" />
      <div style={{ padding: "10px 14px 6px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.08)" }} />
          <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.5)", padding: "3px 10px", borderRadius: 99, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)" }}>March 2026</div>
          <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.08)" }} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 10 }}>
          {photos.map((g, i) => (
            <div key={i} style={{ height: i === 0 || i === 3 ? 90 : 74, borderRadius: 10, background: g, position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", bottom: 6, left: 6, fontSize: 10, color: "rgba(255,255,255,0.7)", fontWeight: 600 }}>{["Goa 🌊","Date Night 🕯️","Hiking 🏔️","Home 🏠"][i]}</div>
            </div>
          ))}
        </div>
        <img src={memoriesTimelineImg} alt="" style={{ width: "100%", borderRadius: 10, display: "block", objectFit: "cover", maxHeight: 100 }} />
      </div>
      <div style={{ padding: "8px 12px 13px", borderTop: `1px solid ${C.darkBorder}`, display: "flex", gap: 8 }}>
        <div style={{ flex: 1, background: "rgba(255,255,255,0.05)", borderRadius: 10, padding: "9px 12px", fontSize: 12, color: "rgba(255,255,255,0.3)", border: "1px solid rgba(255,255,255,0.07)" }}>Write a love note…</div>
        <button style={{ width: 36, height: 36, borderRadius: 10, background: "#fff", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Heart style={{ width: 13, height: 13, fill: C.ink, color: C.ink }} />
        </button>
      </div>
    </AppCard>
  );
}

function ChatCard() {
  return (
    <AppCard>
      <div style={{ padding: "13px 16px", borderBottom: `1px solid ${C.darkBorder}`, display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.09)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>💑</div>
        <div>
          <p style={{ ...SG, fontSize: 13, fontWeight: 700, color: "#fff", margin: 0 }}>Priya</p>
          <p style={{ fontSize: 10, color: "#4ade80", margin: 0 }}>● Online now</p>
        </div>
        <div style={{ marginLeft: "auto", padding: "3px 10px", borderRadius: 99, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", fontSize: 10, color: "rgba(255,255,255,0.4)" }}>Encrypted 🔒</div>
      </div>
      <div style={{ padding: "13px 13px 8px", display: "flex", flexDirection: "column", gap: 8 }}>
        {[
          { me: false, msg: "Remember our first date? 🥹" },
          { me: true,  msg: "How could I ever forget 😄" },
          { me: false, msg: "I just added photos from Goa 🌊" },
          { me: true,  msg: "Adding love notes to each one 🌙" },
          { me: false, msg: "🎤", voice: true },
        ].map((m, i) => (
          <div key={i} style={{ display: "flex", justifyContent: m.me ? "flex-end" : "flex-start" }}>
            {m.voice ? (
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: 14, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.08)", borderBottomLeftRadius: 4, maxWidth: "70%" }}>
                <div style={{ width: 26, height: 26, borderRadius: "50%", background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Play style={{ width: 10, height: 10, color: "#fff" }} />
                </div>
                <div style={{ display: "flex", gap: 2 }}>
                  {Array.from({length: 16}).map((_,j) => (
                    <div key={j} style={{ width: 2, borderRadius: 2, background: "rgba(255,255,255,0.45)", height: `${Math.random()*14+4}px` }} />
                  ))}
                </div>
                <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>0:07</span>
              </div>
            ) : (
              <div style={{
                maxWidth: "78%", padding: "8px 13px", fontSize: 12, lineHeight: 1.55, borderRadius: 14,
                background: m.me ? "#fff" : "rgba(255,255,255,0.09)",
                color: m.me ? C.ink : "rgba(255,255,255,0.85)",
                borderBottomRightRadius: m.me ? 4 : 14,
                borderBottomLeftRadius: m.me ? 14 : 4,
              }}>{m.msg}</div>
            )}
          </div>
        ))}
      </div>
      <div style={{ padding: "8px 12px 13px", borderTop: `1px solid ${C.darkBorder}`, display: "flex", gap: 8 }}>
        <div style={{ flex: 1, background: "rgba(255,255,255,0.05)", borderRadius: 10, padding: "9px 12px", fontSize: 12, color: "rgba(255,255,255,0.3)", border: "1px solid rgba(255,255,255,0.07)" }}>Type a message…</div>
        <button style={{ width: 36, height: 36, borderRadius: 10, background: "#fff", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <ArrowRight style={{ width: 13, height: 13, color: C.ink }} />
        </button>
      </div>
    </AppCard>
  );
}

function MapCard() {
  return (
    <AppCard>
      <CardHeader icon={<MapPin style={{ width: 12, height: 12, color: "#f472b6" }} />} title="Travel Map" badge="6 locations" />
      <div style={{ padding: 12 }}>
        <div style={{ borderRadius: 12, overflow: "hidden", background: "linear-gradient(160deg, #1a1a2e 0%, #16213e 40%, #0f3460 100%)", height: 180, position: "relative" }}>
          {/* Simplified world map dots */}
          {[
            { x: "28%", y: "42%", label: "Mumbai 🏠", active: true },
            { x: "45%", y: "55%", label: "Goa 🌊" },
            { x: "70%", y: "32%", label: "Paris 🗼" },
            { x: "62%", y: "48%", label: "Dubai ✈️" },
          ].map((p, i) => (
            <div key={i} style={{ position: "absolute", left: p.x, top: p.y, transform: "translate(-50%,-50%)" }}>
              <div style={{ width: p.active ? 14 : 10, height: p.active ? 14 : 10, borderRadius: "50%", background: p.active ? "#f472b6" : "rgba(244,114,182,0.6)", boxShadow: p.active ? "0 0 14px #f472b6" : "none" }} />
              <div style={{ position: "absolute", bottom: "110%", left: "50%", transform: "translateX(-50%)", background: "rgba(0,0,0,0.8)", color: "#fff", fontSize: 9, padding: "2px 7px", borderRadius: 6, whiteSpace: "nowrap", fontWeight: 600 }}>{p.label}</div>
            </div>
          ))}
          {/* Stats overlay */}
          <div style={{ position: "absolute", bottom: 10, left: 10, right: 10, display: "flex", gap: 6 }}>
            {[["4", "Countries"], ["6", "Cities"], ["12K km", "Distance"]].map(([v, l]) => (
              <div key={l} style={{ flex: 1, background: "rgba(0,0,0,0.5)", borderRadius: 8, padding: "6px 8px", textAlign: "center", backdropFilter: "blur(8px)" }}>
                <div style={{ ...SG, fontSize: 13, fontWeight: 700, color: "#fff" }}>{v}</div>
                <div style={{ fontSize: 9, color: "rgba(255,255,255,0.5)" }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
          {["Goa, India 🌊", "Mumbai, India 🏠", "Paris, France 🗼"].map((loc, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 10, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <MapPin style={{ width: 12, height: 12, color: "#f472b6", flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", flex: 1 }}>{loc}</span>
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>
                {["Feb 2025", "Aug 2024", "Dec 2024"][i]}
              </span>
            </div>
          ))}
        </div>
      </div>
    </AppCard>
  );
}

function MilestonesCard() {
  return (
    <AppCard>
      <CardHeader icon={<Calendar style={{ width: 12, height: 12, color: "rgba(255,255,255,0.7)" }} />} title="Milestones" badge="461 days ❤️" />
      <div style={{ padding: "10px 12px 13px", display: "flex", flexDirection: "column", gap: 6 }}>
        {[
          { e: "💑", label: "Together Since",      date: "Dec 1, 2024",  sub: "461 days ago",  active: true  },
          { e: "💬", label: "First 'I Love You'",  date: "Jan 14, 2025", sub: "1 year ago",    active: false },
          { e: "✈️", label: "Goa Trip",             date: "Feb 14, 2025", sub: "1 year ago",    active: false },
          { e: "🎂", label: "1 Year Anniversary",  date: "Dec 1, 2025",  sub: "3 months ago",  active: false },
          { e: "💍", label: "Engagement",           date: "Mar 8, 2026",  sub: "Today 🎉",      active: true  },
        ].map((m, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "center", gap: 11, padding: "9px 10px", borderRadius: 11,
            background: m.active ? "rgba(255,255,255,0.09)" : "rgba(255,255,255,0.03)",
            border: `1px solid ${m.active ? "rgba(255,255,255,0.16)" : "rgba(255,255,255,0.05)"}`,
          }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, flexShrink: 0 }}>{m.e}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: "#fff", margin: 0 }}>{m.label}</p>
              <p style={{ fontSize: 10, color: "rgba(255,255,255,0.38)", margin: 0, marginTop: 1 }}>{m.date} · {m.sub}</p>
            </div>
            {m.active && <Heart style={{ width: 12, height: 12, fill: "#e11d48", color: "#e11d48", flexShrink: 0 }} />}
          </div>
        ))}
      </div>
    </AppCard>
  );
}

const SHOWCASE_CARDS = [MemoriesCard, ChatCard, MapCard, MilestonesCard];

/* ═══════════════════════════════════════════════
   FAQ ACCORDION
═══════════════════════════════════════════════ */
function FaqItem({ q, a, open, onClick }: { q: string; a: string; open: boolean; onClick: () => void }) {
  return (
    <div style={{ borderBottom: `1px solid ${C.border}` }}>
      <button onClick={onClick}
        style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "20px 0", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}>
        <span style={{ ...SG, fontSize: 15, fontWeight: 600, color: C.ink, lineHeight: 1.4 }}>{q}</span>
        <ChevronDown style={{
          width: 18, height: 18, color: C.muted, flexShrink: 0,
          transition: "transform 0.25s ease",
          transform: open ? "rotate(180deg)" : "none",
        }} />
      </button>
      <div style={{
        overflow: "hidden", transition: "max-height 0.3s ease, opacity 0.25s ease",
        maxHeight: open ? 300 : 0, opacity: open ? 1 : 0,
      }}>
        <p style={{ ...INTER, fontSize: 14, lineHeight: 1.8, color: C.body, paddingBottom: 20, margin: 0 }}>{a}</p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════ */
export default function Index() {
  const [scrollY, setScrollY] = useState(0);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  useEffect(() => {
    const fn = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const scrolled = scrollY > 24;

  return (
    <div style={{ ...INTER, background: C.bg, color: C.ink, overflowX: "hidden", minHeight: "100vh" }}>

      {/* ════════════════════════════════════════
          NAVBAR
      ════════════════════════════════════════ */}
      <header style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        background: scrolled ? "rgba(250,250,250,0.96)" : "transparent",
        backdropFilter: scrolled ? "blur(20px)" : "none",
        borderBottom: scrolled ? `1px solid ${C.border}` : "1px solid transparent",
        transition: "all 0.3s ease",
      }}>
        <div style={{ maxWidth: 1180, margin: "0 auto", padding: "0 24px", height: 68, display: "flex", alignItems: "center", gap: 8 }}>
          {/* Logo */}
          <Link to="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 9, flexShrink: 0 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: C.ink, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.18)" }}>
              <Heart style={{ width: 15, height: 15, fill: "#fff", color: "#fff" }} />
            </div>
            <span style={{ ...SG, fontSize: 18, fontWeight: 700, color: C.ink, letterSpacing: "-0.03em" }}>usMoment</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex flex-1 justify-center gap-0">
            {NAV_LINKS.map(([href, label]) => (
              <a key={href} href={href} style={{ fontSize: 14, fontWeight: 500, color: C.muted, textDecoration: "none", padding: "8px 16px", borderRadius: 8, transition: "all 0.15s" }}
                onMouseEnter={e => { e.currentTarget.style.color = C.ink; e.currentTarget.style.background = C.surface; }}
                onMouseLeave={e => { e.currentTarget.style.color = C.muted; e.currentTarget.style.background = "transparent"; }}>
                {label}
              </a>
            ))}
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-1.5 shrink-0">
            <Link to="/auth" style={{ fontSize: 13, fontWeight: 500, color: C.body, padding: "8px 16px", borderRadius: 9, textDecoration: "none", transition: "background 0.15s" }}
              onMouseEnter={e => e.currentTarget.style.background = C.surface}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
              Log in
            </Link>
            <Link to="/auth" style={{ fontSize: 13, fontWeight: 600, color: "#fff", background: C.ink, padding: "9px 20px", borderRadius: 10, textDecoration: "none", transition: "opacity 0.15s", boxShadow: "0 1px 6px rgba(0,0,0,0.18)" }}
              onMouseEnter={e => e.currentTarget.style.opacity = "0.82"}
              onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
              Start free →
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button onClick={() => setMobileMenu(v => !v)} className="md:hidden" style={{ marginLeft: "auto", padding: 8, background: "none", border: "none", cursor: "pointer" }}>
            {mobileMenu ? <XIcon style={{ width: 22, height: 22, color: C.ink }} /> : <Menu style={{ width: 22, height: 22, color: C.ink }} />}
          </button>
        </div>

        {/* Mobile menu dropdown */}
        {mobileMenu && (
          <div style={{ background: C.white, borderTop: `1px solid ${C.border}`, padding: "10px 24px 24px" }}>
            {NAV_LINKS.map(([href, label]) => (
              <a key={href} href={href} onClick={() => setMobileMenu(false)}
                style={{ display: "block", fontSize: 15, fontWeight: 500, color: C.body, padding: "14px 0", borderBottom: `1px solid ${C.border}`, textDecoration: "none" }}>
                {label}
              </a>
            ))}
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 16 }}>
              <Link to="/auth" onClick={() => setMobileMenu(false)}
                style={{ textAlign: "center", fontSize: 14, fontWeight: 500, color: C.body, padding: "12px", borderRadius: 10, border: `1px solid ${C.border}`, textDecoration: "none" }}>
                Log in
              </Link>
              <Link to="/auth" onClick={() => setMobileMenu(false)}
                style={{ textAlign: "center", fontSize: 14, fontWeight: 600, color: "#fff", background: C.ink, padding: "12px", borderRadius: 10, textDecoration: "none" }}>
                Start free →
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* ════════════════════════════════════════
          HERO
      ════════════════════════════════════════ */}
      <section style={{ background: C.white, paddingTop: 68 }}>
        <div style={{ maxWidth: 860, margin: "0 auto", padding: "72px 24px 56px", textAlign: "center" }}>

          {/* Eyebrow pill */}
          <Reveal>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 7, background: C.roseLight, border: `1px solid ${C.roseMid}`, borderRadius: 99, padding: "6px 14px 6px 10px", marginBottom: 28 }}>
              <div style={{ width: 18, height: 18, borderRadius: "50%", background: C.rose, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Heart style={{ width: 9, height: 9, fill: "#fff", color: "#fff" }} />
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, color: C.rose }}>The private space your love story deserves</span>
            </div>
          </Reveal>

          {/* H1 */}
          <Reveal delay={60}>
            <h1 style={{ ...SG, fontSize: "clamp(36px, 6.5vw, 70px)", fontWeight: 700, letterSpacing: "-0.035em", lineHeight: 1.07, color: C.ink, marginBottom: 22 }}>
              Store every memory.
              <br />
              <span style={{ background: `linear-gradient(135deg, ${C.ink} 20%, #52525b 80%)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                Share only with them.
              </span>
            </h1>
          </Reveal>

          {/* Subheadline */}
          <Reveal delay={110}>
            <p style={{ fontSize: "clamp(16px, 2.4vw, 20px)", lineHeight: 1.72, color: C.body, maxWidth: 530, margin: "0 auto 36px" }}>
              Photos, private chat, voice messages, milestones, travel map, and more — all in one beautiful encrypted vault, just for the two of you.
            </p>
          </Reveal>

          {/* CTA Buttons */}
          <Reveal delay={160}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center", marginBottom: 28 }}>
              <Link to="/auth" style={{ display: "inline-flex", alignItems: "center", gap: 8, fontWeight: 700, fontSize: 15, color: "#fff", background: C.ink, padding: "14px 32px", borderRadius: 12, textDecoration: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.2)", transition: "all 0.2s" }}
                onMouseEnter={e => { e.currentTarget.style.opacity = "0.86"; e.currentTarget.style.transform = "translateY(-1px)"; }}
                onMouseLeave={e => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.transform = "none"; }}>
                Start for free <ArrowRight style={{ width: 16, height: 16 }} />
              </Link>
              <a href="#features" style={{ display: "inline-flex", alignItems: "center", gap: 8, fontWeight: 500, fontSize: 15, color: C.body, background: C.white, padding: "14px 28px", borderRadius: 12, textDecoration: "none", border: `1.5px solid ${C.borderDark}`, transition: "all 0.2s" }}
                onMouseEnter={e => { e.currentTarget.style.background = C.surface; e.currentTarget.style.transform = "translateY(-1px)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = C.white; e.currentTarget.style.transform = "none"; }}>
                See features
              </a>
            </div>
          </Reveal>

          {/* Trust badges */}
          <Reveal delay={210}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 16, justifyContent: "center", fontSize: 12, fontWeight: 500, color: C.muted }}>
              {[
                [<Check style={{ width: 12, height: 12 }} />, "No credit card required"],
                [<Lock style={{ width: 12, height: 12 }} />, "End-to-end encrypted"],
                [<Smartphone style={{ width: 12, height: 12 }} />, "Works on all devices"],
                [<Star style={{ width: 12, height: 12, fill: C.gold, color: C.gold }} />, "4.9 / 5 from couples"],
              ].map(([icon, text], i) => (
                <span key={i} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  {icon as React.ReactNode}{text as string}
                </span>
              ))}
            </div>
          </Reveal>
        </div>

        {/* Browser frame mockup */}
        <Reveal delay={280} className="max-w-5xl mx-auto px-4 sm:px-8 pb-0">
          <div style={{ borderRadius: "18px 18px 0 0", overflow: "hidden", border: `1px solid ${C.border}`, borderBottom: "none", boxShadow: "0 -6px 60px rgba(0,0,0,0.11)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "11px 20px", background: C.surface, borderBottom: `1px solid ${C.border}` }}>
              <div style={{ display: "flex", gap: 6 }}>
                {["#fca5a5", "#fcd34d", "#86efac"].map((bg, i) => (
                  <div key={i} style={{ width: 11, height: 11, borderRadius: "50%", background: bg }} />
                ))}
              </div>
              <div style={{ flex: 1, maxWidth: 260, margin: "0 auto", background: C.white, border: `1px solid ${C.border}`, borderRadius: 6, padding: "5px 14px", fontSize: 11, color: C.muted, textAlign: "center", display: "flex", alignItems: "center", gap: 5 }}>
                <Lock style={{ width: 9, height: 9 }} />
                app.usmoment.in/dashboard
              </div>
            </div>
            <img src={dashboardImg} alt="OurVault dashboard" style={{ width: "100%", display: "block", objectFit: "cover", objectPosition: "top" }} />
          </div>
        </Reveal>
      </section>

      {/* ════════════════════════════════════════
          STATS STRIP
      ════════════════════════════════════════ */}
      <section style={{ background: C.ink, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px" }}>
          <div className="grid grid-cols-2 md:grid-cols-4">
            {STATS.map((s, i) => (
              <Reveal key={i} delay={i * 50}>
                <div style={{
                  textAlign: "center", padding: "36px 20px",
                  borderRight: i % 2 === 0 ? "1px solid rgba(255,255,255,0.07)" : "none",
                }}>
                  <div style={{ ...SG, fontSize: "clamp(26px,4vw,34px)", fontWeight: 700, color: "#fff", letterSpacing: "-0.04em", marginBottom: 4 }}>{s.val}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.5)", marginBottom: 2 }}>{s.label}</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.28)" }}>{s.sub}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          FEATURE OVERVIEW GRID
      ════════════════════════════════════════ */}
      <section id="features" style={{ background: C.white, padding: "96px 0 100px" }}>
        <div style={{ maxWidth: 1180, margin: "0 auto", padding: "0 24px" }}>
          <Reveal>
            <div style={{ textAlign: "center", marginBottom: 60 }}>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: C.muted, marginBottom: 14 }}>EVERYTHING YOU NEED</p>
              <h2 style={{ ...SG, fontSize: "clamp(28px,4.5vw,52px)", fontWeight: 700, letterSpacing: "-0.035em", lineHeight: 1.08, color: C.ink, marginBottom: 16 }}>
                One vault for your<br />entire relationship.
              </h2>
              <p style={{ fontSize: 17, lineHeight: 1.72, color: C.body, maxWidth: 500, margin: "0 auto" }}>
                Built thoughtfully for couples. Every feature earns its place.
              </p>
            </div>
          </Reveal>

          <div style={{ border: `1px solid ${C.border}`, borderRadius: 18, overflow: "hidden" }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES_GRID.map((f, i) => {
              const Icon = f.icon;
              return (
                <Reveal key={i} delay={i * 35}>
                  <div
                    style={{ padding: "28px", background: C.white, borderRight: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`, height: "100%", transition: "background 0.2s" }}
                    onMouseEnter={e => e.currentTarget.style.background = C.bg}
                    onMouseLeave={e => e.currentTarget.style.background = C.white}
                  >
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 11, background: C.surface, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Icon style={{ width: 18, height: 18, color: C.ink }} strokeWidth={1.7} />
                      </div>
                      <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", color: C.subtle, background: C.surface, padding: "3px 8px", borderRadius: 6 }}>{f.tag}</span>
                    </div>
                    <h3 style={{ ...SG, fontSize: 14, fontWeight: 700, color: C.ink, marginBottom: 7, lineHeight: 1.3 }}>{f.title}</h3>
                    <p style={{ fontSize: 13, lineHeight: 1.72, color: C.muted, margin: 0 }}>{f.desc}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          DEEP DIVE SHOWCASES (alternating)
      ════════════════════════════════════════ */}
      {SHOWCASE_ITEMS.map((s, i) => {
        const Card = SHOWCASE_CARDS[i];
        const reversed = i % 2 === 1;
        return (
          <section key={i} style={{ background: i % 2 === 0 ? C.bgAlt : C.white, borderTop: `1px solid ${C.border}`, padding: "84px 0 92px" }}>
            <div style={{ maxWidth: 1180, margin: "0 auto", padding: "0 24px" }}>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-20 items-center">
                <Reveal delay={30} className={reversed ? "lg:order-2" : ""}>
                  <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: C.muted, marginBottom: 16 }}>{s.tag}</p>
                  <h2 style={{ ...SG, fontSize: "clamp(26px,3.5vw,44px)", fontWeight: 700, letterSpacing: "-0.035em", lineHeight: 1.1, color: C.ink, marginBottom: 18, whiteSpace: "pre-line" }}>{s.headline}</h2>
                  <p style={{ fontSize: 15, lineHeight: 1.82, color: C.body, marginBottom: 28 }}>{s.sub}</p>
                  <ul style={{ listStyle: "none", padding: 0, margin: "0 0 32px", display: "flex", flexDirection: "column", gap: 11 }}>
                    {s.bullets.map((b, j) => (
                      <li key={j} style={{ display: "flex", alignItems: "flex-start", gap: 11, fontSize: 13.5, fontWeight: 500, color: C.ink }}>
                        <div style={{ width: 20, height: 20, borderRadius: "50%", background: C.surface, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                          <Check style={{ width: 10, height: 10, color: C.ink }} />
                        </div>
                        {b}
                      </li>
                    ))}
                  </ul>
                  <Link to="/auth" style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 14, fontWeight: 600, color: C.ink, textDecoration: "none", borderBottom: `2px solid ${C.ink}`, paddingBottom: 2, transition: "opacity 0.15s" }}
                    onMouseEnter={e => e.currentTarget.style.opacity = "0.6"}
                    onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
                    Get started free <ChevronRight style={{ width: 15, height: 15 }} />
                  </Link>
                </Reveal>
                <Reveal delay={130} className={`flex justify-center ${reversed ? "lg:order-1" : ""}`}>
                  <div style={{ width: "100%", maxWidth: 400 }}>
                    <Card />
                  </div>
                </Reveal>
              </div>
            </div>
          </section>
        );
      })}

      {/* ════════════════════════════════════════
          HOW IT WORKS
      ════════════════════════════════════════ */}
      <section id="how-it-works" style={{ background: C.ink, padding: "96px 0 100px" }}>
        <div style={{ maxWidth: 1060, margin: "0 auto", padding: "0 24px" }}>
          <Reveal>
            <div style={{ textAlign: "center", marginBottom: 68 }}>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)", marginBottom: 14 }}>QUICK START</p>
              <h2 style={{ ...SG, fontSize: "clamp(26px,4vw,50px)", fontWeight: 700, letterSpacing: "-0.035em", lineHeight: 1.07, color: "#fff", marginBottom: 14 }}>
                Ready in under a minute.
              </h2>
              <p style={{ fontSize: 17, lineHeight: 1.75, color: "rgba(255,255,255,0.5)", maxWidth: 440, margin: "0 auto" }}>
                No tutorial. No onboarding. Just sign up, invite your partner, and start.
              </p>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block" style={{ position: "absolute", top: 42, left: "calc(16.7% + 50px)", right: "calc(16.7% + 50px)", height: 1, background: "rgba(255,255,255,0.08)" }} />
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              return (
                <Reveal key={i} delay={i * 90}>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ position: "relative", display: "inline-flex", marginBottom: 28 }}>
                      <div style={{ width: 84, height: 84, borderRadius: 24, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Icon style={{ width: 36, height: 36, color: "rgba(255,255,255,0.75)" }} strokeWidth={1.4} />
                      </div>
                      <span style={{ position: "absolute", top: -10, right: -10, width: 26, height: 26, borderRadius: "50%", background: "#fff", color: C.ink, fontSize: 10, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "ui-monospace, monospace" }}>
                        {s.n}
                      </span>
                    </div>
                    <h3 style={{ ...SG, fontSize: 16, fontWeight: 700, color: "#fff", marginBottom: 10 }}>{s.title}</h3>
                    <p style={{ fontSize: 14, lineHeight: 1.75, color: "rgba(255,255,255,0.47)" }}>{s.desc}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>

          <Reveal style={{ marginTop: 64, textAlign: "center" }}>
            <Link to="/auth" style={{ display: "inline-flex", alignItems: "center", gap: 8, fontWeight: 700, fontSize: 15, color: C.ink, background: "#fff", padding: "14px 32px", borderRadius: 12, textDecoration: "none", boxShadow: "0 4px 20px rgba(255,255,255,0.12)", transition: "all 0.2s" }}
              onMouseEnter={e => { e.currentTarget.style.opacity = "0.88"; e.currentTarget.style.transform = "translateY(-1px)"; }}
              onMouseLeave={e => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.transform = "none"; }}>
              Create your vault — it's free <ArrowRight style={{ width: 16, height: 16 }} />
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ════════════════════════════════════════
          TESTIMONIALS
      ════════════════════════════════════════ */}
      <section id="stories" style={{ background: C.white, borderTop: `1px solid ${C.border}`, padding: "96px 0 100px" }}>
        <div style={{ maxWidth: 1180, margin: "0 auto", padding: "0 24px" }}>
          <Reveal style={{ marginBottom: 56 }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: C.muted, marginBottom: 14 }}>REAL COUPLES</p>
            <h2 style={{ ...SG, fontSize: "clamp(26px,4vw,50px)", fontWeight: 700, letterSpacing: "-0.035em", lineHeight: 1.07, color: C.ink }}>
              Loved by couples<br />all over India.
            </h2>
          </Reveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {TESTIMONIALS.map((t, i) => (
              <Reveal key={i} delay={i * 55}>
                <div style={{
                  background: C.white, border: `1px solid ${C.border}`, borderRadius: 18, padding: "28px",
                  display: "flex", flexDirection: "column", gap: 18, height: "100%", transition: "all 0.2s",
                }}
                  onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 12px 40px rgba(0,0,0,0.09)"; e.currentTarget.style.borderColor = C.borderDark; e.currentTarget.style.transform = "translateY(-2px)"; }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.borderColor = C.border; e.currentTarget.style.transform = "none"; }}>
                  {/* Stars */}
                  <div style={{ display: "flex", gap: 3 }}>
                    {Array.from({ length: t.stars }).map((_, j) => (
                      <Star key={j} style={{ width: 13, height: 13, fill: C.gold, color: C.gold }} />
                    ))}
                  </div>
                  {/* Quote */}
                  <p style={{ fontSize: 14, lineHeight: 1.82, color: C.body, flex: 1, margin: 0 }}>"{t.quote}"</p>
                  {/* Author */}
                  <div style={{ display: "flex", alignItems: "center", gap: 12, paddingTop: 16, borderTop: `1px solid ${C.border}` }}>
                    <div style={{ width: 40, height: 40, borderRadius: "50%", background: C.ink, color: "#fff", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{t.init}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ ...SG, fontSize: 13, fontWeight: 700, color: C.ink, margin: 0 }}>{t.name}</p>
                      <p style={{ fontSize: 11, color: C.muted, margin: 0, marginTop: 1 }}>{t.meta}</p>
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 700, color: C.muted, background: C.surface, padding: "3px 10px", borderRadius: 99, flexShrink: 0 }}>{t.plan}</span>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          PRICING
      ════════════════════════════════════════ */}
      <section id="pricing" style={{ background: C.bgAlt, borderTop: `1px solid ${C.border}`, padding: "96px 0 100px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px" }}>
          <Reveal>
            <div style={{ textAlign: "center", marginBottom: 60 }}>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: C.muted, marginBottom: 14 }}>PRICING</p>
              <h2 style={{ ...SG, fontSize: "clamp(28px,4.5vw,52px)", fontWeight: 700, letterSpacing: "-0.035em", lineHeight: 1.08, color: C.ink, marginBottom: 14 }}>
                Simple, honest pricing.
              </h2>
              <p style={{ fontSize: 17, lineHeight: 1.72, color: C.body, maxWidth: 480, margin: "0 auto 20px" }}>
                One plan covers both partners. Start free — upgrade when you're ready.
              </p>
              {/* Partner sharing callout */}
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: C.roseLight, border: `1px solid ${C.roseMid}`, borderRadius: 99, padding: "8px 16px" }}>
                <Users style={{ width: 13, height: 13, color: C.rose }} />
                <span style={{ fontSize: 12, fontWeight: 600, color: C.rose }}>One subscription covers both of you — always</span>
              </div>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
            {PLANS.map((plan, i) => (
              <Reveal key={i} delay={i * 70}>
                <div
                  className={plan.highlight ? "md:scale-105 md:shadow-2xl" : ""}
                  style={{
                  background: plan.highlight ? C.ink : C.white,
                  border: `1px solid ${plan.highlight ? "rgba(255,255,255,0.1)" : C.border}`,
                  borderRadius: 20, padding: "36px 30px",
                  display: "flex", flexDirection: "column",
                  position: "relative",
                  boxShadow: plan.highlight ? "0 20px 60px rgba(0,0,0,0.20)" : "none",
                }}>
                  {plan.badge && (
                    <div style={{ position: "absolute", top: -13, left: "50%", transform: "translateX(-50%)", background: plan.highlight ? "#fff" : C.ink, color: plan.highlight ? C.ink : "#fff", fontSize: 10, fontWeight: 800, padding: "5px 16px", borderRadius: 99, whiteSpace: "nowrap", letterSpacing: "0.06em", fontFamily: "ui-monospace, monospace" }}>
                      {plan.badge.toUpperCase()}
                    </div>
                  )}

                  {/* Plan header */}
                  <div style={{ marginBottom: 28 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                      <div style={{ width: 44, height: 44, borderRadius: 13, background: plan.highlight ? "rgba(255,255,255,0.1)" : C.surface, border: `1px solid ${plan.highlight ? "rgba(255,255,255,0.1)" : C.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
                        {plan.emoji}
                      </div>
                      <div>
                        <div style={{ ...SG, fontSize: 16, fontWeight: 700, color: plan.highlight ? "#fff" : C.ink }}>{plan.name}</div>
                        <div style={{ fontSize: 11, color: plan.highlight ? "rgba(255,255,255,0.45)" : C.muted, marginTop: 1 }}>{plan.tagline}</div>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                      <span style={{ ...SG, fontSize: plan.priceNum ? "clamp(36px,5vw,46px)" : "clamp(30px,4vw,38px)", fontWeight: 700, letterSpacing: "-0.04em", color: plan.highlight ? "#fff" : C.ink }}>{plan.price}</span>
                      {plan.priceNum && <span style={{ fontSize: 14, color: plan.highlight ? "rgba(255,255,255,0.45)" : C.muted }}>{plan.period}</span>}
                    </div>
                    {!plan.priceNum && <p style={{ fontSize: 12, color: plan.highlight ? "rgba(255,255,255,0.45)" : C.muted, marginTop: 2 }}>forever free</p>}
                  </div>

                  {/* Feature list */}
                  <ul style={{ listStyle: "none", padding: 0, margin: "0 0 28px", display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
                    {plan.features.map((f, j) => (
                      <li key={j} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: f.ok ? (plan.highlight ? "rgba(255,255,255,0.87)" : C.body) : (plan.highlight ? "rgba(255,255,255,0.22)" : C.subtle) }}>
                        <div style={{ width: 17, height: 17, borderRadius: "50%", background: f.ok ? (plan.highlight ? "rgba(255,255,255,0.15)" : C.surface) : "transparent", border: `1px solid ${f.ok ? (plan.highlight ? "rgba(255,255,255,0.2)" : C.border) : "transparent"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          {f.ok
                            ? <Check style={{ width: 9, height: 9, color: plan.highlight ? "#fff" : C.ink }} />
                            : <XIcon style={{ width: 8, height: 8, color: plan.highlight ? "rgba(255,255,255,0.25)" : C.subtle }} />
                          }
                        </div>
                        {f.text}
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <Link to="/auth" style={{
                    display: "block", textAlign: "center", fontWeight: 700, fontSize: 14, padding: "13px",
                    borderRadius: 11, textDecoration: "none", transition: "all 0.2s",
                    background: plan.highlight ? "#fff" : C.ink,
                    color: plan.highlight ? C.ink : "#fff",
                  }}
                    onMouseEnter={e => { e.currentTarget.style.opacity = "0.86"; }}
                    onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}>
                    {plan.id === "single" ? "Get started free" : plan.id === "dating" ? `Get Dating · ${plan.price}` : `Become Soulmates · ${plan.price}`}
                  </Link>

                  {plan.highlight && (
                    <p style={{ fontSize: 11, textAlign: "center", color: "rgba(255,255,255,0.32)", marginTop: 10 }}>
                      Cancel anytime · No hidden fees
                    </p>
                  )}
                </div>
              </Reveal>
            ))}
          </div>

          {/* Feature comparison note */}
          <Reveal style={{ marginTop: 48 }}>
            <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 16, padding: "24px 28px" }}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 24, justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <h4 style={{ ...SG, fontSize: 14, fontWeight: 700, color: C.ink, marginBottom: 6 }}>Good to know</h4>
                  <p style={{ fontSize: 13, color: C.muted, margin: 0 }}>Payments are processed securely via Razorpay. All prices in INR.</p>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {[
                    "One subscription covers both partners — only one of you needs to pay.",
                    "Free plan gives 50 uploads/month each (you + partner = 100 combined).",
                    "Cancel anytime from Settings → Billing. No questions asked.",
                  ].map((note, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 13, color: C.body }}>
                      <Check style={{ width: 13, height: 13, color: C.ink, flexShrink: 0, marginTop: 2 }} />
                      {note}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ════════════════════════════════════════
          SECURITY TRUST BAND
      ════════════════════════════════════════ */}
      <section style={{ background: C.ink, borderTop: "1px solid rgba(255,255,255,0.06)", padding: "56px 0" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px" }}>
          <Reveal>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 40, alignItems: "center", justifyContent: "center" }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ ...SG, fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 4 }}>🔒 End-to-end encrypted</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>AES-256-GCM on all messages & notes</div>
              </div>
              <div style={{ width: 1, height: 36, background: "rgba(255,255,255,0.1)" }} className="hidden md:block" />
              <div style={{ textAlign: "center" }}>
                <div style={{ ...SG, fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 4 }}>🛡️ Zero-knowledge architecture</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>We can never read your private content</div>
              </div>
              <div style={{ width: 1, height: 36, background: "rgba(255,255,255,0.1)" }} className="hidden md:block" />
              <div style={{ textAlign: "center" }}>
                <div style={{ ...SG, fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 4 }}>📱 PWA — Install like a native app</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>iOS & Android — no app store needed</div>
              </div>
              <div style={{ width: 1, height: 36, background: "rgba(255,255,255,0.1)" }} className="hidden md:block" />
              <div style={{ textAlign: "center" }}>
                <div style={{ ...SG, fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 4 }}>🚫 Zero ads, zero tracking</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>Your data is never sold or analysed</div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ════════════════════════════════════════
          FAQ
      ════════════════════════════════════════ */}
      <section id="faq" style={{ background: C.white, borderTop: `1px solid ${C.border}`, padding: "96px 0 100px" }}>
        <div style={{ maxWidth: 780, margin: "0 auto", padding: "0 24px" }}>
          <Reveal style={{ marginBottom: 56 }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: C.muted, marginBottom: 14 }}>FAQ</p>
            <h2 style={{ ...SG, fontSize: "clamp(26px,4vw,46px)", fontWeight: 700, letterSpacing: "-0.035em", lineHeight: 1.1, color: C.ink }}>
              Questions you might have.
            </h2>
          </Reveal>
          <div>
            {FAQ.map((item, i) => (
              <FaqItem key={i} q={item.q} a={item.a} open={openFaq === i} onClick={() => setOpenFaq(openFaq === i ? null : i)} />
            ))}
          </div>
          <Reveal style={{ marginTop: 48 }}>
            <div style={{ background: C.bgAlt, border: `1px solid ${C.border}`, borderRadius: 14, padding: "24px 28px", display: "flex", flexWrap: "wrap", gap: 16, alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <p style={{ ...SG, fontSize: 15, fontWeight: 700, color: C.ink, margin: "0 0 4px" }}>Still have questions?</p>
                <p style={{ fontSize: 13, color: C.muted, margin: 0 }}>We're happy to help. Write to us anytime.</p>
              </div>
              <a href="mailto:hello@ourvault.in" style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 14, fontWeight: 600, color: "#fff", background: C.ink, padding: "10px 20px", borderRadius: 10, textDecoration: "none", transition: "opacity 0.15s", flexShrink: 0 }}
                onMouseEnter={e => e.currentTarget.style.opacity = "0.82"}
                onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
                hello@ourvault.in <ArrowRight style={{ width: 14, height: 14 }} />
              </a>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ════════════════════════════════════════
          FINAL CTA
      ════════════════════════════════════════ */}
      <section style={{ background: C.bgAlt, borderTop: `1px solid ${C.border}`, padding: "112px 0" }}>
        <div style={{ maxWidth: 700, margin: "0 auto", padding: "0 24px", textAlign: "center" }}>
          <Reveal>
            <div style={{ width: 60, height: 60, borderRadius: 18, background: C.ink, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 32px" }}>
              <Heart style={{ width: 26, height: 26, fill: "#fff", color: "#fff" }} />
            </div>
            <h2 style={{ ...SG, fontSize: "clamp(30px,5.5vw,58px)", fontWeight: 700, letterSpacing: "-0.038em", lineHeight: 1.06, color: C.ink, marginBottom: 20 }}>
              Your love story deserves<br />
              <span style={{ color: C.muted }}>a home that lasts.</span>
            </h2>
            <p style={{ fontSize: "clamp(15px,2vw,18px)", lineHeight: 1.76, color: C.body, marginBottom: 40 }}>
              Join 50,000+ couples who trust OurVault with their most precious moments.<br />Free to start. Always private. No credit card.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 14, justifyContent: "center", alignItems: "center" }}>
              <Link to="/auth" style={{ display: "inline-flex", alignItems: "center", gap: 8, fontWeight: 700, fontSize: 16, color: "#fff", background: C.ink, padding: "16px 36px", borderRadius: 14, textDecoration: "none", boxShadow: "0 6px 28px rgba(0,0,0,0.2)", transition: "all 0.2s" }}
                onMouseEnter={e => { e.currentTarget.style.opacity = "0.86"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                onMouseLeave={e => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.transform = "none"; }}>
                Start free today <ArrowRight style={{ width: 17, height: 17 }} />
              </Link>
              <a href="#pricing" style={{ fontSize: 13, fontWeight: 500, color: C.muted, textDecoration: "underline", textDecorationColor: C.border, transition: "color 0.15s" }}
                onMouseEnter={e => e.currentTarget.style.color = C.ink}
                onMouseLeave={e => e.currentTarget.style.color = C.muted}>
                See pricing →
              </a>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ════════════════════════════════════════
          FOOTER
      ════════════════════════════════════════ */}
      <footer style={{ background: C.ink, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        {/* Main footer content */}
        <div style={{ maxWidth: 1180, margin: "0 auto", padding: "60px 24px 48px" }}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">

            {/* Brand col */}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 16 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Heart style={{ width: 16, height: 16, fill: C.ink, color: C.ink }} />
                </div>
                <span style={{ ...SG, fontSize: 20, fontWeight: 700, color: "#fff", letterSpacing: "-0.03em" }}>OurVault</span>
              </div>
              <p style={{ fontSize: 13, lineHeight: 1.8, color: "rgba(255,255,255,0.4)", maxWidth: 260, marginBottom: 20 }}>
                The private space your love story deserves. End-to-end encrypted, beautifully designed for couples.
              </p>
              <div style={{ display: "flex", gap: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: 8, background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Heart style={{ width: 14, height: 14, fill: "#e11d48", color: "#e11d48" }} />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.5)", margin: 0 }}>Made with love in India</p>
                  <p style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", margin: 0, marginTop: 1 }}>For couples everywhere</p>
                </div>
              </div>
            </div>

            {/* Product */}
            <div>
              <h4 style={{ ...SG, fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.5)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 18 }}>Product</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {[["#features", "Features"], ["#how-it-works", "How it works"], ["#pricing", "Pricing"], ["#faq", "FAQ"]].map(([href, label]) => (
                  <a key={href} href={href} style={{ fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.45)", textDecoration: "none", transition: "color 0.15s" }}
                    onMouseEnter={e => e.currentTarget.style.color = "#fff"}
                    onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.45)"}>
                    {label}
                  </a>
                ))}
              </div>
            </div>

            {/* Features */}
            <div>
              <h4 style={{ ...SG, fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.5)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 18 }}>Features</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {["Media Vault", "Private Chat", "Milestones", "Travel Map", "Bucket List", "Love Notes"].map(label => (
                  <Link key={label} to="/auth" style={{ fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.45)", textDecoration: "none", transition: "color 0.15s" }}
                    onMouseEnter={e => e.currentTarget.style.color = "#fff"}
                    onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.45)"}>
                    {label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Account */}
            <div>
              <h4 style={{ ...SG, fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.5)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 18 }}>Account</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {[["Sign up free", "/auth"], ["Log in", "/auth"], ["Pricing", "#pricing"]].map(([label, href]) => (
                  <Link key={label} to={href} style={{ fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.45)", textDecoration: "none", transition: "color 0.15s" }}
                    onMouseEnter={e => e.currentTarget.style.color = "#fff"}
                    onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.45)"}>
                    {label}
                  </Link>
                ))}
                <a href="mailto:hello@ourvault.in" style={{ fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.45)", textDecoration: "none", transition: "color 0.15s" }}
                  onMouseEnter={e => e.currentTarget.style.color = "#fff"}
                  onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.45)"}>
                  Support
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Footer bottom bar */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ maxWidth: 1180, margin: "0 auto", padding: "20px 24px", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", margin: 0 }}>
              © 2026 OurVault. All rights reserved.
            </p>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <Lock style={{ width: 11, height: 11, color: "rgba(255,255,255,0.25)" }} />
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.25)" }}>End-to-end encrypted · Zero-knowledge · No ads</span>
            </div>
            <div style={{ display: "flex", gap: 20 }}>
              {["Privacy Policy", "Terms of Service"].map(l => (
                <a key={l} href="#" style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", textDecoration: "none", transition: "color 0.15s" }}
                  onMouseEnter={e => e.currentTarget.style.color = "rgba(255,255,255,0.7)"}
                  onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.3)"}>
                  {l}
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
