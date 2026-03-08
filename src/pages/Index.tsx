import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Heart, ArrowRight, Check, Sparkles,
  CalendarHeart, UserRoundCheck, HeartHandshake, ImagePlay,
  ShieldCheck, Star, Menu, X as XIcon, ChevronRight,
  Camera, MessageCircle, Calendar
} from "lucide-react";

/* Brevo palette */
const C = {
  green:     "#0a7c59",   /* Brevo signature green — links, tags, accents */
  greenBg:   "#d5f5d0",   /* Brevo hero mint bg */
  greenLight:"#e8f5e9",   /* Very light green surfaces */
  greenMid:  "#f0fdf4",   /* Section backgrounds */
  dark:      "#1b1b2e",   /* Near-black — headlines, dark buttons */
  body:      "#374151",   /* Gray-700 for body text */
  muted:     "#6b7280",   /* Gray-500 for secondary text */
  border:    "#e5e7eb",   /* Gray-200 */
};

/* ─── in-view hook ─── */
function useInView(threshold = 0.12) {
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
    <div
      ref={ref}
      className={`transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

/* ─── Feature data ─── */
const FEATURES = [
  {
    id: "vault", tab: "Memory Vault", icon: Camera,
    tag: "SHARED MEMORIES",
    heading: "Store every beautiful moment together",
    desc: "Upload photos and videos, organise them into private folders, and build a timeline that's just yours. No algorithm, no strangers.",
    bullets: ["Private folders & albums", "Star your favourites", "Love notes on every photo", "Shared access for both partners"],
    mockup: (
      <div className="bg-white rounded-3xl shadow-xl overflow-hidden" style={{ border: `1px solid ${C.greenLight}` }}>
        <div className="px-4 py-3 flex items-center gap-2" style={{ background: C.greenMid, borderBottom: `1px solid ${C.greenLight}` }}>
          <div className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ background: C.green }}>
            <Heart className="w-3.5 h-3.5 text-white fill-white" />
          </div>
          <span className="text-xs font-bold text-gray-800">Our Memories</span>
          <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ background: C.greenLight, color: C.green }}>47 photos</span>
        </div>
        <div className="p-3 bg-white">
          <div className="grid grid-cols-3 gap-1.5 mb-3">
            {[
              { bg: C.greenLight, emoji: "🌅", label: "Goa Trip" },
              { bg: "#f1f8e9",    emoji: "🎂", label: "Birthday" },
              { bg: C.greenLight, emoji: "🌿", label: "Forest" },
              { bg: "#ecfdf5",    emoji: "✈️", label: "Mumbai" },
              { bg: C.greenLight, emoji: "🍽️", label: "Dinner" },
              { bg: "#f0fdf4",    emoji: "💚", label: "1 Year!" },
            ].map((t, i) => (
              <div key={i} className="rounded-xl aspect-square flex flex-col items-center justify-center gap-0.5" style={{ background: t.bg }}>
                <span className="text-xl">{t.emoji}</span>
                <span className="text-[8px] font-medium text-gray-500">{t.label}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 rounded-xl px-3 py-2 text-[11px]" style={{ background: C.greenLight, color: C.green }}>Add a love note…</div>
            <button className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: C.green }}>
              <Heart className="w-3.5 h-3.5 text-white fill-white" />
            </button>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "chat", tab: "Private Chat", icon: MessageCircle,
    tag: "JUST THE TWO OF YOU",
    heading: "A private space only you two can see",
    desc: "Chat freely with no one watching. Send voice messages, react with emojis — your very own corner of the internet.",
    bullets: ["End-to-end private messages", "Voice messages", "Emoji reactions", "Reply threads & read receipts"],
    mockup: (
      <div className="bg-white rounded-3xl shadow-xl overflow-hidden" style={{ border: `1px solid ${C.greenLight}` }}>
        <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: `1px solid ${C.greenLight}`, background: C.greenMid }}>
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-base" style={{ background: C.greenLight }}>💚</div>
          <div>
            <p className="text-xs font-bold text-gray-800">Priya</p>
            <p className="text-[10px] font-medium" style={{ color: C.green }}>● Online</p>
          </div>
        </div>
        <div className="px-3 py-3 space-y-2 bg-white min-h-[150px]">
          {[
            { mine: false, msg: "Remember our first date? 🥹" },
            { mine: true,  msg: "How could I forget! 😄" },
            { mine: false, msg: "I uploaded our photos 💚" },
            { mine: true,  msg: "Adding love notes now 🌿" },
          ].map((m, i) => (
            <div key={i} className={`flex ${m.mine ? "justify-end" : "justify-start"}`}>
              <div
                className="max-w-[78%] px-3 py-2 rounded-2xl text-xs"
                style={m.mine
                  ? { background: C.green, color: "#fff", borderBottomRightRadius: 4 }
                  : { background: "#f3f4f6", color: "#374151", borderBottomLeftRadius: 4 }}
              >
                {m.msg}
              </div>
            </div>
          ))}
        </div>
        <div className="px-3 py-2.5 flex gap-2" style={{ borderTop: `1px solid ${C.greenLight}` }}>
          <div className="flex-1 rounded-xl px-3 py-2 text-[11px]" style={{ background: C.greenLight, color: C.green }}>Type a message…</div>
          <button className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: C.green }}>
            <ArrowRight className="w-3.5 h-3.5 text-white" />
          </button>
        </div>
      </div>
    ),
  },
  {
    id: "milestones", tab: "Milestones", icon: Calendar,
    tag: "YOUR LOVE TIMELINE",
    heading: "Never forget a special date again",
    desc: "Log your first date, first trip — every milestone lives on your personal love timeline. Reminders so no anniversary slips by.",
    bullets: ["Custom milestone types", "Anniversary reminders", "Attach photos to dates", "Beautiful timeline view"],
    mockup: (
      <div className="bg-white rounded-3xl shadow-xl overflow-hidden" style={{ border: `1px solid ${C.greenLight}` }}>
        <div className="px-4 py-3 flex items-center gap-2" style={{ background: C.greenMid, borderBottom: `1px solid ${C.greenLight}` }}>
          <CalendarHeart className="w-4 h-4" style={{ color: C.green }} />
          <span className="text-xs font-bold text-gray-800">Your Love Timeline</span>
        </div>
        <div className="p-3 space-y-2">
          {[
            { emoji: "💑", label: "First Date",         date: "Dec 2, 2024"  },
            { emoji: "💬", label: "First 'I Love You'", date: "Jan 14, 2025" },
            { emoji: "✈️", label: "Goa Trip together", date: "Feb 14, 2025" },
            { emoji: "🎂", label: "1 Year Anniversary", date: "Dec 2, 2025"  },
          ].map((m, i) => (
            <div key={i} className="flex items-center gap-2.5 px-3 py-2 rounded-xl border" style={{ background: C.greenLight, borderColor: "#a5d6a7" }}>
              <span className="text-base">{m.emoji}</span>
              <p className="flex-1 text-xs font-semibold text-gray-800">{m.label}</p>
              <span className="text-[9px] text-gray-400">{m.date}</span>
            </div>
          ))}
        </div>
      </div>
    ),
  },
];

const PLANS = [
  { name: "Free",     price: "₹0",  period: "/month", cta: "Start for free",   popular: false, features: ["50 uploads/month", "Shared memory vault", "Milestone calendar", "Private chat"] },
  { name: "Dating",   price: "₹9",  period: "/month", cta: "Get Dating",       popular: true,  features: ["200 uploads/month", "Everything in Free", "Emoji reactions", "Love notes", "Activity feed"] },
  { name: "Soulmate", price: "₹99", period: "/month", cta: "Become Soulmates", popular: false, features: ["Unlimited uploads", "Everything in Dating", "Voice messages", "Slideshow mode", "Priority support"] },
];

const TESTIMONIALS = [
  { quote: "We live in different cities. OurVault is the only app where we feel truly close. The voice messages are magical.", name: "Priya & Arjun",  days: "487 days together", avatar: "💑" },
  { quote: "Every trip, every date, every note — in one beautiful private place. We check it every single day.",              name: "Sneha & Rahul", days: "1,204 days together", avatar: "🌿" },
  { quote: "I added a love note to our first photo and she cried happy tears. Best ₹9 I've ever spent.",                     name: "Rohan",         days: "Dating plan",         avatar: "💚" },
];

const STEPS = [
  { step: "01", icon: UserRoundCheck, label: "Create your account",       desc: "Sign up free in under a minute — no credit card needed." },
  { step: "02", icon: HeartHandshake, label: "Invite your partner",       desc: "Share a unique link. They join and you're connected." },
  { step: "03", icon: ImagePlay,      label: "Build memories together",   desc: "Upload photos, chat, add milestones. Your story starts now." },
];

/* ════════════════════════════ MAIN ════════════════════════════ */
export default function Index() {
  const [scrollY, setScrollY]   = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    const fn = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const tab = FEATURES[activeTab];

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans overflow-x-hidden">

      {/* ══ NAV ══ */}
      <nav
        className="fixed top-0 inset-x-0 z-50 transition-all duration-300"
        style={{ background: "#fff", borderBottom: scrollY > 30 ? `1px solid ${C.border}` : "1px solid transparent", boxShadow: scrollY > 30 ? "0 1px 8px rgba(0,0,0,0.06)" : "none" }}
      >
        <div className="max-w-6xl mx-auto px-5 md:px-10 h-16 flex items-center gap-6">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: C.green }}>
              <Heart className="w-4 h-4 text-white fill-white" />
            </div>
            <span className="font-heading font-extrabold text-lg tracking-tight" style={{ color: C.dark }}>OurVault</span>
          </Link>

          {/* Center links */}
          <div className="hidden md:flex items-center gap-7 text-sm font-medium flex-1 justify-center" style={{ color: C.muted }}>
            <a href="#features"     className="hover:text-gray-900 transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-gray-900 transition-colors">How it works</a>
            <a href="#pricing"      className="hover:text-gray-900 transition-colors">Pricing</a>
            <a href="#love-stories" className="hover:text-gray-900 transition-colors">Stories</a>
          </div>

          {/* Right CTAs */}
          <div className="hidden md:flex items-center gap-3 shrink-0">
            <Link to="/auth" className="text-sm font-semibold transition-colors px-3 py-2 hover:text-gray-900" style={{ color: C.muted }}>Log in</Link>
            <Link to="/auth" className="text-sm font-bold text-white px-5 py-2.5 rounded-xl hover:opacity-90 transition-all" style={{ background: C.dark }}>
              Sign up free
            </Link>
          </div>

          <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden p-2 rounded-lg hover:bg-gray-100 ml-auto">
            {menuOpen ? <XIcon className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {menuOpen && (
          <div className="md:hidden bg-white border-t px-5 pb-5 flex flex-col gap-2 shadow-lg" style={{ borderColor: C.border }}>
            {["features", "how-it-works", "pricing", "love-stories"].map((h) => (
              <a key={h} href={`#${h}`} onClick={() => setMenuOpen(false)}
                className="text-sm font-medium py-2.5 border-b capitalize" style={{ color: C.muted, borderColor: "#f3f4f6" }}>
                {h.replace(/-/g, " ")}
              </a>
            ))}
            <Link to="/auth" onClick={() => setMenuOpen(false)}
              className="text-sm font-bold text-white px-5 py-3 rounded-xl text-center mt-2"
              style={{ background: C.dark }}>
              Sign up free
            </Link>
          </div>
        )}
      </nav>

      {/* ══ HERO — Brevo: mint green bg, bold dark headline left, mockup right ══ */}
      <section className="pt-16" style={{ background: C.greenBg }}>
        <div className="max-w-6xl mx-auto px-5 md:px-10 pt-14 pb-0">
          <div className="grid lg:grid-cols-2 gap-12 items-end">

            {/* Left */}
            <div className="pb-16 lg:pb-20">
              <div className="inline-flex items-center gap-2 bg-white/60 backdrop-blur-sm border border-white/80 px-4 py-1.5 rounded-full text-xs font-semibold text-gray-700 mb-7 shadow-sm">
                <Sparkles className="w-3.5 h-3.5" style={{ color: C.green }} />
                50,000+ couples already joined
              </div>

              <h1 className="font-heading font-extrabold leading-[1.08] tracking-tight mb-5" style={{ fontSize: "clamp(36px,5vw,58px)", color: C.dark }}>
                Turn Every<br />
                <span style={{ color: C.green }}>Moment</span> into a<br />
                Lifetime Memory.
              </h1>

              <p className="text-base leading-relaxed mb-8 max-w-[440px]" style={{ color: C.body }}>
                A private vault built for couples — store photos, chat, send voice messages and celebrate every milestone. Just the two of you, forever.
              </p>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-8">
                <Link to="/auth"
                  className="inline-flex items-center gap-2 font-bold px-7 py-3.5 rounded-xl hover:opacity-90 transition-all hover:scale-[1.02] shadow-md text-base text-white"
                  style={{ background: C.dark }}>
                  Start for free <ArrowRight className="w-4 h-4" />
                </Link>
                <a href="#features" className="inline-flex items-center gap-1.5 text-sm font-semibold transition-colors hover:text-gray-900" style={{ color: C.green }}>
                  See how it works <ChevronRight className="w-4 h-4" />
                </a>
              </div>

              <div className="flex flex-wrap items-center gap-5 text-xs font-medium" style={{ color: C.muted }}>
                <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5" style={{ color: C.green }} /> No credit card</span>
                <span className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5" style={{ color: C.green }} /> 100% private</span>
                <span className="flex items-center gap-1.5"><Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" /> 4.9 rating</span>
              </div>
            </div>

            {/* Right: app mockup */}
            <div className="hidden lg:flex justify-center items-end">
              <div className="relative w-full max-w-[340px]">
                <div className="bg-white rounded-t-3xl shadow-2xl overflow-hidden" style={{ border: `1px solid rgba(0,0,0,0.06)`, borderBottom: "none" }}>
                  {/* Header */}
                  <div className="px-5 py-3.5 border-b flex items-center justify-between" style={{ borderColor: C.border }}>
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: C.green }}>
                        <Heart className="w-3.5 h-3.5 text-white fill-white" />
                      </div>
                      <span className="font-heading font-bold text-sm" style={{ color: C.dark }}>OurVault</span>
                    </div>
                    <span className="text-[10px] px-2.5 py-1 rounded-full font-bold" style={{ background: C.greenLight, color: C.green }}>● Live</span>
                  </div>
                  {/* Grid */}
                  <div className="p-4">
                    <p className="text-xs font-semibold mb-3" style={{ color: C.muted }}>📸 Our Memories · 47 photos</p>
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      {[
                        { bg: C.greenLight, e: "🌅" }, { bg: "#f1f8e9", e: "🎂" },
                        { bg: C.greenLight, e: "🌿" }, { bg: "#ecfdf5", e: "✈️" },
                        { bg: "#f0fdf4",    e: "🍽️" }, { bg: C.greenLight, e: "💚" },
                      ].map((t, i) => (
                        <div key={i} className="rounded-2xl aspect-square flex items-center justify-center text-2xl shadow-sm" style={{ background: t.bg }}>{t.e}</div>
                      ))}
                    </div>
                    <div className="space-y-1.5 border-t pt-3" style={{ borderColor: C.border }}>
                      <div className="flex justify-start"><div className="bg-gray-100 rounded-2xl px-3 py-2 text-xs text-gray-700" style={{ borderBottomLeftRadius: 4 }}>Remember our first date? 🥹</div></div>
                      <div className="flex justify-end"><div className="text-white rounded-2xl px-3 py-2 text-xs" style={{ background: C.green, borderBottomRightRadius: 4 }}>How could I forget! 😄</div></div>
                    </div>
                  </div>
                </div>

                {/* Badge: days together */}
                <div className="absolute -left-8 top-1/3 bg-white rounded-2xl shadow-xl px-4 py-2.5 flex items-center gap-2.5" style={{ border: `1px solid ${C.greenLight}` }}>
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-base" style={{ background: C.greenLight }}>💑</div>
                  <div>
                    <p className="text-xs font-bold" style={{ color: C.dark }}>487 days</p>
                    <p className="text-[10px] font-medium" style={{ color: C.green }}>together 💚</p>
                  </div>
                </div>

                {/* Badge: new note */}
                <div className="absolute -right-6 top-10 bg-white rounded-2xl shadow-xl px-3 py-2.5 flex items-center gap-2" style={{ border: `1px solid ${C.greenLight}` }}>
                  <span className="text-lg">💌</span>
                  <div>
                    <p className="text-[10px] font-bold" style={{ color: C.dark }}>New love note</p>
                    <p className="text-[9px] font-medium" style={{ color: C.green }}>from Priya ✨</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ SOCIAL PROOF STRIP ══ */}
      <Reveal>
        <div className="bg-white py-8" style={{ borderBottom: `1px solid ${C.border}` }}>
          <div className="max-w-5xl mx-auto px-5 md:px-10">
            <p className="text-center text-xs font-semibold uppercase tracking-widest mb-7" style={{ color: C.muted }}>Trusted by couples across India and beyond</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              {[
                { val: "50K+", label: "Couples using OurVault" },
                { val: "2M+",  label: "Memories safely stored" },
                { val: "4.9★", label: "Average app rating" },
                { val: "100%", label: "Private — always" },
              ].map((s, i) => (
                <div key={i}>
                  <div className="font-heading text-2xl md:text-3xl font-extrabold mb-1" style={{ color: C.green }}>{s.val}</div>
                  <div className="text-xs" style={{ color: C.muted }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Reveal>

      {/* ══ FEATURES ══ */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-5 md:px-10">

          <Reveal className="text-center mb-12">
            <p className="text-[11px] font-extrabold tracking-widest uppercase mb-3" style={{ color: C.green }}>EVERYTHING YOU NEED</p>
            <h2 className="font-heading text-3xl md:text-[40px] font-extrabold mb-4 leading-tight" style={{ color: C.dark }}>
              Built for couples,<br />
              <span style={{ color: C.green }}>not just storage.</span>
            </h2>
            <p className="text-base max-w-lg mx-auto" style={{ color: C.muted }}>Every feature crafted around intimacy, privacy, and the way real couples live.</p>
          </Reveal>

          {/* Tab pills */}
          <div className="flex flex-wrap justify-center gap-2 mb-12">
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              const active = activeTab === i;
              return (
                <button
                  key={f.id}
                  onClick={() => setActiveTab(i)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all border"
                  style={active
                    ? { background: C.green, color: "#fff", borderColor: C.green }
                    : { background: "#fff", color: C.muted, borderColor: C.border }}
                >
                  <Icon className="w-4 h-4" />
                  {f.tab}
                </button>
              );
            })}
          </div>

          {/* Text left / mockup right */}
          <div className="grid lg:grid-cols-2 gap-14 items-center">
            <Reveal delay={50}>
              <p className="text-[11px] font-extrabold tracking-widest uppercase mb-3" style={{ color: C.green }}>{tab.tag}</p>
              <h3 className="font-heading text-2xl md:text-3xl font-extrabold mb-4 leading-snug" style={{ color: C.dark }}>{tab.heading}</h3>
              <p className="text-base leading-relaxed mb-7" style={{ color: C.muted }}>{tab.desc}</p>
              <ul className="space-y-3 mb-8">
                {tab.bullets.map((b, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm font-medium" style={{ color: C.body }}>
                    <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ background: C.greenLight }}>
                      <Check className="w-3 h-3" style={{ color: C.green }} />
                    </div>
                    {b}
                  </li>
                ))}
              </ul>
              <Link to="/auth" className="inline-flex items-center gap-1.5 text-sm font-bold hover:underline" style={{ color: C.green }}>
                Get started free <ChevronRight className="w-4 h-4" />
              </Link>
            </Reveal>
            <Reveal delay={150} className="flex justify-center lg:justify-end">
              <div className="w-full max-w-xs">{tab.mockup}</div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ══ HOW IT WORKS ══ */}
      <section id="how-it-works" className="py-20 border-y" style={{ background: C.greenMid, borderColor: C.border }}>
        <div className="max-w-5xl mx-auto px-5 md:px-10">
          <Reveal className="text-center mb-14">
            <p className="text-[11px] font-extrabold tracking-widest uppercase mb-3" style={{ color: C.green }}>SIMPLE SETUP</p>
            <h2 className="font-heading text-3xl md:text-[40px] font-extrabold mb-3 leading-tight" style={{ color: C.dark }}>
              Up and running in <span style={{ color: C.green }}>60 seconds.</span>
            </h2>
            <p className="text-base" style={{ color: C.muted }}>No credit card, no setup hassle. Just two people and their story.</p>
          </Reveal>

          <div className="grid md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-10 left-[calc(16.67%+28px)] right-[calc(16.67%+28px)] h-0.5" style={{ background: `linear-gradient(to right, ${C.green}55, ${C.green}aa, ${C.green}55)` }} />
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              return (
                <Reveal key={i} delay={i * 120} className="text-center">
                  <div className="relative inline-flex mb-5">
                    <div className="w-20 h-20 rounded-3xl bg-white shadow-md flex items-center justify-center" style={{ border: `1px solid ${C.greenLight}` }}>
                      <Icon className="w-9 h-9" style={{ color: C.green }} strokeWidth={1.5} />
                    </div>
                    <span className="absolute -top-2.5 -right-2.5 w-6 h-6 rounded-full text-white text-[10px] font-extrabold flex items-center justify-center shadow" style={{ background: C.dark }}>{s.step}</span>
                  </div>
                  <h3 className="font-heading font-extrabold text-base mb-2" style={{ color: C.dark }}>{s.label}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: C.muted }}>{s.desc}</p>
                </Reveal>
              );
            })}
          </div>

          <Reveal className="text-center mt-12">
            <Link to="/auth" className="inline-flex items-center gap-2 font-bold text-white px-8 py-3.5 rounded-xl hover:opacity-90 transition-all shadow-md" style={{ background: C.dark }}>
              Begin your story <ArrowRight className="w-4 h-4" />
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ══ TESTIMONIALS ══ */}
      <section id="love-stories" className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-5 md:px-10">
          <Reveal className="text-center mb-12">
            <p className="text-[11px] font-extrabold tracking-widest uppercase mb-3" style={{ color: C.green }}>REAL COUPLES</p>
            <h2 className="font-heading text-3xl md:text-[40px] font-extrabold mb-3 leading-tight" style={{ color: C.dark }}>
              Thousands of love stories.<br />
              <span style={{ color: C.green }}>All safe here.</span>
            </h2>
          </Reveal>

          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <Reveal key={i} delay={i * 100}>
                <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-all hover:-translate-y-1 duration-300" style={{ border: `1px solid ${C.border}` }}>
                  <div className="flex mb-4 gap-0.5">
                    {[...Array(5)].map((_, j) => <Star key={j} className="w-4 h-4 fill-yellow-400 text-yellow-400" />)}
                  </div>
                  <p className="text-sm leading-relaxed mb-5" style={{ color: C.muted }}>"{t.quote}"</p>
                  <div className="flex items-center gap-3 pt-4" style={{ borderTop: `1px solid ${C.border}` }}>
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl" style={{ background: C.greenLight }}>{t.avatar}</div>
                    <div>
                      <p className="text-sm font-bold" style={{ color: C.dark }}>{t.name}</p>
                      <p className="text-xs" style={{ color: C.muted }}>{t.days}</p>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══ PRICING ══ */}
      <section id="pricing" className="py-20 border-y" style={{ background: C.greenMid, borderColor: C.border }}>
        <div className="max-w-5xl mx-auto px-5 md:px-10">
          <Reveal className="text-center mb-12">
            <p className="text-[11px] font-extrabold tracking-widest uppercase mb-3" style={{ color: C.green }}>SIMPLE PRICING</p>
            <h2 className="font-heading text-3xl md:text-[40px] font-extrabold mb-3 leading-tight" style={{ color: C.dark }}>
              Love shouldn't be <span style={{ color: C.green }}>expensive.</span>
            </h2>
            <p className="text-base" style={{ color: C.muted }}>Start free forever. Upgrade when your love grows.</p>
          </Reveal>

          <div className="grid md:grid-cols-3 gap-5 items-start">
            {PLANS.map((plan, i) => (
              <Reveal key={i} delay={i * 80}>
                <div
                  className="relative bg-white rounded-2xl p-7 flex flex-col transition-all"
                  style={plan.popular
                    ? { border: `2px solid ${C.green}`, boxShadow: "0 8px 32px rgba(10,124,89,0.15)", transform: "scale(1.03)" }
                    : { border: `1px solid ${C.border}`, boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}
                >
                  {plan.popular && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-white text-[11px] font-extrabold px-4 py-1 rounded-full whitespace-nowrap shadow" style={{ background: C.green }}>
                      ✦ Most popular
                    </div>
                  )}
                  <p className="text-[11px] font-extrabold uppercase tracking-wider mb-2" style={{ color: C.muted }}>{plan.name}</p>
                  <div className="flex items-baseline gap-1 mb-6">
                    <span className="font-heading text-4xl font-extrabold" style={{ color: C.dark }}>{plan.price}</span>
                    <span className="text-xs" style={{ color: C.muted }}>{plan.period}</span>
                  </div>
                  <ul className="space-y-3 mb-7 flex-1">
                    {plan.features.map((f, j) => (
                      <li key={j} className="flex items-center gap-2.5 text-sm" style={{ color: C.body }}>
                        <div className="w-4 h-4 rounded-full flex items-center justify-center shrink-0" style={{ background: C.greenLight }}>
                          <Check className="w-2.5 h-2.5" style={{ color: C.green }} />
                        </div>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link
                    to="/auth"
                    className="w-full py-3 rounded-xl font-bold text-sm text-center block text-white hover:opacity-90 transition-all"
                    style={{ background: plan.popular ? C.green : C.dark }}
                  >
                    {plan.cta}
                  </Link>
                  {plan.popular && <p className="text-[10px] text-center mt-2.5" style={{ color: C.muted }}>Secure payment · Cancel anytime</p>}
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FINAL CTA — mint green bg like Brevo ══ */}
      <section className="py-24" style={{ background: C.greenBg }}>
        <div className="max-w-3xl mx-auto px-5 md:px-10 text-center">
          <Reveal>
            <div className="w-16 h-16 rounded-3xl bg-white flex items-center justify-center mx-auto mb-7 shadow-sm" style={{ border: `1px solid ${C.greenLight}` }}>
              <Heart className="w-8 h-8 fill-current" style={{ color: C.green }} />
            </div>
            <h2 className="font-heading text-3xl md:text-5xl font-extrabold mb-5 leading-tight" style={{ color: C.dark }}>
              Your story deserves<br />
              <span style={{ color: C.green }}>a forever home.</span>
            </h2>
            <p className="text-base mb-9 max-w-xl mx-auto leading-relaxed" style={{ color: C.body }}>
              Join 50,000+ couples who chose OurVault to hold their most precious memories. Free to start, forever to keep.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/auth" className="inline-flex items-center gap-2 font-bold text-white px-8 py-4 rounded-xl hover:opacity-90 transition-all hover:scale-[1.02] shadow-md text-base" style={{ background: C.dark }}>
                Begin your story <ArrowRight className="w-4 h-4" />
              </Link>
              <span className="text-sm flex items-center gap-1.5" style={{ color: C.muted }}>
                <ShieldCheck className="w-4 h-4" style={{ color: C.green }} />
                No credit card · 100% private · Free forever
              </span>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ══ FOOTER ══ */}
      <footer className="bg-white" style={{ borderTop: `1px solid ${C.border}` }}>
        <div className="max-w-6xl mx-auto px-5 md:px-10 py-10 flex flex-col md:flex-row items-center justify-between gap-5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: C.green }}>
              <Heart className="w-3.5 h-3.5 text-white fill-white" />
            </div>
            <span className="font-heading font-extrabold" style={{ color: C.dark }}>OurVault</span>
          </div>
          <p className="text-xs text-center" style={{ color: C.muted }}>Made with 💚 for couples everywhere · Your memories are always private and secure</p>
          <div className="flex items-center gap-5 text-xs" style={{ color: C.muted }}>
            <Link to="/auth" className="hover:text-gray-700 transition-colors">Sign In</Link>
            <span>·</span>
            <Link to="/auth" className="hover:text-gray-700 transition-colors">Get Started</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
