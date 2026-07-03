import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { colors } from '@macro/core/theme';

import TodayScreen    from '../screens/TodayScreen';
import LogScreen      from '../screens/LogScreen';
import PlanScreen     from '../screens/PlanScreen';
import RecipesScreen  from '../screens/RecipesScreen';
import ProgressScreen from '../screens/ProgressScreen';
import ProfileScreen  from '../screens/ProfileScreen';
import BottomNav from './BottomNav';
import TopBar from './TopBar';
import AddFoodSheet from '../components/AddFoodSheet';
import { MacroDataProvider, useMacroData } from '../state/MacroData';

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
  // MacroDataProvider holds the shared daily state (goal, today's log, totals)
  // above the tabs so the Today screen and the global add-food sheet share it.
  return (
    <MacroDataProvider>
      <Tabs user={user} />
    </MacroDataProvider>
  );
}

function Tabs({ user }) {
  const { openAdd } = useMacroData();

  return (
    <>
      <Tab.Navigator
        sceneContainerStyle={{ backgroundColor: colors.bg }}
        screenOptions={{
          header: (props) => <TopBar {...props} />,
        }}
        tabBar={(props) => <BottomNav {...props} onAdd={() => openAdd()} />}
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

      {/* Single global add-food sheet, driven by MacroData's addOpen/addMeal —
          opened by the tab-bar FAB or any meal's "add". */}
      <AddFoodSheet />
    </>
  );
}
