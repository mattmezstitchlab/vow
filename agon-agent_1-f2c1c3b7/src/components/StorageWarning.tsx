import { useSyncExternalStore } from 'react'
import { AlertCircle } from 'lucide-react'
import { getStorageMode, subscribeData } from '../lib/store'

export function StorageWarning() {
  const mode = useSyncExternalStore(subscribeData, getStorageMode, () => 'local' as const)
  if (mode !== 'memory') return null
  return (
    <div className="fixed inset-x-0 top-0 z-[70] flex items-center justify-center gap-2 bg-amber-600 px-4 py-2 text-center text-[12px] font-semibold text-white">
      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
      Stockage du navigateur indisponible ou plein : les données ne sont conservées que pendant cette session.
    </div>
  )
}
