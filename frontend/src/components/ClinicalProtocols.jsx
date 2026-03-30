import { useState } from 'react';

/**
 * Clinical Protocols and Care Plans Component (Orchestrator)
 * Sub-components: ProtocolList, ProtocolEditor, ProtocolStepBuilder
 */

import { protocols } from './ClinicalProtocols/protocolData';
import { clinicalProtocolStyles } from './ClinicalProtocols/styles';
import ProtocolList from './ClinicalProtocols/ProtocolList';
import ProtocolEditor from './ClinicalProtocols/ProtocolEditor';

const ClinicalProtocols = ({ onSelectProtocol }) => {
  const [selectedCondition, setSelectedCondition] = useState(null);

  const handleSelectProtocol = (protocol) => {
    setSelectedCondition(protocol);
    if (onSelectProtocol) {
      onSelectProtocol(protocol);
    }
  };

  return (
    <div className="clinical-protocols">
      <style>{clinicalProtocolStyles}</style>

      <h1 style={{ marginTop: 0, color: '#1976D2' }}>Evidence-Based Clinical Protocols</h1>

      {!selectedCondition ? (
        <ProtocolList protocols={protocols} onSelect={handleSelectProtocol} />
      ) : (
        <>
          <button className="back-button" onClick={() => setSelectedCondition(null)}>
            &larr; Back to Protocol List
          </button>
          <ProtocolEditor protocol={selectedCondition} onBack={() => setSelectedCondition(null)} />
        </>
      )}
    </div>
  );
};

export default ClinicalProtocols;
