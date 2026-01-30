/**
 * Streak Badge Component
 * Shows current workout streak with fire animation
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  useColorScheme
} from 'react-native';

interface StreakBadgeProps {
  streak: number;
  longestStreak?: number;
  showLongest?: boolean;
  size?: 'small' | 'medium' | 'large';
  animated?: boolean;
}

export function StreakBadge({
  streak,
  longestStreak,
  showLongest = false,
  size = 'medium',
  animated = true
}: StreakBadgeProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    if (animated && streak > 0) {
      // Pulse animation for active streak
      Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.1,
            duration: 500,
            useNativeDriver: true
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true
          })
        ])
      ).start();

      // Glow animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true
          }),
          Animated.timing(glowAnim, {
            toValue: 0.5,
            duration: 1000,
            useNativeDriver: true
          })
        ])
      ).start();
    }
  }, [streak, animated]);

  const styles = createStyles(isDark, size);

  // Determine fire emoji based on streak length
  const getFireEmoji = () => {
    if (streak === 0) return '❄️';
    if (streak < 3) return '🔥';
    if (streak < 7) return '🔥🔥';
    if (streak < 14) return '🔥🔥🔥';
    if (streak < 30) return '💥';
    return '⚡';
  };

  // Get streak message
  const getStreakMessage = () => {
    if (streak === 0) return 'Start din streak!';
    if (streak === 1) return '1 dag i strekk!';
    if (streak < 7) return `${streak} dager i strekk!`;
    if (streak < 30) return `${streak} dager! Fantastisk!`;
    return `${streak} dager! Utrolig!`;
  };

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.badgeContainer,
          streak > 0 && styles.activeStreak,
          {
            transform: [{ scale: streak > 0 ? scaleAnim : 1 }],
            opacity: streak > 0 ? glowAnim : 1
          }
        ]}
      >
        <Text style={styles.fireEmoji}>{getFireEmoji()}</Text>
        <Text style={styles.streakNumber}>{streak}</Text>
      </Animated.View>

      <Text style={styles.streakMessage}>{getStreakMessage()}</Text>

      {showLongest && longestStreak !== undefined && longestStreak > 0 && (
        <View style={styles.longestContainer}>
          <Text style={styles.longestLabel}>Lengste streak:</Text>
          <Text style={styles.longestValue}>{longestStreak} dager</Text>
        </View>
      )}
    </View>
  );
}

const createStyles = (isDark: boolean, size: 'small' | 'medium' | 'large') => {
  const sizeConfig = {
    small: { badge: 60, emoji: 20, number: 20, message: 12 },
    medium: { badge: 80, emoji: 28, number: 28, message: 14 },
    large: { badge: 100, emoji: 36, number: 36, message: 16 }
  };

  const { badge, emoji, number, message } = sizeConfig[size];

  return StyleSheet.create({
    container: {
      alignItems: 'center'
    },
    badgeContainer: {
      width: badge,
      height: badge,
      borderRadius: badge / 2,
      backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 8
    },
    activeStreak: {
      backgroundColor: isDark ? '#3D2C00' : '#FFF3E0',
      borderWidth: 2,
      borderColor: '#FF9500'
    },
    fireEmoji: {
      fontSize: emoji,
      marginBottom: 2
    },
    streakNumber: {
      fontSize: number,
      fontWeight: 'bold',
      color: isDark ? '#FFFFFF' : '#000000'
    },
    streakMessage: {
      fontSize: message,
      color: isDark ? '#8E8E93' : '#8E8E93',
      textAlign: 'center'
    },
    longestContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 8,
      paddingHorizontal: 12,
      paddingVertical: 4,
      backgroundColor: isDark ? '#1C1C1E' : '#F9F9F9',
      borderRadius: 12
    },
    longestLabel: {
      fontSize: 12,
      color: isDark ? '#8E8E93' : '#8E8E93',
      marginRight: 4
    },
    longestValue: {
      fontSize: 12,
      fontWeight: '600',
      color: isDark ? '#FF9500' : '#FF9500'
    }
  });
};

export default StreakBadge;
