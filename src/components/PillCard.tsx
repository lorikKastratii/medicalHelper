import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { formatTime } from '../lib/utils';
import type { Pill } from '../types';

type Props = {
  pill: Pill;
  time: string;
  status: 'taken' | 'missed' | 'pending';
  onPress: () => void;
  onTake: () => void;
};

export default function PillCard({ pill, time, status, onPress, onTake }: Props) {
  const { colors } = useTheme();

  const statusColor = status === 'taken' ? colors.taken : status === 'missed' ? colors.missed : colors.pending;
  const statusLabel = status === 'taken' ? '✅ Taken' : status === 'missed' ? '❌ Missed' : '⏳ Pending';

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card, borderLeftColor: pill.color, shadowColor: colors.shadow }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.row}>
        <View style={[styles.colorDot, { backgroundColor: pill.color }]} />
        <View style={styles.info}>
          <Text style={[styles.name, { color: colors.text }]}>{pill.name}</Text>
          <Text style={[styles.dosage, { color: colors.textSecondary }]}>{pill.dosage}</Text>
          <Text style={[styles.time, { color: colors.textSecondary }]}>{formatTime(time)}</Text>
        </View>
        <View style={styles.right}>
          <Text style={[styles.status, { color: statusColor }]}>{statusLabel}</Text>
          {status === 'pending' && (
            <TouchableOpacity
              style={[styles.takeBtn, { backgroundColor: colors.primary }]}
              onPress={(e) => { e.stopPropagation?.(); onTake(); }}
            >
              <Text style={[styles.takeBtnText, { color: colors.textInverse }]}>Take</Text>
            </TouchableOpacity>
          )}
          {status === 'missed' && (
            <TouchableOpacity
              style={[styles.takeBtn, { backgroundColor: colors.warning }]}
              onPress={(e) => { e.stopPropagation?.(); onTake(); }}
            >
              <Text style={[styles.takeBtnText, { color: colors.textInverse }]}>Take Late</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 6,
    borderLeftWidth: 4,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  colorDot: { width: 12, height: 12, borderRadius: 6, marginRight: 12 },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: '600' },
  dosage: { fontSize: 13, marginTop: 2 },
  time: { fontSize: 13, marginTop: 2 },
  right: { alignItems: 'flex-end' },
  status: { fontSize: 12, fontWeight: '600', marginBottom: 6 },
  takeBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  takeBtnText: { fontSize: 13, fontWeight: '600' },
});
