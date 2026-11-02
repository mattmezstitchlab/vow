import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  CalendarCheck,
  CalendarDays,
  Check,
  CreditCard,
  ExternalLink,
  Lock,
  Music2,
  ShieldCheck,
  Sparkles,
  Store,
  Wallet,
} from 'lucide-react'
import { Badge, Button, Card, SectionTitle, Stars } from '../components/ui'
import { DemoNotice } from '../components/DemoNotice'
import { listProviders } from '../lib/store'
import type { ProviderInstance } from '../lib/types'
import { money } from '../lib/format'

const STEPS = [
  {
    icon: Music2,
    title: 'Le client choisit sa formule',
    text: 'Formules, options, tarifs : tout est affiché, sans appel ni devis à attendre.',
  },
  {
    icon: CalendarDays,
    title: 'Il propose une date',
    text: 'Les dates indisponibles sont bloquées. La demande part chez le prestataire en un clic.',
  },
  {
    icon: CalendarCheck,
    title: 'Le prestataire confirme',
    text: 'Le back-office confirme la date, ajuste les options et l’acompte se calcule seul.',
  },
  {
    icon: CreditCard,
    title: 'L’acompte est encaissé',
    text: 'Le client paie sur son lien sécurisé. Le prestataire voit le règlement tomber.',
  },
]

