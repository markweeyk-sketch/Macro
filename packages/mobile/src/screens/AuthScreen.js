// AuthScreen.js — email/password sign-in / sign-up gate.
//
// RN port of the web AuthSheet (web/auth.jsx), minus Google (popup auth is
// web-only; see @macro/core/firebase.signInWithGoogle and gotcha #2). Error
// formatting mirrors the web `fmt()` so messages match across platforms.
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { signInWithEmail, signUpWithEmail } from '@macro/core/firebase';
import { colors, radii, spacing, fontSizes } from '@macro/core/theme';

function formatError(msg = '') {
  if (/user-not-found|wrong-password|invalid-credential/i.test(msg))
    return 'Incorrect email or password.';
  if (/email-already-in-use/i.test(msg))
    return 'An account with this email already exists.';
  if (/weak-password/i.test(msg)) return 'Password must be at least 6 characters.';
  if (/invalid-email/i.test(msg)) return 'Please enter a valid email address.';
  if (/network-request-failed/i.test(msg))
    return 'Network error — check your connection.';
  return msg.replace('Firebase: ', '').replace(/ \(auth\/[^)]+\)\.?/, '');
}

function Field({ label, value, onChangeText, ...rest }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholderTextColor={colors.ink3}
        style={styles.input}
        {...rest}
      />
    </View>
  );
}

export default function AuthScreen() {
  const [mode, setMode] = useState('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const isSignup = mode === 'signup';

  const submit = async () => {
    setError('');
    setBusy(true);
    try {
      if (isSignup) await signUpWithEmail(email.trim(), password, name.trim());
      else await signInWithEmail(email.trim(), password);
      // On success the auth listener in App.js swaps to the app; nothing to do.
    } catch (e) {
      setError(formatError(e?.message || String(e)));
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.brand}>Macro</Text>
          <Text style={styles.title}>
            {isSignup ? 'Create account' : 'Welcome back'}
          </Text>

          <View style={styles.form}>
            {isSignup && (
              <Field
                label="Your name"
                value={name}
                onChangeText={setName}
                placeholder="Alex Rivera"
                autoCapitalize="words"
              />
            )}
            <Field
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
            <Field
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              secureTextEntry
              autoCapitalize="none"
              onSubmitEditing={submit}
              returnKeyType="go"
            />
          </View>

          {!!error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <Pressable
            style={[styles.btn, busy && styles.btnDisabled]}
            onPress={submit}
            disabled={busy}
          >
            {busy ? (
              <ActivityIndicator color={colors.bg} />
            ) : (
              <Text style={styles.btnText}>
                {isSignup ? 'Create account' : 'Sign in'}
              </Text>
            )}
          </Pressable>

          <Pressable
            style={styles.toggle}
            onPress={() => {
              setMode(isSignup ? 'signin' : 'signup');
              setError('');
            }}
          >
            <Text style={styles.toggleText}>
              {isSignup
                ? 'Already have an account? Sign in'
                : "Don't have an account? Sign up"}
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: spacing['2xl'] },
  brand: {
    fontSize: fontSizes.caption,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: colors.ink3,
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: fontSizes.display,
    fontWeight: '600',
    color: colors.ink,
    marginBottom: spacing['3xl'],
  },
  form: { gap: spacing.md },
  field: {
    backgroundColor: colors.surface2,
    borderRadius: radii.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  fieldLabel: {
    fontSize: fontSizes.eyebrow,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: colors.ink3,
    marginBottom: 4,
  },
  input: { fontSize: fontSizes.base, color: colors.ink, padding: 0 },
  errorBox: {
    marginTop: spacing.lg,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: radii.sm,
    backgroundColor: 'rgba(198,106,58,0.1)',
  },
  errorText: { color: colors.warn, fontSize: fontSizes.body },
  btn: {
    marginTop: spacing['2xl'],
    backgroundColor: colors.ink,
    borderRadius: radii.pill,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: colors.bg, fontWeight: '600', fontSize: fontSizes.base },
  toggle: { marginTop: spacing.lg, alignItems: 'center', paddingVertical: 6 },
  toggleText: { color: colors.ink3, fontSize: fontSizes.body },
});
