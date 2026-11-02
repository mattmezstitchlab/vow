import { Link } from 'react-router-dom'
import { cn } from '../lib/utils'

/** Symbole Noria en SVG, sans tuile ni fond carré. */
export function BrandMark({ className, dark = false }: { className?: string; dark?: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex h-10 w-10 shrink-0 items-center justify-center',
        dark ? 'text-white' : 'text-ink',
        className,
      )}
      data-testid="brand-mark"
      aria-hidden
    >
      <svg viewBox="0 0 24 24" className="h-full w-full" fill="none">
        <circle cx="12" cy="12" r="8.8" stroke="#8b5cf6" strokeWidth="0.8" strokeDasharray="2 2.5" opacity="0.7" />
        <path d="M12 6.7v3m5.3 2.3h-3m-2.3 5.3v-3m-5.3-2.3h3" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round" />
        <circle cx="12" cy="3.7" r="2.05" fill="#8b5cf6" />
        <circle cx="20.3" cy="12" r="2.05" fill="#fb7185" />
        <circle cx="12" cy="20.3" r="2.05" fill="#22d3ee" />
        <circle cx="3.7" cy="12" r="2.05" fill="#4f8bfa" />
        <circle cx="12" cy="12" r="1.9" fill="currentColor" />
      </svg>
    </span>
  )
}

export function Brand({ className, dark = false, to = '/' }: { className?: string; dark?: boolean; to?: string }) {
  return (
    <Link to={to} className={cn('inline-flex items-center gap-3', className)} aria-label="Noria — accueil">
      <BrandMark dark={dark} />
      <span className={cn('text-[18px] font-semibold tracking-[-0.03em]', dark ? 'text-white' : 'text-ink')}>
        Noria
      </span>
    </Link>
  )
}
