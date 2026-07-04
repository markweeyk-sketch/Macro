// Sheet.js — bottom-sheet modal primitive, the RN equivalent of the web
// `.sheet` markup (backdrop + grab handle + header + scrollable body + footer)
// from web/styles.css and the *Sheet components in web/screens.jsx.
//
// Uses RN's built-in Modal (no extra native dep) per the migration plan's
// "RN Modal" option. Two extras beyond the web version:
//  - `fullScreen`: the panel fills the screen (minus the status bar) instead of
//    hugging the bottom — used by the add-food flow so search results stay
//    visible above the keyboard.
//  - drag-to-dismiss: the grab-handle/header area is a PanResponder surface;
//    dragging down past a threshold (or flicking) closes the sheet, otherwise
//    it springs back. Core-RN PanResponder, no gesture-handler dependency.
import React, { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Pressable,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Animated,
  PanResponder,
  useWindowDimensions,
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
  fullScreen = false,
  // Optional ref to the body ScrollView so callers can scroll a focused input
  // (e.g. a search field) to the top when the keyboard opens.
  scrollRef,
}) {
  const insets = useSafeAreaInsets();
  const { height: winH } = useWindowDimensions();

  // Drag-to-dismiss: translate the panel with the finger (downward only) and
  // either dismiss or spring back on release.
  const drag = useRef(new Animated.Value(0)).current;
  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_e, g) =>
        g.dy > 6 && Math.abs(g.dy) > Math.abs(g.dx),
      onPanResponderMove: (_e, g) => {
        drag.setValue(Math.max(0, g.dy));
      },
      onPanResponderRelease: (_e, g) => {
        if (g.dy > 130 || g.vy > 0.9) {
          Animated.timing(drag, {
            toValue: winH,
            duration: 180,
            useNativeDriver: true,
          }).start(() => onCloseRef.current?.());
        } else {
          Animated.spring(drag, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 4,
          }).start();
        }
      },
    })
  ).current;

  // Keep the latest onClose reachable from the (stable) PanResponder.
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // Reset the drag offset whenever the sheet (re)opens.
  useEffect(() => {
    if (visible) drag.setValue(0);
  }, [visible, drag]);

  const Body = scroll ? ScrollView : View;
  const bodyProps = scroll
    ? {
        ref: scrollRef,
        contentContainerStyle: styles.bodyContent,
        showsVerticalScrollIndicator: false,
        // One tap selects a result even while the keyboard is up (without this,
        // the first tap only dismisses the keyboard).
        keyboardShouldPersistTaps: 'handled',
      }
    : { style: styles.bodyContent };

  // In fullScreen the height cap lives on the KeyboardAvoidingView and the
  // panel flexes inside it — so when the keyboard pads the KAV, the panel
  // SHRINKS (keeping its top on screen) instead of being pushed up and off.
  const kavSize = fullScreen ? { height: winH - insets.top - 10 } : null;
  const panelSize = fullScreen ? { flex: 1 } : { maxHeight: '88%' };

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
          // Android Modals with a translucent status bar don't resize for the
          // keyboard, so pad on both platforms.
          behavior="padding"
          style={[styles.kav, kavSize]}
          pointerEvents="box-none"
        >
          <Animated.View
            style={[
              styles.panel,
              panelSize,
              { paddingBottom: insets.bottom, transform: [{ translateY: drag }] },
            ]}
          >
            {/* Drag surface: grab handle + header. */}
            <View {...pan.panHandlers}>
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
            </View>

            <Body {...bodyProps} style={scroll && fullScreen ? styles.bodyFlex : undefined}>
              {children}
            </Body>

            {footer && <View style={styles.foot}>{footer}</View>}
          </Animated.View>
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
  bodyFlex: { flex: 1 },
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
