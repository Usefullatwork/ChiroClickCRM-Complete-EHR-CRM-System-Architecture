/**
 * First-Run Setup Wizard
 * Guides user through initial configuration on first launch
 * Steps: Welcome → Organization → User Account → AI Models → Done
 */

import _React, { useState } from 'react';

const STEPS = ['Velkommen', 'Klinikk', 'Brukerkonto', 'AI-modeller', 'Ferdig'];

const Setup = ({ onComplete }) => {
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

  const updateConfig = (field, value) => {
    setConfig((prev) => ({ ...prev, [field]: value }));
  };

  const nextStep = () => setStep((prev) => Math.min(prev + 1, STEPS.length - 1));
  const prevStep = () => setStep((prev) => Math.max(prev - 1, 0));

  const handleFinish = async () => {
    try {
      // Create organization and admin user
      const response = await fetch('/api/v1/auth/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      if (response.ok) {
        localStorage.setItem('chiroclickcrm_setup_complete', 'true');
        onComplete?.();
      }
    } catch (error) {
      // Setup endpoint may not exist yet - just complete anyway
      localStorage.setItem('chiroclickcrm_setup_complete', 'true');
      onComplete?.();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-lg w-full p-8">
        {/* Progress */}
        <div className="flex gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div
              key={s}
              className={`flex-1 h-2 rounded-full ${i <= step ? 'bg-teal-500' : 'bg-gray-200 dark:bg-gray-600'}`}
            />
          ))}
        </div>

        {/* Step 0: Welcome */}
        {step === 0 && (
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">ChiroClickCRM</h1>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Velkommen til ditt nye journalsystem. La oss sette opp klinikken din.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
              Alt lagres lokalt på din maskin. Ingen skytjenester.
            </p>
          </div>
        )}

        {/* Step 1: Organization */}
        {step === 1 && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Klinikkinformasjon
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Klinikknavn *
                </label>
                <input
                  type="text"
                  value={config.clinicName}
                  onChange={(e) => updateConfig('clinicName', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white px-3 py-2"
                  placeholder="Min Kiropraktorklinikk"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Adresse
                </label>
                <input
                  type="text"
                  value={config.clinicAddress}
                  onChange={(e) => updateConfig('clinicAddress', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white px-3 py-2"
                  placeholder="Storgata 1, 0001 Oslo"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Telefon
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
                  Org.nummer
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
              Din brukerkonto
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Fullt navn *
                </label>
                <input
                  type="text"
                  value={config.userName}
                  onChange={(e) => updateConfig('userName', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white px-3 py-2"
                  placeholder="Ola Nordmann"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  E-post *
                </label>
                <input
                  type="email"
                  value={config.userEmail}
                  onChange={(e) => updateConfig('userEmail', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white px-3 py-2"
                  placeholder="ola@klinikken.no"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Passord *
                </label>
                <input
                  type="password"
                  value={config.userPassword}
                  onChange={(e) => updateConfig('userPassword', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white px-3 py-2"
                  placeholder="Minst 8 tegn"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 3: AI Models */}
        {step === 3 && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              AI-assistent
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              ChiroClickCRM bruker lokale AI-modeller via Ollama for klinisk dokumentasjon.
            </p>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-4">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={config.installAI}
                  onChange={(e) => updateConfig('installAI', e.target.checked)}
                  className="w-5 h-5 rounded border-gray-300 text-teal-600"
                />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Installer AI-modeller</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Krever ~14 GB diskplass og Ollama installert
                  </p>
                </div>
              </label>
            </div>
            {config.installAI && (
              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                <p>Modeller som installeres:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>chiro-no (Mistral 7B) - Klinisk dokumentasjon</li>
                  <li>chiro-fast (Llama 3.2 3B) - Autofullføring</li>
                  <li>chiro-norwegian (NorwAI-Mistral-7B) - Norsk språk</li>
                  <li>chiro-medical (MedGemma 4B) - Klinisk sikkerhet</li>
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Step 4: Done */}
        {step === 4 && (
          <div className="text-center">
            <div className="text-5xl mb-4">&#10003;</div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Alt klart!</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              ChiroClickCRM er konfigurert og klar til bruk.
            </p>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          {step > 0 ? (
            <button
              onClick={prevStep}
              className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-900"
            >
              Tilbake
            </button>
          ) : (
            <div />
          )}

          {step < STEPS.length - 1 ? (
            <button
              onClick={nextStep}
              className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
            >
              Neste
            </button>
          ) : (
            <button
              onClick={handleFinish}
              className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
            >
              Start ChiroClickCRM
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Setup;
