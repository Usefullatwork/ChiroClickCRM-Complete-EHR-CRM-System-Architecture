/**
 * Document Parser Service
 * Extract text from PDFs and Word documents for AI training
 */

import fs from 'fs';
import path from 'path';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import logger from '../utils/logger.js';

/**
 * Parse PDF document
 */
export const parsePDF = async (filePath) => {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);

    return {
      text: data.text,
      numPages: data.numpages,
      info: data.info,
      metadata: {
        title: data.info?.Title || null,
        author: data.info?.Author || null,
        subject: data.info?.Subject || null,
        keywords: data.info?.Keywords || null,
        creationDate: data.info?.CreationDate || null,
      }
    };
  } catch (error) {
    logger.error('Error parsing PDF:', error);
    throw new Error(`Failed to parse PDF: ${error.message}`);
  }
};

/**
 * Parse Word document (.docx)
 */
export const parseWord = async (filePath) => {
  try {
    const result = await mammoth.extractRawText({ path: filePath });

    return {
      text: result.value,
      messages: result.messages, // Warnings/errors from mammoth
      metadata: {
        fileName: path.basename(filePath),
        size: fs.statSync(filePath).size,
      }
    };
  } catch (error) {
    logger.error('Error parsing Word document:', error);
    throw new Error(`Failed to parse Word document: ${error.message}`);
  }
};

/**
 * Parse document based on file extension
 */
export const parseDocument = async (filePath) => {
  const ext = path.extname(filePath).toLowerCase();

  switch (ext) {
    case '.pdf':
      return parsePDF(filePath);
    case '.docx':
    case '.doc':
      return parseWord(filePath);
    default:
      throw new Error(`Unsupported file type: ${ext}`);
  }
};

/**
 * Extract clinical notes structure
 * Parse SOAP notes (Subjective, Objective, Assessment, Plan)
 */
export const extractSOAPNotes = (text) => {
  const soap = {
    subjective: null,
    objective: null,
    assessment: null,
    plan: null,
    raw: text
  };

  // Try to extract SOAP sections
  const subjectiveMatch = text.match(/Subjective[:\s]+(.*?)(?=Objective|Assessment|Plan|$)/is);
  const objectiveMatch = text.match(/Objective[:\s]+(.*?)(?=Assessment|Plan|$)/is);
  const assessmentMatch = text.match(/Assessment[:\s]+(.*?)(?=Plan|$)/is);
  const planMatch = text.match(/Plan[:\s]+(.*?)$/is);

  if (subjectiveMatch) soap.subjective = subjectiveMatch[1].trim();
  if (objectiveMatch) soap.objective = objectiveMatch[1].trim();
  if (assessmentMatch) soap.assessment = assessmentMatch[1].trim();
  if (planMatch) soap.plan = planMatch[1].trim();

  return soap;
};

/**
 * Parse multiple documents from a directory
 */
export const parseDirectory = async (directoryPath, options = {}) => {
  const {
    recursive = false,
    includeTypes = ['.pdf', '.docx', '.doc']
  } = options;

  const results = [];
  const errors = [];

  const processFile = async (filePath) => {
    try {
      const ext = path.extname(filePath).toLowerCase();
      if (!includeTypes.includes(ext)) return;

      const parsed = await parseDocument(filePath);
      results.push({
        filePath,
        fileName: path.basename(filePath),
        ...parsed
      });
    } catch (error) {
      errors.push({
        filePath,
        error: error.message
      });
    }
  };

  const processDirectory = async (dirPath) => {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);

      if (entry.isDirectory() && recursive) {
        await processDirectory(fullPath);
      } else if (entry.isFile()) {
        await processFile(fullPath);
      }
    }
  };

  await processDirectory(directoryPath);

  return {
    documents: results,
    errors,
    total: results.length,
    errorCount: errors.length
  };
};

/**
 * Extract Norwegian chiropractic terminology
 */
export const extractChiropracticTerms = (text) => {
  const terms = {
    diagnoses: [],
    treatments: [],
    anatomicalTerms: [],
    symptoms: []
  };

  // Norwegian anatomical terms
  const anatomicalPatterns = [
    /nakke/gi,
    /rygg/gi,
    /korsrygg/gi,
    /skulder/gi,
    /hofte/gi,
    /bekken/gi,
    /kjeve/gi,
    /albue/gi,
    /kne/gi,
    /ankel/gi,
    /cervical/gi,
    /thoracic/gi,
    /lumbar/gi,
    /sacral/gi
  ];

  // Symptoms
  const symptomPatterns = [
    /smerte/gi,
    /hodepine/gi,
    /svimmelhet/gi,
    /stivhet/gi,
    /låsning/gi,
    /betennelse/gi,
    /parestesi/gi,
    /nummenhet/gi
  ];

  // Treatments
  const treatmentPatterns = [
    /manipulasjon/gi,
    /mobilisering/gi,
    /bløtdelsbehandling/gi,
    /tøyning/gi,
    /øvelser/gi,
    /hjemmeøvelser/gi
  ];

  // Extract matches
  anatomicalPatterns.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) terms.anatomicalTerms.push(...matches);
  });

  symptomPatterns.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) terms.symptoms.push(...matches);
  });

  treatmentPatterns.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) terms.treatments.push(...matches);
  });

  // Deduplicate and count
  const deduplicateAndCount = (arr) => {
    const counts = {};
    arr.forEach(term => {
      const normalized = term.toLowerCase();
      counts[normalized] = (counts[normalized] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([term, count]) => ({ term, count }))
      .sort((a, b) => b.count - a.count);
  };

  return {
    anatomicalTerms: deduplicateAndCount(terms.anatomicalTerms),
    symptoms: deduplicateAndCount(terms.symptoms),
    treatments: deduplicateAndCount(terms.treatments)
  };
};

/**
 * Split text into chunks for training
 */
export const chunkTextForTraining = (text, chunkSize = 512, overlap = 50) => {
  const words = text.split(/\s+/);
  const chunks = [];

  for (let i = 0; i < words.length; i += chunkSize - overlap) {
    const chunk = words.slice(i, i + chunkSize).join(' ');
    if (chunk.trim().length > 0) {
      chunks.push(chunk);
    }
  }

  return chunks;
};

export default {
  parsePDF,
  parseWord,
  parseDocument,
  parseDirectory,
  extractSOAPNotes,
  extractChiropracticTerms,
  chunkTextForTraining
};
