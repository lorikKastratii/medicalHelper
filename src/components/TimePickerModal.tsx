import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, TextInput } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

type Props = {
  visible: boolean;
  onClose: () => void;
  onSelect: (time: string) => void;
  initialTime?: string;
};

export default function TimePickerModal({ visible, onClose, onSelect, initialTime }: Props) {
  const { colors } = useTheme();
  const [hours, setHours] = useState(initialTime?.split(':')[0] ?? '08');
  const [minutes, setMinutes] = useState(initialTime?.split(':')[1] ?? '00');

  const handleConfirm = () => {
    const h = Math.min(23, Math.max(0, parseInt(hours) || 0)).toString().padStart(2, '0');
    const m = Math.min(59, Math.max(0, parseInt(minutes) || 0)).toString().padStart(2, '0');
    onSelect(`${h}:${m}`);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: colors.surface }]}>
          <Text style={[styles.title, { color: colors.text }]}>Set Time</Text>
          <View style={styles.timeRow}>
            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.border }]}
              value={hours}
              onChangeText={setHours}
              keyboardType="number-pad"
              maxLength={2}
              placeholder="HH"
              placeholderTextColor={colors.textSecondary}
            />
            <Text style={[styles.colon, { color: colors.text }]}>:</Text>
            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.border }]}
              value={minutes}
              onChangeText={setMinutes}
              keyboardType="number-pad"
              maxLength={2}
              placeholder="MM"
              placeholderTextColor={colors.textSecondary}
            />
          </View>
          <Text style={[styles.hint, { color: colors.textSecondary }]}>24-hour format</Text>
          <View style={styles.btnRow}>
            <TouchableOpacity onPress={onClose} style={[styles.btn, { backgroundColor: colors.border }]}>
              <Text style={{ color: colors.text }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleConfirm} style={[styles.btn, { backgroundColor: colors.primary }]}>
              <Text style={{ color: colors.textInverse, fontWeight: '600' }}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  container: { borderRadius: 16, padding: 24, width: 280, alignItems: 'center' },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 20 },
  timeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  input: { width: 64, height: 56, fontSize: 28, fontWeight: '600', textAlign: 'center', borderWidth: 1, borderRadius: 12 },
  colon: { fontSize: 28, fontWeight: '600', marginHorizontal: 8 },
  hint: { fontSize: 12, marginBottom: 20 },
  btnRow: { flexDirection: 'row', gap: 12 },
  btn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 },
});
