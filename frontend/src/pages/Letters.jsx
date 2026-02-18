/**
 * Letters Page - Unified Clinical Document Management
 *
 * Provides access to all letter/document types:
 * - Sick Notes (Sykemeldinger)
 * - Referral Letters (Henvisninger)
 * - Medical Certificates (Medisinske erklæringer)
 * - Clinical Notes (Kliniske notater)
 */

import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from '../i18n';
import {
  FileText,
  Send,
  Award,
  ClipboardList,
  Plus,
  Search,
  Filter,
  Loader2,
  AlertCircle,
  RefreshCw,
  ChevronRight,
  Calendar,
  User,
  Sparkles,
} from 'lucide-react';
import { lettersApi } from '../api/letters';

import logger from '../utils/logger';
// Letter type definitions
const LETTER_TYPES = {
  SICK_NOTE: {
    id: 'SICK_NOTE',
    name: { no: 'Sykemelding', en: 'Sick Note' },
    description: { no: 'NAV-kompatible sykemeldinger', en: 'NAV-compliant sick notes' },
    icon: FileText,
    color: 'blue',
    route: '/sick-notes',
  },
  REFERRAL: {
    id: 'REFERRAL',
    name: { no: 'Henvisning', en: 'Referral' },
    description: { no: 'Henvisninger til spesialister', en: 'Referrals to specialists' },
    icon: Send,
    color: 'green',
    route: '/referral-letters',
  },
  MEDICAL_CERTIFICATE: {
    id: 'MEDICAL_CERTIFICATE',
    name: { no: 'Medisinsk erklæring', en: 'Medical Certificate' },
    description: {
      no: 'Erklæringer for arbeidsgiver, universitet, etc.',
      en: 'Certificates for employer, university, etc.',
    },
    icon: Award,
    color: 'purple',
    route: '/certificates',
  },
  CLINICAL_NOTE: {
    id: 'CLINICAL_NOTE',
    name: { no: 'Klinisk notat', en: 'Clinical Note' },
    description: { no: 'Detaljerte kliniske notater', en: 'Detailed clinical notes' },
    icon: ClipboardList,
    color: 'orange',
    route: '/clinical-notes',
  },
};

// Status badge colors
const STATUS_COLORS = {
  DRAFT: 'bg-gray-100 text-gray-800',
  FINALIZED: 'bg-blue-100 text-blue-800',
  SENT: 'bg-green-100 text-green-800',
  ARCHIVED: 'bg-gray-100 text-gray-600',
};

