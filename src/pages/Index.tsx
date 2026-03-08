import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Heart, ArrowRight, Check, Lock, Shield, Star,
  Menu, X as XIcon, Camera, MessageCircle, Calendar,
  Sparkles, Image, Mic, Bell, Users, ChevronRight,
} from "lucide-react";

/* ── Tokens ─────────────────────────────────────────────── */
const T = {
  bg:      "#ffffff",
  bgWarm:  "#faf9f7",   // warm off-white for alternating sections
  bgHero:  "#f5f3ef",   // hero section warm cream
  dark:    "#111827",   // headlines
  body:    "#374151",   // body copy
  muted:   "#6b7280",   // helper / metadata
  border:  "#e5e7eb",
  accent:  "#059669",   // emerald — warm, couple-friendly
  accentL: "#ecfdf5",   // light accent bg
  accentD: "#047857",   // darker accent for hover
};

/* ── Scroll reveal ──────────────────────────────────────── */
function useInView(threshold = 0.08) {
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
function Reveal({ children, delay = 0, className = "" }: {
  children: React.ReactNode; delay?: number; className?: string;
}) {
  const { ref, vis } = useInView();
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${vis ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

/* ── Typography helpers ─────────────────────────────────── */
const displayFont: React.CSSProperties = {
  fontFamily: "'Space Grotesk', system-ui, sans-serif",
  fontWeight: 600,
  letterSpacing: "-0.025em",
};

/* ── Data ───────────────────────────────────────────────── */
const NAV_LINKS = [
  ["#features", "Features"],
  ["#how-it-works", "How it works"],
  ["#pricing", "Pricing"],
  ["#stories", "Stories"],
];

const FEATURE_CARDS = [
  { icon: Image,          title: "Memory Vault",      desc: "Upload photos & videos into a private, organised vault that only the two of you can access." },
  { icon: Lock,           title: "100% Private",      desc: "End-to-end private — no ads, no algorithm, no strangers. Your data is yours, forever." },
  { icon: MessageCircle,  title: "Private Chat",       desc: "Dedicated chat space for the two of you. Send voice notes, react with emojis, reply to threads." },
  { icon: Calendar,       title: "Milestone Timeline", desc: "Log every first — your first date, trip, anniversary — with reminders so nothing gets forgotten." },
  { icon: Mic,            title: "Voice Messages",     desc: "Say it out loud. Record and send voice messages that feel warmer than any text ever could." },
  { icon: Bell,           title: "Reminders",          desc: "Never miss an anniversary. Smart reminders for every milestone you've added to your timeline." },
];

const SHOWCASE = [
  {
    tag: "SHARED MEMORIES",
    title: "Every photo. Every memory. In one private place.",
    body: "Upload your photos and videos and organise them into folders. Build a beautiful private timeline that grows with your relationship — visible only to you and your partner.",
    bullets: ["Private folders & albums", "Love notes on every photo", "Star your all-time favourites", "Shared access for both partners"],
    visual: (
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden" style={{ border: `1px solid ${T.border}` }}>
        <div className="px-4 py-3 flex items-center gap-2" style={{ background: T.bgWarm, borderBottom: `1px solid ${T.border}` }}>
          <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: T.accent }}>
            <Heart className="w-3 h-3 text-white fill-white" />
          </div>
          <span className="text-xs font-semibold" style={{ color: T.dark }}>Our Memories</span>
          <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ background: T.accentL, color: T.accent }}>47 photos</span>
        </div>
        <div className="p-3">
          <div className="grid grid-cols-3 gap-1.5 mb-2.5">
            {["🌅","🎂","🌿","✈️","🍽️","💚"].map((e, i) => (
              <div key={i} className="rounded-xl aspect-square flex items-center justify-center text-2xl shadow-sm" style={{ background: i % 2 === 0 ? T.accentL : "#f9fafb" }}>{e}</div>
            ))}
          </div>
          <div className="flex gap-2">
            <div className="flex-1 rounded-xl px-3 py-2 text-[11px]" style={{ background: T.accentL, color: T.accent }}>Write a love note…</div>
            <button className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: T.accent }}>
              <Heart className="w-3.5 h-3.5 text-white fill-white" />
            </button>
          </div>
        </div>
      </div>
    ),
  },
  {
    tag: "PRIVATE CHAT",
    title: "Your own corner of the internet. No one else allowed.",
    body: "A dedicated messaging space for just the two of you. Send voice messages, react with emojis, reply to specific messages — and enjoy the peace of knowing no one else is watching.",
    bullets: ["Fully private — no third-party access", "Voice messages (Soulmate plan)", "Emoji reactions & reply threads", "Read receipts included"],
    visual: (
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden" style={{ border: `1px solid ${T.border}` }}>
        <div className="flex items-center gap-2.5 px-4 py-3" style={{ background: T.bgWarm, borderBottom: `1px solid ${T.border}` }}>
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-base" style={{ background: T.accentL }}>💚</div>
          <div>
            <p className="text-xs font-semibold" style={{ color: T.dark }}>Priya</p>
            <p className="text-[10px] font-medium" style={{ color: T.accent }}>● Online now</p>
          </div>
        </div>
        <div className="px-3 py-3 space-y-2" style={{ minHeight: 160 }}>
          {[
            { mine: false, msg: "Remember our first date? 🥹" },
            { mine: true,  msg: "How could I ever forget 😄" },
            { mine: false, msg: "I just uploaded the photos 💚" },
            { mine: true,  msg: "Adding love notes to each one 🌿" },
          ].map((m, i) => (
            <div key={i} className={`flex ${m.mine ? "justify-end" : "justify-start"}`}>
              <div className="max-w-[78%] px-3 py-2 rounded-2xl text-xs"
                style={m.mine
                  ? { background: T.accent, color: "#fff", borderBottomRightRadius: 4 }
                  : { background: "#f3f4f6", color: T.body, borderBottomLeftRadius: 4 }}>
                {m.msg}
              </div>
            </div>
          ))}
        </div>
        <div className="px-3 py-2.5 flex gap-2" style={{ borderTop: `1px solid ${T.border}` }}>
          <div className="flex-1 rounded-xl px-3 py-2 text-[11px]" style={{ background: T.accentL, color: T.accent }}>Type a message…</div>
          <button className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: T.accent }}>
            <ArrowRight className="w-3.5 h-3.5 text-white" />
          </button>
        </div>
      </div>
    ),
  },
  {
    tag: "LOVE TIMELINE",
    title: "Log every milestone. Relive every first.",
    body: "From your first date to your first anniversary and beyond — every milestone lives on a beautiful timeline. Set reminders so no special date ever slips by unnoticed.",
    bullets: ["Log custom milestone types", "Smart anniversary reminders", "Attach photos to any milestone", "Chronological timeline view"],
    visual: (
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden" style={{ border: `1px solid ${T.border}` }}>
        <div className="px-4 py-3 flex items-center gap-2" style={{ background: T.bgWarm, borderBottom: `1px solid ${T.border}` }}>
          <Calendar className="w-4 h-4" style={{ color: T.accent }} />
          <span className="text-xs font-semibold" style={{ color: T.dark }}>Love Timeline</span>
        </div>
        <div className="p-3 space-y-2">
          {[
            { emoji: "💑", label: "First Date",          date: "Dec 2, 2024",  active: false },
            { emoji: "💬", label: "First 'I Love You'",  date: "Jan 14, 2025", active: false },
            { emoji: "✈️", label: "Goa Trip together",  date: "Feb 14, 2025", active: true  },
            { emoji: "🎂", label: "1 Year Anniversary",  date: "Dec 2, 2025",  active: false },
          ].map((m, i) => (
            <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
              style={m.active
                ? { background: T.accentL, border: `1px solid ${T.accent}30` }
                : { background: "#f9fafb", border: `1px solid ${T.border}` }}>
              <span className="text-lg">{m.emoji}</span>
              <p className="flex-1 text-xs font-semibold" style={{ color: T.dark }}>{m.label}</p>
              <span className="text-[10px] font-medium" style={{ color: m.active ? T.accent : T.muted }}>{m.date}</span>
            </div>
          ))}
        </div>
      </div>
    ),
  },
];

