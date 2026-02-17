/* eslint-disable no-console */
/**
 * GoogleContactsService - Integration with Google People API
 *
 * Provides two-way synchronization between ChiroClickCRM patients
 * and Google Contacts for seamless contact management.
 *
 * Requires Google Cloud Console setup:
 * 1. Enable Google People API
 * 2. Create OAuth 2.0 credentials
 * 3. Add authorized JavaScript origins and redirect URIs
 */

import React from 'react';

// Google API configuration
const GOOGLE_CONFIG = {
  // These should be set via environment variables or settings
  clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
  apiKey: import.meta.env.VITE_GOOGLE_API_KEY || '',
  scopes: [
    'https://www.googleapis.com/auth/contacts',
    'https://www.googleapis.com/auth/contacts.other.readonly',
  ].join(' '),
  discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/people/v1/rest'],
};

// Contact group name for ChiroClickCRM contacts
const CRM_CONTACT_GROUP = 'ChiroClickCRM Patients';

class GoogleContactsService {
  constructor() {
    this.isInitialized = false;
    this.isSignedIn = false;
    this.gapi = null;
    this.tokenClient = null;
    this.contactGroupId = null;
  }

  /**
   * Initialize the Google API client
   */
  async initialize() {
    if (this.isInitialized) {
      return true;
    }

    return new Promise((resolve, reject) => {
      // Load the gapi script if not already loaded
      if (!window.gapi) {
        const script = document.createElement('script');
        script.src = 'https://apis.google.com/js/api.js';
        script.onload = () => this._initGapi().then(resolve).catch(reject);
        script.onerror = () => reject(new Error('Failed to load Google API script'));
        document.body.appendChild(script);
      } else {
        this._initGapi().then(resolve).catch(reject);
      }
    });
  }

