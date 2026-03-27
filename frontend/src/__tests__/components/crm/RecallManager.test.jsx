/**
 * RecallManager Component Tests
 */

import { render, screen, fireEvent, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import RecallManager, {
  RecallCompact,
  RECALL_TYPES,
  MESSAGE_TEMPLATES,
} from '../../../components/crm/RecallManager';

// Create a date well over 6 weeks ago (50 days)
const fiftyDaysAgo = new Date(Date.now() - 50 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
// Create a date within the last week
const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

// Create a birthday within the next 3 days
const upcomingBirthday = (() => {
  const d = new Date();
  d.setDate(d.getDate() + 2);
  d.setFullYear(1990);
  return d.toISOString().split('T')[0];
})();

const mockPatients = [
  {
    id: 'p1',
    first_name: 'Kari',
    last_name: 'Nordmann',
    phone: '+47 99887766',
    email: 'kari@example.com',
    date_of_birth: '1985-06-15',
  },
  {
    id: 'p2',
    first_name: 'Ole',
    last_name: 'Hansen',
    phone: '+47 11223344',
    email: 'ole@example.com',
    date_of_birth: upcomingBirthday,
  },
  {
    id: 'p3',
    first_name: 'Anna',
    last_name: 'Berg',
    phone: '+47 55443322',
    email: 'anna@example.com',
    date_of_birth: '1992-12-01',
  },
];

const mockAppointments = [
  { patient_id: 'p1', date: fiftyDaysAgo },
  { patient_id: 'p2', date: twoDaysAgo },
  { patient_id: 'p3', date: fiftyDaysAgo },
];

const mockClinicInfo = {
  name: 'Ryggklinikken',
  phone: '+47 22334455',
};

describe('RecallManager', () => {
  const defaultProps = {
    patients: mockPatients,
    appointments: mockAppointments,
    clinicInfo: mockClinicInfo,
    language: 'en',
    onSendRecall: vi.fn(),
    onCreateCampaign: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the header with title and subtitle', () => {
    render(<RecallManager {...defaultProps} />);
    expect(screen.getByText('Patient Recall')).toBeInTheDocument();
    expect(screen.getByText('Automated follow-up campaigns')).toBeInTheDocument();
  });

  it('renders the three tabs: Overview, Campaigns, Analytics', () => {
    render(<RecallManager {...defaultProps} />);
    expect(screen.getByText('Overview')).toBeInTheDocument();
    expect(screen.getByText('Campaigns')).toBeInTheDocument();
    expect(screen.getByText('Analytics')).toBeInTheDocument();
  });

  it('shows reactivation patients who have not visited in 6+ weeks', () => {
    render(<RecallManager {...defaultProps} />);
    // p1 (Kari) and p3 (Anna) had last visit 50 days ago (>42 days = 6 weeks)
    expect(screen.getByText('Kari Nordmann')).toBeInTheDocument();
    expect(screen.getByText('Anna Berg')).toBeInTheDocument();
  });

  it('shows the Create Campaign button', () => {
    render(<RecallManager {...defaultProps} />);
    expect(screen.getByText('Create Campaign')).toBeInTheDocument();
  });

  it('shows recall type filter buttons', () => {
    render(<RecallManager {...defaultProps} />);
    expect(screen.getByText('Overdue Patients')).toBeInTheDocument();
    expect(screen.getByText('Reactivation (6+ weeks)')).toBeInTheDocument();
    expect(screen.getByText('Birthday Wishes')).toBeInTheDocument();
  });

  it('toggles patient selection when checkbox is clicked', () => {
    render(<RecallManager {...defaultProps} />);
    const checkboxes = screen.getAllByRole('checkbox');
    // First checkbox is "Select All", subsequent ones are per-patient
    // Click a patient checkbox (second one)
    if (checkboxes.length > 1) {
      fireEvent.click(checkboxes[1]);
      expect(checkboxes[1].checked).toBe(true);
    }
  });

  it('shows select all checkbox and label', () => {
    render(<RecallManager {...defaultProps} />);
    expect(screen.getByText('Select All')).toBeInTheDocument();
  });

  it('shows Send to Selected button when patients are selected', () => {
    render(<RecallManager {...defaultProps} />);
    const checkboxes = screen.getAllByRole('checkbox');
    // Click select all
    fireEvent.click(checkboxes[0]);
    expect(screen.getByText(/Send to Selected/)).toBeInTheDocument();
  });

  it('calls onSendRecall when Send to Selected is clicked', () => {
    render(<RecallManager {...defaultProps} />);
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]); // select all
    fireEvent.click(screen.getByText(/Send to Selected/));
    expect(defaultProps.onSendRecall).toHaveBeenCalled();
  });

  it('switches to Campaigns tab and shows empty state', () => {
    render(<RecallManager {...defaultProps} />);
    fireEvent.click(screen.getByText('Campaigns'));
    expect(screen.getByText('No campaigns created yet')).toBeInTheDocument();
  });

  it('switches to Analytics tab and shows total recall count', () => {
    render(<RecallManager {...defaultProps} />);
    fireEvent.click(screen.getByText('Analytics'));
    expect(screen.getByText('Total Recalls Needed')).toBeInTheDocument();
  });

  it('opens campaign creation form when Create Campaign is clicked', () => {
    render(<RecallManager {...defaultProps} />);
    fireEvent.click(screen.getByText('Create Campaign'));
    expect(screen.getByText('Campaign Name')).toBeInTheDocument();
    expect(screen.getByText('Channel')).toBeInTheDocument();
    expect(screen.getByText('Schedule')).toBeInTheDocument();
  });

  it('closes campaign form when Cancel is clicked', () => {
    render(<RecallManager {...defaultProps} />);
    fireEvent.click(screen.getByText('Create Campaign'));
    expect(screen.getByText('Campaign Name')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Cancel'));
    expect(screen.queryByText('Campaign Name')).not.toBeInTheDocument();
  });

  it('renders in Norwegian when language is no', () => {
    render(<RecallManager {...defaultProps} language="no" />);
    expect(screen.getByText('Pasient Tilbakekalling')).toBeInTheDocument();
    expect(screen.getByText('Automatiserte oppfølgingskampanjer')).toBeInTheDocument();
  });
});

