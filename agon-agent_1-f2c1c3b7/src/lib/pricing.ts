import type { BookingLine, Option } from './types'

/** Arrondi monétaire en centimes, stable pour les additions de lignes. */
export function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

export function buildLine(option: Option, qty: number): BookingLine {
  const safeQty = Math.max(0, Math.min(option.maxQty, Math.trunc(Number.isFinite(qty) ? qty : 0)))
  return {
    optionId: option.id,
    name: option.name,
    unit: option.unit,
    unitPrice: roundMoney(option.price),
    qty: safeQty,
    lineTotal: roundMoney(option.price * safeQty),
  }
}

export interface Totals {
  subtotal: number
  optionsTotal: number
  total: number
  depositAmount: number
  depositPercent: number
  balanceDue: number
}

export function computeTotals(
  formulaPrice: number,
  lines: Array<{ lineTotal: number }>,
  depositPercent: number,
): Totals {
  const subtotalCents = Math.round((Number.isFinite(formulaPrice) ? formulaPrice : 0) * 100)
  const optionsCents = lines.reduce((sum, line) => sum + Math.round(line.lineTotal * 100), 0)
  const totalCents = Math.max(0, subtotalCents + optionsCents)
  const percent = Math.min(100, Math.max(0, depositPercent))
  const depositCents = Math.round((totalCents * percent) / 100)
  return {
    subtotal: subtotalCents / 100,
    optionsTotal: optionsCents / 100,
    total: totalCents / 100,
    depositAmount: depositCents / 100,
    depositPercent: percent,
    balanceDue: (totalCents - depositCents) / 100,
  }
}

/** Quantité réellement facturable d'une option dérivée (trajet / invités). */
export function derivedOptionQty(
  option: Option,
  context: { guestCount: number; distanceKm: number; travelIncludedKm: number },
): number {
  if (option.unit === 'personne') {
    return Math.min(option.maxQty, Math.max(0, Math.trunc(context.guestCount)))
  }
  if (option.unit === 'km') {
    const extra = Math.max(0, context.distanceKm - context.travelIncludedKm)
    return Math.min(option.maxQty, Math.round(extra))
  }
  return 0
}
