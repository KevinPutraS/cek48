import test from "node:test";
import assert from "node:assert/strict";

import {
  extractExclusiveEvents,
  isEventCurrentlyActive,
} from "../src/services/quotaApi.js";
import { hasOnlyPastDatedSlots } from "../src/features/quota/quotaModel.js";

test("extractExclusiveEvents membuang event tidak aktif", () => {
  const payload = {
    data: [
      {
        code: "EXLIVE1",
        title: "Event Aktif",
        category: "TWO_SHOT",
        valid_date_from: "2026-06-01T00:00:00+07:00",
        valid_date_to: "2099-06-30T23:59:59+07:00",
        is_active: true,
      },
      {
        code: "EXOLD01",
        title: "Event Lama",
        category: "TWO_SHOT",
        valid_date_from: "2020-01-01T00:00:00+07:00",
        valid_date_to: "2020-01-02T00:00:00+07:00",
        is_active: false,
      },
    ],
  };

  const events = extractExclusiveEvents(payload);
  assert.equal(events.length, 1);
  assert.equal(events[0].code, "EXLIVE1");
  assert.equal(isEventCurrentlyActive(events[0]), true);
});

test("event kuota dianggap selesai jika semua slot bertanggal sudah lewat", () => {
  const today = Date.UTC(2026, 5, 25);

  assert.equal(
    hasOnlyPastDatedSlots([{ date: "2026-06-18" }, { date: "2026-06-24" }], today),
    true,
  );

  assert.equal(
    hasOnlyPastDatedSlots([{ date: "2026-06-24" }, { date: "2026-06-25" }], today),
    false,
  );
});

test("event kuota tidak disembunyikan jika tanggal slot tidak lengkap", () => {
  const today = Date.UTC(2026, 5, 25);

  assert.equal(
    hasOnlyPastDatedSlots([{ date: "2026-06-24" }, { date: "" }], today),
    false,
  );
  assert.equal(hasOnlyPastDatedSlots([], today), false);
});
