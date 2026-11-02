import { useEffect, useRef, useState } from 'react'
import { Headphones, Pause, Play, Volume2 } from 'lucide-react'
import type { AudioSample } from '../lib/types'
import { cn } from '../lib/utils'

const PLAYER_EVENT = 'cadence:audio-preview'
const WAVE = [7, 12, 9, 17, 11, 21, 13, 18, 8, 15, 22, 12, 17, 9, 14, 7]

/** Un seul extrait joue à la fois, afin de garder l'écoute claire sur mobile. */
export function AudioSamplePlayer({ samples }: { samples: AudioSample[] }) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [playingId, setPlayingId] = useState<string | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    const pauseOtherPlayers = (event: Event) => {
      const source = (event as CustomEvent<HTMLAudioElement>).detail
      if (source === audioRef.current) return
      audioRef.current?.pause()
      setPlayingId(null)
    }
    window.addEventListener(PLAYER_EVENT, pauseOtherPlayers)
    return () => window.removeEventListener(PLAYER_EVENT, pauseOtherPlayers)
  }, [])

  const toggle = async (sample: AudioSample) => {
    const audio = audioRef.current
    if (!audio) return
    setError(false)

    if (playingId === sample.id) {
      audio.pause()
      audio.currentTime = 0
      setPlayingId(null)
      return
    }

    window.dispatchEvent(new CustomEvent(PLAYER_EVENT, { detail: audio }))
    audio.pause()
    audio.src = sample.src
    audio.currentTime = 0
    audio.load()
    try {
      await audio.play()
      setPlayingId(sample.id)
    } catch {
      setPlayingId(null)
      setError(true)
    }
  }

  if (samples.length === 0) return null

  return (
    <section className="mt-5 rounded-2xl border border-line/60 bg-ink/[0.025] p-3.5 sm:p-4" aria-label="Extraits musicaux">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-ink/70 soft-shadow">
            <Headphones className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="text-[12px] font-medium tracking-[-0.01em] text-ink">Écouter un extrait</p>
            <p className="text-[10.5px] text-ink/45">Extraits synthétiques de démonstration</p>
          </div>
        </div>
        <Volume2 className="h-4 w-4 shrink-0 text-ink/30" aria-hidden />
      </div>

      <div className="flex flex-wrap gap-2">
        {samples.map((sample, index) => {
          const playing = playingId === sample.id
          return (
            <button
              key={sample.id}
              type="button"
              aria-pressed={playing}
              aria-label={`${playing ? 'Arrêter' : 'Écouter'} ${sample.title}, ${sample.duration}`}
              onClick={() => void toggle(sample)}
              className={cn(
                'flex min-w-0 flex-1 items-center gap-2 rounded-full border px-2.5 py-2 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink sm:min-w-[170px]',
                playing ? 'border-ink bg-ink text-white' : 'border-line/70 bg-white text-ink hover:border-ink/25 hover:bg-white',
              )}
            >
              <span className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-full', playing ? 'bg-white text-ink' : 'bg-ink text-white')}>
                {playing ? <Pause className="h-3.5 w-3.5" fill="currentColor" /> : <Play className="ml-0.5 h-3.5 w-3.5" fill="currentColor" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[11px] font-medium">{sample.title}</span>
                <span className={cn('mt-0.5 flex items-center gap-[2px]', playing ? 'text-white/70' : 'text-ink/35')} aria-hidden>
                  {WAVE.map((height, bar) => (
                    <span
                      key={bar}
                      className={cn('w-[2px] rounded-full bg-current', playing && 'audio-wave-bar')}
                      style={{ height: `${Math.max(4, height - (index % 3) * 2)}px`, animationDelay: `${bar * 45}ms` }}
                    />
                  ))}
                  <span className="ml-1.5 text-[10px]">{sample.duration}</span>
                </span>
              </span>
            </button>
          )
        })}
      </div>

      {error && <p className="mt-2 text-[11px] text-red-600" role="status">L’extrait n’a pas pu être lu. Réessayez.</p>}
      <audio
        ref={audioRef}
        className="sr-only"
        preload="none"
        aria-label="Lecture de l’extrait sélectionné"
        onEnded={() => setPlayingId(null)}
        onError={() => { if (playingId) { setPlayingId(null); setError(true) } }}
      />
    </section>
  )
}
