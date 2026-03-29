/**
 * ProtocolList - Grid of protocol cards for selection
 * Sub-component of ClinicalProtocols
 */

export default function ProtocolList({ protocols, onSelect }) {
  return (
    <>
      <p style={{ color: '#666', marginBottom: '25px' }}>
        Select a condition to view the evidence-based treatment protocol and care plan.
      </p>
      <div className="protocol-selector">
        {Object.values(protocols).map((protocol) => (
          <div key={protocol.id} className="protocol-card" onClick={() => onSelect(protocol)}>
            <h3>{protocol.name}</h3>
            <p>{protocol.description}</p>
            <div style={{ marginTop: '12px', fontSize: '12px', color: '#888' }}>
              {protocol.icd10} | {protocol.icpc2}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
