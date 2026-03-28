/**
 * OfflineIndicator Component Tests
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the useOffline hook before component import
const mockUseOffline = vi.fn();
vi.mock('../../../hooks/useOffline', () => ({
  useOffline: () => mockUseOffline(),
  default: () => mockUseOffline(),
}));

import { OfflineIndicator } from '../../../components/ui/OfflineIndicator';

// Helper: default online state
const onlineState = {
  isOnline: true,
  isOffline: false,
  pendingSyncCount: 0,
  isSyncing: false,
  syncStatus: null,
  lastSyncTime: null,
  cachedVideoCount: 0,
  triggerSync: vi.fn(),
};

// Helper: offline state
const offlineState = {
  ...onlineState,
  isOnline: false,
  isOffline: true,
};

describe('OfflineIndicator Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseOffline.mockReturnValue(onlineState);
  });

  // =========================================================================
  // BANNER VARIANT — OFFLINE
  // =========================================================================

  it('should show offline banner when offline', () => {
    mockUseOffline.mockReturnValue(offlineState);
    render(<OfflineIndicator variant="banner" />);
    expect(screen.getByText('Du er frakoblet')).toBeInTheDocument();
  });

  it('should show offline description in banner', () => {
    mockUseOffline.mockReturnValue(offlineState);
    render(<OfflineIndicator variant="banner" />);
    expect(screen.getByText('Ovelsene dine er fortsatt tilgjengelige')).toBeInTheDocument();
  });

  it('should render nothing when online and no notification needed', () => {
    mockUseOffline.mockReturnValue(onlineState);
    const { container } = render(<OfflineIndicator variant="banner" showWhenOnline={false} />);
    expect(container.firstChild).toBeNull();
  });

  // =========================================================================
  // DISMISS
  // =========================================================================

  it('should be dismissable by default', () => {
    mockUseOffline.mockReturnValue(offlineState);
    render(<OfflineIndicator variant="banner" />);
    const dismissBtn = screen.getByLabelText('Lukk');
    expect(dismissBtn).toBeInTheDocument();
  });

  it('should hide when dismiss button is clicked', () => {
    mockUseOffline.mockReturnValue(offlineState);
    render(<OfflineIndicator variant="banner" />);
    fireEvent.click(screen.getByLabelText('Lukk'));
    expect(screen.queryByText('Du er frakoblet')).not.toBeInTheDocument();
  });

  // =========================================================================
  // VIEW DETAILS (BANNER)
  // =========================================================================

  it('should toggle details when "Vis detaljer" is clicked', () => {
    mockUseOffline.mockReturnValue(offlineState);
    render(<OfflineIndicator variant="banner" />);
    const detailsBtn = screen.getByText('Vis detaljer');
    fireEvent.click(detailsBtn);
    expect(screen.getByText('Tilgjengelig offline:')).toBeInTheDocument();
    expect(screen.getByText('Se ovelser')).toBeInTheDocument();
    expect(screen.getByText('Registrer fremgang')).toBeInTheDocument();
  });

  // =========================================================================
  // PENDING SYNC COUNT (BANNER)
  // =========================================================================

  it('should show pending sync count when online with pending items', () => {
    mockUseOffline.mockReturnValue({
      ...onlineState,
      pendingSyncCount: 3,
      syncStatus: 'success',
    });
    render(<OfflineIndicator variant="banner" />);
    expect(screen.getByText('3 endringer venter pa synkronisering')).toBeInTheDocument();
  });

  it('should use singular form for 1 pending item', () => {
    mockUseOffline.mockReturnValue({
      ...onlineState,
      pendingSyncCount: 1,
      syncStatus: 'success',
    });
    render(<OfflineIndicator variant="banner" />);
    expect(screen.getByText('1 endring venter pa synkronisering')).toBeInTheDocument();
  });

  // =========================================================================
  // BADGE VARIANT
  // =========================================================================

  it('should show offline badge when offline', () => {
    mockUseOffline.mockReturnValue(offlineState);
    render(<OfflineIndicator variant="badge" />);
    expect(screen.getByText('Du er frakoblet')).toBeInTheDocument();
  });

  it('should render nothing for badge when online and no pending', () => {
    mockUseOffline.mockReturnValue(onlineState);
    const { container } = render(<OfflineIndicator variant="badge" />);
    expect(container.firstChild).toBeNull();
  });

  // =========================================================================
  // TOAST VARIANT
  // =========================================================================

  it('should show offline toast when offline', () => {
    mockUseOffline.mockReturnValue(offlineState);
    render(<OfflineIndicator variant="toast" />);
    expect(screen.getByText('Du er frakoblet')).toBeInTheDocument();
  });

  // =========================================================================
  // MINIMAL VARIANT
  // =========================================================================

  it('should render minimal variant when offline', () => {
    mockUseOffline.mockReturnValue(offlineState);
    const { container } = render(<OfflineIndicator variant="minimal" />);
    // Minimal variant renders a WifiOff icon with title
    expect(container.querySelector('[title="Du er frakoblet"]')).toBeInTheDocument();
  });

  it('should show pending count badge in minimal variant', () => {
    mockUseOffline.mockReturnValue({ ...offlineState, pendingSyncCount: 5 });
    render(<OfflineIndicator variant="minimal" />);
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('should show 9+ for counts over 9 in minimal variant', () => {
    mockUseOffline.mockReturnValue({ ...offlineState, pendingSyncCount: 15 });
    render(<OfflineIndicator variant="minimal" />);
    expect(screen.getByText('9+')).toBeInTheDocument();
  });

  it('should render nothing for minimal when online', () => {
    mockUseOffline.mockReturnValue(onlineState);
    const { container } = render(<OfflineIndicator variant="minimal" />);
    expect(container.firstChild).toBeNull();
  });

  // =========================================================================
  // ENGLISH LANGUAGE
  // =========================================================================

  it('should show English text when lang="en"', () => {
    mockUseOffline.mockReturnValue(offlineState);
    render(<OfflineIndicator variant="banner" lang="en" />);
    expect(screen.getByText('You are offline')).toBeInTheDocument();
    expect(screen.getByText('Your exercises are still available')).toBeInTheDocument();
  });

  // =========================================================================
  // SYNCING STATE
  // =========================================================================

  it('should show syncing text in banner when syncing', () => {
    mockUseOffline.mockReturnValue({
      ...onlineState,
      isSyncing: true,
    });
    render(<OfflineIndicator variant="banner" />);
    expect(screen.getByText('Synkroniserer...')).toBeInTheDocument();
  });

  // =========================================================================
  // SYNC ERROR
  // =========================================================================

  it('should show error state in banner', () => {
    mockUseOffline.mockReturnValue({
      ...onlineState,
      syncStatus: 'error',
    });
    render(<OfflineIndicator variant="banner" />);
    expect(screen.getByText('Synkronisering feilet')).toBeInTheDocument();
  });

  // =========================================================================
  // UNKNOWN VARIANT
  // =========================================================================

  it('should render nothing for unknown variant', () => {
    mockUseOffline.mockReturnValue(offlineState);
    const { container } = render(<OfflineIndicator variant="unknown" />);
    expect(container.firstChild).toBeNull();
  });
});
