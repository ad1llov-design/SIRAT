/**
 * @module features/prayer/components/DailyFlowModal
 *
 * Modal that asks the user if they've performed the prayer.
 */

"use client";

import { motion, AnimatePresence } from "framer-motion";
import { GlassCard } from "@shared/components/ui/GlassCard";
import { useLanguage } from "@shared/i18n/LanguageContext";
import { PrayerTime } from "../types/prayer.types";
import { prayerTracker } from "../services/prayerTracker";
import { usePrayerStore } from "../store/prayerStore";
import { CheckCircle2, XCircle } from "lucide-react";

interface DailyFlowModalProps {
  prayer: PrayerTime | null;
  isOpen: boolean;
  onClose: () => void;
}

export function DailyFlowModal({ prayer, isOpen, onClose }: DailyFlowModalProps) {
  const { t } = useLanguage();
  const updatePrayerStatus = usePrayerStore((state) => state.updatePrayerStatus);

  if (!prayer) return null;

  const handleAction = async (status: "completed" | "missed") => {
    await prayerTracker.updateStatus(prayer.name, status);
    updatePrayerStatus(prayer.name, status);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-neutral-900/60 backdrop-blur-md"
            onClick={onClose}
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-sm"
          >
            <GlassCard className="p-8 text-center space-y-6 bg-surface-light/95 dark:bg-neutral-900/95 shadow-2xl border-primary-500/20">
              <div className="mx-auto w-16 h-16 rounded-full bg-primary-500/10 flex items-center justify-center text-3xl mb-2">
                🕌
              </div>
              
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-neutral-900 dark:text-neutral-50 px-2">
                  Вы совершили намаз {t(`prayer.${prayer.name}`)}?
                </h3>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  Отмечая вовремя, вы помогаете себе сохранять дисциплину
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <button
                  onClick={() => handleAction("completed")}
                  className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-primary-500 text-white shadow-lg shadow-primary-500/25 hover:bg-primary-600 transition-all active:scale-95"
                >
                  <CheckCircle2 className="h-6 w-6" />
                  <span className="text-sm font-bold">Да</span>
                </button>
                <button
                  onClick={() => handleAction("missed")}
                  className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-all active:scale-95"
                >
                  <XCircle className="h-6 w-6 text-red-500" />
                  <span className="text-sm font-bold">Нет</span>
                </button>
              </div>
              
              <button
                onClick={onClose}
                className="text-xs text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors pt-2"
              >
                Напомнить позже
              </button>
            </GlassCard>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
