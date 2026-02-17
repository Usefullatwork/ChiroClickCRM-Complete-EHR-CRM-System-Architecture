/**
 * CSV Column Mapper Component
 *
 * Comprehensive CSV import tool with:
 * - File upload and parsing
 * - Auto-detection of column mappings
 * - Drag-and-drop field mapping
 * - Validation warnings for required fields
 * - Save/load mapping templates
 * - Norwegian translations
 *
 * Uses backend csvImport service for mapping detection
 */

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  Upload,
  FileSpreadsheet,
  ArrowRight,
  Check,
  X,
  AlertTriangle,
  Save,
  FolderOpen,
  RefreshCw,
  GripVertical,
  Trash2,
  Eye,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Card, CardHeader, CardBody } from '../ui/Card';
import { Alert } from '../ui/Alert';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';

// Patient field definitions with Norwegian labels
export const PATIENT_FIELDS = [
  { field: 'first_name', label: 'First Name', labelNo: 'Fornavn', required: true, group: 'basic' },
  { field: 'last_name', label: 'Last Name', labelNo: 'Etternavn', required: true, group: 'basic' },
  { field: 'email', label: 'Email', labelNo: 'E-post', required: false, group: 'contact' },
  { field: 'phone', label: 'Mobile Phone', labelNo: 'Mobil', required: false, group: 'contact' },
  {
    field: 'home_phone',
    label: 'Home Phone',
    labelNo: 'Hjemmetelefon',
    required: false,
    group: 'contact',
  },
  {
    field: 'work_phone',
    label: 'Work Phone',
    labelNo: 'Arbeidstelefon',
    required: false,
    group: 'contact',
  },
  {
    field: 'address_street',
    label: 'Street Address',
    labelNo: 'Gateadresse',
    required: false,
    group: 'address',
  },
  { field: 'address_city', label: 'City', labelNo: 'Poststed', required: false, group: 'address' },
  {
    field: 'address_postal_code',
    label: 'Postal Code',
    labelNo: 'Postnummer',
    required: false,
    group: 'address',
  },
  { field: 'country', label: 'Country', labelNo: 'Land', required: false, group: 'address' },
  {
    field: 'date_of_birth',
    label: 'Date of Birth',
    labelNo: 'Fodselsdato',
    required: false,
    group: 'personal',
  },
  { field: 'gender', label: 'Gender', labelNo: 'Kjonn', required: false, group: 'personal' },
  {
    field: 'personal_number',
    label: 'National ID',
    labelNo: 'Fodselsnummer',
    required: false,
    group: 'personal',
  },
  { field: 'notes', label: 'Notes', labelNo: 'Notater', required: false, group: 'other' },
  {
    field: 'solvit_id',
    label: 'External ID',
    labelNo: 'Ekstern ID',
    required: false,
    group: 'other',
  },
  { field: 'category', label: 'Category', labelNo: 'Kategori', required: false, group: 'other' },
  { field: 'status', label: 'Status', labelNo: 'Status', required: false, group: 'other' },
  {
    field: 'referral_source',
    label: 'Referral Source',
    labelNo: 'Henvist av',
    required: false,
    group: 'other',
  },
];

