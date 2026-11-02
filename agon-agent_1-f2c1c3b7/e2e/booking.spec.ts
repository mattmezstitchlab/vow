import { expect, test } from '@playwright/test'

test('parcours mobile : demande → confirmation → acompte simulé', async ({ page }) => {
  await page.goto('/p/lucas-ferrand/reserver?f=f2')
  await expect(page.getByRole('heading', { name: /Quelle formule/ })).toBeVisible()
  await page.getByRole('button', { name: 'Continuer' }).click()

  await expect(page.getByRole('heading', { name: 'Composez votre prestation' })).toBeVisible()
  await page.getByRole('button', { name: 'Ajouter', exact: true }).first().click()
  await page.getByRole('button', { name: 'Continuer' }).click()

  await expect(page.getByRole('heading', { name: 'Proposez votre date' })).toBeVisible()
  await page.locator('button[aria-pressed]:not([disabled])').first().click()
  await page.getByPlaceholder('Château de Vayres').fill('Domaine de test')
  await page.getByPlaceholder('120', { exact: true }).fill('80')
  await page.getByRole('button', { name: 'Continuer' }).click()

  await expect(page.getByRole('heading', { name: 'Vos coordonnées' })).toBeVisible()
  await page.getByPlaceholder('Camille', { exact: true }).fill('Camille')
  await page.getByPlaceholder('Durand', { exact: true }).fill('Durand')
  await page.getByPlaceholder('camille.durand@example.fr').fill('camille.durand@example.fr')
  await page.getByPlaceholder('06 12 34 56 78').fill('0612345678')
  await page.getByRole('button', { name: 'Continuer' }).click()

  await expect(page.getByRole('heading', { name: 'Récapitulatif' })).toBeVisible()
  await page.getByRole('checkbox').check()
  await page.getByRole('button', { name: 'Envoyer ma demande' }).click()

  await expect(page).toHaveURL(/\/r\/lucas-ferrand\//)
  const reservationUrl = page.url()
  await expect(page.getByRole('heading', { name: 'Votre date a été proposée' })).toBeVisible()

  await page.goto('/bo/lucas-ferrand')
  await page.getByPlaceholder('SAXO-0000').fill('SAXO-2468')
  await page.getByRole('button', { name: 'Ouvrir le back-office' }).click()
  await page.getByRole('button', { name: /Camille & Durand/ }).first().click()
  await page.getByRole('button', { name: 'Confirmer la date' }).click()
  await expect(page.getByRole('button', { name: 'Marquer l’acompte reçu' })).toBeVisible()

  await page.goto(reservationUrl)
  await page.getByRole('button', { name: /Payer l’acompte/ }).click()
  await page.getByRole('button', { name: /Simuler le paiement/ }).click()
  await expect(page.getByText('Acompte simulé enregistré')).toBeVisible()
  await page.getByRole('dialog').getByRole('button', { name: 'Fermer', exact: true }).last().click()
  await expect(page.getByRole('heading', { name: 'Réservation confirmée, acompte reçu' })).toBeVisible()
})

test('un code de réservation n’est pas accessible depuis un autre prestataire', async ({ page }) => {
  await page.goto('/r/studio-onze/LUC-7K2F')
  await expect(page.getByRole('heading', { name: 'Réservation introuvable' })).toBeVisible()
})
