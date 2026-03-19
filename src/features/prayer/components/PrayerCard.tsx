/**
 * @module features/prayer/components/PrayerCard
 *
 * Prayer card — shows prayer name, time, and current/passed/upcoming status.
 * No auth, no database, no log tracking.
 */

"use client";

import { cn } from "@shared/lib/utils";
import type { PrayerTime, TrackingStatus } from "../types/prayer.types";
import { CheckCircle2, XCircle, Clock } from "lucide-react";
import { usePrayerStore } from "../store/prayerStore";
import { prayerTracker } from "../services/prayerTracker";
import { useLanguage } from "@shared/i18n/LanguageContext";

interface PrayerCardProps {
  prayer: PrayerTime;
  animated?: boolean;
}

export function PrayerCard({ prayer, animated = true }: PrayerCardProps) {
  const { t } = useLanguage();
  const { status, info, time, name } = prayer;
  const isCurrent = status === "current";
  const isPassed = status === "passed";

  const tracking = usePrayerStore((state) => state.tracking);
  const updatePrayerStatus = usePrayerStore((state) => state.updatePrayerStatus);
  const currentTracking = tracking[name] || "pending";

  const handleStatusUpdate = async (newStatus: TrackingStatus) => {
    await prayerTracker.updateStatus(name, newStatus);
    updatePrayerStatus(name, newStatus);
  };

  return (
    <div
      className={cn(
        "group relative flex w-full items-center justify-between rounded-2xl border p-4 transition-all duration-300 text-left",
        isCurrent && [
          "border-primary-300 bg-gradient-to-r from-primary-50 to-primary-100/50",
          "shadow-glow",
          "dark:border-primary-700 dark:from-primary-950/40 dark:to-primary-900/30",
          animated && "animate-pulse-soft",
        ],
        isPassed && [
          "border-neutral-100 bg-neutral-50/50",
          "dark:border-neutral-800 dark:bg-neutral-900/30",
        ],
        !isCurrent && !isPassed && [
          "border-neutral-200 bg-white hover:border-primary-200 hover:shadow-card",
          "dark:border-neutral-800 dark:bg-surface-dark-secondary dark:hover:border-primary-800",
        ],
      )}
    >
      {/* ── Left: Icon + Name ─────────────────── */}
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-lg transition-all",
            isCurrent && "bg-primary-100 dark:bg-primary-900/40",
            isPassed && "bg-neutral-100 dark:bg-neutral-800",
            !isCurrent && !isPassed && "bg-neutral-50 group-hover:bg-primary-50 dark:bg-neutral-800 dark:group-hover:bg-primary-950/30",
          )}
        >
          <span className={cn(isPassed && "opacity-40")}>{info.icon}</span>

          {/* Pulse for current prayer */}
          {isCurrent && animated && (
            <span className="absolute -right-0.5 -top-0.5 flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary-400 opacity-75" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-primary-500" />
            </span>
          )}
        </div>

        <div>
          <p
            className={cn(
              "text-sm font-semibold transition-colors",
              isCurrent && "text-primary-700 dark:text-primary-300",
              isPassed && "text-neutral-400 dark:text-neutral-600",
              !isCurrent && !isPassed && "text-neutral-800 dark:text-neutral-200",
            )}
          >
            {info.nameRu}
          </p>
          <p
            className={cn(
              "font-arabic text-xs transition-colors",
              isCurrent && "text-primary-500 dark:text-primary-400",
              isPassed && "text-neutral-300 dark:text-neutral-700",
              !isCurrent && !isPassed && "text-neutral-400 dark:text-neutral-500",
            )}
          >
            {info.nameAr}
          </p>
        </div>
      </div>

      {/* ── Right: Time + Status + Actions ────── */}
      <div className="flex items-center gap-3">
        {/* Status Indicator Icon */}
        <div className="flex items-center gap-1.5 mr-1">
          {currentTracking === "completed" && (
            <CheckCircle2 className="h-5 w-5 text-primary-500 animate-in zoom-in duration-300" />
          )}
          {currentTracking === "missed" && (
            <XCircle className="h-5 w-5 text-red-500 animate-in zoom-in duration-300" />
          )}
          {currentTracking === "qaza" && (
            <Clock className="h-5 w-5 text-yellow-500 animate-in zoom-in duration-300" />
          )}
        </div>

        <div className="flex flex-col items-end gap-1">
          <p
            className={cn(
              "font-mono text-base font-bold tabular-nums transition-colors",
              isCurrent && "text-primary-700 dark:text-primary-300",
              isPassed && "text-neutral-300 dark:text-neutral-700",
              !isCurrent && !isPassed && "text-neutral-900 dark:text-neutral-100",
              currentTracking === "completed" && "text-primary-600 dark:text-primary-400 font-extrabold",
            )}
          >
            {time}
          </p>
          
          {/* Action Buttons for Current or Passed */}
          {(isCurrent || isPassed) && currentTracking === "pending" && (
            <div className="flex gap-2 mt-1 animate-in fade-in slide-in-from-right-2 duration-300">
              <button
                onClick={(e) => { e.stopPropagation(); handleStatusUpdate("completed"); }}
                className="rounded-lg bg-primary-100 px-2 py-1 text-[10px] font-bold text-primary-700 dark:bg-primary-900/40 dark:text-primary-300 transition-transform active:scale-95"
              >
                Совершил
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handleStatusUpdate("missed"); }}
                className="rounded-lg bg-red-50 px-2 py-1 text-[10px] font-bold text-red-600 dark:bg-red-950/20 dark:text-red-400 transition-transform active:scale-95"
              >
                Пропустил
              </button>
            </div>
          )}
          
          {/* Status Label */}
          {currentTracking !== "pending" && (
            <span className={cn(
              "text-[10px] font-bold uppercase tracking-wider",
              currentTracking === "completed" ? "text-primary-500" : 
              currentTracking === "missed" ? "text-red-400" : "text-yellow-500"
            )}>
              {currentTracking === "completed" ? "Принят" : 
               currentTracking === "missed" ? "Пропущен" : "Каза"}
            </span>
          )}
        </div>
      </div>

      {/* ── Current prayer accent ──── */}
      {isCurrent && (
        <div className="absolute inset-y-2 left-0 w-1 rounded-full bg-primary-500" />
      )}
    </div>
  );
}