const STEPS = [
  { n: "1", icon: Users,      title: "Create your account",     desc: "Sign up free in under a minute. No credit card, no commitment." },
  { n: "2", icon: Heart,      title: "Invite your partner",     desc: "Share a unique link. They join instantly and you're connected." },
  { n: "3", icon: Camera,     title: "Start building memories", desc: "Upload photos, chat, add milestones. Your story starts now." },
];

const TESTIMONIALS = [
  { quote: "We live in different cities. OurVault is the only place we feel genuinely close. The voice messages make it feel like they're right there.", name: "Priya & Arjun",  days: "487 days together",   initial: "PA" },
  { quote: "Every trip, every date night, every little note — it's all here. We open it every single morning with our coffee.",                         name: "Sneha & Rahul", days: "1,204 days together", initial: "SR" },
  { quote: "I wrote a love note on our first photo together. She cried. Best ₹9 I have ever spent in my entire life.",                                 name: "Rohan M.",      days: "Dating plan",         initial: "RM" },
];

const PLANS = [
  {
    name: "Free",     price: "₹0",  desc: "Start exploring together.",  cta: "Get started free", accent: false,
    features: ["50 uploads per month", "Shared memory vault", "Milestone calendar", "Private chat"],
  },
  {
    name: "Dating",   price: "₹9",  desc: "For couples who want more.",  cta: "Get Dating",       accent: true,
    features: ["200 uploads per month", "Everything in Free", "Emoji reactions", "Love notes on photos", "Activity feed"],
  },
  {
    name: "Soulmate", price: "₹99", desc: "Everything, no limits.",      cta: "Become Soulmates", accent: false,
    features: ["Unlimited uploads", "Everything in Dating", "Voice messages", "Slideshow mode", "Priority support"],
  },
];

