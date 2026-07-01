export const REFRESH_SECONDS = 30;
export const DEFAULT_DATE = "Semua Tanggal";
export const DEFAULT_SESSION = "Semua Sesi";
export const DEFAULT_STATUS = "Semua Status";
export const DEFAULT_SORT = "Kuota Terbanyak";
export const MEMBER_PROFILE_CACHE_KEY = "cek48-member-profiles-v1";
export const MEMBER_PROFILE_CACHE_TIME_KEY = "cek48-member-profiles-time-v1";
export const MEMBER_PROFILE_CACHE_DURATION = 24 * 60 * 60 * 1000;

export const STATUS_OPTIONS = [
  {
    value: DEFAULT_STATUS,
    label: DEFAULT_STATUS,
    description: "Tampilkan seluruh status kuota",
  },
  {
    value: "Tersedia",
    label: "Tersedia",
    description: "Kuota masih aman",
  },
  {
    value: "Hampir Habis",
    label: "Hampir Habis",
    description: "Sisa kuota sudah rendah",
  },
  {
    value: "Habis",
    label: "Habis",
    description: "Slot telah sold out",
  },
  {
    value: "Belum Terbaca",
    label: "Belum Terbaca",
    description: "Angka kuota belum tersedia",
  },
];

export const SORT_OPTIONS = [
  {
    value: DEFAULT_SORT,
    label: DEFAULT_SORT,
    description: "Sisa kuota terbesar di atas",
  },
  {
    value: "Kuota Tersedikit",
    label: "Kuota Tersedikit",
    description: "Sisa kuota terkecil di atas",
  },
  {
    value: "Nama A–Z",
    label: "Nama A–Z",
    description: "Urutkan berdasarkan nama member",
  },
];

export function readUrlFilters() {
  if (typeof window === "undefined") {
    return {
      category: "",
      event: "",
      date: DEFAULT_DATE,
      session: DEFAULT_SESSION,
      status: DEFAULT_STATUS,
      search: "",
      sort: DEFAULT_SORT,
    };
  }

  const params = new URLSearchParams(window.location.search);
  const status = params.get("status") || DEFAULT_STATUS;
  const sort = params.get("sort") || DEFAULT_SORT;

  return {
    category: String(params.get("category") || "")
      .trim()
      .toUpperCase(),
    event: String(params.get("event") || "")
      .trim()
      .toUpperCase(),
    date: String(params.get("date") || DEFAULT_DATE).trim(),
    session: String(params.get("session") || DEFAULT_SESSION).trim(),
    status: STATUS_OPTIONS.some((option) => option.value === status)
      ? status
      : DEFAULT_STATUS,
    search: String(params.get("q") || "").trim(),
    sort: SORT_OPTIONS.some((option) => option.value === sort) ? sort : DEFAULT_SORT,
  };
}

export function createFilterUrl({
  category,
  event,
  date,
  session,
  status,
  search,
  sort,
}) {
  if (typeof window === "undefined") return "";

  const url = new URL(window.location.href);
  const values = {
    category,
    event,
    date: date === DEFAULT_DATE ? "" : date,
    session: session === DEFAULT_SESSION ? "" : session,
    status: status === DEFAULT_STATUS ? "" : status,
    q: search.trim(),
    sort: sort === DEFAULT_SORT ? "" : sort,
  };

  Object.entries(values).forEach(([key, value]) => {
    if (value) url.searchParams.set(key, value);
    else url.searchParams.delete(key);
  });

  return url;
}

export function syncFiltersToUrl(filters) {
  if (typeof window === "undefined") return;
  const url = createFilterUrl(filters);
  window.history.replaceState(
    window.history.state,
    "",
    `${url.pathname}${url.search}${url.hash}`,
  );
}

export async function copyText(value) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand("copy");
  textarea.remove();

  if (!copied) throw new Error("Clipboard tidak tersedia.");
}

export const INDONESIAN_MONTH_INDEX = {
  januari: 0,
  februari: 1,
  maret: 2,
  april: 3,
  mei: 4,
  juni: 5,
  juli: 6,
  agustus: 7,
  september: 8,
  oktober: 9,
  november: 10,
  desember: 11,
};

export function normalizeSlotDate(value = "") {
  const text = String(value || "").trim();
  if (!text || /^tanggal (?:tidak|belum)/i.test(text)) return "";

  return text
    .replace(/\s+pukul\s+\d{1,2}[.:]\d{2}(?::\d{2})?.*$/i, "")
    .replace(/[,\s]+\d{1,2}[.:]\d{2}(?::\d{2})?\s*(?:WIB|WITA|WIT)?.*$/i, "")
    .trim();
}

