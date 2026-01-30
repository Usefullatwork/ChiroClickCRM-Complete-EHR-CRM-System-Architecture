/**
 * Compliance Chart Component
 * Shows weekly/monthly workout completion rates
 */

import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
  Dimensions
} from 'react-native';

interface ComplianceData {
  label: string;
  completed: number;
  total: number;
}

interface ComplianceChartProps {
  data: ComplianceData[];
  title?: string;
  period?: 'week' | 'month';
  showPercentage?: boolean;
}

export function ComplianceChart({
  data,
  title = 'Gjennomføring',
  period = 'week',
  showPercentage = true
}: ComplianceChartProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const styles = createStyles(isDark);

  // Calculate overall compliance
  const overallStats = useMemo(() => {
    const totalCompleted = data.reduce((sum, d) => sum + d.completed, 0);
    const totalExercises = data.reduce((sum, d) => sum + d.total, 0);
    const percentage = totalExercises > 0
      ? Math.round((totalCompleted / totalExercises) * 100)
      : 0;
    return { totalCompleted, totalExercises, percentage };
  }, [data]);

  // Get bar color based on completion rate
  const getBarColor = (completed: number, total: number) => {
    if (total === 0) return isDark ? '#3A3A3C' : '#E5E5EA';
    const rate = completed / total;
    if (rate >= 0.8) return '#34C759'; // Green
    if (rate >= 0.5) return '#FF9500'; // Orange
    return '#FF3B30'; // Red
  };

  // Get compliance message
  const getComplianceMessage = (percentage: number) => {
    if (percentage >= 90) return 'Fantastisk! Du holder deg til planen!';
    if (percentage >= 70) return 'Bra jobbet! Fortsett slik!';
    if (percentage >= 50) return 'God innsats! Prøv å fullføre flere.';
    if (percentage > 0) return 'Hver øvelse teller. Du klarer dette!';
    return 'Start din første økt i dag!';
  };

  const maxBarHeight = 100;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {showPercentage && (
          <View style={styles.percentageContainer}>
            <Text style={styles.percentageValue}>{overallStats.percentage}%</Text>
            <Text style={styles.percentageLabel}>
              {overallStats.totalCompleted}/{overallStats.totalExercises}
            </Text>
          </View>
        )}
      </View>

      {/* Chart */}
      <View style={styles.chartContainer}>
        {data.map((item, index) => {
          const barHeight = item.total > 0
            ? (item.completed / item.total) * maxBarHeight
            : 0;
          const barColor = getBarColor(item.completed, item.total);

          return (
            <View key={index} style={styles.barColumn}>
              {/* Bar Container */}
              <View style={styles.barContainer}>
                {/* Background Bar */}
                <View style={[styles.barBackground, { height: maxBarHeight }]} />
                {/* Filled Bar */}
                <View
                  style={[
                    styles.barFilled,
                    {
                      height: barHeight,
                      backgroundColor: barColor
                    }
                  ]}
                />
              </View>
              {/* Label */}
              <Text style={styles.barLabel}>{item.label}</Text>
              {/* Count */}
              <Text style={styles.barCount}>
                {item.completed}/{item.total}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Message */}
      <View style={styles.messageContainer}>
        <Text style={styles.message}>
          {getComplianceMessage(overallStats.percentage)}
        </Text>
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#34C759' }]} />
          <Text style={styles.legendText}>80%+</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#FF9500' }]} />
          <Text style={styles.legendText}>50-79%</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#FF3B30' }]} />
          <Text style={styles.legendText}>&lt;50%</Text>
        </View>
      </View>
    </View>
  );
}

const createStyles = (isDark: boolean) =>
  StyleSheet.create({
    container: {
      backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: isDark ? '#3A3A3C' : '#E5E5EA'
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20
    },
    title: {
      fontSize: 18,
      fontWeight: '600',
      color: isDark ? '#FFFFFF' : '#000000'
    },
    percentageContainer: {
      alignItems: 'flex-end'
    },
    percentageValue: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#007AFF'
    },
    percentageLabel: {
      fontSize: 12,
      color: isDark ? '#8E8E93' : '#8E8E93'
    },
    chartContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      height: 140,
      paddingHorizontal: 8
    },
    barColumn: {
      flex: 1,
      alignItems: 'center',
      marginHorizontal: 2
    },
    barContainer: {
      width: 24,
      height: 100,
      position: 'relative',
      justifyContent: 'flex-end'
    },
    barBackground: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7',
      borderRadius: 4
    },
    barFilled: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      borderRadius: 4
    },
    barLabel: {
      fontSize: 10,
      color: isDark ? '#8E8E93' : '#8E8E93',
      marginTop: 8,
      fontWeight: '500'
    },
    barCount: {
      fontSize: 9,
      color: isDark ? '#636366' : '#AEAEB2',
      marginTop: 2
    },
    messageContainer: {
      marginTop: 16,
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: isDark ? '#3A3A3C' : '#E5E5EA'
    },
    message: {
      fontSize: 14,
      color: isDark ? '#EBEBF5' : '#3C3C43',
      textAlign: 'center',
      fontStyle: 'italic'
    },
    legend: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginTop: 12,
      gap: 16
    },
    legendItem: {
      flexDirection: 'row',
      alignItems: 'center'
    },
    legendDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginRight: 4
    },
    legendText: {
      fontSize: 11,
      color: isDark ? '#8E8E93' : '#8E8E93'
    }
  });

export default ComplianceChart;
