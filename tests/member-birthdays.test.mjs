import test from "node:test";
import assert from "node:assert/strict";

import {
  getUpcomingBirthdays,
  parseBirthdayParts,
} from "../src/services/memberBirthdays.js";

test("birthday parser respects Jakarta date for zoned API timestamps", () => {
  assert.deepEqual(parseBirthdayParts("2006-08-25T17:00:00.000Z"), {
    year: 2006,
    month: 8,
    day: 26,
  });
});

test("birthday tracker sorts from nearest to farthest across year boundary", () => {
  const members = [
    { name: "Januari", birthday: "2007-01-02" },
    { name: "Besok", birthday: "2007-12-31" },
    { name: "Hari Ini", birthday: "2007-12-30" },
  ];
  const result = getUpcomingBirthdays(members, new Date("2026-12-29T17:00:00.000Z"));

  assert.deepEqual(
    result.map((entry) => [entry.member.name, entry.daysUntil]),
    [
      ["Hari Ini", 0],
      ["Besok", 1],
      ["Januari", 3],
    ],
  );
});
