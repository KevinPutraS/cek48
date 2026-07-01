import { buildTheaterQuotaSummary } from "../../services/theaterQuota";

export const MONTHS = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

export const FILTERS = [
  { value: "ALL", label: "Semua" },
  { value: "SHOW", label: "Show" },
  { value: "EVENT", label: "Event" },
];

export const TEAM_LABELS = {
  LOVE: "Team Love",
  DREAM: "Team Dream",
  PASSION: "Team Passion",
  TRAINEE: "Trainee",
  JKT48_VIRTUAL: "JKT48 Virtual",
  JKT48: "JKT48",
};

export const SETLIST_POSTERS = [
  {
    id: "cara-meminum-ramune",
    label: "Cara Meminum Ramune",
    src: "/posters/cara-meminum-ramune.webp",
    position: "50% 47%",
    aliases: ["cara meminum ramune", "ramune no nomikata", "ramune"],
  },
  {
    id: "pajama-drive",
    label: "Pajama Drive",
    src: "/posters/pajama-drive.webp",
    position: "50% 50%",
    aliases: ["pajama drive"],
  },
  {
    id: "itadaki-love",
    label: "Itadaki Love",
    src: "/posters/itadaki-love.webp",
    position: "50% 46%",
    aliases: ["itadaki love", "itadaki"],
  },
  {
    id: "dream-bakudan",
    label: "Dream Bakudan",
    src: "/posters/dream-bakudan.webp",
    position: "50% 45%",
    aliases: ["dream bakudan"],
  },
  {
    id: "pertaruhan-cinta",
    label: "Pertaruhan Cinta",
    src: "/posters/pertaruhan-cinta.webp",
    position: "50% 45%",
    aliases: ["pertaruhan cinta"],
  },
  {
    id: "passion-200",
    label: "Passion 200%",
    src: "/posters/passion-200.webp",
    position: "50% 47%",
    aliases: ["passion 200", "passion two hundred"],
  },
  {
    id: "sambil-menggandeng-erat-tanganku",
    label: "Sambil Menggandeng Erat Tanganku",
    src: "/posters/sambil-menggandeng-erat-tanganku.webp",
    position: "50% 50%",
    aliases: [
      "sambil menggandeng erat tanganku",
      "sambil menggandeng erat tanganmu",
      "te wo tsunaginagara",
      "te wo tsunagi nagara",
      "twt",
    ],
  },
];

export function getJakartaNowParts() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());

  const result = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return {
    year: Number(result.year),
    month: Number(result.month),
    day: Number(result.day),
    hour: Number(result.hour),
    minute: Number(result.minute),
    key: `${result.year}-${result.month}-${result.day}`,
  };
}

