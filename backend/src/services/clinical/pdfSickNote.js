/**
 * PDF Sick Note & Invoice Generator
 * Norwegian-compliance sick notes and invoice PDFs
 */

import { query } from '../../config/database.js';
import logger from '../../utils/logger.js';
import {
  TEXT,
  fontName,
  formatNorwegianDate,
  formatNorwegianCurrency,
  createDoc,
  docToBuffer,
  addHeader,
  addFooter,
  sectionHeading,
  labeledValue,
} from './pdf-utils.js';

/**
 * Generate a Norwegian-compliance sick note PDF.
 */
export async function generateSickNote(sickNoteData) {
  const {
    patientId,
    orgId,
    encounterId,
    diagnosisCode,
    diagnosisText,
    startDate,
    endDate,
    percentage = 100,
    functionalAssessment,
    workRestrictions,
  } = sickNoteData;

  const res = await query(
    `SELECT p.first_name, p.last_name, p.date_of_birth, p.phone, p.email,
            p.address, p.encrypted_personal_number, p.solvit_id,
            o.name AS clinic_name, o.address AS clinic_address, o.phone AS clinic_phone,
            o.email AS clinic_email, o.org_number,
            u.first_name || ' ' || u.last_name AS practitioner_name, u.hpr_number
     FROM patients p
     JOIN organizations o ON o.id = p.organization_id
     LEFT JOIN clinical_encounters ce ON ce.id = $3 AND ce.organization_id = $2
     LEFT JOIN users u ON u.id = ce.practitioner_id
     WHERE p.id = $1 AND p.organization_id = $2`,
    [patientId, orgId, encounterId]
  );

  if (res.rows.length === 0) {
    throw new Error('Patient not found');
  }
  const data = res.rows[0];

  const clinic = {
    name: data.clinic_name,
    address: data.clinic_address,
    phone: data.clinic_phone,
    email: data.clinic_email,
    org_number: data.org_number,
  };

  const doc = createDoc(TEXT.SICK_NOTE);
  const f = fontName(false);
  const fb = fontName(true);

  addHeader(doc, clinic, TEXT.SICK_NOTE);

  // Patient details
  doc.moveDown(0.5);
  sectionHeading(doc, 'Pasientopplysninger');
  const infoTop = doc.y;
  doc.rect(50, infoTop, 495, 80).fill('#f5f7fa');
  doc.fillColor('#000000').fontSize(10).font(f);

  labeledValue(doc, 'Navn', `${data.first_name} ${data.last_name}`);
  labeledValue(doc, TEXT.DOB, formatNorwegianDate(data.date_of_birth));
  if (data.phone) {
    labeledValue(doc, TEXT.PHONE, data.phone);
  }

  const addr = data.address;
  if (addr) {
    const addrStr =
      typeof addr === 'object'
        ? [addr.street, addr.postal_code, addr.city].filter(Boolean).join(', ')
        : addr;
    labeledValue(doc, 'Adresse', addrStr);
  }

  doc.y = Math.max(doc.y, infoTop + 85);
  doc.moveDown(0.8);

  // Diagnosis
  sectionHeading(doc, `${TEXT.DIAGNOSIS} (ICD-10)`);
  doc
    .fontSize(11)
    .font(fb)
    .text(diagnosisCode || 'Ikke angitt', { continued: true });
  doc.font(f).text(diagnosisText ? ` — ${diagnosisText}` : '');
  doc.moveDown(0.8);

  // Functional capacity
  sectionHeading(doc, TEXT.FUNCTIONAL_CAPACITY);
  doc.text(functionalAssessment || 'Se journal for detaljert funksjonsvurdering.', {
    align: 'justify',
  });
  doc.moveDown(0.8);

  // Duration
  sectionHeading(doc, `${TEXT.DURATION} og grad`);
  labeledValue(doc, 'Fra dato', formatNorwegianDate(startDate));
  labeledValue(doc, 'Til dato', formatNorwegianDate(endDate));
  labeledValue(doc, 'Sykmeldingsgrad', `${percentage}%`);
  doc.moveDown(0.8);

  if (workRestrictions) {
    sectionHeading(doc, TEXT.WORK_RESTRICTIONS);
    doc.text(workRestrictions, { align: 'justify' });
    doc.moveDown(0.8);
  }

  // Signature
  doc.moveDown(1.5);
  doc.moveTo(50, doc.y).lineTo(545, doc.y).lineWidth(0.5).stroke('#cccccc');
  doc.moveDown(1);
  doc.font(f).text(`${TEXT.REGARDS},`);
  doc.moveDown(2);
  doc.moveTo(50, doc.y).lineTo(220, doc.y).stroke();
  doc.moveDown(0.3);
  doc.font(fb).text(data.practitioner_name || '');
  doc.font(f).text(TEXT.CHIROPRACTOR);
  if (data.hpr_number) {
    doc.text(`${TEXT.HPR_NR}: ${data.hpr_number}`);
  }
  doc.text(`${TEXT.DATE}: ${formatNorwegianDate(new Date())}`);

  addFooter(doc, clinic);

  const buffer = await docToBuffer(doc);
  logger.info(`Generated sick note for patient ${patientId}`, { size: buffer.length });
  return buffer;
}

