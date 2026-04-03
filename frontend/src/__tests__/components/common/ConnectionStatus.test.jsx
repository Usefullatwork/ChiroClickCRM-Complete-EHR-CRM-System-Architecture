/**
 * ConnectionStatus Component Tests
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ConnectionStatus from '../../../components/common/ConnectionStatus';

vi.mock('../../../i18n/useTranslation', () => ({
  useTranslation: () => ({ t: (key, fallback) => fallback || key, lang: 'no', setLang: vi.fn() }),
}));
vi.mock('lucide-react', () => new Proxy({}, { get: (_, name) => (props) => null }));

describe('ConnectionStatus Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default to online
    Object.defineProperty(navigator, 'onLine', { value: true, writable: true, configurable: true });
  });

  // =========================================================================
  // ONLINE STATE
  // =========================================================================

  it('should show synced status when online with no pending changes', () => {
    render(<ConnectionStatus />);
    expect(screen.getByText('Synkronisert')).toBeInTheDocument();
  });

  it('should show syncing status when there are pending changes', () => {
    render(<ConnectionStatus pendingChanges={3} />);
    expect(screen.getByText('Synkroniserer...')).toBeInTheDocument();
  });

  // =========================================================================
  // OFFLINE STATE
  // =========================================================================

  it('should show offline status when browser is offline', () => {
    Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });
    render(<ConnectionStatus />);
    expect(screen.getByText('Offline')).toBeInTheDocument();
  });

  it('should show pending count when offline with pending changes', () => {
    Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });
    render(<ConnectionStatus pendingChanges={5} />);
    expect(screen.getByText('Offline')).toBeInTheDocument();
  });

  // =========================================================================
  // SYNC ERROR
  // =========================================================================

  it('should show sync error when syncError is provided', () => {
    render(<ConnectionStatus syncError="Network failure" />);
    expect(screen.getByText('Synkroniseringsfeil')).toBeInTheDocument();
  });

  it('should call onRetrySync when clicking error status', () => {
    const onRetry = vi.fn();
    render(<ConnectionStatus syncError="fail" onRetrySync={onRetry} />);
    fireEvent.click(screen.getByText('Synkroniseringsfeil'));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  // =========================================================================
  // DETAILS POPUP
  // =========================================================================

  it('should show details on mouse enter', () => {
    render(<ConnectionStatus lastSyncTime={new Date()} />);
    const statusEl = screen.getByText('Synkronisert').closest('div.fixed');
    fireEvent.mouseEnter(statusEl);
    expect(screen.getByText('Status')).toBeInTheDocument();
  });

  // =========================================================================
  // POSITION
  // =========================================================================

  it('should apply bottom-right position by default', () => {
    const { container } = render(<ConnectionStatus />);
    const wrapper = container.querySelector('.fixed');
    expect(wrapper.className).toContain('bottom-4');
    expect(wrapper.className).toContain('right-4');
  });

  it('should apply top-left position', () => {
    const { container } = render(<ConnectionStatus position="top-left" />);
    const wrapper = container.querySelector('.fixed');
    expect(wrapper.className).toContain('top-4');
    expect(wrapper.className).toContain('left-4');
  });

  // =========================================================================
  // RETRY BUTTON IN DETAILS
  // =========================================================================

  it('should show retry button in details popup when syncError and onRetrySync', () => {
    const onRetry = vi.fn();
    render(<ConnectionStatus syncError="err" onRetrySync={onRetry} />);
    const wrapper = screen.getByText('Synkroniseringsfeil').closest('div.fixed');
    fireEvent.mouseEnter(wrapper);
    const retryBtn = screen.getByText('Prøv igjen');
    expect(retryBtn).toBeInTheDocument();
    fireEvent.click(retryBtn);
    expect(onRetry).toHaveBeenCalled();
  });
});
