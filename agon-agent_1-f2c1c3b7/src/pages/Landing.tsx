import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  CalendarCheck,
  CalendarDays,
  Check,
  CreditCard,
  Lock,
  Music2,
  Plus,
  ShieldCheck,
} from 'lucide-react'
import { Brand, BrandMark } from '../components/Brand'
import { listBookings, listProviders } from '../lib/store'
import type { Booking, ProviderInstance } from '../lib/types'
import { formatDateShort, money } from '../lib/format'
import { cardGradient, strapColor } from '../lib/theme'
import { cn } from '../lib/utils'

const STEPS = [
  { icon: Music2, title: 'Choisir', text: 'Formules, options, tarifs. Tout est clair, dès la première visite.' },
  { icon: CalendarDays, title: 'Proposer', text: 'Une date, un lieu, quelques mots. La demande part en un instant.' },
  { icon: CalendarCheck, title: 'Confirmer', text: 'Le prestataire valide la date et ajuste les options si besoin.' },
  { icon: CreditCard, title: 'Réserver', text: 'L’acompte est réglé sur le lien du prestataire. Pas de partage.' },
]

export default function Landing() {
  const [providers, setProviders] = useState<ProviderInstance[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])

  useEffect(() => {
    let active = true
    listProviders().then(async (list) => {
      if (!active) return
      setProviders(list)
      if (list[0]) {
        const b = await listBookings(list[0].id)
        if (active) setBookings(b)
      }
    })
    return () => { active = false }
  }, [])

  const hero = providers[0]

  return (
    <div className="min-h-screen bg-paper text-ink">
      {/* Navigation épurée, sans bordure, comme une page produit. */}
      <header className="absolute inset-x-0 top-0 z-40">
        <div className="mx-auto flex h-20 max-w-[1200px] items-center justify-between px-5 sm:px-8">
          <Brand dark />
          <nav className="hidden items-center gap-8 text-[13px] font-medium text-white/55 md:flex">
            <a href="#parcours" className="transition-colors hover:text-white">Le parcours</a>
            <a href="#prestataires" className="transition-colors hover:text-white">Prestataires</a>
            <a href="#backoffice" className="transition-colors hover:text-white">Espace prestataire</a>
          </nav>
          <a href="#prestataires" className="inline-flex h-9 items-center justify-center rounded-full bg-white px-4 text-[13px] font-medium text-ink transition-colors hover:bg-white/90">
            Voir la démo
          </a>
        </div>
      </header>

      {/* Hero immersif : un seul profil, suspendu par son cordon. */}
      <section className="immersive-hero relative overflow-hidden">
        <div className="immersive-ambience" aria-hidden><div className="ambient-orb ambient-orb-rose" /><div className="ambient-orb ambient-orb-cyan" /><div className="ambient-orb ambient-orb-peach" /></div>
        <div className="relative z-10 mx-auto flex min-h-[1020px] max-w-[1440px] flex-col items-center px-5 pb-16 pt-32 sm:px-8 sm:pt-36 lg:min-h-[900px] lg:flex-row lg:justify-between lg:gap-10 lg:px-12 lg:py-28">
          <div className="relative z-10 mx-auto max-w-[680px] text-center fade-up lg:mx-0 lg:w-[58%] lg:text-left">
            <p className="eyebrow mb-5">Plateforme de réservation multi-métiers</p>
            <h1 className="display-hero">
              Votre métier.<br />Vos règles.<br />Votre lien.
            </h1>
            <p className="lede mx-auto mt-7 max-w-[500px] lg:mx-0">
              Formules, options et disponibilités pensées pour l’activité de chaque prestataire.
              Une page publique et un espace indépendant par instance.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row lg:justify-start">
              <a href="#prestataires" className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-white px-6 text-[14px] font-medium tracking-[-0.01em] text-ink transition-colors hover:bg-white/90">
                Découvrir la démo <ArrowRight className="h-4 w-4" />
              </a>
              <Link to="/studio" className="inline-flex h-12 items-center justify-center rounded-full border border-white/25 bg-white/[0.04] px-6 text-[14px] font-medium tracking-[-0.01em] text-white transition-colors hover:bg-white/10">
                Créer mon instance
              </Link>
            </div>
            <p className="mt-6 text-[12px] text-white/40">
              Démo événementielle · 5 prestataires fictifs · aucun paiement réel
            </p>
          </div>

          {hero && (
            <div className="relative z-0 mt-32 w-full max-w-[400px] lg:mt-0 lg:w-[34%] lg:max-w-[420px] lg:translate-y-10">
              <HeroProviderCard provider={hero} />
            </div>
          )}
        </div>
      </section>

      {/* Aperçu produit sur fond clair : contraste après le hero immersif. */}
      <section id="parcours" className="section-light relative overflow-hidden">
        <div className="mx-auto max-w-[1200px] px-5 pb-24 pt-0 sm:px-8 sm:pb-32">
          <div className="relative mx-auto flex justify-center">
            <div className="lanyard-strap !top-0 !h-[120px] !w-[26px]" style={{ '--strap': '#e88a76' } as React.CSSProperties} />
            <div className="phone-frame sway mt-16">
              <div className="phone-island" />
              <PhoneScreen provider={hero} />
            </div>
          </div>
          <div className="mx-auto mt-14 max-w-[560px] text-center">
            <h2 className="display-section">Une date.<br />Tout est clair.</h2>
            <p className="lede mx-auto mt-5 max-w-[440px]">
              Le client choisit sa formule, propose une date et suit la confirmation.
              Le prestataire garde la main, sans les allers-retours par message.
            </p>
            <Link to={hero ? `/p/${hero.slug}/reserver` : '/p/lucas-ferrand/reserver'} className="mt-8 inline-flex h-12 items-center justify-center gap-2 rounded-full bg-ink px-6 text-[14px] font-medium tracking-[-0.01em] text-white transition-colors hover:bg-ink/85">
              Essayer le parcours <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Carrousel de prestataires sur fond pastel. */}
      <section id="prestataires" className="pastel-stage overflow-hidden py-20 sm:py-28">
        <div className="mx-auto max-w-[720px] px-5 text-center">
          <p className="eyebrow mb-4">La démo</p>
          <h2 className="display-section">À chaque talent,<br />son propre espace.</h2>
          <p className="lede mx-auto mt-5 max-w-[520px]">
            Cinq instances indépendantes. Chacune a sa page, ses formules et son back-office.
            Faites glisser pour les découvrir.
          </p>
        </div>
        <ProviderCarousel providers={providers} />
        <div className="mt-2 text-center">
          <Link to="/studio" className="inline-flex items-center gap-1.5 text-[14px] font-medium text-ink/70 transition-colors hover:text-ink">
            Personnaliser une instance <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Parcours en quatre temps, très aéré. */}
      <section className="section-light py-20 sm:py-28">
        <div className="mx-auto max-w-[1200px] px-5 sm:px-8">
          <div className="mx-auto max-w-[640px] text-center">
            <h2 className="display-section">Quatre étapes.<br />Un seul lien.</h2>
            <p className="lede mx-auto mt-5 max-w-[460px]">
              Pensé pour être utilisé sur téléphone, entre deux rendez-vous ou en pleine préparation.
            </p>
          </div>
          <div className="mt-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
            {STEPS.map((step, i) => (
              <div key={step.title} className="text-center lg:text-left">
                <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-white soft-shadow lg:mx-0">
                  <step.icon className="h-5 w-5 text-ink/70" />
                </div>
                <p className="text-[12px] font-medium text-ink/35">0{i + 1}</p>
                <h3 className="mt-1 text-[20px] font-medium tracking-[-0.03em]">{step.title}</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-ink/55">{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Back-office sur fond noir, carte blanche flottante. */}
      <section id="backoffice" className="section-dark py-20 sm:py-28">
        <div className="mx-auto max-w-[1200px] px-5 sm:px-8">
          <div className="mx-auto max-w-[640px] text-center">
            <p className="eyebrow mb-4">Espace prestataire</p>
            <h2 className="display-section text-white">Votre espace.<br />Sans les allers-retours.</h2>
            <p className="lede mx-auto mt-5 max-w-[480px]">
              Confirmez une date, ajustez une option, suivez l’acompte.
              Chaque prestataire ne voit que ses propres dossiers.
            </p>
          </div>
          <div className="mx-auto mt-14 max-w-[760px]">
            <BackOfficePreview provider={hero} bookings={bookings} />
          </div>
          <div className="mt-10 text-center">
            <Link to={hero ? `/bo/${hero.slug}` : '/bo/lucas-ferrand'} className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-white/20 bg-white px-6 text-[14px] font-medium tracking-[-0.01em] text-black transition-colors hover:bg-white/90">
              Ouvrir le back-office démo <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Cloisonnement : deux cartes, pas de schéma technique. */}
      <section className="section-light py-20 sm:py-28">
        <div className="mx-auto grid max-w-[1200px] items-center gap-14 px-5 sm:px-8 lg:grid-cols-2">
          <div className="max-w-[480px]">
            <p className="eyebrow mb-4">Acomptes</p>
            <h2 className="display-section">Votre acompte.<br />Votre compte.</h2>
            <p className="lede mt-5">
              Pas de panier commun, pas de partage entre prestataires.
              Chaque règlement est rattaché à une seule instance, dans son propre journal.
            </p>
            <div className="mt-7 flex flex-wrap gap-2">
              {['Journal par instance', 'Accès croisés refusés', 'Paiement après confirmation'].map((t) => (
                <span key={t} className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[12px] font-medium text-ink/60 soft-shadow">
                  <Check className="h-3 w-3" /> {t}
                </span>
              ))}
            </div>
          </div>
          <IsolationPreview bookings={bookings} />
        </div>
      </section>

      {/* Studio : halo aurora, carte de création, pas de capture d’e-mail. */}
      <section className="aurora-stage relative overflow-hidden py-24 sm:py-32">
        <div className="mx-auto max-w-[1200px] px-5 text-center sm:px-8">
          <p className="eyebrow mb-4 !text-white/50">Studio de modèles</p>
          <h2 className="display-section text-white">Votre univers.<br /><span className="text-white/45">Prêt à partager.</span></h2>
          <p className="lede mx-auto mt-5 max-w-[460px] !text-white/55">
            Le modèle « Saxophone de mariage » se clone en une instance.
            Photos, textes, formules et tarifs se personnalisent ensuite.
          </p>
          <div className="relative mx-auto mt-14 w-[280px]">
            <div className="aurora-glow absolute -inset-10 rounded-full" aria-hidden />
            <div className="relative overflow-hidden rounded-[28px] border border-white/15 bg-[#0b0b12]/80 p-6 text-left backdrop-blur-xl">
              <div data-testid="studio-logo-orb" className="mx-auto mb-5 flex h-24 w-24 items-center justify-center rounded-full border-2 border-white/80 bg-gradient-to-br from-emerald-400/50 via-cyan-400/30 to-purple-500/60 shadow-[0_12px_45px_-16px_rgba(120,80,220,0.8)]">
                <BrandMark dark className="!h-14 !w-14" />
              </div>
              <p className="text-center text-[20px] font-medium tracking-[-0.03em] text-white">Votre nom</p>
              <p className="mt-1 text-center text-[13px] text-white/50">Saxophone de mariage</p>
              <div className="mt-5 h-px bg-white/15" />
              <p className="mt-4 text-center text-[12px] text-white/45">3 formules · 6 options · acompte 30 %</p>
              <Link to="/studio" className="mt-5 flex h-11 items-center justify-center rounded-full border border-white/20 bg-white text-[13px] font-medium text-black transition-colors hover:bg-white/90">
                Créer mon instance
              </Link>
            </div>
          </div>
          <p className="mx-auto mt-8 max-w-[380px] text-[12px] leading-relaxed text-white/35">
            Chaque instance est indépendante. Les données de la démo restent dans votre navigateur.
          </p>
        </div>
      </section>

      <footer className="section-light border-t border-line/60">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-8 px-5 py-12 sm:flex-row sm:items-start sm:justify-between sm:px-8">
          <div className="max-w-xs">
            <Brand />
            <p className="mt-4 text-[13px] leading-relaxed text-ink/50">
              La réservation en ligne pensée par métier. Un espace indépendant par prestataire.
            </p>
          </div>
          <div className="flex flex-wrap gap-x-10 gap-y-3 text-[13px] text-ink/60">
            <a href="#parcours" className="hover:text-ink">Le parcours</a>
            <a href="#prestataires" className="hover:text-ink">Prestataires</a>
            <Link to="/studio" className="hover:text-ink">Studio</Link>
            <Link to="/legal" className="hover:text-ink">Informations légales</Link>
          </div>
        </div>
        <div className="mx-auto max-w-[1200px] px-5 pb-8 sm:px-8">
          <p className="border-t border-line/60 pt-6 text-[12px] text-ink/40">
            Démonstration — aucun paiement réel. Les données sont stockées uniquement dans votre navigateur.
          </p>
        </div>
      </footer>
    </div>
  )
}

