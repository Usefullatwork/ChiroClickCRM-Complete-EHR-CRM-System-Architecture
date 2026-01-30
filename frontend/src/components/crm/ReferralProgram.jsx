import React, { useState, useEffect } from 'react';
import {
  Users, Gift, Award, TrendingUp, ChevronRight, Plus,
  Mail, MessageSquare, Copy, Check, Star, Calendar,
  DollarSign, UserPlus, Clock, CheckCircle, XCircle,
  Loader2, AlertCircle
} from 'lucide-react';
import { crmAPI } from '../../services/api';

const ReferralProgram = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [showNewReferralForm, setShowNewReferralForm] = useState(false);
  const [copiedCode, setCopiedCode] = useState(null);
  const [referrals, setReferrals] = useState([]);
  const [topReferrers, setTopReferrers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [patients, setPatients] = useState([]);

  // Referral program settings
  const programSettings = {
    referrerReward: 500, // kr
    refereeDiscount: 200, // kr
    maxReferrals: 10,
    expiryDays: 90
  };

  // Fetch referrals from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [referralsRes, statsRes] = await Promise.all([
          crmAPI.getReferrals(),
          crmAPI.getReferralStats()
        ]);

        // Map referral data
        const referralData = (referralsRes.data?.referrals || referralsRes.data || []).map(r => ({
          id: r.id,
          referrerName: r.referrer_name || `${r.referrer_first_name || ''} ${r.referrer_last_name || ''}`.trim(),
          referrerEmail: r.referrer_email,
          refereeName: r.referee_name || `${r.referee_first_name || ''} ${r.referee_last_name || ''}`.trim(),
          refereeEmail: r.referee_email,
          referralCode: r.referral_code,
          status: r.status || 'SENT',
          createdAt: r.created_at,
          convertedAt: r.converted_at,
          rewardStatus: r.reward_status || 'PENDING',
          rewardAmount: r.reward_amount || programSettings.referrerReward
        }));

        setReferrals(referralData);

        // Set top referrers from stats
        if (statsRes.data?.topReferrers) {
          setTopReferrers(statsRes.data.topReferrers);
        }
      } catch (err) {
        console.error('Error fetching referrals:', err);
        setError(err.message || 'Failed to load referrals');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Create new referral
  const handleCreateReferral = async (formData) => {
    try {
      const response = await crmAPI.createReferral(formData);
      setReferrals(prev => [response.data, ...prev]);
      setShowNewReferralForm(false);
    } catch (err) {
      console.error('Error creating referral:', err);
      alert('Failed to create referral: ' + err.message);
    }
  };

  // Status configurations
  const statusConfig = {
    SENT: { label: 'Sendt', color: 'bg-blue-100 text-blue-700', icon: Mail },
    OPENED: { label: 'Åpnet', color: 'bg-purple-100 text-purple-700', icon: Clock },
    BOOKED: { label: 'Booket', color: 'bg-yellow-100 text-yellow-700', icon: Calendar },
    SHOWED: { label: 'Møtte Opp', color: 'bg-orange-100 text-orange-700', icon: UserPlus },
    CONVERTED: { label: 'Konvertert', color: 'bg-green-100 text-green-700', icon: CheckCircle },
    EXPIRED: { label: 'Utløpt', color: 'bg-gray-100 text-gray-700', icon: XCircle }
  };

  // Calculate stats
  const stats = {
    total: referrals.length,
    converted: referrals.filter(r => r.status === 'CONVERTED').length,
    pending: referrals.filter(r => ['SENT', 'OPENED', 'BOOKED', 'SHOWED'].includes(r.status)).length,
    conversionRate: Math.round((referrals.filter(r => r.status === 'CONVERTED').length / referrals.length) * 100),
    totalRewards: referrals.filter(r => r.rewardStatus === 'PAID').reduce((sum, r) => sum + r.rewardAmount, 0)
  };

  const copyToClipboard = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('nb-NO');
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
        <span className="ml-2 text-gray-600">Laster henvisninger...</span>
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
          <h2 className="text-2xl font-bold text-gray-900">Henvisningsprogram</h2>
          <p className="text-gray-600">Belønn pasienter som henviser nye kunder</p>
        </div>
        <button
          onClick={() => setShowNewReferralForm(true)}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Ny Henvisning
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          <p className="text-sm text-gray-600">Totalt Henvisninger</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.converted}</p>
          <p className="text-sm text-gray-600">Konvertert</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
          <p className="text-sm text-gray-600">Ventende</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-purple-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.conversionRate}%</p>
          <p className="text-sm text-gray-600">Konverteringsrate</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
              <Gift className="w-5 h-5 text-orange-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.totalRewards.toLocaleString('nb-NO')} kr</p>
          <p className="text-sm text-gray-600">Utbetalt Belønning</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-200">
        {[
          { id: 'overview', label: 'Oversikt' },
          { id: 'referrals', label: 'Alle Henvisninger' },
          { id: 'leaderboard', label: 'Toppliste' },
          { id: 'settings', label: 'Innstillinger' }
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

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Program Info */}
          <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl p-6 text-white">
            <h3 className="text-xl font-bold mb-4">Aktivt Henvisningsprogram</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                  <Gift className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-medium">Henviser får</p>
                  <p className="text-2xl font-bold">{programSettings.referrerReward} kr</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-medium">Ny pasient får</p>
                  <p className="text-2xl font-bold">{programSettings.refereeDiscount} kr rabatt</p>
                </div>
              </div>
              <div className="pt-4 border-t border-white/20">
                <p className="text-sm opacity-80">
                  Maks {programSettings.maxReferrals} henvisninger per pasient.
                  Belønning utløper etter {programSettings.expiryDays} dager.
                </p>
              </div>
            </div>
          </div>

          {/* Top Referrers */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900">Topp Henvisere</h3>
              <button className="text-blue-500 text-sm hover:underline">Se alle</button>
            </div>
            <div className="space-y-3">
              {topReferrers.slice(0, 5).map((referrer, index) => (
                <div key={referrer.name} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                    index === 0 ? 'bg-yellow-100 text-yellow-700' :
                    index === 1 ? 'bg-gray-200 text-gray-700' :
                    index === 2 ? 'bg-orange-100 text-orange-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{referrer.name}</p>
                    <p className="text-sm text-gray-600">{referrer.converted} av {referrer.referrals} konvertert</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">{referrer.totalReward.toLocaleString('nb-NO')} kr</p>
                    <p className="text-xs text-gray-500">Totalt opptjent</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Referrals */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900">Siste Henvisninger</h3>
              <button
                onClick={() => setActiveTab('referrals')}
                className="text-blue-500 text-sm hover:underline flex items-center gap-1"
              >
                Se alle <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Henviser</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Ny Pasient</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Kode</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Dato</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {referrals.slice(0, 5).map(referral => {
                    const status = statusConfig[referral.status];
                    const StatusIcon = status.icon;
                    return (
                      <tr key={referral.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <span className="font-medium text-gray-900">{referral.referrerName}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-gray-900">{referral.refereeName}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <code className="px-2 py-1 bg-gray-100 rounded text-sm">{referral.referralCode}</code>
                            <button
                              onClick={() => copyToClipboard(referral.referralCode)}
                              className="p-1 text-gray-400 hover:text-gray-600"
                            >
                              {copiedCode === referral.referralCode ? (
                                <Check className="w-4 h-4 text-green-500" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
                            <StatusIcon className="w-3 h-3" />
                            {status.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {formatDate(referral.createdAt)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'referrals' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Henviser</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ny Pasient</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kode</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Opprettet</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Konvertert</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Belønning</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {referrals.map(referral => {
                const status = statusConfig[referral.status];
                const StatusIcon = status.icon;
                return (
                  <tr key={referral.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-gray-900">{referral.referrerName}</p>
                        <p className="text-sm text-gray-500">{referral.referrerEmail}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-gray-900">{referral.refereeName}</p>
                        <p className="text-sm text-gray-500">{referral.refereeEmail}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <code className="px-2 py-1 bg-gray-100 rounded text-sm">{referral.referralCode}</code>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
                        <StatusIcon className="w-3 h-3" />
                        {status.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{formatDate(referral.createdAt)}</td>
                    <td className="px-4 py-3 text-gray-600">{formatDate(referral.convertedAt)}</td>
                    <td className="px-4 py-3">
                      {referral.rewardStatus === 'PAID' ? (
                        <span className="text-green-600 font-medium">{referral.rewardAmount} kr</span>
                      ) : referral.rewardStatus === 'PENDING' ? (
                        <span className="text-yellow-600">Ventende</span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'leaderboard' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Henviser Toppliste</h3>
          <div className="space-y-4">
            {topReferrers.map((referrer, index) => (
              <div key={referrer.name} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold ${
                  index === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-white' :
                  index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-500 text-white' :
                  index === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-600 text-white' :
                  'bg-gray-200 text-gray-600'
                }`}>
                  {index === 0 ? <Award className="w-6 h-6" /> : index + 1}
                </div>
                <div className="flex-1">
                  <p className="font-bold text-gray-900">{referrer.name}</p>
                  <div className="flex gap-4 mt-1">
                    <span className="text-sm text-gray-600">
                      <span className="font-medium">{referrer.referrals}</span> henvisninger
                    </span>
                    <span className="text-sm text-gray-600">
                      <span className="font-medium text-green-600">{referrer.converted}</span> konvertert
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-green-600">{referrer.totalReward.toLocaleString('nb-NO')} kr</p>
                  <p className="text-sm text-gray-500">Total belønning</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Programinnstillinger</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Belønning til Henviser (kr)
              </label>
              <input
                type="number"
                defaultValue={programSettings.referrerReward}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rabatt til Ny Pasient (kr)
              </label>
              <input
                type="number"
                defaultValue={programSettings.refereeDiscount}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Maks Henvisninger per Pasient
              </label>
              <input
                type="number"
                defaultValue={programSettings.maxReferrals}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Utløpsdager for Henvisning
              </label>
              <input
                type="number"
                defaultValue={programSettings.expiryDays}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="mt-6 pt-6 border-t border-gray-200">
            <button className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
              Lagre Endringer
            </button>
          </div>
        </div>
      )}

      {/* New Referral Modal */}
      {showNewReferralForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Ny Henvisning</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Henviser (Eksisterende Pasient)
                </label>
                <select className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500">
                  <option>Velg pasient...</option>
                  <option>Erik Hansen</option>
                  <option>Sofie Nilsen</option>
                  <option>Maria Olsen</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ny Pasient Navn
                </label>
                <input
                  type="text"
                  placeholder="Skriv inn navn..."
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ny Pasient E-post
                </label>
                <input
                  type="email"
                  placeholder="epost@example.no"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ny Pasient Telefon
                </label>
                <input
                  type="tel"
                  placeholder="+47 XXX XX XXX"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowNewReferralForm(false)}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Avbryt
              </button>
              <button
                onClick={() => setShowNewReferralForm(false)}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                Opprett Henvisning
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReferralProgram;
