const JKT48_BASE_URL = "https://jkt48.com";
const MAX_JSON_RESPONSE_BYTES = 4 * 1024 * 1024;

export const JKT48_WAITING_ROOM_MESSAGE =
  "JKT48 sedang menerapkan Waiting Room. Data baru belum dapat diambil. Silakan coba kembali beberapa saat lagi.";

export const JKT48_ENDPOINTS = {
  events: `${JKT48_BASE_URL}/api/v1/exclusives?lang=id`,

  news: (page = 1) =>
    `${JKT48_BASE_URL}/api/v1/news?lang=id&page=${page}`,

  quota: (code) =>
    `${JKT48_BASE_URL}/api/v1/exclusives/${encodeURIComponent(code)}?lang=id`,
};

export const upstreamHeaders = {
  Accept: "application/json, text/plain, */*",
  "Accept-Language": "id-ID,id;q=0.9,en;q=0.8",
  Referer: `${JKT48_BASE_URL}/what-are-exclusive/all?category=DIGITAL_PHOTOBOOK`,
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/149 Safari/537.36",
};

function normalizeStatus(value, fallback = 502) {
  const status = Number(value);
  return Number.isInteger(status) && status >= 400 && status <= 599 ? status : fallback;
}

function safeMessage(value, fallback) {
  const text = String(value || "")
    .replace(/\s+/g, " ")
    .trim();
  if (!text || /<!doctype|<html|<body|<script/i.test(text)) return fallback;
  return text.slice(0, 500);
}

export function isJkt48WaitingRoom(status, body = "") {
  if (Number(status) === 429) return true;

  const text = String(body || "").toLowerCase();
  return [
    "waiting room",
    "waitingroom",
    "cf-waiting-room",
    "you are now in line",
    "you are in line",
    "please wait while we prepare",
    "anda sedang dalam antrean",
    "anda sedang dalam antrian",
  ].some((marker) => text.includes(marker));
}

export function getPublicError(error, fallbackMessage) {
  const fallback = String(
    fallbackMessage || "Data JKT48 sementara tidak dapat diambil.",
  );
  const code = String(error?.code || "JKT48_UPSTREAM_ERROR").trim();
  const waitingRoom = code === "JKT48_WAITING_ROOM";
  const fixedMessages = {
    JKT48_NETWORK_ERROR:
      "Tidak dapat terhubung ke server JKT48. Periksa koneksi atau coba kembali beberapa saat lagi.",
    JKT48_TIMEOUT:
      "Server JKT48 terlalu lama merespons. Silakan coba kembali beberapa saat lagi.",
    JKT48_INVALID_RESPONSE:
      "Respons JKT48 sementara tidak dapat dibaca. Silakan coba kembali beberapa saat lagi.",
    JKT48_EMPTY_RESPONSE:
      "Server JKT48 mengirim respons kosong. Silakan coba kembali beberapa saat lagi.",
    JKT48_RESPONSE_TOO_LARGE:
      "Respons JKT48 sementara tidak dapat diproses. Silakan coba kembali beberapa saat lagi.",
  };

  return {
    status: normalizeStatus(error?.status, 502),
    code: code || "JKT48_UPSTREAM_ERROR",
    message: waitingRoom
      ? JKT48_WAITING_ROOM_MESSAGE
      : fixedMessages[code] || safeMessage(error?.message, fallback),
    retryable:
      waitingRoom ||
      error?.retryable === true ||
      normalizeStatus(error?.status, 502) >= 500,
  };
}

export async function fetchWithTimeout(url, options = {}, timeoutMs = 10000) {
  const controller = new AbortController();
  const upstreamSignal = options.signal;
  let timedOut = false;

  const handleAbort = () => controller.abort(upstreamSignal?.reason);
  const timeoutId = setTimeout(
    () => {
      timedOut = true;
      controller.abort(new Error("Upstream request timed out"));
    },
    Math.max(1000, Number(timeoutMs) || 10000),
  );

  if (upstreamSignal) {
    if (upstreamSignal.aborted) handleAbort();
    else upstreamSignal.addEventListener("abort", handleAbort, { once: true });
  }

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } catch (error) {
    if (timedOut) {
      const timeoutError = new Error(
        `Server JKT48 terlalu lama merespons (${Math.round(
          Math.max(1000, Number(timeoutMs) || 10000) / 1000,
        )} detik).`,
      );
      timeoutError.status = 504;
      timeoutError.code = "JKT48_TIMEOUT";
      timeoutError.retryable = true;
      throw timeoutError;
    }

    if (!upstreamSignal?.aborted && !error?.status) {
      error.status = 502;
      error.code = error.code || "JKT48_NETWORK_ERROR";
      error.retryable = true;
    }

    throw error;
  } finally {
    clearTimeout(timeoutId);
    upstreamSignal?.removeEventListener("abort", handleAbort);
  }
}

