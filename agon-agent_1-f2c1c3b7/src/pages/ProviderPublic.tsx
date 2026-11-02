import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  Check,
  ChevronDown,
  Clock,
  Instagram,
  Mail,
  MapPin,
  Music2,
  Phone,
  ShieldCheck,
} from 'lucide-react'
import { Badge, Button, Card, EmptyState, Skeleton, Stars } from '../components/ui'
import { Brand } from '../components/Brand'
import { getProviderBySlug, subscribeData } from '../lib/store'
import { DemoNotice } from '../components/DemoNotice'
import type { ProviderInstance } from '../lib/types'
import { money, optionUnitLabel } from '../lib/format'
import { providerGradient, providerTheme } from '../lib/theme'
import { cn } from '../lib/utils'

export default function ProviderPublic() {
  const { slug = '' } = useParams()
  const navigate = useNavigate()
  const [provider, setProvider] = useState<ProviderInstance | null>(null)
  const [loadedSlug, setLoadedSlug] = useState('')
  const loading = loadedSlug !== slug
  const [openFaq, setOpenFaq] = useState<number | null>(0)

  useEffect(() => {
    let active = true
    const load = () => {
      getProviderBySlug(slug).then((p) => {
        if (!active) return
        setProvider(p)
        setLoadedSlug(slug)
      })
    }
    load()
    const unsubscribe = subscribeData(load)
    return () => {
      active = false
      unsubscribe()
    }
  }, [slug])

  const groups = useMemo(() => {
    if (!provider) return []
    const map = new Map<string, typeof provider.options>()
    provider.options.forEach((o) => {
      const list = map.get(o.group) ?? []
      list.push(o)
      map.set(o.group, list)
    })
    return Array.from(map.entries())
  }, [provider])

  if (loading) {
    return (
      <div className="min-h-screen bg-paper px-4 py-8">
        <div className="mx-auto max-w-3xl space-y-4">
          <Skeleton className="h-64 w-full rounded-3xl" />
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-40 w-full rounded-2xl" />
        </div>
      </div>
    )
  }

  if (!provider) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper px-4">
        <div className="w-full max-w-md">
          <EmptyState
            icon={<Music2 className="h-10 w-10" />}
            title="Cette page n’existe pas"
            description="Le lien de réservation est peut-être erroné ou le prestataire n’est plus référencé."
            action={
              <Link to="/">
                <Button variant="outline">Retour à la démo</Button>
              </Link>
            }
          />
        </div>
      </div>
    )
  }

  const fromPrice = Math.min(...provider.formulas.map((f) => f.price))
  const faqAnswer = (f: { q: string; a: string }) => {
    if (/acompte/i.test(f.q)) {
      return `Après validation de votre date par ${provider.displayName}, l’acompte de ${provider.depositPercent} % est payable sur votre lien de réservation. Il est encaissé par ce seul prestataire et n’est jamais partagé avec un autre. En mode démo, aucun débit réel n’a lieu.`
    }
    if (/déplacement/i.test(f.q)) {
      return `Le déplacement est inclus dans un rayon de ${provider.travelIncludedKm} km autour de ${provider.city}. Au-delà, le kilométrage supplémentaire peut être ajouté en option et apparaît dans le total avant l’envoi de la demande.`
    }
    return f.a
  }

  return (
    <div
      className="min-h-screen bg-paper"
      style={
        providerTheme(provider)
      }
    >
      {/* --------------------------------------------------------- header */}
      <div className="sticky top-0 z-40 border-b border-line/50 bg-paper/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4 sm:px-6">
          <Brand />
          <span className="max-w-[45%] truncate text-[12px] text-ink/45">{provider.displayName}</span>
        </div>
      </div>

      {/* ----------------------------------------------------------- hero */}
      <div className="paper-grain overflow-hidden">
        <div className="mx-auto max-w-3xl px-5 pb-16 pt-12 text-center sm:px-6 sm:pt-16">
          <div className="mb-5 flex flex-wrap items-center justify-center gap-2">
            <Badge tone="outline"><MapPin className="h-3 w-3" /> {provider.city}</Badge>
            <Badge tone="outline"><BadgeCheck className="h-3 w-3" /> Profil démo</Badge>
          </div>
          <h1 className="display-hero !text-[clamp(2.75rem,9vw,4.75rem)]">{provider.displayName}</h1>
          <p className="lede mx-auto mt-5 max-w-lg">{provider.tagline}</p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[12.5px] text-ink/50">
            <span className="inline-flex items-center gap-1.5">
              <Stars rating={provider.stats.rating} />
              <strong className="font-medium text-ink">{provider.stats.rating}</strong>
              <span>({provider.stats.reviews} avis)</span>
            </span>
            <span>{provider.stats.weddings} mariages</span>
            <span>{provider.stats.years} ans d’expérience</span>
          </div>

          <div className="relative mx-auto mt-12 w-[260px] sm:w-[300px]">
            <span className="lanyard-strap" style={{ '--strap': 'var(--provider-tint)' } as React.CSSProperties} />
            <div className={cn('relative overflow-hidden rounded-[28px] float-shadow aspect-[3/3.7]', providerGradient(provider))}>
              <img src={provider.coverPhoto} alt={provider.displayName} className="absolute inset-0 h-full w-full object-cover opacity-90" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-white/10" />
              <span className="lanyard-slot" />
              <div className="absolute inset-x-0 bottom-0 bg-white/85 p-4 backdrop-blur-xl">
                <p className="text-[15px] font-medium tracking-[-0.02em]">{provider.displayName}</p>
                <p className="mt-0.5 text-[12px] text-ink/50">{provider.city} · {provider.zone}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --------------------------------------------------------- content */}
      <main className="mx-auto max-w-3xl px-4 pb-40 pt-6 sm:px-6">
        <DemoNotice className="mb-6">
          <strong className="font-medium text-ink">Profil de démonstration.</strong> Tarifs et avis sont des exemples.
          Aucun paiement réel n’est effectué.
        </DemoNotice>

        {/* à propos */}
        <section className="mb-10">
          <div className="flex flex-wrap gap-2">
            {provider.styles.map((s) => (
              <Badge key={s} tone="outline">
                {s}
              </Badge>
            ))}
          </div>
          <p className="mt-4 text-[15px] leading-relaxed text-ink/70">{provider.bio}</p>
          <div className="mt-5 grid grid-cols-3 gap-3 rounded-3xl border border-line/70 bg-card p-4">
            <div>
              <p className="text-2xl font-medium tracking-[-0.04em] text-ink">{provider.stats.weddings}</p>
              <p className="mt-1 text-[11px] text-ink/45">Mariages</p>
            </div>
            <div>
              <p className="text-2xl font-medium tracking-[-0.04em] text-ink">{provider.stats.radiusKm} km</p>
              <p className="mt-1 text-[11px] text-ink/45">Rayon</p>
            </div>
            <div>
              <p className="text-2xl font-medium tracking-[-0.04em] text-ink">{provider.depositPercent} %</p>
              <p className="mt-1 text-[11px] text-ink/45">Acompte</p>
            </div>
          </div>
        </section>

        {/* formules */}
        <section id="prestations" className="mb-10">
          <h2 className="display-page mb-2 text-ink">Mes formules</h2>
          <p className="mb-5 text-[14px] text-ink/55">
            Prix TTC, déplacement inclus dans {provider.travelIncludedKm} km. Les options s’ajoutent à l’étape suivante.
          </p>
          <div className="space-y-3">
            {provider.formulas.map((f) => (
              <Card
                key={f.id}
                variant={f.highlight ? 'accent' : 'default'}
                className={cn(
                  'relative overflow-hidden',
                  f.highlight && 'ring-1 ring-ink/10',
                )}
              >
                {f.highlight && (
                  <span className="absolute right-4 top-4 rounded-full bg-ink px-3 py-1 text-[11px] font-medium text-white">
                    Populaire
                  </span>
                )}
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="text-[21px] font-medium tracking-[-0.035em] leading-tight text-ink">{f.name}</h3>
                    <p className="text-[13px] text-ink/50">{f.tagline}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-[24px] font-medium tracking-[-0.04em] leading-none text-ink">{money(f.price)}</p>
                    <p className="mt-1 inline-flex items-center gap-1 text-[11.5px] text-ink/45">
                      <Clock className="h-3 w-3" /> {f.duration}
                    </p>
                  </div>
                </div>
                <p className="mt-3 text-[14px] leading-relaxed text-ink/65">{f.description}</p>
                <ul className="mt-4 space-y-1.5">
                  {f.includes.map((inc) => (
                    <li key={/déplacement inclus/i.test(inc) ? `Déplacement inclus dans ${provider.travelIncludedKm} km` : inc} className="flex items-start gap-2 text-[13.5px] text-ink/70">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink/40" />
                      {/déplacement inclus/i.test(inc) ? `Déplacement inclus dans ${provider.travelIncludedKm} km` : inc}
                    </li>
                  ))}
                </ul>
                <Button
                  className="mt-5"
                  full
                  variant={f.highlight ? 'accent' : 'primary'}
                  onClick={() => navigate(`/p/${provider.slug}/reserver?f=${f.id}`)}
                  icon={<ArrowRight className="h-4 w-4" />}
                >
                  Choisir cette formule
                </Button>
              </Card>
            ))}
          </div>
        </section>

        {/* options */}
        <section id="options" className="mb-10">
          <h2 className="display-page mb-2 text-ink">Options</h2>
          <p className="mb-5 text-[14px] text-ink/55">
            Modifiables à la réservation, ajustables par le prestataire ensuite.
          </p>
          <div className="space-y-5">
            {groups.map(([group, options]) => (
              <div key={group}>
                <p className="mb-2 text-[11px] font-medium text-ink/40">
                  {group}
                </p>
                <Card padded={false} className="divide-y divide-line">
                  {options.map((o) => (
                    <div key={o.id} className="flex items-start justify-between gap-4 p-4">
                      <div className="min-w-0">
                        <p className="text-[14.5px] font-medium text-ink">{o.name}</p>
                        <p className="mt-0.5 text-[13px] leading-relaxed text-ink/55">
                          {o.description}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-[14px] font-medium text-ink">
                          {o.price > 0 ? money(o.price) : 'Inclus'}
                        </p>
                        {o.price > 0 && o.unit !== 'forfait' && (
                          <p className="text-[11.5px] text-ink/45">
                            {optionUnitLabel(o.unit, 2)}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </Card>
              </div>
            ))}
          </div>
        </section>

        {/* galerie */}
        {provider.gallery.length > 0 && (
          <section className="mb-10">
            <h2 className="display-page mb-5 text-ink">En images</h2>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              {provider.gallery.map((g, i) => (
                <figure
                  key={g.id}
                  className={cn(
                    'overflow-hidden rounded-2xl border border-line/60 bg-card',
                    i === 0 && 'col-span-2 sm:col-span-2',
                  )}
                >
                  <img
                    src={g.src}
                    alt={g.caption}
                    className={cn(
                      'w-full object-cover',
                      i === 0 ? 'aspect-[16/10]' : 'aspect-[4/3]',
                    )}
                    loading="lazy"
                  />
                  <figcaption className="px-2.5 py-2 text-[11.5px] text-ink/50">{g.caption}</figcaption>
                </figure>
              ))}
            </div>
          </section>
        )}

        {/* avis */}
        {provider.reviews.length > 0 && (
          <section className="mb-10">
            <div className="mb-4 flex items-baseline justify-between gap-3">
              <h2 className="display-page text-ink">Ils en parlent</h2>
              <Badge tone="outline">Avis d’exemple</Badge>
            </div>
            <div className="space-y-3">
              {provider.reviews.map((r, i) => (
                <Card key={i}>
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <Stars rating={r.rating} />
                    </div>
                    <span className="text-[11.5px] text-ink/40">{r.date}</span>
                  </div>
                  <p className="text-[14px] leading-relaxed text-ink/70">“{r.text}”</p>
                  <p className="mt-2.5 text-[12.5px] font-medium text-ink">{r.author}</p>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* faq */}
        <section className="mb-10">
          <h2 className="display-page mb-5 text-ink">Questions fréquentes</h2>
          <Card padded={false} className="divide-y divide-line">
            {provider.faq.map((f, i) => (
              <div key={i}>
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="flex w-full items-center justify-between gap-3 p-4 text-left"
                >
                  <span className="text-[14.5px] font-medium text-ink">{f.q}</span>
                  <ChevronDown
                    className={cn(
                      'h-4 w-4 shrink-0 text-ink/40 transition-transform',
                      openFaq === i && 'rotate-180',
                    )}
                  />
                </button>
                {openFaq === i && (
                  <p className="px-4 pb-4 text-[14px] leading-relaxed text-ink/65">{faqAnswer(f)}</p>
                )}
              </div>
            ))}
          </Card>
        </section>

        {/* contact */}
        <section className="mb-4">
          <h2 className="display-page mb-5 text-ink">Contact</h2>
          <Card>
            <div className="space-y-3 text-[14px] text-ink/70">
              <a href={`tel:${provider.contact.phone}`} className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-ink/40" /> {provider.contact.phone}
              </a>
              <a href={`mailto:${provider.contact.email}`} className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-ink/40" /> {provider.contact.email}
              </a>
              <p className="flex items-center gap-3">
                <Instagram className="h-4 w-4 text-ink/40" /> {provider.contact.instagram}
              </p>
              <p className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-ink/40" /> {provider.zone}
              </p>
            </div>
            <p className="mt-4 border-t border-line/60 pt-3 text-[11.5px] text-ink/40">
              {provider.legal.siret} · {provider.legal.insurance}
            </p>
          </Card>
        </section>
      </main>

      {/* ------------------------------------------------------ sticky bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line/60 bg-paper/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 pt-3 pb-safe">
          <div className="min-w-0">
            <p className="text-[11px] text-ink/45">À partir de</p>
            <p className="text-xl font-medium tracking-[-0.03em] leading-none text-ink">{money(fromPrice)}</p>
          </div>
          <Button
            full
            size="lg"
            variant="accent"
            className="flex-1"
            onClick={() => navigate(`/p/${provider.slug}/reserver`)}
            icon={<CalendarDays className="h-4 w-4" />}
          >
            Réserver une date
          </Button>
        </div>
        <div className="mx-auto flex max-w-3xl items-center justify-center gap-1.5 px-4 pb-2 text-[11px] text-ink/45">
          <ShieldCheck className="h-3 w-3" />
          Acompte de {provider.depositPercent} % encaissé par {provider.displayName} uniquement
        </div>
      </div>
    </div>
  )
}
