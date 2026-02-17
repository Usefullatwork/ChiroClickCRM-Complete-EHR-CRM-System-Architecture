import { useState, useEffect } from 'react';
import {
  Mail,
  Smartphone,
  Send,
  X,
  Check,
  AlertCircle,
  Loader2,
  FileText,
  ExternalLink,
  Copy,
  CheckCircle2,
} from 'lucide-react';
import api from '../../api/client';

/**
 * Send Program Modal Component
 * Modal for sending exercise programs to patients via email and/or SMS
 *
 * @param {Object} props - Component props
 * @param {boolean} props.isOpen - Whether modal is open
 * @param {Function} props.onClose - Close handler
 * @param {Object} props.prescription - Prescription object
 * @param {Object} props.patient - Patient object
 * @param {Function} props.onSent - Callback after successful send
 */
export default function SendProgramModal({ isOpen, onClose, prescription, patient, onSent }) {
  const [sendMethod, setSendMethod] = useState('both'); // 'email', 'sms', 'both'
  const [includeAttachment, setIncludeAttachment] = useState(true);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);

  const hasEmail = !!patient?.email;
  const hasPhone = !!(patient?.phone || patient?.mobile);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setResult(null);
      setSendMethod('both');
      setIncludeAttachment(true);
    }
  }, [isOpen]);

  // Set default method based on availability
  useEffect(() => {
    if (!hasEmail && hasPhone) {
      setSendMethod('sms');
    } else if (hasEmail && !hasPhone) {
      setSendMethod('email');
    } else {
      setSendMethod('both');
    }
  }, [hasEmail, hasPhone]);

  if (!isOpen) {
    return null;
  }

  // Determine available methods
  const availableMethods = [];
  if (hasEmail) {
    availableMethods.push('email');
  }
  if (hasPhone) {
    availableMethods.push('sms');
  }
  if (hasEmail && hasPhone) {
    availableMethods.push('both');
  }

  const handleSend = async () => {
    setSending(true);
    setResult(null);

    try {
      let endpoint;
      if (sendMethod === 'email') {
        endpoint = '/api/notifications/exercises/email';
      } else if (sendMethod === 'sms') {
        endpoint = '/api/notifications/exercises/sms';
      } else {
        endpoint = '/api/notifications/exercises/both';
      }

      const response = await api.post(endpoint, {
        prescriptionId: prescription.id,
        includeAttachment,
      });

      setResult({
        success: true,
        message: response.data.message || 'Sendt!',
        details: response.data.results,
      });

      if (onSent) {
        onSent(response.data);
      }
    } catch (error) {
      setResult({
        success: false,
        message: error.response?.data?.error || 'Kunne ikke sende',
        details: error.response?.data?.details,
      });
    } finally {
      setSending(false);
    }
  };

  const handleCopyLink = async () => {
    const portalLink = `${window.location.origin}/portal/exercises/${prescription.portal_access_token}`;
    try {
      await navigator.clipboard.writeText(portalLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
    }
  };

  const portalLink = `${window.location.origin}/portal/exercises/${prescription.portal_access_token}`;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 transition-opacity" onClick={onClose} />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-md transform overflow-hidden rounded-xl bg-white shadow-2xl transition-all">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-white/20 p-2">
                  <Send className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">Send ovelsesprogram</h2>
                  <p className="text-sm text-blue-100">
                    {patient?.first_name || patient?.firstName}{' '}
                    {patient?.last_name || patient?.lastName}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="rounded-full p-1.5 text-white/80 hover:bg-white/10 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-5">
            {/* Patient contact info */}
            <div className="mb-5 rounded-lg bg-gray-50 p-4">
              <h3 className="mb-3 text-sm font-medium text-gray-700">Kontaktinformasjon</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <Mail className={`h-4 w-4 ${hasEmail ? 'text-green-600' : 'text-gray-400'}`} />
                  <span className={`text-sm ${hasEmail ? 'text-gray-900' : 'text-gray-400'}`}>
                    {patient?.email || 'Ingen e-post registrert'}
                  </span>
                  {hasEmail && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                </div>
                <div className="flex items-center gap-3">
                  <Smartphone
                    className={`h-4 w-4 ${hasPhone ? 'text-green-600' : 'text-gray-400'}`}
                  />
                  <span className={`text-sm ${hasPhone ? 'text-gray-900' : 'text-gray-400'}`}>
                    {patient?.phone || patient?.mobile || 'Ingen telefon registrert'}
                  </span>
                  {hasPhone && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                </div>
              </div>
            </div>

            {/* Send method selection */}
            {(hasEmail || hasPhone) && (
              <div className="mb-5">
                <h3 className="mb-3 text-sm font-medium text-gray-700">Hvordan vil du sende?</h3>
                <div className="grid grid-cols-3 gap-2">
                  {/* Email option */}
                  <button
                    onClick={() => setSendMethod('email')}
                    disabled={!hasEmail}
                    className={`flex flex-col items-center gap-1.5 rounded-lg border-2 p-3 transition-all ${
                      sendMethod === 'email'
                        ? 'border-blue-500 bg-blue-50'
                        : hasEmail
                          ? 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          : 'cursor-not-allowed border-gray-100 bg-gray-50 opacity-50'
                    }`}
                  >
                    <Mail
                      className={`h-5 w-5 ${
                        sendMethod === 'email' ? 'text-blue-600' : 'text-gray-500'
                      }`}
                    />
                    <span
                      className={`text-xs font-medium ${
                        sendMethod === 'email' ? 'text-blue-700' : 'text-gray-600'
                      }`}
                    >
                      E-post
                    </span>
                  </button>

                  {/* SMS option */}
                  <button
                    onClick={() => setSendMethod('sms')}
                    disabled={!hasPhone}
                    className={`flex flex-col items-center gap-1.5 rounded-lg border-2 p-3 transition-all ${
                      sendMethod === 'sms'
                        ? 'border-blue-500 bg-blue-50'
                        : hasPhone
                          ? 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          : 'cursor-not-allowed border-gray-100 bg-gray-50 opacity-50'
                    }`}
                  >
                    <Smartphone
                      className={`h-5 w-5 ${
                        sendMethod === 'sms' ? 'text-blue-600' : 'text-gray-500'
                      }`}
                    />
                    <span
                      className={`text-xs font-medium ${
                        sendMethod === 'sms' ? 'text-blue-700' : 'text-gray-600'
                      }`}
                    >
                      SMS
                    </span>
                  </button>

                  {/* Both option */}
                  <button
                    onClick={() => setSendMethod('both')}
                    disabled={!hasEmail || !hasPhone}
                    className={`flex flex-col items-center gap-1.5 rounded-lg border-2 p-3 transition-all ${
                      sendMethod === 'both'
                        ? 'border-blue-500 bg-blue-50'
                        : hasEmail && hasPhone
                          ? 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          : 'cursor-not-allowed border-gray-100 bg-gray-50 opacity-50'
                    }`}
                  >
                    <div className="flex -space-x-1">
                      <Mail
                        className={`h-4 w-4 ${
                          sendMethod === 'both' ? 'text-blue-600' : 'text-gray-500'
                        }`}
                      />
                      <Smartphone
                        className={`h-4 w-4 ${
                          sendMethod === 'both' ? 'text-blue-600' : 'text-gray-500'
                        }`}
                      />
                    </div>
                    <span
                      className={`text-xs font-medium ${
                        sendMethod === 'both' ? 'text-blue-700' : 'text-gray-600'
                      }`}
                    >
                      Begge
                    </span>
                  </button>
                </div>
              </div>
            )}

            {/* Email attachment option */}
            {(sendMethod === 'email' || sendMethod === 'both') && hasEmail && (
              <div className="mb-5">
                <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 p-3 hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={includeAttachment}
                    onChange={(e) => setIncludeAttachment(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <FileText className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Legg ved PDF</p>
                    <p className="text-xs text-gray-500">
                      Inkluder ovelsesprogrammet som PDF-vedlegg
                    </p>
                  </div>
                </label>
              </div>
            )}

            {/* Program summary */}
            <div className="mb-5 rounded-lg border border-gray-200 p-4">
              <h3 className="mb-2 text-sm font-medium text-gray-700">Program</h3>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">
                  {prescription?.exercises?.length || 0} ovelser
                </span>
                <span className="text-gray-500">
                  {prescription?.prescribed_at
                    ? new Date(prescription.prescribed_at).toLocaleDateString('nb-NO')
                    : 'I dag'}
                </span>
              </div>
              {prescription?.patient_instructions && (
                <p className="mt-2 text-xs text-gray-500 line-clamp-2">
                  {prescription.patient_instructions}
                </p>
              )}
            </div>

            {/* Copy link option */}
            <div className="mb-5">
              <button
                onClick={handleCopyLink}
                className="flex w-full items-center justify-between rounded-lg border border-gray-200 p-3 text-left hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <ExternalLink className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Kopier lenke</p>
                    <p className="truncate text-xs text-gray-500 max-w-[200px]">{portalLink}</p>
                  </div>
                </div>
                {copied ? (
                  <Check className="h-5 w-5 text-green-500" />
                ) : (
                  <Copy className="h-5 w-5 text-gray-400" />
                )}
              </button>
            </div>

            {/* No contact info warning */}
            {!hasEmail && !hasPhone && (
              <div className="mb-5 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
                <AlertCircle className="h-5 w-5 flex-shrink-0 text-amber-600" />
                <div>
                  <p className="text-sm font-medium text-amber-800">Ingen kontaktinformasjon</p>
                  <p className="mt-1 text-xs text-amber-700">
                    Pasienten har verken e-post eller telefonnummer registrert. Du kan kopiere
                    lenken og dele den manuelt.
                  </p>
                </div>
              </div>
            )}

            {/* Result message */}
            {result && (
              <div
                className={`mb-5 flex items-start gap-3 rounded-lg border p-4 ${
                  result.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                }`}
              >
                {result.success ? (
                  <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-green-600" />
                ) : (
                  <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-600" />
                )}
                <div>
                  <p
                    className={`text-sm font-medium ${
                      result.success ? 'text-green-800' : 'text-red-800'
                    }`}
                  >
                    {result.message}
                  </p>
                  {result.details && (
                    <div className="mt-2 space-y-1">
                      {result.details.email && (
                        <p
                          className={`text-xs ${
                            result.details.email.success ? 'text-green-700' : 'text-red-700'
                          }`}
                        >
                          E-post:{' '}
                          {result.details.email.success
                            ? 'Sendt'
                            : result.details.email.error || 'Feilet'}
                        </p>
                      )}
                      {result.details.sms && (
                        <p
                          className={`text-xs ${
                            result.details.sms.success ? 'text-green-700' : 'text-red-700'
                          }`}
                        >
                          SMS:{' '}
                          {result.details.sms.success
                            ? 'Sendt'
                            : result.details.sms.error || 'Feilet'}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4">
            <button
              onClick={onClose}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              {result?.success ? 'Lukk' : 'Avbryt'}
            </button>
            {(hasEmail || hasPhone) && !result?.success && (
              <button
                onClick={handleSend}
                disabled={sending}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {sending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sender...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Send{' '}
                    {sendMethod === 'email' ? 'e-post' : sendMethod === 'sms' ? 'SMS' : 'begge'}
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