export function isValidDateParts(year, month, day) {
  if (![year, month, day].every(Number.isInteger)) return false;
  if (year < 1900 || month < 1 || month > 12 || day < 1 || day > 31) {
    return false;
  }

  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

export function buildDateKey(year, month, day) {
  if (!isValidDateParts(year, month, day)) return "";
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function normalizeTime(value = "") {
  const text = String(value ?? "").trim();
  if (!text) return "--:--";

  if (/(?:Z|[+-]\d{2}:?\d{2})$/i.test(text)) {
    const date = new Date(text);
    if (!Number.isNaN(date.getTime())) {
      const parts = new Intl.DateTimeFormat("en-GB", {
        timeZone: "Asia/Jakarta",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
      }).formatToParts(date);
      const result = Object.fromEntries(parts.map((part) => [part.type, part.value]));
      return `${result.hour}:${result.minute}`;
    }
  }

  const timeMatch = text.match(/(?:^|[T\s])(\d{1,2}):(\d{2})(?::\d{2})?/);
  const plainMatch = text.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  const match = timeMatch || plainMatch;

  if (!match) return "--:--";

  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return "--:--";

  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

export function getDateKey(value = "") {
  const text = String(value ?? "").trim();
  if (!text) return "";

  const dateMatch = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:$|[T\s])/);
  const hasExplicitTimezone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(text);

  if (dateMatch && !hasExplicitTimezone) {
    return buildDateKey(
      Number(dateMatch[1]),
      Number(dateMatch[2]),
      Number(dateMatch[3]),
    );
  }

  const date = new Date(text);
  if (Number.isNaN(date.getTime())) return "";

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const result = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return buildDateKey(Number(result.year), Number(result.month), Number(result.day));
}

export function parseDateKey(dateKey = "") {
  const match = String(dateKey).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return { year: 0, month: 0, day: 0, valid: false };

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  return {
    year,
    month,
    day,
    valid: isValidDateParts(year, month, day),
  };
}

export function parseJakartaDateTime(value = "") {
  const text = String(value ?? "").trim();
  if (!text) return null;

  const localMatch = text.match(
    /^(\d{4})-(\d{1,2})-(\d{1,2})(?:[T\s](\d{1,2}):(\d{2})(?::(\d{2})(?:\.\d{1,3})?)?)?$/,
  );

  if (localMatch) {
    const year = Number(localMatch[1]);
    const month = Number(localMatch[2]);
    const day = Number(localMatch[3]);
    const hour = Number(localMatch[4] || 0);
    const minute = Number(localMatch[5] || 0);
    const second = Number(localMatch[6] || 0);

    if (
      !isValidDateParts(year, month, day) ||
      hour > 23 ||
      minute > 59 ||
      second > 59
    ) {
      return null;
    }

    return new Date(Date.UTC(year, month - 1, day, hour - 7, minute, second));
  }

  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function toBoolean(value) {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;

  const normalized = String(value ?? "")
    .trim()
    .toLowerCase();
  if (["true", "1", "yes", "active", "aktif"].includes(normalized)) return true;
  if (["false", "0", "no", "inactive", "nonaktif", ""].includes(normalized)) {
    return false;
  }

  return Boolean(value);
}

export function formatLongDate(dateKey) {
  const { year, month, day, valid } = parseDateKey(dateKey);

  if (!valid) return "Tanggal belum tersedia";

  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

export function formatShortDate(dateKey) {
  const { year, month, day, valid } = parseDateKey(dateKey);

  if (!valid) {
    return { day: "--", month: "---", weekday: "Jadwal" };
  }

  const date = new Date(Date.UTC(year, month - 1, day));

  return {
    day: new Intl.DateTimeFormat("id-ID", {
      day: "2-digit",
      timeZone: "UTC",
    }).format(date),

    month: new Intl.DateTimeFormat("id-ID", {
      month: "short",
      timeZone: "UTC",
    })
      .format(date)
      .replace(".", "")
      .toUpperCase(),

    weekday: new Intl.DateTimeFormat("id-ID", {
      weekday: "short",
      timeZone: "UTC",
    })
      .format(date)
      .replace(".", ""),
  };
}

export function normalizeTeamKey(value) {
  return String(value ?? "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^TEAM_/, "")
    .replace(/^_+|_+$/g, "");
}

export function formatTeam(value) {
  const key = normalizeTeamKey(value);
  return TEAM_LABELS[key] || (key ? key.replace(/_/g, " ") : "JKT48");
}

export function formatType(value) {
  const key = String(value || "")
    .trim()
    .toUpperCase();

  if (key === "SHOW") return "Show";
  if (key === "EXCLUSIVE") return "Exclusive";
  if (key === "EVENT") return "Event";

  return key || "Schedule";
}

export function normalizeSetlistText(value = "") {
  return String(value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/%/g, " percent ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function getSetlistPoster(...values) {
  // Prioritaskan field API secara berurutan. Jangan gabungkan seluruh teks,
  // karena deskripsi dapat menyebut setlist lain dan menghasilkan poster salah.
  for (const value of values) {
    const searchable = normalizeSetlistText(value);
    if (!searchable) continue;

    const paddedSearchable = ` ${searchable} `;
    let bestMatch = null;

    SETLIST_POSTERS.forEach((poster) => {
      poster.aliases.forEach((alias) => {
        const normalizedAlias = normalizeSetlistText(alias);
        if (!normalizedAlias) return;

        const exactMatch = searchable === normalizedAlias;
        const phraseMatch = paddedSearchable.includes(` ${normalizedAlias} `);
        if (!exactMatch && !phraseMatch) return;

        const score = (exactMatch ? 10000 : 0) + normalizedAlias.length;
        if (!bestMatch || score > bestMatch.score) {
          bestMatch = { poster, score };
        }
      });
    });

    if (bestMatch) return bestMatch.poster;
  }

  return null;
}

export function formatRupiah(value) {
  if (value === null || value === undefined || String(value).trim() === "") {
    return "Belum tersedia";
  }

  const number = Number(value);
  if (!Number.isFinite(number)) return "Belum tersedia";

  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(number);
}

export function formatReceptionTime(value = "") {
  const time = normalizeTime(value);
  return time === "--:--" ? "Belum tersedia" : `${time} WIB`;
}

export function formatSalesDate(value = "") {
  const date = parseJakartaDateTime(value);

  if (!date) return "Belum tersedia";

  return `${new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  }).format(date)} WIB`;
}

export function toOptionalNumber(...values) {
  for (const value of values) {
    if (
      value === undefined ||
      value === null ||
      (typeof value === "string" && value.trim() === "")
    ) {
      continue;
    }

    const number = Number(value);

    if (Number.isFinite(number)) {
      return number;
    }
  }

  return null;
}

export function normalizeTheaterDetail(data) {
  const totalQuota = toOptionalNumber(data?.total_quota);

  let remainingQuota = toOptionalNumber(
    data?.remaining_quota,
    data?.available_quota,
    data?.quota_remaining,
    data?.remaining_tickets,
    data?.ticket_remaining,
  );

  let soldQuota = toOptionalNumber(
    data?.sold_quota,
    data?.tickets_sold,
    data?.total_sold,
    data?.sold_tickets,
    data?.booked_quota,
  );

  if (soldQuota === null && totalQuota !== null && remainingQuota !== null) {
    soldQuota = Math.max(0, totalQuota - remainingQuota);
  }

  if (remainingQuota === null && totalQuota !== null && soldQuota !== null) {
    remainingQuota = Math.max(0, totalQuota - soldQuota);
  }

  const audienceCount = toOptionalNumber(
    data?.audience_count,
    data?.attendance_count,
    data?.registered_count,
    data?.total_audience,
    data?.check_in_count,
  );

  const salesPeriods = Array.isArray(data?.sales_period)
    ? data.sales_period.map((period) => {
        const pricing = Array.isArray(period?.pricing)
          ? period.pricing.map((price) => ({
              label: String(price?.label || "").trim(),
              price: toOptionalNumber(price?.price),
              quota: toOptionalNumber(price?.quota),
              isOfcOnly: toBoolean(price?.is_ofc_only),
            }))
          : [];

        return {
          label: String(period?.label || "").trim(),
          method: String(period?.sales_method || "")
            .trim()
            .toUpperCase(),
          startDate: String(period?.start_date || "").trim(),
          endDate: String(period?.end_date || "").trim(),
          pricing,
          quota:
            toOptionalNumber(period?.quota) ??
            pricing.reduce((total, price) => total + Number(price.quota || 0), 0),
        };
      })
    : [];

  const quotaSummary = buildTheaterQuotaSummary({
    totalQuota,
    remainingQuota,
    salesPeriods,
  });

  return {
    code: String(data?.code || "").trim(),
    title: String(data?.title || "").trim(),
    team: String(data?.jkt48_member_type || "").trim(),
    startTime: normalizeTime(data?.start_time),
    endTime: normalizeTime(data?.end_time),
    receptionStartTime: normalizeTime(data?.reception_start_time),
    price: toOptionalNumber(data?.default_price),
    totalQuota,
    soldQuota,
    remainingQuota,
    quotaSummary,
    audienceCount,
    maxPurchase: toOptionalNumber(data?.max_purchase),
    setList: String(data?.set_list || "").trim(),
    lineup: Array.isArray(data?.jkt48_member)
      ? data.jkt48_member
          .filter((member) => member?.name)
          .map((member) => ({
            id: member.member_id ?? member.name,
            name: String(member.name).trim(),
            type: String(member.type || "").trim(),
          }))
      : [],
    birthdayMembers: Array.isArray(data?.birthday_member_name)
      ? data.birthday_member_name.filter(Boolean)
      : [],
    salesPeriods,
  };
}

export function matchesFilter(schedule, filter) {
  if (filter === "ALL") return true;
  if (filter === "SHOW") return schedule.type === "SHOW";
  if (filter === "EVENT") return schedule.type === "EVENT";

  return true;
}

export function normalizeScheduleType(value) {
  const normalized = String(value ?? "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_");

  if (["THEATER", "THEATRE", "THEATER_SHOW"].includes(normalized)) {
    return "SHOW";
  }

  if (
    [
      "EXCLUSIVE",
      "EXCLUSIVE_EVENT",
      "EVENT_EXCLUSIVE",
      "OFC",
      "OFC_EVENT",
      "OFFICIAL_FAN_CLUB_EVENT",
      "OFFICIAL_FANCLUB_EVENT",
    ].includes(normalized)
  ) {
    return "EXCLUSIVE";
  }

  return normalized || "EVENT";
}

export function getScheduleIdentity(schedule) {
  // Kode/link yang sama dapat muncul pada beberapa tanggal dari API JKT48.
  // Sertakan tanggal dan waktu agar jadwal sah tidak terhapus saat deduplikasi.
  return [
    schedule.referenceCode || schedule.link || schedule.id,
    schedule.dateKey,
    schedule.startTime,
    schedule.endTime,
    schedule.type,
    schedule.title,
    schedule.team,
  ]
    .map((value) =>
      String(value ?? "")
        .trim()
        .toLowerCase(),
    )
    .join("::");
}

export function scheduleHtmlToText(value = "") {
  const source = String(value ?? "").trim();
  if (!source) return "";

  // API schedule dapat mengirim rich-text HTML lengkap dengan inline style.
  // Ubah menjadi teks aman agar tag/style tidak tampil mentah di halaman.
  const withLineBreaks = source
    .replace(/<\s*br\s*\/?>/gi, "\n")
    .replace(/<\s*\/\s*(?:p|div|li|tr|h[1-6])\s*>/gi, "\n");

  let plainText = withLineBreaks;

  if (typeof document !== "undefined") {
    const template = document.createElement("template");
    template.innerHTML = withLineBreaks;
    template.content
      .querySelectorAll("script, style, noscript")
      .forEach((element) => element.remove());
    plainText = template.content.textContent || "";
  } else {
    plainText = withLineBreaks
      .replace(/<[^>]*>/g, " ")
      .replace(/&nbsp;/gi, " ")
      .replace(/&amp;/gi, "&")
      .replace(/&lt;/gi, "<")
      .replace(/&gt;/gi, ">")
      .replace(/&quot;/gi, '"')
      .replace(/&#(?:39|x27);/gi, "'");
  }

  return plainText
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function normalizeSchedule(item) {
  const dateKey = getDateKey(item?.date);
  const type = normalizeScheduleType(item?.type);
  const referenceCode = String(item?.reference_code || "").trim();
  const link = String(item?.link || "").trim();
  const title = String(item?.title || "Jadwal JKT48").trim();
  const startTime = normalizeTime(item?.start_time);

  return {
    id:
      item?.schedule_id ??
      (referenceCode || link || `${dateKey}-${startTime}-${type}-${title}`),
    link,
    dateKey,
    startTime,
    endTime: normalizeTime(item?.end_time),
    type,
    active: toBoolean(item?.status),
    description: scheduleHtmlToText(
      [item?.short_description, item?.content_body].find(
        (value) => String(value ?? "").trim() !== "",
      ) || "",
    ),
    title,
    team: normalizeTeamKey(item?.jkt48_member_type),
    birthday: toBoolean(item?.birthday_member),
    referenceCode,
  };
}

export function dedupeSchedules(items) {
  const map = new Map();

  items.forEach((schedule) => {
    const identity = getScheduleIdentity(schedule);
    if (!map.has(identity)) map.set(identity, schedule);
  });

  return [...map.values()];
}

export function timeToMinutes(value) {
  const normalized = normalizeTime(value);
  if (normalized === "--:--") return null;
  const [hour, minute] = normalized.split(":").map(Number);
  return hour * 60 + minute;
}

export function isScheduleUpcoming(schedule, jakartaNow) {
  if (schedule.dateKey > jakartaNow.key) return true;
  if (schedule.dateKey < jakartaNow.key) return false;

  const currentMinutes = jakartaNow.hour * 60 + jakartaNow.minute;
  const endMinutes = timeToMinutes(schedule.endTime);
  if (endMinutes !== null) return endMinutes >= currentMinutes;

  const startMinutes = timeToMinutes(schedule.startTime);
  return startMinutes === null || startMinutes >= currentMinutes;
}

export function getRelativeDayLabel(dateKey, jakartaNow) {
  const parsed = parseDateKey(dateKey);
  if (!parsed.valid) return "Tanggal belum tersedia";

  const scheduleDay = Date.UTC(parsed.year, parsed.month - 1, parsed.day);
  const currentDay = Date.UTC(jakartaNow.year, jakartaNow.month - 1, jakartaNow.day);
  const difference = Math.round((scheduleDay - currentDay) / 86400000);

  if (difference === 0) return "Hari ini";
  if (difference === 1) return "Besok";
  if (difference > 1 && difference <= 7) return `${difference} hari lagi`;
  if (difference === -1) return "Kemarin";
  if (difference < -1) return "Sudah lewat";

  return formatLongDate(dateKey);
}

export function getScheduleTemporalState(schedule, jakartaNow) {
  if (schedule.dateKey < jakartaNow.key) return "past";
  if (schedule.dateKey > jakartaNow.key) return "upcoming";
  return isScheduleUpcoming(schedule, jakartaNow) ? "today" : "past";
}
