import { fetchJkt48Json, getPublicError, sendJson } from "./_lib/jkt48.js";

const BASE_URL = "https://jkt48.com/api/v1/theater-shows";

function readQueryValue(value) {
  return String(Array.isArray(value) ? value[0] : value || "").trim();
}

function isValidCode(value) {
  return /^SH[A-Z0-9]{3,12}$/i.test(String(value || "").trim());
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return sendJson(res, 405, {
      status: false,
      message: "Method tidak diizinkan.",
      data: null,
    });
  }

  const code = readQueryValue(req.query?.code).toUpperCase();

  if (!isValidCode(code)) {
    return sendJson(res, 400, {
      status: false,
      code: "INVALID_SHOW_CODE",
      message: "Kode theater show tidak valid.",
      data: null,
    });
  }

  const url = `${BASE_URL}/${encodeURIComponent(code)}?lang=id`;

  try {
    const payload = await fetchJkt48Json(url, { timeoutMs: 10000 });

    if (
      !payload?.data ||
      typeof payload.data !== "object" ||
      Array.isArray(payload.data)
    ) {
      return sendJson(res, 502, {
        status: false,
        code: "INVALID_THEATER_RESPONSE",
        message: "Format detail theater show JKT48 tidak dikenali.",
        retryable: true,
        data: null,
      });
    }

    return sendJson(
      res,
      200,
      payload,
      "public, s-maxage=60, stale-while-revalidate=300",
    );
  } catch (error) {
    const failure = getPublicError(error, "Gagal mengambil detail theater show.");

    return sendJson(res, failure.status, {
      status: false,
      code: failure.code,
      message: failure.message,
      retryable: failure.retryable,
      data: null,
    });
  }
}
