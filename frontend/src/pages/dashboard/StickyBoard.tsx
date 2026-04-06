import { useState, useEffect, useRef, useCallback } from 'react'
import { Plus, Pin, Archive, Trash2, X, Filter, StickyNote as StickyNoteIcon, GripVertical } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import type { StickyNote, NoteColor, NoteModule } from '../../types/sticky-board'
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

const MODULE_KEYS = Object.keys(MODULE_LABELS) as NoteModule[]
const COLOR_KEYS = Object.keys(COLORS) as NoteColor[]

/* ── Main component ────────────────────────────────────────── */
export default function StickyBoard() {
  const [notes, setNotes] = useState<StickyNote[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [filterModule, setFilterModule] = useState<NoteModule | 'all'>('all')
  const [showArchived, setShowArchived] = useState(false)
  const [editingNote, setEditingNote] = useState<StickyNote | null>(null)
  const [showNewNote, setShowNewNote] = useState(false)

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
        // table may not exist yet — start with empty
        setNotes([])
      }
      setLoading(false)
    })()
  }, [])

  /* ── CRUD helpers ──────────────────────────────────────── */
  const handleCreate = async (title: string, content: string, color: NoteColor, module: NoteModule) => {
    if (!userId) return
    try {
      const note = await svc.createNote({
        user_id: userId,
        title,
        content,
        color,
        module,
        pinned: false,
        archived: false,
        position_x: 0,
        position_y: 0,
      })
      setNotes(prev => [note, ...prev])
    } catch {
      // Fallback: local-only note when table doesn't exist yet
      const localNote: StickyNote = {
        id: crypto.randomUUID(),
        user_id: userId,
        title,
        content,
        color,
        module,
        pinned: false,
        archived: false,
        position_x: 0,
        position_y: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      setNotes(prev => [localNote, ...prev])
    }
    setShowNewNote(false)
  }

  const handleUpdate = async (id: string, updates: Partial<StickyNote>) => {
    try {
      const updated = await svc.updateNote(id, updates)
      setNotes(prev => prev.map(n => (n.id === id ? updated : n)))
    } catch {
      setNotes(prev => prev.map(n => (n.id === id ? { ...n, ...updates, updated_at: new Date().toISOString() } : n)))
    }
    if (editingNote?.id === id) setEditingNote(null)
  }

  const handleDelete = async (id: string) => {
    try { await svc.deleteNote(id) } catch { /* local fallback */ }
    setNotes(prev => prev.filter(n => n.id !== id))
    if (editingNote?.id === id) setEditingNote(null)
  }

  const togglePin = (note: StickyNote) => handleUpdate(note.id, { pinned: !note.pinned })
  const toggleArchive = (note: StickyNote) => handleUpdate(note.id, { archived: !note.archived })

  /* ── Filtered notes ────────────────────────────────────── */
  const filtered = notes.filter(n => {
    if (n.archived !== showArchived) return false
    if (filterModule !== 'all' && n.module !== filterModule) return false
    return true
  })

  const pinned = filtered.filter(n => n.pinned)
  const unpinned = filtered.filter(n => !n.pinned)

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* ── Header ─────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
              <span className="flex items-center justify-center w-10 h-10 rounded-xl" style={{ background: '#FFF9C4', color: '#F57F17' }}>
                <StickyNoteIcon size={22} />
              </span>
              StickyBoard
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Quick notes for your career journey</p>
          </div>

          <button
            onClick={() => setShowNewNote(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-white shadow-md hover:shadow-lg transition-all"
            style={{ background: '#1976D2' }}
          >
            <Plus size={18} />
            New Note
          </button>
        </div>

        {/* ── Filters ────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <Filter size={16} className="text-slate-400" />
          {(['all', ...MODULE_KEYS] as const).map(mod => (
            <button
              key={mod}
              onClick={() => setFilterModule(mod)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filterModule === mod
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-slate-400'
              }`}
            >
              {mod === 'all' ? 'All' : MODULE_LABELS[mod]}
            </button>
          ))}

          <div className="ml-auto">
            <button
              onClick={() => setShowArchived(!showArchived)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                showArchived
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
              }`}
            >
              <Archive size={13} className="inline mr-1 -mt-0.5" />
              {showArchived ? 'Viewing Archived' : 'Archive'}
            </button>
          </div>
        </div>

        {/* ── Notes grid ─────────────────────────────────── */}
        {filtered.length === 0 ? (
          <EmptyState showArchived={showArchived} onNew={() => setShowNewNote(true)} />
        ) : (
          <div className="space-y-6">
            {pinned.length > 0 && (
              <>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <Pin size={12} /> Pinned
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {pinned.map(n => (
                    <NoteCard key={n.id} note={n} onEdit={setEditingNote} onPin={togglePin} onArchive={toggleArchive} onDelete={handleDelete} />
                  ))}
                </div>
              </>
            )}
            {unpinned.length > 0 && (
              <>
                {pinned.length > 0 && (
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mt-4">Notes</p>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {unpinned.map(n => (
                    <NoteCard key={n.id} note={n} onEdit={setEditingNote} onPin={togglePin} onArchive={toggleArchive} onDelete={handleDelete} />
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* ── Modals ───────────────────────────────────────── */}
      {showNewNote && (
        <NoteModal onSave={handleCreate} onClose={() => setShowNewNote(false)} />
      )}
      {editingNote && (
        <NoteModal
          initial={editingNote}
          onSave={(t, c, col, mod) => handleUpdate(editingNote.id, { title: t, content: c, color: col, module: mod })}
          onClose={() => setEditingNote(null)}
        />
      )}
    </div>
  )
}

/* ── NoteCard ────────────────────────────────────────────── */
function NoteCard({
  note,
  onEdit,
  onPin,
  onArchive,
  onDelete,
}: {
  note: StickyNote
  onEdit: (n: StickyNote) => void
  onPin: (n: StickyNote) => void
  onArchive: (n: StickyNote) => void
  onDelete: (id: string) => void
}) {
  const c = COLORS[note.color] || COLORS.yellow

  return (
    <div
      onClick={() => onEdit(note)}
      className="group relative rounded-2xl p-5 cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
      style={{ background: c.bg, borderLeft: `4px solid ${c.border}` }}
    >
      {/* Pin indicator */}
      {note.pinned && (
        <Pin size={14} className="absolute top-3 right-3 -rotate-45" style={{ color: c.header }} />
      )}

      {/* Module tag */}
      {note.module !== 'global' && (
        <span
          className="inline-block px-2 py-0.5 rounded-md text-[10px] font-semibold mb-2 uppercase tracking-wide"
          style={{ background: `${c.border}25`, color: c.header }}
        >
          {MODULE_LABELS[note.module]}
        </span>
      )}

      <h3 className="font-bold text-sm leading-snug mb-1 line-clamp-2" style={{ color: c.header }}>
        {note.title || 'Untitled'}
      </h3>
      <p className="text-xs leading-relaxed line-clamp-4 whitespace-pre-wrap" style={{ color: `${c.header}cc` }}>
        {note.content}
      </p>

      {/* Actions (show on hover) */}
      <div
        className="absolute bottom-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={e => e.stopPropagation()}
      >
        <ActionBtn icon={<Pin size={13} />} title={note.pinned ? 'Unpin' : 'Pin'} onClick={() => onPin(note)} />
        <ActionBtn icon={<Archive size={13} />} title={note.archived ? 'Unarchive' : 'Archive'} onClick={() => onArchive(note)} />
        <ActionBtn icon={<Trash2 size={13} />} title="Delete" onClick={() => onDelete(note.id)} danger />
      </div>

      <p className="text-[10px] mt-3 opacity-50" style={{ color: c.header }}>
        {new Date(note.updated_at).toLocaleDateString()}
      </p>
    </div>
  )
}

function ActionBtn({ icon, title, onClick, danger }: { icon: React.ReactNode; title: string; onClick: () => void; danger?: boolean }) {
  return (
    <button
      title={title}
      onClick={onClick}
      className={`w-7 h-7 flex items-center justify-center rounded-lg transition-colors ${
        danger
          ? 'hover:bg-red-100 text-red-400 hover:text-red-600'
          : 'hover:bg-white/60 text-slate-500 hover:text-slate-700'
      }`}
    >
      {icon}
    </button>
  )
}

/* ── NoteModal ───────────────────────────────────────────── */
function NoteModal({
  initial,
  onSave,
  onClose,
}: {
  initial?: StickyNote
  onSave: (title: string, content: string, color: NoteColor, module: NoteModule) => void
  onClose: () => void
}) {
  const [title, setTitle] = useState(initial?.title ?? '')
  const [content, setContent] = useState(initial?.content ?? '')
  const [color, setColor] = useState<NoteColor>(initial?.color ?? 'yellow')
  const [module, setModule] = useState<NoteModule>(initial?.module ?? 'global')
  const titleRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    titleRef.current?.focus()
  }, [])

  const handleSubmit = () => {
    if (!title.trim() && !content.trim()) return
    onSave(title.trim(), content.trim(), color, module)
  }

  const c = COLORS[color]

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden"
        style={{ background: c.bg }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header bar */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3">
          <h2 className="text-lg font-bold" style={{ color: c.header }}>
            {initial ? 'Edit Note' : 'New Note'}
          </h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/40 transition-colors">
            <X size={18} style={{ color: c.header }} />
          </button>
        </div>

        <div className="px-6 pb-6 space-y-4">
          {/* Title */}
          <input
            ref={titleRef}
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Note title..."
            className="w-full bg-transparent text-lg font-semibold placeholder:opacity-40 focus:outline-none"
            style={{ color: c.header }}
          />

          {/* Content */}
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Write something..."
            rows={5}
            className="w-full bg-white/30 rounded-xl p-3 text-sm placeholder:opacity-40 focus:outline-none resize-none"
            style={{ color: c.header }}
          />

          {/* Color picker */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide mb-2 opacity-60" style={{ color: c.header }}>Color</p>
            <div className="flex gap-2">
              {COLOR_KEYS.map(ck => (
                <button
                  key={ck}
                  onClick={() => setColor(ck)}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${color === ck ? 'scale-110 shadow-md' : 'hover:scale-105'}`}
                  style={{
                    background: COLORS[ck].bg,
                    borderColor: color === ck ? COLORS[ck].border : 'transparent',
                  }}
                  title={ck}
                />
              ))}
            </div>
          </div>

          {/* Module selector */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide mb-2 opacity-60" style={{ color: c.header }}>Module</p>
            <select
              value={module}
              onChange={e => setModule(e.target.value as NoteModule)}
              className="w-full bg-white/40 rounded-xl px-3 py-2 text-sm font-medium focus:outline-none cursor-pointer"
              style={{ color: c.header }}
            >
              {MODULE_KEYS.map(m => (
                <option key={m} value={m}>{MODULE_LABELS[m]}</option>
              ))}
            </select>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-semibold hover:bg-white/40 transition-colors"
              style={{ color: c.header }}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="px-5 py-2 rounded-xl text-sm font-bold text-white shadow-md hover:shadow-lg transition-all"
              style={{ background: c.header }}
            >
              {initial ? 'Save' : 'Create Note'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── EmptyState ──────────────────────────────────────────── */
function EmptyState({ showArchived, onNew }: { showArchived: boolean; onNew: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: '#FFF9C4' }}>
        <StickyNoteIcon size={28} style={{ color: '#F57F17' }} />
      </div>
      <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-1">
        {showArchived ? 'No archived notes' : 'Your board is empty'}
      </h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-xs">
        {showArchived
          ? 'Archived notes will appear here.'
          : 'Create your first sticky note to capture ideas, reminders, or action items.'}
      </p>
      {!showArchived && (
        <button
          onClick={onNew}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-white shadow-md hover:shadow-lg transition-all"
          style={{ background: '#1976D2' }}
        >
          <Plus size={18} />
          New Note
        </button>
      )}
    </div>
  )
}
