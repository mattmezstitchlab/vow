import type { CSSProperties } from 'react'
import type { ProviderInstance } from './types'

/**
 * Le système graphique reste neutre (noir / blanc / gris) quel que soit le
 * prestataire. La palette personnalisée sert uniquement de teinte décorative
 * (`--provider-tint`) : cartes, straps et halos, jamais de texte doré/vert.
 */
export function providerTheme(provider: ProviderInstance): CSSProperties {
  return {
    '--color-brand': '#111113',
    '--color-accent': '#55555e',
    '--color-paper': '#f7f7f8',
    '--provider-tint': provider.palette.accent,
  } as CSSProperties
}

export const CARD_GRADIENTS = ['gradient-rose', 'gradient-ocean', 'gradient-lilac', 'gradient-sage', 'gradient-peach'] as const

export function cardGradient(index: number): string {
  return CARD_GRADIENTS[index % CARD_GRADIENTS.length]
}

export function strapColor(index: number): string {
  return ['#e88a76', '#5aa7d8', '#a77bf0', '#8fbf9a', '#f0a070'][index % 5]
}

const TEMPLATE_ORDER = ['saxophone', 'dj', 'booth', 'harp', 'officiant']

export function providerGradient(provider: ProviderInstance): string {
  const i = TEMPLATE_ORDER.indexOf(provider.templateId)
  return cardGradient(i >= 0 ? i : 0)
}