/* ------------------------------------------------------------------ hero card */

function HeroProviderCard({ provider }: { provider: ProviderInstance }) {
  const startingPrice = Math.min(...provider.formulas.map((formula) => formula.price))

  return (
    <div className="hero-card-sway">
      <Link
        to={`/p/${provider.slug}`}
        className="hero-provider-link group block"
        style={{ '--strap': strapColor(0) } as React.CSSProperties}
        aria-label={`Voir la page de ${provider.displayName}`}
        data-testid="hero-provider-card"
      >
        <span className="lanyard-strap hero-lanyard" aria-hidden />
        <div className={cn('hero-card-inner', cardGradient(0))}>
          <img src={provider.coverPhoto} alt="" className="hero-card-photo absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-white/10" />
          <span className="lanyard-slot hero-lanyard-slot" aria-hidden />
          <div className="absolute inset-x-0 bottom-0 bg-white/85 p-5 backdrop-blur-xl sm:p-6">
            <p className="truncate text-[24px] font-medium tracking-[-0.04em] text-ink">{provider.displayName}</p>
            <p className="mt-1 truncate text-[14px] text-ink/55">{provider.tagline}</p>
            <div className="mt-5 flex items-center justify-between border-t border-ink/10 pt-4">
              <div>
                <p className="text-[11px] text-ink/45">À partir de</p>
                <p className="mt-0.5 text-[16px] font-medium tracking-[-0.02em] text-ink">{money(startingPrice)}</p>
              </div>
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-ink text-white transition-transform duration-700 ease-out group-hover:translate-x-1">
                <ArrowUpRight className="h-5 w-5" />
              </span>
            </div>
          </div>
        </div>
      </Link>
    </div>
  )
}

