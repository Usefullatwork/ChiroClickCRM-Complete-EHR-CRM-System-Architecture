/**
 * Geographic Utilities for Norwegian Address Segmentation
 *
 * Helps identify Oslo vs. non-Oslo patients for KPI segmentation
 */

/**
 * Oslo postal codes range from 0001 to 1299
 * Some exceptions exist, but this covers the vast majority
 */
const OSLO_POSTAL_CODE_RANGES = [
  { min: 1, max: 1299 }  // Oslo postal codes
];

/**
 * Greater Oslo area (Viken county) - optional for expanded analysis
 * Includes Bærum, Asker, Lillestrøm, etc.
 */
const GREATER_OSLO_POSTAL_CODES = [
  { min: 1300, max: 1390 },  // Ski, Oppegård
  { min: 1400, max: 1490 },  // Nesoddtangen
  { min: 1500, max: 1599 },  // Moss
  { min: 1600, max: 1799 },  // Fredrikstad
  { min: 1800, max: 1890 },  // Askim
  { min: 1900, max: 1999 },  // Fetsund
  { min: 2000, max: 2099 },  // Lillestrøm
  { min: 3000, max: 3099 },  // Drammen (close to Oslo)
];

/**
 * Check if a postal code is in Oslo
 * @param {string} postalCode - Norwegian postal code (4 digits)
 * @returns {boolean} - True if Oslo postal code
 */
export const isOsloPostalCode = (postalCode) => {
  if (!postalCode) return false;

  // Remove spaces and convert to number
  const code = parseInt(postalCode.replace(/\s+/g, ''), 10);

  if (isNaN(code)) return false;

  return OSLO_POSTAL_CODE_RANGES.some(
    range => code >= range.min && code <= range.max
  );
};

/**
 * Check if a postal code is in greater Oslo area
 * @param {string} postalCode - Norwegian postal code (4 digits)
 * @returns {boolean} - True if in greater Oslo area
 */
export const isGreaterOsloPostalCode = (postalCode) => {
  if (!postalCode) return false;

  const code = parseInt(postalCode.replace(/\s+/g, ''), 10);

  if (isNaN(code)) return false;

  // Check if Oslo or Greater Oslo
  return isOsloPostalCode(postalCode) || GREATER_OSLO_POSTAL_CODES.some(
    range => code >= range.min && code <= range.max
  );
};

/**
 * Get geographic classification for a patient
 * @param {object} patient - Patient object with address
 * @returns {string} - 'oslo', 'greater_oslo', 'outside_oslo'
 */
export const getPatientGeographicClassification = (patient) => {
  if (!patient?.address?.postalCode) {
    return 'unknown';
  }

  const postalCode = patient.address.postalCode;

  if (isOsloPostalCode(postalCode)) {
    return 'oslo';
  }

  if (isGreaterOsloPostalCode(postalCode)) {
    return 'greater_oslo';
  }

  return 'outside_oslo';
};

/**
 * Get distance category for reporting
 * @param {object} patient - Patient object with address
 * @returns {string} - Readable distance category
 */
export const getDistanceCategory = (patient) => {
  const classification = getPatientGeographicClassification(patient);

  const labels = {
    oslo: 'Oslo',
    greater_oslo: 'Greater Oslo Area',
    outside_oslo: 'Outside Oslo',
    unknown: 'Unknown Location'
  };

  return labels[classification] || 'Unknown';
};

/**
 * Check if a date is a weekend (Saturday or Sunday)
 * @param {Date|string} date - Date to check
 * @returns {boolean} - True if weekend
 */
export const isWeekend = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  return day === 0 || day === 6; // Sunday = 0, Saturday = 6
};

/**
 * Check if a date is a Saturday
 * @param {Date|string} date - Date to check
 * @returns {boolean} - True if Saturday
 */
export const isSaturday = (date) => {
  const d = new Date(date);
  return d.getDay() === 6;
};

/**
 * Get day of week label
 * @param {Date|string} date - Date to check
 * @returns {string} - Day name in Norwegian
 */
export const getDayOfWeekLabel = (date) => {
  const d = new Date(date);
  const days = ['Søndag', 'Mandag', 'Tirsdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lørdag'];
  return days[d.getDay()];
};

/**
 * Classify visit by time and location
 * @param {object} visit - Visit/encounter object with date and patient info
 * @returns {object} - Classification details
 */
export const classifyVisit = (visit) => {
  const visitDate = new Date(visit.date || visit.startTime);
  const isWeekendVisit = isWeekend(visitDate);
  const isSaturdayVisit = isSaturday(visitDate);
  const location = getPatientGeographicClassification(visit.patient);

  return {
    date: visitDate,
    dayOfWeek: getDayOfWeekLabel(visitDate),
    isWeekend: isWeekendVisit,
    isSaturday: isSaturdayVisit,
    location,
    locationLabel: getDistanceCategory(visit.patient),
    // Special flag for Saturday + non-Oslo combination
    isSaturdayNonOslo: isSaturdayVisit && location === 'outside_oslo'
  };
};

/**
 * Parse city from address to detect Oslo
 * @param {object} address - Address object with city field
 * @returns {boolean} - True if Oslo
 */
export const isOsloCity = (address) => {
  if (!address?.city) return false;

  const city = address.city.toLowerCase().trim();
  return city === 'oslo';
};

/**
 * Format postal code for display
 * @param {string} postalCode - Norwegian postal code
 * @returns {string} - Formatted postal code (NNNN)
 */
export const formatPostalCode = (postalCode) => {
  if (!postalCode) return '';

  // Remove all non-digits
  const digits = postalCode.replace(/\D/g, '');

  // Pad to 4 digits if needed
  return digits.padStart(4, '0');
};

/**
 * Get region label for analytics
 * @param {string} postalCode - Norwegian postal code
 * @returns {string} - Region label
 */
export const getRegionLabel = (postalCode) => {
  const code = parseInt(formatPostalCode(postalCode), 10);

  if (isNaN(code)) return 'Unknown';

  if (code >= 1 && code <= 1299) return 'Oslo';
  if (code >= 1300 && code <= 3999) return 'Viken (Oslo Area)';
  if (code >= 4000 && code <= 4999) return 'Rogaland';
  if (code >= 5000 && code <= 5999) return 'Vestland';
  if (code >= 6000 && code <= 6999) return 'Møre og Romsdal';
  if (code >= 7000 && code <= 7999) return 'Trøndelag';
  if (code >= 8000 && code <= 8999) return 'Nordland';
  if (code >= 9000 && code <= 9999) return 'Troms og Finnmark';

  return 'Unknown';
};
