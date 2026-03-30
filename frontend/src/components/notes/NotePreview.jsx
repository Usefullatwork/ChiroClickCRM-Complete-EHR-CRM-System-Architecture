/**
 * NotePreview Component
 * Skrivebeskyttet visning av klinisk notat
 *
 * Read-only preview of clinical note
 */

import {
  FileText,
  User,
  Edit,
  Trash2,
  Lock,
  Printer,
  Download,
  X,
  AlertTriangle,
  CheckCircle,
  Stethoscope,
  Target,
  ClipboardCheck,
  Activity,
} from 'lucide-react';
import { useTranslation } from '../../i18n';

/**
 * NotePreview Component
 * Modal for visning av notatdetaljer
 *
 * @param {Object} props - Component props
 * @param {Object} props.note - Note data to display
 * @param {boolean} props.isLoading - Loading state
 * @param {Function} props.onClose - Callback when closing preview
 * @param {Function} props.onEdit - Callback when editing note
 * @param {Function} props.onPrint - Callback when printing note
 * @param {Function} props.onExport - Callback when exporting note
 * @param {Function} props.onDelete - Callback when deleting note
 * @param {Function} props.getNoteTypeBadge - Function to get badge style
 * @param {Function} props.getNoteTypeLabel - Function to get type label
 * @returns {JSX.Element} Note preview component
 */
