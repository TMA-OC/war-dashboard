// notifications.ts — Service worker registration + local notification helpers

let swRegistration: ServiceWorkerRegistration | null = null;

/**
 * Request notification permission and register the service worker.
 * Returns true if permission was granted.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window) || !('serviceWorker' in navigator)) {
    return false;
  }

  let permission = Notification.permission;

  if (permission === 'default') {
    permission = await Notification.requestPermission();
  }

  if (permission !== 'granted') return false;

  try {
    swRegistration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    // Wait for the SW to be active
    await navigator.serviceWorker.ready;
    return true;
  } catch (err) {
    console.error('[notifications] SW registration failed:', err);
    return false;
  }
}

/**
 * Send a local notification via the service worker using postMessage.
 * Confidence drives the urgency/vibration pattern.
 */
export async function sendLocalNotification(
  title: string,
  body: string,
  confidence: number
): Promise<void> {
  if (typeof window === 'undefined' || Notification.permission !== 'granted') return;

  try {
    // Ensure we have a registration
    if (!swRegistration) {
      swRegistration = await navigator.serviceWorker.getRegistration('/');
    }
    if (!swRegistration?.active) return;

    swRegistration.active.postMessage({
      type: 'SHOW_NOTIFICATION',
      title,
      body,
      confidence,
    });
  } catch (err) {
    console.error('[notifications] Failed to send notification:', err);
  }
}
