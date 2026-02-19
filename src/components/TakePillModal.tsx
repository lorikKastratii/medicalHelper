import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, Animated } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { formatTime } from '../lib/utils';
import type { Pill } from '../types';

type Props = {
  visible: boolean;
  pill: Pill | null;
  time: string;
  onConfirm: () => void;
  onClose: () => void;
};

export default function TakePillModal({ visible, pill, time, onConfirm, onClose }: Props) {
  const { colors } = useTheme();
  const [taken, setTaken] = useState(false);
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (taken) {
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, friction: 4 }).start();
      const timer = setTimeout(() => {
        setTaken(false);
        scaleAnim.setValue(0);
        onClose();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [taken]);

  useEffect(() => {
    if (!visible) setTaken(false);
  }, [visible]);

  if (!pill) return null;

  const handleTake = () => {
    onConfirm();
    setTaken(true);
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: colors.surface }]}>
          {taken ? (
            <View style={styles.successContainer}>
              <Animated.Text style={[styles.successIcon, { transform: [{ scale: scaleAnim }] }]}>✅</Animated.Text>
              <Text style={[styles.successText, { color: colors.success }]}>Pill Taken!</Text>
              <Text style={[styles.successSub, { color: colors.textSecondary }]}>Great job staying on track</Text>
            </View>
          ) : (
            <>
              <View style={[styles.pillIcon, { backgroundColor: pill.color + '20' }]}>
                <Text style={styles.pillEmoji}>💊</Text>
              </View>
              <Text style={[styles.title, { color: colors.text }]}>{pill.name}</Text>
              <Text style={[styles.dosage, { color: colors.textSecondary }]}>{pill.dosage}</Text>
              <Text style={[styles.time, { color: colors.textSecondary }]}>Scheduled: {formatTime(time)}</Text>
              <View style={styles.btnRow}>
                <TouchableOpacity onPress={onClose} style={[styles.btn, { backgroundColor: colors.border }]}>
                  <Text style={{ color: colors.text }}>Later</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleTake} style={[styles.btn, { backgroundColor: colors.primary }]}>
                  <Text style={{ color: colors.textInverse, fontWeight: '600' }}>Take Now</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  container: { borderRadius: 20, padding: 28, width: 300, alignItems: 'center' },
  pillIcon: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  pillEmoji: { fontSize: 32 },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 4 },
  dosage: { fontSize: 15, marginBottom: 4 },
  time: { fontSize: 14, marginBottom: 24 },
  btnRow: { flexDirection: 'row', gap: 12 },
  btn: { paddingHorizontal: 28, paddingVertical: 14, borderRadius: 12 },
  successContainer: { alignItems: 'center', paddingVertical: 20 },
  successIcon: { fontSize: 56, marginBottom: 12 },
  successText: { fontSize: 22, fontWeight: '700' },
  successSub: { fontSize: 14, marginTop: 4 },
});
