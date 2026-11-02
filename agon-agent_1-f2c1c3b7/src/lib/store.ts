import type { Booking, BookingLine, Option, ProviderInstance, Slot, TimelineEntry } from './types'
import { buildSeedBookings, buildSeedInstances } from './seed'
import { getTemplate } from './templates'
import { buildLine, computeTotals, derivedOptionQty, roundMoney } from './pricing'
import { assertDateAvailable, isFutureDate, unavailableDates } from './availability'
import { randomCode, slugify, uid } from './utils'

/**
 * Persistance locale de la démonstration.
 *
 * Chaque instance possède sa propre clé (`cadence.v1.data.<providerId>`).
 * Les réservations et les acomptes sont toujours lus/écrits dans la clé du
 * prestataire demandé : aucun panier commun, aucun transfert entre prestataires.
 *
 * Limite assumée : ceci est une démo front-end. Le cloisonnement applicatif
 * n'est pas une authentification serveur. En production, chaque opération
 * devra être autorisée côté serveur et le paiement encaissé directement par
 * le prestataire (compte connecté / Stripe Connect Standard par exemple).
 */

const NS = 'cadence.v1'
const INDEX_KEY = `${NS}.index`
const INIT_KEY = `${NS}.initialized`
const CHANGE_EVENT = 'cadence:change'
const SESSION_TTL = 8 * 60 * 60 * 1000
const dataKey = (providerId: string) => `${NS}.data.${providerId}`
const sessionKey = (providerId: string) => `${NS}.session.${providerId}`

const memoryStore = new Map<string, string>()
const dirtyKeys = new Set<string>()
let storageMode: 'local' | 'memory' = 'local'

export function getStorageMode(): 'local' | 'memory' {
  return storageMode
}

function readRaw(key: string): string | null {
  if (dirtyKeys.has(key)) return memoryStore.get(key) ?? null
  try {
    const value = window.localStorage.getItem(key)
    if (value !== null) return value
  } catch {
    storageMode = 'memory'
  }
  return memoryStore.get(key) ?? null
}

function writeRaw(key: string, value: string): void {
  memoryStore.set(key, value)
  try {
    window.localStorage.setItem(key, value)
    dirtyKeys.delete(key)
  } catch {
    dirtyKeys.add(key)
    storageMode = 'memory'
  }
  emitChange(key)
}

function removeRaw(key: string): void {
  memoryStore.delete(key)
  dirtyKeys.delete(key)
  try {
    window.localStorage.removeItem(key)
  } catch {
    storageMode = 'memory'
  }
  emitChange(key)
}

function emitChange(key: string): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: { key } }))
  }
}

/** Abonnement aux changements locaux et inter-onglets. Retourne un désabonnement. */
export function subscribeData(callback: () => void): () => void {
  const onStorage = (event: StorageEvent) => {
    if (event.key === null || event.key.startsWith(NS)) {
      if (event.key) memoryStore.delete(event.key)
      callback()
    }
  }
  const onLocal = () => callback()
  window.addEventListener('storage', onStorage)
  window.addEventListener(CHANGE_EVENT, onLocal)
  return () => {
    window.removeEventListener('storage', onStorage)
    window.removeEventListener(CHANGE_EVENT, onLocal)
  }
}

export class ScopeError extends Error {
  constructor(message = 'Accès refusé : cet élément appartient à un autre prestataire.') {
    super(message)
    this.name = 'ScopeError'
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ValidationError'
  }
}

interface ProviderData {
  instance: ProviderInstance
  bookings: Booking[]
}

const delay = (ms = 60) => new Promise<void>((resolve) => setTimeout(resolve, ms))

function readIndex(): string[] {
  const raw = readRaw(INDEX_KEY)
  if (!raw) return []
  try {
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : []
  } catch {
    return []
  }
}

function writeIndex(ids: string[]): void {
  writeRaw(INDEX_KEY, JSON.stringify([...new Set(ids)]))
}

