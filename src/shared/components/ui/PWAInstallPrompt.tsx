/**
 * @module shared/components/ui/PWAInstallPrompt
 * 
 * Component that shows a button to install the app as a PWA.
 */

"use client";

import { usePWA } from "@shared/hooks/usePWA";
import { motion, AnimatePresence } from "framer-motion";

export function PWAInstallPrompt() {
  const { isInstallable, installPWA } = usePWA();

  return (
    <AnimatePresence>
      {isInstallable && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9, x: "-50%" }}
          animate={{ opacity: 1, y: 0, scale: 1, x: "-50%" }}
          exit={{ opacity: 0, y: 50, scale: 0.9, x: "-50%" }}
          className="fixed bottom-24 md:bottom-6 left-1/2 z-[100] w-[calc(100%-2rem)] max-w-md"
        >
          <div className="flex items-center justify-between gap-4 rounded-3xl border border-primary-200 bg-white/90 p-4 shadow-2xl backdrop-blur-xl dark:border-primary-800/40 dark:bg-surface-dark/90">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary-100 text-2xl dark:bg-primary-950/40">
                ☪
              </div>
              <div>
                <p className="text-sm font-bold text-neutral-900 dark:text-neutral-50">
                  Установить SIRAT
                </p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Добавьте на главный экран для быстрого доступа
                </p>
              </div>
            </div>
            <button
              onClick={installPWA}
              className="rounded-xl bg-primary-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-primary-700 active:scale-95"
            >
              Установить
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
