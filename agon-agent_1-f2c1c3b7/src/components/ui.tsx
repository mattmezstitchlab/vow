import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, ChevronDown, Loader2, X } from 'lucide-react'
import { cn } from '../lib/utils'

/* ------------------------------------------------------------------ button */

type ButtonVariant = 'primary' | 'accent' | 'secondary' | 'outline' | 'ghost' | 'danger'
type ButtonSize = 'sm' | 'md' | 'lg'

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-brand text-white hover:bg-brand/85 active:scale-[0.98]',
  accent: 'bg-brand text-white hover:bg-brand/85 active:scale-[0.98]',
  secondary: 'bg-ink/6 text-ink hover:bg-ink/10',
  outline: 'border border-line bg-card text-ink hover:bg-ink/[0.03] hover:border-ink/20',
  ghost: 'text-ink/70 hover:bg-ink/6 hover:text-ink',
  danger: 'bg-red-600 text-white hover:bg-red-700',
}

const SIZES: Record<ButtonSize, string> = {
  sm: 'h-9 px-4 text-[13px]',
  md: 'h-11 px-5 text-[14px]',
  lg: 'h-12 px-6 text-[14px]',
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  full?: boolean
  loading?: boolean
  icon?: ReactNode
}

export function Button({
  variant = 'primary',
  size = 'md',
  full,
  loading,
  icon,
  className,
  children,
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-full font-medium tracking-[-0.01em] transition-all duration-200',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
        'disabled:cursor-not-allowed disabled:opacity-45',
        VARIANTS[variant],
        SIZES[size],
        full && 'w-full',
        className,
      )}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : icon}
      {children}
    </button>
  )
}

/* -------------------------------------------------------------------- card */

export type CardVariant = 'default' | 'accent' | 'success' | 'soft' | 'plain'

const CARD_VARIANTS: Record<CardVariant, string> = {
  default: 'bg-card border-line/70',
  accent: 'bg-[#f4f4f6] border-line',
  success: 'bg-emerald-600/6 border-emerald-600/30',
  soft: 'bg-ink/[0.03] border-transparent',
  plain: 'bg-transparent border-line',
}

export function Card({
  className,
  children,
  padded = true,
  variant = 'default',
}: {
  className?: string
  children: ReactNode
  padded?: boolean
  variant?: CardVariant
}) {
  return (
    <div
      className={cn(
        'rounded-3xl border shadow-[0_1px_2px_rgb(17_17_19/0.02),0_12px_40px_-24px_rgb(17_17_19/0.10)]',
        CARD_VARIANTS[variant],
        padded && 'p-5',
        className,
      )}
    >
      {children}
    </div>
  )
}

/* ------------------------------------------------------------------- badge */

