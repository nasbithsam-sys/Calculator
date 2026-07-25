# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: flow.spec.ts >> Govee Estimate Calculator Flow >> navigates from landing to quick estimate and shows result
- Location: tests\flow.spec.ts:4:7

# Error details

```
Error: expect(page).toHaveURL(expected) failed

Expected pattern: /.*\/estimate\/result/
Received string:  "http://localhost:3000/estimate/quick"
Timeout: 5000ms

Call log:
  - Expect "toHaveURL" with timeout 5000ms
    13 × locator resolved to <html lang="en" class="geist_a71539c9-module__T19VSG__variable geist_mono_8d43a2aa-module__8Li5zG__variable h-full antialiased">…</html>
       - unexpected value "http://localhost:3000/estimate/quick"

```

```yaml
- banner:
  - link "Govee Calculator":
    - /url: /estimate
  - text: Preliminary Development
- main:
  - link "Back":
    - /url: /estimate
  - progressbar: x
  - text: Quick Estimate Answer a few simple questions for an instant, preliminary price range based on our pricing model. Lighting Coverage
  - radiogroup:
    - radio "Front of House Only (Typical)" [checked]
    - text: Front of House Only (Typical)
    - radio "Front and Sides"
    - text: Front and Sides
    - radio "Full Perimeter (All 4 Sides)"
    - text: Full Perimeter (All 4 Sides)
  - text: Approx. Width of Front (Feet)
  - spinbutton "Approx. Width of Front (Feet)": "40"
  - text: Number of Peaks / Gables
  - spinbutton "Number of Peaks / Gables": "2"
  - text: Number of Stories
  - radiogroup:
    - radio "1"
    - text: "1"
    - radio "2" [checked]
    - text: "2"
    - radio "3"
    - text: "3"
    - radio "4+"
    - text: 4+
  - text: Roof Complexity
  - radiogroup:
    - radio "Simple" [checked]
    - text: Simple
    - radio "Average"
    - text: Average
    - radio "Complex"
    - text: Complex
    - radio "Custom"
    - text: Custom
  - button "Calculate Estimate"
- alert
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Govee Estimate Calculator Flow', () => {
  4  |   test('navigates from landing to quick estimate and shows result', async ({ page }) => {
  5  |     await page.goto('/estimate/quick');
  6  |     await expect(page.locator('div[data-slot="card-title"]')).toContainText('Quick Estimate');
  7  |     
  8  |     // Fill out form
  9  |     await page.click('label:has-text("Front of House Only")');
  10 |     await page.fill('input[name="frontageFeet"]', '40');
  11 |     await page.fill('input[name="peaks"]', '2');
  12 |     await page.click('label:has-text("2")');
  13 |     await page.click('label:has-text("Simple")');
  14 |     
  15 |     // Submit
  16 |     await page.click('button:has-text("Calculate Estimate")');
  17 |     
  18 |     // Verify result page
> 19 |     await expect(page).toHaveURL(/.*\/estimate\/result/);
     |                        ^ Error: expect(page).toHaveURL(expected) failed
  20 |     await expect(page.locator('h1')).toContainText('Your Estimate Result');
  21 |     
  22 |     // Should have price range and feet
  23 |     await expect(page.locator('text=$').first()).toBeVisible();
  24 |     await expect(page.locator('text=ft').first()).toBeVisible();
  25 |     
  26 |     // Verify persistence on reload
  27 |     await page.reload();
  28 |     await expect(page.locator('h1')).toContainText('Your Estimate Result');
  29 |     await expect(page.locator('text=$').first()).toBeVisible();
  30 |   });
  31 | });
  32 | 
```