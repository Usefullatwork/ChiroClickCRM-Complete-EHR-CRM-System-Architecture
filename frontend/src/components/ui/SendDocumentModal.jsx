/**
 * SendDocumentModal - Unified document delivery modal
 * Allows sending documents to patients via email, SMS, or both
 */

import { useState } from 'react';
import { Mail, Phone, Send, X, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { pdfAPI, exercisesAPI } from '../../services/api';
import { useTranslation } from '../../i18n';
import logger from '../../utils/logger';

const DOCUMENT_TYPE_LABELS = {
  treatment_summary: 'Behandlingssammendrag',
  referral_letter: 'Henvisning',
  sick_note: 'Sykmelding',
  invoice: 'Faktura',
  exercise_prescription: 'Treningsprogram',
};

export default function SendDocumentModal({
  isOpen,
  onClose,
  documentType,
  documentId,
  patientId,
  patientName,
  onSuccess,
}) {
  const { t } = useTranslation('documents');
  const [method, setMethod] = useState('email');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) {
    return null;
  }

  const handleSend = async () => {
    try {
      setSending(true);
      setError(null);

      if (documentType === 'exercise_prescription') {
        await exercisesAPI.deliverPrescription(documentId, { method });
      } else {
        await pdfAPI.deliverDocument(documentType, documentId, { patientId, method });
      }

      setSuccess(true);
      onSuccess?.();
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1500);
    } catch (err) {
      logger.error('Document delivery failed:', err);
      setError(err.response?.data?.error || t('sendError', 'Kunne ikke sende dokumentet'));
    } finally {
      setSending(false);
    }
  };

  const handleClose = () => {
    if (sending) {
      return;
    }
    setError(null);
    setSuccess(false);
    setMethod('email');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={handleClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="send-doc-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 id="send-doc-title" className="text-lg font-semibold text-gray-900">
            {t('sendToPatient', 'Send dokument til pasient')}
          </h2>
          <button
            onClick={handleClose}
            disabled={sending}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label={t('close', 'Lukk')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Patient info */}
          <div className="text-sm text-gray-600">
            <span className="text-gray-400">{t('patient', 'Pasient')}:</span>{' '}
            <span className="font-medium text-gray-900">{patientName}</span>
          </div>

          {/* Document type */}
          <div className="text-sm text-gray-600">
            <span className="text-gray-400">{t('documentType', 'Dokumenttype')}:</span>{' '}
            <span className="font-medium text-gray-900">
              {DOCUMENT_TYPE_LABELS[documentType] || documentType}
            </span>
          </div>

          {/* Method selection */}
          <fieldset>
            <legend className="text-sm font-medium text-gray-700 mb-2">
              {t('deliveryMethod', 'Leveringsmetode')}
            </legend>
            <div className="space-y-2">
              {[
                { value: 'email', label: t('email', 'E-post'), icon: Mail },
                { value: 'sms', label: 'SMS', icon: Phone },
                { value: 'both', label: t('both', 'Begge'), icon: Send },
              ].map((opt) => (
                <label
                  key={opt.value}
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                    method === opt.value
                      ? 'border-teal-500 bg-teal-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="deliveryMethod"
                    value={opt.value}
                    checked={method === opt.value}
                    onChange={(e) => setMethod(e.target.value)}
                    className="sr-only"
                  />
                  <opt.icon
                    className={`w-4 h-4 ${method === opt.value ? 'text-teal-600' : 'text-gray-400'}`}
                  />
                  <span
                    className={`text-sm ${method === opt.value ? 'text-teal-700 font-medium' : 'text-gray-700'}`}
                  >
                    {opt.label}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-xl text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Success */}
          {success && (
            <div className="flex items-center gap-2 p-3 bg-green-50 text-green-700 rounded-xl text-sm">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{t('documentSent', 'Dokument sendt!')}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-5 border-t border-gray-100">
          <button
            onClick={handleClose}
            disabled={sending}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {t('cancel', 'Avbryt')}
          </button>
          <button
            onClick={handleSend}
            disabled={sending || success}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {t('send', 'Send')}
          </button>
        </div>
      </div>
    </div>
  );
}
