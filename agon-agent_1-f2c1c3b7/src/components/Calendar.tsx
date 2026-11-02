import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { fromISO, toISO, todayISO } from '../lib/format'
import { cn } from '../lib/utils'

const WEEKDAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']
const MONTHS = [
  'Janvier',
  'Février',
  'Mars',
  'Avril',
  'Mai',
  'Juin',
  'Juillet',
  'Août',
  'Septembre',
  'Octobre',
  'Novembre',
  'Décembre',
]

export interface CalendarProps {
  value: string | null
  onChange: (iso: string) => void
  blockedDates?: string[]
  minISO?: string
  maxMonthsAhead?: number
  /** En mode gestion, permettre de cliquer une date bloquée pour la débloquer. */
  allowBlocked?: boolean
}

export function Calendar({
  value,
  onChange,
  blockedDates = [],
  minISO = todayISO(),
  maxMonthsAhead = 12,
  allowBlocked = false,
}: CalendarProps) {
  const blocked = useMemo(() => new Set(blockedDates), [blockedDates])
  const initial = value ? fromISO(value) : fromISO(minISO)
  const [cursor, setCursor] = useState(() => new Date(initial.getFullYear(), initial.getMonth(), 1))

  const limit = useMemo(() => {
    const d = fromISO(minISO)
    d.setMonth(d.getMonth() + maxMonthsAhead)
    return toISO(d)
  }, [minISO, maxMonthsAhead])

  const cells = useMemo(() => {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1)
    const startOffset = (first.getDay() + 6) % 7
    const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate()
    const out: Array<{ iso: string; day: number; inMonth: boolean }> = []
    for (let i = 0; i < startOffset; i += 1) {
      const d = new Date(first)
      d.setDate(d.getDate() - (startOffset - i))
      out.push({ iso: toISO(d), day: d.getDate(), inMonth: false })
    }
    for (let day = 1; day <= daysInMonth; day += 1) {
      const d = new Date(cursor.getFullYear(), cursor.getMonth(), day)
      out.push({ iso: toISO(d), day, inMonth: true })
    }
    while (out.length % 7 !== 0) {
      const last = out[out.length - 1]
      const d = fromISO(last.iso)
      d.setDate(d.getDate() + 1)
      out.push({ iso: toISO(d), day: d.getDate(), inMonth: false })
    }
    return out
  }, [cursor])

  const canGoBack = useMemo(() => {
    const prev = new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1)
    return toISO(prev) >= minISO.slice(0, 8) + '01'
  }, [cursor, minISO])

  const canGoForward = useMemo(() => {
    const next = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1)
    return toISO(next) <= limit
  }, [cursor, limit])

  return (
    <div className="rounded-2xl border border-line bg-card p-3">
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
          disabled={!canGoBack}
          aria-label="Mois précédent"
          className="flex h-9 w-9 items-center justify-center rounded-full text-ink/60 transition-colors hover:bg-ink/6 disabled:opacity-25"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <p className="font-display text-lg text-ink">
          {MONTHS[cursor.getMonth()]} {cursor.getFullYear()}
        </p>
        <button
          type="button"
          onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
          disabled={!canGoForward}
          aria-label="Mois suivant"
          className="flex h-9 w-9 items-center justify-center rounded-full text-ink/60 transition-colors hover:bg-ink/6 disabled:opacity-25"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      <div className="mb-1 grid grid-cols-7 gap-1">
        {WEEKDAYS.map((d, i) => (
          <div key={i} className="py-1 text-center text-[11px] font-bold text-ink/35">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((cell) => {
          const isPast = cell.iso < minISO
          const isBlocked = blocked.has(cell.iso)
          const isSelected = value === cell.iso
          const disabled = isPast || (isBlocked && !allowBlocked)
          return (
            <button
              key={cell.iso}
              type="button"
              disabled={disabled}
              aria-label={`${cell.day} ${MONTHS[cursor.getMonth()]} ${cursor.getFullYear()}${isBlocked ? ' — indisponible' : ''}`}
              aria-pressed={isSelected}
              onClick={() => onChange(cell.iso)}
              className={cn(
                'relative flex aspect-square items-center justify-center rounded-xl text-[13px] font-medium transition-all',
                !cell.inMonth && 'text-ink/25',
                cell.inMonth && !disabled && 'text-ink hover:bg-brand/10',
                isPast && 'text-ink/20 line-through decoration-ink/20',
                isBlocked && !isPast && 'text-ink/30',
                isSelected && 'bg-brand text-white hover:bg-brand',
              )}
            >
              {cell.day}
              {isBlocked && !isPast && (
                <span className="absolute bottom-1 h-1 w-1 rounded-full bg-accent/70" />
              )}
            </button>
          )
        })}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-line pt-3 text-[11px] text-ink/50">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-accent/70" /> Indisponible
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-brand" /> Sélectionné
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-ink/20" /> Date passée
        </span>
      </div>
    </div>
  )
}