function normalizeProvider(raw: ProviderInstance): ProviderInstance {
  const template = getTemplate(raw.templateId)
  return {
    ...raw,
    formulas: raw.formulas.map((formula) => {
      const defaults = template?.payload.formulas.find((item) => item.id === formula.id)
      return { ...formula, audioSamples: formula.audioSamples ?? defaults?.audioSamples }
    }),
    travelIncludedKm: Number.isFinite(raw.travelIncludedKm) ? raw.travelIncludedKm : raw.templateId === 'dj' || raw.templateId === 'booth' ? 40 : 50,
  }
}

function normalizeBooking(raw: Booking): Booking {
  const depositAmount = raw.deposit?.amount ?? raw.pricing.depositAmount
  return {
    ...raw,
    quoteVersion: raw.quoteVersion ?? 1,
    deposit: { ...raw.deposit, amount: depositAmount },
  }
}

function loadData(providerId: string): ProviderData | null {
  const raw = readRaw(dataKey(providerId))
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as ProviderData
    if (!parsed.instance || parsed.instance.id !== providerId || !Array.isArray(parsed.bookings)) return null
    return {
      instance: normalizeProvider(parsed.instance),
      bookings: parsed.bookings.filter((b) => b.providerId === providerId).map(normalizeBooking),
    }
  } catch {
    return null
  }
}

function saveData(providerId: string, data: ProviderData): void {
  if (data.instance.id !== providerId || data.bookings.some((b) => b.providerId !== providerId)) {
    throw new ScopeError()
  }
  writeRaw(dataKey(providerId), JSON.stringify(data))
}

function requireData(providerId: string): ProviderData {
  const data = loadData(providerId)
  if (!data) throw new ScopeError('Prestataire introuvable.')
  return data
}

let seeded = false

export function ensureSeeded(): void {
  if (seeded) return
  seeded = true
  if (readRaw(INIT_KEY) === '1') return
  if (readIndex().length > 0) {
    writeRaw(INIT_KEY, '1')
    return
  }
  const instances = buildSeedInstances()
  const bookings = buildSeedBookings(instances)
  instances.forEach((instance) => {
    saveData(instance.id, { instance, bookings: bookings[instance.id] ?? [] })
  })
  writeIndex(instances.map((i) => i.id))
  writeRaw(INIT_KEY, '1')
}

/* ------------------------------------------------------------- validation */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const HEX_RE = /^#[0-9a-fA-F]{6}$/

function assertValidProvider(instance: ProviderInstance): void {
  if (!instance.displayName.trim()) throw new ValidationError('Le nom affiché est requis.')
  if (!slugify(instance.slug)) throw new ValidationError('L’adresse publique est invalide.')
  if (!instance.formulas.length) throw new ValidationError('Ajoutez au moins une formule.')
  if (instance.formulas.some((f) => !f.name.trim() || !Number.isFinite(f.price) || f.price < 0 || f.price > 1_000_000)) {
    throw new ValidationError('Chaque formule doit avoir un nom et un prix valide (0 à 1 000 000 €).')
  }
  if (new Set(instance.formulas.map((f) => f.id)).size !== instance.formulas.length) {
    throw new ValidationError('Identifiants de formules en doublon.')
  }
  if (instance.options.some((o) => !o.name.trim() || !Number.isFinite(o.price) || o.price < 0 || o.price > 1_000_000 || !Number.isInteger(o.maxQty) || o.maxQty < 1 || o.maxQty > 10_000)) {
    throw new ValidationError('Chaque option doit avoir un nom, un prix valide et une quantité maximale entière (1 à 10 000).')
  }
  if (new Set(instance.options.map((o) => o.id)).size !== instance.options.length) {
    throw new ValidationError('Identifiants d’options en doublon.')
  }
  if (!Number.isFinite(instance.depositPercent) || instance.depositPercent < 1 || instance.depositPercent > 100) {
    throw new ValidationError('L’acompte doit être compris entre 1 et 100 %.')
  }
  if (!Number.isFinite(instance.travelIncludedKm) || instance.travelIncludedKm < 0 || instance.travelIncludedKm > 500) {
    throw new ValidationError('Le rayon de déplacement inclus doit être compris entre 0 et 500 km.')
  }
  if (![instance.palette.brand, instance.palette.accent, instance.palette.paper].every((c) => HEX_RE.test(c))) {
    throw new ValidationError('Les couleurs doivent être des codes hexadécimaux à 6 chiffres.')
  }
  if (instance.accessCode.trim().length < 6) throw new ValidationError('Le code d’accès doit contenir au moins 6 caractères.')
  if (instance.contact.email && !EMAIL_RE.test(instance.contact.email)) throw new ValidationError('E-mail de contact invalide.')
}

