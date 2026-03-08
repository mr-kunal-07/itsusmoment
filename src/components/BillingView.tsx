import { useState } from "react";
import { Check, Zap, HardDrive, MessageSquare, Upload, Crown, Heart, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSubscription, usePlan, Plan } from "@/hooks/useSubscription";
import { useRazorpayCheckout, BillingPlan } from "@/hooks/useRazorpayCheckout";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface PlanConfig {
  id: Plan;
  label: string;
  emoji: string;
  tagline: string;
  price: string | null;
  period: string;
  badge: string | null;
  features: { icon: React.ElementType; text: string; included: boolean }[];
  cta: string;
  highlight: boolean;
}

const PLANS: PlanConfig[] = [
  {
    id: "single",
    label: "Single",
    emoji: "🌱",
    tagline: "Explore the platform.",
    price: null,
    period: "forever free",
    badge: null,
    highlight: false,
    cta: "Current plan",
    features: [
      { icon: HardDrive,     text: "1 GB storage",             included: true  },
      { icon: Upload,        text: "10 uploads / month",       included: true  },
      { icon: MessageSquare, text: "Text messages",            included: true  },
      { icon: Zap,           text: "Voice messages",           included: false },
      { icon: Sparkles,      text: "Unlimited uploads",        included: false },
      { icon: Crown,         text: "Priority support",         included: false },
    ],
  },
  {
    id: "dating",
    label: "Dating",
    emoji: "💌",
    tagline: "Unlock more experiences together.",
    price: "₹9",
    period: "/ month",
    badge: null,
    highlight: false,
    cta: "Get Dating",
    features: [
      { icon: HardDrive,     text: "5 GB storage",             included: true  },
      { icon: Upload,        text: "50 uploads / month",       included: true  },
      { icon: MessageSquare, text: "Text messages",            included: true  },
      { icon: Zap,           text: "Voice messages",           included: false },
      { icon: Sparkles,      text: "Unlimited uploads",        included: false },
      { icon: Crown,         text: "Priority support",         included: false },
    ],
  },
  {
    id: "soulmate",
    label: "Soulmate",
    emoji: "💍",
    tagline: "Everything for the perfect connection.",
    price: "₹99",
    period: "/ month",
    badge: "Most popular",
    highlight: true,
    cta: "Become Soulmates",
    features: [
      { icon: HardDrive,     text: "50 GB storage",            included: true  },
      { icon: Upload,        text: "Unlimited uploads",        included: true  },
      { icon: MessageSquare, text: "Text messages",            included: true  },
      { icon: Zap,           text: "Voice messages",           included: true  },
      { icon: Sparkles,      text: "All future features",      included: true  },
      { icon: Crown,         text: "Priority support",         included: true  },
    ],
  },
];

const PLAN_ORDER: Plan[] = ["single", "dating", "soulmate"];

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
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Active plan pill */}
      {plan !== "single" && subscription?.current_period_end && (
        <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-primary/8 border border-primary/20 w-fit text-sm">
          <span className="text-lg">{PLANS.find(p2 => p2.id === plan)?.emoji}</span>
          <span className="font-medium text-foreground">
            {PLANS.find(p2 => p2.id === plan)?.label} plan
          </span>
          <span className="text-muted-foreground">·</span>
          <span className="text-muted-foreground text-xs">
            Renews {format(new Date(subscription.current_period_end), "MMM d, yyyy")}
          </span>
        </div>
      )}

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {PLANS.map((p) => {
          const isCurrentPlan = plan === p.id;
          const isDowngrade = PLAN_ORDER.indexOf(p.id) < currentPlanIndex;
          const isBillingPlan = p.id === "dating" || p.id === "soulmate";

          return (
            <div
              key={p.id}
              className={cn(
                "relative flex flex-col rounded-2xl border p-5 transition-all",
                p.highlight
                  ? "border-primary/50 bg-primary/5 shadow-lg shadow-primary/10"
                  : "border-border bg-card",
                isCurrentPlan && "ring-2 ring-primary/30"
              )}
            >
              {/* Badge */}
              {p.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground text-[11px] px-2.5 py-0.5 shadow-sm">
                    {p.badge}
                  </Badge>
                </div>
              )}

              {/* Header */}
              <div className="mb-5">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">{p.emoji}</span>
                  <span className="font-bold text-base font-heading text-foreground">{p.label}</span>
                  {isCurrentPlan && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 ml-auto">Active</Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{p.tagline}</p>
                <div className="mt-4 flex items-end gap-1">
                  {p.price ? (
                    <>
                      <span className="text-3xl font-bold font-heading text-foreground">{p.price}</span>
                      <span className="text-sm text-muted-foreground mb-0.5">{p.period}</span>
                    </>
                  ) : (
                    <span className="text-3xl font-bold font-heading text-foreground">Free</span>
                  )}
                </div>
                {p.price === null && (
                  <p className="text-xs text-muted-foreground mt-0.5">{p.period}</p>
                )}
              </div>

              {/* Features */}
              <ul className="space-y-2.5 flex-1 mb-6">
                {p.features.map(({ icon: Icon, text, included }) => (
                  <li
                    key={text}
                    className={cn(
                      "flex items-center gap-2.5 text-xs",
                      included ? "text-foreground" : "text-muted-foreground/50"
                    )}
                  >
                    {included
                      ? <Check className="h-3.5 w-3.5 shrink-0 text-primary" />
                      : <X className="h-3.5 w-3.5 shrink-0" />
                    }
                    {text}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              {isCurrentPlan ? (
                <Button variant="outline" className="w-full" disabled>
                  ✓ Current plan
                </Button>
              ) : isDowngrade ? (
                <Button variant="ghost" className="w-full text-muted-foreground" disabled>
                  Downgrade
                </Button>
              ) : isBillingPlan ? (
                <Button
                  className={cn("w-full gap-2", p.highlight ? "" : "variant-outline")}
                  variant={p.highlight ? "default" : "outline"}
                  onClick={() => handleCheckout(p.id as BillingPlan)}
                  disabled={loading}
                >
                  {checkingOut === p.id ? (
                    <span className="flex items-center gap-2">
                      <span className="h-3.5 w-3.5 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                      Processing…
                    </span>
                  ) : (
                    <>
                      <Heart className="h-3.5 w-3.5" />
                      {p.cta}
                    </>
                  )}
                </Button>
              ) : null}

              {isBillingPlan && !isCurrentPlan && !isDowngrade && (
                <p className="text-[10px] text-center text-muted-foreground mt-2">
                  Secure · Razorpay · Cancel anytime
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