export function sendJson(res, status, payload, cache = false) {
  if (!res || res.writableEnded) return false;

  if (res.headersSent) {
    res.end();
    return false;
  }

  res.statusCode = Number(status) || 500;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("X-Content-Type-Options", "nosniff");
  const cacheControl =
    typeof cache === "string"
      ? cache
      : cache
        ? "public, s-maxage=15, stale-while-revalidate=45"
        : "no-store, max-age=0";
  res.setHeader("Cache-Control", cacheControl);
  res.end(JSON.stringify(payload));
  return true;
}

export async function fetchJkt48Json(url, options = {}) {
  const timeoutMs = Number.isFinite(options.timeoutMs)
    ? Math.max(1000, Number(options.timeoutMs))
    : 10000;

  const response = await fetchWithTimeout(
    url,
    {
      method: "GET",
      signal: options.signal,
      headers: {
        ...upstreamHeaders,
        ...(options.headers || {}),
      },
      redirect: "follow",
      cache: "no-store",
    },
    timeoutMs,
  );

  const declaredLength = Number(response.headers.get("content-length") || 0);
  if (declaredLength > MAX_JSON_RESPONSE_BYTES) {
    const error = new Error("Respons JKT48 terlalu besar untuk diproses.");
    error.status = 502;
    error.code = "JKT48_RESPONSE_TOO_LARGE";
    error.retryable = true;
    throw error;
  }

  const text = await response.text();

  if (text.length > MAX_JSON_RESPONSE_BYTES) {
    const error = new Error("Respons JKT48 terlalu besar untuk diproses.");
    error.status = 502;
    error.code = "JKT48_RESPONSE_TOO_LARGE";
    error.retryable = true;
    throw error;
  }

  if (response.status === 429) {
    const error = new Error(JKT48_WAITING_ROOM_MESSAGE);
    error.status = 429;
    error.code = "JKT48_WAITING_ROOM";
    error.retryable = true;
    throw error;
  }

  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    if (isJkt48WaitingRoom(response.status, text)) {
      const error = new Error(JKT48_WAITING_ROOM_MESSAGE);
      error.status = 429;
      error.code = "JKT48_WAITING_ROOM";
      error.retryable = true;
      throw error;
    }

    console.error("[JKT48 INVALID RESPONSE]", {
      url: String(url),
      status: response.status,
      contentType: response.headers.get("content-type"),
      preview: text.replace(/\s+/g, " ").slice(0, 180),
    });

    const error = new Error(
      "Respons JKT48 sementara tidak dapat dibaca. Silakan coba kembali beberapa saat lagi.",
    );
    error.status = response.ok ? 502 : normalizeStatus(response.status, 502);
    error.code = "JKT48_INVALID_RESPONSE";
    error.retryable = true;
    throw error;
  }

  if (!response.ok || data?.status === false || data?.ok === false) {
    const error = new Error(
      safeMessage(
        data?.message || data?.error,
        `Server JKT48 merespons HTTP ${response.status}.`,
      ),
    );
    error.status = normalizeStatus(response.status, 502);
    error.code = String(data?.code || "JKT48_UPSTREAM_ERROR");
    error.retryable = response.status === 429 || response.status >= 500;
    throw error;
  }

  if (data === null || data === undefined) {
    const error = new Error("Respons JKT48 kosong dan tidak dapat diproses.");
    error.status = 502;
    error.code = "JKT48_EMPTY_RESPONSE";
    error.retryable = true;
    throw error;
  }

  return data;
}
