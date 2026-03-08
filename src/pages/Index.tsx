import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Heart, ArrowRight, Check, ChevronDown, Sparkles, LockKeyhole,
  GalleryVerticalEnd, MessagesSquare, AudioWaveform, CalendarHeart,
  BookHeart, Clapperboard, UserRoundCheck, HeartHandshake, ImagePlay,
  ShieldCheck, Star, Gift, Infinity as InfinityIcon, ChevronRight,
  Menu, X as XIcon
} from "lucide-react";

/* ─── in-view hook ─── */
function useInView(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold });
    obs.observe(el); return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

function Reveal({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const { ref, visible } = useInView();
  return (
    <div ref={ref} className={`transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"} ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

/* ─── Feature tab data ─── */
const FEATURE_TABS = [
  {
    id: "vault",
    label: "Memory Vault",
    icon: GalleryVerticalEnd,
    color: "bg-pink-100 text-pink-600",
    tag: "SHARED MEMORIES",
    heading: "Store every beautiful moment together",
    desc: "Upload photos and videos, organize them into folders, and build a private timeline that's just yours. No algorithm, no strangers — only the two of you.",
    bullets: ["Private folders & albums", "Star your favourites", "Love notes on every photo", "Shared access for both partners"],
    mockup: (
      <div className="bg-white rounded-2xl shadow-xl border border-pink-100 overflow-hidden">
        <div className="bg-gradient-to-br from-pink-50 to-rose-50 p-4 border-b border-pink-100">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-red-400" /><div className="w-2 h-2 rounded-full bg-yellow-400" /><div className="w-2 h-2 rounded-full bg-green-400" />
          </div>
          <p className="text-xs font-semibold text-pink-700 mb-2">✨ Our Memories</p>
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { bg: "bg-rose-200", emoji: "🌅", label: "Goa Trip" },
              { bg: "bg-pink-200", emoji: "🎂", label: "Birthday" },
              { bg: "bg-red-100", emoji: "🌹", label: "Valentine's" },
              { bg: "bg-orange-100", emoji: "✈️", label: "Mumbai" },
              { bg: "bg-fuchsia-100", emoji: "🍽️", label: "Dinner" },
              { bg: "bg-rose-100", emoji: "💕", label: "1 Year!" },
            ].map((t, i) => (
              <div key={i} className={`${t.bg} rounded-lg aspect-square flex flex-col items-center justify-center gap-0.5`}>
                <span className="text-lg">{t.emoji}</span>
                <span className="text-[8px] font-medium text-gray-500">{t.label}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="p-3 flex items-center gap-2">
          <div className="flex-1 bg-pink-50 rounded-lg px-3 py-1.5 text-xs text-pink-400">Add a love note…</div>
          <button className="w-7 h-7 rounded-lg bg-pink-500 flex items-center justify-center">
            <Heart className="w-3.5 h-3.5 text-white fill-white" />
          </button>
        </div>
      </div>
    ),
  },
  {
    id: "chat",
    label: "Private Chat",
    icon: MessagesSquare,
    color: "bg-rose-100 text-rose-600",
    tag: "JUST THE TWO OF YOU",
    heading: "A private space only you two can see",
    desc: "Chat freely with no one watching. Send voice messages, react with emojis, reply to specific messages — your very own corner of the internet.",
    bullets: ["End-to-end private messages", "Voice messages (Soulmate)", "Emoji reactions", "Reply threads & read receipts"],
    mockup: (
      <div className="bg-white rounded-2xl shadow-xl border border-rose-100 overflow-hidden">
        <div className="flex items-center gap-2 p-3 border-b border-rose-100 bg-rose-50/50">
          <div className="w-8 h-8 rounded-full bg-pink-200 flex items-center justify-center text-sm">💕</div>
          <div><p className="text-xs font-semibold text-gray-800">Priya</p><p className="text-[10px] text-green-500 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" /> Online</p></div>
        </div>
        <div className="p-3 space-y-2 min-h-[160px] bg-white">
          {[
            { mine: false, msg: "Remember our first date? 🥹", time: "2:14 PM" },
            { mine: true, msg: "How could I forget! 😄", time: "2:15 PM" },
            { mine: false, msg: "I uploaded the photos 💕", time: "2:16 PM" },
            { mine: true, msg: "Adding love notes to each one 🥰", time: "2:16 PM" },
          ].map((m, i) => (
            <div key={i} className={`flex ${m.mine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] px-3 py-1.5 rounded-2xl text-xs ${m.mine ? "bg-pink-500 text-white rounded-br-sm" : "bg-gray-100 text-gray-700 rounded-bl-sm"}`}>
                <p>{m.msg}</p><p className={`text-[9px] mt-0.5 ${m.mine ? "text-pink-200" : "text-gray-400"}`}>{m.time}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="p-2.5 border-t border-rose-100 flex items-center gap-2">
          <div className="flex-1 bg-rose-50 rounded-xl px-3 py-2 text-xs text-rose-300">Type a message…</div>
          <button className="w-8 h-8 rounded-xl bg-pink-500 flex items-center justify-center"><ArrowRight className="w-3.5 h-3.5 text-white" /></button>
        </div>
      </div>
    ),
  },
  {
    id: "milestones",
    label: "Milestones",
    icon: CalendarHeart,
    color: "bg-green-100 text-green-600",
    tag: "YOUR LOVE TIMELINE",
    heading: "Never forget a special date again",
    desc: "Log your first date, first trip, first kiss — every milestone lives on your personal love timeline. Get reminders so no anniversary ever slips by.",
    bullets: ["Custom milestone types", "Anniversary reminders", "Attach photos to dates", "Beautiful timeline view"],
    mockup: (
      <div className="bg-white rounded-2xl shadow-xl border border-green-100 overflow-hidden">
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4">
          <p className="text-xs font-semibold text-green-700 mb-3">🗓️ Your Love Timeline</p>
          <div className="space-y-2.5">
            {[
              { emoji: "💑", label: "First Date", date: "Dec 2, 2024", color: "bg-pink-100 border-pink-200" },
              { emoji: "💌", label: "First 'I Love You'", date: "Jan 14, 2025", color: "bg-rose-100 border-rose-200" },
              { emoji: "✈️", label: "Goa Trip together", date: "Feb 14, 2025", color: "bg-green-100 border-green-200" },
              { emoji: "🎂", label: "1 Year Anniversary", date: "Dec 2, 2025", color: "bg-emerald-100 border-emerald-200" },
            ].map((m, i) => (
              <div key={i} className={`flex items-center gap-2.5 px-3 py-2 rounded-xl border ${m.color}`}>
                <span className="text-lg">{m.emoji}</span>
                <div className="flex-1"><p className="text-xs font-medium text-gray-800">{m.label}</p></div>
                <span className="text-[9px] text-gray-400">{m.date}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
  },
];

const PLANS = [
  { name: "Single", price: "Free", period: "forever free", cta: "Start Free", popular: false, ctaClass: "bg-gray-900 text-white hover:bg-gray-800", features: ["50 uploads/month", "Shared memory vault", "Milestone calendar", "Private chat"] },
  { name: "Dating", price: "₹9", period: "/month", cta: "Get Dating", popular: true, ctaClass: "bg-pink-500 text-white hover:bg-pink-600", features: ["200 uploads/month", "Everything in Single", "Emoji reactions", "Love notes", "Activity feed"] },
  { name: "Soulmate", price: "₹99", period: "/month", cta: "Become Soulmates", popular: false, ctaClass: "bg-gray-900 text-white hover:bg-gray-800", features: ["Unlimited uploads", "Everything in Dating", "Voice messages", "Slideshow mode", "Priority support"] },
];

const TESTIMONIALS = [
  { quote: "We live in different cities. OurVault is the only app where we actually feel close. The voice messages are magical.", name: "Priya & Arjun", days: "487 days together", avatar: "💑" },
  { quote: "Every trip, every date, every note — in one beautiful private place. We check it every single day.", name: "Sneha & Rahul", days: "1,204 days together", avatar: "🌹" },
  { quote: "I added a love note to our first photo and she cried happy tears. Best ₹9 I've ever spent.", name: "Rohan", days: "Dating plan", avatar: "💌" },
];

const STEPS = [
  { step: 1, icon: UserRoundCheck, label: "Create your account", desc: "Sign up free in under a minute — no credit card needed." },
  { step: 2, icon: HeartHandshake, label: "Invite your partner", desc: "Share a unique link. They join and you're connected forever." },
  { step: 3, icon: ImagePlay, label: "Build memories together", desc: "Upload photos, chat, add milestones. Your story in one place." },
];

/* ════════════════════════════════════════ */
export default function Index() {
  const [scrollY, setScrollY] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const tab = FEATURE_TABS[activeTab];

  return (
    <div className="landing min-h-screen bg-background text-foreground font-sans overflow-x-hidden">

      {/* ══ NAV ══ */}
      <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${scrollY > 40 ? "bg-white/95 backdrop-blur-xl shadow-sm border-b border-border" : "bg-transparent"}`}>
        <div className="max-w-6xl mx-auto px-5 md:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center">
              <LockKeyhole className="w-4 h-4 text-primary-foreground" strokeWidth={2} />
            </div>
            <span className="font-heading font-bold text-lg text-foreground">OurVault</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-7 text-sm text-muted-foreground font-medium">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-foreground transition-colors">How it works</a>
            <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
            <a href="#love-stories" className="hover:text-foreground transition-colors">Stories</a>
          </div>

          {/* Desktop CTAs */}
          <div className="hidden md:flex items-center gap-3">
            <Link to="/auth" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5">Log in</Link>
            <Link to="/auth" className="text-sm font-semibold bg-primary text-primary-foreground px-5 py-2.5 rounded-xl hover:opacity-90 transition-opacity shadow-sm">
              Sign up free
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden p-2 rounded-lg hover:bg-muted transition-colors">
            {menuOpen ? <XIcon className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden bg-white border-b border-border px-5 pb-5 flex flex-col gap-3 shadow-lg">
            {["#features", "#how-it-works", "#pricing", "#love-stories"].map((h, i) => (
              <a key={i} href={h} onClick={() => setMenuOpen(false)} className="text-sm font-medium text-muted-foreground hover:text-foreground py-2 capitalize">{h.replace("#", "").replace(/-/g, " ")}</a>
            ))}
            <Link to="/auth" onClick={() => setMenuOpen(false)} className="text-sm font-semibold bg-primary text-primary-foreground px-5 py-3 rounded-xl text-center mt-1">Sign up free</Link>
          </div>
        )}
      </nav>

      {/* ══ HERO ══  Brevo-style: light colored bg, text left, UI mockup right */}
      <section className="relative pt-20 overflow-hidden" style={{ background: "linear-gradient(155deg, hsl(338 80% 97%) 0%, hsl(152 50% 95%) 100%)" }}>
        {/* Subtle decorative blobs */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full opacity-20 pointer-events-none" style={{ background: "radial-gradient(circle, hsl(338 80% 75%) 0%, transparent 70%)", transform: "translate(30%, -30%)" }} />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full opacity-10 pointer-events-none" style={{ background: "radial-gradient(circle, hsl(152 60% 55%) 0%, transparent 70%)", transform: "translate(-30%, 30%)" }} />

        <div className="relative max-w-6xl mx-auto px-5 md:px-8 py-16 md:py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">

            {/* Left: text */}
            <div>
              {/* Badge */}
              <div className="inline-flex items-center gap-2 bg-white/80 border border-pink-200 px-4 py-2 rounded-full text-xs font-medium text-pink-600 mb-7 shadow-sm">
                <Sparkles className="w-3.5 h-3.5" />
                50,000+ couples already joined
              </div>

              <h1 className="font-heading font-bold text-4xl sm:text-5xl lg:text-[54px] leading-[1.1] tracking-tight mb-6 text-foreground">
                Your love story,<br />
                <span className="gradient-text">beautifully kept.</span>
              </h1>

              <p className="text-muted-foreground text-lg leading-relaxed mb-8 max-w-lg">
                A private vault for couples — store memories, chat, send voice messages, and celebrate every milestone together. Just the two of you.
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-10">
                <Link to="/auth" className="group inline-flex items-center gap-2 bg-primary text-primary-foreground font-semibold px-7 py-3.5 rounded-xl hover:opacity-90 transition-all hover:scale-[1.02] shadow-md text-base">
                  Start for free
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
                <a href="#features" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-3">
                  See how it works <ChevronRight className="w-4 h-4" />
                </a>
              </div>

              {/* Trust line */}
              <div className="flex items-center gap-6 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-green-500" /> No credit card</span>
                <span className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-green-500" /> 100% private</span>
                <span className="flex items-center gap-1.5"><Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" /> 4.9 rating</span>
              </div>
            </div>

            {/* Right: app UI mockup */}
            <div className="relative lg:flex justify-end hidden">
              <div className="relative w-full max-w-sm">
                {/* Main card */}
                <div className="bg-white rounded-3xl shadow-2xl border border-pink-100 overflow-hidden">
                  <div className="bg-gradient-to-br from-pink-50 to-rose-50 px-5 py-4 border-b border-pink-100">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-pink-500 flex items-center justify-center">
                          <LockKeyhole className="w-4 h-4 text-white" strokeWidth={2} />
                        </div>
                        <span className="font-heading font-bold text-sm text-gray-800">OurVault</span>
                      </div>
                      <span className="text-xs bg-green-100 text-green-700 px-2.5 py-1 rounded-full font-medium">● Live</span>
                    </div>
                    <p className="text-xs text-gray-500 mb-3 font-medium">📸 Our Memories · 47 photos</p>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[
                        { bg: "bg-rose-200", emoji: "🌅" }, { bg: "bg-pink-200", emoji: "🎂" },
                        { bg: "bg-red-100", emoji: "🌹" }, { bg: "bg-orange-100", emoji: "✈️" },
                        { bg: "bg-fuchsia-100", emoji: "🍽️" }, { bg: "bg-rose-100", emoji: "💕" },
                      ].map((t, i) => (
                        <div key={i} className={`${t.bg} rounded-xl aspect-square flex items-center justify-center text-xl shadow-sm`}>{t.emoji}</div>
                      ))}
                    </div>
                  </div>
                  {/* Chat preview */}
                  <div className="px-4 py-3 space-y-2">
                    <div className="flex justify-start"><div className="bg-gray-100 rounded-2xl rounded-bl-sm px-3 py-2 text-xs text-gray-700 max-w-[80%]">Remember our first date? 🥹</div></div>
                    <div className="flex justify-end"><div className="bg-pink-500 rounded-2xl rounded-br-sm px-3 py-2 text-xs text-white max-w-[80%]">How could I forget! 😄</div></div>
                  </div>
                </div>

                {/* Floating badge: days together */}
                <div className="absolute -bottom-4 -left-6 bg-white rounded-2xl shadow-xl border border-green-100 px-4 py-3 flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center text-base">💑</div>
                  <div><p className="text-xs font-bold text-gray-800">487 days</p><p className="text-[10px] text-gray-400">together 💚</p></div>
                </div>

                {/* Floating badge: new memory */}
                <div className="absolute -top-4 -right-4 bg-white rounded-2xl shadow-xl border border-pink-100 px-3 py-2.5 flex items-center gap-2">
                  <span className="text-lg">💌</span>
                  <div><p className="text-[10px] font-semibold text-gray-700">New love note</p><p className="text-[9px] text-pink-400">from Priya ✨</p></div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Wave bottom */}
        <div className="h-12 relative overflow-hidden">
          <svg viewBox="0 0 1440 48" className="absolute bottom-0 w-full" preserveAspectRatio="none">
            <path d="M0,48 L0,20 Q360,0 720,20 Q1080,40 1440,20 L1440,48 Z" fill="white" />
          </svg>
        </div>
      </section>

      {/* ══ STATS STRIP ══ */}
      <Reveal>
        <div className="bg-white border-b border-border py-8">
          <div className="max-w-5xl mx-auto px-5 md:px-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { val: "50K+", label: "Couples using OurVault" },
              { val: "2M+", label: "Memories safely stored" },
              { val: "4.9 ★", label: "Average app rating" },
              { val: "100%", label: "Private — always" },
            ].map((s, i) => (
              <div key={i}>
                <div className="font-heading text-2xl md:text-3xl font-bold gradient-text mb-1">{s.val}</div>
                <div className="text-xs text-muted-foreground">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </Reveal>

      {/* ══ FEATURES (tabbed, Brevo-style) ══ */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-5 md:px-8">
          <Reveal className="text-center mb-12">
            <p className="text-xs font-bold tracking-widest text-primary uppercase mb-3">EVERYTHING YOU NEED</p>
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-4">
              Built for couples,<br /><span className="gradient-text">not just storage.</span>
            </h2>
            <p className="text-muted-foreground text-base max-w-lg mx-auto">Every feature is crafted around intimacy, privacy, and the way real couples actually live.</p>
          </Reveal>

          {/* Tab pills */}
          <div className="flex flex-wrap justify-center gap-2 mb-10">
            {FEATURE_TABS.map((t, i) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(i)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeTab === i ? "bg-primary text-primary-foreground shadow-md scale-[1.02]" : "bg-muted text-muted-foreground hover:bg-secondary hover:text-foreground"}`}
                >
                  <Icon className="w-4 h-4" />
                  {t.label}
                </button>
              );
            })}
          </div>

          {/* Tab content: text left, mockup right */}
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <Reveal delay={50}>
              <p className="text-xs font-bold tracking-widest text-primary uppercase mb-3">{tab.tag}</p>
              <h3 className="font-heading text-2xl md:text-3xl font-bold text-foreground mb-4 leading-snug">{tab.heading}</h3>
              <p className="text-muted-foreground text-base leading-relaxed mb-7">{tab.desc}</p>
              <ul className="space-y-3 mb-8">
                {tab.bullets.map((b, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-foreground">
                    <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3 text-primary" />
                    </div>
                    {b}
                  </li>
                ))}
              </ul>
              <Link to="/auth" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
                Get started free <ChevronRight className="w-4 h-4" />
              </Link>
            </Reveal>
            <Reveal delay={150} className="flex justify-center lg:justify-end">
              <div className="w-full max-w-xs">
                {tab.mockup}
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ══ HOW IT WORKS ══ */}
      <section id="how-it-works" style={{ background: "linear-gradient(135deg, hsl(338 80% 97%) 0%, hsl(152 50% 95%) 100%)" }} className="py-20 border-y border-border">
        <div className="max-w-5xl mx-auto px-5 md:px-8">
          <Reveal className="text-center mb-14">
            <p className="text-xs font-bold tracking-widest text-primary uppercase mb-3">SIMPLE SETUP</p>
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-3">
              Start in <span className="gradient-text">60 seconds.</span>
            </h2>
            <p className="text-muted-foreground">No credit card, no setup hassle. Just two people and their story.</p>
          </Reveal>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connector line */}
            <div className="hidden md:block absolute top-10 left-[calc(16.67%+24px)] right-[calc(16.67%+24px)] h-0.5 bg-gradient-to-r from-pink-200 via-pink-300 to-green-200" />
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              return (
                <Reveal key={i} delay={i * 150} className="text-center">
                  <div className="relative inline-flex mb-5">
                    <div className="w-20 h-20 rounded-3xl bg-white shadow-lg border border-pink-100 flex items-center justify-center">
                      <Icon className="w-9 h-9 text-primary" strokeWidth={1.5} />
                    </div>
                    <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center shadow">{s.step}</span>
                  </div>
                  <h3 className="font-heading font-bold text-base text-foreground mb-2">{s.label}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
                </Reveal>
              );
            })}
          </div>

          <Reveal className="text-center mt-12">
            <Link to="/auth" className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-semibold px-7 py-3.5 rounded-xl hover:opacity-90 transition-all shadow-md">
              Begin your story <ArrowRight className="w-4 h-4" />
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ══ LOVE STORIES (testimonials) ══ */}
      <section id="love-stories" className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-5 md:px-8">
          <Reveal className="text-center mb-12">
            <p className="text-xs font-bold tracking-widest text-primary uppercase mb-3">REAL COUPLES</p>
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-3">
              Thousands of love stories.<br /><span className="gradient-text">All safe here.</span>
            </h2>
          </Reveal>
          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <Reveal key={i} delay={i * 100}>
                <div className="bg-white border border-border rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow hover:-translate-y-1 duration-300">
                  <div className="flex mb-4 gap-0.5">
                    {[...Array(5)].map((_, j) => <Star key={j} className="w-4 h-4 text-yellow-400 fill-yellow-400" />)}
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-5 flex-1">"{t.quote}"</p>
                  <div className="flex items-center gap-3 pt-4 border-t border-border">
                    <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center text-xl">{t.avatar}</div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.days}</p>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══ PRICING ══ */}
      <section id="pricing" className="py-20 border-y border-border" style={{ background: "hsl(338 50% 98%)" }}>
        <div className="max-w-5xl mx-auto px-5 md:px-8">
          <Reveal className="text-center mb-12">
            <p className="text-xs font-bold tracking-widest text-primary uppercase mb-3">SIMPLE PRICING</p>
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-3">
              Love shouldn't be <span className="gradient-text">expensive.</span>
            </h2>
            <p className="text-muted-foreground">Start free forever. Upgrade when your love grows.</p>
          </Reveal>

          <div className="grid md:grid-cols-3 gap-5 items-start">
            {PLANS.map((plan, i) => (
              <Reveal key={i} delay={i * 80}>
                <div className={`relative bg-white rounded-2xl border p-7 flex flex-col transition-all ${plan.popular ? "border-primary shadow-lg scale-[1.02] ring-2 ring-primary/20" : "border-border shadow-sm"}`}>
                  {plan.popular && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[11px] font-bold px-4 py-1 rounded-full whitespace-nowrap shadow">
                      Most popular
                    </div>
                  )}
                  <h3 className="font-heading font-bold text-base text-foreground mb-1">{plan.name}</h3>
                  <div className="flex items-baseline gap-1 mb-6">
                    <span className="font-heading text-4xl font-bold gradient-text">{plan.price}</span>
                    <span className="text-xs text-muted-foreground">{plan.period}</span>
                  </div>
                  <ul className="space-y-3 mb-7 flex-1">
                    {plan.features.map((f, j) => (
                      <li key={j} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                        <Check className="w-4 h-4 text-primary shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link to="/auth" className={`w-full py-3 rounded-xl font-semibold text-sm text-center transition-all ${plan.ctaClass}`}>
                    {plan.cta}
                  </Link>
                  {plan.popular && <p className="text-[10px] text-center text-muted-foreground mt-2.5">Secure payment · Cancel anytime</p>}
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FINAL CTA ══ */}
      <section className="py-24 bg-white">
        <div className="max-w-3xl mx-auto px-5 md:px-8 text-center">
          <Reveal>
            <div className="w-16 h-16 rounded-3xl bg-pink-100 border border-pink-200 flex items-center justify-center mx-auto mb-7">
              <Heart className="w-8 h-8 text-primary fill-primary/30" />
            </div>
            <h2 className="font-heading text-3xl md:text-5xl font-bold text-foreground mb-5 leading-tight">
              Your story deserves<br /><span className="gradient-text">a forever home.</span>
            </h2>
            <p className="text-muted-foreground text-base mb-9 max-w-xl mx-auto leading-relaxed">
              Join 50,000+ couples who chose OurVault to hold their most precious memories. Free to start, forever to keep.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/auth" className="group inline-flex items-center gap-2 bg-primary text-primary-foreground font-semibold px-8 py-4 rounded-xl hover:opacity-90 transition-all hover:scale-[1.02] shadow-md text-base">
                Begin your story
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-green-500" />
                No credit card · 100% private · Free forever tier
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ══ FOOTER ══ */}
      <footer className="bg-gray-50 border-t border-border">
        <div className="max-w-6xl mx-auto px-5 md:px-8 py-10 flex flex-col md:flex-row items-center justify-between gap-5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-primary flex items-center justify-center">
              <LockKeyhole className="w-3.5 h-3.5 text-primary-foreground" strokeWidth={2} />
            </div>
            <span className="font-heading font-bold text-foreground">OurVault</span>
          </div>
          <p className="text-xs text-muted-foreground text-center">
            Made with 💕 for couples everywhere · Your memories are always private and secure
          </p>
          <div className="flex items-center gap-5 text-xs text-muted-foreground">
            <Link to="/auth" className="hover:text-foreground transition-colors">Sign In</Link>
            <span>·</span>
            <Link to="/auth" className="hover:text-foreground transition-colors">Get Started</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
