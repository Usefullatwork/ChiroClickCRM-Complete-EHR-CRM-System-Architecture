/**
 * AuditLogs Page Tests
 *
 * Tests rendering, filter controls, log table display,
 * pagination, detail modal, export, and empty/loading states.
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';

// --------------- Mocks (before component import) ---------------

const mockQueryFn = vi.fn();

vi.mock('@tanstack/react-query', () => ({
  useQuery: ({ queryKey, queryFn }) => {
    // Store queryFn so tests can inspect it if needed
    mockQueryFn.mockImplementation(queryFn);
    return mockUseQueryReturn;
  },
  useQueryClient: () => ({
    invalidateQueries: vi.fn(),
  }),
}));

vi.mock('../../i18n', () => ({
  useTranslation: () => ({
    t: (key, fallback) => fallback || key,
    lang: 'no',
  }),
}));

vi.mock('../../services/api', () => ({
  auditLogsAPI: {
    getAll: vi.fn().mockResolvedValue({ data: { logs: [], totalPages: 1, total: 0 } }),
    getById: vi.fn(),
  },
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));

vi.mock('date-fns', () => ({
  format: (date, pattern) => {
    if (pattern === 'MMM d, yyyy') return 'Mar 15, 2026';
    if (pattern === 'HH:mm:ss') return '10:00:00';
    if (pattern === 'PPpp') return 'Mar 15, 2026, 10:00:00 AM';
    return '2026-03-15';
  },
}));

vi.mock('lucide-react', () => ({
  Shield: (props) => (
    <span data-testid="icon-shield" {...props}>
      Shield
    </span>
  ),
  Search: (props) => (
    <span data-testid="icon-search" {...props}>
      Search
    </span>
  ),
  Download: (props) => (
    <span data-testid="icon-download" {...props}>
      Download
    </span>
  ),
  Eye: (props) => (
    <span data-testid="icon-eye" {...props}>
      Eye
    </span>
  ),
  Edit: (props) => (
    <span data-testid="icon-edit" {...props}>
      Edit
    </span>
  ),
  Trash2: (props) => (
    <span data-testid="icon-trash" {...props}>
      Trash2
    </span>
  ),
  FileText: (props) => (
    <span data-testid="icon-file" {...props}>
      FileText
    </span>
  ),
  User: (props) => (
    <span data-testid="icon-user" {...props}>
      User
    </span>
  ),
  AlertCircle: (props) => (
    <span data-testid="icon-alert" {...props}>
      AlertCircle
    </span>
  ),
  XCircle: (props) => (
    <span data-testid="icon-x-circle" {...props}>
      XCircle
    </span>
  ),
  Database: (props) => (
    <span data-testid="icon-database" {...props}>
      Database
    </span>
  ),
}));

// --------------- Imports (after mocks) ---------------

import AuditLogs from '../../pages/AuditLogs';

// --------------- Test data ---------------

const mockLogs = [
  {
    id: 1,
    created_at: '2026-03-15T10:00:00Z',
    user_name: 'Dr. Hansen',
    user_role: 'PRACTITIONER',
    user_email: 'hansen@clinic.no',
    action: 'READ',
    resource_type: 'PATIENT',
    resource_id: 'p-123',
    resource_name: 'Ola Nordmann',
    ip_address: '192.168.1.10',
    user_agent: 'Mozilla/5.0',
    reason: null,
    changes: null,
  },
  {
    id: 2,
    created_at: '2026-03-14T14:30:00Z',
    user_name: 'Admin User',
    user_role: 'ADMIN',
    user_email: 'admin@clinic.no',
    action: 'UPDATE',
    resource_type: 'APPOINTMENT',
    resource_id: 'apt-456',
    resource_name: 'Appointment 456',
    ip_address: '10.0.0.1',
    user_agent: 'Chrome/120',
    reason: 'Patient rescheduled',
    changes: { old: { time: '09:00' }, new: { time: '11:00' } },
  },
  {
    id: 3,
    created_at: '2026-03-13T09:00:00Z',
    user_name: 'System',
    user_role: 'ADMIN',
    user_email: 'system@clinic.no',
    action: 'DELETE',
    resource_type: 'DOCUMENT',
    resource_id: 'doc-789',
    resource_name: 'Old document',
    ip_address: '127.0.0.1',
    user_agent: 'System',
    reason: null,
    changes: null,
  },
];

// Mutable return value for useQuery mock
let mockUseQueryReturn = {
  data: { logs: mockLogs, totalPages: 3, total: 150 },
  isLoading: false,
};

// --------------- Helper ---------------

const renderPage = () => render(<AuditLogs />);

// --------------- Tests ---------------

describe('AuditLogs Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseQueryReturn = {
      data: { logs: mockLogs, totalPages: 3, total: 150 },
      isLoading: false,
    };
  });

  // ---- Rendering ----

  it('should render without crashing', () => {
    renderPage();
    expect(screen.getByText('auditLogs')).toBeInTheDocument();
  });

  it('should display the page subtitle', () => {
    renderPage();
    expect(screen.getByText('auditLogsSubtitle')).toBeInTheDocument();
  });

  it('should display the GDPR compliance notice', () => {
    renderPage();
    expect(screen.getByText('gdprCompliance')).toBeInTheDocument();
    expect(screen.getByText('gdprComplianceDesc')).toBeInTheDocument();
  });

  // ---- Filter controls ----

  it('should render all filter controls', () => {
    renderPage();
    expect(screen.getByText('startDate')).toBeInTheDocument();
    expect(screen.getByText('endDate')).toBeInTheDocument();
    // "action" appears as both filter label and table header — use getAllByText
    const actionElements = screen.getAllByText('action');
    expect(actionElements.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('resourceType')).toBeInTheDocument();
    expect(screen.getByText('userRole')).toBeInTheDocument();
    // "search" also appears as filter label
    const searchLabels = screen.getAllByText('search');
    expect(searchLabels.length).toBeGreaterThanOrEqual(1);
  });

  it('should render action filter with all options', () => {
    renderPage();
    expect(screen.getByText('allActions')).toBeInTheDocument();
    expect(screen.getByText('create')).toBeInTheDocument();
    expect(screen.getByText('update')).toBeInTheDocument();
    expect(screen.getByText('delete')).toBeInTheDocument();
  });

  it('should render resource type filter options', () => {
    renderPage();
    expect(screen.getByText('allResources')).toBeInTheDocument();
    expect(screen.getByText('clinicalEncounter')).toBeInTheDocument();
    expect(screen.getByText('appointment')).toBeInTheDocument();
  });

  it('should render user role filter options', () => {
    renderPage();
    expect(screen.getByText('allRoles')).toBeInTheDocument();
    expect(screen.getByText('admin')).toBeInTheDocument();
    expect(screen.getByText('practitioner')).toBeInTheDocument();
    expect(screen.getByText('assistant')).toBeInTheDocument();
  });

  it('should render search input with placeholder', () => {
    renderPage();
    expect(screen.getByPlaceholderText('searchLogs')).toBeInTheDocument();
  });

  // ---- Table display ----

  it('should render table header columns', () => {
    renderPage();
    expect(screen.getByText('timestamp')).toBeInTheDocument();
    expect(screen.getByText('user')).toBeInTheDocument();
    expect(screen.getByText('resource')).toBeInTheDocument();
    expect(screen.getByText('ipAddress')).toBeInTheDocument();
    expect(screen.getByText('details')).toBeInTheDocument();
  });

  it('should display log entries with user names', () => {
    renderPage();
    expect(screen.getByText('Dr. Hansen')).toBeInTheDocument();
    expect(screen.getByText('Admin User')).toBeInTheDocument();
  });

  it('should display action badges for each log', () => {
    renderPage();
    expect(screen.getByText('READ')).toBeInTheDocument();
    expect(screen.getByText('UPDATE')).toBeInTheDocument();
    expect(screen.getByText('DELETE')).toBeInTheDocument();
  });

  it('should display resource types in log rows', () => {
    renderPage();
    expect(screen.getByText('PATIENT')).toBeInTheDocument();
    expect(screen.getByText('APPOINTMENT')).toBeInTheDocument();
    expect(screen.getByText('DOCUMENT')).toBeInTheDocument();
  });

  it('should display IP addresses in log rows', () => {
    renderPage();
    expect(screen.getByText('192.168.1.10')).toBeInTheDocument();
    expect(screen.getByText('10.0.0.1')).toBeInTheDocument();
  });

  it('should show view details button for each log row', () => {
    renderPage();
    const detailButtons = screen.getAllByText('viewDetails');
    expect(detailButtons).toHaveLength(3);
  });

  // ---- Pagination ----

  it('should display pagination when totalPages > 1', () => {
    renderPage();
    expect(screen.getByText('previous')).toBeInTheDocument();
    expect(screen.getByText('next')).toBeInTheDocument();
  });

  it('should display page info with total count', () => {
    renderPage();
    // "page 1 / 3 (150 total)"
    expect(screen.getByText(/1 \/ 3/)).toBeInTheDocument();
    expect(screen.getByText(/150/)).toBeInTheDocument();
  });

  it('should disable previous button on first page', () => {
    renderPage();
    const prevBtn = screen.getByText('previous');
    expect(prevBtn).toBeDisabled();
  });

  it('should not disable next button when more pages exist', () => {
    renderPage();
    const nextBtn = screen.getByText('next');
    expect(nextBtn).not.toBeDisabled();
  });

  it('should hide pagination when totalPages is 1', () => {
    mockUseQueryReturn = {
      data: { logs: mockLogs, totalPages: 1, total: 3 },
      isLoading: false,
    };
    renderPage();
    expect(screen.queryByText('previous')).not.toBeInTheDocument();
    expect(screen.queryByText('next')).not.toBeInTheDocument();
  });

  // ---- Detail modal ----

  it('should open detail modal when view details is clicked', () => {
    renderPage();
    const detailButtons = screen.getAllByText('viewDetails');
    fireEvent.click(detailButtons[0]);
    expect(screen.getByText('auditLogDetails')).toBeInTheDocument();
  });

  it('should display log details in the modal', () => {
    renderPage();
    const detailButtons = screen.getAllByText('viewDetails');
    fireEvent.click(detailButtons[0]);
    // "Dr. Hansen" appears in table row AND modal — use getAllByText
    const nameElements = screen.getAllByText('Dr. Hansen');
    expect(nameElements.length).toBeGreaterThanOrEqual(2);
    // User agent only appears in modal
    expect(screen.getByText('Mozilla/5.0')).toBeInTheDocument();
    // Email only appears in modal
    expect(screen.getByText('hansen@clinic.no')).toBeInTheDocument();
  });

  it('should display reason field in modal when present', () => {
    renderPage();
    // Click second log which has a reason
    const detailButtons = screen.getAllByText('viewDetails');
    fireEvent.click(detailButtons[1]);
    expect(screen.getByText('Patient rescheduled')).toBeInTheDocument();
  });

  it('should display changes JSON in modal when present', () => {
    renderPage();
    const detailButtons = screen.getAllByText('viewDetails');
    fireEvent.click(detailButtons[1]);
    // Changes are rendered as JSON.stringify
    expect(screen.getByText(/09:00/)).toBeInTheDocument();
    expect(screen.getByText(/11:00/)).toBeInTheDocument();
  });

  it('should close modal when close button is clicked', () => {
    renderPage();
    const detailButtons = screen.getAllByText('viewDetails');
    fireEvent.click(detailButtons[0]);
    expect(screen.getByText('auditLogDetails')).toBeInTheDocument();

    const closeBtn = screen.getByText('close');
    fireEvent.click(closeBtn);
    expect(screen.queryByText('auditLogDetails')).not.toBeInTheDocument();
  });

  // ---- Export ----

  it('should render export button', () => {
    renderPage();
    expect(screen.getByText('exportLogs')).toBeInTheDocument();
  });

  // ---- Loading state ----

  it('should show loading state when data is loading', () => {
    mockUseQueryReturn = {
      data: null,
      isLoading: true,
    };
    renderPage();
    expect(screen.getByText('loadingAuditLogs')).toBeInTheDocument();
  });

  // ---- Empty state ----

  it('should show empty state when no logs exist', () => {
    mockUseQueryReturn = {
      data: { logs: [], totalPages: 1, total: 0 },
      isLoading: false,
    };
    renderPage();
    expect(screen.getByText('noAuditLogs')).toBeInTheDocument();
  });

  // ---- Filter interaction ----

  it('should render search input that accepts text', () => {
    renderPage();
    const searchInput = screen.getByPlaceholderText('searchLogs');
    fireEvent.change(searchInput, { target: { value: 'patient' } });
    expect(searchInput.value).toBe('patient');
  });
});
