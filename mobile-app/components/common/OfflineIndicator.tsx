/**
 * Offline Indicator Component
 * Shows when device is offline with sync status
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  useColorScheme,
  TouchableOpacity
} from 'react-native';
import NetInfo from '@react-native-community/netinfo';

interface OfflineIndicatorProps {
  pendingSync?: number;
  onRetry?: () => void;
  showWhenOnline?: boolean;
}

export function OfflineIndicator({
  pendingSync = 0,
  onRetry,
  showWhenOnline = false
}: OfflineIndicatorProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [isConnected, setIsConnected] = useState<boolean | null>(true);
  const [connectionType, setConnectionType] = useState<string>('unknown');
  const slideAnim = useRef(new Animated.Value(-60)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Subscribe to network state updates
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected);
      setConnectionType(state.type);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // Slide animation
    Animated.timing(slideAnim, {
      toValue: (!isConnected || (showWhenOnline && pendingSync > 0)) ? 0 : -60,
      duration: 300,
      useNativeDriver: true
    }).start();

    // Pulse animation for offline state
    if (!isConnected) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.6,
            duration: 1000,
            useNativeDriver: true
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true
          })
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isConnected, pendingSync, showWhenOnline]);

  const styles = createStyles(isDark, isConnected ?? true);

  const getMessage = () => {
    if (!isConnected) {
      return 'Du er frakoblet';
    }
    if (pendingSync > 0) {
      return `Synkroniserer ${pendingSync} ${pendingSync === 1 ? 'element' : 'elementer'}...`;
    }
    return 'Tilkoblet';
  };

  const getIcon = () => {
    if (!isConnected) return '📵';
    if (pendingSync > 0) return '🔄';
    return '✅';
  };

  const getSubMessage = () => {
    if (!isConnected) {
      return 'Endringene dine lagres lokalt';
    }
    if (pendingSync > 0) {
      return 'Vennligst ikke lukk appen';
    }
    return null;
  };

  // Don't render if online and no pending sync (unless showWhenOnline)
  if (isConnected && pendingSync === 0 && !showWhenOnline) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        { transform: [{ translateY: slideAnim }] }
      ]}
    >
      <View style={styles.content}>
        {/* Icon */}
        <Animated.View style={{ opacity: pulseAnim }}>
          <Text style={styles.icon}>{getIcon()}</Text>
        </Animated.View>

        {/* Message */}
        <View style={styles.messageContainer}>
          <Text style={styles.message}>{getMessage()}</Text>
          {getSubMessage() && (
            <Text style={styles.subMessage}>{getSubMessage()}</Text>
          )}
        </View>

        {/* Retry Button */}
        {!isConnected && onRetry && (
          <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
            <Text style={styles.retryText}>Prøv igjen</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Progress Bar for syncing */}
      {isConnected && pendingSync > 0 && (
        <View style={styles.progressContainer}>
          <Animated.View style={styles.progressBar} />
        </View>
      )}
    </Animated.View>
  );
}

/**
 * Hook to track online/offline status
 */
export function useNetworkStatus() {
  const [isConnected, setIsConnected] = useState<boolean | null>(true);
  const [connectionType, setConnectionType] = useState<string>('unknown');

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected);
      setConnectionType(state.type);
    });

    return () => unsubscribe();
  }, []);

  return { isConnected, connectionType };
}

const createStyles = (isDark: boolean, isConnected: boolean) =>
  StyleSheet.create({
    container: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      backgroundColor: isConnected
        ? (isDark ? '#1E3A2F' : '#E8F5E9')
        : (isDark ? '#3A2020' : '#FFEBEE'),
      paddingTop: 50, // Account for status bar
      paddingBottom: 12,
      paddingHorizontal: 16,
      zIndex: 1000,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 4
    },
    content: {
      flexDirection: 'row',
      alignItems: 'center'
    },
    icon: {
      fontSize: 20,
      marginRight: 12
    },
    messageContainer: {
      flex: 1
    },
    message: {
      fontSize: 14,
      fontWeight: '600',
      color: isConnected
        ? (isDark ? '#34C759' : '#2E7D32')
        : (isDark ? '#FF6B6B' : '#C62828')
    },
    subMessage: {
      fontSize: 12,
      color: isDark ? '#8E8E93' : '#757575',
      marginTop: 2
    },
    retryButton: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
      borderRadius: 8
    },
    retryText: {
      fontSize: 12,
      fontWeight: '600',
      color: '#007AFF'
    },
    progressContainer: {
      height: 2,
      backgroundColor: isDark ? '#2C2C2E' : '#E0E0E0',
      marginTop: 8,
      borderRadius: 1,
      overflow: 'hidden'
    },
    progressBar: {
      height: '100%',
      width: '30%',
      backgroundColor: '#34C759',
      borderRadius: 1
    }
  });

export default OfflineIndicator;