function assertUniqueSlug(instance: ProviderInstance): void {
  const slug = slugify(instance.slug)
  const taken = readIndex().some((id) => {
    if (id === instance.id) return false
    return loadData(id)?.instance.slug === slug
  })
  if (taken) throw new ValidationError('Cette adresse publique est déjà utilisée par une autre instance.')
}

/* --------------------------------------------------------------- providers */

export async function listProviders(): Promise<ProviderInstance[]> {
  await delay(30)
  ensureSeeded()
  return readIndex().map((id) => loadData(id)?.instance).filter((p): p is ProviderInstance => Boolean(p))
}

export async function getProviderBySlug(slug: string): Promise<ProviderInstance | null> {
  await delay(30)
  ensureSeeded()
  return readIndex().map((id) => loadData(id)?.instance).find((p) => p?.slug === slug) ?? null
}

export async function getProviderById(id: string): Promise<ProviderInstance | null> {
  await delay(20)
  ensureSeeded()
  return loadData(id)?.instance ?? null
}

export async function saveProvider(instance: ProviderInstance): Promise<ProviderInstance> {
  await delay(80)
  ensureSeeded()
  const data = requireData(instance.id)
  const next: ProviderInstance = {
    ...instance,
    slug: slugify(instance.slug),
    displayName: instance.displayName.trim(),
    accessCode: instance.accessCode.trim().toUpperCase(),
  }
  assertValidProvider(next)
  assertUniqueSlug(next)
  saveData(instance.id, { ...data, instance: next })
  return next
}

export async function createInstance(instance: ProviderInstance): Promise<ProviderInstance> {
  await delay(80)
  ensureSeeded()
  const next: ProviderInstance = {
    ...instance,
    slug: slugify(instance.slug),
    displayName: instance.displayName.trim(),
    accessCode: instance.accessCode.trim().toUpperCase(),
  }
  assertValidProvider(next)
  assertUniqueSlug(next)
  if (loadData(next.id)) throw new ValidationError('Cette instance existe déjà.')
  const ids = readIndex()
  saveData(next.id, { instance: next, bookings: [] })
  writeIndex([...ids, next.id])
  return next
}

export async function deleteInstance(providerId: string): Promise<void> {
  await delay(60)
  ensureSeeded()
  writeIndex(readIndex().filter((id) => id !== providerId))
  removeRaw(dataKey(providerId))
  removeSession(providerId)
}

/* ---------------------------------------------------------------- bookings */

export async function listBookings(providerId: string): Promise<Booking[]> {
  await delay(30)
  ensureSeeded()
  const data = loadData(providerId)
  if (!data) return []
  return [...data.bookings].sort((a, b) => b.createdAt - a.createdAt)
}

export async function getBooking(providerId: string, code: string): Promise<Booking | null> {
  await delay(25)
  ensureSeeded()
  const data = loadData(providerId)
  if (!data) return null
  const booking = data.bookings.find((b) => b.code.toUpperCase() === code.toUpperCase())
  if (!booking) return null
  if (booking.providerId !== providerId) throw new ScopeError()
  return booking
}

export async function getUnavailableDates(providerId: string): Promise<string[]> {
  await delay(20)
  ensureSeeded()
  const data = loadData(providerId)
  return data ? unavailableDates(data.instance, data.bookings) : []
}

export interface OptionSelection {
  optionId: string
  qty: number
  /** Autorisé uniquement pour un ajustement prestataire, jamais côté client. */
  unitPrice?: number
}

