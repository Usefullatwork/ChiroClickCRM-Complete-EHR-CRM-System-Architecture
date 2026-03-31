/**
 * BodyChart Tests
 *
 * Tests the interactive body chart with drawing tools, markers,
 * annotations, view switching, and sub-components (compact, gallery).
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock i18n
vi.mock('../../../i18n', () => ({
  useTranslation: () => ({ t: (key, fallback) => fallback || key, lang: 'no' }),
}));

import BodyChart, {
  BodyChartCompact,
  BodyChartGallery,
  BODY_VIEWS,
  CHART_COLORS,
} from '../../../components/assessment/BodyChart';

describe('BodyChart', () => {
  const onSave = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render with header and default front view', () => {
    render(<BodyChart onSave={onSave} />);

    expect(screen.getByText('Body Chart')).toBeDefined();
    // Front view button should exist
    expect(screen.getByText(/Front/)).toBeDefined();
  });

  it('should render all body view selector buttons', () => {
    render(<BodyChart onSave={onSave} />);

    for (const view of Object.values(BODY_VIEWS)) {
      expect(screen.getByText(new RegExp(view.name))).toBeDefined();
    }
  });

  it('should render toolbar with tools by default', () => {
    render(<BodyChart onSave={onSave} />);

    expect(screen.getByText('Tools:')).toBeDefined();
    expect(screen.getByText('Color:')).toBeDefined();
    // "Size:" appears in both header and toolbar
    expect(screen.getAllByText('Size:').length).toBeGreaterThanOrEqual(1);
  });

  it('should hide toolbar when showToolbar is false', () => {
    render(<BodyChart onSave={onSave} showToolbar={false} />);

    expect(screen.queryByText('Tools:')).toBeNull();
    expect(screen.queryByText('Color:')).toBeNull();
  });

  it('should render SVG element with body outline', () => {
    const { container } = render(<BodyChart onSave={onSave} />);

    const svg = container.querySelector('svg');
    expect(svg).toBeDefined();
    expect(svg.getAttribute('viewBox')).toBe('0 0 200 400'); // front view
  });

  it('should switch views when a view button is clicked', () => {
    const { container } = render(<BodyChart onSave={onSave} />);

    // Click on Head/Neck view
    const headButton = screen.getByText(/Head\/Neck/);
    fireEvent.click(headButton);

    const svg = container.querySelector('svg');
    expect(svg.getAttribute('viewBox')).toBe('0 0 200 250'); // head view
  });

  it('should render Clear View and Clear All buttons', () => {
    render(<BodyChart onSave={onSave} />);

    expect(screen.getByText('Clear View')).toBeDefined();
    expect(screen.getByText('Clear All')).toBeDefined();
  });

  it('should render Save Chart button when onSave is provided', () => {
    render(<BodyChart onSave={onSave} />);

    expect(screen.getByText('Save Chart')).toBeDefined();
  });

  it('should not render Save Chart button when onSave is not provided', () => {
    render(<BodyChart />);

    expect(screen.queryByText('Save Chart')).toBeNull();
  });

  it('should call onSave with annotations and markers when Save is clicked', () => {
    render(<BodyChart onSave={onSave} />);

    fireEvent.click(screen.getByText('Save Chart'));

    expect(onSave).toHaveBeenCalledWith({
      annotations: [],
      markers: [],
    });
  });

  it('should render initial markers and show legend', () => {
    const initialMarkers = [{ id: 1, view: 'front', x: 100, y: 100, color: '#FF0000', label: 1 }];

    render(<BodyChart onSave={onSave} initialMarkers={initialMarkers} />);

    expect(screen.getByText('Markørforklaring')).toBeDefined();
    expect(screen.getByPlaceholderText('Description for marker 1...')).toBeDefined();
  });

  it('should adjust image size via the range slider', () => {
    render(<BodyChart onSave={onSave} />);

    const slider = screen.getByRole('slider');
    expect(slider).toBeDefined();

    fireEvent.change(slider, { target: { value: '120' } });
    expect(screen.getByText('120%')).toBeDefined();
  });

  it('should render tool buttons (pointer, pencil, marker, eraser, text)', () => {
    render(<BodyChart onSave={onSave} />);

    // Each tool button has a title attribute
    expect(screen.getByTitle('Pointer')).toBeDefined();
    expect(screen.getByTitle('Pencil')).toBeDefined();
    expect(screen.getByTitle('Marker')).toBeDefined();
    expect(screen.getByTitle('Eraser')).toBeDefined();
    expect(screen.getByTitle('Text')).toBeDefined();
  });
});

describe('BodyChartCompact', () => {
  it('should render the compact chart with view name', () => {
    render(<BodyChartCompact view="front" />);

    expect(screen.getByText('Front View')).toBeDefined();
  });

  it('should render markers on the compact chart', () => {
    const markers = [{ id: 1, view: 'front', x: 100, y: 100, color: '#FF0000', label: 1 }];

    const { container } = render(<BodyChartCompact view="front" markers={markers} />);

    const circles = container.querySelectorAll('circle');
    expect(circles.length).toBe(1);
  });

  it('should call onClick when compact chart is clicked', () => {
    const onClick = vi.fn();
    render(<BodyChartCompact view="back" onClick={onClick} />);

    fireEvent.click(screen.getByText('Back View'));
    expect(onClick).toHaveBeenCalled();
  });
});

describe('BodyChartGallery', () => {
  it('should render all 7 body views', () => {
    render(<BodyChartGallery />);

    for (const view of Object.values(BODY_VIEWS)) {
      expect(screen.getByText(new RegExp(view.name))).toBeDefined();
    }
  });

  it('should call onViewSelect when a view is clicked', () => {
    const onViewSelect = vi.fn();
    render(<BodyChartGallery onViewSelect={onViewSelect} />);

    fireEvent.click(screen.getByText(/Back/));
    expect(onViewSelect).toHaveBeenCalledWith('back');
  });

  it('should highlight views that have content', () => {
    const markers = [{ id: 1, view: 'front', x: 100, y: 100, color: '#FF0000', label: 1 }];

    render(<BodyChartGallery markers={markers} />);

    // The front view should show a count indicator
    expect(screen.getByText('(1)')).toBeDefined();
  });
});

describe('Exported constants', () => {
  it('should export BODY_VIEWS with 7 views', () => {
    expect(Object.keys(BODY_VIEWS)).toEqual([
      'front',
      'back',
      'leftSide',
      'rightSide',
      'head',
      'hands',
      'feet',
    ]);
  });

  it('should export CHART_COLORS with 10 colors', () => {
    expect(CHART_COLORS).toHaveLength(10);
    expect(CHART_COLORS[0]).toBe('#FF0000');
  });

  it('each body view should have name, icon, viewBox, and outline', () => {
    for (const view of Object.values(BODY_VIEWS)) {
      expect(view.name).toBeDefined();
      expect(view.icon).toBeDefined();
      expect(view.viewBox).toBeDefined();
      expect(view.outline).toBeDefined();
    }
  });
});
