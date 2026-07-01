import {
  JKT48_ENDPOINTS,
  fetchJkt48Json,
  getPublicError,
  sendJson,
} from "./_lib/jkt48.js";

const EVENT_CODE_PATTERN = /^EX[A-Z0-9]{4,12}$/i;
const MAX_CODES = 12;
const CONCURRENCY = 3;

function parseCodes(rawValue) {
  const raw = Array.isArray(rawValue) ? rawValue.join(",") : String(rawValue || "");

  return [
    ...new Set(
      raw
        .split(",")
        .map((code) => code.trim().toUpperCase())
        .filter((code) => EVENT_CODE_PATTERN.test(code)),
    ),
  ].slice(0, MAX_CODES);
}

async function mapInBatches(values, batchSize, worker) {
  const results = [];
  for (let index = 0; index < values.length; index += batchSize) {
    const batch = values.slice(index, index + batchSize);
    results.push(...(await Promise.all(batch.map(worker))));
  }
  return results;
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return sendJson(res, 405, { ok: false, error: "Method not allowed" });
  }

  const codes = parseCodes(req.query?.codes);
  if (!codes.length) {
    return sendJson(res, 400, {
      ok: false,
      code: "INVALID_EVENT_CODES",
      error: "Tidak ada kode event valid yang dikirim.",
      retryable: false,
    });
  }

  const results = await mapInBatches(codes, CONCURRENCY, async (code) => {
    const source = JKT48_ENDPOINTS.quota(code);

    try {
      const data = await fetchJkt48Json(source);
      return { ok: true, code, source, data };
    } catch (error) {
      const failure = getPublicError(error, "Gagal mengambil stock event.");
      return {
        ok: false,
        code,
        source,
        status: failure.status,
        errorCode: failure.code,
        error: failure.message,
        retryable: failure.retryable,
      };
    }
  });

  const successCount = results.filter((result) => result.ok).length;
  const failures = results.filter((result) => !result.ok);

  if (!successCount) {
    const waitingRoom = failures.every(
      (result) => result.errorCode === "JKT48_WAITING_ROOM",
    );
    const firstFailure = failures[0];

    return sendJson(res, waitingRoom ? 429 : 502, {
      ok: false,
      code: waitingRoom ? "JKT48_WAITING_ROOM" : "JKT48_STOCKS_UNAVAILABLE",
      error: waitingRoom
        ? firstFailure?.error
        : "Stock event JKT48 sementara tidak dapat diambil.",
      retryable: failures.some((result) => result.retryable),
      fetchedAt: new Date().toISOString(),
      requested: codes.length,
      successCount: 0,
      failedCount: failures.length,
      results,
    });
  }

  return sendJson(res, 200, {
    ok: true,
    partial: failures.length > 0,
    fetchedAt: new Date().toISOString(),
    requested: codes.length,
    successCount,
    failedCount: failures.length,
    results,
  });
}
