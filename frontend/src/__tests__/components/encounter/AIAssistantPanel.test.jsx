/**
 * AIAssistantPanel Component Tests
 * Tests rendering, close action, AI suggestion display, and loading states.
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../i18n', () => ({
  useTranslation: () => ({ t: (key, fb) => fb || key, lang: 'no', setLang: vi.fn() }),
}));
vi.mock('../../../i18n/useTranslation', () => ({
  useTranslation: () => ({ t: (key, fb) => fb || key, lang: 'no', setLang: vi.fn() }),
}));
vi.mock('lucide-react', () => ({
  Brain: () => null,
  X: () => null,
  Sparkles: () => null,
  Loader2: () => null,
}));

import { AIAssistantPanel } from '../../../components/encounter/AIAssistantPanel';

function buildProps(overrides = {}) {
  return {
    showAIAssistant: true,
    setShowAIAssistant: vi.fn(),
    aiSuggestions: null,
    aiLoading: false,
    getAISuggestions: vi.fn(),
    ...overrides,
  };
}

describe('AIAssistantPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when showAIAssistant is false', () => {
    const { container } = render(<AIAssistantPanel {...buildProps({ showAIAssistant: false })} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders the panel when showAIAssistant is true', () => {
    render(<AIAssistantPanel {...buildProps()} />);
    expect(screen.getByText('AI Klinisk Assistent')).toBeTruthy();
  });

  it('renders the get-suggestions button when no suggestions exist', () => {
    render(<AIAssistantPanel {...buildProps()} />);
    expect(screen.getByRole('button', { name: /AI-forslag/i })).toBeTruthy();
  });

  it('calls getAISuggestions when the button is clicked', () => {
    const getAISuggestions = vi.fn();
    render(<AIAssistantPanel {...buildProps({ getAISuggestions })} />);
    fireEvent.click(screen.getByRole('button', { name: /AI-forslag/i }));
    expect(getAISuggestions).toHaveBeenCalledTimes(1);
  });

  it('shows loading text when aiLoading is true', () => {
    render(<AIAssistantPanel {...buildProps({ aiLoading: true })} />);
    expect(screen.getByText('Analyserer...')).toBeTruthy();
  });

  it('disables the button during loading', () => {
    render(<AIAssistantPanel {...buildProps({ aiLoading: true })} />);
    const btn = screen.getByRole('button', { name: /Analyserer/i });
    expect(btn.disabled).toBe(true);
  });

  it('calls setShowAIAssistant(false) when close button is clicked', () => {
    const setShowAIAssistant = vi.fn();
    render(<AIAssistantPanel {...buildProps({ setShowAIAssistant })} />);
    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[0]);
    expect(setShowAIAssistant).toHaveBeenCalledWith(false);
  });

  it('renders clinical reasoning when suggestions are provided', () => {
    const aiSuggestions = { clinicalReasoning: 'Test reasoning text' };
    render(<AIAssistantPanel {...buildProps({ aiSuggestions })} />);
    expect(screen.getByText('Klinisk Resonnering')).toBeTruthy();
    expect(screen.getByText('Test reasoning text')).toBeTruthy();
  });

  it('renders diagnosis suggestions when provided', () => {
    const aiSuggestions = { diagnosis: ['Diag A', 'Diag B'] };
    render(<AIAssistantPanel {...buildProps({ aiSuggestions })} />);
    expect(screen.getByText('Diag A')).toBeTruthy();
    expect(screen.getByText('Diag B')).toBeTruthy();
  });

  it('renders treatment suggestions when provided', () => {
    const aiSuggestions = { treatment: ['Treat A', 'Treat B'] };
    render(<AIAssistantPanel {...buildProps({ aiSuggestions })} />);
    expect(screen.getByText('Treat A')).toBeTruthy();
    expect(screen.getByText('Treat B')).toBeTruthy();
  });

  it('shows the update button when suggestions exist', () => {
    const aiSuggestions = { clinicalReasoning: 'Some reasoning' };
    render(<AIAssistantPanel {...buildProps({ aiSuggestions })} />);
    expect(screen.getByText('Oppdater Forslag')).toBeTruthy();
  });

  it('renders the disclaimer footer', () => {
    render(<AIAssistantPanel {...buildProps()} />);
    expect(screen.getByText(/AI-forslag er kun veiledende/i)).toBeTruthy();
  });
});
