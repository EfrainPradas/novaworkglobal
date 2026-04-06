import { supabase } from '../lib/supabase'
import type { StickyNote, StickyNoteInsert, StickyNoteUpdate } from '../types/sticky-board'

export async function getNotes(userId: string): Promise<StickyNote[]> {
  const { data, error } = await supabase
    .from('sticky_notes')
    .select('*')
    .eq('user_id', userId)
    .order('pinned', { ascending: false })
    .order('updated_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function createNote(note: StickyNoteInsert): Promise<StickyNote> {
  const { data, error } = await supabase
    .from('sticky_notes')
    .insert([note])
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateNote(noteId: string, updates: StickyNoteUpdate): Promise<StickyNote> {
  const { data, error } = await supabase
    .from('sticky_notes')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', noteId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteNote(noteId: string): Promise<void> {
  const { error } = await supabase
    .from('sticky_notes')
    .delete()
    .eq('id', noteId)

  if (error) throw error
}
