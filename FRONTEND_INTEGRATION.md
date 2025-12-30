# Frontend Integration Guide - AI-Assisterte Kliniske Notater

Hvordan integrere de nye AI-funksjonene og template-systemet i frontend.

## 🎯 Oversikt

Dette dokumentet viser hvordan du bruker:
1. **Realistiske templates** fra dine kliniske notater
2. **AI-forslag** basert på treningsdata
3. **Template picker** med kategori-basert filtrering

## 📁 Relevante filer

```
frontend/src/
├── components/
│   └── TemplatePicker.jsx         # Eksisterende template picker
├── pages/
│   └── ClinicalEncounter.jsx      # Eksisterende encounter page
└── services/                       # Opprett denne mappen
    ├── aiService.js                # NY: AI API calls
    └── templateService.js          # NY: Template API calls
```

## 1️⃣ Opprett AI Service

**`frontend/src/services/aiService.js`**

```javascript
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

/**
 * AI Service - Kommunikasjon med AI-backend
 */

export const aiService = {
  /**
   * Hent SOAP-forslag basert på hovedplage
   */
  async getSoapSuggestion(chiefComplaint, section = 'objective') {
    try {
      const response = await axios.post(`${API_BASE}/ai/soap-suggestion`, {
        chiefComplaint,
        section // 'subjective', 'objective', 'assessment', 'plan'
      });
      return response.data;
    } catch (error) {
      console.error('AI SOAP suggestion error:', error);
      throw error;
    }
  },

  /**
   * Foreslå diagnosekoder basert på SOAP-data
   */
  async suggestDiagnosis(soapData) {
    try {
      const response = await axios.post(`${API_BASE}/ai/suggest-diagnosis`, {
        soapData
      });
      return response.data;
    } catch (error) {
      console.error('AI diagnosis suggestion error:', error);
      throw error;
    }
  },

  /**
   * Analyser røde flagg
   */
  async analyzeRedFlags(patientData, soapData) {
    try {
      const response = await axios.post(`${API_BASE}/ai/red-flags`, {
        patientData,
        soapData
      });
      return response.data;
    } catch (error) {
      console.error('AI red flag analysis error:', error);
      throw error;
    }
  },

  /**
   * Generer klinisk sammendrag
   */
  async generateSummary(encounter) {
    try {
      const response = await axios.post(`${API_BASE}/ai/summary`, {
        encounter
      });
      return response.data;
    } catch (error) {
      console.error('AI summary generation error:', error);
      throw error;
    }
  },

  /**
   * Lær fra behandlingsutfall
   */
  async learnFromOutcome(encounterId, outcomeData) {
    try {
      const response = await axios.post(`${API_BASE}/ai/learn`, {
        encounterId,
        outcomeData
      });
      return response.data;
    } catch (error) {
      console.error('AI learning error:', error);
      throw error;
    }
  },

  /**
   * Sjekk AI-status
   */
  async getStatus() {
    try {
      const response = await axios.get(`${API_BASE}/ai/status`);
      return response.data;
    } catch (error) {
      console.error('AI status check error:', error);
      return { available: false, error: error.message };
    }
  }
};

export default aiService;
```

## 2️⃣ Opprett Template Service

**`frontend/src/services/templateService.js`**

