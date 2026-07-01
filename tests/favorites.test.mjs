import test from "node:test";
import assert from "node:assert/strict";

import {
  isMemberFavorite,
  reconcileFavoriteSnapshot,
  toggleFavoriteSnapshot,
} from "../src/services/favoriteMembers.js";

test("favorite member cocok lewat code, nama, dan alias", () => {
  const snapshot = toggleFavoriteSnapshot(
    { keys: [], profiles: [] },
    { code: "HILLY", id: 12, name: "Hillary Abigail", nickname: "Lily" },
  );

  assert.equal(
    isMemberFavorite({ memberCode: "HILLY", member: "Hillary Abigail" }, snapshot),
    true,
  );
  assert.equal(isMemberFavorite({ member: "Lily" }, snapshot), true);
  assert.equal(isMemberFavorite({ member: "Member Lain" }, snapshot), false);
});

test("favorite lama dimigrasikan menjadi profil lengkap", () => {
  const snapshot = reconcileFavoriteSnapshot({ keys: ["HILLY"], profiles: [] }, [
    { code: "HILLY", id: 12, name: "Hillary Abigail", nickname: "Lily" },
  ]);

  assert.equal(snapshot.keys.length, 1);
  assert.equal(snapshot.profiles.length, 1);
  assert.equal(snapshot.profiles[0].name, "Hillary Abigail");
});

test("toggle dari nama menghapus key lama berbasis code", () => {
  const snapshot = {
    keys: ["HILLY"],
    profiles: [
      {
        key: "HILLY",
        code: "HILLY",
        id: 12,
        name: "Hillary Abigail",
        nickname: "Lily",
      },
    ],
  };

  const next = toggleFavoriteSnapshot(snapshot, { name: "Hillary Abigail" });
  assert.deepEqual(next.keys, []);
  assert.deepEqual(next.profiles, []);
});

test("reconcile menggabungkan beberapa key lama milik member yang sama", () => {
  const snapshot = reconcileFavoriteSnapshot(
    {
      keys: ["HILLY", "Hillary Abigail", "Lily"],
      profiles: [{ key: "Lily", name: "Hillary Abigail", nickname: "Lily" }],
    },
    [{ code: "HILLY", id: 12, name: "Hillary Abigail", nickname: "Lily" }],
  );

  assert.deepEqual(snapshot.keys, ["HILLY"]);
  assert.equal(snapshot.profiles.length, 1);
  assert.equal(snapshot.profiles[0].code, "HILLY");
});
