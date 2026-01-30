/**
 * Program Detail Screen
 * Shows program overview, weeks, and enrollment options
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  useColorScheme,
  TouchableOpacity,
  Alert,
  Image
} from 'react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import {
  WeekView,
  Button,
  Card
} from '../../components';
import { useProgramStore } from '../../stores';

export default function ProgramDetailScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { id } = useLocalSearchParams<{ id: string }>();

  const [selectedWeek, setSelectedWeek] = useState(1);
  const [isEnrolling, setIsEnrolling] = useState(false);

  const {
    availablePrograms,
    enrolledPrograms,
    fetchProgramById,
    enrollInProgram,
    unenrollFromProgram,
    getEnrollmentForProgram
  } = useProgramStore();

  const styles = createStyles(isDark);

  useEffect(() => {
    if (id) {
      fetchProgramById(id);
    }
  }, [id]);

  const program = availablePrograms.find(p => p.id === id);
  const enrollment = id ? getEnrollmentForProgram(id) : null;
  const isEnrolled = !!enrollment;

  const handleEnroll = useCallback(async () => {
    if (!id) return;

    setIsEnrolling(true);
    try {
      await enrollInProgram(id);
      Alert.alert(
        'Velkommen! 🎉',
        `Du er nå påmeldt ${program?.nameNorwegian || program?.name}. Lykke til med treningen!`,
        [{ text: 'Start nå', onPress: () => router.push('/(tabs)') }]
      );
    } catch (error) {
      Alert.alert('Feil', 'Kunne ikke melde deg på. Prøv igjen.');
    } finally {
      setIsEnrolling(false);
    }
  }, [id, program]);

  const handleUnenroll = useCallback(async () => {
    if (!id) return;

    Alert.alert(
      'Avslutt program',
      'Er du sikker på at du vil avslutte dette programmet? All fremgang vil bli lagret.',
      [
        { text: 'Avbryt', style: 'cancel' },
        {
          text: 'Avslutt',
          style: 'destructive',
          onPress: async () => {
            try {
              await unenrollFromProgram(id);
              Alert.alert('Avsluttet', 'Du har avsluttet programmet.');
            } catch (error) {
              Alert.alert('Feil', 'Kunne ikke avslutte. Prøv igjen.');
            }
          }
        }
      ]
    );
  }, [id]);

  const handleStartDay = (dayIndex: number) => {
    // Navigate to today's exercises for this program
    router.push('/(tabs)');
  };

  if (!program) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.loadingText}>Laster program...</Text>
      </View>
    );
  }

  const displayName = program.nameNorwegian || program.name;
  const description = program.descriptionNorwegian || program.description;

  // Program type labels
  const programTypeLabels: Record<string, string> = {
    rehabilitation: 'Rehabilitering',
    hypertrophy: 'Muskelvekst',
    strength: 'Styrke',
    mobility: 'Mobilitet'
  };

  // Difficulty labels
  const difficultyLabels: Record<string, string> = {
    beginner: 'Nybegynner',
    intermediate: 'Middels',
    advanced: 'Avansert'
  };

  // Calculate progress for enrolled programs
  const progressPercentage = enrollment
    ? Math.round((enrollment.currentWeek / program.durationWeeks) * 100)
    : 0;

  // Mock week data (would come from API)
  const mockWeeks = Array.from({ length: program.durationWeeks }, (_, i) => ({
    weekNumber: i + 1,
    days: [
      {
        dayNumber: 1,
        exercises: [
          { id: '1', name: 'Øvelse 1', completed: i < (enrollment?.currentWeek || 0) },
          { id: '2', name: 'Øvelse 2', completed: i < (enrollment?.currentWeek || 0) },
          { id: '3', name: 'Øvelse 3', completed: i < (enrollment?.currentWeek || 0) }
        ]
      },
      {
        dayNumber: 2,
        exercises: [
          { id: '4', name: 'Øvelse 1', completed: i < (enrollment?.currentWeek || 0) },
          { id: '5', name: 'Øvelse 2', completed: i < (enrollment?.currentWeek || 0) }
        ]
      },
      {
        dayNumber: 3,
        exercises: [
          { id: '6', name: 'Øvelse 1', completed: i < (enrollment?.currentWeek || 0) },
          { id: '7', name: 'Øvelse 2', completed: i < (enrollment?.currentWeek || 0) },
          { id: '8', name: 'Øvelse 3', completed: i < (enrollment?.currentWeek || 0) }
        ]
      }
    ],
    isDeload: i === program.durationWeeks - 1 && program.programType !== 'rehabilitation'
  }));

  return (
    <>
      <Stack.Screen
        options={{
          title: displayName,
          headerTransparent: !!program.coverImageUrl
        }}
      />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Cover Image */}
        {program.coverImageUrl && (
          <View style={styles.coverContainer}>
            <Image
              source={{ uri: program.coverImageUrl }}
              style={styles.coverImage}
              resizeMode="cover"
            />
            <View style={styles.coverOverlay} />
          </View>
        )}

        {/* Program Info */}
        <View style={styles.infoSection}>
          <Text style={styles.programName}>{displayName}</Text>

          <View style={styles.metaRow}>
            <View style={styles.metaBadge}>
              <Text style={styles.metaIcon}>📋</Text>
              <Text style={styles.metaText}>
                {programTypeLabels[program.programType] || program.programType}
              </Text>
            </View>
            <View style={styles.metaBadge}>
              <Text style={styles.metaIcon}>📅</Text>
              <Text style={styles.metaText}>{program.durationWeeks} uker</Text>
            </View>
            <View style={styles.metaBadge}>
              <Text style={styles.metaIcon}>📊</Text>
              <Text style={styles.metaText}>
                {difficultyLabels[program.difficultyLevel] || program.difficultyLevel}
              </Text>
            </View>
          </View>

          {description && (
            <Text style={styles.description}>{description}</Text>
          )}
        </View>

        {/* Enrollment Status / Progress */}
        {isEnrolled ? (
          <Card style={styles.progressCard} variant="filled">
            <Text style={styles.progressTitle}>Din fremgang</Text>
            <View style={styles.progressBarContainer}>
              <View style={[styles.progressBar, { width: `${progressPercentage}%` }]} />
            </View>
            <View style={styles.progressDetails}>
              <Text style={styles.progressText}>
                Uke {enrollment.currentWeek} av {program.durationWeeks}
              </Text>
              <Text style={styles.progressPercentage}>{progressPercentage}%</Text>
            </View>
          </Card>
        ) : (
          <Card style={styles.enrollCard}>
            <Text style={styles.enrollTitle}>Klar til å starte?</Text>
            <Text style={styles.enrollSubtitle}>
              Meld deg på for å få daglige øvelser og spore din fremgang.
            </Text>
            <Button
              title={isEnrolling ? 'Melder på...' : 'Start program'}
              onPress={handleEnroll}
              fullWidth
              size="large"
              disabled={isEnrolling}
            />
          </Card>
        )}

        {/* Week Selector */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ukeoversikt</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.weekSelector}
          >
            {Array.from({ length: program.durationWeeks }, (_, i) => {
              const weekNum = i + 1;
              const isCurrentWeek = enrollment?.currentWeek === weekNum;
              const isPast = enrollment ? weekNum < enrollment.currentWeek : false;
              const isFuture = enrollment ? weekNum > enrollment.currentWeek : true;

              return (
                <TouchableOpacity
                  key={weekNum}
                  style={[
                    styles.weekButton,
                    selectedWeek === weekNum && styles.weekButtonActive,
                    isCurrentWeek && styles.weekButtonCurrent,
                    isPast && styles.weekButtonCompleted
                  ]}
                  onPress={() => setSelectedWeek(weekNum)}
                >
                  <Text
                    style={[
                      styles.weekButtonText,
                      selectedWeek === weekNum && styles.weekButtonTextActive,
                      isPast && styles.weekButtonTextCompleted
                    ]}
                  >
                    Uke {weekNum}
                  </Text>
                  {isPast && <Text style={styles.weekCheckmark}>✓</Text>}
                  {isCurrentWeek && <Text style={styles.weekCurrent}>●</Text>}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Week Details */}
        <View style={styles.section}>
          <WeekView
            weekNumber={selectedWeek}
            days={mockWeeks[selectedWeek - 1]?.days || []}
            isDeload={mockWeeks[selectedWeek - 1]?.isDeload}
            programType={program.programType as any}
            onDayPress={handleStartDay}
            isCurrentWeek={enrollment?.currentWeek === selectedWeek}
          />
        </View>

        {/* Program Features */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hva du får</Text>
          <View style={styles.featuresGrid}>
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>📹</Text>
              <Text style={styles.featureTitle}>Videoinstruksjoner</Text>
              <Text style={styles.featureText}>Detaljerte videoer for hver øvelse</Text>
            </View>
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>📊</Text>
              <Text style={styles.featureTitle}>Fremgangssporing</Text>
              <Text style={styles.featureText}>Se din utvikling over tid</Text>
            </View>
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>🔔</Text>
              <Text style={styles.featureTitle}>Påminnelser</Text>
              <Text style={styles.featureText}>Daglige varsler for trening</Text>
            </View>
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>📱</Text>
              <Text style={styles.featureTitle}>Offline tilgjengelig</Text>
              <Text style={styles.featureText}>Last ned for å trene uten nett</Text>
            </View>
          </View>
        </View>

        {/* Tips Section */}
        {program.programType === 'rehabilitation' && (
          <Card style={styles.tipsCard} variant="outlined">
            <Text style={styles.tipsTitle}>💡 Tips for rehabilitering</Text>
            <Text style={styles.tipsText}>
              • Start forsiktig og øk gradvis{'\n'}
              • Stopp hvis du opplever skarp smerte{'\n'}
              • Konsistens er viktigere enn intensitet{'\n'}
              • Kontakt behandleren din ved spørsmål
            </Text>
          </Card>
        )}

        {program.programType === 'hypertrophy' && (
          <Card style={styles.tipsCard} variant="outlined">
            <Text style={styles.tipsTitle}>💡 Tips for muskelvekst</Text>
            <Text style={styles.tipsText}>
              • Fokuser på progressiv overbelastning{'\n'}
              • Hold 1-3 RIR (Reps In Reserve) på hver serie{'\n'}
              • Sørg for tilstrekkelig protein (1.6-2.2g/kg){'\n'}
              • Prioriter søvn og restitusjon
            </Text>
          </Card>
        )}
      </ScrollView>

      {/* Bottom Action Bar */}
      {isEnrolled && (
        <View style={styles.bottomBar}>
          <Button
            title="Fortsett trening"
            onPress={() => router.push('/(tabs)')}
            fullWidth
            size="large"
          />
          <TouchableOpacity
            style={styles.unenrollButton}
            onPress={handleUnenroll}
          >
            <Text style={styles.unenrollText}>Avslutt program</Text>
          </TouchableOpacity>
        </View>
      )}
    </>
  );
}

const createStyles = (isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? '#000000' : '#F2F2F7'
    },
    centered: {
      justifyContent: 'center',
      alignItems: 'center'
    },
    loadingText: {
      fontSize: 16,
      color: isDark ? '#8E8E93' : '#8E8E93'
    },
    content: {
      paddingBottom: 140
    },
    coverContainer: {
      height: 200,
      position: 'relative'
    },
    coverImage: {
      width: '100%',
      height: '100%'
    },
    coverOverlay: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: 80,
      backgroundColor: 'transparent',
      // Gradient would be applied here
    },
    infoSection: {
      padding: 16
    },
    programName: {
      fontSize: 28,
      fontWeight: 'bold',
      color: isDark ? '#FFFFFF' : '#000000',
      marginBottom: 12
    },
    metaRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 16
    },
    metaBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: isDark ? '#3A3A3C' : '#E5E5EA'
    },
    metaIcon: {
      fontSize: 14,
      marginRight: 6
    },
    metaText: {
      fontSize: 13,
      color: isDark ? '#EBEBF5' : '#3C3C43',
      fontWeight: '500'
    },
    description: {
      fontSize: 15,
      color: isDark ? '#EBEBF5' : '#3C3C43',
      lineHeight: 22
    },
    progressCard: {
      marginHorizontal: 16,
      marginBottom: 20
    },
    progressTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: isDark ? '#8E8E93' : '#8E8E93',
      marginBottom: 12
    },
    progressBarContainer: {
      height: 8,
      backgroundColor: isDark ? '#3A3A3C' : '#E5E5EA',
      borderRadius: 4,
      overflow: 'hidden',
      marginBottom: 8
    },
    progressBar: {
      height: '100%',
      backgroundColor: '#007AFF',
      borderRadius: 4
    },
    progressDetails: {
      flexDirection: 'row',
      justifyContent: 'space-between'
    },
    progressText: {
      fontSize: 14,
      color: isDark ? '#EBEBF5' : '#3C3C43'
    },
    progressPercentage: {
      fontSize: 14,
      fontWeight: '600',
      color: '#007AFF'
    },
    enrollCard: {
      marginHorizontal: 16,
      marginBottom: 20,
      alignItems: 'center'
    },
    enrollTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: isDark ? '#FFFFFF' : '#000000',
      marginBottom: 8
    },
    enrollSubtitle: {
      fontSize: 14,
      color: isDark ? '#8E8E93' : '#8E8E93',
      textAlign: 'center',
      marginBottom: 16
    },
    section: {
      marginBottom: 20
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: isDark ? '#FFFFFF' : '#000000',
      marginBottom: 12,
      paddingHorizontal: 16
    },
    weekSelector: {
      paddingHorizontal: 16
    },
    weekButton: {
      paddingHorizontal: 16,
      paddingVertical: 10,
      backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
      borderRadius: 20,
      marginRight: 8,
      borderWidth: 1,
      borderColor: isDark ? '#3A3A3C' : '#E5E5EA',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4
    },
    weekButtonActive: {
      backgroundColor: '#007AFF',
      borderColor: '#007AFF'
    },
    weekButtonCurrent: {
      borderColor: '#34C759',
      borderWidth: 2
    },
    weekButtonCompleted: {
      backgroundColor: isDark ? '#1C3A1C' : '#E8F5E9'
    },
    weekButtonText: {
      fontSize: 14,
      fontWeight: '500',
      color: isDark ? '#FFFFFF' : '#000000'
    },
    weekButtonTextActive: {
      color: '#FFFFFF'
    },
    weekButtonTextCompleted: {
      color: '#34C759'
    },
    weekCheckmark: {
      fontSize: 12,
      color: '#34C759'
    },
    weekCurrent: {
      fontSize: 8,
      color: '#34C759'
    },
    featuresGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      paddingHorizontal: 12,
      gap: 8
    },
    featureItem: {
      width: '48%',
      backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: isDark ? '#3A3A3C' : '#E5E5EA'
    },
    featureIcon: {
      fontSize: 24,
      marginBottom: 8
    },
    featureTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: isDark ? '#FFFFFF' : '#000000',
      marginBottom: 4
    },
    featureText: {
      fontSize: 12,
      color: isDark ? '#8E8E93' : '#8E8E93'
    },
    tipsCard: {
      marginHorizontal: 16,
      marginBottom: 16
    },
    tipsTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: isDark ? '#FFFFFF' : '#000000',
      marginBottom: 8
    },
    tipsText: {
      fontSize: 14,
      color: isDark ? '#EBEBF5' : '#3C3C43',
      lineHeight: 22
    },
    bottomBar: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
      padding: 16,
      paddingBottom: 32,
      borderTopWidth: 1,
      borderTopColor: isDark ? '#3A3A3C' : '#E5E5EA'
    },
    unenrollButton: {
      marginTop: 12,
      alignItems: 'center'
    },
    unenrollText: {
      fontSize: 14,
      color: '#FF3B30'
    }
  });
