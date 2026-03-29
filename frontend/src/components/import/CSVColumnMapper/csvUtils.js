/**
 * CSV parsing utilities for CSVColumnMapper
 */

import { STANDARD_MAPPINGS } from './constants';

export const detectDelimiter = (content) => {
  const firstLine = content.split('\n')[0];
  const delimiters = [',', ';', '\t', '|'];
  let maxCount = 0;
  let detected = ',';

  for (const delimiter of delimiters) {
    const count = (firstLine.match(new RegExp(`\\${delimiter}`, 'g')) || []).length;
    if (count > maxCount) {
      maxCount = count;
      detected = delimiter;
    }
  }

  return detected;
};

export const parseCSVLine = (line, delimiter) => {
  const fields = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      fields.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  fields.push(current.trim());
  return fields;
};

export const parseCSV = (content, options = {}) => {
  const { delimiter = null, hasHeader = true } = options;

  const normalizedContent = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const actualDelimiter = delimiter || detectDelimiter(normalizedContent);
  const lines = normalizedContent.split('\n').filter((line) => line.trim());

  if (lines.length === 0) {
    return { headers: [], rows: [], delimiter: actualDelimiter };
  }

  const headers = hasHeader
    ? parseCSVLine(lines[0], actualDelimiter)
    : lines[0].split(actualDelimiter).map((_, i) => `Column ${i + 1}`);

  const startIndex = hasHeader ? 1 : 0;
  const rows = [];

  for (let i = startIndex; i < lines.length; i++) {
    const values = parseCSVLine(lines[i], actualDelimiter);
    if (values.every((v) => !v)) {
      continue;
    }

    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    rows.push(row);
  }

  return {
    headers,
    rows,
    delimiter: actualDelimiter,
    rowCount: rows.length,
  };
};

export const autoDetectMappings = (headers) => {
  const mappings = {};

  for (const header of headers) {
    const normalized = header.toLowerCase().trim();

    if (STANDARD_MAPPINGS[normalized]) {
      mappings[header] = STANDARD_MAPPINGS[normalized];
      continue;
    }

    for (const [key, value] of Object.entries(STANDARD_MAPPINGS)) {
      if (normalized.includes(key) || key.includes(normalized)) {
        mappings[header] = value;
        break;
      }
    }
  }

  return mappings;
};