export default function Letters() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { lang: language, setLang: setLanguage } = useTranslation();
  const [letters, setLetters] = useState([]);
  const [_letterTypes, setLetterTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState(searchParams.get('type') || 'all');
  const [view, setView] = useState('dashboard'); // 'dashboard' | 'list'

  // Fetch letter types from API
  const fetchLetterTypes = async () => {
    try {
      const response = await lettersApi.getLetterTypes();
      setLetterTypes(response.types || response || []);
    } catch (err) {
      logger.error('Error fetching letter types:', err);
      // Use default types on error
      setLetterTypes(Object.values(LETTER_TYPES));
    }
  };

  // Fetch recent letters
  const fetchLetters = async () => {
    try {
      setLoading(true);
      setError(null);

      // For demo, use mock data until API is fully connected
      // In production: const response = await lettersApi.getAllLetters({ type: selectedType !== 'all' ? selectedType : undefined })

      setLetters([
        {
          id: '1',
          letterType: 'SICK_NOTE',
          patientName: 'Ola Nordmann',
          title: 'Sykemelding - L84 Rygglidelse',
          createdAt: '2026-01-16T10:30:00Z',
          status: 'SENT',
        },
        {
          id: '2',
          letterType: 'REFERRAL',
          patientName: 'Kari Hansen',
          title: 'Henvisning til MR - Nakke',
          createdAt: '2026-01-15T14:20:00Z',
          status: 'DRAFT',
        },
        {
          id: '3',
          letterType: 'MEDICAL_CERTIFICATE',
          patientName: 'Per Olsen',
          title: 'Universitetserklæring',
          createdAt: '2026-01-14T09:15:00Z',
          status: 'FINALIZED',
        },
        {
          id: '4',
          letterType: 'SICK_NOTE',
          patientName: 'Lisa Eriksen',
          title: 'Sykemelding - L01 Nakkeplager',
          createdAt: '2026-01-13T11:45:00Z',
          status: 'SENT',
        },
      ]);
    } catch (err) {
      logger.error('Error fetching letters:', err);
      setError(language === 'no' ? 'Kunne ikke laste brev' : 'Failed to load letters');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLetterTypes();
    fetchLetters();
  }, [selectedType]);

  // Filter letters
  const filteredLetters = letters.filter((letter) => {
    const matchesSearch =
      letter.patientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      letter.title?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'all' || letter.letterType === selectedType;
    return matchesSearch && matchesType;
  });

  // Get type config
  const getTypeConfig = (typeId) => LETTER_TYPES[typeId] || LETTER_TYPES.CLINICAL_NOTE;

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(language === 'no' ? 'nb-NO' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Dashboard view with type cards
  const renderDashboard = () => (
    <div className="space-y-8">
      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          {language === 'no' ? 'Opprett nytt dokument' : 'Create New Document'}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.values(LETTER_TYPES).map((type) => {
            const Icon = type.icon;
            return (
              <button
                key={type.id}
                onClick={() => navigate(`${type.route}?new=true`)}
                className={`p-6 bg-white rounded-xl border-2 border-transparent hover:border-${type.color}-500 shadow-sm hover:shadow-md transition-all text-left group`}
              >
                <div
                  className={`w-12 h-12 rounded-lg bg-${type.color}-100 flex items-center justify-center mb-4 group-hover:bg-${type.color}-200 transition-colors`}
                >
                  <Icon className={`w-6 h-6 text-${type.color}-600`} />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{type.name[language]}</h3>
                <p className="text-sm text-gray-500">{type.description[language]}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* AI Letter Generation */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-6 text-white">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-white/20 rounded-lg">
            <Sparkles className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-2">
              {language === 'no' ? 'AI-assistert brevgenerering' : 'AI-Assisted Letter Generation'}
            </h3>
            <p className="text-white/80 mb-4">
              {language === 'no'
                ? 'La AI hjelpe deg med å generere profesjonelle medisinske brev basert på pasientdata og kliniske funn.'
                : 'Let AI help you generate professional medical letters based on patient data and clinical findings.'}
            </p>
            <button
              onClick={() => navigate('/ai-letters')}
              className="px-4 py-2 bg-white text-purple-600 rounded-lg font-medium hover:bg-white/90 transition-colors"
            >
              {language === 'no' ? 'Prøv AI-generering' : 'Try AI Generation'}
            </button>
          </div>
        </div>
      </div>

      {/* Recent Letters */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {language === 'no' ? 'Nylige dokumenter' : 'Recent Documents'}
          </h2>
          <button
            onClick={() => setView('list')}
            className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            {language === 'no' ? 'Se alle' : 'View all'}
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12 bg-white rounded-xl">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {filteredLetters.slice(0, 5).map((letter, index) => {
              const typeConfig = getTypeConfig(letter.letterType);
              const Icon = typeConfig.icon;

              return (
                <div
                  key={letter.id}
                  className={`p-4 flex items-center gap-4 hover:bg-gray-50 cursor-pointer ${
                    index !== 0 ? 'border-t border-gray-100' : ''
                  }`}
                  onClick={() => navigate(`${typeConfig.route}/${letter.id}`)}
                >
                  <div
                    className={`w-10 h-10 rounded-lg bg-${typeConfig.color}-100 flex items-center justify-center`}
                  >
                    <Icon className={`w-5 h-5 text-${typeConfig.color}-600`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900 truncate">{letter.title}</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[letter.status]}`}
                      >
                        {letter.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                      <span className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5" />
                        {letter.patientName}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatDate(letter.createdAt)}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              );
            })}

            {filteredLetters.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                {language === 'no' ? 'Ingen dokumenter funnet' : 'No documents found'}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  // List view
  const renderList = () => (
    <div>
      {/* Search and filters */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder={
              language === 'no'
                ? 'Søk etter pasient eller tittel...'
                : 'Search by patient or title...'
            }
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="all">{language === 'no' ? 'Alle typer' : 'All types'}</option>
          {Object.values(LETTER_TYPES).map((type) => (
            <option key={type.id} value={type.id}>
              {type.name[language]}
            </option>
          ))}
        </select>
        <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
          <Filter className="w-4 h-4" />
          {language === 'no' ? 'Filter' : 'Filter'}
        </button>
      </div>

      {/* Letters table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {language === 'no' ? 'Dokument' : 'Document'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {language === 'no' ? 'Type' : 'Type'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {language === 'no' ? 'Pasient' : 'Patient'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {language === 'no' ? 'Dato' : 'Date'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {language === 'no' ? 'Status' : 'Status'}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredLetters.map((letter) => {
                const typeConfig = getTypeConfig(letter.letterType);
                const Icon = typeConfig.icon;

                return (
                  <tr
                    key={letter.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => navigate(`${typeConfig.route}/${letter.id}`)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-lg bg-${typeConfig.color}-100 flex items-center justify-center`}
                        >
                          <Icon className={`w-4 h-4 text-${typeConfig.color}-600`} />
                        </div>
                        <span className="font-medium text-gray-900">{letter.title}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {typeConfig.name[language]}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {letter.patientName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(letter.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[letter.status]}`}
                      >
                        {letter.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {filteredLetters.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                    {language === 'no' ? 'Ingen dokumenter funnet' : 'No documents found'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              {language === 'no' ? 'Dokumenter & Brev' : 'Documents & Letters'}
            </h1>
            <p className="text-sm text-gray-500">
              {language === 'no'
                ? 'Administrer kliniske dokumenter og brev'
                : 'Manage clinical documents and letters'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* View toggle */}
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setView('dashboard')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  view === 'dashboard' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
                }`}
              >
                {language === 'no' ? 'Oversikt' : 'Dashboard'}
              </button>
              <button
                onClick={() => setView('list')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  view === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
                }`}
              >
                {language === 'no' ? 'Liste' : 'List'}
              </button>
            </div>

            {/* Language toggle */}
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setLanguage('no')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  language === 'no' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
                }`}
              >
                NO
              </button>
              <button
                onClick={() => setLanguage('en')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  language === 'en' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
                }`}
              >
                EN
              </button>
            </div>

            {/* Refresh */}
            <button
              onClick={fetchLetters}
              disabled={loading}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>

            {/* New document dropdown */}
            <button
              onClick={() => navigate('/sick-notes?new=true')}
              className="flex items-center gap-2 px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              {language === 'no' ? 'Nytt dokument' : 'New Document'}
            </button>
          </div>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
          <AlertCircle className="w-5 h-5" />
          {error}
          <button onClick={fetchLetters} className="ml-auto text-sm underline">
            {language === 'no' ? 'Prøv igjen' : 'Try again'}
          </button>
        </div>
      )}

      {/* Content */}
      <div className="p-6">{view === 'dashboard' ? renderDashboard() : renderList()}</div>
    </div>
  );
}
