import { describe, expect, it } from 'vitest'
import { buildLine, computeTotals, derivedOptionQty } from './pricing'
import type { Option } from './types'

const option: Option = {
  id: 'o1',
  name: 'Heure supplémentaire',
  description: '',
  price: 180,
  unit: 'heure',
  maxQty: 8,
  group: 'Prestations',
}

describe('pricing', () => {
  it('calcule total, acompte et solde en centimes', () => {
    const totals = computeTotals(890, [{ lineTotal: 360 }, { lineTotal: 150 }], 30)
    expect(totals.total).toBe(1400)
    expect(totals.depositAmount).toBe(420)
    expect(totals.balanceDue).toBe(980)
  })

  it('évite les flottants sur les kilomètres', () => {
    const totals = computeTotals(590, [{ lineTotal: 42 }], 30)
    expect(totals.total).toBe(632)
    expect(totals.depositAmount).toBe(189.6)
  })

  it('borne les quantités au maximum de l’option', () => {
    expect(buildLine(option, 99).qty).toBe(8)
    expect(buildLine(option, -2).qty).toBe(0)
    expect(buildLine(option, 2).lineTotal).toBe(360)
  })

  it('déduit le rayon inclus pour les kilomètres', () => {
    const km: Option = { ...option, id: 'o5', unit: 'km', price: 1.2, maxQty: 500 }
    expect(derivedOptionQty(km, { guestCount: 100, distanceKm: 85, travelIncludedKm: 50 })).toBe(35)
    expect(derivedOptionQty(km, { guestCount: 100, distanceKm: 40, travelIncludedKm: 50 })).toBe(0)
  })
})
