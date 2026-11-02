import { useEffect } from 'react'
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom'
import { ToastProvider } from './components/ui'
import Landing from './pages/Landing'
import ProviderPublic from './pages/ProviderPublic'
import BookingWizard from './pages/BookingWizard'
import Reservation from './pages/Reservation'
import BackOffice from './pages/BackOffice'
import Studio from './pages/Studio'
import Legal from './pages/Legal'
import NotFound from './pages/NotFound'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
  }, [pathname])
  return null
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <ScrollToTop />
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
      </ToastProvider>
    </BrowserRouter>
  )
}
