import { test, expect } from '@playwright/test';

test('トップページにタイトルが表示される', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Learning Trainer' })).toBeVisible();
});
