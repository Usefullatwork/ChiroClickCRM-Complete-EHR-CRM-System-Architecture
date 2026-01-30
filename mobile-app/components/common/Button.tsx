/**
 * Button Component
 * Reusable button with variants and loading state
 */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  useColorScheme,
  ViewStyle,
  TextStyle
} from 'react-native';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'small' | 'medium' | 'large';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  fullWidth = false,
  icon,
  style,
  textStyle
}: ButtonProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const styles = createStyles(isDark, variant, size, fullWidth);

  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      style={[
        styles.button,
        isDisabled && styles.buttonDisabled,
        style
      ]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={getLoadingColor(variant, isDark)}
        />
      ) : (
        <>
          {icon}
          <Text style={[styles.text, textStyle]}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

function getLoadingColor(variant: ButtonVariant, isDark: boolean): string {
  switch (variant) {
    case 'primary':
      return '#FFFFFF';
    case 'danger':
      return '#FFFFFF';
    case 'secondary':
    case 'outline':
    case 'ghost':
      return isDark ? '#FFFFFF' : '#007AFF';
    default:
      return '#FFFFFF';
  }
}

const createStyles = (
  isDark: boolean,
  variant: ButtonVariant,
  size: ButtonSize,
  fullWidth: boolean
) => {
  // Size configurations
  const sizeStyles = {
    small: { paddingVertical: 8, paddingHorizontal: 16, fontSize: 14, borderRadius: 8 },
    medium: { paddingVertical: 14, paddingHorizontal: 24, fontSize: 16, borderRadius: 12 },
    large: { paddingVertical: 18, paddingHorizontal: 32, fontSize: 18, borderRadius: 14 }
  };

  // Variant configurations
  const variantStyles = {
    primary: {
      backgroundColor: '#007AFF',
      borderColor: '#007AFF',
      textColor: '#FFFFFF'
    },
    secondary: {
      backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7',
      borderColor: isDark ? '#3A3A3C' : '#E5E5EA',
      textColor: isDark ? '#FFFFFF' : '#000000'
    },
    outline: {
      backgroundColor: 'transparent',
      borderColor: '#007AFF',
      textColor: '#007AFF'
    },
    ghost: {
      backgroundColor: 'transparent',
      borderColor: 'transparent',
      textColor: '#007AFF'
    },
    danger: {
      backgroundColor: '#FF3B30',
      borderColor: '#FF3B30',
      textColor: '#FFFFFF'
    }
  };

  const { paddingVertical, paddingHorizontal, fontSize, borderRadius } = sizeStyles[size];
  const { backgroundColor, borderColor, textColor } = variantStyles[variant];

  return StyleSheet.create({
    button: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical,
      paddingHorizontal,
      borderRadius,
      backgroundColor,
      borderWidth: variant === 'outline' ? 2 : 0,
      borderColor,
      width: fullWidth ? '100%' : 'auto',
      minHeight: size === 'small' ? 36 : size === 'medium' ? 48 : 56
    },
    buttonDisabled: {
      opacity: 0.5
    },
    text: {
      fontSize,
      fontWeight: '600',
      color: textColor,
      textAlign: 'center'
    }
  });
};

export default Button;
