import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { usePassiveSync } from '@/src/features/sync/sync-hooks';
import { colors, fontFamily } from '@/src/theme/tokens';

export default function TabLayout() {
  usePassiveSync();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarButton: HapticTab,
        tabBarLabelStyle: { fontFamily: fontFamily.medium, fontSize: 11 },
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Pacientes',
          tabBarButtonTestID: 'tab-pacientes',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="person.2.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="sync"
        options={{
          title: 'Sync',
          tabBarButtonTestID: 'tab-sync',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="arrow.triangle.2.circlepath" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: 'Perfil',
          tabBarButtonTestID: 'tab-perfil',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="person.crop.circle" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
