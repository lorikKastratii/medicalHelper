import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { useAuth } from '../store/authContext';
import { usePillStore } from '../store/pillStore';
import PillCard from '../components/PillCard';
import TakePillModal from '../components/TakePillModal';
import { isPillDueToday, getPillStatusForTime } from '../lib/utils';
import { format } from 'date-fns';
import type { Pill } from '../types';

type ScheduleItem = { pill: Pill; time: string; status: 'taken' | 'missed' | 'pending' };

export default function HomeScreen({ navigation }: any) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { pills, logs, loading, fetchPills, fetchLogs, logPillTaken } = usePillStore();
  const [refreshing, setRefreshing] = useState(false);
  const [modalPill, setModalPill] = useState<Pill | null>(null);
  const [modalTime, setModalTime] = useState('');
  const [modalVisible, setModalVisible] = useState(false);

  const userId = user?.id ?? 'local';

  useEffect(() => {
    fetchPills(userId);
    fetchLogs(userId);
  }, [userId]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchPills(userId), fetchLogs(userId)]);
    setRefreshing(false);
  }, [userId]);

  const schedule = useMemo<ScheduleItem[]>(() => {
    const items: ScheduleItem[] = [];
    const today = new Date();
    for (const pill of pills) {
      if (!isPillDueToday(pill)) continue;
      for (const time of pill.times) {
        const status = getPillStatusForTime(logs, pill.id, time, today);
        items.push({ pill, time, status });
      }
    }
    items.sort((a, b) => a.time.localeCompare(b.time));
    return items;
  }, [pills, logs]);

  const pendingCount = schedule.filter((s) => s.status === 'pending').length;
  const takenCount = schedule.filter((s) => s.status === 'taken').length;

  const handleTake = (pill: Pill, time: string) => {
    setModalPill(pill);
    setModalTime(time);
    setModalVisible(true);
  };

  const confirmTake = () => {
    if (!modalPill) return;
    const scheduledTime = format(new Date(), 'yyyy-MM-dd') + 'T' + modalTime;
    logPillTaken(modalPill.id, scheduledTime, userId);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.greeting, { color: colors.textSecondary }]}>
            {format(new Date(), 'EEEE, MMM d')}
          </Text>
          <Text style={[styles.title, { color: colors.text }]}>Today's Pills</Text>
        </View>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
          onPress={() => navigation.navigate('AddPill')}
        >
          <Text style={[styles.addBtnText, { color: colors.textInverse }]}>+ Add</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.statNum, { color: colors.taken }]}>{takenCount}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Taken</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.statNum, { color: colors.pending }]}>{pendingCount}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Pending</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.statNum, { color: colors.text }]}>{schedule.length}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total</Text>
        </View>
      </View>

      {schedule.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>💊</Text>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No pills scheduled</Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Tap "+ Add" to add your first medication
          </Text>
        </View>
      ) : (
        <FlatList
          data={schedule}
          keyExtractor={(item) => `${item.pill.id}_${item.time}`}
          renderItem={({ item }) => (
            <PillCard
              pill={item.pill}
              time={item.time}
              status={item.status}
              onPress={() => navigation.navigate('PillDetail', { pillId: item.pill.id })}
              onTake={() => handleTake(item.pill, item.time)}
            />
          )}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          contentContainerStyle={{ paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
        />
      )}

      <TakePillModal
        visible={modalVisible}
        pill={modalPill}
        time={modalTime}
        onConfirm={confirmTake}
        onClose={() => setModalVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 },
  greeting: { fontSize: 14 },
  title: { fontSize: 28, fontWeight: '800', marginTop: 2 },
  addBtn: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 20 },
  addBtnText: { fontSize: 14, fontWeight: '600' },
  statsRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 10, marginBottom: 12 },
  statCard: { flex: 1, borderRadius: 12, padding: 14, alignItems: 'center', elevation: 1 },
  statNum: { fontSize: 22, fontWeight: '700' },
  statLabel: { fontSize: 12, marginTop: 2 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 100 },
  emptyIcon: { fontSize: 56, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '600' },
  emptyText: { fontSize: 14, marginTop: 4 },
});
