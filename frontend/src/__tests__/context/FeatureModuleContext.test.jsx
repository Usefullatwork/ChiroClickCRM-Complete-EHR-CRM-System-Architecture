/**
 * FeatureModuleContext Tests
 * Verifies provider behavior, desktop mode, fetch logic, fallback, and hook output.
 */

import { render, screen, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FeatureModuleProvider, useFeatureModule } from '../../context/FeatureModuleContext';

// Helper component to read context values
function ContextReader({ onContext }) {
  const ctx = useFeatureModule();
  onContext?.(ctx);
  return (
    <div>
      <span data-testid="loading">{String(ctx.loading)}</span>
      <span data-testid="core">{String(ctx.isModuleEnabled('core_ehr'))}</span>
      <span data-testid="crm">{String(ctx.isModuleEnabled('crm_marketing'))}</span>
    </div>
  );
}

describe('FeatureModuleContext', () => {
  let originalFetch;

  beforeEach(() => {
    originalFetch = global.fetch;
    localStorage.clear();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.unstubAllEnvs();
  });

  it('should render children inside provider', () => {
    render(
      <FeatureModuleProvider>
        <span data-testid="child">hello</span>
      </FeatureModuleProvider>
    );
    expect(screen.getByTestId('child')).toHaveTextContent('hello');
  });

  it('should enable all modules in desktop mode (VITE_DEV_SKIP_AUTH=true)', async () => {
    vi.stubEnv('VITE_DEV_SKIP_AUTH', 'true');
    global.fetch = vi.fn();

    render(
      <FeatureModuleProvider>
        <ContextReader />
      </FeatureModuleProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });
    expect(screen.getByTestId('core')).toHaveTextContent('true');
    expect(screen.getByTestId('crm')).toHaveTextContent('true');
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('should fetch from /organizations/current when not desktop', async () => {
    vi.stubEnv('VITE_DEV_SKIP_AUTH', 'false');
    vi.stubEnv('VITE_API_URL', 'http://localhost:3000/api/v1');
    localStorage.setItem('organizationId', 'org1');

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          data: {
            settings: {
              enabled_modules: {
                core_ehr: true,
                crm_marketing: false,
                exercise_rx: true,
              },
            },
          },
        }),
    });

    render(
      <FeatureModuleProvider>
        <ContextReader />
      </FeatureModuleProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });
    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:3000/api/v1/organizations/current',
      expect.objectContaining({ credentials: 'include' })
    );
  });

  it('isModuleEnabled("core_ehr") should always return true', async () => {
    vi.stubEnv('VITE_DEV_SKIP_AUTH', 'true');

    let ctx;
    render(
      <FeatureModuleProvider>
        <ContextReader onContext={(c) => (ctx = c)} />
      </FeatureModuleProvider>
    );

    await waitFor(() => expect(ctx.loading).toBe(false));
    expect(ctx.isModuleEnabled('core_ehr')).toBe(true);
  });

  it('isModuleEnabled("crm_marketing") should be false when disabled in response', async () => {
    vi.stubEnv('VITE_DEV_SKIP_AUTH', 'false');
    vi.stubEnv('VITE_API_URL', 'http://localhost:3000/api/v1');
    localStorage.setItem('organizationId', 'org1');

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          data: {
            settings: {
              enabled_modules: { core_ehr: true, crm_marketing: false },
            },
          },
        }),
    });

    render(
      <FeatureModuleProvider>
        <ContextReader />
      </FeatureModuleProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('crm')).toHaveTextContent('false');
    });
  });

  it('updateModules() should merge new modules', async () => {
    vi.stubEnv('VITE_DEV_SKIP_AUTH', 'true');

    let ctx;
    render(
      <FeatureModuleProvider>
        <ContextReader onContext={(c) => (ctx = c)} />
      </FeatureModuleProvider>
    );

    await waitFor(() => expect(ctx.loading).toBe(false));
    expect(ctx.isModuleEnabled('crm_marketing')).toBe(true);

    act(() => {
      ctx.updateModules({ crm_marketing: false });
    });

    expect(ctx.isModuleEnabled('crm_marketing')).toBe(false);
    // core_ehr should still be true
    expect(ctx.isModuleEnabled('core_ehr')).toBe(true);
  });

  it('should fall back to all enabled on fetch error', async () => {
    vi.stubEnv('VITE_DEV_SKIP_AUTH', 'false');
    vi.stubEnv('VITE_API_URL', 'http://localhost:3000/api/v1');
    localStorage.setItem('organizationId', 'org1');

    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    render(
      <FeatureModuleProvider>
        <ContextReader />
      </FeatureModuleProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });
    // Falls back to all-enabled
    expect(screen.getByTestId('crm')).toHaveTextContent('true');
  });

  it('should not fetch when organizationId not in localStorage', async () => {
    vi.stubEnv('VITE_DEV_SKIP_AUTH', 'false');
    vi.stubEnv('VITE_API_URL', 'http://localhost:3000/api/v1');
    // No organizationId in localStorage

    global.fetch = vi.fn();

    render(
      <FeatureModuleProvider>
        <ContextReader />
      </FeatureModuleProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('useFeatureModule() outside provider should return all-enabled fallback', () => {
    let ctx;
    render(<ContextReader onContext={(c) => (ctx = c)} />);
    expect(ctx.isModuleEnabled('core_ehr')).toBe(true);
    expect(ctx.isModuleEnabled('crm_marketing')).toBe(true);
    expect(ctx.loading).toBe(false);
  });

  it('loading should transition from true to false', async () => {
    vi.stubEnv('VITE_DEV_SKIP_AUTH', 'false');
    vi.stubEnv('VITE_API_URL', 'http://localhost:3000/api/v1');
    localStorage.setItem('organizationId', 'org1');

    let resolveFetch;
    global.fetch = vi.fn(
      () =>
        new Promise((resolve) => {
          resolveFetch = resolve;
        })
    );

    render(
      <FeatureModuleProvider>
        <ContextReader />
      </FeatureModuleProvider>
    );

    // Initially loading
    expect(screen.getByTestId('loading')).toHaveTextContent('true');

    // Resolve the fetch
    await act(async () => {
      resolveFetch({
        ok: true,
        json: () =>
          Promise.resolve({ data: { settings: { enabled_modules: { core_ehr: true } } } }),
      });
    });

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });
  });
});
