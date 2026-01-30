/**
 * Completion Modal Component
 * Shows after completing an exercise with feedback inputs
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  useColorScheme,
  Animated,
  ScrollView,
  KeyboardAvoidingView,
  Platform
} from 'react-native';

interface CompletionData {
  setsCompleted?: number;
  repsCompleted?: number;
  weightKg?: number;
  holdSecondsCompleted?: number;
  rirActual?: number;
  painRating?: number;
  difficultyRating?: number;
  sorenessRating?: number;
  notes?: string;
}

interface CompletionModalProps {
  visible: boolean;
  exerciseName: string;
  expectedSets?: number;
  expectedReps?: string;
  expectedHold?: number;
  showWeight?: boolean;
  showRir?: boolean;
  onComplete: (data: CompletionData) => void;
  onSkip?: () => void;
  onClose: () => void;
}

export function CompletionModal({
  visible,
  exerciseName,
  expectedSets,
  expectedReps,
  expectedHold,
  showWeight = false,
  showRir = false,
  onComplete,
  onSkip,
  onClose
}: CompletionModalProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [setsCompleted, setSetsCompleted] = useState(expectedSets?.toString() || '');
  const [repsCompleted, setRepsCompleted] = useState(expectedReps?.split('-')[0] || '');
  const [weightKg, setWeightKg] = useState('');
  const [holdSeconds, setHoldSeconds] = useState(expectedHold?.toString() || '');
  const [rirActual, setRirActual] = useState('');
  const [painRating, setPainRating] = useState<number | null>(null);
  const [difficultyRating, setDifficultyRating] = useState<number | null>(null);
  const [sorenessRating, setSorenessRating] = useState<number | null>(null);
  const [notes, setNotes] = useState('');

  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  const styles = createStyles(isDark);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          friction: 8
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true
        })
      ]).start();
    } else {
      scaleAnim.setValue(0.9);
      opacityAnim.setValue(0);
    }
  }, [visible]);

  const handleComplete = () => {
    const data: CompletionData = {
      painRating: painRating ?? undefined,
      difficultyRating: difficultyRating ?? undefined,
      sorenessRating: sorenessRating ?? undefined,
      notes: notes || undefined
    };

    if (setsCompleted) data.setsCompleted = parseInt(setsCompleted);
    if (repsCompleted) data.repsCompleted = parseInt(repsCompleted);
    if (weightKg) data.weightKg = parseFloat(weightKg);
    if (holdSeconds) data.holdSecondsCompleted = parseInt(holdSeconds);
    if (rirActual) data.rirActual = parseInt(rirActual);

    onComplete(data);
    resetForm();
  };

  const resetForm = () => {
    setSetsCompleted(expectedSets?.toString() || '');
    setRepsCompleted(expectedReps?.split('-')[0] || '');
    setWeightKg('');
    setHoldSeconds(expectedHold?.toString() || '');
    setRirActual('');
    setPainRating(null);
    setDifficultyRating(null);
    setSorenessRating(null);
    setNotes('');
  };

  // Rating selector component
  const RatingSelector = ({
    label,
    value,
    onChange,
    maxRating,
    labels,
    colors
  }: {
    label: string;
    value: number | null;
    onChange: (v: number) => void;
    maxRating: number;
    labels?: string[];
    colors?: string[];
  }) => (
    <View style={styles.ratingContainer}>
      <Text style={styles.ratingLabel}>{label}</Text>
      <View style={styles.ratingButtons}>
        {Array.from({ length: maxRating + 1 }, (_, i) => (
          <TouchableOpacity
            key={i}
            style={[
              styles.ratingButton,
              value === i && styles.ratingButtonSelected,
              value === i && colors && { backgroundColor: colors[i] }
            ]}
            onPress={() => onChange(i)}
          >
            <Text
              style={[
                styles.ratingButtonText,
                value === i && styles.ratingButtonTextSelected
              ]}
            >
              {i}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {labels && (
        <View style={styles.ratingLabels}>
          <Text style={styles.ratingLabelSmall}>{labels[0]}</Text>
          <Text style={styles.ratingLabelSmall}>{labels[labels.length - 1]}</Text>
        </View>
      )}
    </View>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />

        <Animated.View
          style={[
            styles.modalContent,
            {
              opacity: opacityAnim,
              transform: [{ scale: scaleAnim }]
            }
          ]}
        >
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.headerIcon}>🎉</Text>
              <Text style={styles.headerTitle}>Bra jobbet!</Text>
              <Text style={styles.exerciseName}>{exerciseName}</Text>
            </View>

            {/* Performance Inputs */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Hva fullførte du?</Text>

              <View style={styles.inputRow}>
                {expectedSets && (
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Sett</Text>
                    <TextInput
                      style={styles.input}
                      value={setsCompleted}
                      onChangeText={setSetsCompleted}
                      keyboardType="number-pad"
                      placeholder={expectedSets.toString()}
                      placeholderTextColor={isDark ? '#636366' : '#AEAEB2'}
                    />
                  </View>
                )}

                {expectedReps && (
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Reps</Text>
                    <TextInput
                      style={styles.input}
                      value={repsCompleted}
                      onChangeText={setRepsCompleted}
                      keyboardType="number-pad"
                      placeholder={expectedReps}
                      placeholderTextColor={isDark ? '#636366' : '#AEAEB2'}
                    />
                  </View>
                )}

                {showWeight && (
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Vekt (kg)</Text>
                    <TextInput
                      style={styles.input}
                      value={weightKg}
                      onChangeText={setWeightKg}
                      keyboardType="decimal-pad"
                      placeholder="0"
                      placeholderTextColor={isDark ? '#636366' : '#AEAEB2'}
                    />
                  </View>
                )}

                {expectedHold && (
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Hold (sek)</Text>
                    <TextInput
                      style={styles.input}
                      value={holdSeconds}
                      onChangeText={setHoldSeconds}
                      keyboardType="number-pad"
                      placeholder={expectedHold.toString()}
                      placeholderTextColor={isDark ? '#636366' : '#AEAEB2'}
                    />
                  </View>
                )}
              </View>

              {showRir && (
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>RIR (Reps in Reserve)</Text>
                  <TextInput
                    style={styles.input}
                    value={rirActual}
                    onChangeText={setRirActual}
                    keyboardType="number-pad"
                    placeholder="0-4"
                    placeholderTextColor={isDark ? '#636366' : '#AEAEB2'}
                  />
                </View>
              )}
            </View>

            {/* Feedback Ratings */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Hvordan føltes det?</Text>

              <RatingSelector
                label="Smerte under øvelsen"
                value={painRating}
                onChange={setPainRating}
                maxRating={10}
                labels={['Ingen smerte', 'Verst tenkelig']}
                colors={[
                  '#34C759', '#4CD964', '#7ED321', '#A8D65C', '#C8E06A',
                  '#FFD60A', '#FFCC00', '#FF9500', '#FF6B00', '#FF3B30', '#D32F2F'
                ]}
              />

              <RatingSelector
                label="Vanskelighetsgrad"
                value={difficultyRating}
                onChange={setDifficultyRating}
                maxRating={5}
                labels={['Veldig lett', 'Veldig vanskelig']}
              />

              <RatingSelector
                label="Stølhet/ømhet"
                value={sorenessRating}
                onChange={setSorenessRating}
                maxRating={5}
                labels={['Ingen', 'Veldig stiv']}
              />
            </View>

            {/* Notes */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Notater (valgfritt)</Text>
              <TextInput
                style={styles.notesInput}
                value={notes}
                onChangeText={setNotes}
                placeholder="Hvordan gikk det? Noe å merke seg?"
                placeholderTextColor={isDark ? '#636366' : '#AEAEB2'}
                multiline
                numberOfLines={3}
              />
            </View>

            {/* Actions */}
            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.completeButton}
                onPress={handleComplete}
              >
                <Text style={styles.completeButtonText}>Lagre og fortsett</Text>
              </TouchableOpacity>

              {onSkip && (
                <TouchableOpacity
                  style={styles.skipButton}
                  onPress={() => {
                    resetForm();
                    onSkip();
                  }}
                >
                  <Text style={styles.skipButtonText}>Hopp over</Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const createStyles = (isDark: boolean) =>
  StyleSheet.create({
    modalOverlay: {
      flex: 1,
      justifyContent: 'flex-end'
    },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0, 0, 0, 0.5)'
    },
    modalContent: {
      backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      maxHeight: '90%',
      padding: 24
    },
    header: {
      alignItems: 'center',
      marginBottom: 24
    },
    headerIcon: {
      fontSize: 48,
      marginBottom: 8
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: isDark ? '#FFFFFF' : '#000000',
      marginBottom: 4
    },
    exerciseName: {
      fontSize: 16,
      color: isDark ? '#8E8E93' : '#8E8E93',
      textAlign: 'center'
    },
    section: {
      marginBottom: 24
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: isDark ? '#FFFFFF' : '#000000',
      marginBottom: 12
    },
    inputRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12
    },
    inputGroup: {
      flex: 1,
      minWidth: 80,
      marginBottom: 12
    },
    inputLabel: {
      fontSize: 13,
      color: isDark ? '#8E8E93' : '#8E8E93',
      marginBottom: 6
    },
    input: {
      backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7',
      borderRadius: 10,
      padding: 12,
      fontSize: 16,
      color: isDark ? '#FFFFFF' : '#000000',
      textAlign: 'center'
    },
    ratingContainer: {
      marginBottom: 16
    },
    ratingLabel: {
      fontSize: 14,
      color: isDark ? '#EBEBF5' : '#3C3C43',
      marginBottom: 8
    },
    ratingButtons: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6
    },
    ratingButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7',
      justifyContent: 'center',
      alignItems: 'center'
    },
    ratingButtonSelected: {
      backgroundColor: '#007AFF'
    },
    ratingButtonText: {
      fontSize: 14,
      fontWeight: '500',
      color: isDark ? '#FFFFFF' : '#000000'
    },
    ratingButtonTextSelected: {
      color: '#FFFFFF'
    },
    ratingLabels: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 6
    },
    ratingLabelSmall: {
      fontSize: 11,
      color: isDark ? '#636366' : '#AEAEB2'
    },
    notesInput: {
      backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7',
      borderRadius: 12,
      padding: 14,
      fontSize: 15,
      color: isDark ? '#FFFFFF' : '#000000',
      minHeight: 80,
      textAlignVertical: 'top'
    },
    actions: {
      gap: 12,
      marginTop: 8
    },
    completeButton: {
      backgroundColor: '#34C759',
      borderRadius: 14,
      padding: 16,
      alignItems: 'center'
    },
    completeButtonText: {
      fontSize: 17,
      fontWeight: '600',
      color: '#FFFFFF'
    },
    skipButton: {
      padding: 12,
      alignItems: 'center'
    },
    skipButtonText: {
      fontSize: 15,
      color: isDark ? '#8E8E93' : '#8E8E93'
    }
  });

export default CompletionModal;
