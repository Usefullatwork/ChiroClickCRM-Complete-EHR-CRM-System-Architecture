/**
 * vCard Import Component
 *
 * vCard (.vcf) file upload and preview component.
 * Parses vCard files and converts them to patient format.
 *
 * Features:
 * - Drag and drop file upload
 * - vCard parsing (single and multiple contacts)
 * - Contact preview with field mapping
 * - Norwegian translations
 */

import { useState, useCallback, useMemo } from 'react';
import {
  Upload,
  Smartphone,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Building2,
  Check,
  X,
  AlertTriangle,
  Eye,
  FileText,
  Users,
  Trash2,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Card, CardHeader, CardBody, CardFooter } from '../ui/Card';
import { Alert } from '../ui/Alert';
import { Modal } from '../ui/Modal';

// Norwegian translations
const TRANSLATIONS = {
  en: {
    title: 'vCard Import',
    subtitle: 'Import contacts from vCard (.vcf) files',
    dropzone: 'Drop vCard file here or click to browse',
    supportedFormats: 'Supports .vcf files with single or multiple contacts',
    preview: 'Contact Preview',
    contactsFound: 'contacts found',
    selectAll: 'Select All',
    deselectAll: 'Deselect All',
    selected: 'selected',
    importSelected: 'Import Selected',
    noContacts: 'No valid contacts found in file',
    parseError: 'Error parsing vCard file',
    fields: {
      name: 'Name',
      email: 'Email',
      phone: 'Mobile',
      homePhone: 'Home Phone',
      workPhone: 'Work Phone',
      address: 'Address',
      birthday: 'Date of Birth',
      organization: 'Organization',
      notes: 'Notes',
    },
    validation: {
      noName: 'Missing name',
      noContact: 'No contact info',
      valid: 'Valid contact',
    },
    buttons: {
      cancel: 'Cancel',
      import: 'Import',
      preview: 'Preview',
      remove: 'Remove',
      clear: 'Clear',
    },
    exportVcard: 'Export as vCard',
    importComplete: 'Import complete',
  },
  no: {
    title: 'vCard Import',
    subtitle: 'Importer kontakter fra vCard (.vcf) filer',
    dropzone: 'Slipp vCard-fil her eller klikk for a bla',
    supportedFormats: 'Stotter .vcf filer med enkle eller flere kontakter',
    preview: 'Kontakt Forhandsvisning',
    contactsFound: 'kontakter funnet',
    selectAll: 'Velg Alle',
    deselectAll: 'Fjern Alle',
    selected: 'valgt',
    importSelected: 'Importer Valgte',
    noContacts: 'Ingen gyldige kontakter funnet i filen',
    parseError: 'Feil ved behandling av vCard-fil',
    fields: {
      name: 'Navn',
      email: 'E-post',
      phone: 'Mobil',
      homePhone: 'Hjemmetelefon',
      workPhone: 'Arbeidstelefon',
      address: 'Adresse',
      birthday: 'Fodselsdato',
      organization: 'Organisasjon',
      notes: 'Notater',
    },
    validation: {
      noName: 'Mangler navn',
      noContact: 'Ingen kontaktinfo',
      valid: 'Gyldig kontakt',
    },
    buttons: {
      cancel: 'Avbryt',
      import: 'Importer',
      preview: 'Forhandsvis',
      remove: 'Fjern',
      clear: 'Tom',
    },
    exportVcard: 'Eksporter som vCard',
    importComplete: 'Import fullfort',
  },
};

