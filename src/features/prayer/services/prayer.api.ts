/**
 * @module features/prayer/services/prayer.api
 *
 * Сервис для получения времён намазов с Aladhan API.
 * API: https://aladhan.com/prayer-times-api
 *
 * Архитектура:
 * 1. fetchPrayerTimes() — запрос к API по координатам
 * 2. parsePrayerTimes() — парсинг ответа в PrayerTime[]
 * 3. calculatePrayerStatuses() — определение current/next/passed
 */

import {
  type AladhanResponse,
  type CountdownTime,
  type GeoCoordinates,
  type PrayerName,
  type PrayerStatus,
  type PrayerTime,
  PRAYER_LIST,
} from "../types/prayer.types";

/* ── Constants ──────────────────────────────────────────────────────── */

const ALADHAN_BASE_URL = "https://api.aladhan.com/v1";

/**
 * Метод расчёта: 1 = University of Islamic Sciences, Karachi
 * Этот метод использует углы 18°/18°, что наиболее точно соответствует 
 * стандартам Муфтията Кыргызстана, Узбекистана и стран СНГ.
 * Параметр school=1 (Ханафи) — Аср наступает по второму тени (2× высота).
 */
const DEFAULT_METHOD = 1;  // University of Islamic Sciences, Karachi (18°/18°)
const DEFAULT_SCHOOL = 1;  // Hanafi madhab — for Asr

/** Названия намазов для извлечения из API (с большой буквы) */
const API_PRAYER_KEYS = ["Fajr", "Sunrise", "Dhuhr", "Asr", "Maghrib", "Isha"] as const;

/** Мапинг ключей API в наши внутренние ID (нижний регистр) */
const API_TO_INTERNAL_MAP: Record<string, PrayerName> = {
  Fajr: "fajr",
  Sunrise: "sunrise",
  Dhuhr: "dhuhr",
  Asr: "asr",
  Maghrib: "maghrib",
  Isha: "isha",
};

/* ── API Fetch ──────────────────────────────────────────────────────── */

/**
 * Получает времена намазов с Aladhan API
 * @param coords - координаты (latitude, longitude)
 * @param date - дата (по умолчанию сегодня)
 * @param method - метод расчёта (по умолчанию ISNA)
 */
export async function fetchPrayerTimes(
  coords: GeoCoordinates,
  date?: Date,
  method: number = DEFAULT_METHOD,
): Promise<AladhanResponse> {
  let path = "timings";
  if (date) {
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    path = `timings/${day}-${month}-${year}`;
  }

  let methodToUse = method;
  
  // Logic for country-specific methods
  // KG: Spiritual Board (fallback to Method 3: MWL)
  // UZ: Muslim Board (fallback to Method 1: Karachi)
  const country = (globalThis as any).siratCountry || "Global";
  if (country === "KG" || country === "Kyrgyzstan") {
    methodToUse = 3; // Muslim World League
  } else if (country === "UZ" || country === "Uzbekistan") {
    methodToUse = 1; // University of Islamic Sciences, Karachi
  }

  const url = `${ALADHAN_BASE_URL}/${path}?latitude=${coords.latitude}&longitude=${coords.longitude}&method=${methodToUse}&school=${DEFAULT_SCHOOL}`;
  
  console.log(`[PrayerAPI] Fetching for ${country}: ${url}`);

  const response = await fetch(url, {
    next: { revalidate: 600 }, // 10 minutes cache for better responsiveness during fixes
  });

  if (!response.ok) {
    throw new Error(`Ошибка API: ${response.status} ${response.statusText}`);
  }

  const data: AladhanResponse = await response.json();

  if (data.code !== 200) {
    throw new Error(`Aladhan API error: ${data.status}`);
  }

  return data;
}

/* ── Parse ──────────────────────────────────────────────────────────── */

function parseTimeString(timeStr: string | undefined, baseDateStr: string): Date {
  if (!timeStr) return new Date(0); // Fallback for missing time

  const cleanTime = timeStr.replace(/\s*\(.*\)/, "").trim();
  const [hours, minutes] = cleanTime.split(":").map(Number);
  
  if (baseDateStr) {
    const parts = baseDateStr.split("-").map(Number);
    const day = parts[0] ?? 1;
    const month = parts[1] ?? 1;
    const year = parts[2] ?? 2024;
    return new Date(year, month - 1, day, hours ?? 0, minutes ?? 0, 0, 0);
  }

  const date = new Date();
  date.setHours(hours ?? 0, minutes ?? 0, 0, 0);
  return date;
}

