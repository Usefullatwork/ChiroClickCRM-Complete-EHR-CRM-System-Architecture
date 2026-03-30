/**
 * Booking Screen
 * Self-service appointment booking
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  useColorScheme,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { useClinicStore } from '../../stores';
import { bookingApi, TimeSlot, BookingRequest } from '../../services/api';

export default function BookingScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const {
    bookingRequests,
    isLoading,
    error,
    fetchBookingRequests,
    requestAppointment,
    clearError,
  } = useClinicStore();

  const [date, setDate] = useState('');
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [loadingSlots, setLoadingSlots] = useState(false);

  const styles = createStyles(isDark);

  useEffect(() => {
    fetchBookingRequests();
  }, []);

  useEffect(() => {
    if (error) {
      Alert.alert('Feil', error);
      clearError();
    }
  }, [error]);

  const onRefresh = useCallback(async () => {
    await fetchBookingRequests();
  }, []);

  const handleSearchSlots = async () => {
    if (!date.trim()) {
      Alert.alert('Mangler dato', 'Vennligst skriv inn en dato (YYYY-MM-DD).');
      return;
    }

    // Basic date format validation
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date.trim())) {
      Alert.alert('Ugyldig dato', 'Bruk formatet YYYY-MM-DD (f.eks. 2026-04-01).');
      return;
    }

    setLoadingSlots(true);
    setSelectedSlot(null);
    try {
      const result = await bookingApi.getAvailableSlots(date.trim());
      setSlots(result.slots);
      if (result.slots.length === 0) {
        Alert.alert('Ingen ledige timer', 'Ingen ledige timer denne dagen. Prøv en annen dato.');
      }
    } catch (e: any) {
      Alert.alert('Feil', e.message || 'Kunne ikke hente ledige timer.');
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleBook = async () => {
    if (!date.trim()) return;

    try {
      await requestAppointment({
        preferredDate: date.trim(),
        preferredTime: selectedSlot || undefined,
        reason: reason.trim() || undefined,
      });
      Alert.alert('Sendt!', 'Din timeforespørsel er sendt. Du vil få svar fra klinikken.');
      setDate('');
      setSlots([]);
      setSelectedSlot(null);
      setReason('');
    } catch (_e: any) {
      // Error handled via store error state
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}.${month}.${year}`;
  };

  const getStatusBadge = (status: string) => {
    switch (status.toUpperCase()) {
      case 'PENDING':
        return { label: 'Venter', color: '#FF9500', bg: '#FFF3E0' };
      case 'APPROVED':
      case 'CONFIRMED':
        return { label: 'Godkjent', color: '#34C759', bg: '#E8F5E9' };
      case 'REJECTED':
      case 'DECLINED':
        return { label: 'Avslått', color: '#FF3B30', bg: '#FFEBEE' };
      case 'CANCELLED':
        return { label: 'Kansellert', color: '#8E8E93', bg: '#F2F2F7' };
      default:
        return { label: status, color: '#8E8E93', bg: '#F2F2F7' };
    }
  };

  const renderSlot = (slot: TimeSlot) => {
    const isSelected = selectedSlot === slot.time;
    return (
      <TouchableOpacity
        key={slot.time}
        style={[
          styles.slotChip,
          slot.available && styles.slotAvailable,
          !slot.available && styles.slotBooked,
          isSelected && styles.slotSelected,
        ]}
        disabled={!slot.available}
        onPress={() => setSelectedSlot(isSelected ? null : slot.time)}
      >
        <Text
          style={[
            styles.slotText,
            !slot.available && styles.slotTextBooked,
            isSelected && styles.slotTextSelected,
          ]}
        >
          {slot.time}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderBookingRequest = (item: BookingRequest) => {
    const badge = getStatusBadge(item.status);
    return (
      <View key={item.id} style={styles.requestCard}>
        <View style={styles.requestHeader}>
          <Text style={styles.requestDate}>
            {formatDate(item.preferred_date)}
            {item.preferred_time_slot ? ` kl. ${item.preferred_time_slot}` : ''}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: isDark ? badge.color + '30' : badge.bg }]}>
            <Text style={[styles.statusText, { color: badge.color }]}>
              {badge.label}
            </Text>
          </View>
        </View>
        {item.reason && (
          <Text style={styles.requestReason} numberOfLines={2}>
            {item.reason}
          </Text>
        )}
        <Text style={styles.requestCreated}>
          Sendt: {formatDate(item.created_at)}
        </Text>
      </View>
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={isLoading} onRefresh={onRefresh} />
      }
    >
      {/* Date Input */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Velg dato</Text>
        <View style={styles.dateRow}>
          <TextInput
            style={styles.dateInput}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={isDark ? '#636366' : '#AEAEB2'}
            value={date}
            onChangeText={setDate}
            keyboardType="numbers-and-punctuation"
          />
          <TouchableOpacity
            style={[styles.searchButton, loadingSlots && styles.searchButtonDisabled]}
            onPress={handleSearchSlots}
            disabled={loadingSlots}
          >
            <Text style={styles.searchButtonText}>
              {loadingSlots ? '...' : 'Søk ledige timer'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Available Slots */}
      {slots.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ledige timer</Text>
          <View style={styles.slotsGrid}>
            {slots.map(renderSlot)}
          </View>
        </View>
      )}

      {/* Reason */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Grunn til besøk (valgfritt)</Text>
        <TextInput
          style={styles.reasonInput}
          placeholder="F.eks. ryggsmerter, oppfølging..."
          placeholderTextColor={isDark ? '#636366' : '#AEAEB2'}
          value={reason}
          onChangeText={setReason}
          multiline
        />
      </View>

      {/* Submit Button */}
      <TouchableOpacity
        style={[styles.bookButton, !date.trim() && styles.bookButtonDisabled]}
        onPress={handleBook}
        disabled={!date.trim() || isLoading}
      >
        <Text style={styles.bookButtonText}>Bestill time</Text>
      </TouchableOpacity>

      {/* Existing Requests */}
      {bookingRequests.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dine forespørsler</Text>
          {bookingRequests.map(renderBookingRequest)}
        </View>
      )}
    </ScrollView>
  );
}

