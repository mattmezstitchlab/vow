import { Link } from 'react-router-dom'
import { BrandMark } from '../components/Brand'
import { Button, Card } from '../components/ui'

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-4">
      <Card className="max-w-sm p-7 text-center">
        <BrandMark className="mx-auto mb-5 !h-12 !w-12 !rounded-2xl" />
        <p className="text-[12px] font-medium text-ink/45">Erreur 404</p>
        <h1 className="mt-2 text-[28px] font-medium tracking-[-0.05em] leading-tight text-ink">
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
