import { useState, useEffect, useRef, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import { StickyNote as StickyNoteIcon, Plus, Pin, Archive, Trash2, X, GripHorizontal } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import type { StickyNote, NoteColor, NoteModule } from '../../types/sticky-board'
import * as svc from '../../services/sticky-board.service'

/* ── Colors ────────────────────────────────────────────────── */
const COLORS: Record<NoteColor, { bg: string; border: string; text: string; shadow: string }> = {
  yellow: { bg: '#FFF9C4', border: '#F9A825', text: '#F57F17', shadow: 'rgba(249,168,37,0.25)' },
  blue:   { bg: '#E3F2FD', border: '#42A5F5', text: '#1565C0', shadow: 'rgba(66,165,245,0.25)' },
  green:  { bg: '#E8F5E9', border: '#66BB6A', text: '#2E7D32', shadow: 'rgba(102,187,106,0.25)' },
  pink:   { bg: '#FCE4EC', border: '#EC407A', text: '#AD1457', shadow: 'rgba(236,64,122,0.25)' },
  purple: { bg: '#F3E5F5', border: '#AB47BC', text: '#6A1B9A', shadow: 'rgba(171,71,188,0.25)' },
  orange: { bg: '#FFF3E0', border: '#FFA726', text: '#E65100', shadow: 'rgba(255,167,38,0.25)' },
}
const COLOR_KEYS = Object.keys(COLORS) as NoteColor[]

/* ── Module detection ──────────────────────────────────────── */
function useCurrentModule(): NoteModule {
  const { pathname } = useLocation()
  if (pathname.includes('/resume')) return 'resume-builder'
  if (pathname.includes('/job-search')) return 'job-search'
  if (pathname.includes('/interview')) return 'interview-mastery'
  if (pathname.includes('/career-vision')) return 'career-vision'
  return 'global'
}

/* ════════════════════════════════════════════════════════════
   Main Widget
   ════════════════════════════════════════════════════════════ */
export default function StickyBoardWidget() {
  const [notes, setNotes] = useState<StickyNote[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [showNew, setShowNew] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const currentModule = useCurrentModule()

  useEffect(() => {
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)
      try { setNotes(await svc.getNotes(user.id)) } catch { setNotes([]) }
    })()
  }, [])

  const visible = notes.filter(n => !n.archived && (n.module === currentModule || n.module === 'global'))

  const handleCreate = async (title: string, content: string, color: NoteColor) => {
    if (!userId) return
    // Place new note near center with slight random offset
    const x = Math.round(window.innerWidth / 2 - 110 + (Math.random() - 0.5) * 100)
    const y = Math.round(window.innerHeight / 2 - 80 + (Math.random() - 0.5) * 100)
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
      {/* ── Free-floating notes on workspace ───────────── */}
      {visible.map(note => (
        <DraggableNote
          key={note.id}
          note={note}
          onMove={(x, y) => handleUpdate(note.id, { position_x: x, position_y: y })}
          onEdit={() => setEditingId(note.id)}
          onPin={() => handleUpdate(note.id, { pinned: !note.pinned })}
          onArchive={() => handleUpdate(note.id, { archived: true })}
          onDelete={() => handleDelete(note.id)}
        />
      ))}

      {/* ── Floating "+" button ────────────────────────── */}
      <button
        onClick={() => setShowNew(true)}
        className="fixed bottom-6 right-24 z-40 w-14 h-14 rounded-full shadow-2xl hover:scale-110 transition-all duration-200 flex items-center justify-center group"
        style={{ background: 'linear-gradient(135deg, #FFF9C4, #FFD54F)', border: '2px solid #F9A825' }}
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
    </>
  )
}

/* ════════════════════════════════════════════════════════════
   DraggableNote — free-floating sticky on the page
   ════════════════════════════════════════════════════════════ */
