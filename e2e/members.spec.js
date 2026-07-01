import { expect, test } from "@playwright/test";

const member = {
  id: 123,
  jkt48_member_id: 123,
  code: "HIL",
  name: "Hillary Abigail",
  nickname: "Lily",
  type: "LOVE",
  birthday: "2009-10-12",
  photo: "",
};

test("detail member hanya dimuat sekali saat profil dibuka", async ({ page }) => {
  let detailRequests = 0;

  await page.route("**/api/jkt48-members", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ status: true, data: [member] }),
    });
  });

  await page.route("**/api/jkt48-member-detail**", async (route) => {
    detailRequests += 1;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        status: true,
        data: {
          ...member,
          height: "165",
          blood_type: "O",
          horoscope: "Libra",
          instagram_account: "jkt48.lily",
        },
      }),
    });
  });

  await page.goto("/members");
  await page
    .getByRole("button", { name: "Buka profil Hillary Abigail", exact: true })
    .click();

  const dialog = page.getByRole("dialog", { name: "Hillary Abigail" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText("Biodata detail berhasil dimuat")).toBeVisible();
  await expect(dialog.getByText("165 cm")).toBeVisible();

  await page.waitForTimeout(750);
  expect(detailRequests).toBe(1);
});
