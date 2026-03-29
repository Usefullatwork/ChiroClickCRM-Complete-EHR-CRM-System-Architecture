/**
 * EducationViewer - Detail view for a selected education material
 * Sub-component of PatientEducationLibrary
 */

export default function EducationViewer({ material, onBack, onSendToPatient }) {
  const renderContentSection = (title, items) => {
    if (!items || items.length === 0) {
      return null;
    }

    return (
      <div className="content-section">
        <h4>{title}</h4>
        {typeof items === 'string' ? (
          <p>{items}</p>
        ) : (
          <ul>
            {items.map((item, idx) => (
              <li key={idx}>
                {typeof item === 'string' ? (
                  item
                ) : (
                  <div>
                    {item.name && <strong>{item.name}:</strong>} {item.description}
                    {item.level && <span className="level-badge">{item.level}</span>}
                    {item.focus && <span className="focus-text"> | Focus: {item.focus}</span>}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  };

  return (
    <div className="material-detail-view">
      <div>
        <button className="back-button" onClick={onBack}>
          &larr; Back to Library
        </button>
        {onSendToPatient && (
          <button className="send-button" onClick={() => onSendToPatient(material)}>
            Send til pasient
          </button>
        )}
      </div>

      <div className="detail-header">
        <div className="material-category">{material.category}</div>
        <h2 className="detail-title">{material.title}</h2>
        <div className="detail-meta">
          <span className="meta-item">{material.readingLevel} niva</span>
          <span className="meta-item">{material.estimatedTime} lesetid</span>
        </div>
      </div>

      {material.content.overview && (
        <div className="overview-box">
          <h3>Oversikt</h3>
          <p>{material.content.overview}</p>
        </div>
      )}

      {renderContentSection('Hva er det?', material.content.whatIsIt)}
      {renderContentSection('Vanlige arsaker', material.content.causes)}
      {renderContentSection('Hvorfor det er viktig', material.content.whyItMatters)}
      {renderContentSection('Symptomer', material.content.symptoms)}
      {renderContentSection('Behandlingstilnaerming', material.content.treatment)}
      {renderContentSection('Egentiltak', material.content.selfCare)}
      {renderContentSection('Anbefalte ovelser', material.content.exercises)}
      {renderContentSection('Kjerneovelser', material.content.coreExercises)}
      {renderContentSection('Korsrygg-ovelser', material.content.lowerBackExercises)}
      {renderContentSection('Nakkeovelser', material.content.neckExercises)}
      {renderContentSection('Retningslinjer', material.content.guidelines)}
      {renderContentSection('PC-oppsett', material.content.computerSetup)}
      {renderContentSection('Stoloppsett', material.content.chairSetup)}
      {renderContentSection('Skrivebordoppsett', material.content.deskSetup)}
      {renderContentSection('Bevegelsespauser', material.content.movementBreaks)}
      {renderContentSection('Sittestilling', material.content.sittingPosture)}
      {renderContentSection('Staende stilling', material.content.standingPosture)}
      {renderContentSection('Sovestilling', material.content.sleepingPosture)}
      {renderContentSection('Fordeler', material.content.benefits)}
      {renderContentSection('Vanlige problemer', material.content.commonProblems)}
      {renderContentSection('Tips', material.content.tips)}
      {renderContentSection('Forebygging', material.content.prevention)}
      {renderContentSection('Sikkerhet', material.content.safety)}

      {material.content.expectedRecovery && (
        <div className="content-section">
          <h4>Forventet rehabiliteringsforlop</h4>
          <p>{material.content.expectedRecovery}</p>
        </div>
      )}

      {material.content.whenToSeek && (
        <div className="warning-box">
          <h4>Nar du bor soke umiddelbar legehjelp</h4>
          <ul>
            {material.content.whenToSeek.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
