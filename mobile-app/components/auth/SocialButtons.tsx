/**
 * Social Login Buttons
 * Google and Apple Sign-In buttons
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  useColorScheme,
  ActivityIndicator
} from 'react-native';

interface SocialButtonsProps {
  onGooglePress: () => void;
  onApplePress: () => void;
  isLoading?: boolean;
  disabled?: boolean;
}

export function SocialButtons({
  onGooglePress,
  onApplePress,
  isLoading = false,
  disabled = false
}: SocialButtonsProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const styles = createStyles(isDark);

  return (
    <View style={styles.container}>
      {/* Divider */}
      <View style={styles.dividerContainer}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>eller fortsett med</Text>
        <View style={styles.dividerLine} />
      </View>

      {/* Social Buttons */}
      <View style={styles.buttonsContainer}>
        {/* Google Button */}
        <TouchableOpacity
          style={styles.socialButton}
          onPress={onGooglePress}
          disabled={disabled || isLoading}
          activeOpacity={0.7}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={isDark ? '#FFFFFF' : '#000000'} />
          ) : (
            <>
              <GoogleIcon />
              <Text style={styles.buttonText}>Google</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Apple Button (iOS only, but show on all for consistency) */}
        <TouchableOpacity
          style={[styles.socialButton, styles.appleButton]}
          onPress={onApplePress}
          disabled={disabled || isLoading}
          activeOpacity={0.7}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <AppleIcon />
              <Text style={[styles.buttonText, styles.appleButtonText]}>Apple</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

// Google Icon Component
function GoogleIcon() {
  return (
    <View style={{ width: 20, height: 20, marginRight: 8 }}>
      <Text style={{ fontSize: 18 }}>G</Text>
    </View>
  );
}

// Apple Icon Component
function AppleIcon() {
  return (
    <View style={{ width: 20, height: 20, marginRight: 8 }}>
      <Text style={{ fontSize: 18, color: '#FFFFFF' }}>🍎</Text>
    </View>
  );
}

const createStyles = (isDark: boolean) =>
  StyleSheet.create({
    container: {
      width: '100%',
      marginTop: 24
    },
    dividerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 20
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: isDark ? '#3A3A3C' : '#E5E5EA'
    },
    dividerText: {
      paddingHorizontal: 12,
      fontSize: 14,
      color: isDark ? '#8E8E93' : '#8E8E93'
    },
    buttonsContainer: {
      flexDirection: 'row',
      gap: 12
    },
    socialButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 14,
      borderRadius: 12,
      backgroundColor: isDark ? '#1C1C1E' : '#F2F2F7',
      borderWidth: 1,
      borderColor: isDark ? '#3A3A3C' : '#E5E5EA'
    },
    appleButton: {
      backgroundColor: '#000000',
      borderColor: '#000000'
    },
    buttonText: {
      fontSize: 16,
      fontWeight: '600',
      color: isDark ? '#FFFFFF' : '#000000'
    },
    appleButtonText: {
      color: '#FFFFFF'
    }
  });

export default SocialButtons;
