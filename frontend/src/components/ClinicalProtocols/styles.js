/**
 * CSS styles for ClinicalProtocols
 */

export const clinicalProtocolStyles = `
  .clinical-protocols { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px; background: #f5f5f5; }
  .protocol-selector { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 15px; margin-bottom: 30px; }
  .protocol-card { background: white; border: 2px solid #e0e0e0; border-radius: 8px; padding: 20px; cursor: pointer; transition: all 0.2s; }
  .protocol-card:hover { border-color: #2196F3; box-shadow: 0 4px 12px rgba(33,150,243,0.2); transform: translateY(-2px); }
  .protocol-card.selected { border-color: #2196F3; background: #E3F2FD; }
  .protocol-card h3 { margin: 0 0 10px 0; color: #1976D2; font-size: 16px; }
  .protocol-card p { margin: 0; color: #666; font-size: 13px; line-height: 1.4; }
  .protocol-overview { background: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
  .protocol-header h2 { margin: 0 0 15px 0; color: #1976D2; font-size: 28px; }
  .diagnosis-codes { display: flex; gap: 10px; margin-bottom: 15px; }
  .code-badge { background: #E3F2FD; color: #1976D2; padding: 6px 12px; border-radius: 4px; font-size: 13px; font-weight: 600; }
  .protocol-description { color: #555; font-size: 15px; line-height: 1.6; margin: 0; }
  .red-flags-section { background: #FFEBEE; border-left: 4px solid #F44336; padding: 20px; margin: 25px 0; border-radius: 4px; }
  .red-flags-section h3 { margin: 0 0 15px 0; color: #C62828; font-size: 18px; }
  .red-flag-item { color: #333; margin-bottom: 8px; line-height: 1.5; }
  .assessment-section, .treatment-section, .exercises-section, .outcomes-section, .referral-section { margin: 30px 0; }
  .assessment-section h3, .treatment-section h3, .exercises-section h3, .outcomes-section h3, .referral-section h3 { color: #1976D2; font-size: 20px; margin-bottom: 20px; padding-bottom: 10px; border-bottom: 2px solid #e0e0e0; }
  .assessment-category { margin-bottom: 20px; }
  .assessment-category h4 { color: #666; font-size: 16px; margin-bottom: 10px; }
  .assessment-category ul { list-style-type: disc; padding-left: 25px; }
  .assessment-category li { color: #333; margin-bottom: 6px; line-height: 1.5; }
  .treatment-phase { background: #FAFAFA; border: 1px solid #e0e0e0; border-radius: 6px; padding: 20px; margin-bottom: 20px; }
  .phase-header { margin-bottom: 15px; }
  .phase-header h4 { margin: 0 0 10px 0; color: #1976D2; font-size: 18px; }
  .phase-meta { display: flex; gap: 20px; font-size: 14px; color: #666; }
  .phase-goals, .phase-interventions { margin-top: 15px; }
  .phase-goals strong, .phase-interventions strong { color: #555; font-size: 15px; }
  .phase-goals ul, .phase-interventions ul { margin-top: 8px; padding-left: 25px; }
  .phase-goals li, .phase-interventions li { color: #333; margin-bottom: 6px; line-height: 1.5; }
  .exercise-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 15px; }
  .exercise-card { background: #FAFAFA; border: 1px solid #e0e0e0; border-radius: 6px; padding: 15px; }
  .exercise-card h4 { margin: 0 0 10px 0; color: #1976D2; font-size: 16px; }
  .exercise-prescription { display: flex; gap: 15px; margin-bottom: 10px; }
  .ex-detail { background: #E3F2FD; padding: 4px 10px; border-radius: 3px; font-size: 12px; font-weight: 600; color: #1976D2; }
  .exercise-description { color: #555; font-size: 14px; line-height: 1.5; margin: 0; }
  .outcomes-section { background: #E8F5E9; border-left: 4px solid #4CAF50; padding: 20px; border-radius: 4px; }
  .outcome-item { color: #333; margin-bottom: 10px; line-height: 1.5; }
  .outcome-item strong { color: #2E7D32; }
  .referral-section { background: #FFF3E0; border-left: 4px solid #FF9800; padding: 20px; border-radius: 4px; }
  .referral-section ul { padding-left: 25px; }
  .referral-section li { color: #333; margin-bottom: 8px; line-height: 1.5; }
  .back-button { background: #2196F3; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; font-size: 14px; font-weight: 600; margin-bottom: 20px; }
  .back-button:hover { background: #1976D2; }
`;