export interface NewBookingInput {
  client: Booking['client']
  formulaId: string
  options: OptionSelection[]
  date: string
  slot: Slot
  requestId?: string
}

function resolveLines(
  instance: ProviderInstance,
  selections: OptionSelection[],
  clientContext: Booking['client'] | null,
  allowPriceOverride: boolean,
): BookingLine[] {
  const seen = new Set<string>()
  const lines: BookingLine[] = []
  for (const selection of selections) {
    if (seen.has(selection.optionId)) throw new ValidationError('Une option ne peut être ajoutée qu’une seule fois.')
    seen.add(selection.optionId)
    const option = instance.options.find((o) => o.id === selection.optionId)
    if (!option) throw new ValidationError('Option inconnue pour ce prestataire.')
    let qty = Math.trunc(Number(selection.qty))
    if (!Number.isFinite(qty) || qty < 0 || qty > option.maxQty) {
      throw new ValidationError(`Quantité invalide pour « ${option.name} » (maximum ${option.maxQty}).`)
    }
    if (clientContext && (option.unit === 'km' || option.unit === 'personne')) {
      qty = derivedOptionQty(option, {
        guestCount: clientContext.guestCount,
        distanceKm: clientContext.distanceKm,
        travelIncludedKm: instance.travelIncludedKm,
      })
    }
    if (qty === 0) continue
    const price = allowPriceOverride && selection.unitPrice !== undefined ? selection.unitPrice : option.price
    if (!Number.isFinite(price) || price < 0 || price > 1_000_000) throw new ValidationError('Prix unitaire invalide.')
    const catalogOption: Option = { ...option, price: roundMoney(price) }
    lines.push(buildLine(catalogOption, qty))
  }
  return lines
}

function validateClient(client: Booking['client']): Booking['client'] {
  const firstName = client.firstName.trim()
  const lastName = client.lastName.trim()
  const email = client.email.trim().toLowerCase()
  const phone = client.phone.trim()
  if (!firstName || !lastName) throw new ValidationError('Prénom et nom sont requis.')
  if (!EMAIL_RE.test(email)) throw new ValidationError('Adresse e-mail invalide.')
  if (phone.replace(/\D/g, '').length < 9) throw new ValidationError('Numéro de téléphone invalide.')
  if (!client.city.trim() || !client.venue.trim()) throw new ValidationError('La ville et le lieu de l’événement sont requis.')
  if (!Number.isInteger(client.guestCount) || client.guestCount < 1 || client.guestCount > 600) {
    throw new ValidationError('Le nombre d’invités doit être compris entre 1 et 600.')
  }
  if (!Number.isFinite(client.distanceKm) || client.distanceKm < 0 || client.distanceKm > 2000) {
    throw new ValidationError('La distance doit être comprise entre 0 et 2 000 km.')
  }
  return {
    ...client,
    firstName,
    lastName,
    email,
    phone,
    couple: `${firstName} & ${lastName}`,
    city: client.city.trim(),
    venue: client.venue.trim(),
    message: client.message.trim(),
  }
}

function appendTimeline(booking: Booking, entry: Omit<TimelineEntry, 'at'>, at = Date.now()): Booking {
  return { ...booking, updatedAt: at, timeline: [...booking.timeline, { ...entry, at }] }
}

function replaceBooking(data: ProviderData, booking: Booking): Booking {
  if (booking.providerId !== data.instance.id) throw new ScopeError()
  const bookings = data.bookings.map((b) => (b.code === booking.code ? booking : b))
  saveData(data.instance.id, { ...data, bookings })
  return booking
}

