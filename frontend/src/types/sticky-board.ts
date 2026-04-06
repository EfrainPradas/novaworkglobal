export type NoteColor = 'yellow' | 'blue' | 'green' | 'pink' | 'purple' | 'orange'

export type NoteModule = 'global' | 'resume-builder' | 'job-search' | 'interview-mastery' | 'career-vision'

export interface StickyNote {
  id: string
  user_id: string
  title: string
  content: string
  color: NoteColor
  module: NoteModule
  pinned: boolean
  archived: boolean
  position_x: number
  position_y: number
  created_at: string
  updated_at: string
}

export type StickyNoteInsert = Omit<StickyNote, 'id' | 'created_at' | 'updated_at'>
export type StickyNoteUpdate = Partial<Omit<StickyNote, 'id' | 'user_id' | 'created_at'>>
