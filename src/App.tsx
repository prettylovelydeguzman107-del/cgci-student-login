import { BrowserRouter } from 'react-router-dom'

import { AuthProvider } from './contexts/AuthContext'
import { AppRoutes } from './routes/AppRoutes'

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <a className="skip-link" href="#main-content">
          Skip to main content
        </a>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
