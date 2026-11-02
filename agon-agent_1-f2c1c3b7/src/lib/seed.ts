import type { Booking, ProviderInstance } from './types'
import { TEMPLATES } from './templates'
import { addDays, todayISO } from './format'
import { slugify, uid } from './utils'

interface SeedSpec {
  templateId: string
  slug: string
  displayName: string
  businessName: string
  tagline: string
  bio: string
  city: string
  zone: string
  accent: string
  brand: string
  accessCode: string
  stats: ProviderInstance['stats']
  contact: ProviderInstance['contact']
  styles: string[]
  blockedOffsets: number[]
}

const SEEDS: SeedSpec[] = [
  {
    templateId: 'saxophone',
    slug: 'lucas-ferrand',
    displayName: 'Lucas Ferrand',
    businessName: 'Lucas Ferrand Saxophone',
    tagline: 'Saxophone de cérémonie & de bal — Bordeaux',
    bio: "Saxophoniste professionnel depuis 12 ans, plus de 140 mariages en Aquitaine. Je compose un accompagnement qui va de l'entrée solennelle des mariés jusqu'à la dernière danse, en passant par un cocktail décontracté et un bal qui ne s'arrête pas.",
    city: 'Bordeaux',
    zone: 'Gironde · 120 km',
    accent: '#B9863F',
    brand: '#12271F',
    accessCode: 'SAXO-2468',
    stats: { weddings: 148, years: 12, radiusKm: 120, rating: 4.9, reviews: 63 },
    contact: {
      email: 'bonjour@lucasferrand.fr',
      phone: '06 12 34 56 78',
      website: 'www.lucasferrand.fr',
      instagram: '@lucasferrand_sax',
    },
    styles: ['Saxophone', 'Jazz & swing', 'Pop / covers', 'Cérémonie'],
    blockedOffsets: [11, 18, 25, 47],
  },
  {
    templateId: 'saxophone',
    slug: 'camille-rheault',
    displayName: 'Camille Rheault',
    businessName: 'Camille Rheault Duo Jazz',
    tagline: 'Saxophone & piano — Paris intra-muros et proche banlieue',
    bio: "Duo saxophone-piano, un répertoire pensé pour les mariages parisiens : standards de jazz, variété et ballades. Sur scène ou en duo acoustique pour les cérémonies en intérieur.",
    city: 'Paris 11e',
    zone: 'Île-de-France · 70 km',
    accent: '#8C5E3C',
    brand: '#1C1B22',
    accessCode: 'SAXO-3197',
    stats: { weddings: 89, years: 7, radiusKm: 70, rating: 4.9, reviews: 37 },
    contact: {
      email: 'contact@camilleurheault.fr',
      phone: '06 22 41 09 87',
      website: 'www.camilleurheault.fr',
      instagram: '@camille_rheault',
    },
    styles: ['Saxophone', 'Piano', 'Jazz', 'Chanson'],
    blockedOffsets: [9, 16, 30, 44],
  },
  {
    templateId: 'dj',
    slug: 'studio-onze',
    displayName: 'Studio Onze',
    businessName: 'Studio Onze — DJ & animation',
    tagline: 'DJ, animation et sonorisation pour mariages — Lyon & Rhône',
    bio: "Studio Onze mixe depuis 2017. Console, sonorisation complète, lumières et animation : on construit une soirée qui vous ressemble, du premier verre à la dernière chanson.",
    city: 'Lyon',
    zone: 'Rhône · 90 km',
    accent: '#C2603C',
    brand: '#241C1A',
    accessCode: 'ONZE-4410',
    stats: { weddings: 96, years: 9, radiusKm: 90, rating: 4.8, reviews: 41 },
    contact: {
      email: 'hello@studioonze.fr',
      phone: '07 81 55 62 30',
      website: 'www.studioonze.fr',
      instagram: '@studioonze',
    },
    styles: ['DJ', 'House', 'Pop / latino', 'Animation'],
    blockedOffsets: [14, 21, 38],
  },
  {
    templateId: 'harp',
    slug: 'ariane-delcourt',
    displayName: 'Ariane Delcourt',
    businessName: 'Ariane Delcourt — Harpe & Quatuor',
    tagline: 'Harpe solo et quatuor à cordes — Nantes & vallée de la Loire',
    bio: "Harpe solo, quatuor à cordes et chœur pour vos cérémonies et dîners de noces. Un accompagnement sobre, précis, qui laisse la place aux voix.",
    city: 'Nantes',
    zone: 'Loire-Atlantique · 150 km',
    accent: '#5F7360',
    brand: '#1D2A25',
    accessCode: 'HARPE-5521',
    stats: { weddings: 74, years: 15, radiusKm: 150, rating: 5, reviews: 38 },
    contact: {
      email: 'bonjour@arianedelcourt.fr',
      phone: '06 44 19 03 22',
      website: 'www.arianedelcourt.fr',
      instagram: '@ariane_delcourt',
    },
    styles: ['Harpe', 'Quatuor', 'Classique', 'Variété'],
    blockedOffsets: [12, 19, 33],
  },
  {
    templateId: 'saxophone',
    slug: 'marc-delon',
    displayName: 'Marc Delon',
    businessName: 'Marc Delon Saxo & DJ',
    tagline: 'Saxophone live puis DJ set — Nice, Aix-en-Provence',
    bio: "Un set saxophone pour l'entrée et le dîner, puis un DJ set pour faire danser la salle. Deux univers, une seule soirée.",
    city: 'Nice',
    zone: 'Alpes-Maritimes · 120 km',
    accent: '#2F6F8F',
    brand: '#15242B',
    accessCode: 'DELON-7734',
    stats: { weddings: 61, years: 6, radiusKm: 120, rating: 4.7, reviews: 24 },
    contact: {
      email: 'contact@marcdelon.fr',
      phone: '06 65 28 90 14',
      website: 'www.marcdelon.fr',
      instagram: '@marc_delon_music',
    },
    styles: ['Saxophone', 'DJ set', 'Pop', 'Ibiza'],
    blockedOffsets: [13, 27, 41],
  },
]

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

