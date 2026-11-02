import { expect, test } from '@playwright/test'

test('les extraits sont sélectionnables et un seul joue à la fois', async ({ page }) => {
  await page.goto('/p/lucas-ferrand')
  await page.getByRole('heading', { name: 'Mes formules' }).scrollIntoViewIfNeeded()

  const player = page.locator('[aria-label="Extraits musicaux"]').nth(1)
  const first = player.getByRole('button').first()
  const second = player.getByRole('button').nth(1)
  const audio = player.locator('audio')

  await first.click()
  await expect(first).toHaveAttribute('aria-pressed', 'true')
  await expect.poll(() => audio.evaluate((element: HTMLAudioElement) => element.currentTime)).toBeGreaterThan(0)

  await second.click()
  await expect(second).toHaveAttribute('aria-pressed', 'true')
  await expect(first).toHaveAttribute('aria-pressed', 'false')
  await expect.poll(() => audio.evaluate((element: HTMLAudioElement) => element.currentSrc)).toContain('/audio/sax-swing.wav')
})
