import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// Page title comes from the TopBar header; insets are handled by the
// header/tab bar, so no SafeAreaView here.
export default function PlanScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.placeholder}>Coming soon — migrating from web.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: '#F7F4EE', padding: 24 },
  placeholder: { fontSize: 13, color: '#888' },
});
