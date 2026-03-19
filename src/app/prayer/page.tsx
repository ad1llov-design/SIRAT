/**
 * @module app/prayer/page
 *
 * Страница времён намазов и обучения намазу.
 */

"use client";

import React from "react";
import dynamic from "next/dynamic";
import { Landmark } from "lucide-react";
import { usePrayerTimes } from "@features/prayer/hooks/usePrayerTimes";

const PrayerWidget = dynamic(
  () => import("@features/prayer/components/PrayerWidget").then((m) => m.PrayerWidget),
  { ssr: false, loading: () => <div className="h-48 animate-pulse rounded-2xl bg-neutral-100 dark:bg-neutral-800" /> }
);

const DailyFlowModal = dynamic(
  () => import("@features/prayer/components/DailyFlowModal").then((m) => m.DailyFlowModal),
  { ssr: false }
);

const PrayerHistory = dynamic(
  () => import("@features/prayer/components/PrayerHistory").then((m) => m.PrayerHistory),
  { ssr: false }
);

const PrayerTimesList = dynamic(
  () => import("@features/prayer/components/PrayerTimesList").then((m) => m.PrayerTimesList),
  {
    ssr: false,
    loading: () => (
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-2xl bg-neutral-50 dark:bg-neutral-900" />
        ))}
      </div>
    ),
  }
);

const PrayerStructure = dynamic(
  () => import("@features/prayer/components/PrayerStructure").then((m) => m.PrayerStructure),
  { ssr: false }
);

const SalahSteps = dynamic(
  () => import("@features/prayer/components/SalahSteps").then((m) => m.SalahSteps),
  { ssr: false }
);

const VideoTutorial = dynamic(
  () => import("@features/prayer/components/VideoTutorial").then((m) => m.VideoTutorial),
  { ssr: false }
);

export default function PrayerPage() {
  const { isLoading, showModal, setShowModal, modalPrayer } = usePrayerTimes();

  return (
    <div className="min-h-screen bg-background text-main pb-24 pt-4">
      {/* 0. Daily Flow Modal */}
      <DailyFlowModal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)} 
        prayer={modalPrayer} 
      />

      <div className="mx-auto max-w-lg px-4 py-8 sm:py-12">
        {/* Page header */}
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gold-500/10 text-gold-600 dark:bg-gold-500/20 dark:text-gold-400">
            <Landmark className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl italic">
            Намаз
          </h1>
          <p className="mt-2 text-sm text-muted-foreground uppercase tracking-widest font-medium">
            Ваш духовный путь к дисциплине
          </p>
        </div>

        {/* 1. Dashboard Widget */}
        <section className="mb-10">
          <PrayerWidget />
        </section>

        {/* 2. Prayer Times */}
        <section className="mb-10">
          <PrayerTimesList />
        </section>

        {/* 3. History & Qaza */}
        <section className="mb-12">
          <PrayerHistory />
        </section>

        {/* 4. Help & Learning */}
        <div className="space-y-12">
          <PrayerStructure />
          <SalahSteps />
          <VideoTutorial />
        </div>

        {/* Dua footer */}
        <div className="mt-16 rounded-3xl border border-gold-200 bg-gradient-to-br from-gold-50/50 to-white p-8 text-center dark:border-gold-800/50 dark:from-gold-950/20 dark:to-surface-dark shadow-sm">
          <p className="text-lg font-medium text-gold-700 italic dark:text-gold-300">
            «Воистину, намаз оберегает от мерзости и предосудительного»
          </p>
          <p className="mt-2 text-xs text-gold-600/60 dark:text-gold-400/40 uppercase tracking-widest font-bold">
            Коран, 29:45
          </p>
        </div>
      </div>
    </div>
  );
}
