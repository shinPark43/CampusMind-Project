// TabLayout.jsx
import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';

import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const tint = Colors[colorScheme ?? 'light'].tint;

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: tint,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({ ios: { position: 'absolute' }, default: {} }),
        // use HapticTab only for your “real” tabs:
        tabBarButton:
          route.name === 'explore' ||
          route.name === 'BookingPage' ||
          route.name === 'Status'
            ? HapticTab
            : () => null,
      })}
    >
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="BookingPage"
        options={{
          title: 'Booking',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="calendar" color={color} />,
        }}
      />
      <Tabs.Screen
        name="Status"
        options={{
          title: 'Status',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="info.circle.fill" color={color} />,
        }}
      />

      {/* these two exist in navigation but have no tab button */}
      <Tabs.Screen
        name="index"
        options={{ title: 'Login' , tabBarStyle: { display: 'none' }, }}
      />
      <Tabs.Screen
        name="SignUpPage"
        options={{ title: 'Sign Up', tabBarStyle: { display: 'none' }, }}
      />
    </Tabs>
  );
}
