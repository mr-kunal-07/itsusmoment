import { useState } from "react";
import { Check, Zap, HardDrive, MessageSquare, Upload, Crown, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSubscription, usePlan, FREE_MONTHLY_UPLOAD_LIMIT } from "@/hooks/useSubscription";
import { useRazorpayCheckout, BillingPlan } from "@/hooks/useRazorpayCheckout";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const FREE_FEATURES = [
  { icon: HardDrive, text: "5 GB storage" },
  { icon: Upload, text: `${FREE_MONTHLY_UPLOAD_LIMIT} uploads / month` },
  { icon: MessageSquare, text: "Text messages only" },
];

const PRO_FEATURES = [
  { icon: HardDrive, text: "50 GB storage" },
  { icon: Upload, text: "Unlimited uploads" },
  { icon: MessageSquare, text: "Voice messages & reactions" },
  { icon: Zap, text: "Priority support" },
  { icon: Sparkles, text: "All future features" },
];

const PLANS = [
  {
    id: "pro_monthly" as BillingPlan,
    label: "Monthly",
    price: "₹499",
    period: "/month",
    badge: null,
    saving: null,
  },
  {
    id: "pro_yearly" as BillingPlan,
    label: "Yearly",
    price: "₹3,999",
    period: "/year",
    badge: "Best value",
    saving: "Save ₹1,989",
  },
];

export function BillingView() {
  const plan = usePlan();
  const { data: subscription } = useSubscription();
  const { checkout, loading } = useRazorpayCheckout();
  const [selectedPlan, setSelectedPlan] = useState<BillingPlan>("pro_monthly");

  const isPro = plan === "pro";

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Current plan badge */}
      <div className="flex items-center gap-3">
        <div className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium",
          isPro
            ? "bg-primary/10 text-primary border border-primary/30"
            : "bg-muted text-muted-foreground border border-border"
        )}>
          {isPro ? <Crown className="h-4 w-4" /> : <Zap className="h-4 w-4" />}
          {isPro ? "Pro plan" : "Free plan"}
        </div>
        {isPro && subscription?.current_period_end && (
          <span className="text-sm text-muted-foreground">
            Renews {format(new Date(subscription.current_period_end), "MMMM d, yyyy")}
          </span>
        )}
      </div>

      {isPro ? (
        <ProActiveCard subscription={subscription} />
      ) : (
        <>
          {/* Plan toggle */}
          <div className="grid grid-cols-2 gap-3">
            {PLANS.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedPlan(p.id)}
                className={cn(
                  "relative flex flex-col items-start gap-1 p-4 rounded-xl border text-left transition-all",
                  selectedPlan === p.id
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border bg-card hover:border-primary/40"
                )}
              >
                {p.badge && (
                  <Badge className="absolute top-3 right-3 text-xs bg-primary text-primary-foreground">
                    {p.badge}
                  </Badge>
                )}
                <span className="text-sm font-medium text-muted-foreground">{p.label}</span>
                <span className="text-2xl font-bold text-foreground font-heading">{p.price}</span>
                <span className="text-xs text-muted-foreground">{p.period}</span>
                {p.saving && (
                  <span className="text-xs text-primary font-medium mt-0.5">{p.saving}</span>
                )}
              </button>
            ))}
          </div>

          {/* Comparison */}
          <div className="grid sm:grid-cols-2 gap-4">
            {/* Free */}
            <div className="rounded-xl border border-border bg-card p-5 space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Free</p>
                <p className="text-3xl font-bold font-heading text-foreground">₹0</p>
                <p className="text-xs text-muted-foreground">forever</p>
              </div>
              <ul className="space-y-2.5">
                {FREE_FEATURES.map(({ icon: Icon, text }) => (
                  <li key={text} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                    <Icon className="h-4 w-4 shrink-0" />
                    {text}
                  </li>
                ))}
              </ul>
              <Button variant="outline" className="w-full" disabled>
                Current plan
              </Button>
            </div>

            {/* Pro */}
            <div className="relative rounded-xl border border-primary/40 bg-card p-5 space-y-4 shadow-md">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="bg-primary text-primary-foreground text-xs px-3 py-0.5 shadow">
                  ✦ Upgrade
                </Badge>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-1">Pro</p>
                <p className="text-3xl font-bold font-heading text-foreground">
                  {PLANS.find((p) => p.id === selectedPlan)?.price}
                </p>
                <p className="text-xs text-muted-foreground">
                  {PLANS.find((p) => p.id === selectedPlan)?.period}
                </p>
              </div>
              <ul className="space-y-2.5">
                {PRO_FEATURES.map(({ icon: Icon, text }) => (
                  <li key={text} className="flex items-center gap-2.5 text-sm text-foreground">
                    <Check className="h-4 w-4 shrink-0 text-primary" />
                    {text}
                  </li>
                ))}
              </ul>
              <Button
                className="w-full gap-2"
                onClick={() => checkout(selectedPlan)}
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    Processing…
                  </span>
                ) : (
                  <>
                    <Crown className="h-4 w-4" />
                    Upgrade to Pro
                  </>
                )}
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                Secure payment via Razorpay · Cancel anytime
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function ProActiveCard({ subscription }: { subscription: ReturnType<typeof useSubscription>["data"] }) {
  return (
    <div className="rounded-xl border border-primary/30 bg-primary/5 p-6 space-y-4">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
          <Crown className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="font-semibold text-foreground">Pro plan is active</p>
          <p className="text-sm text-muted-foreground">
            {subscription?.current_period_end
              ? `Valid until ${format(new Date(subscription.current_period_end), "MMMM d, yyyy")}`
              : "Lifetime access"}
          </p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 pt-1">
        {PRO_FEATURES.map(({ icon: Icon, text }) => (
          <div key={text} className="flex items-center gap-2 text-sm text-foreground">
            <Check className="h-4 w-4 text-primary shrink-0" />
            {text}
          </div>
        ))}
      </div>
    </div>
  );
}
