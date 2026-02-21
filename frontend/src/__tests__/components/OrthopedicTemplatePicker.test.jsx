/**
 * OrthopedicTemplatePicker Component Tests
 * Tests for the modal-style clinical template picker with SOAP section support
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock @tanstack/react-query before importing the component
vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn().mockReturnValue({ data: null, isLoading: false }),
}));

// Mock API
vi.mock('../../services/api', () => ({
  templatesAPI: {
    getCategories: vi.fn(),
    getAll: vi.fn(),
    getTestsLibrary: vi.fn(),
    getPhrases: vi.fn(),
    getUserPreferences: vi.fn(),
    trackUsage: vi.fn(),
  },
}));

// Mock TemplateVariableModal
vi.mock('../../components/clinical/TemplateVariableModal', () => ({
  default: () => null,
}));

// Mock lucide-react icons to simple spans
vi.mock('lucide-react', () => ({
  Search: (props) => <span data-testid="icon-search" {...props} />,
  Star: (props) => <span data-testid="icon-star" {...props} />,
  Clock: (props) => <span data-testid="icon-clock" {...props} />,
  ChevronRight: (props) => <span data-testid="icon-chevron-right" {...props} />,
  ChevronDown: (props) => <span data-testid="icon-chevron-down" {...props} />,
  X: (props) => <span data-testid="icon-x" {...props} />,
  Copy: (props) => <span data-testid="icon-copy" {...props} />,
  BookOpen: (props) => <span data-testid="icon-book-open" {...props} />,
  Activity: (props) => <span data-testid="icon-activity" {...props} />,
  Heart: (props) => <span data-testid="icon-heart" {...props} />,
  Brain: (props) => <span data-testid="icon-brain" {...props} />,
  Bone: (props) => <span data-testid="icon-bone" {...props} />,
}));

import OrthopedicTemplatePicker from '../../components/OrthopedicTemplatePicker';
import { useQuery } from '@tanstack/react-query';

describe('OrthopedicTemplatePicker Component', () => {
  const mockOnSelectTemplate = vi.fn();
  const mockOnClose = vi.fn();

  const defaultProps = {
    soapSection: 'OBJECTIVE',
    onSelectTemplate: mockOnSelectTemplate,
    onClose: mockOnClose,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    useQuery.mockReturnValue({ data: null, isLoading: false });
  });

  // ============================================================================
  // RENDERING TESTS
  // ============================================================================

  describe('Rendering', () => {
    it('should render the modal header', () => {
      render(<OrthopedicTemplatePicker {...defaultProps} />);
      expect(screen.getByText('Kliniske Maler')).toBeInTheDocument();
    });

    it('should show the subtitle with SOAP section label', () => {
      render(<OrthopedicTemplatePicker {...defaultProps} soapSection="OBJECTIVE" />);
      expect(screen.getByText(/Objektiv \(O\)/)).toBeInTheDocument();
      expect(screen.getByText(/Velg mal for å sette inn tekst/)).toBeInTheDocument();
    });

    it('should show subtitle without SOAP prefix when soapSection is null', () => {
      render(
        <OrthopedicTemplatePicker
          onSelectTemplate={mockOnSelectTemplate}
          onClose={mockOnClose}
          soapSection={null}
        />
      );
      const subtitle = screen.getByText('Velg mal for å sette inn tekst');
      expect(subtitle).toBeInTheDocument();
    });

    it('should render the Lukk button in the footer', () => {
      render(<OrthopedicTemplatePicker {...defaultProps} />);
      expect(screen.getByText('Lukk')).toBeInTheDocument();
    });
  });

  // ============================================================================
  // TABS TESTS
  // ============================================================================

  describe('Tabs', () => {
    it('should render all four tabs with correct Norwegian labels', () => {
      render(<OrthopedicTemplatePicker {...defaultProps} />);
      expect(screen.getByText('Maler')).toBeInTheDocument();
      expect(screen.getByText('Ortopediske Tester')).toBeInTheDocument();
      expect(screen.getByText('Fraser')).toBeInTheDocument();
      expect(screen.getByText('Favoritter')).toBeInTheDocument();
    });

    it('should highlight Maler tab by default', () => {
      render(<OrthopedicTemplatePicker {...defaultProps} />);
      const malerTab = screen.getByText('Maler').closest('button');
      expect(malerTab.className).toContain('border-blue-500');
    });

    it('should switch to Ortopediske Tester tab on click', () => {
      render(<OrthopedicTemplatePicker {...defaultProps} />);
      const testerTab = screen.getByText('Ortopediske Tester').closest('button');
      fireEvent.click(testerTab);
      expect(testerTab.className).toContain('border-green-500');
    });

    it('should switch to Fraser tab on click', () => {
      render(<OrthopedicTemplatePicker {...defaultProps} />);
      const fraserTab = screen.getByText('Fraser').closest('button');
      fireEvent.click(fraserTab);
      expect(fraserTab.className).toContain('border-purple-500');
    });

    it('should switch to Favoritter tab on click', () => {
      render(<OrthopedicTemplatePicker {...defaultProps} />);
      const favTab = screen.getByText('Favoritter').closest('button');
      fireEvent.click(favTab);
      expect(favTab.className).toContain('border-yellow-500');
    });

    it('should show empty template message on templates tab when no data', () => {
      render(<OrthopedicTemplatePicker {...defaultProps} />);
      expect(screen.getByText('Ingen maler funnet')).toBeInTheDocument();
    });

    it('should show empty test message on tests tab when no data', () => {
      render(<OrthopedicTemplatePicker {...defaultProps} />);
      fireEvent.click(screen.getByText('Ortopediske Tester').closest('button'));
      expect(screen.getByText('Ingen tester funnet')).toBeInTheDocument();
    });

    it('should show empty phrase message on phrases tab when no data', () => {
      render(<OrthopedicTemplatePicker {...defaultProps} />);
      fireEvent.click(screen.getByText('Fraser').closest('button'));
      expect(screen.getByText('Ingen fraser funnet')).toBeInTheDocument();
    });

    it('should show empty favorites message on favorites tab when no data', () => {
      render(<OrthopedicTemplatePicker {...defaultProps} />);
      fireEvent.click(screen.getByText('Favoritter').closest('button'));
      expect(screen.getByText(/Ingen favoritter ennå/)).toBeInTheDocument();
    });
  });

  // ============================================================================
  // SEARCH INPUT TESTS
  // ============================================================================

  describe('Search Input', () => {
    it('should render the search input with correct placeholder', () => {
      render(<OrthopedicTemplatePicker {...defaultProps} />);
      const searchInput = screen.getByPlaceholderText('Søk maler, tester, fraser...');
      expect(searchInput).toBeInTheDocument();
    });

    it('should update search query when typing', () => {
      render(<OrthopedicTemplatePicker {...defaultProps} />);
      const searchInput = screen.getByPlaceholderText('Søk maler, tester, fraser...');
      fireEvent.change(searchInput, { target: { value: 'nakke' } });
      expect(searchInput).toHaveValue('nakke');
    });
  });

  // ============================================================================
  // BODY REGION FILTER TESTS
  // ============================================================================

  describe('Body Region Filter', () => {
    it('should render the body region dropdown with default option', () => {
      render(<OrthopedicTemplatePicker {...defaultProps} />);
      const select = screen.getByDisplayValue('Alle områder');
      expect(select).toBeInTheDocument();
    });

    it('should include all 11 body region options', () => {
      render(<OrthopedicTemplatePicker {...defaultProps} />);
      const select = screen.getByDisplayValue('Alle områder');

      // All options including the default "Alle omrader"
      const options = select.querySelectorAll('option');
      // 1 default + 11 body regions = 12
      expect(options).toHaveLength(12);
    });

    it('should include Cervikalcolumna option', () => {
      render(<OrthopedicTemplatePicker {...defaultProps} />);
      expect(screen.getByText(/Cervikalcolumna/)).toBeInTheDocument();
    });

    it('should include Thorakalcolumna option', () => {
      render(<OrthopedicTemplatePicker {...defaultProps} />);
      expect(screen.getByText(/Thorakalcolumna/)).toBeInTheDocument();
    });

    it('should include Lumbalcolumna option', () => {
      render(<OrthopedicTemplatePicker {...defaultProps} />);
      expect(screen.getByText(/Lumbalcolumna/)).toBeInTheDocument();
    });

    it('should include Kjeve (TMJ) option', () => {
      render(<OrthopedicTemplatePicker {...defaultProps} />);
      expect(screen.getByText(/Kjeve \(TMJ\)/)).toBeInTheDocument();
    });

    it('should include Skulder option', () => {
      render(<OrthopedicTemplatePicker {...defaultProps} />);
      expect(screen.getByText(/Skulder/)).toBeInTheDocument();
    });

    it('should include Albue option', () => {
      render(<OrthopedicTemplatePicker {...defaultProps} />);
      expect(screen.getByText(/Albue/)).toBeInTheDocument();
    });

    it('should include Håndledd option', () => {
      render(<OrthopedicTemplatePicker {...defaultProps} />);
      expect(screen.getByText(/Håndledd/)).toBeInTheDocument();
    });

    it('should include Hånd option', () => {
      render(<OrthopedicTemplatePicker {...defaultProps} />);
      // Use getAllByText since /Hånd/ matches both "Hånd" and "Håndledd"
      const matches = screen.getAllByText(/Hånd/);
      const handOption = matches.find(
        (el) => el.textContent.includes('Hånd') && !el.textContent.includes('Håndledd')
      );
      expect(handOption).toBeTruthy();
    });

    it('should include Hofte option', () => {
      render(<OrthopedicTemplatePicker {...defaultProps} />);
      expect(screen.getByText(/Hofte/)).toBeInTheDocument();
    });

    it('should include Kne option', () => {
      render(<OrthopedicTemplatePicker {...defaultProps} />);
      expect(screen.getByText(/Kne/)).toBeInTheDocument();
    });

    it('should include Ankel option', () => {
      render(<OrthopedicTemplatePicker {...defaultProps} />);
      expect(screen.getByText(/Ankel/)).toBeInTheDocument();
    });

    it('should update body region selection on change', () => {
      render(<OrthopedicTemplatePicker {...defaultProps} />);
      const select = screen.getByDisplayValue('Alle områder');
      fireEvent.change(select, { target: { value: 'cervical' } });
      expect(select).toHaveValue('cervical');
    });
  });

  // ============================================================================
  // SOAP SECTION DISPLAY TESTS
  // ============================================================================

  describe('SOAP Section Display', () => {
    it('should show Subjektiv (S) label when soapSection is SUBJECTIVE', () => {
      render(<OrthopedicTemplatePicker {...defaultProps} soapSection="SUBJECTIVE" />);
      expect(screen.getByText(/Subjektiv \(S\)/)).toBeInTheDocument();
    });

    it('should show Objektiv (O) label when soapSection is OBJECTIVE', () => {
      render(<OrthopedicTemplatePicker {...defaultProps} soapSection="OBJECTIVE" />);
      expect(screen.getByText(/Objektiv \(O\)/)).toBeInTheDocument();
    });

    it('should show Vurdering (A) label when soapSection is ASSESSMENT', () => {
      render(<OrthopedicTemplatePicker {...defaultProps} soapSection="ASSESSMENT" />);
      expect(screen.getByText(/Vurdering \(A\)/)).toBeInTheDocument();
    });

    it('should show Plan (P) label when soapSection is PLAN', () => {
      render(<OrthopedicTemplatePicker {...defaultProps} soapSection="PLAN" />);
      expect(screen.getByText(/Plan \(P\)/)).toBeInTheDocument();
    });
  });

  // ============================================================================
  // CLOSE BUTTON TESTS
  // ============================================================================

  describe('Close Button', () => {
    it('should call onClose when X button in header is clicked', () => {
      render(<OrthopedicTemplatePicker {...defaultProps} />);
      // The X button is in the header, it contains the X icon
      const headerButtons = screen
        .getByText('Kliniske Maler')
        .closest('.border-b')
        .querySelectorAll('button');
      // The close button is the last button in the header
      const closeButton = headerButtons[headerButtons.length - 1];
      fireEvent.click(closeButton);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when Lukk button in footer is clicked', () => {
      render(<OrthopedicTemplatePicker {...defaultProps} />);
      const lukkButton = screen.getByText('Lukk');
      fireEvent.click(lukkButton);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  // ============================================================================
  // LOADING STATE TESTS
  // ============================================================================

  describe('Loading States', () => {
    it('should show loading message when templates are loading', () => {
      useQuery.mockImplementation(({ queryKey }) => {
        if (queryKey[0] === 'templates') {
          return { data: null, isLoading: true };
        }
        return { data: null, isLoading: false };
      });
      render(<OrthopedicTemplatePicker {...defaultProps} />);
      expect(screen.getByText('Laster maler...')).toBeInTheDocument();
    });

    it('should show loading message when tests are loading', () => {
      useQuery.mockImplementation(({ queryKey }) => {
        if (queryKey[0] === 'orthopedic-tests') {
          return { data: null, isLoading: true };
        }
        return { data: null, isLoading: false };
      });
      render(<OrthopedicTemplatePicker {...defaultProps} />);
      // Switch to tests tab
      fireEvent.click(screen.getByText('Ortopediske Tester').closest('button'));
      expect(screen.getByText('Laster tester...')).toBeInTheDocument();
    });

    it('should show loading message when phrases are loading', () => {
      useQuery.mockImplementation(({ queryKey }) => {
        if (queryKey[0] === 'template-phrases') {
          return { data: null, isLoading: true };
        }
        return { data: null, isLoading: false };
      });
      render(<OrthopedicTemplatePicker {...defaultProps} />);
      // Switch to phrases tab
      fireEvent.click(screen.getByText('Fraser').closest('button'));
      expect(screen.getByText('Laster fraser...')).toBeInTheDocument();
    });
  });

  // ============================================================================
  // TEMPLATE RENDERING TESTS
  // ============================================================================

  describe('Template Rendering', () => {
    it('should render templates when data is available', () => {
      useQuery.mockImplementation(({ queryKey }) => {
        if (queryKey[0] === 'templates') {
          return {
            data: {
              data: [
                {
                  id: 't1',
                  name_no: 'Korsrygg standardmal',
                  content_no: 'Pasienten presenterer med korsryggsmerter...',
                  template_type: 'objective',
                  keywords: ['korsrygg', 'smerter'],
                },
              ],
            },
            isLoading: false,
          };
        }
        return { data: null, isLoading: false };
      });

      render(<OrthopedicTemplatePicker {...defaultProps} />);
      expect(screen.getByText('Korsrygg standardmal')).toBeInTheDocument();
      expect(screen.getByText('Pasienten presenterer med korsryggsmerter...')).toBeInTheDocument();
    });

    it('should render template keywords as tags', () => {
      useQuery.mockImplementation(({ queryKey }) => {
        if (queryKey[0] === 'templates') {
          return {
            data: {
              data: [
                {
                  id: 't1',
                  name_no: 'Test mal',
                  content_no: 'Innhold...',
                  keywords: ['nakke', 'smerter', 'stivhet'],
                },
              ],
            },
            isLoading: false,
          };
        }
        return { data: null, isLoading: false };
      });

      render(<OrthopedicTemplatePicker {...defaultProps} />);
      expect(screen.getByText('nakke')).toBeInTheDocument();
      expect(screen.getByText('smerter')).toBeInTheDocument();
      expect(screen.getByText('stivhet')).toBeInTheDocument();
    });
  });

  // ============================================================================
  // TEMPLATE CLICK TESTS
  // ============================================================================

  describe('Template Click', () => {
    it('should call onSelectTemplate and onClose when a template is clicked', async () => {
      const mockTemplate = {
        id: 't1',
        name_no: 'Testmal',
        content_no: 'Malen innhold her',
        template_data: null,
      };

      useQuery.mockImplementation(({ queryKey }) => {
        if (queryKey[0] === 'templates') {
          return { data: { data: [mockTemplate] }, isLoading: false };
        }
        return { data: null, isLoading: false };
      });

      const { templatesAPI } = await import('../../services/api');
      templatesAPI.trackUsage.mockResolvedValue({});

      render(<OrthopedicTemplatePicker {...defaultProps} />);
      fireEvent.click(screen.getByText('Testmal'));

      await waitFor(() => {
        expect(templatesAPI.trackUsage).toHaveBeenCalledWith('t1');
        expect(mockOnSelectTemplate).toHaveBeenCalledWith('Malen innhold her', mockTemplate);
        expect(mockOnClose).toHaveBeenCalled();
      });
    });
  });

  // ============================================================================
  // FOOTER INFORMATION TESTS
  // ============================================================================

  describe('Footer Information', () => {
    it('should show template count in footer when templates have pagination', () => {
      useQuery.mockImplementation(({ queryKey }) => {
        if (queryKey[0] === 'templates') {
          return {
            data: {
              data: [
                { id: 't1', name_no: 'Mal 1', content_no: 'Innhold 1' },
                { id: 't2', name_no: 'Mal 2', content_no: 'Innhold 2' },
              ],
              pagination: { total: 15 },
            },
            isLoading: false,
          };
        }
        return { data: null, isLoading: false };
      });

      render(<OrthopedicTemplatePicker {...defaultProps} />);
      expect(screen.getByText('Viser 2 av 15 maler')).toBeInTheDocument();
    });
  });
});
