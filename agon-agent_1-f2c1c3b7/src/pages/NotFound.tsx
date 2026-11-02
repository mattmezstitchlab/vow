import { Link } from 'react-router-dom'
import { Music2 } from 'lucide-react'
import { Button, Card } from '../components/ui'

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-4">
      <Card className="max-w-sm p-7 text-center">
        <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand text-accent">
          <Music2 className="h-6 w-6" />
        </span>
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-accent">Erreur 404</p>
        <h1 className="mt-2 font-display text-[30px] leading-tight text-ink">
          Cette page a quitté la scène
        </h1>
        <p className="mt-2 text-[14px] leading-relaxed text-ink/60">
          Le lien est peut-être erroné ou expiré. Retournez à la démo pour retrouver tous les
          prestataires.
        </p>
        <Link to="/" className="mt-6 block">
          <Button full>Retour à la démo</Button>
        </Link>
      </Card>
    </div>
  )
}
