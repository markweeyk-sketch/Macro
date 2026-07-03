import React, { useState } from 'react';
import { Text, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { colors, fontSizes } from '@macro/core/theme';

import TodayScreen    from '../screens/TodayScreen';
import LogScreen      from '../screens/LogScreen';
import PlanScreen     from '../screens/PlanScreen';
import RecipesScreen  from '../screens/RecipesScreen';
import ProgressScreen from '../screens/ProgressScreen';
import ProfileScreen  from '../screens/ProfileScreen';
import BottomNav from './BottomNav';
import TopBar from './TopBar';
import Sheet from '../components/Sheet';

const Tab = createBottomTabNavigator();

// Every screen stays registered so navigate('Log')/navigate('Profile') works,
// but only Today/Recipes/Plan/Progress get a button in the bar — Profile is
// reached from the TopBar user icon, Log (day history / meal breakdown) from
// the date on the Today screen.
const SCREENS = [
  { name: 'Today',    component: TodayScreen },
  { name: 'Recipes',  component: RecipesScreen },
  { name: 'Plan',     component: PlanScreen },
  { name: 'Progress', component: ProgressScreen },
  { name: 'Log',      component: LogScreen },
  { name: 'Profile',  component: ProfileScreen },
];

export default function TabNavigator({ user }) {
  const [addOpen, setAddOpen] = useState(false);

  return (
    <>
      <Tab.Navigator
        sceneContainerStyle={{ backgroundColor: colors.bg }}
        screenOptions={{
          header: (props) => <TopBar {...props} />,
        }}
        tabBar={(props) => <BottomNav {...props} onAdd={() => setAddOpen(true)} />}
      >
        {SCREENS.map(({ name, component }) => (
          <Tab.Screen
            key={name}
            name={name}
            component={component}
            initialParams={{ user }}
          />
        ))}
      </Tab.Navigator>

      {/* Web FAB opens AddFoodSheet; the real food search lands with the Today
          screen port (Phase 1). Until then the sheet is an honest placeholder. */}
      <Sheet visible={addOpen} onClose={() => setAddOpen(false)} title="Add food">
        <Text style={styles.placeholder}>
          Food search is coming with the Today screen port.
        </Text>
      </Sheet>
    </>
  );
}

const styles = StyleSheet.create({
  placeholder: { fontSize: fontSizes.body, color: colors.ink3, lineHeight: 20 },
});
