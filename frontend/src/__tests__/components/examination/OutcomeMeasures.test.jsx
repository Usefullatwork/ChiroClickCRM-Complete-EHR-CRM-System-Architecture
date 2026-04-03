/**
 * OutcomeMeasures Component Tests
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import OutcomeMeasures, {
  OutcomeMeasureSelector,
} from '../../../components/examination/OutcomeMeasures';

describe('OutcomeMeasures', () => {
  it('should render the main heading', () => {
    render(<OutcomeMeasures />);
    expect(screen.getByText('Utfallsmal')).toBeInTheDocument();
  });

  it('should render placeholder text', () => {
    render(<OutcomeMeasures />);
    expect(
      screen.getByText('NDI, ODI, FABQ og andre utfallsmal - kommer snart.')
    ).toBeInTheDocument();
  });
});

describe('OutcomeMeasureSelector', () => {
  it('should render the selector heading', () => {
    render(<OutcomeMeasureSelector />);
    expect(screen.getByText('Velg utfallsmal')).toBeInTheDocument();
  });

  it('should render placeholder text', () => {
    render(<OutcomeMeasureSelector />);
    expect(screen.getByText('Utfallsmal-velger kommer snart.')).toBeInTheDocument();
  });
});
