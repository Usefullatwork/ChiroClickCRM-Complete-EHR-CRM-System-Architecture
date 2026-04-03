/**
 * ClusterTestPanel Component Tests
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ClusterTestPanel from '../../../components/examination/ClusterTestPanel';

vi.mock('../../../data/examinationProtocols', () => ({
  CLUSTER_TESTS: {
    cerebellar: {
      id: 'cerebellar',
      name: 'Cerebellar kluster',
      nameEn: 'Cerebellar Cluster',
      threshold: 2,
      total: 3,
      critical: false,
      tests: [
        { id: 'test1', name: 'Finger-to-Nose', criteria: 'Dysmetria' },
        { id: 'test2', name: 'Heel-to-Shin', criteria: 'Ataxia' },
        { id: 'test3', name: 'Romberg', criteria: 'Balance' },
      ],
    },
  },
  SEVERITY: { CRITICAL: 'critical', HIGH: 'high' },
}));

describe('ClusterTestPanel', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the Norwegian title', () => {
    render(<ClusterTestPanel values={{}} onChange={mockOnChange} lang="no" />);
    expect(screen.getByText('Diagnostiske kluster-tester')).toBeInTheDocument();
  });

  it('should render the English title', () => {
    render(<ClusterTestPanel values={{}} onChange={mockOnChange} lang="en" />);
    expect(screen.getByText('Diagnostic Cluster Tests')).toBeInTheDocument();
  });

  it('should render reset and generate report buttons', () => {
    render(<ClusterTestPanel values={{}} onChange={mockOnChange} lang="en" />);
    expect(screen.getByText('Reset')).toBeInTheDocument();
    expect(screen.getByText('Generate Report')).toBeInTheDocument();
  });

  it('should call onGenerateReport when button is clicked', () => {
    const mockReport = vi.fn();
    render(
      <ClusterTestPanel
        values={{}}
        onChange={mockOnChange}
        lang="en"
        onGenerateReport={mockReport}
      />
    );
    fireEvent.click(screen.getByText('Generate Report'));
    expect(mockReport).toHaveBeenCalled();
  });

  it('should reset values when reset button is clicked', () => {
    render(
      <ClusterTestPanel
        values={{ cerebellar: { test1: true } }}
        onChange={mockOnChange}
        lang="en"
      />
    );
    fireEvent.click(screen.getByText('Reset'));
    expect(mockOnChange).toHaveBeenCalledWith({});
  });
});
