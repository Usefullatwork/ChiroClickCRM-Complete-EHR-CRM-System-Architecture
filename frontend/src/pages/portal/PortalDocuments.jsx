/**
 * Portal Documents - Patient document list and download page
 * Shows documents shared with the patient via the portal
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Download,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { patientPortalAPI } from '../../services/api';
import { useTranslation } from '../../i18n';
import logger from '../../utils/logger';

const DOCUMENT_TYPE_LABELS = {
  treatment_summary: 'Behandlingssammendrag',
  referral_letter: 'Henvisning',
  sick_note: 'Sykmelding',
  invoice: 'Faktura',
  exercise_prescription: 'Treningsprogram',
};

const DOCUMENT_TYPE_COLORS = {
  treatment_summary: { color: 'text-blue-600', bg: 'bg-blue-100' },
  referral_letter: { color: 'text-purple-600', bg: 'bg-purple-100' },
  sick_note: { color: 'text-amber-600', bg: 'bg-amber-100' },
  invoice: { color: 'text-green-600', bg: 'bg-green-100' },
  exercise_prescription: { color: 'text-teal-600', bg: 'bg-teal-100' },
};

export default function PortalDocuments() {
  const navigate = useNavigate();
  const { t } = useTranslation('portal');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [downloading, setDownloading] = useState(null);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await patientPortalAPI.getDocuments();
      setDocuments(res.data?.documents || []);
    } catch (err) {
      logger.error('Failed to load portal documents:', err);
      setError(t('documentsLoadError', 'Kunne ikke laste dokumenter'));
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (doc) => {
    if (!doc.downloadToken) {
      return;
    }
    try {
      setDownloading(doc.id);
      const res = await patientPortalAPI.downloadDocument(doc.downloadToken);
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${doc.title || 'dokument'}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      // Update local state to show downloaded
      setDocuments((prev) =>
        prev.map((d) => (d.id === doc.id ? { ...d, downloadedAt: new Date().toISOString() } : d))
      );
    } catch (err) {
      logger.error('Document download failed:', err);
      setError(t('downloadError', 'Kunne ikke laste ned dokumentet'));
    } finally {
      setDownloading(null);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) {
      return '';
    }
    return new Date(dateStr).toLocaleDateString('nb-NO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-teal-50 to-white flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-teal-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">{t('loadingDocuments', 'Laster dokumenter...')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 to-white">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <button
            onClick={() => navigate('/portal')}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label={t('back', 'Tilbake')}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              {t('myDocuments', 'Mine dokumenter')}
            </h1>
            <p className="text-sm text-gray-500">
              {t('documentsDescription', 'Dokumenter delt med deg av klinikken')}
            </p>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-3">
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-xl border border-red-200">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {documents.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">{t('noDocuments', 'Ingen dokumenter ennå')}</p>
            <p className="text-gray-400 text-sm mt-1">
              {t('noDocumentsHint', 'Dokumenter fra klinikken vil vises her')}
            </p>
          </div>
        ) : (
          documents.map((doc) => {
            const typeStyle = DOCUMENT_TYPE_COLORS[doc.documentType] || {
              color: 'text-gray-600',
              bg: 'bg-gray-100',
            };
            const isExpired = doc.expired;

            return (
              <div
                key={doc.id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center gap-4"
              >
                <div
                  className={`w-10 h-10 ${typeStyle.bg} rounded-full flex items-center justify-center flex-shrink-0`}
                >
                  <FileText className={`w-5 h-5 ${typeStyle.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{doc.title}</p>
                  <div className="flex items-center gap-2 text-sm text-gray-500 mt-0.5">
                    <span>{DOCUMENT_TYPE_LABELS[doc.documentType] || doc.documentType}</span>
                    <span>&bull;</span>
                    <span>{formatDate(doc.createdAt)}</span>
                  </div>
                  {doc.downloadedAt && (
                    <div className="flex items-center gap-1 text-xs text-green-600 mt-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>
                        {t('downloaded', 'Lastet ned')} {formatDate(doc.downloadedAt)}
                      </span>
                    </div>
                  )}
                </div>
                {isExpired ? (
                  <div
                    className="flex items-center gap-1 text-sm text-gray-400"
                    title={t('linkExpired', 'Lenken har utløpt')}
                  >
                    <Clock className="w-4 h-4" />
                    <span className="text-xs">{t('expired', 'Utløpt')}</span>
                  </div>
                ) : (
                  <button
                    onClick={() => handleDownload(doc)}
                    disabled={downloading === doc.id}
                    className="p-2 text-teal-600 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition-colors disabled:opacity-50"
                    aria-label={`${t('download', 'Last ned')} ${doc.title}`}
                  >
                    {downloading === doc.id ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Download className="w-5 h-5" />
                    )}
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
