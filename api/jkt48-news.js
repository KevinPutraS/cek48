import {
  JKT48_ENDPOINTS,
  fetchJkt48Json,
  getPublicError,
  sendJson,
} from "./_lib/jkt48.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return sendJson(res, 405, {
      ok: false,
      error: "Method not allowed",
    });
  }

  const page = Number(req.query.page || 1);

  try {
    const data = await fetchJkt48Json(
      JKT48_ENDPOINTS.news(page)
    );

    return sendJson(
      res,
      200,
      {
        ok: true,
        source: JKT48_ENDPOINTS.news(page),
        fetchedAt: new Date().toISOString(),
        data,
      },
      true
    );
  } catch (error) {
    const failure = getPublicError(
      error,
      "Gagal mengambil berita JKT48."
    );

    return sendJson(res, failure.status, {
      ok: false,
      code: failure.code,
      error: failure.message,
      retryable: failure.retryable,
    });
  }
}