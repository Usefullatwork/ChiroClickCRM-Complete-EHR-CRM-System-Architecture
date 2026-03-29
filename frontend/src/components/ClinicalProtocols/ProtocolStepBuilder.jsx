/**
 * ProtocolStepBuilder - Treatment phases, exercises, outcomes, referral
 * Sub-component of ClinicalProtocols
 */

export default function ProtocolStepBuilder({ protocol }) {
  return (
    <>
      <div className="treatment-section">
        <h3>Treatment Protocol</h3>
        {Object.entries(protocol.treatment).map(([phaseKey, phase]) => (
          <div key={phaseKey} className="treatment-phase">
            <div className="phase-header">
              <h4>{phase.name}</h4>
              <div className="phase-meta">
                <span className="frequency">{phase.frequency}</span>
                <span className="duration">{phase.duration}</span>
              </div>
            </div>
            {phase.goals && (
              <div className="phase-goals">
                <strong>Goals:</strong>
                <ul>
                  {phase.goals.map((goal, idx) => (
                    <li key={idx}>{goal}</li>
                  ))}
                </ul>
              </div>
            )}
            {phase.interventions && (
              <div className="phase-interventions">
                <strong>Interventions:</strong>
                <ul>
                  {phase.interventions.map((intervention, idx) => (
                    <li key={idx}>{intervention}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>

      {protocol.homeExercises && (
        <div className="exercises-section">
          <h3>Home Exercise Program</h3>
          <div className="exercise-grid">
            {protocol.homeExercises.map((exercise, idx) => (
              <div key={idx} className="exercise-card">
                <h4>{exercise.name}</h4>
                <div className="exercise-prescription">
                  <span className="ex-detail">
                    {exercise.sets} sets x {exercise.reps}
                  </span>
                  <span className="ex-detail">{exercise.frequency}</span>
                </div>
                <p className="exercise-description">{exercise.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {protocol.expectedOutcomes && (
        <div className="outcomes-section">
          <h3>Expected Outcomes</h3>
          {Object.entries(protocol.expectedOutcomes).map(([timepoint, outcome]) => (
            <div key={timepoint} className="outcome-item">
              <strong>{timepoint.replace(/_/g, ' ').toUpperCase()}:</strong> {outcome}
            </div>
          ))}
        </div>
      )}

      {protocol.referralCriteria && (
        <div className="referral-section">
          <h3>Referral Criteria</h3>
          <ul>
            {protocol.referralCriteria.map((criteria, idx) => (
              <li key={idx}>{criteria}</li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}
