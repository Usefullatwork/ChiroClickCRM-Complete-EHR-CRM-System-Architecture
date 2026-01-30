/**
 * Auth Store - Zustand state management for authentication
 */

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authApi, userApi, storeTokens, clearTokens, initializeAuth, User } from '../services/api';

interface AuthState {
  // State
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  currentStreak: number;
  longestStreak: number;

  // Actions
  initialize: () => Promise<void>;
  sendOTP: (phoneNumber: string) => Promise<{ success: boolean; expiresIn: number }>;
  verifyOTP: (phoneNumber: string, code: string) => Promise<boolean>;
  signInWithGoogle: (idToken: string) => Promise<boolean>;
  signInWithApple: (identityToken: string, user?: any) => Promise<boolean>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  // Initial state
  user: null,
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false,
  currentStreak: 0,
  longestStreak: 0,

  // Initialize auth from stored tokens
  initialize: async () => {
    try {
      set({ isLoading: true });

      const hasTokens = await initializeAuth();

      if (hasTokens) {
        try {
          const profile = await userApi.getProfile();
          set({
            user: profile,
            isAuthenticated: true,
            currentStreak: profile.currentStreak,
            longestStreak: profile.longestStreak
          });
        } catch (error) {
          // Token invalid, clear
          await clearTokens();
          set({ user: null, isAuthenticated: false });
        }
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
    } finally {
      set({ isLoading: false, isInitialized: true });
    }
  },

  // Send OTP to phone number
  sendOTP: async (phoneNumber: string) => {
    set({ isLoading: true });
    try {
      const result = await authApi.sendOTP(phoneNumber);
      return result;
    } finally {
      set({ isLoading: false });
    }
  },

  // Verify OTP and login
  verifyOTP: async (phoneNumber: string, code: string) => {
    set({ isLoading: true });
    try {
      const result = await authApi.verifyOTP(phoneNumber, code);

      await storeTokens(result.tokens);

      set({
        user: result.user,
        isAuthenticated: true
      });

      // Fetch full profile with streak
      try {
        const profile = await userApi.getProfile();
        set({
          currentStreak: profile.currentStreak,
          longestStreak: profile.longestStreak
        });
      } catch (error) {
        // Profile fetch failed, but auth succeeded
      }

      return true;
    } catch (error) {
      console.error('OTP verification error:', error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  // Google Sign-In
  signInWithGoogle: async (idToken: string) => {
    set({ isLoading: true });
    try {
      const result = await authApi.googleSignIn(idToken);

      await storeTokens(result.tokens);

      set({
        user: result.user,
        isAuthenticated: true
      });

      // Fetch profile with streak
      try {
        const profile = await userApi.getProfile();
        set({
          currentStreak: profile.currentStreak,
          longestStreak: profile.longestStreak
        });
      } catch (error) {}

      return true;
    } catch (error) {
      console.error('Google sign-in error:', error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  // Apple Sign-In
  signInWithApple: async (identityToken: string, user?: any) => {
    set({ isLoading: true });
    try {
      const result = await authApi.appleSignIn(identityToken, user);

      await storeTokens(result.tokens);

      set({
        user: result.user,
        isAuthenticated: true
      });

      // Fetch profile with streak
      try {
        const profile = await userApi.getProfile();
        set({
          currentStreak: profile.currentStreak,
          longestStreak: profile.longestStreak
        });
      } catch (error) {}

      return true;
    } catch (error) {
      console.error('Apple sign-in error:', error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  // Logout
  logout: async () => {
    set({ isLoading: true });
    try {
      const stored = await AsyncStorage.getItem('auth_tokens');
      if (stored) {
        const tokens = JSON.parse(stored);
        await authApi.logout(tokens.refreshToken).catch(() => {});
      }

      await clearTokens();

      set({
        user: null,
        isAuthenticated: false,
        currentStreak: 0,
        longestStreak: 0
      });
    } finally {
      set({ isLoading: false });
    }
  },

  // Update profile
  updateProfile: async (updates: Partial<User>) => {
    set({ isLoading: true });
    try {
      const updatedUser = await userApi.updateProfile(updates);
      set({ user: updatedUser });
    } finally {
      set({ isLoading: false });
    }
  },

  // Refresh profile from server
  refreshProfile: async () => {
    try {
      const profile = await userApi.getProfile();
      set({
        user: profile,
        currentStreak: profile.currentStreak,
        longestStreak: profile.longestStreak
      });
    } catch (error) {
      console.error('Profile refresh error:', error);
    }
  }
}));
