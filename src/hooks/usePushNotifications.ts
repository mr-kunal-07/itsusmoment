// Push notifications are handled via the in-app notification system (notifications table + realtime).
// Web Push / VAPID has been removed. This file is kept as a no-op stub so existing imports don't break.

/** No-op: in-app notifications (bell icon) handle partner alerts without VAPID. */
export function usePushSubscription(): void {
  // Nothing to do — subscription is handled by in-app realtime notifications
}

/** No-op stub — kept so import sites compile without changes. */
export async function pushToPartner(
  _title: string,
  _body: string,
  _url?: string
): Promise<void> {
  // Web Push removed. Partners are notified via the in-app notifications system.
}
