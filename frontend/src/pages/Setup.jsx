/**
 * First-Run Setup Wizard
 * Guides user through initial configuration on first launch
 * Steps: Welcome → Organization → User Account → AI Models → Done
 */

import { useState } from 'react';
import { getApiBaseUrl } from '../services/api';
import { useTranslation } from '../i18n';

const STEPS = ['Velkommen', 'Klinikk', 'Brukerkonto', 'AI-modeller', 'Ferdig'];

const Setup = ({ onComplete }) => {
  const { t } = useTranslation('settings');
  const [step, setStep] = useState(0);
  const [config, setConfig] = useState({
    clinicName: '',
    clinicAddress: '',
    clinicPhone: '',
    orgNumber: '',
    userName: '',
    userEmail: '',
    userPassword: '',
    installAI: true,
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [ollamaStatus, setOllamaStatus] = useState(null); // null | 'checking' | 'online' | 'offline'

  const updateConfig = (field, value) => {
    setConfig((prev) => ({ ...prev, [field]: value }));
    // Clear field error on change
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validateStep = (stepIndex) => {
    const newErrors = {};

    if (stepIndex === 1) {
      if (!config.clinicName.trim()) {
        newErrors.clinicName = t('setupClinicNameRequired', 'Klinikknavn er påkrevd');
      }
    }

    if (stepIndex === 2) {
      if (!config.userName.trim()) {
        newErrors.userName = t('setupNameRequired', 'Navn er påkrevd');
      }
      if (!config.userEmail.trim()) {
        newErrors.userEmail = t('setupEmailRequired', 'E-post er påkrevd');
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(config.userEmail)) {
        newErrors.userEmail = t('setupEmailInvalid', 'Ugyldig e-postadresse');
      }
      if (!config.userPassword) {
        newErrors.userPassword = t('setupPasswordRequired', 'Passord er påkrevd');
      } else {
        const pwdErrors = [];
        if (config.userPassword.length < 8) {
          pwdErrors.push(t('setupPwdMin8', 'minst 8 tegn'));
        }
        if (!/[a-z]/.test(config.userPassword)) {
          pwdErrors.push(t('setupPwdLowercase', 'minst én liten bokstav (a-z)'));
        }
        if (!/[A-Z]/.test(config.userPassword)) {
          pwdErrors.push(t('setupPwdUppercase', 'minst én stor bokstav (A-Z)'));
        }
        if (!/[0-9]/.test(config.userPassword)) {
          pwdErrors.push(t('setupPwdDigit', 'minst ett tall (0-9)'));
        }
        if (pwdErrors.length > 0) {
          newErrors.userPassword = `${t('setupPwdMustContain', 'Passord må inneholde')}: ${pwdErrors.join(', ')}`;
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (!validateStep(step)) {
      return;
    }

    const nextIndex = Math.min(step + 1, STEPS.length - 1);
    setStep(nextIndex);

    // Check Ollama status when entering AI step
    if (nextIndex === 3 && ollamaStatus === null) {
      checkOllama();
    }
  };

  const prevStep = () => setStep((prev) => Math.max(prev - 1, 0));

  const checkOllama = async () => {
    setOllamaStatus('checking');
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/v1/training/status`, {
        credentials: 'include',
      });
      setOllamaStatus(res.ok ? 'online' : 'offline');
    } catch {
      setOllamaStatus('offline');
    }
  };

  const handleSkip = async () => {
    setSubmitting(true);
    setSubmitError('');
    try {
      await fetch(`${getApiBaseUrl()}/api/v1/auth/skip-setup`, {
        method: 'POST',
        credentials: 'include',
      });
      onComplete?.();
    } catch {
      // Even if skip fails, let user through
      onComplete?.();
    } finally {
      setSubmitting(false);
    }
  };

  const handleFinish = async () => {
    setSubmitting(true);
    setSubmitError('');
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/v1/auth/setup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(config),
      });

      if (response.ok) {
        onComplete?.();
      } else {
        const data = await response.json().catch(() => ({}));
        setSubmitError(data.message || t('setupFailed', 'Oppsettet feilet. Prøv igjen.'));
      }
    } catch {
      setSubmitError(
        t('setupConnectionError', 'Kunne ikke koble til serveren. Er backend-serveren startet?')
      );
    } finally {
      setSubmitting(false);
    }
  };

  const FieldError = ({ field }) => {
    if (!errors[field]) {
      return null;
    }
    return <p className="text-red-500 text-sm mt-1">{errors[field]}</p>;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-lg w-full p-8">
        {/* Progress */}
        <div className="flex gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div
              key={s}
              className={`flex-1 h-2 rounded-full transition-colors ${i <= step ? 'bg-teal-500' : 'bg-gray-200 dark:bg-gray-600'}`}
            />
          ))}
        </div>

        {/* Step 0: Welcome */}
        {step === 0 && (
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">ChiroClickEHR</h1>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              {t(
                'setupWelcomeText',
                'Velkommen til ditt nye journalsystem. La oss sette opp klinikken din.'
              )}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
              {t('setupLocalStorage', 'Alt lagres lokalt på din maskin. Ingen skytjenester.')}
            </p>
          </div>
        )}

        {/* Step 1: Organization */}
        {step === 1 && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              {t('setupClinicInfo', 'Klinikkinformasjon')}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('setupClinicName', 'Klinikknavn')} *
                </label>
                <input
                  type="text"
                  value={config.clinicName}
                  onChange={(e) => updateConfig('clinicName', e.target.value)}
                  className={`w-full rounded-lg border px-3 py-2 dark:bg-gray-700 dark:text-white ${errors.clinicName ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                  placeholder={t('setupClinicNamePlaceholder', 'Min Kiropraktorklinikk')}
                />
                <FieldError field="clinicName" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('setupAddress', 'Adresse')}
                </label>
                <input
                  type="text"
                  value={config.clinicAddress}
                  onChange={(e) => updateConfig('clinicAddress', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white px-3 py-2"
                  placeholder={t('setupAddressPlaceholder', 'Storgata 1, 0001 Oslo')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('setupPhone', 'Telefon')}
                </label>
                <input
                  type="tel"
                  value={config.clinicPhone}
                  onChange={(e) => updateConfig('clinicPhone', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white px-3 py-2"
                  placeholder="+47 XX XX XX XX"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('setupOrgNumber', 'Org.nummer')}
                </label>
                <input
                  type="text"
                  value={config.orgNumber}
                  onChange={(e) => updateConfig('orgNumber', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white px-3 py-2"
                  placeholder="123 456 789"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: User Account */}
        {step === 2 && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              {t('setupUserAccount', 'Din brukerkonto')}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('setupFullName', 'Fullt navn')} *
                </label>
                <input
                  type="text"
                  value={config.userName}
                  onChange={(e) => updateConfig('userName', e.target.value)}
                  className={`w-full rounded-lg border px-3 py-2 dark:bg-gray-700 dark:text-white ${errors.userName ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                  placeholder={t('setupFullNamePlaceholder', 'Ola Nordmann')}
                />
                <FieldError field="userName" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('setupEmail', 'E-post')} *
                </label>
                <input
                  type="email"
                  value={config.userEmail}
                  onChange={(e) => updateConfig('userEmail', e.target.value)}
                  className={`w-full rounded-lg border px-3 py-2 dark:bg-gray-700 dark:text-white ${errors.userEmail ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                  placeholder="ola@klinikken.no"
                />
                <FieldError field="userEmail" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('setupPassword', 'Passord')} *
                </label>
                <input
                  type="password"
                  value={config.userPassword}
                  onChange={(e) => updateConfig('userPassword', e.target.value)}
                  className={`w-full rounded-lg border px-3 py-2 dark:bg-gray-700 dark:text-white ${errors.userPassword ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                  placeholder={t('setupPasswordPlaceholder', 'Minst 8 tegn')}
                />
                <FieldError field="userPassword" />
              </div>
            </div>
          </div>
        )}

        {/* Step 3: AI Models */}
        {step === 3 && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              {t('setupAIAssistant', 'AI-assistent')}
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              {t(
                'setupAIDescription',
                'ChiroClickEHR bruker lokale AI-modeller via Ollama for klinisk dokumentasjon.'
              )}
            </p>

            {/* Ollama status indicator */}
            <div className="mb-4 flex items-center gap-2 text-sm">
              <span
                className={`inline-block w-2.5 h-2.5 rounded-full ${
                  ollamaStatus === 'online'
                    ? 'bg-green-500'
                    : ollamaStatus === 'offline'
                      ? 'bg-red-500'
                      : ollamaStatus === 'checking'
                        ? 'bg-yellow-400 animate-pulse'
                        : 'bg-gray-400'
                }`}
              />
              <span className="text-gray-600 dark:text-gray-300">
                {ollamaStatus === 'online' && t('setupOllamaRunning', 'Ollama kjører')}
                {ollamaStatus === 'offline' &&
                  t('setupOllamaNotFound', 'Ollama ikke funnet — installer fra ollama.com')}
                {ollamaStatus === 'checking' &&
                  t('setupOllamaChecking', 'Sjekker Ollama-tilkobling...')}
                {ollamaStatus === null && t('setupOllamaUnknown', 'Ollama-status ukjent')}
              </span>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-4">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={config.installAI}
                  onChange={(e) => updateConfig('installAI', e.target.checked)}
                  className="w-5 h-5 rounded border-gray-300 text-teal-600"
                />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {t('setupEnableAI', 'Aktiver AI-funksjoner')}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t('setupRequiresOllama', 'Krever Ollama installert (ollama.com)')}
                  </p>
                </div>
              </label>
            </div>
            {config.installAI && (
              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                <p>{t('setupAIModelsUsed', 'AI-modeller som brukes:')}</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>
                    chiro-no-sft-dpo-v6 (Qwen2.5-7B, ~8 GB) —{' '}
                    {t('setupModelMain', 'Klinisk dokumentasjon, SOAP, brev')}
                  </li>
                  <li>
                    chiro-fast (Qwen2.5-1.5B, ~1 GB) — {t('setupModelFast', 'Autofullføring')}
                  </li>
                  <li>
                    chiro-medical (Qwen2.5-3B, ~2 GB) —{' '}
                    {t('setupModelMedical', 'Klinisk sikkerhet og røde flagg')}
                  </li>
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Step 4: Done */}
        {step === 4 && (
          <div className="text-center">
            <div className="text-5xl mb-4 text-teal-600">&#10003;</div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              {t('setupAllReady', 'Alt klart!')}
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-2">
              {t('setupConfigured', 'ChiroClickEHR er konfigurert og klar til bruk.')}
            </p>
            {submitError && <p className="text-red-500 text-sm mb-4">{submitError}</p>}
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between items-center mt-8">
          <div>
            {step > 0 ? (
              <button
                onClick={prevStep}
                disabled={submitting}
                className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 disabled:opacity-50"
              >
                {t('setupBack', 'Tilbake')}
              </button>
            ) : (
              <button
                onClick={handleSkip}
                disabled={submitting}
                className="text-sm text-gray-400 dark:text-gray-300 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50"
              >
                {t('setupSkip', 'Hopp over oppsett')}
              </button>
            )}
          </div>

          {step < STEPS.length - 1 ? (
            <button
              onClick={nextStep}
              className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
            >
              {t('setupNext', 'Neste')}
            </button>
          ) : (
            <button
              onClick={handleFinish}
              disabled={submitting}
              className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 flex items-center gap-2"
            >
              {submitting && (
                <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
              )}
              {t('setupStart', 'Start ChiroClickEHR')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Setup;
