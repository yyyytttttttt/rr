/**
 * Простой парсер и генератор RRULE для поддержки повторяющихся блокировок
 * Поддерживает: FREQ=WEEKLY/MONTHLY с BYDAY, BYMONTHDAY, UNTIL, COUNT
 */

import { toZonedTime, fromZonedTime } from "date-fns-tz";
import { addDays, addMonths, isBefore, isAfter, startOfDay } from "date-fns";

// ================= Типы =================

export interface RRuleOptions {
  freq: "WEEKLY" | "MONTHLY";
  byday?: string[]; // ["MO", "TU", "WE", "TH", "FR", "SA", "SU"]
  bymonthday?: number[]; // [1, 15, -1] (последний день месяца)
  count?: number; // количество повторений
  until?: Date; // дата окончания (включительно)
}

export interface RRuleOccurrence {
  start: Date; // UTC
  end: Date; // UTC
}

// ================= Константы =================

const WEEKDAY_MAP: Record<string, number> = {
  MO: 1, // Monday
  TU: 2,
  WE: 3,
  TH: 4,
  FR: 5,
  SA: 6,
  SU: 0, // Sunday
};

// ================= Парсинг RRULE =================

/**
 * Парсит RRULE строку в объект опций
 * Пример: "FREQ=WEEKLY;BYDAY=MO,WE;COUNT=4"
 */
export function parseRRule(rruleString: string): RRuleOptions | null {
  try {
    const parts = rruleString.split(";");
    const options: Partial<RRuleOptions> = {};

    for (const part of parts) {
      const [key, value] = part.split("=");
      const upperKey = key.trim().toUpperCase();
      const upperValue = value?.trim().toUpperCase();

      if (upperKey === "FREQ") {
        if (upperValue === "WEEKLY" || upperValue === "MONTHLY") {
          options.freq = upperValue;
        } else {
          return null; // Неподдерживаемая частота
        }
      } else if (upperKey === "BYDAY") {
        options.byday = upperValue.split(",").map((d) => d.trim());
      } else if (upperKey === "BYMONTHDAY") {
        options.bymonthday = upperValue.split(",").map((d) => parseInt(d.trim(), 10));
      } else if (upperKey === "COUNT") {
        options.count = parseInt(upperValue, 10);
      } else if (upperKey === "UNTIL") {
        // UNTIL в формате YYYYMMDDTHHMMSSZ
        options.until = parseUntilDate(upperValue);
      }
    }

    if (!options.freq) {
      return null;
    }

    return options as RRuleOptions;
  } catch (e) {
    return null;
  }
}

/**
 * Парсит дату UNTIL из RRULE формата (YYYYMMDDTHHMMSSZ)
 */
function parseUntilDate(untilStr: string): Date {
  // Формат: 20251231T235959Z
  const year = parseInt(untilStr.substring(0, 4), 10);
  const month = parseInt(untilStr.substring(4, 6), 10) - 1; // 0-indexed
  const day = parseInt(untilStr.substring(6, 8), 10);
  const hour = parseInt(untilStr.substring(9, 11), 10) || 0;
  const minute = parseInt(untilStr.substring(11, 13), 10) || 0;
  const second = parseInt(untilStr.substring(13, 15), 10) || 0;

  return new Date(Date.UTC(year, month, day, hour, minute, second));
}

/**
 * Форматирует дату в RRULE UNTIL формат (YYYYMMDDTHHMMSSZ)
 */
export function formatUntilDate(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  const hour = String(date.getUTCHours()).padStart(2, "0");
  const minute = String(date.getUTCMinutes()).padStart(2, "0");
  const second = String(date.getUTCSeconds()).padStart(2, "0");

  return `${year}${month}${day}T${hour}${minute}${second}Z`;
}

// ================= Генерация вхождений =================

/**
 * Генерирует все вхождения повторяющегося события в заданном диапазоне
 *
 * @param rruleString - RRULE строка
 * @param baseStart - базовая дата начала события (в UTC)
 * @param baseEnd - базовая дата окончания события (в UTC)
 * @param rangeStart - начало диапазона поиска (в UTC)
 * @param rangeEnd - конец диапазона поиска (в UTC)
 * @param tzid - timezone для вычислений
 * @param rruleUntil - ограничитель повторения (опционально)
 * @returns массив вхождений
 */
