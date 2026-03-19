/**
 * @module features/prayer/store/prayerStore
 *
 * Zustand store для состояния модуля намазов.
 * Хранит: время намазов, текущий/следующий, геолокацию, ошибки.
 */

"use client";

import { create } from "zustand";
import { devtools } from "zustand/middleware";

import type {
  LocationInfo,
  PrayerState,
  PrayerTime,
  TrackingStatus,
} from "../types/prayer.types";

/* ── Actions interface ──────────────────────────────────────────────── */

interface PrayerActions {
  setPrayers: (prayers: PrayerTime[]) => void;
  setCurrentPrayer: (prayer: PrayerTime | null) => void;
  setNextPrayer: (prayer: PrayerTime | null) => void;
  setHijriDate: (date: string) => void;
  setGregorianDate: (date: string) => void;
  setLocation: (location: LocationInfo | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setTracking: (tracking: Record<string, TrackingStatus>) => void;
  updatePrayerStatus: (name: string, status: TrackingStatus) => void;
  reset: () => void;
}

/* ── Initial state ──────────────────────────────────────────────────── */

const initialState: PrayerState = {
  prayers: [],
  currentPrayer: null,
  nextPrayer: null,
  hijriDate: "",
  gregorianDate: "",
  location: null,
  isLoading: true,
  error: null,
  tracking: {},
};

/* ── Store ──────────────────────────────────────────────────────────── */

export const usePrayerStore = create<PrayerState & PrayerActions>()(
  devtools(
    (set) => ({
      ...initialState,

      setPrayers: (prayers) =>
        set({ prayers }, false, "prayer/setPrayers"),

      setCurrentPrayer: (currentPrayer) =>
        set({ currentPrayer }, false, "prayer/setCurrentPrayer"),

      setNextPrayer: (nextPrayer) =>
        set({ nextPrayer }, false, "prayer/setNextPrayer"),

      setHijriDate: (hijriDate) =>
        set({ hijriDate }, false, "prayer/setHijriDate"),

      setGregorianDate: (gregorianDate) =>
        set({ gregorianDate }, false, "prayer/setGregorianDate"),

      setLocation: (location) =>
        set({ location }, false, "prayer/setLocation"),

      setLoading: (isLoading) =>
        set({ isLoading }, false, "prayer/setLoading"),

      setError: (error) =>
        set({ error, isLoading: false }, false, "prayer/setError"),

      setTracking: (tracking) =>
        set({ tracking }, false, "prayer/setTracking"),

      updatePrayerStatus: (name, status) =>
        set((state) => ({
          tracking: { ...state.tracking, [name]: status }
        }), false, "prayer/updatePrayerStatus"),

      reset: () =>
        set(initialState, false, "prayer/reset"),
    }),
    { name: "PrayerStore" },
  ),
);