export function buildSeedInstances(): ProviderInstance[] {
  const today = todayISO()
  return SEEDS.map((spec) => {
    const template = TEMPLATES.find((t) => t.id === spec.templateId)
    if (!template) throw new Error(`Template inconnu: ${spec.templateId}`)
    const payload = clone(template.payload)
    return {
      ...payload,
      id: uid('prov'),
      slug: spec.slug,
      displayName: spec.displayName,
      businessName: spec.businessName,
      tagline: spec.tagline,
      bio: spec.bio,
      city: spec.city,
      zone: spec.zone,
      styles: spec.styles,
      stats: spec.stats,
      contact: spec.contact,
      accessCode: spec.accessCode,
      palette: { brand: spec.brand, accent: spec.accent, paper: payload.palette.paper },
      blockedDates: spec.blockedOffsets.map((d) => addDays(today, d)),
      createdAt: Date.now() - Math.floor(Math.random() * 40 + 10) * 86400000,
    }
  })
}

interface SeedBookingSpec {
  providerIndex: number
  code: string
  status: Booking['status']
  firstName: string
  lastName: string
  email: string
  phone: string
  couple: string
  formulaIndex: number
  optionIds: string[]
  qtyByOption: Record<string, number>
  dayOffset: number
  slot: Booking['slot']
  guestCount: number
  distanceKm: number
  venue: string
  eventType: string
  message: string
  daysAgo: number
  paid?: boolean
}

