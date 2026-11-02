import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  ChevronRight,
  Clock,
  Info,
  Loader2,
  Music2,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { Button, Card, Field, Input, QtyStepper, Segmented, Select, Textarea, useToast } from '../components/ui'
import { Calendar } from '../components/Calendar'
import { DemoNotice } from '../components/DemoNotice'
import { createBooking, getProviderBySlug, getUnavailableDates, subscribeData } from '../lib/store'
import type { BookingLine, ProviderInstance, Slot } from '../lib/types'
import { EVENT_TYPES, SLOT_LABEL, formatDateLong, money, optionUnitLabel, todayISO } from '../lib/format'
import { buildLine, computeTotals, derivedOptionQty } from '../lib/pricing'
import { cn, uid } from '../lib/utils'

const STEPS = ['Formule', 'Options', 'Date', 'Vous', 'Validation']

interface FormState {
  formulaId: string
  optionQty: Record<string, number>
  date: string
  slot: Slot
  venue: string
  city: string
  eventType: string
  guestCount: number
  distanceKm: number
  message: string
  firstName: string
  lastName: string
  email: string
  phone: string
  consent: boolean
}

const EMPTY: FormState = {
  formulaId: '',
  optionQty: {},
  date: '',
  slot: 'soir',
  venue: '',
  city: '',
  eventType: EVENT_TYPES[0],
  guestCount: 0,
  distanceKm: 0,
  message: '',
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  consent: false,
}

const draftKey = (slug: string) => `cadence.v1.draft.${slug}`

function readDraft(slug: string): FormState {
  try {
    const raw = window.sessionStorage.getItem(draftKey(slug))
    if (raw) return { ...EMPTY, ...(JSON.parse(raw) as Partial<FormState>), consent: false }
  } catch {
    /* brouillon facultatif */
  }
  return EMPTY
}

