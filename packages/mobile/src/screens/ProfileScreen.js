import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { auth, signOutUser } from '@macro/core/firebase';

export default function ProfileScreen() {
  const user = auth.currentUser;

  const handleSignOut = () => {
    Alert.alert('Sign out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: signOutUser },
    ]);
  };

  return (
    <View style={styles.container}>
      {user ? (
        <>
          <Text style={styles.email}>{user.displayName || user.email}</Text>
          <TouchableOpacity style={styles.btn} onPress={handleSignOut}>
            <Text style={styles.btnText}>Sign out</Text>
          </TouchableOpacity>
        </>
      ) : (
        <Text style={styles.placeholder}>Not signed in.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: '#F7F4EE', padding: 24 },
  email:       { fontSize: 15, color: '#444', marginBottom: 24 },
  placeholder: { fontSize: 13, color: '#888' },
  btn:         { backgroundColor: '#1A1A1A', borderRadius: 14, padding: 14, alignItems: 'center' },
  btnText:     { color: '#fff', fontWeight: '600', fontSize: 14 },
});
