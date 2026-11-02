export type OptionUnit = 'forfait' | 'heure' | 'personne' | 'km'

export interface AudioSample {
  id: string
  title: string
  src: string
  duration: string
}

export interface Formula {
  id: string
  name: string
  tagline: string
  price: number
  duration: string
  description: string
  includes: string[]
  highlight?: boolean
  /** Extraits de démonstration que le couple peut écouter avant de choisir. */
  audioSamples?: AudioSample[]
}

export interface Option {
  id: string
  name: string
  description: string
  price: number
  unit: OptionUnit
  maxQty: number
  group: string
}

export interface GalleryItem {
  id: string
  src: string
  caption: string
}

export interface Palette {
  brand: string
  accent: string
  paper: string
}

export interface Review {
  author: string
  date: string
  rating: number
  text: string
}

export interface Faq {
  q: string
  a: string
}

export interface ProviderInstance {
  id: string
  slug: string
  templateId: string
  displayName: string
  businessName: string
  tagline: string
  bio: string
  city: string
  zone: string
  styles: string[]
  stats: {
    weddings: number
    years: number
    radiusKm: number
    rating: number
    reviews: number
  }
  coverPhoto: string
  gallery: GalleryItem[]
  formulas: Formula[]
  options: Option[]
  depositPercent: number
  /** Rayon de déplacement inclus dans les formules, en km. */
  travelIncludedKm: number
  accessCode: string
  palette: Palette
  blockedDates: string[]
  contact: { email: string; phone: string; website: string; instagram: string }
  faq: Faq[]
  reviews: Review[]
  legal: { siret: string; insurance: string }
  createdAt: number
}

export type BookingStatus =
  | 'proposee'
  | 'date_a_accepter'
  | 'confirmee'
  | 'acompte_paye'
  | 'refusee'
  | 'annulee'
  | 'terminee'

export type Slot = 'matin' | 'aprem' | 'soir'

export interface BookingLine {
  optionId: string
  name: string
  unit: OptionUnit
  unitPrice: number
  qty: number
  lineTotal: number
}

export interface TimelineEntry {
  at: number
  label: string
  detail?: string
  actor: 'client' | 'prestataire' | 'systeme'
}

export interface Booking {
  id: string
  providerId: string
  code: string
  status: BookingStatus
  createdAt: number
  updatedAt: number
  client: {
    firstName: string
    lastName: string
    email: string
    phone: string
    couple: string
    city: string
    venue: string
    eventType: string
    guestCount: number
    distanceKm: number
    message: string
  }
  formulaId: string
  formulaName: string
  formulaPrice: number
  options: BookingLine[]
  date: string
  slot: Slot
  pricing: {
    subtotal: number
    total: number
    depositPercent: number
    depositAmount: number
  }
  deposit: {
    amount: number
    status: 'en_attente' | 'paye' | 'rembourse'
    paidAt?: number
    method?: string
    reference?: string
  }
  timeline: TimelineEntry[]
  note?: string
  /** Incrémenté à chaque ajustement du devis ; protège le paiement d'un montant obsolète. */
  quoteVersion: number
  /** Identifiant de soumission côté client : empêche les doublons en cas de re-clic. */
  requestId?: string
}

export interface TemplateDef {
  id: string
  name: string
  category: string
  description: string
  coverPhoto: string
  accentPreview: string
  payload: Omit<
    ProviderInstance,
    'id' | 'slug' | 'createdAt' | 'accessCode'
  >
}
