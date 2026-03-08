import { useState } from "react";
import {
  Check, X, HardDrive, Mic, Upload, Crown, Sparkles, Zap, Heart,
  Sprout, HeartHandshake, Gem,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSubscription, usePlan, Plan } from "@/hooks/useSubscription";
import { useRazorpayCheckout, BillingPlan } from "@/hooks/useRazorpayCheckout";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface FeatureRow {
  icon: React.ElementType;
  text: string;
  single: boolean | string;
  dating: boolean | string;
  soulmate: boolean | string;
}

const FEATURES: FeatureRow[] = [
  { icon: HardDrive, text: "Storage",          single: "1 GB",       dating: "10 GB",       soulmate: "50 GB"      },
  { icon: Upload,    text: "Monthly uploads",  single: "50",         dating: "Unlimited",   soulmate: "Unlimited"  },
  { icon: Heart,     text: "Partner access",   single: true,         dating: true,          soulmate: true         },
  { icon: Mic,       text: "Voice messages",   single: false,        dating: true,          soulmate: true         },
  { icon: Zap,       text: "Reactions",        single: false,        dating: true,          soulmate: true         },
  { icon: Sparkles,  text: "All new features", single: false,        dating: false,         soulmate: true         },
  { icon: Crown,     text: "Priority support", single: false,        dating: false,         soulmate: true         },
];

const PLAN_ORDER: Plan[] = ["single", "dating", "soulmate"];

// Premium icon component for each plan tier
function PlanIcon({ planId, active }: { planId: Plan; active: boolean }) {
  const configs: Record<Plan, {
    Icon: React.ElementType;
    bg: string;
    ring: string;
    iconColor: string;
    glow?: string;
  }> = {
    single: {
      Icon: Sprout,
      bg: "bg-muted/60",
      ring: "ring-1 ring-border",
      iconColor: "text-muted-foreground",
    },
    dating: {
      Icon: HeartHandshake,
      bg: "bg-primary/8",
      ring: "ring-1 ring-primary/20",
      iconColor: "text-primary",
    },
    soulmate: {
      Icon: Gem,
      bg: "bg-primary/15",
      ring: "ring-1 ring-primary/40",
      iconColor: "text-primary",
      glow: "shadow-[0_0_18px_hsl(var(--primary)/0.35)]",
    },
  };

  const { Icon, bg, ring, iconColor, glow } = configs[planId];

  return (
    <div className={cn(
      "h-11 w-11 rounded-xl flex items-center justify-center shrink-0 transition-all",
      bg, ring, glow,
      active && "scale-105"
    )}>
      <Icon className={cn("h-5 w-5", iconColor)} strokeWidth={1.75} />
    </div>
  );
}

const PLAN_META: Record<Plan, {
  label: string; tagline: string;
  price: string | null; period: string; badge: string | null;
}> = {
  single: {
    label: "Single", tagline: "Explore the platform.",
    price: null,  period: "forever free", badge: null,
  },
  dating: {
    label: "Dating", tagline: "Unlock more experiences together.",
    price: "₹9",  period: "per month",    badge: null,
  },
  soulmate: {
    label: "Soulmate", tagline: "Everything for the perfect connection.",
    price: "₹99", period: "per month",    badge: "Most popular",
  },
};

function FeatureValue({ val }: { val: boolean | string }) {
  if (val === false) return <X className="h-4 w-4 text-muted-foreground/30 mx-auto" />;
  if (val === true)  return <Check className="h-4 w-4 text-primary mx-auto" />;
  return <span className="text-xs font-medium text-foreground">{val}</span>;
}

