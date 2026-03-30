/**
 * ModuleManager Component Tests
 * Verifies module card rendering, toggle behavior, lock state, and PATCH fetch.
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock i18n
vi.mock('../../i18n', () => ({
  useTranslation: () => ({
    t: (key, fallback) => fallback || key,
  }),
}));

// Mock FeatureModuleContext
const mockUpdateModules = vi.fn();
const mockModules = {
  core_ehr: true,
  clinical_ai: true,
  exercise_rx: true,
  patient_portal: true,
  crm_marketing: false,
  advanced_clinical: false,
  analytics_reporting: true,
  multi_location: false,
};

vi.mock('../../context/FeatureModuleContext', () => ({
  useFeatureModule: () => ({
    modules: { ...mockModules },
    updateModules: mockUpdateModules,
    isModuleEnabled: (name) => mockModules[name] === true,
    loading: false,
  }),
}));

import ModuleManager from '../../components/settings/ModuleManager';

describe('ModuleManager', () => {
  let originalFetch;

  beforeEach(() => {
    originalFetch = global.fetch;
    mockUpdateModules.mockReset();
    localStorage.setItem('organizationId', 'org1');
  });

  afterEach(() => {
    global.fetch = originalFetch;
    localStorage.clear();
  });

  it('should render all 8 module cards', () => {
    render(<ModuleManager />);
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes).toHaveLength(8);
  });

  it('should render core_ehr toggle as disabled (locked)', () => {
    render(<ModuleManager />);
    const checkboxes = screen.getAllByRole('checkbox');
    // core_ehr is first in MODULE_CONFIG
    expect(checkboxes[0]).toBeDisabled();
  });

  it('should render core_ehr checkbox as always checked', () => {
    render(<ModuleManager />);
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes[0]).toBeChecked();
  });

  it('should trigger PATCH fetch when non-locked toggle is clicked', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true });
    render(<ModuleManager />);

    // clinical_ai is the second checkbox (index 1)
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[1]);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/organizations/org1/modules'),
        expect.objectContaining({
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
        })
      );
    });
  });

  it('should call updateModules() on successful toggle', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true });
    render(<ModuleManager />);

    const checkboxes = screen.getAllByRole('checkbox');
    // Toggle crm_marketing (index 4, currently false → true)
    fireEvent.click(checkboxes[4]);

    await waitFor(() => {
      expect(mockUpdateModules).toHaveBeenCalled();
    });
  });

  it('should NOT call updateModules() on failed fetch', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500 });
    render(<ModuleManager />);

    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[4]);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });
    expect(mockUpdateModules).not.toHaveBeenCalled();
  });

  it('should display tier badges for PRO and ENTERPRISE modules', () => {
    render(<ModuleManager />);
    // PRO modules: clinical_ai, exercise_rx, patient_portal, analytics_reporting
    // ENTERPRISE: crm_marketing, advanced_clinical, multi_location
    const proBadges = screen.getAllByText('PRO');
    const enterpriseBadges = screen.getAllByText('ENTERPRISE');
    expect(proBadges.length).toBe(4);
    expect(enterpriseBadges.length).toBe(3);
  });

  it('should use i18n keys for module names', () => {
    render(<ModuleManager />);
    // The t() mock returns fallback which is mod.id.replace(/_/g, ' ')
    expect(screen.getByText('core ehr')).toBeInTheDocument();
    expect(screen.getByText('clinical ai')).toBeInTheDocument();
    expect(screen.getByText('exercise rx')).toBeInTheDocument();
  });

  it('should disable all toggles while saving', async () => {
    // Create a fetch that won't resolve immediately
    let resolveFetch;
    global.fetch = vi.fn(
      () =>
        new Promise((resolve) => {
          resolveFetch = resolve;
        })
    );

    render(<ModuleManager />);
    const checkboxes = screen.getAllByRole('checkbox');

    // Click a non-locked toggle to start saving
    fireEvent.click(checkboxes[1]);

    // All non-locked checkboxes should be disabled while saving
    await waitFor(() => {
      const allCheckboxes = screen.getAllByRole('checkbox');
      allCheckboxes.forEach((cb) => {
        expect(cb).toBeDisabled();
      });
    });

    // Resolve to clean up
    await resolveFetch({ ok: true });
  });
});
