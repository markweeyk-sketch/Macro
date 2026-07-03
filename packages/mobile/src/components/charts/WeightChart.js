// WeightChart — RN port of the web `WeightChart` (web/screens.jsx). A small
// line+area chart of weight-over-time with a dashed goal line, gridlines, and
// date ticks. Same path math, proportions, stroke widths, and colors as web.
//
// The web version measures its width with a ResizeObserver; RN has no such API,
// so we capture the width from onLayout and only draw once we have it.
import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, {
  Path,
  Line,
  Circle,
  Text as SvgText,
  Defs,
  LinearGradient,
  Stop,
} from 'react-native-svg';
import { colors, fontSizes } from '@macro/core/theme';

export default function WeightChart({ entries, goalKg, height = 180 }) {
  const [w, setW] = useState(0);

  if (!entries || entries.length < 2) {
    return (
      <View style={[styles.empty, { height }]} onLayout={(e) => setW(e.nativeEvent.layout.width)}>
        <Text style={styles.emptyText}>
          Log at least 2 weight entries to see your trend.
        </Text>
      </View>
    );
  }

  return (
    <View
      style={styles.wrap}
      onLayout={(e) => setW(e.nativeEvent.layout.width)}
    >
      {w > 0 && <Chart entries={entries} goalKg={goalKg} height={height} w={w} />}
    </View>
  );
}

function Chart({ entries, goalKg, height, w }) {
  const pad = { l: w < 280 ? 28 : 36, r: 12, t: 16, b: 32 };
  const vals = entries.map((e) => e.weight);
  const mn = Math.min(...vals, goalKg) - 0.5;
  const mx = Math.max(...vals) + 0.5;
  const n = entries.length;
  const sx = (i) => pad.l + (i / (n - 1)) * (w - pad.l - pad.r);
  const sy = (v) => pad.t + (1 - (v - mn) / (mx - mn)) * (height - pad.t - pad.b);
  const linePath = entries
    .map((e, i) => `${i === 0 ? 'M' : 'L'}${sx(i).toFixed(1)},${sy(e.weight).toFixed(1)}`)
    .join(' ');
  const area = `${linePath} L${sx(n - 1).toFixed(1)},${(height - pad.b).toFixed(1)} L${sx(0).toFixed(1)},${(height - pad.b).toFixed(1)}Z`;
  const goalY = sy(goalKg);
  const range = mx - mn;
  const step = range <= 1 ? 0.25 : range <= 3 ? 0.5 : range <= 8 ? 1 : 2;
  const yLabels = [];
  for (let v = Math.ceil(mn / step) * step; v <= mx; v = +(v + step).toFixed(2)) yLabels.push(v);
  const xIndices =
    n <= 3
      ? entries.map((_, i) => i)
      : n <= 7
      ? [0, Math.floor(n / 2), n - 1]
      : [0, Math.floor(n / 3), Math.floor((2 * n) / 3), n - 1];
  const fmt = (d) =>
    new Date(d + 'T00:00:00').toLocaleDateString([], { month: 'short', day: 'numeric' });

  return (
    <Svg width={w} height={height}>
      <Defs>
        <LinearGradient id="wgrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor={colors.ink} stopOpacity="0.10" />
          <Stop offset="100%" stopColor={colors.ink} stopOpacity="0" />
        </LinearGradient>
      </Defs>
      {yLabels.map((v) => (
        <React.Fragment key={v}>
          <Line x1={pad.l} x2={w - pad.r} y1={sy(v)} y2={sy(v)} stroke={colors.line} strokeWidth={1} />
          <SvgText x={pad.l - 6} y={sy(v) + 4} textAnchor="end" fontSize={10} fill={colors.ink3}>
            {v}
          </SvgText>
        </React.Fragment>
      ))}
      {goalKg >= mn && goalKg <= mx && (
        <>
          <Line
            x1={pad.l}
            x2={w - pad.r}
            y1={goalY}
            y2={goalY}
            stroke={colors.accent}
            strokeWidth={1.5}
            strokeDasharray="4 4"
            opacity={0.8}
          />
          <SvgText x={w - pad.r - 2} y={goalY - 5} textAnchor="end" fontSize={10} fill={colors.accent}>
            goal
          </SvgText>
        </>
      )}
      <Path d={area} fill="url(#wgrad)" />
      <Path
        d={linePath}
        fill="none"
        stroke={colors.ink}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {entries.map((e, i) => (
        <Circle
          key={i}
          cx={sx(i)}
          cy={sy(e.weight)}
          r={i === n - 1 ? 4.5 : 2.5}
          fill={colors.ink}
          stroke={colors.surface}
          strokeWidth={2}
        />
      ))}
      {xIndices.map((i) => (
        <SvgText
          key={i}
          x={sx(i)}
          y={height - 4}
          textAnchor="middle"
          fontSize={10}
          fill={colors.ink3}
        >
          {fmt(entries[i].date)}
        </SvgText>
      ))}
    </Svg>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%', overflow: 'hidden' },
  empty: { alignItems: 'center', justifyContent: 'center' },
  emptyText: {
    color: colors.ink3,
    fontSize: fontSizes.body,
    textAlign: 'center',
    lineHeight: 21,
    paddingHorizontal: 20,
  },
});
