/**
 * @module features/prayer/services/prayerTracker
 *
 * Service for tracking namaz status (completed, missed, qaza).
 * Handles localStorage preservation and Supabase synchronization.
 */

import { PrayerName, PrayerStatus as DBPrayerStatus } from "@shared/types/supabase";
import { upsertPrayerLog, getPrayerLogs } from "./prayer.persistence";

export type TrackingStatus = "pending" | "completed" | "missed" | "qaza";

export interface DailyTracking {
  date: string; // YYYY-MM-DD
  prayers: Record<string, TrackingStatus>;
}

const STORAGE_KEY = "sirat-prayer-tracking";

class PrayerTrackerService {
  private getToday(): string {
    return new Date().toISOString().split("T")[0] || "";
  }

  /**
   * Get tracking for a specific date from local storage
   */
  getDailyTracking(date: string = this.getToday()): DailyTracking {
    try {
      const stored = typeof window !== "undefined" ? localStorage.getItem(`${STORAGE_KEY}-${date}`) : null;
      if (stored) {
        return JSON.parse(stored) as DailyTracking;
      }
    } catch (e) {
      console.error("Failed to load tracking from storage", e);
    }
    
    return {
      date,
      prayers: {
        fajr: "pending",
        dhuhr: "pending",
        asr: "pending",
        maghrib: "pending",
        isha: "pending",
      },
    };
  }

  /**
   * Update status for a prayer and sync with remote if possible
   */
  async updateStatus(
    prayerName: string,
    status: TrackingStatus,
    date: string = this.getToday()
  ): Promise<void> {
    const tracking = this.getDailyTracking(date);
    tracking.prayers[prayerName] = status;
    
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem(`${STORAGE_KEY}-${date}`, JSON.stringify(tracking));
      }
    } catch (e) {
      console.error("Failed to save tracking to storage", e);
    }

    // Sync with Supabase if the status matches DB types
    // Map 'qaza' to 'qada' for DB consistency
    const dbStatus = status === "qaza" ? "qada" : status;

    if (dbStatus === "completed" || dbStatus === "missed" || dbStatus === "qada") {
      await upsertPrayerLog({
        userId: "", // Handled inside upsertPrayerLog via getUser()
        prayerName: prayerName as PrayerName,
        date,
        status: dbStatus as DBPrayerStatus,
        onTime: status === "completed",
      });
    }
  }

  /**
   * Mark a prayer as missed (Qaza) if it's still pending when the next one begins
   */
  async autoMarkMissed(prayerName: string, date: string = this.getToday()): Promise<void> {
    const tracking = this.getDailyTracking(date);
    if (tracking.prayers[prayerName] === "pending") {
      await this.updateStatus(prayerName, "missed", date);
    }
  }

  /**
   * Sync local tracking with Supabase logs
   */
  async syncWithRemote(date: string = this.getToday()): Promise<DailyTracking> {
    const logs = await getPrayerLogs(date);
    const tracking = this.getDailyTracking(date);
    
    logs.forEach(log => {
      const status = log.status === "qada" ? "qaza" : log.status;
      tracking.prayers[log.prayerName] = status as TrackingStatus;
    });
    
    localStorage.setItem(`${STORAGE_KEY}-${date}`, JSON.stringify(tracking));
    return tracking;
  }
}

export const prayerTracker = new PrayerTrackerService();