const BOOKING_SEEDS: SeedBookingSpec[] = [
  {
    providerIndex: 0,
    code: 'LUC-7K2F',
    status: 'proposee',
    firstName: 'Élodie',
    lastName: 'Marchand',
    email: 'elodie.marchand@example.fr',
    phone: '06 21 45 88 03',
    couple: 'Élodie & Rémi',
    formulaIndex: 1,
    optionIds: ['o3'],
    qtyByOption: { o3: 1 },
    dayOffset: 34,
    slot: 'aprem',
    guestCount: 110,
    distanceKm: 0,
    venue: 'Château de Vayres',
    eventType: 'Mariage religieux',
    message: "Bonjour, nous nous marions le 12 juillet à Vayres. Nous aimerions un clip vidéo pour notre Instagram.",
    daysAgo: 1,
  },
  {
    providerIndex: 0,
    code: 'LUC-M4T8',
    status: 'confirmee',
    firstName: 'Thomas',
    lastName: 'Nguyen',
    email: 'thomas.nguyen@example.fr',
    phone: '06 74 12 90 55',
    couple: 'Thomas & Sarah',
    formulaIndex: 2,
    optionIds: ['o1', 'o2', 'o4'],
    qtyByOption: { o1: 2, o2: 1, o4: 1 },
    dayOffset: 62,
    slot: 'soir',
    guestCount: 120,
    distanceKm: 0,
    venue: 'Domaine de Louyat',
    eventType: 'Mariage laïque',
    message: 'Journée complète, cocktail puis bal jusqu’à 22 h. Merci de prévoir un set de jazz pour le cocktail.',
    daysAgo: 4,
  },
  {
    providerIndex: 0,
    code: 'LUC-Q9P3',
    status: 'acompte_paye',
    firstName: 'Nina',
    lastName: 'Perrin',
    email: 'nina.perrin@example.fr',
    phone: '07 11 60 47 29',
    couple: 'Nina & Léo',
    formulaIndex: 0,
    optionIds: ['o5'],
    qtyByOption: { o5: 35 },
    dayOffset: 21,
    slot: 'matin',
    guestCount: 70,
    distanceKm: 85,
    venue: 'Abbaye de Flaran',
    eventType: 'Mariage civil',
    message: 'Cérémonie civile en petit comité, la sortie des mariés compte beaucoup pour nous.',
    daysAgo: 11,
    paid: true,
  },
  {
    providerIndex: 1,
    code: 'CAM-3R7X',
    status: 'confirmee',
    firstName: 'Antoine',
    lastName: 'Lefèvre',
    email: 'antoine.lefevre@example.fr',
    phone: '06 33 82 17 90',
    couple: 'Antoine & Inès',
    formulaIndex: 1,
    optionIds: ['o2'],
    qtyByOption: { o2: 1 },
    dayOffset: 45,
    slot: 'soir',
    guestCount: 90,
    distanceKm: 0,
    venue: 'Château de Vaux-le-Vicomte',
    eventType: 'Mariage laïque',
    message: 'Nous aimerions un duo pour l’entrée puis le bal.',
    daysAgo: 3,
  },
  {
    providerIndex: 1,
    code: 'CAM-B8N5',
    status: 'proposee',
    firstName: 'Julie',
    lastName: 'Barakat',
    email: 'julie.barakat@example.fr',
    phone: '06 90 55 21 44',
    couple: 'Julie & Paul',
    formulaIndex: 2,
    optionIds: ['o1', 'o4'],
    qtyByOption: { o1: 1, o4: 1 },
    dayOffset: 70,
    slot: 'soir',
    guestCount: 95,
    distanceKm: 0,
    venue: 'Abbaye de Royaumont',
    eventType: 'Mariage religieux',
    message: 'Journée complète avec un set de jazz pour la cérémonie, si possible.',
    daysAgo: 2,
  },
  {
    providerIndex: 2,
    code: 'ONZ-5J1C',
    status: 'acompte_paye',
    firstName: 'Romain',
    lastName: 'Almeida',
    email: 'romain.almeida@example.fr',
    phone: '07 44 12 08 36',
    couple: 'Romain & Chloé',
    formulaIndex: 1,
    optionIds: ['o2', 'o5'],
    qtyByOption: { o2: 1, o5: 25 },
    dayOffset: 52,
    slot: 'soir',
    guestCount: 140,
    distanceKm: 65,
    venue: 'Domaine du Château de la Loire',
    eventType: 'Mariage laïque',
    message: 'Soirée avec photo booth, la famille adore ça.',
    daysAgo: 9,
    paid: true,
  },
  {
    providerIndex: 3,
    code: 'ARI-2D6W',
    status: 'confirmee',
    firstName: 'Manon',
    lastName: 'Girard',
    email: 'manon.girard@example.fr',
    phone: '06 58 90 12 07',
    couple: 'Manon & Simon',
    formulaIndex: 1,
    optionIds: ['o2'],
    qtyByOption: { o2: 1 },
    dayOffset: 88,
    slot: 'aprem',
    guestCount: 85,
    distanceKm: 0,
    venue: 'Château de la Groulaie',
    eventType: 'Mariage religieux',
    message: 'Nous aimerions une marche nuptiale composée pour nous.',
    daysAgo: 6,
  },
  {
    providerIndex: 4,
    code: 'DEL-9H4V',
    status: 'proposee',
    firstName: 'Cédric',
    lastName: 'Mora',
    email: 'cedric.mora@example.fr',
    phone: '06 07 51 84 62',
    couple: 'Cédric & Doriane',
    formulaIndex: 1,
    optionIds: ['o1'],
    qtyByOption: { o1: 1 },
    dayOffset: 29,
    slot: 'soir',
    guestCount: 100,
    distanceKm: 0,
    venue: 'Villa Ephrussi',
    eventType: 'Mariage civil',
    message: 'Saxo pour le dîner puis DJ set pour la fin de soirée.',
    daysAgo: 1,
  },
]

