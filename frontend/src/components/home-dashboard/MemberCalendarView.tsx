import { useState, useEffect } from 'react'
import { Calendar, momentLocalizer, Views } from 'react-big-calendar'
import moment from 'moment'
import { supabase } from '../../lib/supabase'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import { Video, ExternalLink } from 'lucide-react'

const localizer = momentLocalizer(moment)

const Badge = ({
  children,
  color = '#0ea5e9',
  bg = '#e0f2fe',
}: {
  children: React.ReactNode
  color?: string
  bg?: string
}) => (
  <span
    style={{
      padding: '2px 8px',
      borderRadius: 6,
      fontSize: 10,
      fontWeight: 800,
      color,
      background: bg,
      display: 'inline-block',
    }}
  >
    {children}
  </span>
)

interface MemberCalendarViewProps {
  userId: string
}

export default function MemberCalendarView({ userId }: MemberCalendarViewProps) {
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<any>(null)
  const [view, setView] = useState<any>(Views.WEEK)
  const [date, setDate] = useState(new Date())

  useEffect(() => {
    if (userId) loadEvents()
  }, [userId])

  const loadEvents = async () => {
    setLoading(true)
    try {
      // Fetch client's coaching sessions
      const { data: sessionsData, error } = await supabase
        .from('coaching_sessions')
        .select('*')
        .eq('client_id', userId)
        .order('scheduled_at', { ascending: true })

      if (error) throw error

      if (sessionsData && sessionsData.length > 0) {
        // Get unique coach IDs
        const coachIds = [...new Set(sessionsData.map((s: any) => s.coach_id))]

        // Fetch coach profiles from coach_clients table
        const { data: relations } = await supabase
          .from('coach_clients')
          .select('coach_id, coach:coach_id(id, full_name, email)')
          .eq('client_id', userId)
          .in('coach_id', coachIds)

        // Build coach name lookup
        const coachNames: Record<string, string> = {}
        relations?.forEach((r: any) => {
          const profile = r.coach as any
          if (profile?.full_name || profile?.email) {
            coachNames[r.coach_id] = profile.full_name || profile.email
          }
        })

        const mapped = sessionsData.map((session: any) => {
          const start = new Date(session.scheduled_at)
          const end = new Date(start.getTime() + (session.duration_minutes || 60) * 60000)
          const coachName = coachNames[session.coach_id] || 'Your Coach'

          return {
            id: session.id,
            title: `${coachName} — ${session.session_type || 'Coaching'}`,
            start,
            end,
            resource: { ...session, coach_name: coachName },
          }
        })
        setEvents(mapped)
      } else {
        setEvents([])
      }
    } catch (err) {
      console.error('[MemberCalendarView] error:', err)
      setEvents([])
    } finally {
      setLoading(false)
    }
  }

  // ── Status helpers ──────────────────────────────────────────────────────────
  const statusStyle = (status: string) => {
    if (status === 'confirmed') return { bg: '#22c55e', border: '#16a34a', badgeColor: '#166534', badgeBg: '#dcfce7' }
    if (status === 'scheduled') return { bg: '#38bdf8', border: '#0284c7', badgeColor: '#075985', badgeBg: '#e0f2fe' }
    if (status === 'pending')   return { bg: '#f59e0b', border: '#d97706', badgeColor: '#92400e', badgeBg: '#fef3c7' }
    if (status === 'completed') return { bg: '#8b5cf6', border: '#7c3aed', badgeColor: '#4c1d95', badgeBg: '#ede9fe' }
    if (status === 'cancelled' || status === 'declined')
      return { bg: '#ef4444', border: '#b91c1c', badgeColor: '#7f1d1d', badgeBg: '#fee2e2' }
    return { bg: '#64748b', border: '#475569', badgeColor: '#1e293b', badgeBg: '#f1f5f9' }
  }

  // ── Custom Event ────────────────────────────────────────────────────────────
  const CustomEvent = ({ event }: any) => {
    const s = event.resource
    const { badgeColor, badgeBg } = statusStyle(s.status)
    return (
      <div style={{ fontSize: 12, color: '#fff', textShadow: '0 1px 2px rgba(0,0,0,0.35)', padding: 2 }}>
        <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {s.coach_name}
        </div>
        <div style={{ fontWeight: 600, opacity: 0.9, marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {s.session_type || 'Coaching'}
        </div>
        <Badge color={badgeColor} bg={badgeBg}>{s.status}</Badge>
      </div>
    )
  }

  // ── Custom Toolbar ──────────────────────────────────────────────────────────
  const CustomToolbar = (toolbar: any) => {
    const label = () => {
      const d = moment(toolbar.date)
      if (toolbar.view === 'month') return d.format('MMMM YYYY')
      if (toolbar.view === 'week') return `Week of ${d.startOf('week').format('MMMM D, YYYY')}`
      return d.format('dddd, MMMM D, YYYY')
    }
    return (
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => toolbar.onNavigate('TODAY')} style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: '#475569' }}>
            Today
          </button>
          <div style={{ display: 'flex', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <button onClick={() => toolbar.onNavigate('PREV')} style={{ padding: '7px 12px', border: 'none', borderRight: '1px solid #e2e8f0', background: 'none', cursor: 'pointer', color: '#475569' }}>←</button>
            <button onClick={() => toolbar.onNavigate('NEXT')} style={{ padding: '7px 12px', border: 'none', background: 'none', cursor: 'pointer', color: '#475569' }}>→</button>
          </div>
        </div>
        <div style={{ fontSize: 17, fontWeight: 900, color: '#0f172a' }}>{label()}</div>
        <div style={{ display: 'flex', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          {(['month', 'week', 'day'] as const).map((v) => (
            <button
              key={v}
              onClick={() => toolbar.onView(v)}
              style={{
                padding: '7px 14px',
                border: 'none',
                borderRight: v !== 'day' ? '1px solid #e2e8f0' : 'none',
                background: toolbar.view === v ? '#1976D2' : 'none',
                color: toolbar.view === v ? '#fff' : '#475569',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: toolbar.view === v ? 700 : 600,
                textTransform: 'capitalize',
              }}
            >
              {v}
            </button>
          ))}
        </div>
      </div>
    )
  }

  // ── Session detail popup ────────────────────────────────────────────────────
  const SessionPopup = ({ event }: { event: any }) => {
    const s = event.resource
    const { badgeColor, badgeBg } = statusStyle(s.status)
    const start = new Date(s.scheduled_at)
    return (
      <div
        className="absolute z-50 bg-white rounded-2xl shadow-2xl border border-slate-100 p-5 w-72"
        style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
      >
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="font-bold text-slate-800 text-sm">{s.coach_name}</p>
            <p className="text-xs text-slate-500 mt-0.5">{s.session_type || 'Coaching Session'}</p>
          </div>
          <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-600 text-lg leading-none">&times;</button>
        </div>
        <Badge color={badgeColor} bg={badgeBg}>{s.status}</Badge>
        <div className="mt-3 space-y-1.5 text-xs text-slate-600">
          <p>📅 {start.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
          <p>🕐 {start.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })} · {s.duration_minutes || 60} min</p>
        </div>
        {s.meeting_link && (
          <a
            href={s.meeting_link}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 flex items-center gap-2 justify-center w-full py-2 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
            style={{ background: '#1976D2' }}
          >
            <Video size={14} /> Join Session
            <ExternalLink size={11} />
          </a>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400 text-sm">
        <span className="animate-pulse">Loading your sessions…</span>
      </div>
    )
  }

  return (
    <div className="relative" style={{ height: 'calc(100dvh - 120px)', display: 'flex', flexDirection: 'column' }}>
      {/* Calendar CSS overrides */}
      <style>{`
        .rbc-calendar { color: #334155; font-family: 'DM Sans', sans-serif; }
        .rbc-header { padding: 8px 0; font-weight: 800; color: #475569; text-transform: uppercase; font-size: 11px; border-bottom: 2px solid #e2e8f0; }
        .rbc-header + .rbc-header { border-left: 1px solid #e2e8f0; }
        .rbc-date-cell { font-weight: 700; color: #64748b; padding: 4px 8px; font-size: 12px; }
        .rbc-today { background-color: #eff6ff !important; }
        .rbc-off-range-bg { background-color: #f8fafc; }
        .rbc-month-view, .rbc-time-view { border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; background: #fff; }
        .rbc-day-bg { border-left: 1px solid #e2e8f0; }
        .rbc-month-row { border-top: 1px solid #e2e8f0; min-height: 90px; }
        .rbc-timeslot-group { border-bottom: 1px solid #e2e8f0 !important; min-height: 60px !important; }
        .rbc-time-slot { border-top: 1px solid #f1f5f9; }
        .rbc-event { padding: 3px 5px !important; }
        .rbc-event-label { display: none !important; }
        .rbc-now { color: #1976D2; font-weight: 900; }
        .rbc-current-time-indicator { background-color: #1976D2; }
        .rbc-button-link { color: inherit; font-weight: bold; }
      `}</style>

      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        view={view}
        onView={setView}
        date={date}
        onNavigate={setDate}
        views={['month', 'week', 'day']}
        step={30}
        timeslots={2}
        components={{ event: CustomEvent, toolbar: CustomToolbar }}
        onSelectEvent={(event) => setSelected(event)}
        eventPropGetter={(event) => {
          const isPast = event.end < new Date()
          const { bg, border } = statusStyle(event.resource.status)
          return {
            style: {
              backgroundColor: bg,
              borderColor: border,
              borderWidth: 1,
              borderStyle: 'solid',
              color: '#fff',
              borderRadius: 6,
              opacity: isPast ? 0.4 : 0.95,
              filter: isPast ? 'grayscale(30%)' : 'none',
            },
          }
        }}
        style={{ flex: 1 }}
      />

      {/* No sessions state */}
      {events.length === 0 && (
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center', color: '#94a3b8', background: '#ffffffee', padding: '24px 40px', borderRadius: 16, border: '1px dashed #cbd5e1', zIndex: 10 }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>📅</div>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>No coaching sessions yet</div>
          <div style={{ fontSize: 13 }}>Book a session with your coach to see it here.</div>
        </div>
      )}

      {/* Event detail popup */}
      {selected && (
        <>
          <div className="absolute inset-0 z-40" onClick={() => setSelected(null)} />
          <SessionPopup event={selected} />
        </>
      )}
    </div>
  )
}
