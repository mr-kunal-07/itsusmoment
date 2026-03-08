import { forwardRef } from "react";
import { Heart } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import {
  TemplateId, PaletteData, Customization, Milestone, Profile,
  PALETTES, MILESTONE_ICONS, HEARTS_POS,
} from "./love-story/types";

export type { TemplateId, Customization } from "./love-story/types";
export { PALETTES, DEFAULT_CUSTOMIZATION, TEMPLATE_META } from "./love-story/types";

export interface LoveStoryCardProps {
  templateId: TemplateId;
  customization: Customization;
  myProfile: Profile | null;
  partnerProfile: Profile | null;
  coupleStartDate: string | null;
  milestones: Milestone[];
  photoCount: number;
  messageCount: number;
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function Avatar({ profile, size, accent, isDark }: { profile: Profile | null; size: number; accent: string; isDark: boolean }) {
  const name = profile?.display_name ?? "?";
  const initials = name.slice(0, 2).toUpperCase();
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", overflow: "hidden", flexShrink: 0,
      boxShadow: isDark ? `0 0 0 3px rgba(255,255,255,0.15)` : `0 0 0 3px white, 0 4px 16px rgba(0,0,0,0.12)`,
    }}>
      {profile?.avatar_url
        ? <img src={profile.avatar_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: `${accent}28`, fontSize: size * 0.28, fontWeight: 700, color: accent, fontFamily: "system-ui" }}>{initials}</div>
      }
    </div>
  );
}