export function buildSeedBookings(instances: ProviderInstance[]): Record<string, Booking[]> {
  const result: Record<string, Booking[]> = {}
  instances.forEach((p) => {
    result[p.id] = []
  })

  const today = todayISO()

  BOOKING_SEEDS.forEach((spec) => {
    const instance = instances[spec.providerIndex]
    if (!instance) return
    const formula = instance.formulas[spec.formulaIndex]
    if (!formula) return

    const lines = spec.optionIds
      .map((optionId) => {
        const opt = instance.options.find((o) => o.id === optionId)
        if (!opt) return null
        const qty = spec.qtyByOption[optionId] ?? 1
        return {
          optionId: opt.id,
          name: opt.name,
          unit: opt.unit,
          unitPrice: opt.price,
          qty,
          lineTotal: Math.round(opt.price * qty * 100) / 100,
        }
      })
      .filter((l): l is NonNullable<typeof l> => l !== null)

    const optionsTotal = lines.reduce((sum, l) => sum + l.lineTotal, 0)
    const total = Math.round((formula.price + optionsTotal) * 100) / 100
    const depositAmount = Math.round((total * instance.depositPercent) / 100 * 100) / 100
    const createdAt = Date.now() - spec.daysAgo * 86400000

    const timeline: Booking['timeline'] = [
      { at: createdAt, label: 'Demande envoyée', detail: 'Formule et options sélectionnées.', actor: 'client' },
    ]
    if (spec.status !== 'proposee') {
      timeline.push({
        at: createdAt + 3600000 * 6,
        label: 'Date confirmée',
        detail: 'La date a été validée par le prestataire.',
        actor: 'prestataire',
      })
    }
    if (spec.status === 'acompte_paye') {
      timeline.push({
        at: createdAt + 3600000 * 20,
        label: 'Acompte reçu (démo)',
        detail: 'Paiement accepté sur le lien de réservation.',
        actor: 'systeme',
      })
    }

    const booking: Booking = {
      id: uid('bk'),
      providerId: instance.id,
      code: spec.code,
      quoteVersion: 1,
      status: spec.status,
      createdAt,
      updatedAt: createdAt + 3600000 * 8,
      client: {
        firstName: spec.firstName,
        lastName: spec.lastName,
        email: spec.email,
        phone: spec.phone,
        couple: spec.couple,
        city: instance.city,
        venue: spec.venue,
        eventType: spec.eventType,
        guestCount: spec.guestCount,
        distanceKm: spec.distanceKm,
        message: spec.message,
      },
      formulaId: formula.id,
      formulaName: formula.name,
      formulaPrice: formula.price,
      options: lines,
      date: addDays(today, spec.dayOffset),
      slot: spec.slot,
      pricing: {
        subtotal: formula.price,
        total,
        depositPercent: instance.depositPercent,
        depositAmount,
      },
      deposit: {
        amount: depositAmount,
        status: spec.paid ? 'paye' : 'en_attente',
        paidAt: spec.paid ? createdAt + 3600000 * 20 : undefined,
        method: spec.paid ? 'Carte bancaire (démo)' : undefined,
        reference: spec.paid ? `DEP-${instance.slug.slice(0, 3).toUpperCase()}-${spec.code.slice(-4)}` : undefined,
      },
      timeline,
      note: spec.status === 'proposee' ? 'En attente de validation de la date.' : undefined,
    }

    result[instance.id].push(booking)
  })

  return result
}

export function slugFromName(name: string): string {
  return slugify(name)
}