// Parse a single vCard entry
const parseVCardEntry = (vcardText) => {
  const contact = {
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    home_phone: '',
    work_phone: '',
    address_street: '',
    address_postal_code: '',
    address_city: '',
    country: '',
    date_of_birth: null,
    notes: '',
    organization: '',
  };

  const lines = vcardText.split(/\r?\n/);

  for (const line of lines) {
    if (!line.trim()) continue;

    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) continue;

    let property = line.substring(0, colonIndex).toUpperCase();
    let value = line.substring(colonIndex + 1).trim();

    // Handle property parameters (e.g., TEL;TYPE=CELL)
    const params = {};
    if (property.includes(';')) {
      const parts = property.split(';');
      property = parts[0];
      parts.slice(1).forEach(param => {
        const [key, val] = param.split('=');
        params[key?.toUpperCase()] = val?.toUpperCase() || true;
      });
    }

    // Unescape special characters
    value = value
      .replace(/\\n/gi, '\n')
      .replace(/\\,/g, ',')
      .replace(/\\;/g, ';')
      .replace(/\\\\/g, '\\');

    switch (property) {
      case 'N':
        const nameParts = value.split(';');
        contact.last_name = nameParts[0] || '';
        contact.first_name = nameParts[1] || '';
        break;

      case 'FN':
        if (!contact.first_name && !contact.last_name) {
          const fullNameParts = value.split(' ');
          contact.first_name = fullNameParts[0] || '';
          contact.last_name = fullNameParts.slice(1).join(' ') || '';
        }
        break;

      case 'EMAIL':
        if (!contact.email) {
          contact.email = value;
        }
        break;

      case 'TEL':
        const phoneType = params.TYPE || '';
        const cleanPhone = value.replace(/[\s\-\(\)]/g, '');

        if (phoneType.includes('CELL') || phoneType.includes('MOBILE')) {
          contact.phone = cleanPhone;
        } else if (phoneType.includes('HOME')) {
          contact.home_phone = cleanPhone;
        } else if (phoneType.includes('WORK')) {
          contact.work_phone = cleanPhone;
        } else if (!contact.phone) {
          contact.phone = cleanPhone;
        }
        break;

      case 'ADR':
        const addrParts = value.split(';');
        contact.address_street = addrParts[2] || '';
        contact.address_city = addrParts[3] || '';
        contact.address_postal_code = addrParts[5] || '';
        contact.country = addrParts[6] || '';
        break;

      case 'BDAY':
        try {
          let dateStr = value.replace(/\D/g, '');
          if (dateStr.length === 8) {
            contact.date_of_birth = `${dateStr.substring(0, 4)}-${dateStr.substring(4, 6)}-${dateStr.substring(6, 8)}`;
          }
        } catch (e) {
          // Ignore parse errors
        }
        break;

      case 'NOTE':
        contact.notes = value;
        break;

      case 'ORG':
        contact.organization = value.split(';')[0];
        break;

      case 'TITLE':
        contact.job_title = value;
        break;
    }
  }

  return contact;
};

// Parse vCard file content
const parseVCard = (vcfContent) => {
  const contacts = [];
  const vcardPattern = /BEGIN:VCARD[\s\S]*?END:VCARD/gi;
  const vcards = vcfContent.match(vcardPattern) || [];

  for (const vcard of vcards) {
    try {
      const contact = parseVCardEntry(vcard);
      if (contact.first_name || contact.last_name) {
        contacts.push(contact);
      }
    } catch (error) {
      console.warn('Failed to parse vCard entry:', error);
    }
  }

  return contacts;
};

