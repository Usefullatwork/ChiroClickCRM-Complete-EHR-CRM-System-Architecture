/**
 * AnatomyViewer Component Tests
 * Tests for the combined 2D/3D anatomy visualization component
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AnatomyViewer, { VIEW_MODES } from '../../components/anatomy/AnatomyViewer';

// Mock the API
vi.mock('../../services/api', () => ({
  spineTemplatesAPI: {
    getGrouped: vi.fn(),
  },
}));

// Mock ALL child anatomy components to avoid WebGL/Three.js issues in jsdom
vi.mock('../../components/anatomy/spine/EnhancedSpineDiagram', () => ({
  default: function MockEnhancedSpineDiagram() {
    return <div data-testid="enhanced-spine-diagram">EnhancedSpineDiagram</div>;
  },
  CompactSpineDiagram: function MockCompactSpineDiagram() {
    return <div data-testid="compact-spine-diagram">CompactSpineDiagram</div>;
  },
}));

vi.mock('../../components/anatomy/spine/Spine3DViewer', () => ({
  default: function MockSpine3DViewer() {
    return <div data-testid="spine-3d-viewer">Spine3DViewer</div>;
  },
  CompactSpine3D: function MockCompactSpine3D() {
    return <div data-testid="compact-spine-3d">CompactSpine3D</div>;
  },
}));

vi.mock('../../components/anatomy/body/EnhancedBodyDiagram', () => ({
  default: function MockEnhancedBodyDiagram() {
    return <div data-testid="enhanced-body-diagram">EnhancedBodyDiagram</div>;
  },
  CompactBodyDiagram: function MockCompactBodyDiagram() {
    return <div data-testid="compact-body-diagram">CompactBodyDiagram</div>;
  },
}));

import { spineTemplatesAPI } from '../../services/api';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return function Wrapper({ children }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe('AnatomyViewer Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    spineTemplatesAPI.getGrouped.mockResolvedValue({ data: { data: {} } });
  });

  // ============================================================================
  // DEFAULT RENDERING
  // ============================================================================

  describe('Default Rendering', () => {
    it('should render the component with "Anatomisk Visualisering" heading', async () => {
      render(<AnatomyViewer />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Anatomisk Visualisering')).toBeInTheDocument();
      });
    });

    it('should render the default SPINE_2D mode', async () => {
      render(<AnatomyViewer />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByTestId('enhanced-spine-diagram')).toBeInTheDocument();
      });
    });

    it('should render settings button', async () => {
      render(<AnatomyViewer />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByTitle('Innstillinger')).toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // MODE SWITCHING
  // ============================================================================

  describe('Mode Switching', () => {
    it('should show mode toggle buttons', async () => {
      render(<AnatomyViewer />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByTitle('SVG ryggraddiagram')).toBeInTheDocument();
        expect(screen.getByTitle('3D interaktiv modell')).toBeInTheDocument();
        expect(screen.getByTitle('Kroppskart for smertelokalisering')).toBeInTheDocument();
      });
    });

    it('should switch to BODY_2D mode when body button is clicked', async () => {
      render(<AnatomyViewer />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByTestId('enhanced-spine-diagram')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTitle('Kroppskart for smertelokalisering'));

      await waitFor(() => {
        expect(screen.getByTestId('enhanced-body-diagram')).toBeInTheDocument();
        expect(screen.queryByTestId('enhanced-spine-diagram')).not.toBeInTheDocument();
      });
    });

    it('should switch to SPINE_3D mode when 3D button is clicked', async () => {
      render(<AnatomyViewer />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByTestId('enhanced-spine-diagram')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTitle('3D interaktiv modell'));

      await waitFor(() => {
        expect(screen.getByTestId('spine-3d-viewer')).toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // ALLOW MODE SWITCH
  // ============================================================================

  describe('allowModeSwitch', () => {
    it('should hide mode toggle buttons when allowModeSwitch is false', async () => {
      render(<AnatomyViewer allowModeSwitch={false} />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Anatomisk Visualisering')).toBeInTheDocument();
      });

      expect(screen.queryByTitle('SVG ryggraddiagram')).not.toBeInTheDocument();
      expect(screen.queryByTitle('3D interaktiv modell')).not.toBeInTheDocument();
    });
  });

  // ============================================================================
  // ALLOWED MODES
  // ============================================================================

  describe('allowedModes', () => {
    it('should only show buttons for allowed modes', async () => {
      render(<AnatomyViewer allowedModes={[VIEW_MODES.SPINE_2D, VIEW_MODES.BODY_2D]} />, {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(screen.getByTitle('SVG ryggraddiagram')).toBeInTheDocument();
        expect(screen.getByTitle('Kroppskart for smertelokalisering')).toBeInTheDocument();
        expect(screen.queryByTitle('3D interaktiv modell')).not.toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // LOADING STATE
  // ============================================================================

  describe('Loading State', () => {
    it('should show loading spinner while templates are loading', () => {
      spineTemplatesAPI.getGrouped.mockReturnValue(new Promise(() => {}));
      render(<AnatomyViewer />, { wrapper: createWrapper() });
      expect(screen.getByText('Laster maler...')).toBeInTheDocument();
    });
  });

  // ============================================================================
  // FINDINGS BADGE
  // ============================================================================

  describe('Findings Badge', () => {
    it('should not show findings badge when no findings exist', async () => {
      render(<AnatomyViewer />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Anatomisk Visualisering')).toBeInTheDocument();
      });

      expect(screen.queryByText(/funn/)).not.toBeInTheDocument();
    });

    it('should show findings count badge when findings exist', async () => {
      render(
        <AnatomyViewer
          spineFindings={{ C2: { vertebra: 'C2', type: 'restriction' } }}
          bodyRegions={['neck']}
        />,
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        // 1 spine finding + 1 body region = 2 funn
        expect(screen.getByText('2 funn')).toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // CLEAR BUTTON
  // ============================================================================

  describe('Clear Button', () => {
    it('should show clear button when findings exist', async () => {
      render(
        <AnatomyViewer
          spineFindings={{ C2: { vertebra: 'C2', type: 'restriction' } }}
          onSpineFindingsChange={vi.fn()}
          onBodyRegionsChange={vi.fn()}
        />,
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(screen.getByTitle('Nullstill alle funn')).toBeInTheDocument();
      });
    });

    it('should not show clear button when no findings', async () => {
      render(<AnatomyViewer />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Anatomisk Visualisering')).toBeInTheDocument();
      });

      expect(screen.queryByTitle('Nullstill alle funn')).not.toBeInTheDocument();
    });

    it('should call clear callbacks when clear button is clicked', async () => {
      const onSpineFindingsChange = vi.fn();
      const onBodyRegionsChange = vi.fn();

      render(
        <AnatomyViewer
          spineFindings={{ C2: { vertebra: 'C2', type: 'restriction' } }}
          bodyRegions={['neck']}
          onSpineFindingsChange={onSpineFindingsChange}
          onBodyRegionsChange={onBodyRegionsChange}
        />,
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(screen.getByTitle('Nullstill alle funn')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTitle('Nullstill alle funn'));

      expect(onSpineFindingsChange).toHaveBeenCalledWith({});
      expect(onBodyRegionsChange).toHaveBeenCalledWith([]);
    });
  });

  // ============================================================================
  // SETTINGS PANEL
  // ============================================================================

  describe('Settings Panel', () => {
    it('should toggle settings panel when settings button is clicked', async () => {
      render(<AnatomyViewer />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByTitle('Innstillinger')).toBeInTheDocument();
      });

      // Settings panel should not be visible initially
      expect(screen.queryByText('Vis narrativ')).not.toBeInTheDocument();

      // Click settings button
      fireEvent.click(screen.getByTitle('Innstillinger'));

      // Settings panel should now be visible
      await waitFor(() => {
        expect(screen.getByText('Vis narrativ')).toBeInTheDocument();
        expect(screen.getByText('Vis forklaring')).toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // COMPACT MODE
  // ============================================================================

  describe('Compact Mode', () => {
    it('should render compact view without full header', async () => {
      render(<AnatomyViewer compact={true} />, { wrapper: createWrapper() });

      await waitFor(() => {
        // In compact mode, the full header with "Anatomisk Visualisering" is not shown
        expect(screen.queryByText('Anatomisk Visualisering')).not.toBeInTheDocument();
        // But the compact view should render the compact spine diagram
        expect(screen.getByTestId('compact-spine-diagram')).toBeInTheDocument();
      });
    });

    it('should show compact mode toggle buttons when allowModeSwitch is true', async () => {
      render(<AnatomyViewer compact={true} allowModeSwitch={true} />, {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        // Compact mode uses icon-only buttons with title attributes
        const buttons = document.querySelectorAll('button[title]');
        expect(buttons.length).toBeGreaterThan(0);
      });
    });

    it('should render compact body diagram when BODY_2D mode in compact', async () => {
      render(
        <AnatomyViewer compact={true} allowModeSwitch={true} initialMode={VIEW_MODES.BODY_2D} />,
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(screen.getByTestId('compact-body-diagram')).toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // CALLBACKS
  // ============================================================================

  describe('Callbacks', () => {
    it('should call onSpineFindingsChange when findings are cleared', async () => {
      const onSpineFindingsChange = vi.fn();
      render(
        <AnatomyViewer
          spineFindings={{ C2: { vertebra: 'C2', type: 'restriction' } }}
          onSpineFindingsChange={onSpineFindingsChange}
          onBodyRegionsChange={vi.fn()}
        />,
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(screen.getByTitle('Nullstill alle funn')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTitle('Nullstill alle funn'));
      expect(onSpineFindingsChange).toHaveBeenCalledWith({});
    });

    it('should call onBodyRegionsChange with empty array when cleared', async () => {
      const onBodyRegionsChange = vi.fn();
      render(
        <AnatomyViewer
          spineFindings={{ C2: { vertebra: 'C2', type: 'restriction' } }}
          bodyRegions={['neck', 'shoulder']}
          onSpineFindingsChange={vi.fn()}
          onBodyRegionsChange={onBodyRegionsChange}
        />,
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(screen.getByTitle('Nullstill alle funn')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTitle('Nullstill alle funn'));
      expect(onBodyRegionsChange).toHaveBeenCalledWith([]);
    });
  });

  // ============================================================================
  // MULTIPLE FINDINGS COUNT
  // ============================================================================

  describe('Multiple Findings Count', () => {
    it('should count multiple spine findings correctly', async () => {
      render(
        <AnatomyViewer
          spineFindings={{
            C2: { vertebra: 'C2', type: 'restriction' },
            C5: { vertebra: 'C5', type: 'fixation' },
            T4: { vertebra: 'T4', type: 'tenderness' },
          }}
        />,
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(screen.getByText('3 funn')).toBeInTheDocument();
      });
    });

    it('should count spine findings + body regions together', async () => {
      render(
        <AnatomyViewer
          spineFindings={{
            C2: { vertebra: 'C2', type: 'restriction' },
          }}
          bodyRegions={['neck', 'shoulder', 'lower_back']}
        />,
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        // 1 spine finding + 3 body regions = 4 funn
        expect(screen.getByText('4 funn')).toBeInTheDocument();
      });
    });

    it('should show "1 funn" for single finding', async () => {
      render(<AnatomyViewer spineFindings={{ C2: { vertebra: 'C2', type: 'restriction' } }} />, {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(screen.getByText('1 funn')).toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // MODE CYCLING
  // ============================================================================

  describe('Mode Cycling', () => {
    it('should cycle through all three modes', async () => {
      render(<AnatomyViewer />, { wrapper: createWrapper() });

      // Start in SPINE_2D
      await waitFor(() => {
        expect(screen.getByTestId('enhanced-spine-diagram')).toBeInTheDocument();
      });

      // Switch to SPINE_3D
      fireEvent.click(screen.getByTitle('3D interaktiv modell'));
      await waitFor(() => {
        expect(screen.getByTestId('spine-3d-viewer')).toBeInTheDocument();
      });

      // Switch to BODY_2D
      fireEvent.click(screen.getByTitle('Kroppskart for smertelokalisering'));
      await waitFor(() => {
        expect(screen.getByTestId('enhanced-body-diagram')).toBeInTheDocument();
      });

      // Switch back to SPINE_2D
      fireEvent.click(screen.getByTitle('SVG ryggraddiagram'));
      await waitFor(() => {
        expect(screen.getByTestId('enhanced-spine-diagram')).toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // SETTINGS TOGGLES
  // ============================================================================

  describe('Settings Toggles', () => {
    it('should show narrative and explanation toggles in settings panel', async () => {
      render(<AnatomyViewer />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByTitle('Innstillinger')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTitle('Innstillinger'));

      await waitFor(() => {
        expect(screen.getByText('Vis narrativ')).toBeInTheDocument();
        expect(screen.getByText('Vis forklaring')).toBeInTheDocument();
      });
    });

    it('should close settings panel when clicking settings button again', async () => {
      render(<AnatomyViewer />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByTitle('Innstillinger')).toBeInTheDocument();
      });

      // Open
      fireEvent.click(screen.getByTitle('Innstillinger'));
      await waitFor(() => {
        expect(screen.getByText('Vis narrativ')).toBeInTheDocument();
      });

      // Close
      fireEvent.click(screen.getByTitle('Innstillinger'));
      await waitFor(() => {
        expect(screen.queryByText('Vis narrativ')).not.toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // API INTEGRATION
  // ============================================================================

  describe('API Integration', () => {
    it('should call spineTemplatesAPI on mount', async () => {
      render(<AnatomyViewer />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(spineTemplatesAPI.getGrouped).toHaveBeenCalled();
      });
    });
  });
});
