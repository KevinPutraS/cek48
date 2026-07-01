import {
  JKT48_ENDPOINTS,
  fetchJkt48Json,
  getPublicError,
  sendJson,
} from "./_lib/jkt48.js";

const EVENT_CODE_PATTERN = /^EX[A-Z0-9]{4,12}$/i;

function readQueryValue(value) {
  return String(Array.isArray(value) ? value[0] : value || "").trim();
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return sendJson(res, 405, { ok: false, error: "Method not allowed" });
  }

  const code = readQueryValue(req.query?.code).toUpperCase();

  if (!EVENT_CODE_PATTERN.test(code)) {
    return sendJson(res, 400, {
      ok: false,
      code: "INVALID_EVENT_CODE",
      error:
        "Kode event tidak valid. Format yang diterima: EX + 4–12 karakter alfanumerik.",
      retryable: false,
    });
  }

  const url = JKT48_ENDPOINTS.quota(code);

  try {
    const data = await fetchJkt48Json(url);
    return sendJson(
      res,
      200,
      {
        ok: true,
        code,
        source: url,
        fetchedAt: new Date().toISOString(),
        data,
      },
      true,
    );
  } catch (error) {
    const failure = getPublicError(error, "Gagal mengambil detail event JKT48.");

    return sendJson(res, failure.status, {
      ok: false,
      eventCode: code,
      code: failure.code,
      errorCode: failure.code,
      error: failure.message,
      retryable: failure.retryable,
    });
  }
}
