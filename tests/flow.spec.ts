import { test, expect } from '@playwright/test';

test.describe('Govee Estimate Calculator Flow', () => {
  test('navigates from landing to quick estimate and shows result', async ({ page }) => {
    await page.goto('/estimate/quick');
    await expect(page.locator('div[data-slot="card-title"]')).toContainText('Quick Estimate');
    
    // Fill out form
    await page.click('label:has-text("Front of House Only")');
    await page.fill('input[name="frontageFeet"]', '40');
    await page.fill('input[name="peaks"]', '2');
    await page.click('label:has-text("2")');
    await page.click('label:has-text("Simple")');
    
    // Submit
    await page.click('button:has-text("Calculate Estimate")');
    
    // Verify result page
    await expect(page).toHaveURL(/.*\/estimate\/result/);
    await expect(page.locator('h1')).toContainText('Your Estimate Result');
    
    // Should have price range and feet
    await expect(page.locator('text=$').first()).toBeVisible();
    await expect(page.locator('text=ft').first()).toBeVisible();
    
    // Verify persistence on reload
    await page.reload();
    await expect(page.locator('h1')).toContainText('Your Estimate Result');
    await expect(page.locator('text=$').first()).toBeVisible();
  });
});
