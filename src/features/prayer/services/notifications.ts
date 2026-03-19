/**
 * @module features/prayer/services/notifications
 *
 * Service for managing prayer time notifications.
 */

class NotificationService {
  private hasPermission: boolean = false;

  constructor() {
    if (typeof window !== "undefined") {
      this.hasPermission = Notification.permission === "granted";
    }
  }

  async requestPermission(): Promise<boolean> {
    if (typeof window === "undefined" || !("Notification" in window)) {
      return false;
    }

    if (Notification.permission === "granted") {
      this.hasPermission = true;
      return true;
    }

    const permission = await Notification.requestPermission();
    this.hasPermission = permission === "granted";
    return this.hasPermission;
  }

  async showNotification(title: string, options?: NotificationOptions): Promise<void> {
    if (!this.hasPermission) {
      const granted = await this.requestPermission();
      if (!granted) return;
    }

    if ("serviceWorker" in navigator) {
      const registration = await navigator.serviceWorker.ready;
      registration.showNotification(title, {
        icon: "/icons/icon-192x192.png",
        badge: "/icons/icon-192x192.png",
        vibrate: [200, 100, 200],
        ...options,
      } as any);
    } else {
      new Notification(title, options);
    }
  }

  /**
   * Schedule a reminder if not already completed
   */
  async scheduleReminder(prayerName: string, minutesFromNow: number): Promise<void> {
    // Note: True background scheduling usually requires a push server or Periodic Sync API.
    // For this PWA, we use a client-side timeout as a "living" reminder if the app is in memory,
    // and rely on the Service Worker for event-based triggers if implemented.
    
    setTimeout(async () => {
      // Re-verify if still pending before showing
      const { prayerTracker } = await import("./prayerTracker");
      const tracking = prayerTracker.getDailyTracking();
      
      if (tracking.prayers[prayerName] === "pending") {
        this.showNotification(`Напоминание: ${prayerName}`, {
          body: `Вы еще не отметили ${prayerName}. Пожалуйста, совершите намаз.`,
          tag: `prayer-reminder-${prayerName}`,
          renotify: true,
        } as any);
        
        // Reschedule every 30-50 mins
        this.scheduleReminder(prayerName, 30);
      }
    }, minutesFromNow * 60 * 1000);
  }
}

export const notificationService = new NotificationService();