export function Badge({
  children,
  tone = 'neutral',
  className,
}: {
  children: ReactNode
  tone?: 'neutral' | 'accent' | 'brand' | 'success' | 'warning' | 'danger' | 'outline'
  className?: string
}) {
  const tones: Record<string, string> = {
    neutral: 'bg-ink/6 text-ink/70',
    accent: 'bg-ink/6 text-ink/70',
    brand: 'bg-brand/6 text-brand',
    success: 'bg-emerald-600/12 text-emerald-700',
    warning: 'bg-amber-500/14 text-amber-700',
    danger: 'bg-red-600/12 text-red-700',
    outline: 'border border-line text-ink/70',
  }
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium tracking-[-0.01em]',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}

/* ------------------------------------------------------------------- field */

export function Field({
  label,
  hint,
  error,
  required,
  children,
  className,
}: {
  label: string
  hint?: string
  error?: string
  required?: boolean
  children: ReactNode
  className?: string
}) {
  return (
    <label className={cn('block', className)}>
      <span className="mb-1.5 flex items-baseline gap-1.5 text-[13px] font-semibold text-ink">
        {label}
        {required && <span className="text-accent">*</span>}
      </span>
      {children}
      {error ? (
        <span className="mt-1.5 block text-[12px] font-medium text-red-600">{error}</span>
      ) : hint ? (
        <span className="mt-1.5 block text-[12px] leading-snug text-muted">{hint}</span>
      ) : null}
    </label>
  )
}

const controlBase =
  'w-full rounded-2xl border border-transparent bg-ink/[0.04] px-3.5 text-ink placeholder:text-ink/30 transition-colors focus:border-ink/20 focus:bg-card focus:outline-none focus:ring-2 focus:ring-ink/5'

export type ControlSize = 'sm' | 'md'

export function Input({
  className,
  size = 'md',
  ...rest
}: Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> & { size?: ControlSize }) {
  return (
    <input
      {...rest}
      className={cn(
        controlBase,
        size === 'sm' ? 'h-10 text-[14px]' : 'h-12 text-[16px]',
        className,
      )}
    />
  )
}

export function Textarea({
  className,
  size = 'md',
  ...rest
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { size?: ControlSize }) {
  return (
    <textarea
      {...rest}
      className={cn(
        controlBase,
        'py-3',
        size === 'sm' ? 'min-h-[72px] text-[14px]' : 'min-h-[110px] text-[15px]',
        className,
      )}
    />
  )
}

export function Select({
  className,
  children,
  size = 'md',
  ...rest
}: Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> & { size?: ControlSize }) {
  return (
    <div className="relative">
      <select
        {...rest}
        className={cn(
          controlBase,
          'appearance-none pr-10',
          size === 'sm' ? 'h-10 text-[14px]' : 'h-12 text-[16px]',
          className,
        )}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" />
    </div>
  )
}

/* --------------------------------------------------------------- stepper */

export function QtyStepper({
  value,
  onChange,
  min = 0,
  max = 99,
  suffix,
}: {
  value: number
  onChange: (v: number) => void
  min?: number
  max?: number
  suffix?: string
}) {
  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-line bg-card p-1">
      <button
        type="button"
        aria-label="Diminuer"
        onClick={() => onChange(Math.max(min, value - 1))}
        className="flex h-8 w-8 items-center justify-center rounded-full text-lg leading-none text-ink/70 transition-colors hover:bg-ink/6 disabled:opacity-30"
        disabled={value <= min}
      >
        −
      </button>
      <span className="min-w-8 text-center text-sm font-semibold tabular-nums">
        {value}
        {suffix ? <span className="ml-0.5 text-[11px] font-normal text-muted">{suffix}</span> : null}
      </span>
      <button
        type="button"
        aria-label="Augmenter"
        onClick={() => onChange(Math.min(max, value + 1))}
        className="flex h-8 w-8 items-center justify-center rounded-full text-lg leading-none text-ink/70 transition-colors hover:bg-ink/6 disabled:opacity-30"
        disabled={value >= max}
      >
        +
      </button>
    </div>
  )
}

/* --------------------------------------------------------------- segmented */

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  className,
}: {
  options: Array<{ value: T; label: string }>
  value: T
  onChange: (v: T) => void
  className?: string
}) {
  return (
    <div className={cn('flex gap-1 rounded-full border border-line bg-card p-1', className)}>
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            'flex-1 rounded-full px-3 py-2 text-[13px] font-semibold transition-colors',
            value === opt.value ? 'bg-brand text-white' : 'text-ink/60 hover:text-ink',
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

/* ------------------------------------------------------------------- sheet */

export function Sheet({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean
  onClose: () => void
  title?: ReactNode
  children: ReactNode
  footer?: ReactNode
}) {
  const titleId = useId()
  const panelRef = useRef<HTMLDivElement>(null)
  const previouslyFocused = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!open) return
    previouslyFocused.current = document.activeElement as HTMLElement | null
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const panel = panelRef.current
    const focusables = () =>
      Array.from(panel?.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])') ?? [])
        .filter((el) => !el.hasAttribute('disabled'))
    focusables()[0]?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
        return
      }
      if (e.key === 'Tab') {
        const items = focusables()
        if (items.length === 0) return
        const firstEl = items[0]
        const lastEl = items[items.length - 1]
        if (e.shiftKey && document.activeElement === firstEl) {
          e.preventDefault()
          lastEl.focus()
        } else if (!e.shiftKey && document.activeElement === lastEl) {
          e.preventDefault()
          firstEl.focus()
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
      previouslyFocused.current?.focus()
    }
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-ink/45 backdrop-blur-[2px]" onClick={onClose} />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            initial={{ y: 40, opacity: 0, scale: 0.99 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 30, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 30 }}
            className="relative z-10 flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-[32px] bg-card shadow-2xl sm:max-w-xl sm:rounded-[32px]"
          >
            <div className="flex items-start justify-between gap-4 border-b border-line/60 px-6 py-5">
              <div className="min-w-0" id={titleId}>{title}</div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Fermer"
                className="-mr-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink/50 transition-colors hover:bg-ink/6"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">{children}</div>
            {footer && <div className="border-t border-line/60 bg-card px-6 py-4 pb-safe">{footer}</div>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/* ------------------------------------------------------------------- toast */

interface ToastItem {
  id: number
  message: string
  tone: 'info' | 'success' | 'error'
}

const ToastContext = createContext<{
  push: (message: string, tone?: ToastItem['tone']) => void
}>({ push: () => undefined })

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])
  const counter = useRef(0)

  const push = useCallback((message: string, tone: ToastItem['tone'] = 'info') => {
    counter.current += 1
    const id = counter.current
    setItems((prev) => [...prev, { id, message, tone }])
    window.setTimeout(() => setItems((prev) => prev.filter((i) => i.id !== id)), 3800)
  }, [])

  const value = useMemo(() => ({ push }), [push])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div role="status" aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex flex-col items-center gap-2 px-4">
        <AnimatePresence>
          {items.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.97 }}
              className={cn(
                'pointer-events-auto flex max-w-sm items-center gap-2.5 rounded-full px-4 py-3 text-[13px] font-medium shadow-[0_12px_40px_rgb(0_0_0/0.18)]',
                item.tone === 'success' && 'bg-emerald-700 text-white',
                item.tone === 'error' && 'bg-red-700 text-white',
                item.tone === 'info' && 'bg-ink text-white',
              )}
            >
              {item.tone === 'success' && <Check className="h-4 w-4 shrink-0" />}
              {item.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
  return useContext(ToastContext)
}