export function parseSlotDate(value) {
  const normalized = normalizeSlotDate(value);
  if (!normalized) return null;

  const isoMatch = normalized.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    return Date.UTC(Number(isoMatch[1]), Number(isoMatch[2]) - 1, Number(isoMatch[3]));
  }

  const idMatch = normalized.match(
    /(\d{1,2})\s+(Januari|Februari|Maret|April|Mei|Juni|Juli|Agustus|September|Oktober|November|Desember)\s+(\d{4})/i,
  );

  if (idMatch) {
    return Date.UTC(
      Number(idMatch[3]),
      INDONESIAN_MONTH_INDEX[idMatch[2].toLowerCase()],
      Number(idMatch[1]),
    );
  }

  const timestamp = Date.parse(normalized);
  return Number.isFinite(timestamp) ? timestamp : null;
}

export function getJakartaTodayTimestamp(referenceDate = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Jakarta",
  }).formatToParts(referenceDate);

  const values = Object.fromEntries(
    parts.map((part) => [part.type, Number(part.value)]),
  );

  return Date.UTC(values.year, values.month - 1, values.day);
}

export function isPastSlotDate(value, todayTimestamp = getJakartaTodayTimestamp()) {
  const timestamp = parseSlotDate(value);
  if (!Number.isFinite(timestamp)) return false;

  return getJakartaTodayTimestamp(new Date(timestamp)) < todayTimestamp;
}

export function hasOnlyPastDatedSlots(
  items,
  todayTimestamp = getJakartaTodayTimestamp(),
) {
  if (!Array.isArray(items) || !items.length) return false;

  const dates = items.map(getItemDate);
  if (dates.some((date) => !date)) return false;

  return dates.every((date) => isPastSlotDate(date, todayTimestamp));
}

export function formatDateTabLabel(value) {
  const timestamp = parseSlotDate(value);
  if (!Number.isFinite(timestamp)) return normalizeSlotDate(value) || "Tanpa tanggal";

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  })
    .format(new Date(timestamp))
    .toUpperCase();
}

export function compareSlotDates(a, b) {
  const aTimestamp = parseSlotDate(a);
  const bTimestamp = parseSlotDate(b);

  if (Number.isFinite(aTimestamp) && Number.isFinite(bTimestamp)) {
    return aTimestamp - bTimestamp;
  }

  if (Number.isFinite(aTimestamp)) return -1;
  if (Number.isFinite(bTimestamp)) return 1;
  return a.localeCompare(b, "id", { numeric: true });
}

export function getItemDate(item) {
  return normalizeSlotDate(item?.date);
}

