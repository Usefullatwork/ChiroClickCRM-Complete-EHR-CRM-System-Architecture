/**
 * OTP Verification Screen
 * Enter 6-digit code sent via SMS
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  useColorScheme,
  Alert
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { OTPInput, Button } from '../../components';
import { useAuthStore } from '../../stores';

export default function VerifyOTPScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { phoneNumber } = useLocalSearchParams<{ phoneNumber: string }>();

  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  const { verifyOTP, sendOTP } = useAuthStore();

  const styles = createStyles(isDark);

  // Countdown timer for resend
  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => {
        setResendCountdown(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [resendCountdown]);

  const handleVerify = async () => {
    if (code.length !== 6) {
      Alert.alert('Ugyldig kode', 'Vennligst skriv inn alle 6 sifrene.');
      return;
    }

    setIsLoading(true);
    try {
      await verifyOTP(phoneNumber || '', code);
      router.replace('/(tabs)');
    } catch (error) {
      Alert.alert(
        'Feil',
        error instanceof Error ? error.message : 'Ugyldig kode. Prøv igjen.'
      );
      setCode('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;

    setIsLoading(true);
    try {
      await sendOTP(phoneNumber || '');
      setResendCountdown(60);
      setCanResend(false);
      Alert.alert('Sendt!', 'En ny kode har blitt sendt til telefonen din.');
    } catch (error) {
      Alert.alert(
        'Feil',
        error instanceof Error ? error.message : 'Kunne ikke sende ny kode.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCodeComplete = (completedCode: string) => {
    setCode(completedCode);
    // Auto-verify when code is complete
    if (completedCode.length === 6) {
      setTimeout(() => handleVerify(), 300);
    }
  };

  // Format phone number for display
  const formatPhoneNumber = (phone: string) => {
    if (!phone) return '';
    // Format: +47 XXX XX XXX
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length > 10) {
      const countryCode = cleaned.slice(0, 2);
      const rest = cleaned.slice(2);
      return `+${countryCode} ${rest.slice(0, 3)} ${rest.slice(3, 5)} ${rest.slice(5)}`;
    }
    return phone;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          {/* Header */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>

          {/* Title */}
          <View style={styles.header}>
            <Text style={styles.title}>Verifiser nummer</Text>
            <Text style={styles.subtitle}>
              Vi har sendt en 6-sifret kode til
            </Text>
            <Text style={styles.phoneNumber}>
              {formatPhoneNumber(phoneNumber || '')}
            </Text>
          </View>

          {/* OTP Input */}
          <View style={styles.otpContainer}>
            <OTPInput
              length={6}
              value={code}
              onChange={setCode}
              onComplete={handleCodeComplete}
              disabled={isLoading}
            />
          </View>

          {/* Verify Button */}
          <Button
            title={isLoading ? 'Verifiserer...' : 'Bekreft'}
            onPress={handleVerify}
            loading={isLoading}
            disabled={isLoading || code.length !== 6}
            fullWidth
            size="large"
          />

          {/* Resend */}
          <View style={styles.resendContainer}>
            <Text style={styles.resendText}>Fikk du ikke koden? </Text>
            {canResend ? (
              <TouchableOpacity onPress={handleResend} disabled={isLoading}>
                <Text style={styles.resendLink}>Send på nytt</Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.countdown}>
                Vent {resendCountdown} sekunder
              </Text>
            )}
          </View>

          {/* Help */}
          <View style={styles.helpContainer}>
            <Text style={styles.helpText}>
              Sjekk at nummeret er riktig og at du har dekning.
              Koden utløper etter 10 minutter.
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? '#000000' : '#FFFFFF'
    },
    keyboardView: {
      flex: 1
    },
    content: {
      flex: 1,
      paddingHorizontal: 24,
      paddingTop: 16
    },
    backButton: {
      width: 44,
      height: 44,
      justifyContent: 'center',
      alignItems: 'center',
      marginLeft: -12
    },
    backIcon: {
      fontSize: 28,
      color: isDark ? '#FFFFFF' : '#000000'
    },
    header: {
      marginTop: 24,
      marginBottom: 40
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      color: isDark ? '#FFFFFF' : '#000000',
      marginBottom: 12
    },
    subtitle: {
      fontSize: 16,
      color: isDark ? '#8E8E93' : '#8E8E93'
    },
    phoneNumber: {
      fontSize: 18,
      fontWeight: '600',
      color: isDark ? '#FFFFFF' : '#000000',
      marginTop: 4
    },
    otpContainer: {
      marginBottom: 32
    },
    resendContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 24
    },
    resendText: {
      fontSize: 14,
      color: isDark ? '#8E8E93' : '#8E8E93'
    },
    resendLink: {
      fontSize: 14,
      color: '#007AFF',
      fontWeight: '600'
    },
    countdown: {
      fontSize: 14,
      color: isDark ? '#636366' : '#AEAEB2'
    },
    helpContainer: {
      marginTop: 'auto',
      paddingVertical: 24
    },
    helpText: {
      fontSize: 13,
      color: isDark ? '#8E8E93' : '#8E8E93',
      textAlign: 'center',
      lineHeight: 20
    }
  });
