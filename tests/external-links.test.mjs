import assert from "node:assert/strict";
import test from "node:test";

import {
  buildMemberSocialUrl,
  getOfficialJkt48ScheduleUrl,
  getOfficialMemberProfileUrl,
} from "../src/services/externalLinks.js";

test("tautan sosial menerima username dan domain resmi", () => {
  assert.equal(
    buildMemberSocialUrl("instagram", "@jkt48.alya_"),
    "https://instagram.com/jkt48.alya_",
  );
  assert.equal(
    buildMemberSocialUrl("youtube", "dQw4w9WgXcQ"),
    "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  );
  assert.equal(
    buildMemberSocialUrl("twitter", "https://x.com/JKT48"),
    "https://x.com/JKT48",
  );
});

test("tautan sosial menolak protokol dan host asing", () => {
  assert.equal(buildMemberSocialUrl("instagram", "javascript:alert(1)"), "");
  assert.equal(buildMemberSocialUrl("instagram", "https://example.com/a"), "");
  assert.equal(buildMemberSocialUrl("twitter", "http://x.com/JKT48"), "");
});

test("profil member resmi hanya dibuat dari ID positif", () => {
  assert.match(
    getOfficialMemberProfileUrl({ id: 13, name: "Alya Amanda", type: "LOVE" }),
    /^https:\/\/jkt48\.com\/member\/detail\?/,
  );
  assert.equal(getOfficialMemberProfileUrl({ id: 0, name: "Test" }), "");
  assert.equal(getOfficialMemberProfileUrl({ id: "x&evil=1", name: "Test" }), "");
});

test("tautan jadwal hanya mengizinkan domain resmi JKT48", () => {
  assert.equal(
    getOfficialJkt48ScheduleUrl("/schedule/SH123"),
    "https://jkt48.com/schedule/SH123",
  );
  assert.equal(
    getOfficialJkt48ScheduleUrl("https://www.jkt48.com/schedule/SH123#detail"),
    "https://www.jkt48.com/schedule/SH123",
  );
  assert.equal(getOfficialJkt48ScheduleUrl("https://example.com/phishing"), "");
});
