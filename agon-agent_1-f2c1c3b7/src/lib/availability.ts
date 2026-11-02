import type { Booking, ProviderInstance } from './types'
import { fromISO, toISO, todayISO } from './format'

export function isValidISODate(iso: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return false
  const d = fromISO(iso)
  return !Number.isNaN(d.getTime()) && toISO(d) === iso
}

export function isFutureDate(iso: string): boolean {
  return isValidISODate(iso) && iso >= todayISO()
}

/** Une journée confirmée ou payée bloque toute la journée (pas de double réservation). */
export function holdsDate(booking: Booking): boolean {
  return booking.status === 'confirmee' || booking.status === 'acompte_paye'
}

export function unavailableDates(
  provider: ProviderInstance,
  bookings: Booking[],
  excludeCode?: string,
): string[] {
  const dates = new Set(provider.blockedDates)
  bookings.forEach((b) => {
    if (b.code !== excludeCode && holdsDate(b)) dates.add(b.date)
  })
  return [...dates].sort()
}

export function dateConflict(
  provider: ProviderInstance,
  bookings: Booking[],
  date: string,
  excludeCode?: string,
): Booking | null {
  if (provider.blockedDates.includes(date)) return null
  return bookings.find((b) => b.code !== excludeCode && b.date === date && holdsDate(b)) ?? null
}

export class DateUnavailableError extends Error {
  constructor(message = 'Cette date n’est plus disponible. Choisissez une autre date.') {
    super(message)
    this.name = 'DateUnavailableError'
  }
}

export function assertDateAvailable(
  provider: ProviderInstance,
  bookings: Booking[],
  date: string,
  excludeCode?: string,
): void {
  if (!isFutureDate(date)) throw new DateUnavailableError('Choisissez une date valide, aujourd’hui ou à venir.')
  if (provider.blockedDates.includes(date) || dateConflict(provider, bookings, date, excludeCode)) {
    throw new DateUnavailableError()
  }
}
