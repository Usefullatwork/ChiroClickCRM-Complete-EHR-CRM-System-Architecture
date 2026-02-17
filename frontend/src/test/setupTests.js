/**
 * Frontend Test Setup
 * Global mocks and configuration for React component tests
 */

// Mock API client
jest.mock('../services/api', () => ({
  patientsAPI: {
    list: jest.fn().mockResolvedValue({ data: { patients: [], total: 0 } }),
    get: jest.fn().mockResolvedValue({ data: {} }),
    create: jest.fn().mockResolvedValue({ data: {} }),
    update: jest.fn().mockResolvedValue({ data: {} }),
    search: jest.fn().mockResolvedValue({ data: { patients: [] } }),
  },
  encountersAPI: {
    list: jest.fn().mockResolvedValue({ data: { encounters: [], total: 0 } }),
    get: jest.fn().mockResolvedValue({ data: {} }),
    create: jest.fn().mockResolvedValue({ data: {} }),
    update: jest.fn().mockResolvedValue({ data: {} }),
    sign: jest.fn().mockResolvedValue({ data: {} }),
  },
  appointmentsAPI: {
    list: jest.fn().mockResolvedValue({ data: { appointments: [] } }),
    get: jest.fn().mockResolvedValue({ data: {} }),
    create: jest.fn().mockResolvedValue({ data: {} }),
    update: jest.fn().mockResolvedValue({ data: {} }),
    delete: jest.fn().mockResolvedValue({ data: {} }),
  },
  billingAPI: {
    listClaims: jest.fn().mockResolvedValue({ data: { claims: [] } }),
    createClaim: jest.fn().mockResolvedValue({ data: {} }),
    getCPTCodes: jest.fn().mockResolvedValue({ data: {} }),
    getModifiers: jest.fn().mockResolvedValue({ data: {} }),
    suggestCMT: jest.fn().mockResolvedValue({ data: {} }),
  },
  exercisesAPI: {
    list: jest.fn().mockResolvedValue({ data: { exercises: [] } }),
    get: jest.fn().mockResolvedValue({ data: {} }),
    create: jest.fn().mockResolvedValue({ data: {} }),
    getCategories: jest.fn().mockResolvedValue({ data: [] }),
    getBodyRegions: jest.fn().mockResolvedValue({ data: [] }),
    getFavorites: jest.fn().mockResolvedValue({ data: [] }),
  },
  crmAPI: {
    getOverview: jest.fn().mockResolvedValue({ data: {} }),
    getLeads: jest.fn().mockResolvedValue({ data: { leads: [] } }),
    getLifecycle: jest.fn().mockResolvedValue({ data: {} }),
    getRetention: jest.fn().mockResolvedValue({ data: {} }),
  },
  authAPI: {
    login: jest.fn().mockResolvedValue({ data: { user: { id: 'test', role: 'ADMIN' } } }),
    logout: jest.fn().mockResolvedValue({ data: {} }),
    me: jest.fn().mockResolvedValue({ data: { user: { id: 'test', role: 'ADMIN' } } }),
  },
  dashboardAPI: {
    getOverview: jest.fn().mockResolvedValue({ data: {} }),
  },
  kpiAPI: {
    getMetrics: jest.fn().mockResolvedValue({ data: {} }),
    getTimeSeries: jest.fn().mockResolvedValue({ data: [] }),
  },
  organizationAPI: {
    get: jest.fn().mockResolvedValue({ data: {} }),
    update: jest.fn().mockResolvedValue({ data: {} }),
  },
  trainingAPI: {
    getStatus: jest.fn().mockResolvedValue({ data: {} }),
    getData: jest.fn().mockResolvedValue({ data: { examples: [] } }),
  },
  macrosAPI: {
    list: jest.fn().mockResolvedValue({ data: { macros: [] } }),
    get: jest.fn().mockResolvedValue({ data: {} }),
    create: jest.fn().mockResolvedValue({ data: {} }),
  },
  aiAPI: {
    query: jest.fn().mockResolvedValue({ data: {} }),
  },
  gdprAPI: {
    exportData: jest.fn().mockResolvedValue({ data: {} }),
    deleteData: jest.fn().mockResolvedValue({ data: {} }),
  },
  treatmentPlansAPI: {
    list: jest.fn().mockResolvedValue({ data: { plans: [] } }),
    get: jest.fn().mockResolvedValue({ data: {} }),
    create: jest.fn().mockResolvedValue({ data: {} }),
  },
  outcomesAPI: {
    list: jest.fn().mockResolvedValue({ data: [] }),
    submit: jest.fn().mockResolvedValue({ data: {} }),
  },
  setOrganizationId: jest.fn(),
  getOrganizationId: jest.fn().mockReturnValue('a0000000-0000-0000-0000-000000000001'),
}));

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
  useParams: () => ({}),
  useLocation: () => ({ pathname: '/', search: '', hash: '' }),
  useSearchParams: () => [new URLSearchParams(), jest.fn()],
  Link: ({ children, ...props }) => <a {...props}>{children}</a>,
  NavLink: ({ children, ...props }) => <a {...props}>{children}</a>,
}));

// Mock useAuth hook
jest.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    user: {
      id: 'test-user-id',
      email: 'admin@chiroclickcrm.no',
      first_name: 'Test',
      last_name: 'Admin',
      role: 'ADMIN',
      organization_id: 'a0000000-0000-0000-0000-000000000001',
    },
    isAuthenticated: true,
    isLoaded: true,
    login: jest.fn(),
    logout: jest.fn(),
  }),
}));

// Mock i18n/translations
jest.mock('../i18n', () => ({
  useTranslation: () => ({
    t: (key) => key,
    language: 'nb',
    setLanguage: jest.fn(),
  }),
}));

// Mock socket.io-client
jest.mock('../services/socket', () => ({
  socket: {
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
    connected: false,
    connect: jest.fn(),
    disconnect: jest.fn(),
  },
  connectSocket: jest.fn(),
  disconnectSocket: jest.fn(),
}));

// Mock window.matchMedia (for responsive hooks)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor(callback) {
    this.callback = callback;
  }
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor(callback) {
    this.callback = callback;
  }
  observe() {}
  unobserve() {}
  disconnect() {}
};
