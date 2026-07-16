import {
  JKT48_ENDPOINTS,
  fetchJkt48Json,
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

  const { slug } = req.query;

  if (!slug) {
    return sendJson(res, 400, {
      ok: false,
      error: "Slug tidak ditemukan.",
    });
  }

  try {
    // =========================
    // DETAIL DARI API RESMI JKT48
    // =========================

    const detail = await fetchJkt48Json(
      `https://jkt48.com/api/v1/news/${slug}?lang=id&preview=false`
    );

    console.log(detail);

    const news = detail?.data?.result;

    if (!news) {
      return sendJson(res, 404, {
        ok: false,
        error: "Berita tidak ditemukan.",
      });
    }

    return sendJson(
      res,
      200,
      {
        ok: true,
        data: {
          news_id: news.news_id,
          title: news.title,
          category: news.category,
          valid_date_from: news.valid_date_from,
          background_image: news.background_image,
          content: news.content_body,
          short_description: news.short_description,
          external_url: news.external_url,
        },
      },
      true
    );
  } catch (error) {
    console.error(error);

    return sendJson(res, 500, {
      ok: false,
      error: "Gagal mengambil detail berita.",
    });
  }
}