// ── Template 1: Eternal ───────────────────────────────────────────────────────
function TemplateEternal({ p, myProfile, partnerProfile, days, startLabel, title, tagline, stats, milestones, showStats, showTimeline }: any) {
  return (
    <div style={{ width: 420, minHeight: 620, background: p.bg, borderRadius: 28, position: "relative", overflow: "hidden", fontFamily: "Georgia, serif", boxShadow: p.isDark ? "0 24px 64px rgba(0,0,0,0.6)" : "0 24px 64px rgba(0,0,0,0.1)" }}>
      {/* Floating hearts */}
      {HEARTS_POS.map((h, i) => (
        <div key={i} style={{ position: "absolute", top: h.top, left: "left" in h ? h.left : "auto", right: "right" in h ? (h as any).right : "auto", opacity: h.op, animation: `float-heart 4s ease-in-out infinite`, animationDelay: h.d, pointerEvents: "none" }}>
          <Heart fill={p.accent} color="transparent" style={{ width: h.sz, height: h.sz }} />
        </div>
      ))}
      {/* Decorative orbs */}
      <div style={{ position: "absolute", top: -60, right: -60, width: 200, height: 200, borderRadius: "50%", background: `rgba(${p.accentRgb},0.07)`, pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: -80, left: -60, width: 240, height: 240, borderRadius: "50%", background: `rgba(${p.accentRgb},0.05)`, pointerEvents: "none" }} />

      <div style={{ position: "relative", zIndex: 1, padding: "32px 28px", display: "flex", flexDirection: "column", gap: 24 }}>
        {/* Header */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <Avatar profile={myProfile} size={60} accent={p.accent} isDark={p.isDark} />
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: p.isDark ? `rgba(${p.accentRgb},0.25)` : "white", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 -4px", zIndex: 1, boxShadow: `0 2px 8px rgba(${p.accentRgb},0.3)` }}>
              <Heart fill={p.accent} color="transparent" style={{ width: 14, height: 14 }} />
            </div>
            <Avatar profile={partnerProfile} size={60} accent={p.accent} isDark={p.isDark} />
          </div>
          <div style={{ textAlign: "center" }}>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: p.text, margin: 0, letterSpacing: "-0.02em" }}>{title}</h1>
            {tagline && <p style={{ fontSize: 12, color: p.subtext, margin: "6px 0 0", fontStyle: "italic" }}>{tagline}</p>}
            {startLabel && <p style={{ fontSize: 11, color: p.subtext, margin: "4px 0 0", fontFamily: "system-ui" }}>{startLabel}</p>}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 14px", borderRadius: 999, background: p.isDark ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.6)", fontSize: 10, color: p.isDark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.3)", fontFamily: "system-ui", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>
            <Heart fill="currentColor" color="transparent" style={{ width: 9, height: 9 }} /> OurVault
          </div>
        </div>

        {/* Stats */}
        {showStats && (
          <div style={{ background: p.card, borderRadius: 16, padding: "14px 12px", backdropFilter: "blur(8px)" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
              {stats.map((s: any) => (
                <div key={s.label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                  <span style={{ fontSize: 18 }}>{s.emoji}</span>
                  <span style={{ fontSize: 16, fontWeight: 700, color: p.text, fontFamily: "system-ui", lineHeight: 1 }}>{s.value}</span>
                  <span style={{ fontSize: 9, color: p.subtext, textAlign: "center", fontFamily: "system-ui", lineHeight: 1.3 }}>{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Timeline */}
        {showTimeline && milestones.length > 0 && (
          <div>
            <p style={{ fontSize: 9, fontWeight: 700, color: p.subtext, letterSpacing: "0.12em", textTransform: "uppercase", margin: "0 0 12px", fontFamily: "system-ui" }}>Our Story</p>
            <div style={{ position: "relative", paddingLeft: 20 }}>
              <div style={{ position: "absolute", left: 7, top: 8, bottom: 8, width: 2, background: p.line, borderRadius: 2 }} />
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {milestones.slice(0, 5).map((m: Milestone) => {
                  const Icon = MILESTONE_ICONS[m.type] ?? MILESTONE_ICONS.default;
                  return (
                    <div key={m.id} style={{ display: "flex", gap: 10, alignItems: "flex-start", position: "relative" }}>
                      <div style={{ position: "absolute", left: -14, top: 2, width: 18, height: 18, borderRadius: "50%", background: p.isDark ? `rgba(${p.accentRgb},0.2)` : "white", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 0 0 2px ${p.line}` }}>
                        <Icon style={{ width: 9, height: 9, color: p.accent }} />
                      </div>
                      <div>
                        <p style={{ fontSize: 12, fontWeight: 600, color: p.text, margin: 0, fontFamily: "system-ui" }}>{m.title}</p>
                        <p style={{ fontSize: 10, color: p.subtext, margin: "2px 0 0", fontFamily: "system-ui" }}>{format(new Date(m.date), "MMM d, yyyy")}{m.description ? ` · ${m.description}` : ""}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        <p style={{ fontSize: 10, color: p.subtext, textAlign: "center", letterSpacing: "0.1em", fontFamily: "system-ui" }}>Made with ❤️ on OurVault</p>
      </div>
    </div>
  );
}

// ── Template 2: Polaroid ──────────────────────────────────────────────────────
function TemplatePolaroid({ p, myProfile, partnerProfile, days, startLabel, title, tagline, stats, milestones, showStats, showTimeline }: any) {
  const cards = milestones.slice(0, 4);
  const rotations = [-3, 2, -2, 3];
  return (
    <div style={{ width: 420, minHeight: 620, background: p.bg, borderRadius: 28, position: "relative", overflow: "hidden", fontFamily: "'Georgia', serif", boxShadow: "0 24px 64px rgba(0,0,0,0.1)" }}>
      {/* Grain overlay */}
      <div style={{ position: "absolute", inset: 0, backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E\")", pointerEvents: "none", opacity: 0.5 }} />

      <div style={{ position: "relative", zIndex: 1, padding: "32px 28px", display: "flex", flexDirection: "column", gap: 20 }}>
        {/* Header */}
        <div style={{ textAlign: "center" }}>
          <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 12 }}>
            <Avatar profile={myProfile} size={52} accent={p.accent} isDark={false} />
            <div style={{ alignSelf: "center", fontSize: 20, color: p.accent }}>❤️</div>
            <Avatar profile={partnerProfile} size={52} accent={p.accent} isDark={false} />
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: p.text, margin: 0, fontStyle: "italic" }}>{title}</h1>
          {tagline && <p style={{ fontSize: 12, color: p.subtext, margin: "6px 0 0" }}>{tagline}</p>}
        </div>

        {/* Polaroid grid */}
        {showTimeline && cards.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {cards.map((m: Milestone, i: number) => {
              const Icon = MILESTONE_ICONS[m.type] ?? MILESTONE_ICONS.default;
              return (
                <div key={m.id} style={{
                  background: p.card, borderRadius: 4, padding: "12px 12px 20px",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.12), 0 1px 4px rgba(0,0,0,0.08)",
                  transform: `rotate(${rotations[i % 4]}deg)`,
                }}>
                  <div style={{ width: "100%", height: 80, background: `rgba(${p.accentRgb},0.1)`, borderRadius: 2, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 8 }}>
                    <Icon style={{ width: 28, height: 28, color: p.accent }} />
                  </div>
                  <p style={{ fontSize: 11, fontWeight: 700, color: p.text, margin: "0 0 2px", fontFamily: "system-ui", textAlign: "center" }}>{m.title}</p>
                  <p style={{ fontSize: 9, color: p.subtext, margin: 0, fontFamily: "system-ui", textAlign: "center" }}>{format(new Date(m.date), "MMM yyyy")}</p>
                </div>
              );
            })}
          </div>
        )}

        {/* Days stamp */}
        {showStats && (
          <div style={{ display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
            {stats.map((s: any) => (
              <div key={s.label} style={{ display: "flex", flexDirection: "column", alignItems: "center", background: `rgba(${p.accentRgb},0.1)`, borderRadius: 12, padding: "8px 14px", border: `1px dashed rgba(${p.accentRgb},0.35)` }}>
                <span style={{ fontSize: 16 }}>{s.emoji}</span>
                <span style={{ fontSize: 15, fontWeight: 800, color: p.text, fontFamily: "system-ui", lineHeight: 1 }}>{s.value}</span>
                <span style={{ fontSize: 9, color: p.subtext, fontFamily: "system-ui" }}>{s.label}</span>
              </div>
            ))}
          </div>
        )}

        <p style={{ fontSize: 10, color: p.subtext, textAlign: "center", fontFamily: "system-ui", opacity: 0.7 }}>📸 OurVault</p>
      </div>
    </div>
  );
}

// ── Template 3: Bold ──────────────────────────────────────────────────────────
function TemplateBold({ p, myProfile, partnerProfile, days, startLabel, title, tagline, stats, milestones, showStats, showTimeline }: any) {
  return (
    <div style={{ width: 420, minHeight: 620, background: p.bg, borderRadius: 28, overflow: "hidden", fontFamily: "system-ui, -apple-system, sans-serif", boxShadow: p.isDark ? "0 24px 64px rgba(0,0,0,0.7)" : "0 24px 64px rgba(0,0,0,0.1)" }}>
      {/* Top color block */}
      <div style={{ background: p.accent, padding: "36px 32px 24px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -40, right: -40, width: 160, height: 160, borderRadius: "50%", background: "rgba(255,255,255,0.1)" }} />
        <div style={{ position: "absolute", bottom: -60, left: -30, width: 180, height: 180, borderRadius: "50%", background: "rgba(0,0,0,0.08)" }} />
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
            <Avatar profile={myProfile} size={48} accent={p.accent} isDark={true} />
            <Avatar profile={partnerProfile} size={48} accent={p.accent} isDark={true} />
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 900, color: "white", margin: 0, lineHeight: 1.1, letterSpacing: "-0.03em" }}>{title}</h1>
          {tagline && <p style={{ fontSize: 12, color: "rgba(255,255,255,0.75)", margin: "8px 0 0", fontStyle: "italic" }}>{tagline}</p>}
        </div>
      </div>

      {/* Bottom content */}
      <div style={{ padding: "24px 32px", display: "flex", flexDirection: "column", gap: 20 }}>
        {/* Days together hero */}
        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <span style={{ fontSize: 48, fontWeight: 900, color: p.text, lineHeight: 1 }}>{days}</span>
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: p.text, margin: 0 }}>Days Together</p>
            {startLabel && <p style={{ fontSize: 10, color: p.subtext, margin: "2px 0 0" }}>{startLabel}</p>}
          </div>
          <Heart fill={p.accent} color="transparent" style={{ width: 32, height: 32, marginLeft: "auto" }} />
        </div>

        {/* Stats strip */}
        {showStats && (
          <div style={{ display: "flex", borderTop: `2px solid ${p.line}`, borderBottom: `2px solid ${p.line}`, padding: "12px 0" }}>
            {stats.slice(1).map((s: any, i: number, arr: any[]) => (
              <div key={s.label} style={{ flex: 1, textAlign: "center", borderRight: i < arr.length - 1 ? `1px solid ${p.line}` : "none" }}>
                <p style={{ fontSize: 18, fontWeight: 800, color: p.text, margin: 0 }}>{s.value}</p>
                <p style={{ fontSize: 9, color: p.subtext, margin: "2px 0 0" }}>{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Timeline as numbered list */}
        {showTimeline && milestones.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {milestones.slice(0, 4).map((m: Milestone, i: number) => (
              <div key={m.id} style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: p.accent, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ fontSize: 11, fontWeight: 800, color: "white" }}>{i + 1}</span>
                </div>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: p.text, margin: 0 }}>{m.title}</p>
                  <p style={{ fontSize: 10, color: p.subtext, margin: "1px 0 0" }}>{format(new Date(m.date), "MMM d, yyyy")}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <p style={{ fontSize: 10, color: p.subtext, textAlign: "center", letterSpacing: "0.1em", textTransform: "uppercase" }}>OurVault</p>
      </div>
    </div>
  );
}

// ── Template 4: Cinema ────────────────────────────────────────────────────────
function TemplateCinema({ p, myProfile, partnerProfile, days, startLabel, title, tagline, stats, milestones, showStats, showTimeline }: any) {
  const perfs = Array.from({ length: 10 });
  return (
    <div style={{ width: 420, minHeight: 620, background: p.bg, borderRadius: 28, overflow: "hidden", fontFamily: "system-ui, sans-serif", boxShadow: "0 24px 64px rgba(0,0,0,0.8)" }}>
      {/* Film perforations top */}
      <div style={{ background: "rgba(0,0,0,0.5)", height: 32, display: "flex", alignItems: "center", justifyContent: "space-around", padding: "0 12px" }}>
        {perfs.map((_, i) => <div key={i} style={{ width: 14, height: 10, borderRadius: 2, background: "rgba(255,255,255,0.15)", border: `1px solid rgba(255,255,255,0.1)` }} />)}
      </div>

      <div style={{ padding: "24px 32px 20px", display: "flex", flexDirection: "column", gap: 20 }}>
        {/* Movie title style header */}
        <div style={{ textAlign: "center", borderBottom: `1px solid ${p.line}`, paddingBottom: 20 }}>
          <p style={{ fontSize: 9, letterSpacing: "0.35em", color: p.subtext, textTransform: "uppercase", margin: "0 0 8px" }}>A Love Story</p>
          <h1 style={{ fontSize: 28, fontWeight: 900, color: p.text, margin: 0, letterSpacing: "0.05em", textTransform: "uppercase" }}>{title}</h1>
          {tagline && <p style={{ fontSize: 12, color: p.subtext, margin: "8px 0 0", fontStyle: "italic" }}>{tagline}</p>}
          <div style={{ display: "flex", justifyContent: "center", gap: 12, marginTop: 14 }}>
            <Avatar profile={myProfile} size={44} accent={p.accent} isDark={true} />
            <div style={{ alignSelf: "center" }}><Heart fill={p.accent} color="transparent" style={{ width: 20, height: 20 }} /></div>
            <Avatar profile={partnerProfile} size={44} accent={p.accent} isDark={true} />
          </div>
        </div>

        {/* Stats as credits */}
        {showStats && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {stats.map((s: any) => (
              <div key={s.label} style={{ background: p.card, borderRadius: 10, padding: "10px 14px", border: `1px solid ${p.line}` }}>
                <p style={{ fontSize: 20, fontWeight: 900, color: p.accent, margin: 0, lineHeight: 1 }}>{s.value}</p>
                <p style={{ fontSize: 9, color: p.subtext, margin: "3px 0 0", letterSpacing: "0.1em", textTransform: "uppercase" }}>{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Timeline as scenes */}
        {showTimeline && milestones.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <p style={{ fontSize: 9, letterSpacing: "0.2em", color: p.subtext, textTransform: "uppercase", margin: "0 0 4px" }}>Scenes</p>
            {milestones.slice(0, 4).map((m: Milestone, i: number) => (
              <div key={m.id} style={{ display: "flex", gap: 12, padding: "8px 12px", background: p.card, borderRadius: 8, borderLeft: `3px solid ${p.accent}` }}>
                <span style={{ fontSize: 10, color: p.accent, fontWeight: 700, minWidth: 20 }}>#{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <p style={{ fontSize: 12, fontWeight: 700, color: p.text, margin: 0 }}>{m.title}</p>
                  <p style={{ fontSize: 10, color: p.subtext, margin: "1px 0 0" }}>{format(new Date(m.date), "MMM d, yyyy")}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <p style={{ fontSize: 9, color: p.subtext, textAlign: "center", letterSpacing: "0.2em", textTransform: "uppercase", opacity: 0.6 }}>OurVault © {new Date().getFullYear()}</p>
      </div>

      {/* Film perforations bottom */}
      <div style={{ background: "rgba(0,0,0,0.5)", height: 32, display: "flex", alignItems: "center", justifyContent: "space-around", padding: "0 12px" }}>
        {perfs.map((_, i) => <div key={i} style={{ width: 14, height: 10, borderRadius: 2, background: "rgba(255,255,255,0.15)", border: `1px solid rgba(255,255,255,0.1)` }} />)}
      </div>
    </div>
  );
}

// ── Template 5: Bloom ─────────────────────────────────────────────────────────
function TemplateBloom({ p, myProfile, partnerProfile, days, startLabel, title, tagline, stats, milestones, showStats, showTimeline }: any) {
  return (
    <div style={{ width: 420, minHeight: 620, background: p.bg, borderRadius: 28, overflow: "hidden", fontFamily: "Georgia, serif", position: "relative", boxShadow: "0 24px 64px rgba(0,0,0,0.1)" }}>
      {/* Botanical circle decorations */}
      {[
        { top: -70, left: -70, size: 200, op: 0.18 },
        { top: -50, right: -50, size: 160, op: 0.13 },
        { bottom: -70, left: -50, size: 180, op: 0.14 },
        { bottom: -50, right: -60, size: 150, op: 0.12 },
      ].map((c, i) => (
        <div key={i} style={{
          position: "absolute",
          top: "top" in c ? c.top : "auto",
          bottom: "bottom" in c ? (c as any).bottom : "auto",
          left: "left" in c ? c.left : "auto",
          right: "right" in c ? (c as any).right : "auto",
          width: c.size, height: c.size, borderRadius: "50%",
          background: `radial-gradient(circle, rgba(${p.accentRgb},${c.op + 0.05}) 0%, rgba(${p.accentRgb},${c.op * 0.3}) 60%, transparent 100%)`,
          pointerEvents: "none",
        }} />
      ))}
      {/* Petal dots */}
      {[
        { top: "20%", left: "8%"  },
        { top: "45%", right: "6%" },
        { top: "65%", left: "5%"  },
      ].map((pos, i) => (
        <div key={i} style={{ position: "absolute", top: pos.top, left: "left" in pos ? pos.left : "auto", right: "right" in pos ? (pos as any).right : "auto", width: 6, height: 6, borderRadius: "50%", background: `rgba(${p.accentRgb},0.35)`, pointerEvents: "none" }} />
      ))}

      <div style={{ position: "relative", zIndex: 1, padding: "36px 32px", display: "flex", flexDirection: "column", gap: 22 }}>
        {/* Header */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
          <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
            <Avatar profile={myProfile} size={56} accent={p.accent} isDark={false} />
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "0 8px" }}>
              <div style={{ fontSize: 22, lineHeight: 1 }}>🌸</div>
              <Heart fill={p.accent} color="transparent" style={{ width: 14, height: 14, marginTop: 2 }} />
            </div>
            <Avatar profile={partnerProfile} size={56} accent={p.accent} isDark={false} />
          </div>
          <div style={{ textAlign: "center" }}>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: p.text, margin: 0, fontStyle: "italic", letterSpacing: "0.01em" }}>{title}</h1>
            {tagline && <p style={{ fontSize: 12, color: p.subtext, margin: "6px 0 0" }}>{tagline}</p>}
            {startLabel && <p style={{ fontSize: 11, color: p.subtext, margin: "4px 0 0", fontFamily: "system-ui" }}>{startLabel}</p>}
          </div>
        </div>

        {/* Divider */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ flex: 1, height: 1, background: `rgba(${p.accentRgb},0.2)` }} />
          <span style={{ fontSize: 14, color: p.accent }}>✿</span>
          <div style={{ flex: 1, height: 1, background: `rgba(${p.accentRgb},0.2)` }} />
        </div>

        {/* Stats as flower bubbles */}
        {showStats && (
          <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: 10 }}>
            {stats.map((s: any) => (
              <div key={s.label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, background: p.card, borderRadius: "50%", width: 80, height: 80, justifyContent: "center", boxShadow: `0 4px 16px rgba(${p.accentRgb},0.15)`, border: `2px solid rgba(${p.accentRgb},0.15)` }}>
                <span style={{ fontSize: 16 }}>{s.emoji}</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: p.text, fontFamily: "system-ui", lineHeight: 1 }}>{s.value}</span>
                <span style={{ fontSize: 8, color: p.subtext, fontFamily: "system-ui", textAlign: "center", lineHeight: 1.2 }}>{s.label}</span>
              </div>
            ))}
          </div>
        )}

        {/* Timeline with petals */}
        {showTimeline && milestones.length > 0 && (
          <div>
            <p style={{ fontSize: 10, fontWeight: 600, color: p.subtext, letterSpacing: "0.15em", textTransform: "uppercase", margin: "0 0 12px", fontFamily: "system-ui", textAlign: "center" }}>Our Journey</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {milestones.slice(0, 5).map((m: Milestone) => (
                <div key={m.id} style={{ display: "flex", gap: 12, alignItems: "center", background: p.card, borderRadius: 12, padding: "10px 14px", boxShadow: `0 2px 8px rgba(${p.accentRgb},0.08)` }}>
                  <span style={{ fontSize: 16 }}>🌸</span>
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 600, color: p.text, margin: 0, fontFamily: "system-ui" }}>{m.title}</p>
                    <p style={{ fontSize: 10, color: p.subtext, margin: "2px 0 0", fontFamily: "system-ui" }}>{format(new Date(m.date), "MMM d, yyyy")}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <p style={{ fontSize: 10, color: p.subtext, textAlign: "center", fontFamily: "system-ui", opacity: 0.7 }}>✿ Made with love on OurVault ✿</p>
      </div>
    </div>
  );
}

// ── Main Dispatcher ───────────────────────────────────────────────────────────
export const LoveStoryCard = forwardRef<HTMLDivElement, LoveStoryCardProps>(({
  templateId, customization, myProfile, partnerProfile,
  coupleStartDate, milestones, photoCount, messageCount,
}, ref) => {
  const palettes = PALETTES[templateId];
  const pid = customization.paletteId || palettes[0].id;
  const p: PaletteData = palettes.find(x => x.id === pid) ?? palettes[0];

  const effectiveStart = customization.startDate || coupleStartDate;
  const days = effectiveStart ? differenceInDays(new Date(), new Date(effectiveStart)) : 0;
  const startLabel = effectiveStart ? `Together since ${format(new Date(effectiveStart), "MMMM d, yyyy")}` : null;

  const myName = myProfile?.display_name ?? "You";
  const partnerName = partnerProfile?.display_name ?? "Partner";
  const title = customization.title || `${myName} ❤️ ${partnerName}`;

  const stats = [
    { value: days.toLocaleString(), label: "Days Together", emoji: "❤️" },
    { value: photoCount.toLocaleString(), label: "Memories", emoji: "📸" },
    { value: messageCount.toLocaleString(), label: "Messages", emoji: "💬" },
    { value: milestones.length.toLocaleString(), label: "Milestones", emoji: "🏆" },
  ];

  const shared = { p, myProfile, partnerProfile, days: days.toLocaleString(), startLabel, title, tagline: customization.tagline, stats, milestones, showStats: customization.showStats, showTimeline: customization.showTimeline };

  const cardMap: Record<TemplateId, JSX.Element> = {
    eternal:  <TemplateEternal  {...shared} />,
    polaroid: <TemplatePolaroid {...shared} />,
    bold:     <TemplateBold     {...shared} />,
    cinema:   <TemplateCinema   {...shared} />,
    bloom:    <TemplateBloom    {...shared} />,
  };

  return <div ref={ref}>{cardMap[templateId]}</div>;
});

LoveStoryCard.displayName = "LoveStoryCard";