/* ------------------------------------------------------------------ misc */

export function SectionTitle({
  eyebrow,
  title,
  description,
  align = 'left',
}: {
  eyebrow?: string
  title: ReactNode
  description?: ReactNode
  align?: 'left' | 'center'
}) {
  return (
    <div className={cn('max-w-2xl', align === 'center' && 'mx-auto text-center')}>
      {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
      <h2 className="display-section text-ink">{title}</h2>
      {description && <p className="lede mt-4">{description}</p>}
    </div>
  )
}

export function Stat({
  label,
  value,
  hint,
}: {
  label: string
  value: ReactNode
  hint?: string
}) {
  return (
    <div>
      <p className="text-2xl font-medium tracking-[-0.04em] leading-none text-ink">{value}</p>
      <p className="mt-1.5 text-[11px] font-medium text-muted">{label}</p>
      {hint && <p className="mt-1 text-[12px] text-ink/50">{hint}</p>}
    </div>
  )
}

export function Stars({ rating, className }: { rating: number; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-0.5', className)} aria-label={`${rating} sur 5`}>
      {[0, 1, 2, 3, 4].map((i) => (
        <svg key={i} viewBox="0 0 20 20" className="h-3.5 w-3.5">
          <path
            d="M10 1.6l2.47 5.01 5.53.8-4 3.9.94 5.5L10 14.2l-4.94 2.6.94-5.5-4-3.9 5.53-.8L10 1.6z"
            fill={i < Math.round(rating) ? '#111113' : '#DEDEE3'}
          />
        </svg>
      ))}
    </span>
  )
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-line bg-card/60 px-6 py-12 text-center">
      {icon && <div className="mb-3 text-ink/25">{icon}</div>}
      <p className="text-xl font-medium tracking-[-0.035em] text-ink">{title}</p>
      {description && <p className="mt-1.5 max-w-sm text-sm text-ink/55">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-2xl bg-ink/8', className)} />
}
