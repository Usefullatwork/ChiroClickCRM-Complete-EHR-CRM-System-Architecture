/**
 * Card Component
 * Reusable card container with variants
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
  TouchableOpacity,
  ViewStyle
} from 'react-native';

interface CardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  variant?: 'default' | 'elevated' | 'outlined' | 'filled';
  onPress?: () => void;
  style?: ViewStyle;
  headerRight?: React.ReactNode;
  padding?: 'none' | 'small' | 'medium' | 'large';
}

export function Card({
  children,
  title,
  subtitle,
  variant = 'default',
  onPress,
  style,
  headerRight,
  padding = 'medium'
}: CardProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const styles = createStyles(isDark, variant, padding);

  const content = (
    <>
      {(title || headerRight) && (
        <View style={styles.header}>
          <View style={styles.headerText}>
            {title && <Text style={styles.title}>{title}</Text>}
            {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
          </View>
          {headerRight}
        </View>
      )}
      <View style={styles.content}>{children}</View>
    </>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        style={[styles.container, style]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return <View style={[styles.container, style]}>{content}</View>;
}

const createStyles = (
  isDark: boolean,
  variant: 'default' | 'elevated' | 'outlined' | 'filled',
  padding: 'none' | 'small' | 'medium' | 'large'
) => {
  const paddingValues = {
    none: 0,
    small: 8,
    medium: 16,
    large: 24
  };

  const variantStyles = {
    default: {
      backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
      borderWidth: 1,
      borderColor: isDark ? '#3A3A3C' : '#E5E5EA',
      shadowOpacity: 0
    },
    elevated: {
      backgroundColor: isDark ? '#2C2C2E' : '#FFFFFF',
      borderWidth: 0,
      borderColor: 'transparent',
      shadowOpacity: isDark ? 0 : 0.1
    },
    outlined: {
      backgroundColor: 'transparent',
      borderWidth: 2,
      borderColor: isDark ? '#3A3A3C' : '#E5E5EA',
      shadowOpacity: 0
    },
    filled: {
      backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7',
      borderWidth: 0,
      borderColor: 'transparent',
      shadowOpacity: 0
    }
  };

  const { backgroundColor, borderWidth, borderColor, shadowOpacity } = variantStyles[variant];
  const paddingValue = paddingValues[padding];

  return StyleSheet.create({
    container: {
      backgroundColor,
      borderRadius: 16,
      borderWidth,
      borderColor,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity,
      shadowRadius: 8,
      elevation: variant === 'elevated' ? 4 : 0,
      overflow: 'hidden'
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      paddingHorizontal: paddingValue,
      paddingTop: paddingValue,
      paddingBottom: paddingValue > 0 ? 12 : 0
    },
    headerText: {
      flex: 1
    },
    title: {
      fontSize: 18,
      fontWeight: '600',
      color: isDark ? '#FFFFFF' : '#000000'
    },
    subtitle: {
      fontSize: 14,
      color: isDark ? '#8E8E93' : '#8E8E93',
      marginTop: 2
    },
    content: {
      paddingHorizontal: paddingValue,
      paddingBottom: paddingValue,
      paddingTop: paddingValue > 0 ? 0 : paddingValue
    }
  });
};

export default Card;
