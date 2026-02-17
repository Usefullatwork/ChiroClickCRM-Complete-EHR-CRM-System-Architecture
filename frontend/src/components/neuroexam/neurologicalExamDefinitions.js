/**
 * Neurological Examination Definitions
 *
 * Comprehensive cluster-based diagnostic testing protocol for:
 * - VNG/Oculomotor testing
 * - BPPV (all canal variants)
 * - Cerebellar function
 * - Vestibular function
 * - Cervicogenic dizziness
 * - TMJ dysfunction
 * - Upper cervical instability
 * - Myelopathy screening
 * - Dynamic positional testing (Activator)
 * - Full body orthopedic clusters
 *
 * Scoring: Cluster-based diagnosis increases sensitivity/specificity
 * Red flags: Automatic referral recommendations
 *
 * Bilingual: Norwegian (primary) / English
 */

// =============================================================================
// CLUSTER DEFINITIONS
// =============================================================================

export const EXAM_CLUSTERS = {
  // ---------------------------------------------------------------------------
  // CLUSTER 1: CEREBELLAR DYSFUNCTION
  // ---------------------------------------------------------------------------
  CEREBELLAR: {
    id: 'CEREBELLAR',
    name: { no: 'Cerebellær Funksjon', en: 'Cerebellar Function' },
    description: {
      no: 'Vurderer cerebellær dysfunksjon gjennom koordinasjons- og balansetester',
      en: 'Assesses cerebellar dysfunction through coordination and balance tests',
    },
    diagnosticCriteria: {
      threshold: 4,
      total: 8,
      interpretation: {
        high: {
          min: 4,
          label: {
            no: 'Høy sannsynlighet cerebellær patologi',
            en: 'High probability cerebellar pathology',
          },
        },
        moderate: {
          min: 2,
          max: 3,
          label: {
            no: 'Moderat sannsynlighet, vurder videre utredning',
            en: 'Moderate probability, consider further workup',
          },
        },
        low: { min: 0, max: 1, label: { no: 'Lav sannsynlighet', en: 'Low probability' } },
      },
    },
    referralAction: {
      no: 'Henvis til nevrolog, MR caput, vurder cerebrovaskulær risiko',
      en: 'Refer to neurologist, MRI brain, assess cerebrovascular risk',
    },
    tests: [
      {
        id: 'saccade_overshoots',
        name: { no: 'Sakkade Overshoots (VNG/VOG)', en: 'Saccade Overshoots (VNG/VOG)' },
        criteria: [
          {
            id: 'bilateral_horiz',
            label: {
              no: 'Bilateral horisontal overshoot >10%',
              en: 'Bilateral horizontal overshoot >10%',
            },
          },
          {
            id: 'vertical_overshoot',
            label: { no: 'Vertikal overshoot >10%', en: 'Vertical overshoot >10%' },
          },
          {
            id: 'consistent',
            label: { no: 'Konsistent på gjentatte forsøk', en: 'Consistent on repeated trials' },
          },
        ],
        interpretation: {
          no: 'Fastigial nucleus/OMV dysfunksjon',
          en: 'Fastigial nucleus/OMV dysfunction',
        },
      },
      {
        id: 'smooth_pursuit',
        name: {
          no: 'Smooth Pursuit med Catch-up Sakkader',
          en: 'Smooth Pursuit with Catch-up Saccades',
        },
        criteria: [
          {
            id: 'gain_horiz',
            label: { no: 'Pursuit gain <0.7 horisontalt', en: 'Pursuit gain <0.7 horizontal' },
          },
          {
            id: 'gain_vert',
            label: { no: 'Pursuit gain <0.7 vertikalt', en: 'Pursuit gain <0.7 vertical' },
          },
          {
            id: 'catchup_count',
            label: { no: '>5 catch-up sakkader per 30 sek', en: '>5 catch-up saccades per 30 sec' },
          },
        ],
        interpretation: {
          no: 'Flocculus/paraflocculus dysfunksjon',
          en: 'Flocculus/paraflocculus dysfunction',
        },
      },
      {
        id: 'gaze_evoked_nystagmus',
        name: { no: 'Gaze-Evoked Nystagmus', en: 'Gaze-Evoked Nystagmus' },
        criteria: [
          {
            id: 'horiz_20deg',
            label: {
              no: 'Horisontal gaze-evoked nystagmus ved 20°',
              en: 'Horizontal gaze-evoked nystagmus at 20°',
            },
          },
          {
            id: 'vertical',
            label: { no: 'Vertikal gaze-evoked nystagmus', en: 'Vertical gaze-evoked nystagmus' },
          },
          {
            id: 'rebound',
            label: {
              no: 'Rebound nystagmus ved retur til senter',
              en: 'Rebound nystagmus on return to center',
            },
          },
        ],
        interpretation: {
          no: 'Neural integrator (flocculus) dysfunksjon',
          en: 'Neural integrator (flocculus) dysfunction',
        },
      },
      {
        id: 'finger_nose_finger',
        name: { no: 'Finger-Nese-Finger Dysmetri', en: 'Finger-Nose-Finger Dysmetria' },
        criteria: [
          {
            id: 'intention_tremor',
            label: { no: 'Intention tremor bilateral', en: 'Intention tremor bilateral' },
          },
          {
            id: 'overshooting',
            label: { no: 'Overshooting >2cm bilateral', en: 'Overshooting >2cm bilateral' },
          },
          { id: 'decomposed', label: { no: 'Dekomponert bevegelse', en: 'Decomposed movement' } },
        ],
        interpretation: {
          no: 'Cerebellær hemisphære dysfunksjon',
          en: 'Cerebellar hemisphere dysfunction',
        },
      },
      {
        id: 'dysdiadochokinesia',
        name: { no: 'Dysdiadokokinesi', en: 'Dysdiadochokinesia' },
        criteria: [
          {
            id: 'reduced_speed',
            label: {
              no: 'Bilateral redusert hastighet (<10 bev/5 sek)',
              en: 'Bilateral reduced speed (<10 mov/5 sec)',
            },
          },
          { id: 'irregular_rhythm', label: { no: 'Irregulær rytme', en: 'Irregular rhythm' } },
          { id: 'arrhythmic', label: { no: 'Arytmiske bevegelser', en: 'Arrhythmic movements' } },
        ],
        interpretation: {
          no: 'Cerebellær hemisphære dysfunksjon',
          en: 'Cerebellar hemisphere dysfunction',
        },
      },
      {
        id: 'tandem_gait',
        name: { no: 'Tandem Gange', en: 'Tandem Gait' },
        criteria: [
          {
            id: 'lateral_sway',
            label: {
              no: 'Lateral svaing >10cm fra midtlinje',
              en: 'Lateral sway >10cm from midline',
            },
          },
          {
            id: 'corrective_steps',
            label: {
              no: 'Korrigerende sidesteg >3 steg/10m',
              en: 'Corrective sidesteps >3 steps/10m',
            },
          },
          { id: 'unable', label: { no: 'Ikke i stand til å utføre', en: 'Unable to perform' } },
        ],
        interpretation: {
          no: 'Vermis/flocculonodular dysfunksjon',
          en: 'Vermis/flocculonodular dysfunction',
        },
      },
      {
        id: 'romberg_modified',
        name: { no: 'Romberg (Modifisert)', en: 'Romberg (Modified)' },
        criteria: [
          {
            id: 'unstable_eyes_open',
            label: { no: 'Ustabilitet selv med åpne øyne', en: 'Instability even with eyes open' },
          },
          {
            id: 'fall_no_preference',
            label: {
              no: 'Fall tendens uten preferanse retning',
              en: 'Fall tendency without directional preference',
            },
          },
          {
            id: 'truncal_ataxia',
            label: { no: 'Truncal ataksi sittende', en: 'Truncal ataxia sitting' },
          },
        ],
        interpretation: { no: 'Midline cerebellum (vermis)', en: 'Midline cerebellum (vermis)' },
      },
      {
        id: 'heel_knee_shin',
        name: { no: 'Hel-Kne-Legg Test', en: 'Heel-Knee-Shin Test' },
        criteria: [
          { id: 'ataxia_bilateral', label: { no: 'Ataksi bilateral', en: 'Ataxia bilateral' } },
          {
            id: 'tremor_movement',
            label: { no: 'Tremor under bevegelse', en: 'Tremor during movement' },
          },
          {
            id: 'cant_follow_line',
            label: {
              no: 'Kan ikke følge rett linje langs tibia',
              en: 'Cannot follow straight line along tibia',
            },
          },
        ],
        interpretation: {
          no: 'Cerebellær hemisphære dysfunksjon',
          en: 'Cerebellar hemisphere dysfunction',
        },
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // CLUSTER 2: PERIPHERAL VESTIBULAR LOSS
  // ---------------------------------------------------------------------------
  VESTIBULAR: {
    id: 'VESTIBULAR',
    name: { no: 'Perifert Vestibulært Tap', en: 'Peripheral Vestibular Loss' },
    description: {
      no: 'Vurderer unilateralt perifert vestibulært tap',
      en: 'Assesses unilateral peripheral vestibular loss',
    },
    diagnosticCriteria: {
      threshold: 3,
      total: 6,
      sensitivity: 85,
      specificity: 90,
      interpretation: {
        high: {
          min: 3,
          label: {
            no: 'Høy sannsynlighet perifert vestibulært tap',
            en: 'High probability peripheral vestibular loss',
          },
        },
        low: { min: 0, max: 2, label: { no: 'Lav sannsynlighet', en: 'Low probability' } },
      },
    },
    hintsPlus: {
      name: 'HINTS+ Protocol',
      description: { no: 'Ekskluder hjerneslag', en: 'Exclude stroke' },
      centralSigns: [
        {
          id: 'hit_normal',
          label: {
            no: 'Head Impulse: Normal (dårlig tegn - SENTRAL)',
            en: 'Head Impulse: Normal (bad sign - CENTRAL)',
          },
        },
        {
          id: 'nystagmus_vertical',
          label: {
            no: 'Nystagmus: Vertikal/retningsendrede (SENTRAL)',
            en: 'Nystagmus: Vertical/direction-changing (CENTRAL)',
          },
        },
        {
          id: 'skew_positive',
          label: { no: 'Test of Skew: Positiv (SENTRAL)', en: 'Test of Skew: Positive (CENTRAL)' },
        },
        {
          id: 'hearing_loss',
          label: {
            no: 'PLUS: Hørselstap ipsilateral (bekrefter PERIFERT)',
            en: 'PLUS: Ipsilateral hearing loss (confirms PERIPHERAL)',
          },
        },
      ],
      action: {
        no: 'HINTS+ positiv for SENTRAL: → Akutt henvisning nevrolog/ØNH',
        en: 'HINTS+ positive for CENTRAL: → Urgent referral neurologist/ENT',
      },
    },
    tests: [
      {
        id: 'spontaneous_nystagmus',
        name: {
          no: 'Spontan Nystagmus (fikseringsblokk)',
          en: 'Spontaneous Nystagmus (fixation block)',
        },
        criteria: [
          {
            id: 'horiz_torsional',
            label: {
              no: 'Horisontal-torsjonell nystagmus mot frisk side',
              en: 'Horizontal-torsional nystagmus toward healthy side',
            },
          },
          {
            id: 'spv_6',
            label: { no: 'Slow phase velocity >6°/s', en: 'Slow phase velocity >6°/s' },
          },
          {
            id: 'increases_frenzel',
            label: { no: 'Øker med Frenzel briller', en: 'Increases with Frenzel goggles' },
          },
          {
            id: 'reduces_fixation',
            label: { no: 'Reduseres med fiksering', en: 'Reduces with fixation' },
          },
        ],
        interpretation: {
          no: 'Akutt perifert vestibulært tap (samme side som slow phase)',
          en: 'Acute peripheral vestibular loss (same side as slow phase)',
        },
        sideTracking: true,
      },
      {
        id: 'head_impulse_test',
        name: { no: 'Head Impulse Test (Halmagyi)', en: 'Head Impulse Test (Halmagyi)' },
        criteria: [
          {
            id: 'positive_right',
            label: {
              no: 'Positiv høyre (corrective saccade)',
              en: 'Positive right (corrective saccade)',
            },
          },
          {
            id: 'positive_left',
            label: {
              no: 'Positiv venstre (corrective saccade)',
              en: 'Positive left (corrective saccade)',
            },
          },
          { id: 'bilateral', label: { no: 'Bilateral positiv', en: 'Bilateral positive' } },
        ],
        interpretation: {
          no: 'Positiv = ipsilateral superior canal dysfunksjon',
          en: 'Positive = ipsilateral superior canal dysfunction',
        },
        sideTracking: true,
      },
      {
        id: 'caloric_test',
        name: { no: 'Caloric Test (VNG)', en: 'Caloric Test (VNG)' },
        criteria: [
          {
            id: 'unilateral_weakness',
            label: { no: 'Unilateral weakness >25%', en: 'Unilateral weakness >25%' },
          },
          {
            id: 'directional_preponderance',
            label: { no: 'Directional preponderance >30%', en: 'Directional preponderance >30%' },
          },
          {
            id: 'bilateral_weakness',
            label: { no: 'Bilateral weakness', en: 'Bilateral weakness' },
          },
        ],
        interpretation: {
          no: 'Unilateral weakness = perifert tap samme side',
          en: 'Unilateral weakness = peripheral loss same side',
        },
        sideTracking: true,
        valueInput: {
          label: { no: 'Side', en: 'Side' },
          type: 'select',
          options: ['Høyre/Right', 'Venstre/Left', 'Bilateral'],
        },
      },
      {
        id: 'test_of_skew',
        name: {
          no: 'Test av Skew (Vertical Misalignment)',
          en: 'Test of Skew (Vertical Misalignment)',
        },
        criteria: [
          { id: 'vertical_diplopia', label: { no: 'Vertikal diplopi', en: 'Vertical diplopia' } },
          {
            id: 'cover_uncover_positive',
            label: { no: 'Cover-uncover test positiv', en: 'Cover-uncover test positive' },
          },
          { id: 'svv_deviation', label: { no: 'SVV >2° avvik', en: 'SVV >2° deviation' } },
        ],
        interpretation: {
          no: 'Positiv = SENTRAL lesjon (ikke perifert)',
          en: 'Positive = CENTRAL lesion (not peripheral)',
        },
        redFlag: true,
      },
      {
        id: 'gait_head_movement',
        name: { no: 'Gangtest med Hodebevegelser', en: 'Gait Test with Head Movement' },
        criteria: [
          {
            id: 'veering',
            label: { no: 'Avvergegange mot affisert side', en: 'Veering toward affected side' },
          },
          {
            id: 'romberg_fall',
            label: {
              no: 'Romberg fall mot affisert side',
              en: 'Romberg fall toward affected side',
            },
          },
          {
            id: 'cant_walk_rotation',
            label: { no: 'Kan ikke gå med hoderotasjon', en: 'Cannot walk with head rotation' },
          },
        ],
        interpretation: { no: 'Perifert vestibulært tap', en: 'Peripheral vestibular loss' },
        sideTracking: true,
      },
      {
        id: 'dynamic_visual_acuity',
        name: { no: 'Dynamic Visual Acuity Test', en: 'Dynamic Visual Acuity Test' },
        criteria: [
          {
            id: 'line_loss',
            label: {
              no: '>3 linjer tap på Snellen ved hoderotasjon',
              en: '>3 lines loss on Snellen with head rotation',
            },
          },
          { id: 'bilateral_loss', label: { no: 'Bilateral tap', en: 'Bilateral loss' } },
        ],
        interpretation: {
          no: 'Bilateral vestibulær tap (BVL)',
          en: 'Bilateral vestibular loss (BVL)',
        },
        sideTracking: true,
        valueInput: {
          label: { no: 'Side med mest tap', en: 'Side with most loss' },
          type: 'select',
          options: ['Høyre/Right', 'Venstre/Left'],
        },
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // CLUSTER 3: BPPV CANAL DIFFERENTIATION
  // ---------------------------------------------------------------------------
  BPPV: {
    id: 'BPPV',
    name: { no: 'BPPV Kanaldiferensiering', en: 'BPPV Canal Differentiation' },
    description: {
      no: 'Differensierer mellom posterior, lateral og anterior kanal BPPV',
      en: 'Differentiates between posterior, lateral, and anterior canal BPPV',
    },
    subClusters: {
      posterior: {
        id: 'BPPV_POSTERIOR',
        name: { no: 'Posterior Kanal BPPV (80-90%)', en: 'Posterior Canal BPPV (80-90%)' },
        treatment: { no: 'Epley manøver / Semont manøver', en: 'Epley maneuver / Semont maneuver' },
      },
      lateral_geotropic: {
        id: 'BPPV_LATERAL_GEO',
        name: {
          no: 'Lateral Kanal BPPV - Geotropisk (Canalolithiasis)',
          en: 'Lateral Canal BPPV - Geotropic (Canalolithiasis)',
        },
        treatment: {
          no: 'Gufoni manøver / BBQ roll / Forced prolonged position',
          en: 'Gufoni maneuver / BBQ roll / Forced prolonged position',
        },
      },
      lateral_ageotropic: {
        id: 'BPPV_LATERAL_AGEO',
        name: {
          no: 'Lateral Kanal BPPV - Ageotropisk (Cupulolithiasis)',
          en: 'Lateral Canal BPPV - Ageotropic (Cupulolithiasis)',
        },
        treatment: {
          no: 'Modifisert Gufoni / Head-shaking / Mastoid vibration',
          en: 'Modified Gufoni / Head-shaking / Mastoid vibration',
        },
        note: {
          no: 'Vanskeligere å behandle enn geotropisk variant',
          en: 'More difficult to treat than geotropic variant',
        },
      },
      anterior: {
        id: 'BPPV_ANTERIOR',
        name: { no: 'Anterior Kanal BPPV (<5%, sjelden)', en: 'Anterior Canal BPPV (<5%, rare)' },
        treatment: {
          no: 'Yacovino manøver / Reverse Epley',
          en: 'Yacovino maneuver / Reverse Epley',
        },
      },
    },
    tests: [
      {
        id: 'dix_hallpike_right',
        name: { no: 'Dix-Hallpike Test - Høyre', en: 'Dix-Hallpike Test - Right' },
        criteria: [
          {
            id: 'negative',
            label: {
              no: 'Negativ (ingen nystagmus/vertigo)',
              en: 'Negative (no nystagmus/vertigo)',
            },
            exclusive: true,
          },
          {
            id: 'geotropic_torsional',
            label: { no: 'Geotropisk torsjonell nystagmus', en: 'Geotropic torsional nystagmus' },
          },
          {
            id: 'ageotropic_torsional',
            label: { no: 'Ageotropisk torsjonell nystagmus', en: 'Ageotropic torsional nystagmus' },
          },
          {
            id: 'vertical_anterior',
            label: {
              no: 'Vertikal nystagmus (anterior canal)',
              en: 'Vertical nystagmus (anterior canal)',
            },
          },
          { id: 'latency_5s', label: { no: 'Latency <5 sekunder', en: 'Latency <5 seconds' } },
          {
            id: 'duration_60s',
            label: { no: 'Varighet <60 sekunder', en: 'Duration <60 seconds' },
          },
          {
            id: 'subjective_vertigo',
            label: { no: 'Subjektiv vertigo', en: 'Subjective vertigo' },
          },
        ],
        side: 'right',
      },
      {
        id: 'dix_hallpike_left',
        name: { no: 'Dix-Hallpike Test - Venstre', en: 'Dix-Hallpike Test - Left' },
        criteria: [
          {
            id: 'negative',
            label: {
              no: 'Negativ (ingen nystagmus/vertigo)',
              en: 'Negative (no nystagmus/vertigo)',
            },
            exclusive: true,
          },
          {
            id: 'geotropic_torsional',
            label: { no: 'Geotropisk torsjonell nystagmus', en: 'Geotropic torsional nystagmus' },
          },
          {
            id: 'ageotropic_torsional',
            label: { no: 'Ageotropisk torsjonell nystagmus', en: 'Ageotropic torsional nystagmus' },
          },
          {
            id: 'vertical_anterior',
            label: {
              no: 'Vertikal nystagmus (anterior canal)',
              en: 'Vertical nystagmus (anterior canal)',
            },
          },
          { id: 'latency_5s', label: { no: 'Latency <5 sekunder', en: 'Latency <5 seconds' } },
          {
            id: 'duration_60s',
            label: { no: 'Varighet <60 sekunder', en: 'Duration <60 seconds' },
          },
          {
            id: 'subjective_vertigo',
            label: { no: 'Subjektiv vertigo', en: 'Subjective vertigo' },
          },
        ],
        side: 'left',
      },
      {
        id: 'supine_roll_right',
        name: { no: 'Supine Roll Test - Høyre', en: 'Supine Roll Test - Right' },
        criteria: [
          { id: 'negative', label: { no: 'Negativ', en: 'Negative' }, exclusive: true },
          {
            id: 'geotropic_horizontal',
            label: { no: 'Geotropisk horisontal nystagmus', en: 'Geotropic horizontal nystagmus' },
          },
          {
            id: 'ageotropic_horizontal',
            label: {
              no: 'Ageotropisk horisontal nystagmus',
              en: 'Ageotropic horizontal nystagmus',
            },
          },
          {
            id: 'stronger_than_opposite',
            label: { no: 'Sterkere enn motsatt side', en: 'Stronger than opposite side' },
          },
        ],
        side: 'right',
      },
      {
        id: 'supine_roll_left',
        name: { no: 'Supine Roll Test - Venstre', en: 'Supine Roll Test - Left' },
        criteria: [
          { id: 'negative', label: { no: 'Negativ', en: 'Negative' }, exclusive: true },
          {
            id: 'geotropic_horizontal',
            label: { no: 'Geotropisk horisontal nystagmus', en: 'Geotropic horizontal nystagmus' },
          },
          {
            id: 'ageotropic_horizontal',
            label: {
              no: 'Ageotropisk horisontal nystagmus',
              en: 'Ageotropic horizontal nystagmus',
            },
          },
          {
            id: 'stronger_than_opposite',
            label: { no: 'Sterkere enn motsatt side', en: 'Stronger than opposite side' },
          },
        ],
        side: 'left',
      },
      {
        id: 'bow_and_lean',
        name: { no: 'Bow and Lean Test', en: 'Bow and Lean Test' },
        criteria: [
          { id: 'negative', label: { no: 'Negativ', en: 'Negative' }, exclusive: true },
          {
            id: 'downbeat_bow',
            label: { no: 'Downbeat ved bow (fremover)', en: 'Downbeat on bow (forward)' },
          },
          {
            id: 'upbeat_lean',
            label: { no: 'Upbeat ved lean (bakover)', en: 'Upbeat on lean (backward)' },
          },
          { id: 'horizontal_right', label: { no: 'Horisontal høyre', en: 'Horizontal right' } },
          { id: 'horizontal_left', label: { no: 'Horisontal venstre', en: 'Horizontal left' } },
        ],
      },
      {
        id: 'deep_head_hanging',
        name: { no: 'Deep Head Hanging (Yacovino)', en: 'Deep Head Hanging (Yacovino)' },
        criteria: [
          { id: 'negative', label: { no: 'Negativ', en: 'Negative' }, exclusive: true },
          {
            id: 'downbeating',
            label: { no: 'Downbeating nystagmus', en: 'Downbeating nystagmus' },
          },
          {
            id: 'torsional_component',
            label: {
              no: 'Torsjonell komponent mot affisert side',
              en: 'Torsional component toward affected side',
            },
          },
          { id: 'latency_5s', label: { no: 'Latency <5 sekunder', en: 'Latency <5 seconds' } },
        ],
        interpretation: { no: 'Anterior kanal BPPV', en: 'Anterior canal BPPV' },
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // CLUSTER 4: CERVICOGENIC DIZZINESS
  // ---------------------------------------------------------------------------
  CERVICOGENIC: {
    id: 'CERVICOGENIC',
    name: { no: 'Cervikogen Svimmelhet', en: 'Cervicogenic Dizziness' },
    description: {
      no: 'Vurderer cervikogen årsak til svimmelhet. OBS: Alltid ekskluder vestibulær og cerebellær patologi først!',
      en: 'Assesses cervicogenic cause of dizziness. NOTE: Always exclude vestibular and cerebellar pathology first!',
    },
    diagnosticCriteria: {
      threshold: 4,
      total: 7,
      interpretation: {
        high: {
          min: 4,
          label: { no: 'Sannsynlig cervikogen svimmelhet', en: 'Probable cervicogenic dizziness' },
        },
        low: {
          min: 0,
          max: 3,
          label: { no: 'Usannsynlig cervikogen årsak', en: 'Unlikely cervicogenic cause' },
        },
      },
    },
    treatmentAction: {
      no: 'Mobilisering C1-C2, proprioseptiv rehabilitering. Unngå aggressive HVLA ved VBI mistanke.',
      en: 'Mobilization C1-C2, proprioceptive rehabilitation. Avoid aggressive HVLA if VBI suspected.',
    },
    redFlags: {
      name: { no: 'RØDE FLAGG (HENVIS AKUTT)', en: 'RED FLAGS (URGENT REFERRAL)' },
      items: [
        {
          id: '5ds_3ns',
          label: { no: "5 D's og 3 N's tilstede (VBI)", en: "5 D's and 3 N's present (VBI)" },
        },
        { id: 'drop_attacks', label: { no: 'Drop attacks', en: 'Drop attacks' } },
        {
          id: 'diplopia',
          label: { no: 'Diplopi, dysartri, dysfagi', en: 'Diplopia, dysarthria, dysphagia' },
        },
        {
          id: 'nystagmus_vertical',
          label: {
            no: 'Nystagmus (vertikal/retningsendrede)',
            en: 'Nystagmus (vertical/direction-changing)',
          },
        },
      ],
    },
    tests: [
      {
        id: 'cervical_rom',
        name: { no: 'Cervical Range of Motion', en: 'Cervical Range of Motion' },
        criteria: [
          {
            id: 'rotation_limited',
            label: {
              no: 'Begrenset rotasjon <60° bilateral',
              en: 'Limited rotation <60° bilateral',
            },
          },
          {
            id: 'flexion_limited',
            label: { no: 'Begrenset fleksjon <50°', en: 'Limited flexion <50°' },
          },
          {
            id: 'provokes_dizziness',
            label: {
              no: 'Provoserer svimmelhet/disequilibrium',
              en: 'Provokes dizziness/disequilibrium',
            },
          },
          {
            id: 'not_rotatory',
            label: { no: 'Ikke rotatorisk vertigo', en: 'Not rotatory vertigo' },
          },
        ],
        interpretation: {
          no: 'Redusert proprioseptiv input fra C1-C3',
          en: 'Reduced proprioceptive input from C1-C3',
        },
        valueInput: {
          label: { no: 'Rotasjon høyre/venstre (grader)', en: 'Rotation right/left (degrees)' },
          type: 'text',
        },
      },
      {
        id: 'smooth_pursuit_neck_torsion',
        name: { no: 'Smooth Pursuit Neck Torsion Test', en: 'Smooth Pursuit Neck Torsion Test' },
        criteria: [
          {
            id: 'reduced_right',
            label: {
              no: 'Redusert pursuit gain med nakke rotert 45° høyre',
              en: 'Reduced pursuit gain with neck rotated 45° right',
            },
          },
          {
            id: 'reduced_left',
            label: {
              no: 'Redusert pursuit gain med nakke rotert 45° venstre',
              en: 'Reduced pursuit gain with neck rotated 45° left',
            },
          },
          {
            id: 'normal_neutral',
            label: {
              no: 'Normal pursuit i nøytral posisjon',
              en: 'Normal pursuit in neutral position',
            },
          },
          {
            id: 'gain_diff',
            label: {
              no: 'Gain forskjell >0.1 mellom rotert og nøytral',
              en: 'Gain difference >0.1 between rotated and neutral',
            },
          },
        ],
        interpretation: {
          no: 'Cervical proprioseptiv dysfunksjon',
          en: 'Cervical proprioceptive dysfunction',
        },
      },
      {
        id: 'flexion_rotation_test',
        name: {
          no: 'Cervical Flexion-Rotation Test (C1-C2)',
          en: 'Cervical Flexion-Rotation Test (C1-C2)',
        },
        criteria: [
          {
            id: 'limited_right',
            label: { no: 'Begrenset rotasjon <32° høyre', en: 'Limited rotation <32° right' },
          },
          {
            id: 'limited_left',
            label: { no: 'Begrenset rotasjon <32° venstre', en: 'Limited rotation <32° left' },
          },
          {
            id: 'asymmetry',
            label: { no: 'Asymmetri >10° mellom sider', en: 'Asymmetry >10° between sides' },
          },
        ],
        interpretation: {
          no: 'Upper cervical dysfunksjon (C1-C2)',
          en: 'Upper cervical dysfunction (C1-C2)',
        },
      },
      {
        id: 'vertebral_artery_testing',
        name: { no: 'Vertebral Artery Testing', en: 'Vertebral Artery Testing' },
        criteria: [
          {
            id: 'de_kleyn',
            label: {
              no: 'De Kleyn test: Svimmelhet/nystagmus',
              en: 'De Kleyn test: Dizziness/nystagmus',
            },
          },
          {
            id: 'maigne',
            label: {
              no: 'Maigne test: Svimmelhet ved ekstensjon-rotasjon',
              en: 'Maigne test: Dizziness with extension-rotation',
            },
          },
          {
            id: 'hautant',
            label: {
              no: 'Hautant test: Arm pronerer/drifter',
              en: 'Hautant test: Arm pronates/drifts',
            },
          },
          {
            id: 'underberg',
            label: {
              no: 'Underberg test: Ustabilitet ved marsjering',
              en: 'Underberg test: Instability during marching',
            },
          },
        ],
        interpretation: {
          no: 'Vertebrobasilar insuffisiens (VBI) - ADVARSEL',
          en: 'Vertebrobasilar insufficiency (VBI) - WARNING',
        },
        redFlag: true,
      },
      {
        id: 'joint_position_error',
        name: {
          no: 'Cervical Joint Position Error (JPE)',
          en: 'Cervical Joint Position Error (JPE)',
        },
        criteria: [
          {
            id: 'error_4_5',
            label: {
              no: '>4.5° feil ved relokalisering etter rotasjon',
              en: '>4.5° error on relocation after rotation',
            },
          },
          {
            id: 'bilateral_elevated',
            label: { no: 'Bilateral JPE forhøyet', en: 'Bilateral JPE elevated' },
          },
        ],
        interpretation: { no: 'Proprioseptiv dysfunksjon', en: 'Proprioceptive dysfunction' },
      },
      {
        id: 'palpation_segmental',
        name: { no: 'Palpasjon og Segmental Testing', en: 'Palpation and Segmental Testing' },
        criteria: [
          {
            id: 'c1_c2',
            label: {
              no: 'C1-C2: Palpasjonsøm/restriksjon',
              en: 'C1-C2: Palpation tenderness/restriction',
            },
          },
          {
            id: 'c2_c3',
            label: {
              no: 'C2-C3: Palpasjonsøm/restriksjon',
              en: 'C2-C3: Palpation tenderness/restriction',
            },
          },
          {
            id: 'suboccipital_hypertonia',
            label: {
              no: 'Suboksipital muskulatur hypertoni',
              en: 'Suboccipital musculature hypertonia',
            },
          },
          {
            id: 'scm_scalene_tp',
            label: { no: 'Triggerpunkter SCM/scalene', en: 'Trigger points SCM/scalene' },
          },
        ],
      },
      {
        id: 'provocation_test',
        name: { no: 'Provokasjonstest', en: 'Provocation Test' },
        criteria: [
          {
            id: 'sustained_position',
            label: {
              no: 'Svimmelhet reproduseres med sustained posisjon',
              en: 'Dizziness reproduced with sustained position',
            },
          },
          {
            id: 'isometric_resistance',
            label: {
              no: 'Svimmelhet ved isometrisk cervical motstand',
              en: 'Dizziness with isometric cervical resistance',
            },
          },
          {
            id: 'negative_dix_hallpike',
            label: {
              no: 'Ingen svimmelhet ved Dix-Hallpike (ekskluderer BPPV)',
              en: 'No dizziness on Dix-Hallpike (excludes BPPV)',
            },
          },
        ],
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // CLUSTER 5: TMJ DYSFUNCTION WITH CRANIOCERVICAL INVOLVEMENT
  // ---------------------------------------------------------------------------
  TMJ: {
    id: 'TMJ',
    name: {
      no: 'TMJ Dysfunksjon med Craniocervical Involvering',
      en: 'TMJ Dysfunction with Craniocervical Involvement',
    },
    description: {
      no: 'Vurderer TMJ dysfunksjon og dens påvirkning på craniocervical region (DC/TMD kriterier)',
      en: 'Assesses TMJ dysfunction and its impact on craniocervical region (DC/TMD criteria)',
    },
    diagnosticCriteria: {
      threshold: 3,
      total: 7,
      interpretation: {
        high: {
          min: 3,
          label: {
            no: 'TMJ dysfunksjon med cervical involvement',
            en: 'TMJ dysfunction with cervical involvement',
          },
        },
        low: {
          min: 0,
          max: 2,
          label: { no: 'Usannsynlig TMJ-relatert', en: 'Unlikely TMJ-related' },
        },
      },
    },
    subclassification: {
      myofascial: {
        name: { no: 'Myofascial Pain', en: 'Myofascial Pain' },
        criteria: ['palpation_tenderness', 'referred_pain', 'trigger_points'],
        treatment: {
          no: 'Myofascial release, dry needling, øvelser',
          en: 'Myofascial release, dry needling, exercises',
        },
      },
      disc_with_reduction: {
        name: { no: 'Disc Displacement with Reduction', en: 'Disc Displacement with Reduction' },
        criteria: ['reciprocal_clicking', 'c_curve', 'opening_40mm'],
        treatment: {
          no: 'Mobilisering, stabiliseringsøvelser',
          en: 'Mobilization, stabilization exercises',
        },
      },
      disc_without_reduction: {
        name: {
          no: 'Disc Displacement without Reduction (Closed Lock)',
          en: 'Disc Displacement without Reduction (Closed Lock)',
        },
        criteria: [
          'previous_clicking_stopped',
          'acute_limited_30mm',
          'hard_end_feel',
          'ipsilateral_deviation',
        ],
        treatment: {
          no: 'Forsiktig mobilisering, evt. henvisning oral kirurg',
          en: 'Gentle mobilization, possible referral oral surgeon',
        },
      },
      degenerative: {
        name: {
          no: 'Degenerativ Joint Disease (Artrose)',
          en: 'Degenerative Joint Disease (Osteoarthritis)',
        },
        criteria: [
          'crepitus_bilateral',
          'age_40',
          'progressive_limitation',
          'morning_stiffness_30min',
        ],
        treatment: {
          no: 'Antiinflammatorisk, mobilisering, splint',
          en: 'Anti-inflammatory, mobilization, splint',
        },
      },
    },
    tests: [
      {
        id: 'tmj_palpation',
        name: { no: 'TMJ Palpasjon', en: 'TMJ Palpation' },
        criteria: [
          {
            id: 'lateral_pol_right',
            label: {
              no: 'Høyre lateral pol: Øm (0-3 skala)',
              en: 'Right lateral pole: Tender (0-3 scale)',
            },
            hasScore: true,
          },
          {
            id: 'lateral_pol_left',
            label: {
              no: 'Venstre lateral pol: Øm (0-3 skala)',
              en: 'Left lateral pole: Tender (0-3 scale)',
            },
            hasScore: true,
          },
          {
            id: 'posterior_right',
            label: {
              no: 'Høyre posterior attachment: Øm',
              en: 'Right posterior attachment: Tender',
            },
          },
          {
            id: 'posterior_left',
            label: {
              no: 'Venstre posterior attachment: Øm',
              en: 'Left posterior attachment: Tender',
            },
          },
          {
            id: 'crepitus_clicking',
            label: {
              no: 'Krepitasjon eller klikking bilateral',
              en: 'Crepitus or clicking bilateral',
            },
          },
        ],
      },
      {
        id: 'masseter_temporalis',
        name: { no: 'Masseter/Temporalis Palpasjon', en: 'Masseter/Temporalis Palpation' },
        criteria: [
          {
            id: 'masseter_right_tp',
            label: { no: 'Masseter høyre: Triggerpunkt', en: 'Masseter right: Trigger point' },
            hasVAS: true,
          },
          {
            id: 'masseter_left_tp',
            label: { no: 'Masseter venstre: Triggerpunkt', en: 'Masseter left: Trigger point' },
            hasVAS: true,
          },
          {
            id: 'temporalis_right',
            label: { no: 'Temporalis høyre: Øm', en: 'Temporalis right: Tender' },
          },
          {
            id: 'temporalis_left',
            label: { no: 'Temporalis venstre: Øm', en: 'Temporalis left: Tender' },
          },
          {
            id: 'referred_temporal',
            label: {
              no: 'Referert smerte til temporal region',
              en: 'Referred pain to temporal region',
            },
          },
        ],
      },
      {
        id: 'mandibular_rom',
        name: { no: 'Mandibulær Range of Motion', en: 'Mandibular Range of Motion' },
        criteria: [
          {
            id: 'opening_40mm',
            label: { no: 'Maksimal åpning <40mm', en: 'Maximum opening <40mm' },
          },
          {
            id: 'assisted_5mm',
            label: {
              no: 'Assisted åpning øker <5mm (kapsel restriksjon)',
              en: 'Assisted opening increases <5mm (capsule restriction)',
            },
          },
          {
            id: 'deviation_2mm',
            label: {
              no: 'Deviasjon >2mm mot affisert side',
              en: 'Deviation >2mm toward affected side',
            },
          },
          {
            id: 'c_curve',
            label: {
              no: 'C-kurve deviasjon (disc displacement)',
              en: 'C-curve deviation (disc displacement)',
            },
          },
          {
            id: 'lateral_asymmetry',
            label: {
              no: 'Lateral excursion asymmetri >2mm',
              en: 'Lateral excursion asymmetry >2mm',
            },
          },
        ],
        valueInput: { label: { no: 'Maks åpning (mm)', en: 'Max opening (mm)' }, type: 'number' },
      },
      {
        id: 'cervical_mandibular_interaction',
        name: { no: 'Cervical-Mandibulær Interaksjon', en: 'Cervical-Mandibular Interaction' },
        criteria: [
          {
            id: 'opening_reduces_flexion',
            label: {
              no: 'Kjeve åpning reduseres med nakke fleksjon',
              en: 'Jaw opening reduces with neck flexion',
            },
          },
          {
            id: 'opening_increases_extension',
            label: {
              no: 'Kjeve åpning øker med nakke ekstensjon',
              en: 'Jaw opening increases with neck extension',
            },
          },
          {
            id: 'pain_provoked_rotation',
            label: {
              no: 'Smerte TMJ provoseres ved nakke rotasjon',
              en: 'TMJ pain provoked by neck rotation',
            },
          },
          {
            id: 'altered_tone',
            label: {
              no: 'Endret muskeltonus ved kjeve posisjon',
              en: 'Altered muscle tone with jaw position',
            },
          },
        ],
      },
      {
        id: 'dynamic_positional_muscle',
        name: { no: 'Dynamisk Posisjonell Muskeltest', en: 'Dynamic Positional Muscle Test' },
        criteria: [
          {
            id: 'weakens_max_opening',
            label: {
              no: 'Indikatormuskel svekkes ved kjeve maksimal åpning',
              en: 'Indicator muscle weakens with maximum jaw opening',
            },
          },
          {
            id: 'weakens_lateral_right',
            label: {
              no: 'Indikatormuskel svekkes ved lateral deviasjon høyre',
              en: 'Indicator muscle weakens with lateral deviation right',
            },
          },
          {
            id: 'weakens_lateral_left',
            label: {
              no: 'Indikatormuskel svekkes ved lateral deviasjon venstre',
              en: 'Indicator muscle weakens with lateral deviation left',
            },
          },
          {
            id: 'asymmetric_response',
            label: {
              no: 'Asymmetrisk respons mellom sider',
              en: 'Asymmetric response between sides',
            },
          },
        ],
      },
      {
        id: 'upper_cervical_screening',
        name: { no: 'Upper Cervical Screening', en: 'Upper Cervical Screening' },
        criteria: [
          {
            id: 'c1_c2_rotation',
            label: {
              no: 'C1-C2 rotasjon begrenset <32° en side',
              en: 'C1-C2 rotation limited <32° one side',
            },
          },
          {
            id: 'suboccipital_tp',
            label: { no: 'Suboksipital triggerpunkter', en: 'Suboccipital trigger points' },
          },
          {
            id: 'occipital_headache',
            label: {
              no: 'Occipital hovedpine (referert fra C1-C2)',
              en: 'Occipital headache (referred from C1-C2)',
            },
          },
        ],
      },
      {
        id: 'otalgia_referred',
        name: { no: 'Otalgia og Referert Smerte', en: 'Otalgia and Referred Pain' },
        criteria: [
          {
            id: 'ear_pain',
            label: {
              no: 'Øresmerter uten otologisk funn',
              en: 'Ear pain without otologic findings',
            },
          },
          {
            id: 'tinnitus_tmj',
            label: {
              no: 'Tinnitus assosiert med TMJ bevegelse',
              en: 'Tinnitus associated with TMJ movement',
            },
          },
          {
            id: 'fullness',
            label: { no: 'Følelse av "fullhet" i øret', en: 'Feeling of "fullness" in ear' },
          },
          {
            id: 'temporal_headache',
            label: { no: 'Hovedpine temporal region', en: 'Headache temporal region' },
          },
        ],
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // CLUSTER 6: UPPER CERVICAL INSTABILITY
  // ---------------------------------------------------------------------------
  UPPER_CERVICAL_INSTABILITY: {
    id: 'UPPER_CERVICAL_INSTABILITY',
    name: { no: 'Upper Cervical Instabilitet', en: 'Upper Cervical Instability' },
    description: {
      no: 'Vurderer C1-C2 instabilitet. KRITISK: Ved mistanke - IKKE HVLA før bildebekreftelse!',
      en: 'Assesses C1-C2 instability. CRITICAL: If suspected - NO HVLA before imaging confirmation!',
    },
    diagnosticCriteria: {
      threshold: 4,
      total: 7,
      interpretation: {
        high: {
          min: 4,
          label: {
            no: 'Høy mistanke om C1-C2 instabilitet',
            en: 'High suspicion of C1-C2 instability',
          },
        },
        low: { min: 0, max: 3, label: { no: 'Lav mistanke', en: 'Low suspicion' } },
      },
    },
    criticalAction: {
      no: 'Henvis til MR cervical med fleksjon-ekstensjon. INGEN HVLA manipulasjon. Røntgen: ADI >3mm voksen = patologisk',
      en: 'Refer for MRI cervical with flexion-extension. NO HVLA manipulation. X-ray: ADI >3mm adult = pathological',
    },
    redFlags: {
      name: { no: 'RØDE FLAGG (AKUTT BILDEDIAGNOSTIKK)', en: 'RED FLAGS (URGENT IMAGING)' },
      items: [
        {
          id: 'trauma',
          label: {
            no: 'Trauma i anamnese (whiplash, fall)',
            en: 'Trauma history (whiplash, fall)',
          },
        },
        {
          id: 'ra',
          label: {
            no: 'Revmatoid artritt (50% har C1-C2 instabilitet)',
            en: 'Rheumatoid arthritis (50% have C1-C2 instability)',
          },
        },
        { id: 'down_syndrome', label: { no: 'Down syndrom', en: 'Down syndrome' } },
        {
          id: 'eds',
          label: {
            no: 'Ehlers-Danlos syndrom (hypermobilitet)',
            en: 'Ehlers-Danlos syndrome (hypermobility)',
          },
        },
        { id: 'myelopathic_signs', label: { no: 'Myelopatiske tegn', en: 'Myelopathic signs' } },
      ],
    },
    tests: [
      {
        id: 'sharp_purser',
        name: { no: 'Sharp-Purser Test', en: 'Sharp-Purser Test' },
        criteria: [
          {
            id: 'positive_clunk',
            label: {
              no: 'Positiv: Clunk, symptomreduksjon ved anterior glide C1',
              en: 'Positive: Clunk, symptom reduction with anterior glide C1',
            },
          },
          {
            id: 'head_falls_forward',
            label: {
              no: 'Subjektiv følelse av "hodet faller frem"',
              en: 'Subjective feeling of "head falls forward"',
            },
          },
        ],
        interpretation: { no: 'Atlantoaxial instabilitet', en: 'Atlantoaxial instability' },
        redFlag: true,
      },
      {
        id: 'alar_ligament_stress',
        name: { no: 'Alar Ligament Stress Test', en: 'Alar Ligament Stress Test' },
        criteria: [
          {
            id: 'right_increased',
            label: {
              no: 'Høyre: Økt bevegelse (>45°), ingen motstand',
              en: 'Right: Increased movement (>45°), no resistance',
            },
          },
          {
            id: 'left_increased',
            label: {
              no: 'Venstre: Økt bevegelse, ingen motstand',
              en: 'Left: Increased movement, no resistance',
            },
          },
          { id: 'bilateral_laxity', label: { no: 'Bilateral laksitet', en: 'Bilateral laxity' } },
        ],
        interpretation: { no: 'Alar ligament insuffisiens', en: 'Alar ligament insufficiency' },
        redFlag: true,
      },
      {
        id: 'transverse_ligament',
        name: { no: 'Transverse Ligament Test', en: 'Transverse Ligament Test' },
        criteria: [
          {
            id: 'unstable_feeling',
            label: {
              no: 'Pasient rapporterer "hodet føles ustabilt"',
              en: 'Patient reports "head feels unstable"',
            },
          },
          {
            id: 'neuro_symptoms_shear',
            label: {
              no: 'Neurologiske symptomer ved anterior shear',
              en: 'Neurological symptoms with anterior shear',
            },
          },
          {
            id: 'provokes_dizziness',
            label: { no: 'Provoserer svimmelhet/nystagmus', en: 'Provokes dizziness/nystagmus' },
          },
        ],
        interpretation: {
          no: 'Transvers ligament insuffisiens',
          en: 'Transverse ligament insufficiency',
        },
        redFlag: true,
      },
      {
        id: 'membrana_tectoria',
        name: { no: 'Membrana Tectoria Test', en: 'Membrana Tectoria Test' },
        criteria: [
          {
            id: 'positive_flexion_axial',
            label: {
              no: 'Positiv ved cervikal fleksjon + aksial belastning',
              en: 'Positive with cervical flexion + axial loading',
            },
          },
          {
            id: 'neuro_symptoms',
            label: { no: 'Neurologiske symptomer', en: 'Neurological symptoms' },
          },
        ],
        redFlag: true,
      },
      {
        id: 'flexion_rotation_instability',
        name: {
          no: 'Cervical Flexion-Rotation Test (Instabilitet)',
          en: 'Cervical Flexion-Rotation Test (Instability)',
        },
        criteria: [
          {
            id: 'rotation_32',
            label: {
              no: '<32° rotasjon bilateral i full fleksjon',
              en: '<32° rotation bilateral in full flexion',
            },
          },
          {
            id: 'empty_end_feel',
            label: {
              no: '"Empty end-feel" (ikke firm capsular)',
              en: '"Empty end-feel" (not firm capsular)',
            },
          },
          {
            id: 'apprehension',
            label: { no: 'Apprehension ved testing', en: 'Apprehension during testing' },
          },
        ],
      },
      {
        id: 'self_testing',
        name: { no: 'Selftesting', en: 'Self-Testing' },
        criteria: [
          {
            id: 'holds_head',
            label: {
              no: 'Pasient holder hode med hender ved gange',
              en: 'Patient holds head with hands while walking',
            },
          },
          {
            id: 'subjective_instability',
            label: { no: 'Subjektiv ustabilitetsfølelse', en: 'Subjective instability feeling' },
          },
          {
            id: 'fear_movement',
            label: { no: 'Frykt for hodebevegelse', en: 'Fear of head movement' },
          },
        ],
      },
      {
        id: 'neurological_signs',
        name: { no: 'Neurologiske Tegn', en: 'Neurological Signs' },
        criteria: [
          {
            id: 'umn_signs',
            label: {
              no: 'Upper motor neuron signs (hyperrefleksi)',
              en: 'Upper motor neuron signs (hyperreflexia)',
            },
          },
          {
            id: 'lhermitte',
            label: { no: "Lhermitte's sign positiv", en: "Lhermitte's sign positive" },
          },
          {
            id: 'hoffmann',
            label: { no: "Hoffmann's sign positiv", en: "Hoffmann's sign positive" },
          },
          { id: 'babinski', label: { no: 'Babinski positiv', en: 'Babinski positive' } },
        ],
        redFlag: true,
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // CLUSTER 7: MYELOPATHY (CERVICAL SPINAL CORD COMPRESSION)
  // ---------------------------------------------------------------------------
  MYELOPATHY: {
    id: 'MYELOPATHY',
    name: {
      no: 'Myelopati (Cervical Ryggmargskompresjon)',
      en: 'Myelopathy (Cervical Spinal Cord Compression)',
    },
    description: {
      no: 'KRITISK: Screener for cervical myelopati. Ved positive funn - STOPP behandling, akutt henvisning!',
      en: 'CRITICAL: Screens for cervical myelopathy. If positive findings - STOP treatment, urgent referral!',
    },
    diagnosticCriteria: {
      threshold: 3,
      total: 6,
      interpretation: {
        high: {
          min: 3,
          label: {
            no: 'Høy mistanke om myelopati - AKUTT HENVISNING',
            en: 'High suspicion myelopathy - URGENT REFERRAL',
          },
        },
        low: { min: 0, max: 2, label: { no: 'Lav mistanke', en: 'Low suspicion' } },
      },
    },
    criticalAction: {
      no: 'STOPP kiropraktisk behandling. Akutt henvisning nevrolog/ortoped. MR cervical med høy prioritet.',
      en: 'STOP chiropractic treatment. Urgent referral neurologist/orthopedist. MRI cervical high priority.',
    },
    differentialDiagnosis: [
      {
        no: 'Cervical spondylotic myelopathy (degenerativ)',
        en: 'Cervical spondylotic myelopathy (degenerative)',
      },
      {
        no: 'OPLL (ossification posterior longitudinal ligament)',
        en: 'OPLL (ossification posterior longitudinal ligament)',
      },
      { no: 'Rheumatoid myelopati', en: 'Rheumatoid myelopathy' },
      { no: 'Tumor (intradural/extradural)', en: 'Tumor (intradural/extradural)' },
      { no: 'Multipel sklerose', en: 'Multiple sclerosis' },
    ],
    isRedFlagCluster: true,
    tests: [
      {
        id: 'hoffmann_sign',
        name: { no: "Hoffmann's Sign", en: "Hoffmann's Sign" },
        criteria: [
          {
            id: 'positive_right',
            label: {
              no: 'Positiv høyre (fleksjon tommel/pekefinger ved "flicking" langfinger)',
              en: 'Positive right (thumb/index flexion on "flicking" middle finger)',
            },
          },
          { id: 'positive_left', label: { no: 'Positiv venstre', en: 'Positive left' } },
          { id: 'bilateral', label: { no: 'Bilateral positiv', en: 'Bilateral positive' } },
        ],
        interpretation: {
          no: 'Kortikal disinhibisjon, øvre motorneuron lesjon',
          en: 'Cortical disinhibition, upper motor neuron lesion',
        },
        redFlag: true,
      },
      {
        id: 'hyperreflexia',
        name: { no: 'Hyperrefleksi', en: 'Hyperreflexia' },
        criteria: [
          {
            id: 'biceps_3plus',
            label: {
              no: 'Biceps reflex 3+ eller mer bilateral',
              en: 'Biceps reflex 3+ or more bilateral',
            },
          },
          {
            id: 'triceps_3plus',
            label: { no: 'Triceps reflex 3+ eller mer', en: 'Triceps reflex 3+ or more' },
          },
          {
            id: 'patella_3plus',
            label: { no: 'Patella reflex 3+ eller mer', en: 'Patella reflex 3+ or more' },
          },
          {
            id: 'achilles_3plus',
            label: { no: 'Achilles reflex 3+ eller mer', en: 'Achilles reflex 3+ or more' },
          },
          {
            id: 'clonus',
            label: { no: 'Klonus present (≥5 slag)', en: 'Clonus present (≥5 beats)' },
          },
        ],
        interpretation: { no: 'Øvre motorneuron lesjon', en: 'Upper motor neuron lesion' },
        redFlag: true,
      },
      {
        id: 'babinski_sign',
        name: { no: 'Babinski Sign (Plantarrefleks)', en: 'Babinski Sign (Plantar Reflex)' },
        criteria: [
          {
            id: 'extensor_right',
            label: {
              no: 'Ekstensor plantarrefleks høyre (stortå opp)',
              en: 'Extensor plantar reflex right (great toe up)',
            },
          },
          {
            id: 'extensor_left',
            label: { no: 'Ekstensor plantarrefleks venstre', en: 'Extensor plantar reflex left' },
          },
        ],
        interpretation: {
          no: 'Patologisk, øvre motorneuron',
          en: 'Pathological, upper motor neuron',
        },
        redFlag: true,
      },
      {
        id: 'lhermitte_sign',
        name: { no: "Lhermitte's Sign", en: "Lhermitte's Sign" },
        criteria: [
          {
            id: 'electric_spine',
            label: {
              no: '"Elektrisk" følelse ned ryggen ved nakke fleksjon',
              en: '"Electric" feeling down spine with neck flexion',
            },
          },
          {
            id: 'to_extremities',
            label: { no: 'Følelse til ekstremiteter', en: 'Feeling to extremities' },
          },
        ],
        interpretation: {
          no: 'Ryggmargskompresjon eller demyelinisering',
          en: 'Spinal cord compression or demyelination',
        },
        redFlag: true,
      },
      {
        id: 'gait_coordination',
        name: { no: 'Gange og Koordinasjon', en: 'Gait and Coordination' },
        criteria: [
          {
            id: 'ataxic_gait',
            label: { no: 'Ataktisk gange (bred base)', en: 'Ataxic gait (broad base)' },
          },
          {
            id: 'spastic_gait',
            label: { no: 'Spastisk gange (circumduction)', en: 'Spastic gait (circumduction)' },
          },
          {
            id: 'foot_slap',
            label: {
              no: 'Fotsmell (ikke i stand til heel strike)',
              en: 'Foot slap (unable to heel strike)',
            },
          },
          { id: 'cant_tandem', label: { no: 'Kan ikke gå tandem', en: 'Cannot walk tandem' } },
          { id: 'balance_loss', label: { no: 'Tap av balanse', en: 'Loss of balance' } },
        ],
        interpretation: { no: 'Myelopatisk gange', en: 'Myelopathic gait' },
        redFlag: true,
      },
      {
        id: 'hand_function',
        name: { no: 'Hånd Funksjontest', en: 'Hand Function Test' },
        criteria: [
          {
            id: 'cant_button',
            label: { no: 'Kan ikke kneppe knapper', en: 'Cannot button buttons' },
          },
          {
            id: 'grip_release',
            label: {
              no: '10-second grip-and-release test: <20 repetisjoner',
              en: '10-second grip-and-release test: <20 repetitions',
            },
          },
          {
            id: 'dropping_things',
            label: { no: 'Drop ting fra hender', en: 'Dropping things from hands' },
          },
          {
            id: 'intrinsic_weakness',
            label: {
              no: 'Svakhet intrinsic håndmuskler bilateral',
              en: 'Weakness intrinsic hand muscles bilateral',
            },
          },
        ],
        interpretation: {
          no: 'Myelopati med upper extremity involvement',
          en: 'Myelopathy with upper extremity involvement',
        },
        redFlag: true,
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // CLUSTER 8: VNG/OCULOMOTOR (Detailed)
  // ---------------------------------------------------------------------------
  VNG_OCULOMOTOR: {
    id: 'VNG_OCULOMOTOR',
    name: { no: 'VNG/Okulomotorisk Undersøkelse', en: 'VNG/Oculomotor Examination' },
    description: {
      no: 'Komplett okulomotorisk testing for vestibulær og cerebellær vurdering',
      en: 'Complete oculomotor testing for vestibular and cerebellar assessment',
    },
    tests: [
      {
        id: 'spontaneous_nystagmus_vng',
        name: { no: 'Spontan Nystagmus', en: 'Spontaneous Nystagmus' },
        subtitle: { no: 'Øyne åpne, fikseringsblokk', en: 'Eyes open, fixation block' },
        criteria: [
          {
            id: 'none',
            label: { no: 'Ingen nystagmus (<4°/s)', en: 'No nystagmus (<4°/s)' },
            exclusive: true,
          },
          {
            id: 'right_beating',
            label: { no: 'Høyre-rettet nystagmus', en: 'Right-beating nystagmus' },
          },
          {
            id: 'left_beating',
            label: { no: 'Venstre-rettet nystagmus', en: 'Left-beating nystagmus' },
          },
          { id: 'vertical', label: { no: 'Vertikal nystagmus', en: 'Vertical nystagmus' } },
          { id: 'pendular', label: { no: 'Pendulær nystagmus', en: 'Pendular nystagmus' } },
        ],
      },
      {
        id: 'gaze_horizontal',
        name: { no: 'Gaze Testing - Horisontal', en: 'Gaze Testing - Horizontal' },
        subtitle: { no: '20-30° eksentrisitet', en: '20-30° eccentricity' },
        criteria: [
          {
            id: 'none',
            label: { no: 'Ingen gaze-evoked nystagmus', en: 'No gaze-evoked nystagmus' },
            exclusive: true,
          },
          {
            id: 'right',
            label: { no: 'Høyre gaze-evoked nystagmus', en: 'Right gaze-evoked nystagmus' },
          },
          {
            id: 'left',
            label: { no: 'Venstre gaze-evoked nystagmus', en: 'Left gaze-evoked nystagmus' },
          },
          {
            id: 'bilateral',
            label: { no: 'Bilateral gaze-evoked nystagmus', en: 'Bilateral gaze-evoked nystagmus' },
          },
        ],
      },
      {
        id: 'gaze_vertical',
        name: { no: 'Gaze Testing - Vertikal', en: 'Gaze Testing - Vertical' },
        criteria: [
          {
            id: 'none',
            label: { no: 'Ingen vertikal gaze nystagmus', en: 'No vertical gaze nystagmus' },
            exclusive: true,
          },
          { id: 'upbeat', label: { no: 'Upbeat nystagmus', en: 'Upbeat nystagmus' } },
          { id: 'downbeat', label: { no: 'Downbeat nystagmus', en: 'Downbeat nystagmus' } },
        ],
      },
      {
        id: 'saccades_horizontal',
        name: { no: 'Sakkader - Horisontal', en: 'Saccades - Horizontal' },
        criteria: [
          {
            id: 'normal',
            label: { no: 'Normal (gain 0.9-1.0)', en: 'Normal (gain 0.9-1.0)' },
            exclusive: true,
          },
          {
            id: 'overshoots_bilateral',
            label: { no: 'Overshoots bilateral', en: 'Overshoots bilateral' },
          },
          { id: 'overshoots_right', label: { no: 'Overshoots høyre', en: 'Overshoots right' } },
          { id: 'overshoots_left', label: { no: 'Overshoots venstre', en: 'Overshoots left' } },
          {
            id: 'catchup_bilateral',
            label: { no: 'Catch-up sakkader bilateral', en: 'Catch-up saccades bilateral' },
          },
          {
            id: 'catchup_right',
            label: { no: 'Catch-up sakkader høyre', en: 'Catch-up saccades right' },
          },
          {
            id: 'catchup_left',
            label: { no: 'Catch-up sakkader venstre', en: 'Catch-up saccades left' },
          },
          {
            id: 'prolonged_latency',
            label: { no: 'Forlenget latency (>260ms)', en: 'Prolonged latency (>260ms)' },
          },
        ],
      },
      {
        id: 'saccades_vertical',
        name: { no: 'Sakkader - Vertikal', en: 'Saccades - Vertical' },
        criteria: [
          {
            id: 'normal',
            label: { no: 'Normal (gain 0.9-1.0)', en: 'Normal (gain 0.9-1.0)' },
            exclusive: true,
          },
          { id: 'overshoots_up', label: { no: 'Overshoots oppover', en: 'Overshoots upward' } },
          { id: 'overshoots_down', label: { no: 'Overshoots nedover', en: 'Overshoots downward' } },
          { id: 'catchup_up', label: { no: 'Catch-up sakkader opp', en: 'Catch-up saccades up' } },
          {
            id: 'catchup_down',
            label: { no: 'Catch-up sakkader ned', en: 'Catch-up saccades down' },
          },
        ],
      },
      {
        id: 'smooth_pursuit_horizontal',
        name: { no: 'Smooth Pursuit - Horisontal', en: 'Smooth Pursuit - Horizontal' },
        criteria: [
          {
            id: 'normal',
            label: {
              no: 'Normal smooth pursuit (gain 0.9-1.0)',
              en: 'Normal smooth pursuit (gain 0.9-1.0)',
            },
            exclusive: true,
          },
          {
            id: 'catchup_right',
            label: { no: 'Catch-up sakkader høyre', en: 'Catch-up saccades right' },
          },
          {
            id: 'catchup_left',
            label: { no: 'Catch-up sakkader venstre', en: 'Catch-up saccades left' },
          },
          {
            id: 'saccadic_bilateral',
            label: { no: 'Saccadic pursuit bilateral', en: 'Saccadic pursuit bilateral' },
          },
        ],
      },
      {
        id: 'smooth_pursuit_vertical',
        name: { no: 'Smooth Pursuit - Vertikal', en: 'Smooth Pursuit - Vertical' },
        criteria: [
          {
            id: 'normal',
            label: { no: 'Normal smooth pursuit', en: 'Normal smooth pursuit' },
            exclusive: true,
          },
          {
            id: 'catchup_up',
            label: { no: 'Catch-up sakkader oppover', en: 'Catch-up saccades upward' },
          },
          {
            id: 'catchup_down',
            label: { no: 'Catch-up sakkader nedover', en: 'Catch-up saccades downward' },
          },
        ],
      },
      {
        id: 'opk',
        name: { no: 'Optokinetisk Nystagmus (OPK)', en: 'Optokinetic Nystagmus (OKN)' },
        criteria: [
          {
            id: 'normal_horizontal',
            label: { no: 'Normal OPK horisontal', en: 'Normal OKN horizontal' },
          },
          { id: 'asymmetric', label: { no: 'Asymmetrisk OPK', en: 'Asymmetric OKN' } },
          {
            id: 'normal_vertical',
            label: { no: 'Normal OPK vertikal', en: 'Normal OKN vertical' },
          },
          {
            id: 'provokes_dizziness',
            label: {
              no: 'Provoserer svimmelhet/ustabilitet',
              en: 'Provokes dizziness/instability',
            },
          },
        ],
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // CLUSTER 9: ACTIVATOR METHOD / DYNAMIC POSITIONAL
  // ---------------------------------------------------------------------------
  ACTIVATOR: {
    id: 'ACTIVATOR',
    name: {
      no: 'Aktivator Metode / Dynamisk Posisjonell',
      en: 'Activator Method / Dynamic Positional',
    },
    description: {
      no: 'Benlengdeanalyse og dynamiske posisjonelle tester',
      en: 'Leg length analysis and dynamic positional tests',
    },
    tests: [
      {
        id: 'leg_length_static',
        name: { no: 'Benlengde Analyse - Statisk', en: 'Leg Length Analysis - Static' },
        subtitle: { no: 'Mageliggende', en: 'Prone' },
        criteria: [
          { id: 'equal', label: { no: 'Lik benlengde', en: 'Equal leg length' }, exclusive: true },
          { id: 'right_short', label: { no: 'Høyre kort', en: 'Right short' } },
          { id: 'left_short', label: { no: 'Venstre kort', en: 'Left short' } },
        ],
        valueInput: { label: { no: 'Differanse (mm)', en: 'Difference (mm)' }, type: 'number' },
      },
      {
        id: 'leg_length_head_lift',
        name: { no: 'Dynamisk Benlengde - Hodeløft', en: 'Dynamic Leg Length - Head Lift' },
        criteria: [
          { id: 'no_change', label: { no: 'Ingen endring', en: 'No change' }, exclusive: true },
          { id: 'right_shortens', label: { no: 'Høyre forkortes', en: 'Right shortens' } },
          { id: 'left_shortens', label: { no: 'Venstre forkortes', en: 'Left shortens' } },
          { id: 'right_lengthens', label: { no: 'Høyre forlenges', en: 'Right lengthens' } },
          { id: 'left_lengthens', label: { no: 'Venstre forlenges', en: 'Left lengthens' } },
        ],
      },
      {
        id: 'leg_length_head_rotation_right',
        name: {
          no: 'Dynamisk Benlengde - Hoderotasjon Høyre',
          en: 'Dynamic Leg Length - Head Rotation Right',
        },
        criteria: [
          { id: 'no_change', label: { no: 'Ingen endring', en: 'No change' }, exclusive: true },
          { id: 'right_shortens', label: { no: 'Høyre forkortes', en: 'Right shortens' } },
          { id: 'left_shortens', label: { no: 'Venstre forkortes', en: 'Left shortens' } },
        ],
      },
      {
        id: 'leg_length_head_rotation_left',
        name: {
          no: 'Dynamisk Benlengde - Hoderotasjon Venstre',
          en: 'Dynamic Leg Length - Head Rotation Left',
        },
        criteria: [
          { id: 'no_change', label: { no: 'Ingen endring', en: 'No change' }, exclusive: true },
          { id: 'right_shortens', label: { no: 'Høyre forkortes', en: 'Right shortens' } },
          { id: 'left_shortens', label: { no: 'Venstre forkortes', en: 'Left shortens' } },
        ],
      },
      {
        id: 'segmental_palpation',
        name: { no: 'Segmental Palpasjon', en: 'Segmental Palpation' },
        criteria: [
          { id: 'c0_c1', label: { no: 'C0-C1: Restriksjon', en: 'C0-C1: Restriction' } },
          { id: 'c1_c2', label: { no: 'C1-C2: Restriksjon', en: 'C1-C2: Restriction' } },
          { id: 'c2_c3', label: { no: 'C2-C3: Restriksjon', en: 'C2-C3: Restriction' } },
          { id: 'c3_c4', label: { no: 'C3-C4: Restriksjon', en: 'C3-C4: Restriction' } },
          { id: 'c4_c5', label: { no: 'C4-C5: Restriksjon', en: 'C4-C5: Restriction' } },
          { id: 'c5_c6', label: { no: 'C5-C6: Restriksjon', en: 'C5-C6: Restriction' } },
          { id: 'c6_c7', label: { no: 'C6-C7: Restriksjon', en: 'C6-C7: Restriction' } },
          { id: 'c7_t1', label: { no: 'C7-T1: Restriksjon', en: 'C7-T1: Restriction' } },
        ],
      },
    ],
  },
};

// =============================================================================
// SCORING FUNCTIONS
// =============================================================================

/**
 * Calculate cluster score from test results
 */
export function calculateClusterScore(clusterId, testResults) {
  const cluster = EXAM_CLUSTERS[clusterId];
  if (!cluster || !cluster.diagnosticCriteria) {
    return { score: 0, total: 0, interpretation: null };
  }

  let positiveTests = 0;
  const total = cluster.diagnosticCriteria.total;

  cluster.tests.forEach((test) => {
    const testResult = testResults[test.id];
    if (testResult && isTestPositive(test, testResult)) {
      positiveTests++;
    }
  });

  const interpretation = getInterpretation(
    cluster.diagnosticCriteria.interpretation,
    positiveTests
  );

  return {
    score: positiveTests,
    total,
    threshold: cluster.diagnosticCriteria.threshold,
    interpretation,
    meetsThreshold: positiveTests >= cluster.diagnosticCriteria.threshold,
    sensitivity: cluster.diagnosticCriteria.sensitivity,
    specificity: cluster.diagnosticCriteria.specificity,
  };
}

/**
 * Determine if a test is positive based on criteria
 */
function isTestPositive(test, testResult) {
  if (!testResult || !testResult.criteria) {
    return false;
  }

  // If any non-exclusive criterion is checked, test is positive
  const checkedCriteria = Object.keys(testResult.criteria).filter((k) => testResult.criteria[k]);

  // Check if only exclusive negative options are selected
  const hasNonExclusivePositive = checkedCriteria.some((criterionId) => {
    const criterion = test.criteria.find((c) => c.id === criterionId);
    return criterion && !criterion.exclusive;
  });

  return hasNonExclusivePositive;
}

/**
 * Get interpretation based on score
 */
function getInterpretation(interpretations, score) {
  for (const [level, config] of Object.entries(interpretations)) {
    if (config.min !== undefined && config.max !== undefined) {
      if (score >= config.min && score <= config.max) {
        return { level, ...config };
      }
    } else if (config.min !== undefined && score >= config.min) {
      return { level, ...config };
    }
  }
  return null;
}

/**
 * Check for red flags in test results
 */
export function checkRedFlags(testResults) {
  const redFlags = [];

  Object.entries(EXAM_CLUSTERS).forEach(([clusterId, cluster]) => {
    // Check cluster-level red flags
    if (cluster.redFlags) {
      cluster.redFlags.items.forEach((flag) => {
        const flagResult = testResults[`${clusterId}_redFlag_${flag.id}`];
        if (flagResult) {
          redFlags.push({
            clusterId,
            clusterName: cluster.name,
            flag: flag.label,
            action: cluster.criticalAction || cluster.referralAction,
          });
        }
      });
    }

    // Check test-level red flags
    if (cluster.tests) {
      cluster.tests.forEach((test) => {
        if (test.redFlag) {
          const testResult = testResults[test.id];
          if (testResult && isTestPositive(test, testResult)) {
            redFlags.push({
              clusterId,
              clusterName: cluster.name,
              testId: test.id,
              testName: test.name,
              interpretation: test.interpretation,
              action: cluster.criticalAction || cluster.referralAction,
            });
          }
        }
      });
    }
  });

  return redFlags;
}

/**
 * Generate clinical narrative from test results
 */
export function generateNarrative(testResults, lang = 'no') {
  const narratives = [];

  Object.entries(EXAM_CLUSTERS).forEach(([clusterId, cluster]) => {
    const clusterResults = [];

    cluster.tests?.forEach((test) => {
      const testResult = testResults[test.id];
      if (testResult && testResult.criteria) {
        const positiveFindings = [];

        Object.entries(testResult.criteria).forEach(([criterionId, isChecked]) => {
          if (isChecked) {
            const criterion = test.criteria.find((c) => c.id === criterionId);
            if (criterion && !criterion.exclusive) {
              positiveFindings.push(criterion.label[lang]);
            }
          }
        });

        if (positiveFindings.length > 0) {
          clusterResults.push({
            testName: test.name[lang],
            findings: positiveFindings,
            interpretation: test.interpretation?.[lang],
          });
        }
      }
    });

    if (clusterResults.length > 0) {
      const score = calculateClusterScore(clusterId, testResults);
      narratives.push({
        clusterName: cluster.name[lang],
        score: `${score.score}/${score.total}`,
        interpretation: score.interpretation?.label?.[lang],
        tests: clusterResults,
      });
    }
  });

  return narratives;
}

/**
 * Format narrative for clinical documentation
 */
export function formatNarrativeForSOAP(narratives, _lang = 'no') {
  if (narratives.length === 0) {
    return '';
  }

  const lines = [];

  narratives.forEach((cluster) => {
    lines.push(`\n**${cluster.clusterName}** (Score: ${cluster.score})`);
    if (cluster.interpretation) {
      lines.push(`Tolkning: ${cluster.interpretation}`);
    }

    cluster.tests.forEach((test) => {
      lines.push(`- ${test.testName}: ${test.findings.join(', ')}`);
      if (test.interpretation) {
        lines.push(`  → ${test.interpretation}`);
      }
    });
  });

  return lines.join('\n');
}

// =============================================================================
// BPPV DIAGNOSIS HELPER
// =============================================================================

/**
 * Determine BPPV type and affected side from test results
 */
export function diagnoseBPPV(testResults) {
  const results = {
    type: null,
    affectedSide: null,
    confidence: 'low',
    treatment: null,
  };

  // Check Dix-Hallpike for posterior canal
  const dhRight = testResults['dix_hallpike_right'];
  const dhLeft = testResults['dix_hallpike_left'];

  if (dhRight?.criteria?.geotropic_torsional) {
    results.type = 'posterior';
    results.affectedSide = 'right';
    results.confidence = 'high';
    results.treatment = EXAM_CLUSTERS.BPPV.subClusters.posterior.treatment;
  } else if (dhLeft?.criteria?.geotropic_torsional) {
    results.type = 'posterior';
    results.affectedSide = 'left';
    results.confidence = 'high';
    results.treatment = EXAM_CLUSTERS.BPPV.subClusters.posterior.treatment;
  }

  // Check Supine Roll for lateral canal
  const srRight = testResults['supine_roll_right'];
  const srLeft = testResults['supine_roll_left'];

  if (srRight?.criteria?.geotropic_horizontal || srLeft?.criteria?.geotropic_horizontal) {
    results.type = 'lateral_geotropic';
    // Affected side is the one with stronger nystagmus (undermost ear)
    if (srRight?.criteria?.stronger_than_opposite) {
      results.affectedSide = 'right';
    } else if (srLeft?.criteria?.stronger_than_opposite) {
      results.affectedSide = 'left';
    }
    results.confidence = 'high';
    results.treatment = EXAM_CLUSTERS.BPPV.subClusters.lateral_geotropic.treatment;
  } else if (srRight?.criteria?.ageotropic_horizontal || srLeft?.criteria?.ageotropic_horizontal) {
    results.type = 'lateral_ageotropic';
    // Affected side is OPPOSITE of stronger nystagmus (uppermost ear)
    if (srRight?.criteria?.stronger_than_opposite) {
      results.affectedSide = 'left'; // opposite
    } else if (srLeft?.criteria?.stronger_than_opposite) {
      results.affectedSide = 'right'; // opposite
    }
    results.confidence = 'moderate';
    results.treatment = EXAM_CLUSTERS.BPPV.subClusters.lateral_ageotropic.treatment;
  }

  // Check Deep Head Hanging for anterior canal
  const dhh = testResults['deep_head_hanging'];
  if (dhh?.criteria?.downbeating) {
    results.type = 'anterior';
    results.confidence = 'moderate';
    results.treatment = EXAM_CLUSTERS.BPPV.subClusters.anterior.treatment;
  }

  return results;
}

export default EXAM_CLUSTERS;
