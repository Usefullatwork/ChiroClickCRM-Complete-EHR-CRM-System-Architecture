/**
 * NotFound (404) Page Tests
 *
 * Tests rendering, heading, message, and navigation link.
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';

// ---- Mocks (before imports) ----

vi.mock('../../i18n', () => ({
  useTranslation: () => ({
    t: (key, fallback) => fallback || key,
    lang: 'no',
  }),
}));

import NotFound from '../../pages/NotFound';

// ---- Helpers ----

const renderWithProviders = (ui) => {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
};

describe('NotFound Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    renderWithProviders(<NotFound />);
    expect(screen.getByText('404')).toBeInTheDocument();
  });

  it('displays the 404 heading', () => {
    renderWithProviders(<NotFound />);
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveTextContent('404');
  });

  it('shows the page not found message', () => {
    renderWithProviders(<NotFound />);
    expect(screen.getByText('pageNotFound')).toBeInTheDocument();
  });

  it('has a link back to home', () => {
    renderWithProviders(<NotFound />);
    const link = screen.getByRole('link', { name: 'goBackHome' });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/');
  });

  it('the home link has correct text from i18n', () => {
    renderWithProviders(<NotFound />);
    const link = screen.getByRole('link');
    expect(link).toHaveTextContent('goBackHome');
  });

  it('renders with correct layout structure', () => {
    const { container } = renderWithProviders(<NotFound />);
    const wrapper = container.firstChild;
    expect(wrapper).toHaveClass('min-h-screen');
  });
});
