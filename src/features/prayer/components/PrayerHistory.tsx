/**
 * @module features/prayer/components/PrayerHistory
 *
 * Component for viewing prayer history and tracking Qaza prayers.
 */

"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { GlassCard } from "@shared/components/ui/GlassCard";
import { useLanguage } from "@shared/i18n/LanguageContext";
import { prayerTracker } from "../services/prayerTracker";
import { CheckCircle2, XCircle, Clock, ChevronLeft, ChevronRight, History } from "lucide-react";
import { cn } from "@shared/lib/utils";

export function PrayerHistory() {
  const { t } = useLanguage();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0] || "");
  const [dailyData, setDailyData] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      const tracking = await prayerTracker.syncWithRemote(selectedDate);
      setDailyData(tracking.prayers);
      setIsLoading(false);
    }
    loadData();
  }, [selectedDate]);

  const changeDate = (days: number) => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + days);
    const dateStr = date.toISOString().split("T")[0];
    if (dateStr) {
      setSelectedDate(dateStr);
    }
  };

  const prayers = [
    { id: "fajr", name: t("prayer.fajr"), icon: "🌅" },
    { id: "dhuhr", name: t("prayer.dhuhr"), icon: "☀️" },
    { id: "asr", name: t("prayer.asr"), icon: "🌤️" },
    { id: "maghrib", name: t("prayer.maghrib"), icon: "🌇" },
    { id: "isha", name: t("prayer.isha"), icon: "🌙" },
  ];

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-50 flex items-center gap-2">
          <History className="h-5 w-5 text-primary-500" />
          {t("prayer.history_title") || "История и Каза"}
        </h2>
        
        <div className="flex items-center gap-2 bg-neutral-100 dark:bg-neutral-800 rounded-xl px-2 py-1">
          <button onClick={() => changeDate(-1)} className="p-1 hover:text-primary-500 transition-colors">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-xs font-bold tabular-nums">
            {selectedDate === new Date().toISOString().split("T")[0] ? "Сегодня" : selectedDate}
          </span>
          <button 
            onClick={() => changeDate(1)} 
            disabled={selectedDate === new Date().toISOString().split("T")[0]}
            className="p-1 hover:text-primary-500 transition-colors disabled:opacity-30"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid gap-3">
        {prayers.map((p) => {
          const status = dailyData[p.id] || "pending";
          return (
            <GlassCard key={p.id} className="p-4 flex items-center justify-between border-neutral-200/50 dark:border-white/5">
              <div className="flex items-center gap-4">
                <span className="text-2xl">{p.icon}</span>
                <div>
                  <h4 className="font-bold text-sm text-neutral-900 dark:text-neutral-100">{p.name}</h4>
                  <p className="text-[10px] text-neutral-500 uppercase tracking-widest">
                    {status === "completed" ? "Выполнен" : status === "missed" ? "Пропущен" : status === "qaza" ? "Каза" : "Ожидание"}
                  </p>
                </div>
              </div>

              <div>
                {status === "completed" && <CheckCircle2 className="h-6 w-6 text-primary-500" />}
                {status === "missed" && <XCircle className="h-6 w-6 text-red-500" />}
                {status === "qaza" && <Clock className="h-6 w-6 text-yellow-500" />}
                {status === "pending" && <div className="h-6 w-6 rounded-full border-2 border-dashed border-neutral-300 dark:border-neutral-700" />}
              </div>
            </GlassCard>
          );
        })}
      </div>

      {/* Qaza Counter Summary */}
      <div className="rounded-2xl bg-primary-500/10 border border-primary-500/20 p-5 mt-4">
        <h4 className="text-sm font-bold text-primary-700 dark:text-primary-300 mb-2">Статистика по молитвам</h4>
        <div className="flex justify-between text-xs">
          <div className="text-center">
            <p className="text-neutral-500 dark:text-neutral-400">Пропущено</p>
            <p className="text-lg font-bold text-red-500">
              {Object.values(dailyData).filter(v => v === "missed").length}
            </p>
          </div>
          <div className="text-center">
            <p className="text-neutral-500 dark:text-neutral-400">Совершено</p>
            <p className="text-lg font-bold text-primary-500">
              {Object.values(dailyData).filter(v => v === "completed").length}
            </p>
          </div>
          <div className="text-center">
            <p className="text-neutral-500 dark:text-neutral-400">Осталось</p>
            <p className="text-lg font-bold text-neutral-400">
              {5 - Object.values(dailyData).filter(v => v !== "pending").length}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
