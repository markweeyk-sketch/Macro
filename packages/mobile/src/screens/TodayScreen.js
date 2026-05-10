import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth, loadUserData, todayKey } from '@macro/core/firebase';

export default function TodayScreen() {
  const [status, setStatus] = useState('Checking Firebase…');

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      setStatus('Not signed in — Firebase auth is working.');
      return;
    }
    loadUserData(user.uid)
      .then((data) => {
        if (data?.goal) {
          setStatus(`Firebase OK — goal: ${data.goal.kcal} kcal (${data.goal.mode})`);
        } else {
          setStatus('Firebase OK — no goal saved yet.');
        }
      })
      .catch((e) => setStatus(`Firebase error: ${e.message}`));
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Today</Text>
      <View style={styles.statusCard}>
        <Text style={styles.statusLabel}>Firebase status</Text>
        <Text style={styles.statusText}>{status}</Text>
        <Text style={styles.hint}>Date key: {todayKey()}</Text>
      </View>
      <Text style={styles.placeholder}>Screens to be migrated from web app.</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#F7F4EE', padding: 24 },
  title:        { fontSize: 32, fontWeight: '600', marginBottom: 24, color: '#1A1A1A' },
  statusCard:   { backgroundColor: '#EFECE5', borderRadius: 16, padding: 18, marginBottom: 20 },
  statusLabel:  { fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.2, color: '#888', marginBottom: 6 },
  statusText:   { fontSize: 14, color: '#1A1A1A', fontWeight: '500', lineHeight: 20 },
  hint:         { fontSize: 12, color: '#888', marginTop: 6 },
  placeholder:  { fontSize: 13, color: '#888', textAlign: 'center', marginTop: 40 },
});
