/**
 * MuscleMap Component
 * Interactive detailed muscle map for chiropractic assessment
 * Shows anterior and posterior muscle groups with click-to-select
 */

import _React, { useState, useCallback, useMemo } from 'react';
import { RotateCcw, Eye, EyeOff } from 'lucide-react';

// Muscle definitions with Norwegian labels and clinical relevance
const MUSCLE_GROUPS = {
  anterior: {
    // Head and Neck
    sternocleidomastoid_r: {
      id: 'sternocleidomastoid_r',
      label: 'Sternocleidomastoid H',
      labelEn: 'SCM Right',
      group: 'neck',
      path: 'M168,95 Q175,105 178,130 L172,132 Q170,110 165,100 Z',
      innervation: 'CN XI, C2-C3',
      actions: ['Nakkerotasjon', 'Lateralfleksjon', 'Nakkefleksjon'],
      commonIssues: ['Trigger points', 'Torticollis', 'Hodepine'],
    },
    sternocleidomastoid_l: {
      id: 'sternocleidomastoid_l',
      label: 'Sternocleidomastoid V',
      labelEn: 'SCM Left',
      group: 'neck',
      path: 'M132,95 Q125,105 122,130 L128,132 Q130,110 135,100 Z',
      innervation: 'CN XI, C2-C3',
      actions: ['Nakkerotasjon', 'Lateralfleksjon', 'Nakkefleksjon'],
      commonIssues: ['Trigger points', 'Torticollis', 'Hodepine'],
    },
    scalenes_r: {
      id: 'scalenes_r',
      label: 'Scalener H',
      labelEn: 'Scalenes Right',
      group: 'neck',
      path: 'M165,108 L178,135 L175,140 L162,115 Z',
      innervation: 'C3-C8',
      actions: ['Nakkefleksjon', 'Lateralfleksjon', 'Respirasjonshjelp'],
      commonIssues: ['TOS', 'Nakke stivhet', 'Radikulopati'],
    },
    scalenes_l: {
      id: 'scalenes_l',
      label: 'Scalener V',
      labelEn: 'Scalenes Left',
      group: 'neck',
      path: 'M135,108 L122,135 L125,140 L138,115 Z',
      innervation: 'C3-C8',
      actions: ['Nakkefleksjon', 'Lateralfleksjon', 'Respirasjonshjelp'],
      commonIssues: ['TOS', 'Nakke stivhet', 'Radikulopati'],
    },

    // Shoulders
    deltoid_anterior_r: {
      id: 'deltoid_anterior_r',
      label: 'Deltoid anterior H',
      labelEn: 'Anterior Deltoid Right',
      group: 'shoulder',
      path: 'M178,140 Q205,145 215,175 L195,185 Q188,160 175,150 Z',
      innervation: 'Axillary nerve (C5-C6)',
      actions: ['Skulderfleksjon', 'Horisontal adduksjon', 'Innadrotasjon'],
      commonIssues: ['Strain', 'Tendinopati', 'Impingement'],
    },
    deltoid_anterior_l: {
      id: 'deltoid_anterior_l',
      label: 'Deltoid anterior V',
      labelEn: 'Anterior Deltoid Left',
      group: 'shoulder',
      path: 'M122,140 Q95,145 85,175 L105,185 Q112,160 125,150 Z',
      innervation: 'Axillary nerve (C5-C6)',
      actions: ['Skulderfleksjon', 'Horisontal adduksjon', 'Innadrotasjon'],
      commonIssues: ['Strain', 'Tendinopati', 'Impingement'],
    },

    // Chest
    pectoralis_major_r: {
      id: 'pectoralis_major_r',
      label: 'Pectoralis major H',
      labelEn: 'Pec Major Right',
      group: 'chest',
      path: 'M150,145 L175,145 Q195,175 195,205 L175,215 Q160,200 150,180 Z',
      innervation: 'Medial/Lateral pectoral (C5-T1)',
      actions: ['Skulder adduksjon', 'Innadrotasjon', 'Fleksjon'],
      commonIssues: ['Strain', 'Kort muskel', 'Trigger points'],
    },
    pectoralis_major_l: {
      id: 'pectoralis_major_l',
      label: 'Pectoralis major V',
      labelEn: 'Pec Major Left',
      group: 'chest',
      path: 'M150,145 L125,145 Q105,175 105,205 L125,215 Q140,200 150,180 Z',
      innervation: 'Medial/Lateral pectoral (C5-T1)',
      actions: ['Skulder adduksjon', 'Innadrotasjon', 'Fleksjon'],
      commonIssues: ['Strain', 'Kort muskel', 'Trigger points'],
    },

    // Abdomen
    rectus_abdominis: {
      id: 'rectus_abdominis',
      label: 'Rectus abdominis',
      labelEn: 'Rectus Abdominis',
      group: 'core',
      path: 'M140,220 L160,220 L162,340 L138,340 Z',
      innervation: 'T7-T12',
      actions: ['Trunkfleksjon', 'Bekkentilt posterior', 'Kjernesstabilitet'],
      commonIssues: ['Svak kjerne', 'Diastase', 'Strain'],
    },
    external_oblique_r: {
      id: 'external_oblique_r',
      label: 'Obliquus externus H',
      labelEn: 'External Oblique Right',
      group: 'core',
      path: 'M162,230 L190,250 L185,320 L162,340 Z',
      innervation: 'T7-T12',
      actions: ['Rotasjon', 'Lateralfleksjon', 'Fleksjon'],
      commonIssues: ['Strain', 'Ubalanse', 'SI-dysfunksjon'],
    },
    external_oblique_l: {
      id: 'external_oblique_l',
      label: 'Obliquus externus V',
      labelEn: 'External Oblique Left',
      group: 'core',
      path: 'M138,230 L110,250 L115,320 L138,340 Z',
      innervation: 'T7-T12',
      actions: ['Rotasjon', 'Lateralfleksjon', 'Fleksjon'],
      commonIssues: ['Strain', 'Ubalanse', 'SI-dysfunksjon'],
    },

    // Hip flexors
    iliopsoas_r: {
      id: 'iliopsoas_r',
      label: 'Iliopsoas H',
      labelEn: 'Iliopsoas Right',
      group: 'hip',
      path: 'M155,340 L175,350 L178,400 L158,410 Z',
      innervation: 'Femoral nerve (L1-L3)',
      actions: ['Hoftefleksjon', 'Utadrotasjon', 'Lumbal lordose'],
      commonIssues: ['Kort/stram', 'Trigger points', 'Korsryggsmerter'],
    },
    iliopsoas_l: {
      id: 'iliopsoas_l',
      label: 'Iliopsoas V',
      labelEn: 'Iliopsoas Left',
      group: 'hip',
      path: 'M145,340 L125,350 L122,400 L142,410 Z',
      innervation: 'Femoral nerve (L1-L3)',
      actions: ['Hoftefleksjon', 'Utadrotasjon', 'Lumbal lordose'],
      commonIssues: ['Kort/stram', 'Trigger points', 'Korsryggsmerter'],
    },

    // Thigh
    quadriceps_r: {
      id: 'quadriceps_r',
      label: 'Quadriceps H',
      labelEn: 'Quadriceps Right',
      group: 'thigh',
      path: 'M155,410 L185,415 L182,530 L158,530 Z',
      innervation: 'Femoral nerve (L2-L4)',
      actions: ['Kneekstensjon', 'Hoftefleksjon (RF)'],
      commonIssues: ['Patellofemoral syndrom', 'Tendinopati', 'Strain'],
    },
    quadriceps_l: {
      id: 'quadriceps_l',
      label: 'Quadriceps V',
      labelEn: 'Quadriceps Left',
      group: 'thigh',
      path: 'M145,410 L115,415 L118,530 L142,530 Z',
      innervation: 'Femoral nerve (L2-L4)',
      actions: ['Kneekstensjon', 'Hoftefleksjon (RF)'],
      commonIssues: ['Patellofemoral syndrom', 'Tendinopati', 'Strain'],
    },
    adductors_r: {
      id: 'adductors_r',
      label: 'Adduktorer H',
      labelEn: 'Adductors Right',
      group: 'thigh',
      path: 'M150,410 L155,410 L155,500 L150,500 Z',
      innervation: 'Obturator nerve (L2-L4)',
      actions: ['Hofteadduksjon', 'Hoftefleksjon', 'Rotasjon'],
      commonIssues: ['Strain', 'Lyskesmerte', 'SI-dysfunksjon'],
    },
    adductors_l: {
      id: 'adductors_l',
      label: 'Adduktorer V',
      labelEn: 'Adductors Left',
      group: 'thigh',
      path: 'M145,410 L150,410 L150,500 L145,500 Z',
      innervation: 'Obturator nerve (L2-L4)',
      actions: ['Hofteadduksjon', 'Hoftefleksjon', 'Rotasjon'],
      commonIssues: ['Strain', 'Lyskesmerte', 'SI-dysfunksjon'],
    },

    // Lower leg
    tibialis_anterior_r: {
      id: 'tibialis_anterior_r',
      label: 'Tibialis anterior H',
      labelEn: 'Tibialis Anterior Right',
      group: 'lower_leg',
      path: 'M162,550 L175,555 L172,650 L165,650 Z',
      innervation: 'Deep peroneal nerve (L4-L5)',
      actions: ['Ankeldorsifleksjon', 'Fotinversjon'],
      commonIssues: ['Shin splints', 'Kompartmentsyndrom', 'Droppfot'],
    },
    tibialis_anterior_l: {
      id: 'tibialis_anterior_l',
      label: 'Tibialis anterior V',
      labelEn: 'Tibialis Anterior Left',
      group: 'lower_leg',
      path: 'M138,550 L125,555 L128,650 L135,650 Z',
      innervation: 'Deep peroneal nerve (L4-L5)',
      actions: ['Ankeldorsifleksjon', 'Fotinversjon'],
      commonIssues: ['Shin splints', 'Kompartmentsyndrom', 'Droppfot'],
    },
  },

  posterior: {
    // Neck
    upper_trapezius_r: {
      id: 'upper_trapezius_r',
      label: 'Øvre trapezius H',
      labelEn: 'Upper Trapezius Right',
      group: 'neck',
      path: 'M150,100 L200,140 L175,160 L150,130 Z',
      innervation: 'CN XI, C3-C4',
      actions: ['Skulder elevasjon', 'Nakkeekstensjon', 'Lateralfleksjon'],
      commonIssues: ['Tension hodepine', 'Trigger points', 'Postural stress'],
    },
    upper_trapezius_l: {
      id: 'upper_trapezius_l',
      label: 'Øvre trapezius V',
      labelEn: 'Upper Trapezius Left',
      group: 'neck',
      path: 'M150,100 L100,140 L125,160 L150,130 Z',
      innervation: 'CN XI, C3-C4',
      actions: ['Skulder elevasjon', 'Nakkeekstensjon', 'Lateralfleksjon'],
      commonIssues: ['Tension hodepine', 'Trigger points', 'Postural stress'],
    },
    suboccipitals: {
      id: 'suboccipitals',
      label: 'Suboccipitaler',
      labelEn: 'Suboccipitals',
      group: 'neck',
      path: 'M135,85 L165,85 L168,100 L132,100 Z',
      innervation: 'C1 (Suboccipital nerve)',
      actions: ['Hodekstensjon', 'Rotasjon', 'Lateralfleksjon'],
      commonIssues: ['Cervikogen hodepine', 'Svimmelhet', 'Nakkestivhet'],
    },
    levator_scapulae_r: {
      id: 'levator_scapulae_r',
      label: 'Levator scapulae H',
      labelEn: 'Levator Scapulae Right',
      group: 'neck',
      path: 'M165,100 L185,120 L190,155 L175,165 L168,130 Z',
      innervation: 'C3-C5, Dorsal scapular',
      actions: ['Scapula elevasjon', 'Nedadrotasjon', 'Nakke lateralfleksjon'],
      commonIssues: ['Trigger points', 'Nakkesmerter', 'Stiv nakke'],
    },
    levator_scapulae_l: {
      id: 'levator_scapulae_l',
      label: 'Levator scapulae V',
      labelEn: 'Levator Scapulae Left',
      group: 'neck',
      path: 'M135,100 L115,120 L110,155 L125,165 L132,130 Z',
      innervation: 'C3-C5, Dorsal scapular',
      actions: ['Scapula elevasjon', 'Nedadrotasjon', 'Nakke lateralfleksjon'],
      commonIssues: ['Trigger points', 'Nakkesmerter', 'Stiv nakke'],
    },

    // Upper back
    rhomboids_r: {
      id: 'rhomboids_r',
      label: 'Rhomboidei H',
      labelEn: 'Rhomboids Right',
      group: 'upper_back',
      path: 'M150,140 L185,150 L190,200 L155,195 Z',
      innervation: 'Dorsal scapular nerve (C4-C5)',
      actions: ['Scapula retraksjon', 'Elevasjon', 'Nedadrotasjon'],
      commonIssues: ['Svak/inhibert', 'Mellomryggsmerter', 'Postural dysfunksjon'],
    },
    rhomboids_l: {
      id: 'rhomboids_l',
      label: 'Rhomboidei V',
      labelEn: 'Rhomboids Left',
      group: 'upper_back',
      path: 'M150,140 L115,150 L110,200 L145,195 Z',
      innervation: 'Dorsal scapular nerve (C4-C5)',
      actions: ['Scapula retraksjon', 'Elevasjon', 'Nedadrotasjon'],
      commonIssues: ['Svak/inhibert', 'Mellomryggsmerter', 'Postural dysfunksjon'],
    },
    middle_trapezius_r: {
      id: 'middle_trapezius_r',
      label: 'Midtre trapezius H',
      labelEn: 'Middle Trapezius Right',
      group: 'upper_back',
      path: 'M150,160 L190,165 L195,200 L150,195 Z',
      innervation: 'CN XI, C3-C4',
      actions: ['Scapula retraksjon'],
      commonIssues: ['Svak', 'Inhibert av pec minor', 'Skulder protrasjon'],
    },
    middle_trapezius_l: {
      id: 'middle_trapezius_l',
      label: 'Midtre trapezius V',
      labelEn: 'Middle Trapezius Left',
      group: 'upper_back',
      path: 'M150,160 L110,165 L105,200 L150,195 Z',
      innervation: 'CN XI, C3-C4',
      actions: ['Scapula retraksjon'],
      commonIssues: ['Svak', 'Inhibert av pec minor', 'Skulder protrasjon'],
    },
    lower_trapezius_r: {
      id: 'lower_trapezius_r',
      label: 'Nedre trapezius H',
      labelEn: 'Lower Trapezius Right',
      group: 'upper_back',
      path: 'M150,195 L195,200 L185,250 L150,260 Z',
      innervation: 'CN XI, C3-C4',
      actions: ['Scapula depresjon', 'Oppadrotasjon', 'Retraksjon'],
      commonIssues: ['Svak', 'Shoulder impingement', 'Scapular dyskinesi'],
    },
    lower_trapezius_l: {
      id: 'lower_trapezius_l',
      label: 'Nedre trapezius V',
      labelEn: 'Lower Trapezius Left',
      group: 'upper_back',
      path: 'M150,195 L105,200 L115,250 L150,260 Z',
      innervation: 'CN XI, C3-C4',
      actions: ['Scapula depresjon', 'Oppadrotasjon', 'Retraksjon'],
      commonIssues: ['Svak', 'Shoulder impingement', 'Scapular dyskinesi'],
    },

    // Paraspinals
    erector_spinae_r: {
      id: 'erector_spinae_r',
      label: 'Erector spinae H',
      labelEn: 'Erector Spinae Right',
      group: 'back',
      path: 'M155,130 L170,130 L172,380 L158,380 Z',
      innervation: 'Dorsal rami (all levels)',
      actions: ['Ryggekstensjon', 'Lateralfleksjon', 'Rotasjon'],
      commonIssues: ['Spasme', 'Trigger points', 'Overbruk', 'LBP'],
    },
    erector_spinae_l: {
      id: 'erector_spinae_l',
      label: 'Erector spinae V',
      labelEn: 'Erector Spinae Left',
      group: 'back',
      path: 'M145,130 L130,130 L128,380 L142,380 Z',
      innervation: 'Dorsal rami (all levels)',
      actions: ['Ryggekstensjon', 'Lateralfleksjon', 'Rotasjon'],
      commonIssues: ['Spasme', 'Trigger points', 'Overbruk', 'LBP'],
    },
    multifidus_r: {
      id: 'multifidus_r',
      label: 'Multifidus H',
      labelEn: 'Multifidus Right',
      group: 'back',
      path: 'M152,200 L158,200 L158,380 L152,380 Z',
      innervation: 'Dorsal rami (all levels)',
      actions: ['Segmentell stabilisering', 'Ekstensjon', 'Kontralateral rotasjon'],
      commonIssues: ['Atrofi ved LBP', 'Inhibert', 'Dårlig kontroll'],
    },
    multifidus_l: {
      id: 'multifidus_l',
      label: 'Multifidus V',
      labelEn: 'Multifidus Left',
      group: 'back',
      path: 'M148,200 L142,200 L142,380 L148,380 Z',
      innervation: 'Dorsal rami (all levels)',
      actions: ['Segmentell stabilisering', 'Ekstensjon', 'Kontralateral rotasjon'],
      commonIssues: ['Atrofi ved LBP', 'Inhibert', 'Dårlig kontroll'],
    },
    quadratus_lumborum_r: {
      id: 'quadratus_lumborum_r',
      label: 'Quadratus lumborum H',
      labelEn: 'QL Right',
      group: 'back',
      path: 'M170,300 L195,310 L192,380 L168,375 Z',
      innervation: 'T12-L4',
      actions: ['Lateralfleksjon', 'Bekkenevasjon', 'Lumbal ekstensjon'],
      commonIssues: ['Trigger points', 'LBP', 'SI-dysfunksjon', 'Pseudoiskias'],
    },
    quadratus_lumborum_l: {
      id: 'quadratus_lumborum_l',
      label: 'Quadratus lumborum V',
      labelEn: 'QL Left',
      group: 'back',
      path: 'M130,300 L105,310 L108,380 L132,375 Z',
      innervation: 'T12-L4',
      actions: ['Lateralfleksjon', 'Bekkenevasjon', 'Lumbal ekstensjon'],
      commonIssues: ['Trigger points', 'LBP', 'SI-dysfunksjon', 'Pseudoiskias'],
    },

    // Gluteals
    gluteus_maximus_r: {
      id: 'gluteus_maximus_r',
      label: 'Gluteus maximus H',
      labelEn: 'Glute Max Right',
      group: 'hip',
      path: 'M150,380 L195,390 L190,450 L155,445 Z',
      innervation: 'Inferior gluteal nerve (L5-S2)',
      actions: ['Hofteekstensjon', 'Utadrotasjon', 'Abduksjon'],
      commonIssues: ['Inhibert', 'Svak', 'Trigger points', 'SI-smerte'],
    },
    gluteus_maximus_l: {
      id: 'gluteus_maximus_l',
      label: 'Gluteus maximus V',
      labelEn: 'Glute Max Left',
      group: 'hip',
      path: 'M150,380 L105,390 L110,450 L145,445 Z',
      innervation: 'Inferior gluteal nerve (L5-S2)',
      actions: ['Hofteekstensjon', 'Utadrotasjon', 'Abduksjon'],
      commonIssues: ['Inhibert', 'Svak', 'Trigger points', 'SI-smerte'],
    },
    gluteus_medius_r: {
      id: 'gluteus_medius_r',
      label: 'Gluteus medius H',
      labelEn: 'Glute Med Right',
      group: 'hip',
      path: 'M170,360 L205,375 L200,400 L175,385 Z',
      innervation: 'Superior gluteal nerve (L4-S1)',
      actions: ['Hofteabduksjon', 'Bekken stabilisering', 'Rotasjon'],
      commonIssues: ['Trendelenburg', 'ITB syndrom', 'Løpeskader'],
    },
    gluteus_medius_l: {
      id: 'gluteus_medius_l',
      label: 'Gluteus medius V',
      labelEn: 'Glute Med Left',
      group: 'hip',
      path: 'M130,360 L95,375 L100,400 L125,385 Z',
      innervation: 'Superior gluteal nerve (L4-S1)',
      actions: ['Hofteabduksjon', 'Bekken stabilisering', 'Rotasjon'],
      commonIssues: ['Trendelenburg', 'ITB syndrom', 'Løpeskader'],
    },
    piriformis_r: {
      id: 'piriformis_r',
      label: 'Piriformis H',
      labelEn: 'Piriformis Right',
      group: 'hip',
      path: 'M155,395 L190,400 L188,415 L158,410 Z',
      innervation: 'S1-S2',
      actions: ['Utadrotasjon', 'Abduksjon (flektert)', 'Hofteekstensjon'],
      commonIssues: ['Piriformis syndrom', 'Pseudoiskias', 'SI-dysfunksjon'],
    },
    piriformis_l: {
      id: 'piriformis_l',
      label: 'Piriformis V',
      labelEn: 'Piriformis Left',
      group: 'hip',
      path: 'M145,395 L110,400 L112,415 L142,410 Z',
      innervation: 'S1-S2',
      actions: ['Utadrotasjon', 'Abduksjon (flektert)', 'Hofteekstensjon'],
      commonIssues: ['Piriformis syndrom', 'Pseudoiskias', 'SI-dysfunksjon'],
    },

    // Hamstrings
    hamstrings_r: {
      id: 'hamstrings_r',
      label: 'Hamstrings H',
      labelEn: 'Hamstrings Right',
      group: 'thigh',
      path: 'M155,450 L185,455 L180,530 L160,530 Z',
      innervation: 'Sciatic nerve (L5-S2)',
      actions: ['Knefleksjon', 'Hofteekstensjon'],
      commonIssues: ['Strain', 'Stramhet', 'Trigger points', 'Iskias'],
    },
    hamstrings_l: {
      id: 'hamstrings_l',
      label: 'Hamstrings V',
      labelEn: 'Hamstrings Left',
      group: 'thigh',
      path: 'M145,450 L115,455 L120,530 L140,530 Z',
      innervation: 'Sciatic nerve (L5-S2)',
      actions: ['Knefleksjon', 'Hofteekstensjon'],
      commonIssues: ['Strain', 'Stramhet', 'Trigger points', 'Iskias'],
    },

    // Calves
    gastrocnemius_r: {
      id: 'gastrocnemius_r',
      label: 'Gastrocnemius H',
      labelEn: 'Gastroc Right',
      group: 'lower_leg',
      path: 'M158,545 L180,550 L175,630 L162,625 Z',
      innervation: 'Tibial nerve (S1-S2)',
      actions: ['Ankelplantarfleksjon', 'Knefleksjon'],
      commonIssues: ['Strain', 'Krampe', 'Trigger points', 'Akillestendinopati'],
    },
    gastrocnemius_l: {
      id: 'gastrocnemius_l',
      label: 'Gastrocnemius V',
      labelEn: 'Gastroc Left',
      group: 'lower_leg',
      path: 'M142,545 L120,550 L125,630 L138,625 Z',
      innervation: 'Tibial nerve (S1-S2)',
      actions: ['Ankelplantarfleksjon', 'Knefleksjon'],
      commonIssues: ['Strain', 'Krampe', 'Trigger points', 'Akillestendinopati'],
    },
    soleus_r: {
      id: 'soleus_r',
      label: 'Soleus H',
      labelEn: 'Soleus Right',
      group: 'lower_leg',
      path: 'M162,580 L175,582 L172,650 L165,648 Z',
      innervation: 'Tibial nerve (S1-S2)',
      actions: ['Ankelplantarfleksjon'],
      commonIssues: ['Stramhet', 'Trigger points', 'Akillesproblemer'],
    },
    soleus_l: {
      id: 'soleus_l',
      label: 'Soleus V',
      labelEn: 'Soleus Left',
      group: 'lower_leg',
      path: 'M138,580 L125,582 L128,650 L135,648 Z',
      innervation: 'Tibial nerve (S1-S2)',
      actions: ['Ankelplantarfleksjon'],
      commonIssues: ['Stramhet', 'Trigger points', 'Akillesproblemer'],
    },
  },
};

