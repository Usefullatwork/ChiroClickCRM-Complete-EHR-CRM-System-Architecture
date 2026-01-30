/**
 * Exercise Timer Component
 * Countdown timer for holds, rest periods, and timed exercises
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  Animated,
  Vibration
} from 'react-native';

type TimerMode = 'hold' | 'rest' | 'workout' | 'countdown';

interface ExerciseTimerProps {
  initialSeconds: number;
  mode?: TimerMode;
  autoStart?: boolean;
  onComplete?: () => void;
  onTick?: (remaining: number) => void;
  showControls?: boolean;
  size?: 'small' | 'medium' | 'large';
  label?: string;
}

export function ExerciseTimer({
  initialSeconds,
  mode = 'hold',
  autoStart = false,
  onComplete,
  onTick,
  showControls = true,
  size = 'medium',
  label
}: ExerciseTimerProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [seconds, setSeconds] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(autoStart);
  const [isComplete, setIsComplete] = useState(false);

  const progressAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const styles = createStyles(isDark, mode, size, isComplete);

  // Get mode configuration
  const getModeConfig = () => {
    switch (mode) {
      case 'hold':
        return { color: '#007AFF', icon: '💪', label: label || 'Hold' };
      case 'rest':
        return { color: '#34C759', icon: '😮‍💨', label: label || 'Hvile' };
      case 'workout':
        return { color: '#FF9500', icon: '🏋️', label: label || 'Trening' };
      case 'countdown':
        return { color: '#FF3B30', icon: '⏱️', label: label || 'Klar' };
      default:
        return { color: '#8E8E93', icon: '⏱️', label: label || 'Timer' };
    }
  };

  const config = getModeConfig();

  // Format time display
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    if (mins > 0) {
      return `${mins}:${remainingSecs.toString().padStart(2, '0')}`;
    }
    return secs.toString();
  };

  // Start timer
  const start = useCallback(() => {
    if (isComplete) {
      reset();
    }
    setIsRunning(true);
  }, [isComplete]);

  // Pause timer
  const pause = useCallback(() => {
    setIsRunning(false);
  }, []);

  // Reset timer
  const reset = useCallback(() => {
    setIsRunning(false);
    setIsComplete(false);
    setSeconds(initialSeconds);
    progressAnim.setValue(1);
  }, [initialSeconds]);

  // Timer tick effect
  useEffect(() => {
    if (isRunning && seconds > 0) {
      intervalRef.current = setInterval(() => {
        setSeconds(prev => {
          const newValue = prev - 1;
          onTick?.(newValue);

          // Update progress animation
          Animated.timing(progressAnim, {
            toValue: newValue / initialSeconds,
            duration: 1000,
            useNativeDriver: false
          }).start();

          // Vibrate at key moments
          if (newValue === 3 || newValue === 2 || newValue === 1) {
            Vibration.vibrate(100);
          }

          return newValue;
        });
      }, 1000);
    } else if (seconds === 0 && isRunning) {
      setIsRunning(false);
      setIsComplete(true);
      Vibration.vibrate([0, 200, 100, 200]); // Double vibrate on complete
      onComplete?.();
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, seconds, initialSeconds, onComplete, onTick]);

  // Pulse animation when running
  useEffect(() => {
    if (isRunning) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 500,
            useNativeDriver: true
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true
          })
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isRunning]);

  // Get circle dimensions based on size
  const getCircleSize = () => {
    switch (size) {
      case 'small':
        return 80;
      case 'large':
        return 180;
      default:
        return 140;
    }
  };

  const circleSize = getCircleSize();
  const strokeWidth = size === 'small' ? 4 : size === 'large' ? 8 : 6;
  const radius = (circleSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <View style={styles.container}>
      {/* Label */}
      <View style={styles.labelContainer}>
        <Text style={styles.modeIcon}>{config.icon}</Text>
        <Text style={styles.label}>{config.label}</Text>
      </View>

      {/* Timer Circle */}
      <Animated.View style={[styles.circleContainer, { transform: [{ scale: pulseAnim }] }]}>
        {/* Background Circle */}
        <View style={[styles.circle, { width: circleSize, height: circleSize }]}>
          <View style={[styles.circleBackground, { borderWidth: strokeWidth }]} />

          {/* Progress Circle */}
          <Animated.View
            style={[
              styles.circleProgress,
              {
                borderWidth: strokeWidth,
                borderColor: config.color,
                transform: [{
                  rotate: progressAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['360deg', '0deg']
                  })
                }]
              }
            ]}
          />

          {/* Time Display */}
          <View style={styles.timeContainer}>
            <Text style={[styles.time, { color: config.color }]}>
              {formatTime(seconds)}
            </Text>
            {!isComplete && (
              <Text style={styles.secondsLabel}>
                {seconds === 1 ? 'sekund' : 'sekunder'}
              </Text>
            )}
            {isComplete && (
              <Text style={styles.completeText}>Ferdig!</Text>
            )}
          </View>
        </View>
      </Animated.View>

      {/* Controls */}
      {showControls && (
        <View style={styles.controls}>
          {!isComplete ? (
            <>
              <TouchableOpacity
                style={[styles.controlButton, styles.secondaryButton]}
                onPress={reset}
              >
                <Text style={styles.secondaryButtonText}>↺</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.controlButton, styles.primaryButton, { backgroundColor: config.color }]}
                onPress={isRunning ? pause : start}
              >
                <Text style={styles.primaryButtonText}>
                  {isRunning ? '⏸' : '▶'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.controlButton, styles.secondaryButton]}
                onPress={() => setSeconds(prev => prev + 10)}
              >
                <Text style={styles.secondaryButtonText}>+10</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              style={[styles.controlButton, styles.primaryButton, { backgroundColor: config.color }]}
              onPress={reset}
            >
              <Text style={styles.primaryButtonText}>Start på nytt</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

const createStyles = (
  isDark: boolean,
  mode: TimerMode,
  size: 'small' | 'medium' | 'large',
  isComplete: boolean
) =>
  StyleSheet.create({
    container: {
      alignItems: 'center'
    },
    labelContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: size === 'small' ? 8 : 16
    },
    modeIcon: {
      fontSize: size === 'small' ? 16 : 20,
      marginRight: 6
    },
    label: {
      fontSize: size === 'small' ? 14 : 16,
      fontWeight: '600',
      color: isDark ? '#FFFFFF' : '#000000'
    },
    circleContainer: {
      marginBottom: size === 'small' ? 8 : 16
    },
    circle: {
      position: 'relative',
      justifyContent: 'center',
      alignItems: 'center'
    },
    circleBackground: {
      position: 'absolute',
      width: '100%',
      height: '100%',
      borderRadius: 1000,
      borderColor: isDark ? '#3A3A3C' : '#E5E5EA'
    },
    circleProgress: {
      position: 'absolute',
      width: '100%',
      height: '100%',
      borderRadius: 1000,
      borderTopColor: 'transparent',
      borderRightColor: 'transparent'
    },
    timeContainer: {
      alignItems: 'center'
    },
    time: {
      fontSize: size === 'small' ? 24 : size === 'large' ? 48 : 36,
      fontWeight: 'bold',
      fontVariant: ['tabular-nums']
    },
    secondsLabel: {
      fontSize: size === 'small' ? 10 : 12,
      color: isDark ? '#8E8E93' : '#8E8E93',
      marginTop: 2
    },
    completeText: {
      fontSize: size === 'small' ? 12 : 14,
      fontWeight: '600',
      color: '#34C759',
      marginTop: 4
    },
    controls: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12
    },
    controlButton: {
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 25,
      minWidth: 50,
      alignItems: 'center',
      justifyContent: 'center'
    },
    primaryButton: {
      paddingHorizontal: 24
    },
    secondaryButton: {
      backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7'
    },
    primaryButtonText: {
      fontSize: 18,
      color: '#FFFFFF',
      fontWeight: '600'
    },
    secondaryButtonText: {
      fontSize: 16,
      color: isDark ? '#FFFFFF' : '#000000',
      fontWeight: '500'
    }
  });

export default ExerciseTimer;
