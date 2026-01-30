/**
 * Program Card Component
 * Shows program overview with progress indicator
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

type ProgramType = 'rehabilitation' | 'hypertrophy' | 'strength' | 'mobility';
type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';

interface ProgramCardProps {
  id: string;
  name: string;
  nameNorwegian?: string;
  description?: string;
  programType: ProgramType;
  durationWeeks: number;
  difficultyLevel: DifficultyLevel;
  coverImageUrl?: string;
  // Enrollment info (if enrolled)
  enrolled?: boolean;
  currentWeek?: number;
  completionPercentage?: number;
  onPress?: () => void;
  compact?: boolean;
}

export function ProgramCard({
  name,
  nameNorwegian,
  description,
  programType,
  durationWeeks,
  difficultyLevel,
  coverImageUrl,
  enrolled = false,
  currentWeek,
  completionPercentage = 0,
  onPress,
  compact = false
}: ProgramCardProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const styles = createStyles(isDark, compact, enrolled);

  const displayName = nameNorwegian || name;

  // Get program type label and icon
  const getProgramTypeInfo = () => {
    switch (programType) {
      case 'rehabilitation':
        return { label: 'Rehabilitering', icon: '🏥', color: '#007AFF' };
      case 'hypertrophy':
        return { label: 'Muskelvekst', icon: '💪', color: '#FF9500' };
      case 'strength':
        return { label: 'Styrke', icon: '🏋️', color: '#FF3B30' };
      case 'mobility':
        return { label: 'Mobilitet', icon: '🧘', color: '#34C759' };
      default:
        return { label: 'Program', icon: '📋', color: '#8E8E93' };
    }
  };

  // Get difficulty label
  const getDifficultyLabel = () => {
    switch (difficultyLevel) {
      case 'beginner':
        return 'Nybegynner';
      case 'intermediate':
        return 'Middels';
      case 'advanced':
        return 'Avansert';
      default:
        return '';
    }
  };

  const typeInfo = getProgramTypeInfo();

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={!onPress}
    >
      {/* Cover Image */}
      <View style={styles.imageContainer}>
        {coverImageUrl ? (
          <Image
            source={{ uri: coverImageUrl }}
            style={styles.coverImage}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.coverImage, styles.placeholderImage]}>
            <Text style={styles.placeholderIcon}>{typeInfo.icon}</Text>
          </View>
        )}

        {/* Type Badge */}
        <View style={[styles.typeBadge, { backgroundColor: typeInfo.color }]}>
          <Text style={styles.typeBadgeText}>{typeInfo.label}</Text>
        </View>

        {/* Progress Overlay (if enrolled) */}
        {enrolled && (
          <View style={styles.progressOverlay}>
            <View style={styles.progressBarBackground}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${completionPercentage}%` }
                ]}
              />
            </View>
            <Text style={styles.progressText}>{completionPercentage}%</Text>
          </View>
        )}
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={compact ? 1 : 2}>
          {displayName}
        </Text>

        {!compact && description && (
          <Text style={styles.description} numberOfLines={2}>
            {description}
          </Text>
        )}

        {/* Meta Info */}
        <View style={styles.metaContainer}>
          <View style={styles.metaItem}>
            <Text style={styles.metaIcon}>📅</Text>
            <Text style={styles.metaText}>{durationWeeks} uker</Text>
          </View>

          <View style={styles.metaItem}>
            <Text style={styles.metaIcon}>📊</Text>
            <Text style={styles.metaText}>{getDifficultyLabel()}</Text>
          </View>

          {enrolled && currentWeek && (
            <View style={[styles.metaItem, styles.activeWeek]}>
              <Text style={styles.metaIcon}>🎯</Text>
              <Text style={styles.activeWeekText}>Uke {currentWeek}</Text>
            </View>
          )}
        </View>
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

const createStyles = (isDark: boolean, compact: boolean, enrolled: boolean) =>
  StyleSheet.create({
    container: {
      flexDirection: compact ? 'row' : 'column',
      backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
      borderRadius: 16,
      overflow: 'hidden',
      borderWidth: enrolled ? 2 : 1,
      borderColor: enrolled ? '#007AFF' : (isDark ? '#3A3A3C' : '#E5E5EA'),
      marginBottom: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0 : 0.05,
      shadowRadius: 4,
      elevation: 2
    },
    imageContainer: {
      width: compact ? 100 : '100%',
      height: compact ? 100 : 140,
      position: 'relative'
    },
    coverImage: {
      width: '100%',
      height: '100%',
      backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7'
    },
    placeholderImage: {
      justifyContent: 'center',
      alignItems: 'center'
    },
    placeholderIcon: {
      fontSize: compact ? 32 : 48
    },
    typeBadge: {
      position: 'absolute',
      top: 8,
      left: 8,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6
    },
    typeBadgeText: {
      fontSize: 11,
      fontWeight: '600',
      color: '#FFFFFF'
    },
    progressOverlay: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      padding: 8,
      flexDirection: 'row',
      alignItems: 'center'
    },
    progressBarBackground: {
      flex: 1,
      height: 4,
      backgroundColor: 'rgba(255, 255, 255, 0.3)',
      borderRadius: 2,
      marginRight: 8
    },
    progressBarFill: {
      height: '100%',
      backgroundColor: '#34C759',
      borderRadius: 2
    },
    progressText: {
      fontSize: 12,
      fontWeight: '600',
      color: '#FFFFFF'
    },
    content: {
      flex: 1,
      padding: compact ? 12 : 16
    },
    name: {
      fontSize: compact ? 16 : 18,
      fontWeight: '600',
      color: isDark ? '#FFFFFF' : '#000000',
      marginBottom: 4
    },
    description: {
      fontSize: 14,
      color: isDark ? '#8E8E93' : '#8E8E93',
      marginBottom: 8,
      lineHeight: 20
    },
    metaContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginTop: compact ? 4 : 0
    },
    metaItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6
    },
    metaIcon: {
      fontSize: 12,
      marginRight: 4
    },
    metaText: {
      fontSize: 12,
      color: isDark ? '#EBEBF5' : '#3C3C43'
    },
    activeWeek: {
      backgroundColor: isDark ? '#1E3A5C' : '#E3F2FD'
    },
    activeWeekText: {
      fontSize: 12,
      color: '#007AFF',
      fontWeight: '600'
    },
    chevronContainer: {
      justifyContent: 'center',
      paddingRight: 12
    },
    chevron: {
      fontSize: 24,
      color: isDark ? '#48484A' : '#C7C7CC',
      fontWeight: '300'
    }
  });

export default ProgramCard;
