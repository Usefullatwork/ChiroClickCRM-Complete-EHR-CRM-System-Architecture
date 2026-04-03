/**
 * DraggableSoapSections Tests
 *
 * Tests:
 * - Sections render with labels
 * - Drag handles visible
 * - Toolbar renders
 * - Settings panel toggle
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('lucide-react', () => ({
  GripVertical: (props) => null,
  Maximize2: (props) => null,
  Minimize2: (props) => null,
  Eye: (props) => null,
  EyeOff: (props) => null,
  Settings: (props) => null,
  RotateCcw: (props) => null,
}));

vi.mock('../../../i18n', () => ({
  useTranslation: () => ({ t: (key, fallback) => fallback || key, lang: 'no', setLang: vi.fn() }),
  useLanguage: () => ({ lang: 'no', setLang: vi.fn() }),
  LanguageProvider: ({ children }) => children,
}));

vi.mock('../../../i18n/useTranslation', () => ({
  useTranslation: () => ({ t: (key, fallback) => fallback || key, lang: 'no', setLang: vi.fn() }),
}));

// Mock DnD Kit
vi.mock('@dnd-kit/core', () => ({
  DndContext: ({ children }) => <div data-testid="dnd-context">{children}</div>,
  closestCenter: vi.fn(),
  KeyboardSensor: vi.fn(),
  PointerSensor: vi.fn(),
  useSensor: vi.fn(),
  useSensors: () => [],
}));

vi.mock('@dnd-kit/sortable', () => ({
  arrayMove: vi.fn((arr, from, to) => {
    const result = [...arr];
    const [item] = result.splice(from, 1);
    result.splice(to, 0, item);
    return result;
  }),
  SortableContext: ({ children }) => <div data-testid="sortable-context">{children}</div>,
  sortableKeyboardCoordinates: vi.fn(),
  verticalListSortingStrategy: vi.fn(),
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    transition: null,
    isDragging: false,
  }),
}));

vi.mock('@dnd-kit/utilities', () => ({
  CSS: {
    Transform: {
      toString: () => null,
    },
  },
}));

import DraggableSoapSections from '../../../components/clinical/DraggableSoapSections';

describe('DraggableSoapSections', () => {
  const defaultProps = {
    values: {
      subjective: 'Test subjective',
      objective: 'Test objective',
      assessment: '',
      plan: '',
    },
    onChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all four SOAP section labels', () => {
    render(<DraggableSoapSections {...defaultProps} />);
    expect(screen.getByText('Subjektiv')).toBeInTheDocument();
    expect(screen.getByText('Objektiv')).toBeInTheDocument();
    expect(screen.getByText('Vurdering')).toBeInTheDocument();
    expect(screen.getByText('Plan')).toBeInTheDocument();
  });

  it('renders the toolbar title', () => {
    render(<DraggableSoapSections {...defaultProps} />);
    expect(screen.getByText('SOAP-notater')).toBeInTheDocument();
  });

  it('renders section icon letters', () => {
    render(<DraggableSoapSections {...defaultProps} />);
    expect(screen.getAllByText('S').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('O').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('A').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('P').length).toBeGreaterThanOrEqual(1);
  });

  it('renders textareas with section content', () => {
    render(<DraggableSoapSections {...defaultProps} />);
    const textareas = screen.getAllByRole('textbox');
    expect(textareas.length).toBe(4);
    expect(textareas[0].value).toBe('Test subjective');
    expect(textareas[1].value).toBe('Test objective');
  });

  it('renders section descriptions', () => {
    render(<DraggableSoapSections {...defaultProps} />);
    expect(screen.getByText('Pasientens symptomer og historie')).toBeInTheDocument();
    expect(screen.getByText('Kliniske funn og undersøkelse')).toBeInTheDocument();
  });

  it('renders expand/collapse toolbar buttons', () => {
    render(<DraggableSoapSections {...defaultProps} />);
    expect(screen.getByLabelText('Maksimer')).toBeInTheDocument();
    expect(screen.getByLabelText('Minimer')).toBeInTheDocument();
  });

  it('renders DnD context wrapper', () => {
    render(<DraggableSoapSections {...defaultProps} />);
    expect(screen.getByTestId('dnd-context')).toBeInTheDocument();
  });

  it('calls onChange when textarea content changes', () => {
    render(<DraggableSoapSections {...defaultProps} />);
    const textareas = screen.getAllByRole('textbox');
    fireEvent.change(textareas[0], { target: { value: 'Updated subjective' } });
    expect(defaultProps.onChange).toHaveBeenCalledWith('subjective', 'Updated subjective');
  });

  it('renders textareas as readOnly when readOnly prop is true', () => {
    render(<DraggableSoapSections {...defaultProps} readOnly={true} />);
    const textareas = screen.getAllByRole('textbox');
    textareas.forEach((textarea) => {
      expect(textarea).toHaveAttribute('readOnly');
    });
  });
});
