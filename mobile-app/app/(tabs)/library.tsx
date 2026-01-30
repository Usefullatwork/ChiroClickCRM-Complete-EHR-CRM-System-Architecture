/**
 * Exercise Library Screen
 * Browse and search all exercises
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  useColorScheme,
  TouchableOpacity,
  TextInput
} from 'react-native';
import { router } from 'expo-router';
import { ExerciseCard, Card } from '../../components';
import { useExerciseStore } from '../../stores';
import { Exercise } from '../../services/api';

export default function LibraryScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const {
    exercises,
    categories,
    favorites,
    isLoading,
    fetchExercises,
    setFilters,
    getFilteredExercises,
    toggleFavorite,
    addToRecentlyViewed
  } = useExerciseStore();

  const styles = createStyles(isDark);

  useEffect(() => {
    fetchExercises();
  }, []);

  useEffect(() => {
    setFilters({
      search: searchQuery,
      category: selectedCategory || undefined
    });
  }, [searchQuery, selectedCategory]);

  const onRefresh = useCallback(async () => {
    await fetchExercises(true);
  }, []);

  const handleExercisePress = (exercise: Exercise) => {
    addToRecentlyViewed(exercise.id);
    router.push({
      pathname: '/exercise/[id]',
      params: { id: exercise.id }
    });
  };

  const filteredExercises = getFilteredExercises();

  const renderExercise = ({ item }: { item: Exercise }) => (
    <ExerciseCard
      exercise={item}
      onPress={() => handleExercisePress(item)}
    />
  );

  const renderHeader = () => (
    <View>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Søk etter øvelser..."
            placeholderTextColor={isDark ? '#636366' : '#AEAEB2'}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={styles.clearIcon}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Category Filters */}
      <View style={styles.categoriesContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={[null, ...categories]}
          keyExtractor={(item) => item || 'all'}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.categoryChip,
                selectedCategory === item && styles.categoryChipActive
              ]}
              onPress={() => setSelectedCategory(item)}
            >
              <Text
                style={[
                  styles.categoryChipText,
                  selectedCategory === item && styles.categoryChipTextActive
                ]}
              >
                {item || 'Alle'}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Results Count */}
      <Text style={styles.resultsCount}>
        {filteredExercises.length} øvelse{filteredExercises.length !== 1 ? 'r' : ''}
        {selectedCategory && ` i ${selectedCategory}`}
      </Text>
    </View>
  );

  const renderEmpty = () => (
    <Card style={styles.emptyCard}>
      <View style={styles.emptyContent}>
        <Text style={styles.emptyIcon}>🔍</Text>
        <Text style={styles.emptyTitle}>Ingen øvelser funnet</Text>
        <Text style={styles.emptySubtitle}>
          Prøv et annet søkeord eller fjern filtre
        </Text>
      </View>
    </Card>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredExercises}
        renderItem={renderExercise}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={onRefresh}
            tintColor={isDark ? '#FFFFFF' : '#000000'}
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const createStyles = (isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? '#000000' : '#F2F2F7'
    },
    listContent: {
      padding: 16,
      paddingBottom: 100
    },
    searchContainer: {
      marginBottom: 12
    },
    searchInputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
      borderRadius: 12,
      paddingHorizontal: 12,
      height: 44,
      borderWidth: 1,
      borderColor: isDark ? '#3A3A3C' : '#E5E5EA'
    },
    searchIcon: {
      fontSize: 16,
      marginRight: 8
    },
    searchInput: {
      flex: 1,
      fontSize: 16,
      color: isDark ? '#FFFFFF' : '#000000'
    },
    clearIcon: {
      fontSize: 16,
      color: isDark ? '#8E8E93' : '#8E8E93',
      padding: 4
    },
    categoriesContainer: {
      marginBottom: 16
    },
    categoryChip: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
      borderRadius: 20,
      marginRight: 8,
      borderWidth: 1,
      borderColor: isDark ? '#3A3A3C' : '#E5E5EA'
    },
    categoryChipActive: {
      backgroundColor: '#007AFF',
      borderColor: '#007AFF'
    },
    categoryChipText: {
      fontSize: 14,
      color: isDark ? '#FFFFFF' : '#000000',
      textTransform: 'capitalize'
    },
    categoryChipTextActive: {
      color: '#FFFFFF'
    },
    resultsCount: {
      fontSize: 13,
      color: isDark ? '#8E8E93' : '#8E8E93',
      marginBottom: 12
    },
    emptyCard: {
      padding: 32,
      marginTop: 20
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
      textAlign: 'center'
    }
  });
