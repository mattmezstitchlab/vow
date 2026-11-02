import type { Option } from './types'

export function buildLine(option: Option, qty: number): {
  optionId: string
  name: string
  unit: Option['unit']
  unitPrice: number
  qty: number
  lineTotal: number
} {
  const safeQty = Math.max(0, qty)
  return {
    optionId: option.id,
    name: option.name,
    unit: option.unit,
    unitPrice: option.price,
    qty: safeQty,
    lineTotal: Math.round(option.price * safeQty * 100) / 100,
  }
}

export interface Totals {
  subtotal: number
  optionsTotal: number
  total: number
  depositAmount: number
  depositPercent: number
}

export function computeTotals(
  formulaPrice: number,
  lines: Array<{ lineTotal: number }>,
  depositPercent: number,
): Totals {
  const optionsTotal = Math.round(lines.reduce((s, l) => s + l.lineTotal, 0) * 100) / 100
  const total = Math.round((formulaPrice + optionsTotal) * 100) / 100
  const depositAmount = Math.round(((total * depositPercent) / 100) * 100) / 100
  return { subtotal: formulaPrice, optionsTotal, total, depositAmount, depositPercent }
}