// Muscle groups for filtering
const MUSCLE_GROUP_LABELS = {
  neck: { label: 'Nakke', color: '#3b82f6' },
  shoulder: { label: 'Skulder', color: '#8b5cf6' },
  chest: { label: 'Bryst', color: '#ec4899' },
  upper_back: { label: 'Øvre rygg', color: '#14b8a6' },
  back: { label: 'Rygg', color: '#22c55e' },
  core: { label: 'Kjerne', color: '#f97316' },
  hip: { label: 'Hofte/Bekken', color: '#ef4444' },
  thigh: { label: 'Lår', color: '#eab308' },
  lower_leg: { label: 'Legg', color: '#06b6d4' },
};

// Finding types
const FINDING_TYPES = [
  { id: 'trigger_point', label: 'Trigger point', abbrev: 'TP', color: '#ef4444' },
  { id: 'hypertonicity', label: 'Hypertonus', abbrev: 'HT', color: '#f97316' },
  { id: 'weakness', label: 'Svakhet', abbrev: 'SV', color: '#3b82f6' },
  { id: 'shortness', label: 'Forkortet', abbrev: 'FK', color: '#eab308' },
  { id: 'adhesion', label: 'Adhesjon', abbrev: 'AD', color: '#8b5cf6' },
  { id: 'treated', label: 'Behandlet', abbrev: '✓', color: '#22c55e' },
];

