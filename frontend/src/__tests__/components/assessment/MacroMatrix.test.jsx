/**
 * MacroMatrix Tests
 *
 * Tests the macro matrix "hot button" system for SOAP note generation.
 * Covers: loading state, category tabs, macro insertion, search,
 * favorites, view mode toggle, and inline variant.
 */

import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Settings: () => <svg data-testid="settings-icon" />,
  Grid: () => <svg data-testid="grid-icon" />,
  List: () => <svg data-testid="list-icon" />,
  Star: () => <svg data-testid="star-icon" />,
  Search: () => <svg data-testid="search-icon" />,
  Loader2: () => <svg data-testid="loader-icon" />,
}));

// Mock i18n
vi.mock('../../../i18n', () => ({
  useTranslation: () => ({ t: (key, fallback) => fallback || key, lang: 'no' }),
}));

// Mock macrosAPI
const mockGetMatrix = vi.fn();
const mockSearch = vi.fn();
const mockRecordUsage = vi.fn();
const mockToggleFavorite = vi.fn();

vi.mock('../../../services/api', () => ({
  macrosAPI: {
    getMatrix: (...args) => mockGetMatrix(...args),
    search: (...args) => mockSearch(...args),
    recordUsage: (...args) => mockRecordUsage(...args),
    toggleFavorite: (...args) => mockToggleFavorite(...args),
  },
}));

import MacroMatrix, {
  MacroMatrixInline,
  DEFAULT_MACROS,
} from '../../../components/assessment/MacroMatrix';

describe('MacroMatrix', () => {
  const onInsert = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Default: API call rejects so component falls back to hardcoded macros
    mockGetMatrix.mockRejectedValue(new Error('offline'));
    mockSearch.mockRejectedValue(new Error('offline'));
    mockRecordUsage.mockResolvedValue({});
    mockToggleFavorite.mockRejectedValue(new Error('offline'));
  });

  it('should show loading state initially', () => {
    // Never resolve so we stay in loading
    mockGetMatrix.mockReturnValue(new Promise(() => {}));
    render(<MacroMatrix onInsert={onInsert} />);
    expect(screen.getByText('Laster makroer...')).toBeDefined();
  });

  it('should render category tabs after loading', async () => {
    render(<MacroMatrix onInsert={onInsert} />);

    await waitFor(() => {
      expect(screen.getByText('Adjustments')).toBeDefined();
    });

    expect(screen.getByText('Therapies')).toBeDefined();
    expect(screen.getByText('Findings')).toBeDefined();
    expect(screen.getByText('Subjective')).toBeDefined();
    expect(screen.getByText('Plan')).toBeDefined();
    expect(screen.getByText('Response')).toBeDefined();
  });

  it('should render macros for the first category by default', async () => {
    render(<MacroMatrix onInsert={onInsert} />);

    await waitFor(() => {
      expect(screen.getByText('Cervical Adj')).toBeDefined();
    });

    expect(screen.getByText('Thoracic Adj')).toBeDefined();
    expect(screen.getByText('Lumbar Adj')).toBeDefined();
  });

  it('should call onInsert when a macro button is clicked', async () => {
    render(<MacroMatrix onInsert={onInsert} />);

    await waitFor(() => {
      expect(screen.getByText('Cervical Adj')).toBeDefined();
    });

    fireEvent.click(screen.getByText('Cervical Adj'));

    expect(onInsert).toHaveBeenCalledWith(
      'Cervical spine adjustment performed. Patient tolerated the adjustment well with no adverse reaction.',
      'current'
    );
  });

  it('should switch categories when a tab is clicked', async () => {
    render(<MacroMatrix onInsert={onInsert} />);

    await waitFor(() => {
      expect(screen.getByText('Adjustments')).toBeDefined();
    });

    fireEvent.click(screen.getByText('Therapies'));

    await waitFor(() => {
      expect(screen.getByText('E-Stim')).toBeDefined();
    });

    expect(screen.getByText('Ultrasound')).toBeDefined();
    expect(screen.getByText('Heat Pack')).toBeDefined();
  });

  it('should toggle between grid and list view modes', async () => {
    render(<MacroMatrix onInsert={onInsert} />);

    await waitFor(() => {
      expect(screen.getByText('Cervical Adj')).toBeDefined();
    });

    // Find the list view toggle button (second button with list icon)
    const viewButtons = screen.getAllByRole('button').filter((btn) => {
      return btn.querySelector('[data-testid="list-icon"]');
    });
    expect(viewButtons.length).toBeGreaterThan(0);
    fireEvent.click(viewButtons[0]);

    // In list mode, full text descriptions should be visible
    await waitFor(() => {
      expect(
        screen.getByText(
          'Cervical spine adjustment performed. Patient tolerated the adjustment well with no adverse reaction.'
        )
      ).toBeDefined();
    });
  });

  it('should display search input and accept typing', async () => {
    render(<MacroMatrix onInsert={onInsert} />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Søk i makroer...')).toBeDefined();
    });

    const searchInput = screen.getByPlaceholderText('Søk i makroer...');
    fireEvent.change(searchInput, { target: { value: 'lumbar' } });
    expect(searchInput.value).toBe('lumbar');
  });

  it('should show customize button when onCustomMacrosChange is provided', async () => {
    render(<MacroMatrix onInsert={onInsert} onCustomMacrosChange={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('Adjustments')).toBeDefined();
    });

    const settingsBtn = screen
      .getAllByRole('button')
      .find((btn) => btn.querySelector('[data-testid="settings-icon"]'));
    expect(settingsBtn).toBeDefined();
  });

  it('should use API data when available', async () => {
    mockGetMatrix.mockResolvedValue({
      data: {
        custom_cat: {
          name: 'API Category',
          macros: [{ id: 'api-1', name: 'API Macro', text: 'API text here' }],
          subcategories: {},
        },
      },
    });

    render(<MacroMatrix onInsert={onInsert} />);

    await waitFor(() => {
      expect(screen.getByText('API Category')).toBeDefined();
    });

    // Active category may be stale from defaults, click the API tab
    fireEvent.click(screen.getByText('API Category'));

    await waitFor(() => {
      expect(screen.getByText('API Macro')).toBeDefined();
    });
  });

  it('should pass custom targetField to onInsert', async () => {
    render(<MacroMatrix onInsert={onInsert} targetField="subjective" />);

    await waitFor(() => {
      expect(screen.getByText('Cervical Adj')).toBeDefined();
    });

    fireEvent.click(screen.getByText('Cervical Adj'));

    expect(onInsert).toHaveBeenCalledWith(expect.any(String), 'subjective');
  });
});

