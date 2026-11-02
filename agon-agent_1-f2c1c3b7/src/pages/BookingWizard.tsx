import { useEffect, useMemo, useState } from 'react'
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
  MapPin,
  Music2,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { Badge, Button, Card, Field, Input, QtyStepper, Segmented, Select, Textarea, useToast } from '../components/ui'
import { Calendar } from '../components/Calendar'
import { createBooking, getProviderBySlug } from '../lib/store'
import type { BookingLine, ProviderInstance, Slot } from '../lib/types'
import { EVENT_TYPES, SLOT_LABEL, formatDateLong, money, optionUnitLabel, todayISO } from '../lib/format'
import { buildLine, computeTotals } from '../lib/pricing'
import { cn } from '../lib/utils'

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
}

export default function BookingWizard() {
  const { slug = '' } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const [params] = useSearchParams()
  const [provider, setProvider] = useState<ProviderInstance | null>(null)
  const [loading, setLoading] = useState(true)
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<FormState>(EMPTY)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let active = true
    getProviderBySlug(slug).then((p) => {
      if (!active) return
      setProvider(p)
      setLoading(false)
      if (p) {
        const preselect = params.get('f')
        const valid = preselect && p.formulas.some((f) => f.id === preselect) ? preselect : ''
        setForm((f) => ({ ...f, formulaId: valid, city: f.city || p.city }))
      }
    })
    return () => {
      active = false
    }
  }, [slug, params])

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }))

  const formula = useMemo(
    () => provider?.formulas.find((f) => f.id === form.formulaId) ?? null,
    [provider, form.formulaId],
  )

  const effectiveQty = (optionId: string) => {
    if (!provider) return 0
    const opt = provider.options.find((o) => o.id === optionId)
    if (!opt) return 0
    if (opt.unit === 'personne') return Math.min(opt.maxQty, Math.max(0, form.guestCount))
    if (opt.unit === 'km') return Math.min(opt.maxQty, Math.max(0, form.distanceKm))
    return form.optionQty[optionId] ?? 0
  }

  const lines: BookingLine[] = useMemo(() => {
    if (!provider) return []
    return provider.options
      .filter((o) => effectiveQty(o.id) > 0)
      .map((o) => buildLine(o, effectiveQty(o.id)))
  }, [provider, form.optionQty, form.guestCount, form.distanceKm])

  const totals = useMemo(
    () => computeTotals(formula?.price ?? 0, lines, provider?.depositPercent ?? 30),
    [formula, lines, provider],
  )

  const validate = (index: number): boolean => {
    const e: Record<string, string> = {}
    if (index === 0 && !form.formulaId) e.formulaId = 'Choisissez une formule pour continuer.'
    if (index === 2) {
      if (!form.date) e.date = 'Proposez une date à votre prestataire.'
      if (form.guestCount < 0) e.guestCount = 'Nombre invalide.'
    }
    if (index === 3) {
      if (!form.firstName.trim()) e.firstName = 'Prénom requis.'
      if (!form.lastName.trim()) e.lastName = 'Nom requis.'
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email)) e.email = 'Adresse e-mail invalide.'
      if (form.phone.replace(/\D/g, '').length < 9) e.phone = 'Numéro de téléphone invalide.'
    }
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
    if (!provider || !formula) return
    if (!validate(3)) {
      setStep(3)
      return
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
          city: form.city || provider.city,
          venue: form.venue,
          eventType: form.eventType,
          guestCount: form.guestCount,
          distanceKm: form.distanceKm,
          message: form.message.trim(),
        },
        formulaId: formula.id,
        optionLines: lines,
        date: form.date,
        slot: form.slot,
      })
      toast.push('Demande envoyée au prestataire.', 'success')
      navigate(`/r/${provider.slug}/${booking.code}`)
    } catch (err) {
      toast.push(err instanceof Error ? err.message : 'Une erreur est survenue.', 'error')
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
            <Button className="mt-4" variant="outline">
              Retour
            </Button>
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
      {/* ------------------------------------------------------- top bar */}
      <header className="sticky top-0 z-40 border-b border-line/70 bg-paper/92 backdrop-blur-md">
        <div className="mx-auto max-w-2xl px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => (step === 0 ? navigate(`/p/${provider.slug}`) : back())}
              className="flex items-center gap-1.5 text-[13px] font-medium text-ink/60 transition-colors hover:text-ink"
            >
              <ArrowLeft className="h-4 w-4" /> {step === 0 ? 'Retour' : 'Précédent'}
            </button>
            <div className="flex items-center gap-2">
              <Music2 className="h-4 w-4 text-accent" />
              <span className="text-[13px] font-semibold text-ink">{provider.displayName}</span>
            </div>
          </div>
          <ol className="mt-3 flex items-center gap-1">
            {STEPS.map((label, i) => (
              <li key={label} className="flex flex-1 flex-col gap-1.5">
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
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 pb-44 pt-6">
        {/* -------------------------------------------------- 1. formule */}
        {step === 0 && (
          <section>
            <h1 className="font-display text-[32px] leading-tight text-ink">
              Quelle formule pour votre mariage ?
            </h1>
            <p className="mt-2 text-[14.5px] text-ink/55">
              Vous pourrez ajuster les options à l’étape suivante. Le tarif reste modifiable
              par {provider.displayName} avant confirmation.
            </p>
            <div className="mt-6 space-y-3">
              {provider.formulas.map((f) => {
                const active = form.formulaId === f.id
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => set('formulaId', f.id)}
                    className={cn(
                      'block w-full rounded-2xl border bg-card p-4 text-left transition-all',
                      active
                        ? 'border-brand ring-2 ring-brand/15'
                        : 'border-line hover:border-ink/25',
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-display text-[22px] leading-tight text-ink">{f.name}</p>
                        <p className="text-[13px] text-accent">{f.tagline}</p>
                      </div>
                      <span
                        className={cn(
                          'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                          active ? 'border-brand bg-brand text-white' : 'border-line',
                        )}
                      >
                        {active && <Check className="h-3.5 w-3.5" />}
                      </span>
                    </div>
                    <p className="mt-2.5 text-[13.5px] leading-relaxed text-ink/60">{f.description}</p>
                    <ul className="mt-3 space-y-1">
                      {f.includes.map((inc) => (
                        <li key={inc} className="flex items-start gap-2 text-[12.5px] text-ink/55">
                          <Check className="mt-0.5 h-3 w-3 shrink-0 text-accent" />
                          {inc}
                        </li>
                      ))}
                    </ul>
                    <div className="mt-3.5 flex items-baseline justify-between border-t border-line pt-3">
                      <span className="inline-flex items-center gap-1 text-[12px] text-ink/45">
                        <Clock className="h-3 w-3" /> {f.duration}
                      </span>
                      <span className="font-display text-[24px] leading-none text-ink">
                        {money(f.price)}
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
            {errors.formulaId && (
              <p className="mt-3 text-[12.5px] font-medium text-red-600">{errors.formulaId}</p>
            )}
          </section>
        )}

        {/* -------------------------------------------------- 2. options */}
        {step === 1 && (
          <section>
            <h1 className="font-display text-[32px] leading-tight text-ink">Ajoutez vos options</h1>
            <p className="mt-2 text-[14.5px] text-ink/55">
              Tout est optionnel. Le prestataire pourra encore ajuster ces montants sur votre
              dossier.
            </p>

            {optionGroups.map(([group, options]) => (
              <div key={group} className="mt-6">
                <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-ink/40">
                  {group}
                </p>
                <Card padded={false} className="divide-y divide-line">
                  {options.map((o) => {
                    const qty = effectiveQty(o.id)
                    const derived = o.unit === 'personne' || o.unit === 'km'
                    const active = qty > 0
                    return (
                      <div key={o.id} className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-[14.5px] font-semibold text-ink">{o.name}</p>
                            <p className="mt-0.5 text-[13px] leading-relaxed text-ink/55">
                              {o.description}
                            </p>
                          </div>
                          <div className="shrink-0 text-right">
                            <p className="text-[14px] font-semibold text-ink">
                              {o.price > 0 ? money(o.price) : 'Inclus'}
                            </p>
                            {o.price > 0 && o.unit !== 'forfait' && (
                              <p className="text-[11px] text-ink/45">{o.unit}</p>
                            )}
                          </div>
                        </div>

                        <div className="mt-3 flex items-center justify-between gap-3">
                          {derived ? (
                            <p className="text-[12px] text-ink/45">
                              {o.unit === 'personne'
                                ? `Calculé sur ${form.guestCount || 0} invité(s) — renseignez le nombre à l’étape « Date »`
                                : `Calculé sur ${form.distanceKm || 0} km au-delà du rayon inclus`}
                            </p>
                          ) : o.unit === 'heure' ? (
                            <QtyStepper
                              value={qty}
                              min={0}
                              max={o.maxQty}
                              suffix=" h"
                              onChange={(v) =>
                                set('optionQty', { ...form.optionQty, [o.id]: v })
                              }
                            />
                          ) : (
                            <Button
                              size="sm"
                              variant={active ? 'primary' : 'outline'}
                              onClick={() =>
                                set('optionQty', { ...form.optionQty, [o.id]: active ? 0 : 1 })
                              }
                            >
                              {active ? 'Ajouté' : 'Ajouter'}
                            </Button>
                          )}
                          {active && (
                            <span className="text-[13px] font-semibold text-ink">
                              + {money(o.price * qty)}
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

        {/* ----------------------------------------------------- 3. date */}
        {step === 2 && (
          <section>
            <h1 className="font-display text-[32px] leading-tight text-ink">
              Proposez votre date
            </h1>
            <p className="mt-2 text-[14.5px] text-ink/55">
              Les dates déjà prises sont grisées. {provider.displayName} confirmera la date sous
              48 h.
            </p>

            <div className="mt-6">
              <Calendar
                value={form.date || null}
                onChange={(iso) => set('date', iso)}
                blockedDates={provider.blockedDates}
                minISO={todayISO()}
              />
              {errors.date && (
                <p className="mt-2 text-[12.5px] font-medium text-red-600">{errors.date}</p>
              )}
            </div>

            {form.date && (
              <div className="mt-3 flex items-center gap-2 rounded-xl bg-accent/10 px-3.5 py-2.5 text-[13px] font-medium text-ink">
                <CalendarDays className="h-4 w-4 text-accent" />
                {formatDateLong(form.date)}
              </div>
            )}

            <div className="mt-6">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-ink/40">
                Créneau
              </p>
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
              <Field label="Lieu de l’événement" hint="Nom du domaine, château, mairie…">
                <Input
                  value={form.venue}
                  onChange={(e) => set('venue', e.target.value)}
                  placeholder="Château de Vayres"
                />
              </Field>
              <Field label="Ville">
                <Input
                  value={form.city}
                  onChange={(e) => set('city', e.target.value)}
                  placeholder={provider.city}
                />
              </Field>
              <Field label="Type d’événement">
                <Select
                  value={form.eventType}
                  onChange={(e) => set('eventType', e.target.value)}
                >
                  {EVENT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Nombre d’invités" hint="Sert à calculer les options au forfait personne.">
                <Input
                  type="number"
                  min={0}
                  max={600}
                  value={form.guestCount || ''}
                  onChange={(e) => set('guestCount', Number(e.target.value) || 0)}
                  placeholder="120"
                />
              </Field>
              <Field
                label="Distance depuis la ville de départ"
                hint="Au-delà du rayon inclus, le kilométrage est facturé en option."
              >
                <Input
                  type="number"
                  min={0}
                  max={1000}
                  value={form.distanceKm || ''}
                  onChange={(e) => set('distanceKm', Number(e.target.value) || 0)}
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

        {/* --------------------------------------------------- 4. contact */}
        {step === 3 && (
          <section>
            <h1 className="font-display text-[32px] leading-tight text-ink">Vos coordonnées</h1>
            <p className="mt-2 text-[14.5px] text-ink/55">
              Elles ne servent qu’à traiter votre demande et vous envoyer le lien de paiement.
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <Field label="Prénom" required error={errors.firstName}>
                <Input
                  value={form.firstName}
                  onChange={(e) => set('firstName', e.target.value)}
                  placeholder="Camille"
                  autoComplete="given-name"
                />
              </Field>
              <Field label="Nom" required error={errors.lastName}>
                <Input
                  value={form.lastName}
                  onChange={(e) => set('lastName', e.target.value)}
                  placeholder="Durand"
                  autoComplete="family-name"
                />
              </Field>
              <Field label="E-mail" required error={errors.email} className="sm:col-span-2">
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => set('email', e.target.value)}
                  placeholder="camille.durand@example.fr"
                  autoComplete="email"
                  inputMode="email"
                />
              </Field>
              <Field label="Téléphone" required error={errors.phone} className="sm:col-span-2">
                <Input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => set('phone', e.target.value)}
                  placeholder="06 12 34 56 78"
                  autoComplete="tel"
                  inputMode="tel"
                />
              </Field>
            </div>

            <div className="mt-6 rounded-2xl border border-line bg-card p-4">
              <p className="flex items-center gap-2 text-[13px] font-semibold text-ink">
                <ShieldCheck className="h-4 w-4 text-accent" /> Vos données restent privées
              </p>
              <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink/55">
                Elles ne sont visibles que par {provider.displayName}. Aucune donnée n’est
                partagée avec un autre prestataire.
              </p>
            </div>
          </section>
        )}

        {/* ------------------------------------------------- 5. validation */}
        {step === 4 && formula && (
          <section>
            <h1 className="font-display text-[32px] leading-tight text-ink">Récapitulatif</h1>
            <p className="mt-2 text-[14.5px] text-ink/55">
              Votre date sera proposée à {provider.displayName}, qui la confirmera sous 48 h.
              L’acompte ne sera débité qu’après confirmation.
            </p>

            <Card className="mt-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-display text-[22px] leading-tight text-ink">
                    {formula.name}
                  </p>
                  <p className="text-[13px] text-accent">{formula.tagline}</p>
                </div>
                <p className="font-display text-[22px] text-ink">{money(formula.price)}</p>
              </div>

              {form.date && (
                <div className="mt-4 flex items-center gap-2 border-t border-line pt-3 text-[13.5px] text-ink/70">
                  <CalendarDays className="h-4 w-4 text-accent" />
                  {formatDateLong(form.date)} · {SLOT_LABEL[form.slot]}
                </div>
              )}

              {lines.length > 0 && (
                <div className="mt-3 space-y-2 border-t border-line pt-3">
                  {lines.map((l) => (
                    <div key={l.optionId} className="flex items-center justify-between gap-3">
                      <span className="text-[13.5px] text-ink/70">
                        {l.name}
                        <span className="ml-1.5 text-[11.5px] text-ink/40">
                          {optionUnitLabel(l.unit, l.qty)}
                        </span>
                      </span>
                      <span className="text-[13.5px] font-medium text-ink">
                        {l.lineTotal > 0 ? `+ ${money(l.lineTotal)}` : 'Inclus'}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-4 space-y-2 border-t border-line pt-3">
                <div className="flex items-center justify-between text-[13.5px] text-ink/60">
                  <span>Formule</span>
                  <span>{money(totals.subtotal)}</span>
                </div>
                <div className="flex items-center justify-between text-[13.5px] text-ink/60">
                  <span>Options</span>
                  <span>{money(totals.optionsTotal)}</span>
                </div>
                <div className="flex items-baseline justify-between border-t border-line pt-2.5">
                  <span className="font-semibold text-ink">Total</span>
                  <span className="font-display text-[28px] leading-none text-ink">
                    {money(totals.total)}
                  </span>
                </div>
              </div>
            </Card>

            <Card className="mt-3" variant="accent">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/20 text-accent">
                  <Sparkles className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-[14px] font-semibold text-ink">
                    Acompte de {totals.depositPercent} % · {money(totals.depositAmount)}
                  </p>
                  <p className="mt-1 text-[12.5px] leading-relaxed text-ink/60">
                    Payable uniquement après confirmation de la date, sur votre lien de
                    réservation. Cet acompte est encaissé par {provider.displayName} et ne peut
                    pas être transféré à un autre prestataire.
                  </p>
                </div>
              </div>
            </Card>

            <div className="mt-5 rounded-2xl border border-line bg-card p-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-ink/40">
                Client
              </p>
              <p className="mt-1.5 text-[14px] font-semibold text-ink">
                {form.firstName} {form.lastName}
              </p>
              <p className="text-[13px] text-ink/60">
                {form.email} · {form.phone}
              </p>
              <p className="mt-2 text-[13px] text-ink/60">
                {form.eventType}
                {form.venue ? ` · ${form.venue}` : ''}
                {form.city ? ` (${form.city})` : ''}
                {form.guestCount ? ` · ${form.guestCount} invités` : ''}
              </p>
              {form.message && (
                <p className="mt-2.5 border-l-2 border-accent/40 pl-3 text-[13px] italic leading-relaxed text-ink/60">
                  {form.message}
                </p>
              )}
            </div>

            <div className="mt-4 flex items-start gap-2 rounded-xl bg-ink/4 px-3.5 py-3 text-[12px] leading-relaxed text-ink/55">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              En envoyant votre demande, vous demandez une date — vous ne payez rien
              maintenant. Le seul paiement est l’acompte, encaissé après confirmation de la
              date par le prestataire.
            </div>
          </section>
        )}
      </main>

      {/* --------------------------------------------------- sticky bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-paper/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3">
          {formula ? (
            <div className="min-w-0">
              <p className="truncate text-[11px] uppercase tracking-wider text-ink/45">
                {formula.name}
              </p>
              <p className="font-display text-[20px] leading-none text-ink">
                {money(totals.total)}
              </p>
            </div>
          ) : (
            <p className="text-[12.5px] text-ink/45">Choisissez une formule</p>
          )}
          {step < 4 ? (
            <Button full size="lg" variant="accent" className="flex-1" onClick={next}>
              Continuer <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              full
              size="lg"
              variant="accent"
              className="flex-1"
              loading={submitting}
              onClick={submit}
              icon={<ArrowRight className="h-4 w-4" />}
            >
              Envoyer ma demande
            </Button>
          )}
        </div>
        {totals.depositAmount > 0 && step < 4 && (
          <p className="mx-auto max-w-2xl px-4 pb-2 text-center text-[11px] text-ink/40">
            Acompte de {totals.depositPercent} % ({money(totals.depositAmount)}) après
            confirmation
          </p>
        )}
      </div>
    </div>
  )
}
