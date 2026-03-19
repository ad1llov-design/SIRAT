/**
 * @module features/prayer/hooks/usePrayerTimes
 *
 * Центральный хук для работы с временами намаза.
 * Интегрирует: Геолокацию, API, Zustand Store, Трекинг и Уведомления.
 */

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  calculatePrayerStatuses,
  getCurrentPrayer,
  getNextPrayer,
  fetchPrayerTimes,
  parsePrayerTimes,
} from "../services/prayer.api";
import {
  getLocation,
  loadSavedLocation,
  saveLocation,
} from "../services/geolocation";
import { prayerTracker } from "../services/prayerTracker";
import { notificationService } from "../services/notifications";
import { usePrayerStore } from "../store/prayerStore";
import type { PrayerTime } from "../types/prayer.types";

/* ── Hook ───────────────────────────────────────────────────────────── */

export function usePrayerTimes() {
  const store = usePrayerStore();
  const [showModal, setShowModal] = useState(false);
  const [modalPrayer, setModalPrayer] = useState<PrayerTime | null>(null);
  
  const refreshInterval = useRef<NodeJS.Timeout>();
  const lastCheckedPrayer = useRef<string | null>(null);

  /**
   * Загружает времена намазов: гео → API → парсинг → store
   */
  const loadPrayerTimes = useCallback(async () => {
    store.setLoading(true);
    store.setError(null);

    try {
      // 1. Получаем геолокацию (cached → browser → IP → fallback)
      console.log("[usePrayerTimes] Loading location...");
      let location = loadSavedLocation();
      if (!location) {
        console.log("[usePrayerTimes] No saved location, requesting fresh...");
        location = await getLocation();
        saveLocation(location);
      }
      store.setLocation(location);
      if (location.country) {
        (globalThis as any).siratCountry = location.country;
      }

      // 2. Запрашиваем API
      console.log("[usePrayerTimes] Fetching times for", location.coords);
      const apiResponse = await fetchPrayerTimes(location.coords);

      // 3. Парсим времена
      const prayers = parsePrayerTimes(apiResponse);
      if (prayers.length === 0) throw new Error("API вернул пустой список времен");

      // 4. Обновляем store
      const now = new Date();
      const prayersWithStatus = calculatePrayerStatuses(prayers, now);
      
      store.setPrayers(prayersWithStatus);
      store.setCurrentPrayer(getCurrentPrayer(prayersWithStatus));
      store.setNextPrayer(getNextPrayer(prayersWithStatus));

      // 5. Hijri дата
      const hijri = apiResponse.data.date.hijri;
      store.setHijriDate(
        `${hijri.day} ${hijri.month.ru || hijri.month.ar} ${hijri.year}`,
      );
      store.setGregorianDate(apiResponse.data.date.readable);

      // 6. Sync tracking
      const today = new Date().toISOString().split("T")[0] || "";
      const tracking = await prayerTracker.syncWithRemote(today);
      store.setTracking(tracking.prayers);

    } catch (err) {
      console.error("[usePrayerTimes] Error loading prayer times:", err);
      const message =
        err instanceof Error ? err.message : "Не удалось загрузить намазы";
      store.setError(message);
    } finally {
      store.setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Обновляет статусы (current/next) без повторного запроса к API
   */
  const refreshStatuses = useCallback(() => {
    if (store.prayers.length === 0) return;

    // Update statuses based on current time
    const now = new Date();
    const updatedPrayers = calculatePrayerStatuses(store.prayers, now);
    const current = updatedPrayers.find((p) => p.status === "current") || null;
    const next = updatedPrayers.find((p) => p.status === "upcoming") || null;

    // Trigger Notification when prayer starts
    if (current && current.name !== lastCheckedPrayer.current) {
      notificationService.showNotification(`Время намаза: ${current.info.nameRu}`, {
        body: `Наступило время молитвы ${current.info.nameRu}.`,
      });
      notificationService.scheduleReminder(current.name, 30);
      lastCheckedPrayer.current = current.name;
    }

    // Trigger Modal when a prayer becomes "passed" and was not completed
    const justPassed = updatedPrayers.find(p => p.status === "passed" && store.prayers.find(oldP => oldP.name === p.name && oldP.status === "current"));
    if (justPassed && store.tracking[justPassed.name] === "pending") {
      setModalPrayer(justPassed);
      setShowModal(true);
    }

    store.setPrayers(updatedPrayers);
    store.setCurrentPrayer(current);
    store.setNextPrayer(next);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.prayers, store.tracking, setShowModal, setModalPrayer]);

  /**
   * Принудительно обновить с новой геолокацией
   */
  const refreshLocation = useCallback(async () => {
    // Сбрасываем кэш
    try { localStorage.removeItem("sirat-location"); } catch {}
    await loadPrayerTimes();
  }, [loadPrayerTimes]);

  // ── Effects ────────────────────────────────────────────────────────

  // Инициализация при монтировании
  useEffect(() => {
    void loadPrayerTimes();
  }, [loadPrayerTimes]);

  // Обновление статусов каждые 30 секунд
  useEffect(() => {
    refreshInterval.current = setInterval(refreshStatuses, 30_000);
    return () => {
      if (refreshInterval.current) clearInterval(refreshInterval.current);
    };
  }, [refreshStatuses]);

  return {
    prayers: store.prayers,
    currentPrayer: store.currentPrayer,
    nextPrayer: store.nextPrayer,
    hijriDate: store.hijriDate,
    gregorianDate: store.gregorianDate,
    location: store.location,
    isLoading: store.isLoading,
    error: store.error,
    showModal,
    setShowModal,
    modalPrayer,
    refresh: loadPrayerTimes,
    refreshLocation,
  };
}
