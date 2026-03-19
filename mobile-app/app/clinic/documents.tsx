/**
 * Documents Screen
 * View and download clinic documents
 */

import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  useColorScheme,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import { useClinicStore } from '../../stores';
import { PatientDocument, documentApi } from '../../services/api';

export default function DocumentsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const { documents, isLoading, error, fetchDocuments, clearError } =
    useClinicStore();

  const styles = createStyles(isDark);

  useEffect(() => {
    fetchDocuments();
  }, []);

  useEffect(() => {
    if (error) {
      Alert.alert('Feil', error);
      clearError();
    }
  }, [error]);

  const onRefresh = useCallback(async () => {
    await fetchDocuments();
  }, []);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  };

  const handleDownload = (doc: PatientDocument) => {
    if (doc.expired) {
      Alert.alert('Utløpt', 'Dette dokumentet er utløpt og kan ikke lastes ned.');
      return;
    }
    if (!doc.downloadToken) {
      Alert.alert('Feil', 'Nedlastingslenke er ikke tilgjengelig.');
      return;
    }
    const url = documentApi.getDownloadUrl(doc.downloadToken);
    Linking.openURL(url);
  };

  const getTypeBadgeColor = (docType: string) => {
    switch (docType.toLowerCase()) {
      case 'invoice':
      case 'faktura':
        return '#FF9500';
      case 'referral':
      case 'henvisning':
        return '#5856D6';
      case 'report':
      case 'rapport':
        return '#007AFF';
      case 'exercise':
      case 'øvelser':
        return '#34C759';
      default:
        return '#8E8E93';
    }
  };

  const renderDocument = ({ item }: { item: PatientDocument }) => (
    <TouchableOpacity
      style={styles.docCard}
      onPress={() => handleDownload(item)}
      disabled={item.expired}
      activeOpacity={0.7}
    >
      <View style={styles.docHeader}>
        <View style={styles.docTitleRow}>
          <Text style={styles.docTitle} numberOfLines={2}>
            {item.title}
          </Text>
          {item.expired && (
            <View style={styles.expiredBadge}>
              <Text style={styles.expiredBadgeText}>Utløpt</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.docMeta}>
        <View
          style={[
            styles.typeBadge,
            { backgroundColor: getTypeBadgeColor(item.documentType) },
          ]}
        >
          <Text style={styles.typeBadgeText}>{item.documentType}</Text>
        </View>
        <Text style={styles.docDate}>{formatDate(item.createdAt)}</Text>
      </View>

      {!item.expired && item.downloadToken && (
        <View style={styles.downloadRow}>
          <Text style={styles.downloadText}>Last ned</Text>
          <Text style={styles.downloadChevron}>›</Text>
        </View>
      )}

      {item.downloadedAt && (
        <Text style={styles.downloadedInfo}>
          Lastet ned: {formatDate(item.downloadedAt)}
        </Text>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={documents}
        keyExtractor={(item) => item.id}
        renderItem={renderDocument}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Ingen dokumenter</Text>
            <Text style={styles.emptySubtext}>
              Dokumenter fra klinikken vises her
            </Text>
          </View>
        }
      />
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
      paddingBottom: 40,
    },
    docCard: {
      backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
    },
    docHeader: {
      marginBottom: 8,
    },
    docTitleRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    docTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: isDark ? '#FFFFFF' : '#000000',
      flex: 1,
      marginRight: 8,
    },
    expiredBadge: {
      backgroundColor: '#FF3B30',
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 4,
    },
    expiredBadgeText: {
      color: '#FFFFFF',
      fontSize: 11,
      fontWeight: '600',
    },
    docMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 8,
    },
    typeBadge: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 4,
    },
    typeBadgeText: {
      color: '#FFFFFF',
      fontSize: 11,
      fontWeight: '600',
    },
    docDate: {
      fontSize: 13,
      color: isDark ? '#8E8E93' : '#8E8E93',
    },
    downloadRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderTopWidth: 1,
      borderTopColor: isDark ? '#3A3A3C' : '#E5E5EA',
      paddingTop: 10,
      marginTop: 4,
    },
    downloadText: {
      fontSize: 15,
      color: '#007AFF',
      fontWeight: '500',
    },
    downloadChevron: {
      fontSize: 18,
      color: '#007AFF',
    },
    downloadedInfo: {
      fontSize: 12,
      color: isDark ? '#636366' : '#AEAEB2',
      marginTop: 4,
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
  });
