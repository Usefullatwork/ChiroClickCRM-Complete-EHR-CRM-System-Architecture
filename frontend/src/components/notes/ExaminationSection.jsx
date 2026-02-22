/**
 * ExaminationSection - Objective section (vitals, posture, neuro, palpation)
 * Extracted from InitialConsultTemplate.jsx
 */
import { Stethoscope } from 'lucide-react';

export default function ExaminationSection({
  consultData,
  updateField,
  updateNestedField,
  readOnly,
  Section,
  TextField,
  InputField,
}) {
  return (
    <Section
      id="objective"
      title="Objektiv - Klinisk undersokelse"
      icon={Stethoscope}
      color="green"
    >
      {/* Vital Signs / Vitale tegn */}
      <div className="bg-gray-50 rounded-lg p-4 mb-4">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Vitale tegn</h4>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          <InputField
            label="Blodtrykk"
            value={consultData.objective.vitalSigns?.bloodPressure}
            onChange={(v) => updateNestedField('objective', 'vitalSigns', 'bloodPressure', v)}
            placeholder="120/80"
          />
          <InputField
            label="Puls"
            value={consultData.objective.vitalSigns?.pulse}
            onChange={(v) => updateNestedField('objective', 'vitalSigns', 'pulse', v)}
            placeholder="72"
          />
          <InputField
            label="Resp."
            value={consultData.objective.vitalSigns?.respiratoryRate}
            onChange={(v) => updateNestedField('objective', 'vitalSigns', 'respiratoryRate', v)}
            placeholder="16"
          />
          <InputField
            label="Temp"
            value={consultData.objective.vitalSigns?.temperature}
            onChange={(v) => updateNestedField('objective', 'vitalSigns', 'temperature', v)}
            placeholder="36.8"
          />
          <InputField
            label="Hoyde (cm)"
            value={consultData.objective.vitalSigns?.height}
            onChange={(v) => updateNestedField('objective', 'vitalSigns', 'height', v)}
            placeholder="175"
          />
          <InputField
            label="Vekt (kg)"
            value={consultData.objective.vitalSigns?.weight}
            onChange={(v) => updateNestedField('objective', 'vitalSigns', 'weight', v)}
            placeholder="70"
          />
        </div>
      </div>

      <TextField
        label="Generelt inntrykk"
        value={consultData.objective.generalAppearance}
        onChange={(v) => updateField('objective', 'generalAppearance', v)}
        placeholder="Pasientens generelle tilstand..."
      />
      <div className="grid grid-cols-2 gap-4">
        <TextField
          label="Gange"
          value={consultData.objective.gait}
          onChange={(v) => updateField('objective', 'gait', v)}
          placeholder="Gangmonster og observasjoner..."
        />
        <TextField
          label="Holdning"
          value={consultData.objective.posture}
          onChange={(v) => updateField('objective', 'posture', v)}
          placeholder="Holdningsavvik..."
        />
      </div>
      <TextField
        label="Inspeksjon"
        value={consultData.objective.inspection}
        onChange={(v) => updateField('objective', 'inspection', v)}
        placeholder="Visuell undersokelse..."
      />
      <TextField
        label="Palpasjon"
        value={consultData.objective.palpation}
        onChange={(v) => updateField('objective', 'palpation', v)}
        placeholder="Funn ved palpasjon..."
      />
      <TextField
        label="Bevegelsesutslag (ROM)"
        value={consultData.objective.rangeOfMotion}
        onChange={(v) => updateField('objective', 'rangeOfMotion', v)}
        rows={3}
        placeholder="Aktiv og passiv ROM for relevante ledd..."
      />

      {/* Neurological Exam / Nevrologisk undersokelse */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Nevrologisk undersokelse</h4>
        <div className="grid grid-cols-2 gap-4">
          <TextField
            label="Motorisk testing"
            value={consultData.objective.neurologicalExam?.motorTesting}
            onChange={(v) => updateNestedField('objective', 'neurologicalExam', 'motorTesting', v)}
            placeholder="Muskelstyrke..."
          />
          <TextField
            label="Sensorisk testing"
            value={consultData.objective.neurologicalExam?.sensoryTesting}
            onChange={(v) =>
              updateNestedField('objective', 'neurologicalExam', 'sensoryTesting', v)
            }
            placeholder="Sensibilitet..."
          />
          <TextField
            label="Reflekser"
            value={consultData.objective.neurologicalExam?.reflexes}
            onChange={(v) => updateNestedField('objective', 'neurologicalExam', 'reflexes', v)}
            placeholder="Dype senereflekser..."
          />
          <TextField
            label="Hjernenerver"
            value={consultData.objective.neurologicalExam?.cranialNerves}
            onChange={(v) => updateNestedField('objective', 'neurologicalExam', 'cranialNerves', v)}
            placeholder="Relevante hjernenerver..."
          />
        </div>
      </div>

      <TextField
        label="Ortopediske tester"
        value={consultData.objective.orthopedicTests}
        onChange={(v) => updateField('objective', 'orthopedicTests', v)}
        rows={3}
        placeholder="Utforte tester og resultater..."
      />
      <TextField
        label="Spesialtester"
        value={consultData.objective.specialTests}
        onChange={(v) => updateField('objective', 'specialTests', v)}
        placeholder="Andre relevante tester..."
      />
      <TextField
        label="Bildediagnostikk"
        value={consultData.objective.imaging}
        onChange={(v) => updateField('objective', 'imaging', v)}
        placeholder="Roentgen, MR, etc..."
      />
    </Section>
  );
}
