export type Pill = {
  id: string;
  userId: string;
  name: string;
  dosage: string;
  color: string;
  notes?: string;
  frequency: 'daily' | 'weekly' | 'custom';
  days?: number[];
  times: string[];
  createdAt: string;
};

export type PillLog = {
  id: string;
  pillId: string;
  scheduledTime: string;
  takenAt: string | null;
  status: 'taken' | 'missed' | 'pending';
};

export type UserProfile = {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
};
