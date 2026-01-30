/**
 * Progress Screen
 * Shows workout history, streaks, and statistics
 */

import React, { useEffect, useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  useColorScheme,
  TouchableOpacity
} from 'react-native';
import {
  StreakBadge,
  ComplianceChart,
  PainTrendChart,
  Card
} from '../../components';
import { useProgramStore, useAuthStore } from '../../stores';

type TimeRange = 'week' | 'month' | 'all';

export default function ProgressScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [timeRange, setTimeRange] = useState<TimeRange>('week');

  const { currentStreak, longestStreak, isLoading, fetchTodayExercises } = useProgramStore();
  const { user } = useAuthStore();

  const styles = createStyles(isDark);

  useEffect(() => {
    fetchTodayExercises();
  }, []);

  const onRefresh = useCallback(async () => {
    await fetchTodayExercises();
  }, []);

  // Mock data for charts (replace with real data from API)
  const complianceData = [
    { label: 'Man', completed: 4, total: 5 },
    { label: 'Tir', completed: 5, total: 5 },
    { label: 'Ons', completed: 3, total: 5 },
    { label: 'Tor', completed: 5, total: 5 },
    { label: 'Fre', completed: 2, total: 5 },
    { label: 'Lør', completed: 0, total: 0 },
    { label: 'Søn', completed: 0, total: 0 }
  ];

  const painData = [
    { date: '1', label: 'Uke 1', level: 6 },
    { date: '2', label: 'Uke 2', level: 5 },
    { date: '3', label: 'Uke 3', level: 4 },
    { date: '4', label: 'Uke 4', level: 4 },
    { date: '5', label: 'Uke 5', level: 3 },
    { date: '6', label: 'Uke 6', level: 2 }
  ];

  // Calculate stats
  const totalWorkouts = 24;
  const totalExercises = 156;
  const avgComplianceRate = 78;
  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('no-NO', { month: 'long', year: 'numeric' })
    : 'Ukjent';

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={isLoading}
          onRefresh={onRefresh}
          tintColor={isDark ? '#FFFFFF' : '#000000'}
        />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Streak Section */}
      <Card style={styles.streakCard}>
        <StreakBadge
          streak={currentStreak}
          longestStreak={longestStreak}
          showLongest
          size="large"
        />
      </Card>

      {/* Quick Stats */}
      <View style={styles.statsGrid}>
        <Card style={styles.statCard} variant="filled">
          <Text style={styles.statValue}>{totalWorkouts}</Text>
          <Text style={styles.statLabel}>Økter fullført</Text>
        </Card>
        <Card style={styles.statCard} variant="filled">
          <Text style={styles.statValue}>{totalExercises}</Text>
          <Text style={styles.statLabel}>Øvelser gjort</Text>
        </Card>
        <Card style={styles.statCard} variant="filled">
          <Text style={styles.statValue}>{avgComplianceRate}%</Text>
          <Text style={styles.statLabel}>Gjennomsnitt</Text>
        </Card>
      </View>

      {/* Time Range Selector */}
      <View style={styles.timeRangeContainer}>
        <TouchableOpacity
          style={[styles.timeRangeButton, timeRange === 'week' && styles.timeRangeActive]}
          onPress={() => setTimeRange('week')}
        >
          <Text style={[styles.timeRangeText, timeRange === 'week' && styles.timeRangeTextActive]}>
            Uke
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.timeRangeButton, timeRange === 'month' && styles.timeRangeActive]}
          onPress={() => setTimeRange('month')}
        >
          <Text style={[styles.timeRangeText, timeRange === 'month' && styles.timeRangeTextActive]}>
            Måned
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.timeRangeButton, timeRange === 'all' && styles.timeRangeActive]}
          onPress={() => setTimeRange('all')}
        >
          <Text style={[styles.timeRangeText, timeRange === 'all' && styles.timeRangeTextActive]}>
            Totalt
          </Text>
        </TouchableOpacity>
      </View>

      {/* Compliance Chart */}
      <View style={styles.chartSection}>
        <ComplianceChart
          data={complianceData}
          title="Gjennomføring denne uken"
          period="week"
        />
      </View>

      {/* Pain Trend Chart */}
      <View style={styles.chartSection}>
        <PainTrendChart
          data={painData}
          title="Smerteutvikling"
          showTrend
        />
      </View>

      {/* Achievements */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Prestasjoner</Text>
        <View style={styles.achievementsGrid}>
          <View style={styles.achievement}>
            <Text style={styles.achievementIcon}>🔥</Text>
            <Text style={styles.achievementTitle}>7-dagers streak</Text>
          </View>
          <View style={styles.achievement}>
            <Text style={styles.achievementIcon}>💪</Text>
            <Text style={styles.achievementTitle}>Første program</Text>
          </View>
          <View style={[styles.achievement, styles.achievementLocked]}>
            <Text style={styles.achievementIcon}>🏆</Text>
            <Text style={styles.achievementTitle}>30 dager</Text>
          </View>
          <View style={[styles.achievement, styles.achievementLocked]}>
            <Text style={styles.achievementIcon}>⚡</Text>
            <Text style={styles.achievementTitle}>100 øvelser</Text>
          </View>
        </View>
      </View>

      {/* Member Info */}
      <Card style={styles.memberCard} variant="outlined">
        <Text style={styles.memberLabel}>Medlem siden</Text>
        <Text style={styles.memberValue}>{memberSince}</Text>
      </Card>
    </ScrollView>
  );
}

const createStyles = (isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? '#000000' : '#F2F2F7'
    },
    content: {
      padding: 16,
      paddingBottom: 100
    },
    streakCard: {
      alignItems: 'center',
      paddingVertical: 24,
      marginBottom: 16
    },
    statsGrid: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 20
    },
    statCard: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: 16
    },
    statValue: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#007AFF',
      marginBottom: 4
    },
    statLabel: {
      fontSize: 11,
      color: isDark ? '#8E8E93' : '#8E8E93'
    },
    timeRangeContainer: {
      flexDirection: 'row',
      backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
      borderRadius: 12,
      padding: 4,
      marginBottom: 20
    },
    timeRangeButton: {
      flex: 1,
      paddingVertical: 8,
      borderRadius: 8,
      alignItems: 'center'
    },
    timeRangeActive: {
      backgroundColor: '#007AFF'
    },
    timeRangeText: {
      fontSize: 14,
      fontWeight: '500',
      color: isDark ? '#8E8E93' : '#8E8E93'
    },
    timeRangeTextActive: {
      color: '#FFFFFF'
    },
    chartSection: {
      marginBottom: 20
    },
    section: {
      marginBottom: 20
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: isDark ? '#FFFFFF' : '#000000',
      marginBottom: 12
    },
    achievementsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8
    },
    achievement: {
      width: '48%',
      backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
      borderRadius: 12,
      padding: 16,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: isDark ? '#3A3A3C' : '#E5E5EA'
    },
    achievementLocked: {
      opacity: 0.5
    },
    achievementIcon: {
      fontSize: 32,
      marginBottom: 8
    },
    achievementTitle: {
      fontSize: 13,
      fontWeight: '500',
      color: isDark ? '#FFFFFF' : '#000000',
      textAlign: 'center'
    },
    memberCard: {
      alignItems: 'center',
      paddingVertical: 16
    },
    memberLabel: {
      fontSize: 13,
      color: isDark ? '#8E8E93' : '#8E8E93',
      marginBottom: 4
    },
    memberValue: {
      fontSize: 16,
      fontWeight: '600',
      color: isDark ? '#FFFFFF' : '#000000',
      textTransform: 'capitalize'
    }
  });
