/**
 * Messages Screen
 * Patient messaging with clinic staff
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
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useClinicStore } from '../../stores';
import { Message } from '../../services/api';

export default function MessagesScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const {
    messages,
    isLoading,
    error,
    fetchMessages,
    sendMessage,
    markRead,
    clearError,
  } = useClinicStore();

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [composeVisible, setComposeVisible] = useState(false);
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');

  const styles = createStyles(isDark);

  useEffect(() => {
    fetchMessages();
  }, []);

  useEffect(() => {
    if (error) {
      Alert.alert('Feil', error);
      clearError();
    }
  }, [error]);

  const onRefresh = useCallback(async () => {
    await fetchMessages();
  }, []);

  const handleTap = (message: Message) => {
    if (!message.is_read) {
      markRead(message.id);
    }
    setExpandedId(expandedId === message.id ? null : message.id);
    setReplyText('');
  };

  const handleReply = async (parentId: string) => {
    if (!replyText.trim()) return;
    try {
      await sendMessage(replyText.trim(), undefined, parentId);
      setReplyText('');
      setExpandedId(null);
    } catch (_e: any) {
      // Error is handled via store error state
    }
  };

  const handleCompose = async () => {
    if (!composeBody.trim()) return;
    try {
      await sendMessage(
        composeBody.trim(),
        composeSubject.trim() || undefined
      );
      setComposeSubject('');
      setComposeBody('');
      setComposeVisible(false);
    } catch (_e: any) {
      // Error is handled via store error state
    }
  };

  const getSenderBadge = (senderType: Message['sender_type']) => {
    switch (senderType) {
      case 'CLINICIAN':
        return { label: 'Klinikk', color: '#007AFF' };
      case 'PATIENT':
        return { label: 'Deg', color: '#34C759' };
      case 'SYSTEM':
        return { label: 'System', color: '#8E8E93' };
    }
  };

  const formatTimestamp = (dateStr: string) => {
    const date = new Date(dateStr);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day}.${month}.${year} ${hours}:${minutes}`;
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isExpanded = expandedId === item.id;
    const badge = getSenderBadge(item.sender_type);

    return (
      <TouchableOpacity
        style={[styles.messageCard, !item.is_read && styles.unreadCard]}
        onPress={() => handleTap(item)}
        activeOpacity={0.7}
      >
        <View style={styles.messageHeader}>
          <View style={styles.headerLeft}>
            {!item.is_read && <View style={styles.unreadDot} />}
            <View style={[styles.senderBadge, { backgroundColor: badge.color }]}>
              <Text style={styles.senderBadgeText}>{badge.label}</Text>
            </View>
          </View>
          <Text style={styles.timestamp}>{formatTimestamp(item.created_at)}</Text>
        </View>

        {item.subject && (
          <Text style={styles.subject} numberOfLines={isExpanded ? undefined : 1}>
            {item.subject}
          </Text>
        )}

        <Text style={styles.bodyPreview} numberOfLines={isExpanded ? undefined : 2}>
          {isExpanded ? item.body : item.body.slice(0, 100)}
        </Text>

        {isExpanded && (
          <View style={styles.replyContainer}>
            <TextInput
              style={styles.replyInput}
              placeholder="Skriv et svar..."
              placeholderTextColor={isDark ? '#636366' : '#AEAEB2'}
              value={replyText}
              onChangeText={setReplyText}
              multiline
            />
            <TouchableOpacity
              style={[styles.replyButton, !replyText.trim() && styles.replyButtonDisabled]}
              onPress={() => handleReply(item.id)}
              disabled={!replyText.trim()}
            >
              <Text style={styles.replyButtonText}>Send</Text>
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Ingen meldinger enda</Text>
            <Text style={styles.emptySubtext}>
              Trykk + for å sende en melding til klinikken
            </Text>
          </View>
        }
      />

      {/* Compose FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setComposeVisible(true)}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* Compose Modal */}
      <Modal
        visible={composeVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setComposeVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setComposeVisible(false)}>
              <Text style={styles.modalCancel}>Avbryt</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Ny melding</Text>
            <TouchableOpacity
              onPress={handleCompose}
              disabled={!composeBody.trim()}
            >
              <Text
                style={[
                  styles.modalSend,
                  !composeBody.trim() && styles.modalSendDisabled,
                ]}
              >
                Send
              </Text>
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.composeSubject}
            placeholder="Emne (valgfritt)"
            placeholderTextColor={isDark ? '#636366' : '#AEAEB2'}
            value={composeSubject}
            onChangeText={setComposeSubject}
          />

          <TextInput
            style={styles.composeBody}
            placeholder="Skriv din melding..."
            placeholderTextColor={isDark ? '#636366' : '#AEAEB2'}
            value={composeBody}
            onChangeText={setComposeBody}
            multiline
            textAlignVertical="top"
          />
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const createStyles = (isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? '#000000' : '#F2F2F7',
    },
    listContent: {
      padding: 16,
      paddingBottom: 100,
    },
    messageCard: {
      backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
    },
    unreadCard: {
      borderLeftWidth: 3,
      borderLeftColor: '#007AFF',
    },
    messageHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    unreadDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: '#007AFF',
    },
    senderBadge: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 4,
    },
    senderBadgeText: {
      color: '#FFFFFF',
      fontSize: 11,
      fontWeight: '600',
    },
    timestamp: {
      fontSize: 12,
      color: isDark ? '#8E8E93' : '#8E8E93',
    },
    subject: {
      fontSize: 16,
      fontWeight: '600',
      color: isDark ? '#FFFFFF' : '#000000',
      marginBottom: 4,
    },
    bodyPreview: {
      fontSize: 14,
      color: isDark ? '#EBEBF5' : '#3C3C43',
      lineHeight: 20,
    },
    replyContainer: {
      marginTop: 12,
      borderTopWidth: 1,
      borderTopColor: isDark ? '#3A3A3C' : '#E5E5EA',
      paddingTop: 12,
    },
    replyInput: {
      backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7',
      borderRadius: 8,
      padding: 12,
      fontSize: 14,
      color: isDark ? '#FFFFFF' : '#000000',
      minHeight: 60,
      textAlignVertical: 'top',
    },
    replyButton: {
      backgroundColor: '#007AFF',
      borderRadius: 8,
      paddingVertical: 10,
      alignItems: 'center',
      marginTop: 8,
    },
    replyButtonDisabled: {
      opacity: 0.5,
    },
    replyButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
    emptyContainer: {
      alignItems: 'center',
      paddingTop: 80,
    },
    emptyText: {
      fontSize: 18,
      fontWeight: '600',
      color: isDark ? '#FFFFFF' : '#000000',
      marginBottom: 8,
    },
    emptySubtext: {
      fontSize: 14,
      color: isDark ? '#8E8E93' : '#8E8E93',
    },
    fab: {
      position: 'absolute',
      bottom: 32,
      right: 24,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: '#007AFF',
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 5,
    },
    fabText: {
      color: '#FFFFFF',
      fontSize: 28,
      fontWeight: '400',
      lineHeight: 30,
    },
    modalContainer: {
      flex: 1,
      backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#3A3A3C' : '#E5E5EA',
    },
    modalCancel: {
      fontSize: 16,
      color: '#007AFF',
    },
    modalTitle: {
      fontSize: 17,
      fontWeight: '600',
      color: isDark ? '#FFFFFF' : '#000000',
    },
    modalSend: {
      fontSize: 16,
      fontWeight: '600',
      color: '#007AFF',
    },
    modalSendDisabled: {
      opacity: 0.5,
    },
    composeSubject: {
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#3A3A3C' : '#E5E5EA',
      padding: 16,
      fontSize: 16,
      color: isDark ? '#FFFFFF' : '#000000',
    },
    composeBody: {
      flex: 1,
      padding: 16,
      fontSize: 16,
      color: isDark ? '#FFFFFF' : '#000000',
    },
  });
