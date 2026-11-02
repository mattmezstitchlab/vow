import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowUpRight,
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
  MapPin,
  Music2,
  ShieldCheck,
  XCircle,
} from 'lucide-react'
import { Badge, Button, Card, Sheet, useToast } from '../components/ui'
import { DemoNotice } from '../components/DemoNotice'
import {
  acceptAlternativeDate,
  cancelBooking,
  getBooking,
  getProviderBySlug,
  payDeposit,
  subscribeData,
} from '../lib/store'
import type { Booking, ProviderInstance } from '../lib/types'
import { SLOT_LABEL, STATUS_LABEL, formatDateLong, formatStamp, money, optionUnitLabel } from '../lib/format'
import { cn } from '../lib/utils'

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

function icsEscape(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')
}

export default function Reservation() {
  const { slug = '', code = '' } = useParams()
  const toast = useToast()
  const [provider, setProvider] = useState<ProviderInstance | null>(null)
  const [booking, setBooking] = useState<Booking | null>(null)
  const [loadedKey, setLoadedKey] = useState('')
  const [notFound, setNotFound] = useState(false)
  const loading = loadedKey !== `${slug}/${code}`
  const [payOpen, setPayOpen] = useState(false)
  const [payStep, setPayStep] = useState<'form' | 'processing' | 'done'>('form')
  const [payMethod, setPayMethod] = useState('Carte bancaire (démo)')
  const [payError, setPayError] = useState<string | null>(null)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let active = true
    const load = async () => {
      const p = await getProviderBySlug(slug)
      if (!active) return
      if (!p) {
        setNotFound(true)
        setLoadedKey(`${slug}/${code}`)
        return
      }
      const b = await getBooking(p.id, code)
      if (!active) return
      setProvider(p)
      setBooking(b)
      setNotFound(!b)
      setLoadedKey(`${slug}/${code}`)
    }
    void load()
    const unsubscribe = subscribeData(() => void load())
    const onFocus = () => void load()
    window.addEventListener('focus', onFocus)
    return () => {
      active = false
      unsubscribe()
      window.removeEventListener('focus', onFocus)
    }
  }, [slug, code])

  const shareUrl = useMemo(() => `${window.location.origin}/r/${slug}/${code}`, [slug, code])

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      toast.push('Lien de réservation copié.', 'success')
    } catch {
      toast.push('Copie indisponible : sélectionnez le lien dans la barre d’adresse.', 'info')
    }
  }

  const downloadIcs = () => {
    if (!booking || !provider) return
    const start = booking.date.replace(/-/g, '')
    const hour = booking.slot === 'matin' ? '09' : booking.slot === 'aprem' ? '14' : '18'
    const endHour = String(Number(hour) + 3).padStart(2, '0')
    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Cadence//Reservation Demo//FR',
      'CALSCALE:GREGORIAN',
      'BEGIN:VEVENT',
      `UID:${booking.code}@cadence.demo`,
      `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')}`,
      `DTSTART:${start}T${hour}0000`,
      `DTEND:${start}T${endHour}0000`,
      `SUMMARY:${icsEscape(`Mariage · ${provider.displayName}`)}`,
      `DESCRIPTION:${icsEscape(`Réservation ${booking.code} · ${booking.formulaName} · ${SLOT_LABEL[booking.slot]}`)}`,
      `LOCATION:${icsEscape(`${booking.client.venue}, ${booking.client.city}`)}`,
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n')
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `cadence-${booking.code}.ics`
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    toast.push('Invitation calendrier téléchargée.', 'success')
  }

  const doCancel = async () => {
    if (!provider || !booking || busy) return
    setBusy(true)
    try {
      setBooking(await cancelBooking(provider.id, booking.code))
      setCancelOpen(false)
      toast.push('Votre demande a été annulée.', 'info')
    } catch (err) {
      toast.push(err instanceof Error ? err.message : 'Annulation impossible.', 'error')
    }
    setBusy(false)
  }

  const acceptDate = async () => {
    if (!provider || !booking || busy) return
    setBusy(true)
    try {
      setBooking(await acceptAlternativeDate(provider.id, booking.code))
      toast.push('Nouvelle date acceptée. Le prestataire peut confirmer.', 'success')
    } catch (err) {
      toast.push(err instanceof Error ? err.message : 'Action impossible.', 'error')
    }
    setBusy(false)
  }

  const submitPayment = async () => {
    if (!provider || !booking || payStep === 'processing') return
    setPayError(null)
    setPayStep('processing')
    try {
      const updated = await payDeposit(provider.id, booking.code, payMethod, booking.quoteVersion)
      setBooking(updated)
      setPayStep('done')
    } catch (err) {
      setPayStep('form')
      setPayError(err instanceof Error ? err.message : 'Paiement impossible.')
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
            Ce code n’existe pas pour ce prestataire. Dans la démo, les réservations sont cloisonnées
            par instance et enregistrées dans le navigateur qui les a créées.
          </p>
          <Link to="/"><Button className="mt-5" variant="outline">Retour à la démo</Button></Link>
        </Card>
      </div>
    )
  }

  const deposit = booking.deposit
  const canPay = booking.status === 'confirmee' && deposit.status === 'en_attente'
  const canCancel = ['proposee', 'date_a_accepter', 'confirmee'].includes(booking.status) && deposit.status !== 'paye'
  const canDownload = booking.status === 'confirmee' || booking.status === 'acompte_paye'
  const balance = Math.round((booking.pricing.total - deposit.amount) * 100) / 100

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
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-4 py-3">
          <Link to={`/p/${provider.slug}`} className="flex min-w-0 items-center gap-2 text-ink/70 hover:text-ink">
            <Music2 className="h-4 w-4 shrink-0" />
            <span className="truncate text-[13px] font-semibold">{provider.displayName}</span>
          </Link>
          <Badge tone="outline" className="shrink-0">Réservation {booking.code}</Badge>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 pb-16 pt-6">
        <DemoNotice className="mb-4" />
        <Card variant={booking.status === 'acompte_paye' ? 'success' : 'default'} className="overflow-hidden">
          <div className="flex items-start gap-3">
            <span
              className={cn(
                'flex h-11 w-11 shrink-0 items-center justify-center rounded-full',
                booking.status === 'acompte_paye' ? 'bg-emerald-600/12 text-emerald-700'
                  : booking.status === 'confirmee' || booking.status === 'date_a_accepter' ? 'bg-accent/15 text-accent'
                    : booking.status === 'refusee' || booking.status === 'annulee' ? 'bg-red-600/10 text-red-600'
                      : 'bg-amber-500/15 text-amber-700',
              )}
            >
              {booking.status === 'acompte_paye' ? <CheckCircle2 className="h-6 w-6" />
                : booking.status === 'confirmee' ? <BadgeCheck className="h-6 w-6" />
                  : booking.status === 'refusee' || booking.status === 'annulee' ? <XCircle className="h-6 w-6" />
                    : <Clock className="h-6 w-6" />}
            </span>
            <div className="min-w-0">
              <Badge tone={STATUS_TONE[booking.status]}>{STATUS_LABEL[booking.status]}</Badge>
              <h1 className="mt-2 font-display text-[28px] leading-tight text-ink">
                {booking.status === 'proposee' && 'Votre date a été proposée'}
                {booking.status === 'date_a_accepter' && 'Une autre date vous est proposée'}
                {booking.status === 'confirmee' && 'Date confirmée — à vous de jouer'}
                {booking.status === 'acompte_paye' && 'Réservation confirmée, acompte reçu'}
                {booking.status === 'annulee' && 'Demande annulée'}
                {booking.status === 'refusee' && 'Demande refusée'}
                {booking.status === 'terminee' && 'Prestation terminée'}
              </h1>
              <p className="mt-1.5 text-[14px] leading-relaxed text-ink/60">
                {booking.status === 'proposee' && `${provider.displayName} doit encore confirmer la date. Cette page se met à jour automatiquement ; en démo, aucun e-mail n’est envoyé.`}
                {booking.status === 'date_a_accepter' && `Acceptez la nouvelle date ci-dessous, ou annulez sans frais. Le prestataire pourra ensuite confirmer la réservation.`}
                {booking.status === 'confirmee' && `La date est confirmée. Réglez l’acompte de ${booking.pricing.depositPercent} % pour finaliser la réservation (simulation).`}
                {booking.status === 'acompte_paye' && `Tout est en place. Référence ${deposit.reference}. Le règlement est enregistré dans l’instance de ${provider.displayName} uniquement.`}
                {booking.status === 'annulee' && 'Cette demande a été annulée. Aucun acompte n’a été débité.'}
                {booking.status === 'refusee' && 'Cette demande n’a pas pu être acceptée. Aucun acompte n’a été débité.'}
              </p>
            </div>
          </div>

          {canPay && (
            <Button className="mt-5" full size="lg" variant="accent" onClick={() => { setPayOpen(true); setPayStep('form'); setPayError(null) }} icon={<CreditCard className="h-4 w-4" />}>
              Payer l’acompte · {money(deposit.amount)}
            </Button>
          )}
          {booking.status === 'date_a_accepter' && (
            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              <Button full variant="accent" loading={busy} onClick={acceptDate} icon={<Check className="h-4 w-4" />}>Accepter cette date</Button>
              <Button full variant="outline" onClick={() => setCancelOpen(true)}>Refuser et annuler</Button>
            </div>
          )}
          {booking.status === 'proposee' && (
            <div className="mt-5 flex items-start gap-2 rounded-xl bg-ink/4 px-3.5 py-3 text-[12.5px] leading-relaxed text-ink/60">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              Aucun paiement n’est demandé tant que la date n’est pas confirmée. Vous pouvez annuler à tout moment avant règlement.
            </div>
          )}
        </Card>

        {(booking.status === 'proposee' || booking.status === 'date_a_accepter') && (
          <Card className="mt-4" variant="soft">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[13px] font-semibold text-ink">Présenter la suite de la démo</p>
                <p className="mt-0.5 text-[12px] text-ink/55">Ouvrez le back-office pour confirmer la date, puis revenez ici.</p>
              </div>
              <Link to={`/bo/${provider.slug}`}>
                <Button size="sm" variant="outline" icon={<ArrowUpRight className="h-3.5 w-3.5" />}>Espace prestataire</Button>
              </Link>
            </div>
          </Card>
        )}

        <Card className="mt-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-display text-[22px] leading-tight text-ink">{booking.formulaName}</p>
              <p className="text-[13px] text-ink/55">{booking.client.couple} · {booking.client.eventType}</p>
            </div>
            <p className="font-display text-[22px] text-ink">{money(booking.pricing.total)}</p>
          </div>
          <div className="mt-4 grid gap-3 border-t border-line pt-4 sm:grid-cols-2">
            <div className="flex items-start gap-2 text-[13.5px] text-ink/70">
              <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
              <span>{formatDateLong(booking.date)}<br /><span className="text-ink/50">{SLOT_LABEL[booking.slot]}</span></span>
            </div>
            <div className="flex items-start gap-2 text-[13.5px] text-ink/70">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
              <span>{booking.client.venue}<br /><span className="text-ink/50">{booking.client.city} · {booking.client.guestCount} invités</span></span>
            </div>
          </div>
          {booking.options.length > 0 && (
            <div className="mt-4 space-y-2 border-t border-line pt-4">
              {booking.options.map((l) => (
                <div key={l.optionId} className="flex items-center justify-between gap-3">
                  <span className="text-[13.5px] text-ink/70">{l.name}<span className="ml-1.5 text-[11.5px] text-ink/40">{optionUnitLabel(l.unit, l.qty)}</span></span>
                  <span className="text-[13.5px] font-medium text-ink">{l.lineTotal > 0 ? `+ ${money(l.lineTotal)}` : 'Inclus'}</span>
                </div>
              ))}
            </div>
          )}
          <div className="mt-4 space-y-2 border-t border-line pt-4">
            <div className="flex items-center justify-between text-[13.5px] text-ink/60"><span>Formule</span><span>{money(booking.pricing.subtotal)}</span></div>
            <div className="flex items-center justify-between text-[13.5px] text-ink/60"><span>Options</span><span>{money(booking.pricing.total - booking.pricing.subtotal)}</span></div>
            <div className="flex items-baseline justify-between border-t border-line pt-2.5">
              <span className="font-semibold text-ink">Total TTC</span>
              <span className="font-display text-[26px] leading-none text-ink">{money(booking.pricing.total)}</span>
            </div>
          </div>
        </Card>

        <Card className="mt-4" variant={deposit.status === 'paye' ? 'success' : 'accent'}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-ink/40">Acompte · {booking.pricing.depositPercent} %</p>
              <p className="mt-1 font-display text-[28px] leading-none text-ink">{money(deposit.amount)}</p>
              {deposit.status === 'paye' ? (
                <p className="mt-2 inline-flex items-center gap-1.5 text-[12.5px] font-medium text-emerald-700">
                  <Check className="h-3.5 w-3.5" /> Reçu le {deposit.paidAt ? formatStamp(deposit.paidAt) : '—'}{deposit.method ? ` · ${deposit.method}` : ''}
                </p>
              ) : (
                <p className="mt-2 text-[12.5px] text-ink/55">
                  {booking.status === 'confirmee' ? 'Payable maintenant (simulation)' : 'En attente de confirmation de la date'}
                </p>
              )}
            </div>
            {deposit.status === 'paye' && deposit.reference && (
              <span className="rounded-lg bg-ink/5 px-2.5 py-1.5 text-[11px] font-semibold text-ink/60">{deposit.reference}</span>
            )}
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-ink/8 pt-3 text-[12.5px] text-ink/60">
            <span>Solde restant à régler au prestataire</span><span className="font-semibold text-ink">{money(balance)}</span>
          </div>
          <p className="mt-3 flex items-start gap-1.5 text-[11.5px] leading-relaxed text-ink/45">
            <Lock className="mt-0.5 h-3 w-3 shrink-0" />
            Acompte destiné à {provider.displayName} uniquement. Aucun partage, aucune mutualisation entre prestataires.
          </p>
        </Card>

        <Card className="mt-4">
          <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.16em] text-ink/40">Suivi</p>
          <ol className="space-y-3">
            {booking.timeline.map((t, i) => (
              <li key={i} className="flex gap-3">
                <span className="relative flex flex-col items-center">
                  <span className={cn('mt-1 h-2.5 w-2.5 shrink-0 rounded-full', t.actor === 'prestataire' ? 'bg-accent' : t.actor === 'systeme' ? 'bg-emerald-600' : 'bg-brand')} />
                  {i < booking.timeline.length - 1 && <span className="w-px flex-1 bg-line" />}
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

        <div className="mt-4 grid gap-2.5 sm:grid-cols-3">
          <Button variant="outline" size="sm" onClick={copyLink} icon={<Copy className="h-3.5 w-3.5" />}>Copier le lien</Button>
          {canDownload && <Button variant="outline" size="sm" onClick={downloadIcs} icon={<Download className="h-3.5 w-3.5" />}>Calendrier</Button>}
          {canCancel && <Button variant="ghost" size="sm" onClick={() => setCancelOpen(true)} className="text-red-600">Annuler ma demande</Button>}
        </div>
        <p className="mt-6 flex items-start gap-2 text-[11.5px] leading-relaxed text-ink/40">
          <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          Démonstration : aucun paiement réel, aucune donnée bancaire collectée. Les données restent dans ce navigateur.
        </p>
      </main>

      <Sheet
        open={payOpen}
        onClose={() => { if (payStep !== 'processing') { setPayOpen(false); setPayStep('form'); setPayError(null) } }}
        title={<div><p className="font-display text-[22px] leading-tight text-ink">Paiement de l’acompte</p><p className="text-[12.5px] text-ink/55">{money(deposit.amount)} · {provider.displayName}</p></div>}
      >
        {payStep === 'form' && (
          <div className="space-y-4">
            <DemoNotice>Mode démonstration : aucun débit réel. Aucune donnée de carte n’est demandée ni conservée.</DemoNotice>
            <div className="rounded-xl border border-line p-4">
              <div className="flex items-center justify-between text-[13.5px] text-ink/60"><span>Total prestation</span><span>{money(booking.pricing.total)}</span></div>
              <div className="mt-2 flex items-center justify-between text-[14px] font-semibold text-ink"><span>Acompte ({booking.pricing.depositPercent} %)</span><span>{money(deposit.amount)}</span></div>
              <div className="mt-2 flex items-center justify-between border-t border-line pt-2 text-[12.5px] text-ink/55"><span>Solde restant</span><span>{money(balance)}</span></div>
            </div>
            <div>
              <p className="mb-2 text-[12px] font-semibold text-ink/60">Moyen de paiement simulé</p>
              <div className="grid gap-2">
                {['Carte bancaire (démo)', 'Virement bancaire (démo)'].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setPayMethod(m)}
                    className={cn('flex items-center justify-between rounded-xl border px-3.5 py-3 text-left text-[13.5px] font-medium transition-colors', payMethod === m ? 'border-brand bg-brand/5 text-ink' : 'border-line text-ink/60 hover:border-ink/25')}
                  >
                    {m}
                    <span className={cn('flex h-5 w-5 items-center justify-center rounded-full border', payMethod === m ? 'border-brand bg-brand text-white' : 'border-line')}>{payMethod === m && <Check className="h-3 w-3" />}</span>
                  </button>
                ))}
              </div>
            </div>
            <p className="flex items-start gap-1.5 text-[11.5px] leading-relaxed text-ink/45">
              <Lock className="mt-0.5 h-3 w-3 shrink-0" />
              Le règlement est enregistré uniquement dans l’instance de {provider.displayName}. En production, il serait encaissé directement par le prestataire, sans transit par Cadence.
            </p>
            {payError && <p className="rounded-lg bg-red-600/10 px-3 py-2 text-[12.5px] font-medium text-red-700">{payError}</p>}
            <Button full size="lg" variant="accent" onClick={submitPayment}>Simuler le paiement · {money(deposit.amount)}</Button>
          </div>
        )}
        {payStep === 'processing' && (
          <div className="flex flex-col items-center py-10 text-center">
            <div className="h-9 w-9 animate-spin rounded-full border-2 border-ink/15 border-t-accent" />
            <p className="mt-4 font-display text-xl text-ink">Simulation en cours…</p>
            <p className="mt-1 text-[13px] text-ink/55">Enregistrement de l’acompte dans l’instance</p>
          </div>
        )}
        {payStep === 'done' && (
          <div className="flex flex-col items-center py-6 text-center">
            <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600/12 text-emerald-700"><CheckCircle2 className="h-7 w-7" /></span>
            <p className="font-display text-[26px] leading-tight text-ink">Acompte simulé enregistré</p>
            <p className="mt-2 max-w-xs text-[13.5px] leading-relaxed text-ink/60">
              {money(deposit.amount)} ont été enregistrés au nom de {provider.displayName}. Référence {booking.deposit.reference}. Aucun débit réel n’a eu lieu.
            </p>
            <Button className="mt-6" full variant="outline" onClick={() => setPayOpen(false)}>Fermer</Button>
          </div>
        )}
      </Sheet>

      <Sheet
        open={cancelOpen}
        onClose={() => { if (!busy) setCancelOpen(false) }}
        title={<p className="font-display text-[22px] text-ink">Annuler la demande ?</p>}
        footer={
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={() => setCancelOpen(false)} disabled={busy}>Conserver</Button>
            <Button variant="danger" onClick={doCancel} loading={busy}>Annuler la demande</Button>
          </div>
        }
      >
        <p className="text-[14px] leading-relaxed text-ink/65">
          Aucun acompte n’a été débité. La demande sera marquée comme annulée et le prestataire ne pourra plus la confirmer.
        </p>
      </Sheet>
    </div>
  )
}
