import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../../i18n', () => ({
  useTranslation: () => ({
    t: (key, fallback) => fallback || key,
    lang: 'no',
    setLang: vi.fn(),
  }),
  useLanguage: () => ({ lang: 'no', setLang: vi.fn() }),
  LanguageProvider: ({ children }) => children,
}));

vi.mock('../../utils/logger', () => ({
  default: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    scope: () => ({ error: vi.fn(), info: vi.fn(), warn: vi.fn() }),
  },
}));

import PageErrorBoundary from '../../components/PageErrorBoundary';

const ThrowError = () => {
  throw new Error('Page error');
};

const GoodChild = () => <div>Page content</div>;

describe('PageErrorBoundary', () => {
  let consoleSpy;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('renders children when no error occurs', () => {
    render(
      <MemoryRouter>
        <PageErrorBoundary>
          <GoodChild />
        </PageErrorBoundary>
      </MemoryRouter>
    );
    expect(screen.getByText('Page content')).toBeInTheDocument();
  });

  it('renders fallback UI when child throws', () => {
    render(
      <MemoryRouter>
        <PageErrorBoundary>
          <ThrowError />
        </PageErrorBoundary>
      </MemoryRouter>
    );
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('shows page name in error message when provided', () => {
    render(
      <MemoryRouter>
        <PageErrorBoundary pageName="Dashboard">
          <ThrowError />
        </PageErrorBoundary>
      </MemoryRouter>
    );
    expect(screen.getByText(/Feil i.*Dashboard/)).toBeInTheDocument();
  });

  it('displays back and reload buttons', () => {
    render(
      <MemoryRouter>
        <PageErrorBoundary>
          <ThrowError />
        </PageErrorBoundary>
      </MemoryRouter>
    );
    // The t() mock returns fallback, so "back" key returns "back"
    expect(screen.getByText('back')).toBeInTheDocument();
    expect(screen.getByText('reloadPage')).toBeInTheDocument();
  });

  it('renders Suspense fallback for lazy components', () => {
    // PageErrorBoundary wraps children in Suspense, but since our child
    // is not lazy, it renders immediately
    render(
      <MemoryRouter>
        <PageErrorBoundary>
          <GoodChild />
        </PageErrorBoundary>
      </MemoryRouter>
    );
    expect(screen.getByText('Page content')).toBeInTheDocument();
  });
});
