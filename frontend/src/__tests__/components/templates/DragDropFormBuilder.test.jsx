/**
 * DragDropFormBuilder Component Tests
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

vi.mock('../../../i18n', () => ({
  useTranslation: () => ({
    t: (key, fallback) => fallback || key,
    lang: 'no',
    setLang: vi.fn(),
  }),
}));

// Mock @dnd-kit/core
vi.mock('@dnd-kit/core', () => ({
  DndContext: ({ children }) => <div data-testid="dnd-context">{children}</div>,
  closestCenter: vi.fn(),
  KeyboardSensor: vi.fn(),
  PointerSensor: vi.fn(),
  useSensor: vi.fn().mockReturnValue({}),
  useSensors: vi.fn().mockReturnValue([]),
}));

vi.mock('@dnd-kit/sortable', () => ({
  arrayMove: vi.fn(),
  SortableContext: ({ children }) => <div data-testid="sortable-context">{children}</div>,
  sortableKeyboardCoordinates: vi.fn(),
  verticalListSortingStrategy: 'vertical',
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
  CSS: { Transform: { toString: () => '' } },
}));

vi.mock(
  'lucide-react',
  () =>
    new Proxy(
      {},
      {
        get: (_, name) => {
          if (name === '__esModule') return false;
          return (props) => null;
        },
      }
    )
);

import DragDropFormBuilder from '../../../components/templates/DragDropFormBuilder';

describe('DragDropFormBuilder', () => {
  const defaultProps = {
    fields: [],
    onChange: vi.fn(),
    onSave: vi.fn(),
  };

  it('renders without crashing', () => {
    const { container } = render(<DragDropFormBuilder {...defaultProps} />);
    expect(container).toBeTruthy();
  });

  it('renders DnD context', () => {
    render(<DragDropFormBuilder {...defaultProps} />);
    expect(screen.getByTestId('dnd-context')).toBeInTheDocument();
  });

  it('renders add field button', () => {
    render(<DragDropFormBuilder {...defaultProps} />);
    expect(screen.getByText('Legg til felt')).toBeInTheDocument();
  });

  it('renders with existing fields', () => {
    const fields = [
      {
        id: 'field_1',
        type: 'text',
        label: 'Patient Name',
        required: true,
        placeholder: '',
        helpText: '',
        options: [],
        validation: {},
        width: 'full',
        defaultValue: '',
      },
    ];
    render(<DragDropFormBuilder {...defaultProps} fields={fields} />);
    expect(screen.getByTestId('sortable-context')).toBeInTheDocument();
  });

  it('renders sortable context', () => {
    render(<DragDropFormBuilder {...defaultProps} />);
    expect(screen.getByTestId('sortable-context')).toBeInTheDocument();
  });
});
