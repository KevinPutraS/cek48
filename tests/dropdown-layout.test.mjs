import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import test from "node:test";

const quotaPageUrl = new URL("../src/features/quota/QuotaFilters.jsx", import.meta.url);
const quotaMonitorUrl = new URL(
  "../src/features/quota/useQuotaMonitor.js",
  import.meta.url,
);
const quotaSectionsUrl = new URL(
  "../src/features/quota/QuotaPageSections.jsx",
  import.meta.url,
);

async function readCssDirectory(relativePath) {
  const directory = new URL(relativePath, import.meta.url);
  const files = (await readdir(directory))
    .filter((file) => file.endsWith(".css"))
    .sort();
  const sources = await Promise.all(
    files.map((file) => readFile(new URL(file, directory), "utf8")),
  );
  return sources.join("\n");
}

test("panel monitor tidak memotong menu dropdown", async () => {
  const css = await readCssDirectory("../src/styles/monitor/");

  assert.match(
    css,
    /\.nx-monitor-command,\s*\.nx-monitor-filter-dock\s*\{[^}]*overflow:\s*visible/s,
  );
  assert.match(css, /\.nx-monitor-command\s*\{[^}]*z-index:\s*30/s);
  assert.match(css, /\.custom-field\.is-open\s*\{[^}]*z-index:\s*500/s);
});

test("dropdown mereset pilihan aktif saat daftar event berubah", async () => {
  const source = await readFile(quotaPageUrl, "utf8");

  assert.match(source, /const optionSignature = options/);
  assert.match(source, /optionRefs\.current = \[\]/);
  assert.match(source, /setActiveIndex\(selectedIndex\)/);
  assert.match(source, /setOpen\(false\);\s*onChange\(option\.value\)/s);
});

test("kategori utama tetap tersedia saat event aktifnya kosong", async () => {
  const [monitorSource, sectionsSource] = await Promise.all([
    readFile(quotaMonitorUrl, "utf8"),
    readFile(quotaSectionsUrl, "utf8"),
  ]);

  assert.match(
    monitorSource,
    /const PERSISTENT_QUOTA_CATEGORIES = new Set\(\[[\s\S]*"DIGITAL_PHOTOBOOK"[\s\S]*"PHOTOCARD"[\s\S]*"TWO_SHOT"[\s\S]*\]\)/,
  );
  assert.match(
    monitorSource,
    /PERSISTENT_QUOTA_CATEGORIES\.has\(category\) \|\|\s*exclusiveEvents\.some/s,
  );
  assert.match(monitorSource, /description: eventCount[\s\S]*Belum ada event aktif/);
  assert.match(sectionsSource, /BELUM ADA EVENT AKTIF/);
});

test("Meet & Greet dan 2-Shot memakai filter tanggal slot yang sama", async () => {
  const source = await readFile(quotaMonitorUrl, "utf8");

  assert.match(
    source,
    /const quotaEvents = eventList\.filter\(\(event\) =>\s*PERSISTENT_QUOTA_CATEGORIES\.has\(detectEventCategory\(event\)\)/s,
  );
  assert.match(
    source,
    /if \(!PERSISTENT_QUOTA_CATEGORIES\.has\(detectEventCategory\(event\)\)\)/,
  );
  assert.match(
    source,
    /const isDatedQuotaEvent = PERSISTENT_QUOTA_CATEGORIES\.has\(selectedEventCategory\)/,
  );
  assert.match(
    source,
    /if \(!isVideoCallEvent \|\| dateFilter === DEFAULT_DATE\) \{\s*return currentDateEventItems;/s,
  );
});
