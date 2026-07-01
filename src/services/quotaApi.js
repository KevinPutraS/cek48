const EVENT_CODE_PATTERN = /\bEX[A-Z0-9]{4,12}\b/i;
const ACTIVE_EVENT_MAX_AGE_DAYS = 30;
const ACTIVE_EVENT_MAX_AGE_MS = ACTIVE_EVENT_MAX_AGE_DAYS * 24 * 60 * 60 * 1000;

const TITLE_KEYS = [
  "title",
  "event_title",
  "eventTitle",
  "exclusive_title",
  "exclusiveTitle",
  "product_name",
  "productName",
  "event_name",
  "eventName",
  "name",
];

const CATEGORY_KEYS = [
  "category",
  "category_name",
  "categoryName",
  "type",
  "exclusive_type",
  "exclusiveType",
];

const IMAGE_KEYS = [
  "image",
  "image_url",
  "imageUrl",
  "thumbnail",
  "thumbnail_url",
  "thumbnailUrl",
  "thumbnail_image",
  "thumbnailImage",
  "preview_image",
  "previewImage",
  "banner",
  "cover",
];

const EVENT_START_KEYS = [
  "valid_date_from",
  "validDateFrom",
  "purchase_start",
  "purchaseStart",
  "sale_start",
  "saleStart",
  "start_date",
  "startDate",
  "published_at",
  "publishedAt",
];

const EVENT_END_KEYS = [
  "valid_date_to",
  "validDateTo",
  "purchase_end",
  "purchaseEnd",
  "sale_end",
  "saleEnd",
  "end_date",
  "endDate",
  "expired_at",
  "expiredAt",
];

const EVENT_ACTIVE_KEYS = [
  "is_active",
  "isActive",
  "active",
  "is_available",
  "isAvailable",
];

function asObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : null;
}

function getByKeys(object, keys) {
  if (!object) return undefined;
  for (const key of keys) {
    if (object[key] !== undefined && object[key] !== null && object[key] !== "") {
      return object[key];
    }
  }
  return undefined;
}

function valueToText(value) {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return String(value);
  if (asObject(value)) {
    return valueToText(getByKeys(value, ["name", "title", "label", "value", "text"]));
  }
  return "";
}

function normalizeImage(value) {
  const image = valueToText(value);
  if (!image) return "";
  if (image.startsWith("http://") || image.startsWith("https://")) return image;
  if (image.startsWith("/")) return `https://jkt48.com${image}`;
  return image;
}

function parseDateTimestamp(value) {
  if (value instanceof Date) {
    const timestamp = value.getTime();
    return Number.isFinite(timestamp) ? timestamp : null;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return value < 1e12 ? value * 1000 : value;
  }

  const text = valueToText(value);
  if (!text) return null;

  const timestamp = Date.parse(text);
  return Number.isFinite(timestamp) ? timestamp : null;
}

function parseActiveValue(value) {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value !== "string") return null;

  const normalized = value.trim().toLowerCase();
  if (["true", "1", "active", "available", "open", "published"].includes(normalized)) {
    return true;
  }
  if (
    ["false", "0", "inactive", "closed", "expired", "archived"].includes(normalized)
  ) {
    return false;
  }
  return null;
}

function formatEventStart(value) {
  const timestamp = parseDateTimestamp(value);
  if (!Number.isFinite(timestamp)) return valueToText(value);

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  }).format(new Date(timestamp));
}

export function isEventCurrentlyActive(event, now = Date.now()) {
  if (!event) return false;
  if (event.explicitActive === false) return false;

  const start = parseDateTimestamp(event.validFrom);
  const end = parseDateTimestamp(event.validUntil);

  if (Number.isFinite(start) && now < start) return false;
  if (Number.isFinite(end)) return now <= end;

  if (Number.isFinite(start)) {
    return now - start <= ACTIVE_EVENT_MAX_AGE_MS;
  }

  return event.explicitActive === true;
}

function findCodeInValue(value) {
  if (typeof value !== "string") return "";
  return value.match(EVENT_CODE_PATTERN)?.[0]?.toUpperCase() || "";
}

function findCodeInObject(object) {
  const direct = valueToText(
    getByKeys(object, [
      "code",
      "event_code",
      "eventCode",
      "exclusive_code",
      "exclusiveCode",
      "id",
    ]),
  );

  const directCode = findCodeInValue(direct);
  if (directCode) return directCode;

  for (const key of ["url", "href", "link", "purchase_url", "purchaseUrl", "slug"]) {
    const code = findCodeInValue(valueToText(object[key]));
    if (code) return code;
  }

  return "";
}

function scoreEvent(event) {
  let score = 0;
  if (event.title && !event.title.startsWith("Exclusive ")) score += 5;
  if (event.category) score += 2;
  if (event.image) score += 2;
  if (event.date) score += 1;
  if (/digital[_\s-]*photobook|photobook/i.test(event.category)) score += 3;
  return score;
}

