/**
 * OutcomeQuestionnaire Component Tests
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

vi.mock('../../../components/outcomes/questionnaires', () => ({
  QUESTIONNAIRES: {
    NRS: {
      type: 'numeric',
      name: { en: 'Numeric Pain Rating', no: 'Numerisk Smerteskala' },
      description: { en: 'Rate your pain from 0 to 10', no: 'Vurder smerten din fra 0 til 10' },
      instructions: { en: 'Select a number', no: 'Velg et tall' },
      min: 0,
      max: 10,
      labels: {
        0: { en: 'No pain', no: 'Ingen smerte' },
        10: { en: 'Worst pain', no: 'Verst tenkelige smerte' },
      },
      scoring: {
        mcid: 2,
        interpretation: [
          { min: 0, max: 0, label: { en: 'No pain', no: 'Ingen smerte' }, color: 'green' },
          { min: 1, max: 3, label: { en: 'Mild', no: 'Mild' }, color: 'yellow' },
          { min: 4, max: 6, label: { en: 'Moderate', no: 'Moderat' }, color: 'orange' },
          { min: 7, max: 10, label: { en: 'Severe', no: 'Alvorlig' }, color: 'red' },
        ],
      },
      sections: [],
    },
  },
  calculateScore: (id, answers) => ({
    rawScore: answers.value || 0,
    percentage: (answers.value || 0) * 10,
    interpretation: { label: { en: 'Mild', no: 'Mild' }, color: 'yellow' },
  }),
  calculateFABQScore: vi.fn(),
  calculateChange: vi.fn(),
}));

import OutcomeQuestionnaire from '../../../components/outcomes/OutcomeQuestionnaire';

describe('OutcomeQuestionnaire', () => {
  const defaultProps = {
    questionnaireId: 'NRS',
    patientId: '123',
    onComplete: vi.fn(),
    onCancel: vi.fn(),
    lang: 'en',
  };

  it('renders questionnaire name', () => {
    render(<OutcomeQuestionnaire {...defaultProps} />);
    expect(screen.getByText('Numeric Pain Rating')).toBeInTheDocument();
  });

  it('renders questionnaire description', () => {
    render(<OutcomeQuestionnaire {...defaultProps} />);
    expect(screen.getByText('Rate your pain from 0 to 10')).toBeInTheDocument();
  });

  it('renders instructions', () => {
    render(<OutcomeQuestionnaire {...defaultProps} />);
    expect(screen.getByText('Select a number')).toBeInTheDocument();
  });

  it('renders progress bar', () => {
    render(<OutcomeQuestionnaire {...defaultProps} />);
    expect(screen.getByText(/Question 1 of 1/)).toBeInTheDocument();
  });

  it('renders Norwegian title', () => {
    render(<OutcomeQuestionnaire {...defaultProps} lang="no" />);
    expect(screen.getByText('Numerisk Smerteskala')).toBeInTheDocument();
  });

  it('renders cancel button', () => {
    render(<OutcomeQuestionnaire {...defaultProps} />);
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('renders submit button', () => {
    render(<OutcomeQuestionnaire {...defaultProps} />);
    expect(screen.getByText('Submit')).toBeInTheDocument();
  });

  it('renders NRS number buttons (0-10)', () => {
    render(<OutcomeQuestionnaire {...defaultProps} />);
    for (let i = 0; i <= 10; i++) {
      expect(screen.getByText(String(i))).toBeInTheDocument();
    }
  });

  it('calls onCancel when cancel is clicked', () => {
    render(<OutcomeQuestionnaire {...defaultProps} />);
    fireEvent.click(screen.getByText('Cancel'));
    expect(defaultProps.onCancel).toHaveBeenCalled();
  });

  it('renders not found message for unknown questionnaire', () => {
    render(<OutcomeQuestionnaire {...defaultProps} questionnaireId="UNKNOWN" />);
    expect(screen.getByText('Questionnaire not found')).toBeInTheDocument();
  });
});
