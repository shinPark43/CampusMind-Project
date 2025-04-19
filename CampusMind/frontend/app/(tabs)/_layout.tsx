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
        tabBarActiveTintColor: "#4A90E2", // Active tab icon color
        tabBarInactiveTintColor: '#FFF', // Inactive tab icon color
        tabBarStyle: {
          backgroundColor: '#000000', // Dark blue background
          height: 60, // Increased height for a modern look
          position: 'absolute', // Floating tab bar
          shadowColor: '#000', // Shadow for elevation
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.2,
          shadowRadius: 4,
          elevation: 5, // Elevation for Android
          justifyContent: 'space-evenly',
        },
        tabBarItemStyle: { 
          flex: 1 
        },
        tabBarLabelStyle: {
          fontSize: 12, // Smaller font for labels
          fontWeight: 'bold',
        },
        tabBarIconStyle: {
          marginTop: 5, // Add spacing between icon and label
        },
        tabBarButton:
          route.name === 'explore' ||
          route.name === 'BookingPage' ||
          route.name === 'Status' ||
          route.name === 'ProfilePage' ||
          route.name === 'CourtAvailability'
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
      <Tabs.Screen
        name="CourtAvailability"
        options={{
          title: 'Court',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="basketball" color={color} />,
        }}
      />
      <Tabs.Screen
        name="ProfilePage"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="person" color={color} />,
        }}
      />
    </Tabs>
  );
}
