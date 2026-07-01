import { fetchJkt48Json, getPublicError, sendJson } from "./_lib/jkt48.js";

const OFFICIAL_API = "https://jkt48.com/api/v1/schedules";

function readQueryValue(value) {
  return String(Array.isArray(value) ? value[0] : value || "").trim();
}

function toInteger(value, fallback) {
  const text = readQueryValue(value);
  if (!text) return fallback;
  const parsed = Number(text);
  return Number.isInteger(parsed) ? parsed : Number.NaN;
}

function getJakartaYearMonth() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return { year: Number(values.year), month: Number(values.month) };
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return sendJson(res, 405, {
      status: false,
      message: "Method tidak diizinkan.",
      data: [],
    });
  }

  const current = getJakartaYearMonth();
  const month = toInteger(req.query?.month, current.month);
  const year = toInteger(req.query?.year, current.year);

  if (!Number.isInteger(month) || month < 1 || month > 12) {
    return sendJson(res, 400, {
      status: false,
      code: "INVALID_MONTH",
      message: "Bulan harus berada di antara 1 sampai 12.",
      data: [],
    });
  }

  if (!Number.isInteger(year) || year < 2020 || year > 2100) {
    return sendJson(res, 400, {
      status: false,
      code: "INVALID_YEAR",
      message: "Tahun tidak valid.",
      data: [],
    });
  }

  const url = new URL(OFFICIAL_API);
  url.searchParams.set("lang", "id");
  url.searchParams.set("month", String(month));
  url.searchParams.set("year", String(year));

  try {
    const payload = await fetchJkt48Json(url, { timeoutMs: 10000 });

    if (!Array.isArray(payload?.data)) {
      return sendJson(res, 502, {
        status: false,
        code: "INVALID_SCHEDULE_RESPONSE",
        message: "Format jadwal JKT48 tidak dikenali.",
        retryable: true,
        data: [],
      });
    }

    return sendJson(
      res,
      200,
      payload,
      "public, s-maxage=60, stale-while-revalidate=300",
    );
  } catch (error) {
    const failure = getPublicError(error, "Gagal mengambil jadwal JKT48.");

    return sendJson(res, failure.status, {
      status: false,
      code: failure.code,
      message: failure.message,
      retryable: failure.retryable,
      data: [],
    });
  }
}
