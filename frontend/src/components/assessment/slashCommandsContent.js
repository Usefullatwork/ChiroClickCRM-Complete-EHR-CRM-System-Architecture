/**
 * Bilingual Slash Commands Content
 * Contains all slash command content in English and Norwegian
 */

// =============================================================================
// SLASH COMMAND CONTENT - BILINGUAL
// =============================================================================

export const SLASH_COMMAND_CONTENT = {
  // ===========================================================================
  // SUBJECTIVE COMMANDS (8)
  // ===========================================================================
  better: {
    category: { en: 'Subjective', no: 'Subjektivt' },
    label: { en: 'Patient Better', no: 'Pasient bedre' },
    text: {
      en: 'Patient reports improvement in symptoms since the last visit.',
      no: 'Pasienten rapporterer bedring i symptomene siden forrige besøk.'
    },
    aliases: ['/improved', '/improving', '/forbedret', '/bedring']
  },
  same: {
    category: { en: 'Subjective', no: 'Subjektivt' },
    label: { en: 'No Change', no: 'Ingen endring' },
    text: {
      en: 'Patient reports no significant change in symptoms since the last visit.',
      no: 'Pasienten rapporterer ingen signifikant endring i symptomene siden forrige besøk.'
    },
    aliases: ['/nochange', '/unchanged', '/uendret']
  },
  worse: {
    category: { en: 'Subjective', no: 'Subjektivt' },
    label: { en: 'Patient Worse', no: 'Pasient verre' },
    text: {
      en: 'Patient reports worsening of symptoms since the last visit.',
      no: 'Pasienten rapporterer forverring av symptomene siden forrige besøk.'
    },
    aliases: ['/worsening', '/forverret']
  },
  '50better': {
    category: { en: 'Subjective', no: 'Subjektivt' },
    label: { en: '50% Improvement', no: '50% bedring' },
    text: {
      en: 'Patient reports approximately 50% improvement in symptoms since the last visit.',
      no: 'Pasienten rapporterer omtrent 50% bedring i symptomene siden forrige besøk.'
    },
    aliases: ['/50', '/halfbetter', '/halvbedre']
  },
  '75better': {
    category: { en: 'Subjective', no: 'Subjektivt' },
    label: { en: '75% Improvement', no: '75% bedring' },
    text: {
      en: 'Patient reports approximately 75% improvement in symptoms since the last visit.',
      no: 'Pasienten rapporterer omtrent 75% bedring i symptomene siden forrige besøk.'
    },
    aliases: ['/75']
  },
  '25better': {
    category: { en: 'Subjective', no: 'Subjektivt' },
    label: { en: '25% Improvement', no: '25% bedring' },
    text: {
      en: 'Patient reports approximately 25% improvement in symptoms since the last visit.',
      no: 'Pasienten rapporterer omtrent 25% bedring i symptomene siden forrige besøk.'
    },
    aliases: ['/25']
  },
  newcomplaint: {
    category: { en: 'Subjective', no: 'Subjektivt' },
    label: { en: 'New Complaint', no: 'Ny klage' },
    text: {
      en: 'Patient presents with a new complaint in addition to the ongoing condition being treated.',
      no: 'Pasienten presenterer en ny klage i tillegg til den pågående tilstanden som behandles.'
    },
    aliases: ['/new', '/nc', '/nyklage']
  },
  compliant: {
    category: { en: 'Subjective', no: 'Subjektivt' },
    label: { en: 'Compliant with HEP', no: 'Etterlevende med hjemmeøvelser' },
    text: {
      en: 'Patient reports compliance with home exercise program and treatment recommendations.',
      no: 'Pasienten rapporterer etterlevelse av hjemmeøvelsesprogram og behandlingsanbefalinger.'
    },
    aliases: ['/hep', '/hjemmeøvelser']
  },

  // ===========================================================================
  // OBJECTIVE COMMANDS (8)
  // ===========================================================================
  normal: {
    category: { en: 'Objective', no: 'Objektivt' },
    label: { en: 'Normal Exam', no: 'Normal undersøkelse' },
    text: {
      en: 'All orthopedic and neurological tests were within normal limits.',
      no: 'Alle ortopediske og nevrologiske tester var innenfor normale grenser.'
    },
    aliases: ['/wnl', '/neg', '/normalfunn']
  },
  neuro: {
    category: { en: 'Objective', no: 'Objektivt' },
    label: { en: 'Neuro Intact', no: 'Nevrologi intakt' },
    text: {
      en: 'Neurological examination: Deep tendon reflexes 2+ and symmetric bilaterally. Dermatomal sensation intact. Myotomal strength 5/5 throughout. No pathological reflexes noted.',
      no: 'Nevrologisk undersøkelse: Dype senereflekser 2+ og symmetriske bilateralt. Dermatomal sensibilitet intakt. Myotomal styrke 5/5 gjennomgående. Ingen patologiske reflekser observert.'
    },
    aliases: ['/neurointact', '/dtrs', '/nevrointakt']
  },
  spasm: {
    category: { en: 'Objective', no: 'Objektivt' },
    label: { en: 'Muscle Spasm', no: 'Muskelspasme' },
    text: {
      en: 'Palpation revealed significant muscle spasm and hypertonicity in the paraspinal musculature.',
      no: 'Palpasjon avdekket betydelig muskelspasme og hypertonisitet i paraspinal muskulatur.'
    },
    aliases: ['/hypertonicity', '/spasme']
  },
  sublux: {
    category: { en: 'Objective', no: 'Objektivt' },
    label: { en: 'Subluxation Found', no: 'Subluksasjon funnet' },
    text: {
      en: 'Palpation revealed vertebral subluxation with associated segmental joint dysfunction, point tenderness, muscle hypertonicity, and capsular swelling.',
      no: 'Palpasjon avdekket vertebral subluksasjon med tilhørende segmental ledddysfunksjon, punktømhet, muskulær hypertonisitet og kapsulær hevelse.'
    },
    aliases: ['/subluxation', '/vsc', '/subluksasjon']
  },
  restricted: {
    category: { en: 'Objective', no: 'Objektivt' },
    label: { en: 'Restricted ROM', no: 'Begrenset bevegelsesutslag' },
    text: {
      en: 'Range of motion testing revealed restriction with pain noted at end range.',
      no: 'Bevegelsesutslag-testing avdekket restriksjon med smerte notert ved ytterstilling.'
    },
    aliases: ['/rom', '/restriksjon']
  },
  trigger: {
    category: { en: 'Objective', no: 'Objektivt' },
    label: { en: 'Trigger Points', no: 'Triggerpunkter' },
    text: {
      en: 'Multiple trigger points identified in the affected musculature with characteristic referred pain pattern.',
      no: 'Flere triggerpunkter identifisert i affisert muskulatur med karakteristisk referert smertemønster.'
    },
    aliases: ['/tp', '/triggers', '/triggerpunkt']
  },
  posture: {
    category: { en: 'Objective', no: 'Objektivt' },
    label: { en: 'Postural Analysis', no: 'Holdningsanalyse' },
    text: {
      en: 'Postural analysis revealed deviation from normal alignment with compensatory changes noted throughout the kinetic chain.',
      no: 'Holdningsanalyse avdekket avvik fra normal stilling med kompensatoriske endringer observert gjennom den kinetiske kjeden.'
    },
    aliases: ['/postural', '/holdning']
  },
  gait: {
    category: { en: 'Objective', no: 'Objektivt' },
    label: { en: 'Gait Normal', no: 'Normalt gangmønster' },
    text: {
      en: 'Gait analysis revealed normal ambulation pattern without antalgic deviation.',
      no: 'Ganganalyse avdekket normalt gangmønster uten antalgisk avvik.'
    },
    aliases: ['/gaitnormal', '/gang']
  },

  // ===========================================================================
  // ASSESSMENT COMMANDS (4)
  // ===========================================================================
  msk: {
    category: { en: 'Assessment', no: 'Vurdering' },
    label: { en: 'Mechanical MSK', no: 'Mekanisk MSK' },
    text: {
      en: 'Clinical presentation consistent with mechanical musculoskeletal dysfunction. Responding well to conservative chiropractic care.',
      no: 'Klinisk presentasjon forenlig med mekanisk muskuloskelettal dysfunksjon. Responderer godt på konservativ kiropraktisk behandling.'
    },
    aliases: ['/mechanical', '/mekanisk']
  },
  radicular: {
    category: { en: 'Assessment', no: 'Vurdering' },
    label: { en: 'Radiculopathy', no: 'Radikulopati' },
    text: {
      en: 'Clinical presentation consistent with radiculopathy with positive nerve tension signs and dermatomal findings. Monitor for progression.',
      no: 'Klinisk presentasjon forenlig med radikulopati med positive nervestrekktegn og dermatomale funn. Overvåk for progresjon.'
    },
    aliases: ['/radiculopathy', '/radikulær']
  },
  cervicogenic: {
    category: { en: 'Assessment', no: 'Vurdering' },
    label: { en: 'Cervicogenic HA', no: 'Cervikogen hodepine' },
    text: {
      en: 'Clinical presentation consistent with cervicogenic headache secondary to upper cervical joint dysfunction.',
      no: 'Klinisk presentasjon forenlig med cervikogen hodepine sekundært til øvre cervikal ledddysfunksjon.'
    },
    aliases: ['/cha', '/headache', '/hodepine']
  },
  prognosis: {
    category: { en: 'Assessment', no: 'Vurdering' },
    label: { en: 'Good Prognosis', no: 'God prognose' },
    text: {
      en: 'Prognosis is good with continued conservative care and patient compliance with treatment recommendations.',
      no: 'Prognosen er god med fortsatt konservativ behandling og pasientens etterlevelse av behandlingsanbefalinger.'
    },
    aliases: ['/prog', '/goodprog', '/godprognose']
  },

  // ===========================================================================
  // PLAN COMMANDS (10)
  // ===========================================================================
  plan: {
    category: { en: 'Plan', no: 'Plan' },
    label: { en: 'Continue Plan', no: 'Fortsett plan' },
    text: {
      en: 'Continue current treatment plan. Patient to return for follow-up visit as scheduled.',
      no: 'Fortsett nåværende behandlingsplan. Pasienten skal komme tilbake til oppfølgingsbesøk som planlagt.'
    },
    aliases: ['/continue', '/ctp', '/fortsett']
  },
  '2x': {
    category: { en: 'Plan', no: 'Plan' },
    label: { en: '2x per week', no: '2x per uke' },
    text: {
      en: 'Recommend treatment frequency of 2 times per week for the next 2-4 weeks.',
      no: 'Anbefaler behandlingsfrekvens på 2 ganger per uke de neste 2-4 ukene.'
    },
    aliases: ['/2xweek', '/twice', '/2xuke']
  },
  '3x': {
    category: { en: 'Plan', no: 'Plan' },
    label: { en: '3x per week', no: '3x per uke' },
    text: {
      en: 'Recommend treatment frequency of 3 times per week during the acute phase.',
      no: 'Anbefaler behandlingsfrekvens på 3 ganger per uke i akuttfasen.'
    },
    aliases: ['/3xweek', '/thrice', '/3xuke']
  },
  '1x': {
    category: { en: 'Plan', no: 'Plan' },
    label: { en: '1x per week', no: '1x per uke' },
    text: {
      en: 'Recommend treatment frequency of 1 time per week for maintenance care.',
      no: 'Anbefaler behandlingsfrekvens på 1 gang per uke for vedlikeholdsbehandling.'
    },
    aliases: ['/1xweek', '/weekly', '/maintenance', '/1xuke', '/ukentlig']
  },
  prn: {
    category: { en: 'Plan', no: 'Plan' },
    label: { en: 'PRN', no: 'Ved behov' },
    text: {
      en: 'Patient may return on an as-needed basis for symptom management and wellness care.',
      no: 'Pasienten kan komme tilbake etter behov for symptomhåndtering og velværebehandling.'
    },
    aliases: ['/asneeded', '/etterbehov']
  },
  reeval: {
    category: { en: 'Plan', no: 'Plan' },
    label: { en: 'Re-evaluation', no: 'Re-evaluering' },
    text: {
      en: 'Re-evaluation scheduled in 30 days to assess progress and adjust treatment plan as needed.',
      no: 'Re-evaluering planlagt om 30 dager for å vurdere fremgang og justere behandlingsplan etter behov.'
    },
    aliases: ['/reexam', '/30day', '/reevaluering']
  },
  refer: {
    category: { en: 'Plan', no: 'Plan' },
    label: { en: 'Referral', no: 'Henvisning' },
    text: {
      en: 'Referral made to [SPECIALIST] for further evaluation and co-management.',
      no: 'Henvisning sendt til [SPESIALIST] for videre evaluering og sambehandling.'
    },
    aliases: ['/referral', '/henvisning']
  },
  imaging: {
    category: { en: 'Plan', no: 'Plan' },
    label: { en: 'Imaging Ordered', no: 'Bildediagnostikk bestilt' },
    text: {
      en: 'Diagnostic imaging ordered to further evaluate the condition. X-ray / MRI of [REGION].',
      no: 'Bildediagnostikk bestilt for videre evaluering av tilstanden. Røntgen / MR av [REGION].'
    },
    aliases: ['/xray', '/mri', '/røntgen']
  },
  discharge: {
    category: { en: 'Plan', no: 'Plan' },
    label: { en: 'Discharge', no: 'Utskrivelse' },
    text: {
      en: 'Patient has reached maximum therapeutic benefit and is discharged from active care. May return as needed for future episodes.',
      no: 'Pasienten har oppnådd maksimal terapeutisk nytte og skrives ut fra aktiv behandling. Kan komme tilbake ved behov for fremtidige episoder.'
    },
    aliases: ['/dc', '/mmb', '/utskrevet']
  },
  goals: {
    category: { en: 'Plan', no: 'Plan' },
    label: { en: 'Goals Met', no: 'Mål oppnådd' },
    text: {
      en: 'Patient has met treatment goals including: decreased pain, improved ROM, improved function, and return to normal activities.',
      no: 'Pasienten har oppnådd behandlingsmål inkludert: redusert smerte, bedret bevegelsesutslag, bedret funksjon og tilbake til normale aktiviteter.'
    },
    aliases: ['/goalsmet', '/måloppnådd']
  },

  // ===========================================================================
  // TREATMENT COMMANDS (9)
  // ===========================================================================
  adj: {
    category: { en: 'Treatment', no: 'Behandling' },
    label: { en: 'Adjustment', no: 'Justering' },
    text: {
      en: 'Spinal adjustment performed. Patient tolerated the adjustment well with no adverse reaction.',
      no: 'Spinal justering utført. Pasienten tolererte justeringen godt uten bivirkninger.'
    },
    aliases: ['/adjusted', '/manipulation', '/justering']
  },
  estim: {
    category: { en: 'Treatment', no: 'Behandling' },
    label: { en: 'E-Stim', no: 'El-stim' },
    text: {
      en: 'Electrical muscle stimulation applied to the affected area for 15 minutes to reduce muscle spasm and promote healing.',
      no: 'Elektrisk muskelstimulering påført det affiserte området i 15 minutter for å redusere muskelspasme og fremme tilheling.'
    },
    aliases: ['/ems', '/tens', '/elstim']
  },
  ultrasound: {
    category: { en: 'Treatment', no: 'Behandling' },
    label: { en: 'Ultrasound', no: 'Ultralyd' },
    text: {
      en: 'Therapeutic ultrasound applied to the affected area at 1.0 W/cm² for 5 minutes to promote tissue healing.',
      no: 'Terapeutisk ultralyd påført det affiserte området med 1,0 W/cm² i 5 minutter for å fremme vevstilheling.'
    },
    aliases: ['/us', '/ultralyd']
  },
  heat: {
    category: { en: 'Treatment', no: 'Behandling' },
    label: { en: 'Heat Therapy', no: 'Varmeterapi' },
    text: {
      en: 'Moist heat therapy applied for 15 minutes to increase circulation and relax muscle tissue.',
      no: 'Fuktig varmeterapi påført i 15 minutter for å øke sirkulasjonen og slappe av muskelvev.'
    },
    aliases: ['/hp', '/hotpack', '/varme']
  },
  ice: {
    category: { en: 'Treatment', no: 'Behandling' },
    label: { en: 'Ice Therapy', no: 'Isbehandling' },
    text: {
      en: 'Cryotherapy applied for 15 minutes to reduce inflammation and provide analgesic effect.',
      no: 'Kryoterapi påført i 15 minutter for å redusere inflammasjon og gi smertestillende effekt.'
    },
    aliases: ['/cryo', '/coldpack', '/is', '/kulde']
  },
  stretch: {
    category: { en: 'Treatment', no: 'Behandling' },
    label: { en: 'Stretching', no: 'Tøyning' },
    text: {
      en: 'Therapeutic stretching performed to improve flexibility and reduce muscle tension. – 8 minutes',
      no: 'Terapeutisk tøyning utført for å forbedre fleksibilitet og redusere muskelspenning. – 8 minutter'
    },
    aliases: ['/stretching', '/tøyning']
  },
  massage: {
    category: { en: 'Treatment', no: 'Behandling' },
    label: { en: 'Massage', no: 'Massasje' },
    text: {
      en: 'Therapeutic massage performed to reduce muscle tension and improve circulation. – 15 minutes',
      no: 'Terapeutisk massasje utført for å redusere muskelspenning og forbedre sirkulasjonen. – 15 minutter'
    },
    aliases: ['/softissue', '/bløtvev']
  },
  traction: {
    category: { en: 'Treatment', no: 'Behandling' },
    label: { en: 'Traction', no: 'Traksjon' },
    text: {
      en: 'Mechanical traction applied at appropriate poundage for 15 minutes to decompress spinal segments.',
      no: 'Mekanisk traksjon påført med passende belastning i 15 minutter for å dekomprimere spinalsegmenter.'
    },
    aliases: ['/decompression', '/dekompresjon']
  },
  tolerated: {
    category: { en: 'Treatment', no: 'Behandling' },
    label: { en: 'Tolerated Well', no: 'Tolerert godt' },
    text: {
      en: 'Patient tolerated all procedures well with no adverse reactions noted.',
      no: 'Pasienten tolererte alle prosedyrer godt uten bivirkninger observert.'
    },
    aliases: ['/tol', '/noadverse', '/tolerert']
  },

  // ===========================================================================
  // RESPONSE COMMANDS (5)
  // ===========================================================================
  goodresponse: {
    category: { en: 'Response', no: 'Respons' },
    label: { en: 'Good Response', no: 'God respons' },
    text: {
      en: 'Patient demonstrated good response to treatment with improved range of motion and decreased pain.',
      no: 'Pasienten demonstrerte god respons på behandling med bedret bevegelsesutslag og redusert smerte.'
    },
    aliases: ['/gr', '/godrespons']
  },
  excellent: {
    category: { en: 'Response', no: 'Respons' },
    label: { en: 'Excellent Response', no: 'Utmerket respons' },
    text: {
      en: 'Patient demonstrated excellent response to treatment with significant symptomatic improvement.',
      no: 'Pasienten demonstrerte utmerket respons på behandling med betydelig symptomatisk bedring.'
    },
    aliases: ['/exc', '/utmerket']
  },
  fair: {
    category: { en: 'Response', no: 'Respons' },
    label: { en: 'Fair Response', no: 'Moderat respons' },
    text: {
      en: 'Patient demonstrated fair response to treatment with mild improvement noted. May require treatment modification.',
      no: 'Pasienten demonstrerte moderat respons på behandling med mild bedring observert. Kan kreve behandlingsmodifikasjon.'
    },
    aliases: ['/fr', '/moderat']
  },
  poor: {
    category: { en: 'Response', no: 'Respons' },
    label: { en: 'Poor Response', no: 'Dårlig respons' },
    text: {
      en: 'Patient demonstrated poor response to current treatment approach. Treatment plan modification indicated.',
      no: 'Pasienten demonstrerte dårlig respons på nåværende behandlingstilnærming. Behandlingsplanmodifikasjon indikert.'
    },
    aliases: ['/pr', '/noresponse', '/dårlig']
  },
  soreness: {
    category: { en: 'Response', no: 'Respons' },
    label: { en: 'Post-Tx Soreness', no: 'Ømhet etter behandling' },
    text: {
      en: 'Patient advised that mild post-treatment soreness may occur for 24-48 hours. Ice application recommended as needed.',
      no: 'Pasienten informert om at mild ømhet etter behandling kan forekomme i 24-48 timer. Isapplikasjon anbefalt ved behov.'
    },
    aliases: ['/posttx', '/etterbehandling']
  }
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Build slash commands object for a specific language
 * @param {string} language - 'en' or 'no'
 * @returns {Object} Commands object keyed by command name
 */
export function buildSlashCommands(language = 'en') {
  const commands = {};

  Object.entries(SLASH_COMMAND_CONTENT).forEach(([key, content]) => {
    const cmd = `/${key}`;
    commands[cmd] = {
      category: content.category[language] || content.category.en,
      label: content.label[language] || content.label.en,
      text: content.text[language] || content.text.en,
      aliases: content.aliases || []
    };
  });

  return commands;
}

/**
 * Get all commands including aliases for a specific language
 * @param {string} language - 'en' or 'no'
 * @returns {Object} Commands with aliases expanded
 */
export function getAllCommandsWithAliases(language = 'en') {
  const commands = buildSlashCommands(language);
  const all = {};

  Object.entries(commands).forEach(([cmd, data]) => {
    all[cmd] = data;
    if (data.aliases) {
      data.aliases.forEach(alias => {
        all[alias] = { ...data, isAlias: true, mainCommand: cmd };
      });
    }
  });

  return all;
}

/**
 * Get command content in both languages
 * @param {string} key - Command key (without /)
 * @returns {Object} Command content with both languages
 */
export function getCommandContent(key) {
  return SLASH_COMMAND_CONTENT[key] || null;
}

// Export total command count for reference
export const COMMAND_COUNT = Object.keys(SLASH_COMMAND_CONTENT).length;
