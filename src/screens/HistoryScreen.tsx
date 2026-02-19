import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { useAuth } from '../store/authContext';
import { usePillStore } from '../store/pillStore';
import { calculateStreak } from '../lib/utils';
import { format, addDays, startOfWeek, isSameDay, subDays } from 'date-fns';

export default function HistoryScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { pills, logs, fetchLogs } = usePillStore();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [filterPillId, setFilterPillId] = useState<string | null>(null);

  const userId = user?.id ?? 'local';

  useEffect(() => {
    fetchLogs(userId);
  }, [userId]);

  const streak = useMemo(() => calculateStreak(logs, pills), [logs, pills]);

  // Generate 5 weeks of dates centered around today
  const calendarDates = useMemo(() => {
    const start = subDays(new Date(), 28);
    return Array.from({ length: 35 }, (_, i) => addDays(start, i));
  }, []);

  const getDateStatus = (date: Date): 'taken' | 'missed' | 'partial' | 'none' | 'future' => {
    if (date > new Date()) return 'future';
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayLogs = logs.filter((l) => {
      if (filterPillId && l.pillId !== filterPillId) return false;
      return l.scheduledTime.startsWith(dateStr);
    });
    if (dayLogs.length === 0) return 'none';
    const allTaken = dayLogs.every((l) => l.status === 'taken');
    const someTaken = dayLogs.some((l) => l.status === 'taken');
    if (allTaken) return 'taken';
    if (someTaken) return 'partial';
    return 'missed';
  };

  const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
  const selectedLogs = useMemo(
    () =>
      logs.filter((l) => {
        if (filterPillId && l.pillId !== filterPillId) return false;
        return l.scheduledTime.startsWith(selectedDateStr);
      }),
    [logs, selectedDateStr, filterPillId]
  );

  const statusDot = (status: string) => {
    if (status === 'taken') return colors.taken;
    if (status === 'missed') return colors.missed;
    if (status === 'partial') return colors.warning;
    return 'transparent';
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <Text style={[styles.title, { color: colors.text }]}>History</Text>

      {/* Streak */}
      <View style={[styles.streakCard, { backgroundColor: colors.primary + '15' }]}>
        <Text style={styles.streakIcon}>🔥</Text>
        <View>
          <Text style={[styles.streakNum, { color: colors.primary }]}>{streak} day{streak !== 1 ? 's' : ''}</Text>
          <Text style={[styles.streakLabel, { color: colors.textSecondary }]}>Current streak</Text>
        </View>
      </View>

      {/* Filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow} contentContainerStyle={{ paddingHorizontal: 16 }}>
        <TouchableOpacity
          style={[styles.filterChip, { backgroundColor: !filterPillId ? colors.primary : colors.card }]}
          onPress={() => setFilterPillId(null)}
        >
          <Text style={{ color: !filterPillId ? colors.textInverse : colors.text, fontSize: 13, fontWeight: '600' }}>All</Text>
        </TouchableOpacity>
        {pills.map((p) => (
          <TouchableOpacity
            key={p.id}
            style={[styles.filterChip, { backgroundColor: filterPillId === p.id ? p.color : colors.card }]}
            onPress={() => setFilterPillId(filterPillId === p.id ? null : p.id)}
          >
            <Text style={{ color: filterPillId === p.id ? '#fff' : colors.text, fontSize: 13, fontWeight: '600' }}>{p.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Calendar */}
      <View style={styles.calendarHeader}>
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <Text key={i} style={[styles.calDayHeader, { color: colors.textSecondary }]}>{d}</Text>
        ))}
      </View>
      <View style={styles.calendarGrid}>
        {calendarDates.map((date, i) => {
          const status = getDateStatus(date);
          const isSelected = isSameDay(date, selectedDate);
          const isToday = isSameDay(date, new Date());
          return (
            <TouchableOpacity
              key={i}
              style={[
                styles.calDay,
                isSelected && { backgroundColor: colors.primary + '20', borderRadius: 8 },
              ]}
              onPress={() => setSelectedDate(date)}
            >
              <Text style={[
                styles.calDayText,
                { color: status === 'future' ? colors.textSecondary : colors.text },
                isToday && { fontWeight: '800' },
              ]}>
                {format(date, 'd')}
              </Text>
              <View style={[styles.calDot, { backgroundColor: statusDot(status) }]} />
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Selected day logs */}
      <Text style={[styles.dateLabel, { color: colors.text }]}>{format(selectedDate, 'EEEE, MMM d')}</Text>
      {selectedLogs.length === 0 ? (
        <Text style={[styles.noLogs, { color: colors.textSecondary }]}>No records for this day</Text>
      ) : (
        <FlatList
          data={selectedLogs}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const pill = pills.find((p) => p.id === item.pillId);
            return (
              <View style={[styles.logRow, { backgroundColor: colors.card }]}>
                <View style={[styles.logDot, { backgroundColor: item.status === 'taken' ? colors.taken : colors.missed }]} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.logPill, { color: colors.text }]}>{pill?.name ?? 'Unknown'}</Text>
                  <Text style={[styles.logTime, { color: colors.textSecondary }]}>
                    Scheduled: {item.scheduledTime.split('T')[1]}
                  </Text>
                </View>
                <Text style={{ color: item.status === 'taken' ? colors.taken : colors.missed, fontWeight: '600', fontSize: 12 }}>
                  {item.status === 'taken' ? '✅ Taken' : '❌ Missed'}
                </Text>
              </View>
            );
          }}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: { fontSize: 28, fontWeight: '800', paddingHorizontal: 20, paddingTop: 12 },
  streakCard: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginTop: 12, padding: 16, borderRadius: 14, gap: 12 },
  streakIcon: { fontSize: 32 },
  streakNum: { fontSize: 20, fontWeight: '700' },
  streakLabel: { fontSize: 13 },
  filterRow: { maxHeight: 48, marginTop: 12 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, marginRight: 8 },
  calendarHeader: { flexDirection: 'row', paddingHorizontal: 16, marginTop: 12 },
  calDayHeader: { flex: 1, textAlign: 'center', fontSize: 12, fontWeight: '600' },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, marginTop: 4 },
  calDay: { width: '14.28%', alignItems: 'center', paddingVertical: 6 },
  calDayText: { fontSize: 14 },
  calDot: { width: 6, height: 6, borderRadius: 3, marginTop: 2 },
  dateLabel: { fontSize: 16, fontWeight: '700', paddingHorizontal: 20, marginTop: 12, marginBottom: 8 },
  noLogs: { paddingHorizontal: 20, fontSize: 14 },
  logRow: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginBottom: 8, padding: 12, borderRadius: 10, gap: 10 },
  logDot: { width: 10, height: 10, borderRadius: 5 },
  logPill: { fontSize: 14, fontWeight: '600' },
  logTime: { fontSize: 12, marginTop: 2 },
});
