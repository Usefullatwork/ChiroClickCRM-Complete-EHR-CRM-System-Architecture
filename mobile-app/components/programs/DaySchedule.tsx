/**
 * Day Schedule Component
 * Shows detailed schedule for a specific day
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
  TouchableOpacity,
  Image
} from 'react-native';

interface ScheduledExercise {
  id: string;
  exerciseId: string;
  name: string;
  nameNorwegian?: string;
  category: string;
  thumbnailUrl?: string;
  sets?: number;
  reps?: string;
  holdSeconds?: number;
  restSeconds?: number;
  rirTarget?: number;
  notes?: string;
  completed?: boolean;
  orderIndex: number;
}

interface DayScheduleProps {
  dayOfWeek: number;
  date?: Date;
  exercises: ScheduledExercise[];
  isToday?: boolean;
  onExercisePress?: (exercise: ScheduledExercise) => void;
  onMarkComplete?: (exerciseId: string) => void;
  onStartWorkout?: () => void;
}

const DAY_NAMES = ['Søndag', 'Mandag', 'Tirsdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lørdag'];

export function DaySchedule({
  dayOfWeek,
  date,
  exercises,
  isToday = false,
  onExercisePress,
  onMarkComplete,
  onStartWorkout
}: DayScheduleProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const styles = createStyles(isDark, isToday);

  // Sort exercises by order index
  const sortedExercises = [...exercises].sort((a, b) => a.orderIndex - b.orderIndex);

  // Calculate completion stats
  const completedCount = exercises.filter(e => e.completed).length;
  const totalCount = exercises.length;
  const isComplete = completedCount === totalCount && totalCount > 0;

  // Format date
  const formatDate = () => {
    if (!date) return '';
    return date.toLocaleDateString('no-NO', { day: 'numeric', month: 'short' });
  };

  // Get total workout duration estimate
  const estimatedDuration = () => {
    let seconds = 0;
    exercises.forEach(ex => {
      const sets = ex.sets || 1;
      const repsTime = 3; // 3 seconds per rep
      const reps = parseInt(ex.reps?.split('-')[0] || '10');
      const hold = ex.holdSeconds || 0;
      const rest = ex.restSeconds || 60;
      seconds += sets * ((reps * repsTime) + hold + rest);
    });
    const minutes = Math.round(seconds / 60);
    return minutes;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.dayName}>{DAY_NAMES[dayOfWeek]}</Text>
          {date && <Text style={styles.date}>{formatDate()}</Text>}
          {isToday && (
            <View style={styles.todayBadge}>
              <Text style={styles.todayText}>I dag</Text>
            </View>
          )}
        </View>
        <View style={styles.headerRight}>
          {isComplete ? (
            <View style={styles.completeBadge}>
              <Text style={styles.completeIcon}>✓</Text>
              <Text style={styles.completeText}>Fullført</Text>
            </View>
          ) : (
            <Text style={styles.progressText}>
              {completedCount}/{totalCount}
            </Text>
          )}
        </View>
      </View>

      {/* Workout Stats */}
      {exercises.length > 0 && (
        <View style={styles.statsContainer}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{exercises.length}</Text>
            <Text style={styles.statLabel}>øvelser</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>~{estimatedDuration()}</Text>
            <Text style={styles.statLabel}>minutter</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>
              {exercises.reduce((sum, e) => sum + (e.sets || 1), 0)}
            </Text>
            <Text style={styles.statLabel}>sett totalt</Text>
          </View>
        </View>
      )}

      {/* Start Workout Button */}
      {isToday && !isComplete && exercises.length > 0 && (
        <TouchableOpacity style={styles.startButton} onPress={onStartWorkout}>
          <Text style={styles.startButtonText}>Start treningsøkt</Text>
          <Text style={styles.startButtonIcon}>▶</Text>
        </TouchableOpacity>
      )}

      {/* Exercise List */}
      <View style={styles.exerciseList}>
        {sortedExercises.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>😴</Text>
            <Text style={styles.emptyText}>Hviledag</Text>
            <Text style={styles.emptySubtext}>
              Ta deg en velfortjent pause og kom tilbake sterkere i morgen!
            </Text>
          </View>
        ) : (
          sortedExercises.map((exercise, index) => (
            <TouchableOpacity
              key={exercise.id}
              style={[
                styles.exerciseCard,
                exercise.completed && styles.exerciseCardComplete
              ]}
              onPress={() => onExercisePress?.(exercise)}
              activeOpacity={0.7}
            >
              {/* Order Number */}
              <View style={[
                styles.orderNumber,
                exercise.completed && styles.orderNumberComplete
              ]}>
                {exercise.completed ? (
                  <Text style={styles.orderCheckmark}>✓</Text>
                ) : (
                  <Text style={styles.orderText}>{index + 1}</Text>
                )}
              </View>

              {/* Thumbnail */}
              <View style={styles.thumbnailContainer}>
                {exercise.thumbnailUrl ? (
                  <Image
                    source={{ uri: exercise.thumbnailUrl }}
                    style={styles.thumbnail}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={[styles.thumbnail, styles.placeholderThumbnail]}>
                    <Text style={styles.placeholderIcon}>🏃</Text>
                  </View>
                )}
              </View>

              {/* Exercise Info */}
              <View style={styles.exerciseInfo}>
                <Text
                  style={[
                    styles.exerciseName,
                    exercise.completed && styles.exerciseNameComplete
                  ]}
                  numberOfLines={2}
                >
                  {exercise.nameNorwegian || exercise.name}
                </Text>
                <Text style={styles.exerciseCategory}>{exercise.category}</Text>

                {/* Parameters */}
                <View style={styles.paramsContainer}>
                  {exercise.sets && (
                    <View style={styles.param}>
                      <Text style={styles.paramText}>{exercise.sets} sett</Text>
                    </View>
                  )}
                  {exercise.reps && (
                    <View style={styles.param}>
                      <Text style={styles.paramText}>{exercise.reps} reps</Text>
                    </View>
                  )}
                  {exercise.holdSeconds && (
                    <View style={styles.param}>
                      <Text style={styles.paramText}>{exercise.holdSeconds}s hold</Text>
                    </View>
                  )}
                  {exercise.rirTarget !== undefined && (
                    <View style={[styles.param, styles.rirParam]}>
                      <Text style={styles.rirText}>RIR {exercise.rirTarget}</Text>
                    </View>
                  )}
                </View>

                {/* Notes */}
                {exercise.notes && (
                  <Text style={styles.notes} numberOfLines={1}>
                    📝 {exercise.notes}
                  </Text>
                )}
              </View>

              {/* Complete Button */}
              {!exercise.completed && onMarkComplete && (
                <TouchableOpacity
                  style={styles.completeButton}
                  onPress={() => onMarkComplete(exercise.id)}
                >
                  <Text style={styles.completeButtonText}>✓</Text>
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          ))
        )}
      </View>
    </View>
  );
}

