import { expect, test } from "@playwright/test";

function jakartaDateKey(offsetDays = 1) {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const date = new Date(
    Date.UTC(
      Number(values.year),
      Number(values.month) - 1,
      Number(values.day) + offsetDays,
    ),
  );
  return date.toISOString().slice(0, 10);
}

function schedule(overrides) {
  return {
    date: `${jakartaDateKey()}T19:00:00`,
    start_time: "19:00",
    end_time: "21:00",
    status: true,
    jkt48_member_type: "JKT48",
    birthday_member: false,
    short_description: "",
    content_body: "",
    ...overrides,
  };
}

async function mockSchedules(page, rows) {
  await page.route("**/api/jkt48-schedules**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ status: true, data: rows }),
    });
  });
}

test("filter Event tidak memasukkan Exclusive atau Show", async ({ page }) => {
  await mockSchedules(page, [
    schedule({
      schedule_id: 1,
      type: "SHOW",
      title: "Sambil Menggandeng Erat Tanganku",
      reference_code: "SH1B46",
    }),
    schedule({
      schedule_id: 2,
      type: "EVENT",
      title: "FUN ON BOARD #3",
      reference_code: "EVT500",
      content_body: '<span style="font-weight:bold">Informasi <b>event</b></span>',
    }),
    schedule({
      schedule_id: 3,
      type: "EXCLUSIVE",
      title: "Video Call July",
      reference_code: "EX5000",
    }),
  ]);

  await page.goto("/schedule");
  const filterGroup = page.getByRole("group", { name: "Filter jenis jadwal" });
  await filterGroup.getByRole("button", { name: /^Event\s+1$/ }).click();

  await expect(
    page.locator(".nx-event-row h3", { hasText: "FUN ON BOARD #3" }),
  ).toBeVisible();
  await expect(
    page.locator(".nx-event-row h3", { hasText: "Video Call July" }),
  ).toHaveCount(0);
  await expect(
    page.locator(".nx-event-row h3", { hasText: "Sambil Menggandeng Erat Tanganku" }),
  ).toHaveCount(0);
});

test("dua show pada tanggal dan jam yang sama tetap tampil", async ({ page }) => {
  await mockSchedules(page, [
    schedule({
      schedule_id: 10,
      type: "SHOW",
      title: "PASSION 200% - Yogyakarta",
      reference_code: "SHYOG1",
      jkt48_member_type: "PASSION",
    }),
    schedule({
      schedule_id: 11,
      type: "SHOW",
      title: "Sambil Menggandeng Erat Tanganku",
      reference_code: "SH1B46",
      jkt48_member_type: "LOVE",
      birthday_member: true,
    }),
  ]);

  await page.goto("/schedule");
  await expect(
    page.locator(".nx-event-row h3", { hasText: "PASSION 200% - Yogyakarta" }),
  ).toBeVisible();
  await expect(
    page.locator(".nx-event-row h3", { hasText: "Sambil Menggandeng Erat Tanganku" }),
  ).toBeVisible();
  await expect(page.locator(".nx-event-row")).toHaveCount(2);
});

test("HTML deskripsi event ditampilkan sebagai teks bersih", async ({ page }) => {
  await mockSchedules(page, [
    schedule({
      schedule_id: 20,
      type: "EVENT",
      title: "FUN ON BOARD #3",
      reference_code: "EVT500",
      content_body:
        '<span style="font-family:Arial;color:red">Informasi <b>penting</b></span><br><div>Baris kedua</div>',
    }),
  ]);

  await page.goto("/schedule");
  await page.locator(".nx-event-row", { hasText: "FUN ON BOARD #3" }).click();

  const dialog = page.getByRole("dialog", { name: "FUN ON BOARD #3" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText(/Informasi penting\s+Baris kedua/)).toBeVisible();
  await expect(dialog).not.toContainText("<span");
  await expect(dialog).not.toContainText("font-family");
});
