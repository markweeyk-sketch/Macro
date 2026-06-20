import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import TabNavigator from './src/navigation/TabNavigator';
import AuthScreen from './src/screens/AuthScreen';
import { auth } from '@macro/core/firebase';
import { colors } from '@macro/core/theme';

export default function App() {
  const [user, setUser] = useState(undefined); // undefined = loading

  useEffect(() => {
    // With RN persistence (see @macro/core/firebase), a previously signed-in
    // session is restored here on cold start instead of resolving to null.
    const unsubscribe = auth.onAuthStateChanged((u) => setUser(u));
    return unsubscribe;
  }, []);

  return (
    <SafeAreaProvider>
      {user === undefined ? (
        <View style={styles.splash}>
          <ActivityIndicator color={colors.ink} />
        </View>
      ) : user ? (
        <NavigationContainer>
          <TabNavigator user={user} />
        </NavigationContainer>
      ) : (
        <AuthScreen />
      )}
      <StatusBar style="auto" />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  splash: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
});
