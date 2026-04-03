/**
 * ExaminationSection Component Tests
 * Tests rendering of vital signs, neurological exam fields, and objective section structure.
 */
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../i18n', () => ({
  useTranslation: () => ({ t: (key, fb) => fb || key, lang: 'no', setLang: vi.fn() }),
}));
vi.mock('../../../i18n/useTranslation', () => ({
  useTranslation: () => ({ t: (key, fb) => fb || key, lang: 'no', setLang: vi.fn() }),
}));
vi.mock('lucide-react', () => ({
  Stethoscope: () => null,
}));

import ExaminationSection from '../../../components/notes/ExaminationSection';

const MockSection = ({ title, children }) => (
  <div data-testid={`section-${title}`}>
    <h3>{title}</h3>
    {children}
  </div>
);

const MockTextField = ({ label, placeholder }) => (
  <div data-testid={`text-${label}`}>
    <label>{label}</label>
    <span>{placeholder}</span>
  </div>
);

const MockInputField = ({ label, placeholder }) => (
  <div data-testid={`input-${label}`}>
    <label>{label}</label>
    <span>{placeholder}</span>
  </div>
);

function buildProps(overrides = {}) {
  return {
    consultData: {
      objective: {
        vitalSigns: {
          bloodPressure: '120/80',
          pulse: '72',
          respiratoryRate: '16',
          temperature: '36.8',
          height: '175',
          weight: '70',
        },
        generalAppearance: '',
        gait: '',
        posture: '',
        inspection: '',
        palpation: '',
        rangeOfMotion: '',
        neurologicalExam: {
          motorTesting: '',
          sensoryTesting: '',
          reflexes: '',
          cranialNerves: '',
        },
        orthopedicTests: '',
        specialTests: '',
        imaging: '',
      },
    },
    updateField: vi.fn(),
    updateNestedField: vi.fn(),
    readOnly: false,
    Section: MockSection,
    TextField: MockTextField,
    InputField: MockInputField,
    ...overrides,
  };
}

describe('ExaminationSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the section with objective title', () => {
    render(<ExaminationSection {...buildProps()} />);
    expect(screen.getByText('Objektiv - Klinisk undersokelse')).toBeTruthy();
  });

  it('renders vital signs section', () => {
    render(<ExaminationSection {...buildProps()} />);
    expect(screen.getByText('Vitale tegn')).toBeTruthy();
  });

  it('renders all vital sign input fields', () => {
    render(<ExaminationSection {...buildProps()} />);
    expect(screen.getByTestId('input-Blodtrykk')).toBeTruthy();
    expect(screen.getByTestId('input-Puls')).toBeTruthy();
    expect(screen.getByTestId('input-Resp.')).toBeTruthy();
    expect(screen.getByTestId('input-Temp')).toBeTruthy();
    expect(screen.getByTestId('input-Hoyde (cm)')).toBeTruthy();
    expect(screen.getByTestId('input-Vekt (kg)')).toBeTruthy();
  });

  it('renders text fields for examination areas', () => {
    render(<ExaminationSection {...buildProps()} />);
    expect(screen.getByTestId('text-Generelt inntrykk')).toBeTruthy();
    expect(screen.getByTestId('text-Gange')).toBeTruthy();
    expect(screen.getByTestId('text-Holdning')).toBeTruthy();
    expect(screen.getByTestId('text-Inspeksjon')).toBeTruthy();
    expect(screen.getByTestId('text-Palpasjon')).toBeTruthy();
    expect(screen.getByTestId('text-Bevegelsesutslag (ROM)')).toBeTruthy();
  });

  it('renders neurological exam section', () => {
    render(<ExaminationSection {...buildProps()} />);
    expect(screen.getByText('Nevrologisk undersokelse')).toBeTruthy();
    expect(screen.getByTestId('text-Motorisk testing')).toBeTruthy();
    expect(screen.getByTestId('text-Sensorisk testing')).toBeTruthy();
    expect(screen.getByTestId('text-Reflekser')).toBeTruthy();
    expect(screen.getByTestId('text-Hjernenerver')).toBeTruthy();
  });

  it('renders orthopedic and special tests fields', () => {
    render(<ExaminationSection {...buildProps()} />);
    expect(screen.getByTestId('text-Ortopediske tester')).toBeTruthy();
    expect(screen.getByTestId('text-Spesialtester')).toBeTruthy();
  });

  it('renders imaging field', () => {
    render(<ExaminationSection {...buildProps()} />);
    expect(screen.getByTestId('text-Bildediagnostikk')).toBeTruthy();
  });
});
