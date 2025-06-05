// src/utils/reportStorage.ts
import { supabase } from '@/integrations/supabase/client';

export interface SavedReport {
  id: string;
  title: string;
  type: 'daily' | 'invoice'; // monthly 제거
  settings: any;
  data: any;
  editable_rows?: any;
  created_at: string;
  updated_at: string | null;
}

export const saveReport = async (reportData: {
  title: string;
  type: 'daily' | 'invoice'; // monthly 제거
  settings: any;
  data: any;
  editableRows?: any[];
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
      data: reportData.data,
      editable_rows: reportData.editableRows || null
    }])
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id,
    title: data.title,
    type: data.type as 'daily' | 'invoice', // monthly 제거
    settings: data.settings,
    data: data.data,
    editable_rows: data.editable_rows || undefined,
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
    type: report.type as 'daily' | 'invoice', // monthly 제거
    settings: report.settings,
    data: report.data,
    editable_rows: report.editable_rows || undefined,
    created_at: report.created_at,
    updated_at: report.updated_at
  }));
};

export const updateReport = async (id: string, updates: {
  title?: string;
  settings?: any;
  data?: any;
  editableRows?: any[];
}): Promise<SavedReport> => {
  const updateData: any = {
    updated_at: new Date().toISOString()
  };

  if (updates.title !== undefined) updateData.title = updates.title;
  if (updates.settings !== undefined) updateData.settings = updates.settings;
  if (updates.data !== undefined) updateData.data = updates.data;
  if (updates.editableRows !== undefined) updateData.editable_rows = updates.editableRows;

  const { data, error } = await supabase
    .from('reports')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id,
    title: data.title,
    type: data.type as 'daily' | 'invoice', // monthly 제거
    settings: data.settings,
    data: data.data,
    editable_rows: data.editable_rows || undefined,
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