/**
 * Lead Management Component
 *
 * Features:
 * - Lead pipeline visualization (Kanban style)
 * - Lead scoring
 * - Source tracking
 * - Conversion funnel
 * - Lead assignment
 */

import { useState, useMemo, useEffect } from 'react';
import {
  Phone,
  Mail,
  Calendar,
  Search,
  Plus,
  MoreVertical,
  MessageSquare,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { crmAPI } from '../../services/api';
import { useTranslation } from '../../i18n';
import toast from '../../utils/toast';
import logger from '../../utils/logger';

const LEAD_SOURCES = [
  { id: 'WEBSITE', labelKey: 'sourceWebsite', color: 'blue' },
  { id: 'GOOGLE_ADS', labelKey: 'sourceGoogleAds', color: 'red' },
  { id: 'FACEBOOK', labelKey: 'sourceFacebook', color: 'indigo' },
  { id: 'INSTAGRAM', labelKey: 'sourceInstagram', color: 'pink' },
  { id: 'REFERRAL', labelKey: 'sourceReferral', color: 'orange' },
  { id: 'WALK_IN', labelKey: 'sourceWalkIn', color: 'green' },
  { id: 'PHONE_CALL', labelKey: 'sourcePhoneCall', color: 'purple' },
  { id: 'OTHER', labelKey: 'sourceOther', color: 'gray' },
];

const LEAD_STAGES = [
  { id: 'NEW', labelKey: 'stageNew', color: 'blue' },
  { id: 'CONTACTED', labelKey: 'stageContacted', color: 'yellow' },
  { id: 'QUALIFIED', labelKey: 'stageQualified', color: 'purple' },
  { id: 'APPOINTMENT_BOOKED', labelKey: 'stageAppointmentBooked', color: 'indigo' },
  { id: 'SHOWED', labelKey: 'stageShowed', color: 'green' },
  { id: 'CONVERTED', labelKey: 'stageConverted', color: 'teal' },
  { id: 'LOST', labelKey: 'stageLost', color: 'red' },
];

export default function LeadManagement({ language: _language }) {
  const { t } = useTranslation('crm');
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('kanban'); // kanban, list
  const [showNewLeadForm, setShowNewLeadForm] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [filterSource, setFilterSource] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch leads from API
  useEffect(() => {
    const fetchLeads = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await crmAPI.getLeads({ source: filterSource || undefined });
        setLeads(response.data?.leads || response.data || []);
      } catch (err) {
        logger.error('Error fetching leads:', err);
        setError(err.message || 'Failed to load leads');
      } finally {
        setLoading(false);
      }
    };
    fetchLeads();
  }, [filterSource]);

  // Create new lead
  const handleCreateLead = async (leadData) => {
    try {
      const response = await crmAPI.createLead(leadData);
      setLeads((prev) => [...prev, response.data]);
      setShowNewLeadForm(false);
    } catch (err) {
      logger.error('Error creating lead:', err);
      toast.error(`Failed to create lead: ${err.message}`);
    }
  };

  // Update lead status
  const handleUpdateLead = async (leadId, updates) => {
    try {
      const response = await crmAPI.updateLead(leadId, updates);
      setLeads((prev) => prev.map((l) => (l.id === leadId ? response.data : l)));
      if (selectedLead?.id === leadId) {
        setSelectedLead(response.data);
      }
    } catch (err) {
      logger.error('Error updating lead:', err);
      toast.error(`Failed to update lead: ${err.message}`);
    }
  };

  // Convert lead to patient
  const handleConvertLead = async (leadId) => {
    try {
      await crmAPI.convertLead(leadId);
      setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, status: 'CONVERTED' } : l)));
      setSelectedLead(null);
    } catch (err) {
      logger.error('Error converting lead:', err);
      toast.error(`Failed to convert lead: ${err.message}`);
    }
  };

  // Group leads by status for Kanban view
  const leadsByStage = useMemo(() => {
    const filtered = leads.filter((lead) => {
      const matchesSource = !filterSource || lead.source === filterSource;
      const matchesSearch =
        !searchQuery ||
        `${lead.first_name} ${lead.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.phone?.includes(searchQuery);
      return matchesSource && matchesSearch;
    });

    const grouped = {};
    LEAD_STAGES.forEach((stage) => {
      grouped[stage.id] = filtered.filter((lead) => lead.status === stage.id);
    });
    return grouped;
  }, [leads, filterSource, searchQuery]);

  // Calculate conversion stats
  const stats = useMemo(() => {
    const total = leads.length;
    const converted = leads.filter((l) => l.status === 'CONVERTED').length;
    const lost = leads.filter((l) => l.status === 'LOST').length;
    const hot = leads.filter((l) => l.temperature === 'HOT').length;

    return {
      total,
      converted,
      lost,
      hot,
      conversionRate: total > 0 ? Math.round((converted / total) * 100) : 0,
    };
  }, [leads]);

  const getSourceInfo = (sourceId) =>
    LEAD_SOURCES.find((s) => s.id === sourceId) || LEAD_SOURCES[LEAD_SOURCES.length - 1];

  const handleDragStart = (e, leadId) => {
    e.dataTransfer.setData('leadId', leadId);
  };

  const handleDrop = async (e, newStatus) => {
    e.preventDefault();
    const leadId = e.dataTransfer.getData('leadId');
    // Optimistic update
    setLeads((prev) =>
      prev.map((lead) => (lead.id === leadId ? { ...lead, status: newStatus } : lead))
    );
    // Persist to API
    await handleUpdateLead(leadId, { status: newStatus });
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
        <span className="ml-2 text-gray-600 dark:text-gray-300">{t('loadingLeads')}</span>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
        <p className="text-red-700">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          {t('tryAgainLeads')}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">{t('totalLeads')}</p>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">{t('hotLeads')}</p>
          <p className="text-2xl font-bold text-red-600">{stats.hot}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">{t('convertedLabel')}</p>
          <p className="text-2xl font-bold text-green-600">{stats.converted}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">{t('conversionRateLabel')}</p>
          <p className="text-2xl font-bold text-blue-600">{stats.conversionRate}%</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-300" />
            <input
              type="text"
              placeholder={t('searchLeads')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm w-64"
            />
          </div>
          <select
            value={filterSource}
            onChange={(e) => setFilterSource(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="">{t('allSources')}</option>
            {LEAD_SOURCES.map((source) => (
              <option key={source.id} value={source.id}>
                {t(source.labelKey)}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex border border-gray-300 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-1.5 text-sm ${viewMode === 'kanban' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 dark:text-gray-300'}`}
            >
              Kanban
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 text-sm ${viewMode === 'list' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 dark:text-gray-300'}`}
            >
              Liste
            </button>
          </div>
          <button
            onClick={() => setShowNewLeadForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            <Plus className="w-4 h-4" />
            {t('newLeadBtn')}
          </button>
        </div>
      </div>

      {/* Kanban View */}
      {viewMode === 'kanban' && (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {LEAD_STAGES.slice(0, -1).map(
            (
              stage // Exclude LOST from kanban
            ) => (
              <div
                key={stage.id}
                className="flex-shrink-0 w-72"
                onDrop={(e) => handleDrop(e, stage.id)}
                onDragOver={handleDragOver}
              >
                <div className={`flex items-center gap-2 mb-3 px-2`}>
                  <span className={`w-2 h-2 rounded-full bg-${stage.color}-500`} />
                  <h3 className="font-medium text-gray-700">{t(stage.labelKey)}</h3>
                  <span className="text-sm text-gray-400 dark:text-gray-300">
                    ({leadsByStage[stage.id]?.length || 0})
                  </span>
                </div>

                <div className="space-y-3 min-h-[400px] bg-gray-50 rounded-lg p-2">
                  {leadsByStage[stage.id]?.map((lead) => (
                    <LeadCard
                      key={lead.id}
                      lead={lead}
                      onDragStart={(e) => handleDragStart(e, lead.id)}
                      onClick={() => setSelectedLead(lead)}
                    />
                  ))}

                  {leadsByStage[stage.id]?.length === 0 && (
                    <div className="text-center py-8 text-gray-400 dark:text-gray-300 text-sm">
                      {t('dragLeadsHere')}
                    </div>
                  )}
                </div>
              </div>
            )
          )}
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="bg-white rounded-lg border border-gray-200">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  {t('thName')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  {t('thContact')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  {t('sourceLabel')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  {t('thStatus')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  {t('thScore')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  {t('thFollowUp')}
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {leads.map((lead) => {
                const source = getSourceInfo(lead.source);
                const stage = LEAD_STAGES.find((s) => s.id === lead.status);

                return (
                  <tr key={lead.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-gray-900">
                          {lead.first_name} {lead.last_name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {lead.primary_interest}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm">
                        {lead.email && (
                          <p className="text-gray-600 dark:text-gray-300">{lead.email}</p>
                        )}
                        {lead.phone && (
                          <p className="text-gray-500 dark:text-gray-400">{lead.phone}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 text-xs rounded-full bg-${source.color}-100 text-${source.color}-700`}
                      >
                        {t(source.labelKey)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 text-xs rounded-full bg-${stage?.color}-100 text-${stage?.color}-700`}
                      >
                        {stage ? t(stage.labelKey) : lead.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${lead.score >= 70 ? 'bg-green-500' : lead.score >= 40 ? 'bg-yellow-500' : 'bg-red-500'}`}
                            style={{ width: `${lead.score}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                          {lead.score}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {lead.next_follow_up_date && (
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                          {new Date(lead.next_follow_up_date).toLocaleDateString('no-NO')}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button className="p-1 text-gray-400 dark:text-gray-300 hover:text-gray-600">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* New Lead Form Modal */}
      {showNewLeadForm && (
        <NewLeadForm onClose={() => setShowNewLeadForm(false)} onSave={handleCreateLead} />
      )}

      {/* Lead Detail Sidebar */}
      {selectedLead && (
        <LeadDetailSidebar
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
          onUpdate={(updates) => handleUpdateLead(selectedLead.id, updates)}
          onConvert={() => handleConvertLead(selectedLead.id)}
        />
      )}
    </div>
  );
}

function LeadCard({ lead, onDragStart, onClick }) {
  const { t } = useTranslation('crm');
  const source = LEAD_SOURCES.find((s) => s.id === lead.source);

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onClick={onClick}
      className="bg-white rounded-lg border border-gray-200 p-3 cursor-pointer hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="font-medium text-gray-900">
            {lead.first_name} {lead.last_name}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{lead.primary_interest}</p>
        </div>
        {lead.temperature === 'HOT' && (
          <span className="px-1.5 py-0.5 text-xs bg-red-100 text-red-700 rounded">HOT</span>
        )}
      </div>

      <div className="space-y-1 text-xs text-gray-500 dark:text-gray-400">
        {lead.phone && (
          <div className="flex items-center gap-1">
            <Phone className="w-3 h-3" />
            {lead.phone}
          </div>
        )}
        {lead.email && (
          <div className="flex items-center gap-1">
            <Mail className="w-3 h-3" />
            <span className="truncate">{lead.email}</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100">
        <span
          className={`px-2 py-0.5 text-xs rounded-full bg-${source?.color}-100 text-${source?.color}-700`}
        >
          {source ? t(source.labelKey) : lead.source}
        </span>
        <div className="flex items-center gap-1">
          <div className="w-8 bg-gray-200 rounded-full h-1.5">
            <div
              className={`h-1.5 rounded-full ${lead.score >= 70 ? 'bg-green-500' : lead.score >= 40 ? 'bg-yellow-500' : 'bg-red-500'}`}
              style={{ width: `${lead.score}%` }}
            />
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-400">{lead.score}</span>
        </div>
      </div>
    </div>
  );
}

function NewLeadForm({ onClose, onSave }) {
  const { t } = useTranslation('crm');
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    source: 'WEBSITE',
    primary_interest: '',
    notes: '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...form, score: 50, temperature: 'WARM' });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">{t('newLeadBtn')}</h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('firstName')} *
              </label>
              <input
                type="text"
                required
                value={form.first_name}
                onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('lastName')}
              </label>
              <input
                type="text"
                value={form.last_name}
                onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('emailAction')}
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('phone')} *</label>
              <input
                type="tel"
                required
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('sourceLabel')}
            </label>
            <select
              value={form.source}
              onChange={(e) => setForm({ ...form, source: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              {LEAD_SOURCES.map((source) => (
                <option key={source.id} value={source.id}>
                  {t(source.labelKey)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('primaryInterest')}
            </label>
            <input
              type="text"
              value={form.primary_interest}
              onChange={(e) => setForm({ ...form, primary_interest: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder={t('primaryInterestPlaceholder')}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('notesLabel')}
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800"
            >
              {t('cancelBtn')}
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              {t('saveLeadBtn')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function LeadDetailSidebar({ lead, onClose, onUpdate, onConvert }) {
  const { t } = useTranslation('crm');
  const source = LEAD_SOURCES.find((s) => s.id === lead.source);
  const stage = LEAD_STAGES.find((s) => s.id === lead.status);

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-white shadow-xl border-l border-gray-200 z-50">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
        <h2 className="font-semibold text-gray-900">{t('leadDetails')}</h2>
        <button
          onClick={onClose}
          className="p-1 text-gray-400 dark:text-gray-300 hover:text-gray-600"
        >
          <XCircle className="w-5 h-5" />
        </button>
      </div>

      <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(100vh-73px)]">
        {/* Name and Status */}
        <div>
          <h3 className="text-xl font-semibold text-gray-900">
            {lead.first_name} {lead.last_name}
          </h3>
          <div className="flex items-center gap-2 mt-2">
            <span
              className={`px-2 py-1 text-xs rounded-full bg-${stage?.color}-100 text-${stage?.color}-700`}
            >
              {stage ? t(stage.labelKey) : lead.status}
            </span>
            {lead.temperature === 'HOT' && (
              <span className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded-full">HOT</span>
            )}
          </div>
        </div>

        {/* Contact Info */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700">{t('contactInfo')}</h4>
          {lead.email && (
            <a
              href={`mailto:${lead.email}`}
              className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
            >
              <Mail className="w-4 h-4" />
              {lead.email}
            </a>
          )}
          {lead.phone && (
            <a
              href={`tel:${lead.phone}`}
              className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
            >
              <Phone className="w-4 h-4" />
              {lead.phone}
            </a>
          )}
        </div>

        {/* Lead Score */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">{t('leadScore')}</h4>
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full ${lead.score >= 70 ? 'bg-green-500' : lead.score >= 40 ? 'bg-yellow-500' : 'bg-red-500'}`}
                style={{ width: `${lead.score}%` }}
              />
            </div>
            <span className="text-lg font-semibold text-gray-900">{lead.score}</span>
          </div>
        </div>

        {/* Source and Interest */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-1">{t('sourceLabel')}</h4>
            <span
              className={`px-2 py-1 text-xs rounded-full bg-${source?.color}-100 text-${source?.color}-700`}
            >
              {source ? t(source.labelKey) : lead.source}
            </span>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-1">{t('interestLabel')}</h4>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {lead.primary_interest || '-'}
            </p>
          </div>
        </div>

        {/* Assigned To */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-1">{t('assignedTo')}</h4>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {lead.assigned_to || t('unassigned')}
          </p>
        </div>

        {/* Quick Actions */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">{t('quickActions')}</h4>
          <div className="grid grid-cols-2 gap-2">
            <button className="flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm hover:bg-blue-100">
              <Phone className="w-4 h-4" />
              {t('callAction')}
            </button>
            <button className="flex items-center justify-center gap-2 px-3 py-2 bg-green-50 text-green-700 rounded-lg text-sm hover:bg-green-100">
              <MessageSquare className="w-4 h-4" />
              {t('smsAction')}
            </button>
            <button className="flex items-center justify-center gap-2 px-3 py-2 bg-purple-50 text-purple-700 rounded-lg text-sm hover:bg-purple-100">
              <Mail className="w-4 h-4" />
              {t('emailAction')}
            </button>
            <button className="flex items-center justify-center gap-2 px-3 py-2 bg-indigo-50 text-indigo-700 rounded-lg text-sm hover:bg-indigo-100">
              <Calendar className="w-4 h-4" />
              {t('bookAppt')}
            </button>
          </div>
        </div>

        {/* Convert/Mark Lost */}
        <div className="pt-4 border-t border-gray-200 space-y-2">
          <button
            onClick={onConvert}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <CheckCircle className="w-4 h-4" />
            {t('convertToPatientBtn')}
          </button>
          <button
            onClick={() => onUpdate({ status: 'LOST' })}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50"
          >
            <XCircle className="w-4 h-4" />
            {t('markAsLost')}
          </button>
        </div>
      </div>
    </div>
  );
}