export function BillingView() {
  const plan = usePlan();
  const { data: subscription } = useSubscription();
  const { checkout, loading } = useRazorpayCheckout();
  const [checkingOut, setCheckingOut] = useState<BillingPlan | null>(null);

  const handleCheckout = async (p: BillingPlan) => {
    setCheckingOut(p);
    await checkout(p);
    setCheckingOut(null);
  };

  const currentPlanIndex = PLAN_ORDER.indexOf(plan);

  return (
    <div className="max-w-5xl mx-auto space-y-12">

      {/* ── Hero ── */}
      <div className="text-center space-y-3 pt-2">
        <p className="text-xs font-semibold tracking-[0.2em] uppercase text-primary">
          Plans & Pricing
        </p>
        <h2 className="text-3xl sm:text-4xl font-bold font-heading tracking-tight text-foreground">
          Choose your story
        </h2>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
          Start free and upgrade as your relationship grows.
        </p>
      </div>

      {/* ── Active plan notice ── */}
      {plan !== "single" && subscription?.current_period_end && (
        <div className="flex items-center justify-center gap-2.5">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-sm">
            <PlanIcon planId={plan} active />
            <span className="font-medium text-foreground">{PLAN_META[plan].label} plan active</span>
            <span className="text-muted-foreground">·</span>
            <span className="text-xs text-muted-foreground">
              Renews {format(new Date(subscription.current_period_end), "MMM d, yyyy")}
            </span>
          </div>
        </div>
      )}

      {/* ── Pricing cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {PLAN_ORDER.map((planId) => {
          const meta    = PLAN_META[planId];
          const isCurrent  = plan === planId;
          const isDowngrade = PLAN_ORDER.indexOf(planId) < currentPlanIndex;
          const isBilling   = planId === "dating" || planId === "soulmate";
          const isHighlight = planId === "soulmate";

          return (
            <div
              key={planId}
              className={cn(
                "relative flex flex-col rounded-2xl p-6 transition-all duration-200",
                isHighlight
                  ? "bg-card border border-primary/40 shadow-[0_0_40px_hsl(var(--primary)/0.08)]"
                  : "bg-card border border-border",
                isCurrent && !isHighlight && "border-primary/30"
              )}
            >
              {/* Popular badge */}
              {meta.badge && (
                <div className="absolute -top-3.5 inset-x-0 flex justify-center">
                  <Badge className="bg-primary text-primary-foreground text-[11px] font-semibold px-3 py-1 rounded-full shadow-md">
                    {meta.badge}
                  </Badge>
                </div>
              )}

              {/* Plan header */}
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-3">
                  <PlanIcon planId={planId} active={isCurrent} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold font-heading text-base text-foreground">{meta.label}</span>
                      {isCurrent && (
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Active</Badge>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{meta.tagline}</p>
                  </div>
                </div>

                <div className="mt-5 flex items-baseline gap-1">
                  <span className={cn(
                    "font-bold font-heading tracking-tight",
                    meta.price ? "text-4xl" : "text-3xl"
                  )}>
                    {meta.price ?? "Free"}
                  </span>
                  {meta.price && (
                    <span className="text-sm text-muted-foreground">{meta.period}</span>
                  )}
                </div>
                {!meta.price && (
                  <p className="text-xs text-muted-foreground mt-0.5">{meta.period}</p>
                )}
              </div>

              {/* Features for this plan */}
              <ul className="space-y-3 flex-1 mb-7">
                {FEATURES.map(({ icon: Icon, text, ...vals }) => {
                  const val = vals[planId as keyof typeof vals] as boolean | string;
                  const active = val !== false;
                  return (
                    <li
                      key={text}
                      className={cn(
                        "flex items-center gap-2.5 text-xs",
                        active ? "text-foreground" : "text-muted-foreground/40"
                      )}
                    >
                      <div className={cn(
                        "h-5 w-5 rounded-full flex items-center justify-center shrink-0",
                        active ? "bg-primary/10" : "bg-muted/30"
                      )}>
                        <Icon className={cn("h-3 w-3", active ? "text-primary" : "text-muted-foreground/40")} />
                      </div>
                      <span className="flex-1">{text}</span>
                      {typeof val === "string" ? (
                        <span className="font-semibold text-foreground">{val}</span>
                      ) : val ? (
                        <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                      ) : (
                        <X className="h-3.5 w-3.5 text-muted-foreground/25 shrink-0" />
                      )}
                    </li>
                  );
                })}
              </ul>

              {/* CTA */}
              {isCurrent ? (
                <Button variant="outline" className="w-full rounded-xl" disabled>
                  ✓ Current plan
                </Button>
              ) : isDowngrade ? (
                <Button variant="ghost" className="w-full rounded-xl text-muted-foreground text-xs" disabled>
                  Downgrade
                </Button>
              ) : isBilling ? (
                <Button
                  className={cn("w-full rounded-xl gap-2 font-semibold", !isHighlight && "variant-outline")}
                  variant={isHighlight ? "default" : "outline"}
                  onClick={() => handleCheckout(planId as BillingPlan)}
                  disabled={loading}
                >
                  {checkingOut === planId ? (
                    <span className="flex items-center gap-2">
                      <span className="h-3.5 w-3.5 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                      Processing…
                    </span>
                  ) : (
                    <>
                      {isHighlight ? <Crown className="h-3.5 w-3.5" /> : <Heart className="h-3.5 w-3.5" />}
                      {meta.label === "Soulmate" ? "Become Soulmates" : "Get Dating"}
                    </>
                  )}
                </Button>
              ) : null}

              {isBilling && !isCurrent && !isDowngrade && (
                <p className="text-[10px] text-center text-muted-foreground mt-2.5 leading-relaxed">
                  Secure payment via Razorpay · Cancel anytime
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Feature comparison table ── */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="text-sm font-semibold font-heading text-foreground">Full feature comparison</h3>
        </div>

        {/* Header row */}
        <div className="grid grid-cols-4 border-b border-border">
          <div className="px-6 py-3" />
          {PLAN_ORDER.map((planId) => (
            <div
              key={planId}
              className={cn(
                "px-4 py-3 text-center",
                plan === planId && "bg-primary/5"
              )}
            >
              <div className="flex flex-col items-center gap-1.5">
                <PlanIcon planId={planId} active={plan === planId} />
                <p className={cn(
                  "text-xs font-semibold",
                  plan === planId ? "text-primary" : "text-muted-foreground"
                )}>
                  {PLAN_META[planId].label}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Feature rows */}
        {FEATURES.map(({ icon: Icon, text, single, dating, soulmate }, i) => (
          <div
            key={text}
            className={cn(
              "grid grid-cols-4 border-b border-border/50 last:border-0",
              i % 2 === 0 ? "bg-transparent" : "bg-muted/20"
            )}
          >
            <div className="px-6 py-3.5 flex items-center gap-2.5">
              <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="text-xs text-muted-foreground">{text}</span>
            </div>
            {[single, dating, soulmate].map((val, idx) => (
              <div
                key={idx}
                className={cn(
                  "px-4 py-3.5 flex items-center justify-center",
                  plan === PLAN_ORDER[idx] && "bg-primary/5"
                )}
              >
                <FeatureValue val={val} />
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* ── Footer note ── */}
      <p className="text-center text-xs text-muted-foreground pb-4">
        All plans include end-to-end encrypted storage. Payments processed securely by Razorpay.
      </p>
    </div>
  );
}
