import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Heart, ArrowRight, Check, Sparkles, CalendarHeart,
  UserRoundCheck, HeartHandshake, ImagePlay, ShieldCheck,
  Star, Menu, X as XIcon, ChevronRight, Camera,
  MessageCircle, Calendar, Lock, Zap, Gift
} from "lucide-react";

/* ─── Palette ─── */
const G = "#0a7c59";      // green accent
const DARK = "#0d0d0d";   // near-black headlines
const BODY = "#4b5563";   // body text
const MUTED = "#9ca3af";  // secondary/muted
const BORDER = "#e5e7eb"; // gray-200

/* ─── Scroll reveal ─── */
function useInView(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}
function Reveal({ children, delay = 0, className = "" }: {
  children: React.ReactNode; delay?: number; className?: string;
}) {
  const { ref, visible } = useInView();
  return (
    <div ref={ref} className={`transition-all duration-700 ease-out ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

/* ─── App mockup card ─── */
function AppCard() {
  return (
    <div className="w-full max-w-[580px] mx-auto rounded-2xl overflow-hidden shadow-2xl" style={{ border: `1px solid ${BORDER}` }}>
      {/* Window chrome */}
      <div className="flex items-center gap-2 px-4 py-3 bg-gray-50" style={{ borderBottom: `1px solid ${BORDER}` }}>
        <div className="w-3 h-3 rounded-full bg-red-400" />
        <div className="w-3 h-3 rounded-full bg-yellow-400" />
        <div className="w-3 h-3 rounded-full bg-green-400" />
        <div className="flex-1 mx-3 bg-white rounded-md px-3 py-1 text-[11px] text-gray-400" style={{ border: `1px solid ${BORDER}` }}>
          app.ourvault.in/memories
        </div>
      </div>
      {/* App UI */}
      <div className="grid grid-cols-3 bg-white" style={{ minHeight: 280 }}>
        {/* Sidebar */}
        <div className="col-span-1 bg-gray-50 p-3 flex flex-col gap-1" style={{ borderRight: `1px solid ${BORDER}` }}>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: G }}>
              <Heart className="w-3 h-3 text-white fill-white" />
            </div>
            <span className="text-xs font-bold text-gray-800">OurVault</span>
          </div>
          {["Memories", "Chat", "Milestones", "Notes"].map((item, i) => (
            <div key={i} className={`text-[11px] px-2.5 py-1.5 rounded-lg font-medium cursor-pointer ${i === 0 ? "text-white" : "text-gray-500"}`}
              style={i === 0 ? { background: G } : {}}>
              {item}
            </div>
          ))}
        </div>
        {/* Main */}
        <div className="col-span-2 p-3 bg-white">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold text-gray-800">Our Memories</p>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ background: "#f0fdf4", color: G }}>47 photos</span>
          </div>
          <div className="grid grid-cols-3 gap-1.5 mb-3">
            {[
              { bg: "#f0fdf4", e: "🌅" }, { bg: "#ecfdf5", e: "🎂" },
              { bg: "#f0fdf4", e: "✈️" }, { bg: "#ecfdf5", e: "🌿" },
              { bg: "#f0fdf4", e: "🍽️" }, { bg: "#ecfdf5", e: "💚" },
            ].map((t, i) => (
              <div key={i} className="rounded-xl aspect-square flex items-center justify-center text-lg shadow-sm" style={{ background: t.bg }}>{t.e}</div>
            ))}
          </div>
          {/* Chat preview */}
          <div className="space-y-1.5 pt-2" style={{ borderTop: `1px solid ${BORDER}` }}>
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-xl px-2.5 py-1.5 text-[10px] text-gray-600">Remember our first date? 🥹</div>
            </div>
            <div className="flex justify-end">
              <div className="rounded-xl px-2.5 py-1.5 text-[10px] text-white" style={{ background: G }}>How could I forget! 😄</div>
            </div>
          </div>
        </div>
      </div>
      {/* Bottom status bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 text-[10px] font-medium" style={{ borderTop: `1px solid ${BORDER}` }}>
        <span className="flex items-center gap-1.5" style={{ color: G }}>
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" /> Priya is online
        </span>
        <span className="text-gray-400">487 days together 💚</span>
      </div>
    </div>
  );
}

/* ─── Feature mockups ─── */
const FEATURE_MOCKUP_VAULT = (
  <div className="bg-white rounded-2xl shadow-xl overflow-hidden" style={{ border: `1px solid ${BORDER}` }}>
    <div className="px-4 py-3 flex items-center gap-2 bg-gray-50" style={{ borderBottom: `1px solid ${BORDER}` }}>
      <Camera className="w-4 h-4" style={{ color: G }} />
      <span className="text-xs font-semibold text-gray-700">Memory Vault</span>
      <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ background: "#f0fdf4", color: G }}>47 photos</span>
    </div>
    <div className="p-3 grid grid-cols-3 gap-2">
      {[
        { bg: "#f0fdf4", emoji: "🌅", label: "Goa" },
        { bg: "#ecfdf5", emoji: "🎂", label: "Birthday" },
        { bg: "#f0fdf4", emoji: "🌿", label: "Forest" },
        { bg: "#ecfdf5", emoji: "✈️", label: "Mumbai" },
        { bg: "#f0fdf4", emoji: "🍽️", label: "Dinner" },
        { bg: "#ecfdf5", emoji: "💚", label: "1 Year" },
      ].map((t, i) => (
        <div key={i} className="rounded-xl aspect-square flex flex-col items-center justify-center gap-0.5 shadow-sm" style={{ background: t.bg }}>
          <span className="text-xl">{t.emoji}</span>
          <span className="text-[9px] font-medium text-gray-500">{t.label}</span>
        </div>
      ))}
    </div>
    <div className="px-3 pb-3 flex gap-2">
      <div className="flex-1 rounded-xl px-3 py-2 text-[11px]" style={{ background: "#f0fdf4", color: G }}>Add a love note…</div>
      <button className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: G }}>
        <Heart className="w-3.5 h-3.5 text-white fill-white" />
      </button>
    </div>
  </div>
);

const FEATURE_MOCKUP_CHAT = (
  <div className="bg-white rounded-2xl shadow-xl overflow-hidden" style={{ border: `1px solid ${BORDER}` }}>
    <div className="flex items-center gap-2 px-4 py-3 bg-gray-50" style={{ borderBottom: `1px solid ${BORDER}` }}>
      <div className="w-8 h-8 rounded-full flex items-center justify-center text-base" style={{ background: "#f0fdf4" }}>💚</div>
      <div><p className="text-xs font-semibold text-gray-800">Priya</p><p className="text-[10px] font-medium" style={{ color: G }}>● Online</p></div>
    </div>
    <div className="px-3 py-3 space-y-2 min-h-[160px]">
      {[
        { mine: false, msg: "Remember our first date? 🥹" },
        { mine: true, msg: "How could I forget! 😄" },
        { mine: false, msg: "I uploaded our photos 💚" },
        { mine: true, msg: "Adding love notes now 🌿" },
      ].map((m, i) => (
        <div key={i} className={`flex ${m.mine ? "justify-end" : "justify-start"}`}>
          <div className="max-w-[78%] px-3 py-2 rounded-2xl text-xs"
            style={m.mine ? { background: G, color: "#fff", borderBottomRightRadius: 4 } : { background: "#f3f4f6", color: "#374151", borderBottomLeftRadius: 4 }}>
            {m.msg}
          </div>
        </div>
      ))}
    </div>
    <div className="px-3 py-2.5 flex gap-2" style={{ borderTop: `1px solid ${BORDER}` }}>
      <div className="flex-1 rounded-xl px-3 py-2 text-[11px]" style={{ background: "#f0fdf4", color: G }}>Type a message…</div>
      <button className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: G }}>
        <ArrowRight className="w-3.5 h-3.5 text-white" />
      </button>
    </div>
  </div>
);

const FEATURE_MOCKUP_MILESTONES = (
  <div className="bg-white rounded-2xl shadow-xl overflow-hidden" style={{ border: `1px solid ${BORDER}` }}>
    <div className="px-4 py-3 flex items-center gap-2 bg-gray-50" style={{ borderBottom: `1px solid ${BORDER}` }}>
      <CalendarHeart className="w-4 h-4" style={{ color: G }} />
      <span className="text-xs font-semibold text-gray-700">Love Timeline</span>
    </div>
    <div className="p-3 space-y-2">
      {[
        { emoji: "💑", label: "First Date", date: "Dec 2, 2024" },
        { emoji: "💬", label: "First 'I Love You'", date: "Jan 14, 2025" },
        { emoji: "✈️", label: "Goa Trip together", date: "Feb 14, 2025" },
        { emoji: "🎂", label: "1 Year Anniversary", date: "Dec 2, 2025" },
      ].map((m, i) => (
        <div key={i} className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl" style={{ background: "#f9fafb", border: `1px solid ${BORDER}` }}>
          <span className="text-lg">{m.emoji}</span>
          <p className="flex-1 text-xs font-semibold text-gray-800">{m.label}</p>
          <span className="text-[10px]" style={{ color: MUTED }}>{m.date}</span>
        </div>
      ))}
    </div>
  </div>
);

/* ─── Feature tabs ─── */
const FEATURES = [
  { id: "vault", tab: "Memory Vault", icon: Camera, tag: "SHARED MEMORIES",
    heading: "Store every beautiful moment together",
    desc: "Upload photos and videos, organise them into private folders, and build a timeline that's just yours. No algorithm, no strangers — only the two of you.",
    bullets: ["Private folders & albums", "Star your favourites", "Love notes on every photo", "Shared access for both partners"],
    mockup: FEATURE_MOCKUP_VAULT },
  { id: "chat", tab: "Private Chat", icon: MessageCircle, tag: "JUST THE TWO OF YOU",
    heading: "A private space only you two can see",
    desc: "Chat freely with no one watching. Send voice messages, react with emojis, reply to threads — your very own corner of the internet.",
    bullets: ["End-to-end private messages", "Voice messages", "Emoji reactions", "Reply threads & read receipts"],
    mockup: FEATURE_MOCKUP_CHAT },
  { id: "milestones", tab: "Milestones", icon: Calendar, tag: "YOUR LOVE TIMELINE",
    heading: "Never forget a special date again",
    desc: "Log your first date, first trip, first kiss — every milestone lives on your personal love timeline, with reminders so no anniversary slips by.",
    bullets: ["Custom milestone types", "Anniversary reminders", "Attach photos to dates", "Beautiful timeline view"],
    mockup: FEATURE_MOCKUP_MILESTONES },
];

const PLANS = [
  { name: "Free", price: "₹0", period: "/month", cta: "Get started free", popular: false,
    features: ["50 uploads/month", "Shared memory vault", "Milestone calendar", "Private chat"] },
  { name: "Dating", price: "₹9", period: "/month", cta: "Get Dating", popular: true,
    features: ["200 uploads/month", "Everything in Free", "Emoji reactions", "Love notes", "Activity feed"] },
  { name: "Soulmate", price: "₹99", period: "/month", cta: "Become Soulmates", popular: false,
    features: ["Unlimited uploads", "Everything in Dating", "Voice messages", "Slideshow mode", "Priority support"] },
];

const TESTIMONIALS = [
  { quote: "We live in different cities. OurVault is the only app where we actually feel close. The voice messages are magical.", name: "Priya & Arjun", days: "487 days together", avatar: "💑" },
  { quote: "Every trip, every date, every note in one beautiful private place. We check it every single day.", name: "Sneha & Rahul", days: "1,204 days together", avatar: "🌿" },
  { quote: "I added a love note to our first photo and she cried happy tears. Best ₹9 I've ever spent.", name: "Rohan", days: "Dating plan", avatar: "💚" },
];

const STEPS = [
  { n: "01", icon: UserRoundCheck, label: "Create your account", desc: "Sign up free in under a minute. No credit card needed." },
  { n: "02", icon: HeartHandshake, label: "Invite your partner", desc: "Share a unique link. They join and you're connected." },
  { n: "03", icon: ImagePlay, label: "Build memories together", desc: "Upload photos, chat, add milestones. Your love story starts." },
];

/* ════ COMPONENT ════ */
export default function Index() {
  const [scrollY, setScrollY] = useState(0);
  const [menu, setMenu] = useState(false);
  const [tab, setTab] = useState(0);

  useEffect(() => {
    const fn = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const feat = FEATURES[tab];

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans overflow-x-hidden" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* ══ NAV ══ */}
      <header className="fixed top-0 inset-x-0 z-50 bg-white transition-shadow duration-300" style={{ borderBottom: `1px solid ${scrollY > 20 ? BORDER : "transparent"}`, boxShadow: scrollY > 20 ? "0 1px 12px rgba(0,0,0,0.05)" : "none" }}>
        <div className="max-w-6xl mx-auto px-6 md:px-10 h-[68px] flex items-center gap-8">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center shadow-sm" style={{ background: G }}>
              <Heart className="w-4 h-4 text-white fill-white" />
            </div>
            <span className="font-extrabold text-[17px] tracking-tight" style={{ color: DARK, fontFamily: "'Space Grotesk', system-ui, sans-serif" }}>OurVault</span>
          </Link>

          {/* Links */}
          <nav className="hidden md:flex items-center gap-7 flex-1 justify-center">
            {[["#features", "Features"], ["#how-it-works", "How it works"], ["#pricing", "Pricing"], ["#stories", "Stories"]].map(([href, label]) => (
              <a key={href} href={href} className="text-[14px] font-medium transition-colors hover:text-gray-900" style={{ color: BODY }}>{label}</a>
            ))}
          </nav>

          {/* CTAs */}
          <div className="hidden md:flex items-center gap-2 shrink-0">
            <Link to="/auth" className="text-[14px] font-semibold px-4 py-2 rounded-lg transition-colors hover:bg-gray-100" style={{ color: BODY }}>Log in</Link>
            <Link to="/auth" className="text-[14px] font-bold text-white px-5 py-2.5 rounded-xl hover:opacity-90 transition-all shadow-sm" style={{ background: DARK }}>
              Sign up free
            </Link>
          </div>

          <button onClick={() => setMenu(!menu)} className="md:hidden p-2 rounded-lg ml-auto hover:bg-gray-100">
            {menu ? <XIcon className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {menu && (
          <div className="md:hidden bg-white px-6 pb-5 flex flex-col gap-1 shadow-lg" style={{ borderTop: `1px solid ${BORDER}` }}>
            {[["features", "Features"], ["how-it-works", "How it works"], ["pricing", "Pricing"], ["stories", "Stories"]].map(([id, label]) => (
              <a key={id} href={`#${id}`} onClick={() => setMenu(false)}
                className="text-[14px] font-medium py-3 border-b" style={{ color: BODY, borderColor: "#f3f4f6" }}>{label}</a>
            ))}
            <Link to="/auth" onClick={() => setMenu(false)} className="mt-3 text-[14px] font-bold text-white py-3 rounded-xl text-center" style={{ background: DARK }}>Sign up free</Link>
          </div>
        )}
      </header>

      {/* ══ HERO — MoEngage: warm off-white bg, large bold type, visual grid right ══ */}
      <section className="pt-[68px]" style={{ background: "#f8f5ef" }}>
        <div className="max-w-6xl mx-auto px-6 md:px-10 pt-16 pb-0">
          <div className="grid lg:grid-cols-[1fr_1.1fr] gap-16 items-end">

            {/* Left */}
            <div className="pb-16 lg:pb-20">
              {/* Label badge */}
              <div className="inline-flex items-center gap-2 bg-white border px-3.5 py-1.5 rounded-full text-[12px] font-semibold text-gray-600 mb-8 shadow-sm" style={{ borderColor: BORDER }}>
                <Sparkles className="w-3.5 h-3.5" style={{ color: G }} />
                50,000+ couples already joined
              </div>

              {/* Headline — MoEngage style: very large, bold, multi-line */}
              <h1 style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif", fontSize: "clamp(38px, 5.5vw, 62px)", fontWeight: 800, lineHeight: 1.06, letterSpacing: "-0.02em", color: DARK }}
                className="mb-6">
                Build Stronger<br />
                Memories With<br />
                <span style={{ color: G }}>Your Partner.</span>
              </h1>

              <p className="text-[17px] leading-[1.7] mb-9 max-w-[420px]" style={{ color: BODY }}>
                A private vault for couples — store photos, chat, send voice messages and celebrate every milestone. Just the two of you, forever.
              </p>

              {/* CTAs — Linkrunner style: two buttons side by side */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-10">
                <Link to="/auth" className="inline-flex items-center gap-2.5 font-bold text-white px-7 py-3.5 rounded-xl hover:opacity-90 transition-all hover:scale-[1.02] shadow-md text-[15px]" style={{ background: DARK }}>
                  Start for free <ArrowRight className="w-4 h-4" />
                </Link>
                <Link to="/auth" className="inline-flex items-center gap-2.5 font-semibold px-7 py-3.5 rounded-xl border text-[15px] hover:bg-gray-100 transition-colors" style={{ color: DARK, borderColor: "#d1d5db" }}>
                  See a demo
                </Link>
              </div>

              {/* Trust signals */}
              <div className="flex flex-wrap items-center gap-6 text-[13px] font-medium" style={{ color: MUTED }}>
                <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5" style={{ color: G }} /> No credit card</span>
                <span className="flex items-center gap-1.5"><Lock className="w-3.5 h-3.5" style={{ color: G }} /> 100% private</span>
                <span className="flex items-center gap-1.5"><Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" /> 4.9 rating</span>
              </div>
            </div>

            {/* Right: photo grid — MoEngage style */}
            <div className="hidden lg:grid grid-cols-2 gap-3 pb-0 self-end">
              {[
                { bg: "#e8f5e9", emoji: "🌅", label: "Goa Trip", span: false },
                { bg: "#fff3e0", emoji: "🎂", label: "Birthday", span: false },
                { bg: "#fce4ec", emoji: "✈️", label: "Anniversary Trip", span: false },
                { bg: "#e8f5e9", emoji: "💑", label: "487 days together", span: false },
              ].map((c, i) => (
                <div key={i} className="rounded-2xl aspect-[4/3] flex flex-col items-center justify-center gap-1 shadow-sm" style={{ background: c.bg }}>
                  <span className="text-4xl">{c.emoji}</span>
                  <span className="text-[11px] font-semibold text-gray-600 mt-1">{c.label}</span>
                </div>
              ))}
              {/* Bottom wide card */}
              <div className="col-span-2 rounded-2xl p-4 flex items-center justify-between shadow-sm" style={{ background: DARK }}>
                <div>
                  <p className="text-xs font-bold text-white mb-0.5">New memory added</p>
                  <p className="text-[11px]" style={{ color: "#9ca3af" }}>Priya added "Our First Trip" · just now</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-base" style={{ background: "#1a2e24" }}>💚</div>
                  <span className="text-xs font-semibold text-white">View</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ══ STATS — Brevo style: white strip, separator lines ══ */}
      <Reveal>
        <div className="bg-white py-10" style={{ borderBottom: `1px solid ${BORDER}` }}>
          <div className="max-w-5xl mx-auto px-6 md:px-10">
            <div className="grid grid-cols-2 md:grid-cols-4 divide-x" style={{ borderColor: BORDER }}>
              {[
                { val: "50K+", label: "Couples using OurVault" },
                { val: "2M+",  label: "Memories safely stored" },
                { val: "4.9★", label: "Average app rating" },
                { val: "100%", label: "Always private" },
              ].map((s, i) => (
                <div key={i} className="text-center px-6 py-2">
                  <div className="font-extrabold text-[28px] md:text-[34px] mb-1" style={{ color: G, fontFamily: "'Space Grotesk', system-ui, sans-serif", letterSpacing: "-0.02em" }}>{s.val}</div>
                  <div className="text-[13px] font-medium" style={{ color: MUTED }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Reveal>

      {/* ══ FEATURES — Brevo tab style ══ */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6 md:px-10">

          <Reveal className="max-w-2xl mb-14">
            <p className="text-[11px] font-extrabold tracking-[0.12em] uppercase mb-4" style={{ color: G }}>EVERYTHING YOU NEED</p>
            <h2 style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif", fontWeight: 800, fontSize: "clamp(28px, 3.5vw, 42px)", lineHeight: 1.12, letterSpacing: "-0.02em", color: DARK }}
              className="mb-4">
              Built for couples,<br />
              <span style={{ color: G }}>not just storage.</span>
            </h2>
            <p className="text-[16px] leading-[1.7]" style={{ color: BODY }}>Every feature is crafted around intimacy, privacy, and the way real couples actually live and love.</p>
          </Reveal>

          {/* Tab pills */}
          <div className="flex flex-wrap gap-2 mb-12">
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              const active = tab === i;
              return (
                <button key={f.id} onClick={() => setTab(i)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-full text-[13px] font-semibold transition-all border"
                  style={active ? { background: G, color: "#fff", borderColor: G } : { background: "#fff", color: BODY, borderColor: BORDER }}>
                  <Icon className="w-4 h-4" />
                  {f.tab}
                </button>
              );
            })}
          </div>

          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <Reveal delay={50}>
              <p className="text-[11px] font-extrabold tracking-[0.12em] uppercase mb-4" style={{ color: G }}>{feat.tag}</p>
              <h3 style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif", fontWeight: 800, fontSize: "clamp(22px, 2.5vw, 32px)", lineHeight: 1.2, letterSpacing: "-0.01em", color: DARK }}
                className="mb-4">{feat.heading}</h3>
              <p className="text-[15px] leading-[1.75] mb-7" style={{ color: BODY }}>{feat.desc}</p>
              <ul className="space-y-3.5 mb-8">
                {feat.bullets.map((b, i) => (
                  <li key={i} className="flex items-center gap-3 text-[14px] font-medium" style={{ color: DARK }}>
                    <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ background: "#f0fdf4" }}>
                      <Check className="w-3 h-3" style={{ color: G }} />
                    </div>
                    {b}
                  </li>
                ))}
              </ul>
              <Link to="/auth" className="inline-flex items-center gap-1.5 text-[14px] font-bold hover:underline underline-offset-4" style={{ color: G }}>
                Get started free <ChevronRight className="w-4 h-4" />
              </Link>
            </Reveal>
            <Reveal delay={150} className="flex justify-center lg:justify-end">
              <div className="w-full max-w-[320px]">{feat.mockup}</div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ══ HOW IT WORKS — light gray bg, numbered steps ══ */}
      <section id="how-it-works" className="py-24 border-y" style={{ background: "#f9fafb", borderColor: BORDER }}>
        <div className="max-w-5xl mx-auto px-6 md:px-10">
          <Reveal className="text-center mb-16 max-w-2xl mx-auto">
            <p className="text-[11px] font-extrabold tracking-[0.12em] uppercase mb-4" style={{ color: G }}>SIMPLE SETUP</p>
            <h2 style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif", fontWeight: 800, fontSize: "clamp(28px, 3.5vw, 42px)", lineHeight: 1.12, letterSpacing: "-0.02em", color: DARK }}
              className="mb-4">
              Up and running<br />in <span style={{ color: G }}>60 seconds.</span>
            </h2>
            <p className="text-[16px] leading-[1.7]" style={{ color: BODY }}>No credit card, no setup hassle. Just two people and their story.</p>
          </Reveal>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connector */}
            <div className="hidden md:block absolute top-[38px] left-[calc(16.67%+36px)] right-[calc(16.67%+36px)] h-px" style={{ background: `linear-gradient(to right, ${G}40, ${G}80, ${G}40)` }} />

            {STEPS.map((s, i) => {
              const Icon = s.icon;
              return (
                <Reveal key={i} delay={i * 100} className="text-center">
                  <div className="relative inline-flex mb-6">
                    <div className="w-[76px] h-[76px] rounded-2xl bg-white flex items-center justify-center shadow-md" style={{ border: `1px solid ${BORDER}` }}>
                      <Icon className="w-9 h-9" style={{ color: G }} strokeWidth={1.5} />
                    </div>
                    <span className="absolute -top-3 -right-3 w-6 h-6 rounded-full text-white text-[10px] font-extrabold flex items-center justify-center shadow-sm" style={{ background: DARK }}>{s.n}</span>
                  </div>
                  <h3 className="font-bold text-[15px] mb-2" style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif", color: DARK }}>{s.label}</h3>
                  <p className="text-[14px] leading-[1.65]" style={{ color: BODY }}>{s.desc}</p>
                </Reveal>
              );
            })}
          </div>

          <Reveal className="text-center mt-14">
            <Link to="/auth" className="inline-flex items-center gap-2 font-bold text-white px-8 py-3.5 rounded-xl hover:opacity-90 transition-all shadow-md text-[15px]" style={{ background: DARK }}>
              Begin your story <ArrowRight className="w-4 h-4" />
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ══ APP MOCKUP SHOWCASE — Linkrunner style: centered, full-width ══ */}
      <section className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6 md:px-10">
          <Reveal className="text-center mb-12 max-w-2xl mx-auto">
            <p className="text-[11px] font-extrabold tracking-[0.12em] uppercase mb-4" style={{ color: G }}>INSIDE THE APP</p>
            <h2 style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif", fontWeight: 800, fontSize: "clamp(28px, 3.5vw, 42px)", lineHeight: 1.12, letterSpacing: "-0.02em", color: DARK }}>
              Your private world,<br /><span style={{ color: G }}>beautifully designed.</span>
            </h2>
          </Reveal>
          <Reveal delay={100}>
            <AppCard />
          </Reveal>
        </div>
      </section>

      {/* ══ TESTIMONIALS ══ */}
      <section id="stories" className="py-24 border-y" style={{ background: "#f9fafb", borderColor: BORDER }}>
        <div className="max-w-6xl mx-auto px-6 md:px-10">
          <Reveal className="text-center mb-14 max-w-xl mx-auto">
            <p className="text-[11px] font-extrabold tracking-[0.12em] uppercase mb-4" style={{ color: G }}>REAL COUPLES</p>
            <h2 style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif", fontWeight: 800, fontSize: "clamp(28px, 3.5vw, 42px)", lineHeight: 1.12, letterSpacing: "-0.02em", color: DARK }}>
              Thousands of love stories.<br /><span style={{ color: G }}>All safe here.</span>
            </h2>
          </Reveal>

          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <Reveal key={i} delay={i * 80}>
                <div className="bg-white rounded-2xl p-7 flex flex-col gap-5 hover:shadow-md transition-all hover:-translate-y-1 duration-300" style={{ border: `1px solid ${BORDER}` }}>
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, j) => <Star key={j} className="w-4 h-4 fill-yellow-400 text-yellow-400" />)}
                  </div>
                  <p className="text-[14px] leading-[1.75] flex-1" style={{ color: BODY }}>"{t.quote}"</p>
                  <div className="flex items-center gap-3 pt-4" style={{ borderTop: `1px solid ${BORDER}` }}>
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl" style={{ background: "#f0fdf4" }}>{t.avatar}</div>
                    <div>
                      <p className="text-[13px] font-bold" style={{ color: DARK }}>{t.name}</p>
                      <p className="text-[12px]" style={{ color: MUTED }}>{t.days}</p>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══ PRICING ══ */}
      <section id="pricing" className="py-24 bg-white">
        <div className="max-w-5xl mx-auto px-6 md:px-10">
          <Reveal className="text-center mb-14 max-w-xl mx-auto">
            <p className="text-[11px] font-extrabold tracking-[0.12em] uppercase mb-4" style={{ color: G }}>SIMPLE PRICING</p>
            <h2 style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif", fontWeight: 800, fontSize: "clamp(28px, 3.5vw, 42px)", lineHeight: 1.12, letterSpacing: "-0.02em", color: DARK }}
              className="mb-4">
              Love shouldn't be<br /><span style={{ color: G }}>expensive.</span>
            </h2>
            <p className="text-[16px] leading-[1.7]" style={{ color: BODY }}>Start free forever. Upgrade when your love grows.</p>
          </Reveal>

          <div className="grid md:grid-cols-3 gap-6 items-start">
            {PLANS.map((plan, i) => (
              <Reveal key={i} delay={i * 80}>
                <div className="relative bg-white rounded-2xl p-8 flex flex-col transition-all"
                  style={plan.popular
                    ? { border: `2px solid ${G}`, boxShadow: `0 8px 40px ${G}22`, transform: "scale(1.035)" }
                    : { border: `1px solid ${BORDER}` }}>
                  {plan.popular && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-white text-[11px] font-extrabold px-4 py-1 rounded-full whitespace-nowrap" style={{ background: G }}>
                      ✦ Most popular
                    </div>
                  )}
                  <p className="text-[11px] font-extrabold uppercase tracking-widest mb-3" style={{ color: MUTED }}>{plan.name}</p>
                  <div className="flex items-baseline gap-1 mb-7">
                    <span style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif", fontWeight: 800, fontSize: 40, letterSpacing: "-0.03em", color: DARK }}>{plan.price}</span>
                    <span className="text-[13px]" style={{ color: MUTED }}>{plan.period}</span>
                  </div>
                  <ul className="space-y-3 mb-8 flex-1">
                    {plan.features.map((f, j) => (
                      <li key={j} className="flex items-center gap-2.5 text-[13px] font-medium" style={{ color: BODY }}>
                        <div className="w-4 h-4 rounded-full flex items-center justify-center shrink-0" style={{ background: "#f0fdf4" }}>
                          <Check className="w-2.5 h-2.5" style={{ color: G }} />
                        </div>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link to="/auth"
                    className="w-full py-3 rounded-xl font-bold text-[14px] text-center block text-white hover:opacity-90 transition-all"
                    style={{ background: plan.popular ? G : DARK }}>
                    {plan.cta}
                  </Link>
                  {plan.popular && <p className="text-[11px] text-center mt-3" style={{ color: MUTED }}>Secure payment · Cancel anytime</p>}
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FINAL CTA — MoEngage: warm bg, large type ══ */}
      <section className="py-28" style={{ background: "#f8f5ef" }}>
        <div className="max-w-3xl mx-auto px-6 md:px-10 text-center">
          <Reveal>
            <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center mx-auto mb-8 shadow-sm" style={{ border: `1px solid ${BORDER}` }}>
              <Heart className="w-7 h-7" style={{ color: G, fill: `${G}30` }} />
            </div>
            <h2 style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif", fontWeight: 800, fontSize: "clamp(32px, 5vw, 54px)", lineHeight: 1.1, letterSpacing: "-0.02em", color: DARK }}
              className="mb-5">
              Your story deserves<br /><span style={{ color: G }}>a forever home.</span>
            </h2>
            <p className="text-[17px] leading-[1.7] mb-10 max-w-xl mx-auto" style={{ color: BODY }}>
              Join 50,000+ couples who chose OurVault to hold their most precious memories. Free to start, forever to keep.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link to="/auth" className="inline-flex items-center gap-2 font-bold text-white px-8 py-4 rounded-xl hover:opacity-90 transition-all hover:scale-[1.02] shadow-md text-[15px]" style={{ background: DARK }}>
                Begin your story <ArrowRight className="w-4 h-4" />
              </Link>
              <span className="text-[13px] font-medium flex items-center gap-1.5" style={{ color: MUTED }}>
                <ShieldCheck className="w-4 h-4" style={{ color: G }} />
                No credit card · 100% private · Free forever
              </span>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ══ FOOTER ══ */}
      <footer className="bg-white" style={{ borderTop: `1px solid ${BORDER}` }}>
        <div className="max-w-6xl mx-auto px-6 md:px-10 py-10 flex flex-col md:flex-row items-center justify-between gap-5">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: G }}>
              <Heart className="w-3.5 h-3.5 text-white fill-white" />
            </div>
            <span className="font-extrabold text-[16px]" style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif", color: DARK }}>OurVault</span>
          </div>
          <p className="text-[12px] text-center" style={{ color: MUTED }}>Made with 💚 for couples everywhere · Your memories are always private and secure</p>
          <div className="flex items-center gap-6 text-[13px] font-medium" style={{ color: MUTED }}>
            <Link to="/auth" className="hover:text-gray-800 transition-colors">Sign In</Link>
            <span style={{ color: BORDER }}>|</span>
            <Link to="/auth" className="hover:text-gray-800 transition-colors">Get Started</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
