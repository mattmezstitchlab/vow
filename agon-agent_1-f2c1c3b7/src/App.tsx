import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { ToastProvider } from './components/ui'
import { StorageWarning } from './components/StorageWarning'
import Landing from './pages/Landing'

const ProviderPublic = lazy(() => import('./pages/ProviderPublic'))
const BookingWizard = lazy(() => import('./pages/BookingWizard'))
const Reservation = lazy(() => import('./pages/Reservation'))
const BackOffice = lazy(() => import('./pages/BackOffice'))
const Studio = lazy(() => import('./pages/Studio'))
const Legal = lazy(() => import('./pages/Legal'))
const NotFound = lazy(() => import('./pages/NotFound'))

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
  }, [pathname])
  return null
}

function PageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-paper">
      <Loader2 className="h-6 w-6 animate-spin text-ink/40" aria-label="Chargement" />
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <StorageWarning />
        <ScrollToTop />
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/p/:slug" element={<ProviderPublic />} />
            <Route path="/p/:slug/reserver" element={<BookingWizard />} />
            <Route path="/r/:slug/:code" element={<Reservation />} />
            <Route path="/bo/:slug" element={<BackOffice />} />
            <Route path="/studio" element={<Studio />} />
            <Route path="/legal" element={<Legal />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </ToastProvider>
    </BrowserRouter>
  )
}
