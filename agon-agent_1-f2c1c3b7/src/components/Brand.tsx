import { Link } from 'react-router-dom'
import { cn } from '../lib/utils'

/** Marque Cadence : pictogramme simple en squircle, typographie sans serif. */
export function BrandMark({ className, dark = false }: { className?: string; dark?: boolean }) {
  return (
    <span
      className={cn(
        'flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] shadow-[0_2px_8px_rgb(0_0_0/0.12)]',
        dark ? 'bg-white text-black' : 'bg-gradient-to-b from-white to-[#ececef] text-black ring-1 ring-black/5',
        className,
      )}
      aria-hidden
    >
      <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none">
        <path d="M7 16.5V6.8c0-.5.4-.9.9-.8l8.6 1.7c.4.1.7.4.7.8v8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <circle cx="5.4" cy="16.6" r="2.1" fill="currentColor" />
        <circle cx="15.5" cy="15.6" r="2.1" fill="currentColor" />
      </svg>
    </span>
  )
}

export function Brand({ className, dark = false, to = '/' }: { className?: string; dark?: boolean; to?: string }) {
  return (
    <Link to={to} className={cn('inline-flex items-center gap-2.5', className)} aria-label="Cadence — accueil">
      <BrandMark dark={dark} />
      <span className={cn('text-[15px] font-semibold tracking-[-0.02em]', dark ? 'text-white' : 'text-ink')}>
        Cadence
      </span>
    </Link>
  )
}
