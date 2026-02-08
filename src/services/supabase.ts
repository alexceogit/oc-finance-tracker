// Supabase Client for oc-finance-tracker
// Usage: import { supabase } from './services/supabase';

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY || '';

export const supabase = supabaseUrl && supabaseKey 
  ? createClient(supabaseUrl, supabaseKey)
  : null;

// Helper functions for common operations
export const supabaseHelpers = {
  // Test connection
  async testConnection() {
    if (!supabase) return { success: false, error: 'Supabase not configured' };
    try {
      const { data, error } = await supabase.from('incomes').select('count', { count: 'exact', head: true });
      if (error) throw error;
      return { success: true, message: 'Connected to Supabase!' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Sync local data to cloud
  async syncTable(tableName: string, data: any[]) {
    if (!supabase) return { success: false, error: 'Supabase not configured' };
    try {
      const { error } = await supabase.from(tableName).upsert(data);
      if (error) throw error;
      return { success: true, message: `Synced ${data.length} records to ${tableName}` };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Fetch data from cloud
  async fetchTable(tableName: string) {
    if (!supabase) return { success: false, error: 'Supabase not configured', data: [] };
    try {
      const { data, error } = await supabase.from(tableName).select('*');
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message, data: [] };
    }
  }
};
