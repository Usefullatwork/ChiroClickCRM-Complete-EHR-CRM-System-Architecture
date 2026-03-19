/**
 * Profile Screen
 * User settings and account management
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  useColorScheme,
  TouchableOpacity,
  Switch,
  Alert,
  Linking
} from 'react-native';
import { router } from 'expo-router';
import { Card, Button } from '../../components';
import { useAuthStore, useOfflineStore, useClinicStore } from '../../stores';
import { formatBytes } from '../../stores/offlineStore';

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const { user, logout } = useAuthStore();
  const { autoSync, syncOnWifiOnly, totalDownloadSize, setAutoSync, setSyncOnWifiOnly, clearDownloadedVideos } = useOfflineStore();
  const { unreadCount, fetchMessages } = useClinicStore();

  useEffect(() => { fetchMessages(); }, []);

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const styles = createStyles(isDark);

  const handleLogout = () => {
    Alert.alert(
      'Logg ut',
      'Er du sikker på at du vil logge ut?',
      [
        { text: 'Avbryt', style: 'cancel' },
        {
          text: 'Logg ut',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/(auth)/login');
          }
        }
      ]
    );
  };

  const handleClearDownloads = () => {
    Alert.alert(
      'Slett nedlastinger',
      'Dette vil slette alle nedlastede videoer. Du kan laste dem ned igjen senere.',
      [
        { text: 'Avbryt', style: 'cancel' },
        {
          text: 'Slett',
          style: 'destructive',
          onPress: () => {
            clearDownloadedVideos();
            Alert.alert('Slettet', 'Alle nedlastede videoer er slettet.');
          }
        }
      ]
    );
  };

  const openLink = (url: string) => {
    Linking.openURL(url);
  };

  const SettingRow = ({
    icon,
    title,
    subtitle,
    onPress,
    rightElement
  }: {
    icon: string;
    title: string;
    subtitle?: string;
    onPress?: () => void;
    rightElement?: React.ReactNode;
  }) => (
    <TouchableOpacity
      style={styles.settingRow}
      onPress={onPress}
      disabled={!onPress}
    >
      <Text style={styles.settingIcon}>{icon}</Text>
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      {rightElement || (onPress && <Text style={styles.settingChevron}>›</Text>)}
    </TouchableOpacity>
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Profile Header */}
      <Card style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.displayName?.[0]?.toUpperCase() || '👤'}
          </Text>
        </View>
        <Text style={styles.userName}>{user?.displayName || 'Bruker'}</Text>
        <Text style={styles.userPhone}>{user?.phoneNumber}</Text>
        <Button
          title="Rediger profil"
          variant="outline"
          size="small"
          onPress={() => Alert.alert('Kommer snart', 'Profilredigering kommer i en oppdatering.')}
        />
      </Card>

      {/* Notifications */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Varsler</Text>
        <Card padding="none">
          <SettingRow
            icon="🔔"
            title="Påminnelser"
            subtitle="Daglige treningspåminnelser"
            rightElement={
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: '#767577', true: '#34C759' }}
                thumbColor="#FFFFFF"
              />
            }
          />
        </Card>
      </View>

      {/* Offline & Data */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Lagring og data</Text>
        <Card padding="none">
          <SettingRow
            icon="📥"
            title="Nedlastede videoer"
            subtitle={formatBytes(totalDownloadSize)}
            onPress={handleClearDownloads}
          />
          <SettingRow
            icon="🔄"
            title="Auto-synkronisering"
            subtitle="Synkroniser automatisk når tilkoblet"
            rightElement={
              <Switch
                value={autoSync}
                onValueChange={setAutoSync}
                trackColor={{ false: '#767577', true: '#34C759' }}
                thumbColor="#FFFFFF"
              />
            }
          />
          <SettingRow
            icon="📶"
            title="Kun på WiFi"
            subtitle="Synkroniser kun over WiFi"
            rightElement={
              <Switch
                value={syncOnWifiOnly}
                onValueChange={setSyncOnWifiOnly}
                trackColor={{ false: '#767577', true: '#34C759' }}
                thumbColor="#FFFFFF"
              />
            }
          />
        </Card>
      </View>

      {/* Social Links */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Følg oss</Text>
        <Card padding="none">
          <SettingRow
            icon="📸"
            title="Instagram"
            onPress={() => openLink('https://instagram.com/chiroclick')}
          />
          <SettingRow
            icon="📘"
            title="Facebook"
            onPress={() => openLink('https://facebook.com/chiroclick')}
          />
          <SettingRow
            icon="🎵"
            title="TikTok"
            onPress={() => openLink('https://tiktok.com/@chiroclick')}
          />
          <SettingRow
            icon="▶️"
            title="YouTube"
            onPress={() => openLink('https://youtube.com/@chiroclick')}
          />
        </Card>
      </View>

      {/* Klinikk */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Klinikk</Text>
        <Card padding="none">
          <SettingRow
            icon="💬"
            title={`Meldinger${unreadCount > 0 ? ` (${unreadCount})` : ''}`}
            subtitle="Send og motta meldinger"
            onPress={() => router.push('/clinic/messages')}
          />
          <SettingRow
            icon="📋"
            title="Dokumenter"
            subtitle="Last ned dokumenter"
            onPress={() => router.push('/clinic/documents')}
          />
          <SettingRow
            icon="📅"
            title="Timebestilling"
            subtitle="Bestill time online"
            onPress={() => router.push('/clinic/booking')}
          />
        </Card>
      </View>

      {/* Support */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Support</Text>
        <Card padding="none">
          <SettingRow
            icon="❓"
            title="Hjelp og FAQ"
            onPress={() => openLink('https://chiroclick.no/help')}
          />
          <SettingRow
            icon="💬"
            title="Kontakt oss"
            onPress={() => openLink('mailto:support@chiroclick.no')}
          />
          <SettingRow
            icon="⭐"
            title="Vurder appen"
            onPress={() => Alert.alert('Takk!', 'Vi setter pris på din tilbakemelding.')}
          />
        </Card>
      </View>

      {/* Legal */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Juridisk</Text>
        <Card padding="none">
          <SettingRow
            icon="📄"
            title="Vilkår for bruk"
            onPress={() => openLink('https://chiroclick.no/terms')}
          />
          <SettingRow
            icon="🔒"
            title="Personvernerklæring"
            onPress={() => openLink('https://chiroclick.no/privacy')}
          />
        </Card>
      </View>

      {/* Logout */}
      <Button
        title="Logg ut"
        variant="danger"
        fullWidth
        onPress={handleLogout}
        style={styles.logoutButton}
      />

      {/* App Version */}
      <Text style={styles.version}>ChiroClick v1.0.0</Text>
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
    profileCard: {
      alignItems: 'center',
      paddingVertical: 24,
      marginBottom: 24
    },
    avatar: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: '#007AFF',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 12
    },
    avatarText: {
      fontSize: 32,
      color: '#FFFFFF',
      fontWeight: 'bold'
    },
    userName: {
      fontSize: 20,
      fontWeight: '600',
      color: isDark ? '#FFFFFF' : '#000000',
      marginBottom: 4
    },
    userPhone: {
      fontSize: 14,
      color: isDark ? '#8E8E93' : '#8E8E93',
      marginBottom: 16
    },
    section: {
      marginBottom: 24
    },
    sectionTitle: {
      fontSize: 13,
      fontWeight: '600',
      color: isDark ? '#8E8E93' : '#8E8E93',
      textTransform: 'uppercase',
      marginBottom: 8,
      marginLeft: 4
    },
    settingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#3A3A3C' : '#E5E5EA'
    },
    settingIcon: {
      fontSize: 20,
      marginRight: 12
    },
    settingContent: {
      flex: 1
    },
    settingTitle: {
      fontSize: 16,
      color: isDark ? '#FFFFFF' : '#000000'
    },
    settingSubtitle: {
      fontSize: 13,
      color: isDark ? '#8E8E93' : '#8E8E93',
      marginTop: 2
    },
    settingChevron: {
      fontSize: 20,
      color: isDark ? '#48484A' : '#C7C7CC'
    },
    logoutButton: {
      marginTop: 8
    },
    version: {
      textAlign: 'center',
      fontSize: 12,
      color: isDark ? '#636366' : '#AEAEB2',
      marginTop: 24
    }
  });
