import type { Booking, BookingLine, ProviderInstance, Slot } from './types'
import { buildSeedBookings, buildSeedInstances } from './seed'
import { randomCode, uid } from './utils'

/**
 * Couche de persistance de la démo.
 *
 * Règle structurante : les données d'un prestataire ne sont JAMAIS stockées
 * dans le même emplacement que celles d'un autre. Chaque instance possède sa
 * propre clé de stockage (`cadence.v1.data.<providerId>`) et toutes les
 * fonctions d'écriture vérifient le `providerId` avant de muter.
 * Un acompte encaissé chez A ne peut donc structurellement pas être
 * déplacé, lu ou encaissé chez B.
 */

const NS = 'cadence.v1'
const INDEX_KEY = `${NS}.index`
const dataKey = (providerId: string) => `${NS}.data.${providerId}`
const sessionKey = (providerId: string) => `${NS}.session.${providerId}`

const memoryStore = new Map<string, string>()

function readRaw(key: string): string | null {
  try {
    const v = window.localStorage.getItem(key)
    if (v !== null) return v
  } catch {
    /* ignore */
  }
  return memoryStore.get(key) ?? null
}

function writeRaw(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value)
  } catch {
    memoryStore.set(key, value)
  }
}

function removeRaw(key: string): void {
  try {
    window.localStorage.removeItem(key)
  } catch {
    /* ignore */
  }
  memoryStore.delete(key)
}

export class ScopeError extends Error {
  constructor(message = 'Accès refusé : cet élément appartient à un autre prestataire.') {
    super(message)
    this.name = 'ScopeError'
  }
}

interface ProviderData {
  instance: ProviderInstance
  bookings: Booking[]
}

const delay = (ms = 120) => new Promise<void>((resolve) => setTimeout(resolve, ms))

/* ------------------------------------------------------------------ index */

function readIndex(): string[] {
  const raw = readRaw(INDEX_KEY)
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as string[]) : []
  } catch {
    return []
  }
}

function writeIndex(ids: string[]): void {
  writeRaw(INDEX_KEY, JSON.stringify(ids))
}

/* --------------------------------------------------------------- providers */

function loadData(providerId: string): ProviderData | null {
  const raw = readRaw(dataKey(providerId))
  if (!raw) return null
  try {
    return JSON.parse(raw) as ProviderData
  } catch {
    return null
  }
}

function saveData(providerId: string, data: ProviderData): void {
  writeRaw(dataKey(providerId), JSON.stringify(data))
}

let seeded = false

export function ensureSeeded(): void {
  if (seeded) return
  seeded = true
  if (readIndex().length > 0) return
  const instances = buildSeedInstances()
  const bookings = buildSeedBookings(instances)
  instances.forEach((instance) => {
    saveData(instance.id, { instance, bookings: bookings[instance.id] ?? [] })
  })
  writeIndex(instances.map((i) => i.id))
}

/* ------------------------------------------------------------------- api */

export async function listProviders(): Promise<ProviderInstance[]> {
  await delay(60)
  ensureSeeded()
  const out: ProviderInstance[] = []
  readIndex().forEach((id) => {
    const data = loadData(id)
    if (data) out.push(data.instance)
  })
  return out
}

export async function getProviderBySlug(slug: string): Promise<ProviderInstance | null> {
  await delay(60)
  ensureSeeded()
  const found = readIndex()
    .map((id) => loadData(id))
    .find((d) => d && d.instance.slug === slug)
  return found ? found.instance : null
}

export async function getProviderById(id: string): Promise<ProviderInstance | null> {
  await delay(40)
  ensureSeeded()
  const data = loadData(id)
  return data ? data.instance : null
}

export async function saveProvider(instance: ProviderInstance): Promise<ProviderInstance> {
  await delay(140)
  ensureSeeded()
  const data = loadData(instance.id)
  if (!data) throw new ScopeError('Instance inconnue.')
  saveData(instance.id, { ...data, instance })
  return instance
}

