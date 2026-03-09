import { useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const buf = new ArrayBuffer(rawData.length);
  const view = new Uint8Array(buf);
  for (let i = 0; i < rawData.length; i++) view[i] = rawData.charCodeAt(i);
  return buf;
}

async function getVapidPublicKey(): Promise<string | null> {
  try {
    const { data, error } = await supabase.functions.invoke("send-push", {
      method: "GET",
    } as never);
    if (error || !data?.publicKey) return null;
    return data.publicKey as string;
  } catch {
    return null;
  }
}

async function saveSubscription(userId: string, sub: PushSubscription): Promise<void> {
  const json = sub.toJSON();
  const keys = json.keys as { p256dh: string; auth: string } | undefined;
  if (!keys?.p256dh || !keys?.auth) return;

  await supabase
    .from("push_subscriptions" as never)
    .upsert(
      {
        user_id: userId,
        endpoint: sub.endpoint,
        p256dh: keys.p256dh,
        auth_key: keys.auth,
      } as never,
      { onConflict: "user_id,endpoint" }
    );
}

// ---------------------------------------------------------------------------
// Subscribe the current user to Web Push (called on app load)
// ---------------------------------------------------------------------------

async function subscribeToPush(userId: string): Promise<void> {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;

  try {
    // Request permission if not yet granted
    let permission = Notification.permission;
    if (permission === "default") {
      permission = await Notification.requestPermission();
    }
    if (permission !== "granted") return;

    const registration = await navigator.serviceWorker.ready;

    // Check if already subscribed
    let sub = await registration.pushManager.getSubscription();

    if (!sub) {
      const vapidKey = await getVapidPublicKey();
      if (!vapidKey) {
        console.warn("[Push] VAPID public key not configured yet");
        return;
      }

      sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });
    }

    // Always upsert to DB (handles re-subscriptions / new devices)
    await saveSubscription(userId, sub);
  } catch (err) {
    console.warn("[Push] Subscribe failed:", err);
  }
}

// ---------------------------------------------------------------------------
// Hook — auto-subscribes logged-in user
// ---------------------------------------------------------------------------

export function usePushSubscription(): void {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    // Small delay so SW is ready before we try
    const timer = setTimeout(() => subscribeToPush(user.id), 3000);
    return () => clearTimeout(timer);
  }, [user?.id]);
}

// ---------------------------------------------------------------------------
// Send push to partner — called after mutations (message, upload, milestone)
// ---------------------------------------------------------------------------

export async function pushToPartner(
  title: string,
  body: string,
  url?: string
): Promise<void> {
  try {
    await supabase.functions.invoke("send-push", {
      body: { title, body, url: url ?? "/dashboard" },
    });
  } catch (err) {
    // Non-fatal — push is best-effort
    console.warn("[Push] pushToPartner failed:", err);
  }
}