// Standard column name mappings for auto-detection
const STANDARD_MAPPINGS = {
  // First name variations
  first_name: 'first_name',
  firstname: 'first_name',
  'first name': 'first_name',
  fornavn: 'first_name',
  'given name': 'first_name',
  givenname: 'first_name',

  // Last name variations
  last_name: 'last_name',
  lastname: 'last_name',
  'last name': 'last_name',
  etternavn: 'last_name',
  'family name': 'last_name',
  familyname: 'last_name',
  surname: 'last_name',

  // Email variations
  email: 'email',
  'e-mail': 'email',
  epost: 'email',
  'e-post': 'email',
  'email address': 'email',

  // Phone variations
  phone: 'phone',
  telefon: 'phone',
  mobile: 'phone',
  mobil: 'phone',
  cell: 'phone',
  mobiltelefon: 'phone',
  'phone number': 'phone',
  phonenumber: 'phone',
  telefonnummer: 'phone',

  // Home phone
  home_phone: 'home_phone',
  'home phone': 'home_phone',
  hjemmetelefon: 'home_phone',

  // Work phone
  work_phone: 'work_phone',
  'work phone': 'work_phone',
  arbeidstelefon: 'work_phone',
  'jobb telefon': 'work_phone',

  // Address
  address: 'address_street',
  street: 'address_street',
  'street address': 'address_street',
  adresse: 'address_street',
  gateadresse: 'address_street',

  // City
  city: 'address_city',
  by: 'address_city',
  sted: 'address_city',
  poststed: 'address_city',

  // Postal code
  postal_code: 'address_postal_code',
  postalcode: 'address_postal_code',
  zip: 'address_postal_code',
  zipcode: 'address_postal_code',
  postnummer: 'address_postal_code',
  'post code': 'address_postal_code',

  // Country
  country: 'country',
  land: 'country',

  // Date of birth
  date_of_birth: 'date_of_birth',
  dateofbirth: 'date_of_birth',
  dob: 'date_of_birth',
  birthday: 'date_of_birth',
  birthdate: 'date_of_birth',
  'birth date': 'date_of_birth',
  fodselsdato: 'date_of_birth',

  // Gender
  gender: 'gender',
  sex: 'gender',
  kjonn: 'gender',

  // National ID
  national_id: 'personal_number',
  nationalid: 'personal_number',
  personal_number: 'personal_number',
  personnummer: 'personal_number',
  fodselsnummer: 'personal_number',
  fnr: 'personal_number',
  ssn: 'personal_number',

  // Notes
  notes: 'notes',
  notat: 'notes',
  notater: 'notes',
  comments: 'notes',
  kommentar: 'notes',

  // External IDs
  solvit_id: 'solvit_id',
  solvitid: 'solvit_id',
  external_id: 'solvit_id',
  externalid: 'solvit_id',
  'pasient id': 'solvit_id',

  // Category
  category: 'category',
  kategori: 'category',

  // Status
  status: 'status',
  'pasient status': 'status',

  // Referral
  referral_source: 'referral_source',
  referred_by: 'referral_source',
  henvist_av: 'referral_source',
  henvisningskilde: 'referral_source',
};

// Group definitions for better organization
const FIELD_GROUPS = {
  basic: { label: 'Basic Info', labelNo: 'Grunnleggende' },
  contact: { label: 'Contact', labelNo: 'Kontakt' },
  address: { label: 'Address', labelNo: 'Adresse' },
  personal: { label: 'Personal', labelNo: 'Personlig' },
  other: { label: 'Other', labelNo: 'Annet' },
};

