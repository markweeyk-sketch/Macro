// Sheet.js — bottom-sheet modal primitive, the RN equivalent of the web
// `.sheet` markup (backdrop + grab handle + header + scrollable body + footer)
// from web/styles.css and the *Sheet components in web/screens.jsx.
//
// Uses RN's built-in Modal (no extra native dep) per the migration plan's
// "RN Modal" option, keeping the gesture surface simple for v1.
import React from 'react';
import {
  Modal,
  View,
  Pressable,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Text } from '../ui/type';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radii, spacing, fontSizes, fonts } from '@macro/core/theme';
import Icon from './Icon';

export default function Sheet({
  visible,
  onClose,
  title,
  children,
  footer,
  // When false, tapping the backdrop won't dismiss (mirrors MigrateSheet, which
  // forces an explicit choice).
  dismissOnBackdrop = true,
  scroll = true,
}) {
  const insets = useSafeAreaInsets();

  const Body = scroll ? ScrollView : View;
  const bodyProps = scroll
    ? { contentContainerStyle: styles.bodyContent, showsVerticalScrollIndicator: false }
    : { style: styles.bodyContent };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.root}>
        <Pressable
          style={styles.backdrop}
          onPress={dismissOnBackdrop ? onClose : undefined}
        />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.kav}
          pointerEvents="box-none"
        >
          <View style={[styles.panel, { paddingBottom: insets.bottom }]}>
            <View style={styles.grab} />

            {(title || onClose) && (
              <View style={styles.head}>
                <Text style={styles.title} numberOfLines={1}>
                  {title}
                </Text>
                {onClose && (
                  <Pressable style={styles.iconBtn} onPress={onClose} hitSlop={8}>
                    <Icon name="close" size={16} color={colors.ink} />
                  </Pressable>
                )}
              </View>
            )}

            <Body {...bodyProps}>{children}</Body>

            {footer && (
              <View style={styles.foot}>
                {footer}
              </View>
            )}
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(26,25,22,0.4)',
  },
  kav: { width: '100%' },
  panel: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.sheet,
    borderTopRightRadius: radii.sheet,
    maxHeight: '88%',
    overflow: 'hidden',
  },
  grab: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.line2,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 4,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingTop: 14,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
  title: { flex: 1, fontSize: fontSizes.title, fontFamily: fonts.serifMedium, color: colors.ink },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bodyContent: { padding: 22, paddingBottom: 26 },
  foot: {
    paddingHorizontal: 22,
    paddingTop: 14,
    paddingBottom: spacing.xl,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.line,
    flexDirection: 'row',
    gap: 10,
  },
});