/**
 * Парсит ответ Aladhan API в массив PrayerTime с текущими статусами
 */
export function parsePrayerTimes(
  apiResponse: AladhanResponse,
  now?: Date,
): PrayerTime[] {
  const currentTime = now ?? new Date();
  const timings = apiResponse?.data?.timings;
  const gregorianDate = apiResponse?.data?.date?.gregorian?.date;

  if (!timings) {
    console.error("[PrayerAPI] No timings in response", apiResponse);
    return [];
  }

  // Создаём массив PrayerTime
  const prayers: PrayerTime[] = API_PRAYER_KEYS.map((apiKey) => {
    const timeStr = timings[apiKey];
    if (!timeStr) {
      console.warn(`[PrayerAPI] Missing timing for ${apiKey}`);
    }
    const dateTime = parseTimeString(timeStr, gregorianDate);
    const internalId = API_TO_INTERNAL_MAP[apiKey]!;
    const info = PRAYER_LIST.find((p) => p.name === internalId)!;

    return {
      name: internalId,
      time: (timeStr || "--:--").replace(/\s*\(.*\)/, "").trim(),
      dateTime,
      status: "upcoming" as PrayerStatus,
      info,
    };
  });

  // Рассчитываем статусы
  return calculatePrayerStatuses(prayers, currentTime);
}

/* ── Status Calculation ─────────────────────────────────────────────── */

/**
 * Определяет статус каждого намаза (passed, current, upcoming)
 *
 * Логика:
 * - passed: время намаза прошло И следующий намаз уже начался
 * - current: время намаза прошло, но следующий ещё не начался
 * - upcoming: время намаза ещё не наступило
 */
export function calculatePrayerStatuses(
  prayers: PrayerTime[],
  now: Date,
): PrayerTime[] {
  const nowMs = now.getTime();

  return prayers.map((prayer, index) => {
    const prayerMs = prayer.dateTime.getTime();
    const nextPrayer = prayers[index + 1];
    const nextPrayerMs = nextPrayer?.dateTime.getTime();

    let status: PrayerStatus;

    if (prayerMs > nowMs) {
      // Намаз ещё не начался
      status = "upcoming";
    } else if (nextPrayerMs && nowMs < nextPrayerMs) {
      // Текущее время между этим намазом и следующим — это ТЕКУЩИЙ
      status = "current";
    } else if (!nextPrayerMs && prayerMs <= nowMs) {
      // Последний намаз дня (Isha) — текущий если уже наступил
      status = "current";
    } else {
      // Время прошло
      status = "passed";
    }

    return { ...prayer, status };
  });
}

/* ── Current & Next ─────────────────────────────────────────────────── */

/**
 * Возвращает текущий намаз (status === "current")
 */
export function getCurrentPrayer(prayers: PrayerTime[]): PrayerTime | null {
  return prayers.find((p) => p.status === "current") ?? null;
}

/**
 * Возвращает следующий намаз (первый со статусом "upcoming")
 */
export function getNextPrayer(prayers: PrayerTime[]): PrayerTime | null {
  return prayers.find((p) => p.status === "upcoming") ?? null;
}

/* ── Countdown ──────────────────────────────────────────────────────── */

/**
 * Рассчитывает обратный отсчёт до целевого времени
 */
export function calculateCountdown(target: Date, now?: Date): CountdownTime {
  const currentTime = now ?? new Date();
  const diff = Math.max(0, target.getTime() - currentTime.getTime());

  const totalSeconds = Math.floor(diff / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return { hours, minutes, seconds, totalSeconds };
}

/* ── Formatting ─────────────────────────────────────────────────────── */

/**
 * Форматирует countdown в строку "HH:MM:SS"
 */
export function formatCountdown(countdown: CountdownTime): string {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${pad(countdown.hours)}:${pad(countdown.minutes)}:${pad(countdown.seconds)}`;
}

/**
 * Форматирует время в 24h формат
 */
export function formatTime(date: Date): string {
  return date.toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}