```javascript
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

/**
 * Template Service - Håndterer kliniske templates
 */

export const templateService = {
  /**
   * Hent alle templates
   */
  async getAll(filters = {}) {
    try {
      const params = new URLSearchParams();
      if (filters.category) params.append('category', filters.category);
      if (filters.subcategory) params.append('subcategory', filters.subcategory);
      if (filters.soapSection) params.append('soapSection', filters.soapSection);
      if (filters.search) params.append('search', filters.search);
      if (filters.favoritesOnly) params.append('favoritesOnly', 'true');

      const response = await axios.get(`${API_BASE}/templates?${params}`);
      return response.data;
    } catch (error) {
      console.error('Template fetch error:', error);
      throw error;
    }
  },

  /**
   * Hent templates gruppert etter kategori
   */
  async getByCategory() {
    try {
      const response = await axios.get(`${API_BASE}/templates/by-category`);
      return response.data;
    } catch (error) {
      console.error('Template by category error:', error);
      throw error;
    }
  },

  /**
   * Søk i templates
   */
  async search(query) {
    try {
      const response = await axios.get(`${API_BASE}/templates/search`, {
        params: { q: query }
      });
      return response.data;
    } catch (error) {
      console.error('Template search error:', error);
      throw error;
    }
  },

  /**
   * Toggle favoritt-status
   */
  async toggleFavorite(templateId) {
    try {
      const response = await axios.post(`${API_BASE}/templates/${templateId}/favorite`);
      return response.data;
    } catch (error) {
      console.error('Template favorite toggle error:', error);
      throw error;
    }
  },

  /**
   * Øk bruksteller
   */
  async incrementUsage(templateId) {
    try {
      await axios.post(`${API_BASE}/templates/${templateId}/use`);
    } catch (error) {
      console.error('Template usage increment error:', error);
    }
  },

  /**
   * Opprett ny template
   */
  async create(templateData) {
    try {
      const response = await axios.post(`${API_BASE}/templates`, templateData);
      return response.data;
    } catch (error) {
      console.error('Template creation error:', error);
      throw error;
    }
  }
};

export default templateService;
```

## 3️⃣ Forbedret ClinicalEncounter med AI

**`frontend/src/pages/ClinicalEncounter.jsx` (utvidelser)**

