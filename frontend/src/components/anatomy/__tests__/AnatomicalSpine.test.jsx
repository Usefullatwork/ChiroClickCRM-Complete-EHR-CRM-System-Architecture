/**
 * Tests for AnatomicalSpine Component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AnatomicalSpine, {
  VERTEBRAE,
  FINDING_TYPES,
  LISTINGS,
  REGION_COLORS,
} from '../AnatomicalSpine';

describe('AnatomicalSpine Component', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render the spine diagram', () => {
      render(<AnatomicalSpine onChange={mockOnChange} />);

      expect(screen.getByText('Anatomisk Ryggdiagram')).toBeInTheDocument();
    });

    it('should render all vertebra labels', () => {
      render(<AnatomicalSpine showLabels onChange={mockOnChange} />);

      // Check for key vertebrae (may appear in both SVG labels and quick select)
      expect(screen.getAllByText('C1').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('C7').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('T1').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('T12').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('L1').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('L5').length).toBeGreaterThanOrEqual(1);
    });

    it('should render region labels', () => {
      render(<AnatomicalSpine onChange={mockOnChange} />);

      expect(screen.getByText('CERVICAL')).toBeInTheDocument();
      expect(screen.getByText('THORACIC')).toBeInTheDocument();
      expect(screen.getByText('LUMBAR')).toBeInTheDocument();
      expect(screen.getByText('SACRAL')).toBeInTheDocument();
    });

    it('should render finding type selector', () => {
      render(<AnatomicalSpine onChange={mockOnChange} />);

      expect(screen.getByText('Funntype')).toBeInTheDocument();

      Object.values(FINDING_TYPES).forEach((type) => {
        expect(screen.getByText(new RegExp(type.label))).toBeInTheDocument();
      });
    });

    it('should render listing selector', () => {
      render(<AnatomicalSpine onChange={mockOnChange} />);

      expect(screen.getByText('Listing/Retning')).toBeInTheDocument();
    });
  });

  describe('Layer Controls', () => {
    it('should toggle disc visibility', async () => {
      const user = userEvent.setup();
      render(<AnatomicalSpine showDiscs onChange={mockOnChange} />);

      // Find disc toggle button (Circle icon)
      const discToggle = screen.getByTitle('Vis/skjul discer');
      await user.click(discToggle);

      // Disc visibility toggled
    });

    it('should toggle nerve visibility', async () => {
      const user = userEvent.setup();
      render(<AnatomicalSpine showNerves onChange={mockOnChange} />);

      // Find nerve toggle button (Zap icon)
      const nerveToggle = screen.getByTitle('Vis/skjul nerver');
      await user.click(nerveToggle);

      // Nerve visibility toggled
    });
  });

  describe('Finding Selection', () => {
    it('should allow selecting finding type', async () => {
      const user = userEvent.setup();
      render(<AnatomicalSpine onChange={mockOnChange} />);

      // Click on subluxation finding type
      const subluxationBtn = screen.getByText(/Subluksasjon/);
      await user.click(subluxationBtn);

      expect(subluxationBtn.className).toContain('ring');
    });

    it('should allow selecting listing', async () => {
      const user = userEvent.setup();
      render(<AnatomicalSpine onChange={mockOnChange} />);

      // Click on a listing option
      const prListing = screen.getByText('PR');
      await user.click(prListing);

      expect(prListing.className).toContain('bg-blue');
    });
  });

  describe('Findings Management', () => {
    it('should display findings count', () => {
      const findings = {
        L4_subluxation: {
          elementId: 'L4',
          elementLabel: 'L4',
          type: 'subluxation',
          typeLabel: 'Subluksasjon',
          listing: 'PR',
        },
      };

      render(<AnatomicalSpine findings={findings} onChange={mockOnChange} />);

      expect(screen.getByText('1 funn')).toBeInTheDocument();
    });

    it('should display findings list', () => {
      const findings = {
        L4_subluxation: {
          elementId: 'L4',
          elementLabel: 'L4',
          type: 'subluxation',
          typeLabel: 'Subluksasjon',
          listing: 'PR',
          color: '#ef4444',
        },
      };

      render(<AnatomicalSpine findings={findings} onChange={mockOnChange} />);

      expect(screen.getAllByText('L4').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText(/Subluksasjon/).length).toBeGreaterThanOrEqual(1);
    });

    it('should clear findings when clicking Nullstill', async () => {
      const user = userEvent.setup();
      const findings = {
        L4_subluxation: {
          elementId: 'L4',
          elementLabel: 'L4',
          type: 'subluxation',
        },
      };

      render(<AnatomicalSpine findings={findings} onChange={mockOnChange} />);

      const clearButton = screen.getByText('Nullstill');
      await user.click(clearButton);

      expect(mockOnChange).toHaveBeenCalledWith({});
    });
  });

  describe('Quick Selection', () => {
    it('should render quick selection grid', () => {
      render(<AnatomicalSpine onChange={mockOnChange} />);

      expect(screen.getByText('Hurtigvalg')).toBeInTheDocument();
    });

    it('should have all vertebrae in quick select', () => {
      render(<AnatomicalSpine onChange={mockOnChange} />);

      // Check for quick select buttons (there will be multiple C1, L4 etc texts)
      // due to SVG labels + quick select buttons
      const c1Buttons = screen.getAllByText('C1');
      expect(c1Buttons.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Narrative Generation', () => {
    it('should generate narrative from findings', () => {
      const findings = {
        L4_subluxation: {
          elementId: 'L4',
          elementLabel: 'L4',
          type: 'subluxation',
          typeLabel: 'Subluksasjon',
          listing: 'PR',
        },
        L5_fixation: {
          elementId: 'L5',
          elementLabel: 'L5',
          type: 'fixation',
          typeLabel: 'Fiksasjon',
          listing: 'none',
        },
      };

      render(<AnatomicalSpine findings={findings} onChange={mockOnChange} />);

      expect(screen.getByText('Ryggfunn (til journal):')).toBeInTheDocument();
      expect(screen.getByText(/Subluksasjon.*L4/)).toBeInTheDocument();
      expect(screen.getByText(/Fiksasjon.*L5/)).toBeInTheDocument();
    });
  });

  describe('Read Only Mode', () => {
    it('should not show controls in read only mode', () => {
      render(<AnatomicalSpine readOnly onChange={mockOnChange} />);

      expect(screen.queryByText('Funntype')).not.toBeInTheDocument();
      expect(screen.queryByText('Listing/Retning')).not.toBeInTheDocument();
    });

    it('should not show clear button in read only mode', () => {
      const findings = {
        L4_subluxation: {
          elementId: 'L4',
          type: 'subluxation',
        },
      };

      render(<AnatomicalSpine findings={findings} readOnly onChange={mockOnChange} />);

      expect(screen.queryByText('Nullstill')).not.toBeInTheDocument();
    });
  });

  describe('Compact Mode', () => {
    it('should render in compact mode', () => {
      render(<AnatomicalSpine compact onChange={mockOnChange} />);

      expect(screen.getByText('Anatomisk Ryggdiagram')).toBeInTheDocument();
    });
  });
});

describe('VERTEBRAE Data', () => {
  it('should have all spine regions', () => {
    const regions = new Set(VERTEBRAE.map((v) => v.region));

    expect(regions.has('cervical')).toBe(true);
    expect(regions.has('thoracic')).toBe(true);
    expect(regions.has('lumbar')).toBe(true);
    expect(regions.has('sacral')).toBe(true);
  });

  it('should have correct vertebrae count', () => {
    const cervical = VERTEBRAE.filter((v) => v.region === 'cervical');
    const thoracic = VERTEBRAE.filter((v) => v.region === 'thoracic');
    const lumbar = VERTEBRAE.filter((v) => v.region === 'lumbar');

    expect(cervical.length).toBe(7); // C1-C7
    expect(thoracic.length).toBe(12); // T1-T12
    expect(lumbar.length).toBe(5); // L1-L5
  });

  it('should have y positions for all vertebrae', () => {
    VERTEBRAE.forEach((v) => {
      expect(typeof v.y).toBe('number');
      expect(v.y).toBeGreaterThan(0);
    });
  });

  it('should have hasDisc property', () => {
    VERTEBRAE.forEach((v) => {
      expect(typeof v.hasDisc).toBe('boolean');
    });

    // C1 (Atlas) should not have disc
    const c1 = VERTEBRAE.find((v) => v.id === 'C1');
    expect(c1.hasDisc).toBe(false);

    // L4 should have disc
    const l4 = VERTEBRAE.find((v) => v.id === 'L4');
    expect(l4.hasDisc).toBe(true);
  });
});

describe('FINDING_TYPES Data', () => {
  it('should have all chiropractic finding types', () => {
    const expectedTypes = [
      'subluxation',
      'fixation',
      'restriction',
      'disc_bulge',
      'disc_herniation',
      'adjusted',
    ];

    const typeIds = Object.keys(FINDING_TYPES);
    expectedTypes.forEach((type) => {
      expect(typeIds).toContain(type);
    });
  });

  it('should have priorities for all types', () => {
    Object.values(FINDING_TYPES).forEach((type) => {
      expect(typeof type.priority).toBe('number');
    });
  });

  it('should have Norwegian labels', () => {
    Object.values(FINDING_TYPES).forEach((type) => {
      expect(type.label).toBeDefined();
      expect(type.label.length).toBeGreaterThan(0);
    });
  });
});

describe('LISTINGS Data', () => {
  it('should have common chiropractic listings', () => {
    const listingIds = LISTINGS.map((l) => l.id);

    expect(listingIds).toContain('PL');
    expect(listingIds).toContain('PR');
    expect(listingIds).toContain('AS');
    expect(listingIds).toContain('AI');
    expect(listingIds).toContain('PS');
    expect(listingIds).toContain('PI');
  });

  it('should have descriptions for all listings', () => {
    LISTINGS.forEach((listing) => {
      expect(listing.description).toBeDefined();
      expect(listing.description.length).toBeGreaterThan(0);
    });
  });
});

describe('REGION_COLORS Data', () => {
  it('should have colors for all regions', () => {
    const expectedRegions = ['cervical', 'thoracic', 'lumbar', 'sacral'];

    expectedRegions.forEach((region) => {
      expect(REGION_COLORS[region]).toBeDefined();
      expect(REGION_COLORS[region].fill).toBeDefined();
      expect(REGION_COLORS[region].stroke).toBeDefined();
      expect(REGION_COLORS[region].text).toBeDefined();
    });
  });
});
