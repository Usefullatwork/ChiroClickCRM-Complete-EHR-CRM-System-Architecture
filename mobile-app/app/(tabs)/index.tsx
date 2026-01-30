/**
 * Home Screen - Today's Workout
 * Shows daily exercises and progress
 */

import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  RefreshControl,
  useColorScheme,
  TouchableOpacity
} from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  StreakBadge,
  ExerciseCard,
  Card,
  Button,
  OfflineIndicator
} from '../../components';
import { useProgramStore, useAuthStore, useOfflineStore } from '../../stores';

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const { user } = useAuthStore();
  const {
    todayExercises,
    currentStreak,
    longestStreak,
    isLoading,
    fetchTodayExercises,
    getTodayProgress
  } = useProgramStore();
  const { getQueueSize } = useOfflineStore();

  const styles = createStyles(isDark);

  // Fetch today's exercises on mount
  useEffect(() => {
    fetchTodayExercises();
  }, []);

  const onRefresh = useCallback(async () => {
    await fetchTodayExercises();
  }, []);

  const progress = getTodayProgress();
  const pendingSyncCount = getQueueSize();

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'God morgen';
    if (hour < 17) return 'God ettermiddag';
    return 'God kveld';
  };

  const handleExercisePress = (exerciseId: string) => {
    router.push({
      pathname: '/exercise/[id]',
      params: { id: exerciseId }
    });
  };

  const handleStartWorkout = () => {
    if (todayExercises.length > 0) {
      handleExercisePress(todayExercises[0].id);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <OfflineIndicator pendingSync={pendingSyncCount} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={onRefresh}
            tintColor={isDark ? '#FFFFFF' : '#000000'}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{getGreeting()},</Text>
            <Text style={styles.userName}>{user?.displayName || 'Bruker'}</Text>
          </View>
          <StreakBadge
            streak={currentStreak}
            longestStreak={longestStreak}
            size="small"
          />
        </View>

        {/* Today's Progress */}
        <Card style={styles.progressCard} variant="filled">
          <View style={styles.progressContent}>
            <View style={styles.progressCircle}>
              <Text style={styles.progressPercentage}>{progress.percentage}%</Text>
              <Text style={styles.progressLabel}>fullført</Text>
            </View>
            <View style={styles.progressInfo}>
              <Text style={styles.progressTitle}>Dagens trening</Text>
              <Text style={styles.progressSubtitle}>
                {progress.completed} av {progress.total} øvelser
              </Text>
              {progress.total > 0 && progress.completed < progress.total && (
                <Button
                  title={progress.completed === 0 ? 'Start trening' : 'Fortsett'}
                  onPress={handleStartWorkout}
                  size="small"
                  style={styles.startButton}
                />
              )}
              {progress.completed === progress.total && progress.total > 0 && (
                <View style={styles.completeBadge}>
                  <Text style={styles.completeText}>✓ Ferdig for i dag!</Text>
                </View>
              )}
            </View>
          </View>
        </Card>

        {/* Today's Exercises */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Dagens øvelser</Text>
            {todayExercises.length > 0 && (
              <TouchableOpacity onPress={() => router.push('/(tabs)/programs')}>
                <Text style={styles.seeAllLink}>Se program</Text>
              </TouchableOpacity>
            )}
          </View>

          {todayExercises.length === 0 ? (
            <Card style={styles.emptyCard}>
              <View style={styles.emptyContent}>
                <Text style={styles.emptyIcon}>📋</Text>
                <Text style={styles.emptyTitle}>Ingen øvelser i dag</Text>
                <Text style={styles.emptySubtitle}>
                  Meld deg på et program for å få daglige øvelser
                </Text>
                <Button
                  title="Utforsk programmer"
                  onPress={() => router.push('/(tabs)/programs')}
                  variant="outline"
                  size="small"
                  style={styles.exploreButton}
                />
              </View>
            </Card>
          ) : (
            todayExercises.map((exercise) => (
              <ExerciseCard
                key={exercise.id}
                exercise={exercise}
                onPress={() => handleExercisePress(exercise.id)}
                showSetsReps
                completed={exercise.completed}
              />
            ))
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hurtigvalg</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={styles.quickAction}
              onPress={() => router.push('/(tabs)/library')}
            >
              <Text style={styles.quickActionIcon}>📚</Text>
              <Text style={styles.quickActionText}>Øvelser</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickAction}
              onPress={() => router.push('/(tabs)/progress')}
            >
              <Text style={styles.quickActionIcon}>📊</Text>
              <Text style={styles.quickActionText}>Fremgang</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickAction}
              onPress={() => router.push('/(tabs)/profile')}
            >
              <Text style={styles.quickActionIcon}>⚙️</Text>
              <Text style={styles.quickActionText}>Innstillinger</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? '#000000' : '#F2F2F7'
    },
    scrollView: {
      flex: 1
    },
    scrollContent: {
      padding: 16,
      paddingBottom: 100
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20
    },
    greeting: {
      fontSize: 16,
      color: isDark ? '#8E8E93' : '#8E8E93'
    },
    userName: {
      fontSize: 24,
      fontWeight: 'bold',
      color: isDark ? '#FFFFFF' : '#000000'
    },
    progressCard: {
      marginBottom: 24
    },
    progressContent: {
      flexDirection: 'row',
      alignItems: 'center'
    },
    progressCircle: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: isDark ? '#3A3A3C' : '#FFFFFF',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16
    },
    progressPercentage: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#007AFF'
    },
    progressLabel: {
      fontSize: 11,
      color: isDark ? '#8E8E93' : '#8E8E93'
    },
    progressInfo: {
      flex: 1
    },
    progressTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: isDark ? '#FFFFFF' : '#000000'
    },
    progressSubtitle: {
      fontSize: 14,
      color: isDark ? '#8E8E93' : '#8E8E93',
      marginTop: 2
    },
    startButton: {
      marginTop: 12,
      alignSelf: 'flex-start'
    },
    completeBadge: {
      marginTop: 12,
      backgroundColor: '#34C759',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
      alignSelf: 'flex-start'
    },
    completeText: {
      fontSize: 14,
      fontWeight: '600',
      color: '#FFFFFF'
    },
    section: {
      marginBottom: 24
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: isDark ? '#FFFFFF' : '#000000'
    },
    seeAllLink: {
      fontSize: 14,
      color: '#007AFF',
      fontWeight: '500'
    },
    emptyCard: {
      padding: 32
    },
    emptyContent: {
      alignItems: 'center'
    },
    emptyIcon: {
      fontSize: 48,
      marginBottom: 12
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: isDark ? '#FFFFFF' : '#000000',
      marginBottom: 4
    },
    emptySubtitle: {
      fontSize: 14,
      color: isDark ? '#8E8E93' : '#8E8E93',
      textAlign: 'center',
      marginBottom: 16
    },
    exploreButton: {
      alignSelf: 'center'
    },
    quickActions: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 12
    },
    quickAction: {
      flex: 1,
      backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
      borderRadius: 16,
      padding: 16,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: isDark ? '#3A3A3C' : '#E5E5EA'
    },
    quickActionIcon: {
      fontSize: 28,
      marginBottom: 8
    },
    quickActionText: {
      fontSize: 13,
      fontWeight: '500',
      color: isDark ? '#FFFFFF' : '#000000'
    }
  });
