import { useState, useEffect, useRef, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import { StickyNote as StickyNoteIcon, Plus, Pin, Archive, Trash2, X, GripHorizontal } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import type { StickyNote, NoteColor, NoteModule } from '../../types/sticky-board'
import * as svc from '../../services/sticky-board.service'

/* ── Colors (realistic paper palette) ─────────────────────── */
const COLORS: Record<NoteColor, {
  bg: string; header: string; border: string; text: string
  stack1: string; stack2: string; stack3: string; shadow: string
}> = {
  yellow: { bg: '#FFF9C4', header: '#FFF176', border: '#F9A825', text: '#F57F17', stack1: '#FFEE58', stack2: '#FFD54F', stack3: '#F9A825', shadow: 'rgba(180,130,20,0.35)' },
  blue:   { bg: '#E3F2FD', header: '#BBDEFB', border: '#42A5F5', text: '#1565C0', stack1: '#90CAF9', stack2: '#64B5F6', stack3: '#42A5F5', shadow: 'rgba(30,100,180,0.30)' },
  green:  { bg: '#E8F5E9', header: '#C8E6C9', border: '#66BB6A', text: '#2E7D32', stack1: '#A5D6A7', stack2: '#81C784', stack3: '#66BB6A', shadow: 'rgba(40,120,50,0.30)' },
  pink:   { bg: '#FCE4EC', header: '#F8BBD0', border: '#EC407A', text: '#AD1457', stack1: '#F48FB1', stack2: '#F06292', stack3: '#EC407A', shadow: 'rgba(180,30,80,0.30)' },
  purple: { bg: '#F3E5F5', header: '#E1BEE7', border: '#AB47BC', text: '#6A1B9A', stack1: '#CE93D8', stack2: '#BA68C8', stack3: '#AB47BC', shadow: 'rgba(100,30,150,0.30)' },
  orange: { bg: '#FFF3E0', header: '#FFE0B2', border: '#FFA726', text: '#E65100', stack1: '#FFCC80', stack2: '#FFB74D', stack3: '#FFA726', shadow: 'rgba(200,100,0,0.30)' },
}
const COLOR_KEYS = Object.keys(COLORS) as NoteColor[]

/* Paper texture as inline SVG data URI (subtle noise) */
const PAPER_TEXTURE = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E")`

/* ── Module detection ──────────────────────────────────────── */
function useCurrentModule(): NoteModule {
  const { pathname } = useLocation()
  if (pathname.includes('/resume')) return 'resume-builder'
  if (pathname.includes('/job-search')) return 'job-search'
  if (pathname.includes('/interview')) return 'interview-mastery'
  if (pathname.includes('/career-vision')) return 'career-vision'
  return 'global'
}

/* ── Admin-only access ─────────────────────────────────────── */
const ADMIN_EMAILS = [
  'awoodw@gmail.com',
  'efrain.pradas@gmail.com',
  'isacriperez@gmail.com',
]


/* ════════════════════════════════════════════════════════════
   Main Widget (admin-only, shared notes between admins)
   ════════════════════════════════════════════════════════════ */
export default function StickyBoardWidget() {
  const [notes, setNotes] = useState<StickyNote[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const currentModule = useCurrentModule()

  useEffect(() => {
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      // Only allow admin emails
      if (!ADMIN_EMAILS.includes(user.email?.toLowerCase() || '')) return
      setIsAdmin(true)
      setUserId(user.id)
      // Load all sticky notes visible to this admin (RLS allows admins to see each other's notes)
      try {
        const { data, error } = await supabase
          .from('sticky_notes')
          .select('*')
          .order('pinned', { ascending: false })
          .order('updated_at', { ascending: false })
        if (error) throw error
        setNotes(data || [])
      } catch { setNotes([]) }
    })()
  }, [])

  // Counter to stagger new notes so they don't overlap
  const noteCounter = useRef(0)

  const visible = isAdmin ? notes.filter(n => !n.archived && n.module === currentModule) : []

  const handleCreate = async (title: string, content: string, color: NoteColor) => {
    if (!userId) return
    // Stagger each new note by 240px horizontally, wrap after 3
    const col = noteCounter.current % 3
    const row = Math.floor(noteCounter.current / 3)
    noteCounter.current++
    const x = 200 + col * 250
    const y = 150 + row * 180
    try {
      const note = await svc.createNote({
        user_id: userId, title, content, color, module: currentModule,
        pinned: false, archived: false, position_x: x, position_y: y,
      })
      setNotes(prev => [note, ...prev])
    } catch {
      setNotes(prev => [{
        id: crypto.randomUUID(), user_id: userId, title, content, color,
        module: currentModule, pinned: false, archived: false,
        position_x: x, position_y: y,
        created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
      }, ...prev])
    }
    setShowNew(false)
  }

  const handleUpdate = async (id: string, updates: Partial<StickyNote>) => {
    // Optimistic update
    setNotes(prev => prev.map(n => (n.id === id ? { ...n, ...updates, updated_at: new Date().toISOString() } : n)))
    try { await svc.updateNote(id, updates) } catch { /* keep local */ }
    if (editingId === id && !('position_x' in updates)) setEditingId(null)
  }

  const handleDelete = async (id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id))
    setEditingId(null)
    try { await svc.deleteNote(id) } catch { /* already removed locally */ }
  }

  return (
    <>
      {!isAdmin ? null : <>
      {/* ── Free-floating notes on workspace ───────────── */}
      {visible.map((note, idx) => (
        <DraggableNote
          key={note.id}
          note={note}
          index={idx}
          onEdit={() => setEditingId(note.id)}
          onPin={() => handleUpdate(note.id, { pinned: !note.pinned })}
          onArchive={() => handleUpdate(note.id, { archived: true })}
          onDelete={() => handleDelete(note.id)}
          onMove={(x, y) => setNotes(prev => prev.map(n => n.id === note.id ? { ...n, position_x: x, position_y: y } : n))}
        />
      ))}

      {/* ── Floating "+" button ────────────────────────── */}
      <button
        onClick={() => setShowNew(true)}
        className="fixed bottom-6 right-24 z-40 w-14 h-14 rounded-2xl shadow-2xl hover:scale-110 transition-all duration-200 flex items-center justify-center group"
        style={{
          background: 'linear-gradient(135deg, #FFF9C4, #FFD54F)',
          boxShadow: '0 6px 24px rgba(180,130,20,0.35), 0 2px 8px rgba(0,0,0,0.08)',
        }}
        title="New Sticky Note"
      >
        <StickyNoteIcon className="w-6 h-6 group-hover:hidden" style={{ color: '#F57F17' }} />
        <Plus className="w-6 h-6 hidden group-hover:block" style={{ color: '#F57F17' }} />
      </button>

      {/* ── New note modal ─────────────────────────────── */}
      {showNew && (
        <NewNoteModal onSave={handleCreate} onClose={() => setShowNew(false)} />
      )}

      {/* ── Edit modal ─────────────────────────────────── */}
      {editingId && (() => {
        const note = notes.find(n => n.id === editingId)
        if (!note) return null
        return (
          <EditNoteModal
            note={note}
            onSave={(t, c, col) => handleUpdate(note.id, { title: t, content: c, color: col })}
            onClose={() => setEditingId(null)}
          />
        )
      })()}
      </>}
    </>
  )
}