export default function NotePreview({
  note,
  isLoading = false,
  onClose,
  onEdit,
  onPrint,
  onExport,
  onDelete,
  getNoteTypeBadge,
  getNoteTypeLabel,
}) {
  /**
   * Parse JSON field safely
   * Parser JSON-felt trygt
   */
  const parseField = (field) => {
    if (!field) {
      return {};
    }
    if (typeof field === 'object') {
      return field;
    }
    try {
      return JSON.parse(field);
    } catch {
      return {};
    }
  };

  /**
   * Format date for display
   * Formater dato for visning
   */
  const formatDate = (dateString) => {
    if (!dateString) {
      return '';
    }
    const date = new Date(dateString);
    return date.toLocaleDateString('no-NO', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  /**
   * Format datetime for display
   * Formater dato og tid for visning
   */
  const formatDateTime = (dateString) => {
    if (!dateString) {
      return '';
    }
    const date = new Date(dateString);
    return date.toLocaleString('no-NO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const { t } = useTranslation('clinical');

  if (!note && !isLoading) {
    return null;
  }

  const isLocked = !!note?.signed_at;
  const subjective = parseField(note?.subjective);
  const objective = parseField(note?.objective);
  const assessment = parseField(note?.assessment);
  const plan = parseField(note?.plan);

  /**
   * Section component for displaying note sections
   * Seksjonskomponent for visning av notatseksjoner
   */
  const Section = ({ title, icon: Icon, color, children }) => {
    if (!children || (Array.isArray(children) && children.filter(Boolean).length === 0)) {
      return null;
    }

    return (
      <div className="mb-6">
        <div className={`flex items-center gap-2 mb-3 pb-2 border-b border-${color}-100`}>
          <div className={`w-6 h-6 rounded flex items-center justify-center bg-${color}-100`}>
            <Icon className={`w-3.5 h-3.5 text-${color}-600`} />
          </div>
          <h3 className={`font-semibold text-${color}-900`}>{title}</h3>
        </div>
        <div className="space-y-3 pl-8">{children}</div>
      </div>
    );
  };

  /**
   * Field component for displaying individual fields
   * Feltkomponent for visning av individuelle felt
   */
  const Field = ({ label, value }) => {
    if (!value || (Array.isArray(value) && value.length === 0)) {
      return null;
    }

    return (
      <div>
        <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          {label}
        </dt>
        <dd className="mt-0.5 text-sm text-gray-900 whitespace-pre-wrap">
          {Array.isArray(value) ? value.join(', ') : value}
        </dd>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header / Overskrift */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                isLocked ? 'bg-green-100' : 'bg-blue-100'
              }`}
            >
              {isLocked ? (
                <Lock className="w-5 h-5 text-green-600" />
              ) : (
                <FileText className="w-5 h-5 text-blue-600" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-semibold text-gray-900">
                  {getNoteTypeLabel(note?.template_type)} {t('note', 'Notat')}
                </h2>
                <span
                  className={`px-2 py-0.5 text-xs font-medium rounded ${getNoteTypeBadge(
                    note?.template_type
                  )}`}
                >
                  {getNoteTypeLabel(note?.template_type)}
                </span>
                {isLocked && (
                  <span className="flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded bg-green-100 text-green-800">
                    <Lock className="w-3 h-3" />
                    {t('notePreviewSigned', 'Signert')}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {formatDate(note?.note_date)}
              </p>
            </div>
          </div>

          {/* Actions / Handlinger */}
          <div className="flex items-center gap-2">
            {!isLocked && (
              <button
                onClick={() => onEdit(note)}
                className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <Edit className="w-4 h-4" />
                {t('notePreviewEdit', 'Rediger')}
              </button>
            )}
            <button
              onClick={() => onPrint(note?.id)}
              className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Printer className="w-4 h-4" />
              {t('notePreviewPrint', 'Skriv ut')}
            </button>
            <button
              onClick={() => onExport(note?.id)}
              className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Download className="w-4 h-4" />
              {t('notePreviewDownload', 'Last ned')}
            </button>
            {!isLocked && (
              <button
                onClick={() => onDelete(note?.id)}
                className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                title={t('notePreviewDelete', 'Slett notat')}
                aria-label="Slett notat"
              >
                <Trash2 className="w-4 h-4" aria-hidden="true" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg"
              aria-label="Lukk"
            >
              <X className="w-5 h-5 text-gray-500 dark:text-gray-400" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Content / Innhold */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-500 dark:text-gray-400">
                {t('notePreviewLoading', 'Laster notat...')}
              </span>
            </div>
          ) : (
            <>
              {/* Patient and Practitioner Info / Pasient- og behandlerinformasjon */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {note?.patient_name && (
                    <div>
                      <dt className="text-xs font-medium text-gray-500 dark:text-gray-400">
                        {t('patient', 'Pasient')}
                      </dt>
                      <dd className="text-sm font-medium text-gray-900">{note.patient_name}</dd>
                    </div>
                  )}
                  {note?.practitioner_name && (
                    <div>
                      <dt className="text-xs font-medium text-gray-500 dark:text-gray-400">
                        {t('practitioner', 'Behandler')}
                      </dt>
                      <dd className="text-sm text-gray-900">{note.practitioner_name}</dd>
                    </div>
                  )}
                  {note?.duration_minutes && (
                    <div>
                      <dt className="text-xs font-medium text-gray-500 dark:text-gray-400">
                        {t('duration', 'Varighet')}
                      </dt>
                      <dd className="text-sm text-gray-900">
                        {note.duration_minutes} {t('minutes', 'minutter')}
                      </dd>
                    </div>
                  )}
                  {note?.vas_pain_start !== null && note?.vas_pain_start !== undefined && (
                    <div>
                      <dt className="text-xs font-medium text-gray-500 dark:text-gray-400">
                        {t('vasPain', 'VAS smerte')}
                      </dt>
                      <dd className="text-sm text-gray-900">
                        {note.vas_pain_start}/10 {'->'} {note.vas_pain_end}/10
                      </dd>
                    </div>
                  )}
                </div>
              </div>

              {/* Diagnosis Codes / Diagnosekoder */}
              {(note?.icd10_codes?.length > 0 || note?.icpc_codes?.length > 0) && (
                <div className="bg-blue-50 rounded-lg p-4 mb-6">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">
                    {t('diagnosisCodes', 'Diagnosekoder')}
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {note?.icd10_codes?.map((code, index) => (
                      <span
                        key={`icd-${index}`}
                        className="px-2 py-1 bg-white border border-blue-200 rounded text-sm text-blue-800"
                      >
                        ICD-10: {code}
                      </span>
                    ))}
                    {note?.icpc_codes?.map((code, index) => (
                      <span
                        key={`icpc-${index}`}
                        className="px-2 py-1 bg-white border border-blue-200 rounded text-sm text-blue-800"
                      >
                        ICPC-2: {code}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Subjective Section / Subjektiv seksjon */}
              <Section title={t('soapSubjectiveTitle', 'S - Subjektiv')} icon={User} color="blue">
                <Field
                  label={t('soapChiefComplaint', 'Hovedklage')}
                  value={subjective.chiefComplaint || subjective.chief_complaint}
                />
                <Field
                  label={t('soapHpi', 'Sykehistorie')}
                  value={subjective.historyOfPresentIllness || subjective.history}
                />
                <Field
                  label={t('soapPainLocation', 'Smertelokalisering')}
                  value={subjective.painLocation || subjective.pain_location}
                />
                {subjective.painIntensity !== null && subjective.painIntensity !== undefined && (
                  <Field
                    label={t('soapPainIntensity', 'Smerteintensitet')}
                    value={`${subjective.painIntensity}/10`}
                  />
                )}
                <Field
                  label={t('painQuality', 'Smertekvalitet')}
                  value={subjective.painQuality || subjective.pain_quality}
                />
                <Field
                  label={t('soapAggravatingFactors', 'Forverrende faktorer')}
                  value={subjective.aggravatingFactors || subjective.aggravating_factors}
                />
                <Field
                  label={t('soapRelievingFactors', 'Lindrende faktorer')}
                  value={subjective.relievingFactors || subjective.relieving_factors}
                />
                <Field
                  label={t('soapFunctionalLimitations', 'Funksjonsbegrensninger')}
                  value={subjective.functionalLimitations || subjective.functional_limitations}
                />
                <Field label={t('medications', 'Medikamenter')} value={subjective.medications} />
                <Field
                  label={t('previousTreatment', 'Tidligere behandling')}
                  value={subjective.previousTreatment || subjective.previous_treatment}
                />
              </Section>

              {/* Objective Section / Objektiv seksjon */}
              <Section
                title={t('soapObjectiveTitle', 'O - Objektiv')}
                icon={Stethoscope}
                color="green"
              >
                {objective.vitalSigns && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <Field
                      label={t('soapBloodPressure', 'Blodtrykk')}
                      value={objective.vitalSigns?.bloodPressure}
                    />
                    <Field label={t('soapPulse', 'Puls')} value={objective.vitalSigns?.pulse} />
                    <Field
                      label={t('soapRespRate', 'Resp. frekvens')}
                      value={objective.vitalSigns?.respiratoryRate}
                    />
                    <Field
                      label={t('soapTemperature', 'Temperatur')}
                      value={objective.vitalSigns?.temperature}
                    />
                  </div>
                )}
                <Field label={t('soapObservation', 'Observasjon')} value={objective.observation} />
                <Field label={t('soapPalpation', 'Palpasjon')} value={objective.palpation} />
                <Field
                  label={t('soapRom', 'Bevegelsesutslag (ROM)')}
                  value={objective.rangeOfMotion || objective.rom}
                />
                <Field
                  label={t('soapNeurologicalExam', 'Nevrologisk undersøkelse')}
                  value={objective.neurologicalExam || objective.neuro_tests}
                />
                <Field
                  label={t('soapOrthopedicTests', 'Ortopediske tester')}
                  value={objective.orthopedicTests || objective.ortho_tests}
                />
                <Field
                  label={t('specialTests', 'Spesialtester')}
                  value={objective.specialTests || objective.special_tests}
                />
              </Section>

              {/* Assessment Section / Vurderingsseksjon */}
              <Section
                title={t('soapAssessmentTitle', 'A - Vurdering')}
                icon={ClipboardCheck}
                color="purple"
              >
                <Field label={t('soapDiagnosis', 'Diagnose')} value={assessment.diagnosis} />
                <Field
                  label={t('soapDifferentialDiagnosis', 'Differensialdiagnoser')}
                  value={assessment.differentialDiagnosis || assessment.differential_diagnosis}
                />
                <Field
                  label={t('soapClinicalImpression', 'Klinisk vurdering')}
                  value={assessment.clinicalImpression || assessment.clinical_impression}
                />
                <Field label={t('prognosis', 'Prognose')} value={assessment.prognosis} />

                {/* Red Flags */}
                {assessment.redFlags?.length > 0 && (
                  <div>
                    <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                      {t('redFlags', 'Røde flagg')}
                    </dt>
                    <div className="space-y-1">
                      {assessment.redFlags.map((flag, index) => (
                        <div
                          key={`redflag-${flag}-${index}`}
                          className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded-lg"
                        >
                          <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
                          <span className="text-sm text-red-700">{flag}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Section>

              {/* Plan Section / Planseksjon */}
              <Section title={t('soapPlanTitle', 'P - Plan')} icon={Target} color="orange">
                <Field label={t('treatment', 'Behandling')} value={plan.treatment} />
                <Field
                  label={t('soapExercises', 'Øvelser/Hjemmeoppgaver')}
                  value={plan.exercises}
                />
                <Field
                  label={t('patientEducation', 'Pasientundervisning')}
                  value={plan.patientEducation || plan.patient_education}
                />
                <Field
                  label={t('soapFollowUp', 'Oppfølging')}
                  value={plan.followUp || plan.follow_up}
                />
                <Field label={t('referrals', 'Henvisninger')} value={plan.referrals} />
                <Field label={t('soapGoals', 'Mål')} value={plan.goals} />
              </Section>

              {/* Vestibular Data (if applicable) / Vestibulare data (hvis relevant) */}
              {note?.vestibular_data && (
                <Section
                  title={t('vngAssessment', 'Vestibular vurdering')}
                  icon={Activity}
                  color="teal"
                >
                  {(() => {
                    const vestibular = parseField(note.vestibular_data);
                    return (
                      <>
                        <Field
                          label={t('soapDiagnosis', 'Diagnose')}
                          value={vestibular.clinicalAssessment?.diagnosis}
                        />
                        <Field
                          label={t('vestibularDizzinessTypeLabel', 'Type svimmelhet')}
                          value={vestibular.symptoms?.dizzinessType}
                        />
                        <Field
                          label={t('vestibularTriggeringEvent', 'Utløsere')}
                          value={vestibular.symptoms?.triggers}
                        />
                        <Field
                          label={t('treatment', 'Behandling')}
                          value={vestibular.plan?.treatment}
                        />
                        <Field
                          label={t('vestibularVrtExercises', 'Vestibular rehabilitering')}
                          value={vestibular.plan?.vestibularRehabilitation}
                        />
                      </>
                    );
                  })()}
                </Section>
              )}

              {/* Signature Info / Signaturinformasjon */}
              {isLocked && (
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <div className="flex items-center gap-3 text-green-700">
                    <CheckCircle className="w-5 h-5" />
                    <div>
                      <p className="font-medium">
                        {t('notePreviewSignedAndLocked', 'Signert og låst')}
                      </p>
                      <p className="text-sm text-green-600">
                        {note?.signed_by_name &&
                          `${t('signedBy', 'Signert av')} ${note.signed_by_name}`}
                        {note?.signed_at && ` - ${formatDateTime(note.signed_at)}`}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer / Bunntekst */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex-shrink-0">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-4">
              {note?.created_at && (
                <span>
                  {t('created', 'Opprettet')}: {formatDateTime(note.created_at)}
                </span>
              )}
              {note?.updated_at && note.updated_at !== note.created_at && (
                <span>
                  {t('lastModified', 'Sist endret')}: {formatDateTime(note.updated_at)}
                </span>
              )}
            </div>
            {note?.id && <span>ID: {note.id.slice(0, 8)}...</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
