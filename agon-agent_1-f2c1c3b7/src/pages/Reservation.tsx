import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  BadgeCheck,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  CreditCard,
  Download,
  Info,
  Lock,
  Mail,
  MapPin,
  Music2,
  Phone,
  ShieldCheck,
  XCircle,
} from 'lucide-react'
import { Badge, Button, Card, Field, Input, Sheet, useToast } from '../components/ui'
import { getBooking, getProviderBySlug, payDeposit, updateBooking } from '../lib/store'
import type { Booking, ProviderInstance } from '../lib/types'
import {
  SLOT_LABEL,
  STATUS_LABEL,
  formatDateLong,
  formatStamp,
  money,
  optionUnitLabel,
} from '../lib/format'
import { cn } from '../lib/utils'

type Tone = 'neutral' | 'accent' | 'brand' | 'success' | 'warning' | 'danger'

const STATUS_TONE: Record<string, Tone> = {
  proposee: 'warning',
  confirmee: 'accent',
  acompte_paye: 'success',
  refusee: 'danger',
  annulee: 'danger',
  terminee: 'neutral',
}

export default function Reservation() {
  const { slug = '', code = '' } = useParams()
  const toast = useToast()
  const [provider, setProvider] = useState<ProviderInstance | null>(null)
  const [booking, setBooking] = useState<Booking | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [loading, setLoading] = useState(true)
  const [payOpen, setPayOpen] = useState(false)
  const [payStep, setPayStep] = useState<'form' | 'processing' | 'done'>('form')
  const [card, setCard] = useState({ number: '', expiry: '', cvc: '', name: '' })
  const [cardError, setCardError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    ;(async () => {
      const p = await getProviderBySlug(slug)
      if (!active) return
      if (!p) {
        setNotFound(true)
        setLoading(false)
        return
      }
      const b = await getBooking(p.id, code)
      if (!active) return
      setProvider(p)
      setBooking(b)
      if (!b) setNotFound(true)
      setLoading(false)
    })()
    return () => {
      active = false
    }
  }, [slug, code])

  const shareUrl = useMemo(() => {
    if (typeof window === 'undefined') return ''
    return `${window.location.origin}/r/${slug}/${code}`
  }, [slug, code])

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      toast.push('Lien de réservation copié.', 'success')
    } catch {
      toast.push(shareUrl, 'info')
    }
  }

  const downloadIcs = () => {
    if (!booking) return
    const start = booking.date.replace(/-/g, '')
    const startTime = booking.slot === 'matin' ? '090000' : booking.slot === 'aprem' ? '140000' : '180000'
    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Cadence//Reservation//FR',
      'BEGIN:VEVENT',
      `UID:${booking.code}@cadence.demo`,
      `DTSTART:${start}T${startTime}`,
      `DTEND:${start}T${Number(startTime.slice(0, 2)) + 3}${startTime.slice(2)}`,
      `SUMMARY:Prestation de mariage - ${provider?.displayName ?? ''}`,
      `DESCRIPTION:Reservation ${booking.code} - ${booking.formulaName}`,
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n')
    const blob = new Blob([ics], { type: 'text/calendar' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `cadence-${booking.code}.ics`
    a.click()
    URL.revokeObjectURL(url)
    toast.push('Invitation calendrier téléchargée.', 'success')
  }

  const cancelRequest = async () => {
    if (!provider || !booking) return
    const updated = await updateBooking(
      provider.id,
      booking.code,
      { status: 'annulee' },
      { label: 'Demande annulée par le client', actor: 'client' },
    )
    setBooking(updated)
    toast.push('Votre demande a été annulée.', 'info')
  }

  const submitPayment = async () => {
    if (!provider || !booking) return
    const digits = card.number.replace(/\s/g, '')
    if (digits.length < 15) {
      setCardError('Numéro de carte incomplet.')
      return
    }
    if (!/^\d{2}\/\d{2}$/.test(card.expiry)) {
      setCardError('Date d’expiration au format MM/AA.')
      return
    }
    const [mm, yy] = card.expiry.split('/').map(Number)
    if (mm < 1 || mm > 12) {
      setCardError('Mois d’expiration invalide.')
      return
    }
    const now = new Date()
    if (yy + 2000 < now.getFullYear() || (yy + 2000 === now.getFullYear() && mm < now.getMonth() + 1)) {
      setCardError('Carte expirée.')
      return
    }
    if (card.cvc.replace(/\D/g, '').length < 3) {
      setCardError('Cryptogramme incomplet.')
      return
    }
    if (!card.name.trim()) {
      setCardError('Indiquez le nom du titulaire.')
      return
    }
    setCardError(null)
    setPayStep('processing')
    try {
      const updated = await payDeposit(provider.id, booking.code, 'Carte bancaire')
      setBooking(updated)
      setPayStep('done')
    } catch (err) {
      setPayStep('form')
      toast.push(err instanceof Error ? err.message : 'Paiement impossible.', 'error')
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-ink/20 border-t-ink/70" />
      </div>
    )
  }

  if (notFound || !provider || !booking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper px-4">
        <Card className="max-w-md p-6 text-center">
          <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-600/10 text-red-600">
            <XCircle className="h-6 w-6" />
          </span>
          <h1 className="font-display text-[26px] text-ink">Réservation introuvable</h1>
          <p className="mt-2 text-[14px] leading-relaxed text-ink/60">
            Ce code de réservation n’existe pas pour ce prestataire. Les réservations et leurs
            acomptes sont cloisonnés : un code n’est jamais accessible depuis la page d’un autre
            prestataire.
          </p>
          <Link to="/">
            <Button className="mt-5" variant="outline">
              Retour à la démo
            </Button>
          </Link>
        </Card>
      </div>
    )
  }

  const deposit = booking.deposit
  const canPay = booking.status === 'confirmee' && deposit.status === 'en_attente'

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
      <header className="border-b border-line/70 bg-paper/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <Link to={`/p/${provider.slug}`} className="flex items-center gap-2 text-ink/70 hover:text-ink">
            <Music2 className="h-4 w-4" />
            <span className="text-[13px] font-semibold">{provider.displayName}</span>
          </Link>
          <Badge tone="outline">Réservation {booking.code}</Badge>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 pb-16 pt-6">
        {/* --------------------------------------------------- status */}
        <Card
          variant={booking.status === 'acompte_paye' ? 'success' : 'default'}
          className="overflow-hidden"
        >
          <div className="flex items-start gap-3">
            <span
              className={cn(
                'flex h-11 w-11 shrink-0 items-center justify-center rounded-full',
                booking.status === 'acompte_paye'
                  ? 'bg-emerald-600/12 text-emerald-700'
                  : booking.status === 'confirmee'
                    ? 'bg-accent/15 text-accent'
                    : 'bg-amber-500/15 text-amber-700',
              )}
            >
              {booking.status === 'acompte_paye' ? (
                <CheckCircle2 className="h-6 w-6" />
              ) : booking.status === 'confirmee' ? (
                <BadgeCheck className="h-6 w-6" />
              ) : (
                <Clock className="h-6 w-6" />
              )}
            </span>
            <div className="min-w-0">
              <Badge tone={STATUS_TONE[booking.status]}>{STATUS_LABEL[booking.status]}</Badge>
              <h1 className="mt-2 font-display text-[28px] leading-tight text-ink">
                {booking.status === 'proposee'
                  ? 'Votre date a été proposée'
                  : booking.status === 'confirmee'
                    ? 'Date confirmée — à vous de jouer'
                    : booking.status === 'acompte_paye'
                      ? 'Réservation confirmée et acompte reçu'
                      : STATUS_LABEL[booking.status]}
              </h1>
              <p className="mt-1.5 text-[14px] leading-relaxed text-ink/60">
                {booking.status === 'proposee' &&
                  `${provider.displayName} doit encore confirmer la date. Vous serez prévenu dès que c’est fait, par e-mail à ${booking.client.email}.`}
                {booking.status === 'confirmee' &&
                  `La date est réservée. Réglez l’acompte de ${booking.pricing.depositPercent} % pour la confirmer définitivement.`}
                {booking.status === 'acompte_paye' &&
                  `Tout est en place. Référence de paiement ${deposit.reference}. À retrouver dans le back-office de ${provider.displayName}.`}
                {booking.status === 'annulee' && 'Cette demande a été annulée.'}
                {booking.status === 'refusee' && 'Cette demande n’a pas pu être acceptée.'}
              </p>
            </div>
          </div>

          {canPay && (
            <Button
              className="mt-5"
              full
              size="lg"
              variant="accent"
              onClick={() => setPayOpen(true)}
              icon={<CreditCard className="h-4 w-4" />}
            >
              Payer l’acompte · {money(deposit.amount)}
            </Button>
          )}

          {booking.status === 'proposee' && (
            <div className="mt-5 flex items-start gap-2 rounded-xl bg-ink/4 px-3.5 py-3 text-[12.5px] leading-relaxed text-ink/60">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              Aucun paiement n’est demandé tant que la date n’est pas confirmée. Vous pouvez
              modifier votre demande ou l’annuler à tout moment.
            </div>
          )}
        </Card>

        {/* --------------------------------------------------- details */}
        <Card className="mt-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-display text-[22px] leading-tight text-ink">
                {booking.formulaName}
              </p>
              <p className="text-[13px] text-ink/55">
                {booking.client.couple} · {booking.client.eventType}
              </p>
            </div>
            <p className="font-display text-[22px] text-ink">{money(booking.pricing.total)}</p>
          </div>

          <div className="mt-4 space-y-2.5 border-t border-line pt-4 text-[13.5px] text-ink/70">
            <p className="flex items-center gap-2.5">
              <CalendarDays className="h-4 w-4 shrink-0 text-accent" />
              {formatDateLong(booking.date)} · {SLOT_LABEL[booking.slot]}
            </p>
            {booking.client.venue && (
              <p className="flex items-center gap-2.5">
                <MapPin className="h-4 w-4 shrink-0 text-accent" />
                {booking.client.venue}
                {booking.client.city ? `, ${booking.client.city}` : ''}
              </p>
            )}
            {booking.client.guestCount > 0 && (
              <p className="flex items-center gap-2.5">
                <BadgeCheck className="h-4 w-4 shrink-0 text-accent" />
                {booking.client.guestCount} invités
              </p>
            )}
            <p className="flex items-center gap-2.5">
              <Mail className="h-4 w-4 shrink-0 text-accent" />
              {booking.client.email}
            </p>
            <p className="flex items-center gap-2.5">
              <Phone className="h-4 w-4 shrink-0 text-accent" />
              {booking.client.phone}
            </p>
          </div>

          {booking.options.length > 0 && (
            <div className="mt-4 space-y-2 border-t border-line pt-4">
              {booking.options.map((l) => (
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

          <div className="mt-4 space-y-2 border-t border-line pt-4">
            <div className="flex items-center justify-between text-[13.5px] text-ink/60">
              <span>Formule</span>
              <span>{money(booking.pricing.subtotal)}</span>
            </div>
            <div className="flex items-center justify-between text-[13.5px] text-ink/60">
              <span>Options</span>
              <span>
                {money(booking.pricing.total - booking.pricing.subtotal)}
              </span>
            </div>
            <div className="flex items-baseline justify-between border-t border-line pt-2.5">
              <span className="font-semibold text-ink">Total</span>
              <span className="font-display text-[26px] leading-none text-ink">
                {money(booking.pricing.total)}
              </span>
            </div>
          </div>
        </Card>

        {/* ------------------------------------------------- acompte */}
        <Card
          className="mt-4"
          variant={deposit.status === 'paye' ? 'success' : 'accent'}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-ink/40">
                Acompte · {booking.pricing.depositPercent} %
              </p>
              <p className="mt-1 font-display text-[28px] leading-none text-ink">
                {money(deposit.amount)}
              </p>
              {deposit.status === 'paye' ? (
                <p className="mt-2 inline-flex items-center gap-1.5 text-[12.5px] font-medium text-emerald-700">
                  <Check className="h-3.5 w-3.5" /> Reçu le {deposit.paidAt ? formatStamp(deposit.paidAt) : '—'}
                  {deposit.method ? ` · ${deposit.method}` : ''}
                </p>
              ) : (
                <p className="mt-2 text-[12.5px] text-ink/55">
                  En attente du règlement après confirmation de la date
                </p>
              )}
            </div>
            {deposit.status === 'paye' && deposit.reference && (
              <span className="rounded-lg bg-ink/5 px-2.5 py-1.5 text-[11.5px] font-semibold text-ink/60">
                {deposit.reference}
              </span>
            )}
          </div>
          <p className="mt-3 flex items-start gap-1.5 border-t border-ink/8 pt-3 text-[11.5px] leading-relaxed text-ink/45">
            <Lock className="mt-0.5 h-3 w-3 shrink-0" />
            Cet acompte est encaissé par {provider.displayName} sur son compte. Il n’est ni
            mutualisé, ni transférable, ni visible depuis une autre instance.
          </p>
        </Card>

        {/* ------------------------------------------------- timeline */}
        <Card className="mt-4">
          <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.16em] text-ink/40">
            Suivi
          </p>
          <ol className="space-y-3">
            {booking.timeline.map((t, i) => (
              <li key={i} className="flex gap-3">
                <span className="relative flex flex-col items-center">
                  <span
                    className={cn(
                      'mt-1 h-2.5 w-2.5 shrink-0 rounded-full',
                      t.actor === 'prestataire'
                        ? 'bg-accent'
                        : t.actor === 'systeme'
                          ? 'bg-emerald-600'
                          : 'bg-brand',
                    )}
                  />
                  {i < booking.timeline.length - 1 && (
                    <span className="w-px flex-1 bg-line" />
                  )}
                </span>
                <div className="pb-1">
                  <p className="text-[13.5px] font-semibold text-ink">{t.label}</p>
                  {t.detail && <p className="text-[12.5px] text-ink/55">{t.detail}</p>}
                  <p className="mt-0.5 text-[11px] text-ink/35">{formatStamp(t.at)}</p>
                </div>
              </li>
            ))}
          </ol>
        </Card>

        {/* ----------------------------------------------------- actions */}
        <div className="mt-4 grid gap-2.5 sm:grid-cols-3">
          <Button variant="outline" size="sm" onClick={copyLink} icon={<Copy className="h-3.5 w-3.5" />}>
            Copier le lien
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={downloadIcs}
            icon={<Download className="h-3.5 w-3.5" />}
          >
            Calendrier
          </Button>
          {booking.status === 'proposee' && (
            <Button variant="ghost" size="sm" onClick={cancelRequest} className="text-red-600">
              Annuler ma demande
            </Button>
          )}
        </div>

        <p className="mt-6 flex items-start gap-2 text-[11.5px] leading-relaxed text-ink/40">
          <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          Démonstration : aucun paiement réel n’est effectué et aucune donnée ne quitte votre
          navigateur.
        </p>
      </main>

      {/* ------------------------------------------------------ payment */}
      <Sheet
        open={payOpen}
        onClose={() => {
          if (payStep !== 'processing') {
            setPayOpen(false)
            setPayStep('form')
            setCardError(null)
          }
        }}
        title={
          <div>
            <p className="font-display text-[22px] leading-tight text-ink">Paiement de l’acompte</p>
            <p className="text-[12.5px] text-ink/55">
              {money(deposit.amount)} · {provider.displayName}
            </p>
          </div>
        }
      >
        {payStep === 'form' && (
          <div className="space-y-4">
            <div className="flex items-start gap-2 rounded-xl bg-accent/8 px-3.5 py-3 text-[12px] leading-relaxed text-ink/60">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
              Mode démonstration : saisissez n’importe quelle carte. Aucun débit n’est effectué.
            </div>
            <Field label="Nom du titulaire" required>
              <Input
                value={card.name}
                onChange={(e) => setCard({ ...card, name: e.target.value })}
                placeholder="Camille Durand"
                autoComplete="cc-name"
              />
            </Field>
            <Field label="Numéro de carte" required>
              <Input
                value={card.number}
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, '').slice(0, 16)
                  setCard({
                    ...card,
                    number: digits.replace(/(.{4})/g, '$1 ').trim(),
                  })
                }}
                placeholder="4242 4242 4242 4242"
                inputMode="numeric"
                autoComplete="cc-number"
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Expiration" required>
                <Input
                  value={card.expiry}
                  onChange={(e) => {
                    let v = e.target.value.replace(/\D/g, '').slice(0, 4)
                    if (v.length >= 3) v = `${v.slice(0, 2)}/${v.slice(2)}`
                    setCard({ ...card, expiry: v })
                  }}
                  placeholder="12/28"
                  inputMode="numeric"
                />
              </Field>
              <Field label="Cryptogramme" required>
                <Input
                  value={card.cvc}
                  onChange={(e) => setCard({ ...card, cvc: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                  placeholder="123"
                  inputMode="numeric"
                />
              </Field>
            </div>
            {cardError && (
              <p className="rounded-lg bg-red-600/10 px-3 py-2 text-[12.5px] font-medium text-red-700">
                {cardError}
              </p>
            )}
            <Button full size="lg" variant="accent" onClick={submitPayment}>
              Payer {money(deposit.amount)}
            </Button>
            <p className="flex items-center justify-center gap-1.5 text-[11.5px] text-ink/40">
              <Lock className="h-3 w-3" /> Paiement chiffré · 3D Secure
            </p>
          </div>
        )}

        {payStep === 'processing' && (
          <div className="flex flex-col items-center py-10 text-center">
            <div className="h-9 w-9 animate-spin rounded-full border-2 border-ink/15 border-t-accent" />
            <p className="mt-4 font-display text-xl text-ink">Paiement en cours…</p>
            <p className="mt-1 text-[13px] text-ink/55">Validation auprès de votre banque</p>
          </div>
        )}

        {payStep === 'done' && (
          <div className="flex flex-col items-center py-6 text-center">
            <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600/12 text-emerald-700">
              <CheckCircle2 className="h-7 w-7" />
            </span>
            <p className="font-display text-[26px] leading-tight text-ink">Acompte encaissé</p>
            <p className="mt-2 max-w-xs text-[13.5px] leading-relaxed text-ink/60">
              {money(deposit.amount)} ont été enregistrés au compte de {provider.displayName}.
              Référence {booking.deposit.reference}.
            </p>
            <Button className="mt-6" full variant="outline" onClick={() => setPayOpen(false)}>
              Fermer
            </Button>
          </div>
        )}
      </Sheet>
    </div>
  )
}
