import { useState, useEffect } from 'react';
import {
  Send,
  Mail,
  MessageSquare,
  BarChart2,
  TrendingUp,
  Users,
  Plus,
  Calendar,
  Clock,
  Edit,
  Trash2,
  Eye,
  Copy,
  Play,
  Pause,
  Target,
  MousePointer,
  UserPlus,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { crmAPI } from '../../services/api';
import toast from '../../utils/toast';
import logger from '../../utils/logger';
import { useTranslation } from '../../i18n';

const CampaignManager = () => {
  const { t } = useTranslation('crm');
  const [activeTab, setActiveTab] = useState('active');
  const [showNewCampaign, setShowNewCampaign] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Campaign types
  const campaignTypes = [
    { id: 'NEWSLETTER', label: t('campaignTypeNewsletter', 'Nyhetsbrev'), icon: Mail },
    { id: 'PROMOTION', label: t('campaignTypePromotion', 'Kampanje'), icon: Target },
    { id: 'REACTIVATION', label: t('campaignTypeReactivation', 'Reaktivering'), icon: UserPlus },
    { id: 'REMINDER', label: t('campaignTypeReminder', 'Påminnelse'), icon: Clock },
    { id: 'BIRTHDAY', label: t('campaignTypeBirthday', 'Bursdag'), icon: Calendar },
    { id: 'SURVEY', label: t('campaignTypeSurvey', 'Undersøkelse'), icon: BarChart2 },
  ];

  // Fetch campaigns from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await crmAPI.getCampaigns();
        const campaignData = (response.data?.campaigns || response.data || []).map((c) => ({
          id: c.id,
          name: c.name,
          type: c.type,
          channel: c.channel,
          status: c.status || 'DRAFT',
          audience: c.audience_description || c.audience,
          audienceSize: c.audience_size,
          scheduledAt: c.scheduled_at,
          sent: c.sent_count || 0,
          delivered: c.delivered_count || 0,
          opened: c.opened_count,
          clicked: c.clicked_count,
          converted: c.converted_count || 0,
          createdAt: c.created_at,
          completedAt: c.completed_at,
          isAutomated: c.is_automated,
        }));
        setCampaigns(campaignData);
      } catch (err) {
        logger.error('Error fetching campaigns:', err);
        setError(err.message || 'Failed to load campaigns');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Create new campaign
  const _handleCreateCampaign = async (campaignData) => {
    try {
      const response = await crmAPI.createCampaign(campaignData);
      setCampaigns((prev) => [...prev, response.data]);
      setShowNewCampaign(false);
    } catch (err) {
      logger.error('Error creating campaign:', err);
      toast.error(`Failed to create campaign: ${err.message}`);
    }
  };

  // Launch campaign
  const _handleLaunchCampaign = async (campaignId) => {
    try {
      await crmAPI.launchCampaign(campaignId);
      setCampaigns((prev) =>
        prev.map((c) => (c.id === campaignId ? { ...c, status: 'ACTIVE' } : c))
      );
    } catch (err) {
      logger.error('Error launching campaign:', err);
      toast.error(`Failed to launch campaign: ${err.message}`);
    }
  };

  // Status configurations
  const statusConfig = {
    DRAFT: { label: t('statusDraft', 'Utkast'), color: 'bg-gray-100 text-gray-700' },
    SCHEDULED: { label: t('statusScheduled', 'Planlagt'), color: 'bg-blue-100 text-blue-700' },
    ACTIVE: { label: t('statusActive', 'Aktiv'), color: 'bg-green-100 text-green-700' },
    PAUSED: { label: t('statusPaused', 'Pauset'), color: 'bg-yellow-100 text-yellow-700' },
    COMPLETED: { label: t('statusCompleted', 'Fullført'), color: 'bg-purple-100 text-purple-700' },
  };

  // Calculate metrics
  const getMetrics = (campaign) => {
    if (campaign.sent === 0) {
      return null;
    }
    return {
      deliveryRate: Math.round((campaign.delivered / campaign.sent) * 100),
      openRate:
        campaign.opened !== null ? Math.round((campaign.opened / campaign.delivered) * 100) : null,
      clickRate:
        campaign.clicked !== null ? Math.round((campaign.clicked / campaign.opened) * 100) : null,
      conversionRate: Math.round((campaign.converted / campaign.sent) * 100),
    };
  };

  // Overall stats (calculated from actual campaign data)
  const sentCampaigns = campaigns.filter((c) => c.sent > 0);
  const overallStats = {
    totalSent: campaigns.reduce((sum, c) => sum + (c.sent || 0), 0),
    avgOpenRate:
      sentCampaigns.length > 0
        ? Math.round(
            sentCampaigns.reduce((sum, c) => sum + (c.opened / c.sent) * 100, 0) /
              sentCampaigns.length
          )
        : 0,
    avgClickRate:
      sentCampaigns.length > 0
        ? Math.round(
            sentCampaigns.reduce((sum, c) => sum + ((c.clicked || 0) / c.sent) * 100, 0) /
              sentCampaigns.length
          )
        : 0,
    avgConversionRate:
      sentCampaigns.length > 0
        ? Math.round(
            sentCampaigns.reduce((sum, c) => sum + ((c.converted || 0) / c.sent) * 100, 0) /
              sentCampaigns.length
          )
        : 0,
  };

  const formatDate = (dateStr) => {
    if (!dateStr) {
      return '-';
    }
    return new Date(dateStr).toLocaleDateString('nb-NO', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) {
      return '-';
    }
    return new Date(dateStr).toLocaleString('nb-NO', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Filter campaigns by tab
  const filteredCampaigns = campaigns.filter((c) => {
    if (activeTab === 'active') {
      return c.status === 'ACTIVE' || c.status === 'SCHEDULED';
    }
    if (activeTab === 'draft') {
      return c.status === 'DRAFT';
    }
    if (activeTab === 'completed') {
      return c.status === 'COMPLETED';
    }
    if (activeTab === 'automated') {
      return c.isAutomated;
    }
    return true;
  });

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
        <span className="ml-2 text-gray-600 dark:text-gray-300">
          {t('loadingCampaigns', 'Laster kampanjer...')}
        </span>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
        <p className="text-red-700">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          {t('tryAgain', 'Prøv igjen')}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{t('campaignsTitle', 'Kampanjer')}</h2>
          <p className="text-gray-600 dark:text-gray-300">
            {t('campaignsSubtitle', 'Opprett og administrer markedsføringskampanjer')}
          </p>
        </div>
        <button
          onClick={() => setShowNewCampaign(true)}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          {t('newCampaign', 'Ny Kampanje')}
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
          <p className="text-2xl font-bold text-gray-900">
            {overallStats.totalSent.toLocaleString('nb-NO')}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {t('totalSent', 'Totalt Sendt')}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <Eye className="w-5 h-5 text-green-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{overallStats.avgOpenRate}%</p>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {t('avgOpenRate', 'Gj.snitt Åpningsrate')}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <MousePointer className="w-5 h-5 text-purple-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{overallStats.avgClickRate}%</p>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {t('avgClickRate', 'Gj.snitt Klikkrate')}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-orange-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{overallStats.avgConversionRate}%</p>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {t('avgConversion', 'Gj.snitt Konvertering')}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-200">
        {[
          {
            id: 'active',
            label: t('tabActive', 'Aktive'),
            count: campaigns.filter((c) => c.status === 'ACTIVE' || c.status === 'SCHEDULED')
              .length,
          },
          {
            id: 'draft',
            label: t('tabDraft', 'Utkast'),
            count: campaigns.filter((c) => c.status === 'DRAFT').length,
          },
          {
            id: 'completed',
            label: t('tabCompleted', 'Fullført'),
            count: campaigns.filter((c) => c.status === 'COMPLETED').length,
          },
          {
            id: 'automated',
            label: t('tabAutomated', 'Automatiserte'),
            count: campaigns.filter((c) => c.isAutomated).length,
          },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === tab.id
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-600 dark:text-gray-300 hover:text-gray-900'
            }`}
          >
            {tab.label}
            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 dark:text-gray-300 text-xs rounded-full">
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Campaigns List */}
      <div className="space-y-4">
        {filteredCampaigns.map((campaign) => {
          const metrics = getMetrics(campaign);
          const typeInfo = campaignTypes.find((t) => t.id === campaign.type);
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
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${status.color}`}
                    >
                      {status.label}
                    </span>
                    {campaign.isAutomated && (
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full text-xs">
                        {t('automated', 'Automatisert')}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      {campaign.channel === 'EMAIL' ? (
                        <Mail className="w-4 h-4" />
                      ) : (
                        <MessageSquare className="w-4 h-4" />
                      )}
                      {campaign.channel}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {campaign.audience}
                    </span>
                    {campaign.scheduledAt && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {t('scheduledLabel', 'Planlagt')}: {formatDateTime(campaign.scheduledAt)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Metrics */}
                {campaign.sent > 0 && (
                  <div className="flex gap-6 text-center">
                    <div>
                      <p className="text-lg font-bold text-gray-900">{campaign.sent}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {t('metricSent', 'Sendt')}
                      </p>
                    </div>
                    {metrics?.openRate !== null && (
                      <div>
                        <p className="text-lg font-bold text-green-600">{metrics.openRate}%</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {t('metricOpened', 'Åpnet')}
                        </p>
                      </div>
                    )}
                    {metrics?.clickRate !== null && (
                      <div>
                        <p className="text-lg font-bold text-purple-600">{metrics.clickRate}%</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {t('metricClicked', 'Klikket')}
                        </p>
                      </div>
                    )}
                    <div>
                      <p className="text-lg font-bold text-orange-600">{campaign.converted}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {t('metricConverted', 'Konvertert')}
                      </p>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                  {campaign.status === 'DRAFT' && (
                    <button
                      className="p-2 text-gray-400 dark:text-gray-300 hover:text-green-500 hover:bg-green-50 rounded-lg"
                      title={t('actionStart', 'Start')}
                    >
                      <Play className="w-4 h-4" />
                    </button>
                  )}
                  {campaign.status === 'ACTIVE' && !campaign.isAutomated && (
                    <button
                      className="p-2 text-gray-400 dark:text-gray-300 hover:text-yellow-500 hover:bg-yellow-50 rounded-lg"
                      title={t('actionPause', 'Pause')}
                    >
                      <Pause className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    className="p-2 text-gray-400 dark:text-gray-300 hover:text-blue-500 hover:bg-blue-50 rounded-lg"
                    title={t('actionEdit', 'Rediger')}
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    className="p-2 text-gray-400 dark:text-gray-300 hover:text-blue-500 hover:bg-blue-50 rounded-lg"
                    title={t('actionCopy', 'Kopier')}
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  {campaign.status === 'DRAFT' && (
                    <button
                      className="p-2 text-gray-400 dark:text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg"
                      title={t('actionDelete', 'Slett')}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Progress bar for active campaigns */}
              {campaign.sent > 0 && campaign.audienceSize && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-600 dark:text-gray-300">
                      {t('progress', 'Fremgang')}
                    </span>
                    <span className="font-medium">
                      {Math.round((campaign.sent / campaign.audienceSize) * 100)}%
                    </span>
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
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              {t('newCampaign', 'Ny Kampanje')}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('campaignType', 'Kampanjetype')}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {campaignTypes.map((type) => {
                    const Icon = type.icon;
                    return (
                      <button
                        key={type.id}
                        className="p-3 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 text-center"
                      >
                        <Icon className="w-5 h-5 mx-auto mb-1 text-gray-600 dark:text-gray-300" />
                        <span className="text-xs text-gray-700">{type.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('campaignName', 'Kampanjenavn')}
                </label>
                <input
                  type="text"
                  placeholder={t('campaignNamePlaceholder', "F.eks. 'Februar Nyhetsbrev'")}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('channel', 'Kanal')}
                </label>
                <div className="flex gap-2">
                  <button className="flex-1 px-4 py-3 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 flex items-center justify-center gap-2">
                    <Mail className="w-4 h-4" />
                    {t('channelEmail', 'E-post')}
                  </button>
                  <button className="flex-1 px-4 py-3 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 flex items-center justify-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    SMS
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('targetAudience', 'Målgruppe')}
                </label>
                <select className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500">
                  <option>{t('selectAudience', 'Velg målgruppe...')}</option>
                  <option>{t('audienceAll', 'Alle pasienter')}</option>
                  <option>{t('audienceActive', 'Aktive pasienter')}</option>
                  <option>{t('audienceInactive', 'Inaktive pasienter (90+ dager)')}</option>
                  <option>{t('audienceNew', 'Nye pasienter (siste 30 dager)')}</option>
                  <option>{t('audienceVip', 'VIP pasienter')}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('sendTime', 'Sendetidspunkt')}
                </label>
                <div className="flex gap-2">
                  <select className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500">
                    <option>{t('sendNowOption', 'Send med en gang')}</option>
                    <option>{t('scheduleSendOption', 'Planlegg sending')}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('subjectForEmail', 'Emne (for e-post)')}
                </label>
                <input
                  type="text"
                  placeholder={t('subjectPlaceholder', 'Emnelinje for e-post...')}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowNewCampaign(false)}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                {t('cancel', 'Avbryt')}
              </button>
              <button
                onClick={() => setShowNewCampaign(false)}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                {t('createCampaign', 'Opprett Kampanje')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Campaign Detail View */}
      {selectedCampaign && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setSelectedCampaign(null)}
        >
          <div
            className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900">{selectedCampaign.name}</h3>
                <p className="text-gray-500 dark:text-gray-400">
                  {campaignTypes.find((t) => t.id === selectedCampaign.type)?.label}
                </p>
              </div>
              <button
                onClick={() => setSelectedCampaign(null)}
                className="p-2 text-gray-400 dark:text-gray-300 hover:text-gray-600 rounded-lg"
              >
                ×
              </button>
            </div>

            {/* Metrics */}
            {selectedCampaign.sent > 0 && (
              <div className="grid grid-cols-5 gap-4 mb-6">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-gray-900">{selectedCampaign.sent}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t('metricSent', 'Sendt')}
                  </p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">{selectedCampaign.delivered}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t('metricDelivered', 'Levert')}
                  </p>
                </div>
                {selectedCampaign.opened !== null && (
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">{selectedCampaign.opened}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {t('metricOpened', 'Åpnet')}
                    </p>
                  </div>
                )}
                {selectedCampaign.clicked !== null && (
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-purple-600">{selectedCampaign.clicked}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {t('metricClicked', 'Klikket')}
                    </p>
                  </div>
                )}
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-orange-600">{selectedCampaign.converted}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t('metricConverted', 'Konvertert')}
                  </p>
                </div>
              </div>
            )}

            {/* Funnel visualization */}
            {selectedCampaign.sent > 0 && selectedCampaign.opened !== null && (
              <div className="mb-6">
                <h4 className="font-medium text-gray-700 mb-3">
                  {t('campaignFunnel', 'Kampanjetrakt')}
                </h4>
                <div className="space-y-2">
                  {[
                    {
                      label: t('metricSent', 'Sendt'),
                      value: selectedCampaign.sent,
                      color: 'bg-gray-400',
                    },
                    {
                      label: t('metricDelivered', 'Levert'),
                      value: selectedCampaign.delivered,
                      color: 'bg-blue-400',
                    },
                    {
                      label: t('metricOpened', 'Åpnet'),
                      value: selectedCampaign.opened,
                      color: 'bg-green-400',
                    },
                    {
                      label: t('metricClicked', 'Klikket'),
                      value: selectedCampaign.clicked,
                      color: 'bg-purple-400',
                    },
                    {
                      label: t('metricConverted', 'Konvertert'),
                      value: selectedCampaign.converted,
                      color: 'bg-orange-400',
                    },
                  ].map((step, _index) => (
                    <div key={step.label} className="flex items-center gap-3">
                      <span className="w-24 text-sm text-gray-600 dark:text-gray-300">
                        {step.label}
                      </span>
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
                <p className="text-sm text-gray-500 dark:text-gray-400">{t('channel', 'Kanal')}</p>
                <p className="font-medium">{selectedCampaign.channel}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t('targetAudience', 'Målgruppe')}
                </p>
                <p className="font-medium">{selectedCampaign.audience}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t('created', 'Opprettet')}
                </p>
                <p className="font-medium">{formatDate(selectedCampaign.createdAt)}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t('statusLabel', 'Status')}
                </p>
                <span
                  className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig[selectedCampaign.status].color}`}
                >
                  {statusConfig[selectedCampaign.status].label}
                </span>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setSelectedCampaign(null)}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                {t('close', 'Lukk')}
              </button>
              <button className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
                {t('editCampaign', 'Rediger Kampanje')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CampaignManager;
