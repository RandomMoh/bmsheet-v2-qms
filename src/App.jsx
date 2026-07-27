import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import Login from './pages/Login'
const CSRDashboard = lazy(() => import('./pages/User'))
const Dev = lazy(() => import('./pages/Dev'))
import CursorTrail from './CursorTrail'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

const Loader = () => (
  <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)', color: 'var(--text-faint)', fontSize: 14, fontFamily: "'Inter', system-ui, sans-serif" }}>
    <div style={{ width: 20, height: 20, border: '2px solid var(--border-subtle)', borderTopColor: 'var(--accent-primary)', borderRadius: '50%', animation: 'spin 0.7s linear infinite', marginRight: 12 }} />
    Loading…
  </div>
)

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <CursorTrail />
      <BrowserRouter basename="/qms_react/">
        <Suspense fallback={<Loader />}>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/user" element={<CSRDashboard />} />
            <Route path="/dev" element={<Dev />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
