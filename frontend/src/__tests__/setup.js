import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock environment variables
process.env.VITE_API_URL = 'http://localhost:3000/api/v1';

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return [];
  }
  unobserve() {}
};

export function createMockExercise(overrides = {}) {
  return {
    id: 'ex-1',
    name: 'Neck Stretch',
    name_no: 'Nakketoyning',
    category: 'stretching',
    bodyRegion: 'cervical',
    difficultyLevel: 'beginner',
    sets: 3,
    reps: 10,
    holdSeconds: 30,
    videoUrl: 'https://example.com/video.mp4',
    imageUrl: 'https://example.com/image.jpg',
    thumbnailUrl: 'https://example.com/thumb.jpg',
    instructions: 'Stretch neck gently to each side',
    instructions_no: 'Toy nakken forsiktig til hver side',
    precautions: ['Stopp ved smerte', 'Ikke overanstreng'],
    completedToday: false,
    ...overrides,
  };
}

export function createMockPatient(overrides = {}) {
  return {
    id: 'patient-1',
    firstName: 'Ola',
    lastName: 'Nordmann',
    first_name: 'Ola',
    last_name: 'Nordmann',
    email: 'ola@example.com',
    phone: '+4712345678',
    date_of_birth: '1990-01-15',
    personnummer: '15019012345',
    status: 'ACTIVE',
    ...overrides,
  };
}

export function createMockSOAPData(overrides = {}) {
  return {
    subjective: {
      chiefComplaint: 'Korsryggsmerter',
      history: 'Gradvis debut over 2 uker',
      painLocation: 'Korsrygg',
      painIntensity: 6,
      aggravating: 'Sitting, bøying',
      relieving: 'Gange, strekking',
      functionalLimitations: 'Vanskelig å sitte lenge',
      ...(overrides.subjective || {}),
    },
    objective: {
      observation: 'Antalgisk holdning',
      palpation: 'Ømhet L4-L5',
      rom: 'Redusert fleksjon',
      neuroTests: 'Negativ SLR bilat',
      orthoTests: 'Positiv facettbelastning L4-L5',
      vitalSigns: {},
      ...(overrides.objective || {}),
    },
    assessment: {
      diagnosis: 'L03 Korsryggsmerter',
      differentialDiagnoses: 'L84 Ryggsyndrom',
      clinicalImpression: 'Mekanisk korsryggsmerte',
      redFlags: [],
      prognosis: 'God prognose med behandling',
      ...(overrides.assessment || {}),
    },
    plan: {
      treatment: 'HVLA manipulasjon L4-L5',
      exercises: 'McGill Big 3',
      patientEducation: 'Ergonomisk veiledning',
      followUp: 'Kontroll om 1 uke',
      referrals: '',
      goals: 'Smertefri sitting innen 4 uker',
      ...(overrides.plan || {}),
    },
    ...overrides,
  };
}

export function createMockPrescription(overrides = {}) {
  return {
    id: 'rx-1',
    patientId: 'patient-1',
    status: 'active',
    startDate: '2024-01-15',
    exercises: [],
    notes: '',
    ...overrides,
  };
}
