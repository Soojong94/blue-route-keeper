import { supabase } from '@/integrations/supabase/client';

export interface SavedReport {
  id: string;
  title: string;
  type: 'daily' | 'monthly';
  settings: any;
  data: any;
  created_at: string;
  updated_at: string | null;
}

export const saveReport = async (reportData: {
  title: string;
  type: 'daily' | 'monthly';
  settings: any;
  data: any;
}): Promise<SavedReport> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('reports')
    .insert([{
      user_id: user.id,
      title: reportData.title,
      type: reportData.type,
      settings: reportData.settings,
      data: reportData.data
    }])
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id,
    title: data.title,
    type: data.type as 'daily' | 'monthly',
    settings: data.settings,
    data: data.data,
    created_at: data.created_at,
    updated_at: data.updated_at
  };
};

export const getReports = async (): Promise<SavedReport[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return data.map(report => ({
    id: report.id,
    title: report.title,
    type: report.type as 'daily' | 'monthly',
    settings: report.settings,
    data: report.data,
    created_at: report.created_at,
    updated_at: report.updated_at
  }));
};

export const updateReport = async (id: string, updates: {
  title?: string;
  settings?: any;
  data?: any;
}): Promise<SavedReport> => {
  const { data, error } = await supabase
    .from('reports')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id,
    title: data.title,
    type: data.type as 'daily' | 'monthly',
    settings: data.settings,
    data: data.data,
    created_at: data.created_at,
    updated_at: data.updated_at
  };
};

export const deleteReport = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('reports')
    .delete()
    .eq('id', id);

  if (error) throw error;
};