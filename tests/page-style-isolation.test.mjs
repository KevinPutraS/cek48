import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import test from "node:test";

const readSource = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

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

test("TopBar Monitor menerima status koneksi dari controller quota", async () => {
  const [pageSource, controllerSource] = await Promise.all([
    readSource("src/pages/QuotaPage.jsx"),
    readSource("src/features/quota/useQuotaMonitor.js"),
  ]);

  assert.match(controllerSource, /const connectionStatus = useMemo\(/);
  assert.match(pageSource, /connectionStatus=\{monitor\.connectionStatus\}/);
  assert.doesNotMatch(pageSource, /sourceConnected=\{/);
});

test("CSS Monitor tidak menimpa komponen MembersPage dan SchedulePage", async () => {
  const source = await readCssDirectory("../src/styles/monitor/");

  assert.doesNotMatch(source, /\.nx-member-card--skeleton/);
  assert.doesNotMatch(source, /\.nx-profile-(?:backdrop|sheet|close)/);
  assert.doesNotMatch(source, /\.nx-(?:detail-backdrop|schedule-sheet)/);
});

test("MembersPage menjaga teks panjang dan tombol tutup modal tetap di dalam sheet", async () => {
  const source = await readCssDirectory("../src/styles/members/");

  assert.match(source, /\.nx-member-results > div:first-child[\s\S]*?min-width:\s*0/);
  assert.match(source, /\.nx-member-results h2[\s\S]*?overflow-wrap:\s*anywhere/);
  assert.match(source, /\.nx-profile-close[\s\S]*?calc\(100dvh - 826px\)/);
});

test("global responsive menjaga shell mobile dan tidak berisi duplikasi CSS Jadwal", async () => {
  const source = await readSource("src/styles/responsive.css");

  assert.match(source, /@media \(max-width:\s*820px\)/);
  assert.match(source, /\.desktop-sidebar[\s\S]*?display:\s*none/);
  assert.match(source, /\.app-shell[\s\S]*?margin-left:\s*0/);
  assert.match(source, /\.topbar[\s\S]*?left:\s*0/);
  assert.match(source, /\.bottom-nav[\s\S]*?display:\s*grid/);
  assert.doesNotMatch(source, /\.nx-schedule-control-dock/);
});
