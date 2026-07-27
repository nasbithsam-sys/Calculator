import { test, expect } from '@playwright/test';

test.describe('Govee Estimate Calculator Flow', () => {
  test('landing page shows all eight estimate methods', async ({ page }) => {
    await page.goto('/estimate');

    await expect(page.getByRole('heading', { name: 'Get Your Permanent Lights Estimate' })).toBeVisible();

    const methodNames = [
      'Enter My Address',
      'Upload House Photos',
      'Mark My Roofline',
      'Quick Estimate',
      'I Know My Measurements',
      'Guided Video Walkaround',
      'Upload a Plan or Drawing',
      'Request Expert Review',
    ];

    for (const methodName of methodNames) {
      await expect(page.getByText(methodName, { exact: false }).first()).toBeVisible();
    }
  });

  test('quick estimate collects inputs and reaches review step', async ({ page }) => {
    await page.goto('/estimate/quick');
    await expect(page.getByRole('heading', { name: 'Quick Estimate' })).toBeVisible();

    await page.getByPlaceholder('e.g. 50').fill('60');
    await page.getByText('2', { exact: true }).click();
    await page.getByRole('button', { name: /Continue/ }).click();

    await expect(page.getByRole('heading', { name: 'Lighting Coverage' })).toBeVisible();
    await page.getByText('Front & Sides').click();
    await page.getByRole('button', { name: /Continue/ }).click();

    await expect(page.getByRole('heading', { name: 'Roofline' })).toBeVisible();
    await page.getByText('Complex', { exact: true }).click();
    await page.getByPlaceholder('e.g. 2').fill('3');
    await page.getByRole('button', { name: /Review Answers/ }).click();

    await expect(page.getByRole('heading', { name: 'Review Your Inputs' })).toBeVisible();
    await expect(page.getByText('60 ft')).toBeVisible();
    await expect(page.getByText('front sides')).toBeVisible();
    await expect(page.getByRole('button', { name: /Get My Estimate/ })).toBeVisible();
  });
});
