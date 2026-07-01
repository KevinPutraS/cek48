import assert from "node:assert/strict";
import test from "node:test";
import eventsHandler from "../api/jkt48-events.js";
import imageHandler from "../api/jkt48-image.js";
import memberDetailHandler from "../api/jkt48-member-detail.js";
import quotaHandler from "../api/jkt48-quota.js";
import {
  JKT48_WAITING_ROOM_MESSAGE,
  fetchJkt48Json,
  getPublicError,
  isJkt48WaitingRoom,
  sendJson,
} from "../api/_lib/jkt48.js";

function response(body, init = {}) {
  return new Response(body, {
    status: init.status ?? 200,
    headers: init.headers ?? { "content-type": "application/json" },
  });
}

function createMockResponse() {
  const headers = new Map();
  return {
    statusCode: 200,
    headersSent: false,
    writableEnded: false,
    body: "",
    setHeader(name, value) {
      if (this.headersSent) throw new Error("headers already sent");
      headers.set(String(name).toLowerCase(), String(value));
    },
    getHeader(name) {
      return headers.get(String(name).toLowerCase());
    },
    end(value = "") {
      this.headersSent = true;
      this.writableEnded = true;
      this.body = Buffer.isBuffer(value) ? value : String(value);
    },
  };
}

test("waiting room detector tidak menganggap semua halaman Cloudflare sebagai antrean", () => {
  assert.equal(isJkt48WaitingRoom(429, ""), true);
  assert.equal(isJkt48WaitingRoom(200, "<h1>Waiting Room</h1>"), true);
  assert.equal(isJkt48WaitingRoom(503, "Cloudflare internal error"), false);
});

