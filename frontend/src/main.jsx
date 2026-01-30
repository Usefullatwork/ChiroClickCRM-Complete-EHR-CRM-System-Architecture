import React, { createContext, useContext } from 'react'
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

// Check if we're in development mode with placeholder key
const isDevMode = !clerkPubKey ||
  clerkPubKey === 'pk_test_your_key_here' ||
  clerkPubKey.includes('placeholder')

// Mock user for development
const mockUser = {
  id: 'dev_user_001',
  firstName: 'Dev',
  lastName: 'User',
  fullName: 'Dev User',
  emailAddresses: [{ emailAddress: 'dev@chiroclickcrm.local' }],
  primaryEmailAddress: { emailAddress: 'dev@chiroclickcrm.local' },
  organizationMemberships: [{
    organization: {
      id: 'dev_org_001',
      name: 'Development Clinic',
      slug: 'dev-clinic'
    },
    role: 'admin'
  }]
}

// Mock Clerk context for development
const MockClerkContext = createContext(null)

function MockClerkProvider({ children }) {
  const mockClerk = {
    user: mockUser,
    isLoaded: true,
    isSignedIn: true,
    session: { id: 'dev_session_001' },
    organization: mockUser.organizationMemberships[0].organization,
    signOut: () => console.log('[Dev Mode] Sign out clicked'),
    getToken: async () => 'dev_token_mock',
  }

  return (
    <MockClerkContext.Provider value={mockClerk}>
      {children}
    </MockClerkContext.Provider>
  )
}

// Hook to use mock auth in dev mode
export function useDevAuth() {
  return useContext(MockClerkContext)
}

// Initialize CSRF protection
initializeCSRF()

// Render app with appropriate auth provider
const AuthWrapper = isDevMode ? MockClerkProvider : ({ children }) => (
  <ClerkProvider publishableKey={clerkPubKey}>
    {children}
  </ClerkProvider>
)

if (isDevMode) {
  console.log('%c[DEV MODE] Running without Clerk authentication', 'color: orange; font-weight: bold')
  console.log('%cMock user:', 'color: gray', mockUser)
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthWrapper>
      <QueryClientProvider client={queryClient}>
        <LanguageProvider>
          <BrowserRouter>
            <App devMode={isDevMode} />
          </BrowserRouter>
        </LanguageProvider>
      </QueryClientProvider>
    </AuthWrapper>
  </React.StrictMode>,
)