function DraggableNote({
  note,
  onMove,
  onEdit,
  onPin,
  onArchive,
  onDelete,
}: {
  note: StickyNote
  onMove: (x: number, y: number) => void
  onEdit: () => void
  onPin: () => void
  onArchive: () => void
  onDelete: () => void
}) {
  const c = COLORS[note.color] || COLORS.yellow
  const ref = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)
  const offset = useRef({ x: 0, y: 0 })
  const posRef = useRef({ x: note.position_x, y: note.position_y })
  const [pos, setPos] = useState({ x: note.position_x, y: note.position_y })

  // Sync if note position changes externally
  useEffect(() => {
    if (!dragging.current) {
      posRef.current = { x: note.position_x, y: note.position_y }
      setPos({ x: note.position_x, y: note.position_y })
    }
  }, [note.position_x, note.position_y])

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (!(e.target as HTMLElement).closest('[data-grip]')) return
    e.preventDefault()
    dragging.current = true
    const rect = ref.current!.getBoundingClientRect()
    offset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top }
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }, [])

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging.current) return
    const newX = Math.max(0, Math.min(window.innerWidth - 220, e.clientX - offset.current.x))
    const newY = Math.max(0, Math.min(window.innerHeight - 60, e.clientY - offset.current.y))
    posRef.current = { x: newX, y: newY }
    setPos({ x: newX, y: newY })
  }, [])

  const onPointerUp = useCallback(() => {
    if (!dragging.current) return
    dragging.current = false
    // Save final position from ref (avoids stale closure)
    const { x, y } = posRef.current
    onMove(x, y)
  }, [onMove])

  // On first mount, if position is (0,0), assign a default and persist it
  const initialized = useRef(false)
  useEffect(() => {
    if (initialized.current) return
    initialized.current = true
    if (note.position_x === 0 && note.position_y === 0) {
      const defX = Math.round(window.innerWidth / 2 - 110 + (Math.random() - 0.5) * 200)
      const defY = Math.round(window.innerHeight / 3 + (Math.random() - 0.5) * 100)
      posRef.current = { x: defX, y: defY }
      setPos({ x: defX, y: defY })
      onMove(defX, defY)
    }
  }, [])

  const displayX = pos.x
  const displayY = pos.y

  return (
    <div
      ref={ref}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      className="fixed z-30 group select-none"
      style={{
        left: displayX,
        top: displayY,
        width: 220,
        touchAction: 'none',
      }}
    >
      <div
        className="rounded-xl overflow-hidden transition-shadow duration-200"
        style={{
          background: c.bg,
          boxShadow: `0 2px 12px ${c.shadow}, 0 1px 3px rgba(0,0,0,0.08)`,
          border: `1px solid ${c.border}40`,
        }}
      >
        {/* Drag handle + actions bar */}
        <div
          className="flex items-center justify-between px-2.5 py-1.5"
          style={{ background: `${c.border}18` }}
        >
          <div data-grip className="cursor-grab active:cursor-grabbing flex items-center gap-1 flex-1">
            <GripHorizontal size={14} style={{ color: `${c.border}90` }} />
            {note.pinned && <Pin size={10} className="-rotate-45" style={{ color: '#1e293b' }} />}
          </div>
          <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={onPin} className="w-6 h-6 flex items-center justify-center rounded hover:bg-white/50" title={note.pinned ? 'Unpin' : 'Pin'}>
              <Pin size={11} style={{ color: c.border }} />
            </button>
            <button onClick={onArchive} className="w-6 h-6 flex items-center justify-center rounded hover:bg-white/50" title="Archive">
              <Archive size={11} style={{ color: c.border }} />
            </button>
            <button onClick={onDelete} className="w-6 h-6 flex items-center justify-center rounded hover:bg-red-100" title="Delete">
              <Trash2 size={11} className="text-red-400" />
            </button>
          </div>
        </div>

        {/* Note body — click to edit */}
        <div className="px-3 py-2.5 cursor-pointer" onClick={onEdit}>
          <h4 className="text-xs font-bold leading-snug mb-1 line-clamp-2" style={{ color: '#1e293b' }}>
            {note.title || 'Untitled'}
          </h4>
          {note.content && (
            <p className="text-[11px] leading-relaxed line-clamp-5 whitespace-pre-wrap" style={{ color: '#334155' }}>
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
