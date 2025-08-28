import { supabaseAdmin } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

export type UserNote = Database['public']['Tables']['user_notes']['Row'];
type UserNoteInsert = Database['public']['Tables']['user_notes']['Insert'];
type UserNoteUpdate = Database['public']['Tables']['user_notes']['Update'];

export async function fetchNotesByUser(userId: string): Promise<UserNote[]> {
  const { data, error } = await supabaseAdmin
    .from('user_notes')
    .select('*')
    .eq('user_id', userId)
    .order('note_date', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function createNoteForUser(userId: string, payload: Pick<UserNoteInsert, 'note_date' | 'title' | 'content'>): Promise<UserNote> {
  const { data, error } = await supabaseAdmin
    .from('user_notes')
    .insert({
      user_id: userId,
      note_date: payload.note_date,
      title: payload.title,
      content: payload.content,
    })
    .select('*')
    .single();

  if (error) throw error;
  return data as UserNote;
}

export async function updateNote(id: string, updates: Pick<UserNoteUpdate, 'note_date' | 'title' | 'content'>): Promise<UserNote> {
  const { data, error } = await supabaseAdmin
    .from('user_notes')
    .update({
      note_date: updates.note_date,
      title: updates.title,
      content: updates.content,
    })
    .eq('id', id)
    .select('*')
    .single();

  if (error) throw error;
  return data as UserNote;
}

export async function deleteNote(id: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('user_notes')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function deleteNotesBatch(ids: string[]): Promise<void> {
  if (!ids.length) return;
  const { error } = await supabaseAdmin
    .from('user_notes')
    .delete()
    .in('id', ids);

  if (error) throw error;
}