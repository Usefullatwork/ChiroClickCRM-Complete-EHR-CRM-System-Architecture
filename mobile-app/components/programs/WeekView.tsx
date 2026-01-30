/**
 * Week View Component
 * Shows program week with daily exercises
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
  TouchableOpacity,
  ScrollView
} from 'react-native';

interface DayExercise {
  id: string;
  name: string;
  sets?: number;
  reps?: string;
  completed?: boolean;
}

interface WeekDay {
  dayOfWeek: number; // 1-7
  exercises: DayExercise[];
  isRestDay?: boolean;
  completedCount?: number;
}

interface WeekViewProps {
  weekNumber: number;
  days: WeekDay[];
  focusArea?: string;
  isDeload?: boolean;
  isCurrentWeek?: boolean;
  onDayPress?: (dayOfWeek: number) => void;
  onExercisePress?: (exerciseId: string) => void;
}

const DAY_NAMES = ['', 'Man', 'Tir', 'Ons', 'Tor', 'Fre', 'Lør', 'Søn'];
const DAY_NAMES_FULL = ['', 'Mandag', 'Tirsdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lørdag', 'Søndag'];

export function WeekView({
  weekNumber,
  days,
  focusArea,
  isDeload = false,
  isCurrentWeek = false,
  onDayPress,
  onExercisePress
}: WeekViewProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const styles = createStyles(isDark, isCurrentWeek);

  // Calculate week completion
  const totalExercises = days.reduce((sum, d) => sum + d.exercises.length, 0);
  const completedExercises = days.reduce(
    (sum, d) => sum + (d.exercises.filter(e => e.completed).length),
    0
  );
  const weekCompletion = totalExercises > 0
    ? Math.round((completedExercises / totalExercises) * 100)
    : 0;

  // Get today's day of week (1-7, Monday = 1)
  const today = new Date();
  const todayDayOfWeek = today.getDay() === 0 ? 7 : today.getDay();

  return (
    <View style={styles.container}>
      {/* Week Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.weekBadge}>
            <Text style={styles.weekNumber}>Uke {weekNumber}</Text>
          </View>
          {isDeload && (
            <View style={styles.deloadBadge}>
              <Text style={styles.deloadText}>Deload</Text>
            </View>
          )}
          {isCurrentWeek && (
            <View style={styles.currentBadge}>
              <Text style={styles.currentText}>Aktiv</Text>
            </View>
          )}
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.completionText}>{weekCompletion}%</Text>
          <Text style={styles.completionLabel}>fullført</Text>
        </View>
      </View>

      {/* Focus Area */}
      {focusArea && (
        <Text style={styles.focusArea}>Fokus: {focusArea}</Text>
      )}

      {/* Days Grid */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.daysContainer}>
          {days.map((day) => {
            const isToday = isCurrentWeek && day.dayOfWeek === todayDayOfWeek;
            const dayCompletion = day.exercises.length > 0
              ? day.exercises.filter(e => e.completed).length / day.exercises.length
              : 0;
            const isComplete = dayCompletion === 1 && day.exercises.length > 0;

            return (
              <TouchableOpacity
                key={day.dayOfWeek}
                style={[
                  styles.dayCard,
                  isToday && styles.dayCardToday,
                  isComplete && styles.dayCardComplete,
                  day.isRestDay && styles.dayCardRest
                ]}
                onPress={() => onDayPress?.(day.dayOfWeek)}
                disabled={!onDayPress}
              >
                {/* Day Name */}
                <Text style={[
                  styles.dayName,
                  isToday && styles.dayNameToday
                ]}>
                  {DAY_NAMES[day.dayOfWeek]}
                </Text>

                {/* Exercise Count or Rest */}
                {day.isRestDay ? (
                  <View style={styles.restContainer}>
                    <Text style={styles.restIcon}>😴</Text>
                    <Text style={styles.restText}>Hvile</Text>
                  </View>
                ) : (
                  <>
                    <Text style={styles.exerciseCount}>
                      {day.exercises.length}
                    </Text>
                    <Text style={styles.exerciseLabel}>
                      {day.exercises.length === 1 ? 'øvelse' : 'øvelser'}
                    </Text>

                    {/* Completion Indicator */}
                    <View style={styles.completionIndicator}>
                      {day.exercises.map((_, idx) => (
                        <View
                          key={idx}
                          style={[
                            styles.completionDot,
                            idx < (day.completedCount || 0) && styles.completionDotFilled
                          ]}
                        />
                      ))}
                    </View>
                  </>
                )}

                {/* Complete Checkmark */}
                {isComplete && (
                  <View style={styles.checkmarkContainer}>
                    <Text style={styles.checkmark}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Exercise List (collapsed by default) */}
      {isCurrentWeek && (
        <View style={styles.exerciseList}>
          <Text style={styles.exerciseListTitle}>
            {DAY_NAMES_FULL[todayDayOfWeek]} - I dag
          </Text>
          {days.find(d => d.dayOfWeek === todayDayOfWeek)?.exercises.map((exercise) => (
            <TouchableOpacity
              key={exercise.id}
              style={[
                styles.exerciseItem,
                exercise.completed && styles.exerciseItemComplete
              ]}
              onPress={() => onExercisePress?.(exercise.id)}
            >
              <View style={styles.exerciseCheckbox}>
                {exercise.completed ? (
                  <Text style={styles.exerciseChecked}>✓</Text>
                ) : (
                  <View style={styles.exerciseUnchecked} />
                )}
              </View>
              <View style={styles.exerciseInfo}>
                <Text style={[
                  styles.exerciseName,
                  exercise.completed && styles.exerciseNameComplete
                ]}>
                  {exercise.name}
                </Text>
                {(exercise.sets || exercise.reps) && (
                  <Text style={styles.exerciseMeta}>
                    {exercise.sets && `${exercise.sets} sett`}
                    {exercise.sets && exercise.reps && ' • '}
                    {exercise.reps && `${exercise.reps} reps`}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const createStyles = (isDark: boolean, isCurrentWeek: boolean) =>
  StyleSheet.create({
    container: {
      backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
      borderRadius: 16,
      padding: 16,
      borderWidth: isCurrentWeek ? 2 : 1,
      borderColor: isCurrentWeek ? '#007AFF' : (isDark ? '#3A3A3C' : '#E5E5EA'),
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
    weekBadge: {
      backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8
    },
    weekNumber: {
      fontSize: 16,
      fontWeight: '600',
      color: isDark ? '#FFFFFF' : '#000000'
    },
    deloadBadge: {
      backgroundColor: '#FF9500',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6
    },
    deloadText: {
      fontSize: 12,
      fontWeight: '600',
      color: '#FFFFFF'
    },
    currentBadge: {
      backgroundColor: '#007AFF',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6
    },
    currentText: {
      fontSize: 12,
      fontWeight: '600',
      color: '#FFFFFF'
    },
    headerRight: {
      alignItems: 'flex-end'
    },
    completionText: {
      fontSize: 20,
      fontWeight: 'bold',
      color: '#34C759'
    },
    completionLabel: {
      fontSize: 12,
      color: isDark ? '#8E8E93' : '#8E8E93'
    },
    focusArea: {
      fontSize: 14,
      color: isDark ? '#8E8E93' : '#8E8E93',
      marginBottom: 12,
      fontStyle: 'italic'
    },
    daysContainer: {
      flexDirection: 'row',
      gap: 8
    },
    dayCard: {
      width: 70,
      padding: 12,
      borderRadius: 12,
      backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7',
      alignItems: 'center'
    },
    dayCardToday: {
      backgroundColor: isDark ? '#1E3A5C' : '#E3F2FD',
      borderWidth: 2,
      borderColor: '#007AFF'
    },
    dayCardComplete: {
      backgroundColor: isDark ? '#1E3A2F' : '#E8F5E9'
    },
    dayCardRest: {
      backgroundColor: isDark ? '#2C2C2E' : '#F9F9F9',
      opacity: 0.7
    },
    dayName: {
      fontSize: 12,
      fontWeight: '600',
      color: isDark ? '#8E8E93' : '#8E8E93',
      marginBottom: 8
    },
    dayNameToday: {
      color: '#007AFF'
    },
    exerciseCount: {
      fontSize: 24,
      fontWeight: 'bold',
      color: isDark ? '#FFFFFF' : '#000000'
    },
    exerciseLabel: {
      fontSize: 10,
      color: isDark ? '#8E8E93' : '#8E8E93',
      marginTop: 2
    },
    completionIndicator: {
      flexDirection: 'row',
      gap: 3,
      marginTop: 8
    },
    completionDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: isDark ? '#3A3A3C' : '#E5E5EA'
    },
    completionDotFilled: {
      backgroundColor: '#34C759'
    },
    restContainer: {
      alignItems: 'center'
    },
    restIcon: {
      fontSize: 20,
      marginBottom: 4
    },
    restText: {
      fontSize: 12,
      color: isDark ? '#8E8E93' : '#8E8E93'
    },
    checkmarkContainer: {
      position: 'absolute',
      top: 4,
      right: 4,
      width: 18,
      height: 18,
      borderRadius: 9,
      backgroundColor: '#34C759',
      justifyContent: 'center',
      alignItems: 'center'
    },
    checkmark: {
      fontSize: 10,
      color: '#FFFFFF',
      fontWeight: 'bold'
    },
    exerciseList: {
      marginTop: 16,
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: isDark ? '#3A3A3C' : '#E5E5EA'
    },
    exerciseListTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: isDark ? '#FFFFFF' : '#000000',
      marginBottom: 12
    },
    exerciseItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#3A3A3C' : '#F2F2F7'
    },
    exerciseItemComplete: {
      opacity: 0.6
    },
    exerciseCheckbox: {
      width: 24,
      height: 24,
      marginRight: 12
    },
    exerciseUnchecked: {
      width: 24,
      height: 24,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: isDark ? '#3A3A3C' : '#E5E5EA'
    },
    exerciseChecked: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: '#34C759',
      color: '#FFFFFF',
      textAlign: 'center',
      lineHeight: 24,
      fontWeight: 'bold'
    },
    exerciseInfo: {
      flex: 1
    },
    exerciseName: {
      fontSize: 14,
      color: isDark ? '#FFFFFF' : '#000000'
    },
    exerciseNameComplete: {
      textDecorationLine: 'line-through'
    },
    exerciseMeta: {
      fontSize: 12,
      color: isDark ? '#8E8E93' : '#8E8E93',
      marginTop: 2
    }
  });

export default WeekView;
