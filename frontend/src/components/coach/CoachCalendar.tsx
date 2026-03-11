import { useState, useEffect } from "react"
import { Calendar, momentLocalizer, Views } from "react-big-calendar"
import moment from "moment"
import { supabase } from "../../lib/supabase"
import "react-big-calendar/lib/css/react-big-calendar.css"
import { Calendar as CalendarIcon, Clock, User } from "lucide-react"

// Set up the localizer for react-big-calendar
const localizer = momentLocalizer(moment)

const Badge = ({ children, color = "#0ea5e9", bg = "#e0f2fe" }: { children: React.ReactNode; color?: string; bg?: string }) => (
    <span style={{ padding: "4px 10px", borderRadius: 8, fontSize: 11, fontWeight: 800, color, background: bg, display: "inline-block" }}>
        {children}
    </span>
)

interface CoachCalendarProps {
    coachId: string
}

export default function CoachCalendar({ coachId }: CoachCalendarProps) {
    const [events, setEvents] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [view, setView] = useState<any>(Views.WEEK)
    const [date, setDate] = useState(new Date())

    useEffect(() => {
        loadEvents()
    }, [coachId])

    const loadEvents = async () => {
        setLoading(true)
        try {
            // 1. Fetch coach-client relations (correct table: coach_clients)
            const { data: relations, error: relError } = await supabase
                .from('coach_clients')
                .select('*, client:client_id (id, full_name, email)')
                .eq('coach_id', coachId)

            if (relError) console.error('Error fetching relations:', relError)

            // 2. Fetch sessions
            const { data: sessionsData, error: sessionsError } = await supabase
                .from('coaching_sessions')
                .select('*')
                .eq('coach_id', coachId)

            if (sessionsError) throw sessionsError

            // Map sessions regardless of whether relations were found
            if (sessionsData) {
                const mappedEvents = sessionsData.map(session => {
                    const startDate = new Date(session.scheduled_at)
                    const duration = session.duration_minutes || 60
                    const endDate = new Date(startDate.getTime() + duration * 60000)
                    
                    // Match with relations
                    const rel = relations?.find(r => r.client_id === session.client_id)
                    const clientProfile = rel?.client as any
                    
                    const clientName = clientProfile?.full_name || 
                                     clientProfile?.email || 
                                     'Client'

                    return {
                        id: session.id,
                        title: `${clientName} - ${session.session_type}`,
                        start: startDate,
                        end: endDate,
                        resource: {
                            ...session,
                            client_name: clientName
                        }
                    }
                })
                setEvents(mappedEvents)
            } else {
                setEvents([])
            }
        } catch (err) {
            console.error('Error fetching calendar events:', err)
        } finally {
            setLoading(false)
        }
    }

    // Custom Event Component for styling
    const CustomEvent = ({ event }: any) => {
        const session = event.resource
        let statusColor = "#64748b"
        let statusBg = "#f1f5f9"
        if (session.status === 'confirmed') { statusColor = "#22c55e"; statusBg = "#dcfce7" }
        if (session.status === 'scheduled') { statusColor = "#0ea5e9"; statusBg = "#e0f2fe" }
        if (session.status === 'pending') { statusColor = "#f59e0b"; statusBg = "#fef3c7" }
        if (session.status === 'completed') { statusColor = "#8b5cf6"; statusBg = "#ede9fe" }
        if (session.status === 'cancelled' || session.status === 'declined') { statusColor = "#ef4444"; statusBg = "#fee2e2" }

        return (
            <div style={{ fontSize: 12, color: "#fff", textShadow: "0 1px 3px rgba(0,0,0,0.4)" }}>
                <div style={{ fontWeight: 900, marginBottom: 4, display: "flex", alignItems: "center", gap: 6, fontSize: 15 }}>
                    <User size={16} style={{ flexShrink: 0 }} /> 
                    <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {session.client_name}
                    </span>
                </div>
                <div style={{ fontSize: 12, opacity: 0.95, marginBottom: 6, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {session.session_type}
                </div>
                <Badge color={statusColor} bg={statusBg}>{session.status}</Badge>
            </div>
        )
    }

    // Custom Toolbar Component for styling
    const CustomToolbar = (toolbar: any) => {
        const goToBack = () => { toolbar.onNavigate('PREV') }
        const goToNext = () => { toolbar.onNavigate('NEXT') }
        const goToCurrent = () => { toolbar.onNavigate('TODAY') }

        const label = () => {
            const date = moment(toolbar.date)
            if (toolbar.view === 'month') return date.format('MMMM YYYY')
            if (toolbar.view === 'week') return `Week of ${date.startOf('week').format('MMMM D, YYYY')}`
            if (toolbar.view === 'day') return date.format('dddd, MMMM D, YYYY')
            return date.format('MMMM YYYY')
        }

        return (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, padding: "0 10px" }}>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={goToCurrent} style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 700, color: "#475569" }}>Today</button>
                    <div style={{ display: "flex", background: "#f8fafc", borderRadius: 8, border: "1px solid #e2e8f0", overflow: "hidden" }}>
                        <button onClick={goToBack} style={{ padding: "8px 12px", border: "none", borderRight: "1px solid #e2e8f0", background: "none", cursor: "pointer", color: "#475569" }}>←</button>
                        <button onClick={goToNext} style={{ padding: "8px 12px", border: "none", background: "none", cursor: "pointer", color: "#475569" }}>→</button>
                    </div>
                </div>

                <div style={{ fontSize: 18, fontWeight: 900, color: "#0f172a" }}>
                    {label()}
                </div>

                <div style={{ display: 'flex', background: "#f8fafc", borderRadius: 8, border: "1px solid #e2e8f0", overflow: "hidden" }}>
                    {['month', 'week', 'day'].map((v) => (
                        <button
                            key={v}
                            onClick={() => toolbar.onView(v)}
                            style={{
                                padding: "8px 16px",
                                border: "none",
                                borderRight: v !== 'day' ? "1px solid #e2e8f0" : "none",
                                background: toolbar.view === v ? "#0f172a" : "none",
                                color: toolbar.view === v ? "#fff" : "#475569",
                                cursor: "pointer",
                                fontSize: 13,
                                fontWeight: toolbar.view === v ? 700 : 600,
                                textTransform: 'capitalize'
                            }}
                        >
                            {v}
                        </button>
                    ))}
                </div>
            </div>
        )
    }

    if (loading) {
        return <div style={{ padding: 40, textAlign: "center", color: "#64748b" }}>Loading calendar...</div>
    }

    return (
        <div style={{ background: "#fff", borderRadius: 16, border: "1.5px solid #e8edf2", padding: "24px", boxShadow: "0 2px 12px #0000000a", height: "calc(100vh - 120px)", display: "flex", flexDirection: "column" }}>
            <style>
                {`
                .rbc-calendar { color: #334155; font-family: inherit; }
                .rbc-header { padding: 8px 0; font-weight: 800; color: #475569; text-transform: uppercase; font-size: 11px; border-bottom: 2px solid #e2e8f0; }
                .rbc-header + .rbc-header { border-left: 1px solid #e2e8f0; }
                .rbc-date-cell { font-weight: 700; color: #64748b; padding: 4px 8px; font-size: 12px; }
                .rbc-today { background-color: #f0f9ff !important; }
                .rbc-off-range-bg { background-color: #f8fafc; }
                .rbc-month-view, .rbc-time-view { border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; background: #fff; }
                .rbc-day-bg { border-left: 1px solid #e2e8f0; }
                .rbc-month-row { border-top: 1px solid #e2e8f0; }
                .rbc-time-header.rbc-overflowing { border-right: none; }
                .rbc-timeslot-group { border-bottom: 2px solid #e2e8f0 !important; min-height: 80px !important; } /* Even taller to be sure */
                .rbc-time-slot { border-top: 1px solid #f1f5f9; min-height: 40px !important; }
                .rbc-event { padding: 4px !important; min-height: 30px !important; }
                .rbc-event-content { height: 100%; overflow: hidden; }
                .rbc-event-label { display: none !important; } /* Hide default time label to favor our custom one */
                /* Fix month view row height so it spans properly */
                .rbc-month-row { min-height: 100px; }
                /* Ensure label is visible */
                .rbc-button-link { color: inherit; font-weight: bold; }
                .rbc-now { color: #0ea5e9; font-weight: 900; }
                .rbc-current-time-indicator { background-color: #0ea5e9; }
                `}
            </style>
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
                components={{
                    event: CustomEvent,
                    toolbar: CustomToolbar
                }}
                eventPropGetter={(event) => {
                    const isPast = event.end < new Date()
                    let bg = "#38bdf8"
                    let border = "#0284c7"
                    
                    if (event.resource.status === 'confirmed') { bg = "#22c55e"; border = "#16a34a" }
                    else if (event.resource.status === 'pending') { bg = "#f59e0b"; border = "#d97706" }
                    else if (event.resource.status === 'completed') { bg = "#8b5cf6"; border = "#7c3aed" }
                    else if (event.resource.status === 'cancelled' || event.resource.status === 'declined') { bg = "#ef4444"; border = "#b91c1c" }
                    
                    return {
                        style: {
                            backgroundColor: bg,
                            borderColor: border,
                            borderWidth: 1,
                            borderStyle: "solid",
                            color: "#fff",
                            borderRadius: 6,
                            opacity: isPast ? 0.35 : 0.95,
                            filter: isPast ? "grayscale(40%)" : "none",
                            pointerEvents: "auto"
                        }
                    }
                }}
                style={{ flex: 1 }}
            />
            {events.length === 0 && (
                <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", textAlign: "center", color: "#94a3b8", background: "#ffffffee", padding: "20px 40px", borderRadius: 16, border: "1px dashed #cbd5e1", zIndex: 10 }}>
                    <div style={{ fontSize: 24, marginBottom: 8 }}>📅</div>
                    <div style={{ fontWeight: 700 }}>No sessions scheduled</div>
                </div>
            )}
        </div>
    )
}
