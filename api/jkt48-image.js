import {
  fetchWithTimeout,
  getPublicError,
  sendJson,
  upstreamHeaders,
} from "./_lib/jkt48.js";

const ALLOWED_HOSTS = new Set(["jkt48.com", "www.jkt48.com"]);
const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/x-png",
  "image/webp",
  "image/avif",
  "image/gif",
]);
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const MAX_REDIRECTS = 2;

function readQueryValue(value) {
  return String(Array.isArray(value) ? value[0] : value || "").trim();
}

function parseAllowedImageUrl(value) {
  let url;

  try {
    url = new URL(value);
  } catch {
    const error = new Error("URL gambar tidak valid.");
    error.status = 400;
    error.code = "INVALID_IMAGE_URL";
    throw error;
  }

  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    url.port ||
    !ALLOWED_HOSTS.has(url.hostname.toLowerCase()) ||
    !url.pathname.startsWith("/api/v1/storages/media/")
  ) {
    const error = new Error("URL gambar tidak diizinkan.");
    error.status = 400;
    error.code = "INVALID_IMAGE_URL";
    throw error;
  }

  return url;
}

async function fetchAllowedImage(url, redirectCount = 0) {
  const upstream = await fetchWithTimeout(
    url.toString(),
    {
      headers: {
          ...upstreamHeaders,
          Accept: "image/avif,image/webp,image/*,*/*;q=0.8",
      },
      redirect: "manual",
    },
    12000,
  );

  if (upstream.status >= 300 && upstream.status < 400) {
    if (redirectCount >= MAX_REDIRECTS) {
      const error = new Error("Redirect gambar terlalu banyak.");
      error.status = 502;
      error.code = "IMAGE_REDIRECT_LIMIT";
      throw error;
    }

    const location = upstream.headers.get("location");
    if (!location) {
      const error = new Error("Redirect gambar tidak memiliki tujuan.");
      error.status = 502;
      error.code = "IMAGE_INVALID_REDIRECT";
      throw error;
    }

    const nextUrl = parseAllowedImageUrl(new URL(location, url).toString());
    return fetchAllowedImage(nextUrl, redirectCount + 1);
  }

  return upstream;
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return sendJson(res, 405, {
      status: false,
      message: "Method not allowed",
    });
  }

  try {
    const rawUrl = readQueryValue(req.query?.url);
    if (!rawUrl) {
      return sendJson(res, 400, {
        status: false,
        code: "MISSING_IMAGE_URL",
        message: "URL gambar tidak tersedia.",
      });
    }

    const imageUrl = parseAllowedImageUrl(rawUrl);
    const upstream = await fetchAllowedImage(imageUrl);

    if (!upstream.ok) {
      const error = new Error(`Gambar gagal dimuat (${upstream.status}).`);
      error.status = upstream.status === 429 ? 429 : 502;
      error.code =
        upstream.status === 429 ? "JKT48_WAITING_ROOM" : "IMAGE_UPSTREAM_ERROR";
      error.retryable = true;
      throw error;
    }

    let contentType = String(upstream.headers.get("content-type") || "")
      .split(";")[0]
      .trim()
      .toLowerCase();

    const contentLength = Number(
      upstream.headers.get("content-length") || 0
    );

    // JKT48 kadang mengirim gambar dengan application/octet-stream
    if (contentType === "application/octet-stream") {
      const path = imageUrl.pathname.toLowerCase();

      if (path.endsWith(".png")) {
        contentType = "image/png";
      } else if (path.endsWith(".webp")) {
        contentType = "image/webp";
      } else if (path.endsWith(".gif")) {
        contentType = "image/gif";
      } else if (path.endsWith(".avif")) {
        contentType = "image/avif";
      } else {
        contentType = "image/jpeg";
      }
    }

    if (!ALLOWED_IMAGE_TYPES.has(contentType)) {
      const error = new Error(`Unsupported image type: ${contentType}`);
      error.status = 502;
      error.code = "INVALID_IMAGE_CONTENT_TYPE";
      throw error;
    }

    if (contentLength > MAX_IMAGE_BYTES) {
      const error = new Error("Ukuran gambar terlalu besar.");
      error.status = 413;
      error.code = "IMAGE_TOO_LARGE";
      throw error;
    }

    const buffer = Buffer.from(await upstream.arrayBuffer());
    if (buffer.byteLength > MAX_IMAGE_BYTES) {
      const error = new Error("Ukuran gambar terlalu besar.");
      error.status = 413;
      error.code = "IMAGE_TOO_LARGE";
      throw error;
    }

    if (res.writableEnded) return undefined;
    res.statusCode = 200;
    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Length", String(buffer.byteLength));
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Cross-Origin-Resource-Policy", "same-origin");
    res.setHeader(
      "Cache-Control",
      "public, max-age=86400, s-maxage=604800, stale-while-revalidate=2592000",
    );
    res.end(buffer);
    return undefined;
  } catch (error) {
    console.error(error);
    const failure = getPublicError(error, "Gagal mengambil gambar member.");
    return sendJson(res, failure.status, {
      status: false,
      code: failure.code,
      message: failure.message,
      retryable: failure.retryable,
    });
  }
}
