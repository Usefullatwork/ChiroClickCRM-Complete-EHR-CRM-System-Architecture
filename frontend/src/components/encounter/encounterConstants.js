/**
 * Static constants and builder functions for ClinicalEncounter.
 * Extracted to keep the orchestrator component under 500 lines.
 */

// --- Medical abbreviation macros (Norwegian) ---
export const macros = {
  '.bs': 'Bedring siden sist. ',
  '.ie': 'Ingen endring siden forrige konsultasjon. ',
  '.vm': 'Verre om morgenen, bedre utover dagen. ',
  '.kons': 'Konstante smerter, VAS ',
  '.ust': 'Utstråling til ',
  '.nrom': 'Normal ROM i alle retninger. ',
  '.rrom': 'Redusert ROM: ',
  '.palp': 'Ved palpasjon: ',
  '.spasme': 'Muskelspasme palperes paravertebralt. ',
  '.trigger': 'Triggerpunkt identifisert i ',
  '.seg': 'Segmentell dysfunksjon ',
  '.c': 'Cervical ',
  '.t': 'Thorakal ',
  '.l': 'Lumbal ',
  '.si': 'SI-ledd ',
  '.hvla': 'HVLA manipulasjon ',
  '.mob': 'Mobilisering ',
  '.soft': 'Bl\u00F8tvevsbehandling ',
  '.dry': 'Dry needling ',
  '.tape': 'Kinesiotaping ',
  '.fu1': 'Oppf\u00F8lging om 1 uke. ',
  '.fu2': 'Oppf\u00F8lging om 2 uker. ',
  '.\u00F8v': 'Hjemme\u00F8velser gjennomg\u00E5tt og demonstrert. ',
  '.erg': 'Ergonomisk veiledning gitt. ',
  '.hen': 'Henvisning vurderes til ',
  '.godr': 'God respons p\u00E5 behandling. Fortsetter n\u00E5v\u00E6rende plan. ',
  '.modr': 'Moderat respons. Justerer behandlingsplan. ',
  '.begr': 'Begrenset respons. Vurderer alternativ tiln\u00E6rming. ',
};

// --- Auto-coding constants ---
export const SPINAL_REGION_PATTERN = /^[CTLS]\d+$/;

export const CMT_CODE_RANGES = [
  { max: 0, code: null },
  { max: 2, code: '98940', name: 'CMT 1-2 regioner' },
  { max: 4, code: '98941', name: 'CMT 3-4 regioner' },
  { max: Infinity, code: '98942', name: 'CMT 5+ regioner' },
];

/**
 * Build quick-phrase bank for SOAP sections.
 * Called inside useMemo with [t] dependency.
 */
export function buildQuickPhrases(t) {
  return {
    subjective: [
      t('qp_s_improvementSinceLast'),
      t('qp_s_significantImprovement'),
      t('qp_s_noChange'),
      t('qp_s_somewhatWorse'),
      t('qp_s_significantlyWorse'),
      t('qp_s_worseInMorning'),
      t('qp_s_worseInEvening'),
      t('qp_s_varyingThroughDay'),
      t('qp_s_constantPain'),
      t('qp_s_painWithLifting'),
      t('qp_s_painWithSitting'),
      t('qp_s_painWithWalking'),
      t('qp_s_painWithBending'),
      t('qp_s_stiffnessAfterRest'),
      t('qp_s_radiationToLeg'),
      t('qp_s_radiationToArm'),
      t('qp_s_numbnessOrTingling'),
      t('qp_s_associatedHeadache'),
    ],
    objective: [
      t('qp_o_normalRomAll'),
      t('qp_o_reducedFlexion'),
      t('qp_o_reducedExtension'),
      t('qp_o_reducedRotationBilat'),
      t('qp_o_reducedLateralFlexion'),
      t('qp_o_muscleSpasm'),
      t('qp_o_triggerPointIdentified'),
      t('qp_o_facetJointTenderness'),
      t('qp_o_segmentalDysfunction'),
      t('qp_o_positiveSLRLeft'),
      t('qp_o_positiveSLRRight'),
      t('qp_o_negativeSLRBilat'),
      t('qp_o_positiveKempsTest'),
      t('qp_o_positiveFacetLoading'),
    ],
    assessment: [
      t('qp_a_goodResponse'),
      t('qp_a_moderateResponse'),
      t('qp_a_limitedResponse'),
      t('qp_a_stableCondition'),
      t('qp_a_progressionAsExpected'),
      t('qp_a_considerReferral'),
    ],
    plan: [
      t('qp_p_continuePlan'),
      t('qp_p_increasedFrequency'),
      t('qp_p_reducedFrequency'),
      t('qp_p_homeExercisesReviewed'),
      t('qp_p_ergonomicGuidance'),
      t('qp_p_followUpOneWeek'),
    ],
  };
}

/**
 * Build keyboard shortcuts map.
 * Called inside useMemo with [t] dependency.
 */
export function buildKeyboardShortcuts(t) {
  return {
    'Ctrl+S': t('shortcut_save', 'Lagre notat'),
    'Ctrl+Shift+S': t('shortcut_saveAndSign', 'Lagre og signer'),
    'Ctrl+1': t('shortcut_goToSubjective', 'Gå til Subjektivt'),
    'Ctrl+2': t('shortcut_goToObjective', 'Gå til Objektivt'),
    'Ctrl+3': t('shortcut_goToAssessment', 'Gå til Vurdering'),
    'Ctrl+4': t('shortcut_goToPlan', 'Gå til Plan'),
    'Ctrl+T': t('shortcut_openTemplates', 'Åpne maler'),
    'Ctrl+L': t('shortcut_saltCopy', 'SALT - Kopier fra forrige'),
    Esc: t('shortcut_closeDialogs', 'Lukk dialoger'),
  };
}
