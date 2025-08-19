import { test, expect } from '@playwright/test';

test('dashboard loads', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText(/DEALLENS TERMINAL/i)).toBeVisible();
});

test('comps page loads', async ({ page }) => {
  await page.goto('/comps');
  await expect(page.getByText(/Comparable|Comps/i)).toBeVisible({ timeout: 15000 });
});

test('precedents page loads', async ({ page }) => {
  await page.goto('/precedents');
  await expect(page.getByText(/Precedent/i)).toBeVisible();
});

test('league tables loads', async ({ page }) => {
  await page.goto('/league-tables');
  await expect(page.getByText(/League/i)).toBeVisible();
});

test('DCF page loads', async ({ page }) => {
  await page.goto('/valuation/dcf');
  await expect(page.getByText(/DCF Valuation Model/i)).toBeVisible();
});
