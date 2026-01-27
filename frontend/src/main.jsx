import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ClerkProvider } from '@clerk/clerk-react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App'
import './index.css'
import { initializeCSRF } from './services/api'

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

// Allow dev mode without Clerk
const isDev = import.meta.env.DEV
const useClerk = clerkPubKey && clerkPubKey !== 'pk_test_your_key_here'

if (!useClerk && !isDev) {
  throw new Error('Missing Clerk Publishable Key')
}

// Initialize CSRF protection
initializeCSRF()

// Development mode provider that mocks Clerk context
const DevModeProvider = ({ children }) => children

const AuthProvider = useClerk ? ClerkProvider : DevModeProvider
const authProps = useClerk ? { publishableKey: clerkPubKey } : {}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider {...authProps}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <App devMode={!useClerk} />
        </BrowserRouter>
      </QueryClientProvider>
    </AuthProvider>
  </React.StrictMode>,
)