```javascript
import React, { useState, useEffect } from 'react';
import { aiService } from '../services/aiService';
import { templateService } from '../services/templateService';

export const ClinicalEncounter = () => {
  const [encounter, setEncounter] = useState({
    subjective: { chief_complaint: '', history: '' },
    objective: { observation: '', palpation: '', rom: '', ortho_tests: '' },
    assessment: { clinical_reasoning: '', diagnosis_codes: [] },
    plan: { treatment: '', exercises: '', advice: '', follow_up: '' }
  });

  const [aiStatus, setAiStatus] = useState({ available: false });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Sjekk AI-status ved mount
    checkAiStatus();
  }, []);

  const checkAiStatus = async () => {
    const status = await aiService.getStatus();
    setAiStatus(status);
  };

  /**
   * AI-forslag for objektive funn
   */
  const handleAiSuggestionObjective = async () => {
    if (!encounter.subjective.chief_complaint) {
      alert('Vennligst fyll ut hovedplage først');
      return;
    }

    setLoading(true);
    try {
      const { suggestion } = await aiService.getSoapSuggestion(
        encounter.subjective.chief_complaint,
        'objective'
      );

      // Sett forslag i relevante felt
      setEncounter(prev => ({
        ...prev,
        objective: {
          ...prev.objective,
          // Parser suggestion til riktig format
          observation: extractSection(suggestion, 'Inspeksjon'),
          rom: extractSection(suggestion, 'ROM'),
          palpation: extractSection(suggestion, 'Palpasjon'),
          ortho_tests: extractSection(suggestion, 'O/N')
        }
      }));
    } catch (error) {
      console.error('AI suggestion failed:', error);
      alert('AI-forslag feilet. Prøv igjen.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * AI-forslag for plan
   */
  const handleAiSuggestionPlan = async () => {
    setLoading(true);
    try {
      const { suggestion } = await aiService.getSoapSuggestion(
        encounter.subjective.chief_complaint,
        'plan'
      );

      setEncounter(prev => ({
        ...prev,
        plan: {
          ...prev.plan,
          treatment: extractSection(suggestion, 'Behandling'),
          exercises: extractSection(suggestion, 'Øvelser'),
          advice: extractSection(suggestion, 'Råd')
        }
      }));
    } catch (error) {
      console.error('AI plan suggestion failed:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * AI-forslag for diagnosekoder
   */
  const handleAiDiagnosisSuggestion = async () => {
    setLoading(true);
    try {
      const { codes, reasoning } = await aiService.suggestDiagnosis({
        subjective: encounter.subjective,
        objective: encounter.objective,
        assessment: encounter.assessment
      });

      setEncounter(prev => ({
        ...prev,
        assessment: {
          ...prev.assessment,
          diagnosis_codes: codes,
          clinical_reasoning: reasoning
        }
      }));
    } catch (error) {
      console.error('AI diagnosis suggestion failed:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Analyser røde flagg
   */
  const handleRedFlagAnalysis = async (patientData) => {
    setLoading(true);
    try {
      const analysis = await aiService.analyzeRedFlags(patientData, {
        subjective: encounter.subjective,
        objective: encounter.objective
      });

      if (analysis.riskLevel === 'CRITICAL' || analysis.riskLevel === 'HIGH') {
        // Vis advarsel
        alert(`⚠️ RØDT FLAGG DETEKTERT: ${analysis.analysis}\n\nRisikonivå: ${analysis.riskLevel}`);
      }

      return analysis;
    } catch (error) {
      console.error('Red flag analysis failed:', error);
    } finally {
      setLoading(false);
    }
  };

  // Hjelpefunksjon for å ekstrahere seksjoner fra AI-forslag
  const extractSection = (text, sectionName) => {
    const regex = new RegExp(`${sectionName}:([^]*?)(?=\\n[A-Z]|$)`, 'i');
    const match = text.match(regex);
    return match ? match[1].trim() : '';
  };

  return (
    <div className="clinical-encounter">
      {/* Subjektivt */}
      <section className="soap-section">
        <h2>Subjektivt</h2>
        <div className="form-group">
          <label>Hovedplage:</label>
          <input
            type="text"
            value={encounter.subjective.chief_complaint}
            onChange={(e) => setEncounter(prev => ({
              ...prev,
              subjective: { ...prev.subjective, chief_complaint: e.target.value }
            }))}
            placeholder="F.eks: Akutt korsryggsmerte etter løft"
          />
        </div>

        <div className="form-group">
          <label>Sykehistorie:</label>
          <textarea
            value={encounter.subjective.history}
            onChange={(e) => setEncounter(prev => ({
              ...prev,
              subjective: { ...prev.subjective, history: e.target.value }
            }))}
            rows={4}
          />
        </div>
      </section>

      {/* Objektivt med AI-knapp */}
      <section className="soap-section">
        <div className="section-header">
          <h2>Objektivt</h2>
          {aiStatus.available && (
            <button
              onClick={handleAiSuggestionObjective}
              disabled={loading || !encounter.subjective.chief_complaint}
              className="ai-button"
            >
              {loading ? '⏳ Genererer...' : '🤖 AI-forslag'}
            </button>
          )}
        </div>

        <div className="form-group">
          <label>Inspeksjon:</label>
          <textarea
            value={encounter.objective.observation}
            onChange={(e) => setEncounter(prev => ({
              ...prev,
              objective: { ...prev.objective, observation: e.target.value }
            }))}
            rows={2}
            placeholder="F.eks: Avvergestilling. Økt lumbal lordose."
          />
        </div>

        <div className="form-group">
          <label>ROM:</label>
          <textarea
            value={encounter.objective.rom}
            onChange={(e) => setEncounter(prev => ({
              ...prev,
              objective: { ...prev.objective, rom: e.target.value }
            }))}
            rows={2}
            placeholder="F.eks: Nedsatt fleksjon. Lateralfleksjon 20 gr bilat."
          />
        </div>

        <div className="form-group">
          <label>Palpasjon:</label>
          <textarea
            value={encounter.objective.palpation}
            onChange={(e) => setEncounter(prev => ({
              ...prev,
              objective: { ...prev.objective, palpation: e.target.value }
            }))}
            rows={2}
            placeholder="F.eks: Hypomob. L4/L5. Økt tonus bilat. QL, gl.med."
          />
        </div>

        <div className="form-group">
          <label>Ortopediske/Nevrologiske tester:</label>
          <textarea
            value={encounter.objective.ortho_tests}
            onChange={(e) => setEncounter(prev => ({
              ...prev,
              objective: { ...prev.objective, ortho_tests: e.target.value }
            }))}
            rows={2}
            placeholder="F.eks: (-)SLR, (+)Kemps hø side"
          />
        </div>
      </section>

      {/* Vurdering med AI-diagnosekoder */}
      <section className="soap-section">
        <div className="section-header">
          <h2>Vurdering</h2>
          {aiStatus.available && (
            <button
              onClick={handleAiDiagnosisSuggestion}
              disabled={loading}
              className="ai-button"
            >
              {loading ? '⏳ Analyserer...' : '🤖 Foreslå diagnosekoder'}
            </button>
          )}
        </div>

        <div className="form-group">
          <label>Klinisk resonnement:</label>
          <textarea
            value={encounter.assessment.clinical_reasoning}
            onChange={(e) => setEncounter(prev => ({
              ...prev,
              assessment: { ...prev.assessment, clinical_reasoning: e.target.value }
            }))}
            rows={4}
          />
        </div>

        <div className="form-group">
          <label>Diagnosekoder:</label>
          <div className="diagnosis-codes">
            {encounter.assessment.diagnosis_codes.map((code, idx) => (
              <span key={idx} className="diagnosis-code">{code}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Plan med AI-forslag */}
      <section className="soap-section">
        <div className="section-header">
          <h2>Plan</h2>
          {aiStatus.available && (
            <button
              onClick={handleAiSuggestionPlan}
              disabled={loading}
              className="ai-button"
            >
              {loading ? '⏳ Genererer...' : '🤖 AI-forslag behandling'}
            </button>
          )}
        </div>

        <div className="form-group">
          <label>Behandling:</label>
          <textarea
            value={encounter.plan.treatment}
            onChange={(e) => setEncounter(prev => ({
              ...prev,
              plan: { ...prev.plan, treatment: e.target.value }
            }))}
            rows={3}
            placeholder="F.eks: Leddjustering L5 PL, L4 PR. Trp bilat. QL, gl.med."
          />
        </div>

        <div className="form-group">
          <label>Øvelser:</label>
          <textarea
            value={encounter.plan.exercises}
            onChange={(e) => setEncounter(prev => ({
              ...prev,
              plan: { ...prev.plan, exercises: e.target.value }
            }))}
            rows={2}
            placeholder="F.eks: Katt-kamel, rotasjonsmobilisering"
          />
        </div>

        <div className="form-group">
          <label>Råd:</label>
          <textarea
            value={encounter.plan.advice}
            onChange={(e) => setEncounter(prev => ({
              ...prev,
              plan: { ...prev.plan, advice: e.target.value }
            }))}
            rows={2}
            placeholder="F.eks: Bevegelse innen smertetoleranse"
          />
        </div>
      </section>

      {/* Lagre-knapper */}
      <div className="actions">
        <button onClick={handleSave} className="btn-primary">
          Lagre konsultasjon
        </button>
        <button onClick={() => handleRedFlagAnalysis(patientData)} className="btn-secondary">
          Analyser røde flagg
        </button>
      </div>
    </div>
  );
};
```