const createStyles = (isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? '#000000' : '#F2F2F7',
    },
    content: {
      padding: 16,
      paddingBottom: 40,
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 13,
      fontWeight: '600',
      color: isDark ? '#8E8E93' : '#8E8E93',
      textTransform: 'uppercase',
      marginBottom: 8,
      marginLeft: 4,
    },
    dateRow: {
      flexDirection: 'row',
      gap: 8,
    },
    dateInput: {
      flex: 1,
      backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
      borderRadius: 10,
      padding: 14,
      fontSize: 16,
      color: isDark ? '#FFFFFF' : '#000000',
    },
    searchButton: {
      backgroundColor: '#007AFF',
      borderRadius: 10,
      paddingHorizontal: 16,
      justifyContent: 'center',
    },
    searchButtonDisabled: {
      opacity: 0.5,
    },
    searchButtonText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '600',
    },
    slotsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    slotChip: {
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 8,
      backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
      borderWidth: 1,
      borderColor: isDark ? '#3A3A3C' : '#E5E5EA',
    },
    slotAvailable: {
      borderColor: '#34C759',
    },
    slotBooked: {
      opacity: 0.4,
    },
    slotSelected: {
      backgroundColor: '#007AFF',
      borderColor: '#007AFF',
    },
    slotText: {
      fontSize: 14,
      fontWeight: '500',
      color: isDark ? '#FFFFFF' : '#000000',
    },
    slotTextBooked: {
      color: isDark ? '#636366' : '#AEAEB2',
      textDecorationLine: 'line-through',
    },
    slotTextSelected: {
      color: '#FFFFFF',
    },
    reasonInput: {
      backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
      borderRadius: 10,
      padding: 14,
      fontSize: 16,
      color: isDark ? '#FFFFFF' : '#000000',
      minHeight: 80,
      textAlignVertical: 'top',
    },
    bookButton: {
      backgroundColor: '#34C759',
      borderRadius: 12,
      paddingVertical: 16,
      alignItems: 'center',
      marginBottom: 32,
    },
    bookButtonDisabled: {
      opacity: 0.5,
    },
    bookButtonText: {
      color: '#FFFFFF',
      fontSize: 17,
      fontWeight: '600',
    },
    requestCard: {
      backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
      borderRadius: 12,
      padding: 16,
      marginBottom: 10,
    },
    requestHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 4,
    },
    requestDate: {
      fontSize: 15,
      fontWeight: '600',
      color: isDark ? '#FFFFFF' : '#000000',
    },
    statusBadge: {
      paddingHorizontal: 10,
      paddingVertical: 3,
      borderRadius: 6,
    },
    statusText: {
      fontSize: 12,
      fontWeight: '600',
    },
    requestReason: {
      fontSize: 14,
      color: isDark ? '#EBEBF5' : '#3C3C43',
      marginTop: 4,
    },
    requestCreated: {
      fontSize: 12,
      color: isDark ? '#636366' : '#AEAEB2',
      marginTop: 6,
    },
  });
