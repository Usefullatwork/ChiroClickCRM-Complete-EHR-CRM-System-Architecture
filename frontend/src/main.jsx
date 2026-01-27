import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ClerkProvider } from '@clerk/clerk-react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App'
import './index.css'
import { initializeCSRF } from './services/api'
import { LanguageProvider } from './i18n'

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
})

// Get Clerk publishable key from environment
const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

// Initialize CSRF protection
initializeCSRF()

// Render with or without Clerk based on key availability
const AppWrapper = ({ children }) => {
  // Only use Clerk if we have a valid key (not placeholder)
  if (clerkPubKey && !clerkPubKey.includes('your_key_here')) {
    return <ClerkProvider publishableKey={clerkPubKey}>{children}</ClerkProvider>
  }
  // Development mode without Clerk
  console.warn('Running without Clerk authentication (development mode)')
  return <>{children}</>
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppWrapper>
      <QueryClientProvider client={queryClient}>
        <LanguageProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </LanguageProvider>
      </QueryClientProvider>
    </AppWrapper>
  </React.StrictMode>,
)
