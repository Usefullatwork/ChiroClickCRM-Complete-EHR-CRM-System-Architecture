/**
 * ResponsiveTable Component Tests
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock i18n
vi.mock('../../../i18n', () => ({
  useTranslation: () => ({
    t: (key, fallback) => fallback || key,
    lang: 'no',
    setLang: vi.fn(),
  }),
}));

// Mock useMediaQuery
vi.mock('../../../hooks/useMediaQuery', () => ({
  default: () => ({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
  }),
}));

import ResponsiveTable, {
  ResponsiveDataList,
  ResponsiveGrid,
} from '../../../components/ui/ResponsiveTable';

const columns = [
  { key: 'name', label: 'Navn' },
  { key: 'age', label: 'Alder' },
  { key: 'status', label: 'Status' },
];

const data = [
  { id: 1, name: 'Ola Nordmann', age: 35, status: 'Aktiv' },
  { id: 2, name: 'Kari Nordmann', age: 28, status: 'Inaktiv' },
  { id: 3, name: 'Per Hansen', age: 42, status: 'Aktiv' },
];

describe('ResponsiveTable Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // =========================================================================
  // BASIC RENDERING
  // =========================================================================

  it('should render table headers', () => {
    render(<ResponsiveTable columns={columns} data={data} />);
    expect(screen.getByText('Navn')).toBeInTheDocument();
    expect(screen.getByText('Alder')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
  });

  it('should render table data', () => {
    render(<ResponsiveTable columns={columns} data={data} />);
    expect(screen.getByText('Ola Nordmann')).toBeInTheDocument();
    expect(screen.getByText('Kari Nordmann')).toBeInTheDocument();
    expect(screen.getByText('Per Hansen')).toBeInTheDocument();
  });

  // =========================================================================
  // EMPTY STATE
  // =========================================================================

  it('should show empty message when data is empty', () => {
    render(<ResponsiveTable columns={columns} data={[]} />);
    expect(screen.getByText('Ingen data funnet')).toBeInTheDocument();
  });

  it('should show custom empty message', () => {
    render(<ResponsiveTable columns={columns} data={[]} emptyMessage="Ingen pasienter" />);
    expect(screen.getByText('Ingen pasienter')).toBeInTheDocument();
  });

  // =========================================================================
  // LOADING STATE
  // =========================================================================

  it('should show loading spinner when loading', () => {
    const { container } = render(<ResponsiveTable columns={columns} data={[]} loading={true} />);
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
    expect(screen.getByText('Laster data...')).toBeInTheDocument();
  });

  // =========================================================================
  // ROW CLICK
  // =========================================================================

  it('should call onRowClick when a row is clicked', () => {
    const onRowClick = vi.fn();
    render(<ResponsiveTable columns={columns} data={data} onRowClick={onRowClick} />);
    // Click the row containing "Ola Nordmann"
    fireEvent.click(screen.getByText('Ola Nordmann').closest('tr'));
    expect(onRowClick).toHaveBeenCalledWith(data[0]);
  });

  // =========================================================================
  // ACTION BUTTONS
  // =========================================================================

  it('should render view/edit/delete action buttons', () => {
    const onView = vi.fn();
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    render(
      <ResponsiveTable
        columns={columns}
        data={data}
        onView={onView}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    );
    // 3 rows x 3 action buttons = 9 action buttons total + the sr-only header
    const viewBtns = screen.getAllByTitle('Vis');
    const editBtns = screen.getAllByTitle('Rediger');
    const deleteBtns = screen.getAllByTitle('Slett');
    expect(viewBtns).toHaveLength(3);
    expect(editBtns).toHaveLength(3);
    expect(deleteBtns).toHaveLength(3);
  });

  it('should call onView with row data when view button is clicked', () => {
    const onView = vi.fn();
    render(<ResponsiveTable columns={columns} data={data} onView={onView} />);
    const viewBtns = screen.getAllByTitle('Vis');
    fireEvent.click(viewBtns[0]);
    expect(onView).toHaveBeenCalledWith(data[0]);
  });

  it('should call onEdit with row data when edit button is clicked', () => {
    const onEdit = vi.fn();
    render(<ResponsiveTable columns={columns} data={data} onEdit={onEdit} />);
    const editBtns = screen.getAllByTitle('Rediger');
    fireEvent.click(editBtns[1]);
    expect(onEdit).toHaveBeenCalledWith(data[1]);
  });

  it('should call onDelete with row data when delete button is clicked', () => {
    const onDelete = vi.fn();
    render(<ResponsiveTable columns={columns} data={data} onDelete={onDelete} />);
    const deleteBtns = screen.getAllByTitle('Slett');
    fireEvent.click(deleteBtns[2]);
    expect(onDelete).toHaveBeenCalledWith(data[2]);
  });

  // =========================================================================
  // CUSTOM COLUMN RENDER
  // =========================================================================

  it('should use custom render function for columns', () => {
    const customColumns = [
      {
        key: 'name',
        label: 'Navn',
        render: (val) => <strong data-testid="bold-name">{val}</strong>,
      },
      { key: 'age', label: 'Alder' },
    ];
    render(<ResponsiveTable columns={customColumns} data={data} />);
    const boldNames = screen.getAllByTestId('bold-name');
    expect(boldNames).toHaveLength(3);
    expect(boldNames[0]).toHaveTextContent('Ola Nordmann');
  });

  // =========================================================================
  // STRIPED ROWS
  // =========================================================================

  it('should apply striped row classes when striped=true', () => {
    render(<ResponsiveTable columns={columns} data={data} striped={true} />);
    const rows = screen.getAllByText(/Nordmann|Hansen/).map((el) => el.closest('tr'));
    // Second row (index 1) should have bg-gray-50
    expect(rows[1].className).toContain('bg-gray-50');
  });

  // =========================================================================
  // CLASSNAME
  // =========================================================================

  it('should apply custom className', () => {
    const { container } = render(
      <ResponsiveTable columns={columns} data={data} className="custom-table" />
    );
    expect(container.firstChild.className).toContain('custom-table');
  });
});

// =============================================================================
// RESPONSIVE DATA LIST
// =============================================================================

describe('ResponsiveDataList Component', () => {
  const items = [
    { id: 1, name: 'Item A' },
    { id: 2, name: 'Item B' },
  ];

  it('should render items using renderItem', () => {
    render(
      <ResponsiveDataList
        items={items}
        renderItem={(item) => <div data-testid="list-item">{item.name}</div>}
      />
    );
    expect(screen.getAllByTestId('list-item')).toHaveLength(2);
    expect(screen.getByText('Item A')).toBeInTheDocument();
  });

  it('should show empty message when no items', () => {
    render(
      <ResponsiveDataList items={[]} renderItem={() => null} emptyMessage="Ingen elementer" />
    );
    expect(screen.getByText('Ingen elementer')).toBeInTheDocument();
  });

  it('should show loading state', () => {
    const { container } = render(
      <ResponsiveDataList items={[]} renderItem={() => null} loading={true} />
    );
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });
});

// =============================================================================
// RESPONSIVE GRID
// =============================================================================

describe('ResponsiveGrid Component', () => {
  it('should render children in a grid', () => {
    render(
      <ResponsiveGrid>
        <div data-testid="child-1">A</div>
        <div data-testid="child-2">B</div>
      </ResponsiveGrid>
    );
    expect(screen.getByTestId('child-1')).toBeInTheDocument();
    expect(screen.getByTestId('child-2')).toBeInTheDocument();
  });

  it('should apply grid classes', () => {
    const { container } = render(
      <ResponsiveGrid>
        <div>Cell</div>
      </ResponsiveGrid>
    );
    expect(container.firstChild).toHaveClass('grid');
  });
});
