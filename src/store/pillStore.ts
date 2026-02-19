import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { schedulePillNotifications, cancelPillNotifications, dismissPillNotification } from '../lib/notifications';
import { generateId } from '../lib/utils';
import { format } from 'date-fns';
import type { Pill, PillLog } from '../types';

type PillStore = {
  pills: Pill[];
  logs: PillLog[];
  loading: boolean;
  fetchPills: (userId: string) => Promise<void>;
  fetchLogs: (userId: string) => Promise<void>;
  addPill: (pill: Omit<Pill, 'id' | 'createdAt'>) => Promise<void>;
  updatePill: (pill: Pill) => Promise<void>;
  deletePill: (id: string) => Promise<void>;
  logPillTaken: (pillId: string, scheduledTime: string, userId: string) => Promise<void>;
};

export const usePillStore = create<PillStore>((set, get) => ({
  pills: [],
  logs: [],
  loading: false,

  fetchPills: async (userId: string) => {
    set({ loading: true });
    try {
      // Try Supabase first
      const { data, error } = await supabase
        .from('pills')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (data && !error) {
        const pills: Pill[] = data.map((r) => ({
          id: r.id,
          userId: r.user_id,
          name: r.name,
          dosage: r.dosage,
          color: r.color,
          notes: r.notes,
          frequency: r.frequency,
          days: r.days,
          times: r.times,
          createdAt: r.created_at,
        }));
        set({ pills });
        await AsyncStorage.setItem(`pills_${userId}`, JSON.stringify(pills));
      } else {
        // Fallback to local
        const cached = await AsyncStorage.getItem(`pills_${userId}`);
        if (cached) set({ pills: JSON.parse(cached) });
      }
    } catch {
      const cached = await AsyncStorage.getItem(`pills_${userId}`);
      if (cached) set({ pills: JSON.parse(cached) });
    }
    set({ loading: false });
  },

  fetchLogs: async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('pill_logs')
        .select('*')
        .eq('user_id', userId)
        .order('scheduled_time', { ascending: false })
        .limit(500);

      if (data && !error) {
        const logs: PillLog[] = data.map((r) => ({
          id: r.id,
          pillId: r.pill_id,
          scheduledTime: r.scheduled_time,
          takenAt: r.taken_at,
          status: r.status,
        }));
        set({ logs });
        await AsyncStorage.setItem(`logs_${userId}`, JSON.stringify(logs));
      } else {
        const cached = await AsyncStorage.getItem(`logs_${userId}`);
        if (cached) set({ logs: JSON.parse(cached) });
      }
    } catch {
      const cached = await AsyncStorage.getItem(`logs_${userId}`);
      if (cached) set({ logs: JSON.parse(cached) });
    }
  },

  addPill: async (pillData) => {
    const id = generateId();
    const pill: Pill = { ...pillData, id, createdAt: new Date().toISOString() };

    set((s) => ({ pills: [pill, ...s.pills] }));
    await AsyncStorage.setItem(`pills_${pill.userId}`, JSON.stringify(get().pills));

    try {
      await supabase.from('pills').insert({
        id: pill.id,
        user_id: pill.userId,
        name: pill.name,
        dosage: pill.dosage,
        color: pill.color,
        notes: pill.notes ?? null,
        frequency: pill.frequency,
        days: pill.days ?? null,
        times: pill.times,
        created_at: pill.createdAt,
      });
    } catch {}

    await schedulePillNotifications(pill);
  },

  updatePill: async (pill) => {
    set((s) => ({ pills: s.pills.map((p) => (p.id === pill.id ? pill : p)) }));
    await AsyncStorage.setItem(`pills_${pill.userId}`, JSON.stringify(get().pills));

    try {
      await supabase.from('pills').update({
        name: pill.name,
        dosage: pill.dosage,
        color: pill.color,
        notes: pill.notes ?? null,
        frequency: pill.frequency,
        days: pill.days ?? null,
        times: pill.times,
      }).eq('id', pill.id);
    } catch {}

    await schedulePillNotifications(pill);
  },

  deletePill: async (id) => {
    const pill = get().pills.find((p) => p.id === id);
    set((s) => ({ pills: s.pills.filter((p) => p.id !== id) }));
    if (pill) {
      await AsyncStorage.setItem(`pills_${pill.userId}`, JSON.stringify(get().pills));
      await cancelPillNotifications(id);
    }
    try {
      await supabase.from('pills').delete().eq('id', id);
      await supabase.from('pill_logs').delete().eq('pill_id', id);
    } catch {}
  },

  logPillTaken: async (pillId, scheduledTime, userId) => {
    const now = new Date().toISOString();
    const logId = generateId();
    const log: PillLog = { id: logId, pillId, scheduledTime, takenAt: now, status: 'taken' };

    // Check if already logged
    const existing = get().logs.find((l) => l.pillId === pillId && l.scheduledTime === scheduledTime);
    if (existing?.status === 'taken') return;

    if (existing) {
      set((s) => ({
        logs: s.logs.map((l) =>
          l.pillId === pillId && l.scheduledTime === scheduledTime
            ? { ...l, takenAt: now, status: 'taken' as const }
            : l
        ),
      }));
    } else {
      set((s) => ({ logs: [log, ...s.logs] }));
    }

    await AsyncStorage.setItem(`logs_${userId}`, JSON.stringify(get().logs));

    // Dismiss notification
    const time = scheduledTime.split('T')[1];
    if (time) await dismissPillNotification(pillId, time);

    try {
      if (existing) {
        await supabase.from('pill_logs').update({ taken_at: now, status: 'taken' }).eq('id', existing.id);
      } else {
        await supabase.from('pill_logs').insert({
          id: logId,
          pill_id: pillId,
          user_id: userId,
          scheduled_time: scheduledTime,
          taken_at: now,
          status: 'taken',
        });
      }
    } catch {}
  },
}));
