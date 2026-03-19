"use client";

import { usePrayerTimes } from "../hooks/usePrayerTimes";
import { useCountdown } from "../hooks/useCountdown";
import { usePrayerStore } from "../store/prayerStore";
import { CircularProgress } from "@shared/components/ui/CircularProgress";
import { cn } from "@shared/lib/utils";
import { Sunrise, Sun, SunMedium, Sunset, Moon, CheckCircle2 } from "lucide-react";
import { useLanguage } from "@shared/i18n/LanguageContext";

const PRAYER_ICONS: Record<string, React.ReactNode> = {
  fajr: <Sunrise className="h-6 w-6" />,
  sunrise: <Sunrise className="h-6 w-6" />,
  dhuhr: <Sun className="h-6 w-6" />,
  asr: <SunMedium className="h-6 w-6" />,
  maghrib: <Sunset className="h-6 w-6" />,
  isha: <Moon className="h-6 w-6" />,
};

/**
 * Prayer Widget — shows prayer times + countdown to next prayer.
 * No auth, no database, no progress tracking.
 */
export function PrayerWidget({ className }: { className?: string }) {
  const { t } = useLanguage();
  const { prayers, currentPrayer, nextPrayer, isLoading } = usePrayerTimes();
  const { formatted } = useCountdown(nextPrayer?.dateTime ?? null);
  const tracking = usePrayerStore((state) => state.tracking);

  const fardhPrayers = prayers.filter((p) => p.info.isFard);
  const completedCount = fardhPrayers.filter(p => tracking[p.name] === "completed").length;
  const totalFard = fardhPrayers.length || 5;
  const progressPercent = (completedCount / totalFard) * 100;

  if (isLoading) {
    return (
      <div className={cn("relative overflow-hidden rounded-3xl border border-border bg-surface shadow-card p-6", className)}>
        <div className="flex flex-col items-center justify-center gap-6">
          <div className="flex w-full items-center justify-between">
            <h2 className="text-sm font-semibold tracking-wider text-muted uppercase">{t("dashboard.prayer_desc")}</h2>
            <div className="h-6 w-16 bg-border rounded-full animate-pulse" />
          </div>
          <div className="h-36 w-36 rounded-full bg-border animate-pulse" />
          <div className="flex w-full items-center justify-between gap-1 overflow-x-auto pb-2 border-t border-border pt-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-1.5 p-1 flex-shrink-0">
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-2xl bg-border animate-pulse" />
                <div className="h-2 w-8 bg-border rounded-full animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("relative overflow-hidden rounded-3xl border border-border bg-surface shadow-card p-6", className)}>
      <div className="flex flex-col items-center justify-center gap-6">
        {/* Header */}
        <div className="flex w-full items-center justify-between">
          <h2 className="text-sm font-semibold tracking-wider text-muted uppercase">{t("dashboard.prayer_desc")}</h2>
        </div>

        {/* Countdown Circle */}
        <CircularProgress
          value={progressPercent}
          size={140}
          strokeWidth={10}
          colorClass="text-primary-500 drop-shadow-md"
          trackColorClass="text-border"
        >
          <div className="flex flex-col items-center justify-center">
            {nextPrayer ? (
              <>
                <span className="text-2xl font-bold tabular-nums text-main">{formatted}</span>
                <span className="text-[0.65rem] uppercase tracking-wider text-muted">{t("prayer.until")} {t(`prayer.${nextPrayer.name}`)}</span>
                <div className="mt-1 flex items-center gap-1">
                  <span className="text-[10px] font-bold text-primary-600">{completedCount}/{totalFard}</span>
                  <CheckCircle2 className="h-2.5 w-2.5 text-primary-500" />
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center">
                <span className="text-xl font-bold text-main">{t("prayer.well_done")}</span>
                <span className="text-[10px] font-bold text-primary-600">{completedCount}/{totalFard}</span>
              </div>
            )}
          </div>
        </CircularProgress>

        {/* Prayer Times List */}
        <div className="flex w-full items-center justify-between gap-1 overflow-x-auto pb-2 border-t border-border pt-4">
          {fardhPrayers.map((prayer) => {
            const isActive = currentPrayer?.name === prayer.name;
            const timeStr = prayer.dateTime
              ? prayer.dateTime.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })
              : "--:--";

            return (
              <div
                key={prayer.name}
                className={cn(
                  "relative flex flex-col items-center justify-center gap-1.5 p-1 transition-all flex-shrink-0 min-w-[3rem]",
                  isActive ? "text-primary-600 dark:text-primary-400" : "text-muted",
                )}
              >
                <div
                  className={cn(
                    "flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-2xl border bg-surface transition-colors shadow-sm",
                    isActive && "border-primary-400 text-primary-500 ring-2 ring-primary-100 dark:ring-primary-900",
                    !isActive && "border-border",
                  )}
                >
                  <span className="flex items-center justify-center mb-0.5 scale-90 sm:scale-100">{PRAYER_ICONS[prayer.name] || prayer.info.icon}</span>
                  
                  {/* Status Indicator Dot */}
                  {tracking[prayer.name] === "completed" && (
                    <div className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary-500 border-2 border-surface">
                      <CheckCircle2 className="h-2.5 w-2.5 text-white" />
                    </div>
                  )}
                  {(tracking[prayer.name] === "missed" || tracking[prayer.name] === "qaza") && (
                    <div className={cn(
                      "absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-surface",
                      tracking[prayer.name] === "missed" ? "bg-red-500" : "bg-yellow-500"
                    )}>
                      <div className="h-1.5 w-1.5 rounded-full bg-white" />
                    </div>
                  )}
                </div>
                <span className="text-[0.55rem] sm:text-[0.6rem] font-bold uppercase">{t(`prayer.${prayer.name}`)}</span>
                <span className="text-[0.5rem] sm:text-[0.55rem] font-mono text-muted tabular-nums">{timeStr}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