// Norwegian translations
const TRANSLATIONS = {
  en: {
    title: 'CSV Column Mapper',
    subtitle: 'Map CSV columns to patient fields',
    uploadFile: 'Upload CSV File',
    dropHere: 'Drop CSV file here or click to browse',
    supportedFormats: 'Supports .csv files with comma, semicolon, or tab separators',
    preview: 'Data Preview',
    showing: 'Showing',
    of: 'of',
    rows: 'rows',
    columnMappings: 'Column Mappings',
    csvColumn: 'CSV Column',
    patientField: 'Patient Field',
    autoDetected: 'Auto-detected',
    notMapped: 'Not Mapped',
    selectField: 'Select field...',
    requiredFields: 'Required Fields',
    missingRequired: 'The following required fields are not mapped:',
    allRequiredMapped: 'All required fields are mapped',
    validation: 'Validation',
    validationWarnings: 'Validation Warnings',
    noWarnings: 'No validation warnings',
    saveTemplate: 'Save Mapping Template',
    loadTemplate: 'Load Template',
    templateName: 'Template Name',
    savedTemplates: 'Saved Templates',
    noTemplates: 'No saved templates',
    save: 'Save',
    load: 'Load',
    delete: 'Delete',
    cancel: 'Cancel',
    apply: 'Apply Mapping',
    reset: 'Reset',
    autoDetect: 'Auto-Detect',
    clearMappings: 'Clear All',
    mappedFields: 'Mapped Fields',
    unmappedColumns: 'Unmapped Columns',
    previewMapped: 'Preview Mapped Data',
    parsedRows: 'Parsed Rows',
    errors: 'Errors',
    warnings: 'Warnings',
    sampleData: 'Sample Data',
    noFile: 'No file selected',
    invalidFile: 'Invalid file format',
    parseError: 'Error parsing CSV file',
    dragDrop: 'Drag and drop to reorder',
    group: 'Group',
    required: 'Required',
    optional: 'Optional',
    close: 'Close',
  },
  no: {
    title: 'CSV Kolonnekartlegger',
    subtitle: 'Koble CSV-kolonner til pasientfelt',
    uploadFile: 'Last opp CSV-fil',
    dropHere: 'Slipp CSV-fil her eller klikk for a bla',
    supportedFormats: 'Stotter .csv-filer med komma, semikolon eller tab-separatorer',
    preview: 'Forhandsvisning',
    showing: 'Viser',
    of: 'av',
    rows: 'rader',
    columnMappings: 'Kolonnekoblinger',
    csvColumn: 'CSV-kolonne',
    patientField: 'Pasientfelt',
    autoDetected: 'Automatisk oppdaget',
    notMapped: 'Ikke koblet',
    selectField: 'Velg felt...',
    requiredFields: 'Pakrevde felt',
    missingRequired: 'Folgende pakrevde felt er ikke koblet:',
    allRequiredMapped: 'Alle pakrevde felt er koblet',
    validation: 'Validering',
    validationWarnings: 'Valideringsadvarsler',
    noWarnings: 'Ingen valideringsadvarsler',
    saveTemplate: 'Lagre Mal',
    loadTemplate: 'Last Mal',
    templateName: 'Malnavn',
    savedTemplates: 'Lagrede Maler',
    noTemplates: 'Ingen lagrede maler',
    save: 'Lagre',
    load: 'Last',
    delete: 'Slett',
    cancel: 'Avbryt',
    apply: 'Bruk Kobling',
    reset: 'Tilbakestill',
    autoDetect: 'Auto-Oppdag',
    clearMappings: 'Fjern Alle',
    mappedFields: 'Koblede Felt',
    unmappedColumns: 'Ukoblede Kolonner',
    previewMapped: 'Forhandsvis Kartlagt Data',
    parsedRows: 'Behandlede Rader',
    errors: 'Feil',
    warnings: 'Advarsler',
    sampleData: 'Eksempeldata',
    noFile: 'Ingen fil valgt',
    invalidFile: 'Ugyldig filformat',
    parseError: 'Feil ved behandling av CSV-fil',
    dragDrop: 'Dra og slipp for a omorganisere',
    group: 'Gruppe',
    required: 'Pakrevet',
    optional: 'Valgfritt',
    close: 'Lukk',
  },
};

// CSV parsing utilities
const detectDelimiter = (content) => {
  const firstLine = content.split('\n')[0];
  const delimiters = [',', ';', '\t', '|'];
  let maxCount = 0;
  let detected = ',';

  for (const delimiter of delimiters) {
    const count = (firstLine.match(new RegExp(`\\${delimiter}`, 'g')) || []).length;
    if (count > maxCount) {
      maxCount = count;
      detected = delimiter;
    }
  }

  return detected;
};

const parseCSVLine = (line, delimiter) => {
  const fields = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      fields.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  fields.push(current.trim());
  return fields;
};

const parseCSV = (content, options = {}) => {
  const { delimiter = null, hasHeader = true } = options;

  const normalizedContent = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const actualDelimiter = delimiter || detectDelimiter(normalizedContent);
  const lines = normalizedContent.split('\n').filter((line) => line.trim());

  if (lines.length === 0) {
    return { headers: [], rows: [], delimiter: actualDelimiter };
  }

  const headers = hasHeader
    ? parseCSVLine(lines[0], actualDelimiter)
    : lines[0].split(actualDelimiter).map((_, i) => `Column ${i + 1}`);

  const startIndex = hasHeader ? 1 : 0;
  const rows = [];

  for (let i = startIndex; i < lines.length; i++) {
    const values = parseCSVLine(lines[i], actualDelimiter);
    if (values.every((v) => !v)) {
      continue;
    }

    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    rows.push(row);
  }

  return {
    headers,
    rows,
    delimiter: actualDelimiter,
    rowCount: rows.length,
  };
};