export function extractExclusiveEvents(payload) {
  const root = payload?.data ?? payload;
  const found = new Map();

  function walk(node, inherited = {}) {
    if (Array.isArray(node)) {
      node.forEach((item) => walk(item, inherited));
      return;
    }

    const object = asObject(node);
    if (!object) return;

    const rawStart = getByKeys(object, EVENT_START_KEYS);
    const rawEnd = getByKeys(object, EVENT_END_KEYS);
    const rawActive = getByKeys(object, EVENT_ACTIVE_KEYS);

    const local = {
      title: valueToText(getByKeys(object, TITLE_KEYS)) || inherited.title || "",
      category:
        valueToText(getByKeys(object, CATEGORY_KEYS)) || inherited.category || "",
      image: normalizeImage(getByKeys(object, IMAGE_KEYS)) || inherited.image || "",
      validFrom: valueToText(rawStart) || inherited.validFrom || "",
      validUntil: valueToText(rawEnd) || inherited.validUntil || "",
      explicitActive:
        rawActive !== undefined
          ? parseActiveValue(rawActive)
          : (inherited.explicitActive ?? null),
    };

    local.date = formatEventStart(local.validFrom) || inherited.date || "";

    const code = findCodeInObject(object);
    if (code) {
      const event = {
        code,
        title: local.title || `Exclusive ${code}`,
        category: local.category || "JKT48 Exclusive",
        image: local.image,
        date: local.date,
        validFrom: local.validFrom,
        validUntil: local.validUntil,
        explicitActive: local.explicitActive,
      };

      const previous = found.get(code);
      if (!previous || scoreEvent(event) > scoreEvent(previous)) {
        found.set(code, event);
      }
    }

    Object.values(object).forEach((value) => {
      if (value && typeof value === "object") walk(value, local);
    });
  }

  walk(root);

  return [...found.values()]
    .filter((event) => isEventCurrentlyActive(event))
    .sort((a, b) => {
      const aStart = parseDateTimestamp(a.validFrom) || 0;
      const bStart = parseDateTimestamp(b.validFrom) || 0;
      if (aStart !== bStart) return bStart - aStart;
      return a.title.localeCompare(b.title, "id");
    });
}

function toNumber(value) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const normalized = value.replace(/[^0-9.-]/g, "");
    if (!normalized) return null;
    const number = Number(normalized);
    return Number.isFinite(number) ? number : null;
  }
  return null;
}

function getTeamFromSessionLabel(label) {
  const normalized = String(label || "").toUpperCase();

  if (normalized.includes("LOVE")) {
    return "Team Love";
  }

  if (normalized.includes("DREAM")) {
    return "Team Dream";
  }

  if (normalized.includes("PASSION")) {
    return "Team Passion";
  }

  return "JKT48";
}

export function extractQuotaSlots(payload, selectedEvent = {}) {
  // Mendukung beberapa kemungkinan wrapper:
  // payload.data.data, payload.data, atau langsung object event.
  let data = payload;

  for (let index = 0; index < 3; index += 1) {
    if (
      data &&
      typeof data === "object" &&
      !Array.isArray(data) &&
      data.data &&
      typeof data.data === "object"
    ) {
      data = data.data;
    } else {
      break;
    }
  }

  if (!data || typeof data !== "object") {
    return [];
  }

  const sessions = Array.isArray(data.session)
    ? data.session
    : Array.isArray(data.sessions)
      ? data.sessions
      : [];

  const slots = [];

  sessions.forEach((session, sessionIndex) => {
    const sessionLabel =
      valueToText(session.label) ||
      valueToText(session.session_name) ||
      `Sesi ${sessionIndex + 1}`;

    const rawDate =
      session.date ||
      session.event_date ||
      session.schedule_date ||
      selectedEvent?.validFrom ||
      "";

    const formattedDate =
      formatEventStart(rawDate) || selectedEvent?.date || "Tanggal tidak dicantumkan";

    const details = Array.isArray(session.session_detail)
      ? session.session_detail
      : Array.isArray(session.sessionDetail)
        ? session.sessionDetail
        : Array.isArray(session.members)
          ? session.members
          : [];

    details.forEach((detail, detailIndex) => {
      const member = valueToText(
        detail.jkt48_member_name ||
          detail.jkt48MemberName ||
          detail.member_name ||
          detail.memberName ||
          detail.member,
      );

      if (!member) return;

      const availableQuota = toNumber(
        detail.available_quota ??
          detail.availableQuota ??
          detail.remaining_quota ??
          detail.remainingQuota ??
          detail.remaining,
      );

      const ticketsSold = toNumber(
        detail.tickets_sold ?? detail.ticketsSold ?? detail.sold ?? detail.total_sold,
      );

      let total = null;

      // Pada API JKT48:
      // total slot member = tiket terjual + kuota tersedia.
      if (Number.isFinite(availableQuota) && Number.isFinite(ticketsSold)) {
        total = availableQuota + ticketsSold;
      } else if (Number.isFinite(availableQuota)) {
        total = availableQuota;
      }

      const remaining = Number.isFinite(availableQuota)
        ? Math.max(0, availableQuota)
        : null;

      const soldOut =
        remaining !== null
          ? remaining <= 0
          : Boolean(
              detail.sold_out ??
              detail.soldOut ??
              detail.is_sold_out ??
              detail.isSoldOut,
            );

      const lane =
        valueToText(detail.label || detail.lane || detail.lane_name || detail.jalur) ||
        `Jalur ${detailIndex + 1}`;

      const eventCode = selectedEvent?.code || data.code || data.event_code || "";

      const eventTitle =
        selectedEvent?.title || data.title || `JKT48 Exclusive ${eventCode}`;

      slots.push({
        id: [eventCode || "event", sessionIndex + 1, detailIndex + 1, member]
          .join("-")
          .replace(/\s+/g, "-")
          .toLowerCase(),

        member,
        alias: member,
        team: getTeamFromSessionLabel(sessionLabel),

        eventCode,
        event: eventTitle,
        category: selectedEvent?.category || data.category || "JKT48 Exclusive",

        session: sessionLabel,
        lane,

        date: formattedDate,
        startTime: valueToText(session.start_time),
        endTime: valueToText(session.end_time),

        remaining,
        total,
        ticketsSold: Number.isFinite(ticketsSold) ? Math.max(0, ticketsSold) : null,

        soldOut,
        available: remaining !== null ? remaining > 0 : !soldOut,
        quotaExposed: remaining !== null,

        avatar: "",
      });
    });
  });

  return slots;
}