export default function MuscleMap({
  findings = {},
  onChange,
  readOnly = false,
  showDetails = true,
  compact = false,
  className = '',
}) {
  const [view, setView] = useState('posterior');
  const [selectedMuscle, setSelectedMuscle] = useState(null);
  const [selectedFindingType, setSelectedFindingType] = useState(FINDING_TYPES[0]);
  const [showLabels, setShowLabels] = useState(true);
  const [filterGroup, setFilterGroup] = useState(null);

  const muscles = MUSCLE_GROUPS[view] || {};
  const filteredMuscles = filterGroup
    ? Object.entries(muscles).filter(([_, m]) => m.group === filterGroup)
    : Object.entries(muscles);

  const addFinding = useCallback(
    (muscleId) => {
      if (readOnly) {
        return;
      }

      const key = `${muscleId}_${selectedFindingType.id}`;
      const newFindings = { ...findings };

      if (newFindings[key]) {
        delete newFindings[key];
      } else {
        newFindings[key] = {
          muscleId,
          muscle: muscles[muscleId],
          type: selectedFindingType.id,
          typeLabel: selectedFindingType.label,
          color: selectedFindingType.color,
          timestamp: new Date().toISOString(),
        };
      }

      onChange?.(newFindings);
    },
    [findings, selectedFindingType, muscles, onChange, readOnly]
  );

  const getMuscleFindings = useCallback(
    (muscleId) => {
      return Object.values(findings).filter((f) => f.muscleId === muscleId);
    },
    [findings]
  );

  const getMuscleColor = useCallback(
    (muscleId) => {
      const muscleFindings = getMuscleFindings(muscleId);
      if (muscleFindings.length === 0) {
        return null;
      }
      return muscleFindings[0].color;
    },
    [getMuscleFindings]
  );

  const clearAll = () => {
    onChange?.({});
    setSelectedMuscle(null);
  };

  const generateNarrative = useMemo(() => {
    const findingsList = Object.values(findings);
    if (findingsList.length === 0) {
      return null;
    }

    const grouped = {};
    findingsList.forEach((f) => {
      if (!grouped[f.type]) {
        grouped[f.type] = [];
      }
      grouped[f.type].push(f.muscle?.label || f.muscleId);
    });

    const narratives = [];

    if (grouped.trigger_point) {
      narratives.push(`Trigger points funnet i: ${grouped.trigger_point.join(', ')}`);
    }
    if (grouped.hypertonicity) {
      narratives.push(`Hypertonus i: ${grouped.hypertonicity.join(', ')}`);
    }
    if (grouped.weakness) {
      narratives.push(`Svakhet i: ${grouped.weakness.join(', ')}`);
    }
    if (grouped.shortness) {
      narratives.push(`Forkortede muskler: ${grouped.shortness.join(', ')}`);
    }
    if (grouped.adhesion) {
      narratives.push(`Adhesjoner i: ${grouped.adhesion.join(', ')}`);
    }
    if (grouped.treated) {
      narratives.push(`Behandlet: ${grouped.treated.join(', ')}`);
    }

    return narratives;
  }, [findings]);

  const totalFindings = Object.keys(findings).length;

  return (
    <div className={`bg-white border border-gray-200 rounded-lg ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200 rounded-t-lg">
        <div className="flex items-center gap-2">
          <h3 className="font-medium text-gray-900">Muskelkart</h3>
          {totalFindings > 0 && (
            <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
              {totalFindings} funn
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowLabels(!showLabels)}
            className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
            title={showLabels ? 'Skjul etiketter' : 'Vis etiketter'}
          >
            {showLabels ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </button>
          {totalFindings > 0 && !readOnly && (
            <button
              onClick={clearAll}
              className="flex items-center gap-1 text-sm text-red-600 hover:text-red-800"
            >
              <RotateCcw className="w-3 h-3" />
              Nullstill
            </button>
          )}
        </div>
      </div>

      {/* View toggle and group filter */}
      <div className="px-4 py-2 border-b border-gray-200 flex flex-wrap items-center gap-2">
        <div className="flex gap-1">
          <button
            onClick={() => setView('anterior')}
            className={`px-3 py-1 text-sm rounded transition-all ${
              view === 'anterior' ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            Forfra
          </button>
          <button
            onClick={() => setView('posterior')}
            className={`px-3 py-1 text-sm rounded transition-all ${
              view === 'posterior' ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            Bakfra
          </button>
        </div>
        <div className="h-4 w-px bg-gray-300" />
        <div className="flex flex-wrap gap-1">
          <button
            onClick={() => setFilterGroup(null)}
            className={`px-2 py-0.5 text-xs rounded ${
              !filterGroup ? 'bg-gray-800 text-white' : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            Alle
          </button>
          {Object.entries(MUSCLE_GROUP_LABELS).map(([key, group]) => (
            <button
              key={key}
              onClick={() => setFilterGroup(filterGroup === key ? null : key)}
              className={`px-2 py-0.5 text-xs rounded transition-all ${
                filterGroup === key ? 'text-white' : 'bg-gray-100 hover:bg-gray-200'
              }`}
              style={filterGroup === key ? { backgroundColor: group.color } : {}}
            >
              {group.label}
            </button>
          ))}
        </div>
      </div>

      <div className={`${compact ? '' : 'grid grid-cols-1 lg:grid-cols-2'}`}>
        {/* Visual muscle map */}
        <div className="p-4 flex justify-center">
          <svg viewBox="0 0 300 700" className="w-48 h-auto">
            {/* Body outline */}
            <ellipse cx="150" cy="380" rx="90" ry="300" fill="#f5f5f5" stroke="#e5e7eb" />
            <circle cx="150" cy="60" r="35" fill="#f5f5f5" stroke="#e5e7eb" />

            {/* Muscles */}
            {filteredMuscles.map(([muscleId, muscle]) => {
              const muscleColor = getMuscleColor(muscleId);
              const isSelected = selectedMuscle === muscleId;
              const groupColor = MUSCLE_GROUP_LABELS[muscle.group]?.color || '#9ca3af';

              return (
                <g key={muscleId}>
                  <path
                    d={muscle.path}
                    fill={muscleColor ? `${muscleColor}60` : `${groupColor}30`}
                    stroke={isSelected ? '#2563eb' : muscleColor || groupColor}
                    strokeWidth={isSelected ? 2 : 1}
                    className="cursor-pointer transition-all hover:opacity-80"
                    onClick={() => {
                      setSelectedMuscle(isSelected ? null : muscleId);
                      addFinding(muscleId);
                    }}
                  />
                  {showLabels && !compact && (
                    <text
                      x={parseInt(muscle.path.split(' ')[0].replace('M', '')) + 10}
                      y={parseInt(muscle.path.split(',')[1]) + 5}
                      fontSize="6"
                      fill="#374151"
                      className="pointer-events-none"
                    >
                      {muscle.labelEn}
                    </text>
                  )}
                </g>
              );
            })}

            {/* View label */}
            <text x="150" y="690" textAnchor="middle" fontSize="10" fill="#6b7280">
              {view === 'anterior' ? 'Anterior (Forfra)' : 'Posterior (Bakfra)'}
            </text>
          </svg>
        </div>

        {/* Controls and details */}
        {showDetails && (
          <div className="p-4 border-l border-gray-200 space-y-4">
            {/* Finding type selector */}
            {!readOnly && (
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-2">
                  Funntype (klikk på muskel for å legge til)
                </label>
                <div className="flex flex-wrap gap-1">
                  {FINDING_TYPES.map((type) => (
                    <button
                      key={type.id}
                      onClick={() => setSelectedFindingType(type)}
                      className={`px-2 py-1 text-xs rounded transition-all ${
                        selectedFindingType.id === type.id
                          ? 'ring-2 ring-offset-1'
                          : 'hover:bg-gray-100'
                      }`}
                      style={{
                        backgroundColor:
                          selectedFindingType.id === type.id ? `${type.color}20` : undefined,
                        borderColor: type.color,
                        borderWidth: '1px',
                        color: type.color,
                      }}
                    >
                      {type.abbrev} {type.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Selected muscle details */}
            {selectedMuscle && muscles[selectedMuscle] && (
              <div className="p-3 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900">{muscles[selectedMuscle].label}</h4>
                <p className="text-xs text-blue-700 mt-1">{muscles[selectedMuscle].labelEn}</p>
                <div className="mt-2 space-y-1 text-xs text-blue-800">
                  <p>
                    <strong>Innervasjon:</strong> {muscles[selectedMuscle].innervation}
                  </p>
                  <p>
                    <strong>Funksjoner:</strong> {muscles[selectedMuscle].actions.join(', ')}
                  </p>
                  <p>
                    <strong>Vanlige problemer:</strong>{' '}
                    {muscles[selectedMuscle].commonIssues.join(', ')}
                  </p>
                </div>
              </div>
            )}

            {/* Current findings */}
            {totalFindings > 0 && (
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-2">
                  Registrerte funn
                </label>
                <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
                  {Object.values(findings).map((f, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded text-white"
                      style={{ backgroundColor: f.color }}
                    >
                      {f.muscle?.label || f.muscleId} - {f.typeLabel}
                      {!readOnly && (
                        <button
                          onClick={() => {
                            const key = `${f.muscleId}_${f.type}`;
                            const newFindings = { ...findings };
                            delete newFindings[key];
                            onChange?.(newFindings);
                          }}
                          className="hover:bg-white/20 rounded"
                        >
                          ×
                        </button>
                      )}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Generated narrative */}
      {generateNarrative && generateNarrative.length > 0 && (
        <div className="px-4 py-3 bg-green-50 border-t border-green-200 rounded-b-lg">
          <label className="block text-xs font-medium text-green-800 mb-2">
            Muskelfunn (til journal):
          </label>
          <ul className="space-y-1">
            {generateNarrative.map((line, i) => (
              <li key={i} className="text-sm text-green-900">
                • {line}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export { MUSCLE_GROUPS, MUSCLE_GROUP_LABELS, FINDING_TYPES };