  async _initGapi() {
    return new Promise((resolve, reject) => {
      window.gapi.load('client', async () => {
        try {
          await window.gapi.client.init({
            apiKey: GOOGLE_CONFIG.apiKey,
            discoveryDocs: GOOGLE_CONFIG.discoveryDocs,
          });
          this.gapi = window.gapi;
          this.isInitialized = true;

          // Load Google Identity Services for OAuth
          await this._loadGoogleIdentityServices();
          resolve(true);
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  async _loadGoogleIdentityServices() {
    return new Promise((resolve, reject) => {
      if (window.google?.accounts?.oauth2) {
        this._initTokenClient();
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.onload = () => {
        this._initTokenClient();
        resolve();
      };
      script.onerror = () => reject(new Error('Failed to load Google Identity Services'));
      document.body.appendChild(script);
    });
  }

  _initTokenClient() {
    this.tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CONFIG.clientId,
      scope: GOOGLE_CONFIG.scopes,
      callback: (response) => {
        if (response.error) {
          console.error('Google OAuth error:', response.error);
          return;
        }
        this.isSignedIn = true;
        // Store token in session
        sessionStorage.setItem('google_access_token', response.access_token);
      },
    });
  }

  /**
   * Check if user is currently signed in to Google
   */
  isAuthenticated() {
    const token = sessionStorage.getItem('google_access_token');
    return !!token && this.isSignedIn;
  }

  /**
   * Sign in to Google
   */
  async signIn() {
    if (!this.isInitialized) {
      await this.initialize();
    }

    return new Promise((resolve, reject) => {
      try {
        this.tokenClient.callback = (response) => {
          if (response.error) {
            reject(new Error(response.error));
            return;
          }
          this.isSignedIn = true;
          sessionStorage.setItem('google_access_token', response.access_token);
          resolve(response);
        };
        this.tokenClient.requestAccessToken({ prompt: 'consent' });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Sign out from Google
   */
  signOut() {
    const token = sessionStorage.getItem('google_access_token');
    if (token) {
      window.google.accounts.oauth2.revoke(token, () => {
        console.log('Google access revoked');
      });
    }
    sessionStorage.removeItem('google_access_token');
    this.isSignedIn = false;
  }

  /**
   * Get or create the ChiroClickCRM contact group
   */
  async getOrCreateContactGroup() {
    if (this.contactGroupId) {
      return this.contactGroupId;
    }

    try {
      // List existing contact groups
      const response = await this.gapi.client.people.contactGroups.list({
        pageSize: 100,
      });

      const groups = response.result.contactGroups || [];
      const existingGroup = groups.find((g) => g.name === CRM_CONTACT_GROUP);

      if (existingGroup) {
        this.contactGroupId = existingGroup.resourceName;
        return this.contactGroupId;
      }

      // Create new contact group
      const createResponse = await this.gapi.client.people.contactGroups.create({
        resource: {
          contactGroup: {
            name: CRM_CONTACT_GROUP,
          },
        },
      });

      this.contactGroupId = createResponse.result.resourceName;
      return this.contactGroupId;
    } catch (error) {
      console.error('Error managing contact group:', error);
      throw error;
    }
  }

  /**
   * Convert patient data to Google Contact format
   */
  _patientToGoogleContact(patient) {
    const contact = {
      names: [
        {
          givenName: patient.first_name,
          familyName: patient.last_name,
        },
      ],
      phoneNumbers: [],
      emailAddresses: [],
      addresses: [],
      organizations: [],
      biographies: [],
      userDefined: [
        {
          key: 'ChiroClickCRM_PatientID',
          value: String(patient.id),
        },
      ],
    };

    // Add phone numbers
    if (patient.phone) {
      contact.phoneNumbers.push({
        value: patient.phone,
        type: 'mobile',
      });
    }
    if (patient.home_phone) {
      contact.phoneNumbers.push({
        value: patient.home_phone,
        type: 'home',
      });
    }
    if (patient.work_phone) {
      contact.phoneNumbers.push({
        value: patient.work_phone,
        type: 'work',
      });
    }

    // Add email
    if (patient.email) {
      contact.emailAddresses.push({
        value: patient.email,
        type: 'home',
      });
    }

    // Add address
    if (patient.address || patient.city || patient.postal_code) {
      contact.addresses.push({
        streetAddress: patient.address || '',
        city: patient.city || '',
        postalCode: patient.postal_code || '',
        country: patient.country || 'Norway',
        type: 'home',
      });
    }

    // Add birthday
    if (patient.date_of_birth) {
      const dob = new Date(patient.date_of_birth);
      contact.birthdays = [
        {
          date: {
            year: dob.getFullYear(),
            month: dob.getMonth() + 1,
            day: dob.getDate(),
          },
        },
      ];
    }

    // Add notes
    if (patient.notes) {
      contact.biographies.push({
        value: patient.notes,
        contentType: 'TEXT_PLAIN',
      });
    }

    return contact;
  }

  /**
   * Convert Google Contact to patient format
   */
  _googleContactToPatient(contact) {
    const patient = {
      google_contact_id: contact.resourceName,
      first_name: contact.names?.[0]?.givenName || '',
      last_name: contact.names?.[0]?.familyName || '',
      email: contact.emailAddresses?.[0]?.value || '',
      phone: '',
      home_phone: '',
      work_phone: '',
      address: '',
      city: '',
      postal_code: '',
      country: '',
      date_of_birth: null,
      notes: '',
    };

    // Extract phone numbers by type
    contact.phoneNumbers?.forEach((phone) => {
      if (phone.type === 'mobile' && !patient.phone) {
        patient.phone = phone.value;
      } else if (phone.type === 'home' && !patient.home_phone) {
        patient.home_phone = phone.value;
      } else if (phone.type === 'work' && !patient.work_phone) {
        patient.work_phone = phone.value;
      } else if (!patient.phone) {
        patient.phone = phone.value;
      }
    });

    // Extract address
    const address = contact.addresses?.[0];
    if (address) {
      patient.address = address.streetAddress || '';
      patient.city = address.city || '';
      patient.postal_code = address.postalCode || '';
      patient.country = address.country || '';
    }

    // Extract birthday
    const birthday = contact.birthdays?.[0]?.date;
    if (birthday) {
      patient.date_of_birth = `${birthday.year}-${String(birthday.month).padStart(2, '0')}-${String(birthday.day).padStart(2, '0')}`;
    }

    // Extract notes
    patient.notes = contact.biographies?.[0]?.value || '';

    // Extract ChiroClickCRM patient ID if exists
    const crmId = contact.userDefined?.find((u) => u.key === 'ChiroClickCRM_PatientID');
    if (crmId) {
      patient.crm_patient_id = parseInt(crmId.value, 10);
    }

    return patient;
  }

  /**
   * Sync a single patient to Google Contacts
   */
  async syncPatientToGoogle(patient) {
    if (!this.isAuthenticated()) {
      throw new Error('Not authenticated with Google');
    }

    try {
      const contactGroupId = await this.getOrCreateContactGroup();
      const contactData = this._patientToGoogleContact(patient);

      // Check if contact already exists (by email or patient ID)
      const existingContact = await this._findExistingContact(patient);

      if (existingContact) {
        // Update existing contact
        const response = await this.gapi.client.people.people.updateContact({
          resourceName: existingContact.resourceName,
          updatePersonFields:
            'names,phoneNumbers,emailAddresses,addresses,birthdays,biographies,userDefined',
          resource: contactData,
        });
        return { action: 'updated', contact: response.result };
      } else {
        // Create new contact
        const response = await this.gapi.client.people.people.createContact({
          resource: contactData,
        });

        // Add to ChiroClickCRM contact group
        await this.gapi.client.people.contactGroups.members.modify({
          resourceName: contactGroupId,
          resource: {
            resourceNamesToAdd: [response.result.resourceName],
          },
        });

        return { action: 'created', contact: response.result };
      }
    } catch (error) {
      console.error('Error syncing patient to Google:', error);
      throw error;
    }
  }

  /**
   * Find existing Google contact for a patient
   */
  async _findExistingContact(patient) {
    try {
      // Search by email first
      if (patient.email) {
        const response = await this.gapi.client.people.people.searchContacts({
          query: patient.email,
          readMask: 'names,emailAddresses,userDefined',
        });

        if (response.result.results?.length > 0) {
          return response.result.results[0].person;
        }
      }

      // Search by patient ID in user defined fields
      const allContacts = await this.getAllGoogleContacts();
      return allContacts.find((c) => {
        const crmId = c.userDefined?.find((u) => u.key === 'ChiroClickCRM_PatientID');
        return crmId && parseInt(crmId.value, 10) === patient.id;
      });
    } catch (error) {
      console.error('Error finding existing contact:', error);
      return null;
    }
  }

  /**
   * Get all contacts from Google (from ChiroClickCRM group)
   */
  async getAllGoogleContacts() {
    if (!this.isAuthenticated()) {
      throw new Error('Not authenticated with Google');
    }

    try {
      const contactGroupId = await this.getOrCreateContactGroup();

      const response = await this.gapi.client.people.people.connections.list({
        resourceName: 'people/me',
        pageSize: 1000,
        personFields:
          'names,phoneNumbers,emailAddresses,addresses,birthdays,biographies,userDefined,memberships',
      });

      const contacts = response.result.connections || [];

      // Filter to only contacts in the ChiroClickCRM group
      return contacts.filter((contact) =>
        contact.memberships?.some(
          (m) => m.contactGroupMembership?.contactGroupResourceName === contactGroupId
        )
      );
    } catch (error) {
      console.error('Error fetching Google contacts:', error);
      throw error;
    }
  }

  /**
   * Import contacts from Google to ChiroClickCRM
   */
  async importFromGoogle() {
    const googleContacts = await this.getAllGoogleContacts();
    return googleContacts.map((contact) => this._googleContactToPatient(contact));
  }

  /**
   * Export all patients to Google Contacts
   */
  async exportToGoogle(patients) {
    const results = {
      created: 0,
      updated: 0,
      errors: [],
    };

    for (const patient of patients) {
      try {
        const result = await this.syncPatientToGoogle(patient);
        if (result.action === 'created') {
          results.created++;
        }
        if (result.action === 'updated') {
          results.updated++;
        }
      } catch (error) {
        results.errors.push({
          patient: `${patient.first_name} ${patient.last_name}`,
          error: error.message,
        });
      }
    }

    return results;
  }

  /**
   * Delete a contact from Google
   */
  async deleteGoogleContact(resourceName) {
    if (!this.isAuthenticated()) {
      throw new Error('Not authenticated with Google');
    }

    try {
      await this.gapi.client.people.people.deleteContact({
        resourceName,
      });
      return true;
    } catch (error) {
      console.error('Error deleting Google contact:', error);
      throw error;
    }
  }
}

// Singleton instance
let googleContactsInstance = null;

/**
 * Get or create the Google Contacts service instance
 */
export function getGoogleContactsService() {
  if (!googleContactsInstance) {
    googleContactsInstance = new GoogleContactsService();
  }
  return googleContactsInstance;
}

/**
 * React hook for using Google Contacts
 */
export function useGoogleContacts() {
  const [isLoading, setIsLoading] = React.useState(false);
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [error, setError] = React.useState(null);

  const service = React.useMemo(() => getGoogleContactsService(), []);

  React.useEffect(() => {
    // Check initial auth state
    setIsAuthenticated(service.isAuthenticated());
  }, [service]);

  const initialize = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      await service.initialize();
      setIsAuthenticated(service.isAuthenticated());
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [service]);

  const signIn = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      await service.signIn();
      setIsAuthenticated(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [service]);

  const signOut = React.useCallback(() => {
    service.signOut();
    setIsAuthenticated(false);
  }, [service]);

  const syncPatient = React.useCallback(
    async (patient) => {
      setIsLoading(true);
      setError(null);
      try {
        return await service.syncPatientToGoogle(patient);
      } catch (err) {
        setError(err.message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [service]
  );

  const importContacts = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      return await service.importFromGoogle();
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [service]);

  const exportContacts = React.useCallback(
    async (patients) => {
      setIsLoading(true);
      setError(null);
      try {
        return await service.exportToGoogle(patients);
      } catch (err) {
        setError(err.message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [service]
  );

  return {
    isLoading,
    isAuthenticated,
    error,
    initialize,
    signIn,
    signOut,
    syncPatient,
    importContacts,
    exportContacts,
    service,
  };
}

export default GoogleContactsService;
