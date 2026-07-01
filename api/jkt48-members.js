import { fetchJkt48Json, getPublicError, sendJson } from "./_lib/jkt48.js";

const MEMBERS_URL = "https://jkt48.com/api/v1/members?lang=id";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return sendJson(res, 405, {
      status: false,
      message: "Method not allowed",
    });
  }

  try {
    const payload = await fetchJkt48Json(MEMBERS_URL, { timeoutMs: 10000 });
    const members =
      payload?.data?.members ?? payload?.data ?? payload?.members ?? payload;

    if (!Array.isArray(members)) {
      return sendJson(res, 502, {
        status: false,
        code: "INVALID_MEMBERS_RESPONSE",
        message: "Format daftar member JKT48 tidak dikenali.",
        retryable: true,
      });
    }

    return sendJson(
      res,
      200,
      payload,
      "public, s-maxage=300, stale-while-revalidate=900",
    );
  } catch (error) {
    const failure = getPublicError(error, "Gagal mengambil profil member.");

    return sendJson(res, failure.status, {
      status: false,
      code: failure.code,
      message: failure.message,
      retryable: failure.retryable,
    });
  }
}