export function generateOccurrences(
  rruleString: string,
  baseStart: Date,
  baseEnd: Date,
  rangeStart: Date,
  rangeEnd: Date,
  tzid: string,
  rruleUntil?: Date | null
): RRuleOccurrence[] {
  const options = parseRRule(rruleString);
  if (!options) {
    return [];
  }

  // Определяем конечную дату генерации
  let effectiveUntil = rangeEnd;
  if (options.until) {
    effectiveUntil = options.until < rangeEnd ? options.until : rangeEnd;
  }
  if (rruleUntil && rruleUntil < effectiveUntil) {
    effectiveUntil = rruleUntil;
  }

  const occurrences: RRuleOccurrence[] = [];
  let currentDate = new Date(baseStart);
  let count = 0;

  // Длительность базового события
  const duration = baseEnd.getTime() - baseStart.getTime();

  while (
    isBefore(currentDate, effectiveUntil) &&
    (!options.count || count < options.count)
  ) {
    // Генерируем вхождение
    if (shouldInclude(currentDate, options, tzid)) {
      const occStart = new Date(currentDate);
      const occEnd = new Date(currentDate.getTime() + duration);

      // Проверяем, попадает ли вхождение в диапазон поиска
      if (
        isBefore(occStart, rangeEnd) &&
        isAfter(occEnd, rangeStart)
      ) {
        occurrences.push({ start: occStart, end: occEnd });
        count++;
      } else if (isAfter(occStart, rangeEnd)) {
        // Вышли за пределы диапазона
        break;
      }
    }

    // Переходим к следующему кандидату
    if (options.freq === "WEEKLY") {
      currentDate = addDays(currentDate, 1);
    } else if (options.freq === "MONTHLY") {
      currentDate = addDays(currentDate, 1);
      // Для MONTHLY проверяем все дни месяца
    }

    // Защита от бесконечного цикла
    if (isAfter(currentDate, new Date(effectiveUntil.getTime() + 365 * 24 * 60 * 60 * 1000))) {
      break;
    }
  }

  return occurrences;
}

/**
 * Проверяет, должна ли дата быть включена согласно правилам RRULE
 */
function shouldInclude(date: Date, options: RRuleOptions, tzid: string): boolean {
  const zonedDate = toZonedTime(date, tzid);

  if (options.freq === "WEEKLY" && options.byday) {
    const dayOfWeek = zonedDate.getDay(); // 0 = Sunday, 6 = Saturday
    const dayNames = options.byday.map((d) => WEEKDAY_MAP[d]);
    return dayNames.includes(dayOfWeek);
  }

  if (options.freq === "MONTHLY" && options.bymonthday) {
    const dayOfMonth = zonedDate.getDate();
    return options.bymonthday.includes(dayOfMonth);
  }

  return false;
}

// ================= Валидация =================

/**
 * Валидирует RRULE строку
 */
export function validateRRule(rruleString: string): { valid: boolean; error?: string } {
  const options = parseRRule(rruleString);
  if (!options) {
    return { valid: false, error: "Неверный формат RRULE" };
  }

  if (options.freq === "WEEKLY" && !options.byday) {
    return { valid: false, error: "FREQ=WEEKLY требует BYDAY" };
  }

  if (options.freq === "MONTHLY" && !options.bymonthday) {
    return { valid: false, error: "FREQ=MONTHLY требует BYMONTHDAY" };
  }

  if (options.count && options.count < 1) {
    return { valid: false, error: "COUNT должен быть больше 0" };
  }

  return { valid: true };
}

// ================= Вспомогательные функции =================

/**
 * Создаёт RRULE строку из опций
 */
export function buildRRule(options: RRuleOptions): string {
  const parts: string[] = [`FREQ=${options.freq}`];

  if (options.byday && options.byday.length > 0) {
    parts.push(`BYDAY=${options.byday.join(",")}`);
  }

  if (options.bymonthday && options.bymonthday.length > 0) {
    parts.push(`BYMONTHDAY=${options.bymonthday.join(",")}`);
  }

  if (options.count) {
    parts.push(`COUNT=${options.count}`);
  }

  if (options.until) {
    parts.push(`UNTIL=${formatUntilDate(options.until)}`);
  }

  return parts.join(";");
}

/**
 * Получает имя дня недели по номеру (0 = Sunday, 6 = Saturday)
 */
export function getWeekdayCode(dayNumber: number): string {
  const codes = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];
  return codes[dayNumber] || "SU";
}

/**
 * Получает номер дня недели по коду (MO = 1, SU = 0)
 */
export function getWeekdayNumber(code: string): number {
  return WEEKDAY_MAP[code.toUpperCase()] ?? 0;
}