/* ════════════════════════════════════════════════════════════
   DraggableNote — free-floating sticky on the page
   ════════════════════════════════════════════════════════════ */
function DraggableNote({
  note,
  index,
  onEdit,
  onPin,
  onArchive,
  onDelete,
  onMove,
}: {
  note: StickyNote
  index: number
  onEdit: () => void
  onPin: () => void
  onArchive: () => void
  onDelete: () => void
  onMove: (x: number, y: number) => void
}) {
  const c = COLORS[note.color] || COLORS.yellow
  const elRef = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)
  const dragOffset = useRef({ x: 0, y: 0 })

  // Compute initial position: use saved, or stagger by index
  const [pos, setPos] = useState(() => {
    const sx = Number(note.position_x)
    const sy = Number(note.position_y)
    if (Number.isFinite(sx) && Number.isFinite(sy) && (sx !== 0 || sy !== 0)) {
      return { x: sx, y: sy }
    }
    const col = index % 3
    const row = Math.floor(index / 3)
    return { x: 200 + col * 250, y: 150 + row * 180 }
  })

  // Save position to Supabase AND sync parent state so remount preserves it
  const savePosition = useCallback((x: number, y: number) => {
    onMove(x, y)
    svc.updateNote(note.id, { position_x: x, position_y: y })
      .catch(err => console.warn('[StickyNote] position save failed:', err))
  }, [note.id, onMove])

  // If note had (0,0), persist the random default on mount
  useEffect(() => {
    if (note.position_x === 0 && note.position_y === 0) {
      savePosition(pos.x, pos.y)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Use document-level mousemove/mouseup to avoid pointer capture issues
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragging.current) return
      const x = Math.max(0, Math.min(window.innerWidth - 220, e.clientX - dragOffset.current.x))
      const y = Math.max(0, Math.min(window.innerHeight - 60, e.clientY - dragOffset.current.y))
      setPos({ x, y })
    }

    const handleMouseUp = () => {
      if (!dragging.current) return
      dragging.current = false
      setPos(current => {
        savePosition(current.x, current.y)
        return current
      })
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [savePosition])

  const onMouseDown = (e: React.MouseEvent) => {
    if (!(e.target as HTMLElement).closest('[data-grip]')) return
    e.preventDefault()
    dragging.current = true
    const rect = elRef.current!.getBoundingClientRect()
    dragOffset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  return (
    <div
      ref={elRef}
      onMouseDown={onMouseDown}
      className="fixed z-30 group select-none"
      style={{
        left: pos.x,
        top: pos.y,
        width: 240,
      }}
    >
      {/* ── Stacked paper layers (3D pad effect) ──────── */}
      <div className="absolute rounded-2xl" style={{
        inset: 0,
        top: 6,
        left: 3,
        right: -3,
        background: c.stack3,
        borderRadius: 16,
        transform: 'rotate(0.5deg)',
      }} />
      <div className="absolute rounded-2xl" style={{
        inset: 0,
        top: 4,
        left: 2,
        right: -2,
        background: c.stack2,
        borderRadius: 16,
        transform: 'rotate(0.3deg)',
      }} />
      <div className="absolute rounded-2xl" style={{
        inset: 0,
        top: 2,
        left: 1,
        right: -1,
        background: c.stack1,
        borderRadius: 16,
      }} />

      {/* ── Main note card ────────────────────────────── */}
      <div
        className="relative rounded-2xl overflow-hidden"
        style={{
          background: c.bg,
          backgroundImage: PAPER_TEXTURE,
          boxShadow: `
            0 8px 32px ${c.shadow},
            0 2px 8px rgba(0,0,0,0.08),
            inset 0 1px 0 rgba(255,255,255,0.5)
          `,
        }}
      >
        {/* Header / drag handle bar */}
        <div
          className="flex items-center justify-between px-3 py-2"
          style={{
            background: c.header,
            backgroundImage: PAPER_TEXTURE,
            borderBottom: `1px solid ${c.border}20`,
          }}
        >
          <div data-grip className="cursor-grab active:cursor-grabbing flex items-center gap-1.5 flex-1">
            <GripHorizontal size={16} style={{ color: `${c.border}90` }} />
            {note.pinned && <Pin size={12} className="-rotate-45" style={{ color: c.text }} />}
          </div>
          <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={onPin} className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-white/40" title={note.pinned ? 'Unpin' : 'Pin'}>
              <Pin size={12} style={{ color: c.border }} />
            </button>
            <button onClick={onArchive} className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-white/40" title="Archive">
              <Archive size={12} style={{ color: c.border }} />
            </button>
            <button onClick={onDelete} className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-red-100/60" title="Delete">
              <Trash2 size={12} className="text-red-400" />
            </button>
          </div>
        </div>

        {/* Note body — click to edit */}
        <div className="px-4 py-3 cursor-pointer" onClick={onEdit}>
          <h4 className="text-sm font-bold leading-snug mb-1 line-clamp-2" style={{ color: '#1e293b' }}>
            {note.title || 'Untitled'}
          </h4>
          {note.content && (
            <p className="text-xs leading-relaxed line-clamp-5 whitespace-pre-wrap" style={{ color: '#334155' }}>
              {note.content}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════
   NewNoteModal
   ════════════════════════════════════════════════════════════ */
function NewNoteModal({
  onSave,
  onClose,
}: {
  onSave: (title: string, content: string, color: NoteColor) => void
  onClose: () => void
}) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [color, setColor] = useState<NoteColor>('yellow')
  const inputRef = useRef<HTMLInputElement>(null)
  useEffect(() => { inputRef.current?.focus() }, [])

  const c = COLORS[color]

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden"
        style={{ background: c.bg }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          <h2 className="text-base font-bold" style={{ color: '#1e293b' }}>New Sticky Note</h2>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/40">
            <X size={16} style={{ color: '#1e293b' }} />
          </button>
        </div>
        <div className="px-5 pb-5 space-y-3">
          <input
            ref={inputRef}
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Title..."
            className="w-full bg-transparent text-sm font-semibold placeholder:opacity-40 focus:outline-none"
            style={{ color: '#1e293b' }}
          />
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Write something..."
            rows={4}
            className="w-full bg-white/30 rounded-xl p-3 text-xs placeholder:opacity-40 focus:outline-none resize-none"
            style={{ color: '#1e293b' }}
          />
          <div className="flex gap-2">
            {COLOR_KEYS.map(ck => (
              <button
                key={ck}
                onClick={() => setColor(ck)}
                className={`w-7 h-7 rounded-full border-2 transition-all ${color === ck ? 'scale-110 shadow-md' : 'hover:scale-105'}`}
                style={{ background: COLORS[ck].bg, borderColor: color === ck ? COLORS[ck].border : 'transparent' }}
              />
            ))}
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button onClick={onClose} className="px-3 py-1.5 text-xs rounded-lg hover:bg-white/40" style={{ color: '#1e293b' }}>
              Cancel
            </button>
            <button
              onClick={() => { if (title.trim() || content.trim()) onSave(title.trim(), content.trim(), color) }}
              className="px-4 py-1.5 text-xs font-bold text-white rounded-lg shadow-sm"
              style={{ background: c.text }}
            >
              Stick it!
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════
   EditNoteModal
   ════════════════════════════════════════════════════════════ */
function EditNoteModal({
  note,
  onSave,
  onClose,
}: {
  note: StickyNote
  onSave: (title: string, content: string, color: NoteColor) => void
  onClose: () => void
}) {
  const [title, setTitle] = useState(note.title)
  const [content, setContent] = useState(note.content)
  const [color, setColor] = useState<NoteColor>(note.color)
  const c = COLORS[color]

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden"
        style={{ background: c.bg }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          <h2 className="text-base font-bold" style={{ color: '#1e293b' }}>Edit Note</h2>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/40">
            <X size={16} style={{ color: '#1e293b' }} />
          </button>
        </div>
        <div className="px-5 pb-5 space-y-3">
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Title..."
            className="w-full bg-transparent text-sm font-semibold placeholder:opacity-40 focus:outline-none"
            style={{ color: '#1e293b' }}
          />
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Write something..."
            rows={5}
            className="w-full bg-white/30 rounded-xl p-3 text-xs placeholder:opacity-40 focus:outline-none resize-none"
            style={{ color: '#1e293b' }}
          />
          <div className="flex gap-2">
            {COLOR_KEYS.map(ck => (
              <button
                key={ck}
                onClick={() => setColor(ck)}
                className={`w-7 h-7 rounded-full border-2 transition-all ${color === ck ? 'scale-110 shadow-md' : 'hover:scale-105'}`}
                style={{ background: COLORS[ck].bg, borderColor: color === ck ? COLORS[ck].border : 'transparent' }}
              />
            ))}
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button onClick={onClose} className="px-3 py-1.5 text-xs rounded-lg hover:bg-white/40" style={{ color: '#1e293b' }}>
              Cancel
            </button>
            <button
              onClick={() => { onSave(title.trim(), content.trim(), color); onClose() }}
              className="px-4 py-1.5 text-xs font-bold text-white rounded-lg shadow-sm"
              style={{ background: c.text }}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