export async function createBooking(providerId: string, input: NewBookingInput): Promise<Booking> {
  await delay(140)
  ensureSeeded()
  const data = requireData(providerId)
  if (input.requestId) {
    const existing = data.bookings.find((b) => b.requestId === input.requestId)
    if (existing) return existing
  }
  const instance = data.instance
  const formula = instance.formulas.find((f) => f.id === input.formulaId)
  if (!formula) throw new ValidationError('Formule inconnue pour ce prestataire.')
  if (!['matin', 'aprem', 'soir'].includes(input.slot)) throw new ValidationError('Créneau invalide.')
  assertDateAvailable(instance, data.bookings, input.date)
  const client = validateClient(input.client)
  // Les prix sont toujours relus dans le catalogue du prestataire : le client
  // ne peut pas fournir un montant falsifié.
  const lines = resolveLines(instance, input.options, client, false)
  const totals = computeTotals(formula.price, lines, instance.depositPercent)
  const now = Date.now()
  let code = randomCode(instance.slug)
  while (data.bookings.some((b) => b.code === code)) code = randomCode(instance.slug)

  const booking: Booking = {
    id: uid('bk'),
    providerId,
    code,
    requestId: input.requestId,
    quoteVersion: 1,
    status: 'proposee',
    createdAt: now,
    updatedAt: now,
    client,
    formulaId: formula.id,
    formulaName: formula.name,
    formulaPrice: formula.price,
    options: lines,
    date: input.date,
    slot: input.slot,
    pricing: {
      subtotal: totals.subtotal,
      total: totals.total,
      depositPercent: totals.depositPercent,
      depositAmount: totals.depositAmount,
    },
    deposit: { amount: totals.depositAmount, status: 'en_attente' },
    timeline: [
      {
        at: now,
        label: 'Demande envoyée',
        detail: `${formula.name} · ${lines.length} option(s) · aucun paiement à cette étape`,
        actor: 'client',
      },
    ],
  }
  saveData(providerId, { ...data, bookings: [...data.bookings, booking] })
  return booking
}

export interface QuoteAdjustment {
  formulaId: string
  lines: OptionSelection[]
}

/** Ajustement prestataire, avant confirmation uniquement. Recalcule tout le devis. */
export async function adjustBooking(
  providerId: string,
  code: string,
  adjustment: QuoteAdjustment,
  expectedVersion?: number,
): Promise<Booking> {
  await delay(90)
  ensureSeeded()
  const data = requireData(providerId)
  const existing = data.bookings.find((b) => b.code.toUpperCase() === code.toUpperCase())
  if (!existing) throw new ValidationError('Réservation introuvable.')
  if (existing.providerId !== providerId) throw new ScopeError()
  if (expectedVersion !== undefined && existing.quoteVersion !== expectedVersion) {
    throw new ValidationError('Le devis a été modifié dans un autre onglet. Rechargez avant d’enregistrer.')
  }
  if (existing.status !== 'proposee' && existing.status !== 'date_a_accepter') {
    throw new ValidationError('Le devis est verrouillé après confirmation. Ajustez les options avant de confirmer la date.')
  }
  const formula = data.instance.formulas.find((f) => f.id === adjustment.formulaId)
  if (!formula) throw new ValidationError('Formule inconnue pour ce prestataire.')
  const lines = resolveLines(data.instance, adjustment.lines, null, true)
  const totals = computeTotals(formula.price, lines, data.instance.depositPercent)
  const updated = appendTimeline(
    {
      ...existing,
      formulaId: formula.id,
      formulaName: formula.name,
      formulaPrice: formula.price,
      options: lines,
      quoteVersion: existing.quoteVersion + 1,
      pricing: {
        subtotal: totals.subtotal,
        total: totals.total,
        depositPercent: totals.depositPercent,
        depositAmount: totals.depositAmount,
      },
      deposit: { ...existing.deposit, amount: totals.depositAmount },
    },
    { label: 'Offre et options ajustées', detail: `${formula.name} · total ${totals.total.toFixed(2)} €`, actor: 'prestataire' },
  )
  return replaceBooking(data, updated)
}

export async function confirmBooking(providerId: string, code: string, expectedVersion?: number): Promise<Booking> {
  await delay(90)
  ensureSeeded()
  const data = requireData(providerId)
  const existing = data.bookings.find((b) => b.code.toUpperCase() === code.toUpperCase())
  if (!existing) throw new ValidationError('Réservation introuvable.')
  if (existing.providerId !== providerId) throw new ScopeError()
  if (expectedVersion !== undefined && existing.quoteVersion !== expectedVersion) {
    throw new ValidationError('Le devis a changé. Rechargez la demande avant de confirmer.')
  }
  if (existing.status !== 'proposee') {
    throw new ValidationError('Seule une date proposée et acceptée peut être confirmée.')
  }
  assertDateAvailable(data.instance, data.bookings, existing.date, existing.code)
  const updated = appendTimeline(
    { ...existing, status: 'confirmee' },
    { label: 'Date confirmée', detail: 'Le client peut régler l’acompte sur son lien de réservation.', actor: 'prestataire' },
  )
  return replaceBooking(data, updated)
}