export default function Landing() {
  const [providers, setProviders] = useState<ProviderInstance[]>([])

  useEffect(() => {
    listProviders().then(setProviders)
  }, [])

  return (
    <div className="min-h-screen bg-paper">
      {/* ------------------------------------------------------------ nav */}
      <header className="sticky top-0 z-40 border-b border-line/70 bg-paper/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <Link to="/" className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand text-accent">
              <Music2 className="h-5 w-5" />
            </span>
            <span className="font-display text-xl leading-none text-ink">Cadence</span>
          </Link>
          <nav className="hidden items-center gap-7 text-[13px] font-medium text-ink/70 md:flex">
            <a href="#processus" className="transition-colors hover:text-ink">
              Comment ça marche
            </a>
            <a href="#prestataires" className="transition-colors hover:text-ink">
              Prestataires
            </a>
            <a href="#backoffice" className="transition-colors hover:text-ink">
              Espace prestataire
            </a>
            <Link to="/studio" className="transition-colors hover:text-ink">
              Studio
            </Link>
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/studio">
              <Button variant="outline" size="sm">
                Studio
              </Button>
            </Link>
            <a href="#prestataires">
              <Button size="sm" icon={<ArrowRight className="h-4 w-4" />}>
                Voir la démo
              </Button>
            </a>
          </div>
        </div>
      </header>

      {/* ----------------------------------------------------------- hero */}
      <section className="paper-grain relative overflow-hidden">
        <div className="mx-auto grid max-w-6xl gap-12 px-4 pb-16 pt-14 sm:px-6 sm:pt-20 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div>
            <Badge tone="accent" className="mb-5">
              <Sparkles className="h-3 w-3" /> Démo interactive · 5 prestataires fictifs
            </Badge>
            <h1 className="font-display text-[44px] leading-[1.03] text-ink sm:text-[62px] lg:text-[70px]">
              Vos mariages se réservent
              <span className="block italic text-accent">tout seuls.</span>
            </h1>
            <p className="mt-6 max-w-xl text-[16px] leading-relaxed text-ink/65 sm:text-[17px]">
              Cadence donne à chaque prestataire de mariage un lien de réservation
              personnel : formules, options, tarifs, dates proposées, confirmation et
              acompte. Vous ne traitez plus les demandes par message.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a href="#prestataires">
                <Button size="lg" full className="sm:w-auto" icon={<ArrowRight className="h-4 w-4" />}>
                  Ouvrir la démo
                </Button>
              </a>
              <Link to="/studio">
                <Button variant="outline" size="lg" full className="sm:w-auto">
                  Créer mon instance
                </Button>
              </Link>
            </div>
            <dl className="mt-10 grid max-w-lg grid-cols-3 gap-4 border-t border-line pt-6">
              <div>
                <dt className="font-display text-2xl text-ink">5 min</dt>
                <dd className="mt-1 text-[12px] text-ink/55">pour réserver côté client</dd>
              </div>
              <div>
                <dt className="font-display text-2xl text-ink">30 %</dt>
                <dd className="mt-1 text-[12px] text-ink/55">d’acompte après confirmation</dd>
              </div>
              <div>
                <dt className="font-display text-2xl text-ink">0 €</dt>
                <dd className="mt-1 text-[12px] text-ink/55">d’acompte partagé</dd>
              </div>
            </dl>
          </div>

          <PhoneMock />
        </div>
        <div className="mx-auto max-w-6xl px-4 pb-8 sm:px-6">
          <DemoNotice>
            <strong className="font-semibold text-ink">Démo prête à présenter.</strong> Les cinq prestataires sont fictifs.
            Les liens fonctionnent dans ce navigateur ; les paiements et e-mails sont simulés.
          </DemoNotice>
        </div>
      </section>

      {/* ------------------------------------------------------- process */}
      <section id="processus" className="border-y border-line bg-card">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <SectionTitle
            eyebrow="Le parcours"
            title="Quatre étapes, zéro friction"
            description="Le client va droit au but. Le prestataire valide. L’acompte tombe dans le bon compte."
          />
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, i) => (
              <Card key={step.title} className="relative overflow-hidden">
                <span className="absolute -right-3 -top-4 font-display text-[72px] leading-none text-ink/5">
                  {i + 1}
                </span>
                <span className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-brand/8 text-brand">
                  <step.icon className="h-5 w-5" />
                </span>
                <h3 className="mb-2 font-display text-xl leading-snug text-ink">{step.title}</h3>
                <p className="text-[13.5px] leading-relaxed text-ink/60">{step.text}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* --------------------------------------------------- prestataires */}
      <section id="prestataires" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionTitle
            eyebrow="La démo"
            title="Un modèle, cinq prestataires"
            description="Chaque prestataire a sa page publique, son back-office et son propre journal d’acomptes. Aucun panier commun, aucun partage de règlement."
          />
          <Link to="/studio">
            <Button variant="outline" size="sm">
              Personnaliser une instance
            </Button>
          </Link>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {providers.map((p) => (
            <Card key={p.id} padded={false} className="overflow-hidden">
              <Link to={`/p/${p.slug}`} className="block">
                <div className="relative h-40 overflow-hidden">
                  <img
                    src={p.coverPhoto}
                    alt={p.displayName}
                    className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/85 to-transparent p-3">
                    <p className="font-display text-lg leading-tight text-white">{p.displayName}</p>
                    <p className="text-[11.5px] text-white/70">{p.city}</p>
                  </div>
                </div>
              </Link>
              <div className="p-4">
                <p className="mb-2.5 line-clamp-2 text-[13px] leading-relaxed text-ink/60">
                  {p.tagline}
                </p>
                <div className="mb-3 flex items-center justify-between text-[12px]">
                  <span className="inline-flex items-center gap-1.5 text-ink/60">
                    <Stars rating={p.stats.rating} /> {p.stats.rating}
                  </span>
                  <span className="text-ink/60">
                    dès <strong className="font-semibold text-ink">
                      {money(Math.min(...p.formulas.map((f) => f.price)))}
                    </strong>
                  </span>
                </div>
                <div className="flex gap-2">
                  <Link to={`/p/${p.slug}`} className="flex-1">
                    <Button variant="primary" size="sm" full>
                      Page publique
                    </Button>
                  </Link>
                  <Link to={`/bo/${p.slug}`} className="flex-1">
                    <Button variant="outline" size="sm" full>
                      Back-office
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          ))}

          <Link
            to="/studio"
            className="flex min-h-[320px] flex-col items-center justify-center rounded-2xl border border-dashed border-line bg-card/50 p-6 text-center transition-colors hover:border-accent/60 hover:bg-accent/5"
          >
            <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-accent/12 text-accent">
              <Sparkles className="h-5 w-5" />
            </span>
            <p className="font-display text-xl text-ink">Votre instance</p>
            <p className="mt-1.5 text-[13px] text-ink/55">
              Clonez le modèle, changez photos, textes et tarifs.
            </p>
          </Link>
        </div>
      </section>

      {/* ----------------------------------------------------- back-office */}
      <section id="backoffice" className="border-y border-line bg-brand text-white">
        <div className="mx-auto grid max-w-6xl gap-12 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-2 lg:items-center">
          <div>
            <div className="max-w-2xl">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-accent">Espace prestataire</p>
              <h2 className="font-display text-[30px] leading-[1.1] text-white sm:text-[38px]">Un back-office simple, à la taille du métier</h2>
              <p className="mt-3 text-[15px] leading-relaxed text-white/70">Pas de logiciel à apprendre. On confirme une date, on règle une option, on suit les acomptes.</p>
            </div>
            <ul className="mt-7 space-y-3.5">
              {[
                'Demandes reçues, classées par date',
                'Confirmation ou refus en un clic',
                'Réglage des options et du prix sur chaque dossier',
                'Journal des acomptes encaissés',
                'Code d’accès propre à chaque prestataire',
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-[14.5px] text-white/80">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/25 text-accent">
                    <Check className="h-3 w-3" />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
            <Link to="/bo/lucas-ferrand" className="mt-8 inline-block">
              <Button variant="accent" size="lg">
                Ouvrir le back-office démo
              </Button>
            </Link>
          </div>
          <BackOfficeMock />
        </div>
      </section>

      {/* ------------------------------------------------------ isolation */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <SectionTitle
              eyebrow="Cloisonnement"
              title="Un acompte n’appartient qu’à son prestataire"
              description="Chaque instance possède son propre espace de stockage, son propre journal et sa propre session. Un règlement encaissé par Lucas Ferrand n’est ni visible, ni déplaçable, ni encaissable depuis le back-office d’un autre prestataire."
            />
            <div className="mt-6 flex flex-wrap gap-2">
              <Badge tone="brand">
                <Lock className="h-3 w-3" /> Sessions par instance
              </Badge>
              <Badge tone="brand">
                <Wallet className="h-3 w-3" /> Ledger séparés
              </Badge>
              <Badge tone="brand">
                <ShieldCheck className="h-3 w-3" /> Accès croisés refusés
              </Badge>
            </div>
          </div>
          <IsolationDiagram />
        </div>
      </section>

      {/* ----------------------------------------------------------- cta */}
      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 sm:pb-20">
        <div className="overflow-hidden rounded-3xl bg-accent-soft p-8 sm:p-12">
          <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-display text-[32px] leading-tight text-ink sm:text-[40px]">
                Prêt pour vos cinq prochains prestataires ?
              </h2>
              <p className="mt-3 max-w-xl text-[15px] text-ink/65">
                Le modèle « Saxophone de mariage » est prêt à être cloné : photos, textes,
                formules, options et tarifs se remplacent en quelques minutes.
              </p>
            </div>
            <Link to="/studio" className="shrink-0">
              <Button size="lg" icon={<ArrowRight className="h-4 w-4" />}>
                Ouvrir le Studio
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------- footer */}
      <footer className="border-t border-line bg-card">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <div className="flex flex-col gap-8 sm:flex-row sm:justify-between">
            <div className="max-w-xs">
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand text-accent">
                  <Music2 className="h-5 w-5" />
                </span>
                <span className="font-display text-xl text-ink">Cadence</span>
              </div>
              <p className="mt-3 text-[13px] leading-relaxed text-ink/55">
                La réservation en ligne pour les prestataires de mariage. Un lien par
                prestataire, un back-office par métier.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-10 sm:gap-16">
              <div>
                <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.16em] text-ink/40">
                  Produit
                </p>
                <ul className="space-y-2 text-[13.5px] text-ink/65">
                  <li>
                    <a href="#processus" className="hover:text-ink">
                      Comment ça marche
                    </a>
                  </li>
                  <li>
                    <a href="#prestataires" className="hover:text-ink">
                      Prestataires démo
                    </a>
                  </li>
                  <li>
                    <Link to="/studio" className="hover:text-ink">
                      Studio de modèles
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.16em] text-ink/40">
                  Légal
                </p>
                <ul className="space-y-2 text-[13.5px] text-ink/65">
                  <li>
                    <Link to="/legal" className="hover:text-ink">
                      Mentions légales
                    </Link>
                  </li>
                  <li>
                    <Link to="/legal#confidentialite" className="hover:text-ink">
                      Confidentialité
                    </Link>
                  </li>
                  <li>
                    <Link to="/legal#paiement" className="hover:text-ink">
                      Paiement de l’acompte
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          <p className="mt-10 border-t border-line pt-6 text-[12px] text-ink/45">
            Démonstration — aucun paiement réel n’est effectué. Les données de la démo sont
            stockées uniquement dans votre navigateur.
          </p>
        </div>
      </footer>
    </div>
  )
}