## 4️⃣ Forbedret Template Picker

**`frontend/src/components/TemplatePicker.jsx` (utvidelser)**

```javascript
import React, { useState, useEffect } from 'react';
import { templateService } from '../services/templateService';

export const TemplatePicker = ({ onSelect, soapSection }) => {
  const [categories, setCategories] = useState({});
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadTemplates();
  }, [selectedCategory, soapSection, searchQuery, showFavoritesOnly]);

  const loadCategories = async () => {
    try {
      const data = await templateService.getByCategory();
      setCategories(data);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const loadTemplates = async () => {
    try {
      const filters = {
        category: selectedCategory,
        soapSection: soapSection,
        search: searchQuery,
        favoritesOnly: showFavoritesOnly
      };

      const data = await templateService.getAll(filters);
      setTemplates(data.templates || []);
    } catch (error) {
      console.error('Failed to load templates:', error);
    }
  };

  const handleTemplateSelect = async (template) => {
    // Øk bruksteller
    await templateService.incrementUsage(template.id);

    // Send tilbake til parent
    onSelect(template.template_text);
  };

  const handleToggleFavorite = async (e, templateId) => {
    e.stopPropagation();
    try {
      await templateService.toggleFavorite(templateId);
      loadTemplates(); // Refresh
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  };

  return (
    <div className="template-picker">
      {/* Søk og filtre */}
      <div className="template-controls">
        <input
          type="text"
          placeholder="Søk i templates..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="template-search"
        />

        <label className="favorites-toggle">
          <input
            type="checkbox"
            checked={showFavoritesOnly}
            onChange={(e) => setShowFavoritesOnly(e.target.checked)}
          />
          Kun favoritter
        </label>
      </div>

      {/* Kategori-tabs */}
      <div className="category-tabs">
        <button
          className={!selectedCategory ? 'active' : ''}
          onClick={() => setSelectedCategory(null)}
        >
          Alle
        </button>
        {Object.keys(categories).map(cat => (
          <button
            key={cat}
            className={selectedCategory === cat ? 'active' : ''}
            onClick={() => setSelectedCategory(cat)}
          >
            {cat} ({categories[cat].length})
          </button>
        ))}
      </div>

      {/* Template liste */}
      <div className="template-list">
        {templates.length === 0 ? (
          <p className="no-templates">Ingen templates funnet</p>
        ) : (
          templates.map(template => (
            <div
              key={template.id}
              className="template-item"
              onClick={() => handleTemplateSelect(template)}
            >
              <div className="template-header">
                <h4>{template.template_name}</h4>
                <button
                  className="favorite-btn"
                  onClick={(e) => handleToggleFavorite(e, template.id)}
                >
                  {template.is_favorite ? '⭐' : '☆'}
                </button>
              </div>

              <div className="template-meta">
                <span className="category">{template.category}</span>
                {template.subcategory && (
                  <span className="subcategory"> › {template.subcategory}</span>
                )}
                <span className="usage-count">Brukt {template.usage_count} ganger</span>
              </div>

              <p className="template-preview">
                {template.template_text.substring(0, 150)}...
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
```

