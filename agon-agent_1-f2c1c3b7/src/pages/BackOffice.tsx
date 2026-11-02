import { useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowUpRight,
  CalendarDays,
  CalendarOff,
  Check,
  CheckCircle2,
  ClipboardList,
  CreditCard,
  ExternalLink,
  KeyRound,
  Loader2,
  Lock,
  LogOut,
  Music2,
  Palette,
  Plus,
  RefreshCw,
  Settings,
  Trash2,
  Wallet,
  X,
} from 'lucide-react'
import { Badge, Button, Card, EmptyState, Field, Input, Select, Sheet, Textarea, useToast } from '../components/ui'
import { Calendar } from '../components/Calendar'
import { DemoNotice } from '../components/DemoNotice'
import {
  adjustBooking,
  confirmBooking,
  getProviderBySlug,
  hasSession,
  listBookings,
  markDepositPaidManually,
  proposeAlternativeDate,
  refuseBooking,
  saveBookingNote,
  saveProvider,
  saveSession,
  clearSession,
  subscribeData,
} from '../lib/store'
import type { Booking, BookingLine, Option, ProviderInstance } from '../lib/types'
import {
  SLOT_LABEL,
  STATUS_LABEL,
  formatDateLong,
  formatDateShort,
  formatStamp,
  money,
  optionUnitLabel,
  relativeTime,
  todayISO,
} from '../lib/format'
import { buildLine, computeTotals } from '../lib/pricing'
import { unavailableDates } from '../lib/availability'
import { cn, slugify } from '../lib/utils'

type Tone = 'neutral' | 'accent' | 'brand' | 'success' | 'warning' | 'danger'
const STATUS_TONE: Record<string, Tone> = {
  proposee: 'warning',
  date_a_accepter: 'accent',
  confirmee: 'accent',
  acompte_paye: 'success',
  refusee: 'danger',
  annulee: 'danger',
  terminee: 'neutral',
}

function useIsDesktop(): boolean {
  return useSyncExternalStore(
    (callback) => {
      const mq = window.matchMedia('(min-width: 1024px)')
      mq.addEventListener('change', callback)
      return () => mq.removeEventListener('change', callback)
    },
    () => window.matchMedia('(min-width: 1024px)').matches,
    () => true,
  )
}

type Tab = 'demandes' | 'offres' | 'disponibilites' | 'reglages'

const TABS: Array<{ id: Tab; label: string; icon: typeof ClipboardList }> = [
  { id: 'demandes', label: 'Demandes', icon: ClipboardList },
  { id: 'offres', label: 'Offres & options', icon: Wallet },
  { id: 'disponibilites', label: 'Disponibilités', icon: CalendarOff },
  { id: 'reglages', label: 'Réglages', icon: Settings },
]

