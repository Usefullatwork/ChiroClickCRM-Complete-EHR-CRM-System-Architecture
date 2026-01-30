/**
 * Exercise Detail Screen
 * Shows exercise video, instructions, and completion logging
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  useColorScheme,
  TouchableOpacity,
  Alert
} from 'react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import {
  VideoPlayer,
  ExerciseTimer,
  CompletionModal,
  Button,
  Card
} from '../../components';
import { useExerciseStore, useProgramStore, useOfflineStore } from '../../stores';

export default function ExerciseDetailScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { id } = useLocalSearchParams<{ id: string }>();

  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'video' | 'instructions'>('video');

  const { selectedExercise, fetchExerciseById, addToRecentlyViewed, toggleFavorite, favorites } = useExerciseStore();
  const { logWorkout, todayExercises } = useProgramStore();
  const { isVideoDownloaded, getVideoLocalPath } = useOfflineStore();

  const styles = createStyles(isDark);

  useEffect(() => {
    if (id) {
      fetchExerciseById(id);
      addToRecentlyViewed(id);
    }
  }, [id]);

  const exercise = selectedExercise;
  const isFavorite = exercise ? favorites.includes(exercise.id) : false;

  // Get today's exercise info if this is part of today's workout
  const todayExercise = todayExercises.find(e =>
    e.exerciseId === id || e.id === id
  );

  const handleComplete = useCallback(async (data: any) => {
    if (!id) return;

    try {
      await logWorkout(id, data);
      setShowCompletionModal(false);

      // Find next incomplete exercise
      const currentIndex = todayExercises.findIndex(e => e.id === id || e.exerciseId === id);
      const nextExercise = todayExercises.slice(currentIndex + 1).find(e => !e.completed);

      if (nextExercise) {
        Alert.alert(
          'Bra jobbet! 💪',
          'Vil du fortsette til neste øvelse?',
          [
            { text: 'Pause', style: 'cancel' },
            {
              text: 'Neste øvelse',
              onPress: () => router.replace({
                pathname: '/exercise/[id]',
                params: { id: nextExercise.id }
              })
            }
          ]
        );
      } else {
        Alert.alert(
          'Gratulerer! 🎉',
          'Du har fullført alle dagens øvelser!',
          [{ text: 'Fantastisk!', onPress: () => router.back() }]
        );
      }
    } catch (error) {
      Alert.alert('Feil', 'Kunne ikke lagre. Prøv igjen.');
    }
  }, [id, todayExercises]);

  if (!exercise) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.loadingText}>Laster øvelse...</Text>
      </View>
    );
  }

  const displayName = exercise.nameNorwegian || exercise.name;
  const description = exercise.descriptionNorwegian || exercise.description;
  const instructions = exercise.instructionsNorwegian || exercise.instructions;

  return (
    <>
      <Stack.Screen
        options={{
          title: displayName,
          headerRight: () => (
            <TouchableOpacity
              onPress={() => toggleFavorite(exercise.id)}
              style={styles.favoriteButton}
            >
              <Text style={styles.favoriteIcon}>
                {isFavorite ? '❤️' : '🤍'}
              </Text>
            </TouchableOpacity>
          )
        }}
      />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Video Player */}
        <View style={styles.videoSection}>
          <VideoPlayer
            videoUrl={exercise.videoUrl}
            videoId={exercise.videoId}
            title=""
          />
        </View>

        {/* Tab Switcher */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'video' && styles.tabActive]}
            onPress={() => setActiveTab('video')}
          >
            <Text style={[styles.tabText, activeTab === 'video' && styles.tabTextActive]}>
              Detaljer
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'instructions' && styles.tabActive]}
            onPress={() => setActiveTab('instructions')}
          >
            <Text style={[styles.tabText, activeTab === 'instructions' && styles.tabTextActive]}>
              Instruksjoner
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'video' ? (
          <>
            {/* Exercise Info */}
            <View style={styles.infoSection}>
              <Text style={styles.exerciseName}>{displayName}</Text>

              <View style={styles.metaRow}>
                <View style={styles.metaBadge}>
                  <Text style={styles.metaIcon}>📁</Text>
                  <Text style={styles.metaText}>{exercise.category}</Text>
                </View>
                {exercise.bodyRegion && (
                  <View style={styles.metaBadge}>
                    <Text style={styles.metaIcon}>🎯</Text>
                    <Text style={styles.metaText}>{exercise.bodyRegion}</Text>
                  </View>
                )}
                {exercise.difficultyLevel && (
                  <View style={styles.metaBadge}>
                    <Text style={styles.metaIcon}>📊</Text>
                    <Text style={styles.metaText}>{exercise.difficultyLevel}</Text>
                  </View>
                )}
              </View>

              {description && (
                <Text style={styles.description}>{description}</Text>
              )}
            </View>

            {/* Today's Parameters (if part of today's workout) */}
            {todayExercise && (
              <Card style={styles.paramsCard} variant="filled">
                <Text style={styles.paramsTitle}>Dagens mål</Text>
                <View style={styles.paramsRow}>
                  {todayExercise.sets && (
                    <View style={styles.paramItem}>
                      <Text style={styles.paramValue}>{todayExercise.sets}</Text>
                      <Text style={styles.paramLabel}>Sett</Text>
                    </View>
                  )}
                  {todayExercise.reps && (
                    <View style={styles.paramItem}>
                      <Text style={styles.paramValue}>{todayExercise.reps}</Text>
                      <Text style={styles.paramLabel}>Reps</Text>
                    </View>
                  )}
                  {todayExercise.holdSeconds && (
                    <View style={styles.paramItem}>
                      <Text style={styles.paramValue}>{todayExercise.holdSeconds}s</Text>
                      <Text style={styles.paramLabel}>Hold</Text>
                    </View>
                  )}
                </View>
              </Card>
            )}

            {/* Timer (if hold seconds specified) */}
            {todayExercise?.holdSeconds && (
              <Card style={styles.timerCard}>
                <ExerciseTimer
                  initialSeconds={todayExercise.holdSeconds}
                  mode="hold"
                  size="medium"
                />
              </Card>
            )}
          </>
        ) : (
          /* Instructions Tab */
          <View style={styles.instructionsSection}>
            {instructions ? (
              instructions.split('\n').map((line: string, index: number) => (
                <View key={index} style={styles.instructionItem}>
                  <Text style={styles.instructionNumber}>{index + 1}</Text>
                  <Text style={styles.instructionText}>{line.trim()}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.noInstructions}>
                Ingen detaljerte instruksjoner tilgjengelig. Se videoen for veiledning.
              </Text>
            )}
          </View>
        )}

        {/* Tips */}
        {exercise.tips && (
          <Card style={styles.tipsCard} variant="outlined">
            <Text style={styles.tipsTitle}>💡 Tips</Text>
            <Text style={styles.tipsText}>{exercise.tips}</Text>
          </Card>
        )}
      </ScrollView>

      {/* Complete Button */}
      {todayExercise && !todayExercise.completed && (
        <View style={styles.bottomBar}>
          <Button
            title="Marker som fullført"
            onPress={() => setShowCompletionModal(true)}
            fullWidth
            size="large"
          />
        </View>
      )}

      {/* Completion Modal */}
      <CompletionModal
        visible={showCompletionModal}
        exerciseName={displayName}
        expectedSets={todayExercise?.sets}
        expectedReps={todayExercise?.reps}
        expectedHold={todayExercise?.holdSeconds}
        onComplete={handleComplete}
        onSkip={() => {
          setShowCompletionModal(false);
          router.back();
        }}
        onClose={() => setShowCompletionModal(false)}
      />
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
      paddingBottom: 120
    },
    favoriteButton: {
      padding: 8
    },
    favoriteIcon: {
      fontSize: 24
    },
    videoSection: {
      paddingHorizontal: 16,
      paddingTop: 16
    },
    tabContainer: {
      flexDirection: 'row',
      marginHorizontal: 16,
      marginTop: 16,
      backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
      borderRadius: 12,
      padding: 4
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
    infoSection: {
      padding: 16
    },
    exerciseName: {
      fontSize: 24,
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
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 8
    },
    metaIcon: {
      fontSize: 14,
      marginRight: 6
    },
    metaText: {
      fontSize: 13,
      color: isDark ? '#EBEBF5' : '#3C3C43',
      textTransform: 'capitalize'
    },
    description: {
      fontSize: 15,
      color: isDark ? '#EBEBF5' : '#3C3C43',
      lineHeight: 22
    },
    paramsCard: {
      marginHorizontal: 16,
      marginBottom: 16
    },
    paramsTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: isDark ? '#8E8E93' : '#8E8E93',
      marginBottom: 12
    },
    paramsRow: {
      flexDirection: 'row',
      justifyContent: 'space-around'
    },
    paramItem: {
      alignItems: 'center'
    },
    paramValue: {
      fontSize: 28,
      fontWeight: 'bold',
      color: '#007AFF'
    },
    paramLabel: {
      fontSize: 12,
      color: isDark ? '#8E8E93' : '#8E8E93',
      marginTop: 4
    },
    timerCard: {
      marginHorizontal: 16,
      marginBottom: 16,
      alignItems: 'center',
      paddingVertical: 24
    },
    instructionsSection: {
      padding: 16
    },
    instructionItem: {
      flexDirection: 'row',
      marginBottom: 16
    },
    instructionNumber: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: '#007AFF',
      color: '#FFFFFF',
      textAlign: 'center',
      lineHeight: 28,
      fontSize: 14,
      fontWeight: '600',
      marginRight: 12
    },
    instructionText: {
      flex: 1,
      fontSize: 15,
      color: isDark ? '#EBEBF5' : '#3C3C43',
      lineHeight: 22
    },
    noInstructions: {
      fontSize: 15,
      color: isDark ? '#8E8E93' : '#8E8E93',
      fontStyle: 'italic',
      textAlign: 'center',
      paddingVertical: 24
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
      lineHeight: 20
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
    }
  });
