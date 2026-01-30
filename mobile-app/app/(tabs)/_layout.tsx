/**
 * Tab Layout
 * Bottom tab navigation for main app screens
 */

import React from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs } from 'expo-router';
import { useColorScheme } from 'react-native';

// Tab bar icon component
function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return <FontAwesome size={24} style={{ marginBottom: -3 }} {...props} />;
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: isDark ? '#8E8E93' : '#8E8E93',
        tabBarStyle: {
          backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
          borderTopColor: isDark ? '#3A3A3C' : '#E5E5EA',
          paddingTop: 8,
          paddingBottom: 8,
          height: 88
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500'
        },
        headerStyle: {
          backgroundColor: isDark ? '#000000' : '#F2F2F7'
        },
        headerTintColor: isDark ? '#FFFFFF' : '#000000',
        headerTitleStyle: {
          fontWeight: '600'
        }
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'I dag',
          headerShown: false,
          tabBarIcon: ({ color }) => <TabBarIcon name="home" color={color} />
        }}
      />
      <Tabs.Screen
        name="programs"
        options={{
          title: 'Programmer',
          headerTitle: 'Mine programmer',
          tabBarIcon: ({ color }) => <TabBarIcon name="calendar" color={color} />
        }}
      />
      <Tabs.Screen
        name="library"
        options={{
          title: 'Øvelser',
          headerTitle: 'Øvelsesbibliotek',
          tabBarIcon: ({ color }) => <TabBarIcon name="book" color={color} />
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: 'Fremgang',
          headerTitle: 'Din fremgang',
          tabBarIcon: ({ color }) => <TabBarIcon name="line-chart" color={color} />
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          headerTitle: 'Innstillinger',
          tabBarIcon: ({ color }) => <TabBarIcon name="user" color={color} />
        }}
      />
    </Tabs>
  );
}