const createStyles = (isDark: boolean, isToday: boolean) =>
  StyleSheet.create({
    container: {
      backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
      borderRadius: 16,
      padding: 16,
      borderWidth: isToday ? 2 : 1,
      borderColor: isToday ? '#007AFF' : (isDark ? '#3A3A3C' : '#E5E5EA'),
      marginBottom: 12
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8
    },
    dayName: {
      fontSize: 18,
      fontWeight: '600',
      color: isDark ? '#FFFFFF' : '#000000'
    },
    date: {
      fontSize: 14,
      color: isDark ? '#8E8E93' : '#8E8E93'
    },
    todayBadge: {
      backgroundColor: '#007AFF',
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 4
    },
    todayText: {
      fontSize: 11,
      fontWeight: '600',
      color: '#FFFFFF'
    },
    headerRight: {},
    progressText: {
      fontSize: 16,
      fontWeight: '600',
      color: isDark ? '#8E8E93' : '#8E8E93'
    },
    completeBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#34C759',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 8
    },
    completeIcon: {
      fontSize: 12,
      color: '#FFFFFF',
      marginRight: 4
    },
    completeText: {
      fontSize: 12,
      fontWeight: '600',
      color: '#FFFFFF'
    },
    statsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7',
      borderRadius: 12,
      padding: 12,
      marginBottom: 12
    },
    stat: {
      alignItems: 'center'
    },
    statValue: {
      fontSize: 18,
      fontWeight: 'bold',
      color: isDark ? '#FFFFFF' : '#000000'
    },
    statLabel: {
      fontSize: 11,
      color: isDark ? '#8E8E93' : '#8E8E93',
      marginTop: 2
    },
    statDivider: {
      width: 1,
      height: '100%',
      backgroundColor: isDark ? '#3A3A3C' : '#E5E5EA'
    },
    startButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#007AFF',
      borderRadius: 12,
      padding: 16,
      marginBottom: 12
    },
    startButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#FFFFFF',
      marginRight: 8
    },
    startButtonIcon: {
      fontSize: 14,
      color: '#FFFFFF'
    },
    exerciseList: {},
    emptyState: {
      alignItems: 'center',
      padding: 32
    },
    emptyIcon: {
      fontSize: 48,
      marginBottom: 12
    },
    emptyText: {
      fontSize: 18,
      fontWeight: '600',
      color: isDark ? '#FFFFFF' : '#000000',
      marginBottom: 4
    },
    emptySubtext: {
      fontSize: 14,
      color: isDark ? '#8E8E93' : '#8E8E93',
      textAlign: 'center'
    },
    exerciseCard: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
      backgroundColor: isDark ? '#2C2C2E' : '#F9F9F9',
      borderRadius: 12,
      marginBottom: 8
    },
    exerciseCardComplete: {
      backgroundColor: isDark ? '#1E3A2F' : '#E8F5E9',
      opacity: 0.8
    },
    orderNumber: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: isDark ? '#3A3A3C' : '#E5E5EA',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 10
    },
    orderNumberComplete: {
      backgroundColor: '#34C759'
    },
    orderText: {
      fontSize: 14,
      fontWeight: '600',
      color: isDark ? '#FFFFFF' : '#000000'
    },
    orderCheckmark: {
      fontSize: 14,
      fontWeight: 'bold',
      color: '#FFFFFF'
    },
    thumbnailContainer: {
      marginRight: 12
    },
    thumbnail: {
      width: 56,
      height: 56,
      borderRadius: 8,
      backgroundColor: isDark ? '#3A3A3C' : '#E5E5EA'
    },
    placeholderThumbnail: {
      justifyContent: 'center',
      alignItems: 'center'
    },
    placeholderIcon: {
      fontSize: 24
    },
    exerciseInfo: {
      flex: 1
    },
    exerciseName: {
      fontSize: 15,
      fontWeight: '600',
      color: isDark ? '#FFFFFF' : '#000000',
      marginBottom: 2
    },
    exerciseNameComplete: {
      textDecorationLine: 'line-through'
    },
    exerciseCategory: {
      fontSize: 12,
      color: isDark ? '#8E8E93' : '#8E8E93',
      marginBottom: 6,
      textTransform: 'capitalize'
    },
    paramsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 4
    },
    param: {
      backgroundColor: isDark ? '#3A3A3C' : '#E5E5EA',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4
    },
    paramText: {
      fontSize: 10,
      color: isDark ? '#EBEBF5' : '#3C3C43'
    },
    rirParam: {
      backgroundColor: isDark ? '#3D2C00' : '#FFF3E0'
    },
    rirText: {
      fontSize: 10,
      color: '#FF9500',
      fontWeight: '600'
    },
    notes: {
      fontSize: 11,
      color: isDark ? '#8E8E93' : '#8E8E93',
      marginTop: 6,
      fontStyle: 'italic'
    },
    completeButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: '#34C759',
      justifyContent: 'center',
      alignItems: 'center',
      marginLeft: 8
    },
    completeButtonText: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#FFFFFF'
    }
  });

export default DaySchedule;
