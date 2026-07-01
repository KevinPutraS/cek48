import { access, readFile } from "node:fs/promises";
import { constants } from "node:fs";

const requiredFiles = [
  "index.html",
  "public/manifest.webmanifest",
  "public/cek48-icon.png",
  "src/main.jsx",
  "src/App.jsx",
  "src/styles/index.css",
  "src/styles/base.css",
  "src/styles/shell.css",
  "src/styles/monitor/controls.css",
  "src/styles/monitor/results.css",
  "src/styles/members/directory.css",
  "src/styles/members/profile.css",
  "src/styles/schedule/hero.css",
  "src/styles/schedule/timeline.css",
  "src/styles/info.css",
  "src/styles/responsive.css",
  "api/health.js",
  "api/jkt48-member-detail.js",
  "vercel.json",
];

for (const file of requiredFiles) {
  await access(new URL(`../${file}`, import.meta.url), constants.R_OK);
}

const vercelConfig = JSON.parse(
  await readFile(new URL("../vercel.json", import.meta.url), "utf8"),
);

const rewriteSources = new Set(
  (vercelConfig.rewrites || []).map((entry) => entry.source),
);

for (const route of ["/quota", "/members", "/schedule", "/info"]) {
  if (!rewriteSources.has(route)) {
    throw new Error(`Rewrite Vercel untuk ${route} belum tersedia.`);
  }
}

const mainSource = await readFile(new URL("../src/main.jsx", import.meta.url), "utf8");

if (!mainSource.includes('import "./styles/index.css";')) {
  throw new Error("Entry aplikasi belum memakai src/styles/index.css.");
}

if (mainSource.includes("orbit.css")) {
  throw new Error("Import legacy orbit.css masih tersisa.");
}

const desktopNavSource = await readFile(
  new URL("../src/components/DesktopNav.jsx", import.meta.url),
  "utf8",
);
const bottomNavSource = await readFile(
  new URL("../src/components/BottomNav.jsx", import.meta.url),
  "utf8",
);

for (const route of ["/quota", "/members", "/schedule", "/info"]) {
  if (!desktopNavSource.includes(`to: "${route}"`)) {
    throw new Error(`Navigasi desktop belum memuat ${route}.`);
  }

  if (!bottomNavSource.includes(`to: "${route}"`)) {
    throw new Error(`Navigasi mobile belum memuat ${route}.`);
  }
}

const stylesEntry = await readFile(
  new URL("../src/styles/index.css", import.meta.url),
  "utf8",
);

for (const legacyStyle of ["refinements.css", "favorites.css", "orbit.css"]) {
  if (stylesEntry.includes(legacyStyle)) {
    throw new Error(`Import CSS legacy ${legacyStyle} masih tersisa.`);
  }
}

const scheduleSource = await readFile(
  new URL("../src/features/schedule/useSchedulePage.js", import.meta.url),
  "utf8",
);

if (!scheduleSource.includes("[jakartaNow, schedules]")) {
  throw new Error(
    "SchedulePage belum memperbarui visibility Exclusive berdasarkan jam Jakarta.",
  );
}

for (const backupFile of [
  "src/pages/QuotaPage.before-redesign.jsx",
  "src/pages/MembersPage.before-redesign.jsx",
  "src/pages/SchedulePage.before-redesign.jsx",
  "src/pages/SchedulePage.before-posters.jsx",
]) {
  try {
    await access(new URL(`../${backupFile}`, import.meta.url), constants.F_OK);
    throw new Error(`File backup ${backupFile} masih berada di source production.`);
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
}

console.log("✓ Struktur project dan konfigurasi deploy valid.");