/**
 * Generate a Norwegian-format invoice PDF.
 */
export async function generateInvoice(invoiceData) {
  const {
    orgId,
    patientId,
    invoiceNumber,
    invoiceDate,
    dueDate,
    lineItems = [],
    vatRate = 0,
    accountNumber,
    kidNumber,
    insuranceCompany,
  } = invoiceData;

  const res = await query(
    `SELECT p.first_name, p.last_name, p.address, p.phone, p.email,
            o.name AS clinic_name, o.address AS clinic_address,
            o.phone AS clinic_phone, o.email AS clinic_email, o.org_number
     FROM patients p
     JOIN organizations o ON o.id = p.organization_id
     WHERE p.id = $1 AND p.organization_id = $2`,
    [patientId, orgId]
  );

  if (res.rows.length === 0) {
    throw new Error('Patient not found');
  }
  const data = res.rows[0];

  const clinic = {
    name: data.clinic_name,
    address: data.clinic_address,
    phone: data.clinic_phone,
    email: data.clinic_email,
    org_number: data.org_number,
  };

  const invDate = invoiceDate ? new Date(invoiceDate) : new Date();
  const due = dueDate ? new Date(dueDate) : new Date(invDate.getTime() + 14 * 86400000);
  const invNum = invoiceNumber || `F-${invDate.getFullYear()}-${String(Date.now()).slice(-6)}`;

  const doc = createDoc(TEXT.INVOICE);
  const f = fontName(false);
  const fb = fontName(true);

  // Header
  doc
    .fontSize(16)
    .font(fb)
    .text(clinic.name || 'Klinikk', 50, 30);
  doc.fontSize(9).font(f);
  if (clinic.address) {
    const addr =
      typeof clinic.address === 'object'
        ? [clinic.address.street, clinic.address.postal_code, clinic.address.city]
            .filter(Boolean)
            .join(', ')
        : clinic.address;
    doc.text(addr);
  }
  if (clinic.phone) {
    doc.text(`${TEXT.PHONE}: ${clinic.phone}`);
  }
  if (clinic.org_number) {
    doc.text(`${TEXT.ORG_NR}: ${clinic.org_number}`);
  }

  doc.fontSize(24).font(fb).text(TEXT.INVOICE, 350, 30, { width: 195, align: 'right' });
  doc.fontSize(9).font(f);
  doc.text(`${TEXT.INVOICE_NR}: ${invNum}`, 350, 60, { width: 195, align: 'right' });
  doc.text(`${TEXT.INVOICE_DATE}: ${formatNorwegianDate(invDate)}`, 350, 73, {
    width: 195,
    align: 'right',
  });
  doc.text(`${TEXT.DUE_DATE}: ${formatNorwegianDate(due)}`, 350, 86, {
    width: 195,
    align: 'right',
  });

  doc.y = 110;
  doc.moveTo(50, doc.y).lineTo(545, doc.y).lineWidth(1).stroke('#333333');
  doc.moveDown(1);

  // Bill-to
  doc
    .fontSize(10)
    .font(fb)
    .text(insuranceCompany ? 'Faktureres til (forsikring):' : 'Faktureres til:');
  doc.font(f);
  if (insuranceCompany) {
    doc.text(insuranceCompany);
    doc.moveDown(0.3);
    doc.font(fb).text(`${TEXT.PATIENT}:`);
    doc.font(f);
  }
  doc.text(`${data.first_name || ''} ${data.last_name || ''}`);
  if (data.address) {
    const addr =
      typeof data.address === 'object'
        ? [data.address.street, data.address.postal_code, data.address.city]
            .filter(Boolean)
            .join(', ')
        : data.address;
    doc.text(addr);
  }
  doc.moveDown(1.2);

  // Line items
  const tableTop = doc.y;
  const colDefs = [
    { x: 50, w: 80, label: TEXT.DATE },
    { x: 130, w: 200, label: 'Tjeneste' },
    { x: 330, w: 80, label: 'ICPC-kode' },
    { x: 410, w: 135, label: 'Beløp' },
  ];

  doc.rect(50, tableTop, 495, 22).fill('#e8eef4');
  doc.fillColor('#000000').fontSize(9).font(fb);
  for (const col of colDefs) {
    doc.text(col.label, col.x + 4, tableTop + 6, { width: col.w - 8 });
  }

  let rowY = tableTop + 22;
  let subtotal = 0;
  doc.font(f).fontSize(9);

  for (let i = 0; i < lineItems.length; i++) {
    const item = lineItems[i];
    const amount = Number(item.amount) || 0;
    subtotal += amount;

    if (i % 2 === 0) {
      doc.rect(50, rowY, 495, 20).fill('#fafbfc');
      doc.fillColor('#000000');
    }

    doc.text(formatNorwegianDate(item.date), colDefs[0].x + 4, rowY + 5, {
      width: colDefs[0].w - 8,
    });
    doc.text(item.service || '', colDefs[1].x + 4, rowY + 5, { width: colDefs[1].w - 8 });
    doc.text(item.icpcCode || '', colDefs[2].x + 4, rowY + 5, { width: colDefs[2].w - 8 });
    doc.text(formatNorwegianCurrency(amount), colDefs[3].x + 4, rowY + 5, {
      width: colDefs[3].w - 8,
      align: 'right',
    });
    rowY += 20;
  }

  doc.moveTo(50, rowY).lineTo(545, rowY).lineWidth(0.5).stroke();
  doc.y = rowY + 10;

  // Totals
  const vatAmount = subtotal * (vatRate / 100);
  const total = subtotal + vatAmount;

  doc.fontSize(10).font(f);
  doc.text(`${TEXT.SUBTOTAL}: ${formatNorwegianCurrency(subtotal)}`, { align: 'right' });
  if (vatRate > 0) {
    doc.text(`${TEXT.VAT} (${vatRate}%): ${formatNorwegianCurrency(vatAmount)}`, {
      align: 'right',
    });
  }
  doc.moveDown(0.3);
  doc.fontSize(14).font(fb);
  doc.text(`${TEXT.AMOUNT_DUE}: ${formatNorwegianCurrency(total)}`, { align: 'right' });
  doc.moveDown(1.5);

  // Payment info
  doc.fontSize(10).font(fb).text(`${TEXT.PAYMENT_INFO}:`);
  doc.font(f).fontSize(9);
  if (accountNumber) {
    doc.text(`${TEXT.ACCOUNT_NR}: ${accountNumber}`);
  }
  if (kidNumber) {
    doc.text(`${TEXT.KID_NR}: ${kidNumber}`);
  }
  doc.text(`${TEXT.DUE_DATE}: ${formatNorwegianDate(due)}`);
  if (clinic.org_number) {
    doc.text(`${TEXT.ORG_NR}: ${clinic.org_number}`);
  }

  addFooter(doc, clinic);

  const buffer = await docToBuffer(doc);
  logger.info(`Generated invoice ${invNum} for patient ${patientId}`, { size: buffer.length });
  return buffer;
}
