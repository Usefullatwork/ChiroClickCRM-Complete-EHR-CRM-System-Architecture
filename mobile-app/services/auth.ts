/**
 * Authentication Service
 * Handles phone OTP and social sign-in
 */

import { post, setToken, setRefreshToken, removeToken, MobileUser, ApiResponse } from './api';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import * as AppleAuthentication from 'expo-apple-authentication';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Complete auth session for web
WebBrowser.maybeCompleteAuthSession();

// Types
export interface SendOTPResponse {
  success: boolean;
  message?: string;
  expiresIn?: number;
}

export interface VerifyOTPResponse {
  token: string;
  refreshToken: string;
  user: MobileUser;
  isNewUser: boolean;
}

export interface SocialAuthResponse {
  token: string;
  refreshToken: string;
  user: MobileUser;
  isNewUser: boolean;
}

// Phone OTP Authentication
export async function sendOTP(phoneNumber: string): Promise<ApiResponse<SendOTPResponse>> {
  // Ensure phone number has country code
  const formattedPhone = phoneNumber.startsWith('+')
    ? phoneNumber
    : `+47${phoneNumber.replace(/\s/g, '')}`;

  return post<SendOTPResponse>('/mobile/auth/send-otp', {
    phoneNumber: formattedPhone
  });
}

export async function verifyOTP(
  phoneNumber: string,
  code: string
): Promise<ApiResponse<VerifyOTPResponse>> {
  const formattedPhone = phoneNumber.startsWith('+')
    ? phoneNumber
    : `+47${phoneNumber.replace(/\s/g, '')}`;

  const response = await post<VerifyOTPResponse>('/mobile/auth/verify-otp', {
    phoneNumber: formattedPhone,
    code
  });

  if (response.success && response.data) {
    await setToken(response.data.token);
    await setRefreshToken(response.data.refreshToken);
  }

  return response;
}

export async function resendOTP(phoneNumber: string): Promise<ApiResponse<SendOTPResponse>> {
  return sendOTP(phoneNumber);
}

// Google Sign-In
export function useGoogleAuth() {
  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: Constants.expoConfig?.extra?.googleClientId,
    iosClientId: Constants.expoConfig?.extra?.googleIosClientId,
    androidClientId: Constants.expoConfig?.extra?.googleAndroidClientId,
    webClientId: Constants.expoConfig?.extra?.googleWebClientId
  });

  return { request, response, promptAsync };
}

export async function authenticateWithGoogle(
  idToken: string
): Promise<ApiResponse<SocialAuthResponse>> {
  const response = await post<SocialAuthResponse>('/mobile/auth/social', {
    provider: 'google',
    idToken
  });

  if (response.success && response.data) {
    await setToken(response.data.token);
    await setRefreshToken(response.data.refreshToken);
  }

  return response;
}

// Apple Sign-In
export async function authenticateWithApple(): Promise<ApiResponse<SocialAuthResponse>> {
  if (Platform.OS !== 'ios') {
    return {
      success: false,
      error: 'Apple Sign-In is only available on iOS'
    };
  }

  try {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL
      ]
    });

    const response = await post<SocialAuthResponse>('/mobile/auth/social', {
      provider: 'apple',
      idToken: credential.identityToken,
      user: {
        email: credential.email,
        fullName: credential.fullName
          ? `${credential.fullName.givenName || ''} ${credential.fullName.familyName || ''}`.trim()
          : undefined
      }
    });

    if (response.success && response.data) {
      await setToken(response.data.token);
      await setRefreshToken(response.data.refreshToken);
    }

    return response;
  } catch (error: any) {
    if (error.code === 'ERR_REQUEST_CANCELED') {
      return {
        success: false,
        error: 'Sign-in was canceled'
      };
    }
    return {
      success: false,
      error: error.message || 'Apple Sign-In failed'
    };
  }
}

// Check if Apple Sign-In is available
export async function isAppleSignInAvailable(): Promise<boolean> {
  if (Platform.OS !== 'ios') return false;

  try {
    return await AppleAuthentication.isAvailableAsync();
  } catch {
    return false;
  }
}

// Logout
export async function logout(): Promise<void> {
  try {
    // Notify backend of logout (optional - for token invalidation)
    await post('/mobile/auth/logout', {});
  } catch {
    // Continue with local logout even if backend fails
  }

  await removeToken();
}

// Get current user
export async function getCurrentUser(): Promise<ApiResponse<MobileUser>> {
  const { get } = await import('./api');
  return get<MobileUser>('/mobile/auth/me');
}

// Update user profile
export async function updateProfile(data: {
  displayName?: string;
  avatarUrl?: string;
  preferredLanguage?: string;
  notificationTime?: string;
}): Promise<ApiResponse<MobileUser>> {
  const { patch } = await import('./api');
  return patch<MobileUser>('/mobile/auth/me', data);
}

// Register device for push notifications
export async function registerDeviceToken(token: string): Promise<ApiResponse<void>> {
  return post('/mobile/device-token', { token });
}

// Unregister device
export async function unregisterDeviceToken(token: string): Promise<ApiResponse<void>> {
  const { del } = await import('./api');
  return del(`/mobile/device-token/${token}`);
}

export default {
  sendOTP,
  verifyOTP,
  resendOTP,
  useGoogleAuth,
  authenticateWithGoogle,
  authenticateWithApple,
  isAppleSignInAvailable,
  logout,
  getCurrentUser,
  updateProfile,
  registerDeviceToken,
  unregisterDeviceToken
};
