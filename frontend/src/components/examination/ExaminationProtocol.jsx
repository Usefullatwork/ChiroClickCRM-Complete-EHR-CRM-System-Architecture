/**
 * ExaminationProtocol Component
 *
 * Comprehensive clinical examination interface with standardized protocols
 * for each body region. Supports Norwegian and English labels.
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  Info,
  Clipboard,
  FileText
} from 'lucide-react';
import { EXAMINATION_REGIONS, SEVERITY } from '../../data/examinationProtocols';

// Region icons mapping
const REGION_ICONS = {
  cervical: '🦴',
  lumbar: '🦴',
  shoulder: '💪',
  hip: '🦵',
  knee: '🦵',
  ankle: '🦶',
  tmj: '😬'
};

/**
 * Individual examination item renderer
 */
function ExaminationItem({ item, value, onChange, lang = 'no', readOnly = false }) {
  const label = lang === 'no' ? item.label : (item.labelEn || item.label);

  const renderInput = () => {
    switch (item.type) {
      case 'checkbox':
        return (
          <label className={`flex items-center gap-2 ${readOnly ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
            <input
              type="checkbox"
              checked={value || false}
              onChange={(e) => onChange(item.id, e.target.checked)}
              disabled={readOnly}
              className="w-4 h-4 text-teal-600 rounded border-gray-300 focus:ring-teal-500 disabled:opacity-50"
            />
            <span className={`text-sm ${item.redFlag ? 'text-red-600 font-medium' : 'text-gray-700'}`}>
              {label}
              {item.redFlag && <AlertTriangle className="inline w-3 h-3 ml-1 text-red-500" />}
            </span>
          </label>
        );

      case 'select':
        return (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-700 min-w-[120px]">{label}:</span>
            <select
              value={value || ''}
              onChange={(e) => onChange(item.id, e.target.value)}
              disabled={readOnly}
              className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded-md
                        focus:ring-1 focus:ring-teal-500 focus:border-teal-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">-- Velg --</option>
              {item.options.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
        );

      case 'test':
        return (
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-700 min-w-[180px]">{label}:</span>
              <select
                value={value || ''}
                onChange={(e) => onChange(item.id, e.target.value)}
                disabled={readOnly}
                className={`flex-1 px-2 py-1 text-sm border rounded-md focus:ring-1 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed
                          ${value && value !== 'Negativ' ? 'border-amber-400 bg-amber-50' : 'border-gray-300'}`}
              >
                <option value="">-- Velg --</option>
                {item.options.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
              {item.redFlag && value && value !== 'Negativ' && (
                <AlertTriangle className="w-4 h-4 text-red-500" />
              )}
            </div>
            {item.interpretation && value && value !== 'Negativ' && (
              <p className="text-xs text-gray-500 ml-[188px] italic">
                → {item.interpretation}
              </p>
            )}
          </div>
        );

      case 'rom':
        return (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-700 min-w-[120px]">{label}:</span>
            <input
              type="number"
              value={value || ''}
              onChange={(e) => onChange(item.id, e.target.value)}
              disabled={readOnly}
              className={`w-16 px-2 py-1 text-sm border rounded-md text-center
                        focus:ring-1 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed
                        ${value && item.normal && parseInt(value) < item.normal * 0.7
                          ? 'border-amber-400 bg-amber-50'
                          : 'border-gray-300'}`}
              placeholder="°"
            />
            <span className="text-xs text-gray-400">/ {item.normal}° normal</span>
            {value && item.normal && parseInt(value) < item.normal * 0.7 && (
              <span className="text-xs text-amber-600">Redusert</span>
            )}
          </div>
        );

      case 'measurement':
        return (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-700 min-w-[120px]">{label}:</span>
            <input
              type="text"
              value={value || ''}
              onChange={(e) => onChange(item.id, e.target.value)}
              disabled={readOnly}
              className="w-20 px-2 py-1 text-sm border border-gray-300 rounded-md
                        focus:ring-1 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder={item.unit}
            />
            <span className="text-xs text-gray-400">{item.unit}</span>
            {item.normal && (
              <span className="text-xs text-gray-400">(normal: {item.normal})</span>
            )}
          </div>
        );

      case 'score':
        return (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-700 min-w-[180px]">{label}:</span>
            <input
              type="number"
              min="0"
              max={item.max}
              value={value || ''}
              onChange={(e) => onChange(item.id, e.target.value)}
              disabled={readOnly}
              className="w-16 px-2 py-1 text-sm border border-gray-300 rounded-md text-center disabled:opacity-50 disabled:cursor-not-allowed
                        focus:ring-1 focus:ring-teal-500"
            />
            <span className="text-xs text-gray-400">/ {item.max}</span>
            {item.interpretation && (
              <span className="text-xs text-gray-500">({item.interpretation})</span>
            )}
          </div>
        );

      case 'text':
        return (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-700 min-w-[120px]">{label}:</span>
            <input
              type="text"
              value={value || ''}
              onChange={(e) => onChange(item.id, e.target.value)}
              disabled={readOnly}
              className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded-md
                        focus:ring-1 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="Beskriv..."
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="py-1">
      {renderInput()}
    </div>
  );
}

/**
 * Examination section (group of items)
 */
function ExaminationSection({ section, values, onChange, lang = 'no', readOnly = false }) {
  const [expanded, setExpanded] = useState(true);
  const title = lang === 'no' ? section.title : (section.titleEn || section.title);

  // Calculate if alert condition is met
  const alertTriggered = useMemo(() => {
    if (!section.alert) return false;

    const positiveCount = section.items.filter(item => {
      const val = values[item.id];
      if (item.type === 'checkbox') return val === true;
      if (item.type === 'test') return val && val !== 'Negativ';
      return false;
    }).length;

    return positiveCount >= section.alert.condition;
  }, [section, values]);

  return (
    <div className={`border rounded-lg mb-2 ${alertTriggered ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className={`w-full px-3 py-2 flex items-center justify-between text-left
                   ${alertTriggered ? 'bg-red-100' : 'bg-gray-50'} rounded-t-lg`}
      >
        <div className="flex items-center gap-2">
          {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          <span className={`font-medium text-sm ${section.redFlag ? 'text-red-700' : 'text-gray-700'}`}>
            {title}
          </span>
          {section.redFlag && <AlertTriangle className="w-4 h-4 text-red-500" />}
        </div>
        {alertTriggered && section.alert && (
          <span className="text-xs font-medium text-red-600 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {lang === 'no' ? section.alert.message : section.alert.messageEn}
          </span>
        )}
      </button>

      {expanded && (
        <div className="px-3 py-2 space-y-1">
          {section.items.map((item) => (
            <ExaminationItem
              key={item.id}
              item={item}
              value={values[item.id]}
              onChange={onChange}
              lang={lang}
              readOnly={readOnly}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Main ExaminationProtocol component
 */
export default function ExaminationProtocol({
  selectedRegion = null,
  onRegionChange,
  values = {},
  onChange,
  lang = 'no',
  readOnly = false,
  onGenerateNarrative
}) {
  const [activeRegion, setActiveRegion] = useState(selectedRegion);

  const handleRegionSelect = (regionId) => {
    setActiveRegion(regionId);
    if (onRegionChange) onRegionChange(regionId);
  };

  const handleItemChange = useCallback((itemId, value) => {
    if (onChange) {
      onChange({
        ...values,
        [activeRegion]: {
          ...(values[activeRegion] || {}),
          [itemId]: value
        }
      });
    }
  }, [activeRegion, values, onChange]);

  const currentRegion = activeRegion ? EXAMINATION_REGIONS[activeRegion] : null;
  const currentValues = values[activeRegion] || {};

  // Count findings
  const findingsCount = useMemo(() => {
    if (!currentValues) return 0;
    return Object.values(currentValues).filter(v =>
      v === true || (typeof v === 'string' && v && v !== 'Negativ' && v !== '')
    ).length;
  }, [currentValues]);

  // Generate narrative from findings
  const generateNarrative = useCallback(() => {
    if (!currentRegion || !currentValues) return '';

    const findings = [];
    const regionName = lang === 'no' ? currentRegion.name : currentRegion.nameEn;

    currentRegion.sections.forEach(section => {
      const sectionFindings = [];
      section.items.forEach(item => {
        const val = currentValues[item.id];
        if (!val || val === 'Negativ' || val === '') return;

        const label = lang === 'no' ? item.label : (item.labelEn || item.label);

        if (item.type === 'checkbox' && val === true) {
          sectionFindings.push(label);
        } else if (item.type === 'test' && val !== 'Negativ') {
          sectionFindings.push(`${label}: ${val}`);
        } else if (item.type === 'rom' && val) {
          const status = item.normal && parseInt(val) < item.normal * 0.7 ? ' (redusert)' : '';
          sectionFindings.push(`${label}: ${val}°${status}`);
        } else if (val) {
          sectionFindings.push(`${label}: ${val}`);
        }
      });

      if (sectionFindings.length > 0) {
        const sectionTitle = lang === 'no' ? section.title : (section.titleEn || section.title);
        findings.push(`${sectionTitle}: ${sectionFindings.join(', ')}`);
      }
    });

    if (findings.length === 0) {
      return `${regionName}: Undersøkelse ua.`;
    }

    return `${regionName}:\n${findings.join('.\n')}.`;
  }, [currentRegion, currentValues, lang]);

  const handleGenerateNarrative = () => {
    const narrative = generateNarrative();
    if (onGenerateNarrative) {
      onGenerateNarrative(narrative);
    }
  };

  return (
    <div className="flex h-full">
      {/* Region selector sidebar */}
      <div className="w-48 border-r border-gray-200 bg-gray-50 p-2">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 px-2">
          {lang === 'no' ? 'Kroppsregion' : 'Body Region'}
        </h3>
        <div className="space-y-1">
          {Object.entries(EXAMINATION_REGIONS).map(([key, region]) => {
            const regionValues = values[key] || {};
            const hasFindings = Object.keys(regionValues).length > 0;

            return (
              <button
                key={key}
                onClick={() => handleRegionSelect(key)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors
                          flex items-center justify-between
                          ${activeRegion === key
                            ? 'bg-teal-100 text-teal-700 font-medium'
                            : 'text-gray-600 hover:bg-gray-100'}`}
              >
                <span className="flex items-center gap-2">
                  <span>{REGION_ICONS[key] || '📋'}</span>
                  <span>{lang === 'no' ? region.name : region.nameEn}</span>
                </span>
                {hasFindings && (
                  <CheckCircle className="w-4 h-4 text-teal-500" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Examination content */}
      <div className="flex-1 overflow-auto">
        {currentRegion ? (
          <div className="p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-800">
                  {REGION_ICONS[activeRegion]} {lang === 'no' ? currentRegion.name : currentRegion.nameEn}
                </h2>
                {findingsCount > 0 && (
                  <p className="text-sm text-gray-500">
                    {findingsCount} {lang === 'no' ? 'funn registrert' : 'findings recorded'}
                  </p>
                )}
              </div>
              <button
                onClick={handleGenerateNarrative}
                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-teal-600 text-white
                          rounded-lg hover:bg-teal-700 transition-colors"
              >
                <FileText className="w-4 h-4" />
                {lang === 'no' ? 'Generer tekst' : 'Generate text'}
              </button>
            </div>

            {/* Red flags warning */}
            {currentRegion.redFlags && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-red-700 text-sm">
                      {lang === 'no' ? 'Røde flagg' : 'Red Flags'}
                    </h4>
                    <ul className="text-xs text-red-600 mt-1 space-y-0.5">
                      {currentRegion.redFlags.map((flag, idx) => (
                        <li key={idx}>• {flag.pattern}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Ottawa rules for ankle */}
            {currentRegion.ottawaRules && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <Info className="w-5 h-5 text-blue-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-700 text-sm">
                      {lang === 'no' ? currentRegion.ottawaRules.title : currentRegion.ottawaRules.titleEn}
                    </h4>
                    <div className="text-xs text-blue-600 mt-1 space-y-2">
                      <div>
                        <strong>{lang === 'no' ? 'Røntgen ankel:' : 'Ankle X-ray:'}</strong>
                        <ul className="ml-2">
                          {currentRegion.ottawaRules.ankleXray.map((rule, idx) => (
                            <li key={idx}>• {rule}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <strong>{lang === 'no' ? 'Røntgen fot:' : 'Foot X-ray:'}</strong>
                        <ul className="ml-2">
                          {currentRegion.ottawaRules.footXray.map((rule, idx) => (
                            <li key={idx}>• {rule}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Examination sections */}
            {currentRegion.sections.map((section) => (
              <ExaminationSection
                key={section.id}
                section={section}
                values={currentValues}
                onChange={handleItemChange}
                lang={lang}
                readOnly={readOnly}
              />
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            <div className="text-center">
              <Clipboard className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>{lang === 'no' ? 'Velg en kroppsregion for å starte undersøkelsen' : 'Select a body region to start examination'}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
