import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LogScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Food log</Text>
      <Text style={styles.placeholder}>Coming soon — migrating from web.</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: '#F7F4EE', padding: 24 },
  title:       { fontSize: 32, fontWeight: '600', marginBottom: 16, color: '#1A1A1A' },
  placeholder: { fontSize: 13, color: '#888' },
});
