import { useState, useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { StickyNote, Plus, Pin, Archive, Trash2, X, Minimize2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import type { StickyNote as StickyNoteType, NoteColor, NoteModule } from '../../types/sticky-board'
import * as svc from '../../services/sticky-board.service'

/* ── Color palette ─────────────────────────────────────────── */
const COLORS: Record<NoteColor, { bg: string; border: string; header: string }> = {
  yellow: { bg: '#FFF9C4', border: '#F9A825', header: '#F57F17' },
  blue:   { bg: '#E3F2FD', border: '#42A5F5', header: '#1565C0' },
  green:  { bg: '#E8F5E9', border: '#66BB6A', header: '#2E7D32' },
  pink:   { bg: '#FCE4EC', border: '#EC407A', header: '#AD1457' },
  purple: { bg: '#F3E5F5', border: '#AB47BC', header: '#6A1B9A' },
  orange: { bg: '#FFF3E0', border: '#FFA726', header: '#E65100' },
}

const MODULE_LABELS: Record<NoteModule, string> = {
  global: 'All Modules',
  'resume-builder': 'Resume Builder',
  'job-search': 'Job Search',
  'interview-mastery': 'Interview Mastery',
  'career-vision': 'Career Vision',
}

const COLOR_KEYS = Object.keys(COLORS) as NoteColor[]

/* ── Detect current module from URL ────────────────────────── */
function useCurrentModule(): NoteModule {
  const { pathname } = useLocation()
  if (pathname.includes('/resume')) return 'resume-builder'
  if (pathname.includes('/job-search')) return 'job-search'
  if (pathname.includes('/interview')) return 'interview-mastery'
  if (pathname.includes('/career-vision')) return 'career-vision'
  return 'global'
}

/* ── Main widget ───────────────────────────────────────────── */
export default function StickyBoardWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [notes, setNotes] = useState<StickyNoteType[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [showNew, setShowNew] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const currentModule = useCurrentModule()

  // Load notes
  useEffect(() => {
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)
      try {
        const data = await svc.getNotes(user.id)
        setNotes(data)
      } catch {
        setNotes([])
      }
    })()
  }, [])

  /* ── Filtered: current module + global, non-archived ───── */
  const filtered = notes.filter(n =>
    !n.archived && (n.module === currentModule || n.module === 'global')
  )
  const pinned = filtered.filter(n => n.pinned)
  const unpinned = filtered.filter(n => !n.pinned)
  const sorted = [...pinned, ...unpinned]

  /* ── CRUD ──────────────────────────────────────────────── */
  const handleCreate = async (title: string, content: string, color: NoteColor) => {
    if (!userId) return
    const module = currentModule
    try {
      const note = await svc.createNote({
        user_id: userId, title, content, color, module,
        pinned: false, archived: false, position_x: 0, position_y: 0,
      })
      setNotes(prev => [note, ...prev])
    } catch {
      const localNote: StickyNoteType = {
        id: crypto.randomUUID(), user_id: userId, title, content, color, module,
        pinned: false, archived: false, position_x: 0, position_y: 0,
        created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
      }
      setNotes(prev => [localNote, ...prev])
    }
    setShowNew(false)
  }

  const handleUpdate = async (id: string, updates: Partial<StickyNoteType>) => {
    try {
      const updated = await svc.updateNote(id, updates)
      setNotes(prev => prev.map(n => (n.id === id ? updated : n)))
    } catch {
      setNotes(prev => prev.map(n => (n.id === id ? { ...n, ...updates, updated_at: new Date().toISOString() } : n)))
    }
    if (editingId === id) setEditingId(null)
  }

  const handleDelete = async (id: string) => {
    try { await svc.deleteNote(id) } catch { /* local fallback */ }
    setNotes(prev => prev.filter(n => n.id !== id))
    setEditingId(null)
  }

  const editingNote = editingId ? notes.find(n => n.id === editingId) : null

  return (
    <>
      {/* ── Floating button ────────────────────────────── */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-24 z-50 w-14 h-14 rounded-full shadow-2xl hover:scale-110 transition-all duration-200 flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #FFF9C4, #FFD54F)', border: '2px solid #F9A825' }}
          title="StickyBoard"
          aria-label="Open StickyBoard"
        >
          <StickyNote className="w-6 h-6" style={{ color: '#F57F17' }} />
        </button>
      )}

      {/* ── Panel ──────────────────────────────────────── */}
      {isOpen && (
        <div className="fixed bottom-6 right-24 z-50 w-[360px] max-h-[560px] flex flex-col bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{ background: 'linear-gradient(135deg, #FFF9C4, #FFD54F)' }}
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'rgba(245,127,23,0.15)' }}>
                <StickyNote className="w-4 h-4" style={{ color: '#F57F17' }} />
              </div>
              <div>
                <div className="text-sm font-bold" style={{ color: '#F57F17' }}>StickyBoard</div>
                <div className="text-xs" style={{ color: '#F9A825' }}>{MODULE_LABELS[currentModule]}</div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowNew(true)}
                className="p-1.5 rounded-lg transition-colors hover:bg-white/40"
                title="New Note"
              >
                <Plus className="w-4 h-4" style={{ color: '#F57F17' }} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg transition-colors hover:bg-white/40"
                title="Minimize"
              >
                <Minimize2 className="w-4 h-4" style={{ color: '#F57F17' }} />
              </button>
            </div>
          </div>

          {/* Notes list */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2" style={{ maxHeight: '420px' }}>
            {sorted.length === 0 && !showNew ? (
              <div className="flex flex-col items-center py-10 text-center">
                <StickyNote className="w-10 h-10 mb-3" style={{ color: '#F9A82540' }} />
                <p className="text-sm text-slate-400 mb-1">No notes here yet</p>
                <button
                  onClick={() => setShowNew(true)}
                  className="text-xs font-semibold mt-2 px-3 py-1.5 rounded-lg transition-colors"
                  style={{ color: '#F57F17', background: '#FFF9C4' }}
                >
                  + Create one
                </button>
              </div>
            ) : (
              sorted.map(note => (
                <MiniNoteCard
                  key={note.id}
                  note={note}
                  onEdit={() => setEditingId(note.id)}
                  onPin={() => handleUpdate(note.id, { pinned: !note.pinned })}
                  onArchive={() => handleUpdate(note.id, { archived: true })}
                  onDelete={() => handleDelete(note.id)}
                />
              ))
            )}
          </div>

          {/* Inline new note form */}
          {showNew && (
            <InlineNoteForm
              onSave={handleCreate}
              onCancel={() => setShowNew(false)}
            />
          )}

          {/* Edit overlay */}
          {editingNote && (
            <EditOverlay
              note={editingNote}
              onSave={(title, content, color) => handleUpdate(editingNote.id, { title, content, color })}
              onClose={() => setEditingId(null)}
            />
          )}
        </div>
      )}
    </>
  )
}

