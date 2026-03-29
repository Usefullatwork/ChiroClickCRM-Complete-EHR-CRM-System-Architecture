/**
 * Clinical Note Formatting & PDF Generation
 * Handles formatted text generation and PDF export for clinical notes
 */

import { query } from '../../config/database.js';
import logger from '../../utils/logger.js';
import { getNoteById } from './noteCrud.js';

/**
 * Generate formatted note for export/print
 */
export const generateFormattedNote = async (organizationId, noteId) => {
  try {
    const note = await getNoteById(organizationId, noteId);

    if (!note) {
      throw new Error('Note not found');
    }

    const subjective = note.subjective || {};
    const objective = note.objective || {};
    const assessment = note.assessment || {};
    const plan = note.plan || {};

    let formattedNote = `KLINISK NOTAT\n\n`;
    formattedNote += `Pasient: ${note.patient_name}\n`;
    formattedNote += `Dato: ${new Date(note.note_date).toLocaleDateString('no-NO')}\n`;
    formattedNote += `Behandler: ${note.practitioner_name}${note.hpr_number ? ` (HPR: ${note.hpr_number})` : ''}\n`;
    formattedNote += `Notattype: ${note.template_type}\n\n`;

    formattedNote += `SUBJEKTIVT (S):\n`;
    if (subjective.chief_complaint) {
      formattedNote += `Hovedplage: ${subjective.chief_complaint}\n`;
    }
    if (subjective.history) {
      formattedNote += `Anamnese: ${subjective.history}\n`;
    }
    if (subjective.onset) {
      formattedNote += `Debut: ${subjective.onset}\n`;
    }
    if (subjective.pain_description) {
      formattedNote += `Smertebeskrivelse: ${subjective.pain_description}\n`;
    }
    if (subjective.aggravating_factors) {
      formattedNote += `Forverrende faktorer: ${subjective.aggravating_factors}\n`;
    }
    if (subjective.relieving_factors) {
      formattedNote += `Lindrende faktorer: ${subjective.relieving_factors}\n`;
    }
    if (note.vas_pain_start !== null) {
      formattedNote += `VAS ved start: ${note.vas_pain_start}/10\n`;
    }
    formattedNote += `\n`;

    formattedNote += `OBJEKTIVT (O):\n`;
    if (objective.observation) {
      formattedNote += `Observasjon: ${objective.observation}\n`;
    }
    if (objective.palpation) {
      formattedNote += `Palpasjon: ${objective.palpation}\n`;
    }
    if (objective.rom) {
      formattedNote += `Bevegelighet: ${objective.rom}\n`;
    }
    if (objective.ortho_tests) {
      formattedNote += `Ortopediske tester: ${objective.ortho_tests}\n`;
    }
    if (objective.neuro_tests) {
      formattedNote += `Nevrologiske tester: ${objective.neuro_tests}\n`;
    }
    if (objective.vital_signs) {
      formattedNote += `Vitale tegn: ${objective.vital_signs}\n`;
    }
    formattedNote += `\n`;

    formattedNote += `VURDERING (A):\n`;
    if (note.icpc_codes && note.icpc_codes.length > 0) {
      formattedNote += `Diagnose (ICPC-2): ${note.icpc_codes.join(', ')}\n`;
    }
    if (note.icd10_codes && note.icd10_codes.length > 0) {
      formattedNote += `Diagnose (ICD-10): ${note.icd10_codes.join(', ')}\n`;
    }
    if (assessment.clinical_reasoning) {
      formattedNote += `Klinisk resonnement: ${assessment.clinical_reasoning}\n`;
    }
    if (assessment.prognosis) {
      formattedNote += `Prognose: ${assessment.prognosis}\n`;
    }
    formattedNote += `\n`;

    formattedNote += `PLAN (P):\n`;
    if (plan.treatment) {
      formattedNote += `Behandling: ${plan.treatment}\n`;
    }
    if (plan.exercises) {
      formattedNote += `Hjemmeovelser: ${plan.exercises}\n`;
    }
    if (plan.advice) {
      formattedNote += `Rad: ${plan.advice}\n`;
    }
    if (plan.follow_up) {
      formattedNote += `Oppfolging: ${plan.follow_up}\n`;
    }
    if (note.vas_pain_end !== null) {
      formattedNote += `VAS ved slutt: ${note.vas_pain_end}/10\n`;
    }

    if (note.vestibular_data && note.template_type === 'VESTIBULAR') {
      formattedNote += `\nVESTIBULAR VURDERING:\n`;
      const vestibular = note.vestibular_data;
      if (vestibular.primary_diagnosis) {
        formattedNote += `Diagnose: ${vestibular.primary_diagnosis}\n`;
      }
      if (vestibular.dhi_score) {
        formattedNote += `DHI Score: ${vestibular.dhi_score}/100\n`;
      }
      if (vestibular.maneuvers_performed?.length > 0) {
        formattedNote += `Utforte manovrer: ${vestibular.maneuvers_performed.map((m) => m.type).join(', ')}\n`;
      }
    }

    if (note.signed_at) {
      formattedNote += `\n---\n`;
      formattedNote += `Signert: ${new Date(note.signed_at).toLocaleString('no-NO')}\n`;
      formattedNote += `Signert av: ${note.signed_by_name}\n`;
    }

    await query('UPDATE clinical_notes SET generated_note = $1 WHERE id = $2', [
      formattedNote,
      noteId,
    ]);

    return formattedNote;
  } catch (error) {
    logger.error('Error generating formatted note:', error);
    throw error;
  }
};

