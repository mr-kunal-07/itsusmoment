import { useState, useEffect } from "react";
import { Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PWAInstallPrompt() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(() => localStorage.getItem("pwa-dismissed") === "1");
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSHint, setShowIOSHint] = useState(false);

  useEffect(() => {
    // Check if iOS Safari (no beforeinstallprompt support)
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !(window as any).MSStream;
    const standalone = (window.navigator as any).standalone === true;
    setIsIOS(ios && !standalone);

    const handler = (e: Event) => {
      e.preventDefault();
      setPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!prompt) return;
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === "accepted") setPrompt(null);
  };

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem("pwa-dismissed", "1");
    setPrompt(null);
    setShowIOSHint(false);
  };

  // Already installed (standalone) or dismissed
  if (dismissed) return null;

  // Android / Chrome — native install prompt
  if (prompt) {
    return (
      <div className="fixed bottom-20 sm:bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 z-50 animate-in slide-in-from-bottom-4 duration-300">
        <div className="glass-card rounded-2xl p-4 shadow-xl flex items-start gap-3">
          <img src="/pwa-icon-192.png" alt="App icon" className="h-12 w-12 rounded-xl shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm font-heading">Install Our Vault</p>
            <p className="text-xs text-muted-foreground mt-0.5">Add to your home screen for the best experience</p>
            <div className="flex gap-2 mt-3">
              <Button size="sm" className="h-8 text-xs gap-1.5 flex-1" onClick={handleInstall}>
                <Download className="h-3.5 w-3.5" /> Install
              </Button>
              <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={handleDismiss}>
                Not now
              </Button>
            </div>
          </div>
          <button onClick={handleDismiss} className="text-muted-foreground hover:text-foreground shrink-0 mt-0.5">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  // iOS Safari — manual instructions
  if (isIOS && !showIOSHint) {
    return (
      <div className="fixed bottom-20 left-4 right-4 z-50 animate-in slide-in-from-bottom-4 duration-300">
        <div className="glass-card rounded-2xl p-4 shadow-xl flex items-start gap-3">
          <img src="/pwa-icon-192.png" alt="App icon" className="h-12 w-12 rounded-xl shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm font-heading">Install Our Vault</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Tap <span className="font-medium">Share</span> → <span className="font-medium">Add to Home Screen</span> to install
            </p>
          </div>
          <button onClick={handleDismiss} className="text-muted-foreground hover:text-foreground shrink-0 mt-0.5">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  return null;
}
