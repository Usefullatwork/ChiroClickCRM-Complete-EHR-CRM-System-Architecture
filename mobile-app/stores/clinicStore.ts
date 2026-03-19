/**
 * Clinic Store - Zustand state management for clinic connectivity
 * Manages messages, documents, and booking requests
 */

import { create } from 'zustand';
import {
  messageApi,
  documentApi,
  bookingApi,
  Message,
  PatientDocument,
  BookingRequest,
} from '../services/api';

interface ClinicState {
  // State
  messages: Message[];
  unreadCount: number;
  documents: PatientDocument[];
  bookingRequests: BookingRequest[];
  isLoading: boolean;
  error: string | null;

  // Message actions
  fetchMessages: (page?: number) => Promise<void>;
  sendMessage: (body: string, subject?: string, parentId?: string) => Promise<void>;
  markRead: (messageId: string) => Promise<void>;

  // Document actions
  fetchDocuments: () => Promise<void>;

  // Booking actions
  fetchBookingRequests: () => Promise<void>;
  requestAppointment: (data: {
    preferredDate: string;
    preferredTime?: string;
    reason?: string;
  }) => Promise<void>;

  // Utility
  clearError: () => void;
}

export const useClinicStore = create<ClinicState>((set, get) => ({
  messages: [],
  unreadCount: 0,
  documents: [],
  bookingRequests: [],
  isLoading: false,
  error: null,

  fetchMessages: async (page = 1) => {
    set({ isLoading: true, error: null });
    try {
      const result = await messageApi.getMessages({ page });
      set({ messages: result.messages, unreadCount: result.unread_count });
    } catch (error: any) {
      set({ error: error.message });
    } finally {
      set({ isLoading: false });
    }
  },

  sendMessage: async (body, subject, parentId) => {
    set({ isLoading: true, error: null });
    try {
      await messageApi.sendMessage(body, subject, parentId);
      await get().fetchMessages();
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  markRead: async (messageId) => {
    try {
      await messageApi.markRead(messageId);
      set((state) => ({
        messages: state.messages.map((m) =>
          m.id === messageId ? { ...m, is_read: true } : m
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }));
    } catch (_error: any) {
      // Silent fail — mark-read is best-effort
    }
  },

  fetchDocuments: async () => {
    set({ isLoading: true, error: null });
    try {
      const result = await documentApi.getDocuments();
      set({ documents: result.documents });
    } catch (error: any) {
      set({ error: error.message });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchBookingRequests: async () => {
    set({ isLoading: true, error: null });
    try {
      const requests = await bookingApi.getBookingRequests();
      set({ bookingRequests: requests });
    } catch (error: any) {
      set({ error: error.message });
    } finally {
      set({ isLoading: false });
    }
  },

  requestAppointment: async (data) => {
    set({ isLoading: true, error: null });
    try {
      await bookingApi.requestAppointment(data);
      await get().fetchBookingRequests();
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
