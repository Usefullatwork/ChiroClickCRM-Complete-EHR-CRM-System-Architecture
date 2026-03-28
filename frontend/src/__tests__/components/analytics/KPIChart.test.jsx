/**
 * KPIChart Component Tests
 * Tests line chart, bar chart, empty state, and data normalization
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { KPIChart } from '../../../components/analytics/KPIChart';

describe('KPIChart', () => {
  const sampleData = [
    { label: 'Jan', value: 100 },
    { label: 'Feb', value: 150 },
    { label: 'Mar', value: 120 },
    { label: 'Apr', value: 200 },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render empty state when no data is provided', () => {
    render(<KPIChart data={[]} />);
    expect(screen.getByText('Ingen data tilgjengelig')).toBeInTheDocument();
  });

  it('should render empty state when data is null/undefined', () => {
    render(<KPIChart data={null} />);
    expect(screen.getByText('Ingen data tilgjengelig')).toBeInTheDocument();
  });

  it('should render line chart by default (type="line")', () => {
    const { container } = render(<KPIChart data={sampleData} />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    const polyline = container.querySelector('polyline');
    expect(polyline).toBeInTheDocument();
  });

  it('should render bar chart when type="bar"', () => {
    const { container } = render(<KPIChart data={sampleData} type="bar" />);
    const bars = container.querySelectorAll('.rounded-t-lg');
    expect(bars.length).toBe(sampleData.length);
  });

  it('should display x-axis labels for line chart', () => {
    render(<KPIChart data={sampleData} />);
    expect(screen.getByText('Jan')).toBeInTheDocument();
    expect(screen.getByText('Feb')).toBeInTheDocument();
    expect(screen.getByText('Mar')).toBeInTheDocument();
    expect(screen.getByText('Apr')).toBeInTheDocument();
  });

  it('should display x-axis labels for bar chart', () => {
    render(<KPIChart data={sampleData} type="bar" />);
    expect(screen.getByText('Jan')).toBeInTheDocument();
    expect(screen.getByText('Feb')).toBeInTheDocument();
    expect(screen.getByText('Mar')).toBeInTheDocument();
    expect(screen.getByText('Apr')).toBeInTheDocument();
  });

  it('should display the legend label', () => {
    render(<KPIChart data={sampleData} label="Revenue" />);
    expect(screen.getByText('Revenue')).toBeInTheDocument();
  });

  it('should display max value in legend', () => {
    render(<KPIChart data={sampleData} />);
    expect(screen.getByText('Max: 200')).toBeInTheDocument();
  });

  it('should render data points (circles) for line chart', () => {
    const { container } = render(<KPIChart data={sampleData} />);
    const circles = container.querySelectorAll('circle');
    expect(circles.length).toBe(sampleData.length);
  });

  it('should render SVG title elements with value tooltips for line chart', () => {
    const { container } = render(<KPIChart data={sampleData} />);
    const titles = container.querySelectorAll('title');
    expect(titles[0].textContent).toBe('Jan: 100');
    expect(titles[1].textContent).toBe('Feb: 150');
  });

  it('should apply custom color to line chart', () => {
    const { container } = render(<KPIChart data={sampleData} color="#ff0000" />);
    const polyline = container.querySelector('polyline');
    expect(polyline.getAttribute('stroke')).toBe('#ff0000');
  });

  it('should apply custom color to bar chart bars', () => {
    const { container } = render(<KPIChart data={sampleData} type="bar" color="#ff0000" />);
    const bars = container.querySelectorAll('.rounded-t-lg');
    expect(bars[0].style.backgroundColor).toBe('rgb(255, 0, 0)');
  });

  it('should render polygon area fill under line chart', () => {
    const { container } = render(<KPIChart data={sampleData} />);
    const polygon = container.querySelector('polygon');
    expect(polygon).toBeInTheDocument();
  });

  it('should handle single data point without crashing', () => {
    const singlePoint = [{ label: 'Only', value: 42 }];
    const { container } = render(<KPIChart data={singlePoint} />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('should render grid lines in line chart', () => {
    const { container } = render(<KPIChart data={sampleData} />);
    const lines = container.querySelectorAll('line');
    expect(lines.length).toBe(5);
  });

  it('should use "Value" as default label', () => {
    render(<KPIChart data={sampleData} />);
    expect(screen.getByText('Value')).toBeInTheDocument();
  });
});