export async function createInstance(instance: ProviderInstance): Promise<ProviderInstance> {
  await delay(140)
  ensureSeeded()
  const ids = readIndex()
  if (!ids.includes(instance.id)) ids.push(instance.id)
  writeIndex(ids)
  saveData(instance.id, { instance, bookings: [] })
  return instance
}

export async function deleteInstance(providerId: string): Promise<void> {
  await delay(120)
  ensureSeeded()
  const ids = readIndex().filter((id) => id !== providerId)
  writeIndex(ids)
  removeRaw(dataKey(providerId))
  removeRaw(sessionKey(providerId))
}

export async function listBookings(providerId: string): Promise<Booking[]> {
  await delay(60)
  ensureSeeded()
  const data = loadData(providerId)
  if (!data) return []
  return [...data.bookings].sort((a, b) => b.createdAt - a.createdAt)
}

/**
 * Lecture strictement cloisonnée : une réservation n'est retournée que si
 * elle appartient bien au prestataire demandé.
 */
export async function getBooking(providerId: string, code: string): Promise<Booking | null> {
  await delay(50)
  ensureSeeded()
  const data = loadData(providerId)
  if (!data) return null
  const booking = data.bookings.find((b) => b.code.toUpperCase() === code.toUpperCase())
  if (!booking) return null
  if (booking.providerId !== providerId) throw new ScopeError()
  return booking
}

export interface NewBookingInput {
  client: Booking['client']
  formulaId: string
  optionLines: BookingLine[]
  date: string
  slot: Slot
}

export async function createBooking(
  providerId: string,
  input: NewBookingInput,
): Promise<Booking> {
  await delay(220)
  ensureSeeded()
  const data = loadData(providerId)
  if (!data) throw new ScopeError('Prestataire introuvable.')
  const instance = data.instance
  const formula = instance.formulas.find((f) => f.id === input.formulaId)
  if (!formula) throw new Error('Formule inconnue.')

  const optionsTotal = input.optionLines.reduce((s, l) => s + l.lineTotal, 0)
  const total = Math.round((formula.price + optionsTotal) * 100) / 100
  const depositAmount = Math.round(((total * instance.depositPercent) / 100) * 100) / 100
  const now = Date.now()

  const booking: Booking = {
    id: uid('bk'),
    providerId,
    code: randomCode(instance.slug),
    status: 'proposee',
    createdAt: now,
    updatedAt: now,
    client: input.client,
    formulaId: formula.id,
    formulaName: formula.name,
    formulaPrice: formula.price,
    options: input.optionLines,
    date: input.date,
    slot: input.slot,
    pricing: {
      subtotal: formula.price,
      total,
      depositPercent: instance.depositPercent,
      depositAmount,
    },
    deposit: { amount: depositAmount, status: 'en_attente' },
    timeline: [
      {
        at: now,
        label: 'Demande envoyée',
        detail: `${formula.name} · ${input.optionLines.length} option(s)`,
        actor: 'client',
      },
    ],
  }

  saveData(providerId, { ...data, bookings: [...data.bookings, booking] })
  return booking
}

export type BookingPatch = Partial<
  Pick<
    Booking,
    | 'status'
    | 'date'
    | 'slot'
    | 'note'
    | 'options'
    | 'pricing'
    | 'formulaId'
    | 'formulaName'
    | 'formulaPrice'
  >
>

