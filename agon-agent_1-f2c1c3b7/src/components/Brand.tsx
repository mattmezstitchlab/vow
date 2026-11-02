import { Link } from 'react-router-dom'
import { cn } from '../lib/utils'

/** Marque Noria : pictogramme simple en squircle, typographie sans serif. */
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
    <Link to={to} className={cn('inline-flex items-center gap-2.5', className)} aria-label="Noria — accueil">
      <BrandMark dark={dark} />
      <span className={cn('text-[15px] font-semibold tracking-[-0.02em]', dark ? 'text-white' : 'text-ink')}>
        Noria
      </span>
    </Link>
  )
}
