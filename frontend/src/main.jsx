import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import './index.css';
import { initializeCSRF } from './services/api';
import { LanguageProvider } from './i18n';
import { ConfirmProvider } from './components/ui/ConfirmDialog';
import logger from './utils/logger';
import { migrateLocalStorage } from './migrations/localStorage';

const log = logger.scope('Main');

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// Migrate legacy localStorage keys (one-time, idempotent)
migrateLocalStorage();

// Initialize CSRF protection
initializeCSRF();

log.info('ChiroClickEHR Desktop starting');

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <BrowserRouter>
          <ConfirmProvider>
            <App />
          </ConfirmProvider>
        </BrowserRouter>
      </LanguageProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