describe('RecallCompact', () => {
  it('renders the count and title', () => {
    render(<RecallCompact count={5} language="en" />);
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('Need Recall')).toBeInTheDocument();
  });

  it('renders Norwegian labels when language is no', () => {
    render(<RecallCompact count={3} language="no" />);
    expect(screen.getByText('Trenger Tilbakekalling')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const onClick = vi.fn();
    render(<RecallCompact count={5} onClick={onClick} language="en" />);
    fireEvent.click(screen.getByText('Need Recall'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('shows View All link', () => {
    render(<RecallCompact count={2} language="en" />);
    expect(screen.getByText(/View All/)).toBeInTheDocument();
  });
});

describe('RECALL_TYPES export', () => {
  it('exports 5 recall types', () => {
    expect(Object.keys(RECALL_TYPES)).toHaveLength(5);
  });

  it('each type has id, label, icon, and color', () => {
    Object.values(RECALL_TYPES).forEach((type) => {
      expect(type.id).toBeDefined();
      expect(type.label.en).toBeDefined();
      expect(type.label.no).toBeDefined();
      expect(type.icon).toBeDefined();
      expect(type.color).toBeDefined();
    });
  });
});

describe('MESSAGE_TEMPLATES export', () => {
  it('has both en and no templates', () => {
    expect(MESSAGE_TEMPLATES.en).toBeDefined();
    expect(MESSAGE_TEMPLATES.no).toBeDefined();
  });

  it('templates contain placeholder variables', () => {
    expect(MESSAGE_TEMPLATES.en.reactivation).toContain('{firstName}');
    expect(MESSAGE_TEMPLATES.en.reactivation).toContain('{clinicName}');
    expect(MESSAGE_TEMPLATES.no.reactivation).toContain('{firstName}');
  });
});