export default function BookingWizard() {
  const { slug = '' } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const [params] = useSearchParams()
  const preselect = params.get('f')
  const [provider, setProvider] = useState<ProviderInstance | null>(null)
  const [loadedSlug, setLoadedSlug] = useState('')
  const loading = loadedSlug !== slug
  const [blockedDates, setBlockedDates] = useState<string[]>([])
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<FormState>(() => readDraft(slug))
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const requestId = useRef(uid('req'))

  useEffect(() => {
    let active = true
    const load = async () => {
      const p = await getProviderBySlug(slug)
      if (!active) return
      setProvider(p)
      setLoadedSlug(slug)
      if (p) {
        const dates = await getUnavailableDates(p.id)
        if (!active) return
        setBlockedDates(dates)
        setForm((f) => {
          const valid = preselect && p.formulas.some((x) => x.id === preselect) ? preselect : f.formulaId
          const stillValid = valid && p.formulas.some((x) => x.id === valid) ? valid : ''
          return { ...f, formulaId: stillValid, city: f.city || p.city }
        })
      }
    }
    void load()
    const unsubscribe = subscribeData(() => void load())
    return () => {
      active = false
      unsubscribe()
    }
  }, [slug, preselect])

  // Brouillon conservé uniquement dans l'onglet courant, effacé après envoi.
  useEffect(() => {
    try {
      window.sessionStorage.setItem(draftKey(slug), JSON.stringify(form))
    } catch {
      /* stockage indisponible : le parcours reste utilisable */
    }
  }, [form, slug])

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    requestId.current = uid('req')
    setForm((f) => ({ ...f, [key]: value }))
  }

  const formula = useMemo(
    () => provider?.formulas.find((f) => f.id === form.formulaId) ?? null,
    [provider, form.formulaId],
  )

  const effectiveQty = useCallback(
    (optionId: string): number => {
      if (!provider) return 0
      const opt = provider.options.find((o) => o.id === optionId)
      if (!opt) return 0
      const selected = (form.optionQty[optionId] ?? 0) > 0
      if (!selected) return 0
      if (opt.unit === 'personne' || opt.unit === 'km') {
        return derivedOptionQty(opt, {
          guestCount: form.guestCount,
          distanceKm: form.distanceKm,
          travelIncludedKm: provider.travelIncludedKm,
        })
      }
      return Math.min(opt.maxQty, Math.max(0, form.optionQty[optionId] ?? 0))
    },
    [provider, form.optionQty, form.guestCount, form.distanceKm],
  )

  const lines: BookingLine[] = useMemo(() => {
    if (!provider) return []
    return provider.options
      .map((o) => buildLine(o, effectiveQty(o.id)))
      .filter((l) => l.qty > 0)
  }, [provider, effectiveQty])

  const totals = useMemo(
    () => computeTotals(formula?.price ?? 0, lines, provider?.depositPercent ?? 30),
    [formula, lines, provider],
  )

  const validate = (index: number): boolean => {
    const e: Record<string, string> = {}
    if (index === 0 && !form.formulaId) e.formulaId = 'Choisissez une formule pour continuer.'
    if (index === 2) {
      if (!form.date) e.date = 'Proposez une date à votre prestataire.'
      else if (form.date < todayISO()) e.date = 'Choisissez une date à venir.'
      else if (blockedDates.includes(form.date)) e.date = 'Cette date n’est plus disponible. Choisissez-en une autre.'
      if (!form.venue.trim()) e.venue = 'Indiquez le lieu de l’événement.'
      if (!form.city.trim()) e.city = 'Indiquez la ville.'
      if (!Number.isInteger(form.guestCount) || form.guestCount < 1 || form.guestCount > 600) {
        e.guestCount = 'Indiquez un nombre d’invités entre 1 et 600.'
      }
      if (!Number.isFinite(form.distanceKm) || form.distanceKm < 0 || form.distanceKm > 2000) {
        e.distanceKm = 'Distance invalide (0 à 2 000 km).'
      }
    }
    if (index === 3) {
      if (!form.firstName.trim()) e.firstName = 'Prénom requis.'
      if (!form.lastName.trim()) e.lastName = 'Nom requis.'
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim())) e.email = 'Adresse e-mail invalide.'
      if (form.phone.replace(/\D/g, '').length < 9) e.phone = 'Numéro de téléphone invalide.'
    }
    if (index === 4 && !form.consent) e.consent = 'Merci d’accepter les conditions de la démo pour envoyer la demande.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const next = () => {
    if (!validate(step)) return
    setStep((s) => Math.min(STEPS.length - 1, s + 1))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const back = () => {
    setErrors({})
    setStep((s) => Math.max(0, s - 1))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const submit = async () => {
    if (!provider || !formula || submitting) return
    for (const index of [0, 2, 3, 4]) {
      if (!validate(index)) {
        setStep(index)
        window.scrollTo({ top: 0, behavior: 'smooth' })
        return
      }
    }
    setSubmitting(true)
    try {
      const booking = await createBooking(provider.id, {
        client: {
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          couple: `${form.firstName.trim()} & ${form.lastName.trim()}`,
          city: form.city.trim(),
          venue: form.venue.trim(),
          eventType: form.eventType,
          guestCount: form.guestCount,
          distanceKm: form.distanceKm,
          message: form.message.trim(),
        },
        formulaId: formula.id,
        options: lines.map((l) => ({ optionId: l.optionId, qty: l.qty })),
        date: form.date,
        slot: form.slot,
        requestId: requestId.current,
      })
      try {
        window.sessionStorage.removeItem(draftKey(slug))
      } catch {
        /* ignore */
      }
      toast.push('Demande enregistrée. Suivez la confirmation sur votre lien.', 'success')
      navigate(`/r/${provider.slug}/${booking.code}`)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Une erreur est survenue.'
      toast.push(message, 'error')
      if (/date/i.test(message)) {
        setBlockedDates(await getUnavailableDates(provider.id))
        setStep(2)
        setErrors({ date: message })
      }
      setSubmitting(false)
    }
  }

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
        <Card className="max-w-sm text-center">
          <p className="font-display text-xl text-ink">Prestataire introuvable</p>
          <Link to="/">
            <Button className="mt-4" variant="outline">Retour</Button>
          </Link>
        </Card>
      </div>
    )
  }

  const optionGroups = Array.from(
    provider.options.reduce((map, o) => {
      const list = map.get(o.group) ?? []
      list.push(o)
      map.set(o.group, list)
      return map
    }, new Map<string, typeof provider.options>()),
  )

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
      <header className="sticky top-0 z-40 border-b border-line/70 bg-paper/92 backdrop-blur-md">
        <div className="mx-auto max-w-2xl px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => (step === 0 ? navigate(`/p/${provider.slug}`) : back())}
              className="flex items-center gap-1.5 text-[13px] font-medium text-ink/60 transition-colors hover:text-ink"
            >
              <ArrowLeft className="h-4 w-4" /> {step === 0 ? 'Retour' : 'Précédent'}
            </button>
            <div className="flex min-w-0 items-center gap-2">
              <Music2 className="h-4 w-4 shrink-0 text-accent" />
              <span className="truncate text-[13px] font-semibold text-ink">{provider.displayName}</span>
            </div>
          </div>
          <ol className="mt-3 flex items-center gap-1" aria-label="Étapes de réservation">
            {STEPS.map((label, i) => (
              <li key={label} className="flex flex-1 flex-col gap-1.5" aria-current={i === step ? 'step' : undefined}>
                <span
                  className={cn(
                    'h-1 w-full rounded-full transition-colors',
                    i < step && 'bg-accent',
                    i === step && 'bg-brand',
                    i > step && 'bg-line',
                  )}
                />
                <span
                  className={cn(
                    'hidden text-[10.5px] font-semibold uppercase tracking-wide sm:block',
                    i === step ? 'text-ink' : 'text-ink/35',
                  )}
                >
                  {label}
                </span>
              </li>
            ))}
          </ol>
          <p className="mt-2 text-[11px] font-medium text-ink/50 sm:hidden">
            Étape {step + 1}/5 · {STEPS[step]}
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 pb-44 pt-6">
        <DemoNotice className="mb-6" />

        {step === 0 && (
          <section>
            <h1 className="font-display text-[32px] leading-tight text-ink">
              Quelle formule pour votre mariage ?
            </h1>
            <p className="mt-2 text-[14.5px] text-ink/55">
              Vous pourrez ajuster les options à l’étape suivante. Le tarif reste modifiable
              par {provider.displayName} avant confirmation.
            </p>
            {errors.formulaId && <p className="mt-3 text-[12.5px] font-medium text-red-600">{errors.formulaId}</p>}
            <div className="mt-6 space-y-3">
              {provider.formulas.map((f) => {
                const active = form.formulaId === f.id
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => set('formulaId', f.id)}
                    aria-pressed={active}
                    className={cn(
                      'block w-full rounded-2xl border bg-card p-4 text-left transition-all',
                      active ? 'border-brand ring-2 ring-brand/15' : 'border-line hover:border-ink/25',
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="font-display text-[22px] leading-tight text-ink">{f.name}</h3>
                        <p className="mt-0.5 text-[13px] text-accent">{f.tagline}</p>
                      </div>
                      <span
                        className={cn(
                          'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border',
                          active ? 'border-brand bg-brand text-white' : 'border-line',
                        )}
                      >
                        {active && <Check className="h-3.5 w-3.5" />}
                      </span>
                    </div>
                    <p className="mt-3 text-[13.5px] leading-relaxed text-ink/60">{f.description}</p>
                    <ul className="mt-3 space-y-1.5">
                      {f.includes.map((inc) => (
                        <li key={/déplacement inclus/i.test(inc) ? `Déplacement inclus dans ${provider.travelIncludedKm} km` : inc} className="flex items-start gap-2 text-[13px] text-ink/65">
                          <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" /> {/déplacement inclus/i.test(inc) ? `Déplacement inclus dans ${provider.travelIncludedKm} km` : inc}
                        </li>
                      ))}
                    </ul>
                    <div className="mt-4 flex items-center justify-between border-t border-line pt-3">
                      <span className="inline-flex items-center gap-1.5 text-[12.5px] text-ink/50">
                        <Clock className="h-3.5 w-3.5" /> {f.duration}
                      </span>
                      <span className="font-display text-[24px] leading-none text-ink">{money(f.price)}</span>
                    </div>
                  </button>
                )
              })}
            </div>
          </section>
        )}

        {step === 1 && (
          <section>
            <h1 className="font-display text-[32px] leading-tight text-ink">Composez votre prestation</h1>
            <p className="mt-2 text-[14.5px] text-ink/55">
              Ajoutez uniquement ce dont vous avez besoin. Le total se met à jour immédiatement.
            </p>
            {optionGroups.length === 0 && (
              <Card className="mt-6 text-[14px] text-ink/60">Aucune option pour cette formule. Continuez vers le choix de la date.</Card>
            )}
            {optionGroups.map(([group, options]) => (
              <div key={group} className="mt-6">
                <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-ink/40">{group}</p>
                <Card padded={false} className="divide-y divide-line">
                  {options.map((o) => {
                    const selected = (form.optionQty[o.id] ?? 0) > 0
                    const derived = o.unit === 'personne' || o.unit === 'km'
                    const qty = effectiveQty(o.id)
                    const lineTotal = Math.round(o.price * qty * 100) / 100
                    return (
                      <div key={o.id} className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-[14.5px] font-semibold text-ink">{o.name}</p>
                            <p className="mt-0.5 text-[13px] leading-relaxed text-ink/55">{o.description}</p>
                          </div>
                          <div className="shrink-0 text-right">
                            <p className="text-[14px] font-semibold text-ink">{o.price > 0 ? money(o.price) : 'Inclus'}</p>
                            {o.price > 0 && o.unit !== 'forfait' && (
                              <p className="text-[11px] text-ink/45">{optionUnitLabel(o.unit, 1)}</p>
                            )}
                          </div>
                        </div>
                        <div className="mt-3 flex items-center justify-between gap-3">
                          {derived ? (
                            <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
                              <p className="text-[12px] leading-snug text-ink/45">
                                {o.unit === 'personne'
                                  ? `Calculé sur le nombre d’invités (${form.guestCount || 'à renseigner'})`
                                  : `Au-delà de ${provider.travelIncludedKm} km inclus · distance : ${form.distanceKm || 0} km`}
                              </p>
                              <Button
                                size="sm"
                                variant={selected ? 'primary' : 'outline'}
                                onClick={() => set('optionQty', { ...form.optionQty, [o.id]: selected ? 0 : 1 })}
                              >
                                {selected ? 'Ajouté' : 'Ajouter'}
                              </Button>
                            </div>
                          ) : o.maxQty > 1 ? (
                            <QtyStepper
                              value={form.optionQty[o.id] ?? 0}
                              min={0}
                              max={o.maxQty}
                              suffix={o.unit === 'heure' ? ' h' : ''}
                              onChange={(v) => set('optionQty', { ...form.optionQty, [o.id]: v })}
                            />
                          ) : (
                            <Button
                              size="sm"
                              variant={selected ? 'primary' : 'outline'}
                              onClick={() => set('optionQty', { ...form.optionQty, [o.id]: selected ? 0 : 1 })}
                            >
                              {selected ? 'Ajouté' : 'Ajouter'}
                            </Button>
                          )}
                          {selected && qty > 0 && (
                            <span className="shrink-0 text-[13px] font-semibold text-ink">
                              {lineTotal > 0 ? `+ ${money(lineTotal)}` : 'Inclus'}
                              {derived && <span className="ml-1 text-[11px] font-normal text-ink/45">({qty} {o.unit === 'km' ? 'km' : 'pers.'})</span>}
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </Card>
              </div>
            ))}
          </section>
        )}

        {step === 2 && (
          <section>
            <h1 className="font-display text-[32px] leading-tight text-ink">Proposez votre date</h1>
            <p className="mt-2 text-[14.5px] text-ink/55">
              Les dates indisponibles sont grisées. {provider.displayName} confirmera la demande depuis son back-office.
            </p>
            <div className="mt-6">
              <Calendar
                value={form.date || null}
                onChange={(iso) => set('date', iso)}
                blockedDates={blockedDates}
                minISO={todayISO()}
              />
              {errors.date && <p className="mt-2 text-[12.5px] font-medium text-red-600">{errors.date}</p>}
            </div>
            {form.date && (
              <div className="mt-3 flex items-center gap-2 rounded-xl bg-accent/10 px-3.5 py-2.5 text-[13px] font-medium text-ink">
                <CalendarDays className="h-4 w-4 text-accent" /> {formatDateLong(form.date)}
              </div>
            )}
            <div className="mt-6">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-ink/40">Créneau</p>
              <Segmented
                value={form.slot}
                onChange={(v) => set('slot', v)}
                options={[
                  { value: 'matin', label: SLOT_LABEL.matin },
                  { value: 'aprem', label: SLOT_LABEL.aprem },
                  { value: 'soir', label: SLOT_LABEL.soir },
                ]}
              />
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field label="Lieu de l’événement" required error={errors.venue} hint="Nom du domaine, château, mairie…">
                <Input value={form.venue} onChange={(e) => set('venue', e.target.value)} placeholder="Château de Vayres" />
              </Field>
              <Field label="Ville" required error={errors.city}>
                <Input value={form.city} onChange={(e) => set('city', e.target.value)} placeholder={provider.city} />
              </Field>
              <Field label="Type d’événement">
                <Select value={form.eventType} onChange={(e) => set('eventType', e.target.value)}>
                  {EVENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </Select>
              </Field>
              <Field label="Nombre d’invités" required error={errors.guestCount} hint="Sert à calculer les options par personne.">
                <Input
                  type="number"
                  min={1}
                  max={600}
                  value={form.guestCount || ''}
                  onChange={(e) => set('guestCount', Math.trunc(Number(e.target.value) || 0))}
                  placeholder="120"
                />
              </Field>
              <Field
                label="Distance depuis la ville de départ (km)"
                error={errors.distanceKm}
                hint={`Déplacement inclus dans ${provider.travelIncludedKm} km. Au-delà, l’option kilométrique s’applique si vous l’ajoutez.`}
              >
                <Input
                  type="number"
                  min={0}
                  max={2000}
                  value={form.distanceKm || ''}
                  onChange={(e) => set('distanceKm', Math.max(0, Number(e.target.value) || 0))}
                  placeholder="0"
                />
              </Field>
            </div>
            <Field label="Message pour le prestataire" className="mt-4">
              <Textarea
                value={form.message}
                onChange={(e) => set('message', e.target.value)}
                placeholder="Type de musique, sortie de cérémonie, playlist, contraintes…"
              />
            </Field>
          </section>
        )}

        {step === 3 && (
          <section>
            <h1 className="font-display text-[32px] leading-tight text-ink">Vos coordonnées</h1>
            <p className="mt-2 text-[14.5px] text-ink/55">
              Elles servent à traiter votre demande. En démo, aucun e-mail n’est envoyé : la confirmation
              est visible sur votre lien de suivi.
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <Field label="Prénom" required error={errors.firstName}>
                <Input value={form.firstName} onChange={(e) => set('firstName', e.target.value)} placeholder="Camille" autoComplete="given-name" />
              </Field>
              <Field label="Nom" required error={errors.lastName}>
                <Input value={form.lastName} onChange={(e) => set('lastName', e.target.value)} placeholder="Durand" autoComplete="family-name" />
              </Field>
              <Field label="E-mail" required error={errors.email} className="sm:col-span-2">
                <Input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="camille.durand@example.fr" autoComplete="email" inputMode="email" />
              </Field>
              <Field label="Téléphone" required error={errors.phone} className="sm:col-span-2">
                <Input type="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="06 12 34 56 78" autoComplete="tel" inputMode="tel" />
              </Field>
            </div>
            <div className="mt-6 rounded-2xl border border-line bg-card p-4">
              <p className="flex items-center gap-2 text-[13px] font-semibold text-ink">
                <ShieldCheck className="h-4 w-4 text-accent" /> Données de démonstration
              </p>
              <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink/55">
                Utilisez de préférence des coordonnées fictives. Dans cette démo, tout reste dans votre
                navigateur ; aucune donnée n’est transmise à un serveur ni partagée entre prestataires.
              </p>
            </div>
          </section>
        )}

        {step === 4 && formula && (
          <section>
            <h1 className="font-display text-[32px] leading-tight text-ink">Récapitulatif</h1>
            <p className="mt-2 text-[14.5px] text-ink/55">
              Votre date sera proposée à {provider.displayName}. L’acompte ne sera payable qu’après confirmation.
            </p>
            <Card className="mt-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-display text-[22px] leading-tight text-ink">{formula.name}</p>
                  <p className="text-[13px] text-accent">{formula.tagline}</p>
                </div>
                <p className="font-display text-[22px] text-ink">{money(formula.price)}</p>
              </div>
              {form.date && (
                <div className="mt-4 flex items-center gap-2 border-t border-line pt-3 text-[13.5px] text-ink/70">
                  <CalendarDays className="h-4 w-4 text-accent" /> {formatDateLong(form.date)} · {SLOT_LABEL[form.slot]}
                </div>
              )}
              {lines.length > 0 && (
                <div className="mt-3 space-y-2 border-t border-line pt-3">
                  {lines.map((l) => (
                    <div key={l.optionId} className="flex items-center justify-between gap-3">
                      <span className="text-[13.5px] text-ink/70">
                        {l.name}
                        <span className="ml-1.5 text-[11.5px] text-ink/40">{optionUnitLabel(l.unit, l.qty)}</span>
                      </span>
                      <span className="text-[13.5px] font-medium text-ink">{l.lineTotal > 0 ? `+ ${money(l.lineTotal)}` : 'Inclus'}</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-4 space-y-2 border-t border-line pt-3">
                <div className="flex items-center justify-between text-[13.5px] text-ink/60"><span>Formule</span><span>{money(totals.subtotal)}</span></div>
                <div className="flex items-center justify-between text-[13.5px] text-ink/60"><span>Options</span><span>{money(totals.optionsTotal)}</span></div>
                <div className="flex items-baseline justify-between border-t border-line pt-2.5">
                  <span className="font-semibold text-ink">Total TTC</span>
                  <span className="font-display text-[28px] leading-none text-ink">{money(totals.total)}</span>
                </div>
              </div>
            </Card>
            <Card className="mt-3" variant="accent">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/20 text-accent"><Sparkles className="h-4 w-4" /></span>
                <div>
                  <p className="text-[14px] font-semibold text-ink">Acompte de {totals.depositPercent} % · {money(totals.depositAmount)}</p>
                  <p className="mt-1 text-[12.5px] leading-relaxed text-ink/60">
                    Payable uniquement après confirmation de la date. Solde restant : {money(totals.balanceDue)}.
                    Cet acompte est destiné à {provider.displayName} uniquement, sans partage avec un autre prestataire.
                  </p>
                </div>
              </div>
            </Card>
            <div className="mt-5 rounded-2xl border border-line bg-card p-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-ink/40">Client</p>
              <p className="mt-1.5 text-[14px] font-semibold text-ink">{form.firstName} {form.lastName}</p>
              <p className="text-[13px] text-ink/60">{form.email} · {form.phone}</p>
              <p className="mt-2 text-[13px] text-ink/60">
                {form.eventType}{form.venue ? ` · ${form.venue}` : ''}{form.city ? ` (${form.city})` : ''}{form.guestCount ? ` · ${form.guestCount} invités` : ''}
              </p>
              {form.message && <p className="mt-2.5 border-l-2 border-accent/40 pl-3 text-[13px] italic leading-relaxed text-ink/60">{form.message}</p>}
            </div>
            <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl border border-line bg-card p-3.5">
              <input
                type="checkbox"
                checked={form.consent}
                onChange={(e) => set('consent', e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--color-accent)]"
              />
              <span className="text-[12.5px] leading-relaxed text-ink/65">
                Je comprends qu’il s’agit d’une démonstration : aucun débit réel, aucun e-mail envoyé.
                J’ai pris connaissance des <Link to="/legal" target="_blank" className="font-semibold text-accent underline">informations légales</Link>.
              </span>
            </label>
            {errors.consent && <p className="mt-2 text-[12.5px] font-medium text-red-600">{errors.consent}</p>}
            <div className="mt-4 flex items-start gap-2 rounded-xl bg-ink/4 px-3.5 py-3 text-[12px] leading-relaxed text-ink/55">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              En envoyant, vous proposez une date — vous ne payez rien maintenant. Votre lien de suivi
              affichera la confirmation du prestataire puis le paiement simulé de l’acompte.
            </div>
          </section>
        )}
      </main>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-paper/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 pt-3 pb-safe">
          {formula ? (
            <div className="min-w-0">
              <p className="truncate text-[11px] uppercase tracking-wider text-ink/45">{formula.name}</p>
              <p className="font-display text-[20px] leading-none text-ink">{money(totals.total)}</p>
            </div>
          ) : (
            <p className="text-[12.5px] text-ink/45">Choisissez une formule</p>
          )}
          {step < 4 ? (
            <Button full size="lg" variant="accent" className="flex-1" onClick={next}>
              Continuer <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button full size="lg" variant="accent" className="flex-1" loading={submitting} onClick={submit} icon={<ArrowRight className="h-4 w-4" />}>
              Envoyer ma demande
            </Button>
          )}
        </div>
        {totals.depositAmount > 0 && step < 4 && (
          <p className="mx-auto max-w-2xl px-4 pb-2 text-center text-[11px] text-ink/40">
            Acompte de {totals.depositPercent} % ({money(totals.depositAmount)}) après confirmation
          </p>
        )}
      </div>
    </div>
  )
}
