import {
  JKT48_ENDPOINTS,
  fetchJkt48Json,
  getPublicError,
  sendJson,
} from "./_lib/jkt48.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return sendJson(res, 405, { ok: false, error: "Method not allowed" });
  }

  try {
    const data = await fetchJkt48Json(JKT48_ENDPOINTS.events);
    return sendJson(
      res,
      200,
      {
        ok: true,
        source: JKT48_ENDPOINTS.events,
        fetchedAt: new Date().toISOString(),
        data,
      },
      true,
    );
  } catch (error) {
    const failure = getPublicError(error, "Gagal mengambil daftar event JKT48.");

    return sendJson(res, failure.status, {
      ok: false,
      code: failure.code,
      error: failure.message,
      retryable: failure.retryable,
    });
  }
}
