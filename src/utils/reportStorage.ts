// src/utils/reportStorage.ts - editable_rows 필드 추가
import { supabase } from '@/integrations/supabase/client';

export interface SavedReport {
  id: string;
  title: string;
  type: 'daily' | 'monthly';
  settings: any;
  data: any;
  editable_rows?: any[]; // 새로 추가된 필드
  created_at: string;
  updated_at: string | null;
}

export const saveReport = async (reportData: {
  title: string;
  type: 'daily' | 'monthly';
  settings: any;
  data: any;
  editableRows?: any[]; // 새로 추가된 매개변수
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
      editable_rows: reportData.editableRows || [] // 새로 추가된 필드
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
    editable_rows: data.editable_rows,
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
    editable_rows: report.editable_rows,
    created_at: report.created_at,
    updated_at: report.updated_at
  }));
};

export const updateReport = async (id: string, updates: {
  title?: string;
  settings?: any;
  data?: any;
  editableRows?: any[]; // 새로 추가된 필드
}): Promise<SavedReport> => {
  const updateData: any = {
    ...updates,
    updated_at: new Date().toISOString()
  };

  // editableRows가 있으면 editable_rows로 변환
  if (updates.editableRows !== undefined) {
    updateData.editable_rows = updates.editableRows;
    delete updateData.editableRows;
  }

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
    type: data.type as 'daily' | 'monthly',
    settings: data.settings,
    data: data.data,
    editable_rows: data.editable_rows,
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