const autoDetectMappings = (headers) => {
  const mappings = {};

  for (const header of headers) {
    const normalized = header.toLowerCase().trim();

    if (STANDARD_MAPPINGS[normalized]) {
      mappings[header] = STANDARD_MAPPINGS[normalized];
      continue;
    }

    for (const [key, value] of Object.entries(STANDARD_MAPPINGS)) {
      if (normalized.includes(key) || key.includes(normalized)) {
        mappings[header] = value;
        break;
      }
    }
  }

  return mappings;
};

// =============================================================================
// CSV COLUMN MAPPER COMPONENT
// =============================================================================

export default function CSVColumnMapper({
  onMappingComplete,
  onCancel,
  initialMappings = {},
  language = 'no',
  className = '',
}) {
  const [file, setFile] = useState(null);
  const [parsedData, setParsedData] = useState(null);
  const [mappings, setMappings] = useState(initialMappings);
  const [dragActive, setDragActive] = useState(false);
  const [draggedColumn, setDraggedColumn] = useState(null);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [savedTemplates, setSavedTemplates] = useState([]);
  const [errors, setErrors] = useState([]);
  const fileInputRef = useRef(null);

  const t = TRANSLATIONS[language] || TRANSLATIONS.no;

  // Load saved templates from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('csvMappingTemplates');
      if (stored) {
        setSavedTemplates(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Error loading templates:', e);
    }
  }, []);

  // Get field label based on language
  const getFieldLabel = useCallback(
    (field) => {
      const fieldDef = PATIENT_FIELDS.find((f) => f.field === field);
      if (!fieldDef) {
        return field;
      }
      return language === 'no' ? fieldDef.labelNo : fieldDef.label;
    },
    [language]
  );

  // Get group label based on language
  const getGroupLabel = useCallback(
    (group) => {
      const groupDef = FIELD_GROUPS[group];
      if (!groupDef) {
        return group;
      }
      return language === 'no' ? groupDef.labelNo : groupDef.label;
    },
    [language]
  );

  // Check which required fields are missing
  const missingRequiredFields = useMemo(() => {
    const mappedFields = new Set(Object.values(mappings));
    return PATIENT_FIELDS.filter((f) => f.required && !mappedFields.has(f.field)).map(
      (f) => f.field
    );
  }, [mappings]);

  // Group fields by category
  const groupedFields = useMemo(() => {
    const groups = {};
    PATIENT_FIELDS.forEach((field) => {
      if (!groups[field.group]) {
        groups[field.group] = [];
      }
      groups[field.group].push(field);
    });
    return groups;
  }, []);

  // Get unmapped columns
  const unmappedColumns = useMemo(() => {
    if (!parsedData) {
      return [];
    }
    return parsedData.headers.filter((header) => !mappings[header]);
  }, [parsedData, mappings]);

  // Get mapped columns
  const _mappedColumns = useMemo(() => {
    if (!parsedData) {
      return [];
    }
    return parsedData.headers.filter((header) => mappings[header]);
  }, [parsedData, mappings]);

  // Handle file drop
  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileChange = useCallback((e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  }, []);

  const handleFile = useCallback(
    (selectedFile) => {
      if (!selectedFile.name.match(/\.csv$/i)) {
        setErrors([t.invalidFile]);
        return;
      }

      setFile(selectedFile);
      setErrors([]);

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target.result;
          const parsed = parseCSV(content);
          setParsedData(parsed);

          // Auto-detect mappings
          const detectedMappings = autoDetectMappings(parsed.headers);
          setMappings((prev) => ({ ...detectedMappings, ...prev }));
        } catch (error) {
          setErrors([`${t.parseError}: ${error.message}`]);
        }
      };
      reader.readAsText(selectedFile);
    },
    [t]
  );

  // Handle column mapping change
  const handleMappingChange = useCallback((csvColumn, patientField) => {
    setMappings((prev) => {
      const newMappings = { ...prev };

      // Remove any existing mapping to this patient field
      Object.keys(newMappings).forEach((key) => {
        if (newMappings[key] === patientField) {
          delete newMappings[key];
        }
      });

      // Set new mapping
      if (patientField) {
        newMappings[csvColumn] = patientField;
      } else {
        delete newMappings[csvColumn];
      }

      return newMappings;
    });
  }, []);

  // Handle column drag start
  const handleColumnDragStart = useCallback((column) => {
    setDraggedColumn(column);
  }, []);

  // Handle drop on patient field
  const handleFieldDrop = useCallback(
    (field) => {
      if (draggedColumn) {
        handleMappingChange(draggedColumn, field);
        setDraggedColumn(null);
      }
    },
    [draggedColumn, handleMappingChange]
  );

  // Auto-detect all mappings
  const handleAutoDetect = useCallback(() => {
    if (parsedData) {
      const detected = autoDetectMappings(parsedData.headers);
      setMappings(detected);
    }
  }, [parsedData]);

  // Clear all mappings
  const handleClearMappings = useCallback(() => {
    setMappings({});
  }, []);

  // Save template
  const handleSaveTemplate = useCallback(() => {
    if (!templateName.trim()) {
      return;
    }

    const template = {
      id: Date.now().toString(),
      name: templateName,
      mappings: { ...mappings },
      createdAt: new Date().toISOString(),
    };

    const newTemplates = [...savedTemplates, template];
    setSavedTemplates(newTemplates);
    localStorage.setItem('csvMappingTemplates', JSON.stringify(newTemplates));
    setTemplateName('');
    setShowTemplateModal(false);
  }, [templateName, mappings, savedTemplates]);

  // Load template
  const handleLoadTemplate = useCallback((template) => {
    setMappings(template.mappings);
    setShowTemplateModal(false);
  }, []);

  // Delete template
  const handleDeleteTemplate = useCallback(
    (templateId) => {
      const newTemplates = savedTemplates.filter((t) => t.id !== templateId);
      setSavedTemplates(newTemplates);
      localStorage.setItem('csvMappingTemplates', JSON.stringify(newTemplates));
    },
    [savedTemplates]
  );

  // Apply mappings and parse data
  const applyMappings = useCallback(() => {
    if (!parsedData) {
      return [];
    }

    return parsedData.rows.map((row, index) => {
      const patient = { _sourceRowIndex: index + 1 };

      for (const [csvColumn, patientField] of Object.entries(mappings)) {
        if (patientField && row[csvColumn] !== undefined) {
          patient[patientField] = row[csvColumn];
        }
      }

      return patient;
    });
  }, [parsedData, mappings]);

  // Validate mapped data
  const validateMappedData = useCallback(() => {
    const mappedData = applyMappings();
    const results = { valid: [], invalid: [], warnings: [] };

    for (const patient of mappedData) {
      const patientErrors = [];
      const patientWarnings = [];

      if (!patient.first_name && !patient.last_name) {
        patientErrors.push(`Row ${patient._sourceRowIndex}: Missing name`);
      }

      if (!patient.phone && !patient.email) {
        patientWarnings.push(`Row ${patient._sourceRowIndex}: No contact info`);
      }

      if (patient.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(patient.email)) {
        patientErrors.push(`Row ${patient._sourceRowIndex}: Invalid email`);
      }

      if (patientErrors.length > 0) {
        results.invalid.push({ patient, errors: patientErrors });
      } else {
        results.valid.push(patient);
        if (patientWarnings.length > 0) {
          results.warnings.push({ patient, warnings: patientWarnings });
        }
      }
    }

    return results;
  }, [applyMappings]);

  // Handle apply button click
  const handleApply = useCallback(() => {
    const mappedData = applyMappings();
    const validation = validateMappedData();

    onMappingComplete?.({
      mappings,
      data: mappedData,
      validation,
      file: file?.name,
    });
  }, [mappings, applyMappings, validateMappedData, onMappingComplete, file]);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">{t.title}</h2>
          <p className="text-slate-500">{t.subtitle}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" icon={FolderOpen} onClick={() => setShowTemplateModal(true)}>
            {t.loadTemplate}
          </Button>
          {Object.keys(mappings).length > 0 && (
            <Button variant="secondary" icon={Save} onClick={() => setShowTemplateModal(true)}>
              {t.saveTemplate}
            </Button>
          )}
        </div>
      </div>

      {/* Error display */}
      {errors.length > 0 && (
        <Alert variant="danger" title={t.errors}>
          <ul className="list-disc list-inside">
            {errors.map((error, idx) => (
              <li key={idx}>{error}</li>
            ))}
          </ul>
        </Alert>
      )}

      {/* File Upload Area */}
      {!parsedData && (
        <Card>
          <CardBody>
            <div
              className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors cursor-pointer
                ${
                  dragActive
                    ? 'border-teal-500 bg-teal-50'
                    : 'border-slate-300 hover:border-slate-400 hover:bg-slate-50'
                }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-lg font-medium text-slate-700 mb-2">{t.dropHere}</p>
              <p className="text-sm text-slate-500 mb-4">{t.supportedFormats}</p>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".csv"
                onChange={handleFileChange}
              />
              <Button variant="secondary" icon={FileSpreadsheet}>
                {t.uploadFile}
              </Button>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Main content when file is loaded */}
      {parsedData && (
        <>
          {/* File info and actions */}
          <Card>
            <CardBody className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="w-8 h-8 text-teal-600" />
                  <div>
                    <p className="font-medium text-slate-900">{file?.name}</p>
                    <p className="text-sm text-slate-500">
                      {parsedData.rowCount} {t.rows} | {parsedData.headers.length}{' '}
                      {t.csvColumn.toLowerCase()}s
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" icon={RefreshCw} onClick={handleAutoDetect}>
                    {t.autoDetect}
                  </Button>
                  <Button variant="ghost" size="sm" icon={Trash2} onClick={handleClearMappings}>
                    {t.clearMappings}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={X}
                    onClick={() => {
                      setFile(null);
                      setParsedData(null);
                      setMappings({});
                    }}
                  >
                    {t.cancel}
                  </Button>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Data Preview */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-900">{t.preview}</h3>
                <span className="text-sm text-slate-500">
                  {t.showing} 5 {t.of} {parsedData.rowCount} {t.rows}
                </span>
              </div>
            </CardHeader>
            <CardBody className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      {parsedData.headers.map((header, idx) => (
                        <th
                          key={idx}
                          className="px-4 py-3 text-left font-medium text-slate-700 whitespace-nowrap"
                        >
                          <div className="flex items-center gap-2">
                            <span>{header}</span>
                            {mappings[header] && (
                              <span className="text-xs px-1.5 py-0.5 bg-teal-100 text-teal-700 rounded">
                                {getFieldLabel(mappings[header])}
                              </span>
                            )}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsedData.rows.slice(0, 5).map((row, rowIdx) => (
                      <tr key={rowIdx} className="hover:bg-slate-50">
                        {parsedData.headers.map((header, colIdx) => (
                          <td key={colIdx} className="px-4 py-3 text-slate-600 whitespace-nowrap">
                            {row[header] || '-'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardBody>
          </Card>

          {/* Column Mapping */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* CSV Columns */}
            <Card>
              <CardHeader>
                <h3 className="font-semibold text-slate-900">{t.csvColumn}s</h3>
                <p className="text-sm text-slate-500">{t.dragDrop}</p>
              </CardHeader>
              <CardBody className="space-y-2">
                {parsedData.headers.map((header) => (
                  <div
                    key={header}
                    draggable
                    onDragStart={() => handleColumnDragStart(header)}
                    onDragEnd={() => setDraggedColumn(null)}
                    className={`p-3 border rounded-lg cursor-move transition-colors
                      ${
                        mappings[header]
                          ? 'bg-teal-50 border-teal-200'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }
                      ${draggedColumn === header ? 'opacity-50' : ''}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <GripVertical className="w-4 h-4 text-slate-400" />
                        <span className="font-medium text-slate-700">{header}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {mappings[header] ? (
                          <>
                            <ArrowRight className="w-4 h-4 text-slate-400" />
                            <span className="text-sm text-teal-700 font-medium">
                              {getFieldLabel(mappings[header])}
                            </span>
                            <button
                              onClick={() => handleMappingChange(header, null)}
                              className="p-1 hover:bg-slate-100 rounded"
                            >
                              <X className="w-4 h-4 text-slate-400" />
                            </button>
                          </>
                        ) : (
                          <select
                            value=""
                            onChange={(e) => handleMappingChange(header, e.target.value)}
                            className="text-sm border-slate-200 rounded focus:ring-teal-500 focus:border-teal-500"
                          >
                            <option value="">{t.selectField}</option>
                            {Object.entries(groupedFields).map(([group, fields]) => (
                              <optgroup key={group} label={getGroupLabel(group)}>
                                {fields.map((field) => (
                                  <option
                                    key={field.field}
                                    value={field.field}
                                    disabled={Object.values(mappings).includes(field.field)}
                                  >
                                    {getFieldLabel(field.field)}
                                    {field.required ? ' *' : ''}
                                  </option>
                                ))}
                              </optgroup>
                            ))}
                          </select>
                        )}
                      </div>
                    </div>
                    {/* Sample data */}
                    <div className="mt-2 text-xs text-slate-500 truncate">
                      {t.sampleData}: {parsedData.rows[0]?.[header] || '-'}
                    </div>
                  </div>
                ))}
              </CardBody>
            </Card>

            {/* Patient Fields */}
            <Card>
              <CardHeader>
                <h3 className="font-semibold text-slate-900">{t.patientField}s</h3>
              </CardHeader>
              <CardBody className="space-y-4">
                {Object.entries(groupedFields).map(([group, fields]) => (
                  <div key={group}>
                    <h4 className="text-sm font-medium text-slate-500 mb-2">
                      {getGroupLabel(group)}
                    </h4>
                    <div className="space-y-1">
                      {fields.map((field) => {
                        const isMapped = Object.values(mappings).includes(field.field);
                        const mappedFromColumn = Object.keys(mappings).find(
                          (k) => mappings[k] === field.field
                        );

                        return (
                          <div
                            key={field.field}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={() => handleFieldDrop(field.field)}
                            className={`p-2 rounded-lg border transition-colors
                              ${
                                isMapped
                                  ? 'bg-teal-50 border-teal-200'
                                  : field.required
                                    ? 'bg-amber-50 border-amber-200'
                                    : 'bg-white border-slate-200'
                              }
                              ${draggedColumn && !isMapped ? 'border-dashed border-teal-400' : ''}`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {isMapped ? (
                                  <Check className="w-4 h-4 text-teal-600" />
                                ) : field.required ? (
                                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                                ) : (
                                  <div className="w-4 h-4" />
                                )}
                                <span className={`text-sm ${field.required ? 'font-medium' : ''}`}>
                                  {getFieldLabel(field.field)}
                                  {field.required && <span className="text-red-500 ml-1">*</span>}
                                </span>
                              </div>
                              {isMapped && (
                                <span className="text-xs text-slate-500">{mappedFromColumn}</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </CardBody>
            </Card>
          </div>

          {/* Validation Status */}
          <Card>
            <CardHeader>
              <h3 className="font-semibold text-slate-900">{t.validation}</h3>
            </CardHeader>
            <CardBody>
              {/* Required fields status */}
              {missingRequiredFields.length > 0 ? (
                <Alert variant="warning" title={t.missingRequired}>
                  <ul className="list-disc list-inside">
                    {missingRequiredFields.map((field) => (
                      <li key={field}>{getFieldLabel(field)}</li>
                    ))}
                  </ul>
                </Alert>
              ) : (
                <Alert variant="success">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    {t.allRequiredMapped}
                  </div>
                </Alert>
              )}

              {/* Mapping summary */}
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div className="p-4 bg-teal-50 rounded-lg">
                  <p className="text-2xl font-bold text-teal-600">{Object.keys(mappings).length}</p>
                  <p className="text-sm text-teal-700">{t.mappedFields}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg">
                  <p className="text-2xl font-bold text-slate-600">{unmappedColumns.length}</p>
                  <p className="text-sm text-slate-700">{t.unmappedColumns}</p>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Action buttons */}
          <div className="flex justify-between">
            <Button variant="secondary" onClick={onCancel}>
              {t.cancel}
            </Button>
            <div className="flex gap-2">
              <Button variant="secondary" icon={Eye} onClick={() => setShowPreviewModal(true)}>
                {t.previewMapped}
              </Button>
              <Button
                variant="primary"
                icon={Check}
                onClick={handleApply}
                disabled={missingRequiredFields.length > 0}
              >
                {t.apply}
              </Button>
            </div>
          </div>
        </>
      )}

      {/* Template Modal */}
      <Modal
        isOpen={showTemplateModal}
        onClose={() => setShowTemplateModal(false)}
        title={t.savedTemplates}
        size="md"
      >
        <div className="space-y-4">
          {/* Save new template */}
          {Object.keys(mappings).length > 0 && (
            <div className="p-4 bg-slate-50 rounded-lg">
              <h4 className="font-medium text-slate-900 mb-2">{t.saveTemplate}</h4>
              <div className="flex gap-2">
                <Input
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder={t.templateName}
                  className="flex-1"
                />
                <Button
                  variant="primary"
                  icon={Save}
                  onClick={handleSaveTemplate}
                  disabled={!templateName.trim()}
                >
                  {t.save}
                </Button>
              </div>
            </div>
          )}

          {/* Saved templates list */}
          {savedTemplates.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <FolderOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>{t.noTemplates}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {savedTemplates.map((template) => (
                <div
                  key={template.id}
                  className="flex items-center justify-between p-3 border border-slate-200 rounded-lg hover:bg-slate-50"
                >
                  <div>
                    <p className="font-medium text-slate-900">{template.name}</p>
                    <p className="text-xs text-slate-500">
                      {Object.keys(template.mappings).length} mappings |{' '}
                      {new Date(template.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleLoadTemplate(template)}
                    >
                      {t.load}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={Trash2}
                      onClick={() => handleDeleteTemplate(template.id)}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>

      {/* Preview Modal */}
      <Modal
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        title={t.previewMapped}
        size="xl"
      >
        <div className="space-y-4">
          {(() => {
            const validation = validateMappedData();
            return (
              <>
                {/* Summary */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 bg-teal-50 rounded-lg text-center">
                    <p className="text-2xl font-bold text-teal-600">{validation.valid.length}</p>
                    <p className="text-sm text-teal-700">{t.parsedRows}</p>
                  </div>
                  <div className="p-4 bg-red-50 rounded-lg text-center">
                    <p className="text-2xl font-bold text-red-600">{validation.invalid.length}</p>
                    <p className="text-sm text-red-700">{t.errors}</p>
                  </div>
                  <div className="p-4 bg-amber-50 rounded-lg text-center">
                    <p className="text-2xl font-bold text-amber-600">
                      {validation.warnings.length}
                    </p>
                    <p className="text-sm text-amber-700">{t.warnings}</p>
                  </div>
                </div>

                {/* Error list */}
                {validation.invalid.length > 0 && (
                  <Alert variant="danger" title={t.errors}>
                    <ul className="list-disc list-inside max-h-32 overflow-y-auto">
                      {validation.invalid.slice(0, 10).map((item, idx) => (
                        <li key={idx}>{item.errors.join(', ')}</li>
                      ))}
                      {validation.invalid.length > 10 && (
                        <li>...and {validation.invalid.length - 10} more</li>
                      )}
                    </ul>
                  </Alert>
                )}

                {/* Data preview table */}
                <div className="overflow-x-auto max-h-64">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium text-slate-700">Row</th>
                        {PATIENT_FIELDS.filter((f) =>
                          Object.values(mappings).includes(f.field)
                        ).map((f) => (
                          <th
                            key={f.field}
                            className="px-3 py-2 text-left font-medium text-slate-700"
                          >
                            {getFieldLabel(f.field)}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {validation.valid.slice(0, 20).map((patient, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="px-3 py-2 text-slate-500">{patient._sourceRowIndex}</td>
                          {PATIENT_FIELDS.filter((f) =>
                            Object.values(mappings).includes(f.field)
                          ).map((f) => (
                            <td key={f.field} className="px-3 py-2 text-slate-600">
                              {patient[f.field] || '-'}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            );
          })()}
        </div>
        <div className="mt-4 flex justify-end">
          <Button variant="secondary" onClick={() => setShowPreviewModal(false)}>
            {t.close}
          </Button>
        </div>
      </Modal>
    </div>
  );
}

// Export named functions for reuse
export { parseCSV, autoDetectMappings, STANDARD_MAPPINGS, TRANSLATIONS };
