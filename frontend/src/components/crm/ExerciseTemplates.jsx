import React, { useState } from 'react';
import {
  FileText, Mail, Plus, Edit, Trash2, Copy, Send, Search,
  Filter, Eye, Download, Paperclip, Check, X, Upload,
  FolderOpen, Tag, Clock, Users, ChevronRight
} from 'lucide-react';

const ExerciseTemplates = () => {
  const [activeTab, setActiveTab] = useState('templates');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [showCreateTemplate, setShowCreateTemplate] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [showSendModal, setShowSendModal] = useState(false);

  // Categories for exercises
  const categories = [
    { id: 'ALL', label: 'Alle' },
    { id: 'NECK', label: 'Nakke' },
    { id: 'BACK', label: 'Rygg' },
    { id: 'SHOULDER', label: 'Skulder' },
    { id: 'HIP', label: 'Hofte' },
    { id: 'KNEE', label: 'Kne' },
    { id: 'GENERAL', label: 'Generell' },
    { id: 'POSTURE', label: 'Holdning' },
    { id: 'STRETCH', label: 'Tøying' }
  ];

  // Mock exercise templates with PDFs
  const [templates, setTemplates] = useState([
    {
      id: 1,
      name: 'Nakkeøvelser - Grunnleggende',
      category: 'NECK',
      description: 'Grunnleggende øvelser for nakkeplager. Inkluderer tøying og styrkeøvelser.',
      subject: 'Dine øvelser for nakken',
      body: `Hei {name}!

Her er øvelsene vi snakket om under konsultasjonen. Disse øvelsene vil hjelpe deg med nakkeplagene dine.

Gjør øvelsene 2-3 ganger daglig. Start forsiktig og øk gradvis.

Ta kontakt hvis du har spørsmål!

Vennlig hilsen,
{clinic_name}`,
      attachments: [
        { name: 'nakkeovelser_grunnleggende.pdf', size: '1.2 MB', type: 'application/pdf' }
      ],
      tags: ['nakke', 'grunnleggende', 'tøying'],
      usageCount: 45,
      lastUsed: '2026-01-03',
      createdAt: '2025-06-15'
    },
    {
      id: 2,
      name: 'Ryggøvelser - Korsrygg',
      category: 'BACK',
      description: 'Øvelser for korsryggsmerter. Fokus på stabilisering og mobilitet.',
      subject: 'Øvelser for korsryggen din',
      body: `Hei {name}!

Vedlagt finner du øvelsesprogrammet for korsryggen som vi gikk gjennom.

Viktige punkter å huske:
- Start med 5 repetisjoner og øk gradvis
- Unngå smerte under øvelsene
- Gjør øvelsene daglig for best effekt

Ring gjerne hvis du har spørsmål!

Med vennlig hilsen,
{clinic_name}`,
      attachments: [
        { name: 'korsrygg_ovelser.pdf', size: '2.1 MB', type: 'application/pdf' },
        { name: 'korsrygg_illustrasjoner.pdf', size: '0.8 MB', type: 'application/pdf' }
      ],
      tags: ['rygg', 'korsrygg', 'stabilisering'],
      usageCount: 78,
      lastUsed: '2026-01-04',
      createdAt: '2025-05-20'
    },
    {
      id: 3,
      name: 'Skulderøvelser - Rotatorcuff',
      category: 'SHOULDER',
      description: 'Rehabiliteringsøvelser for rotatorcuff-problemer.',
      subject: 'Skulderøvelser - Rotatorcuff',
      body: `Hei {name}!

Her er øvelsesprogrammet for skulderen din.

Start med lette vekter (0.5-1kg) eller uten vekt. Kvalitet er viktigere enn kvantitet!

Lykke til med treningen!

{clinic_name}`,
      attachments: [
        { name: 'rotatorcuff_rehab.pdf', size: '1.8 MB', type: 'application/pdf' }
      ],
      tags: ['skulder', 'rotatorcuff', 'rehabilitering'],
      usageCount: 32,
      lastUsed: '2026-01-02',
      createdAt: '2025-08-10'
    },
    {
      id: 4,
      name: 'Holdningsøvelser - Kontor',
      category: 'POSTURE',
      description: 'Øvelser for å motvirke dårlig holdning ved kontorarbeid.',
      subject: 'Holdningsøvelser for kontorarbeid',
      body: `Hei {name}!

Her er øvelsene som kan hjelpe deg med bedre holdning på jobb.

Tips:
- Sett en påminnelse hver time for å gjøre mikropauser
- Disse øvelsene kan gjøres ved pulten din
- 2-3 minutter er nok per økt

God bedring!

{clinic_name}`,
      attachments: [
        { name: 'kontor_holdning.pdf', size: '1.5 MB', type: 'application/pdf' }
      ],
      tags: ['holdning', 'kontor', 'forebygging'],
      usageCount: 56,
      lastUsed: '2026-01-04',
      createdAt: '2025-09-05'
    },
    {
      id: 5,
      name: 'Generell Tøying - Helkropp',
      category: 'STRETCH',
      description: 'Komplett tøyingsprogram for hele kroppen.',
      subject: 'Ditt tøyingsprogram',
      body: `Hei {name}!

Vedlagt er et helhetlig tøyingsprogram som du kan bruke daglig.

Beste tid for tøying er etter at kroppen er varm, f.eks. etter en kort gåtur eller om kvelden.

Hold hver tøying i 30-60 sekunder.

Vennlig hilsen,
{clinic_name}`,
      attachments: [
        { name: 'helkropp_toying.pdf', size: '3.2 MB', type: 'application/pdf' }
      ],
      tags: ['tøying', 'helkropp', 'fleksibilitet'],
      usageCount: 89,
      lastUsed: '2026-01-05',
      createdAt: '2025-04-12'
    }
  ]);

  // Send history
  const [sendHistory] = useState([
    { id: 1, templateName: 'Nakkeøvelser - Grunnleggende', patientName: 'Erik Hansen', sentAt: '2026-01-03T14:30:00', status: 'DELIVERED' },
    { id: 2, templateName: 'Ryggøvelser - Korsrygg', patientName: 'Maria Olsen', sentAt: '2026-01-04T10:15:00', status: 'OPENED' },
    { id: 3, templateName: 'Holdningsøvelser - Kontor', patientName: 'Anders Berg', sentAt: '2026-01-04T16:45:00', status: 'SENT' },
    { id: 4, templateName: 'Generell Tøying - Helkropp', patientName: 'Kari Johansen', sentAt: '2026-01-05T09:00:00', status: 'DELIVERED' }
  ]);

  // New template state
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    category: 'GENERAL',
    description: '',
    subject: '',
    body: '',
    attachments: [],
    tags: []
  });

  // Filter templates
  const filteredTemplates = templates.filter(t => {
    const matchesCategory = selectedCategory === 'ALL' || t.category === selectedCategory;
    const matchesSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          t.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  // Stats
  const stats = {
    totalTemplates: templates.length,
    totalSent: templates.reduce((sum, t) => sum + t.usageCount, 0),
    mostUsed: templates.reduce((max, t) => t.usageCount > max.usageCount ? t : max, templates[0])
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('nb-NO');
  };

  const formatDateTime = (dateStr) => {
    return new Date(dateStr).toLocaleString('nb-NO', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Øvelsesmaler</h2>
          <p className="text-gray-600">Send øvelser med PDF-vedlegg til pasienter</p>
        </div>
        <button
          onClick={() => setShowCreateTemplate(true)}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Ny Mal
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.totalTemplates}</p>
          <p className="text-sm text-gray-600">Maler</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <Send className="w-5 h-5 text-green-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.totalSent}</p>
          <p className="text-sm text-gray-600">Sendt Totalt</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <Tag className="w-5 h-5 text-purple-600" />
            </div>
          </div>
          <p className="text-lg font-bold text-gray-900">{stats.mostUsed?.name}</p>
          <p className="text-sm text-gray-600">Mest Brukt ({stats.mostUsed?.usageCount}x)</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-200">
        {[
          { id: 'templates', label: 'Maler' },
          { id: 'history', label: 'Sendt' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'templates' && (
        <>
          {/* Filters */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex-1 min-w-64">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Søk etter mal..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3 py-1 rounded-full text-sm transition-colors ${
                      selectedCategory === cat.id
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Templates Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTemplates.map(template => (
              <div
                key={template.id}
                className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">{template.name}</h4>
                      <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                        {categories.find(c => c.id === template.category)?.label}
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{template.description}</p>

                {/* Attachments */}
                <div className="mb-3">
                  {template.attachments.map(file => (
                    <div key={file.name} className="flex items-center gap-2 text-sm text-gray-500">
                      <Paperclip className="w-3 h-3" />
                      <span className="truncate">{file.name}</span>
                      <span className="text-xs">({file.size})</span>
                    </div>
                  ))}
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1 mb-3">
                  {template.tags.map(tag => (
                    <span key={tag} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Stats */}
                <div className="flex items-center justify-between text-sm text-gray-500 mb-4 pt-3 border-t border-gray-100">
                  <span className="flex items-center gap-1">
                    <Send className="w-3 h-3" />
                    {template.usageCount} sendt
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDate(template.lastUsed)}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setSelectedTemplate(template);
                      setShowSendModal(true);
                    }}
                    className="flex-1 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center justify-center gap-1 text-sm"
                  >
                    <Send className="w-4 h-4" />
                    Send
                  </button>
                  <button
                    onClick={() => setSelectedTemplate(template)}
                    className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg">
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {activeTab === 'history' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mal</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pasient</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sendt</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sendHistory.map(item => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <span className="font-medium text-gray-900">{item.templateName}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{item.patientName}</td>
                  <td className="px-4 py-3 text-gray-600">{formatDateTime(item.sentAt)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                      item.status === 'OPENED' ? 'bg-green-100 text-green-700' :
                      item.status === 'DELIVERED' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {item.status === 'OPENED' && <Check className="w-3 h-3" />}
                      {item.status === 'OPENED' ? 'Åpnet' : item.status === 'DELIVERED' ? 'Levert' : 'Sendt'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Template Modal */}
      {showCreateTemplate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Ny Øvelsesmal</h3>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Navn</label>
                  <input
                    type="text"
                    value={newTemplate.name}
                    onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="F.eks. 'Nakkeøvelser - Avansert'"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                  <select
                    value={newTemplate.category}
                    onChange={(e) => setNewTemplate(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {categories.filter(c => c.id !== 'ALL').map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Beskrivelse</label>
                <input
                  type="text"
                  value={newTemplate.description}
                  onChange={(e) => setNewTemplate(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Kort beskrivelse av øvelsene..."
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">E-post Emne</label>
                <input
                  type="text"
                  value={newTemplate.subject}
                  onChange={(e) => setNewTemplate(prev => ({ ...prev, subject: e.target.value }))}
                  placeholder="Emne for e-posten..."
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">E-post Innhold</label>
                <textarea
                  value={newTemplate.body}
                  onChange={(e) => setNewTemplate(prev => ({ ...prev, body: e.target.value }))}
                  rows={6}
                  placeholder="Skriv e-postinnholdet her... Bruk {name} for pasientnavn."
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Tilgjengelige variabler: {'{name}'}, {'{first_name}'}, {'{clinic_name}'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">PDF Vedlegg</label>
                <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center">
                  <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-gray-500">Dra og slipp PDF-filer her, eller klikk for å velge</p>
                  <input type="file" accept=".pdf" multiple className="hidden" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tagger (kommaseparert)</label>
                <input
                  type="text"
                  placeholder="nakke, grunnleggende, tøying..."
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreateTemplate(false)}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Avbryt
              </button>
              <button
                onClick={() => setShowCreateTemplate(false)}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                Opprett Mal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Send Modal */}
      {showSendModal && selectedTemplate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Send "{selectedTemplate.name}"
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Velg Pasient</label>
                <select className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500">
                  <option>Velg pasient...</option>
                  <option>Erik Hansen</option>
                  <option>Maria Olsen</option>
                  <option>Anders Berg</option>
                  <option>Kari Johansen</option>
                </select>
              </div>

              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-700 mb-2">Vedlegg:</p>
                {selectedTemplate.attachments.map(file => (
                  <div key={file.name} className="flex items-center gap-2 text-sm">
                    <Paperclip className="w-4 h-4 text-gray-400" />
                    <span>{file.name}</span>
                    <span className="text-gray-400">({file.size})</span>
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tilleggsmelding (valgfritt)
                </label>
                <textarea
                  rows={3}
                  placeholder="Legg til en personlig melding..."
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowSendModal(false);
                  setSelectedTemplate(null);
                }}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Avbryt
              </button>
              <button
                onClick={() => {
                  setShowSendModal(false);
                  setSelectedTemplate(null);
                }}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                Send E-post
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Template Preview Modal */}
      {selectedTemplate && !showSendModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setSelectedTemplate(null)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">{selectedTemplate.name}</h3>
              <button
                onClick={() => setSelectedTemplate(null)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-700 mb-1">Emne:</p>
                <p className="text-gray-900">{selectedTemplate.subject}</p>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-700 mb-2">Innhold:</p>
                <p className="text-gray-900 whitespace-pre-wrap">{selectedTemplate.body}</p>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-700 mb-2">Vedlegg:</p>
                {selectedTemplate.attachments.map(file => (
                  <div key={file.name} className="flex items-center justify-between p-2 bg-white rounded border border-gray-200">
                    <div className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-red-500" />
                      <span>{file.name}</span>
                      <span className="text-gray-400 text-sm">({file.size})</span>
                    </div>
                    <button className="p-1 text-gray-400 hover:text-blue-500">
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setSelectedTemplate(null)}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Lukk
              </button>
              <button
                onClick={() => setShowSendModal(true)}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                Send til Pasient
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExerciseTemplates;
