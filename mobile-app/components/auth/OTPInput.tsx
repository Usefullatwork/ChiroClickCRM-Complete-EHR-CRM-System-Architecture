/**
 * OTP Input Component
 * 6-digit verification code input with auto-focus
 */

import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  useColorScheme,
  Keyboard,
  Platform
} from 'react-native';

interface OTPInputProps {
  length?: number;
  value: string;
  onChange: (code: string) => void;
  onComplete?: (code: string) => void;
  disabled?: boolean;
  error?: string;
  autoFocus?: boolean;
}

export function OTPInput({
  length = 6,
  value,
  onChange,
  onComplete,
  disabled = false,
  error,
  autoFocus = true
}: OTPInputProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const inputRefs = useRef<(TextInput | null)[]>([]);
  const [focusedIndex, setFocusedIndex] = useState(autoFocus ? 0 : -1);

  // Convert value to array of digits
  const digits = value.split('').slice(0, length);
  while (digits.length < length) {
    digits.push('');
  }

  useEffect(() => {
    if (autoFocus && inputRefs.current[0]) {
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
    }
  }, [autoFocus]);

  useEffect(() => {
    // Call onComplete when all digits entered
    if (value.length === length && onComplete) {
      onComplete(value);
    }
  }, [value, length, onComplete]);

  const handleKeyPress = (index: number, key: string) => {
    if (key === 'Backspace') {
      if (digits[index] === '' && index > 0) {
        // Move to previous input if current is empty
        const newValue = value.slice(0, index - 1) + value.slice(index);
        onChange(newValue);
        inputRefs.current[index - 1]?.focus();
      } else {
        // Clear current digit
        const newValue = value.slice(0, index) + value.slice(index + 1);
        onChange(newValue);
      }
    }
  };

  const handleChange = (index: number, text: string) => {
    // Only accept single digit
    const digit = text.replace(/[^\d]/g, '').slice(-1);

    if (digit) {
      // Build new value
      let newValue = '';
      for (let i = 0; i < length; i++) {
        if (i === index) {
          newValue += digit;
        } else if (i < value.length) {
          newValue += value[i];
        }
      }

      onChange(newValue);

      // Move to next input
      if (index < length - 1) {
        inputRefs.current[index + 1]?.focus();
      } else {
        // Last digit, dismiss keyboard
        Keyboard.dismiss();
      }
    }
  };

  const handleFocus = (index: number) => {
    setFocusedIndex(index);
  };

  const handleBlur = () => {
    setFocusedIndex(-1);
  };

  const styles = createStyles(isDark);

  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        {digits.map((digit, index) => (
          <View
            key={index}
            style={[
              styles.digitContainer,
              focusedIndex === index && styles.digitFocused,
              error && styles.digitError
            ]}
          >
            <TextInput
              ref={(ref) => (inputRefs.current[index] = ref)}
              style={styles.digitInput}
              value={digit}
              onChangeText={(text) => handleChange(index, text)}
              onKeyPress={({ nativeEvent }) => handleKeyPress(index, nativeEvent.key)}
              onFocus={() => handleFocus(index)}
              onBlur={handleBlur}
              keyboardType="number-pad"
              maxLength={1}
              editable={!disabled}
              selectTextOnFocus
              caretHidden={Platform.OS === 'ios'}
            />
          </View>
        ))}
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const createStyles = (isDark: boolean) =>
  StyleSheet.create({
    container: {
      width: '100%',
      alignItems: 'center'
    },
    inputContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 8
    },
    digitContainer: {
      width: 48,
      height: 56,
      borderRadius: 12,
      backgroundColor: isDark ? '#1C1C1E' : '#F2F2F7',
      borderWidth: 2,
      borderColor: isDark ? '#3A3A3C' : '#E5E5EA',
      justifyContent: 'center',
      alignItems: 'center'
    },
    digitFocused: {
      borderColor: '#007AFF'
    },
    digitError: {
      borderColor: '#FF3B30'
    },
    digitInput: {
      width: '100%',
      height: '100%',
      fontSize: 24,
      fontWeight: '600',
      textAlign: 'center',
      color: isDark ? '#FFFFFF' : '#000000'
    },
    errorText: {
      color: '#FF3B30',
      fontSize: 14,
      marginTop: 12,
      textAlign: 'center'
    }
  });

export default OTPInput;
