import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { usePillStore } from '../store/pillStore';
import { formatTime, DAY_NAMES } from '../lib/utils';

export default function PillDetailScreen({ navigation, route }: any) {
  const { pillId } = route.params;
  const { colors } = useTheme();
  const { pills, deletePill } = usePillStore();
  const pill = pills.find((p) => p.id === pillId);

  if (!pill) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.text }]}>Pill not found</Text>
      </SafeAreaView>
    );
  }

  const handleDelete = () => {
    Alert.alert('Delete Pill', `Are you sure you want to delete "${pill.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deletePill(pill.id);
          navigation.goBack();
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[styles.backBtn, { color: colors.primary }]}>← Back</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('AddPill', { pillId: pill.id })}>
          <Text style={[styles.editBtn, { color: colors.primary }]}>Edit</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.iconContainer, { backgroundColor: pill.color + '20' }]}>
          <Text style={styles.icon}>💊</Text>
        </View>

        <Text style={[styles.name, { color: colors.text }]}>{pill.name}</Text>
        <Text style={[styles.dosage, { color: colors.textSecondary }]}>{pill.dosage}</Text>

        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <DetailRow label="Frequency" value={pill.frequency.charAt(0).toUpperCase() + pill.frequency.slice(1)} colors={colors} />
          {pill.days && pill.days.length > 0 && (
            <DetailRow label="Days" value={pill.days.map((d) => DAY_NAMES[d]).join(', ')} colors={colors} />
          )}
          <DetailRow label="Times" value={pill.times.map(formatTime).join(', ')} colors={colors} />
          {pill.notes && <DetailRow label="Notes" value={pill.notes} colors={colors} />}
          <DetailRow label="Color" value="" colors={colors}>
            <View style={[styles.colorPreview, { backgroundColor: pill.color }]} />
          </DetailRow>
        </View>

        <TouchableOpacity style={[styles.deleteBtn, { backgroundColor: colors.error + '15' }]} onPress={handleDelete}>
          <Text style={{ color: colors.error, fontWeight: '600', fontSize: 16 }}>Delete Pill</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function DetailRow({ label, value, colors, children }: { label: string; value: string; colors: any; children?: React.ReactNode }) {
  return (
    <View style={detailStyles.row}>
      <Text style={[detailStyles.label, { color: colors.textSecondary }]}>{label}</Text>
      {children ?? <Text style={[detailStyles.value, { color: colors.text }]}>{value}</Text>}
    </View>
  );
}

const detailStyles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#eee' },
  label: { fontSize: 14 },
  value: { fontSize: 14, fontWeight: '500', maxWidth: '60%', textAlign: 'right' },
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12 },
  backBtn: { fontSize: 16, fontWeight: '500' },
  editBtn: { fontSize: 16, fontWeight: '600' },
  content: { alignItems: 'center', paddingHorizontal: 20, paddingBottom: 40 },
  iconContainer: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 12, marginTop: 8 },
  icon: { fontSize: 40 },
  name: { fontSize: 24, fontWeight: '800' },
  dosage: { fontSize: 16, marginTop: 4, marginBottom: 20 },
  card: { width: '100%', borderRadius: 16, padding: 16, marginBottom: 24 },
  colorPreview: { width: 24, height: 24, borderRadius: 12 },
  deleteBtn: { width: '100%', padding: 16, borderRadius: 12, alignItems: 'center' },
  errorText: { fontSize: 16, textAlign: 'center', marginTop: 40 },
});
