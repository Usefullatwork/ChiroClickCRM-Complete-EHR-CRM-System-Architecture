/**
 * Login Screen
 * Phone number entry with social login options
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  useColorScheme,
  Alert,
  Image
} from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { PhoneInput, SocialButtons, Button } from '../../components';
import { useAuthStore } from '../../stores';

export default function LoginScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [phoneNumber, setPhoneNumber] = useState('');
  const [countryCode, setCountryCode] = useState('+47');
  const [isLoading, setIsLoading] = useState(false);

  const { sendOTP, signInWithGoogle, signInWithApple } = useAuthStore();

  const styles = createStyles(isDark);

  const handleSendOTP = async () => {
    if (!phoneNumber || phoneNumber.length < 8) {
      Alert.alert('Ugyldig nummer', 'Vennligst skriv inn et gyldig telefonnummer.');
      return;
    }

    setIsLoading(true);
    try {
      const fullNumber = `${countryCode}${phoneNumber.replace(/\s/g, '')}`;
      await sendOTP(fullNumber);
      router.push({
        pathname: '/(auth)/verify-otp',
        params: { phoneNumber: fullNumber }
      });
    } catch (error) {
      Alert.alert(
        'Feil',
        error instanceof Error ? error.message : 'Kunne ikke sende kode. Prøv igjen.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      await signInWithGoogle();
      router.replace('/(tabs)');
    } catch (error) {
      Alert.alert(
        'Feil',
        error instanceof Error ? error.message : 'Google-innlogging feilet.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    setIsLoading(true);
    try {
      await signInWithApple();
      router.replace('/(tabs)');
    } catch (error) {
      Alert.alert(
        'Feil',
        error instanceof Error ? error.message : 'Apple-innlogging feilet.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo & Welcome */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Text style={styles.logo}>🏃‍♂️</Text>
            </View>
            <Text style={styles.title}>ChiroClick</Text>
            <Text style={styles.subtitle}>
              Din personlige treningspartner
            </Text>
          </View>

          {/* Phone Input */}
          <View style={styles.formContainer}>
            <Text style={styles.label}>Logg inn med telefon</Text>
            <PhoneInput
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              countryCode={countryCode}
              onCountryCodeChange={setCountryCode}
              placeholder="Telefonnummer"
              editable={!isLoading}
            />

            <Button
              title={isLoading ? 'Sender...' : 'Fortsett'}
              onPress={handleSendOTP}
              loading={isLoading}
              disabled={isLoading || phoneNumber.length < 8}
              fullWidth
              size="large"
            />

            {/* Social Login */}
            <SocialButtons
              onGooglePress={handleGoogleSignIn}
              onApplePress={handleAppleSignIn}
              isLoading={isLoading}
              disabled={isLoading}
            />
          </View>

          {/* Terms */}
          <View style={styles.terms}>
            <Text style={styles.termsText}>
              Ved å fortsette godtar du våre{' '}
              <Text style={styles.termsLink}>vilkår for bruk</Text>
              {' '}og{' '}
              <Text style={styles.termsLink}>personvernerklæring</Text>
            </Text>
          </View>
        </ScrollView>
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
    scrollContent: {
      flexGrow: 1,
      paddingHorizontal: 24,
      paddingTop: 60,
      paddingBottom: 40
    },
    header: {
      alignItems: 'center',
      marginBottom: 48
    },
    logoContainer: {
      width: 100,
      height: 100,
      borderRadius: 24,
      backgroundColor: isDark ? '#1C1C1E' : '#F2F2F7',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 20
    },
    logo: {
      fontSize: 48
    },
    title: {
      fontSize: 32,
      fontWeight: 'bold',
      color: isDark ? '#FFFFFF' : '#000000',
      marginBottom: 8
    },
    subtitle: {
      fontSize: 16,
      color: isDark ? '#8E8E93' : '#8E8E93',
      textAlign: 'center'
    },
    formContainer: {
      width: '100%'
    },
    label: {
      fontSize: 14,
      fontWeight: '500',
      color: isDark ? '#EBEBF5' : '#3C3C43',
      marginBottom: 12
    },
    terms: {
      marginTop: 'auto',
      paddingTop: 24
    },
    termsText: {
      fontSize: 13,
      color: isDark ? '#8E8E93' : '#8E8E93',
      textAlign: 'center',
      lineHeight: 20
    },
    termsLink: {
      color: '#007AFF'
    }
  });
