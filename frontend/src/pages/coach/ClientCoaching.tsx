import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import UserMenu from '../../components/common/UserMenu'
import NotificationBell from '../../components/common/NotificationBell'
import {
    Calendar,
    Clock,
    User,
    ArrowLeft,
    CheckCircle2,
    CalendarPlus,
    X,
    MessageSquare,
    AlertCircle,
    Star, Video, Loader2, ArrowRight, Calendar as CalendarIcon
} from 'lucide-react'
import { downloadICS, CalendarEvent, generateGoogleCalendarLink } from '../../utils/calendar'

interface CoachProfile {
    id: string
    user_id: string
    title: string
    company: string
    bio: string
    expertise: string[]
    linkedin_url: string
}

interface ListedCoach {
    id: string | null
    coach_id: string
    client_id: string
    status: string
    coach_profile?: CoachProfile
    coach_user?: {
        full_name: string
        email: string
        avatar_url?: string
    }
}

interface Session {
    id: string
    coach_client_id: string
    coach_id: string
    client_id: string
    session_type: string
    scheduled_at: string
    duration_minutes: number
    status: string
    meeting_link?: string
    coach_user?: {
        full_name: string
        avatar_url?: string
    }
}

function formatDate(dateString: string) {
    const d = new Date(dateString)
    return new Intl.DateTimeFormat('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    }).format(d)
}

function Badge({ children, color, bg = '#f1f5f9' }: { children: React.ReactNode; color: string; bg?: string }) {
    return (
        <span style={{
            padding: '4px 10px',
            borderRadius: 16,
            fontSize: 11,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.03em',
            color: color,
            background: bg,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4
        }}>
            {children}
        </span>
    )
}

export default function ClientCoaching() {
    const navigate = useNavigate()
    const [userAuth, setUserAuth] = useState<any>(null)
    const [userProfile, setUserProfile] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    const [assignedCoaches, setAssignedCoaches] = useState<ListedCoach[]>([])
    const [sessions, setSessions] = useState<Session[]>([])

    // Booking Modal State
    const [isBookingModalOpen, setIsBookingModalOpen] = useState(false)
    const [selectedCoachId, setSelectedCoachId] = useState<string>('')
    const [selectedCoachClientId, setSelectedCoachClientId] = useState<string>('')
    const [bookingDate, setBookingDate] = useState('')
    const [bookingType, setBookingType] = useState('Career Vision Review')
    const [isSubmitting, setIsSubmitting] = useState(false)

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        try {
            setLoading(true)
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) {
                navigate('/signin')
                return
            }

            const authUser = session.user
            setUserAuth(authUser)

            const { data: profile } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('user_id', authUser.id)
                .single()

            setUserProfile(profile)

            // 1. Fetch ALL available coaches directly from users
            const { data: coachUsers, error: usersError } = await supabase
                .from('users')
                .select('id, full_name, email, avatar_url')
                .eq('is_coach', true)

            if (usersError) throw usersError

            // Fetch any existing relations for this client
            const { data: relations } = await supabase
                .from('coach_clients')
                .select('id, coach_id, client_id, status')
                .eq('client_id', authUser.id)

            if (coachUsers && coachUsers.length > 0) {
                const coachIds = coachUsers.map((u: any) => u.id)

                // Fetch expanded profiles (bio, title, company) if they exist
                const { data: allCoachProfiles } = await supabase
                    .from('coach_profiles')
                    .select('*')
                    .in('user_id', coachIds)

                const enrichedCoaches = coachUsers.map((user: any) => {
                    const existingRelation = relations?.find((r: any) => r.coach_id === user.id)
                    const profileData = allCoachProfiles?.find((p: any) => p.user_id === user.id)

                    return {
                        id: existingRelation?.id || null, // null if unassigned
                        coach_id: user.id,
                        client_id: authUser.id,
                        status: existingRelation?.status || 'available',
                        coach_user: user,
                        coach_profile: profileData
                    }
                })

                setAssignedCoaches(enrichedCoaches)

                // 2. Fetch all upcoming/past sessions for this client
                const { data: sessionsData, error: sessionsError } = await supabase
                    .from('coaching_sessions')
                    .select('*')
                    .eq('client_id', authUser.id)
                    .order('scheduled_at', { ascending: true })

                if (sessionsError) throw sessionsError

                const enrichedSessions = (sessionsData || []).map((sess: any) => ({
                    ...sess,
                    coach_user: coachUsers.find((p: any) => p.id === sess.coach_id) || { full_name: 'Coach', avatar_url: undefined }
                }))

                setSessions(enrichedSessions)
            }

        } catch (error) {
            console.error('Error loading coaching data:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleOpenBooking = (coachId: string, coachClientId: string | null) => {
        setSelectedCoachId(coachId)
        setSelectedCoachClientId(coachClientId || '')
        setIsBookingModalOpen(true)
        setBookingDate('') // Reset date
        setBookingType('Career Vision Review')
    }

    const handleBookSession = async () => {
        if (!bookingDate || !selectedCoachId) {
            alert("Please select a valid date and time.")
            return
        }

        try {
            setIsSubmitting(true)
            const scheduledAt = new Date(bookingDate).toISOString()

            // Get the current user's session token for the backend auth middleware
            const { data: { session } } = await supabase.auth.getSession()

            const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/coaching/sessions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token}`
                },
                body: JSON.stringify({
                    coach_id: selectedCoachId,
                    client_id: userAuth.id,
                    session_type: bookingType,
                    scheduled_at: scheduledAt,
                    duration_minutes: 60
                })
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Failed to book session via backend')
            }

            setIsBookingModalOpen(false)
            alert("Session booked successfully!")
            loadData() // Refresh view
        } catch (error) {
            console.error("Booking failed:", error)
            alert("Failed to book session. Please try again.")
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleCancelSession = async (sessionId: string) => {
        if (!confirm("Are you sure you want to cancel this booking?")) return

        try {
            const { data: { session } } = await supabase.auth.getSession()

            const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/coaching/sessions/${sessionId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token}`
                },
                body: JSON.stringify({ status: 'cancelled' })
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Failed to cancel session via backend')
            }

            alert("Session cancelled successfully.")
            loadData() // Refresh view
        } catch (error) {
            console.error("Cancellation failed:", error)
            alert("Failed to cancel session. Please try again.")
        }
    }

    const handleAddToCalendar = (session: Session) => {
        const startDate = new Date(session.scheduled_at)
        const duration = session.duration_minutes || 60
        const endDate = new Date(startDate.getTime() + duration * 60000)

        const event: CalendarEvent = {
            title: `Coaching Session with ${session.coach_user?.full_name}`,
            description: `NovaWork Global Coaching Session\nType: ${session.session_type}\nStatus: ${session.status}\nPlease connect on time.`,
            startTime: startDate,
            endTime: endDate,
            location: session.meeting_link || 'NovaWork Platform / Video Call',
            // Default organizer details (could be adjusted based on coach profile)
            organizer: {
                name: session.coach_user?.full_name || 'Coach',
                email: 'support@novaworkglobal.com'
            }
        }

        downloadICS(event, `coaching-session-${session.id}.ics`)
    }

    const upcomingSessions = sessions.filter(s => new Date(s.scheduled_at) >= new Date() && (s.status === 'scheduled' || s.status === 'confirmed' || s.status === 'pending'))
    const pastSessions = sessions.filter(s => new Date(s.scheduled_at) < new Date() || s.status === 'completed' || s.status === 'cancelled')

    if (loading) {
        return (
            <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: 40, height: 40, border: '3px solid #e2e8f0', borderTopColor: '#0f172a', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                <style dangerouslySetInnerHTML={{ __html: `@keyframes spin { 100% { transform: rotate(360deg); } }` }} />
            </div>
        )
    }

    return (
        <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: 'Inter, system-ui, sans-serif' }}>
            {/* Minimal Header */}
            <header style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0, zIndex: 40, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.02)' }}>
                <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', height: 72, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                        <button
                            onClick={() => navigate('/dashboard')}
                            style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#64748b', fontSize: 13, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: '8px 12px', borderRadius: 8 }}
                            onMouseOver={(e) => e.currentTarget.style.background = '#f1f5f9'}
                            onMouseOut={(e) => e.currentTarget.style.background = 'none'}
                        >
                            <ArrowLeft size={16} /> Dashboard
                        </button>
                        <div style={{ width: 1, height: 24, background: '#e2e8f0' }} />
                        <h1 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', margin: 0 }}>My Coaches</h1>
                    </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    {userAuth && <NotificationBell userId={userAuth.id} />}
                    {userAuth && <UserMenu user={userAuth} userProfile={userProfile} />}
                </div>
            </div>
        </header>

            <main style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px' }}>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 32 }}>

                    {/* Section 1: All Coaches */}
                    <div>
                        <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', margin: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Star size={20} color="#0ea5e9" /> Our Coaching Team
                        </h2>

                        {assignedCoaches.length === 0 ? (
                            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: '40px 24px', textAlign: 'center' }}>
                                <div style={{ width: 64, height: 64, background: '#f1f5f9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto', color: '#94a3b8' }}>
                                    <User size={32} />
                                </div>
                                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: '0 0 8px 0' }}>No coaches available</h3>
                                <p style={{ fontSize: 14, color: '#64748b', margin: '0 0 24px 0', maxWidth: 400, marginInline: 'auto' }}>
                                    There are currently no coaches available in the network.
                                </p>
                            </div>
                        ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
                                {assignedCoaches.map(rel => (
                                    <div key={rel.coach_id} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 24, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.02)', display: 'flex', flexDirection: 'column' }}>
                                        <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
                                            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 20, fontWeight: 800, flexShrink: 0, overflow: 'hidden' }}>
                                                {rel.coach_user?.avatar_url ? (
                                                    <img src={rel.coach_user.avatar_url} alt={rel.coach_user?.full_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                ) : (
                                                    rel.coach_user?.full_name?.charAt(0) || 'C'
                                                )}
                                            </div>
                                            <div style={{ alignSelf: 'center' }}>
                                                <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', margin: '0 0 4px 0' }}>{rel.coach_user?.full_name}</h3>
                                                <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>{rel.coach_profile?.title || 'Executive Career Coach'}</p>
                                                {rel.coach_profile?.company && (
                                                    <p style={{ fontSize: 13, color: '#0ea5e9', fontWeight: 600, margin: '2px 0 0 0' }}>{rel.coach_profile.company}</p>
                                                )}
                                            </div>
                                        </div>

                                        <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.6, margin: '0 0 24px 0', flex: 1 }}>
                                            {rel.coach_profile?.bio || 'Ready to support your career transition and professional development goals.'}
                                        </p>

                                        <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 20 }}>
                                            <button
                                                onClick={() => handleOpenBooking(rel.coach_id, rel.id)}
                                                style={{ width: '100%', padding: '10px', borderRadius: 10, fontSize: 14, fontWeight: 700, color: '#fff', background: '#0f172a', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.2s' }}
                                                onMouseOver={(e) => Object.assign(e.currentTarget.style, { background: '#1e293b', transform: 'translateY(-1px)', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' })}
                                                onMouseOut={(e) => Object.assign(e.currentTarget.style, { background: '#0f172a', transform: 'none', boxShadow: 'none' })}
                                            >
                                                <Calendar size={16} /> Book Session
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div style={{ height: 1, background: '#e2e8f0', margin: '16px 0' }} />

                    {/* Section 2: Upcoming Sessions */}
                    <div>
                        <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', margin: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Clock size={20} color="#0ea5e9" /> Upcoming Sessions
                        </h2>

                        {upcomingSessions.length === 0 ? (
                            <p style={{ fontSize: 14, color: '#64748b', background: '#fff', padding: 24, borderRadius: 12, border: '1px dashed #cbd5e1', textAlign: 'center' }}>
                                You have no upcoming coaching sessions scheduled.
                            </p>
                        ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
                                {upcomingSessions.map(session => {
                                    const isPending = session.status === 'pending'
                                    const isConfirmed = session.status === 'confirmed' || session.status === 'scheduled'
                                    const isDeclined = session.status === 'declined'
                                    const borderColor = isPending ? '#fde68a' : isDeclined ? '#fecaca' : '#f0f4f8'
                                    const bgIcon = isPending ? '#fef9c3' : isDeclined ? '#fff1f2' : '#eff6ff'
                                    const iconColor = isPending ? '#f59e0b' : isDeclined ? '#ef4444' : '#0ea5e9'

                                    return (
                                        <div key={session.id} style={{ background: '#fff', border: `1.5px solid ${borderColor}`, borderRadius: 12, padding: 20, display: 'flex', gap: 16 }}>
                                            <div style={{ width: 44, height: 44, borderRadius: 10, background: bgIcon, display: 'flex', alignItems: 'center', justifyContent: 'center', color: iconColor, flexShrink: 0 }}>
                                                {isPending ? '⏳' : isDeclined ? '❌' : <Calendar size={20} />}
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                    <div>
                                                        <h4 style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', margin: '0 0 2px 0' }}>{session.session_type}</h4>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#64748b', margin: '6px 0 0 0' }}>
                                                            <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 9, fontWeight: 800, overflow: 'hidden' }}>
                                                                {session.coach_user?.avatar_url ? (
                                                                    <img src={session.coach_user.avatar_url} alt={session.coach_user.full_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                                ) : (
                                                                    session.coach_user?.full_name?.charAt(0) || 'C'
                                                                )}
                                                            </div>
                                                            <span>with {session.coach_user?.full_name}</span>
                                                        </div>
                                                    </div>
                                                    {isPending && (
                                                        <span style={{ fontSize: 11, fontWeight: 700, background: '#fef3c7', color: '#b45309', padding: '3px 8px', borderRadius: 6 }}>⏳ Pending</span>
                                                    )}
                                                    {isDeclined && (
                                                        <span style={{ fontSize: 11, fontWeight: 700, background: '#fee2e2', color: '#ef4444', padding: '3px 8px', borderRadius: 6 }}>❌ Declined</span>
                                                    )}
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12 }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#64748b' }}>
                                                        <Clock size={12} /> {formatDate(session.scheduled_at)}
                                                    </div>
                                                </div>

                                                <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid #f0f4f8' }}>
                                                    {isPending ? (
                                                        <p style={{ fontSize: 12, color: '#92400e', background: '#fef9c3', padding: '8px 12px', borderRadius: 8, margin: 0 }}>
                                                            ⏳ Waiting for coach to confirm your request.
                                                        </p>
                                                    ) : isDeclined ? (
                                                        <p style={{ fontSize: 12, color: '#991b1b', background: '#fff1f2', padding: '8px 12px', borderRadius: 8, margin: 0 }}>
                                                            ❌ This session was declined. You can book a new time.
                                                        </p>
                                                    ) : (
                                                        <div style={{ display: 'flex', gap: 12 }}>
                                                            <button
                                                                onClick={() => {
                                                                    const url = generateGoogleCalendarLink({
                                                                        title: `Coaching Session with ${session.coach_user?.full_name || 'Coach'} – ${session.session_type}`,
                                                                        startDate: session.scheduled_at,
                                                                        durationMinutes: session.duration_minutes || 60,
                                                                        description: `NovaWork Global Coaching Session\nType: ${session.session_type}\nStatus: ${session.status}`,
                                                                        location: session.meeting_link || 'Online'
                                                                    });
                                                                    window.open(url, '_blank', 'noopener,noreferrer');
                                                                }}
                                                                style={{ flex: 1, padding: '8px', borderRadius: 8, fontSize: 12, fontWeight: 700, color: '#fff', background: '#4285F4', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                                                            >
                                                                📅 Add to Google Calendar
                                                            </button>
                                                            <button
                                                                onClick={() => handleCancelSession(session.id)}
                                                                style={{ flex: 1, padding: '8px', borderRadius: 8, fontSize: 12, fontWeight: 700, color: '#ef4444', background: '#fef2f2', border: '1px solid #fecaca', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                                                            >
                                                                <X size={14} /> Cancel Booking
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>

                    {/* Section 3: Past Sessions (Optional context) */}
                    {pastSessions.length > 0 && (
                        <div>
                            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#64748b', margin: '20px 0 16px 0' }}>Past Sessions</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                {pastSessions.map(session => (
                                    <div key={session.id} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <div style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>{session.session_type}</div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#94a3b8', margin: '6px 0 4px 0' }}>
                                                <div style={{ width: 16, height: 16, borderRadius: '50%', background: 'linear-gradient(135deg, #94a3b8 0%, #cbd5e1 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 8, fontWeight: 800, overflow: 'hidden' }}>
                                                    {session.coach_user?.avatar_url ? (
                                                        <img src={session.coach_user.avatar_url} alt={session.coach_user.full_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                    ) : (
                                                        session.coach_user?.full_name?.charAt(0) || 'C'
                                                    )}
                                                </div>
                                                <span>with {session.coach_user?.full_name}</span>
                                            </div>
                                            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>{formatDate(session.scheduled_at)}</div>
                                        </div>
                                        <Badge color={session.status === 'completed' ? '#059669' : '#64748b'} bg={session.status === 'completed' ? '#d1fae5' : '#e2e8f0'}>
                                            {session.status}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {/* 🔥 Booking Modal 🔥 */}
            {isBookingModalOpen && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)' }} onClick={() => setIsBookingModalOpen(false)} />
                    <div style={{ position: 'relative', width: '100%', maxWidth: 440, background: '#fff', borderRadius: 24, padding: 32, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
                        <button onClick={() => setIsBookingModalOpen(false)} style={{ position: 'absolute', top: 24, right: 24, background: '#f1f5f9', border: 'none', width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', cursor: 'pointer' }}>
                            <X size={16} />
                        </button>

                        <div style={{ width: 48, height: 48, borderRadius: 16, background: '#eff6ff', color: '#0ea5e9', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                            <CalendarPlus size={24} />
                        </div>

                        <h2 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', margin: '0 0 8px 0' }}>Book a Session</h2>
                        <p style={{ fontSize: 14, color: '#64748b', margin: '0 0 24px 0' }}>Select a date and time to schedule your next coaching call.</p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                            <div>
                                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 8 }}>Session Type</label>
                                <select
                                    value={bookingType}
                                    onChange={(e) => setBookingType(e.target.value)}
                                    style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1.5px solid #e2e8f0', fontSize: 14, color: '#0f172a', outline: 'none', background: '#fff' }}
                                >
                                    <option>Career Vision Review</option>
                                    <option>Resume Strategy & Review</option>
                                    <option>Interview Preparation</option>
                                    <option>Offer Negotiation</option>
                                    <option>General Check-in</option>
                                </select>
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 8 }}>Date and Time</label>
                                <input
                                    type="datetime-local"
                                    value={bookingDate}
                                    onChange={(e) => setBookingDate(e.target.value)}
                                    style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1.5px solid #e2e8f0', fontSize: 14, color: '#0f172a', outline: 'none' }}
                                />
                                <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <AlertCircle size={12} /> Times are in your device's local timezone.
                                </p>
                            </div>

                            <button
                                disabled={isSubmitting || !bookingDate}
                                onClick={handleBookSession}
                                style={{
                                    marginTop: 12,
                                    width: '100%',
                                    padding: '14px',
                                    borderRadius: 12,
                                    fontSize: 15,
                                    fontWeight: 700,
                                    color: '#fff',
                                    background: (isSubmitting || !bookingDate) ? '#94a3b8' : '#0f172a',
                                    border: 'none',
                                    cursor: (isSubmitting || !bookingDate) ? 'not-allowed' : 'pointer',
                                    transition: 'background 0.2s'
                                }}
                            >
                                {isSubmitting ? 'Booking...' : 'Confirm Session'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