export function normalizeMemberName(value = "") {
  return String(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function getMemberPhotoUrl(photo) {
  if (!photo) return "";
  if (String(photo).startsWith("/api/jkt48-image?")) return photo;

  return `/api/jkt48-image?url=${encodeURIComponent(photo)}`;
}

export function formatMemberTeam(type, fallback = "JKT48") {
  const normalized = String(type || "")
    .trim()
    .toUpperCase();

  if (!normalized) return fallback;
  if (normalized === "TRAINEE") return "Trainee";
  if (normalized === "JKT48_VIRTUAL") return "JKT48 Virtual";

  return `Team ${normalized.charAt(0)}${normalized.slice(1).toLowerCase()}`;
}

export function readCachedMemberProfiles() {
  if (typeof window === "undefined") return null;

  try {
    const cached = window.localStorage.getItem(MEMBER_PROFILE_CACHE_KEY);
    const cachedAt = Number(window.localStorage.getItem(MEMBER_PROFILE_CACHE_TIME_KEY));

    if (
      !cached ||
      !Number.isFinite(cachedAt) ||
      Date.now() - cachedAt >= MEMBER_PROFILE_CACHE_DURATION
    ) {
      return null;
    }

    const profiles = JSON.parse(cached);
    return Array.isArray(profiles) ? profiles : null;
  } catch {
    return null;
  }
}

export function cacheMemberProfiles(profiles) {
  if (typeof window === "undefined" || !Array.isArray(profiles)) return;

  try {
    window.localStorage.setItem(MEMBER_PROFILE_CACHE_KEY, JSON.stringify(profiles));
    window.localStorage.setItem(MEMBER_PROFILE_CACHE_TIME_KEY, String(Date.now()));
  } catch {
    // Data profil tetap dapat dipakai meskipun cache browser penuh/nonaktif.
  }
}

export async function fetchMemberProfiles() {
  const cachedProfiles = readCachedMemberProfiles();
  if (cachedProfiles) return cachedProfiles;

  const response = await fetch("/api/jkt48-members", {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });

  let payload;
  try {
    payload = await response.json();
  } catch {
    throw new Error("Respons profil member bukan JSON.");
  }

  if (!response.ok || payload?.status === false) {
    throw new Error(
      payload?.message || payload?.error || "Profil member gagal dimuat.",
    );
  }

  const profiles =
    payload?.data?.members ?? payload?.data ?? payload?.members ?? payload;

  const normalizedProfiles = Array.isArray(profiles) ? profiles : [];
  cacheMemberProfiles(normalizedProfiles);
  return normalizedProfiles;
}

export function mergeMemberProfiles(slots, profiles) {
  const profileMap = new Map();

  profiles.forEach((profile) => {
    const keys = [profile?.name, profile?.nickname, profile?.code]
      .map(normalizeMemberName)
      .filter(Boolean);

    keys.forEach((key) => profileMap.set(key, profile));
  });

  return slots.map((slot) => {
    const profile =
      profileMap.get(normalizeMemberName(slot.member)) ||
      profileMap.get(normalizeMemberName(slot.alias));

    if (!profile) return slot;

    return {
      ...slot,
      alias: profile.nickname || slot.alias || slot.member,
      team: formatMemberTeam(profile.type, slot.team || "JKT48"),
      avatar: profile.photo ? getMemberPhotoUrl(profile.photo) : slot.avatar || "",
      memberCode: profile.code || "",
      memberId: profile.jkt48_member_id ?? null,
    };
  });
}

export function hasKnownQuota(item) {
  return Number.isFinite(item.remaining);
}

export function getStatus(item) {
  if (!hasKnownQuota(item)) return "unknown";
  if (item.remaining <= 0) return "sold";

  const total = Number.isFinite(item.total) && item.total > 0 ? item.total : null;
  const lowLimit = total ? Math.max(5, total * 0.25) : 5;

  if (item.remaining <= lowLimit) return "low";
  return "available";
}

export function statusLabel(status) {
  return {
    available: "Tersedia",
    low: "Hampir Habis",
    sold: "Habis",
    unknown: "Belum Terbaca",
  }[status];
}

export function formatQuota(value) {
  return Number.isFinite(value) ? value : "?";
}

export function getSoldCount(item) {
  if (Number.isFinite(item.ticketsSold)) return Math.max(0, item.ticketsSold);

  if (Number.isFinite(item.total) && Number.isFinite(item.remaining)) {
    return Math.max(0, item.total - item.remaining);
  }

  return null;
}

export function getQuotaItemIdentity(item) {
  return [
    item?.id,
    item?.eventCode,
    getItemDate(item),
    item?.session,
    item?.lane,
    item?.member,
  ]
    .map((value) => String(value ?? ""))
    .join("::");
}

export function quotaItemUnchanged(previous, next) {
  return (
    previous?.remaining === next?.remaining &&
    previous?.total === next?.total &&
    previous?.ticketsSold === next?.ticketsSold &&
    previous?.avatar === next?.avatar &&
    previous?.team === next?.team &&
    previous?.alias === next?.alias
  );
}

export function reconcileQuotaItems(previousItems, nextItems) {
  if (!Array.isArray(previousItems) || previousItems.length === 0) {
    return nextItems;
  }

  const previousMap = new Map(
    previousItems.map((item) => [getQuotaItemIdentity(item), item]),
  );

  let changed = previousItems.length !== nextItems.length;

  const reconciled = nextItems.map((nextItem, index) => {
    const previousItem = previousMap.get(getQuotaItemIdentity(nextItem));

    if (previousItem && quotaItemUnchanged(previousItem, nextItem)) {
      if (previousItems[index] !== previousItem) changed = true;
      return previousItem;
    }

    changed = true;
    return nextItem;
  });

  return changed ? reconciled : previousItems;
}

export function formatSessionLabel(value = "") {
  const normalized = String(value || "")
    .replace(
      /\s*(?:[-–—·|]\s*)?\d{1,2}[.:]\d{2}(?::\d{2})?\s*(?:WIB|WITA|WIT)?\s*$/i,
      "",
    )
    .replace(/\s+pukul\s+\d{1,2}[.:]\d{2}(?::\d{2})?\s*(?:WIB|WITA|WIT)?\s*$/i, "")
    .trim();

  return normalized || "Sesi —";
}
