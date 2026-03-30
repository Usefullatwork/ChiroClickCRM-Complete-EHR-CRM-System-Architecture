/**
 * EducationCard - Material card in the grid
 * Sub-component of PatientEducationLibrary
 */

export default function EducationCard({ material, onClick }) {
  return (
    <div className="material-card" onClick={() => onClick(material)}>
      <div className="material-header">
        <div className="material-category">{material.category}</div>
        <h3 className="material-title">{material.title}</h3>
      </div>
      <div className="material-meta">
        <span>{material.readingLevel}</span>
        <span>{material.estimatedTime}</span>
      </div>
    </div>
  );
}