/* ── MiniNoteCard ────────────────────────────────────────── */
function MiniNoteCard({
  note,
  onEdit,
  onPin,
  onArchive,
  onDelete,
}: {
  note: StickyNoteType
  onEdit: () => void
  onPin: () => void
  onArchive: () => void
  onDelete: () => void
}) {
  const c = COLORS[note.color] || COLORS.yellow

  return (
    <div
      onClick={onEdit}
      className="group relative rounded-xl p-3 cursor-pointer transition-all hover:shadow-md"
      style={{ background: c.bg, borderLeft: `3px solid ${c.border}` }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          {note.pinned && <Pin size={10} className="inline mr-1 -mt-0.5 -rotate-45" style={{ color: c.header }} />}
          <span className="text-xs font-bold leading-snug" style={{ color: c.header }}>
            {note.title || 'Untitled'}
          </span>
          {note.content && (
            <p className="text-[11px] mt-0.5 line-clamp-2 leading-relaxed" style={{ color: `${c.header}aa` }}>
              {note.content}
            </p>
          )}
        </div>

        {/* Hover actions */}
        <div
          className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
          onClick={e => e.stopPropagation()}
        >
          <button onClick={onPin} className="w-6 h-6 flex items-center justify-center rounded hover:bg-white/50" title={note.pinned ? 'Unpin' : 'Pin'}>
            <Pin size={11} style={{ color: c.header }} />
          </button>
          <button onClick={onArchive} className="w-6 h-6 flex items-center justify-center rounded hover:bg-white/50" title="Archive">
            <Archive size={11} style={{ color: c.header }} />
          </button>
          <button onClick={onDelete} className="w-6 h-6 flex items-center justify-center rounded hover:bg-red-100" title="Delete">
            <Trash2 size={11} className="text-red-400" />
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── InlineNoteForm ─────────────────────────────────────── */
function InlineNoteForm({
  onSave,
  onCancel,
}: {
  onSave: (title: string, content: string, color: NoteColor) => void
  onCancel: () => void
}) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [color, setColor] = useState<NoteColor>('yellow')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  const c = COLORS[color]

  return (
    <div className="border-t border-slate-200 dark:border-slate-700 p-3 space-y-2" style={{ background: c.bg }}>
      <input
        ref={inputRef}
        value={title}
        onChange={e => setTitle(e.target.value)}
        placeholder="Title..."
        className="w-full bg-transparent text-sm font-semibold placeholder:opacity-40 focus:outline-none"
        style={{ color: c.header }}
      />
      <textarea
        value={content}
        onChange={e => setContent(e.target.value)}
        placeholder="Write something..."
        rows={3}
        className="w-full bg-white/30 rounded-lg p-2 text-xs placeholder:opacity-40 focus:outline-none resize-none"
        style={{ color: c.header }}
      />
      <div className="flex items-center justify-between">
        <div className="flex gap-1.5">
          {COLOR_KEYS.map(ck => (
            <button
              key={ck}
              onClick={() => setColor(ck)}
              className={`w-5 h-5 rounded-full border transition-all ${color === ck ? 'scale-110 border-2' : 'hover:scale-105'}`}
              style={{ background: COLORS[ck].bg, borderColor: color === ck ? COLORS[ck].border : 'transparent' }}
            />
          ))}
        </div>
        <div className="flex gap-1.5">
          <button onClick={onCancel} className="px-2.5 py-1 text-xs rounded-lg hover:bg-white/40" style={{ color: c.header }}>
            Cancel
          </button>
          <button
            onClick={() => { if (title.trim() || content.trim()) onSave(title.trim(), content.trim(), color) }}
            className="px-3 py-1 text-xs font-bold text-white rounded-lg shadow-sm"
            style={{ background: c.header }}
          >
            Add
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── EditOverlay ────────────────────────────────────────── */
function EditOverlay({
  note,
  onSave,
  onClose,
}: {
  note: StickyNoteType
  onSave: (title: string, content: string, color: NoteColor) => void
  onClose: () => void
}) {
  const [title, setTitle] = useState(note.title)
  const [content, setContent] = useState(note.content)
  const [color, setColor] = useState<NoteColor>(note.color)

  const c = COLORS[color]

  return (
    <div className="absolute inset-0 z-10 flex flex-col rounded-2xl overflow-hidden" style={{ background: c.bg }}>
      <div className="flex items-center justify-between px-4 py-3" style={{ background: `${c.border}30` }}>
        <span className="text-sm font-bold" style={{ color: c.header }}>Edit Note</span>
        <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/40">
          <X size={16} style={{ color: c.header }} />
        </button>
      </div>
      <div className="flex-1 p-4 space-y-3 overflow-y-auto">
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Title..."
          className="w-full bg-transparent text-base font-semibold placeholder:opacity-40 focus:outline-none"
          style={{ color: c.header }}
        />
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="Write something..."
          rows={6}
          className="w-full bg-white/30 rounded-xl p-3 text-sm placeholder:opacity-40 focus:outline-none resize-none"
          style={{ color: c.header }}
        />
        <div className="flex gap-2">
          {COLOR_KEYS.map(ck => (
            <button
              key={ck}
              onClick={() => setColor(ck)}
              className={`w-6 h-6 rounded-full border-2 transition-all ${color === ck ? 'scale-110 shadow-md' : 'hover:scale-105'}`}
              style={{ background: COLORS[ck].bg, borderColor: color === ck ? COLORS[ck].border : 'transparent' }}
            />
          ))}
        </div>
      </div>
      <div className="flex justify-end gap-2 px-4 py-3 border-t" style={{ borderColor: `${c.border}30` }}>
        <button onClick={onClose} className="px-3 py-1.5 text-xs rounded-lg hover:bg-white/40" style={{ color: c.header }}>
          Cancel
        </button>
        <button
          onClick={() => { onSave(title.trim(), content.trim(), color); onClose() }}
          className="px-4 py-1.5 text-xs font-bold text-white rounded-lg shadow-sm"
          style={{ background: c.header }}
        >
          Save
        </button>
      </div>
    </div>
  )
}
