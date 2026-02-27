/**
 * AIImageAnalysis
 * Drag-drop image upload with analysis type selector for clinical imaging.
 * Supports X-ray, MRI, posture, and general image analysis.
 */

import { useState, useRef, useCallback } from 'react';
import { useTranslation } from '../../i18n';

const ANALYSIS_TYPES = [
  { value: 'xray', label: { no: 'Rontgen', en: 'X-ray' } },
  { value: 'mri', label: { no: 'MR', en: 'MRI' } },
  { value: 'posture', label: { no: 'Holdning', en: 'Posture' } },
  { value: 'general', label: { no: 'Generell', en: 'General' } },
];

export default function AIImageAnalysis({ onAnalyze, isLoading, result }) {
  const [selectedType, setSelectedType] = useState('general');
  const [preview, setPreview] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);
  const { language } = useTranslation();

  const labels = {
    no: {
      title: 'Bildeanalyse',
      dropzone: 'Dra og slipp bilde her, eller klikk for a velge',
      analyze: 'Analyser bilde',
      analyzing: 'Analyserer...',
      type: 'Analysetype',
      remove: 'Fjern',
      disclaimer: 'AI-assistert analyse -- ma bekreftes av kvalifisert helsepersonell',
    },
    en: {
      title: 'Image Analysis',
      dropzone: 'Drag and drop image here, or click to select',
      analyze: 'Analyze image',
      analyzing: 'Analyzing...',
      type: 'Analysis type',
      remove: 'Remove',
      disclaimer: 'AI-assisted analysis -- must be confirmed by qualified healthcare professional',
    },
  };
  const l = labels[language] || labels.no;

  const handleFile = useCallback((file) => {
    if (!file || !file.type.startsWith('image/')) {
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview({ dataUrl: e.target.result, file, mediaType: file.type });
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer?.files?.[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile]
  );

  const handleSubmit = useCallback(() => {
    if (!preview || !onAnalyze) {
      return;
    }
    const base64 = preview.dataUrl.split(',')[1];
    onAnalyze({ base64, mediaType: preview.mediaType, analysisType: selectedType });
  }, [preview, selectedType, onAnalyze]);

  return (
    <div
      style={{
        border: '1px solid var(--border-color, #e2e8f0)',
        borderRadius: '8px',
        padding: '16px',
      }}
    >
      <h4 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: 600 }}>{l.title}</h4>

      <div style={{ marginBottom: '12px' }}>
        <label style={{ fontSize: '13px', fontWeight: 500, marginBottom: '4px', display: 'block' }}>
          {l.type}
        </label>
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          style={{
            padding: '6px 10px',
            borderRadius: '6px',
            border: '1px solid var(--border-color, #d1d5db)',
            fontSize: '13px',
            width: '100%',
          }}
        >
          {ANALYSIS_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label[language] || t.label.no}
            </option>
          ))}
        </select>
      </div>

      {!preview ? (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: `2px dashed ${dragOver ? 'var(--color-primary, #0d9488)' : 'var(--border-color, #d1d5db)'}`,
            borderRadius: '8px',
            padding: '32px 16px',
            textAlign: 'center',
            cursor: 'pointer',
            backgroundColor: dragOver ? 'var(--bg-tertiary, #f0fdfa)' : 'transparent',
            transition: 'all 0.2s',
          }}
        >
          <p style={{ margin: 0, color: 'var(--text-secondary, #64748b)', fontSize: '13px' }}>
            {l.dropzone}
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => handleFile(e.target.files?.[0])}
            style={{ display: 'none' }}
          />
        </div>
      ) : (
        <div style={{ position: 'relative', marginBottom: '12px' }}>
          <img
            src={preview.dataUrl}
            alt="Preview"
            style={{
              maxWidth: '100%',
              maxHeight: '200px',
              borderRadius: '6px',
              objectFit: 'contain',
            }}
          />
          <button
            onClick={() => setPreview(null)}
            aria-label={l.remove}
            style={{
              position: 'absolute',
              top: 4,
              right: 4,
              background: 'rgba(0,0,0,0.6)',
              color: '#fff',
              border: 'none',
              borderRadius: '50%',
              width: 24,
              height: 24,
              cursor: 'pointer',
              fontSize: '12px',
            }}
          >
            X
          </button>
        </div>
      )}

      {preview && (
        <button
          onClick={handleSubmit}
          disabled={isLoading}
          style={{
            width: '100%',
            padding: '10px',
            backgroundColor: isLoading
              ? 'var(--text-secondary, #94a3b8)'
              : 'var(--color-primary, #0d9488)',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: 500,
            cursor: isLoading ? 'not-allowed' : 'pointer',
          }}
        >
          {isLoading ? l.analyzing : l.analyze}
        </button>
      )}

      {result?.analysis && (
        <div
          style={{
            marginTop: '12px',
            padding: '12px',
            backgroundColor: 'var(--bg-secondary, #f8fafc)',
            borderRadius: '6px',
            fontSize: '13px',
            lineHeight: 1.6,
            whiteSpace: 'pre-wrap',
          }}
        >
          {result.analysis}
          <p
            style={{
              marginTop: '8px',
              fontSize: '11px',
              color: 'var(--text-tertiary, #94a3b8)',
              fontStyle: 'italic',
            }}
          >
            {l.disclaimer}
          </p>
        </div>
      )}
    </div>
  );
}
