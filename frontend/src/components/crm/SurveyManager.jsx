import { useState, useEffect } from 'react';
import {
  Star,
  ThumbsUp,
  ThumbsDown,
  Meh,
  TrendingUp,
  TrendingDown,
  Send,
  Plus,
  Edit,
  BarChart2,
  Users,
  Mail,
  MessageSquare,
  Eye,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { crmAPI } from '../../services/api';
import toast from '../../utils/toast';
import logger from '../../utils/logger';

const SurveyManager = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showNewSurvey, setShowNewSurvey] = useState(false);
  const [selectedSurvey, setSelectedSurvey] = useState(null);
  const [surveys, setSurveys] = useState([]);
  const [responses, setResponses] = useState([]);
  const [npsStats, setNpsStats] = useState({
    promoters: 0,
    passives: 0,
    detractors: 0,
    score: 0,
    trend: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Survey templates
  const surveyTemplates = [
    {
      id: 'nps',
      name: 'NPS Undersøkelse',
      description: 'Net Promoter Score - standard kundetilfredshetsundersøkelse',
      questions: [
        {
          type: 'nps',
          question: 'Hvor sannsynlig er det at du ville anbefalt oss til venner eller familie?',
        },
      ],
    },
    {
      id: 'visit-satisfaction',
      name: 'Besøkstilfredshet',
      description: 'Evaluering etter hvert besøk',
      questions: [
        { type: 'rating', question: 'Hvordan vil du vurdere dagens behandling?' },
        { type: 'text', question: 'Har du noen kommentarer?' },
      ],
    },
    {
      id: 'new-patient',
      name: 'Ny Pasient Opplevelse',
      description: 'For nye pasienter etter første besøk',
      questions: [
        { type: 'rating', question: 'Hvor enkelt var det å bestille time?' },
        { type: 'rating', question: 'Hvordan opplevde du velkomsten?' },
        { type: 'nps', question: 'Ville du anbefalt oss basert på første inntrykk?' },
      ],
    },
  ];

  // Fetch surveys from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [surveysRes, npsRes] = await Promise.all([crmAPI.getSurveys(), crmAPI.getNPSStats()]);

        // Map survey data
        const surveyData = (surveysRes.data?.surveys || surveysRes.data || []).map((s) => ({
          id: s.id,
          name: s.name,
          type: s.type,
          status: s.status || 'active',
          sentCount: s.sent_count || 0,
          responseCount: s.response_count || 0,
          responseRate: s.response_rate || 0,
          lastSent: s.last_sent,
          npsScore: s.nps_score,
          avgRating: s.avg_rating,
        }));

        setSurveys(surveyData);

        // Set NPS stats
        if (npsRes.data) {
          setNpsStats({
            promoters: npsRes.data.promoters || 0,
            passives: npsRes.data.passives || 0,
            detractors: npsRes.data.detractors || 0,
            score: npsRes.data.score || 0,
            trend: npsRes.data.trend || 0,
          });
          setResponses(npsRes.data.recentResponses || []);
        }
      } catch (err) {
        logger.error('Error fetching surveys:', err);
        setError(err.message || 'Failed to load surveys');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Create new survey
  const _handleCreateSurvey = async (surveyData) => {
    try {
      const response = await crmAPI.createSurvey(surveyData);
      setSurveys((prev) => [...prev, response.data]);
      setShowNewSurvey(false);
    } catch (err) {
      logger.error('Error creating survey:', err);
      toast.error(`Failed to create survey: ${err.message}`);
    }
  };

  // Get category color and icon
  const getCategoryStyle = (category) => {
    switch (category) {
      case 'PROMOTER':
        return { bg: 'bg-green-100', text: 'text-green-700', icon: ThumbsUp, label: 'Promotør' };
      case 'PASSIVE':
        return { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: Meh, label: 'Passiv' };
      case 'DETRACTOR':
        return { bg: 'bg-red-100', text: 'text-red-700', icon: ThumbsDown, label: 'Kritiker' };
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-700', icon: Meh, label: 'Ukjent' };
    }
  };

  // Get NPS score color
  const getNpsColor = (score) => {
    if (score >= 50) {
      return 'text-green-600';
    }
    if (score >= 0) {
      return 'text-yellow-600';
    }
    return 'text-red-600';
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('nb-NO');
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
        <span className="ml-2 text-gray-600">Laster undersøkelser...</span>
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
          Prøv igjen
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Undersøkelser & NPS</h2>
          <p className="text-gray-600">Mål kundetilfredshet og samle tilbakemeldinger</p>
        </div>
        <button
          onClick={() => setShowNewSurvey(true)}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Ny Undersøkelse
        </button>
      </div>

      {/* NPS Overview Card */}
      <div className="bg-gradient-to-br from-blue-600 to-purple-700 rounded-xl p-6 text-white">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* NPS Score */}
          <div className="text-center">
            <p className="text-sm opacity-80 mb-1">Net Promoter Score</p>
            <p className="text-5xl font-bold">{npsStats.score}</p>
            <div className="flex items-center justify-center gap-1 mt-2">
              {npsStats.trend >= 0 ? (
                <TrendingUp className="w-4 h-4 text-green-300" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-300" />
              )}
              <span className={npsStats.trend >= 0 ? 'text-green-300' : 'text-red-300'}>
                {npsStats.trend > 0 ? '+' : ''}
                {npsStats.trend} siste måned
              </span>
            </div>
          </div>

          {/* Promoters */}
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-green-500/30 flex items-center justify-center mx-auto mb-2">
              <ThumbsUp className="w-6 h-6" />
            </div>
            <p className="text-3xl font-bold">{npsStats.promoters}%</p>
            <p className="text-sm opacity-80">Promotører (9-10)</p>
          </div>

          {/* Passives */}
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-yellow-500/30 flex items-center justify-center mx-auto mb-2">
              <Meh className="w-6 h-6" />
            </div>
            <p className="text-3xl font-bold">{npsStats.passives}%</p>
            <p className="text-sm opacity-80">Passive (7-8)</p>
          </div>

          {/* Detractors */}
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-red-500/30 flex items-center justify-center mx-auto mb-2">
              <ThumbsDown className="w-6 h-6" />
            </div>
            <p className="text-3xl font-bold">{npsStats.detractors}%</p>
            <p className="text-sm opacity-80">Kritikere (0-6)</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-200">
        {[
          { id: 'dashboard', label: 'Oversikt' },
          { id: 'surveys', label: 'Undersøkelser' },
          { id: 'responses', label: 'Svar' },
          { id: 'analytics', label: 'Analyse' },
        ].map((tab) => (
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

      {/* Tab Content */}
      {activeTab === 'dashboard' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Active Surveys */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900">Aktive Undersøkelser</h3>
              <button
                onClick={() => setActiveTab('surveys')}
                className="text-blue-500 text-sm hover:underline"
              >
                Se alle
              </button>
            </div>
            <div className="space-y-3">
              {surveys.map((survey) => (
                <div key={survey.id} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{survey.name}</h4>
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                      Aktiv
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Sendt</p>
                      <p className="font-medium">{survey.sentCount}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Svar</p>
                      <p className="font-medium">{survey.responseCount}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Svarrate</p>
                      <p className="font-medium text-blue-600">{survey.responseRate}%</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Responses */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900">Siste Svar</h3>
              <button
                onClick={() => setActiveTab('responses')}
                className="text-blue-500 text-sm hover:underline"
              >
                Se alle
              </button>
            </div>
            <div className="space-y-3">
              {responses.slice(0, 5).map((response) => {
                const style = getCategoryStyle(response.category);
                const Icon = style.icon;
                return (
                  <div key={response.id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-8 h-8 rounded-full ${style.bg} flex items-center justify-center`}
                      >
                        <Icon className={`w-4 h-4 ${style.text}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-gray-900">{response.patientName}</p>
                          <span
                            className={`text-lg font-bold ${
                              response.score >= 9
                                ? 'text-green-600'
                                : response.score >= 7
                                  ? 'text-yellow-600'
                                  : 'text-red-600'
                            }`}
                          >
                            {response.score}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500">{response.surveyName}</p>
                        {response.comment && (
                          <p className="text-sm text-gray-600 mt-1 italic">"{response.comment}"</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* NPS Trend Chart Placeholder */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 lg:col-span-2">
            <h3 className="font-bold text-gray-900 mb-4">NPS Utvikling</h3>
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
              <div className="text-center text-gray-500">
                <BarChart2 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Graf vises her med NPS-utvikling over tid</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'surveys' && (
        <div className="space-y-4">
          {surveys.map((survey) => (
            <div key={survey.id} className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{survey.name}</h3>
                  <p className="text-sm text-gray-500">Sist sendt: {formatDate(survey.lastSent)}</p>
                </div>
                <div className="flex gap-2">
                  <button className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg">
                    <Send className="w-4 h-4" />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg">
                    <BarChart2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-6 mt-4">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <Send className="w-5 h-5 text-blue-500 mx-auto mb-1" />
                  <p className="text-xl font-bold text-gray-900">{survey.sentCount}</p>
                  <p className="text-xs text-gray-500">Sendt</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <MessageSquare className="w-5 h-5 text-green-500 mx-auto mb-1" />
                  <p className="text-xl font-bold text-gray-900">{survey.responseCount}</p>
                  <p className="text-xs text-gray-500">Svar</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <Users className="w-5 h-5 text-purple-500 mx-auto mb-1" />
                  <p className="text-xl font-bold text-gray-900">{survey.responseRate}%</p>
                  <p className="text-xs text-gray-500">Svarrate</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <Star className="w-5 h-5 text-yellow-500 mx-auto mb-1" />
                  <p
                    className={`text-xl font-bold ${
                      survey.npsScore ? getNpsColor(survey.npsScore) : 'text-gray-900'
                    }`}
                  >
                    {survey.npsScore || survey.avgRating}
                  </p>
                  <p className="text-xs text-gray-500">{survey.npsScore ? 'NPS' : 'Snitt'}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'responses' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <div className="flex gap-2">
              <button className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                Promotører
              </button>
              <button className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm">
                Passive
              </button>
              <button className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm">
                Kritikere
              </button>
              <button className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                Alle
              </button>
            </div>
          </div>
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Pasient
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Undersøkelse
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Score
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Kategori
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Kommentar
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Dato
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Handling
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {responses.map((response) => {
                const style = getCategoryStyle(response.category);
                const Icon = style.icon;
                return (
                  <tr key={response.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span className="font-medium text-gray-900">{response.patientName}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{response.surveyName}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-lg font-bold ${
                          response.score >= 9
                            ? 'text-green-600'
                            : response.score >= 7
                              ? 'text-yellow-600'
                              : 'text-red-600'
                        }`}
                      >
                        {response.score}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${style.bg} ${style.text}`}
                      >
                        <Icon className="w-3 h-3" />
                        {style.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {response.comment ? (
                        <p
                          className="text-sm text-gray-600 max-w-xs truncate"
                          title={response.comment}
                        >
                          {response.comment}
                        </p>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{formatDate(response.date)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button
                          className="p-2 text-gray-400 hover:text-blue-500 rounded-lg"
                          title="Vis detaljer"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {response.category === 'DETRACTOR' && (
                          <button
                            className="p-2 text-gray-400 hover:text-orange-500 rounded-lg"
                            title="Følg opp"
                          >
                            <Mail className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-bold text-gray-900 mb-4">Score Fordeling</h3>
            <div className="space-y-3">
              {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0].map((score) => {
                const count = responses.filter((r) => r.score === score).length;
                const percent = (count / responses.length) * 100;
                return (
                  <div key={score} className="flex items-center gap-3">
                    <span className="w-6 text-sm font-medium text-gray-600">{score}</span>
                    <div className="flex-1 h-6 bg-gray-100 rounded overflow-hidden">
                      <div
                        className={`h-full rounded transition-all ${
                          score >= 9 ? 'bg-green-500' : score >= 7 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <span className="w-8 text-sm text-gray-500">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-bold text-gray-900 mb-4">Innsikt</h3>
            <div className="space-y-4">
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <h4 className="font-medium text-green-800 mb-1">Styrker</h4>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>• Høy tilfredshet med behandlingskvalitet</li>
                  <li>• God oppfølging etter behandling</li>
                  <li>• Vennlig og profesjonelt personale</li>
                </ul>
              </div>
              <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <h4 className="font-medium text-yellow-800 mb-1">Forbedringspotensial</h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• Ventetid ved mottak</li>
                  <li>• Tilgjengelighet for akutte timer</li>
                </ul>
              </div>
              <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                <h4 className="font-medium text-red-800 mb-1">Kritiske Tilbakemeldinger</h4>
                <ul className="text-sm text-red-700 space-y-1">
                  <li>• 2 kritikere siste uke - krever oppfølging</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Survey Modal */}
      {showNewSurvey && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Ny Undersøkelse</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Velg Mal</label>
                <div className="space-y-2">
                  {surveyTemplates.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => setSelectedSurvey(template)}
                      className={`w-full p-4 text-left border rounded-lg transition-colors ${
                        selectedSurvey?.id === template.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <p className="font-medium text-gray-900">{template.name}</p>
                      <p className="text-sm text-gray-500">{template.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Undersøkelsesnavn
                </label>
                <input
                  type="text"
                  placeholder="F.eks. 'Januar NPS'"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Send til</label>
                <select className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500">
                  <option>Alle aktive pasienter</option>
                  <option>Nye pasienter (siste 30 dager)</option>
                  <option>Pasienter med besøk siste uke</option>
                  <option>Manuelt utvalg</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sendetidspunkt
                </label>
                <div className="flex gap-2">
                  <select className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500">
                    <option>Send nå</option>
                    <option>Planlegg sending</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowNewSurvey(false);
                  setSelectedSurvey(null);
                }}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Avbryt
              </button>
              <button
                onClick={() => {
                  setShowNewSurvey(false);
                  setSelectedSurvey(null);
                }}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                Opprett Undersøkelse
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SurveyManager;
