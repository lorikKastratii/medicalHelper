import React from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import HomeScreen from '../screens/HomeScreen';
import AddPillScreen from '../screens/AddPillScreen';
import PillDetailScreen from '../screens/PillDetailScreen';
import HistoryScreen from '../screens/HistoryScreen';
import AccountScreen from '../screens/AccountScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function TodayStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen
        name="AddPill"
        component={AddPillScreen}
        options={{ presentation: 'modal', headerShown: false }}
      />
      <Stack.Screen name="PillDetail" component={PillDetailScreen} />
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  const { colors, mode } = useTheme();

  const navTheme = {
    ...(mode === 'dark' ? DarkTheme : DefaultTheme),
    colors: {
      ...(mode === 'dark' ? DarkTheme.colors : DefaultTheme.colors),
      primary: colors.primary,
      background: colors.background,
      card: colors.tabBar,
      text: colors.text,
      border: colors.border,
      notification: colors.error,
    },
  };

  return (
    <NavigationContainer theme={navTheme}>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.tabBarInactive,
          tabBarStyle: {
            backgroundColor: colors.tabBar,
            borderTopColor: colors.border,
            borderTopWidth: 1,
          },
          tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        }}
      >
        <Tab.Screen
          name="Today"
          component={TodayStack}
          options={{
            tabBarIcon: ({ color }) => (
              <Text style={{ fontSize: 22, color }}>💊</Text>
            ),
          }}
        />
        <Tab.Screen
          name="History"
          component={HistoryScreen}
          options={{
            tabBarIcon: ({ color }) => (
              <Text style={{ fontSize: 22, color }}>📊</Text>
            ),
          }}
        />
        <Tab.Screen
          name="Account"
          component={AccountScreen}
          options={{
            tabBarIcon: ({ color }) => (
              <Text style={{ fontSize: 22, color }}>👤</Text>
            ),
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
