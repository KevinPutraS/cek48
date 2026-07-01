import test from "node:test";
import assert from "node:assert/strict";

import { buildTheaterQuotaSummary } from "../src/services/theaterQuota.js";

test("theater quota separates OFC and General allocations", () => {
  const summary = buildTheaterQuotaSummary({
    totalQuota: 250,
    salesPeriods: [
      {
        label: "OFC",
        pricing: [{ quota: 150, isOfcOnly: true }],
      },
      {
        label: "General",
        pricing: [{ quota: 100, isOfcOnly: false }],
      },
    ],
  });

  assert.equal(summary.totalQuota, 250);
  assert.equal(summary.ofcQuota, 150);
  assert.equal(summary.generalQuota, 100);
  assert.equal(summary.hasFcfs, false);
  assert.equal(summary.remainingQuota, null);
});

test("remaining quota card is enabled only when an FCFS period exists", () => {
  const summary = buildTheaterQuotaSummary({
    totalQuota: 250,
    salesPeriods: [
      { label: "OFC", quota: 150 },
      { label: "General", quota: 100 },
      { label: "General - FCFS", quota: 27 },
    ],
  });

  assert.equal(summary.hasFcfs, true);
  assert.equal(summary.remainingQuota, 27);
});
