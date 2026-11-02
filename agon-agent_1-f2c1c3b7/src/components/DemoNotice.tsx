import type { ReactNode } from 'react'
import { Info } from 'lucide-react'
import { cn } from '../lib/utils'

/** Bandeau honnête et compact : la démo ne déclenche aucun paiement réel. */
export function DemoNotice({
  children,
  className,
}: {
  children?: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex items-start gap-2 rounded-2xl bg-ink/[0.035] px-3.5 py-2.5 text-[12px] leading-relaxed text-ink/55',
        className,
      )}
    >
      <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink/40" aria-hidden />
      <p>
        {children ?? (
          <>
            <strong className="font-semibold text-ink">Démo interactive.</strong> Données enregistrées
            dans ce navigateur, aucun paiement réel et aucun e-mail envoyé.
          </>
        )}
      </p>
    </div>
  )
}
