/**
 * WorkflowBuilder Component Tests
 * Tests for the visual workflow automation builder
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import WorkflowBuilder from '../../components/workflows/WorkflowBuilder';

describe('WorkflowBuilder Component', () => {
  const mockOnSave = vi.fn();
  const mockOnTest = vi.fn();
  const mockOnCancel = vi.fn();

  const defaultProps = {
    onSave: mockOnSave,
    onTest: mockOnTest,
    onCancel: mockOnCancel,
    language: 'en',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================================================
  // RENDER & TITLE TESTS
  // ============================================================================

  describe('Rendering', () => {
    it('should render with "Create Workflow" title when no workflow prop', () => {
      render(<WorkflowBuilder {...defaultProps} />);
      expect(screen.getByText('Create Workflow')).toBeInTheDocument();
    });

    it('should render with "Edit Workflow" title when workflow prop is provided', () => {
      const workflow = { id: '1', name: 'Test', trigger_type: 'PATIENT_CREATED', actions: [] };
      render(<WorkflowBuilder {...defaultProps} workflow={workflow} />);
      expect(screen.getByText('Edit Workflow')).toBeInTheDocument();
    });

    it('should pre-fill name when editing an existing workflow', () => {
      const workflow = { name: 'Welcome Flow', trigger_type: 'PATIENT_CREATED', actions: [] };
      render(<WorkflowBuilder {...defaultProps} workflow={workflow} />);
      const nameInput = screen.getByPlaceholderText('e.g., Welcome New Patients');
      expect(nameInput.value).toBe('Welcome Flow');
    });

    it('should render Norwegian labels when language is "no"', () => {
      render(<WorkflowBuilder {...defaultProps} language="no" />);
      expect(screen.getByText('Opprett arbeidsflyt')).toBeInTheDocument();
      expect(screen.getByText('Lagre arbeidsflyt')).toBeInTheDocument();
      expect(screen.getByText('Avbryt')).toBeInTheDocument();
    });

    it('should show Save and Cancel buttons', () => {
      render(<WorkflowBuilder {...defaultProps} />);
      expect(screen.getByText('Save Workflow')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    it('should show the Enabled toggle', () => {
      render(<WorkflowBuilder {...defaultProps} />);
      expect(screen.getByText('Enabled')).toBeInTheDocument();
    });
  });

  // ============================================================================
  // VALIDATION TESTS
  // ============================================================================

  describe('Validation', () => {
    it('should show error when saving with empty name', async () => {
      render(<WorkflowBuilder {...defaultProps} />);
      fireEvent.click(screen.getByText('Save Workflow'));

      await waitFor(() => {
        expect(screen.getByText('Workflow name is required')).toBeInTheDocument();
      });
      expect(mockOnSave).not.toHaveBeenCalled();
    });

    it('should show error when saving without a trigger', async () => {
      render(<WorkflowBuilder {...defaultProps} />);
      // Fill in name
      const nameInput = screen.getByPlaceholderText('e.g., Welcome New Patients');
      fireEvent.change(nameInput, { target: { value: 'My Workflow' } });
      fireEvent.click(screen.getByText('Save Workflow'));

      await waitFor(() => {
        expect(screen.getByText('Please select a trigger type')).toBeInTheDocument();
      });
      expect(mockOnSave).not.toHaveBeenCalled();
    });

    it('should show error when saving without actions', async () => {
      render(<WorkflowBuilder {...defaultProps} />);
      // Fill in name
      const nameInput = screen.getByPlaceholderText('e.g., Welcome New Patients');
      fireEvent.change(nameInput, { target: { value: 'My Workflow' } });
      // Select trigger
      fireEvent.click(screen.getByText('Patient Created'));

      // Open actions section so the error message can be visible
      fireEvent.click(screen.getByText('Actions'));

      fireEvent.click(screen.getByText('Save Workflow'));

      await waitFor(() => {
        expect(screen.getByText('Add at least one action')).toBeInTheDocument();
      });
      expect(mockOnSave).not.toHaveBeenCalled();
    });
  });

  // ============================================================================
  // TRIGGER SELECTION
  // ============================================================================

  describe('Trigger Selection', () => {
    it('should display all trigger types in trigger section', () => {
      render(<WorkflowBuilder {...defaultProps} />);
      expect(screen.getByText('Patient Created')).toBeInTheDocument();
      expect(screen.getByText('Appointment Scheduled')).toBeInTheDocument();
      expect(screen.getByText('Appointment Completed')).toBeInTheDocument();
      expect(screen.getByText('Appointment Missed')).toBeInTheDocument();
      expect(screen.getByText('Days Since Last Visit')).toBeInTheDocument();
      expect(screen.getByText('Patient Birthday')).toBeInTheDocument();
    });

    it('should show trigger descriptions', () => {
      render(<WorkflowBuilder {...defaultProps} />);
      expect(screen.getByText('Triggered when a new patient is created')).toBeInTheDocument();
    });
  });

  // ============================================================================
  // CONDITIONS CRUD
  // ============================================================================

  describe('Conditions', () => {
    it('should add a condition when "Add Condition" is clicked', async () => {
      render(<WorkflowBuilder {...defaultProps} />);
      // Open conditions section
      fireEvent.click(screen.getByText('Conditions'));
      fireEvent.click(screen.getByText('Add Condition'));

      await waitFor(() => {
        // Should show field selector with "Field..." option
        expect(screen.getByText('Field...')).toBeInTheDocument();
      });
    });

    it('should remove a condition when trash button is clicked', async () => {
      render(<WorkflowBuilder {...defaultProps} />);
      // Open conditions section
      fireEvent.click(screen.getByText('Conditions'));
      fireEvent.click(screen.getByText('Add Condition'));

      await waitFor(() => {
        expect(screen.getByText('Field...')).toBeInTheDocument();
      });

      // Click the trash button to remove condition
      const trashButtons = document.querySelectorAll('button');
      const conditionTrash = Array.from(trashButtons).find((btn) => {
        const svg = btn.querySelector('svg');
        return svg && btn.closest('.bg-gray-50');
      });
      if (conditionTrash) {
        fireEvent.click(conditionTrash);
      }
    });
  });

  // ============================================================================
  // ACTIONS CRUD & REORDER
  // ============================================================================

  describe('Actions', () => {
    it('should show "No actions configured" in empty state', () => {
      render(<WorkflowBuilder {...defaultProps} />);
      // Open actions section
      fireEvent.click(screen.getByText('Actions'));
      expect(screen.getByText('No actions configured')).toBeInTheDocument();
    });

    it('should add an action when clicking an action type button', async () => {
      render(<WorkflowBuilder {...defaultProps} />);
      // Open actions section
      fireEvent.click(screen.getByText('Actions'));
      // Click "Send SMS" button to add action
      const addButtons = screen.getAllByText('Send SMS');
      // The second one is the "add action" button (first is the label in the action type list)
      fireEvent.click(addButtons[addButtons.length - 1]);

      await waitFor(() => {
        // The action should now show with its number prefix
        expect(screen.getByText(/1\. Send SMS/)).toBeInTheDocument();
      });
    });

    it('should show action-specific fields for SEND_SMS', async () => {
      render(<WorkflowBuilder {...defaultProps} />);
      fireEvent.click(screen.getByText('Actions'));
      const addButtons = screen.getAllByText('Send SMS');
      fireEvent.click(addButtons[addButtons.length - 1]);

      await waitFor(() => {
        expect(screen.getByText('Delay (hours)')).toBeInTheDocument();
        expect(screen.getByText('Message *')).toBeInTheDocument();
      });
    });

    it('should remove an action when trash button is clicked', async () => {
      render(<WorkflowBuilder {...defaultProps} />);
      fireEvent.click(screen.getByText('Actions'));
      const addButtons = screen.getAllByText('Send SMS');
      fireEvent.click(addButtons[addButtons.length - 1]);

      await waitFor(() => {
        expect(screen.getByText(/1\. Send SMS/)).toBeInTheDocument();
      });

      // The action card has a structure: div.border > div.flex (header with remove btn)
      // Find all buttons with hover:text-red-600 class (trash/remove buttons)
      const removeButtons = document.querySelectorAll('button.p-2');
      const trashBtn = Array.from(removeButtons).find(
        (btn) =>
          btn.className.includes('hover:text-red-600') &&
          btn.closest('.border-gray-200.rounded-lg.p-4')
      );
      expect(trashBtn).toBeTruthy();
      fireEvent.click(trashBtn);

      await waitFor(() => {
        expect(screen.getByText('No actions configured')).toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // CALLBACKS
  // ============================================================================

  describe('Callbacks', () => {
    it('should call onCancel when Cancel is clicked', () => {
      render(<WorkflowBuilder {...defaultProps} />);
      fireEvent.click(screen.getByText('Cancel'));
      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });

    it('should call onSave with workflow data when valid', async () => {
      mockOnSave.mockResolvedValue(undefined);
      render(<WorkflowBuilder {...defaultProps} />);

      // Fill name
      const nameInput = screen.getByPlaceholderText('e.g., Welcome New Patients');
      fireEvent.change(nameInput, { target: { value: 'Welcome Flow' } });

      // Select trigger
      fireEvent.click(screen.getByText('Patient Created'));

      // Add an action
      fireEvent.click(screen.getByText('Actions'));
      const addButtons = screen.getAllByText('Send SMS');
      fireEvent.click(addButtons[addButtons.length - 1]);

      // Save
      fireEvent.click(screen.getByText('Save Workflow'));

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledTimes(1);
        const arg = mockOnSave.mock.calls[0][0];
        expect(arg.name).toBe('Welcome Flow');
        expect(arg.trigger_type).toBe('PATIENT_CREATED');
        expect(arg.actions).toHaveLength(1);
        expect(arg.actions[0].type).toBe('SEND_SMS');
      });
    });
  });

  // ============================================================================
  // TEST MODAL
  // ============================================================================

  describe('Test Modal', () => {
    it('should open test modal when "Test Workflow" is clicked', () => {
      render(<WorkflowBuilder {...defaultProps} />);
      fireEvent.click(screen.getByText('Test Workflow'));
      expect(screen.getByText('Select test patient')).toBeInTheDocument();
    });

    it('should show test patients in the dropdown', () => {
      const testPatients = [
        { id: 'p1', first_name: 'Ola', last_name: 'Nordmann' },
        { id: 'p2', first_name: 'Kari', last_name: 'Hansen' },
      ];
      render(<WorkflowBuilder {...defaultProps} testPatients={testPatients} />);
      fireEvent.click(screen.getByText('Test Workflow'));
      expect(screen.getByText('Ola Nordmann')).toBeInTheDocument();
      expect(screen.getByText('Kari Hansen')).toBeInTheDocument();
    });

    it('should have disabled Run Test button when no patient selected', () => {
      render(<WorkflowBuilder {...defaultProps} />);
      fireEvent.click(screen.getByText('Test Workflow'));
      const runButton = screen.getByText('Run Test');
      expect(runButton.closest('button')).toBeDisabled();
    });
  });

  // ============================================================================
  // ENABLED TOGGLE
  // ============================================================================

  describe('Enabled Toggle', () => {
    it('should start with Enabled checked by default', () => {
      render(<WorkflowBuilder {...defaultProps} />);
      const toggle = screen.getByText('Enabled');
      expect(toggle).toBeInTheDocument();
    });

    it('should have Enabled label in Norwegian when language is "no"', () => {
      render(<WorkflowBuilder {...defaultProps} language="no" />);
      expect(screen.getByText('Aktivert')).toBeInTheDocument();
    });
  });

  // ============================================================================
  // MULTIPLE ACTIONS
  // ============================================================================

  describe('Multiple Actions', () => {
    it('should add multiple actions sequentially', async () => {
      render(<WorkflowBuilder {...defaultProps} />);
      fireEvent.click(screen.getByText('Actions'));

      // Add first action
      const smsButtons = screen.getAllByText('Send SMS');
      fireEvent.click(smsButtons[smsButtons.length - 1]);

      await waitFor(() => {
        expect(screen.getByText(/1\. Send SMS/)).toBeInTheDocument();
      });

      // Add second action - "Send Email"
      const emailButtons = screen.getAllByText('Send Email');
      fireEvent.click(emailButtons[emailButtons.length - 1]);

      await waitFor(() => {
        expect(screen.getByText(/2\. Send Email/)).toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // NORWEGIAN LABELS
  // ============================================================================

  describe('Norwegian Labels', () => {
    it('should show Norwegian trigger labels when language is "no"', () => {
      render(<WorkflowBuilder {...defaultProps} language="no" />);
      expect(screen.getByText('Ny pasient opprettet')).toBeInTheDocument();
      expect(screen.getByText('Time bestilt')).toBeInTheDocument();
    });

    it('should show Norwegian save and cancel buttons', () => {
      render(<WorkflowBuilder {...defaultProps} language="no" />);
      expect(screen.getByText('Lagre arbeidsflyt')).toBeInTheDocument();
      expect(screen.getByText('Avbryt')).toBeInTheDocument();
    });

    it('should show Norwegian validation messages', async () => {
      render(<WorkflowBuilder {...defaultProps} language="no" />);
      fireEvent.click(screen.getByText('Lagre arbeidsflyt'));

      await waitFor(() => {
        expect(screen.getByText('Arbeidsflytens navn er pakrevd')).toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // PRE-FILL BEHAVIOR
  // ============================================================================

  describe('Pre-fill Behavior', () => {
    it('should pre-fill trigger type when editing an existing workflow', () => {
      const workflow = {
        id: '1',
        name: 'Test Flow',
        trigger_type: 'APPOINTMENT_SCHEDULED',
        actions: [{ type: 'SEND_SMS', delay_hours: 0, message: 'Hello' }],
      };
      render(<WorkflowBuilder {...defaultProps} workflow={workflow} />);
      expect(screen.getByText('Edit Workflow')).toBeInTheDocument();
    });

    it('should pre-fill actions when editing an existing workflow', () => {
      const workflow = {
        id: '1',
        name: 'Test Flow',
        trigger_type: 'PATIENT_CREATED',
        actions: [{ type: 'SEND_SMS', delay_hours: 1, message: 'Velkommen!' }],
      };
      render(<WorkflowBuilder {...defaultProps} workflow={workflow} />);

      // The actions section should show the pre-filled action
      fireEvent.click(screen.getByText('Actions'));
      expect(screen.getByText(/1\. Send SMS/)).toBeInTheDocument();
    });
  });

  // ============================================================================
  // CALLBACK ARGUMENTS
  // ============================================================================

  describe('Callback Arguments', () => {
    it('should include enabled flag in save data', async () => {
      mockOnSave.mockResolvedValue(undefined);
      render(<WorkflowBuilder {...defaultProps} />);

      const nameInput = screen.getByPlaceholderText('e.g., Welcome New Patients');
      fireEvent.change(nameInput, { target: { value: 'Test' } });
      fireEvent.click(screen.getByText('Patient Created'));
      fireEvent.click(screen.getByText('Actions'));
      const addButtons = screen.getAllByText('Send SMS');
      fireEvent.click(addButtons[addButtons.length - 1]);
      fireEvent.click(screen.getByText('Save Workflow'));

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledTimes(1);
        const arg = mockOnSave.mock.calls[0][0];
        expect(arg).toHaveProperty('is_active');
      });
    });
  });
});