test("fetchJkt48Json mengubah Waiting Room menjadi error terstruktur", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () =>
    response("<!doctype html><title>Waiting Room</title>", {
      status: 429,
      headers: { "content-type": "text/html" },
    });

  try {
    await assert.rejects(
      fetchJkt48Json("https://jkt48.com/test"),
      (error) =>
        error.code === "JKT48_WAITING_ROOM" &&
        error.status === 429 &&
        error.message === JKT48_WAITING_ROOM_MESSAGE,
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("fetchJkt48Json menolak HTML non-Waiting-Room tanpa membocorkan HTML", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () =>
    response("<!doctype html><h1>Maintenance</h1>", {
      status: 503,
      headers: { "content-type": "text/html" },
    });

  try {
    await assert.rejects(
      fetchJkt48Json("https://jkt48.com/test"),
      (error) =>
        error.code === "JKT48_INVALID_RESPONSE" && !error.message.includes("<!doctype"),
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("fetchJkt48Json mengembalikan JSON valid", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => response(JSON.stringify({ status: true, data: [1] }));

  try {
    const result = await fetchJkt48Json("https://jkt48.com/test");
    assert.deepEqual(result, { status: true, data: [1] });
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("getPublicError menyaring HTML dari pesan", () => {
  const error = new Error("<!doctype html><html>secret</html>");
  error.status = 502;
  const result = getPublicError(error, "Pesan aman");
  assert.equal(result.message, "Pesan aman");
});

test("sendJson aman jika response sudah selesai atau header sudah dikirim", () => {
  const ended = createMockResponse();
  ended.writableEnded = true;
  assert.equal(sendJson(ended, 200, { ok: true }), false);

  const sent = createMockResponse();
  sent.headersSent = true;
  assert.doesNotThrow(() => sendJson(sent, 200, { ok: true }));
  assert.equal(sent.writableEnded, true);
});

test("endpoint event mengirim JSON Waiting Room yang ramah", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () =>
    response("<!doctype html><title>Waiting Room</title>", {
      status: 429,
      headers: { "content-type": "text/html" },
    });

  const req = { method: "GET", query: {}, headers: {} };
  const res = createMockResponse();

  try {
    await eventsHandler(req, res);
    assert.equal(res.statusCode, 429);
    const payload = JSON.parse(res.body);
    assert.equal(payload.code, "JKT48_WAITING_ROOM");
    assert.equal(payload.error, JKT48_WAITING_ROOM_MESSAGE);
    assert.equal(res.body.includes("<!doctype"), false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("network error ditampilkan sebagai pesan yang mudah dipahami", () => {
  const error = new Error("fetch failed");
  error.status = 502;
  error.code = "JKT48_NETWORK_ERROR";
  error.retryable = true;
  const result = getPublicError(error, "fallback");
  assert.equal(result.message.includes("fetch failed"), false);
  assert.equal(result.message.includes("Tidak dapat terhubung"), true);
});

test("proxy gambar menolak URL malformed dengan 400", async () => {
  const req = { method: "GET", query: { url: "bukan-url" }, headers: {} };
  const res = createMockResponse();
  await imageHandler(req, res);
  assert.equal(res.statusCode, 400);
  const payload = JSON.parse(res.body);
  assert.equal(payload.code, "INVALID_IMAGE_URL");
});

test("endpoint detail member menolak ID tidak valid", async () => {
  const req = { method: "GET", query: { id: "abc" }, headers: {} };
  const res = createMockResponse();

  await memberDetailHandler(req, res);

  assert.equal(res.statusCode, 400);
  const payload = JSON.parse(res.body);
  assert.equal(payload.code, "INVALID_MEMBER_ID");
});

test("endpoint detail member meneruskan biodata publik dengan aman", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () =>
    response(
      JSON.stringify({
        status: true,
        message: "Berhasil mendapatkan data",
        data: {
          type: "LOVE",
          code: "ALYA_AMANDA",
          name: "Alya Amanda",
          nickname: "Alya",
          birth_date: "2006-08-25T17:00:00.000Z",
          blood_type: "A",
          body_height: "162",
          horoscope: "Virgo",
          instagram_account: "jkt48.alya_",
        },
      }),
    );

  const req = { method: "GET", query: { id: "13" }, headers: {} };
  const res = createMockResponse();

  try {
    await memberDetailHandler(req, res);
    assert.equal(res.statusCode, 200);
    const payload = JSON.parse(res.body);
    assert.equal(payload.status, true);
    assert.equal(payload.data.name, "Alya Amanda");
    assert.equal(payload.data.instagram_account, "jkt48.alya_");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("endpoint detail member menolak ID nol", async () => {
  const response = createMockResponse();
  await memberDetailHandler(
    { method: "GET", query: { id: "0" }, headers: {} },
    response,
  );

  assert.equal(response.statusCode, 400);
  const payload = JSON.parse(response.body);
  assert.equal(payload.code, "INVALID_MEMBER_ID");
});

test("endpoint kuota mempertahankan error code Waiting Room dan eventCode terpisah", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () =>
    response("<!doctype html><title>Waiting Room</title>", {
      status: 429,
      headers: { "content-type": "text/html" },
    });

  const req = { method: "GET", query: { code: "EX1234" }, headers: {} };
  const res = createMockResponse();

  try {
    await quotaHandler(req, res);
    assert.equal(res.statusCode, 429);
    const payload = JSON.parse(res.body);
    assert.equal(payload.eventCode, "EX1234");
    assert.equal(payload.code, "JKT48_WAITING_ROOM");
    assert.equal(payload.errorCode, "JKT48_WAITING_ROOM");
    assert.equal(payload.error, JKT48_WAITING_ROOM_MESSAGE);
    assert.equal(payload.retryable, true);
    assert.equal(res.body.includes("<!doctype"), false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("endpoint detail member menolak data array yang malformed", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => response(JSON.stringify({ status: true, data: [] }));

  const req = { method: "GET", query: { id: "13" }, headers: {} };
  const res = createMockResponse();

  try {
    await memberDetailHandler(req, res);
    assert.equal(res.statusCode, 502);
    const payload = JSON.parse(res.body);
    assert.equal(payload.code, "INVALID_MEMBER_DETAIL");
    assert.equal(payload.retryable, true);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("proxy gambar menolak kredensial dan port nonstandar", async () => {
  for (const url of [
    "https://user:pass@jkt48.com/api/v1/storages/media/test.jpg",
    "https://jkt48.com:444/api/v1/storages/media/test.jpg",
  ]) {
    const req = { method: "GET", query: { url }, headers: {} };
    const res = createMockResponse();
    await imageHandler(req, res);
    assert.equal(res.statusCode, 400);
    assert.equal(JSON.parse(res.body).code, "INVALID_IMAGE_URL");
  }
});
