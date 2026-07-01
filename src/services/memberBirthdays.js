const INDONESIAN_MONTHS = {
  januari: 1,
  februari: 2,
  maret: 3,
  april: 4,
  mei: 5,
  juni: 6,
  juli: 7,
  agustus: 8,
  september: 9,
  oktober: 10,
  november: 11,
  desember: 12,
};

function isValidMonthDay(month, day, year = 2000) {
  if (!Number.isInteger(month) || !Number.isInteger(day)) return false;
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

function getZonedDateParts(date, timeZone = "Asia/Jakarta") {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
  };
}

export function parseBirthdayParts(value = "") {
  const normalized = String(value ?? "").trim();
  if (!normalized) return null;

  if (/(?:Z|[+-]\d{2}:?\d{2})$/i.test(normalized)) {
    const date = new Date(normalized);
    if (!Number.isNaN(date.getTime())) {
      const parts = getZonedDateParts(date);
      return isValidMonthDay(parts.month, parts.day, parts.year) ? parts : null;
    }
  }

  let match = normalized.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (match) {
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    return isValidMonthDay(month, day, year) ? { year, month, day } : null;
  }

  match = normalized.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (match) {
    const day = Number(match[1]);
    const month = Number(match[2]);
    const year = Number(match[3]);
    return isValidMonthDay(month, day, year) ? { year, month, day } : null;
  }

  match = normalized.toLowerCase().match(/^(\d{1,2})\s+([a-z]+)\s+(\d{4})$/i);
  if (match) {
    const day = Number(match[1]);
    const month = INDONESIAN_MONTHS[match[2]];
    const year = Number(match[3]);
    return isValidMonthDay(month, day, year) ? { year, month, day } : null;
  }

  return null;
}

function resolveBirthdayDate(year, month, day) {
  if (isValidMonthDay(month, day, year)) {
    return new Date(Date.UTC(year, month - 1, day));
  }

  // Ulang tahun 29 Februari ditampilkan pada 28 Februari ketika tahun berjalan
  // bukan tahun kabisat agar urutannya tetap konsisten dan tidak hilang.
  if (month === 2 && day === 29) {
    return new Date(Date.UTC(year, 1, 28));
  }

  return null;
}

export function getUpcomingBirthdays(members = [], now = new Date()) {
  const todayParts = getZonedDateParts(now);
  const today = new Date(
    Date.UTC(todayParts.year, todayParts.month - 1, todayParts.day),
  );

  return members
    .map((member) => {
      const birthday = parseBirthdayParts(member?.birthday);
      if (!birthday) return null;

      let nextBirthday = resolveBirthdayDate(
        todayParts.year,
        birthday.month,
        birthday.day,
      );

      if (!nextBirthday) return null;
      if (nextBirthday.getTime() < today.getTime()) {
        nextBirthday = resolveBirthdayDate(
          todayParts.year + 1,
          birthday.month,
          birthday.day,
        );
      }

      if (!nextBirthday) return null;

      const daysUntil = Math.round(
        (nextBirthday.getTime() - today.getTime()) / 86_400_000,
      );

      return {
        member,
        birthYear: birthday.year,
        month: nextBirthday.getUTCMonth() + 1,
        day: nextBirthday.getUTCDate(),
        nextBirthday,
        daysUntil,
      };
    })
    .filter(Boolean)
    .sort((a, b) => {
      if (a.daysUntil !== b.daysUntil) return a.daysUntil - b.daysUntil;
      return String(a.member?.name || "").localeCompare(
        String(b.member?.name || ""),
        "id",
        { sensitivity: "base" },
      );
    });
}
