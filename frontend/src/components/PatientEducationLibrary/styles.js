/**
 * CSS styles for PatientEducationLibrary
 */

export const educationLibraryStyles = `
  .education-library {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    padding: 20px;
    background: #f5f5f5;
    min-height: 100vh;
  }
  .library-header { background: white; padding: 25px; border-radius: 8px; margin-bottom: 25px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
  .library-header h1 { margin: 0 0 10px 0; color: #1976D2; }
  .library-header p { margin: 0; color: #666; font-size: 15px; }
  .search-filter-bar { background: white; padding: 20px; border-radius: 8px; margin-bottom: 25px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
  .search-input { width: 100%; padding: 12px 15px; border: 2px solid #e0e0e0; border-radius: 6px; font-size: 15px; margin-bottom: 15px; transition: border-color 0.2s; }
  .search-input:focus { outline: none; border-color: #2196F3; }
  .category-filters { display: flex; gap: 10px; flex-wrap: wrap; }
  .category-btn { padding: 8px 16px; background: #FAFAFA; border: 2px solid #e0e0e0; border-radius: 20px; cursor: pointer; font-size: 14px; font-weight: 500; color: #666; transition: all 0.2s; }
  .category-btn:hover { background: #E3F2FD; border-color: #2196F3; color: #2196F3; }
  .category-btn.active { background: #2196F3; border-color: #2196F3; color: white; }
  .materials-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 20px; margin-bottom: 30px; }
  .material-card { background: white; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; cursor: pointer; transition: all 0.2s; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
  .material-card:hover { box-shadow: 0 6px 16px rgba(0,0,0,0.12); transform: translateY(-2px); border-color: #2196F3; }
  .material-header { margin-bottom: 12px; }
  .material-category { background: #E3F2FD; color: #1976D2; padding: 4px 10px; border-radius: 3px; font-size: 12px; font-weight: 600; display: inline-block; margin-bottom: 8px; }
  .material-title { font-size: 18px; font-weight: 600; color: #333; margin: 0 0 10px 0; }
  .material-meta { display: flex; gap: 15px; font-size: 13px; color: #666; }
  .material-detail-view { background: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
  .detail-header { margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #e0e0e0; }
  .detail-title { font-size: 32px; color: #1976D2; margin: 0 0 10px 0; }
  .detail-meta { display: flex; gap: 20px; margin-top: 15px; }
  .meta-item { display: flex; align-items: center; gap: 8px; color: #666; font-size: 14px; }
  .back-button { background: #2196F3; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer; font-size: 15px; font-weight: 600; margin-bottom: 20px; display: inline-flex; align-items: center; gap: 8px; }
  .back-button:hover { background: #1976D2; }
  .send-button { background: #4CAF50; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer; font-size: 15px; font-weight: 600; margin-left: 10px; }
  .send-button:hover { background: #45a049; }
  .overview-box { background: #E8F5E9; border-left: 4px solid #4CAF50; padding: 20px; border-radius: 4px; margin-bottom: 30px; }
  .overview-box h3 { margin: 0 0 10px 0; color: #2E7D32; font-size: 18px; }
  .overview-box p { margin: 0; color: #333; line-height: 1.6; }
  .content-section { margin-bottom: 30px; }
  .content-section h4 { color: #1976D2; font-size: 20px; margin-bottom: 15px; padding-bottom: 8px; border-bottom: 1px solid #e0e0e0; }
  .content-section ul, .content-section ol { padding-left: 25px; }
  .content-section li { margin-bottom: 10px; line-height: 1.6; color: #333; }
  .content-section p { color: #333; line-height: 1.6; margin-bottom: 10px; }
  .level-badge { background: #FFF3E0; color: #E65100; padding: 2px 8px; border-radius: 3px; font-size: 11px; font-weight: 600; margin-left: 8px; }
  .focus-text { color: #666; font-size: 13px; font-style: italic; }
  .warning-box { background: #FFEBEE; border-left: 4px solid #F44336; padding: 15px 20px; border-radius: 4px; margin-top: 30px; }
  .warning-box h4 { color: #C62828; margin: 0 0 10px 0; font-size: 16px; }
  .no-results { text-align: center; padding: 60px 20px; color: #999; }
`;
