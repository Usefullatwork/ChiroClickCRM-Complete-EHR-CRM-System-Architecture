/**
 * Input Component Tests
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Input, TextArea } from '../../../components/ui/Input';

describe('Input Component', () => {
  // =========================================================================
  // BASIC RENDERING
  // =========================================================================

  it('should render an input element', () => {
    render(<Input />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('should render label when provided', () => {
    render(<Input label="Email" />);
    expect(screen.getByText('Email')).toBeInTheDocument();
  });

  it('should show required indicator with label', () => {
    render(<Input label="Name" required />);
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  // =========================================================================
  // VALUE AND ONCHANGE
  // =========================================================================

  it('should forward value prop', () => {
    render(<Input value="hello" onChange={vi.fn()} />);
    expect(screen.getByRole('textbox')).toHaveValue('hello');
  });

  it('should call onChange when typing', () => {
    const handleChange = vi.fn();
    render(<Input value="" onChange={handleChange} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'test' } });
    expect(handleChange).toHaveBeenCalled();
  });

  // =========================================================================
  // PLACEHOLDER
  // =========================================================================

  it('should render placeholder', () => {
    render(<Input placeholder="Enter value" />);
    expect(screen.getByPlaceholderText('Enter value')).toBeInTheDocument();
  });

  // =========================================================================
  // DISABLED
  // =========================================================================

  it('should be disabled when disabled prop is passed', () => {
    render(<Input disabled />);
    expect(screen.getByRole('textbox')).toBeDisabled();
  });

  // =========================================================================
  // ERROR STATE
  // =========================================================================

  it('should display error message', () => {
    render(<Input error="This field is required" />);
    expect(screen.getByText('This field is required')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('should set aria-invalid when error is present', () => {
    render(<Input error="Bad" />);
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
  });

  it('should not set aria-invalid when no error', () => {
    render(<Input />);
    expect(screen.getByRole('textbox')).not.toHaveAttribute('aria-invalid');
  });

  // =========================================================================
  // HELPER TEXT
  // =========================================================================

  it('should display helper text when no error', () => {
    render(<Input helperText="Optional field" />);
    expect(screen.getByText('Optional field')).toBeInTheDocument();
  });

  it('should hide helper text when error is present', () => {
    render(<Input helperText="Optional" error="Required" />);
    expect(screen.queryByText('Optional')).not.toBeInTheDocument();
    expect(screen.getByText('Required')).toBeInTheDocument();
  });

  // =========================================================================
  // CLASSNAME
  // =========================================================================

  it('should append custom className to input', () => {
    render(<Input className="custom-input" />);
    const input = screen.getByRole('textbox');
    expect(input.className).toContain('custom-input');
  });

  // =========================================================================
  // ID FORWARDING
  // =========================================================================

  it('should use provided id', () => {
    render(<Input id="my-input" label="Test" />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('id', 'my-input');
  });

  it('should link label to input via htmlFor', () => {
    render(<Input id="email-input" label="Email" />);
    const label = screen.getByText('Email');
    expect(label).toHaveAttribute('for', 'email-input');
  });
});

describe('TextArea Component', () => {
  it('should render a textarea element', () => {
    render(<TextArea />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('should render with default 4 rows', () => {
    render(<TextArea />);
    expect(screen.getByRole('textbox')).toHaveAttribute('rows', '4');
  });

  it('should accept custom rows', () => {
    render(<TextArea rows={8} />);
    expect(screen.getByRole('textbox')).toHaveAttribute('rows', '8');
  });

  it('should render label and error like Input', () => {
    render(<TextArea label="Notes" error="Required" required />);
    expect(screen.getByText('Notes')).toBeInTheDocument();
    expect(screen.getByText('*')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('Required');
  });
});
