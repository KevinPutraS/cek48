import { expect, test } from "@playwright/test";

const event = {
  code: "EXLIVE1",
  title: "Digital Photobook Test",
  category: "DIGITAL_PHOTOBOOK",
  valid_date_from: "2026-01-01T00:00:00+07:00",
  valid_date_to: "2099-07-05T23:59:59+07:00",
  is_active: true,
};

const members = [
  {
    id: 101,
    code: "HIL",
    name: "Hillary Abigail",
    nickname: "Lily",
    type: "LOVE",
    photo: "",
  },
  {
    id: 102,
    code: "CAT",
    name: "Cathleen Nixie",
    nickname: "Cathy",
    type: "LOVE",
    photo: "",
  },
];

async function mockQuotaApis(page, { sessionDate = "2099-07-04T00:00:00+07:00" } = {}) {
  await page.addInitScript(() => window.localStorage.clear());

  await page.route("**/api/jkt48-events", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ok: true, data: [event] }),
    });
  });

  await page.route("**/api/jkt48-members", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ status: true, data: members }),
    });
  });

  await page.route("**/api/jkt48-stocks**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        ok: true,
        requested: 1,
        successCount: 1,
        failedCount: 0,
        results: [
          {
            ok: true,
            code: event.code,
            source: "e2e",
            data: {
              data: {
                code: event.code,
                title: event.title,
                category: event.category,
                session: [
                  {
                    date: sessionDate,
                    label: "Sesi 1 (LOVE) · 04/07",
                    session_detail: [
                      {
                        jkt48_member_name: "Hillary Abigail",
                        label: "Jalur 1",
                        available_quota: 12,
                        tickets_sold: 68,
                      },
                      {
                        jkt48_member_name: "Cathleen Nixie",
                        label: "Jalur 2",
                        available_quota: 37,
                        tickets_sold: 43,
                      },
                    ],
                  },
                ],
              },
            },
          },
        ],
      }),
    });
  });
}

async function expectMemberCardVisible(grid, memberName) {
  const card = grid.locator(".quota-list-card").filter({ hasText: memberName });
  await card.scrollIntoViewIfNeeded();
  await expect(card).toBeVisible();
  await expect(card).toContainText(memberName);
  return card;
}

test("alur utama Monitor: pilih kategori, tampilkan kuota, dan cari member", async ({
  page,
}) => {
  await mockQuotaApis(page);
  await page.goto("/quota");

  await page.getByRole("button", { name: /^Video Call\s+1$/ }).click();

  const grid = page.getByRole("group", { name: "Data kuota member" });
  await expect(grid).toBeVisible();

  const hillaryCard = await expectMemberCardVisible(grid, "Hillary Abigail");
  await expect(hillaryCard.locator(".quota-list-number strong")).toHaveText("12");
  await expectMemberCardVisible(grid, "Cathleen Nixie");

  const search = page.locator('input[type="search"]:visible').first();
  await search.fill("Hillary");

  await expectMemberCardVisible(grid, "Hillary Abigail");
  await expect(grid.getByText("Cathleen Nixie", { exact: true })).toHaveCount(0);

  await page
    .getByRole("button", { name: "Tambahkan Hillary Abigail ke favorit" })
    .click();
  await expect(
    page.getByRole("button", { name: "Hapus Hillary Abigail dari favorit" }),
  ).toBeVisible();
});

test("kategori Video Call tetap tampil saat seluruh event sudah selesai", async ({
  page,
}) => {
  await mockQuotaApis(page, { sessionDate: "2020-07-04T00:00:00+07:00" });
  await page.goto("/quota");

  const videoCallCategory = page.getByRole("button", { name: /^Video Call\s+0$/ });
  await expect(videoCallCategory).toBeVisible();
  await videoCallCategory.click();

  await expect(page.getByText("BELUM ADA EVENT AKTIF")).toBeVisible();
  await expect(page.getByText(event.title)).toHaveCount(0);
});

async function mockExpiredMainCategories(page) {
  const expiredEvents = [
    {
      code: "EXVCOLD",
      title: "Video Call Selesai",
      category: "DIGITAL_PHOTOBOOK",
    },
    {
      code: "EXMGOLD",
      title: "Meet & Greet Selesai",
      category: "PHOTOCARD",
    },
    {
      code: "EX2SOLD",
      title: "2-Shot Selesai",
      category: "TWO_SHOT",
    },
  ].map((entry) => ({
    ...entry,
    valid_date_from: "2020-01-01T00:00:00+07:00",
    valid_date_to: "2099-12-31T23:59:59+07:00",
    is_active: true,
  }));

  await page.addInitScript(() => window.localStorage.clear());

  await page.route("**/api/jkt48-events", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ok: true, data: expiredEvents }),
    });
  });

  await page.route("**/api/jkt48-members", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ status: true, data: members }),
    });
  });

  await page.route("**/api/jkt48-stocks**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        ok: true,
        requested: expiredEvents.length,
        successCount: expiredEvents.length,
        failedCount: 0,
        results: expiredEvents.map((expiredEvent) => ({
          ok: true,
          code: expiredEvent.code,
          source: "e2e",
          data: {
            data: {
              code: expiredEvent.code,
              title: expiredEvent.title,
              category: expiredEvent.category,
              session: [
                {
                  date: "2020-07-04T00:00:00+07:00",
                  label: "Sesi 1",
                  session_detail: [
                    {
                      jkt48_member_name: "Hillary Abigail",
                      label: "Jalur 1",
                      available_quota: 12,
                      tickets_sold: 68,
                    },
                  ],
                },
              ],
            },
          },
        })),
      }),
    });
  });

  return expiredEvents;
}

test("kategori utama tetap ada tetapi event selesai disembunyikan", async ({
  page,
}) => {
  const expiredEvents = await mockExpiredMainCategories(page);
  await page.goto("/quota");

  for (const categoryLabel of ["Video Call", "Meet & Greet", "2-Shot"]) {
    const category = page.getByRole("button", {
      name: new RegExp(`^${categoryLabel}\\s+0$`),
    });
    await expect(category).toBeVisible();
    await category.click();
    await expect(page.getByText("BELUM ADA EVENT AKTIF")).toBeVisible();
  }

  for (const expiredEvent of expiredEvents) {
    await expect(page.getByText(expiredEvent.title)).toHaveCount(0);
  }
});
