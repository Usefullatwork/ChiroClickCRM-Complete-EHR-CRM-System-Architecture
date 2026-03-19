import { createContext, useContext } from 'react';

const ExamPanelContext = createContext(null);

/**
 * Provides exam panel visibility toggles and exam data to descendants.
 * Wraps the SOAPNoteForm area so ExamPanelManager can consume via context
 * instead of receiving 60+ individual props.
 */
export function ExamPanelProvider({ panels, examData, children }) {
  return (
    <ExamPanelContext.Provider value={{ panels, examData }}>{children}</ExamPanelContext.Provider>
  );
}

export function useExamPanelContext() {
  const ctx = useContext(ExamPanelContext);
  if (!ctx) {
    throw new Error('useExamPanelContext must be used within ExamPanelProvider');
  }
  return ctx;
}
