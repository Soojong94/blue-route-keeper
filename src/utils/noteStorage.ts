import { supabase } from '@/integrations/supabase/client';

export interface Note {
  id: string;
  title: string;
  content: any[][];
  created_at: string;
  updated_at: string | null;
}

export const saveNote = async (noteData: {
  title: string;
  content: any[][];
}): Promise<Note> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('notes')
    .insert([{
      user_id: user.id,
      title: noteData.title,
      content: noteData.content
    }])
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id,
    title: data.title,
    content: data.content,
    created_at: data.created_at,
    updated_at: data.updated_at
  };
};

export const getNotes = async (): Promise<Note[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false });

  if (error) throw error;

  return data.map(note => ({
    id: note.id,
    title: note.title,
    content: note.content || [],
    created_at: note.created_at,
    updated_at: note.updated_at
  }));
};

export const updateNote = async (id: string, updates: {
  title?: string;
  content?: any[][];
}): Promise<Note> => {
  const { data, error } = await supabase
    .from('notes')
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
    content: data.content,
    created_at: data.created_at,
    updated_at: data.updated_at
  };
};

export const deleteNote = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('notes')
    .delete()
    .eq('id', id);

  if (error) throw error;
};