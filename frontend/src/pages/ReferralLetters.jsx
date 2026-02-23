import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from '../i18n';
import {
  ArrowLeft,
  Plus,
  Send,
  Search,
  Filter,
  Loader2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import ReferralLetterGenerator, {
  getDefaultReferralData,
} from '../components/documents/ReferralLetterGenerator';
import { lettersApi } from '../api/letters';
import toast from '../utils/toast';
import logger from '../utils/logger';

export default function ReferralLetters() {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t, lang: language, setLang: setLanguage } = useTranslation('letters');
  const [view, setView] = useState(searchParams.get('new') ? 'create' : 'list');
  const [referralData, setReferralData] = useState(getDefaultReferralData());
  const [searchTerm, setSearchTerm] = useState('');

  // API states
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [generating, setGenerating] = useState(false);

  // Mock patient data (would come from patient context in real app)
  const patient = patientId
    ? {
        id: patientId,
        name: 'Demo Pasient',
        dateOfBirth: '1985-03-15',
        personalNumber: '15038512345',
        address: 'Testveien 1, 0123 Oslo',
      }
    : null;

  const referralTypeLabels = {
    no: {
      gp: 'Fastlege',
      orthopedic: 'Ortoped',
      neurology: 'Nevrolog',
      radiology: 'Bildediagnostikk',
      physio: 'Fysioterapi',
      vestibular: 'Vestibulær',
    },
    en: {
      gp: 'GP',
      orthopedic: 'Orthopedic',
      neurology: 'Neurology',
      radiology: 'Radiology',
      physio: 'Physiotherapy',
      vestibular: 'Vestibular',
    },
  };

  const priorityLabels = {
    no: { routine: 'Rutinemessig', soon: 'Snart', urgent: 'Haster' },
    en: { routine: 'Routine', soon: 'Soon', urgent: 'Urgent' },
  };

  const statusLabels = {
    no: {
      pending: 'Venter',
      sent: 'Sendt',
      completed: 'Fullført',
      DRAFT: 'Utkast',
      FINALIZED: 'Ferdig',
      SENT: 'Sendt',
    },
    en: {
      pending: 'Pending',
      sent: 'Sent',
      completed: 'Completed',
      DRAFT: 'Draft',
      FINALIZED: 'Finalized',
      SENT: 'Sent',
    },
  };

  // Fetch referrals from API
  const fetchReferrals = async () => {
    try {
      setLoading(true);
      setError(null);

      if (patientId) {
        // Fetch for specific patient
        const response = await lettersApi.getPatientLetters(patientId, { type: 'REFERRAL' });
        setReferrals(response.letters || []);
      } else {
        // For now, show empty - in real app would fetch all org's referrals
        setReferrals([]);
      }
    } catch (err) {
      logger.error('Failed to fetch referrals:', err);
      setError(t('failedToLoadReferrals'));
      // Fall back to empty array
      setReferrals([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReferrals();
  }, [patientId]);

  // Auto-populate patient data when creating new
  useEffect(() => {
    if (patient && view === 'create') {
      setReferralData((prev) => ({
        ...prev,
        patientName: patient.name,
        patientDOB: patient.dateOfBirth,
        patientPersonalNumber: patient.personalNumber || '',
        patientAddress: patient.address || '',
      }));
    }
  }, [patient, view]);

  // Generate letter content with AI
  const handleGenerateWithAI = async () => {
    try {
      setGenerating(true);
      setError(null);

      const letterType =
        referralData.referralType === 'vestibular' ? 'VESTIBULAR_REFERRAL' : 'REFERRAL_LETTER';

      const response = await lettersApi.generateLetter(letterType, {
        patientId,
        patientData: patient,
        currentData: referralData,
        referralType: referralData.referralType,
      });

      if (response.letter) {
        setReferralData((prev) => ({
          ...prev,
          ...response.letter,
        }));
      }
    } catch (err) {
      logger.error('AI generation failed:', err);
      setError(t('aiGenerationFailed'));
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async (data) => {
    try {
      setSaving(true);
      setError(null);

      const letterType =
        data.referralType === 'vestibular' ? 'VESTIBULAR_REFERRAL' : 'REFERRAL_LETTER';

      await lettersApi.saveLetter({
        letterType,
        patientId,
        content: data,
        status: 'DRAFT',
      });

      toast.success(t('referralSaved'));
      setView('list');
      fetchReferrals(); // Refresh list
    } catch (err) {
      logger.error('Save failed:', err);
      setError(t('failedToSaveReferral'));
    } finally {
      setSaving(false);
    }
  };

  const filteredReferrals = referrals.filter((ref) => {
    const patientName = ref.patient_name || ref.patientName || '';
    const recipient = ref.recipient || '';
    return (
      patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      recipient.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  if (view === 'create') {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setView('list')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">{t('newReferral')}</h1>
                {patient && <p className="text-sm text-gray-500">{patient.name}</p>}
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* AI Generate Button */}
              <button
                onClick={handleGenerateWithAI}
                disabled={generating}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
              >
                {generating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                {t('generateWithAI')}
              </button>

              {/* Language toggle */}
              <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setLanguage('no')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    language === 'no' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
                  }`}
                >
                  Norsk
                </button>
                <button
                  onClick={() => setLanguage('en')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    language === 'en' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
                  }`}
                >
                  English
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Error display */}
        {error && (
          <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Generator */}
        <div className="p-6">
          <ReferralLetterGenerator
            data={referralData}
            onChange={setReferralData}
            onSave={handleSave}
            language={language}
            patientId={patientId}
            saving={saving}
          />
        </div>
      </div>
    );
  }

  // List view
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {patientId && (
              <button
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div>
              <h1 className="text-xl font-semibold text-gray-900">{t('referrals')}</h1>
              <p className="text-sm text-gray-500">{t('medicalReferrals')}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Language toggle */}
            <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setLanguage('no')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  language === 'no' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
                }`}
              >
                Norsk
              </button>
              <button
                onClick={() => setLanguage('en')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  language === 'en' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
                }`}
              >
                English
              </button>
            </div>

            <button
              onClick={() => setView('create')}
              className="flex items-center gap-2 px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              {t('newReferral')}
            </button>
          </div>
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-red-700">{error}</p>
          <button
            onClick={fetchReferrals}
            className="ml-auto text-red-700 hover:text-red-800 underline text-sm"
          >
            {t('tryAgain')}
          </button>
        </div>
      )}

      {/* Search and filter */}
      <div className="px-6 py-4">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder={t('searchByPatientOrRecipient')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <Filter className="w-4 h-4" />
            {t('filter')}
          </button>
        </div>
      </div>

      {/* List */}
      <div className="px-6">
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
              <span className="ml-2 text-gray-500">{t('loading')}</span>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('patient')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('type')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('recipient')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('date')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('priority')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredReferrals.map((ref) => (
                  <tr key={ref.id} className="hover:bg-gray-50 cursor-pointer">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Send className="w-5 h-5 text-gray-400 mr-3" />
                        <span className="text-sm font-medium text-gray-900">
                          {ref.patient_name || ref.patientName}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {referralTypeLabels[language][ref.referral_type || ref.referralType] ||
                        ref.referral_type ||
                        ref.referralType ||
                        '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {ref.recipient || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {ref.created_at
                        ? new Date(ref.created_at).toLocaleDateString('nb-NO')
                        : ref.date || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          ref.priority === 'urgent'
                            ? 'bg-red-100 text-red-800'
                            : ref.priority === 'soon'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {priorityLabels[language][ref.priority] || ref.priority || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          ref.status === 'completed' || ref.status === 'FINALIZED'
                            ? 'bg-green-100 text-green-800'
                            : ref.status === 'sent' || ref.status === 'SENT'
                              ? 'bg-blue-100 text-blue-800'
                              : ref.status === 'DRAFT'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {statusLabels[language][ref.status] || ref.status || '-'}
                      </span>
                    </td>
                  </tr>
                ))}
                {filteredReferrals.length === 0 && !loading && (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                      {t('noReferrals')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
