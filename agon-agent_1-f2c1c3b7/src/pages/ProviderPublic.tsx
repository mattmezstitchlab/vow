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
import { getProviderBySlug } from '../lib/store'
import type { ProviderInstance } from '../lib/types'
import { money, optionUnitLabel } from '../lib/format'
import { cn } from '../lib/utils'

export default function ProviderPublic() {
  const { slug = '' } = useParams()
  const navigate = useNavigate()
  const [provider, setProvider] = useState<ProviderInstance | null>(null)
  const [loading, setLoading] = useState(true)
  const [openFaq, setOpenFaq] = useState<number | null>(0)

  useEffect(() => {
    let active = true
    setLoading(true)
    getProviderBySlug(slug).then((p) => {
      if (!active) return
      setProvider(p)
      setLoading(false)
    })
    return () => {
      active = false
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
      {/* --------------------------------------------------------- header */}
      <div className="sticky top-0 z-40 border-b border-line/70 bg-paper/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-2.5">
          <Link to="/" className="flex items-center gap-2 text-ink/70 transition-colors hover:text-ink">
            <Music2 className="h-4 w-4" />
            <span className="text-[13px] font-semibold">Cadence</span>
          </Link>
          <span className="text-[12px] text-ink/50">{provider.displayName}</span>
        </div>
      </div>

      {/* ----------------------------------------------------------- hero */}
      <div className="mx-auto max-w-3xl">
        <div className="relative h-[46vh] min-h-[320px] w-full overflow-hidden sm:h-[54vh]">
          <img
            src={provider.coverPhoto}
            alt={provider.displayName}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/92 via-ink/25 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-4 sm:p-6">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Badge className="bg-white/15 text-white backdrop-blur-sm">
                <MapPin className="h-3 w-3" /> {provider.city}
              </Badge>
              <Badge className="bg-white/15 text-white backdrop-blur-sm">
                <BadgeCheck className="h-3 w-3 text-accent" /> Vérifié
              </Badge>
            </div>
            <h1 className="font-display text-[40px] leading-[1.02] text-white sm:text-[54px]">
              {provider.displayName}
            </h1>
            <p className="mt-1.5 max-w-lg text-[14.5px] text-white/75">{provider.tagline}</p>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12.5px] text-white/70">
              <span className="inline-flex items-center gap-1.5">
                <Stars rating={provider.stats.rating} />
                <strong className="font-semibold text-white">{provider.stats.rating}</strong>
                <span>({provider.stats.reviews} avis)</span>
              </span>
              <span>{provider.stats.weddings} mariages</span>
              <span>{provider.stats.years} ans d’expérience</span>
            </div>
          </div>
        </div>
      </div>

      {/* --------------------------------------------------------- content */}
      <main className="mx-auto max-w-3xl px-4 pb-40 pt-6 sm:px-6">
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
          <div className="mt-5 grid grid-cols-3 gap-3 rounded-2xl border border-line bg-card p-4">
            <div>
              <p className="font-display text-2xl text-ink">{provider.stats.weddings}</p>
              <p className="mt-1 text-[11px] uppercase tracking-wider text-ink/45">Mariages</p>
            </div>
            <div>
              <p className="font-display text-2xl text-ink">{provider.stats.radiusKm} km</p>
              <p className="mt-1 text-[11px] uppercase tracking-wider text-ink/45">Rayon</p>
            </div>
            <div>
              <p className="font-display text-2xl text-ink">{provider.depositPercent} %</p>
              <p className="mt-1 text-[11px] uppercase tracking-wider text-ink/45">Acompte</p>
            </div>
          </div>
        </section>

        {/* formules */}
        <section id="prestations" className="mb-10">
          <h2 className="mb-1 font-display text-[30px] text-ink">Mes formules</h2>
          <p className="mb-5 text-[14px] text-ink/55">
            Prix TTC, déplacement inclus dans 50 km. Les options s’ajoutent à l’étape suivante.
          </p>
          <div className="space-y-3">
            {provider.formulas.map((f) => (
              <Card
                key={f.id}
                variant={f.highlight ? 'accent' : 'default'}
                className={cn(
                  'relative overflow-hidden',
                  f.highlight && 'shadow-[0_8px_30px_-18px_rgba(185,134,63,0.6)]',
                )}
              >
                {f.highlight && (
                  <span className="absolute right-0 top-0 rounded-bl-xl bg-accent px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                    Populaire
                  </span>
                )}
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="font-display text-[23px] leading-tight text-ink">{f.name}</h3>
                    <p className="text-[13px] text-accent">{f.tagline}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-display text-[26px] leading-none text-ink">{money(f.price)}</p>
                    <p className="mt-1 inline-flex items-center gap-1 text-[11.5px] text-ink/45">
                      <Clock className="h-3 w-3" /> {f.duration}
                    </p>
                  </div>
                </div>
                <p className="mt-3 text-[14px] leading-relaxed text-ink/65">{f.description}</p>
                <ul className="mt-4 space-y-1.5">
                  {f.includes.map((inc) => (
                    <li key={inc} className="flex items-start gap-2 text-[13.5px] text-ink/70">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
                      {inc}
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
          <h2 className="mb-1 font-display text-[30px] text-ink">Options</h2>
          <p className="mb-5 text-[14px] text-ink/55">
            Modifiables à la réservation, ajustables par le prestataire ensuite.
          </p>
          <div className="space-y-5">
            {groups.map(([group, options]) => (
              <div key={group}>
                <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-ink/40">
                  {group}
                </p>
                <Card padded={false} className="divide-y divide-line">
                  {options.map((o) => (
                    <div key={o.id} className="flex items-start justify-between gap-4 p-4">
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
            <h2 className="mb-4 font-display text-[30px] text-ink">En images</h2>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              {provider.gallery.map((g, i) => (
                <figure
                  key={g.id}
                  className={cn(
                    'overflow-hidden rounded-xl border border-line bg-card',
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
            <h2 className="mb-4 font-display text-[30px] text-ink">Ils en parlent</h2>
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
                  <p className="mt-2.5 text-[12.5px] font-semibold text-ink">{r.author}</p>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* faq */}
        <section className="mb-10">
          <h2 className="mb-4 font-display text-[30px] text-ink">Questions fréquentes</h2>
          <Card padded={false} className="divide-y divide-line">
            {provider.faq.map((f, i) => (
              <div key={i}>
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="flex w-full items-center justify-between gap-3 p-4 text-left"
                >
                  <span className="text-[14.5px] font-semibold text-ink">{f.q}</span>
                  <ChevronDown
                    className={cn(
                      'h-4 w-4 shrink-0 text-ink/40 transition-transform',
                      openFaq === i && 'rotate-180',
                    )}
                  />
                </button>
                {openFaq === i && (
                  <p className="px-4 pb-4 text-[14px] leading-relaxed text-ink/65">{f.a}</p>
                )}
              </div>
            ))}
          </Card>
        </section>

        {/* contact */}
        <section className="mb-4">
          <h2 className="mb-4 font-display text-[30px] text-ink">Contact</h2>
          <Card>
            <div className="space-y-3 text-[14px] text-ink/70">
              <a href={`tel:${provider.contact.phone}`} className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-accent" /> {provider.contact.phone}
              </a>
              <a href={`mailto:${provider.contact.email}`} className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-accent" /> {provider.contact.email}
              </a>
              <p className="flex items-center gap-3">
                <Instagram className="h-4 w-4 text-accent" /> {provider.contact.instagram}
              </p>
              <p className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-accent" /> {provider.zone}
              </p>
            </div>
            <p className="mt-4 border-t border-line pt-3 text-[11.5px] text-ink/40">
              {provider.legal.siret} · {provider.legal.insurance}
            </p>
          </Card>
        </section>
      </main>

      {/* ------------------------------------------------------ sticky bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-paper/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3">
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-wider text-ink/45">À partir de</p>
            <p className="font-display text-xl leading-none text-ink">{money(fromPrice)}</p>
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
