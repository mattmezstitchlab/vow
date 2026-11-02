import { expect, test } from '@playwright/test'

test('landing uses one large suspended card and a transparent Noria mark', async ({ page }) => {
  await page.goto('/')

  const heroCard = page.getByTestId('hero-provider-card')
  await expect(heroCard).toBeVisible()
  await expect(heroCard).toHaveCount(1)
  const cardBounds = await heroCard.boundingBox()
  expect(cardBounds?.width).toBeGreaterThan(250)
  await expect(page.locator('.pixel-divider')).toHaveCount(0)

  const brandMark = page.getByTestId('brand-mark').first()
  await expect(brandMark).toBeVisible()
  await expect.poll(() => brandMark.evaluate((element) => getComputedStyle(element).backgroundColor)).toBe('rgba(0, 0, 0, 0)')

  const logoOrb = page.getByTestId('studio-logo-orb')
  await logoOrb.scrollIntoViewIfNeeded()
  await expect(logoOrb.locator('[data-testid="brand-mark"] svg')).toBeVisible()
})
