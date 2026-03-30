/**
 * CSV Column Mapper Component (Orchestrator)
 *
 * Comprehensive CSV import tool with auto-detection, drag-and-drop mapping,
 * validation, and template management.
 *
 * Sub-components: ColumnMappingTable, PreviewPanel, MappingRules, ImportProgress
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import { Check, Eye, FolderOpen, Save } from 'lucide-react';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';

import logger from '../../utils/logger';
import { useTranslation } from '../../i18n';

import {
  PATIENT_FIELDS,
  STANDARD_MAPPINGS,
  TRANSLATIONS,
  FIELD_GROUPS,
} from './CSVColumnMapper/constants';
import { parseCSV, autoDetectMappings } from './CSVColumnMapper/csvUtils';
import ColumnMappingTable from './CSVColumnMapper/ColumnMappingTable';
import { DataPreviewTable, MappedDataPreviewContent } from './CSVColumnMapper/PreviewPanel';
import { ValidationStatus, TemplateModal } from './CSVColumnMapper/MappingRules';
import { FileUploadArea, FileInfoBar } from './CSVColumnMapper/ImportProgress';

// Re-export for backward compatibility
export { PATIENT_FIELDS };

export default function CSVColumnMapper({
  onMappingComplete,
  onCancel,
  initialMappings = {},
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

  const { t, lang: language } = useTranslation('common');

  // Load saved templates from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('csvMappingTemplates');
      if (stored) {
        setSavedTemplates(JSON.parse(stored));
      }
    } catch (e) {
      logger.error('Error loading templates:', e);
    }
  }, []);

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

  const missingRequiredFields = useMemo(() => {
    const mappedFields = new Set(Object.values(mappings));
    return PATIENT_FIELDS.filter((f) => f.required && !mappedFields.has(f.field)).map(
      (f) => f.field
    );
  }, [mappings]);

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

  const unmappedColumns = useMemo(() => {
    if (!parsedData) {
      return [];
    }
    return parsedData.headers.filter((header) => !mappings[header]);
  }, [parsedData, mappings]);

  // File handling
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
        setErrors([t('invalidFile', 'Ugyldig filformat')]);
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
          const detectedMappings = autoDetectMappings(parsed.headers);
          setMappings((prev) => ({ ...detectedMappings, ...prev }));
        } catch (error) {
          setErrors([`${t('parseError', 'Feil ved behandling av CSV-fil')}: ${error.message}`]);
        }
      };
      reader.readAsText(selectedFile);
    },
    [t]
  );

  // Mapping handlers
  const handleMappingChange = useCallback((csvColumn, patientField) => {
    setMappings((prev) => {
      const newMappings = { ...prev };
      Object.keys(newMappings).forEach((key) => {
        if (newMappings[key] === patientField) {
          delete newMappings[key];
        }
      });
      if (patientField) {
        newMappings[csvColumn] = patientField;
      } else {
        delete newMappings[csvColumn];
      }
      return newMappings;
    });
  }, []);

  const handleColumnDragStart = useCallback((column) => {
    setDraggedColumn(column);
  }, []);

  const handleFieldDrop = useCallback(
    (field) => {
      if (draggedColumn) {
        handleMappingChange(draggedColumn, field);
        setDraggedColumn(null);
      }
    },
    [draggedColumn, handleMappingChange]
  );

  const handleAutoDetect = useCallback(() => {
    if (parsedData) {
      const detected = autoDetectMappings(parsedData.headers);
      setMappings(detected);
    }
  }, [parsedData]);

  const handleClearMappings = useCallback(() => {
    setMappings({});
  }, []);

  // Template handlers
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

  const handleLoadTemplate = useCallback((template) => {
    setMappings(template.mappings);
    setShowTemplateModal(false);
  }, []);

  const handleDeleteTemplate = useCallback(
    (templateId) => {
      const newTemplates = savedTemplates.filter((tmpl) => tmpl.id !== templateId);
      setSavedTemplates(newTemplates);
      localStorage.setItem('csvMappingTemplates', JSON.stringify(newTemplates));
    },
    [savedTemplates]
  );

  // Apply and validate
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
          <h2 className="text-2xl font-bold text-slate-900">
            {t('csvTitle', 'CSV Kolonnekartlegger')}
          </h2>
          <p className="text-slate-500 dark:text-slate-400">
            {t('csvSubtitle', 'Koble CSV-kolonner til pasientfelt')}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" icon={FolderOpen} onClick={() => setShowTemplateModal(true)}>
            {t('loadTemplate', 'Last Mal')}
          </Button>
          {Object.keys(mappings).length > 0 && (
            <Button variant="secondary" icon={Save} onClick={() => setShowTemplateModal(true)}>
              {t('saveTemplate', 'Lagre Mal')}
            </Button>
          )}
        </div>
      </div>

      {/* Error display */}
      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h4 className="font-medium text-red-800 mb-2">{t('errors', 'Feil')}</h4>
          <ul className="list-disc list-inside">
            {errors.map((error, idx) => (
              <li key={idx} className="text-sm text-red-700">
                {error}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* File Upload Area */}
      {!parsedData && (
        <FileUploadArea
          dragActive={dragActive}
          handleDrag={handleDrag}
          handleDrop={handleDrop}
          handleFileChange={handleFileChange}
          t={t}
        />
      )}

      {/* Main content when file is loaded */}
      {parsedData && (
        <>
          <FileInfoBar
            file={file}
            parsedData={parsedData}
            onAutoDetect={handleAutoDetect}
            onClearMappings={handleClearMappings}
            onReset={() => {
              setFile(null);
              setParsedData(null);
              setMappings({});
            }}
            t={t}
          />

          <DataPreviewTable
            parsedData={parsedData}
            mappings={mappings}
            getFieldLabel={getFieldLabel}
            t={t}
          />

          <ColumnMappingTable
            parsedData={parsedData}
            mappings={mappings}
            groupedFields={groupedFields}
            draggedColumn={draggedColumn}
            handleColumnDragStart={handleColumnDragStart}
            setDraggedColumn={setDraggedColumn}
            handleMappingChange={handleMappingChange}
            handleFieldDrop={handleFieldDrop}
            getFieldLabel={getFieldLabel}
            getGroupLabel={getGroupLabel}
            t={t}
          />

          <ValidationStatus
            missingRequiredFields={missingRequiredFields}
            mappings={mappings}
            unmappedColumns={unmappedColumns}
            getFieldLabel={getFieldLabel}
            t={t}
          />

          {/* Action buttons */}
          <div className="flex justify-between">
            <Button variant="secondary" onClick={onCancel}>
              {t('cancel', 'Avbryt')}
            </Button>
            <div className="flex gap-2">
              <Button variant="secondary" icon={Eye} onClick={() => setShowPreviewModal(true)}>
                {t('previewMapped', 'Forhandsvis Kartlagt Data')}
              </Button>
              <Button
                variant="primary"
                icon={Check}
                onClick={handleApply}
                disabled={missingRequiredFields.length > 0}
              >
                {t('applyMapping', 'Bruk Kobling')}
              </Button>
            </div>
          </div>
        </>
      )}

      <TemplateModal
        isOpen={showTemplateModal}
        onClose={() => setShowTemplateModal(false)}
        mappings={mappings}
        templateName={templateName}
        setTemplateName={setTemplateName}
        savedTemplates={savedTemplates}
        onSave={handleSaveTemplate}
        onLoad={handleLoadTemplate}
        onDelete={handleDeleteTemplate}
        t={t}
      />

      {/* Preview Modal */}
      <Modal
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        title={t('previewMapped', 'Forhandsvis Kartlagt Data')}
        size="xl"
      >
        <MappedDataPreviewContent
          validation={validateMappedData()}
          mappings={mappings}
          getFieldLabel={getFieldLabel}
          t={t}
        />
        <div className="mt-4 flex justify-end">
          <Button variant="secondary" onClick={() => setShowPreviewModal(false)}>
            {t('close', 'Lukk')}
          </Button>
        </div>
      </Modal>
    </div>
  );
}

// Export named functions for reuse
export { parseCSV, autoDetectMappings, STANDARD_MAPPINGS, TRANSLATIONS };
