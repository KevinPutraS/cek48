import test from "node:test";
import assert from "node:assert/strict";
import { isExpiredExclusive } from "../src/services/scheduleVisibility.js";

const now = { key: "2026-06-21", hour: 15, minute: 30 };

test("Show dan Event tidak disembunyikan oleh aturan Exclusive", () => {
  assert.equal(
    isExpiredExclusive(
      { type: "SHOW", dateKey: "2026-06-20", startTime: "10:00" },
      now,
    ),
    false,
  );
  assert.equal(
    isExpiredExclusive(
      { type: "EVENT", dateKey: "2026-06-20", startTime: "10:00" },
      now,
    ),
    false,
  );
});

test("Exclusive tanggal lampau disembunyikan", () => {
  assert.equal(
    isExpiredExclusive(
      { type: "EXCLUSIVE", dateKey: "2026-06-20", endTime: "23:59" },
      now,
    ),
    true,
  );
});

test("Exclusive tanggal mendatang tetap tampil", () => {
  assert.equal(
    isExpiredExclusive(
      { type: "EXCLUSIVE", dateKey: "2026-06-22", endTime: "00:01" },
      now,
    ),
    false,
  );
});

test("Exclusive hari ini memakai endTime sebagai batas utama", () => {
  assert.equal(
    isExpiredExclusive(
      {
        type: "EXCLUSIVE",
        dateKey: "2026-06-21",
        startTime: "10:00",
        endTime: "15:29",
      },
      now,
    ),
    true,
  );
  assert.equal(
    isExpiredExclusive(
      {
        type: "EXCLUSIVE",
        dateKey: "2026-06-21",
        startTime: "10:00",
        endTime: "15:31",
      },
      now,
    ),
    false,
  );
});

test("Exclusive hari ini memakai startTime bila endTime kosong", () => {
  assert.equal(
    isExpiredExclusive(
      {
        type: "EXCLUSIVE",
        dateKey: "2026-06-21",
        startTime: "15:30",
        endTime: "--:--",
      },
      now,
    ),
    true,
  );
});

test("Exclusive tanpa jam valid tetap tampil sampai hari berganti", () => {
  assert.equal(
    isExpiredExclusive(
      {
        type: "EXCLUSIVE",
        dateKey: "2026-06-21",
        startTime: "--:--",
        endTime: "--:--",
      },
      now,
    ),
    false,
  );
});
