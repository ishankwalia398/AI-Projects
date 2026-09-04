import { expect, test } from "@playwright/test";

test("KAN-1 completes the Jira QA pipeline", async ({ page }) => {
  test.setTimeout(30 * 60 * 1000);

  await page.goto("http://127.0.0.1:8502", { waitUntil: "networkidle" });
  await page.getByLabel("Jira ticket IDs").fill("KAN-1");
  await page.getByLabel("Integration mode").click();
  await page.getByText("REST only", { exact: true }).last().click();

  const generate = page.getByRole("button", { name: "Analyze & Generate QA Pack" });
  await generate.click();
  await expect(page.getByRole("button", { name: "Generating QA Pack..." })).toBeDisabled();
  await expect(generate).toBeEnabled({ timeout: 30 * 60 * 1000 });

  const alerts = await page.locator('[data-testid="stAlert"]').allInnerTexts();
  const failures = alerts.filter((text) => /error|failed|traceback|exception/i.test(text));
  expect(failures, `Visible failure alerts: ${failures.join(" | ")}`).toEqual([]);
  await expect(page.getByText("Pipeline finished.", { exact: true })).toBeVisible();
  await expect(page.getByText(/^COMPLETED(?:_WITH_WARNINGS)?$/)).toBeVisible();
});
