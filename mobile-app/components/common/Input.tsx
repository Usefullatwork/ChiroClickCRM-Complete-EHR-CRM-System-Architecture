/**
 * Input Component
 * Reusable text input with variants and validation
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  useColorScheme,
  TouchableOpacity,
  TextInputProps,
  Animated
} from 'react-native';

interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
  helper?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onRightIconPress?: () => void;
  variant?: 'default' | 'filled' | 'outlined';
  size?: 'small' | 'medium' | 'large';
  fullWidth?: boolean;
}

export function Input({
  label,
  error,
  helper,
  leftIcon,
  rightIcon,
  onRightIconPress,
  variant = 'default',
  size = 'medium',
  fullWidth = true,
  ...textInputProps
}: InputProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [isFocused, setIsFocused] = useState(false);
  const focusAnim = useRef(new Animated.Value(0)).current;

  const styles = createStyles(isDark, variant, size, fullWidth, !!error, isFocused);

  const handleFocus = (e: any) => {
    setIsFocused(true);
    Animated.timing(focusAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: false
    }).start();
    textInputProps.onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    Animated.timing(focusAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: false
    }).start();
    textInputProps.onBlur?.(e);
  };

  const borderColor = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [
      error ? '#FF3B30' : (isDark ? '#3A3A3C' : '#E5E5EA'),
      error ? '#FF3B30' : '#007AFF'
    ]
  });

  return (
    <View style={styles.container}>
      {/* Label */}
      {label && (
        <Text style={styles.label}>{label}</Text>
      )}

      {/* Input Container */}
      <Animated.View style={[styles.inputContainer, { borderColor }]}>
        {/* Left Icon */}
        {leftIcon && (
          <View style={styles.leftIconContainer}>
            {leftIcon}
          </View>
        )}

        {/* Text Input */}
        <TextInput
          style={styles.input}
          placeholderTextColor={isDark ? '#636366' : '#AEAEB2'}
          {...textInputProps}
          onFocus={handleFocus}
          onBlur={handleBlur}
        />

        {/* Right Icon */}
        {rightIcon && (
          <TouchableOpacity
            style={styles.rightIconContainer}
            onPress={onRightIconPress}
            disabled={!onRightIconPress}
          >
            {rightIcon}
          </TouchableOpacity>
        )}
      </Animated.View>

      {/* Error or Helper Text */}
      {(error || helper) && (
        <Text style={[styles.helperText, error && styles.errorText]}>
          {error || helper}
        </Text>
      )}
    </View>
  );
}

const createStyles = (
  isDark: boolean,
  variant: 'default' | 'filled' | 'outlined',
  size: 'small' | 'medium' | 'large',
  fullWidth: boolean,
  hasError: boolean,
  isFocused: boolean
) => {
  const sizeConfig = {
    small: { height: 40, fontSize: 14, paddingHorizontal: 12, borderRadius: 8 },
    medium: { height: 48, fontSize: 16, paddingHorizontal: 16, borderRadius: 12 },
    large: { height: 56, fontSize: 18, paddingHorizontal: 20, borderRadius: 14 }
  };

  const variantConfig = {
    default: {
      backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
      borderWidth: 1
    },
    filled: {
      backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7',
      borderWidth: 0
    },
    outlined: {
      backgroundColor: 'transparent',
      borderWidth: 2
    }
  };

  const { height, fontSize, paddingHorizontal, borderRadius } = sizeConfig[size];
  const { backgroundColor, borderWidth } = variantConfig[variant];

  return StyleSheet.create({
    container: {
      width: fullWidth ? '100%' : 'auto',
      marginBottom: 16
    },
    label: {
      fontSize: 14,
      fontWeight: '500',
      color: isDark ? '#EBEBF5' : '#3C3C43',
      marginBottom: 8
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      height,
      backgroundColor,
      borderWidth,
      borderRadius,
      overflow: 'hidden'
    },
    leftIconContainer: {
      paddingLeft: paddingHorizontal,
      paddingRight: 8
    },
    input: {
      flex: 1,
      height: '100%',
      fontSize,
      color: isDark ? '#FFFFFF' : '#000000',
      paddingHorizontal
    },
    rightIconContainer: {
      paddingRight: paddingHorizontal,
      paddingLeft: 8
    },
    helperText: {
      fontSize: 12,
      color: isDark ? '#8E8E93' : '#8E8E93',
      marginTop: 6
    },
    errorText: {
      color: '#FF3B30'
    }
  });
};

export default Input;
