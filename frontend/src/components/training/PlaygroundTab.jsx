/**
 * PlaygroundTab — Model testing playground with side-by-side comparison
 *
 * Features:
 * - Large prompt textarea + model selector
 * - Single model vs side-by-side comparison toggle
 * - Preset prompts for standard test scenarios
 * - Result display with latency and token count
 * - Side-by-side: two result cards, same prompt
 */

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Play, TestTube, Clock, Columns, Monitor, Zap } from 'lucide-react';
import { trainingAPI } from '../../services/api';

const MODELS = [
  { value: 'chiro-no', label: 'chiro-no (Standard)' },
  { value: 'chiro-fast', label: 'chiro-fast (Rask)' },
  { value: 'chiro-norwegian', label: 'chiro-norwegian (Norsk)' },
  { value: 'chiro-medical', label: 'chiro-medical (Medisinsk)' },
];

const PRESET_PROMPTS = [
  {
    label: 'SOAP nakkesmerter',
    prompt:
      'Skriv en subjektiv seksjon for en pasient med kroniske nakkesmerter som stråler til høyre skulder, forverret ved kontorarbeid.',
  },
  {
    label: 'Diagnosekoder',
    prompt:
      'Foreslå relevante ICD-10 diagnosekoder for en pasient med akutt korsryggsmerter med utstråling til venstre ben.',
  },
  {
    label: 'Red flag analyse',
    prompt:
      'Analyser følgende for red flags: Pasient 68 år, plutselig oppstått kraftig hodepine, nakkestivhet, lysskyhet, feber 38.5°C.',
  },
  {
    label: 'Norsk medisinsk',
    prompt:
      'Beskriv kliniske funn ved undersøkelse av thorakal kyfose med palpasjonsfunn og bevegelighetstesting.',
  },
  {
    label: 'Behandlingsplan',
    prompt:
      'Lag en behandlingsplan for en 35 år gammel kontorarbeider med fremoverdratt hodestilling og spenningshodepine.',
  },
  {
    label: 'Oppfølging',
    prompt:
      'Skriv en oppfølgingsnotis for en pasient etter 4 behandlinger for SI-leddsmerter. Pasienten rapporterer 50% bedring.',
  },
];

export default function PlaygroundTab() {
  const [prompt, setPrompt] = useState('');
  const [modelA, setModelA] = useState('chiro-no');
  const [modelB, setModelB] = useState('chiro-norwegian');
  const [sideBySide, setSideBySide] = useState(false);
  const [resultA, setResultA] = useState(null);
  const [resultB, setResultB] = useState(null);

  const testMutationA = useMutation({
    mutationFn: ({ model, prompt: p }) => trainingAPI.testModel(model, p),
    onSuccess: (res) => setResultA(res.data.data),
  });

  const testMutationB = useMutation({
    mutationFn: ({ model, prompt: p }) => trainingAPI.testModel(model, p),
    onSuccess: (res) => setResultB(res.data.data),
  });

  const isRunning = testMutationA.isPending || testMutationB.isPending;

  const handleRun = () => {
    if (!prompt.trim()) return;
    setResultA(null);
    setResultB(null);
    testMutationA.mutate({ model: modelA, prompt });
    if (sideBySide) {
      testMutationB.mutate({ model: modelB, prompt });
    }
  };

  const applyPreset = (presetPrompt) => {
    setPrompt(presetPrompt);
  };

  return (
    <div className="space-y-6">
      {/* Prompt Input */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <TestTube className="w-5 h-5" />
          Modell-lekeplass
        </h3>

        {/* Preset Prompts */}
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">Hurtigvalg:</p>
          <div className="flex flex-wrap gap-2">
            {PRESET_PROMPTS.map((p) => (
              <button
                key={p.label}
                onClick={() => applyPreset(p.prompt)}
                className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-medium transition-colors"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Textarea */}
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={4}
          placeholder="Skriv en prompt for å teste modellen..."
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
        />

        {/* Controls Row */}
        <div className="flex flex-wrap items-center gap-4 mt-4">
          {/* Mode Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-0.5">
            <button
              onClick={() => setSideBySide(false)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                !sideBySide ? 'bg-white shadow-sm text-blue-700' : 'text-gray-600'
              }`}
            >
              <Monitor className="w-4 h-4" />
              Enkelt
            </button>
            <button
              onClick={() => setSideBySide(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                sideBySide ? 'bg-white shadow-sm text-blue-700' : 'text-gray-600'
              }`}
            >
              <Columns className="w-4 h-4" />
              Side-by-side
            </button>
          </div>

          {/* Model Selectors */}
          <div className="flex items-center gap-2">
            <select
              value={modelA}
              onChange={(e) => setModelA(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              {MODELS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
            {sideBySide && (
              <>
                <span className="text-gray-400 text-sm">vs</span>
                <select
                  value={modelB}
                  onChange={(e) => setModelB(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  {MODELS.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </>
            )}
          </div>

          {/* Run Button */}
          <button
            onClick={handleRun}
            disabled={!prompt.trim() || isRunning}
            className="px-5 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed ml-auto"
          >
            {isRunning ? (
              <>
                <Clock className="w-4 h-4 inline mr-1 animate-spin" /> Kjorer...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 inline mr-1" /> Kjor test
              </>
            )}
          </button>
        </div>
      </div>

      {/* Results */}
      {(resultA || resultB || testMutationA.isPending || testMutationB.isPending) && (
        <div className={`grid gap-6 ${sideBySide ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
          {/* Result A */}
          <ResultCard
            model={modelA}
            result={resultA}
            loading={testMutationA.isPending}
            error={testMutationA.error}
          />

          {/* Result B (side-by-side only) */}
          {sideBySide && (
            <ResultCard
              model={modelB}
              result={resultB}
              loading={testMutationB.isPending}
              error={testMutationB.error}
            />
          )}
        </div>
      )}

      {/* Error display */}
      {testMutationA.isError && !resultA && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
          Feil: {testMutationA.error?.response?.data?.error || testMutationA.error?.message}
        </div>
      )}
    </div>
  );
}

function ResultCard({ model, result, loading, error }) {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 border-b flex items-center justify-between">
        <span className="font-medium text-sm font-mono">{model}</span>
        {result && (
          <div className="flex items-center gap-3 text-xs text-gray-500">
            {result.latency_ms && (
              <span className="flex items-center gap-1">
                <Zap className="w-3 h-3" />
                {result.latency_ms}ms
              </span>
            )}
            {result.tokens && <span>{result.tokens} tokens</span>}
          </div>
        )}
      </div>
      <div className="p-4">
        {loading ? (
          <div className="flex items-center gap-2 text-gray-500">
            <Clock className="w-4 h-4 animate-spin" />
            <span className="text-sm">Genererer svar...</span>
          </div>
        ) : error ? (
          <div className="text-red-600 text-sm">
            Feil: {error?.response?.data?.error || error?.message}
          </div>
        ) : result ? (
          <div>
            {result.prompt && (
              <div className="text-xs text-gray-500 mb-2">Prompt: {result.prompt}</div>
            )}
            <div className="whitespace-pre-wrap text-sm font-mono bg-gray-50 rounded-lg p-3 max-h-96 overflow-y-auto">
              {result.response}
            </div>
          </div>
        ) : (
          <p className="text-gray-400 text-sm">Ingen resultat enna.</p>
        )}
      </div>
    </div>
  );
}
