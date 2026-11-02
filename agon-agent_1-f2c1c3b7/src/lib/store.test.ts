import { beforeEach, describe, expect, it } from 'vitest'
import {
  acceptAlternativeDate,
  adjustBooking,
  cancelBooking,
  confirmBooking,
  createBooking,
  deleteInstance,
  getBooking,
  listBookings,
  listProviders,
  markDepositPaidManually,
  payDeposit,
  proposeAlternativeDate,
  resetDemo,
  saveProvider,
  type NewBookingInput,
} from './store'
import { addDays, todayISO } from './format'
import type { ProviderInstance } from './types'

function input(date: string, overrides: Partial<NewBookingInput> = {}): NewBookingInput {
  return {
    client: {
      firstName: 'Camille',
      lastName: 'Durand',
      email: 'camille@example.fr',
      phone: '0612345678',
      couple: 'Camille & Durand',
      city: 'Bordeaux',
      venue: 'Château Test',
      eventType: 'Mariage civil',
      guestCount: 100,
      distanceKm: 0,
      message: '',
    },
    formulaId: 'f2',
    options: [{ optionId: 'o1', qty: 2 }],
    date,
    slot: 'aprem',
    ...overrides,
  }
}

let providers: ProviderInstance[]
let date: string

beforeEach(async () => {
  window.localStorage.clear()
  window.sessionStorage.clear()
  resetDemo()
  providers = await listProviders()
  date = addDays(todayISO(), 200)
})

describe('store — démonstration cloisonnée', () => {
  it('précharge cinq instances indépendantes', () => {
    expect(providers).toHaveLength(5)
    expect(new Set(providers.map((p) => p.id)).size).toBe(5)
  })

  it('recalcule le prix depuis le catalogue et ignore les montants fournis', async () => {
    const p = providers[0]
    const booking = await createBooking(p.id, input(date, { options: [{ optionId: 'o1', qty: 2, unitPrice: 0.01 }] }))
    expect(booking.formulaPrice).toBe(890)
    expect(booking.options[0].unitPrice).toBe(180)
    expect(booking.pricing.total).toBe(1250)
    expect(booking.deposit.amount).toBe(375)
  })

  it('est idempotent pour une même soumission', async () => {
    const p = providers[0]
    const a = await createBooking(p.id, input(date, { requestId: 'req-1' }))
    const b = await createBooking(p.id, input(date, { requestId: 'req-1' }))
    expect(a.code).toBe(b.code)
    expect(await listBookings(p.id)).toHaveLength(4)
  })

  it('refuse une date bloquée ou des invités invalides', async () => {
    const p = providers[0]
    await expect(createBooking(p.id, input(p.blockedDates[0]))).rejects.toThrow(/disponible/)
    await expect(createBooking(p.id, input(date, { client: { ...input(date).client, guestCount: 0 } }))).rejects.toThrow(/invités/)
  })

  it('empêche la double confirmation d’une même journée', async () => {
    const p = providers[0]
    const a = await createBooking(p.id, input(date))
    const b = await createBooking(p.id, input(date, { client: { ...input(date).client, firstName: 'Léa', lastName: 'Martin', email: 'lea@example.fr' } }))
    await confirmBooking(p.id, a.code)
    await expect(confirmBooking(p.id, b.code)).rejects.toThrow(/disponible/)
  })

  it('n’autorise le paiement qu’après confirmation, au montant courant', async () => {
    const p = providers[0]
    const booking = await createBooking(p.id, input(date))
    await expect(payDeposit(p.id, booking.code)).rejects.toThrow(/après confirmation/)
    await expect(markDepositPaidManually(p.id, booking.code)).rejects.toThrow(/après confirmation/)
    await confirmBooking(p.id, booking.code, booking.quoteVersion)
    const paid = await payDeposit(p.id, booking.code, 'Carte bancaire (démo)', booking.quoteVersion)
    expect(paid.status).toBe('acompte_paye')
    expect(paid.deposit.amount).toBe(375)
    expect(paid.deposit.reference).toMatch(/^DEMO-/)
    const again = await payDeposit(p.id, booking.code)
    expect(again.deposit.reference).toBe(paid.deposit.reference)
  })

  it('ajuste le devis avant confirmation puis verrouille', async () => {
    const p = providers[0]
    const booking = await createBooking(p.id, input(date))
    const adjusted = await adjustBooking(p.id, booking.code, { formulaId: 'f2', lines: [{ optionId: 'o3', qty: 1, unitPrice: 100 }] }, booking.quoteVersion)
    expect(adjusted.quoteVersion).toBe(2)
    expect(adjusted.pricing.total).toBe(990)
    expect(adjusted.deposit.amount).toBe(297)
    await expect(confirmBooking(p.id, booking.code, 1)).rejects.toThrow(/changé/)
    await confirmBooking(p.id, booking.code, 2)
    await expect(adjustBooking(p.id, booking.code, { formulaId: 'f1', lines: [] })).rejects.toThrow(/verrouillé/)
  })

  it('gère une contre-proposition de date avec acceptation client', async () => {
    const p = providers[0]
    const booking = await createBooking(p.id, input(date))
    const alt = addDays(date, 1)
    const proposed = await proposeAlternativeDate(p.id, booking.code, alt)
    expect(proposed.status).toBe('date_a_accepter')
    await expect(confirmBooking(p.id, booking.code)).rejects.toThrow(/acceptée/)
    const accepted = await acceptAlternativeDate(p.id, booking.code)
    expect(accepted.status).toBe('proposee')
    expect(accepted.date).toBe(alt)
    await confirmBooking(p.id, booking.code)
  })

  it('refuse l’accès croisé entre prestataires', async () => {
    const [a, b] = providers
    const booking = await createBooking(a.id, input(date))
    expect(await getBooking(b.id, booking.code)).toBeNull()
    await expect(payDeposit(b.id, booking.code)).rejects.toThrow(/introuvable/)
    await expect(confirmBooking(b.id, booking.code)).rejects.toThrow(/introuvable/)
  })

  it('annule une demande non payée mais pas un dossier payé', async () => {
    const p = providers[0]
    const booking = await createBooking(p.id, input(date))
    const cancelled = await cancelBooking(p.id, booking.code)
    expect(cancelled.status).toBe('annulee')
    const other = await createBooking(p.id, input(addDays(date, 1)))
    await confirmBooking(p.id, other.code)
    await payDeposit(p.id, other.code)
    await expect(cancelBooking(p.id, other.code)).rejects.toThrow(/contactez/i)
  })

  it('valide les réglages et l’unicité du lien public', async () => {
    const p = providers[0]
    await expect(saveProvider({ ...p, depositPercent: 0 })).rejects.toThrow(/acompte/)
    await expect(saveProvider({ ...p, slug: providers[1].slug })).rejects.toThrow(/adresse publique/)
  })

  it('ne recrée pas automatiquement les instances après suppression totale', async () => {
    for (const p of providers) await deleteInstance(p.id)
    expect(await listProviders()).toHaveLength(0)
  })
})
