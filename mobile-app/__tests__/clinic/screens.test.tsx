/**
 * Clinic Screens - Basic Render Tests
 */

import React from 'react';

// Mock expo-router
jest.mock('expo-router', () => ({
  router: { push: jest.fn(), replace: jest.fn() },
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
  Stack: { Screen: () => null },
}));

// Mock stores
jest.mock('../../stores', () => ({
  useClinicStore: () => ({
    messages: [],
    unreadCount: 0,
    documents: [],
    bookingRequests: [],
    isLoading: false,
    error: null,
    fetchMessages: jest.fn(),
    fetchDocuments: jest.fn(),
    fetchBookingRequests: jest.fn(),
    requestAppointment: jest.fn(),
    sendMessage: jest.fn(),
    markRead: jest.fn(),
    clearError: jest.fn(),
  }),
  useAuthStore: () => ({ user: null, isAuthenticated: false }),
}));

// Mock api
jest.mock('../../services/api', () => ({
  bookingApi: {
    getAvailableSlots: jest.fn().mockResolvedValue({ slots: [] }),
  },
  documentApi: {
    getDownloadUrl: jest.fn().mockReturnValue('https://example.com/download'),
  },
  messageApi: {},
}));

// Mock react-native
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  return {
    ...RN,
    useColorScheme: () => 'light',
    Linking: { openURL: jest.fn() },
    Alert: { alert: jest.fn() },
  };
});

describe('Clinic Screens', () => {
  it('MessagesScreen module loads without error', async () => {
    const mod = await import('../../app/clinic/messages');
    expect(mod).toBeDefined();
    expect(mod.default).toBeDefined();
  });

  it('DocumentsScreen module loads without error', async () => {
    const mod = await import('../../app/clinic/documents');
    expect(mod).toBeDefined();
    expect(mod.default).toBeDefined();
  });

  it('BookingScreen module loads without error', async () => {
    const mod = await import('../../app/clinic/booking');
    expect(mod).toBeDefined();
    expect(mod.default).toBeDefined();
  });
});
