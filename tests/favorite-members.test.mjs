import test from "node:test";
import assert from "node:assert/strict";

import { writeFavoriteSnapshot } from "../src/services/favoriteMembers.js";

test("favorite tetap berubah ketika localStorage menolak penulisan", () => {
  const blockedStorage = {
    setItem() {
      throw new Error("QuotaExceededError");
    },
  };

  const next = writeFavoriteSnapshot(
    {
      keys: ["Lily"],
      profiles: [{ key: "Lily", name: "Hillary Abigail" }],
    },
    blockedStorage,
  );

  assert.deepEqual(next.keys, ["Lily"]);
  assert.equal(next.profiles[0].name, "Hillary Abigail");
});
