import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Heart, ArrowRight, Check, Lock, Shield, Star,
  Menu, X as XIcon, Camera, MessageCircle, Calendar,
  Sparkles, Image, Mic, Bell, Users, ChevronRight } from "lucide-react";
import dashboardImg from "@/assets/dashboard-preview.png";

/* ── Design Tokens ─────────────────────────────────────── */
const T = {
  white: "#ffffff",
  bg: "#fafafa",
  surface: "#f4f4f5",
  surfaceHover: "#eeeeef",
  ink: "#0a0a0a",
  body: "#3f3f46",
  muted: "#71717a",
  subtle: "#a1a1aa",
  border: "#e4e4e7",
  borderDark: "#d4d4d8",
  black: "#0a0a0a",
  blackHover: "#27272a"
};

/* ── Scroll reveal ──────────────────────────────────────── */
function useInView(threshold = 0.07) {
  const ref = useRef<HTMLDivElement>(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVis(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, vis };
}

function Reveal({ children, delay = 0, className = "", style }: {
  children: React.ReactNode; delay?: number; className?: string; style?: React.CSSProperties;
}) {
  const { ref, vis } = useInView();
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${vis ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"} ${className}`}
      style={{ transitionDelay: `${delay}ms`, ...style }}>
      {children}
    </div>
  );
}

/* ── Typography helpers ─────────────────────────────────── */
const display: React.CSSProperties = {
  fontFamily: "'Space Grotesk', system-ui, sans-serif",
  fontWeight: 600,
  letterSpacing: "-0.03em",
  color: T.ink
};

const mono: React.CSSProperties = {
  fontFamily: "ui-monospace, 'SF Mono', monospace",
  fontSize: 11,
  letterSpacing: "0.08em"
};

/* ── Static data ────────────────────────────────────────── */
const NAV = [
  ["#features", "Features"],
  ["#how-it-works", "How it works"],
  ["#pricing", "Pricing"],
  ["#stories", "Stories"]
];

const FEATURES = [
  { icon: Image, title: "Save every photo & video", desc: "Upload anything — a selfie, a trip, a random Tuesday — and it all lives safely in one beautiful place, just for the two of you." },
  { icon: Lock, title: "Only you two can see it", desc: "No public feed, no ads, no strangers. What you share here stays here. Your most personal moments, kept completely private." },
  { icon: MessageCircle, title: "Chat that's just for you two", desc: "Text, react with emojis, reply to messages, send voice notes. Like WhatsApp — but a quiet space that's only yours." },
  { icon: Calendar, title: "Never forget a special date", desc: "Add your first date, first trip, first anniversary. Get reminders before each one so you're always ready to celebrate." },
  { icon: Mic, title: "Send voice messages", desc: "Sometimes words aren't enough. Record a voice note and let them hear your voice — not just read your words." },
  { icon: Heart, title: "Write love notes on photos", desc: "Add a little message to any memory. A joke, a feeling, a 'remember when?' — right on the photo that brought it back." },
  { icon: Star, title: "Star your favourites", desc: "Mark the memories you never want to lose track of. Your best moments, always one tap away." },
  { icon: Sparkles, title: "Watch your story grow", desc: "A beautiful timeline that fills up as your relationship grows — from your first photo to your latest adventure." },
  { icon: Shield, title: "Your data is yours, forever", desc: "We don't sell your data, show you ads, or share anything with anyone. Everything you upload belongs to you. Always." }
];

const STEPS = [
  { n: "01", icon: Users, title: "Create your account", desc: "Sign up free in under a minute. No credit card, no commitment." },
  { n: "02", icon: Heart, title: "Invite your partner", desc: "Share a unique link. They join instantly and you're connected." },
  { n: "03", icon: Camera, title: "Start building memories", desc: "Upload photos, chat, add milestones. Your story starts now." }
];

const TESTIMONIALS = [
  { quote: "We live in different cities. OurVault is the only place we feel genuinely close. The voice messages make it feel like they're right there.", name: "Priya & Arjun", meta: "487 days together", init: "PA" },
  { quote: "Every trip, every date night, every little note — it's all here. We open it every morning with our coffee.", name: "Sneha & Rahul", meta: "1,204 days together", init: "SR" },
  { quote: "I wrote a love note on our first photo together. She cried. Best ₹9 I've ever spent in my life.", name: "Rohan M.", meta: "Dating plan", init: "RM" }
];

const PLANS = [
  { name: "Free", price: "₹0", period: "forever", desc: "Start exploring together.", cta: "Get started free", highlight: false,
    features: ["50 uploads per month", "Shared memory vault", "Milestone calendar", "Private chat"] },
  { name: "Dating", price: "₹9", period: "per month", desc: "For couples who want more.", cta: "Get Dating", highlight: true,
    features: ["200 uploads per month", "Everything in Free", "Emoji reactions", "Love notes on photos", "Activity feed"] },
  { name: "Soulmate", price: "₹99", period: "per month", desc: "Everything, no limits.", cta: "Become Soulmates", highlight: false,
    features: ["Unlimited uploads", "Everything in Dating", "Voice messages", "Slideshow mode", "Priority support"] }
];

/* ── App mockup visuals ─────────────────────────────────── */
function MemoriesCard() {
  return (
    <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 16, overflow: "hidden", boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}>
      <div style={{ padding: "10px 14px", background: T.surface, borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ width: 22, height: 22, borderRadius: 8, background: T.ink, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Heart className="w-3 h-3 text-white fill-white" />
        </div>
        <span style={{ fontSize: 12, fontWeight: 600, color: T.ink }}>Our Memories</span>
        <span style={{ marginLeft: "auto", fontSize: 10, fontWeight: 600, color: T.muted, background: T.surface, border: `1px solid ${T.border}`, padding: "2px 8px", borderRadius: 99 }}>47 photos</span>
      </div>
      <div style={{ padding: 12 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 6, marginBottom: 10 }}>
          {["🌅", "🎂", "🌿", "✈️", "🍽️", "🌙"].map((e, i) =>
            <div key={i} style={{ aspectRatio: "1", background: i % 2 === 0 ? T.surface : "#f0f0f1", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>{e}</div>
          )}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ flex: 1, background: T.surface, borderRadius: 10, padding: "8px 12px", fontSize: 11, color: T.muted, border: `1px solid ${T.border}` }}>Write a love note…</div>
          <button style={{ width: 34, height: 34, borderRadius: 10, background: T.ink, border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
            <Heart className="w-3.5 h-3.5 text-white fill-white" />
          </button>
        </div>
      </div>
    </div>
  );
}

function ChatCard() {
  return (
    <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 16, overflow: "hidden", boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}>
      <div style={{ padding: "10px 14px", background: T.surface, borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 30, height: 30, borderRadius: "50%", background: T.surface, border: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>💑</div>
        <div>
          <p style={{ fontSize: 12, fontWeight: 600, color: T.ink, margin: 0 }}>Priya</p>
          <p style={{ fontSize: 10, color: T.muted, margin: 0 }}>● Online now</p>
        </div>
      </div>
      <div style={{ padding: "12px 12px 8px", minHeight: 140, display: "flex", flexDirection: "column", gap: 8 }}>
        {[
          { mine: false, msg: "Remember our first date? 🥹" },
          { mine: true, msg: "How could I ever forget 😄" },
          { mine: false, msg: "I just uploaded the photos 🖤" },
          { mine: true, msg: "Adding love notes to each one 🌙" }
        ].map((m, i) =>
          <div key={i} style={{ display: "flex", justifyContent: m.mine ? "flex-end" : "flex-start" }}>
            <div style={{
              maxWidth: "75%", padding: "7px 12px", borderRadius: 14, fontSize: 12,
              background: m.mine ? T.ink : T.surface,
              color: m.mine ? "#fff" : T.body,
              borderBottomRightRadius: m.mine ? 4 : 14,
              borderBottomLeftRadius: m.mine ? 14 : 4
            }}>{m.msg}</div>
          </div>
        )}
      </div>
      <div style={{ padding: "8px 12px 12px", borderTop: `1px solid ${T.border}`, display: "flex", gap: 8 }}>
        <div style={{ flex: 1, background: T.surface, borderRadius: 10, padding: "8px 12px", fontSize: 11, color: T.muted, border: `1px solid ${T.border}` }}>Type a message…</div>
        <button style={{ width: 34, height: 34, borderRadius: 10, background: T.ink, border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
          <ArrowRight className="w-3.5 h-3.5 text-white" />
        </button>
      </div>
    </div>
  );
}

function TimelineCard() {
  return (
    <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 16, overflow: "hidden", boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}>
      <div style={{ padding: "10px 14px", background: T.surface, borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", gap: 8 }}>
        <Calendar style={{ width: 15, height: 15, color: T.ink }} />
        <span style={{ fontSize: 12, fontWeight: 600, color: T.ink }}>Love Timeline</span>
      </div>
      <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 6 }}>
        {[
          { e: "💑", l: "First Date", d: "Dec 2, 2024", active: false },
          { e: "💬", l: "First 'I Love You'", d: "Jan 14, 2025", active: false },
          { e: "✈️", l: "Goa Trip together", d: "Feb 14, 2025", active: true },
          { e: "🎂", l: "1 Year Anniversary", d: "Dec 2, 2025", active: false }
        ].map((m, i) =>
          <div key={i} style={{
            display: "flex", alignItems: "center", gap: 12, padding: "9px 12px", borderRadius: 10,
            background: m.active ? T.ink : T.surface,
            border: `1px solid ${m.active ? T.ink : T.border}`
          }}>
            <span style={{ fontSize: 16 }}>{m.e}</span>
            <p style={{ flex: 1, fontSize: 12, fontWeight: 600, color: m.active ? "#fff" : T.ink, margin: 0 }}>{m.l}</p>
            <span style={{ fontSize: 10, fontWeight: 500, color: m.active ? "rgba(255,255,255,0.6)" : T.muted }}>{m.d}</span>
          </div>
        )}
      </div>
    </div>
  );
}

const SHOWCASES = [
  { tag: "SHARED MEMORIES", title: "Every photo. Every memory.\nIn one private place.", body: "Build a beautiful private album that grows with your relationship. Add love notes, star favourites, and relive every moment together.", bullets: ["Private folders & albums", "Love notes on every photo", "Star your all-time favourites", "Shared access, always"], card: <MemoriesCard /> },
  { tag: "PRIVATE CHAT", title: "Your own corner of the\ninternet. Yours only.", body: "A dedicated space for just the two of you. Voice messages, emoji reactions, reply threads — with the peace of total privacy.", bullets: ["Fully private — no third-party access", "Voice messages (Soulmate plan)", "Emoji reactions & reply threads", "Read receipts included"], card: <ChatCard /> },
  { tag: "LOVE TIMELINE", title: "Log every milestone.\nRelive every first.", body: "From your first date to your first anniversary and beyond — every milestone on a beautiful timeline, with smart reminders.", bullets: ["Log custom milestone types", "Smart anniversary reminders", "Attach photos to any milestone", "Chronological timeline view"], card: <TimelineCard /> }
];

/* ════════════════════ PAGE ════════════════════ */
export default function Index() {
  const [scrollY, setScrollY] = useState(0);
  const [menu, setMenu] = useState(false);

  useEffect(() => {
    const fn = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const scrolled = scrollY > 20;

  return (
    <div style={{ background: T.bg, color: T.ink, fontFamily: "'Inter', system-ui, sans-serif", overflowX: "hidden", minHeight: "100vh" }}>

      {/* ══ NAV ══════════════════════════════════════════════ */}
      <header style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
        background: scrolled ? "rgba(250,250,250,0.94)" : "transparent",
        backdropFilter: scrolled ? "blur(16px)" : "none",
        borderBottom: scrolled ? `1px solid ${T.border}` : "1px solid transparent",
        transition: "all 0.25s ease"
      }}>
        <div className="flex items-center gap-4 md:gap-8" style={{ maxWidth: 1120, margin: "0 auto", padding: "0 20px", height: 64 }}>
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 flex-shrink-0" style={{ textDecoration: "none" }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: T.ink, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Heart className="w-3.5 h-3.5 text-white fill-white" />
            </div>
            <span style={{ ...display, fontSize: 17, color: T.ink }}>OurVault</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-7 flex-1 justify-center">
            {NAV.map(([href, label]) =>
              <a key={href} href={href} style={{ fontSize: 14, fontWeight: 500, color: T.muted, textDecoration: "none", transition: "color 0.15s" }}
                onMouseEnter={(e) => e.currentTarget.style.color = T.ink}
                onMouseLeave={(e) => e.currentTarget.style.color = T.muted}>
                {label}
              </a>
            )}
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-2 flex-shrink-0">
            <Link to="/auth" style={{ fontSize: 13, fontWeight: 500, color: T.body, padding: "7px 14px", borderRadius: 8, textDecoration: "none", transition: "background 0.15s" }}
              onMouseEnter={(e) => e.currentTarget.style.background = T.surface}
              onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
              Log in
            </Link>
            <Link to="/auth" style={{ fontSize: 13, fontWeight: 600, color: "#fff", background: T.ink, padding: "8px 18px", borderRadius: 10, textDecoration: "none", transition: "opacity 0.15s" }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = "0.85"}
              onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}>
              Sign up free →
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button onClick={() => setMenu(!menu)} className="md:hidden ml-auto" style={{ padding: 8, borderRadius: 8, background: "transparent", border: "none", cursor: "pointer" }}>
            {menu ? <XIcon style={{ width: 20, height: 20, color: T.ink }} /> : <Menu style={{ width: 20, height: 20, color: T.ink }} />}
          </button>
        </div>

        {/* Mobile menu */}
        {menu &&
          <div style={{ background: T.white, borderTop: `1px solid ${T.border}`, padding: "8px 20px 24px" }} className="md:hidden">
            {NAV.map(([href, label]) =>
              <a key={href} href={href} onClick={() => setMenu(false)}
                style={{ display: "block", fontSize: 15, fontWeight: 500, color: T.body, padding: "13px 0", borderBottom: `1px solid ${T.border}`, textDecoration: "none" }}>
                {label}
              </a>
            )}
            <div className="flex flex-col gap-3 mt-4">
              <Link to="/auth" onClick={() => setMenu(false)}
                style={{ display: "block", fontSize: 14, fontWeight: 500, color: T.body, padding: "13px", borderRadius: 10, textAlign: "center", textDecoration: "none", border: `1px solid ${T.border}` }}>
                Log in
              </Link>
              <Link to="/auth" onClick={() => setMenu(false)}
                style={{ display: "block", fontSize: 14, fontWeight: 600, color: "#fff", background: T.ink, padding: "13px", borderRadius: 10, textAlign: "center", textDecoration: "none" }}>
                Sign up free →
              </Link>
            </div>
          </div>
        }
      </header>

      {/* ══ HERO ═════════════════════════════════════════════ */}
      <section style={{ background: T.white, paddingTop: 64 }}>
        <div className="mx-auto text-center" style={{ maxWidth: 800, padding: "64px 20px 48px" }}>

          {/* H1 */}
          <Reveal delay={60}>
            <h1 style={{ ...display, fontSize: "clamp(32px, 6vw, 62px)", lineHeight: 1.1, marginBottom: 20, maxWidth: 860, marginLeft: "auto", marginRight: "auto" }}>
              The private space your love story
              <br />
              <span style={{ background: "linear-gradient(135deg, #0a0a0a 30%, #52525b)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                deserves.
              </span>
            </h1>
          </Reveal>

          {/* Sub */}
          <Reveal delay={110}>
            <p className="mx-auto" style={{ fontSize: "clamp(15px, 2.5vw, 18px)", lineHeight: 1.7, color: T.body, marginBottom: 32, maxWidth: 500 }}>
              Store memories, chat privately, send voice messages, and celebrate every milestone — just the two of you.
            </p>
          </Reveal>

          {/* CTAs */}
          <Reveal delay={160}>
            <div className="flex flex-wrap gap-3 justify-center" style={{ marginBottom: 28 }}>
              <Link to="/auth" style={{ display: "inline-flex", alignItems: "center", gap: 8, fontWeight: 600, fontSize: 15, color: "#fff", background: T.ink, padding: "13px 28px", borderRadius: 12, textDecoration: "none", boxShadow: "0 2px 12px rgba(0,0,0,0.18)", transition: "opacity 0.15s" }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = "0.85"}
                onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}>
                Start for free <ArrowRight style={{ width: 16, height: 16 }} />
              </Link>
              <a href="#features" style={{ display: "inline-flex", alignItems: "center", gap: 8, fontWeight: 500, fontSize: 15, color: T.body, background: T.white, padding: "13px 28px", borderRadius: 12, textDecoration: "none", border: `1px solid ${T.borderDark}`, transition: "background 0.15s" }}
                onMouseEnter={(e) => e.currentTarget.style.background = T.surface}
                onMouseLeave={(e) => e.currentTarget.style.background = T.white}>
                See how it works
              </a>
            </div>
          </Reveal>

          {/* Trust strip */}
          <Reveal delay={200}>
            <div className="flex flex-wrap gap-4 justify-center" style={{ fontSize: 12, fontWeight: 500, color: T.muted }}>
              {[
                [<Check style={{ width: 13, height: 13 }} />, "No credit card required"],
                [<Lock style={{ width: 13, height: 13 }} />, "Fully private — always"],
                [<Shield style={{ width: 13, height: 13 }} />, "Secure storage"],
                [<Star style={{ width: 13, height: 13, fill: "#0a0a0a", color: "#0a0a0a" }} />, "4.9 / 5 rating"]
              ].map(([icon, label], i) =>
                <span key={i} className="flex items-center gap-1.5">
                  {icon as React.ReactNode}
                  {label as string}
                </span>
              )}
            </div>
          </Reveal>
        </div>

        {/* App mockup — browser frame */}
        <Reveal delay={260} className="max-w-5xl mx-auto px-4 sm:px-6 md:px-10 pb-0">
          <div style={{ borderRadius: "16px 16px 0 0", overflow: "hidden", border: `1px solid ${T.border}`, borderBottom: "none", boxShadow: "0 -4px 48px rgba(0,0,0,0.10)" }}>
            {/* Browser chrome bar */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 20px", background: T.surface, borderBottom: `1px solid ${T.border}` }}>
              <div style={{ display: "flex", gap: 6 }}>
                <div style={{ width: 11, height: 11, borderRadius: "50%", background: "#fca5a5" }} />
                <div style={{ width: 11, height: 11, borderRadius: "50%", background: "#fcd34d" }} />
                <div style={{ width: 11, height: 11, borderRadius: "50%", background: "#86efac" }} />
              </div>
              <div style={{ flex: 1, maxWidth: 260, margin: "0 auto", background: T.white, border: `1px solid ${T.border}`, borderRadius: 6, padding: "5px 12px", fontSize: 11, color: T.muted, textAlign: "center" }}>
                app.ourvault.in/dashboard
              </div>
            </div>
            {/* Real dashboard screenshot */}
            <img
              src={dashboardImg}
              alt="OurVault dashboard — private memory vault for couples"
              style={{ width: "100%", display: "block", objectFit: "cover", objectPosition: "top" }} />
          </div>
        </Reveal>
      </section>

      {/* ══ STATS ════════════════════════════════════════════ */}
      <Reveal>
        <div style={{ background: T.surface, borderTop: `1px solid ${T.border}`, borderBottom: `1px solid ${T.border}` }}>
          <div className="grid grid-cols-2 md:grid-cols-4" style={{ maxWidth: 1000, margin: "0 auto", padding: "0 20px" }}>
            {[
              { val: "50,000+", label: "Couples using OurVault" },
              { val: "2M+", label: "Memories safely stored" },
              { val: "4.9 ★", label: "Average app rating" },
              { val: "100%", label: "Private, always" }
            ].map((s, i) =>
              <div key={i} className={`text-center py-6 px-4 ${i % 2 === 0 ? "border-r" : ""} md:border-r last:border-r-0`} style={{ borderColor: T.border }}>
                <div style={{ ...display, fontSize: "clamp(22px, 4vw, 28px)", marginBottom: 2 }}>{s.val}</div>
                <div style={{ fontSize: 12, fontWeight: 500, color: T.muted }}>{s.label}</div>
              </div>
            )}
          </div>
        </div>
      </Reveal>

      {/* ══ FEATURES ═════════════════════════════════════════ */}
      <section id="features" style={{ background: T.white, padding: "72px 0 80px" }}>
        <div style={{ maxWidth: 1120, margin: "0 auto", padding: "0 20px" }}>
          <Reveal style={{ maxWidth: 640, marginBottom: 48 }}>
            <p style={{ ...mono, color: T.muted, textTransform: "uppercase", marginBottom: 14 }}>WHAT YOU GET</p>
            <h2 style={{ ...display, fontSize: "clamp(26px, 3.5vw, 44px)", lineHeight: 1.1, marginBottom: 14 }}>
              Everything you need to<br />keep your relationship close.
            </h2>
            <p style={{ fontSize: 16, lineHeight: 1.75, color: T.body }}>One app for your photos, your chats, your milestones — and all the little moments in between.</p>
          </Reveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" style={{ border: `1px solid ${T.border}`, borderRadius: 16, overflow: "hidden" }}>
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              const col = 3;
              const row = Math.floor(i / col);
              const totalRows = Math.ceil(FEATURES.length / col);
              const isLastRow = row === totalRows - 1;
              const isLastInRow = (i + 1) % col === 0;
              return (
                <Reveal key={i} delay={i * 40}>
                  <div
                    className={[
                      "p-7 md:p-8 transition-colors duration-150",
                      !isLastInRow ? "sm:border-r" : "",
                      !isLastRow ? "border-b" : ""
                    ].join(" ")}
                    style={{ background: T.white, borderColor: T.border }}
                    onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.background = T.bg}
                    onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.background = T.white}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: T.surface, border: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                      <Icon style={{ width: 18, height: 18, color: T.ink }} strokeWidth={1.75} />
                    </div>
                    <h3 style={{ fontSize: 15, fontWeight: 600, color: T.ink, marginBottom: 8 }}>{f.title}</h3>
                    <p style={{ fontSize: 14, lineHeight: 1.7, color: T.body }}>{f.desc}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══ SHOWCASES ════════════════════════════════════════ */}
      {SHOWCASES.map((s, i) =>
        <section key={i} style={{ background: i % 2 === 0 ? T.surface : T.white, borderTop: `1px solid ${T.border}`, padding: "72px 0 80px" }}>
          <div style={{ maxWidth: 1120, margin: "0 auto", padding: "0 20px" }}>
            <div className={`grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center ${i % 2 === 1 ? "lg:[&>*:first-child]:order-2" : ""}`}>
              <Reveal delay={40}>
                <p style={{ ...mono, color: T.muted, textTransform: "uppercase", marginBottom: 18 }}>{s.tag}</p>
                <h2 style={{ ...display, fontSize: "clamp(22px, 3vw, 38px)", lineHeight: 1.1, marginBottom: 18, whiteSpace: "pre-line" }}>{s.title}</h2>
                <p style={{ fontSize: 15, lineHeight: 1.8, color: T.body, marginBottom: 28 }}>{s.body}</p>
                <ul style={{ listStyle: "none", padding: 0, margin: "0 0 28px", display: "flex", flexDirection: "column", gap: 10 }}>
                  {s.bullets.map((b, j) =>
                    <li key={j} style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 14, fontWeight: 500, color: T.ink }}>
                      <div style={{ width: 18, height: 18, borderRadius: "50%", background: T.surface, border: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>
                        <Check style={{ width: 10, height: 10, color: T.ink }} />
                      </div>
                      {b}
                    </li>
                  )}
                </ul>
                <Link to="/auth" style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 14, fontWeight: 600, color: T.ink, textDecoration: "none", borderBottom: `1.5px solid ${T.ink}`, paddingBottom: 2 }}>
                  Get started free <ChevronRight style={{ width: 15, height: 15 }} />
                </Link>
              </Reveal>
              <Reveal delay={120} className="flex justify-center">
                <div style={{ width: "100%", maxWidth: 360 }}>{s.card}</div>
              </Reveal>
            </div>
          </div>
        </section>
      )}

      {/* ══ HOW IT WORKS ═════════════════════════════════════ */}
      <section id="how-it-works" style={{ background: T.ink, padding: "72px 0 80px" }}>
        <div style={{ maxWidth: 960, margin: "0 auto", padding: "0 20px" }}>
          <Reveal className="text-center" style={{ marginBottom: 56 }}>
            <p style={{ ...mono, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", marginBottom: 16 }}>QUICK START</p>
            <h2 style={{ ...display, fontSize: "clamp(26px, 3.5vw, 44px)", lineHeight: 1.1, color: "#fff", marginBottom: 14 }}>
              Ready in under a minute.
            </h2>
            <p style={{ fontSize: 16, lineHeight: 1.75, color: "rgba(255,255,255,0.55)", maxWidth: 440, margin: "0 auto" }}>
              No tutorial needed. Sign up and start creating memories together.
            </p>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* connector line */}
            <div className="hidden md:block" style={{ position: "absolute", top: 36, left: "calc(16.67% + 36px)", right: "calc(16.67% + 36px)", height: 1, background: "rgba(255,255,255,0.12)" }} />
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              return (
                <Reveal key={i} delay={i * 100} className="text-center">
                  <div style={{ position: "relative", display: "inline-flex", marginBottom: 24 }}>
                    <div style={{ width: 72, height: 72, borderRadius: 20, background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Icon style={{ width: 30, height: 30, color: "rgba(255,255,255,0.8)" }} strokeWidth={1.5} />
                    </div>
                    <span style={{ position: "absolute", top: -10, right: -10, width: 24, height: 24, borderRadius: "50%", background: "#fff", color: T.ink, fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", ...mono }}>
                      {s.n}
                    </span>
                  </div>
                  <h3 style={{ fontSize: 15, fontWeight: 600, color: "#fff", marginBottom: 8 }}>{s.title}</h3>
                  <p style={{ fontSize: 14, lineHeight: 1.7, color: "rgba(255,255,255,0.5)" }}>{s.desc}</p>
                </Reveal>
              );
            })}
          </div>

          <Reveal className="text-center" style={{ marginTop: 56 }}>
            <Link to="/auth" style={{ display: "inline-flex", alignItems: "center", gap: 8, fontWeight: 600, fontSize: 14, color: T.ink, background: "#fff", padding: "13px 28px", borderRadius: 12, textDecoration: "none", transition: "opacity 0.15s" }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = "0.88"}
              onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}>
              Create your vault free <ArrowRight style={{ width: 15, height: 15 }} />
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ══ TESTIMONIALS ═════════════════════════════════════ */}
      <section id="stories" style={{ background: T.white, borderTop: `1px solid ${T.border}`, padding: "72px 0 80px" }}>
        <div style={{ maxWidth: 1120, margin: "0 auto", padding: "0 20px" }}>
          <Reveal style={{ marginBottom: 48 }}>
            <p style={{ ...mono, color: T.muted, textTransform: "uppercase", marginBottom: 14 }}>REAL COUPLES</p>
            <h2 style={{ ...display, fontSize: "clamp(26px, 3.5vw, 44px)", lineHeight: 1.1 }}>
              Loved by couples<br />all over India.
            </h2>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
            {TESTIMONIALS.map((t, i) =>
              <Reveal key={i} delay={i * 70}>
                <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 16, padding: "28px", display: "flex", flexDirection: "column", gap: 20, height: "100%", transition: "box-shadow 0.2s, border-color 0.2s" }}
                  onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 8px 32px rgba(0,0,0,0.08)"; e.currentTarget.style.borderColor = T.borderDark; }}
                  onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.borderColor = T.border; }}>
                  <div className="flex gap-1">
                    {Array.from({ length: 5 }).map((_, j) =>
                      <Star key={j} style={{ width: 14, height: 14, fill: T.ink, color: T.ink }} />
                    )}
                  </div>
                  <p style={{ fontSize: 14, lineHeight: 1.8, color: T.body, flex: 1 }}>"{t.quote}"</p>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, paddingTop: 16, borderTop: `1px solid ${T.border}` }}>
                    <div style={{ width: 38, height: 38, borderRadius: "50%", background: T.ink, color: "#fff", fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{t.init}</div>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 600, color: T.ink, margin: 0 }}>{t.name}</p>
                      <p style={{ fontSize: 11, color: T.muted, margin: 0 }}>{t.meta}</p>
                    </div>
                  </div>
                </div>
              </Reveal>
            )}
          </div>
        </div>
      </section>

      {/* ══ PRICING ══════════════════════════════════════════ */}
      <section id="pricing" style={{ background: T.surface, borderTop: `1px solid ${T.border}`, padding: "72px 0 80px" }}>
        <div style={{ maxWidth: 960, margin: "0 auto", padding: "0 20px" }}>
          <Reveal className="text-center" style={{ marginBottom: 48 }}>
            <p style={{ ...mono, color: T.muted, textTransform: "uppercase", marginBottom: 14 }}>PRICING</p>
            <h2 style={{ ...display, fontSize: "clamp(26px, 3.5vw, 44px)", lineHeight: 1.1, marginBottom: 14 }}>
              Simple, honest pricing.
            </h2>
            <p style={{ fontSize: 16, lineHeight: 1.75, color: T.body }}>Start completely free. Upgrade only when you want more.</p>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
            {PLANS.map((plan, i) =>
              <Reveal key={i} delay={i * 70}>
                <div style={{
                  background: plan.highlight ? T.ink : T.white,
                  border: `1px solid ${plan.highlight ? T.ink : T.border}`,
                  borderRadius: 16, padding: "32px 28px",
                  display: "flex", flexDirection: "column",
                  transform: plan.highlight ? "scale(1.03)" : "none",
                  boxShadow: plan.highlight ? "0 16px 48px rgba(0,0,0,0.16)" : "none",
                  position: "relative"
                }}>
                  {plan.highlight &&
                    <div style={{ position: "absolute", top: -13, left: "50%", transform: "translateX(-50%)", background: T.white, color: T.ink, fontSize: 10, fontWeight: 700, padding: "4px 14px", borderRadius: 99, border: `1px solid ${T.border}`, whiteSpace: "nowrap", ...mono, letterSpacing: "0.06em" }}>
                      MOST POPULAR
                    </div>
                  }
                  <div style={{ marginBottom: 24 }}>
                    <p style={{ ...mono, color: plan.highlight ? "rgba(255,255,255,0.5)" : T.muted, textTransform: "uppercase", marginBottom: 6 }}>{plan.name}</p>
                    <div className="flex items-baseline gap-1" style={{ marginBottom: 4 }}>
                      <span style={{ ...display, fontSize: "clamp(32px, 5vw, 42px)", letterSpacing: "-0.04em", color: plan.highlight ? "#fff" : T.ink }}>{plan.price}</span>
                      <span style={{ fontSize: 13, color: plan.highlight ? "rgba(255,255,255,0.5)" : T.muted }}>/{plan.period}</span>
                    </div>
                    <p style={{ fontSize: 13, color: plan.highlight ? "rgba(255,255,255,0.6)" : T.muted }}>{plan.desc}</p>
                  </div>
                  <ul style={{ listStyle: "none", padding: 0, margin: "0 0 28px", display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
                    {plan.features.map((f, j) =>
                      <li key={j} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: plan.highlight ? "rgba(255,255,255,0.85)" : T.body }}>
                        <div style={{ width: 16, height: 16, borderRadius: "50%", background: plan.highlight ? "rgba(255,255,255,0.15)" : T.surface, border: `1px solid ${plan.highlight ? "rgba(255,255,255,0.2)" : T.border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <Check style={{ width: 9, height: 9, color: plan.highlight ? "#fff" : T.ink }} />
                        </div>
                        {f}
                      </li>
                    )}
                  </ul>
                  <Link to="/auth" style={{ display: "block", textAlign: "center", fontWeight: 600, fontSize: 14, padding: "12px", borderRadius: 10, textDecoration: "none", background: plan.highlight ? "#fff" : T.ink, color: plan.highlight ? T.ink : "#fff", transition: "opacity 0.15s" }}
                    onMouseEnter={(e) => e.currentTarget.style.opacity = "0.85"}
                    onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}>
                    {plan.cta}
                  </Link>
                  {plan.highlight && <p style={{ fontSize: 11, textAlign: "center", color: "rgba(255,255,255,0.4)", marginTop: 10 }}>Cancel anytime · No hidden fees</p>}
                </div>
              </Reveal>
            )}
          </div>
        </div>
      </section>

      {/* ══ FINAL CTA ════════════════════════════════════════ */}
      <section style={{ background: T.surface, borderTop: `1px solid ${T.border}`, padding: "96px 0" }}>
        <div className="mx-auto text-center" style={{ maxWidth: 640, padding: "0 20px" }}>
          <Reveal>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: T.surface, border: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 28px" }}>
              <Heart style={{ width: 22, height: 22, fill: T.ink, color: T.ink }} />
            </div>
            <h2 style={{ ...display, fontSize: "clamp(28px, 5vw, 52px)", lineHeight: 1.06, marginBottom: 18 }}>
              Your love story deserves<br />
              <span style={{ color: T.muted }}>a home that lasts.</span>
            </h2>
            <p style={{ fontSize: "clamp(15px, 2vw, 17px)", lineHeight: 1.75, color: T.body, marginBottom: 36 }}>
              Join couples who trust OurVault with their most precious moments. Free to start, always private.
            </p>
            <div className="flex flex-wrap gap-3 justify-center items-center">
              <Link to="/auth" style={{ display: "inline-flex", alignItems: "center", gap: 8, fontWeight: 600, fontSize: 15, color: "#fff", background: T.ink, padding: "14px 32px", borderRadius: 12, textDecoration: "none", boxShadow: "0 2px 12px rgba(0,0,0,0.16)", transition: "opacity 0.15s" }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = "0.85"}
                onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}>
                Start for free today <ArrowRight style={{ width: 16, height: 16 }} />
              </Link>
              <span style={{ fontSize: 12, fontWeight: 500, color: T.muted, display: "flex", alignItems: "center", gap: 5 }}>
                <Shield style={{ width: 13, height: 13 }} /> No credit card · 100% private · Free forever tier
              </span>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ══ FOOTER ═══════════════════════════════════════════ */}
      <footer style={{ background: T.ink, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex flex-wrap items-center justify-between gap-4" style={{ maxWidth: 1120, margin: "0 auto", padding: "28px 20px" }}>
          <div className="flex items-center gap-2">
            <div style={{ width: 26, height: 26, borderRadius: 8, background: "rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Heart className="w-3 h-3 text-white fill-white" />
            </div>
            <span style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif", fontWeight: 600, fontSize: 15, color: "#fff" }}>OurVault</span>
          </div>
          <p className="text-center" style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>Made with 🖤 for couples everywhere · Always private · Always secure</p>
          <div className="flex gap-5" style={{ fontSize: 12, fontWeight: 500, color: "rgba(255,255,255,0.4)" }}>
            <Link to="/auth" style={{ color: "rgba(255,255,255,0.4)", textDecoration: "none", transition: "color 0.15s" }}
              onMouseEnter={(e) => e.currentTarget.style.color = "#fff"}
              onMouseLeave={(e) => e.currentTarget.style.color = "rgba(255,255,255,0.4)"}>Sign In</Link>
            <Link to="/auth" style={{ color: "rgba(255,255,255,0.4)", textDecoration: "none", transition: "color 0.15s" }}
              onMouseEnter={(e) => e.currentTarget.style.color = "#fff"}
              onMouseLeave={(e) => e.currentTarget.style.color = "rgba(255,255,255,0.4)"}>Get Started</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