describe('MacroMatrixInline', () => {
  const onInsert = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render inline macro buttons for the given category', () => {
    render(<MacroMatrixInline onInsert={onInsert} category="adjustments" />);

    expect(screen.getByText('Cervical Adj')).toBeDefined();
    expect(screen.getByText('Thoracic Adj')).toBeDefined();
  });

  it('should respect maxItems prop', () => {
    render(<MacroMatrixInline onInsert={onInsert} category="adjustments" maxItems={3} />);

    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(3);
  });

  it('should call onInsert with macro text when clicked', () => {
    render(<MacroMatrixInline onInsert={onInsert} category="adjustments" maxItems={1} />);

    fireEvent.click(screen.getByText('Cervical Adj'));

    expect(onInsert).toHaveBeenCalledWith(
      'Cervical spine adjustment performed. Patient tolerated the adjustment well with no adverse reaction.'
    );
  });

  it('should render empty if invalid category is given', () => {
    const { container } = render(<MacroMatrixInline onInsert={onInsert} category="nonexistent" />);

    expect(container.querySelectorAll('button')).toHaveLength(0);
  });
});

describe('DEFAULT_MACROS', () => {
  it('should export all six categories', () => {
    expect(Object.keys(DEFAULT_MACROS)).toEqual([
      'adjustments',
      'therapies',
      'findings',
      'subjective',
      'plan',
      'response',
    ]);
  });

  it('should have id, label, and text on every macro', () => {
    for (const category of Object.values(DEFAULT_MACROS)) {
      for (const macro of category.macros) {
        expect(macro.id).toBeDefined();
        expect(macro.label).toBeDefined();
        expect(macro.text).toBeDefined();
        expect(typeof macro.text).toBe('string');
        expect(macro.text.length).toBeGreaterThan(10);
      }
    }
  });
});