/**
 * Helper function to get template type label in Norwegian
 */
const getTemplateTypeLabel = (type) => {
  const labels = {
    SOAP: 'SOAP Notat',
    INITIAL: 'Forstegangsundersokelse',
    FOLLOW_UP: 'Oppfolgingskonsultasjon',
    VESTIBULAR: 'Vestibular Vurdering',
    DISCHARGE: 'Avslutningsnotat',
    PROGRESS: 'Fremdriftsnotat',
  };
  return labels[type] || type;
};

/**
 * Generate PDF document for clinical note
 */
export const generateNotePDF = async (organizationId, noteId, _options = {}) => {
  const PDFDocument = (await import('pdfkit')).default;

  try {
    const note = await getNoteById(organizationId, noteId);
    if (!note) {
      throw new Error('Note not found');
    }

    const subjective =
      typeof note.subjective === 'string' ? JSON.parse(note.subjective) : note.subjective || {};
    const objective =
      typeof note.objective === 'string' ? JSON.parse(note.objective) : note.objective || {};
    const assessment =
      typeof note.assessment === 'string' ? JSON.parse(note.assessment) : note.assessment || {};
    const plan = typeof note.plan === 'string' ? JSON.parse(note.plan) : note.plan || {};
    const vestibularData = note.vestibular_data
      ? typeof note.vestibular_data === 'string'
        ? JSON.parse(note.vestibular_data)
        : note.vestibular_data
      : null;

    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 50, bottom: 50, left: 50, right: 50 },
      info: {
        Title: `Klinisk Notat - ${note.patient_name}`,
        Author: note.practitioner_name || 'ChiroClickEHR',
        Subject: 'Klinisk Notat',
        CreationDate: new Date(),
      },
    });

    const buffers = [];
    doc.on('data', buffers.push.bind(buffers));

    const addSectionHeader = (title) => {
      doc.moveDown(0.5);
      doc.fontSize(12).font('Helvetica-Bold').fillColor('#1a365d').text(title);
      doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke('#e2e8f0');
      doc.moveDown(0.3);
      doc.font('Helvetica').fillColor('#000000').fontSize(10);
    };

    const addField = (label, value, inline = false) => {
      if (value !== null && value !== undefined && value !== '') {
        if (inline) {
          doc.font('Helvetica-Bold').text(`${label}: `, { continued: true });
          doc.font('Helvetica').text(String(value));
        } else {
          doc.font('Helvetica-Bold').text(`${label}:`);
          doc.font('Helvetica').text(String(value), { indent: 10 });
        }
        doc.moveDown(0.3);
      }
    };

    // Header
    doc
      .fontSize(18)
      .font('Helvetica-Bold')
      .fillColor('#1a365d')
      .text('KLINISK NOTAT', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica').fillColor('#4a5568').text('Klinikk', { align: 'center' });
    doc.moveDown(1);

    // Patient info box
    doc.rect(50, doc.y, 495, 80).stroke('#e2e8f0');
    const infoBoxY = doc.y + 10;
    doc.fillColor('#000000').fontSize(10);
    doc.text(`Pasient: ${note.patient_name}`, 60, infoBoxY);
    if (note.date_of_birth) {
      doc.text(
        `Fodselsdato: ${new Date(note.date_of_birth).toLocaleDateString('no-NO')}`,
        300,
        infoBoxY
      );
    }
    doc.text(`Dato: ${new Date(note.note_date).toLocaleDateString('no-NO')}`, 60, infoBoxY + 20);
    doc.text(`Behandler: ${note.practitioner_name || 'Ikke angitt'}`, 300, infoBoxY + 20);
    if (note.hpr_number) {
      doc.text(`HPR: ${note.hpr_number}`, 300, infoBoxY + 40);
    }
    doc.text(`Notattype: ${getTemplateTypeLabel(note.template_type)}`, 60, infoBoxY + 40);
    if (note.duration_minutes) {
      doc.text(`Varighet: ${note.duration_minutes} min`, 60, infoBoxY + 60);
    }
    doc.y = infoBoxY + 90;

    // VAS
    if (note.vas_pain_start !== null || note.vas_pain_end !== null) {
      doc.moveDown(0.5);
      doc.fontSize(10).font('Helvetica-Bold').text('Smerteskala (VAS):', { continued: true });
      doc.font('Helvetica');
      if (note.vas_pain_start !== null) {
        doc.text(` Start: ${note.vas_pain_start}/10`, { continued: note.vas_pain_end !== null });
      }
      if (note.vas_pain_end !== null) {
        doc.text(` Slutt: ${note.vas_pain_end}/10`);
      }
    }

    // SOAP sections
    addSectionHeader('SUBJEKTIVT (S)');
    addField(
      'Hovedklage',
      subjective.chiefComplaint || subjective.chief_complaint || subjective.hovedklage
    );
    addField('Anamnese', subjective.history || subjective.anamnese);
    addField('Debut', subjective.onset || subjective.debut);
    addField('Smertebeskrivelse', subjective.painDescription || subjective.pain_description);
    addField('Lokalisasjon', subjective.location || subjective.lokalisasjon);
    addField('Utstralende smerte', subjective.radiation || subjective.utstralende);
    addField(
      'Forverrende faktorer',
      subjective.aggravatingFactors || subjective.aggravating_factors
    );
    addField('Lindrende faktorer', subjective.relievingFactors || subjective.relieving_factors);
    addField('Nattlig smerte', subjective.nightPain || subjective.night_pain);
    addField('Tidligere behandling', subjective.previousTreatment || subjective.previous_treatment);

    addSectionHeader('OBJEKTIVT (O)');
    addField('Observasjon', objective.observation || objective.observasjon);
    addField('Holdning', objective.posture || objective.holdning);
    addField('Gange', objective.gait || objective.gange);
    addField('Palpasjon', objective.palpation || objective.palpasjon);
    addField('Bevegelighet (ROM)', objective.rom || objective.bevegelighet);
    addField('Ortopediske tester', objective.orthoTests || objective.ortho_tests);
    addField('Nevrologiske tester', objective.neuroTests || objective.neuro_tests);

    if (objective.vitalSigns || objective.vital_signs) {
      const vitals = objective.vitalSigns || objective.vital_signs;
      let vitalStr = '';
      if (vitals.bloodPressure) {
        vitalStr += `BT: ${vitals.bloodPressure} mmHg  `;
      }
      if (vitals.pulse) {
        vitalStr += `Puls: ${vitals.pulse}/min  `;
      }
      if (vitals.temperature) {
        vitalStr += `Temp: ${vitals.temperature}°C  `;
      }
      if (vitals.respiration) {
        vitalStr += `Resp: ${vitals.respiration}/min`;
      }
      if (vitalStr) {
        addField('Vitale tegn', vitalStr.trim());
      }
    }
    addField('Funn', objective.findings || objective.funn);

    addSectionHeader('VURDERING (A)');
    if (note.icd10_codes && note.icd10_codes.length > 0) {
      addField('ICD-10 Diagnosekoder', note.icd10_codes.join(', '));
    }
    if (note.icpc_codes && note.icpc_codes.length > 0) {
      addField('ICPC-2 Diagnosekoder', note.icpc_codes.join(', '));
    }
    addField(
      'Klinisk vurdering',
      assessment.clinicalReasoning || assessment.clinical_reasoning || assessment.vurdering
    );
    addField('Diagnose', assessment.diagnosis || assessment.diagnose);
    addField(
      'Differensialdiagnoser',
      assessment.differentialDiagnosis || assessment.differential_diagnosis
    );
    addField('Prognose', assessment.prognosis || assessment.prognose);
    addField('Alvorlighetsgrad', assessment.severity || assessment.alvorlighet);

    if (assessment.redFlags && assessment.redFlags.length > 0) {
      doc.font('Helvetica-Bold').fillColor('#c53030').text('Rode flagg:');
      doc.font('Helvetica').fillColor('#000000');
      assessment.redFlags.forEach((flag) => {
        doc.text(`  • ${flag}`, { indent: 10 });
      });
      doc.moveDown(0.3);
    }

    addSectionHeader('PLAN (P)');
    addField('Behandling utfort', plan.treatment || plan.behandling);
    addField('Teknikker brukt', plan.techniques || plan.teknikker);
    addField('Hjemmeovelser', plan.exercises || plan.hjemmeovelser);
    addField('Rad og veiledning', plan.advice || plan.rad);
    addField('Oppfolging', plan.followUp || plan.follow_up || plan.oppfolging);
    addField('Neste time', plan.nextAppointment || plan.next_appointment);
    addField('Malsettinger', plan.goals || plan.malsettinger);
    addField('Henvisning', plan.referral || plan.henvisning);

    // Vestibular
    if (vestibularData && note.template_type === 'VESTIBULAR') {
      addSectionHeader('VESTIBULAR VURDERING');
      addField('Diagnose', vestibularData.primaryDiagnosis || vestibularData.primary_diagnosis);
      addField('DHI Score', vestibularData.dhiScore ? `${vestibularData.dhiScore}/100` : null);
      addField('Vertigo varighet', vestibularData.vertigoDuration);
      addField('Triggere', vestibularData.triggers);
      if (vestibularData.maneuversPerformed && vestibularData.maneuversPerformed.length > 0) {
        doc.font('Helvetica-Bold').text('Utforte manovrer:');
        vestibularData.maneuversPerformed.forEach((m) => {
          doc.font('Helvetica').text(`  • ${m.type}: ${m.result || 'Utfort'}`, { indent: 10 });
        });
        doc.moveDown(0.3);
      }
      if (vestibularData.nystagmusFindings) {
        addField('Nystagmus funn', vestibularData.nystagmusFindings);
      }
    }

    // Prescribed exercises
    if (note.prescribed_exercises && note.prescribed_exercises.length > 0) {
      const exercises =
        typeof note.prescribed_exercises === 'string'
          ? JSON.parse(note.prescribed_exercises)
          : note.prescribed_exercises;
      if (exercises.length > 0) {
        addSectionHeader('FORESKREVNE OVELSER');
        exercises.forEach((ex, index) => {
          doc.font('Helvetica-Bold').text(`${index + 1}. ${ex.name || ex.exercise_name}`);
          if (ex.sets && ex.reps) {
            doc
              .font('Helvetica')
              .text(`   ${ex.sets} sett x ${ex.reps} repetisjoner`, { indent: 10 });
          }
          if (ex.frequency) {
            doc.font('Helvetica').text(`   Frekvens: ${ex.frequency}`, { indent: 10 });
          }
          if (ex.instructions) {
            doc.font('Helvetica').text(`   Instruksjoner: ${ex.instructions}`, { indent: 10 });
          }
        });
        doc.moveDown(0.3);
      }
    }

    // Signature
    doc.moveDown(1);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke('#e2e8f0');
    doc.moveDown(0.5);

    if (note.signed_at) {
      doc.fontSize(9).fillColor('#2d3748');
      doc.font('Helvetica-Bold').text('Signert elektronisk');
      doc.font('Helvetica');
      doc.text(`Dato: ${new Date(note.signed_at).toLocaleString('no-NO')}`);
      doc.text(`Signert av: ${note.signed_by_name}`);
      if (note.signature_hash) {
        doc.fontSize(8).fillColor('#718096');
        doc.text(`Verifiseringskode: ${note.signature_hash.substring(0, 16)}...`);
      }
    } else {
      doc.fontSize(9).fillColor('#c53030');
      doc.font('Helvetica-Bold').text('UTKAST - IKKE SIGNERT');
      doc.font('Helvetica').fillColor('#718096');
      doc.text(
        `Sist lagret: ${new Date(note.draft_saved_at || note.updated_at).toLocaleString('no-NO')}`
      );
    }

    // Footer
    const pageCount = doc.bufferedPageRange().count;
    for (let i = 0; i < pageCount; i++) {
      doc.switchToPage(i);
      doc.fontSize(8).fillColor('#a0aec0');
      doc.text(
        `Side ${i + 1} av ${pageCount} | Generert ${new Date().toLocaleString('no-NO')} | ChiroClickEHR`,
        50,
        doc.page.height - 30,
        { align: 'center', width: doc.page.width - 100 }
      );
    }

    doc.end();

    return new Promise((resolve, reject) => {
      doc.on('end', () => {
        resolve(Buffer.concat(buffers));
      });
      doc.on('error', reject);
    });
  } catch (error) {
    logger.error('Error generating PDF:', error);
    throw error;
  }
};
