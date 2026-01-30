/**
 * Exercise Card Component
 * Displays exercise info with thumbnail and progress indicator
 */

import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  useColorScheme
} from 'react-native';
import { Exercise, TodayExercise } from '../../services/api';

interface ExerciseCardProps {
  exercise: Exercise | TodayExercise;
  onPress?: () => void;
  showSetsReps?: boolean;
  completed?: boolean;
  compact?: boolean;
}

export function ExerciseCard({
  exercise,
  onPress,
  showSetsReps = false,
  completed = false,
  compact = false
}: ExerciseCardProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Determine exercise name (handle both Exercise and TodayExercise types)
  const name = 'nameNorwegian' in exercise
    ? (exercise.nameNorwegian || exercise.name)
    : (exercise.name_norwegian || exercise.name);

  const category = exercise.category;
  const thumbnailUrl = 'thumbnailUrl' in exercise
    ? exercise.thumbnailUrl
    : exercise.thumbnail_url;

  // Get sets/reps for TodayExercise
  const sets = 'sets' in exercise ? exercise.sets : undefined;
  const reps = 'reps' in exercise ? exercise.reps : undefined;
  const holdSeconds = 'holdSeconds' in exercise ? exercise.holdSeconds : undefined;

  const styles = createStyles(isDark, compact);

  return (
    <TouchableOpacity
      style={[styles.container, completed && styles.containerCompleted]}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={!onPress}
    >
      {/* Thumbnail */}
      <View style={styles.thumbnailContainer}>
        {thumbnailUrl ? (
          <Image
            source={{ uri: thumbnailUrl }}
            style={styles.thumbnail}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.thumbnail, styles.placeholderThumbnail]}>
            <Text style={styles.placeholderText}>🏃</Text>
          </View>
        )}

        {/* Completed Overlay */}
        {completed && (
          <View style={styles.completedOverlay}>
            <Text style={styles.checkmark}>✓</Text>
          </View>
        )}
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={2}>
          {name}
        </Text>

        <Text style={styles.category}>{category}</Text>

        {showSetsReps && (sets || reps || holdSeconds) && (
          <View style={styles.setsRepsContainer}>
            {sets && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{sets} sett</Text>
              </View>
            )}
            {reps && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{reps} reps</Text>
              </View>
            )}
            {holdSeconds && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{holdSeconds}s hold</Text>
              </View>
            )}
          </View>
        )}
      </View>

      {/* Chevron */}
      {onPress && (
        <View style={styles.chevronContainer}>
          <Text style={styles.chevron}>›</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const createStyles = (isDark: boolean, compact: boolean) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
      borderRadius: 12,
      padding: compact ? 8 : 12,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: isDark ? '#3A3A3C' : '#E5E5EA',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: isDark ? 0 : 0.05,
      shadowRadius: 2,
      elevation: 1
    },
    containerCompleted: {
      backgroundColor: isDark ? '#1E3A2F' : '#E8F5E9',
      borderColor: isDark ? '#2E5A4F' : '#A5D6A7'
    },
    thumbnailContainer: {
      position: 'relative'
    },
    thumbnail: {
      width: compact ? 50 : 70,
      height: compact ? 50 : 70,
      borderRadius: 8,
      backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7'
    },
    placeholderThumbnail: {
      justifyContent: 'center',
      alignItems: 'center'
    },
    placeholderText: {
      fontSize: compact ? 20 : 28
    },
    completedOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(76, 175, 80, 0.7)',
      borderRadius: 8,
      justifyContent: 'center',
      alignItems: 'center'
    },
    checkmark: {
      fontSize: compact ? 20 : 28,
      color: '#FFFFFF',
      fontWeight: 'bold'
    },
    content: {
      flex: 1,
      marginLeft: 12
    },
    name: {
      fontSize: compact ? 14 : 16,
      fontWeight: '600',
      color: isDark ? '#FFFFFF' : '#000000',
      marginBottom: 2
    },
    category: {
      fontSize: compact ? 12 : 14,
      color: isDark ? '#8E8E93' : '#8E8E93',
      textTransform: 'capitalize'
    },
    setsRepsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginTop: 6,
      gap: 4
    },
    badge: {
      backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7',
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 4
    },
    badgeText: {
      fontSize: 11,
      color: isDark ? '#EBEBF5' : '#3C3C43',
      fontWeight: '500'
    },
    chevronContainer: {
      paddingLeft: 8
    },
    chevron: {
      fontSize: 24,
      color: isDark ? '#48484A' : '#C7C7CC',
      fontWeight: '300'
    }
  });

export default ExerciseCard;