/* ════════════════════ COMPONENT ════════════════════ */
export default function Index() {
  const [scrollY, setScrollY] = useState(0);
  const [menu, setMenu] = useState(false);

  useEffect(() => {
    const fn = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const navScrolled = scrollY > 24;

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: T.bg, color: T.dark, fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* ══════════════ NAV ══════════════ */}
      <header
        className="fixed top-0 inset-x-0 z-50 transition-all duration-300"
        style={{
          background: navScrolled ? "rgba(255,255,255,0.92)" : "transparent",
          backdropFilter: navScrolled ? "blur(16px)" : "none",
          borderBottom: navScrolled ? `1px solid ${T.border}` : "1px solid transparent",
        }}
      >
        <div className="max-w-6xl mx-auto px-6 md:px-10 h-16 flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: T.accent }}>
              <Heart className="w-4 h-4 text-white fill-white" />
            </div>
            <span className="text-[17px]" style={{ ...displayFont, color: T.dark }}>OurVault</span>
          </Link>

          <nav className="hidden md:flex items-center gap-7 flex-1 justify-center">
            {NAV_LINKS.map(([href, label]) => (
              <a key={href} href={href} className="text-sm font-medium transition-colors hover:text-gray-900" style={{ color: T.body }}>{label}</a>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-2 shrink-0">
            <Link to="/auth" className="text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors" style={{ color: T.body }}>Log in</Link>
            <Link to="/auth" className="text-sm font-semibold text-white px-5 py-2.5 rounded-xl hover:opacity-90 transition-all" style={{ background: T.accent }}>
              Sign up free →
            </Link>
          </div>

          <button onClick={() => setMenu(!menu)} className="md:hidden p-2 rounded-lg ml-auto hover:bg-gray-100">
            {menu ? <XIcon className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {menu && (
          <div className="md:hidden bg-white px-6 pb-6 flex flex-col gap-1 shadow-xl" style={{ borderTop: `1px solid ${T.border}` }}>
            {NAV_LINKS.map(([href, label]) => (
              <a key={href} href={href} onClick={() => setMenu(false)}
                className="text-sm font-medium py-3" style={{ color: T.body, borderBottom: `1px solid #f3f4f6` }}>{label}</a>
            ))}
            <Link to="/auth" onClick={() => setMenu(false)} className="mt-3 text-sm font-semibold text-white py-3.5 rounded-xl text-center" style={{ background: T.accent }}>
              Sign up free →
            </Link>
          </div>
        )}
      </header>

      {/* ══════════════ HERO ══════════════ */}
      {/*  Centered layout — inspired by Linear.app / Vercel  */}
      <section className="pt-16" style={{ background: T.bgHero }}>
        <div className="max-w-4xl mx-auto px-6 md:px-10 pt-20 pb-14 text-center">

          {/* Eyebrow pill */}
          <Reveal>
            <div className="inline-flex items-center gap-2 bg-white border px-4 py-1.5 rounded-full text-xs font-semibold mb-8 shadow-sm" style={{ color: T.muted, borderColor: T.border }}>
              <Sparkles className="w-3.5 h-3.5" style={{ color: T.accent }} />
              50,000+ couples already joined · 2M+ memories stored
            </div>
          </Reveal>

          {/* Headline */}
          <Reveal delay={60}>
            <h1
              style={{ ...displayFont, fontSize: "clamp(40px, 6.5vw, 72px)", lineHeight: 1.04, color: T.dark }}
              className="mb-6 mx-auto max-w-3xl"
            >
              The private space your
              love story{" "}
              <span style={{ color: T.accent }}>deserves.</span>
            </h1>
          </Reveal>

          {/* Sub-copy */}
          <Reveal delay={120}>
            <p className="text-lg md:text-xl leading-relaxed mb-9 max-w-xl mx-auto" style={{ color: T.body, lineHeight: 1.7 }}>
              Store memories, chat privately, send voice messages, and celebrate every milestone together — just the two of you.
            </p>
          </Reveal>

          {/* CTAs */}
          <Reveal delay={180}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-9">
              <Link to="/auth"
                className="inline-flex items-center gap-2 font-semibold text-white px-8 py-3.5 rounded-xl hover:opacity-90 transition-all hover:scale-[1.02] shadow-lg text-base"
                style={{ background: T.accent }}>
                Start for free
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a href="#features"
                className="inline-flex items-center gap-2 font-medium px-8 py-3.5 rounded-xl border text-base hover:bg-white transition-all"
                style={{ color: T.body, borderColor: "#d1d5db" }}>
                See how it works
              </a>
            </div>
          </Reveal>

          {/* Trust row */}
          <Reveal delay={220}>
            <div className="flex flex-wrap items-center justify-center gap-6 text-xs font-medium" style={{ color: T.muted }}>
              <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5" style={{ color: T.accent }} /> No credit card required</span>
              <span className="flex items-center gap-1.5"><Lock className="w-3.5 h-3.5" style={{ color: T.accent }} /> Fully private — always</span>
              <span className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5" style={{ color: T.accent }} /> Secure storage</span>
              <span className="flex items-center gap-1.5"><Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" /> 4.9 / 5 rating</span>
            </div>
          </Reveal>
        </div>

        {/* App mockup — Linkrunner style, browser frame centered */}
        <Reveal delay={280} className="max-w-5xl mx-auto px-6 md:px-10 pb-0">
          <div className="rounded-t-2xl overflow-hidden shadow-2xl border-x border-t" style={{ borderColor: T.border }}>
            {/* Browser chrome */}
            <div className="flex items-center gap-2 px-5 py-3" style={{ background: "#f3f4f6", borderBottom: `1px solid ${T.border}` }}>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
              </div>
              <div className="flex-1 max-w-xs mx-auto bg-white rounded-md px-3 py-1.5 text-[11px] text-gray-400 text-center" style={{ border: `1px solid ${T.border}` }}>
                app.ourvault.in/memories
              </div>
            </div>
            {/* App interior */}
            <div className="grid grid-cols-4 bg-white" style={{ minHeight: 320 }}>
              {/* Sidebar */}
              <div className="col-span-1 border-r p-4 flex flex-col gap-1" style={{ background: "#fafafa", borderColor: T.border }}>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: T.accent }}>
                    <Heart className="w-3 h-3 text-white fill-white" />
                  </div>
                  <span className="text-xs font-semibold" style={{ color: T.dark }}>OurVault</span>
                </div>
                {["Memories","Chat","Milestones","Notes","Settings"].map((item, i) => (
                  <div key={i}
                    className="text-[11px] px-2.5 py-1.5 rounded-lg font-medium"
                    style={i === 0 ? { background: T.accent, color: "#fff" } : { color: T.muted }}>
                    {item}
                  </div>
                ))}
                <div className="mt-auto pt-4">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-xs">💑</div>
                    <div>
                      <p className="text-[9px] font-semibold" style={{ color: T.dark }}>You & Priya</p>
                      <p className="text-[8px]" style={{ color: T.accent }}>● Online</p>
                    </div>
                  </div>
                </div>
              </div>
              {/* Content area */}
              <div className="col-span-3 p-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-semibold" style={{ color: T.dark }}>Our Memories</h3>
                    <p className="text-[11px]" style={{ color: T.muted }}>47 photos · last added 2h ago</p>
                  </div>
                  <div className="text-[10px] px-3 py-1 rounded-full font-semibold" style={{ background: T.accentL, color: T.accent }}>+ Add memory</div>
                </div>
                <div className="grid grid-cols-4 gap-2 mb-4">
                  {[
                    { bg: T.accentL, e: "🌅", l: "Goa Trip" },
                    { bg: "#fff7ed", e: "🎂", l: "Birthday" },
                    { bg: "#f0fdf4", e: "🌿", l: "Forest Walk" },
                    { bg: "#fef9c3", e: "✈️", l: "Mumbai Trip" },
                    { bg: "#fdf2f8", e: "🍽️", l: "Date Night" },
                    { bg: T.accentL, e: "💚", l: "1 Year!" },
                    { bg: "#fff7ed", e: "🌊", l: "Beach Day" },
                    { bg: "#f0fdf4", e: "☕", l: "Morning Cafe" },
                  ].map((t, i) => (
                    <div key={i} className="rounded-xl aspect-square flex flex-col items-center justify-center gap-0.5 shadow-sm" style={{ background: t.bg }}>
                      <span className="text-base md:text-xl">{t.e}</span>
                      <span className="text-[7px] md:text-[9px] font-medium" style={{ color: T.muted }}>{t.l}</span>
                    </div>
                  ))}
                </div>
                {/* Bottom bar */}
                <div className="flex items-center gap-2 p-2 rounded-xl" style={{ background: "#f9fafb", border: `1px solid ${T.border}` }}>
                  <div className="flex-1 text-[11px]" style={{ color: T.muted }}>Write a love note on this memory…</div>
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: T.accent }}>
                    <Heart className="w-3.5 h-3.5 text-white fill-white" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ══════════════ STATS STRIP ══════════════ */}
      <Reveal>
        <div className="py-10" style={{ background: T.bg, borderBottom: `1px solid ${T.border}` }}>
          <div className="max-w-5xl mx-auto px-6 md:px-10 grid grid-cols-2 md:grid-cols-4 divide-x" style={{ borderColor: T.border }}>
            {[
              { val: "50,000+", label: "Couples using OurVault" },
              { val: "2M+",     label: "Memories safely stored" },
              { val: "4.9 ★",   label: "Average app rating" },
              { val: "100%",    label: "Private, always" },
            ].map((s, i) => (
              <div key={i} className="text-center px-4 md:px-8 py-2">
                <div className="text-2xl md:text-3xl font-semibold mb-0.5" style={{ ...displayFont, color: T.dark }}>{s.val}</div>
                <div className="text-xs font-medium" style={{ color: T.muted }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </Reveal>

      {/* ══════════════ FEATURE GRID ══════════════ */}
      <section id="features" className="py-24" style={{ background: T.bgWarm }}>
        <div className="max-w-6xl mx-auto px-6 md:px-10">
          <Reveal className="max-w-2xl mb-14">
            <p className="text-[11px] font-extrabold tracking-[0.14em] uppercase mb-4" style={{ color: T.accent }}>THE FULL PICTURE</p>
            <h2 style={{ ...displayFont, fontSize: "clamp(28px, 3.5vw, 44px)", lineHeight: 1.1, color: T.dark }} className="mb-4">
              Everything a couple needs.<br />Nothing they don't.
            </h2>
            <p className="text-base leading-[1.75]" style={{ color: T.body }}>Built around intimacy, privacy, and the rhythm of a real relationship — not a social network.</p>
          </Reveal>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px" style={{ background: T.border }}>
            {FEATURE_CARDS.map((f, i) => {
              const Icon = f.icon;
              return (
                <Reveal key={i} delay={i * 50} className="p-8 flex flex-col gap-4 bg-white">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: T.accentL }}>
                    <Icon className="w-5 h-5" style={{ color: T.accent }} strokeWidth={1.75} />
                  </div>
                  <div>
                    <h3 className="text-[15px] font-bold mb-1.5" style={{ color: T.dark }}>{f.title}</h3>
                    <p className="text-[13.5px] leading-[1.7]" style={{ color: T.body }}>{f.desc}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══════════════ FEATURE SHOWCASES — alternating ══════════════ */}
      <section className="py-8" style={{ background: T.bg }}>
        {SHOWCASE.map((s, i) => (
          <div key={i} className="py-16 md:py-24" style={{ borderBottom: i < SHOWCASE.length - 1 ? `1px solid ${T.border}` : "none" }}>
            <div className="max-w-6xl mx-auto px-6 md:px-10">
              <div className={`grid lg:grid-cols-2 gap-16 items-center ${i % 2 === 1 ? "lg:[&>*:first-child]:order-2" : ""}`}>
                {/* Text */}
                <Reveal delay={50}>
                  <p className="text-[11px] font-extrabold tracking-[0.14em] uppercase mb-5" style={{ color: T.accent }}>{s.tag}</p>
                  <h2 style={{ ...displayFont, fontSize: "clamp(24px, 3vw, 38px)", lineHeight: 1.12, color: T.dark }} className="mb-5">
                    {s.title}
                  </h2>
                  <p className="text-[15px] leading-[1.8] mb-7" style={{ color: T.body }}>{s.body}</p>
                  <ul className="space-y-3 mb-8">
                    {s.bullets.map((b, j) => (
                      <li key={j} className="flex items-start gap-3 text-[14px] font-medium" style={{ color: T.dark }}>
                        <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ background: T.accentL }}>
                          <Check className="w-2.5 h-2.5" style={{ color: T.accent }} />
                        </div>
                        {b}
                      </li>
                    ))}
                  </ul>
                  <Link to="/auth" className="inline-flex items-center gap-1.5 text-sm font-bold hover:underline underline-offset-4" style={{ color: T.accent }}>
                    Get started free <ChevronRight className="w-4 h-4" />
                  </Link>
                </Reveal>
                {/* Visual */}
                <Reveal delay={150} className="flex justify-center">
                  <div className="w-full max-w-[340px]">{s.visual}</div>
                </Reveal>
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* ══════════════ HOW IT WORKS ══════════════ */}
      <section id="how-it-works" className="py-24" style={{ background: T.bgWarm, borderTop: `1px solid ${T.border}`, borderBottom: `1px solid ${T.border}` }}>
        <div className="max-w-5xl mx-auto px-6 md:px-10">
          <Reveal className="text-center mb-16 max-w-xl mx-auto">
            <p className="text-[11px] font-extrabold tracking-[0.14em] uppercase mb-4" style={{ color: T.accent }}>QUICK START</p>
            <h2 style={{ ...displayFont, fontSize: "clamp(28px, 3.5vw, 44px)", lineHeight: 1.1, color: T.dark }} className="mb-4">
              Ready in under a minute.
            </h2>
            <p className="text-[16px] leading-[1.75]" style={{ color: T.body }}>No tutorial needed. Just sign up and start creating memories together.</p>
          </Reveal>

          <div className="grid md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-9 left-[calc(16.67%+36px)] right-[calc(16.67%+36px)] h-px" style={{ background: `linear-gradient(to right, ${T.accent}30, ${T.accent}70, ${T.accent}30)` }} />
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              return (
                <Reveal key={i} delay={i * 100} className="text-center">
                  <div className="relative inline-flex mb-6">
                    <div className="w-[72px] h-[72px] rounded-2xl bg-white flex items-center justify-center shadow-sm" style={{ border: `1px solid ${T.border}` }}>
                      <Icon className="w-8 h-8" style={{ color: T.accent }} strokeWidth={1.5} />
                    </div>
                    <span className="absolute -top-2.5 -right-2.5 w-6 h-6 rounded-full text-white text-[10px] font-extrabold flex items-center justify-center" style={{ background: T.dark }}>{s.n}</span>
                  </div>
                  <h3 className="font-bold text-[15px] mb-2" style={{ color: T.dark }}>{s.title}</h3>
                  <p className="text-sm leading-[1.7]" style={{ color: T.body }}>{s.desc}</p>
                </Reveal>
              );
            })}
          </div>

          <Reveal className="text-center mt-14">
            <Link to="/auth" className="inline-flex items-center gap-2 font-bold text-white px-8 py-3.5 rounded-xl hover:opacity-90 transition-all shadow-md text-sm" style={{ background: T.accent }}>
              Create your vault free <ArrowRight className="w-4 h-4" />
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ══════════════ TESTIMONIALS ══════════════ */}
      <section id="stories" className="py-24" style={{ background: T.bg }}>
        <div className="max-w-6xl mx-auto px-6 md:px-10">
          <Reveal className="mb-14 max-w-xl">
            <p className="text-[11px] font-extrabold tracking-[0.14em] uppercase mb-4" style={{ color: T.accent }}>REAL COUPLES</p>
            <h2 style={{ ...displayFont, fontSize: "clamp(28px, 3.5vw, 44px)", lineHeight: 1.1, color: T.dark }}>
              Loved by couples<br />
              <span style={{ color: T.accent }}>all over India.</span>
            </h2>
          </Reveal>

          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <Reveal key={i} delay={i * 80}>
                <div
                  className="bg-white rounded-2xl p-7 flex flex-col gap-5 h-full hover:-translate-y-1 transition-all duration-300"
                  style={{ border: `1px solid ${T.border}`, boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <Star key={j} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-[14.5px] leading-[1.8] flex-1" style={{ color: T.body }}>"{t.quote}"</p>
                  <div className="flex items-center gap-3 pt-4" style={{ borderTop: `1px solid ${T.border}` }}>
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0" style={{ background: T.accent }}>
                      {t.initial}
                    </div>
                    <div>
                      <p className="text-sm font-bold" style={{ color: T.dark }}>{t.name}</p>
                      <p className="text-[12px]" style={{ color: T.muted }}>{t.days}</p>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════ PRICING ══════════════ */}
      <section id="pricing" className="py-24" style={{ background: T.bgWarm, borderTop: `1px solid ${T.border}` }}>
        <div className="max-w-5xl mx-auto px-6 md:px-10">
          <Reveal className="text-center mb-14 max-w-xl mx-auto">
            <p className="text-[11px] font-extrabold tracking-[0.14em] uppercase mb-4" style={{ color: T.accent }}>PRICING</p>
            <h2 style={{ ...displayFont, fontSize: "clamp(28px, 3.5vw, 44px)", lineHeight: 1.1, color: T.dark }} className="mb-4">
              Simple, honest pricing.
            </h2>
            <p className="text-[16px] leading-[1.75]" style={{ color: T.body }}>Start completely free. Upgrade only when you want more.</p>
          </Reveal>

          <div className="grid md:grid-cols-3 gap-5 items-start">
            {PLANS.map((plan, i) => (
              <Reveal key={i} delay={i * 80}>
                <div
                  className="relative bg-white rounded-2xl p-8 flex flex-col transition-all"
                  style={plan.accent
                    ? { border: `2px solid ${T.accent}`, transform: "scale(1.03)", boxShadow: `0 12px 48px ${T.accent}1a` }
                    : { border: `1px solid ${T.border}` }}>
                  {plan.accent && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-white text-[11px] font-extrabold px-4 py-1 rounded-full whitespace-nowrap" style={{ background: T.accent }}>
                      Most popular
                    </div>
                  )}
                  <div className="mb-6">
                    <p className="text-[11px] font-extrabold uppercase tracking-widest mb-1" style={{ color: T.muted }}>{plan.name}</p>
                    <div className="flex items-baseline gap-1 mb-1">
                      <span style={{ ...displayFont, fontSize: 42, letterSpacing: "-0.03em", color: T.dark }}>{plan.price}</span>
                      <span className="text-sm" style={{ color: T.muted }}>/month</span>
                    </div>
                    <p className="text-[13px]" style={{ color: T.muted }}>{plan.desc}</p>
                  </div>
                  <ul className="space-y-3 mb-8 flex-1">
                    {plan.features.map((f, j) => (
                      <li key={j} className="flex items-center gap-2.5 text-[13.5px]" style={{ color: T.body }}>
                        <div className="w-4 h-4 rounded-full flex items-center justify-center shrink-0" style={{ background: T.accentL }}>
                          <Check className="w-2.5 h-2.5" style={{ color: T.accent }} />
                        </div>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link
                    to="/auth"
                    className="w-full py-3 rounded-xl font-bold text-[14px] text-center block text-white hover:opacity-90 transition-all"
                    style={{ background: plan.accent ? T.accent : T.dark }}>
                    {plan.cta}
                  </Link>
                  {plan.accent && <p className="text-[11px] text-center mt-3" style={{ color: T.muted }}>Cancel anytime · No hidden fees</p>}
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════ FINAL CTA ══════════════ */}
      <section className="py-32" style={{ background: T.dark }}>
        <div className="max-w-3xl mx-auto px-6 md:px-10 text-center">
          <Reveal>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-8" style={{ background: `${T.accent}20` }}>
              <Heart className="w-6 h-6 fill-current" style={{ color: T.accent }} />
            </div>
            <h2 style={{ ...displayFont, fontSize: "clamp(32px, 5vw, 56px)", lineHeight: 1.08, color: "#fff" }} className="mb-5">
              Your love story deserves<br />
              <span style={{ color: T.accent }}>a home that lasts.</span>
            </h2>
            <p className="text-lg leading-[1.75] mb-10 max-w-xl mx-auto" style={{ color: "#9ca3af" }}>
              Join 50,000+ couples who trust OurVault with their most precious moments. Free to start, always private.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link to="/auth"
                className="inline-flex items-center gap-2 font-bold text-white px-9 py-4 rounded-xl hover:opacity-90 transition-all text-base shadow-xl"
                style={{ background: T.accent }}>
                Start for free today <ArrowRight className="w-4 h-4" />
              </Link>
              <span className="text-xs font-medium flex items-center gap-1.5" style={{ color: "#6b7280" }}>
                <Shield className="w-3.5 h-3.5" style={{ color: T.accent }} /> No credit card · 100% private · Free forever tier
              </span>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ══════════════ FOOTER ══════════════ */}
      <footer style={{ background: T.dark, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="max-w-6xl mx-auto px-6 md:px-10 py-10 flex flex-col md:flex-row items-center justify-between gap-5">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: T.accent }}>
              <Heart className="w-3.5 h-3.5 text-white fill-white" />
            </div>
            <span className="font-extrabold text-base text-white" style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif" }}>OurVault</span>
          </div>
          <p className="text-xs text-center" style={{ color: "#6b7280" }}>Made with 💚 for couples everywhere · Always private · Always secure</p>
          <div className="flex items-center gap-6 text-xs font-medium" style={{ color: "#6b7280" }}>
            <Link to="/auth" className="hover:text-white transition-colors">Sign In</Link>
            <span style={{ color: "#374151" }}>|</span>
            <Link to="/auth" className="hover:text-white transition-colors">Get Started</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
