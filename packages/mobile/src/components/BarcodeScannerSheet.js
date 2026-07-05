// BarcodeScannerSheet — scan a product barcode (EAN/UPC) with expo-camera and
// look it up on Open Food Facts. Scanning never logs anything by itself: the
// result is handed back to the add-food flow, which either selects an already
// saved food (same barcode) or opens the food editor prefilled with the
// product's per-100g values so the user can save it as one of their foods.
//
// Open Food Facts: free, keyless, community data —
//   GET https://world.openfoodfacts.org/api/v2/product/{code}.json
// Misses (common for local products) come back as prefill:null and the caller
// opens a blank editor with the barcode attached.
import React, { useEffect, useRef, useState } from 'react';
import { Modal, View, Pressable, StyleSheet } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '../ui/type';
import { colors, radii, fontSizes, fonts } from '@macro/core/theme';
import Icon from './Icon';

const OFF_URL = (code) =>
  `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(code)}.json` +
  '?fields=product_name,brands,nutriments,serving_size,serving_quantity';

// Map an Open Food Facts product onto the app's food shape (per100 + units).
function mapProduct(code, product) {
  const n = product.nutriments || {};
  const kcal =
    n['energy-kcal_100g'] ??
    (n['energy_100g'] != null ? Math.round(n['energy_100g'] / 4.184) : undefined);
  const units = [];
  const q = +product.serving_quantity;
  if (q > 0) {
    units.push({
      label: product.serving_size
        ? `1 serving (${product.serving_size})`
        : `1 serving (${q}g)`,
      g: q,
    });
  }
  units.push({ label: '100 g', g: 100 });
  return {
    barcode: code,
    name: product.product_name || '',
    brand: (product.brands || '').split(',')[0].trim(),
    per100: {
      kcal: kcal != null ? +(+kcal).toFixed(0) : '',
      p: n.proteins_100g != null ? +(+n.proteins_100g).toFixed(1) : '',
      c: n.carbohydrates_100g != null ? +(+n.carbohydrates_100g).toFixed(1) : '',
      f: n.fat_100g != null ? +(+n.fat_100g).toFixed(1) : '',
    },
    units,
  };
}

export default function BarcodeScannerSheet({ visible, onClose, onResult }) {
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  // 'scan' | 'lookup' | 'notfound' | 'error'. 'notfound'/'error' hold the flow
  // on an explanatory screen with a choice, rather than silently darting to the
  // manual editor, so a miss is never confusing.
  const [status, setStatus] = useState('scan');
  const [scanned, setScanned] = useState(null); // the last code scanned
  const busyRef = useRef(false);

  useEffect(() => {
    if (visible) {
      setStatus('scan');
      setScanned(null);
      busyRef.current = false;
      if (permission && !permission.granted && permission.canAskAgain) {
        requestPermission();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const onScanned = async ({ data: code }) => {
    if (busyRef.current || !code) return;
    busyRef.current = true;
    setScanned(code);
    setStatus('lookup');
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 10000);
      const res = await fetch(OFF_URL(code), { signal: controller.signal });
      clearTimeout(timer);
      const json = await res.json();
      if (json?.status === 1 && json.product) {
        onResult({ barcode: code, prefill: mapProduct(code, json.product) });
      } else {
        setStatus('notfound'); // scanned fine, but no product in the database
      }
    } catch {
      setStatus('error'); // offline or Open Food Facts unreachable
    }
  };

  // Reset to live scanning (from the not-found / error screen).
  const rescan = () => {
    busyRef.current = false;
    setStatus('scan');
  };

  // Proceed to the manual editor with just the barcode attached.
  const enterManually = () => onResult({ barcode: scanned, prefill: null });

  const denied = permission && !permission.granted && !permission.canAskAgain;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.root}>
        {visible && permission?.granted && (
          <CameraView
            style={StyleSheet.absoluteFill}
            facing="back"
            barcodeScannerSettings={{
              barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e'],
            }}
            onBarcodeScanned={status === 'scan' ? onScanned : undefined}
          />
        )}

        {/* Overlay chrome */}
        <View style={[styles.top, { paddingTop: insets.top + 10 }]}>
          <Text style={styles.title}>Scan a barcode</Text>
          <Pressable style={styles.closeBtn} onPress={onClose} hitSlop={8}>
            <Icon name="close" size={18} color="#fff" />
          </Pressable>
        </View>

        <View style={styles.frameWrap} pointerEvents="none">
          <View style={styles.frame} />
        </View>

        <View style={[styles.bottom, { paddingBottom: insets.bottom + 24 }]}>
          {!permission?.granted ? (
            <>
              <Text style={styles.hint}>
                Camera access is needed to scan barcodes.
              </Text>
              {!denied && (
                <Pressable style={styles.permBtn} onPress={requestPermission}>
                  <Text style={styles.permBtnText}>Allow camera</Text>
                </Pressable>
              )}
              {denied && (
                <Text style={styles.hintSmall}>
                  Enable the camera for Macro in your device settings.
                </Text>
              )}
            </>
          ) : status === 'lookup' ? (
            <Text style={styles.hint}>Looking up product…</Text>
          ) : status === 'notfound' || status === 'error' ? (
            <>
              <Text style={styles.hint}>
                {status === 'notfound'
                  ? "This barcode isn't in the food database."
                  : "Couldn't reach the food database."}
              </Text>
              {scanned ? (
                <Text style={styles.hintSmall}>Barcode {scanned}</Text>
              ) : null}
              <View style={styles.actionRow}>
                <Pressable style={styles.ghostBtn} onPress={rescan}>
                  <Text style={styles.ghostBtnText}>Scan again</Text>
                </Pressable>
                <Pressable style={styles.permBtn} onPress={enterManually}>
                  <Text style={styles.permBtnText}>Enter it manually</Text>
                </Pressable>
              </View>
            </>
          ) : (
            <Text style={styles.hint}>
              Point at the barcode — it scans automatically.
            </Text>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#101010' },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingBottom: 12,
  },
  title: { fontSize: fontSizes.title, fontFamily: fonts.serifMedium, color: '#fff' },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  frameWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  frame: {
    width: 260,
    height: 160,
    borderRadius: radii.md,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.85)',
  },
  bottom: { alignItems: 'center', paddingHorizontal: 30 },
  hint: { color: '#fff', fontSize: fontSizes.base, textAlign: 'center' },
  hintSmall: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
  },
  permBtn: {
    marginTop: 14,
    backgroundColor: colors.accent,
    borderRadius: radii.pill,
    paddingVertical: 12,
    paddingHorizontal: 26,
  },
  permBtnText: { color: '#fff', fontWeight: '600', fontSize: fontSizes.base },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  ghostBtn: {
    marginTop: 14,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderRadius: radii.pill,
    paddingVertical: 12,
    paddingHorizontal: 22,
  },
  ghostBtnText: { color: '#fff', fontWeight: '500', fontSize: fontSizes.base },
});
