import React, { useState } from 'react';
import {
  Send, Mail, MessageSquare, BarChart2, TrendingUp, Users,
  Plus, Calendar, Clock, CheckCircle, XCircle, Edit, Trash2,
  Eye, Copy, Play, Pause, Target, MousePointer, UserPlus
} from 'lucide-react';

const CampaignManager = () => {
  const [activeTab, setActiveTab] = useState('active');
  const [showNewCampaign, setShowNewCampaign] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);

  // Campaign types
  const campaignTypes = [
    { id: 'NEWSLETTER', label: 'Nyhetsbrev', icon: Mail },
    { id: 'PROMOTION', label: 'Kampanje', icon: Target },
    { id: 'REACTIVATION', label: 'Reaktivering', icon: UserPlus },
    { id: 'REMINDER', label: 'Påminnelse', icon: Clock },
    { id: 'BIRTHDAY', label: 'Bursdag', icon: Calendar },
    { id: 'SURVEY', label: 'Undersøkelse', icon: BarChart2 }
  ];

  // Mock campaigns data
  const [campaigns] = useState([
    {
      id: 1,
      name: 'Januar Nyhetsbrev',
      type: 'NEWSLETTER',
      channel: 'EMAIL',
      status: 'ACTIVE',
      audience: 'Alle aktive pasienter',
      audienceSize: 156,
      scheduledAt: '2026-01-15T10:00:00',
      sent: 0,
      delivered: 0,
      opened: 0,
      clicked: 0,
      converted: 0,
      createdAt: '2026-01-03'
    },
    {
      id: 2,
      name: 'Reaktiveringskampanje Q1',
      type: 'REACTIVATION',
      channel: 'EMAIL',
      status: 'COMPLETED',
      audience: 'Inaktive pasienter (90+ dager)',
      audienceSize: 45,
      scheduledAt: null,
      sent: 45,
      delivered: 42,
      opened: 28,
      clicked: 12,
      converted: 5,
      createdAt: '2025-12-01',
      completedAt: '2025-12-15'
    },
    {
      id: 3,
      name: 'Timepåminnelse',
      type: 'REMINDER',
      channel: 'SMS',
      status: 'ACTIVE',
      audience: 'Automatisk - 24t før time',
      audienceSize: null,
      scheduledAt: null,
      sent: 420,
      delivered: 415,
      opened: null,
      clicked: null,
      converted: 385,
      createdAt: '2025-06-01',
      isAutomated: true
    },
    {
      id: 4,
      name: 'Bursdagshilsen',
      type: 'BIRTHDAY',
      channel: 'EMAIL',
      status: 'ACTIVE',
      audience: 'Automatisk - på bursdag',
      audienceSize: null,
      scheduledAt: null,
      sent: 89,
      delivered: 87,
      opened: 72,
      clicked: 35,
      converted: 15,
      createdAt: '2025-01-01',
      isAutomated: true
    },
    {
      id: 5,
      name: 'Vinterrabatt 2025',
      type: 'PROMOTION',
      channel: 'EMAIL',
      status: 'DRAFT',
      audience: 'Alle pasienter',
      audienceSize: 234,
      scheduledAt: null,
      sent: 0,
      delivered: 0,
      opened: 0,
      clicked: 0,
      converted: 0,
      createdAt: '2026-01-04'
    }
  ]);

  // Status configurations
  const statusConfig = {
    DRAFT: { label: 'Utkast', color: 'bg-gray-100 text-gray-700' },
    SCHEDULED: { label: 'Planlagt', color: 'bg-blue-100 text-blue-700' },
    ACTIVE: { label: 'Aktiv', color: 'bg-green-100 text-green-700' },
    PAUSED: { label: 'Pauset', color: 'bg-yellow-100 text-yellow-700' },
    COMPLETED: { label: 'Fullført', color: 'bg-purple-100 text-purple-700' }
  };

  // Calculate metrics
  const getMetrics = (campaign) => {
    if (campaign.sent === 0) return null;
    return {
      deliveryRate: Math.round((campaign.delivered / campaign.sent) * 100),
      openRate: campaign.opened !== null ? Math.round((campaign.opened / campaign.delivered) * 100) : null,
      clickRate: campaign.clicked !== null ? Math.round((campaign.clicked / campaign.opened) * 100) : null,
      conversionRate: Math.round((campaign.converted / campaign.sent) * 100)
    };
  };

  // Overall stats
  const overallStats = {
    totalSent: campaigns.reduce((sum, c) => sum + c.sent, 0),
    avgOpenRate: 62,
    avgClickRate: 28,
    avgConversionRate: 8
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('nb-NO', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('nb-NO', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Filter campaigns by tab
  const filteredCampaigns = campaigns.filter(c => {
    if (activeTab === 'active') return c.status === 'ACTIVE' || c.status === 'SCHEDULED';
    if (activeTab === 'draft') return c.status === 'DRAFT';
    if (activeTab === 'completed') return c.status === 'COMPLETED';
    if (activeTab === 'automated') return c.isAutomated;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Kampanjer</h2>
          <p className="text-gray-600">Opprett og administrer markedsføringskampanjer</p>
        </div>
        <button
          onClick={() => setShowNewCampaign(true)}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Ny Kampanje
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Send className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{overallStats.totalSent.toLocaleString('nb-NO')}</p>
          <p className="text-sm text-gray-600">Totalt Sendt</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <Eye className="w-5 h-5 text-green-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{overallStats.avgOpenRate}%</p>
          <p className="text-sm text-gray-600">Gj.snitt Åpningsrate</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <MousePointer className="w-5 h-5 text-purple-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{overallStats.avgClickRate}%</p>
          <p className="text-sm text-gray-600">Gj.snitt Klikkrate</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-orange-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{overallStats.avgConversionRate}%</p>
          <p className="text-sm text-gray-600">Gj.snitt Konvertering</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-200">
        {[
          { id: 'active', label: 'Aktive', count: campaigns.filter(c => c.status === 'ACTIVE' || c.status === 'SCHEDULED').length },
          { id: 'draft', label: 'Utkast', count: campaigns.filter(c => c.status === 'DRAFT').length },
          { id: 'completed', label: 'Fullført', count: campaigns.filter(c => c.status === 'COMPLETED').length },
          { id: 'automated', label: 'Automatiserte', count: campaigns.filter(c => c.isAutomated).length }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === tab.id
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.label}
            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Campaigns List */}
      <div className="space-y-4">
        {filteredCampaigns.map(campaign => {
          const metrics = getMetrics(campaign);
          const typeInfo = campaignTypes.find(t => t.id === campaign.type);
          const TypeIcon = typeInfo?.icon || Mail;
          const status = statusConfig[campaign.status];

          return (
            <div
              key={campaign.id}
              className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setSelectedCampaign(campaign)}
            >
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <TypeIcon className="w-6 h-6 text-blue-600" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-bold text-gray-900">{campaign.name}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                      {status.label}
                    </span>
                    {campaign.isAutomated && (
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full text-xs">
                        Automatisert
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      {campaign.channel === 'EMAIL' ? <Mail className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}
                      {campaign.channel}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {campaign.audience}
                    </span>
                    {campaign.scheduledAt && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        Planlagt: {formatDateTime(campaign.scheduledAt)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Metrics */}
                {campaign.sent > 0 && (
                  <div className="flex gap-6 text-center">
                    <div>
                      <p className="text-lg font-bold text-gray-900">{campaign.sent}</p>
                      <p className="text-xs text-gray-500">Sendt</p>
                    </div>
                    {metrics?.openRate !== null && (
                      <div>
                        <p className="text-lg font-bold text-green-600">{metrics.openRate}%</p>
                        <p className="text-xs text-gray-500">Åpnet</p>
                      </div>
                    )}
                    {metrics?.clickRate !== null && (
                      <div>
                        <p className="text-lg font-bold text-purple-600">{metrics.clickRate}%</p>
                        <p className="text-xs text-gray-500">Klikket</p>
                      </div>
                    )}
                    <div>
                      <p className="text-lg font-bold text-orange-600">{campaign.converted}</p>
                      <p className="text-xs text-gray-500">Konvertert</p>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-1 flex-shrink-0" onClick={e => e.stopPropagation()}>
                  {campaign.status === 'DRAFT' && (
                    <button className="p-2 text-gray-400 hover:text-green-500 hover:bg-green-50 rounded-lg" title="Start">
                      <Play className="w-4 h-4" />
                    </button>
                  )}
                  {campaign.status === 'ACTIVE' && !campaign.isAutomated && (
                    <button className="p-2 text-gray-400 hover:text-yellow-500 hover:bg-yellow-50 rounded-lg" title="Pause">
                      <Pause className="w-4 h-4" />
                    </button>
                  )}
                  <button className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg" title="Rediger">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg" title="Kopier">
                    <Copy className="w-4 h-4" />
                  </button>
                  {campaign.status === 'DRAFT' && (
                    <button className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg" title="Slett">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Progress bar for active campaigns */}
              {campaign.sent > 0 && campaign.audienceSize && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-600">Fremgang</span>
                    <span className="font-medium">{Math.round((campaign.sent / campaign.audienceSize) * 100)}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full"
                      style={{ width: `${(campaign.sent / campaign.audienceSize) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* New Campaign Modal */}
      {showNewCampaign && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Ny Kampanje</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kampanjetype
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {campaignTypes.map(type => {
                    const Icon = type.icon;
                    return (
                      <button
                        key={type.id}
                        className="p-3 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 text-center"
                      >
                        <Icon className="w-5 h-5 mx-auto mb-1 text-gray-600" />
                        <span className="text-xs text-gray-700">{type.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kampanjenavn
                </label>
                <input
                  type="text"
                  placeholder="F.eks. 'Februar Nyhetsbrev'"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kanal
                </label>
                <div className="flex gap-2">
                  <button className="flex-1 px-4 py-3 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 flex items-center justify-center gap-2">
                    <Mail className="w-4 h-4" />
                    E-post
                  </button>
                  <button className="flex-1 px-4 py-3 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 flex items-center justify-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    SMS
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Målgruppe
                </label>
                <select className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500">
                  <option>Velg målgruppe...</option>
                  <option>Alle pasienter</option>
                  <option>Aktive pasienter</option>
                  <option>Inaktive pasienter (90+ dager)</option>
                  <option>Nye pasienter (siste 30 dager)</option>
                  <option>VIP pasienter</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sendetidspunkt
                </label>
                <div className="flex gap-2">
                  <select className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500">
                    <option>Send med en gang</option>
                    <option>Planlegg sending</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Emne (for e-post)
                </label>
                <input
                  type="text"
                  placeholder="Emnelinje for e-post..."
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowNewCampaign(false)}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Avbryt
              </button>
              <button
                onClick={() => setShowNewCampaign(false)}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                Opprett Kampanje
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Campaign Detail View */}
      {selectedCampaign && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setSelectedCampaign(null)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900">{selectedCampaign.name}</h3>
                <p className="text-gray-500">{campaignTypes.find(t => t.id === selectedCampaign.type)?.label}</p>
              </div>
              <button
                onClick={() => setSelectedCampaign(null)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                ×
              </button>
            </div>

            {/* Metrics */}
            {selectedCampaign.sent > 0 && (
              <div className="grid grid-cols-5 gap-4 mb-6">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-gray-900">{selectedCampaign.sent}</p>
                  <p className="text-sm text-gray-500">Sendt</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">{selectedCampaign.delivered}</p>
                  <p className="text-sm text-gray-500">Levert</p>
                </div>
                {selectedCampaign.opened !== null && (
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">{selectedCampaign.opened}</p>
                    <p className="text-sm text-gray-500">Åpnet</p>
                  </div>
                )}
                {selectedCampaign.clicked !== null && (
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-purple-600">{selectedCampaign.clicked}</p>
                    <p className="text-sm text-gray-500">Klikket</p>
                  </div>
                )}
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-orange-600">{selectedCampaign.converted}</p>
                  <p className="text-sm text-gray-500">Konvertert</p>
                </div>
              </div>
            )}

            {/* Funnel visualization */}
            {selectedCampaign.sent > 0 && selectedCampaign.opened !== null && (
              <div className="mb-6">
                <h4 className="font-medium text-gray-700 mb-3">Kampanjetrakt</h4>
                <div className="space-y-2">
                  {[
                    { label: 'Sendt', value: selectedCampaign.sent, color: 'bg-gray-400' },
                    { label: 'Levert', value: selectedCampaign.delivered, color: 'bg-blue-400' },
                    { label: 'Åpnet', value: selectedCampaign.opened, color: 'bg-green-400' },
                    { label: 'Klikket', value: selectedCampaign.clicked, color: 'bg-purple-400' },
                    { label: 'Konvertert', value: selectedCampaign.converted, color: 'bg-orange-400' }
                  ].map((step, index) => (
                    <div key={step.label} className="flex items-center gap-3">
                      <span className="w-24 text-sm text-gray-600">{step.label}</span>
                      <div className="flex-1 h-6 bg-gray-100 rounded overflow-hidden">
                        <div
                          className={`h-full ${step.color} transition-all`}
                          style={{ width: `${(step.value / selectedCampaign.sent) * 100}%` }}
                        />
                      </div>
                      <span className="w-16 text-sm font-medium text-right">
                        {step.value} ({Math.round((step.value / selectedCampaign.sent) * 100)}%)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Details */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Kanal</p>
                <p className="font-medium">{selectedCampaign.channel}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Målgruppe</p>
                <p className="font-medium">{selectedCampaign.audience}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Opprettet</p>
                <p className="font-medium">{formatDate(selectedCampaign.createdAt)}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Status</p>
                <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig[selectedCampaign.status].color}`}>
                  {statusConfig[selectedCampaign.status].label}
                </span>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setSelectedCampaign(null)}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Lukk
              </button>
              <button className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
                Rediger Kampanje
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CampaignManager;
