import { fetchJkt48Json, getPublicError, sendJson } from "./_lib/jkt48.js";

const MEMBER_ID_PATTERN = /^[1-9]\d{0,5}$/;
const MEMBER_DETAIL_BASE_URL = "https://jkt48.com/api/v1/members";

function readQueryValue(value) {
  return String(Array.isArray(value) ? value[0] : value || "").trim();
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return sendJson(res, 405, {
      status: false,
      code: "METHOD_NOT_ALLOWED",
      message: "Method not allowed",
    });
  }

  const memberId = readQueryValue(req.query?.id);

  if (!MEMBER_ID_PATTERN.test(memberId)) {
    return sendJson(res, 400, {
      status: false,
      code: "INVALID_MEMBER_ID",
      message: "ID member tidak valid.",
      retryable: false,
    });
  }

  const url = `${MEMBER_DETAIL_BASE_URL}/${encodeURIComponent(memberId)}?lang=id`;

  try {
    const payload = await fetchJkt48Json(url, { timeoutMs: 10000 });

    if (
      payload?.status === false ||
      !payload?.data ||
      typeof payload.data !== "object" ||
      Array.isArray(payload.data)
    ) {
      return sendJson(res, 502, {
        status: false,
        code: "INVALID_MEMBER_DETAIL",
        message: payload?.message || "Format detail member JKT48 tidak dikenali.",
        retryable: true,
      });
    }

    return sendJson(
      res,
      200,
      {
        status: true,
        message: payload?.message || "Berhasil mendapatkan data",
        fetchedAt: new Date().toISOString(),
        data: payload.data,
      },
      "public, s-maxage=300, stale-while-revalidate=900",
    );
  } catch (error) {
    const failure = getPublicError(error, "Gagal mengambil detail member.");

    return sendJson(res, failure.status, {
      status: false,
      code: failure.code,
      message: failure.message,
      retryable: failure.retryable,
    });
  }
}
