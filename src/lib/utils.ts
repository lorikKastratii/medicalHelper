import { format, parse, isToday, isBefore, startOfDay, addDays, subMinutes } from 'date-fns';
import type { Pill, PillLog } from '../types';

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

export function formatTime(time: string): string {
  const date = parse(time, 'HH:mm', new Date());
  return format(date, 'h:mm a');
}

export function getTimeDate(time: string, baseDate: Date = new Date()): Date {
  const [h, m] = time.split(':').map(Number);
  const d = new Date(baseDate);
  d.setHours(h, m, 0, 0);
  return d;
}

export function getReminderDate(time: string, baseDate: Date = new Date()): Date {
  return subMinutes(getTimeDate(time, baseDate), 5);
}

export function isPillDueToday(pill: Pill): boolean {
  const today = new Date().getDay();
  if (pill.frequency === 'daily') return true;
  if (pill.frequency === 'weekly' && pill.days) return pill.days.includes(today);
  if (pill.frequency === 'custom' && pill.days) return pill.days.includes(today);
  return true;
}

export function getPillStatusForTime(
  logs: PillLog[],
  pillId: string,
  time: string,
  date: Date = new Date()
): 'taken' | 'missed' | 'pending' {
  const scheduledStr = format(date, 'yyyy-MM-dd') + 'T' + time;
  const log = logs.find(
    (l) => l.pillId === pillId && l.scheduledTime === scheduledStr
  );
  if (log) return log.status;
  const timeDate = getTimeDate(time, date);
  if (isBefore(timeDate, new Date())) return 'missed';
  return 'pending';
}

export function calculateStreak(logs: PillLog[], pills: Pill[]): number {
  if (pills.length === 0) return 0;
  let streak = 0;
  let day = subMinutes(startOfDay(new Date()), 1); // yesterday end

  for (let i = 0; i < 365; i++) {
    const checkDate = addDays(startOfDay(new Date()), -i);
    if (isToday(checkDate)) continue; // skip today (incomplete)
    const dateStr = format(checkDate, 'yyyy-MM-dd');
    const duePills = pills.filter((p) => {
      const dow = checkDate.getDay();
      if (p.frequency === 'daily') return true;
      if ((p.frequency === 'weekly' || p.frequency === 'custom') && p.days) return p.days.includes(dow);
      return true;
    });
    if (duePills.length === 0) { streak++; continue; }
    const allTaken = duePills.every((p) =>
      p.times.every((t) => {
        const key = dateStr + 'T' + t;
        return logs.some((l) => l.pillId === p.id && l.scheduledTime === key && l.status === 'taken');
      })
    );
    if (allTaken) streak++;
    else break;
  }
  return streak;
}

export const PILL_COLORS = ['#4CAF50', '#2196F3', '#FF9800', '#E91E63', '#9C27B0', '#00BCD4', '#FF5722', '#607D8B'];

export const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
