import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import test from "node:test";

const pages = [
  ["QuotaPage", "../src/pages/QuotaPage.jsx", "../features/quota/"],
  ["MembersPage", "../src/pages/MembersPage.jsx", "../features/members/"],
  ["SchedulePage", "../src/pages/SchedulePage.jsx", "../features/schedule/"],
];

test("route page hanya menjadi composition root yang kecil", async () => {
  for (const [name, relativeUrl, featureImport] of pages) {
    const source = await readFile(new URL(relativeUrl, import.meta.url), "utf8");
    const lineCount = source.split(/\r?\n/).length;

    assert.ok(lineCount <= 90, `${name} terlalu besar (${lineCount} baris)`);
    assert.match(
      source,
      new RegExp(featureImport.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
    );
  }
});

test("controller dan view feature terpisah dari route page", async () => {
  const modules = [
    ["quota", "useQuotaMonitor.js", "QuotaPageSections.jsx"],
    ["members", "useMembersDirectory.js", "MembersPageView.jsx"],
    ["schedule", "useSchedulePage.js", "SchedulePageView.jsx"],
  ];

  for (const [feature, controller, view] of modules) {
    const base = new URL(`../src/features/${feature}/`, import.meta.url);
    const files = await readdir(base);
    assert.ok(files.includes(controller), `${feature} belum punya controller`);
    assert.ok(files.includes(view), `${feature} belum punya view`);
  }
});

test("feature model tidak mengimpor page sehingga tidak membentuk circular dependency", async () => {
  const modelUrls = [
    "../src/features/quota/quotaModel.js",
    "../src/features/members/memberModel.js",
    "../src/features/schedule/scheduleModel.js",
  ];

  for (const relativeUrl of modelUrls) {
    const source = await readFile(new URL(relativeUrl, import.meta.url), "utf8");
    assert.doesNotMatch(source, /from\s+["'][^"']*pages\//);
  }
});

test("CSS halaman dipecah menjadi modul komponen", async () => {
  const expected = {
    monitor: ["controls.css", "results.css", "responsive.css"],
    members: ["directory.css", "profile.css", "birthdays.css"],
    schedule: ["hero.css", "controls.css", "timeline.css", "detail.css"],
  };

  for (const [feature, requiredFiles] of Object.entries(expected)) {
    const directory = new URL(`../src/styles/${feature}/`, import.meta.url);
    const files = await readdir(directory);
    requiredFiles.forEach((file) => {
      assert.ok(files.includes(file), `${feature}/${file} belum tersedia`);
    });
  }
});
