import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Heart, GalleryVerticalEnd, MessagesSquare, AudioWaveform, CalendarHeart,
  ArrowRight, Check, ChevronDown, Sparkles, ImagePlay, Gift,
  ShieldCheck, UserPlus, Infinity, PlayCircle, Quote, LockKeyhole,
  HeartHandshake, Clapperboard, Zap, Star, Film, Gem
} from "lucide-react";
import heroBg from "@/assets/hero-couple.jpg";

/* ─── in-view hook ─── */
function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

/* ─── Animated section wrapper ─── */
function FadeIn({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const { ref, visible } = useInView(0.1);
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

/* ─── Feature card (extracted so hooks run at component level) ─── */
function FeatureCard({ icon: Icon, title, desc, tag, delay }: { icon: React.ElementType; title: string; desc: string; tag: string; delay: number }) {
  const { ref, visible } = useInView(0.1);
  return (
    <div
      ref={ref}
      className={`premium-card p-6 group hover:border-primary/30 transition-all duration-500 hover:-translate-y-1 hover:shadow-glow ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center group-hover:bg-primary/10 transition-colors">
          <Icon className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
        </div>
        <span className="text-[10px] font-medium text-muted-foreground border border-border px-2 py-0.5 rounded-full">{tag}</span>
      </div>
      <h3 className="font-heading font-semibold text-base mb-2 text-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
    </div>
  );
}

/* ─── Step card ─── */
function StepCard({ step, icon: Icon, title, desc, delay }: { step: string; icon: React.ElementType; title: string; desc: string; delay: number }) {
  const { ref, visible } = useInView(0.1);
  return (
    <div
      ref={ref}
      className={`text-center transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="relative inline-flex mb-6">
        <div className="w-16 h-16 rounded-2xl bg-card border border-border flex items-center justify-center">
          <Icon className="w-7 h-7 text-primary" />
        </div>
        <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center font-heading">{step}</span>
      </div>
      <h3 className="font-heading font-semibold text-base mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
    </div>
  );
}

/* ─── Testimonial card ─── */
function TestimonialCard({ quote, name, days, avatar, delay }: { quote: string; name: string; days: string; avatar: string; delay: number }) {
  const { ref, visible } = useInView(0.1);
  return (
    <div
      ref={ref}
      className={`premium-card p-7 flex flex-col gap-5 transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <Quote className="w-6 h-6 text-primary/40" />
      <p className="text-foreground leading-relaxed text-sm flex-1">"{quote}"</p>
      <div className="flex items-center gap-3 pt-2 border-t border-border">
        <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-xl">{avatar}</div>
        <div>
          <div className="text-sm font-medium text-foreground">{name}</div>
          <div className="text-xs text-muted-foreground">{days}</div>
        </div>
      </div>
    </div>
  );
}

/* ─── Pricing card ─── */
function PricingCard({ plan, delay }: { plan: typeof PLANS[0]; delay: number }) {
  const { ref, visible } = useInView(0.1);
  return (
    <div
      ref={ref}
      className={`relative premium-card p-7 flex flex-col transition-all duration-700 ${plan.popular ? "ring-1 ring-primary/40 scale-[1.02]" : ""} ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {plan.popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wide whitespace-nowrap">
          Most Popular
        </div>
      )}
      <div className="mb-6">
        <h3 className="font-heading font-semibold text-base text-foreground mb-1">{plan.name}</h3>
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-bold font-heading gradient-text">{plan.price}</span>
          {plan.price !== "Free" && <span className="text-sm text-muted-foreground">/mo</span>}
        </div>
        {plan.price === "Free" && <span className="text-xs text-muted-foreground">Forever free</span>}
      </div>
      <ul className="space-y-3 mb-8 flex-1">
        {plan.features.map((feat, j) => (
          <li key={j} className="flex items-center gap-2.5 text-sm text-muted-foreground">
            <Check className="w-4 h-4 text-primary flex-shrink-0" />
            {feat}
          </li>
        ))}
      </ul>
      <Link
        to="/auth"
        className={`w-full py-3 rounded-xl font-semibold text-sm text-center transition-all ${plan.ctaStyle}`}
      >
        {plan.cta}
      </Link>
    </div>
  );
}

/* ─── Data ─── */
const MEMORY_CARDS = [
  { emoji: "📸", label: "First Date", sub: "Dec 2, 2024" },
  { emoji: "🌅", label: "Goa Trip", sub: "Feb 14, 2025" },
  { emoji: "💌", label: "Love Note", sub: "Yesterday" },
  { emoji: "🎂", label: "1 Year!", sub: "Dec 2, 2025" },
];

const FEATURES: { icon: React.ElementType; title: string; desc: string; tag: string }[] = [
  { icon: GalleryVerticalEnd, title: "Shared Memory Vault", desc: "Upload photos & videos together — private, beautiful, forever yours. No algorithm, no ads, no noise.", tag: "Core" },
  { icon: MessagesSquare, title: "Private Chat", desc: "A dedicated space just for the two of you. React with emojis, reply to messages, feel every word.", tag: "Connect" },
  { icon: AudioWaveform, title: "Voice Messages", desc: "Send your voice, your laugh, your 'I miss you' — audio messages that feel like a warm hug.", tag: "Soulmate" },
  { icon: CalendarHeart, title: "Milestones & Anniversaries", desc: "Never forget a special date. Your timeline of firsts — first kiss, first trip, first everything.", tag: "Core" },
  { icon: HeartHandshake, title: "Love Notes", desc: "Attach a handwritten note to any photo. Words that stay forever, tied to your best memories.", tag: "Connect" },
  { icon: Clapperboard, title: "Slideshow & Highlights", desc: "Relive your journey with a cinematic slideshow of your starred memories. Pure magic.", tag: "Core" },
];

const STEPS: { step: string; icon: React.ElementType; title: string; desc: string }[] = [
  { step: "01", icon: UserPlus, title: "Create your account", desc: "Sign up free — no credit card required. Takes under a minute." },
  { step: "02", icon: HeartHandshake, title: "Invite your partner", desc: "Share a unique link. They join, you're linked — your private world is live." },
  { step: "03", icon: ImagePlay, title: "Start building memories", desc: "Upload photos, chat, add milestones. Your story, finally in one place." },
];

const TESTIMONIALS = [
  { quote: "We live in different cities. OurVault is the only app where we actually feel close. The voice messages make it real.", name: "Priya & Arjun", days: "Together 487 days", avatar: "💑" },
  { quote: "The memory vault is incredible. Every trip, every date, every note — all in one beautiful place just for us.", name: "Sneha & Rahul", days: "Together 1,204 days", avatar: "🌹" },
  { quote: "I uploaded our first photo on the app and added a love note. She cried. Best ₹9 I've ever spent.", name: "Rohan", days: "Dating plan", avatar: "💌" },
];

const PLANS = [
  {
    name: "Single",
    price: "Free",
    ctaStyle: "bg-secondary text-foreground hover:bg-accent",
    cta: "Start Free",
    popular: false,
    features: ["50 uploads / month", "Shared memory vault", "Milestone calendar", "Private chat"],
  },
  {
    name: "Dating",
    price: "₹9",
    ctaStyle: "bg-primary text-primary-foreground hover:opacity-90",
    cta: "Get Dating",
    popular: true,
    features: ["200 uploads / month", "Everything in Single", "Emoji reactions", "Love notes", "Activity feed"],
  },
  {
    name: "Soulmate",
    price: "₹99",
    ctaStyle: "bg-primary text-primary-foreground hover:opacity-90",
    cta: "Become Soulmates",
    popular: false,
    features: ["Unlimited uploads", "Everything in Dating", "Voice messages", "Slideshow mode", "Priority support"],
  },
];

const STATS = [
  { value: "50K+", label: "Couples" },
  { value: "2M+", label: "Memories saved" },
  { value: "4.9★", label: "Rating" },
  { value: "∞", label: "Love stored" },
];

/* ─── GALLERY TILES ─── */
const GALLERY_TILES = [
  { bg: "hsl(30 30% 20%)", emoji: "🌅", label: "Goa Trip" },
  { bg: "hsl(220 20% 18%)", emoji: "🎂", label: "Birthday" },
  { bg: "hsl(10 25% 18%)", emoji: "🌹", label: "Valentine's" },
  { bg: "hsl(180 20% 15%)", emoji: "✈️", label: "Mumbai" },
  { bg: "hsl(270 15% 20%)", emoji: "🍽️", label: "Candle Dinner" },
  { bg: "hsl(45 25% 17%)", emoji: "🌙", label: "Our Night" },
  { bg: "hsl(120 15% 17%)", emoji: "🏞️", label: "Trek" },
  { bg: "hsl(200 20% 18%)", emoji: "☕", label: "Café Morning" },
  { bg: "hsl(350 20% 20%)", emoji: "💕", label: "1 Year" },
];

/* ─── MOCK CHAT MESSAGES ─── */
const CHAT_MSGS = [
  { mine: false, msg: "Remember our first date? 🥹", time: "2:14 PM" },
  { mine: true, msg: "How could I forget! I was so nervous 😄", time: "2:15 PM" },
  { mine: false, msg: "You hid it well 💕 I uploaded the photos btw", time: "2:15 PM" },
  { mine: true, msg: "🥰 going to add a love note to each one", time: "2:16 PM" },
];

/* ══════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════ */
export default function Index() {
  const [scrollY, setScrollY] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden font-sans">

      {/* ══ NAV ══ */}
      <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${scrollY > 40 ? "bg-background/95 backdrop-blur-xl border-b border-border shadow-card" : "bg-transparent"}`}>
        <div className="max-w-7xl mx-auto px-5 md:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shadow-glow">
              <LockKeyhole className="w-4 h-4 text-primary-foreground" strokeWidth={2} />
            </div>
            <span className="font-heading font-semibold text-lg text-foreground">OurVault</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
            {(["#features","#how-it-works","#pricing","#testimonials"] as const).map((href, i) => (
              <a key={i} href={href} className="hover:text-foreground transition-colors capitalize">
                {href.replace("#","").replace(/-/g," ")}
              </a>
            ))}
          </div>
          <div className="hidden md:flex items-center gap-3">
            <Link to="/auth" className="text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5">Sign In</Link>
            <Link to="/auth" className="text-sm bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:opacity-90 transition-opacity">
              Get Started Free
            </Link>
          </div>
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 rounded-lg hover:bg-accent transition-colors">
            <div className="w-5 h-0.5 bg-foreground mb-1 transition-all" style={{ transform: mobileMenuOpen ? "rotate(45deg) translateY(6px)" : "none" }} />
            <div className="w-5 h-0.5 bg-foreground mb-1 transition-all" style={{ opacity: mobileMenuOpen ? 0 : 1 }} />
            <div className="w-5 h-0.5 bg-foreground transition-all" style={{ transform: mobileMenuOpen ? "rotate(-45deg) translateY(-6px)" : "none" }} />
          </button>
        </div>
        {mobileMenuOpen && (
          <div className="md:hidden bg-background/98 backdrop-blur-xl border-b border-border px-5 pb-5 flex flex-col gap-3">
            {["#features","#pricing","#testimonials"].map((h, i) => (
              <a key={i} href={h} onClick={() => setMobileMenuOpen(false)} className="text-sm text-muted-foreground hover:text-foreground py-2 capitalize">{h.replace("#","")}</a>
            ))}
            <Link to="/auth" className="text-sm bg-primary text-primary-foreground px-4 py-2.5 rounded-lg font-medium text-center mt-2">Get Started Free</Link>
          </div>
        )}
      </nav>

      {/* ══ HERO ══ */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Parallax bg */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroBg})`, transform: `translateY(${scrollY * 0.25}px)`, filter: "brightness(0.2)" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-transparent to-background" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/50 via-transparent to-background/50" />
        {/* Warm radial glow */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 80% 55% at 50% 38%, hsl(42 20% 88% / 0.07) 0%, transparent 65%)" }} />

        <div className="relative z-10 max-w-6xl mx-auto px-5 md:px-8 pt-28 pb-24 flex flex-col items-center text-center">

          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-card/70 backdrop-blur-sm border border-border px-4 py-2 rounded-full text-xs text-muted-foreground mb-8 animate-fade-in-up">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span>The private universe for couples</span>
            <span className="w-1 h-1 rounded-full bg-muted-foreground/40" />
            <span className="text-primary font-medium">50,000+ couples joined</span>
          </div>

          {/* Headline */}
          <h1 className="font-heading text-5xl sm:text-7xl lg:text-[88px] font-bold leading-[1.04] tracking-tight mb-6">
            <span className="block animate-fade-in-up text-foreground" style={{ animationDelay: "0.1s" }}>Your love story,</span>
            <span className="block gradient-text animate-fade-in-up" style={{ animationDelay: "0.22s" }}>beautifully kept.</span>
          </h1>

          {/* Sub */}
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-10 leading-relaxed animate-fade-in-up" style={{ animationDelay: "0.36s" }}>
            A private sanctuary to store memories, share moments, send voice messages, and celebrate every milestone — just the two of you. No algorithm. No ads.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center gap-4 mb-16 animate-fade-in-up" style={{ animationDelay: "0.5s" }}>
            <Link to="/auth" className="group flex items-center gap-2.5 bg-primary text-primary-foreground px-8 py-4 rounded-xl font-semibold text-base hover:opacity-90 transition-all hover:shadow-glow hover:scale-[1.02] active:scale-[0.98]">
              Start for Free — No Card Needed
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <a href="#features" className="flex items-center gap-2.5 border border-border bg-card/40 backdrop-blur-sm text-foreground px-7 py-4 rounded-xl font-medium text-base hover:bg-accent transition-colors">
              <PlayCircle className="w-4 h-4" />
              See how it works
            </a>
          </div>

          {/* Floating memory cards */}
          <div className="flex flex-wrap justify-center gap-3 animate-fade-in-up" style={{ animationDelay: "0.65s" }}>
            {MEMORY_CARDS.map((c, i) => (
              <div
                key={i}
                className="glass-card px-4 py-2.5 flex items-center gap-2.5 text-sm select-none"
                style={{ animation: `lp-float ${3 + i * 0.5}s ease-in-out ${i * 0.3}s infinite alternate` }}
              >
                <span className="text-xl">{c.emoji}</span>
                <div className="text-left">
                  <div className="font-medium text-foreground text-xs">{c.label}</div>
                  <div className="text-muted-foreground text-[10px]">{c.sub}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Scroll cue */}
          <div className="mt-20 animate-bounce">
            <ChevronDown className="w-5 h-5 text-muted-foreground/40" />
          </div>
        </div>
      </section>

      {/* ══ STATS STRIP ══ */}
      <FadeIn>
        <div className="border-y border-border bg-card/40 backdrop-blur-sm">
          <div className="max-w-5xl mx-auto px-5 md:px-8 py-10 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {STATS.map((s, i) => (
              <div key={i}>
                <div className="font-heading text-3xl md:text-4xl font-bold gradient-text">{s.value}</div>
                <div className="text-sm text-muted-foreground mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </FadeIn>

      {/* ══ FEATURES ══ */}
      <section id="features" className="max-w-7xl mx-auto px-5 md:px-8 py-28">
        <FadeIn className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-card border border-border px-3 py-1.5 rounded-full text-xs text-muted-foreground mb-5">
            <Zap className="w-3 h-3 text-primary" /> Everything you need
          </div>
          <h2 className="font-heading text-4xl md:text-5xl font-bold mb-4">
            Built for couples,<br /><span className="gradient-text">not just storage.</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">Every feature is crafted around intimacy, privacy, and the way real couples actually live.</p>
        </FadeIn>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f, i) => (
            <FeatureCard key={i} icon={f.icon} title={f.title} desc={f.desc} tag={f.tag} delay={i * 80} />
          ))}
        </div>
      </section>

      {/* ══ HOW IT WORKS ══ */}
      <section id="how-it-works" className="bg-card/25 border-y border-border py-28">
        <div className="max-w-5xl mx-auto px-5 md:px-8">
          <FadeIn className="text-center mb-16">
            <h2 className="font-heading text-4xl md:text-5xl font-bold mb-4">
              Start in <span className="gradient-text">60 seconds.</span>
            </h2>
            <p className="text-muted-foreground text-lg">No credit card, no setup hassle. Just two people and their story.</p>
          </FadeIn>
          <div className="grid md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-8 left-[calc(16.67%+1rem)] right-[calc(16.67%+1rem)] h-px bg-border" />
            {STEPS.map((s, i) => (
              <StepCard key={i} step={s.step} icon={s.icon} title={s.title} desc={s.desc} delay={i * 150} />
            ))}
          </div>
        </div>
      </section>

      {/* ══ SPOTLIGHT: Chat ══ */}
      <section className="max-w-7xl mx-auto px-5 md:px-8 py-28">
        <FadeIn>
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-card border border-border px-3 py-1.5 rounded-full text-xs text-muted-foreground mb-6">
                <LockKeyhole className="w-3 h-3 text-primary" /> 100% private
              </div>
              <h2 className="font-heading text-4xl md:text-5xl font-bold mb-6 leading-tight">
                A chat room<br /><span className="gradient-text">nobody else sees.</span>
              </h2>
              <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
                Your messages stay between you two. Emoji reactions, voice messages, reply threads, and read receipts — in a clean, distraction-free space.
              </p>
              <ul className="space-y-3">
                {["End-to-end private messages", "Emoji reactions on every message", "Voice messages (Soulmate plan)", "Reply to specific messages"].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-muted-foreground">
                    <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-primary" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            {/* Mock chat */}
            <div className="relative">
              <div className="premium-card p-1 rounded-2xl overflow-hidden">
                <div className="bg-card rounded-xl">
                  <div className="flex items-center gap-3 p-4 border-b border-border">
                    <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center">💕</div>
                    <div>
                      <div className="text-sm font-medium text-foreground">Kalyani</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" /> Online
                      </div>
                    </div>
                  </div>
                  <div className="p-4 space-y-3 min-h-[280px]">
                    {CHAT_MSGS.map((m, i) => (
                      <div key={i} className={`flex ${m.mine ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[75%] px-3.5 py-2.5 rounded-2xl text-sm ${m.mine ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-secondary text-foreground rounded-bl-sm"}`}>
                          <p>{m.msg}</p>
                          <p className={`text-[10px] mt-1 ${m.mine ? "text-primary-foreground/60" : "text-muted-foreground"}`}>{m.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-4 border-t border-border flex items-center gap-2">
                    <div className="flex-1 bg-secondary rounded-xl px-3.5 py-2.5 text-sm text-muted-foreground">Type a message...</div>
                    <button className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
                      <ArrowRight className="w-4 h-4 text-primary-foreground" />
                    </button>
                  </div>
                </div>
              </div>
              <div className="absolute -inset-10 bg-primary/4 blur-3xl rounded-full pointer-events-none" />
            </div>
          </div>
        </FadeIn>
      </section>

      {/* ══ SPOTLIGHT: Memory Vault ══ */}
      <section className="bg-card/20 border-y border-border py-28">
        <div className="max-w-7xl mx-auto px-5 md:px-8">
          <FadeIn>
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              {/* Gallery mock */}
              <div className="relative order-2 lg:order-1">
                <div className="grid grid-cols-3 gap-2">
                  {GALLERY_TILES.map((tile, i) => (
                    <div
                      key={i}
                      className="aspect-square rounded-xl flex flex-col items-center justify-center gap-1 text-2xl hover:scale-105 transition-transform cursor-pointer border border-border/40"
                      style={{ background: tile.bg }}
                    >
                      <span>{tile.emoji}</span>
                      <span className="text-[9px] text-muted-foreground font-medium">{tile.label}</span>
                    </div>
                  ))}
                </div>
                <div className="absolute -inset-10 bg-primary/3 blur-3xl rounded-full pointer-events-none" />
              </div>
              {/* Text */}
              <div className="order-1 lg:order-2">
                <div className="inline-flex items-center gap-2 bg-card border border-border px-3 py-1.5 rounded-full text-xs text-muted-foreground mb-6">
                  <GalleryVerticalEnd className="w-3 h-3 text-primary" /> Memory Vault
                </div>
                <h2 className="font-heading text-4xl md:text-5xl font-bold mb-6 leading-tight">
                  Every photo tells<br /><span className="gradient-text">your story.</span>
                </h2>
                <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
                  Organize into folders, add love notes, react with emojis, star your favorites. Your memory vault is yours — no one else can see it.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { icon: Shield, title: "100% Private", sub: "Only you two can see" },
                    { icon: Gift, title: "Love Notes", sub: "Attach words to memories" },
                    { icon: Star, title: "Starred Albums", sub: "Your best moments" },
                    { icon: Infinity, title: "Unlimited*", sub: "On Soulmate plan" },
                  ].map((item, i) => {
                    const Icon = item.icon;
                    return (
                      <div key={i} className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Icon className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-foreground">{item.title}</div>
                          <div className="text-xs text-muted-foreground">{item.sub}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ══ TESTIMONIALS ══ */}
      <section id="testimonials" className="max-w-7xl mx-auto px-5 md:px-8 py-28">
        <FadeIn className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-card border border-border px-3 py-1.5 rounded-full text-xs text-muted-foreground mb-5">
            <Heart className="w-3 h-3 text-primary fill-primary" /> Real couples
          </div>
          <h2 className="font-heading text-4xl md:text-5xl font-bold mb-4">
            Thousands of love stories.<br /><span className="gradient-text">All safe here.</span>
          </h2>
        </FadeIn>
        <div className="grid md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t, i) => (
            <TestimonialCard key={i} quote={t.quote} name={t.name} days={t.days} avatar={t.avatar} delay={i * 120} />
          ))}
        </div>
      </section>

      {/* ══ PRICING ══ */}
      <section id="pricing" className="bg-card/20 border-y border-border py-28">
        <div className="max-w-5xl mx-auto px-5 md:px-8">
          <FadeIn className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-card border border-border px-3 py-1.5 rounded-full text-xs text-muted-foreground mb-5">
              <Sparkles className="w-3 h-3 text-primary" /> Simple pricing
            </div>
            <h2 className="font-heading text-4xl md:text-5xl font-bold mb-4">
              Love shouldn't be<br /><span className="gradient-text">expensive.</span>
            </h2>
            <p className="text-muted-foreground text-lg">Start free forever. Upgrade when your love grows.</p>
          </FadeIn>
          <div className="grid md:grid-cols-3 gap-6 items-start">
            {PLANS.map((plan, i) => (
              <PricingCard key={i} plan={plan} delay={i * 100} />
            ))}
          </div>
        </div>
      </section>

      {/* ══ FINAL CTA ══ */}
      <section className="relative py-36 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 70% 60% at 50% 50%, hsl(42 20% 88% / 0.06) 0%, transparent 65%)" }} />
        <div className="relative z-10 max-w-3xl mx-auto px-5 md:px-8 text-center">
          <FadeIn>
            <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-8">
              <Heart className="w-8 h-8 text-primary" style={{ fill: "hsl(var(--primary) / 0.3)" }} />
            </div>
            <h2 className="font-heading text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Your story deserves<br /><span className="gradient-text">a forever home.</span>
            </h2>
            <p className="text-muted-foreground text-lg mb-10 max-w-xl mx-auto leading-relaxed">
              Join 50,000+ couples who chose OurVault to hold their most precious memories. Free to start, forever to keep.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/auth" className="group flex items-center gap-2 bg-primary text-primary-foreground px-8 py-4 rounded-xl font-semibold text-base hover:opacity-90 hover:shadow-glow hover:scale-[1.02] transition-all active:scale-[0.98]">
                Begin Your Story
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Shield className="w-4 h-4" />
                No credit card · 100% private · Always free tier
              </p>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ══ FOOTER ══ */}
      <footer className="border-t border-border bg-card/30">
        <div className="max-w-7xl mx-auto px-5 md:px-8 py-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-primary flex items-center justify-center shadow-glow">
              <Vault className="w-3.5 h-3.5 text-primary-foreground" strokeWidth={2} />
            </div>
            <span className="font-heading font-semibold text-foreground">OurVault</span>
          </div>
          <p className="text-xs text-muted-foreground text-center">
            Made with 💕 for couples everywhere · Your memories are private and secure
          </p>
          <div className="flex items-center gap-5 text-xs text-muted-foreground">
            <Link to="/auth" className="hover:text-foreground transition-colors">Sign In</Link>
            <span className="text-border">·</span>
            <Link to="/auth" className="hover:text-foreground transition-colors">Get Started</Link>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes lp-float {
          from { transform: translateY(0px); }
          to   { transform: translateY(-9px); }
        }
      `}</style>
    </div>
  );
}