async function readApiResponse(response, fallbackMessage) {
  let payload;

  try {
    payload = await response.json();
  } catch {
    const error = new Error(`${fallbackMessage} Respons server bukan JSON.`);
    error.code = "INVALID_API_RESPONSE";
    error.status = response.status || 502;
    error.retryable = true;
    throw error;
  }

  const requestFailed =
    payload?.ok === false || payload?.status === false || payload?.success === false;

  if (!response.ok || requestFailed) {
    const error = new Error(
      payload?.error || payload?.message || `${fallbackMessage} (${response.status})`,
    );

    error.code =
      payload?.errorCode ||
      payload?.code ||
      (response.status === 429 ? "JKT48_WAITING_ROOM" : "JKT48_UPSTREAM_ERROR");
    error.status = response.status || 502;
    error.retryable =
      payload?.retryable === true || response.status === 429 || response.status >= 500;

    throw error;
  }

  return payload;
}

export async function fetchExclusiveEvents(options = {}) {
  const response = await fetch("/api/jkt48-events", {
    headers: { Accept: "application/json" },
    cache: "no-store",
    signal: options.signal,
  });
  const payload = await readApiResponse(response, "Gagal mengambil daftar event.");
  const events = extractExclusiveEvents(payload.data);

  if (!events.length) {
    const error = new Error(
      "Tidak ada event Eksklusif aktif yang ditemukan pada respons API JKT48.",
    );
    error.code = "JKT48_NO_ACTIVE_EVENTS";
    error.status = 502;
    error.retryable = true;
    throw error;
  }

  return events;
}

export async function fetchQuotaData(code, selectedEvent, options = {}) {
  if (!EVENT_CODE_PATTERN.test(code || "")) {
    throw new Error("Pilih event Eksklusif yang valid terlebih dahulu.");
  }

  const response = await fetch(`/api/jkt48-quota?code=${encodeURIComponent(code)}`, {
    headers: { Accept: "application/json" },
    cache: "no-store",
    signal: options.signal,
  });
  const payload = await readApiResponse(response, "Gagal mengambil detail stock.");

  return extractQuotaSlots(payload, selectedEvent);
}

export async function fetchAllQuotaData(eventList, options = {}) {
  const events = Array.isArray(eventList) ? eventList : [];
  const codes = events
    .map((event) =>
      String(event.code || "")
        .trim()
        .toUpperCase(),
    )
    .filter((code) => EVENT_CODE_PATTERN.test(code));

  if (!codes.length) {
    throw new Error("Tidak ada kode event aktif untuk diperiksa stock-nya.");
  }

  const response = await fetch(
    `/api/jkt48-stocks?codes=${encodeURIComponent(codes.join(","))}`,
    {
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal: options.signal,
    },
  );
  const payload = await readApiResponse(response, "Gagal mengambil stock semua event.");

  const items = [];
  const failures = [];
  const emptyEvents = [];

  for (const result of payload.results || []) {
    const event = events.find((entry) => entry.code === result.code);

    if (!result.ok) {
      failures.push({ code: result.code, error: result.error || "Stock gagal dibaca" });
      continue;
    }

    const slots = extractQuotaSlots(result, event).map((slot) => ({
      ...slot,
      eventCode: result.code,
      source: result.source,
    }));

    if (!slots.length) emptyEvents.push(result.code);
    items.push(...slots);
  }

  return {
    items,
    failures,
    emptyEvents,
    successCount: Number(payload.successCount || 0),
    requested: Number(payload.requested || codes.length),
  };
}
