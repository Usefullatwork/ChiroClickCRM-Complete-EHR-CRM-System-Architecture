/**
 * Pain Trend Chart Component
 * Shows pain level over time with trend indicator
 */

import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
  Dimensions
} from 'react-native';

interface PainDataPoint {
  date: string;
  level: number; // 0-10
  label?: string;
}

interface PainTrendChartProps {
  data: PainDataPoint[];
  title?: string;
  showTrend?: boolean;
  exerciseId?: string;
}

export function PainTrendChart({
  data,
  title = 'Smerte over tid',
  showTrend = true
}: PainTrendChartProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const styles = createStyles(isDark);
  const chartWidth = Dimensions.get('window').width - 80;
  const chartHeight = 120;

  // Calculate trend
  const trend = useMemo(() => {
    if (data.length < 2) return { direction: 'stable' as const, change: 0 };

    const firstHalf = data.slice(0, Math.floor(data.length / 2));
    const secondHalf = data.slice(Math.floor(data.length / 2));

    const firstAvg = firstHalf.reduce((sum, d) => sum + d.level, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, d) => sum + d.level, 0) / secondHalf.length;

    const change = firstAvg - secondAvg;

    if (change > 0.5) return { direction: 'improving' as const, change: Math.round(change * 10) / 10 };
    if (change < -0.5) return { direction: 'worsening' as const, change: Math.round(Math.abs(change) * 10) / 10 };
    return { direction: 'stable' as const, change: 0 };
  }, [data]);

  // Get color for pain level
  const getPainColor = (level: number) => {
    if (level <= 2) return '#34C759'; // Green - minimal
    if (level <= 4) return '#A8D65C'; // Light green - mild
    if (level <= 6) return '#FFD60A'; // Yellow - moderate
    if (level <= 8) return '#FF9500'; // Orange - severe
    return '#FF3B30'; // Red - extreme
  };

  // Get trend message
  const getTrendMessage = () => {
    switch (trend.direction) {
      case 'improving':
        return `Smerten har gått ned med ${trend.change} poeng!`;
      case 'worsening':
        return `Smerten har økt med ${trend.change} poeng`;
      default:
        return 'Smerten holder seg stabil';
    }
  };

  // Get trend icon
  const getTrendIcon = () => {
    switch (trend.direction) {
      case 'improving':
        return '📉';
      case 'worsening':
        return '📈';
      default:
        return '➡️';
    }
  };

  // Calculate chart points
  const points = useMemo(() => {
    if (data.length === 0) return [];

    const maxLevel = 10;
    const pointWidth = chartWidth / Math.max(data.length - 1, 1);

    return data.map((d, i) => ({
      x: i * pointWidth,
      y: chartHeight - (d.level / maxLevel) * chartHeight,
      level: d.level,
      label: d.label || d.date
    }));
  }, [data, chartWidth, chartHeight]);

  // Current (latest) pain level
  const currentLevel = data.length > 0 ? data[data.length - 1].level : 0;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.currentContainer}>
          <Text style={[styles.currentValue, { color: getPainColor(currentLevel) }]}>
            {currentLevel}
          </Text>
          <Text style={styles.currentLabel}>/10</Text>
        </View>
      </View>

      {/* Trend Indicator */}
      {showTrend && data.length >= 2 && (
        <View style={[
          styles.trendContainer,
          trend.direction === 'improving' && styles.trendImproving,
          trend.direction === 'worsening' && styles.trendWorsening
        ]}>
          <Text style={styles.trendIcon}>{getTrendIcon()}</Text>
          <Text style={styles.trendMessage}>{getTrendMessage()}</Text>
        </View>
      )}

      {/* Chart */}
      <View style={styles.chartContainer}>
        {/* Y-axis labels */}
        <View style={styles.yAxis}>
          <Text style={styles.yAxisLabel}>10</Text>
          <Text style={styles.yAxisLabel}>5</Text>
          <Text style={styles.yAxisLabel}>0</Text>
        </View>

        {/* Chart Area */}
        <View style={[styles.chartArea, { width: chartWidth, height: chartHeight }]}>
          {/* Grid lines */}
          <View style={[styles.gridLine, { top: 0 }]} />
          <View style={[styles.gridLine, { top: chartHeight / 2 }]} />
          <View style={[styles.gridLine, { top: chartHeight }]} />

          {/* Data points and lines */}
          {points.map((point, index) => (
            <React.Fragment key={index}>
              {/* Line to next point */}
              {index < points.length - 1 && (
                <View
                  style={[
                    styles.line,
                    {
                      left: point.x,
                      top: point.y,
                      width: Math.sqrt(
                        Math.pow(points[index + 1].x - point.x, 2) +
                        Math.pow(points[index + 1].y - point.y, 2)
                      ),
                      transform: [{
                        rotate: `${Math.atan2(
                          points[index + 1].y - point.y,
                          points[index + 1].x - point.x
                        ) * 180 / Math.PI}deg`
                      }]
                    }
                  ]}
                />
              )}
              {/* Point */}
              <View
                style={[
                  styles.point,
                  {
                    left: point.x - 6,
                    top: point.y - 6,
                    backgroundColor: getPainColor(point.level)
                  }
                ]}
              />
            </React.Fragment>
          ))}
        </View>
      </View>

      {/* X-axis labels */}
      <View style={styles.xAxis}>
        {data.length > 0 && (
          <>
            <Text style={styles.xAxisLabel}>{data[0].label || data[0].date}</Text>
            {data.length > 1 && (
              <Text style={styles.xAxisLabel}>
                {data[data.length - 1].label || data[data.length - 1].date}
              </Text>
            )}
          </>
        )}
      </View>

      {/* Pain Scale Legend */}
      <View style={styles.legend}>
        <View style={styles.legendScale}>
          <View style={[styles.legendBar, { backgroundColor: '#34C759' }]} />
          <View style={[styles.legendBar, { backgroundColor: '#A8D65C' }]} />
          <View style={[styles.legendBar, { backgroundColor: '#FFD60A' }]} />
          <View style={[styles.legendBar, { backgroundColor: '#FF9500' }]} />
          <View style={[styles.legendBar, { backgroundColor: '#FF3B30' }]} />
        </View>
        <View style={styles.legendLabels}>
          <Text style={styles.legendLabel}>Ingen</Text>
          <Text style={styles.legendLabel}>Moderat</Text>
          <Text style={styles.legendLabel}>Sterk</Text>
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
      marginBottom: 12
    },
    title: {
      fontSize: 18,
      fontWeight: '600',
      color: isDark ? '#FFFFFF' : '#000000'
    },
    currentContainer: {
      flexDirection: 'row',
      alignItems: 'baseline'
    },
    currentValue: {
      fontSize: 28,
      fontWeight: 'bold'
    },
    currentLabel: {
      fontSize: 14,
      color: isDark ? '#8E8E93' : '#8E8E93',
      marginLeft: 2
    },
    trendContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
      marginBottom: 16,
      backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7'
    },
    trendImproving: {
      backgroundColor: isDark ? '#1E3A2F' : '#E8F5E9'
    },
    trendWorsening: {
      backgroundColor: isDark ? '#3A2020' : '#FFEBEE'
    },
    trendIcon: {
      fontSize: 16,
      marginRight: 8
    },
    trendMessage: {
      fontSize: 14,
      color: isDark ? '#EBEBF5' : '#3C3C43'
    },
    chartContainer: {
      flexDirection: 'row',
      marginTop: 8
    },
    yAxis: {
      width: 24,
      height: 120,
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      paddingRight: 8
    },
    yAxisLabel: {
      fontSize: 10,
      color: isDark ? '#8E8E93' : '#8E8E93'
    },
    chartArea: {
      position: 'relative',
      marginLeft: 8
    },
    gridLine: {
      position: 'absolute',
      left: 0,
      right: 0,
      height: 1,
      backgroundColor: isDark ? '#3A3A3C' : '#E5E5EA'
    },
    line: {
      position: 'absolute',
      height: 2,
      backgroundColor: '#007AFF',
      transformOrigin: 'left center'
    },
    point: {
      position: 'absolute',
      width: 12,
      height: 12,
      borderRadius: 6,
      borderWidth: 2,
      borderColor: isDark ? '#1C1C1E' : '#FFFFFF'
    },
    xAxis: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 8,
      marginLeft: 32
    },
    xAxisLabel: {
      fontSize: 10,
      color: isDark ? '#8E8E93' : '#8E8E93'
    },
    legend: {
      marginTop: 16,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: isDark ? '#3A3A3C' : '#E5E5EA'
    },
    legendScale: {
      flexDirection: 'row',
      height: 8,
      borderRadius: 4,
      overflow: 'hidden'
    },
    legendBar: {
      flex: 1
    },
    legendLabels: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 4
    },
    legendLabel: {
      fontSize: 10,
      color: isDark ? '#8E8E93' : '#8E8E93'
    }
  });

export default PainTrendChart;