export async function proposeAlternativeDate(providerId: string, code: string, date: string): Promise<Booking> {
  await delay(90)
  ensureSeeded()
  const data = requireData(providerId)
  const existing = data.bookings.find((b) => b.code.toUpperCase() === code.toUpperCase())
  if (!existing) throw new ValidationError('Réservation introuvable.')
  if (existing.status !== 'proposee') throw new ValidationError('Une contre-proposition n’est possible que sur une demande en attente.')
  assertDateAvailable(data.instance, data.bookings, date, existing.code)
  const updated = appendTimeline(
    { ...existing, date, status: 'date_a_accepter' },
    { label: 'Autre date proposée', detail: 'En attente d’acceptation par le client.', actor: 'prestataire' },
  )
  return replaceBooking(data, updated)
}

export async function acceptAlternativeDate(providerId: string, code: string): Promise<Booking> {
  await delay(80)
  ensureSeeded()
  const data = requireData(providerId)
  const existing = data.bookings.find((b) => b.code.toUpperCase() === code.toUpperCase())
  if (!existing) throw new ValidationError('Réservation introuvable.')
  if (existing.status !== 'date_a_accepter') throw new ValidationError('Aucune nouvelle date à accepter.')
  assertDateAvailable(data.instance, data.bookings, existing.date, existing.code)
  const updated = appendTimeline(
    { ...existing, status: 'proposee' },
    { label: 'Nouvelle date acceptée', detail: 'Le prestataire peut confirmer la réservation.', actor: 'client' },
  )
  return replaceBooking(data, updated)
}

export async function refuseBooking(providerId: string, code: string): Promise<Booking> {
  await delay(80)
  ensureSeeded()
  const data = requireData(providerId)
  const existing = data.bookings.find((b) => b.code.toUpperCase() === code.toUpperCase())
  if (!existing) throw new ValidationError('Réservation introuvable.')
  if (existing.status !== 'proposee' && existing.status !== 'date_a_accepter') {
    throw new ValidationError('Cette demande ne peut plus être refusée.')
  }
  return replaceBooking(data, appendTimeline({ ...existing, status: 'refusee' }, { label: 'Demande refusée', actor: 'prestataire' }))
}

export async function cancelBooking(providerId: string, code: string): Promise<Booking> {
  await delay(80)
  ensureSeeded()
  const data = requireData(providerId)
  const existing = data.bookings.find((b) => b.code.toUpperCase() === code.toUpperCase())
  if (!existing) throw new ValidationError('Réservation introuvable.')
  if (existing.deposit.status === 'paye' || !['proposee', 'date_a_accepter', 'confirmee'].includes(existing.status)) {
    throw new ValidationError('Cette réservation ne peut plus être annulée en ligne. Contactez le prestataire.')
  }
  return replaceBooking(data, appendTimeline({ ...existing, status: 'annulee' }, { label: 'Demande annulée par le client', actor: 'client' }))
}

export async function saveBookingNote(providerId: string, code: string, note: string): Promise<Booking> {
  await delay(60)
  ensureSeeded()
  const data = requireData(providerId)
  const existing = data.bookings.find((b) => b.code.toUpperCase() === code.toUpperCase())
  if (!existing) throw new ValidationError('Réservation introuvable.')
  return replaceBooking(data, appendTimeline({ ...existing, note }, { label: 'Note interne mise à jour', actor: 'prestataire' }))
}

/* ---------------------------------------------------------------- paiement */