function PhoneScreen({ provider }: { provider?: ProviderInstance }) {
  const formula = provider?.formulas.find((f) => f.highlight) ?? provider?.formulas[1]
  return (
    <div className="relative h-[580px] bg-[#f7f7f8] px-4 pb-5 pt-12 text-ink">
      <div className="flex items-center justify-between text-[11px] font-semibold">
        <span>9:41</span>
        <span className="flex items-center gap-1"><span className="h-2 w-3 rounded-[2px] bg-ink" /></span>
      </div>
      <div className="mt-4 flex items-center justify-between">
        <BrandMark className="!h-7 !w-7" />
        <span className="rounded-full bg-ink px-3 py-1 text-[10px] font-medium text-white">Réservation</span>
      </div>
      <div className="relative mt-5 overflow-hidden rounded-[22px] float-shadow">
        <div className={cn('relative h-[210px]', cardGradient(0))}>
          <img src={provider?.coverPhoto ?? '/img/hero-sax.jpg'} alt="" className="absolute inset-0 h-full w-full object-cover opacity-90" />
          <span className="lanyard-slot" />
          <div className="absolute inset-x-0 bottom-0 bg-white/85 p-3.5 backdrop-blur-xl">
            <p className="text-[17px] font-medium tracking-[-0.03em]">{provider?.displayName ?? 'Lucas Ferrand'}</p>
            <p className="text-[11px] text-ink/50">{provider?.city ?? 'Bordeaux'} · Saxophone</p>
          </div>
        </div>
      </div>
      <div className="mt-4 rounded-2xl bg-white p-3.5 soft-shadow">
        <p className="text-[13px] font-medium">{formula?.name ?? 'Cérémonie + Cocktail'}</p>
        <div className="mt-2 flex items-center justify-between text-[11px] text-ink/50">
          <span className="inline-flex items-center gap-1"><CalendarDays className="h-3 w-3" /> Date à confirmer</span>
          <span className="font-medium text-ink">{money(formula?.price ?? 890)}</span>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between rounded-2xl bg-white p-3.5 soft-shadow">
        <span className="text-[11px] text-ink/50">Acompte après confirmation</span>
        <span className="text-[13px] font-medium">{money(Math.round((formula?.price ?? 890) * 0.3))}</span>
      </div>
      <div className="mt-4 flex h-11 items-center justify-center rounded-full bg-ink text-[13px] font-medium text-white">
        Réserver une date
      </div>
    </div>
  )
}