## 5️⃣ CSS Styling

**`frontend/src/styles/ai-encounter.css`**

```css
/* AI-knapper */
.ai-button {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s ease;
}

.ai-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.ai-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* SOAP seksjoner */
.soap-section {
  background: white;
  padding: 20px;
  margin-bottom: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

/* Template picker */
.template-picker {
  background: white;
  padding: 16px;
  border-radius: 8px;
  max-height: 500px;
  overflow-y: auto;
}

.category-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.category-tabs button {
  padding: 6px 12px;
  border: 1px solid #ddd;
  background: white;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.category-tabs button.active {
  background: #667eea;
  color: white;
  border-color: #667eea;
}

.template-item {
  padding: 12px;
  border: 1px solid #eee;
  border-radius: 6px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.template-item:hover {
  background: #f8f9fa;
  border-color: #667eea;
}

.template-header {
  display: flex;
  justify-content: space-between;
  align-items: start;
}

.favorite-btn {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  padding: 0;
}

.template-meta {
  font-size: 12px;
  color: #666;
  margin: 4px 0;
}

.template-preview {
  font-size: 13px;
  color: #444;
  margin-top: 8px;
}

/* Diagnosekoder */
.diagnosis-codes {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.diagnosis-code {
  background: #e3f2fd;
  color: #1976d2;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 500;
}
```

## ✅ Testing

### 1. Test AI-status

```javascript
// I browser console
fetch('http://localhost:5000/api/v1/ai/status')
  .then(r => r.json())
  .then(console.log);
```

### 2. Test template-henting

```javascript
fetch('http://localhost:5000/api/v1/templates?category=Korsrygg')
  .then(r => r.json())
  .then(console.log);
```

### 3. Test SOAP-forslag

```javascript
fetch('http://localhost:5000/api/v1/ai/soap-suggestion', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    chiefComplaint: 'Akutt korsryggsmerte',
    section: 'objective'
  })
})
  .then(r => r.json())
  .then(console.log);
```

## 📝 Neste steg

1. **Legg til loading states** for bedre UX
2. **Implementer error handling** med brukervenlige meldinger
3. **Legg til keyboard shortcuts** for raskere workflow
4. **Implementer auto-save** av notater
5. **Legg til diff-visning** for AI-forslag vs manuelt skrevet

---

**Du har nå full integrasjon mellom frontend og AI-backend! 🎉**