function settleDeposit(data: ProviderData, existing: Booking, method: string, actor: TimelineEntry['actor']): Booking {
  if (existing.providerId !== data.instance.id) throw new ScopeError()
  if (existing.deposit.status === 'paye') return existing
  if (existing.status !== 'confirmee') {
    throw new ValidationError('L’acompte n’est payable qu’après confirmation de la date par le prestataire.')
  }
  const amount = roundMoney(existing.deposit.amount)
  if (!Number.isFinite(amount) || amount <= 0) throw new ValidationError('Montant d’acompte invalide.')
  const now = Date.now()
  const reference = `DEMO-${existing.code}-${randomCode('pay').slice(-6)}`
  const updated = appendTimeline(
    {
      ...existing,
      status: 'acompte_paye',
      deposit: { ...existing.deposit, amount, status: 'paye', paidAt: now, method, reference },
    },
    { label: 'Acompte reçu (démo)', detail: `${method} · ${amount.toFixed(2)} € · ${reference}`, actor },
    now,
  )
  return replaceBooking(data, updated)
}

/** Paiement simulé : aucun réseau bancaire, aucune donnée de carte conservée. */
export async function payDeposit(
  providerId: string,
  code: string,
  method = 'Carte bancaire (démo)',
  expectedVersion?: number,
): Promise<Booking> {
  await delay(750)
  ensureSeeded()
  const data = requireData(providerId)
  const existing = data.bookings.find((b) => b.code.toUpperCase() === code.toUpperCase())
  if (!existing) throw new ValidationError('Réservation introuvable.')
  if (expectedVersion !== undefined && existing.quoteVersion !== expectedVersion) {
    throw new ValidationError('Le devis a changé. Vérifiez le nouveau montant avant de payer.')
  }
  return settleDeposit(data, existing, method, 'systeme')
}

export async function markDepositPaidManually(
  providerId: string,
  code: string,
  method = 'Virement bancaire (démo)',
): Promise<Booking> {
  await delay(90)
  ensureSeeded()
  const data = requireData(providerId)
  const existing = data.bookings.find((b) => b.code.toUpperCase() === code.toUpperCase())
  if (!existing) throw new ValidationError('Réservation introuvable.')
  return settleDeposit(data, existing, method, 'prestataire')
}

/* ---------------------------------------------------------------- session */

function readSessionRaw(key: string): string | null {
  try {
    return window.sessionStorage.getItem(key)
  } catch {
    return memoryStore.get(key) ?? null
  }
}

export function saveSession(providerId: string): void {
  const value = JSON.stringify({ at: Date.now() })
  memoryStore.set(sessionKey(providerId), value)
  try {
    window.sessionStorage.setItem(sessionKey(providerId), value)
  } catch {
    /* session en mémoire uniquement */
  }
}

export function hasSession(providerId: string): boolean {
  const raw = readSessionRaw(sessionKey(providerId))
  if (!raw) return false
  try {
    const parsed = JSON.parse(raw) as { at?: number }
    if (typeof parsed.at !== 'number' || Date.now() - parsed.at > SESSION_TTL) {
      clearSession(providerId)
      return false
    }
    return true
  } catch {
    return false
  }
}

function removeSession(providerId: string): void {
  memoryStore.delete(sessionKey(providerId))
  try {
    window.sessionStorage.removeItem(sessionKey(providerId))
  } catch {
    /* ignore */
  }
}

export function clearSession(providerId: string): void {
  removeSession(providerId)
}

/* ------------------------------------------------------------------ reset */

export function resetDemo(): void {
  readIndex().forEach((id) => {
    removeRaw(dataKey(id))
    removeSession(id)
  })
  removeRaw(INDEX_KEY)
  removeRaw(INIT_KEY)
  try {
    const drafts: string[] = []
    for (let i = 0; i < window.sessionStorage.length; i += 1) {
      const key = window.sessionStorage.key(i)
      if (key && key.startsWith(`${NS}.draft.`)) drafts.push(key)
    }
    drafts.forEach((key) => window.sessionStorage.removeItem(key))
  } catch {
    /* ignore */
  }
  seeded = false
  ensureSeeded()
}

export { isFutureDate }