function ProviderCarousel({ providers }: { providers: ProviderInstance[] }) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)
  const count = providers.length + 1

  const scrollTo = (index: number) => {
    const track = trackRef.current
    if (!track) return
    const clamped = Math.max(0, Math.min(count - 1, index))
    const child = track.children[clamped] as HTMLElement | undefined
    if (!child) return
    track.scrollTo({ left: child.offsetLeft - track.offsetLeft - (track.clientWidth - child.clientWidth) / 2, behavior: 'smooth' })
    setActive(clamped)
  }

  const onScroll = () => {
    const track = trackRef.current
    if (!track) return
    const center = track.scrollLeft + track.clientWidth / 2
    let best = 0
    let bestDist = Infinity
    Array.from(track.children).forEach((child, i) => {
      const el = child as HTMLElement
      const c = el.offsetLeft - track.offsetLeft + el.clientWidth / 2
      const d = Math.abs(c - center)
      if (d < bestDist) { bestDist = d; best = i }
    })
    setActive(best)
  }

  return (
    <div className="mt-6">
      <div ref={trackRef} className="carousel-track" onScroll={onScroll}>
        {providers.map((p, i) => (
          <article key={p.id} className="carousel-card" style={{ '--card-tilt': '0deg' } as React.CSSProperties}>
            <span className="lanyard-strap carousel-strap" style={{ '--strap': strapColor(i) } as React.CSSProperties} />
            <div className={cn('relative overflow-hidden rounded-[26px] float-shadow aspect-[3/4.15]', cardGradient(i))}>
              <Link to={`/p/${p.slug}`} className="absolute inset-0" aria-label={`Page publique de ${p.displayName}`}>
                <img src={p.coverPhoto} alt={p.displayName} className="absolute inset-0 h-full w-full object-cover opacity-90 transition-transform duration-500 hover:scale-[1.03]" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-white/10" />
              </Link>
              <span className="lanyard-slot" />
              <div className="absolute inset-x-0 bottom-0 bg-white/85 p-5 backdrop-blur-xl">
                <p className="text-[22px] font-medium tracking-[-0.04em] text-ink">{p.displayName}</p>
                <p className="mt-0.5 line-clamp-1 text-[12px] text-ink/50">{p.tagline}</p>
                <div className="mt-4 flex items-center justify-between gap-2">
                  <span className="text-[12px] text-ink/60">dès <strong className="font-medium text-ink">{money(Math.min(...p.formulas.map((f) => f.price)))}</strong></span>
                  <div className="flex items-center gap-1.5">
                    <Link to={`/bo/${p.slug}`} className="rounded-full bg-ink/6 px-3 py-1.5 text-[11px] font-medium text-ink/70 hover:bg-ink/10">Gérer</Link>
                    <Link to={`/p/${p.slug}/reserver`} className="inline-flex items-center gap-1 rounded-full bg-ink px-3 py-1.5 text-[11px] font-medium text-white">
                      Réserver <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </article>
        ))}
        <article className="carousel-card">
          <Link to="/studio" className="flex aspect-[3/4.15] flex-col items-center justify-center rounded-[26px] border border-dashed border-ink/15 bg-white/50 p-6 text-center backdrop-blur-sm transition-colors hover:bg-white/70">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white soft-shadow"><Plus className="h-6 w-6 text-ink/60" /></span>
            <p className="mt-5 text-[20px] font-medium tracking-[-0.03em]">Votre instance</p>
            <p className="mt-2 text-[13px] leading-relaxed text-ink/50">Clonez le modèle, changez photos, textes et tarifs.</p>
          </Link>
        </article>
      </div>
      <div className="flex items-center justify-center gap-4">
        <button type="button" onClick={() => scrollTo(active - 1)} disabled={active === 0} aria-label="Précédent" className="flex h-9 w-9 items-center justify-center rounded-full bg-white/80 text-ink/70 soft-shadow disabled:opacity-30">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-2 rounded-full bg-white/70 px-3 py-2 soft-shadow">
          {Array.from({ length: count }).map((_, i) => (
            <button key={i} type="button" onClick={() => scrollTo(i)} aria-label={`Aller à la carte ${i + 1}`} className={cn('h-1.5 rounded-full transition-all', i === active ? 'w-5 bg-ink' : 'w-1.5 bg-ink/25')} />
          ))}
        </div>
        <button type="button" onClick={() => scrollTo(active + 1)} disabled={active === count - 1} aria-label="Suivant" className="flex h-9 w-9 items-center justify-center rounded-full bg-white/80 text-ink/70 soft-shadow disabled:opacity-30">
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

function BackOfficePreview({ provider, bookings }: { provider?: ProviderInstance; bookings: Booking[] }) {
  const pending = bookings.filter((b) => b.status === 'proposee').length
  const confirmed = bookings.filter((b) => b.status === 'confirmee' || b.status === 'acompte_paye').length
  const collected = bookings.filter((b) => b.deposit.status === 'paye').reduce((s, b) => s + b.deposit.amount, 0)
  return (
    <div className="overflow-hidden rounded-[28px] bg-white text-ink float-shadow">
      <div className="flex items-center justify-between border-b border-line/60 px-5 py-4">
        <div className="flex items-center gap-2.5">
          <BrandMark className="!h-7 !w-7" />
          <div>
            <p className="text-[13px] font-medium">{provider?.displayName ?? 'Lucas Ferrand'}</p>
            <p className="text-[11px] text-ink/45">Espace prestataire · aperçu</p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-ink/5 px-2.5 py-1 text-[11px] font-medium text-ink/60"><Lock className="h-3 w-3" /> Cloisonné</span>
      </div>
      <div className="grid grid-cols-3 gap-3 p-5">
        {[
          { k: 'En attente', v: String(pending) },
          { k: 'Confirmées', v: String(confirmed) },
          { k: 'Acomptes', v: money(collected) },
        ].map((s) => (
          <div key={s.k} className="rounded-2xl bg-ink/[0.035] p-3.5">
            <p className="text-[20px] font-medium tracking-[-0.04em]">{s.v}</p>
            <p className="mt-1 text-[11px] text-ink/45">{s.k}</p>
          </div>
        ))}
      </div>
      <div className="space-y-2 px-5 pb-5">
        {bookings.slice(0, 3).map((b) => (
          <div key={b.code} className="flex items-center justify-between rounded-2xl border border-line/60 px-4 py-3">
            <div className="min-w-0">
              <p className="truncate text-[13px] font-medium">{b.client.couple}</p>
              <p className="text-[11px] text-ink/45">{formatDateShort(b.date)} · {b.formulaName}</p>
            </div>
            <span className={cn('shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium', b.deposit.status === 'paye' ? 'bg-emerald-50 text-emerald-700' : b.status === 'confirmee' ? 'bg-ink/6 text-ink/70' : 'bg-amber-50 text-amber-700')}>
              {b.deposit.status === 'paye' ? 'Acompte reçu' : b.status === 'confirmee' ? 'Confirmée' : 'À valider'}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function IsolationPreview({ bookings }: { bookings: Booking[] }) {
  const rows = bookings.slice(0, 3)
  return (
    <div className="relative mx-auto w-full max-w-[420px]">
      <div className="absolute -left-6 top-8 hidden w-[85%] rotate-[-6deg] rounded-[24px] bg-white p-5 opacity-60 soft-shadow sm:block" aria-hidden>
        <p className="text-[12px] font-medium text-ink/40">Autre instance</p>
        <div className="mt-3 h-2 w-2/3 rounded-full bg-ink/8" />
        <div className="mt-2 h-2 w-1/2 rounded-full bg-ink/8" />
      </div>
      <div className="relative rounded-[28px] bg-white p-6 float-shadow">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-ink text-white"><ShieldCheck className="h-4 w-4" /></span>
            <p className="text-[14px] font-medium">Journal des acomptes</p>
          </div>
          <span className="rounded-full bg-ink/5 px-2.5 py-1 text-[11px] text-ink/50">Cette instance</span>
        </div>
        <div className="mt-5 space-y-2.5">
          {rows.length === 0 && <p className="text-[13px] text-ink/45">Chargement de l’aperçu…</p>}
          {rows.map((b) => (
            <div key={b.code} className="flex items-center justify-between rounded-2xl bg-ink/[0.03] px-4 py-3">
              <div>
                <p className="text-[13px] font-medium">{b.client.couple}</p>
                <p className="text-[11px] text-ink/45">{b.deposit.status === 'paye' ? 'Reçu' : 'En attente'}</p>
              </div>
              <p className="text-[14px] font-medium tracking-[-0.02em]">{b.deposit.status === 'paye' ? money(b.deposit.amount) : '—'}</p>
            </div>
          ))}
        </div>
        <p className="mt-5 text-[12px] leading-relaxed text-ink/45">
          Dans le back-office d’un prestataire, seules ses propres lignes apparaissent.
        </p>
      </div>
    </div>
  )
}
