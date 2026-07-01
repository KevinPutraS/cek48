import test from "node:test";
import assert from "node:assert/strict";

import {
  ALL_MEMBER_TYPES,
  normalizeMemberType,
  resolveMemberTypeFilter,
} from "../src/services/memberDirectory.js";

test("filter member tanpa parameter type kembali ke ALL", () => {
  assert.equal(resolveMemberTypeFilter(null), ALL_MEMBER_TYPES);
  assert.equal(resolveMemberTypeFilter(undefined), ALL_MEMBER_TYPES);
  assert.equal(resolveMemberTypeFilter(""), ALL_MEMBER_TYPES);
});

test("normalisasi tipe member tidak mengubah null menjadi string NULL", () => {
  assert.equal(normalizeMemberType(null), "");
  assert.equal(normalizeMemberType(undefined), "");
});

test("normalisasi tipe member menerima variasi penulisan team", () => {
  assert.equal(normalizeMemberType("Team Love"), "LOVE");
  assert.equal(normalizeMemberType("jkt48 virtual"), "JKT48_VIRTUAL");
  assert.equal(resolveMemberTypeFilter("Dream"), "DREAM");
});
