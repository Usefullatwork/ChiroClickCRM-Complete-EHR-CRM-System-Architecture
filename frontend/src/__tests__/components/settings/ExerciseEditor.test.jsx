/**
 * ExerciseEditor Component Tests
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ExerciseEditor from '../../../components/settings/ExerciseEditor';

vi.mock('../../../i18n', () => ({
  useTranslation: () => ({ t: (key, fallback) => fallback || key, lang: 'no', setLang: vi.fn() }),
}));
vi.mock('lucide-react', () => new Proxy({}, { get: (_, name) => (props) => null }));

describe('ExerciseEditor Component', () => {
  const defaultProps = {
    exercise: null,
    mode: 'create',
    onSave: vi.fn(),
    onClose: vi.fn(),
    isSaving: false,
    lang: 'no',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // =========================================================================
  // BASIC RENDERING
  // =========================================================================

  it('should render create mode title', () => {
    render(<ExerciseEditor {...defaultProps} />);
    expect(screen.getByText('Ny øvelse')).toBeInTheDocument();
  });

  it('should render edit mode title', () => {
    render(<ExerciseEditor {...defaultProps} mode="edit" />);
    expect(screen.getByText('Rediger øvelse')).toBeInTheDocument();
  });

  it('should render as a modal overlay', () => {
    const { container } = render(<ExerciseEditor {...defaultProps} />);
    expect(container.querySelector('.fixed.inset-0')).toBeInTheDocument();
  });

  // =========================================================================
  // FORM FIELDS
  // =========================================================================

  it('should render Norwegian name field', () => {
    render(<ExerciseEditor {...defaultProps} />);
    expect(screen.getByText('Navn (Norsk)')).toBeInTheDocument();
  });

  it('should render English name field', () => {
    render(<ExerciseEditor {...defaultProps} />);
    expect(screen.getByText('Navn (Engelsk)')).toBeInTheDocument();
  });

  it('should render category select', () => {
    render(<ExerciseEditor {...defaultProps} />);
    expect(screen.getByText('Kategori')).toBeInTheDocument();
  });

  it('should render body region select', () => {
    render(<ExerciseEditor {...defaultProps} />);
    expect(screen.getByText('Kroppsregion')).toBeInTheDocument();
  });

  it('should render difficulty select', () => {
    render(<ExerciseEditor {...defaultProps} />);
    expect(screen.getByText('Vanskelighetsgrad')).toBeInTheDocument();
  });

  // =========================================================================
  // EXERCISE DATA PRE-FILL
  // =========================================================================

  it('should populate form with exercise data in edit mode', () => {
    const exercise = {
      name_no: 'Kne til bryst',
      name_en: 'Knee to chest',
      category: 'stretching',
      body_region: 'lumbar',
      difficulty: 'beginner',
      instructions_no: 'Ligg på ryggen...',
      instructions_en: 'Lie on your back...',
      default_sets: 3,
      default_reps: 10,
      tags: ['stretch', 'lower-back'],
    };
    render(<ExerciseEditor {...defaultProps} exercise={exercise} mode="edit" />);
    expect(screen.getByDisplayValue('Kne til bryst')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Knee to chest')).toBeInTheDocument();
  });

  // =========================================================================
  // SAVE / CLOSE
  // =========================================================================

  it('should call onClose when close button is clicked', () => {
    render(<ExerciseEditor {...defaultProps} />);
    const closeBtn = screen.getByText('Avbryt');
    fireEvent.click(closeBtn);
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('should call onSave when form is submitted with valid data', () => {
    render(<ExerciseEditor {...defaultProps} />);
    // Fill in required field
    const nameInput = screen.getByPlaceholderText('f.eks. Kne til bryst tøyning');
    fireEvent.change(nameInput, { target: { value: 'Test Exercise' } });
    // Submit
    const saveBtn = screen.getByText('Lagre øvelse');
    fireEvent.click(saveBtn);
    expect(defaultProps.onSave).toHaveBeenCalled();
  });

  it('should not call onSave when name_no is empty', () => {
    render(<ExerciseEditor {...defaultProps} />);
    const saveBtn = screen.getByText('Lagre øvelse');
    fireEvent.click(saveBtn);
    expect(defaultProps.onSave).not.toHaveBeenCalled();
  });

  // =========================================================================
  // SAVING STATE
  // =========================================================================

  it('should disable save button when isSaving', () => {
    render(<ExerciseEditor {...defaultProps} isSaving={true} />);
    expect(screen.getByText('Lagrer...')).toBeInTheDocument();
  });

  // =========================================================================
  // TAGS
  // =========================================================================

  it('should add a tag when add button is clicked', () => {
    render(<ExerciseEditor {...defaultProps} />);
    const tagInput = screen.getByPlaceholderText('Legg til tag...');
    fireEvent.change(tagInput, { target: { value: 'flexibility' } });
    const addBtn = tagInput.closest('.flex').querySelector('button');
    fireEvent.click(addBtn);
    expect(screen.getByText('flexibility')).toBeInTheDocument();
  });

  // =========================================================================
  // EQUIPMENT TOGGLES
  // =========================================================================

  it('should render equipment options', () => {
    render(<ExerciseEditor {...defaultProps} />);
    expect(screen.getByText('equipNone')).toBeInTheDocument();
    expect(screen.getByText('equipYogaMat')).toBeInTheDocument();
  });
});
