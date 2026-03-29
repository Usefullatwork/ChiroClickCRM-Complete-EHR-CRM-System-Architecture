/**
 * ProtocolEditor - Detailed view of a selected protocol
 * Sub-component of ClinicalProtocols
 */

import ProtocolStepBuilder from './ProtocolStepBuilder';

export default function ProtocolEditor({ protocol, onBack }) {
  return (
    <div className="protocol-overview">
      <div className="protocol-header">
        <h2>{protocol.name}</h2>
        <div className="diagnosis-codes">
          <span className="code-badge">ICD-10: {protocol.icd10}</span>
          <span className="code-badge">ICPC-2: {protocol.icpc2}</span>
        </div>
        <p className="protocol-description">{protocol.description}</p>
      </div>

      {protocol.redFlags && (
        <div className="red-flags-section">
          <h3>Red Flags - Immediate Referral/Investigation</h3>
          <ul>
            {protocol.redFlags.map((flag, idx) => (
              <li key={idx} className="red-flag-item">
                {flag}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="assessment-section">
        <h3>Clinical Assessment</h3>
        {protocol.assessment.history && (
          <div className="assessment-category">
            <h4>History</h4>
            <ul>
              {protocol.assessment.history.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </div>
        )}
        {protocol.assessment.examination && (
          <div className="assessment-category">
            <h4>Physical Examination</h4>
            <ul>
              {protocol.assessment.examination.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </div>
        )}
        {protocol.assessment.imaging && (
          <div className="assessment-category">
            <h4>Imaging</h4>
            <ul>
              {protocol.assessment.imaging.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <ProtocolStepBuilder protocol={protocol} />
    </div>
  );
}
