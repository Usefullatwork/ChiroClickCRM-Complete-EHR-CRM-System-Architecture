/**
 * Programs Screen
 * Shows enrolled and available programs
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  useColorScheme,
  TouchableOpacity
} from 'react-native';
import { router } from 'expo-router';
import { ProgramCard, Card, Button } from '../../components';
import { useProgramStore } from '../../stores';

type TabType = 'enrolled' | 'available';

export default function ProgramsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [activeTab, setActiveTab] = useState<TabType>('enrolled');

  const {
    availablePrograms,
    enrolledPrograms,
    isLoading,
    fetchAvailablePrograms,
    fetchMyPrograms,
    getEnrollmentForProgram
  } = useProgramStore();

  const styles = createStyles(isDark);

  useEffect(() => {
    fetchMyPrograms();
    fetchAvailablePrograms();
  }, []);

  const onRefresh = useCallback(async () => {
    await Promise.all([
      fetchMyPrograms(),
      fetchAvailablePrograms()
    ]);
  }, []);

  const handleProgramPress = (programId: string) => {
    router.push({
      pathname: '/program/[id]',
      params: { id: programId }
    });
  };

  // Get enriched enrolled programs with details
  const getEnrolledProgramsWithDetails = () => {
    return enrolledPrograms.map(enrollment => {
      const program = availablePrograms.find(p => p.id === enrollment.programId);
      return {
        ...enrollment,
        program
      };
    }).filter(e => e.program);
  };

  const enrichedEnrollments = getEnrolledProgramsWithDetails();

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
      {/* Tab Switcher */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'enrolled' && styles.tabActive]}
          onPress={() => setActiveTab('enrolled')}
        >
          <Text style={[styles.tabText, activeTab === 'enrolled' && styles.tabTextActive]}>
            Mine ({enrolledPrograms.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'available' && styles.tabActive]}
          onPress={() => setActiveTab('available')}
        >
          <Text style={[styles.tabText, activeTab === 'available' && styles.tabTextActive]}>
            Tilgjengelige
          </Text>
        </TouchableOpacity>
      </View>

      {/* Enrolled Programs */}
      {activeTab === 'enrolled' && (
        <View style={styles.section}>
          {enrichedEnrollments.length === 0 ? (
            <Card style={styles.emptyCard}>
              <View style={styles.emptyContent}>
                <Text style={styles.emptyIcon}>📋</Text>
                <Text style={styles.emptyTitle}>Ingen programmer ennå</Text>
                <Text style={styles.emptySubtitle}>
                  Utforsk tilgjengelige programmer og meld deg på for å komme i gang
                </Text>
                <Button
                  title="Utforsk programmer"
                  onPress={() => setActiveTab('available')}
                  variant="primary"
                  size="medium"
                  style={styles.exploreButton}
                />
              </View>
            </Card>
          ) : (
            enrichedEnrollments.map(enrollment => (
              <ProgramCard
                key={enrollment.id}
                id={enrollment.program!.id}
                name={enrollment.program!.name}
                nameNorwegian={enrollment.program!.nameNorwegian}
                description={enrollment.program!.description}
                programType={enrollment.program!.programType as any}
                durationWeeks={enrollment.program!.durationWeeks}
                difficultyLevel={enrollment.program!.difficultyLevel as any}
                coverImageUrl={enrollment.program!.coverImageUrl}
                enrolled
                currentWeek={enrollment.currentWeek}
                completionPercentage={
                  Math.round((enrollment.currentWeek / enrollment.program!.durationWeeks) * 100)
                }
                onPress={() => handleProgramPress(enrollment.programId)}
              />
            ))
          )}
        </View>
      )}

      {/* Available Programs */}
      {activeTab === 'available' && (
        <View style={styles.section}>
          {/* Program Categories */}
          <View style={styles.categorySection}>
            <Text style={styles.categoryTitle}>🏥 Rehabilitering</Text>
            {availablePrograms
              .filter(p => p.programType === 'rehabilitation')
              .map(program => (
                <ProgramCard
                  key={program.id}
                  id={program.id}
                  name={program.name}
                  nameNorwegian={program.nameNorwegian}
                  description={program.description}
                  programType={program.programType as any}
                  durationWeeks={program.durationWeeks}
                  difficultyLevel={program.difficultyLevel as any}
                  coverImageUrl={program.coverImageUrl}
                  enrolled={!!getEnrollmentForProgram(program.id)}
                  onPress={() => handleProgramPress(program.id)}
                  compact
                />
              ))}
          </View>

          <View style={styles.categorySection}>
            <Text style={styles.categoryTitle}>💪 Styrke & Muskelvekst</Text>
            {availablePrograms
              .filter(p => ['hypertrophy', 'strength'].includes(p.programType))
              .map(program => (
                <ProgramCard
                  key={program.id}
                  id={program.id}
                  name={program.name}
                  nameNorwegian={program.nameNorwegian}
                  description={program.description}
                  programType={program.programType as any}
                  durationWeeks={program.durationWeeks}
                  difficultyLevel={program.difficultyLevel as any}
                  coverImageUrl={program.coverImageUrl}
                  enrolled={!!getEnrollmentForProgram(program.id)}
                  onPress={() => handleProgramPress(program.id)}
                  compact
                />
              ))}
          </View>

          <View style={styles.categorySection}>
            <Text style={styles.categoryTitle}>🧘 Mobilitet</Text>
            {availablePrograms
              .filter(p => p.programType === 'mobility')
              .map(program => (
                <ProgramCard
                  key={program.id}
                  id={program.id}
                  name={program.name}
                  nameNorwegian={program.nameNorwegian}
                  description={program.description}
                  programType={program.programType as any}
                  durationWeeks={program.durationWeeks}
                  difficultyLevel={program.difficultyLevel as any}
                  coverImageUrl={program.coverImageUrl}
                  enrolled={!!getEnrollmentForProgram(program.id)}
                  onPress={() => handleProgramPress(program.id)}
                  compact
                />
              ))}
          </View>

          {availablePrograms.length === 0 && (
            <Card style={styles.emptyCard}>
              <View style={styles.emptyContent}>
                <Text style={styles.emptyIcon}>🔍</Text>
                <Text style={styles.emptyTitle}>Ingen programmer tilgjengelig</Text>
                <Text style={styles.emptySubtitle}>
                  Nye programmer kommer snart!
                </Text>
              </View>
            </Card>
          )}
        </View>
      )}
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
    tabContainer: {
      flexDirection: 'row',
      backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
      borderRadius: 12,
      padding: 4,
      marginBottom: 20
    },
    tab: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: 8,
      alignItems: 'center'
    },
    tabActive: {
      backgroundColor: isDark ? '#3A3A3C' : '#F2F2F7'
    },
    tabText: {
      fontSize: 14,
      fontWeight: '500',
      color: isDark ? '#8E8E93' : '#8E8E93'
    },
    tabTextActive: {
      color: isDark ? '#FFFFFF' : '#000000'
    },
    section: {},
    categorySection: {
      marginBottom: 24
    },
    categoryTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: isDark ? '#FFFFFF' : '#000000',
      marginBottom: 12
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
      marginTop: 8
    }
  });
