import React, { useState, useEffect } from 'react';
import {
  Users, UserPlus, UserCheck, AlertTriangle, UserX, RefreshCw,
  TrendingUp, TrendingDown, Filter, Search, Star, Calendar,
  Activity, Clock, ChevronRight, MoreVertical, Mail, Phone,
  MessageSquare, Award, Loader2, AlertCircle
} from 'lucide-react';
import { crmAPI } from '../../services/api';

const PatientLifecycle = () => {
  const [selectedStage, setSelectedStage] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('lastVisit');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);

  // Lifecycle stages with Norwegian labels
  const lifecycleStages = [
    { id: 'ALL', label: 'Alle', labelEn: 'All', icon: Users, color: 'bg-gray-500' },
    { id: 'NEW', label: 'Ny', labelEn: 'New', icon: UserPlus, color: 'bg-blue-500', description: 'Første 30 dager' },
    { id: 'ONBOARDING', label: 'Onboarding', labelEn: 'Onboarding', icon: Activity, color: 'bg-purple-500', description: '1-3 konsultasjoner' },
    { id: 'ACTIVE', label: 'Aktiv', labelEn: 'Active', icon: UserCheck, color: 'bg-green-500', description: 'Regelmessige besøk' },
    { id: 'AT_RISK', label: 'I Fare', labelEn: 'At Risk', icon: AlertTriangle, color: 'bg-yellow-500', description: '45+ dager siden sist' },
    { id: 'INACTIVE', label: 'Inaktiv', labelEn: 'Inactive', icon: Clock, color: 'bg-orange-500', description: '90+ dager siden sist' },
    { id: 'LOST', label: 'Tapt', labelEn: 'Lost', icon: UserX, color: 'bg-red-500', description: '180+ dager siden sist' },
    { id: 'REACTIVATED', label: 'Reaktivert', labelEn: 'Reactivated', icon: RefreshCw, color: 'bg-teal-500', description: 'Kom tilbake' }
  ];

  // Fetch patients from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch patients by lifecycle stage
        const stage = selectedStage === 'ALL' ? undefined : selectedStage;
        const [patientsRes, statsRes] = await Promise.all([
          crmAPI.getPatientsByLifecycle(stage),
          crmAPI.getLifecycleStats()
        ]);

        // Map patient data to expected format
        const patientData = (patientsRes.data?.patients || patientsRes.data || []).map(p => ({
          id: p.id,
          name: `${p.first_name || ''} ${p.last_name || ''}`.trim(),
          stage: p.lifecycle_stage || 'NEW',
          engagementScore: p.engagement_score || 50,
          lastVisit: p.last_visit_date,
          nextAppointment: p.next_appointment_date,
          totalVisits: p.total_visits || 0,
          lifetimeValue: p.lifetime_value || 0,
          tags: p.tags || [],
          phone: p.phone,
          email: p.email,
          referrals: p.referral_count || 0,
          isVip: p.is_vip || false
        }));

        setPatients(patientData);
        setStats(statsRes.data);
      } catch (err) {
        console.error('Error fetching lifecycle data:', err);
        setError(err.message || 'Failed to load patient data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedStage]);

  // Filter patients
  const filteredPatients = patients.filter(p => {
    const matchesStage = selectedStage === 'ALL' || p.stage === selectedStage;
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.email.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStage && matchesSearch;
  });

  // Calculate stage counts - use API stats if available
  const stageCounts = stats?.stageCounts || lifecycleStages.reduce((acc, stage) => {
    acc[stage.id] = stage.id === 'ALL'
      ? patients.length
      : patients.filter(p => p.stage === stage.id).length;
    return acc;
  }, {});

  // Get stage info
  const getStageInfo = (stageId) => lifecycleStages.find(s => s.id === stageId);

  // Format date
  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('nb-NO');
  };

  // Calculate days since last visit
  const daysSinceVisit = (dateStr) => {
    if (!dateStr) return 999;
    const days = Math.floor((new Date() - new Date(dateStr)) / (1000 * 60 * 60 * 24));
    return days;
  };

  // Get engagement color
  const getEngagementColor = (score) => {
    if (score >= 70) return 'text-green-600 bg-green-100';
    if (score >= 40) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  // Quick actions
  const quickActions = [
    { id: 'email', label: 'Send E-post', icon: Mail },
    { id: 'sms', label: 'Send SMS', icon: MessageSquare },
    { id: 'call', label: 'Ring', icon: Phone },
    { id: 'book', label: 'Bestill Time', icon: Calendar }
  ];

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
        <span className="ml-2 text-gray-600">Laster pasientdata...</span>
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
          <h2 className="text-2xl font-bold text-gray-900">Pasientlivssyklus</h2>
          <p className="text-gray-600">Segmentér og følg opp pasienter basert på engasjement</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
              showFilters ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filter
          </button>
        </div>
      </div>

      {/* Stage Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        {lifecycleStages.map(stage => {
          const Icon = stage.icon;
          const isSelected = selectedStage === stage.id;
          return (
            <button
              key={stage.id}
              onClick={() => setSelectedStage(stage.id)}
              className={`p-3 rounded-xl border-2 transition-all ${
                isSelected
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className={`w-8 h-8 rounded-lg ${stage.color} flex items-center justify-center mb-2`}>
                <Icon className="w-4 h-4 text-white" />
              </div>
              <div className="text-left">
                <p className="font-medium text-gray-900 text-sm">{stage.label}</p>
                <p className="text-xl font-bold text-gray-900">{stageCounts[stage.id]}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Søk etter pasient..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="lastVisit">Siste Besøk</option>
            <option value="name">Navn</option>
            <option value="engagement">Engasjement</option>
            <option value="value">Livstidsverdi</option>
          </select>
        </div>
      </div>

      {/* Patient List */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pasient</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Engasjement</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Siste Besøk</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Neste Time</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Besøk</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Livstidsverdi</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Handlinger</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredPatients.map(patient => {
              const stageInfo = getStageInfo(patient.stage);
              const StageIcon = stageInfo?.icon;
              const days = daysSinceVisit(patient.lastVisit);

              return (
                <tr
                  key={patient.id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => setSelectedPatient(patient)}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-medium">
                        {patient.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">{patient.name}</span>
                          {patient.isVip && (
                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                          )}
                        </div>
                        <div className="flex gap-1 mt-1">
                          {patient.tags.slice(0, 2).map(tag => (
                            <span key={tag} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ${stageInfo?.color} bg-opacity-20`}>
                      {StageIcon && <StageIcon className="w-3.5 h-3.5" />}
                      <span className="text-sm font-medium">{stageInfo?.label}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ${getEngagementColor(patient.engagementScore)}`}>
                      {patient.engagementScore >= 50 ? (
                        <TrendingUp className="w-3.5 h-3.5" />
                      ) : (
                        <TrendingDown className="w-3.5 h-3.5" />
                      )}
                      <span className="text-sm font-medium">{patient.engagementScore}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <span className="text-gray-900">{formatDate(patient.lastVisit)}</span>
                      <span className={`block text-xs ${days > 45 ? 'text-red-500' : 'text-gray-500'}`}>
                        {days === 0 ? 'I dag' : `${days} dager siden`}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {patient.nextAppointment ? (
                      <span className="text-green-600 font-medium">{formatDate(patient.nextAppointment)}</span>
                    ) : (
                      <span className="text-red-500">Ingen time</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-medium text-gray-900">{patient.totalVisits}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-medium text-gray-900">
                      {patient.lifetimeValue.toLocaleString('nb-NO')} kr
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {quickActions.slice(0, 3).map(action => {
                        const Icon = action.icon;
                        return (
                          <button
                            key={action.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              console.log(`${action.id} for ${patient.name}`);
                            }}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title={action.label}
                          >
                            <Icon className="w-4 h-4" />
                          </button>
                        );
                      })}
                      <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Stage Insights */}
      {selectedStage !== 'ALL' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h4 className="font-medium text-gray-700 mb-3">Anbefalte Handlinger</h4>
            {selectedStage === 'AT_RISK' && (
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2 text-orange-600">
                  <Mail className="w-4 h-4" />
                  Send påminnelse om booking
                </li>
                <li className="flex items-center gap-2 text-orange-600">
                  <Phone className="w-4 h-4" />
                  Ring for oppfølging
                </li>
                <li className="flex items-center gap-2 text-orange-600">
                  <Award className="w-4 h-4" />
                  Tilby rabatt på neste time
                </li>
              </ul>
            )}
            {selectedStage === 'NEW' && (
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2 text-blue-600">
                  <Mail className="w-4 h-4" />
                  Send velkomst-e-post
                </li>
                <li className="flex items-center gap-2 text-blue-600">
                  <Calendar className="w-4 h-4" />
                  Bestill oppfølgingstime
                </li>
              </ul>
            )}
            {selectedStage === 'INACTIVE' && (
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2 text-red-600">
                  <MessageSquare className="w-4 h-4" />
                  Send reaktiveringskampanje
                </li>
                <li className="flex items-center gap-2 text-red-600">
                  <Award className="w-4 h-4" />
                  Tilby spesialtilbud
                </li>
              </ul>
            )}
            {selectedStage === 'ACTIVE' && (
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2 text-green-600">
                  <Star className="w-4 h-4" />
                  Be om anmeldelse
                </li>
                <li className="flex items-center gap-2 text-green-600">
                  <Users className="w-4 h-4" />
                  Start henvisningsprogram
                </li>
              </ul>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h4 className="font-medium text-gray-700 mb-3">Segment Statistikk</h4>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Antall pasienter</span>
                <span className="font-medium">{stageCounts[selectedStage]}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Gj.snitt engasjement</span>
                <span className="font-medium">
                  {Math.round(
                    filteredPatients.reduce((sum, p) => sum + p.engagementScore, 0) /
                    (filteredPatients.length || 1)
                  )}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total livstidsverdi</span>
                <span className="font-medium">
                  {filteredPatients.reduce((sum, p) => sum + p.lifetimeValue, 0).toLocaleString('nb-NO')} kr
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h4 className="font-medium text-gray-700 mb-3">Rask Handling</h4>
            <div className="space-y-2">
              <button className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center justify-center gap-2">
                <Mail className="w-4 h-4" />
                E-post til alle i segmentet
              </button>
              <button className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center justify-center gap-2">
                <MessageSquare className="w-4 h-4" />
                SMS til alle i segmentet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Patient Detail Sidebar */}
      {selectedPatient && (
        <div className="fixed inset-y-0 right-0 w-96 bg-white shadow-2xl border-l border-gray-200 z-50 overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900">Pasientdetaljer</h3>
              <button
                onClick={() => setSelectedPatient(null)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                ×
              </button>
            </div>

            {/* Patient Header */}
            <div className="text-center mb-6">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-2xl font-bold mx-auto mb-3">
                {selectedPatient.name.split(' ').map(n => n[0]).join('')}
              </div>
              <h4 className="text-xl font-bold text-gray-900">{selectedPatient.name}</h4>
              {selectedPatient.isVip && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm mt-2">
                  <Star className="w-3 h-3 fill-current" /> VIP Pasient
                </span>
              )}
            </div>

            {/* Contact Info */}
            <div className="space-y-3 mb-6">
              <a href={`tel:${selectedPatient.phone}`} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100">
                <Phone className="w-5 h-5 text-gray-500" />
                <span>{selectedPatient.phone}</span>
              </a>
              <a href={`mailto:${selectedPatient.email}`} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100">
                <Mail className="w-5 h-5 text-gray-500" />
                <span>{selectedPatient.email}</span>
              </a>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="p-3 bg-blue-50 rounded-lg text-center">
                <p className="text-2xl font-bold text-blue-600">{selectedPatient.totalVisits}</p>
                <p className="text-xs text-blue-600">Besøk</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg text-center">
                <p className="text-2xl font-bold text-green-600">{selectedPatient.lifetimeValue.toLocaleString('nb-NO')}</p>
                <p className="text-xs text-green-600">Livstidsverdi (kr)</p>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg text-center">
                <p className="text-2xl font-bold text-purple-600">{selectedPatient.engagementScore}%</p>
                <p className="text-xs text-purple-600">Engasjement</p>
              </div>
              <div className="p-3 bg-orange-50 rounded-lg text-center">
                <p className="text-2xl font-bold text-orange-600">{selectedPatient.referrals}</p>
                <p className="text-xs text-orange-600">Henvisninger</p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-2">
              <button className="w-full px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center justify-center gap-2">
                <Calendar className="w-4 h-4" />
                Bestill Ny Time
              </button>
              <button className="w-full px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center justify-center gap-2">
                <ChevronRight className="w-4 h-4" />
                Se Full Profil
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientLifecycle;