// Validate contact
const validateContact = (contact) => {
  const errors = [];
  const warnings = [];

  if (!contact.first_name && !contact.last_name) {
    errors.push('noName');
  }

  if (!contact.phone && !contact.email) {
    warnings.push('noContact');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
};

// =============================================================================
// VCARD IMPORT COMPONENT
// =============================================================================

export default function VCardImport({
  onImportComplete,
  onCancel,
  language = 'no',
  className = '',
}) {
  const [file, setFile] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [selectedContacts, setSelectedContacts] = useState(new Set());
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState(null);
  const [previewContact, setPreviewContact] = useState(null);

  const t = TRANSLATIONS[language] || TRANSLATIONS.no;

  // Validate all contacts
  const validatedContacts = useMemo(() => {
    return contacts.map(contact => ({
      ...contact,
      validation: validateContact(contact),
    }));
  }, [contacts]);

  // Count valid contacts
  const validCount = useMemo(() => {
    return validatedContacts.filter(c => c.validation.isValid).length;
  }, [validatedContacts]);

  // Handle file drop
  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFile = useCallback((selectedFile) => {
    if (!selectedFile.name.match(/\.vcf$/i)) {
      setError(t.parseError);
      return;
    }

    setFile(selectedFile);
    setError(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target.result;
        const parsed = parseVCard(content);

        if (parsed.length === 0) {
          setError(t.noContacts);
          setContacts([]);
        } else {
          setContacts(parsed);
          // Select all valid contacts by default
          const validIds = parsed
            .map((c, i) => ({ contact: c, index: i }))
            .filter(({ contact }) => validateContact(contact).isValid)
            .map(({ index }) => index);
          setSelectedContacts(new Set(validIds));
        }
      } catch (err) {
        setError(t.parseError + ': ' + err.message);
        setContacts([]);
      }
    };
    reader.readAsText(selectedFile);
  }, [t]);

  // Toggle contact selection
  const toggleContact = useCallback((index) => {
    setSelectedContacts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  }, []);

  // Select all
  const handleSelectAll = useCallback(() => {
    const allValid = validatedContacts
      .map((c, i) => ({ contact: c, index: i }))
      .filter(({ contact }) => contact.validation.isValid)
      .map(({ index }) => index);
    setSelectedContacts(new Set(allValid));
  }, [validatedContacts]);

  // Deselect all
  const handleDeselectAll = useCallback(() => {
    setSelectedContacts(new Set());
  }, []);

  // Remove contact
  const handleRemoveContact = useCallback((index) => {
    setContacts(prev => prev.filter((_, i) => i !== index));
    setSelectedContacts(prev => {
      const newSet = new Set(prev);
      newSet.delete(index);
      return newSet;
    });
  }, []);

  // Clear all
  const handleClear = useCallback(() => {
    setFile(null);
    setContacts([]);
    setSelectedContacts(new Set());
    setError(null);
  }, []);

  // Handle import
  const handleImport = useCallback(() => {
    const selectedPatients = Array.from(selectedContacts)
      .map(i => contacts[i])
      .filter(Boolean);

    onImportComplete?.(selectedPatients);
  }, [selectedContacts, contacts, onImportComplete]);

  // Get contact display name
  const getContactName = (contact) => {
    const name = `${contact.first_name || ''} ${contact.last_name || ''}`.trim();
    return name || 'Unknown';
  };

  // Format address
  const formatAddress = (contact) => {
    const parts = [
      contact.address_street,
      contact.address_postal_code,
      contact.address_city,
      contact.country,
    ].filter(Boolean);
    return parts.join(', ') || null;
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Smartphone className="w-6 h-6 text-purple-600" />
            {t.title}
          </h2>
          <p className="text-slate-500">{t.subtitle}</p>
        </div>
        {contacts.length > 0 && (
          <Button variant="ghost" icon={Trash2} onClick={handleClear}>
            {t.buttons.clear}
          </Button>
        )}
      </div>

      {/* Error display */}
      {error && (
        <Alert variant="danger">
          {error}
        </Alert>
      )}

      {/* File upload area */}
      {contacts.length === 0 && (
        <div
          className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors cursor-pointer
            ${dragActive
              ? 'border-purple-500 bg-purple-50'
              : 'border-slate-300 hover:border-slate-400 hover:bg-slate-50'
            }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => document.getElementById('vcard-file-input')?.click()}
        >
          <Upload className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <p className="text-lg font-medium text-slate-700 mb-2">
            {t.dropzone}
          </p>
          <p className="text-sm text-slate-500">
            {t.supportedFormats}
          </p>
          <input
            id="vcard-file-input"
            type="file"
            className="hidden"
            accept=".vcf"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
        </div>
      )}

      {/* Contacts list */}
      {contacts.length > 0 && (
        <>
          {/* Summary bar */}
          <Card>
            <CardBody className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-purple-600" />
                    <span className="font-medium text-slate-900">{file?.name}</span>
                  </div>
                  <span className="text-slate-500">
                    {contacts.length} {t.contactsFound}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={handleSelectAll}>
                    {t.selectAll}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleDeselectAll}>
                    {t.deselectAll}
                  </Button>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Contacts grid */}
          <div className="grid gap-3">
            {validatedContacts.map((contact, index) => (
              <div
                key={index}
                className={`p-4 border rounded-lg transition-colors cursor-pointer
                  ${selectedContacts.has(index)
                    ? 'bg-purple-50 border-purple-200'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                  }
                  ${!contact.validation.isValid ? 'opacity-60' : ''}`}
                onClick={() => contact.validation.isValid && toggleContact(index)}
              >
                <div className="flex items-start gap-4">
                  {/* Checkbox */}
                  <div className="pt-1">
                    <input
                      type="checkbox"
                      checked={selectedContacts.has(index)}
                      onChange={() => toggleContact(index)}
                      disabled={!contact.validation.isValid}
                      className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>

                  {/* Avatar */}
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-purple-600" />
                  </div>

                  {/* Contact info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-slate-900 truncate">
                        {getContactName(contact)}
                      </h4>
                      {contact.organization && (
                        <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
                          {contact.organization}
                        </span>
                      )}
                    </div>

                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
                      {contact.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="w-3.5 h-3.5" />
                          {contact.email}
                        </span>
                      )}
                      {contact.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5" />
                          {contact.phone}
                        </span>
                      )}
                      {formatAddress(contact) && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" />
                          {formatAddress(contact)}
                        </span>
                      )}
                      {contact.date_of_birth && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {contact.date_of_birth}
                        </span>
                      )}
                    </div>

                    {/* Validation status */}
                    <div className="mt-2">
                      {contact.validation.isValid ? (
                        contact.validation.warnings.length > 0 ? (
                          <span className="inline-flex items-center gap-1 text-xs text-amber-600">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            {contact.validation.warnings.map(w => t.validation[w]).join(', ')}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-green-600">
                            <Check className="w-3.5 h-3.5" />
                            {t.validation.valid}
                          </span>
                        )
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-red-600">
                          <X className="w-3.5 h-3.5" />
                          {contact.validation.errors.map(e => t.validation[e]).join(', ')}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreviewContact(contact);
                      }}
                      className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded"
                      title={t.buttons.preview}
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveContact(index);
                      }}
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded"
                      title={t.buttons.remove}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Action buttons */}
          <div className="flex justify-between items-center">
            <Button variant="secondary" onClick={onCancel}>
              {t.buttons.cancel}
            </Button>
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-500">
                {selectedContacts.size} {t.selected}
              </span>
              <Button
                variant="primary"
                icon={Users}
                onClick={handleImport}
                disabled={selectedContacts.size === 0}
              >
                {t.importSelected} ({selectedContacts.size})
              </Button>
            </div>
          </div>
        </>
      )}

      {/* Preview Modal */}
      <Modal
        isOpen={!!previewContact}
        onClose={() => setPreviewContact(null)}
        title={previewContact ? getContactName(previewContact) : t.preview}
        size="md"
      >
        {previewContact && (
          <div className="space-y-4">
            {/* Avatar and name */}
            <div className="flex items-center gap-4 pb-4 border-b border-slate-200">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-purple-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">
                  {getContactName(previewContact)}
                </h3>
                {previewContact.organization && (
                  <p className="text-slate-500 flex items-center gap-1">
                    <Building2 className="w-4 h-4" />
                    {previewContact.organization}
                  </p>
                )}
              </div>
            </div>

            {/* Contact details */}
            <div className="space-y-3">
              {previewContact.email && (
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-slate-500 uppercase">{t.fields.email}</p>
                    <p className="text-slate-900">{previewContact.email}</p>
                  </div>
                </div>
              )}

              {previewContact.phone && (
                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-slate-500 uppercase">{t.fields.phone}</p>
                    <p className="text-slate-900">{previewContact.phone}</p>
                  </div>
                </div>
              )}

              {previewContact.home_phone && (
                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-slate-500 uppercase">{t.fields.homePhone}</p>
                    <p className="text-slate-900">{previewContact.home_phone}</p>
                  </div>
                </div>
              )}

              {previewContact.work_phone && (
                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-slate-500 uppercase">{t.fields.workPhone}</p>
                    <p className="text-slate-900">{previewContact.work_phone}</p>
                  </div>
                </div>
              )}

              {formatAddress(previewContact) && (
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-slate-500 uppercase">{t.fields.address}</p>
                    <p className="text-slate-900">{formatAddress(previewContact)}</p>
                  </div>
                </div>
              )}

              {previewContact.date_of_birth && (
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-slate-500 uppercase">{t.fields.birthday}</p>
                    <p className="text-slate-900">{previewContact.date_of_birth}</p>
                  </div>
                </div>
              )}

              {previewContact.notes && (
                <div className="flex items-start gap-3">
                  <FileText className="w-5 h-5 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-slate-500 uppercase">{t.fields.notes}</p>
                    <p className="text-slate-900 whitespace-pre-wrap">{previewContact.notes}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Validation status */}
            <div className="pt-4 border-t border-slate-200">
              {previewContact.validation?.isValid ? (
                <Alert variant="success">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    {t.validation.valid}
                  </div>
                </Alert>
              ) : (
                <Alert variant="danger">
                  <div className="flex items-center gap-2">
                    <X className="w-4 h-4" />
                    {previewContact.validation?.errors.map(e => t.validation[e]).join(', ')}
                  </div>
                </Alert>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

// Export utilities for reuse
export { parseVCard, parseVCardEntry, validateContact, TRANSLATIONS };
