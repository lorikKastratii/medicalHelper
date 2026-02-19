import { create } from 'zustand';
import { supabase } from '../lib/supabase';

type SupabaseStore = {
  connected: boolean;
  checkConnection: () => Promise<void>;
};

export const useSupabaseStore = create<SupabaseStore>((set) => ({
  connected: false,
  checkConnection: async () => {
    try {
      const { error } = await supabase.from('pills').select('id').limit(1);
      set({ connected: !error });
    } catch {
      set({ connected: false });
    }
  },
}));