export default function BackOffice() {
  const { slug = '' } = useParams()
  const toast = useToast()
  const [provider, setProvider] = useState<ProviderInstance | null>(null)
  const [loading, setLoading] = useState(true)
  const [authed, setAuthed] = useState(false)
  const [codeInput, setCodeInput] = useState('')
  const [codeError, setCodeError] = useState<string | null>(null)
  const [tab, setTab] = useState<Tab>('demandes')
  const [bookings, setBookings] = useState<Booking[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'proposee' | 'confirmee' | 'acompte_paye' | 'autres'>(
    'all',
  )

  useEffect(() => {
    let active = true
    const load = () => {
      getProviderBySlug(slug).then((p) => {
        if (!active) return
        setProvider(p)
        setLoading(false)
        if (p) setAuthed(hasSession(p.id))
      })
    }
    load()
    const unsubscribe = subscribeData(load)
    return () => {
      active = false
      unsubscribe()
    }
  }, [slug])

  useEffect(() => {
    if (!provider || !authed) return
    let active = true
    const load = async () => {
      const list = await listBookings(provider.id)
      if (active) setBookings(list)
    }
    void load()
    const unsubscribe = subscribeData(() => void load())
    return () => {
      active = false
      unsubscribe()
    }
  }, [provider, authed])

  const refreshBookings = () => {
    if (provider) void listBookings(provider.id).then(setBookings)
  }

  const unlock = () => {
    if (!provider) return
    if (codeInput.trim().toUpperCase() === provider.accessCode.toUpperCase()) {
      saveSession(provider.id)
      setAuthed(true)
      setCodeError(null)
      toast.push('Accès au back-office ouvert.', 'success')
    } else {
      setCodeError('Code incorrect. Chaque prestataire dispose de son propre code.')
    }
  }

  const logout = () => {
    if (!provider) return
    clearSession(provider.id)
    setAuthed(false)
    setSelected(null)
    toast.push('Session fermée.', 'info')
  }

  const filtered = useMemo(() => {
    if (filter === 'all') return bookings
    if (filter === 'autres')
      return bookings.filter((b) => ['refusee', 'annulee', 'terminee'].includes(b.status))
    return bookings.filter((b) => b.status === filter)
  }, [bookings, filter])

  const kpis = useMemo(() => {
    const pending = bookings.filter((b) => b.status === 'proposee')
    const confirmed = bookings.filter((b) => b.status === 'confirmee' || b.status === 'acompte_paye')
    const collected = bookings
      .filter((b) => b.deposit.status === 'paye')
      .reduce((s, b) => s + b.deposit.amount, 0)
    const pipeline = confirmed.reduce((s, b) => s + b.pricing.total, 0)
    const balanceDue = confirmed.reduce((s, b) => s + Math.max(0, b.pricing.total - b.deposit.amount), 0)
    return { pending, confirmed, collected, pipeline, balanceDue }
  }, [bookings])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper">
        <Loader2 className="h-6 w-6 animate-spin text-ink/40" />
      </div>
    )
  }

  if (!provider) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper px-4">
        <EmptyState
          icon={<Music2 className="h-10 w-10" />}
          title="Espace introuvable"
          description="Aucun prestataire ne correspond à ce lien."
          action={
            <Link to="/">
              <Button variant="outline">Retour</Button>
            </Link>
          }
        />
      </div>
    )
  }

  /* ------------------------------------------------------------- gate */
  if (!authed) {
    return (
      <div
        className="flex min-h-screen items-center justify-center bg-paper px-4"
        style={
          {
            '--color-brand': provider.palette.brand,
            '--color-accent': provider.palette.accent,
            '--color-paper': provider.palette.paper,
          } as React.CSSProperties
        }
      >
        <Card className="w-full max-w-sm p-6">
          <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-brand text-accent">
            <Lock className="h-5 w-5" />
          </span>
          <h1 className="font-display text-[26px] leading-tight text-ink">Espace prestataire</h1>
          <p className="mt-1.5 text-[13.5px] text-ink/60">
            {provider.displayName} · {provider.businessName}
          </p>

          <div className="mt-6">
            <Field label="Code d’accès" error={codeError ?? undefined}>
              <Input
                value={codeInput}
                onChange={(e) => {
                  setCodeInput(e.target.value.toUpperCase())
                  setCodeError(null)
                }}
                onKeyDown={(e) => e.key === 'Enter' && unlock()}
                placeholder="SAXO-0000"
                autoCapitalize="characters"
                className="font-mono tracking-widest"
              />
            </Field>
          </div>

          <Button full className="mt-4" onClick={unlock} icon={<KeyRound className="h-4 w-4" />}>
            Ouvrir le back-office
          </Button>

          <DemoNotice className="mt-5">Démo locale : le code est affiché pour faciliter la présentation. Ce n’est pas une authentification de production.</DemoNotice>
          <div className="mt-3 rounded-xl bg-accent/8 px-3.5 py-3 text-[12.5px] leading-relaxed text-ink/60">
            <p className="font-semibold text-ink">Code de démonstration</p>
            <p className="mt-1">
              Utilisez <span className="font-mono font-bold text-accent">{provider.accessCode}</span> pour
              cette instance. Un autre code ouvre un autre back-office, jamais celui-ci.
            </p>
          </div>

          <Link
            to={`/p/${provider.slug}`}
            className="mt-4 flex items-center justify-center gap-1.5 text-[12.5px] font-medium text-ink/50 hover:text-ink"
          >
            Voir la page publique <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </Card>
      </div>
    )
  }

  /* -------------------------------------------------------- backoffice */
  return (
    <div
      className="min-h-screen bg-paper"
      style={
        {
          '--color-brand': provider.palette.brand,
          '--color-accent': provider.palette.accent,
          '--color-paper': provider.palette.paper,
        } as React.CSSProperties
      }
    >
      {/* header */}
      <header className="sticky top-0 z-40 border-b border-line/70 bg-paper/93 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand text-accent">
              <Music2 className="h-4.5 w-4.5" />
            </span>
            <div className="min-w-0">
              <p className="truncate font-display text-[17px] leading-tight text-ink">
                {provider.displayName}
              </p>
              <p className="flex items-center gap-1.5 text-[11px] text-ink/45">
                <Lock className="h-3 w-3" /> Espace cloisonné
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link to={`/p/${provider.slug}`}>
              <Button variant="outline" size="sm" icon={<ExternalLink className="h-3.5 w-3.5" />}>
                Page publique
              </Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={logout} icon={<LogOut className="h-3.5 w-3.5" />}>
              <span className="hidden sm:inline">Quitter</span>
            </Button>
          </div>
        </div>

        {/* tabs */}
        <nav className="mx-auto max-w-6xl overflow-x-auto px-4">
          <div className="no-scrollbar flex gap-1 pb-2">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={cn(
                  'flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold transition-colors',
                  tab === t.id ? 'bg-brand text-white' : 'text-ink/55 hover:bg-ink/6',
                )}
              >
                <t.icon className="h-3.5 w-3.5" /> {t.label}
              </button>
            ))}
          </div>
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        {tab === 'demandes' && (
          <DemandesTab
            provider={provider}
            bookings={filtered}
            allBookings={bookings}
            kpis={kpis}
            filter={filter}
            setFilter={setFilter}
            selected={selected}
            setSelected={setSelected}
            onChanged={refreshBookings}
            onOpenClient={(code) =>
              window.open(`/r/${provider.slug}/${code}`, '_blank', 'noopener,noreferrer')
            }
          />
        )}
        {tab === 'offres' && (
          <OffresTab key={`offres-${provider.id}-${JSON.stringify(provider.formulas)}-${JSON.stringify(provider.options)}`} provider={provider} onSave={(p) => { setProvider(p); refreshBookings() }} />
        )}
        {tab === 'disponibilites' && (
          <DispoTab key={`dispo-${provider.id}-${provider.blockedDates.join(',')}`} provider={provider} onSave={(p) => { setProvider(p); refreshBookings() }} />
        )}
        {tab === 'reglages' && (
          <ReglagesTab key={`reglages-${provider.id}-${JSON.stringify(provider)}`} provider={provider} onSave={(p) => { setProvider(p); refreshBookings() }} />
        )}
      </main>
    </div>
  )
}

/* =================================================================== tabs */

interface DemandesProps {
  provider: ProviderInstance
  bookings: Booking[]
  allBookings: Booking[]
  kpis: { pending: Booking[]; confirmed: Booking[]; collected: number; pipeline: number; balanceDue: number }
  filter: string
  setFilter: (f: 'all' | 'proposee' | 'confirmee' | 'acompte_paye' | 'autres') => void
  selected: string | null
  setSelected: (c: string | null) => void
  onChanged: () => void
  onOpenClient: (code: string) => void
}

