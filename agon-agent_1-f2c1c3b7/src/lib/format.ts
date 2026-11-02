const eur = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
})

export function money(value: number): string {
  return eur.format(Number.isFinite(value) ? value : 0)
}

export function moneyCompact(value: number): string {
  if (!Number.isFinite(value)) return '0 €'
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value)
}

export const pad2 = (n: number) => String(n).padStart(2, '0')

export function toISO(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

export function fromISO(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, (m || 1) - 1, d || 1)
}

export function todayISO(): string {
  return toISO(new Date())
}

export function addDays(iso: string, days: number): string {
  const d = fromISO(iso)
  d.setDate(d.getDate() + days)
  return toISO(d)
}

export function formatDateLong(iso: string): string {
  return fromISO(iso).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function formatDateShort(iso: string): string {
  return fromISO(iso).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function formatDateTiny(iso: string): string {
  return fromISO(iso).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  })
}

export function formatStamp(ts: number): string {
  return new Date(ts).toLocaleString('fr-FR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function relativeTime(ts: number): string {
  const diff = Date.now() - ts
  const min = Math.round(diff / 60000)
  if (min < 1) return "à l'instant"
  if (min < 60) return `il y a ${min} min`
  const h = Math.round(min / 60)
  if (h < 24) return `il y a ${h} h`
  const d = Math.round(h / 24)
  if (d < 30) return `il y a ${d} j`
  return formatDateShort(toISO(new Date(ts)))
}

export const SLOT_LABEL: Record<string, string> = {
  matin: 'Matin',
  aprem: 'Après-midi',
  soir: 'Soir',
}

export const UNIT_LABEL: Record<string, string> = {
  forfait: 'forfait',
  heure: "par heure",
  personne: 'par personne',
  km: 'par km',
}

export const UNIT_SHORT: Record<string, string> = {
  forfait: 'forfait',
  heure: 'h',
  personne: 'pers.',
  km: 'km',
}

export function optionUnitLabel(unit: string, qty: number): string {
  if (unit === 'forfait') return 'forfait'
  if (unit === 'heure') return qty > 1 ? `${qty} heures` : '1 heure'
  if (unit === 'personne') return qty > 1 ? `${qty} pers.` : '1 pers.'
  return qty > 1 ? `${qty} km` : '1 km'
}

export const STATUS_LABEL: Record<string, string> = {
  proposee: 'Date proposée',
  confirmee: 'Date confirmée',
  acompte_paye: 'Acompte encaissé',
  refusee: 'Refusée',
  annulee: 'Annulée',
  terminee: 'Terminée',
}

export const EVENT_TYPES = [
  'Mariage civil',
  'Mariage religieux',
  'Mariage laïque',
  'Dîner de noces',
  'Anniversaire de mariage',
  'Événement privé',
]
