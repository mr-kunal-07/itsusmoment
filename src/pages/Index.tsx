import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Heart, ArrowRight, Check, Sparkles, LockKeyhole,
  GalleryVerticalEnd, MessagesSquare, CalendarHeart,
  UserRoundCheck, HeartHandshake, ImagePlay,
  ShieldCheck, Star, Menu, X as XIcon, ChevronRight,
  Camera, MessageCircle, Calendar
} from "lucide-react";

/* ─── in-view hook ─── */
function useInView(threshold = 0.12) {
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
    <div ref={ref} className={`transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"} ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

/* ─── Data ─── */
const FEATURES = [
  {
    id: "vault",
    tab: "Memory Vault",
    icon: Camera,
    tag: "SHARED MEMORIES",
    heading: "Store every beautiful moment together",
    desc: "Upload photos and videos, organize them into private folders, and build a timeline that's just yours. No algorithm, no strangers — only the two of you.",
    bullets: ["Private folders & albums", "Star your favourites", "Love notes on every photo", "Shared access for both partners"],
    mockup: (
      <div className="bg-white rounded-3xl shadow-2xl border border-[#e8f5e9] overflow-hidden">
        <div className="px-4 py-3 bg-[#f8fdf8] border-b border-[#e8f5e9] flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-[#e91e8c] flex items-center justify-center">
            <LockKeyhole className="w-3.5 h-3.5 text-white" strokeWidth={2} />
          </div>
          <span className="text-xs font-bold text-gray-800">Our Memories</span>
          <span className="ml-auto text-[10px] bg-[#e8f5e9] text-[#2e7d32] px-2 py-0.5 rounded-full font-medium">47 photos</span>
        </div>
        <div className="p-3 bg-white">
          <div className="grid grid-cols-3 gap-1.5 mb-3">
            {[
              { bg: "#fce4ec", emoji: "🌅", label: "Goa Trip" },
              { bg: "#f8bbd0", emoji: "🎂", label: "Birthday" },
              { bg: "#fce4ec", emoji: "🌹", label: "Valentine" },
              { bg: "#e8f5e9", emoji: "✈️", label: "Mumbai" },
              { bg: "#f1f8e9", emoji: "🍽️", label: "Dinner" },
              { bg: "#fce4ec", emoji: "💕", label: "1 Year!" },
            ].map((t, i) => (
              <div key={i} className="rounded-xl aspect-square flex flex-col items-center justify-center gap-0.5" style={{ background: t.bg }}>
                <span className="text-xl">{t.emoji}</span>
                <span className="text-[8px] font-medium text-gray-500">{t.label}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-[#fce4ec] rounded-xl px-3 py-2 text-[11px] text-[#e91e8c]">Add a love note…</div>
            <button className="w-8 h-8 rounded-xl bg-[#e91e8c] flex items-center justify-center shrink-0">
              <Heart className="w-3.5 h-3.5 text-white fill-white" />
            </button>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "chat",
    tab: "Private Chat",
    icon: MessageCircle,
    tag: "JUST THE TWO OF YOU",
    heading: "A private space only you two can see",
    desc: "Chat freely with no one watching. Send voice messages, react with emojis — your very own corner of the internet.",
    bullets: ["End-to-end private messages", "Voice messages", "Emoji reactions", "Reply threads & read receipts"],
    mockup: (
      <div className="bg-white rounded-3xl shadow-2xl border border-[#fce4ec] overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-[#fce4ec] bg-[#fdf8fa]">
          <div className="w-8 h-8 rounded-full bg-[#fce4ec] flex items-center justify-center text-base">💕</div>
          <div><p className="text-xs font-bold text-gray-800">Priya</p><p className="text-[10px] text-[#4caf50]">● Online</p></div>
        </div>
        <div className="px-3 py-3 space-y-2 bg-white min-h-[150px]">
          {[
            { mine: false, msg: "Remember our first date? 🥹" },
            { mine: true, msg: "How could I forget! 😄" },
            { mine: false, msg: "I uploaded the photos 💕" },
            { mine: true, msg: "Adding love notes now 🥰" },
          ].map((m, i) => (
            <div key={i} className={`flex ${m.mine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[78%] px-3 py-2 rounded-2xl text-xs ${m.mine ? "text-white rounded-br-sm" : "bg-gray-100 text-gray-700 rounded-bl-sm"}`} style={m.mine ? { background: "#e91e8c" } : {}}>
                {m.msg}
              </div>
            </div>
          ))}
        </div>
        <div className="px-3 py-2.5 border-t border-[#fce4ec] flex gap-2">
          <div className="flex-1 bg-[#fce4ec] rounded-xl px-3 py-2 text-[11px] text-[#e91e8c]">Type a message…</div>
          <button className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: "#e91e8c" }}><ArrowRight className="w-3.5 h-3.5 text-white" /></button>
        </div>
      </div>
    ),
  },
  {
    id: "milestones",
    tab: "Milestones",
    icon: Calendar,
    tag: "YOUR LOVE TIMELINE",
    heading: "Never forget a special date again",
    desc: "Log your first date, first trip — every milestone lives on your personal love timeline. Get reminders so no anniversary slips by.",
    bullets: ["Custom milestone types", "Anniversary reminders", "Attach photos to dates", "Beautiful timeline view"],
    mockup: (
      <div className="bg-white rounded-3xl shadow-2xl border border-[#e8f5e9] overflow-hidden">
        <div className="px-4 py-3 bg-[#f8fdf8] border-b border-[#e8f5e9] flex items-center gap-2">
          <CalendarHeart className="w-4 h-4 text-[#2e7d32]" />
          <span className="text-xs font-bold text-gray-800">Your Love Timeline</span>
        </div>
        <div className="p-3 space-y-2">
          {[
            { emoji: "💑", label: "First Date", date: "Dec 2, 2024", bg: "#fce4ec", border: "#f48fb1" },
            { emoji: "💌", label: "First 'I Love You'", date: "Jan 14, 2025", bg: "#fce4ec", border: "#f48fb1" },
            { emoji: "✈️", label: "Goa Trip", date: "Feb 14, 2025", bg: "#e8f5e9", border: "#a5d6a7" },
            { emoji: "🎂", label: "1 Year Anniversary", date: "Dec 2, 2025", bg: "#e8f5e9", border: "#a5d6a7" },
          ].map((m, i) => (
            <div key={i} className="flex items-center gap-2.5 px-3 py-2 rounded-xl border" style={{ background: m.bg, borderColor: m.border }}>
              <span className="text-base">{m.emoji}</span>
              <p className="flex-1 text-xs font-medium text-gray-800">{m.label}</p>
              <span className="text-[9px] text-gray-500">{m.date}</span>
            </div>
          ))}
        </div>
      </div>
    ),
  },
];

const PLANS = [
  { name: "Free", price: "₹0", period: "/month", cta: "Start for free", popular: false, features: ["50 uploads/month", "Shared memory vault", "Milestone calendar", "Private chat"] },
  { name: "Dating", price: "₹9", period: "/month", cta: "Get Dating", popular: true, features: ["200 uploads/month", "Everything in Free", "Emoji reactions", "Love notes", "Activity feed"] },
  { name: "Soulmate", price: "₹99", period: "/month", cta: "Become Soulmates", popular: false, features: ["Unlimited uploads", "Everything in Dating", "Voice messages", "Slideshow mode", "Priority support"] },
];

const TESTIMONIALS = [
  { quote: "We live in different cities. OurVault is the only app where we feel close. The voice messages are magical.", name: "Priya & Arjun", days: "487 days together", avatar: "💑" },
  { quote: "Every trip, every date, every note in one beautiful private place. We check it every single day.", name: "Sneha & Rahul", days: "1,204 days together", avatar: "🌹" },
  { quote: "I added a love note to our first photo and she cried happy tears. Best ₹9 I've ever spent.", name: "Rohan", days: "Dating plan", avatar: "💌" },
];

const STEPS = [
  { step: "01", icon: UserRoundCheck, label: "Create your account", desc: "Sign up free in under a minute — no credit card needed." },
  { step: "02", icon: HeartHandshake, label: "Invite your partner", desc: "Share a unique link. They join and you're connected instantly." },
  { step: "03", icon: ImagePlay, label: "Build memories together", desc: "Upload photos, chat, add milestones. Your love story in one place." },
];

/* ════ MAIN ════ */
export default function Index() {
  const [scrollY, setScrollY] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const tab = FEATURES[activeTab];

  return (
    <div className="landing min-h-screen bg-white text-gray-900 font-sans overflow-x-hidden">

      {/* ══ NAV — Brevo style: white bg, logo left, links center, two CTAs right ══ */}
      <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${scrollY > 30 ? "bg-white shadow-sm border-b border-gray-100" : "bg-white"}`}>
        <div className="max-w-6xl mx-auto px-5 md:px-8 h-16 flex items-center justify-between gap-6">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "#e91e8c" }}>
              <Heart className="w-4 h-4 text-white fill-white" />
            </div>
            <span className="font-heading font-extrabold text-lg text-gray-900 tracking-tight">OurVault</span>
          </Link>

          {/* Center links */}
          <div className="hidden md:flex items-center gap-7 text-sm text-gray-500 font-medium flex-1 justify-center">
            <a href="#features" className="hover:text-gray-900 transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-gray-900 transition-colors">How it works</a>
            <a href="#pricing" className="hover:text-gray-900 transition-colors">Pricing</a>
            <a href="#love-stories" className="hover:text-gray-900 transition-colors">Stories</a>
          </div>

          {/* Right CTAs */}
          <div className="hidden md:flex items-center gap-3 shrink-0">
            <Link to="/auth" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors px-3 py-2">Log in</Link>
            <Link to="/auth" className="text-sm font-semibold text-white px-5 py-2.5 rounded-xl hover:opacity-90 transition-all shadow-sm" style={{ background: "#e91e8c" }}>
              Sign up free
            </Link>
          </div>

          <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden p-2 rounded-lg hover:bg-gray-100">
            {menuOpen ? <XIcon className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {menuOpen && (
          <div className="md:hidden bg-white border-b border-gray-100 px-5 pb-5 flex flex-col gap-2 shadow-lg">
            {["features", "how-it-works", "pricing", "love-stories"].map((h) => (
              <a key={h} href={`#${h}`} onClick={() => setMenuOpen(false)} className="text-sm font-medium text-gray-500 hover:text-gray-900 py-2.5 capitalize border-b border-gray-50">
                {h.replace(/-/g, " ")}
              </a>
            ))}
            <Link to="/auth" onClick={() => setMenuOpen(false)} className="text-sm font-semibold text-white px-5 py-3 rounded-xl text-center mt-2" style={{ background: "#e91e8c" }}>
              Sign up free
            </Link>
          </div>
        )}
      </nav>

      {/* ══ HERO — Brevo style: mint-green bg, bold dark headline left, app mockup right ══ */}
      <section className="pt-16" style={{ background: "#c8f0d0" }}>
        <div className="max-w-6xl mx-auto px-5 md:px-8 pt-14 pb-0">
          <div className="grid lg:grid-cols-2 gap-10 items-end">

            {/* Left: text */}
            <div className="pb-16 lg:pb-20">
              <div className="inline-flex items-center gap-2 bg-white/70 border border-white/80 px-4 py-1.5 rounded-full text-xs font-semibold text-gray-700 mb-6 shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-[#e91e8c]" />
                50,000+ couples already joined
              </div>

              <h1 className="font-heading font-extrabold text-[42px] sm:text-5xl lg:text-[56px] leading-[1.08] tracking-tight text-gray-900 mb-5">
                Keep Every<br />
                <span style={{ color: "#e91e8c" }}>Memory</span> Together.<br />
                <span style={{ color: "#2e7d32" }}>Forever.</span>
              </h1>

              <p className="text-gray-600 text-lg leading-relaxed mb-8 max-w-md">
                A private vault for couples — store photos, chat privately, send voice messages, and celebrate every milestone. Just the two of you.
              </p>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-8">
                <Link to="/auth" className="inline-flex items-center gap-2 text-white font-bold px-7 py-3.5 rounded-xl hover:opacity-90 transition-all hover:scale-[1.02] shadow-md text-base" style={{ background: "#1a1a2e" }}>
                  Start for free
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <a href="#features" className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                  See how it works <ChevronRight className="w-4 h-4" />
                </a>
              </div>

              <div className="flex flex-wrap items-center gap-5 text-xs text-gray-500 font-medium">
                <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-[#4caf50]" /> No credit card</span>
                <span className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-[#4caf50]" /> 100% private</span>
                <span className="flex items-center gap-1.5"><Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" /> 4.9 rating</span>
              </div>
            </div>

            {/* Right: app mockup floating up */}
            <div className="hidden lg:flex justify-center items-end">
              <div className="relative w-full max-w-[360px]">
                {/* Main card */}
                <div className="bg-white rounded-t-3xl shadow-2xl overflow-hidden border border-gray-100">
                  {/* Top bar */}
                  <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-white">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ background: "#e91e8c" }}>
                        <Heart className="w-3.5 h-3.5 text-white fill-white" />
                      </div>
                      <span className="font-heading font-bold text-sm text-gray-900">OurVault</span>
                    </div>
                    <span className="text-[10px] px-2.5 py-1 rounded-full font-semibold" style={{ background: "#e8f5e9", color: "#2e7d32" }}>● Live</span>
                  </div>

                  {/* Memory grid */}
                  <div className="p-4 bg-white">
                    <p className="text-xs font-semibold text-gray-500 mb-3">📸 Our Memories · 47 photos</p>
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      {[
                        { bg: "#fce4ec", emoji: "🌅" }, { bg: "#f8bbd0", emoji: "🎂" },
                        { bg: "#fce4ec", emoji: "🌹" }, { bg: "#e8f5e9", emoji: "✈️" },
                        { bg: "#f1f8e9", emoji: "🍽️" }, { bg: "#fce4ec", emoji: "💕" },
                      ].map((t, i) => (
                        <div key={i} className="rounded-2xl aspect-square flex items-center justify-center text-2xl shadow-sm" style={{ background: t.bg }}>{t.emoji}</div>
                      ))}
                    </div>

                    {/* Chat preview */}
                    <div className="space-y-2 border-t border-gray-50 pt-3">
                      <div className="flex justify-start"><div className="bg-gray-100 rounded-2xl rounded-bl-sm px-3 py-2 text-xs text-gray-700">Remember our first date? 🥹</div></div>
                      <div className="flex justify-end"><div className="text-white rounded-2xl rounded-br-sm px-3 py-2 text-xs" style={{ background: "#e91e8c" }}>How could I forget! 😄</div></div>
                    </div>
                  </div>
                </div>

                {/* Floating badge: days together */}
                <div className="absolute -left-8 top-1/3 bg-white rounded-2xl shadow-xl border border-gray-100 px-4 py-2.5 flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-base" style={{ background: "#e8f5e9" }}>💑</div>
                  <div>
                    <p className="text-xs font-bold text-gray-800">487 days</p>
                    <p className="text-[10px] text-gray-400" style={{ color: "#4caf50" }}>together 💚</p>
                  </div>
                </div>

                {/* Floating badge: love note */}
                <div className="absolute -right-6 top-12 bg-white rounded-2xl shadow-xl border border-gray-100 px-3 py-2.5 flex items-center gap-2">
                  <span className="text-lg">💌</span>
                  <div>
                    <p className="text-[10px] font-semibold text-gray-700">New love note</p>
                    <p className="text-[9px]" style={{ color: "#e91e8c" }}>from Priya ✨</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ SOCIAL PROOF STRIP ══ */}
      <Reveal>
        <div className="bg-white border-b border-gray-100 py-7">
          <div className="max-w-5xl mx-auto px-5 md:px-8">
            <p className="text-center text-sm text-gray-400 font-medium mb-6">Trusted by couples all over India and beyond</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              {[
                { val: "50K+", label: "Couples using OurVault" },
                { val: "2M+", label: "Memories safely stored" },
                { val: "4.9 ★", label: "Average rating" },
                { val: "100%", label: "Private — always" },
              ].map((s, i) => (
                <div key={i}>
                  <div className="font-heading text-2xl md:text-3xl font-extrabold mb-1" style={{ color: i % 2 === 0 ? "#e91e8c" : "#2e7d32" }}>{s.val}</div>
                  <div className="text-xs text-gray-500">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Reveal>

      {/* ══ FEATURES — text left + mockup right, tabbed ══ */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-5 md:px-8">

          <Reveal className="text-center mb-12">
            <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: "#e91e8c" }}>EVERYTHING YOU NEED</p>
            <h2 className="font-heading text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">
              Built for couples,<br />
              <span style={{ color: "#e91e8c" }}>not just storage.</span>
            </h2>
            <p className="text-gray-500 text-base max-w-lg mx-auto">Every feature crafted around intimacy, privacy, and the way real couples live.</p>
          </Reveal>

          {/* Tab pills — Brevo style */}
          <div className="flex flex-wrap justify-center gap-2 mb-12">
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <button
                  key={f.id}
                  onClick={() => setActiveTab(i)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all border ${
                    activeTab === i
                      ? "text-white border-transparent shadow-md"
                      : "bg-white border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-800"
                  }`}
                  style={activeTab === i ? { background: "#e91e8c", borderColor: "#e91e8c" } : {}}
                >
                  <Icon className="w-4 h-4" />
                  {f.tab}
                </button>
              );
            })}
          </div>

          {/* Content: text left, mockup right */}
          <div className="grid lg:grid-cols-2 gap-14 items-center">
            <Reveal delay={50}>
              <p className="text-[11px] font-bold tracking-widest uppercase mb-3" style={{ color: "#e91e8c" }}>{tab.tag}</p>
              <h3 className="font-heading text-2xl md:text-3xl font-extrabold text-gray-900 mb-4 leading-snug">{tab.heading}</h3>
              <p className="text-gray-500 text-base leading-relaxed mb-7">{tab.desc}</p>
              <ul className="space-y-3 mb-8">
                {tab.bullets.map((b, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-gray-700 font-medium">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ background: "#e8f5e9" }}>
                      <Check className="w-3 h-3" style={{ color: "#2e7d32" }} />
                    </div>
                    {b}
                  </li>
                ))}
              </ul>
              <Link to="/auth" className="inline-flex items-center gap-1.5 text-sm font-semibold hover:underline" style={{ color: "#e91e8c" }}>
                Get started free <ChevronRight className="w-4 h-4" />
              </Link>
            </Reveal>
            <Reveal delay={150} className="flex justify-center lg:justify-end">
              <div className="w-full max-w-xs">{tab.mockup}</div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ══ HOW IT WORKS — light mint bg ══ */}
      <section id="how-it-works" className="py-20 border-y border-gray-100" style={{ background: "#f0fdf4" }}>
        <div className="max-w-5xl mx-auto px-5 md:px-8">
          <Reveal className="text-center mb-14">
            <p className="text-[11px] font-bold tracking-widest uppercase mb-3" style={{ color: "#2e7d32" }}>SIMPLE SETUP</p>
            <h2 className="font-heading text-3xl md:text-4xl font-extrabold text-gray-900 mb-3">
              Start in <span style={{ color: "#2e7d32" }}>3 simple steps.</span>
            </h2>
            <p className="text-gray-500 text-base">No credit card, no setup hassle. Just two people and their story.</p>
          </Reveal>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connecting line */}
            <div className="hidden md:block absolute top-10 left-[calc(16.67%+28px)] right-[calc(16.67%+28px)] h-0.5" style={{ background: "linear-gradient(to right, #f48fb1, #a5d6a7)" }} />

            {STEPS.map((s, i) => {
              const Icon = s.icon;
              return (
                <Reveal key={i} delay={i * 120} className="text-center">
                  <div className="relative inline-flex mb-5">
                    <div className="w-20 h-20 rounded-3xl bg-white shadow-md border border-gray-100 flex items-center justify-center">
                      <Icon className="w-9 h-9" style={{ color: i === 2 ? "#2e7d32" : "#e91e8c" }} strokeWidth={1.5} />
                    </div>
                    <span className="absolute -top-2.5 -right-2.5 w-6 h-6 rounded-full text-white text-[10px] font-extrabold flex items-center justify-center shadow-sm" style={{ background: "#1a1a2e" }}>{s.step}</span>
                  </div>
                  <h3 className="font-heading font-bold text-base text-gray-900 mb-2">{s.label}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
                </Reveal>
              );
            })}
          </div>

          <Reveal className="text-center mt-12">
            <Link to="/auth" className="inline-flex items-center gap-2 text-white font-bold px-8 py-3.5 rounded-xl hover:opacity-90 transition-all shadow-md" style={{ background: "#1a1a2e" }}>
              Begin your story <ArrowRight className="w-4 h-4" />
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ══ TESTIMONIALS ══ */}
      <section id="love-stories" className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-5 md:px-8">
          <Reveal className="text-center mb-12">
            <p className="text-[11px] font-bold tracking-widest uppercase mb-3" style={{ color: "#e91e8c" }}>REAL COUPLES</p>
            <h2 className="font-heading text-3xl md:text-4xl font-extrabold text-gray-900 mb-3">
              Thousands of love stories.<br />
              <span style={{ color: "#e91e8c" }}>All safe here.</span>
            </h2>
          </Reveal>

          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <Reveal key={i} delay={i * 100}>
                <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all hover:-translate-y-1 duration-300">
                  <div className="flex mb-4 gap-0.5">
                    {[...Array(5)].map((_, j) => <Star key={j} className="w-4 h-4 text-yellow-400 fill-yellow-400" />)}
                  </div>
                  <p className="text-sm text-gray-500 leading-relaxed mb-5">"{t.quote}"</p>
                  <div className="flex items-center gap-3 pt-4 border-t border-gray-50">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl" style={{ background: "#fce4ec" }}>{t.avatar}</div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">{t.name}</p>
                      <p className="text-xs text-gray-400">{t.days}</p>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══ PRICING ══ */}
      <section id="pricing" className="py-20 border-y border-gray-100" style={{ background: "#fdf2f8" }}>
        <div className="max-w-5xl mx-auto px-5 md:px-8">
          <Reveal className="text-center mb-12">
            <p className="text-[11px] font-bold tracking-widest uppercase mb-3" style={{ color: "#e91e8c" }}>SIMPLE PRICING</p>
            <h2 className="font-heading text-3xl md:text-4xl font-extrabold text-gray-900 mb-3">
              Love shouldn't be <span style={{ color: "#e91e8c" }}>expensive.</span>
            </h2>
            <p className="text-gray-500">Start free forever. Upgrade when your love grows.</p>
          </Reveal>

          <div className="grid md:grid-cols-3 gap-5 items-start">
            {PLANS.map((plan, i) => (
              <Reveal key={i} delay={i * 80}>
                <div className={`relative bg-white rounded-2xl p-7 flex flex-col transition-all ${
                  plan.popular
                    ? "shadow-xl scale-[1.03] border-2"
                    : "border border-gray-100 shadow-sm"
                }`} style={plan.popular ? { borderColor: "#e91e8c" } : {}}>
                  {plan.popular && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-white text-[11px] font-extrabold px-4 py-1 rounded-full whitespace-nowrap shadow" style={{ background: "#e91e8c" }}>
                      ✦ Most popular
                    </div>
                  )}
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">{plan.name}</p>
                  <div className="flex items-baseline gap-1 mb-6">
                    <span className="font-heading text-4xl font-extrabold text-gray-900">{plan.price}</span>
                    <span className="text-xs text-gray-400">{plan.period}</span>
                  </div>
                  <ul className="space-y-3 mb-7 flex-1">
                    {plan.features.map((f, j) => (
                      <li key={j} className="flex items-center gap-2.5 text-sm text-gray-600">
                        <div className="w-4 h-4 rounded-full flex items-center justify-center shrink-0" style={{ background: "#e8f5e9" }}>
                          <Check className="w-2.5 h-2.5" style={{ color: "#2e7d32" }} />
                        </div>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link
                    to="/auth"
                    className="w-full py-3 rounded-xl font-bold text-sm text-center transition-all block"
                    style={plan.popular
                      ? { background: "#e91e8c", color: "#fff" }
                      : { background: "#1a1a2e", color: "#fff" }
                    }
                  >
                    {plan.cta}
                  </Link>
                  {plan.popular && <p className="text-[10px] text-center text-gray-400 mt-2.5">Secure payment · Cancel anytime</p>}
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FINAL CTA — mint green bg like Brevo ══ */}
      <section className="py-24" style={{ background: "#c8f0d0" }}>
        <div className="max-w-3xl mx-auto px-5 md:px-8 text-center">
          <Reveal>
            <div className="w-16 h-16 rounded-3xl bg-white border border-white/80 flex items-center justify-center mx-auto mb-7 shadow-sm">
              <Heart className="w-8 h-8 fill-[#e91e8c]" style={{ color: "#e91e8c" }} />
            </div>
            <h2 className="font-heading text-3xl md:text-5xl font-extrabold text-gray-900 mb-5 leading-tight">
              Your story deserves<br />
              <span style={{ color: "#e91e8c" }}>a forever home.</span>
            </h2>
            <p className="text-gray-600 text-base mb-9 max-w-xl mx-auto leading-relaxed">
              Join 50,000+ couples who chose OurVault to hold their most precious memories. Free to start, forever to keep.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/auth" className="inline-flex items-center gap-2 text-white font-bold px-8 py-4 rounded-xl hover:opacity-90 transition-all hover:scale-[1.02] shadow-md text-base" style={{ background: "#1a1a2e" }}>
                Begin your story
                <ArrowRight className="w-4 h-4" />
              </Link>
              <span className="text-sm text-gray-500 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#4caf50]" />
                No credit card · 100% private · Free forever tier
              </span>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ══ FOOTER ══ */}
      <footer className="bg-white border-t border-gray-100">
        <div className="max-w-6xl mx-auto px-5 md:px-8 py-10 flex flex-col md:flex-row items-center justify-between gap-5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ background: "#e91e8c" }}>
              <Heart className="w-3.5 h-3.5 text-white fill-white" />
            </div>
            <span className="font-heading font-extrabold text-gray-900">OurVault</span>
          </div>
          <p className="text-xs text-gray-400 text-center">
            Made with 💕 for couples everywhere · Your memories are always private and secure
          </p>
          <div className="flex items-center gap-5 text-xs text-gray-400">
            <Link to="/auth" className="hover:text-gray-700 transition-colors">Sign In</Link>
            <span>·</span>
            <Link to="/auth" className="hover:text-gray-700 transition-colors">Get Started</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
