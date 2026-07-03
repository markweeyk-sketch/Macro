import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { auth, loadUserData, todayKey } from '@macro/core/firebase';

export default function TodayScreen({ navigation }) {
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
    <View style={styles.container}>
      <View style={styles.statusCard}>
        <Text style={styles.statusLabel}>Firebase status</Text>
        <Text style={styles.statusText}>{status}</Text>
        {/* The date is the doorway to the day's full log (meal-by-meal
            breakdown) — Log has no tab of its own. */}
        <Pressable onPress={() => navigation.navigate('Log')} hitSlop={8}>
          <Text style={styles.hint}>Date key: {todayKey()} — view food log ›</Text>
        </Pressable>
      </View>
      <Text style={styles.placeholder}>Screens to be migrated from web app.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#F7F4EE', padding: 24 },
  statusCard:   { backgroundColor: '#EFECE5', borderRadius: 16, padding: 18, marginBottom: 20 },
  statusLabel:  { fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.2, color: '#888', marginBottom: 6 },
  statusText:   { fontSize: 14, color: '#1A1A1A', fontWeight: '500', lineHeight: 20 },
  hint:         { fontSize: 12, color: '#888', marginTop: 6 },
  placeholder:  { fontSize: 13, color: '#888', textAlign: 'center', marginTop: 40 },
});
