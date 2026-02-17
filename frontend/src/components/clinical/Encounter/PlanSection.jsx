import _React, { useRef } from 'react';
import { ChevronDown, Check, Target, Settings, FileText } from 'lucide-react';
import { useEncounter } from '../../../context/EncounterContext';
import {
  BodyChartPanel,
  AnatomicalBodyChart,
  ActivatorMethodPanel,
  FacialLinesChart,
} from '../../examination';

export default function PlanSection({
  onTextInputWithMacros,
  onSetActiveField,
  currentNotationMethod,
  getNotationName,
  isVisualNotation,
  clinicalLang,
  clinicalPrefs,
  notationData,
  setNotationData,
  setNotationNarrative,
  onNavigateSettings,
}) {
  const {
    encounterData,
    setEncounterData,
    isSigned,
    updateField,
    selectedTakster,
    toggleTakst,
    totalPrice,
    showTakster,
    setShowTakster,
    taksterNorwegian,
  } = useEncounter();

  const textAreaRef = useRef(null);

  return (
    <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-4 py-3 bg-gradient-to-r from-purple-50 to-white border-b border-slate-100 flex items-center justify-between">
        <h3 className="font-semibold text-slate-800 flex items-center gap-2">
          <span className="bg-purple-600 text-white h-6 w-6 rounded-md flex items-center justify-center text-sm font-bold">
            P
          </span>
          Plan & Behandling
        </h3>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500">VAS Slutt:</span>
          <input
            type="range"
            min="0"
            max="10"
            value={encounterData.vas_pain_end || 0}
            onChange={(e) =>
              setEncounterData((prev) => ({ ...prev, vas_pain_end: parseInt(e.target.value) }))
            }
            disabled={isSigned}
            className="w-20 h-1.5 accent-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <span className="text-sm font-semibold text-purple-600 w-6">
            {encounterData.vas_pain_end || 0}
          </span>
        </div>
      </div>
      <div className="p-4 space-y-4">
        {/* Treatment Notation Method Indicator */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-700">Behandlingsnotasjon:</span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-medium">
              <Target className="h-3 w-3" />
              {getNotationName()}
            </span>
          </div>
          <button
            onClick={onNavigateSettings}
            className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1"
          >
            <Settings className="h-3 w-3" />
            Endre i innstillinger
          </button>
        </div>

        {/* Treatment Performed - Conditional Rendering Based on Notation Method */}
        {isVisualNotation ? (
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            {currentNotationMethod.id === 'body_chart' && (
              <BodyChartPanel
                value={notationData}
                onChange={setNotationData}
                onGenerateNarrative={(narrative) => {
                  setNotationNarrative(narrative);
                  updateField('plan', 'treatment', narrative);
                }}
                lang={clinicalLang}
                readOnly={isSigned}
              />
            )}
            {currentNotationMethod.id === 'anatomical_chart' && (
              <AnatomicalBodyChart
                value={notationData}
                onChange={setNotationData}
                onGenerateNarrative={(narrative) => {
                  setNotationNarrative(narrative);
                  updateField('plan', 'treatment', narrative);
                }}
                lang={clinicalLang}
                showDermatomes={clinicalPrefs.showDermatomes}
                showTriggerPoints={clinicalPrefs.showTriggerPoints}
                readOnly={isSigned}
              />
            )}
            {currentNotationMethod.id === 'activator_protocol' && (
              <ActivatorMethodPanel
                value={notationData}
                onChange={setNotationData}
                onGenerateNarrative={(narrative) => {
                  setNotationNarrative(narrative);
                  updateField('plan', 'treatment', narrative);
                }}
                lang={clinicalLang}
                readOnly={isSigned}
              />
            )}
            {currentNotationMethod.id === 'facial_lines' && (
              <FacialLinesChart
                value={notationData}
                onChange={setNotationData}
                onGenerateNarrative={(narrative) => {
                  setNotationNarrative(narrative);
                  updateField('plan', 'treatment', narrative);
                }}
                lang={clinicalLang}
                readOnly={isSigned}
              />
            )}
          </div>
        ) : (
          <textarea
            ref={textAreaRef}
            placeholder={
              currentNotationMethod.id === 'segment_listing'
                ? 'Segmentlisting: f.eks. C5 PRS, T4-T6 anterior, L5 PLI...'
                : currentNotationMethod.id === 'gonstead_listing'
                  ? 'Gonstead: f.eks. Atlas ASLA, C2 PRSA, L5 PLI-M...'
                  : currentNotationMethod.id === 'diversified_notation'
                    ? 'Diversifisert: beskriv manipulasjoner og mobiliseringer...'
                    : currentNotationMethod.id === 'soap_narrative'
                      ? 'SOAP narrativ: beskriv behandlingen i detalj...'
                      : 'Utført behandling... (bruk .hvla for makro)'
            }
            className="w-full min-h-[80px] p-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none text-sm disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
            value={encounterData.plan.treatment}
            onChange={(e) => {
              if (!onTextInputWithMacros(e, 'plan', 'treatment')) {
                updateField('plan', 'treatment', e.target.value);
              }
            }}
            onFocus={() => onSetActiveField('plan.treatment')}
            disabled={isSigned}
          />
        )}

        {/* Takster Selection */}
        <div className="border border-purple-200 rounded-lg overflow-hidden">
          <button
            onClick={() => setShowTakster(!showTakster)}
            className="w-full flex items-center justify-between px-4 py-3 bg-purple-50 hover:bg-purple-100 transition-colors"
          >
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-purple-600" />
              <span className="font-medium text-purple-900">Takster (behandlingskoder)</span>
              <span className="text-xs text-purple-600">(Kun for behandlere)</span>
            </div>
            <ChevronDown
              className={`h-4 w-4 text-purple-600 transition-transform ${showTakster ? 'rotate-180' : ''}`}
            />
          </button>

          {showTakster && (
            <div className="p-4 bg-white">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {taksterNorwegian.map((takst) => (
                  <button
                    key={takst.id}
                    onClick={() => toggleTakst(takst.id)}
                    disabled={isSigned}
                    className={`
                      flex items-center justify-between p-3 rounded-lg border-2 text-left transition-all
                      ${
                        selectedTakster.includes(takst.id)
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }
                      ${isSigned ? 'opacity-70 cursor-not-allowed' : ''}
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`
                        h-5 w-5 rounded flex items-center justify-center
                        ${
                          selectedTakster.includes(takst.id)
                            ? 'bg-purple-600 text-white'
                            : 'border-2 border-slate-300'
                        }
                      `}
                      >
                        {selectedTakster.includes(takst.id) && <Check className="h-3 w-3" />}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800">{takst.code}</p>
                        <p className="text-xs text-slate-500">{takst.name}</p>
                      </div>
                    </div>
                    <span className="text-sm font-medium text-slate-600">{takst.price} kr</span>
                  </button>
                ))}
              </div>

              {/* Total */}
              <div className="mt-3 flex justify-end">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-100 text-purple-800">
                  <span className="text-sm">Totalt:</span>
                  <span className="font-bold">{totalPrice} kr</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Exercises & Advice */}
        <textarea
          placeholder="Hjemmeøvelser og råd..."
          className="w-full min-h-[80px] p-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none text-sm disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
          value={encounterData.plan.exercises}
          onChange={(e) => updateField('plan', 'exercises', e.target.value)}
          onFocus={() => onSetActiveField('plan.exercises')}
          disabled={isSigned}
        />

        {/* Follow-up */}
        <div className="flex items-center gap-4 pt-3 border-t border-slate-100">
          <span className="text-sm font-medium text-slate-700">Oppfølging:</span>
          <input
            type="text"
            placeholder="f.eks. 1 uke, 3 behandlinger"
            value={encounterData.plan.follow_up}
            onChange={(e) => updateField('plan', 'follow_up', e.target.value)}
            disabled={isSigned}
            className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-purple-500 text-sm disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
          />
        </div>
      </div>
    </section>
  );
}