export async function updateBooking(
  providerId: string,
  code: string,
  patch: BookingPatch,
  entry?: { label: string; detail?: string; actor: 'client' | 'prestataire' | 'systeme' },
): Promise<Booking> {
  await delay(160)
  ensureSeeded()
  const data = loadData(providerId)
  if (!data) throw new ScopeError('Prestataire introuvable.')
  const index = data.bookings.findIndex((b) => b.code.toUpperCase() === code.toUpperCase())
  if (index === -1) throw new Error('Réservation introuvable.')
  const existing = data.bookings[index]
  if (existing.providerId !== providerId) throw new ScopeError()

  const now = Date.now()
  const updated: Booking = {
    ...existing,
    ...patch,
    updatedAt: now,
    timeline: entry
      ? [...existing.timeline, { at: now, label: entry.label, detail: entry.detail, actor: entry.actor }]
      : existing.timeline,
  }
  const bookings = [...data.bookings]
  bookings[index] = updated
  saveData(providerId, { ...data, bookings })
  return updated
}

/**
 * Encaissement de l'acompte. L'écriture est strictement limitée à la clé du
 * prestataire concerné : aucun montant ne peut transiter vers une autre
 * instance.
 */
export async function payDeposit(
  providerId: string,
  code: string,
  method: string,
): Promise<Booking> {
  await delay(900)
  ensureSeeded()
  const data = loadData(providerId)
  if (!data) throw new ScopeError('Prestataire introuvable.')
  const index = data.bookings.findIndex((b) => b.code.toUpperCase() === code.toUpperCase())
  if (index === -1) throw new Error('Réservation introuvable.')
  const existing = data.bookings[index]
  if (existing.providerId !== providerId) throw new ScopeError()
  if (existing.deposit.status === 'paye') return existing

  const now = Date.now()
  const reference = `DEP-${data.instance.slug.slice(0, 3).toUpperCase()}-${existing.code.slice(-4)}`
  const updated: Booking = {
    ...existing,
    status: 'acompte_paye',
    deposit: {
      ...existing.deposit,
      status: 'paye',
      paidAt: now,
      method,
      reference,
    },
    updatedAt: now,
    timeline: [
      ...existing.timeline,
      {
        at: now,
        label: 'Acompte encaissé',
        detail: `${method} · référence ${reference}`,
        actor: 'systeme',
      },
    ],
  }
  const bookings = [...data.bookings]
  bookings[index] = updated
  saveData(providerId, { ...data, bookings })
  return updated
}

export async function markDepositPaidManually(
  providerId: string,
  code: string,
  method = 'Virement bancaire',
): Promise<Booking> {
  await delay(160)
  ensureSeeded()
  const data = loadData(providerId)
  if (!data) throw new ScopeError('Prestataire introuvable.')
  const index = data.bookings.findIndex((b) => b.code.toUpperCase() === code.toUpperCase())
  if (index === -1) throw new Error('Réservation introuvable.')
  const existing = data.bookings[index]
  if (existing.providerId !== providerId) throw new ScopeError()
  const now = Date.now()
  const reference = `VIR-${data.instance.slug.slice(0, 3).toUpperCase()}-${existing.code.slice(-4)}`
  const updated: Booking = {
    ...existing,
    status: 'acompte_paye',
    deposit: { ...existing.deposit, status: 'paye', paidAt: now, method, reference },
    updatedAt: now,
    timeline: [
      ...existing.timeline,
      { at: now, label: 'Acompte encaissé', detail: `${method} · référence ${reference}`, actor: 'prestataire' },
    ],
  }
  const bookings = [...data.bookings]
  bookings[index] = updated
  saveData(providerId, { ...data, bookings })
  return updated
}

/* ---------------------------------------------------------------- session */

export function saveSession(providerId: string): void {
  writeRaw(sessionKey(providerId), JSON.stringify({ at: Date.now() }))
}

export function hasSession(providerId: string): boolean {
  return readRaw(sessionKey(providerId)) !== null
}

export function clearSession(providerId: string): void {
  removeRaw(sessionKey(providerId))
}

/* ------------------------------------------------------------------ reset */

export function resetDemo(): void {
  const ids = readIndex()
  ids.forEach((id) => removeRaw(dataKey(id)))
  removeRaw(INDEX_KEY)
  seeded = false
  ensureSeeded()
}