function DemandesTab({
  provider,
  bookings,
  allBookings,
  kpis,
  filter,
  setFilter,
  selected,
  setSelected,
  onChanged,
  onOpenClient,
}: DemandesProps) {
  const isDesktop = useIsDesktop()
  const [search, setSearch] = useState('')
  const current = allBookings.find((b) => b.code === selected) ?? null
  const query = search.trim().toLowerCase()
  const visible = query
    ? bookings.filter((b) => `${b.client.couple} ${b.code} ${b.client.venue}`.toLowerCase().includes(query))
    : bookings

  return (
    <div>
      {/* kpis */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: 'En attente', value: String(kpis.pending.length), hint: 'à valider' },
          {
            label: 'Confirmées',
            value: String(kpis.confirmed.length),
            hint: `${money(kpis.pipeline)} de CA`,
          },
          { label: 'Acomptes encaissés', value: money(kpis.collected), hint: 'cette instance' },
          {
            label: 'Solde à recevoir',
            value: money(kpis.balanceDue),
            hint: 'sur les dossiers confirmés',
          },
        ].map((k) => (
          <Card key={k.label} className="p-4">
            <p className="text-[10.5px] font-bold uppercase tracking-[0.13em] text-ink/40">
              {k.label}
            </p>
            <p className="mt-1.5 font-display text-[26px] leading-none text-ink">{k.value}</p>
            <p className="mt-1 text-[11.5px] text-ink/40">{k.hint}</p>
          </Card>
        ))}
      </div>

      {/* filters */}
      <div className="mt-5 flex flex-wrap gap-1.5">
        {(
          [
            ['all', 'Toutes'],
            ['proposee', 'À valider'],
            ['confirmee', 'Confirmées'],
            ['acompte_paye', 'Acomptes reçus'],
            ['autres', 'Autres'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setFilter(id)}
            className={cn(
              'rounded-full px-3 py-1.5 text-[12px] font-semibold transition-colors',
              filter === id ? 'bg-brand text-white' : 'bg-ink/6 text-ink/60 hover:text-ink',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-4">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un couple, un code, un lieu…"
          aria-label="Rechercher une demande"
          size="sm"
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_1.05fr]">
        {/* list */}
        <div className="space-y-2.5">
          {visible.length === 0 && (
            <EmptyState
              icon={<ClipboardList className="h-10 w-10" />}
              title="Aucune demande"
              description="Les demandes envoyées depuis la page publique apparaîtront ici."
            />
          )}
          {visible.map((b) => (
            <button
              key={b.code}
              type="button"
              onClick={() => setSelected(b.code)}
              className={cn(
                'block w-full rounded-2xl border bg-card p-4 text-left transition-all',
                selected === b.code ? 'border-brand ring-2 ring-brand/15' : 'border-line hover:border-ink/25',
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-display text-[18px] leading-tight text-ink">
                    {b.client.couple}
                  </p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-[12.5px] text-ink/55">
                    <CalendarDays className="h-3.5 w-3.5 text-accent" />
                    {formatDateShort(b.date)} · {SLOT_LABEL[b.slot]}
                  </p>
                </div>
                <Badge tone={STATUS_TONE[b.status]}>{STATUS_LABEL[b.status]}</Badge>
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-line pt-2.5 text-[12px]">
                <span className="text-ink/50">
                  {b.formulaName}
                  {b.options.length > 0 ? ` +${b.options.length}` : ''}
                </span>
                <span className="font-semibold text-ink">{money(b.pricing.total)}</span>
              </div>
              <p className="mt-1.5 text-[11px] text-ink/35">{relativeTime(b.createdAt)}</p>
            </button>
          ))}
        </div>

        {/* detail */}
        {isDesktop ? (
          <div className="lg:sticky lg:top-32 lg:self-start">
            {current ? (
              <BookingDetail
                key={`${current.code}-${current.quoteVersion}-${current.status}`}
                provider={provider}
                booking={current}
                allBookings={allBookings}
                onChanged={onChanged}
                onOpenClient={() => onOpenClient(current.code)}
                onClose={() => setSelected(null)}
              />
            ) : (
              <EmptyState
                icon={<ClipboardList className="h-10 w-10" />}
                title="Sélectionnez une demande"
                description="Confirmez une date, réglez les options et suivez l’acompte."
              />
            )}
          </div>
        ) : (
          <Sheet
            open={!!current}
            onClose={() => setSelected(null)}
            title={<p className="font-display text-[20px] text-ink">Détail de la demande</p>}
          >
            {current && (
              <BookingDetail
                key={`${current.code}-${current.quoteVersion}-${current.status}`}
                provider={provider}
                booking={current}
                allBookings={allBookings}
                onChanged={onChanged}
                onOpenClient={() => onOpenClient(current.code)}
                onClose={() => setSelected(null)}
              />
            )}
          </Sheet>
        )}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------ detail card */

function BookingDetail({
  provider,
  booking,
  allBookings,
  onChanged,
  onOpenClient,
  onClose,
}: {
  provider: ProviderInstance
  booking: Booking
  allBookings: Booking[]
  onChanged: () => void
  onOpenClient: () => void
  onClose: () => void
}) {
  const toast = useToast()
  const [editing, setEditing] = useState(false)
  const [formulaId, setFormulaId] = useState(booking.formulaId)
  const [lines, setLines] = useState<BookingLine[]>(booking.options)
  const [note, setNote] = useState(booking.note ?? '')
  const [altDate, setAltDate] = useState('')
  const [addOptionId, setAddOptionId] = useState('')
  const [sheetOpen, setSheetOpen] = useState(false)
  const [manualPayOpen, setManualPayOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  const formula = provider.formulas.find((f) => f.id === formulaId) ?? provider.formulas[0]
  const totals = computeTotals(formula?.price ?? 0, lines, provider.depositPercent)
  const canEditQuote = booking.status === 'proposee' || booking.status === 'date_a_accepter'
  const blockedForAlt = unavailableDates(provider, allBookings, booking.code)

  const run = async (fn: () => Promise<unknown>, message: string) => {
    if (busy) return
    setBusy(true)
    try {
      await fn()
      onChanged()
      toast.push(message, 'success')
      setEditing(false)
    } catch (err) {
      toast.push(err instanceof Error ? err.message : 'Action impossible.', 'error')
    }
    setBusy(false)
  }

  const saveOptions = () =>
    run(
      () =>
        adjustBooking(
          provider.id,
          booking.code,
          {
            formulaId: formula.id,
            lines: lines.map((l) => ({ optionId: l.optionId, qty: l.qty, unitPrice: l.unitPrice })),
          },
          booking.quoteVersion,
        ),
      'Offre mise à jour. Le client voit le nouveau montant.',
    )

  const updateLine = (optionId: string, patch: Partial<BookingLine>) => {
    const maxQty = provider.options.find((o) => o.id === optionId)?.maxQty ?? 10_000
    setLines((prev) =>
      prev.map((l) => {
        if (l.optionId !== optionId) return l
        const qty = Math.max(0, Math.min(maxQty, Math.trunc(patch.qty ?? l.qty)))
        const unitPrice = Math.max(0, Math.round((patch.unitPrice ?? l.unitPrice) * 100) / 100)
        return { ...l, ...patch, qty, unitPrice, lineTotal: Math.round(unitPrice * qty * 100) / 100 }
      }),
    )
  }

  const addLine = (option: Option) => {
    setLines((prev) => [...prev, buildLine(option, 1)])
    setAddOptionId('')
  }

  const availableOptions = provider.options.filter((o) => !lines.some((l) => l.optionId === o.id))

  return (
    <Card padded={false}>
      <div className="flex items-start justify-between gap-3 border-b border-line p-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={STATUS_TONE[booking.status]}>{STATUS_LABEL[booking.status]}</Badge>
            <span className="font-mono text-[11px] text-ink/40">{booking.code}</span>
          </div>
          <h2 className="mt-2 font-display text-[24px] leading-tight text-ink">{booking.client.couple}</h2>
          <p className="mt-0.5 break-all text-[12.5px] text-ink/55">{booking.client.email} · {booking.client.phone}</p>
        </div>
        <button type="button" onClick={onClose} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-ink/40 hover:bg-ink/6" aria-label="Fermer">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-4 p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-line p-3">
            <p className="text-[10.5px] font-bold uppercase tracking-[0.13em] text-ink/40">Date demandée</p>
            <p className="mt-1 text-[13.5px] font-semibold text-ink">{formatDateLong(booking.date)}</p>
            <p className="text-[12.5px] text-ink/55">{SLOT_LABEL[booking.slot]} · {booking.client.eventType}</p>
          </div>
          <div className="rounded-xl border border-line p-3">
            <p className="text-[10.5px] font-bold uppercase tracking-[0.13em] text-ink/40">Lieu</p>
            <p className="mt-1 text-[13.5px] font-semibold text-ink">{booking.client.venue || '—'}</p>
            <p className="text-[12.5px] text-ink/55">{booking.client.city}{booking.client.guestCount ? ` · ${booking.client.guestCount} invités` : ''}</p>
          </div>
        </div>

        {booking.client.message && (
          <div className="rounded-xl border-l-2 border-accent/50 bg-accent/6 px-3.5 py-3 text-[13px] leading-relaxed text-ink/70">“{booking.client.message}”</div>
        )}

        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[10.5px] font-bold uppercase tracking-[0.13em] text-ink/40">Offre & options</p>
            {canEditQuote ? (
              <button type="button" onClick={() => setEditing((e) => !e)} className="text-[12px] font-semibold text-accent hover:underline">
                {editing ? 'Fermer sans enregistrer' : 'Régler'}
              </button>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11.5px] text-ink/40"><Lock className="h-3 w-3" /> Verrouillé</span>
            )}
          </div>

          {editing && canEditQuote ? (
            <div className="space-y-2.5">
              <Field label="Formule">
                <Select value={formulaId} onChange={(e) => setFormulaId(e.target.value)}>
                  {provider.formulas.map((f) => <option key={f.id} value={f.id}>{f.name} — {money(f.price)}</option>)}
                </Select>
              </Field>
              {lines.map((l) => (
                <div key={l.optionId} className="rounded-xl border border-line p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[13px] font-semibold text-ink">{l.name}</p>
                    <button type="button" onClick={() => setLines((prev) => prev.filter((x) => x.optionId !== l.optionId))} className="text-ink/30 hover:text-red-600" aria-label={`Retirer ${l.name}`}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <label className="block">
                      <span className="mb-1 block text-[11px] font-semibold text-ink/55">Quantité ({optionUnitLabel(l.unit, 2)})</span>
                      <Input type="number" min={0} max={provider.options.find((o) => o.id === l.optionId)?.maxQty} value={l.qty} onChange={(e) => updateLine(l.optionId, { qty: Number(e.target.value) || 0 })} size="sm" />
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-[11px] font-semibold text-ink/55">Prix unitaire (€)</span>
                      <Input type="number" min={0} step={0.01} value={l.unitPrice} onChange={(e) => updateLine(l.optionId, { unitPrice: Number(e.target.value) || 0 })} size="sm" />
                    </label>
                  </div>
                  <p className="mt-2 text-right text-[12.5px] font-semibold text-ink">{money(l.lineTotal)}</p>
                </div>
              ))}
              {availableOptions.length > 0 && (
                <div className="rounded-xl border border-dashed border-line p-3">
                  <p className="mb-2 text-[11.5px] font-semibold text-ink/55">Ajouter une option</p>
                  <div className="flex gap-2">
                    <Select value={addOptionId} onChange={(e) => setAddOptionId(e.target.value)} size="sm">
                      <option value="">Choisir…</option>
                      {availableOptions.map((o) => <option key={o.id} value={o.id}>{o.name} — {o.price > 0 ? money(o.price) : 'inclus'}</option>)}
                    </Select>
                    <Button size="sm" variant="outline" className="h-10 shrink-0" disabled={!addOptionId} onClick={() => { const opt = provider.options.find((o) => o.id === addOptionId); if (opt) addLine(opt) }} icon={<Plus className="h-3.5 w-3.5" />}>Ajouter</Button>
                  </div>
                </div>
              )}
              <div className="rounded-xl bg-ink/4 p-3">
                <div className="flex items-center justify-between text-[13px] text-ink/60"><span>Total</span><span className="font-display text-[20px] text-ink">{money(totals.total)}</span></div>
                <div className="flex items-center justify-between text-[12.5px] text-ink/50"><span>Acompte {provider.depositPercent} %</span><span>{money(totals.depositAmount)}</span></div>
                <Button className="mt-3" full size="sm" onClick={saveOptions} loading={busy}>Enregistrer les ajustements</Button>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-line">
              <div className="flex items-center justify-between border-b border-line px-3.5 py-2.5">
                <span className="text-[13.5px] font-semibold text-ink">{booking.formulaName}</span>
                <span className="text-[13.5px] font-medium text-ink">{money(booking.formulaPrice)}</span>
              </div>
              {booking.options.map((l) => (
                <div key={l.optionId} className="flex items-center justify-between border-b border-line px-3.5 py-2 last:border-b-0">
                  <span className="text-[13px] text-ink/70">{l.name}<span className="ml-1.5 text-[11px] text-ink/40">{optionUnitLabel(l.unit, l.qty)}</span></span>
                  <span className="text-[13px] text-ink">{l.lineTotal > 0 ? `+ ${money(l.lineTotal)}` : 'Inclus'}</span>
                </div>
              ))}
              <div className="flex items-center justify-between bg-ink/3 px-3.5 py-2.5">
                <span className="text-[13px] font-semibold text-ink">Total</span>
                <span className="font-display text-[19px] text-ink">{money(booking.pricing.total)}</span>
              </div>
            </div>
          )}
          {!canEditQuote && <p className="mt-2 text-[11.5px] leading-relaxed text-ink/45">Le devis est verrouillé après confirmation : le client paie exactement le montant affiché.</p>}
        </div>

        <div className={cn('rounded-xl border p-3', booking.deposit.status === 'paye' ? 'border-emerald-600/30 bg-emerald-600/5' : 'border-accent/40 bg-accent/6')}>
          <div className="flex items-center justify-between">
            <p className="flex items-center gap-1.5 text-[12.5px] font-semibold text-ink"><CreditCard className="h-3.5 w-3.5" /> Acompte {booking.pricing.depositPercent} %</p>
            <p className="font-display text-[19px] text-ink">{money(booking.deposit.amount)}</p>
          </div>
          {booking.deposit.status === 'paye' ? (
            <p className="mt-1.5 flex items-center gap-1.5 text-[12px] font-medium text-emerald-700"><Check className="h-3.5 w-3.5" /> Reçu · {booking.deposit.reference}</p>
          ) : (
            <p className="mt-1.5 text-[12px] text-ink/55">{booking.status === 'confirmee' ? 'En attente de règlement par le client' : 'Payable après confirmation de la date'}</p>
          )}
        </div>

        {editing && <p className="rounded-lg bg-accent/8 px-3 py-2 text-[12px] text-ink/60">Enregistrez ou fermez les ajustements avant d’agir sur la date.</p>}

        <div className="flex flex-wrap gap-2">
          {booking.status === 'proposee' && (
            <>
              <Button size="sm" variant="primary" disabled={editing || busy} onClick={() => run(() => confirmBooking(provider.id, booking.code, booking.quoteVersion), 'Date confirmée — le client peut payer l’acompte.')} icon={<CheckCircle2 className="h-3.5 w-3.5" />}>Confirmer la date</Button>
              <Button size="sm" variant="outline" disabled={editing || busy} onClick={() => setSheetOpen(true)}>Proposer une autre date</Button>
              <Button size="sm" variant="ghost" className="text-red-600" disabled={editing || busy} onClick={() => run(() => refuseBooking(provider.id, booking.code), 'Demande refusée.')}>Refuser</Button>
            </>
          )}
          {booking.status === 'date_a_accepter' && <p className="text-[12.5px] text-ink/55">En attente d’acceptation de la nouvelle date par le client.</p>}
          {booking.status === 'confirmee' && booking.deposit.status !== 'paye' && (
            <Button size="sm" variant="primary" disabled={busy} onClick={() => setManualPayOpen(true)} icon={<Wallet className="h-3.5 w-3.5" />}>Marquer l’acompte reçu</Button>
          )}
          <Button size="sm" variant="outline" onClick={onOpenClient} icon={<ArrowUpRight className="h-3.5 w-3.5" />}>Ouvrir côté client</Button>
        </div>

        <div>
          <p className="mb-1.5 text-[10.5px] font-bold uppercase tracking-[0.13em] text-ink/40">Note interne</p>
          <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Précisions sur la date, le matériel, le trajet…" size="sm" />
          {note !== (booking.note ?? '') && (
            <Button size="sm" variant="secondary" className="mt-2" loading={busy} onClick={() => run(() => saveBookingNote(provider.id, booking.code, note), 'Note enregistrée.')}>Enregistrer la note</Button>
          )}
        </div>

        <div>
          <p className="mb-2 text-[10.5px] font-bold uppercase tracking-[0.13em] text-ink/40">Historique</p>
          <ol className="space-y-2">
            {booking.timeline.map((t, i) => (
              <li key={i} className="flex gap-2.5">
                <span className={cn('mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full', t.actor === 'prestataire' ? 'bg-accent' : t.actor === 'systeme' ? 'bg-emerald-600' : 'bg-brand')} />
                <div>
                  <p className="text-[13px] font-medium text-ink">{t.label}</p>
                  {t.detail && <p className="text-[12px] text-ink/50">{t.detail}</p>}
                  <p className="text-[11px] text-ink/30">{formatStamp(t.at)}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>

      <Sheet
        open={sheetOpen}
        onClose={() => { if (!busy) setSheetOpen(false) }}
        title={<p className="font-display text-[22px] text-ink">Proposer une autre date</p>}
        footer={<Button full disabled={!altDate || busy} onClick={() => { void run(() => proposeAlternativeDate(provider.id, booking.code, altDate), 'Autre date proposée au client.'); setSheetOpen(false) }}>Proposer cette date</Button>}
      >
        <div className="space-y-4">
          <Calendar value={altDate || null} onChange={setAltDate} blockedDates={blockedForAlt} />
          <p className="text-[12.5px] leading-relaxed text-ink/55">Le client verra la nouvelle date sur son lien de suivi et devra l’accepter avant que vous puissiez confirmer.</p>
        </div>
      </Sheet>

      <Sheet
        open={manualPayOpen}
        onClose={() => { if (!busy) setManualPayOpen(false) }}
        title={<p className="font-display text-[22px] text-ink">Marquer l’acompte reçu</p>}
        footer={
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" disabled={busy} onClick={() => setManualPayOpen(false)}>Annuler</Button>
            <Button variant="primary" loading={busy} onClick={() => { void run(() => markDepositPaidManually(provider.id, booking.code), 'Acompte marqué comme reçu (démo).'); setManualPayOpen(false) }}>Confirmer la réception</Button>
          </div>
        }
      >
        <p className="text-[14px] leading-relaxed text-ink/65">
          Vous confirmez avoir reçu {money(booking.deposit.amount)} pour {booking.client.couple}. En démo, aucun fonds réel n’est manipulé ; le règlement sera enregistré dans cette instance uniquement.
        </p>
      </Sheet>
    </Card>
  )
}

/* --------------------------------------------------------------- offres */

function OffresTab({
  provider,
  onSave,
}: {
  provider: ProviderInstance
  onSave: (p: ProviderInstance) => void
}) {
  const toast = useToast()
  const [formulas, setFormulas] = useState(provider.formulas)
  const [options, setOptions] = useState(provider.options)
  const [saving, setSaving] = useState(false)

  const updateFormula = (id: string, patch: Partial<(typeof formulas)[number]>) =>
    setFormulas((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)))

  const updateOption = (id: string, patch: Partial<(typeof options)[number]>) =>
    setOptions((prev) => prev.map((o) => (o.id === id ? { ...o, ...patch } : o)))

  const save = async () => {
    setSaving(true)
    try {
      const updated = await saveProvider({ ...provider, formulas, options })
      onSave(updated)
      toast.push('Offres et options enregistrées.', 'success')
    } catch (err) {
      toast.push(err instanceof Error ? err.message : 'Enregistrement impossible.', 'error')
    }
    setSaving(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-[26px] text-ink">Formules & options</h2>
          <p className="text-[13px] text-ink/55">
            Ces tarifs sont ceux affichés sur votre page publique.
          </p>
        </div>
        <Button size="sm" onClick={save} loading={saving}>
          Enregistrer
        </Button>
      </div>

      {formulas.map((f) => (
        <Card key={f.id}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Nom">
              <Input
                value={f.name}
                onChange={(e) => updateFormula(f.id, { name: e.target.value })}
                size="sm"
              />
            </Field>
            <Field label="Accroche">
              <Input
                value={f.tagline}
                onChange={(e) => updateFormula(f.id, { tagline: e.target.value })}
                size="sm"
              />
            </Field>
            <Field label="Prix (€)">
              <Input
                type="number"
                min={0}
                value={f.price}
                onChange={(e) => updateFormula(f.id, { price: Number(e.target.value) || 0 })}
                size="sm"
              />
            </Field>
            <Field label="Durée">
              <Input
                value={f.duration}
                onChange={(e) => updateFormula(f.id, { duration: e.target.value })}
                size="sm"
              />
            </Field>
            <Field label="Description" className="sm:col-span-2">
              <Textarea
                value={f.description}
                onChange={(e) => updateFormula(f.id, { description: e.target.value })}
                size="sm"
              />
            </Field>
            <Field label="Prestations incluses (une par ligne)" className="sm:col-span-2">
              <Textarea
                value={f.includes.join('\n')}
                onChange={(e) =>
                  updateFormula(f.id, { includes: e.target.value.split('\n').filter(Boolean) })
                }
                size="sm"
              />
            </Field>
          </div>
          <label className="mt-3 flex items-center gap-2 text-[13px] text-ink/70">
            <input
              type="checkbox"
              checked={!!f.highlight}
              onChange={(e) => updateFormula(f.id, { highlight: e.target.checked })}
              className="h-4 w-4 accent-[var(--color-accent)]"
            />
            Mettre en avant comme formule populaire
          </label>
        </Card>
      ))}

      <div className="flex items-center justify-between pt-2">
        <h3 className="font-display text-[22px] text-ink">Options</h3>
        <Button
          size="sm"
          variant="outline"
          icon={<Plus className="h-3.5 w-3.5" />}
          onClick={() =>
            setOptions((prev) => [
              ...prev,
              {
                id: `o_${Date.now().toString(36)}`,
                name: 'Nouvelle option',
                description: '',
                price: 0,
                unit: 'forfait',
                maxQty: 1,
                group: 'Extras',
              },
            ])
          }
        >
          Ajouter
        </Button>
      </div>

      {options.map((o) => (
        <Card key={o.id}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Nom">
              <Input
                value={o.name}
                onChange={(e) => updateOption(o.id, { name: e.target.value })}
                size="sm"
              />
            </Field>
            <Field label="Prix (€)">
              <Input
                type="number"
                min={0}
                step={0.1}
                value={o.price}
                onChange={(e) => updateOption(o.id, { price: Number(e.target.value) || 0 })}
                size="sm"
              />
            </Field>
            <Field label="Description" className="sm:col-span-2">
              <Input
                value={o.description}
                onChange={(e) => updateOption(o.id, { description: e.target.value })}
                size="sm"
              />
            </Field>
            <Field label="Unité">
              <Select
                value={o.unit}
                onChange={(e) =>
                  updateOption(o.id, { unit: e.target.value as Option['unit'] })
                } size="sm">
                <option value="forfait">Forfait</option>
                <option value="heure">Par heure</option>
                <option value="personne">Par personne</option>
                <option value="km">Par kilomètre</option>
              </Select>
            </Field>
            <Field label="Groupe">
              <Input
                value={o.group}
                onChange={(e) => updateOption(o.id, { group: e.target.value })}
                size="sm"
              />
            </Field>
            <Field label="Quantité maximale" hint="1 pour un forfait unique, plus pour des heures ou des kilomètres.">
              <Input
                type="number"
                min={1}
                max={10000}
                value={o.maxQty}
                onChange={(e) => updateOption(o.id, { maxQty: Math.max(1, Math.trunc(Number(e.target.value) || 1)) })}
                size="sm"
              />
            </Field>
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="mt-2 text-red-600"
            icon={<Trash2 className="h-3.5 w-3.5" />}
            onClick={() => setOptions((prev) => prev.filter((x) => x.id !== o.id))}
          >
            Supprimer
          </Button>
        </Card>
      ))}
    </div>
  )
}

/* -------------------------------------------------------- disponibilites */

function DispoTab({
  provider,
  onSave,
}: {
  provider: ProviderInstance
  onSave: (p: ProviderInstance) => void
}) {
  const toast = useToast()
  const [blocked, setBlocked] = useState(provider.blockedDates)
  const [saving, setSaving] = useState(false)

  const toggle = (iso: string) =>
    setBlocked((prev) => (prev.includes(iso) ? prev.filter((d) => d !== iso) : [...prev, iso].sort()))

  const save = async () => {
    setSaving(true)
    try {
      const updated = await saveProvider({ ...provider, blockedDates: blocked })
      onSave(updated)
      toast.push('Disponibilités mises à jour.', 'success')
    } catch (err) {
      toast.push(err instanceof Error ? err.message : 'Enregistrement impossible.', 'error')
    }
    setSaving(false)
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-[26px] text-ink">Dates indisponibles</h2>
          <p className="text-[13px] text-ink/55">
            Les clients ne peuvent pas les proposer dans le calendrier de réservation.
          </p>
        </div>
        <Button size="sm" onClick={save} loading={saving}>
          Enregistrer
        </Button>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <Calendar
            value={null}
            onChange={toggle}
            blockedDates={blocked}
            minISO={todayISO()}
            allowBlocked
          />
          <p className="mt-3 text-[12px] leading-relaxed text-ink/50">
            Cliquez sur une date pour la basculer entre disponible et indisponible. Les dates passées
            restent bloquées. Les dates déjà confirmées ou payées sont automatiquement indisponibles côté client.
          </p>
        </Card>

        <Card>
          <p className="mb-3 text-[10.5px] font-bold uppercase tracking-[0.13em] text-ink/40">
            Liste ({blocked.length})
          </p>
          {blocked.length === 0 ? (
            <p className="text-[13.5px] text-ink/50">Aucune date bloquée pour le moment.</p>
          ) : (
            <div className="max-h-[320px] space-y-1.5 overflow-y-auto pr-1">
              {blocked.map((d) => (
                <div
                  key={d}
                  className="flex items-center justify-between rounded-lg bg-ink/4 px-3 py-2 text-[13px]"
                >
                  <span className="text-ink/70">{formatDateShort(d)}</span>
                  <button
                    type="button"
                    onClick={() => toggle(d)}
                    className="text-ink/35 hover:text-red-600"
                    aria-label="Débloquer"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------- reglages */

function ReglagesTab({
  provider,
  onSave,
}: {
  provider: ProviderInstance
  onSave: (p: ProviderInstance) => void
}) {
  const toast = useToast()
  const [draft, setDraft] = useState(provider)
  const [saving, setSaving] = useState(false)

  const set = <K extends keyof ProviderInstance>(key: K, value: ProviderInstance[K]) =>
    setDraft((d) => ({ ...d, [key]: value }))

  const save = async () => {
    setSaving(true)
    try {
      const updated = await saveProvider(draft)
      onSave(updated)
      toast.push('Réglages enregistrés.', 'success')
    } catch (err) {
      toast.push(err instanceof Error ? err.message : 'Enregistrement impossible.', 'error')
    }
    setSaving(false)
  }

  const regenerateCode = () => {
    const code = `${slugify(draft.displayName).slice(0, 4).toUpperCase() || 'PREST'}-${Math.floor(
      1000 + Math.random() * 8999,
    )}`
    set('accessCode', code)
    toast.push('Nouveau code généré. Enregistrez pour l’appliquer.', 'info')
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-[26px] text-ink">Réglages de l’instance</h2>
          <p className="text-[13px] text-ink/55">
            Ces réglages n’affectent que {draft.displayName}.
          </p>
        </div>
        <Button size="sm" onClick={save} loading={saving}>
          Enregistrer
        </Button>
      </div>

      <Card>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Nom affiché">
            <Input
              value={draft.displayName}
              onChange={(e) => set('displayName', e.target.value)}
              size="sm"
            />
          </Field>
          <Field label="Nom de l’activité">
            <Input
              value={draft.businessName}
              onChange={(e) => set('businessName', e.target.value)}
              size="sm"
            />
          </Field>
          <Field label="Accroche" className="sm:col-span-2">
            <Input
              value={draft.tagline}
              onChange={(e) => set('tagline', e.target.value)}
              size="sm"
            />
          </Field>
          <Field label="Ville">
            <Input
              value={draft.city}
              onChange={(e) => set('city', e.target.value)}
              size="sm"
            />
          </Field>
          <Field label="Zone d’intervention">
            <Input
              value={draft.zone}
              onChange={(e) => set('zone', e.target.value)}
              size="sm"
            />
          </Field>
          <Field label="Présentation" className="sm:col-span-2">
            <Textarea
              value={draft.bio}
              onChange={(e) => set('bio', e.target.value)}
              size="sm"
            />
          </Field>
          <Field label="E-mail">
            <Input
              value={draft.contact.email}
              onChange={(e) =>
                set('contact', { ...draft.contact, email: e.target.value })
              }
              size="sm"
            />
          </Field>
          <Field label="Téléphone">
            <Input
              value={draft.contact.phone}
              onChange={(e) =>
                set('contact', { ...draft.contact, phone: e.target.value })
              }
              size="sm"
            />
          </Field>
        </div>
      </Card>

      <Card>
        <p className="mb-3 flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-[0.13em] text-ink/40">
          <Wallet className="h-3.5 w-3.5" /> Acompte
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Pourcentage d’acompte" hint="Demandé au client après confirmation de la date. Les devis déjà créés conservent leur pourcentage.">
            <Input
              type="number"
              min={1}
              max={100}
              value={draft.depositPercent}
              onChange={(e) =>
                set('depositPercent', Math.min(100, Math.max(1, Number(e.target.value) || 1)))
              }
              size="sm"
            />
          </Field>
          <div className="flex items-end">
            <p className="rounded-xl bg-accent/10 px-3.5 py-2.5 text-[12.5px] leading-snug text-ink/65">
              Sur une formule à 890 €, l’acompte sera de{' '}
              <strong className="text-ink">
                {money((890 * draft.depositPercent) / 100)}
              </strong>
              .
            </p>
          </div>
        </div>
      </Card>

      <Card>
        <p className="mb-3 flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-[0.13em] text-ink/40">
          <Palette className="h-3.5 w-3.5" /> Apparence
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Couleur principale">
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={draft.palette.brand}
                onChange={(e) =>
                  set('palette', { ...draft.palette, brand: e.target.value })
                }
                className="h-10 w-12 shrink-0 cursor-pointer rounded-lg border border-line bg-card p-1"
              />
              <Input
                value={draft.palette.brand}
                onChange={(e) =>
                  set('palette', { ...draft.palette, brand: e.target.value })
                }
                size="sm"
              />
            </div>
          </Field>
          <Field label="Couleur d’accent">
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={draft.palette.accent}
                onChange={(e) =>
                  set('palette', { ...draft.palette, accent: e.target.value })
                }
                className="h-10 w-12 shrink-0 cursor-pointer rounded-lg border border-line bg-card p-1"
              />
              <Input
                value={draft.palette.accent}
                onChange={(e) =>
                  set('palette', { ...draft.palette, accent: e.target.value })
                }
                size="sm"
              />
            </div>
          </Field>
          <Field label="Fond de page">
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={draft.palette.paper}
                onChange={(e) =>
                  set('palette', { ...draft.palette, paper: e.target.value })
                }
                className="h-10 w-12 shrink-0 cursor-pointer rounded-lg border border-line bg-card p-1"
              />
              <Input
                value={draft.palette.paper}
                onChange={(e) =>
                  set('palette', { ...draft.palette, paper: e.target.value })
                }
                size="sm"
              />
            </div>
          </Field>
        </div>
      </Card>

      <Card>
        <p className="mb-3 flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-[0.13em] text-ink/40">
          <KeyRound className="h-3.5 w-3.5" /> Accès
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Code d’accès au back-office" hint="Unique à cette instance.">
            <div className="flex gap-2">
              <Input
                value={draft.accessCode}
                onChange={(e) => set('accessCode', e.target.value.toUpperCase())}
                className="font-mono tracking-widest"
                size="sm"
              />
              <Button
                size="sm"
                variant="outline"
                className="h-10 shrink-0"
                onClick={regenerateCode}
                icon={<RefreshCw className="h-3.5 w-3.5" />}
              >
                Générer
              </Button>
            </div>
          </Field>
          <Field label="Adresse publique" hint="Le lien envoyé à vos clients.">
            <div className="flex items-center gap-2">
              <span className="shrink-0 text-[13px] text-ink/40">/p/</span>
              <Input
                value={draft.slug}
                onChange={(e) => set('slug', slugify(e.target.value))}
                size="sm"
              />
            </div>
          </Field>
          <Field label="Déplacement inclus (km)" hint="Rayon inclus dans les formules ; au-delà, l’option kilométrique s’applique.">
            <Input
              type="number"
              min={0}
              max={500}
              value={draft.travelIncludedKm}
              onChange={(e) => set('travelIncludedKm', Math.min(500, Math.max(0, Number(e.target.value) || 0)))}
              size="sm"
            />
          </Field>
        </div>
      </Card>
    </div>
  )
}
