import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';

import TodayScreen    from '../screens/TodayScreen';
import LogScreen      from '../screens/LogScreen';
import PlanScreen     from '../screens/PlanScreen';
import RecipesScreen  from '../screens/RecipesScreen';
import ProgressScreen from '../screens/ProgressScreen';
import ProfileScreen  from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();

const TABS = [
  { name: 'Today',    component: TodayScreen,    icon: '🏠' },
  { name: 'Log',      component: LogScreen,      icon: '📖' },
  { name: 'Plan',     component: PlanScreen,     icon: '🎯' },
  { name: 'Recipes',  component: RecipesScreen,  icon: '⭐' },
  { name: 'Progress', component: ProgressScreen, icon: '📊' },
  { name: 'Profile',  component: ProfileScreen,  icon: '👤' },
];

export default function TabNavigator({ user }) {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused }) => {
          const tab = TABS.find((t) => t.name === route.name);
          return <Text style={{ fontSize: focused ? 22 : 18 }}>{tab?.icon}</Text>;
        },
        tabBarActiveTintColor:   '#1A1A1A',
        tabBarInactiveTintColor: '#9E9E9E',
        tabBarStyle: {
          backgroundColor: '#FAFAF8',
          borderTopColor:  '#E8E4DC',
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '500' },
      })}
    >
      {TABS.map(({ name, component }) => (
        <Tab.Screen
          key={name}
          name={name}
          component={component}
          initialParams={{ user }}
        />
      ))}
    </Tab.Navigator>
  );
}
