import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, X, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMyCouple } from "@/hooks/useCouple";

export function PartnerBanner() {
  const { data: couple, isLoading } = useMyCouple();
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(false);

  if (isLoading || dismissed || couple?.status === "active") return null;

  return (
    <div className="mx-3 sm:mx-6 mt-3 mb-0 flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
      <div className="h-8 w-8 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
        <Link2 className="h-4 w-4 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">Connect with your partner 💕</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Share this vault with your partner — both can upload, edit and manage memories together.
        </p>
      </div>
      <Button
        size="sm"
        className="shrink-0 gap-1.5"
        onClick={() => navigate("/profile")}
      >
        <Heart className="h-3.5 w-3.5" />
        Connect
      </Button>
      <button
        onClick={() => setDismissed(true)}
        className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
