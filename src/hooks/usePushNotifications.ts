import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

function isStandalonePwa(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function base64UrlToUint8Array(base64Url: string): Uint8Array {
  const padding = "=".repeat((4 - (base64Url.length % 4)) % 4);
  const base64 = `${base64Url}${padding}`.replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  return Uint8Array.from(raw, (char) => char.charCodeAt(0));
}

async function getVapidPublicKey(accessToken: string): Promise<string | null> {
  const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-push`, {
    method: "GET",
    headers: {
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) return null;

  const data = (await response.json()) as { publicKey?: string };
  return data.publicKey ?? null;
}

async function saveSubscription(userId: string, subscription: PushSubscription): Promise<void> {
  const json = subscription.toJSON();
  const p256dh = json.keys?.p256dh;
  const authKey = json.keys?.auth;

  if (!subscription.endpoint || !p256dh || !authKey) return;

  await supabase
    .from("push_subscriptions")
    .delete()
    .eq("user_id", userId)
    .eq("endpoint", subscription.endpoint);

  await supabase.from("push_subscriptions").insert({
    user_id: userId,
    endpoint: subscription.endpoint,
    p256dh,
    auth_key: authKey,
  });
}

export function usePushSubscription(): void {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) return;
    if (!isStandalonePwa()) return;

    let cancelled = false;

    const subscribe = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.user || cancelled) return;

        const registration = await navigator.serviceWorker.ready;
        if (cancelled) return;

        let permission = Notification.permission;
        if (permission === "default") {
          permission = await Notification.requestPermission();
        }
        if (permission !== "granted" || cancelled) return;

        let subscription = await registration.pushManager.getSubscription();
        if (!subscription) {
          const publicKey = await getVapidPublicKey(session.access_token);
          if (!publicKey || cancelled) return;

          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: base64UrlToUint8Array(publicKey),
          });
        }

        if (!subscription || cancelled) return;
        await saveSubscription(session.user.id, subscription);
      } catch (error) {
        console.warn("Push subscription setup failed:", error);
      }
    };

    void subscribe();

    return () => {
      cancelled = true;
    };
  }, []);
}

export async function pushToPartner(title: string, body: string, url = "/dashboard"): Promise<void> {
  try {
    await supabase.functions.invoke("send-push", {
      body: { title, body, url },
    });
  } catch (error) {
    console.warn("pushToPartner failed:", error);
  }
}
