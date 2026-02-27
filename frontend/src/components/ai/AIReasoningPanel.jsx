/**
 * AIReasoningPanel
 * Collapsible panel showing Claude's extended thinking chain.
 * Displays the answer prominently and allows toggling the reasoning.
 */

import { useState } from 'react';
import { useTranslation } from '../../i18n';

export default function AIReasoningPanel({ reasoning, answer, isLoading, taskType: _taskType }) {
  const [showReasoning, setShowReasoning] = useState(false);
  const { language } = useTranslation();

  if (!reasoning && !answer && !isLoading) {
    return null;
  }

  const labels = {
    no: {
      reasoning: 'Klinisk resonnering',
      answer: 'Konklusjon',
      toggle: 'Vis resonnering',
      hide: 'Skjul resonnering',
      loading: 'Analyserer...',
    },
    en: {
      reasoning: 'Clinical Reasoning',
      answer: 'Conclusion',
      toggle: 'Show reasoning',
      hide: 'Hide reasoning',
      loading: 'Analyzing...',
    },
  };
  const l = labels[language] || labels.no;

  return (
    <div
      className="ai-reasoning-panel"
      style={{
        border: '1px solid var(--border-color, #e2e8f0)',
        borderRadius: '8px',
        padding: '16px',
        marginTop: '12px',
        backgroundColor: 'var(--bg-secondary, #f8fafc)',
      }}
    >
      {isLoading ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: 'var(--text-secondary, #64748b)',
          }}
        >
          <span
            className="spinner"
            style={{
              width: 16,
              height: 16,
              border: '2px solid currentColor',
              borderTopColor: 'transparent',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              display: 'inline-block',
            }}
          />
          {l.loading}
        </div>
      ) : (
        <>
          {answer && (
            <div style={{ marginBottom: reasoning ? '12px' : 0 }}>
              <h4
                style={{
                  margin: '0 0 8px',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: 'var(--text-primary, #1e293b)',
                }}
              >
                {l.answer}
              </h4>
              <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{answer}</div>
            </div>
          )}
          {reasoning && (
            <>
              <button
                onClick={() => setShowReasoning(!showReasoning)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-primary, #0d9488)',
                  cursor: 'pointer',
                  fontSize: '13px',
                  padding: '4px 0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <span
                  style={{
                    transform: showReasoning ? 'rotate(90deg)' : 'none',
                    transition: 'transform 0.2s',
                    display: 'inline-block',
                  }}
                >
                  &#9654;
                </span>
                {showReasoning ? l.hide : l.toggle}
              </button>
              {showReasoning && (
                <div
                  style={{
                    marginTop: '8px',
                    padding: '12px',
                    backgroundColor: 'var(--bg-tertiary, #f1f5f9)',
                    borderRadius: '6px',
                    fontSize: '13px',
                    lineHeight: 1.6,
                    whiteSpace: 'pre-wrap',
                    color: 'var(--text-secondary, #475569)',
                    borderLeft: '3px solid var(--color-primary, #0d9488)',
                  }}
                >
                  <h5 style={{ margin: '0 0 8px', fontSize: '13px', fontWeight: 600 }}>
                    {l.reasoning}
                  </h5>
                  {reasoning}
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