/* ------------------------------------------------------------------ mocks */

function PhoneMock() {
  return (
    <div className="relative mx-auto w-full max-w-[330px]">
      <div className="absolute -inset-6 -z-10 rounded-[40px] bg-accent/12 blur-2xl" />
      <div className="overflow-hidden rounded-[32px] border border-line bg-card shadow-[0_30px_70px_-25px_rgba(23,18,14,0.35)]">
        <div className="relative h-56">
          <img
            src="/img/hero-sax.jpg"
            alt="Aperçu de la page prestataire"
            className="h-full w-full object-cover object-[62%_center]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/10 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-accent">
              Bordeaux · Gironde
            </p>
            <p className="font-display text-[26px] leading-tight text-white">Lucas Ferrand</p>
            <p className="mt-0.5 text-[12px] text-white/70">Saxophone de cérémonie & de bal</p>
          </div>
        </div>
        <div className="space-y-2.5 p-4">
          {[
            { name: 'Cérémonie', price: '590 €' },
            { name: 'Cérémonie + Cocktail', price: '890 €', hot: true },
            { name: 'Journée complète', price: '1 490 €' },
          ].map((f) => (
            <div
              key={f.name}
              className={`flex items-center justify-between rounded-xl border px-3.5 py-2.5 ${
                f.hot ? 'border-accent/50 bg-accent/6' : 'border-line'
              }`}
            >
              <span className="text-[13px] font-medium text-ink">{f.name}</span>
              <span className="text-[13px] font-semibold text-ink">{f.price}</span>
            </div>
          ))}
          <div className="flex items-center justify-between rounded-full bg-brand px-4 py-3">
            <span className="text-[13px] font-semibold text-white">Réserver ma date</span>
            <ArrowRight className="h-4 w-4 text-accent" />
          </div>
        </div>
      </div>
    </div>
  )
}

