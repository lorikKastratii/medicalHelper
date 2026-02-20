import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { useAuth } from '../store/authContext';
import { usePillStore } from '../store/pillStore';
import TimePickerModal from '../components/TimePickerModal';
import { PILL_COLORS, DAY_NAMES, formatTime } from '../lib/utils';
import type { Pill } from '../types';

type Props = { navigation: any; route: any };

export default function AddPillScreen({ navigation, route }: Props) {
  const editPillId = route.params?.pillId;
  const { colors } = useTheme();
  const { user } = useAuth();
  const { pills, addPill, updatePill } = usePillStore();

  const existingPill = editPillId ? pills.find((p) => p.id === editPillId) : null;

  const [name, setName] = useState(existingPill?.name ?? '');
  const [dosage, setDosage] = useState(existingPill?.dosage ?? '');
  const [color, setColor] = useState(existingPill?.color ?? PILL_COLORS[0]);
  const [notes, setNotes] = useState(existingPill?.notes ?? '');
  const [frequency, setFrequency] = useState<Pill['frequency']>(existingPill?.frequency ?? 'daily');
  const [days, setDays] = useState<number[]>(existingPill?.days ?? []);
  const [times, setTimes] = useState<string[]>(existingPill?.times ?? ['08:00']);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [editingTimeIndex, setEditingTimeIndex] = useState<number | null>(null);

  const userId = user?.id ?? 'local';

  const handleSave = async () => {
    if (!name.trim()) { Alert.alert('Error', 'Please enter a pill name'); return; }
    if (!dosage.trim()) { Alert.alert('Error', 'Please enter dosage'); return; }
    if (times.length === 0) { Alert.alert('Error', 'Please add at least one time'); return; }
    if ((frequency === 'weekly' || frequency === 'custom') && days.length === 0) {
      Alert.alert('Error', 'Please select at least one day');
      return;
    }

    if (existingPill) {
      await updatePill({
        ...existingPill,
        name: name.trim(),
        dosage: dosage.trim(),
        color,
        notes: notes.trim() || undefined,
        frequency,
        days: frequency === 'daily' ? undefined : days,
        times,
      });
    } else {
      await addPill({
        userId,
        name: name.trim(),
        dosage: dosage.trim(),
        color,
        notes: notes.trim() || undefined,
        frequency,
        days: frequency === 'daily' ? undefined : days,
        times,
      });
    }
    navigation.goBack();
  };

  const toggleDay = (day: number) => {
    setDays((prev) => prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]);
  };

  const addTime = (time: string) => {
    if (editingTimeIndex !== null) {
      setTimes((prev) => prev.map((t, i) => (i === editingTimeIndex ? time : t)));
      setEditingTimeIndex(null);
    } else {
      setTimes((prev) => [...prev, time].sort());
    }
  };

  const removeTime = (index: number) => {
    setTimes((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[styles.cancelBtn, { color: colors.textSecondary }]}>Cancel</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {existingPill ? 'Edit Pill' : 'Add Pill'}
        </Text>
        <TouchableOpacity onPress={handleSave}>
          <Text style={[styles.saveBtn, { color: colors.primary }]}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Name */}
        <Text style={[styles.label, { color: colors.textSecondary }]}>Name</Text>
        <TextInput
          style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.card }]}
          value={name}
          onChangeText={setName}
          placeholder="e.g. Vitamin D"
          placeholderTextColor={colors.textSecondary}
        />

        {/* Dosage */}
        <Text style={[styles.label, { color: colors.textSecondary }]}>Dosage</Text>
        <TextInput
          style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.card }]}
          value={dosage}
          onChangeText={setDosage}
          placeholder="e.g. 1000 IU"
          placeholderTextColor={colors.textSecondary}
        />

        {/* Color */}
        <Text style={[styles.label, { color: colors.textSecondary }]}>Color Tag</Text>
        <View style={styles.colorRow}>
          {PILL_COLORS.map((c) => (
            <TouchableOpacity
              key={c}
              style={[styles.colorDot, { backgroundColor: c, borderWidth: color === c ? 3 : 0, borderColor: colors.text }]}
              onPress={() => setColor(c)}
            />
          ))}
        </View>

        {/* Notes */}
        <Text style={[styles.label, { color: colors.textSecondary }]}>Notes (optional)</Text>
        <TextInput
          style={[styles.input, styles.multiline, { color: colors.text, borderColor: colors.border, backgroundColor: colors.card }]}
          value={notes}
          onChangeText={setNotes}
          placeholder="Any special instructions..."
          placeholderTextColor={colors.textSecondary}
          multiline
          numberOfLines={3}
        />

        {/* Frequency */}
        <Text style={[styles.label, { color: colors.textSecondary }]}>Frequency</Text>
        <View style={styles.freqRow}>
          {(['daily', 'weekly', 'custom'] as const).map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.freqBtn, { backgroundColor: frequency === f ? colors.primary : colors.card, borderColor: colors.border }]}
              onPress={() => setFrequency(f)}
            >
              <Text style={{ color: frequency === f ? colors.textInverse : colors.text, fontWeight: '600' }}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Days */}
        {(frequency === 'weekly' || frequency === 'custom') && (
          <>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Days</Text>
            <View style={styles.daysRow}>
              {DAY_NAMES.map((d, i) => (
                <TouchableOpacity
                  key={`day-${i}`}
                  style={[styles.dayBtn, { backgroundColor: days.includes(i) ? colors.primary : colors.card, borderColor: colors.border }]}
                  onPress={() => toggleDay(i)}
                >
                  <Text style={{ color: days.includes(i) ? colors.textInverse : colors.text, fontSize: 12, fontWeight: '600' }}>
                    {d}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {/* Times */}
        <Text style={[styles.label, { color: colors.textSecondary }]}>Times</Text>
        {times.map((t, i) => (
          <View key={`time-${i}-${t}`} style={[styles.timeRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <TouchableOpacity onPress={() => { setEditingTimeIndex(i); setShowTimePicker(true); }} style={{ flex: 1 }}>
              <Text style={[styles.timeText, { color: colors.text }]}>{formatTime(t)}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => removeTime(i)}>
              <Text style={{ color: colors.error, fontSize: 18 }}>✕</Text>
            </TouchableOpacity>
          </View>
        ))}
        <TouchableOpacity
          style={[styles.addTimeBtn, { borderColor: colors.primary }]}
          onPress={() => { setEditingTimeIndex(null); setShowTimePicker(true); }}
        >
          <Text style={{ color: colors.primary, fontWeight: '600' }}>+ Add Time</Text>
        </TouchableOpacity>
      </ScrollView>

      <TimePickerModal
        visible={showTimePicker}
        onClose={() => { setShowTimePicker(false); setEditingTimeIndex(null); }}
        onSelect={addTime}
        initialTime={editingTimeIndex !== null ? times[editingTimeIndex] : undefined}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12 },
  headerTitle: { fontSize: 17, fontWeight: '700' },
  cancelBtn: { fontSize: 16 },
  saveBtn: { fontSize: 16, fontWeight: '700' },
  content: { paddingHorizontal: 20, paddingBottom: 40 },
  label: { fontSize: 13, fontWeight: '600', marginTop: 18, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 16 },
  multiline: { minHeight: 80, textAlignVertical: 'top' },
  colorRow: { flexDirection: 'row', gap: 12 },
  colorDot: { width: 32, height: 32, borderRadius: 16 },
  freqRow: { flexDirection: 'row', gap: 10 },
  freqBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center', borderWidth: 1 },
  daysRow: { flexDirection: 'row', gap: 6 },
  dayBtn: { width: 42, height: 42, borderRadius: 21, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  timeRow: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 10, borderWidth: 1, marginBottom: 8 },
  timeText: { fontSize: 16, fontWeight: '500' },
  addTimeBtn: { borderWidth: 1.5, borderStyle: 'dashed', borderRadius: 10, padding: 14, alignItems: 'center', marginTop: 4 },
});