function BackOfficeMock() {
  const rows = [
    { name: 'Thomas & Sarah', date: '12 sept.', status: 'Confirmée', tone: 'success' as const },
    { name: 'Élodie & Rémi', date: '03 oct.', status: 'À valider', tone: 'warning' as const },
    { name: 'Nina & Léo', date: '21 sept.', status: 'Acompte reçu', tone: 'brand' as const },
  ]
  return (
    <div className="rounded-2xl border border-white/12 bg-white/6 p-4 backdrop-blur-sm sm:p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Store className="h-4 w-4 text-accent" />
          <span className="text-[13px] font-semibold text-white">Demandes · Lucas Ferrand</span>
        </div>
        <Badge tone="accent">Cloisonné</Badge>
      </div>
      <div className="grid grid-cols-3 gap-2.5">
        {[
          { k: 'En attente', v: '3' },
          { k: 'Confirmées', v: '8' },
          { k: 'Acomptes', v: '2 340 €' },
        ].map((s) => (
          <div key={s.k} className="rounded-xl bg-white/8 px-3 py-2.5">
            <p className="font-display text-lg leading-none text-white">{s.v}</p>
            <p className="mt-1 text-[10.5px] uppercase tracking-wider text-white/55">{s.k}</p>
          </div>
        ))}
      </div>
      <div className="mt-3 space-y-2">
        {rows.map((r) => (
          <div
            key={r.name}
            className="flex items-center justify-between rounded-xl bg-white/6 px-3.5 py-2.5"
          >
            <div className="min-w-0">
              <p className="truncate text-[13px] font-medium text-white">{r.name}</p>
              <p className="text-[11.5px] text-white/55">{r.date}</p>
            </div>
            <Badge tone={r.tone}>{r.status}</Badge>
          </div>
        ))}
      </div>
      <p className="mt-4 flex items-center gap-1.5 text-[11px] text-white/45">
        <ExternalLink className="h-3 w-3" /> Code d’accès propre à cette instance
      </p>
    </div>
  )
}

function IsolationDiagram() {
  return (
    <div className="relative">
      <div className="absolute left-1/2 top-16 hidden h-10 w-px -translate-x-1/2 bg-line sm:block" />
      <Card className="mx-auto max-w-md p-5 text-center">
        <span className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-brand/8 text-brand">
          <Wallet className="h-5 w-5" />
        </span>
        <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-ink/40">
          Journal des acomptes
        </p>
        <p className="mt-1.5 font-display text-lg text-ink">Instance · Lucas Ferrand</p>
        <div className="mt-4 space-y-2 text-left">
          {[
            ['Nina & Léo', '267 €', '12:04'],
            ['Thomas & Sarah', '657 €', '09:41'],
            ['Élodie & Rémi', 'en attente', '—'],
          ].map(([n, v, t]) => (
            <div
              key={n}
              className="flex items-center justify-between rounded-xl border border-line px-3.5 py-2.5"
            >
              <span className="text-[13px] text-ink/75">{n}</span>
              <span className="text-[13px] font-semibold text-ink">{v}</span>
              <span className="w-12 text-right text-[11px] text-ink/35">{t}</span>
            </div>
          ))}
        </div>
        <p className="mt-4 text-[11.5px] leading-relaxed text-ink/45">
          Dans le back-office d’un prestataire, seules ses propres lignes apparaissent.
          Chaque instance possède sa clé de stockage ; le Studio de démo offre une vue d’ensemble séparée.
        </p>
      </Card>
    </div>
  )
}
