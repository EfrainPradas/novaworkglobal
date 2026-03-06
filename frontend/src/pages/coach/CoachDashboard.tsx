import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import UserMenu from '../../components/common/UserMenu'

// ─── TYPES ──────────────────────────────────────────────────────────────────

interface ClientRelation {
    id: string
    coach_id: string
    client_id: string
    status: string
    program_type: string | null
    sessions_planned: number | null
    sessions_completed: number
    started_at: string
    client: {
        id: string
        email: string
        full_name: string | null
        avatar_url: string | null
    }
}

interface CoachStats {
    totalClients: number
    activeClients: number
    upcomingSessions: number
    pendingCommitments: number
    activeGoals: number
    unreadMessages: number
    placementRate: number
}

interface PipelineItem {
    id: string
    company_name: string
    job_title: string
    stage: string
    interest_level: number | null
    salary_min: number | null
    salary_max: number | null
    next_step: string | null
    client_id: string
    client_name?: string
}

interface Session {
    id: string
    session_type: string
    scheduled_at: string
    duration_minutes: number
    status: string
    client_id: string
    client_name?: string
}

// ─── STAGE CONFIG ───────────────────────────────────────────────────────────

const stageConfig: Record<string, { label: string; color: string; bg: string }> = {
    researching: { label: "Investigating", color: "#64748b", bg: "#f1f5f9" },
    networking: { label: "Networking", color: "#0891b2", bg: "#e0f2fe" },
    applied: { label: "Applied", color: "#7c3aed", bg: "#ede9fe" },
    screening: { label: "Screening", color: "#d97706", bg: "#fef3c7" },
    interview_1: { label: "Interview 1", color: "#ea580c", bg: "#fff7ed" },
    interview_2: { label: "Interview 2", color: "#dc2626", bg: "#fee2e2" },
    interview_final: { label: "Final", color: "#be123c", bg: "#ffe4e6" },
    offer: { label: "Offer", color: "#16a34a", bg: "#dcfce7" },
    negotiating: { label: "Negotiating", color: "#0d9488", bg: "#ccfbf1" },
    accepted: { label: "Accepted", color: "#059669", bg: "#d1fae5" },
    rejected: { label: "Rejected", color: "#6b7280", bg: "#f3f4f6" },
}

const avatarColors = ["#0ea5e9", "#8b5cf6", "#ec4899", "#f59e0b", "#22c55e", "#06b6d4", "#f43f5e", "#84cc16"]

// ─── HELPER COMPONENTS ──────────────────────────────────────────────────────

const ProgressRing = ({ value, size = 56, stroke = 5, color = "#0ea5e9" }: { value: number; size?: number; stroke?: number; color?: string }) => {
    const r = (size - stroke) / 2
    const circ = 2 * Math.PI * r
    const offset = circ - (value / 100) * circ
    return (
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e2e8f0" strokeWidth={stroke} />
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
                strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
                style={{ transition: "stroke-dashoffset 0.6s ease" }} />
        </svg>
    )
}

const MoodBar = ({ value }: { value: number }) => {
    const color = value >= 7 ? "#22c55e" : value >= 5 ? "#f59e0b" : "#ef4444"
    return (
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ flex: 1, height: 6, background: "#e2e8f0", borderRadius: 99, overflow: "hidden" }}>
                <div style={{ width: `${value * 10}%`, height: "100%", background: color, borderRadius: 99, transition: "width 0.6s ease" }} />
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, color, minWidth: 16 }}>{value}</span>
        </div>
    )
}

const Badge = ({ children, color = "#0ea5e9", bg = "#e0f2fe" }: { children: React.ReactNode; color?: string; bg?: string }) => (
    <span style={{ background: bg, color, fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 6, letterSpacing: 0.3 }}>{children}</span>
)

const Avatar = ({ initials, size = 36, color = "#0ea5e9" }: { initials: string; size?: number; color?: string }) => (
    <div style={{ width: size, height: size, borderRadius: "50%", background: `${color}22`, border: `2px solid ${color}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.35, fontWeight: 800, color, flexShrink: 0 }}>
        {initials}
    </div>
)

function getInitials(name: string | null | undefined, email?: string): string {
    if (name) {
        const parts = name.trim().split(' ')
        if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
        return parts[0].substring(0, 2).toUpperCase()
    }
    if (email) return email.substring(0, 2).toUpperCase()
    return '?'
}

function formatSalary(min: number | null, max: number | null): string {
    if (min && max) return `$${Math.round(min / 1000)}k-$${Math.round(max / 1000)}k`
    if (min) return `$${Math.round(min / 1000)}k+`
    if (max) return `Up to $${Math.round(max / 1000)}k`
    return '—'
}

function formatDate(dateStr: string): string {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

// ─── OVERVIEW VIEW ──────────────────────────────────────────────────────────

function OverviewView({
    stats, clients, sessions, pipelineItems,
    setView, setSelectedClient
}: {
    stats: CoachStats
    clients: (ClientRelation & { progress?: number; mood?: number; phase?: string; lastActivity?: string; alert?: string | null; goal?: string })[]
    sessions: Session[]
    pipelineItems: PipelineItem[]
    setView: (v: string) => void
    setSelectedClient: (c: any) => void
}) {
    const [filter, setFilter] = useState("all")

    const filteredClients = clients.filter(c => {
        if (filter === "all") return true
        if (filter === "active") return c.status === "active"
        if (filter === "alert") return !!c.alert
        if (filter === "paused") return c.status === "paused"
        return true
    })

    const alertCount = clients.filter(c => c.alert).length

    return (
        <div>
            {/* KPI Strip */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 28 }}>
                {[
                    { label: "Active Clients", value: String(stats.activeClients), sub: `${stats.totalClients} total`, icon: "👥", accent: "#0ea5e9" },
                    { label: "Placement Rate", value: `${stats.placementRate}%`, sub: "All-time average", icon: "🎯", accent: "#22c55e" },
                    { label: "Upcoming Sessions", value: String(stats.upcomingSessions), sub: "Next 7 days", icon: "📅", accent: "#8b5cf6" },
                    { label: "Unread Messages", value: String(stats.unreadMessages), sub: `${stats.pendingCommitments} pending tasks`, icon: "💬", accent: "#f59e0b" },
                ].map(k => (
                    <div key={k.label} style={{ background: "#fff", borderRadius: 14, padding: "18px 20px", border: "1.5px solid #e8edf2", boxShadow: "0 2px 8px #0000000a" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                            <span style={{ fontSize: 22 }}>{k.icon}</span>
                            <span style={{ fontSize: 26, fontWeight: 900, color: "#0f172a" }}>{k.value}</span>
                        </div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b", marginBottom: 3 }}>{k.label}</div>
                        <div style={{ fontSize: 11, color: k.accent, fontWeight: 600 }}>{k.sub}</div>
                    </div>
                ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 20 }}>
                {/* Client List */}
                <div style={{ background: "#fff", borderRadius: 16, border: "1.5px solid #e8edf2", overflow: "hidden", boxShadow: "0 2px 12px #0000000a" }}>
                    <div style={{ padding: "18px 22px", borderBottom: "1px solid #f0f4f8", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                            <div style={{ fontSize: 15, fontWeight: 800, color: "#0f172a" }}>My Clients</div>
                            <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>{clients.length} clients{alertCount > 0 ? ` • ${alertCount} alert${alertCount > 1 ? 's' : ''}` : ''}</div>
                        </div>
                        <div style={{ display: "flex", gap: 8 }}>
                            {[{ key: "all", label: "All" }, { key: "active", label: "Active" }, { key: "alert", label: "Alert" }, { key: "paused", label: "Paused" }].map(f => (
                                <button key={f.key} onClick={() => setFilter(f.key)}
                                    style={{ fontSize: 11, padding: "4px 10px", borderRadius: 20, border: "1px solid #e2e8f0", background: filter === f.key ? "#0f172a" : "#f8fafc", color: filter === f.key ? "#fff" : "#64748b", cursor: "pointer", fontWeight: 600 }}>
                                    {f.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        {filteredClients.length === 0 ? (
                            <div style={{ padding: "40px 22px", textAlign: "center" }}>
                                <div style={{ fontSize: 36, marginBottom: 12 }}>👥</div>
                                <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>No clients yet</div>
                                <div style={{ fontSize: 12, color: "#94a3b8" }}>Add your first client to start coaching</div>
                            </div>
                        ) : (
                            filteredClients.map((c, i) => (
                                <div key={c.id} onClick={() => { setSelectedClient(c); setView("client") }}
                                    style={{ display: "grid", gridTemplateColumns: "auto 1fr auto auto auto", gap: 14, alignItems: "center", padding: "14px 22px", borderBottom: i < filteredClients.length - 1 ? "1px solid #f8fafc" : "none", cursor: "pointer", transition: "background 0.15s", background: c.alert ? "#fff7ed" : "#fff" }}
                                    onMouseEnter={e => (e.currentTarget.style.background = c.alert ? "#fef3c7" : "#f8fafc")}
                                    onMouseLeave={e => (e.currentTarget.style.background = c.alert ? "#fff7ed" : "#fff")}
                                >
                                    <div style={{ position: "relative" }}>
                                        <Avatar initials={getInitials(c.client?.full_name, c.client?.email)} color={avatarColors[i % avatarColors.length]} />
                                        {c.alert && <div style={{ position: "absolute", top: -2, right: -2, width: 10, height: 10, borderRadius: "50%", background: "#ef4444", border: "2px solid #fff" }} />}
                                    </div>
                                    <div>
                                        <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>{c.client?.full_name || c.client?.email || 'Unknown'}</div>
                                        <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 1 }}>{c.program_type || 'Custom Program'}</div>
                                        {c.alert && <div style={{ fontSize: 10, color: "#ef4444", fontWeight: 700, marginTop: 2 }}>⚠ {c.alert}</div>}
                                    </div>
                                    <div style={{ textAlign: "center", minWidth: 60 }}>
                                        <div style={{ position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                                            <ProgressRing value={c.progress || 0} color={(c.progress || 0) > 70 ? "#22c55e" : (c.progress || 0) > 40 ? "#0ea5e9" : "#f59e0b"} />
                                            <span style={{ position: "absolute", fontSize: 11, fontWeight: 800, color: "#0f172a" }}>{c.progress || 0}%</span>
                                        </div>
                                    </div>
                                    <div style={{ minWidth: 100 }}>
                                        <div style={{ fontSize: 10, color: "#94a3b8", marginBottom: 4 }}>Wellbeing</div>
                                        <MoodBar value={c.mood || 5} />
                                    </div>
                                    <div style={{ textAlign: "right" }}>
                                        <Badge
                                            color={c.status === "active" ? "#16a34a" : c.status === "paused" ? "#64748b" : c.status === "completed" ? "#0ea5e9" : "#dc2626"}
                                            bg={c.status === "active" ? "#dcfce7" : c.status === "paused" ? "#f1f5f9" : c.status === "completed" ? "#e0f2fe" : "#fee2e2"}
                                        >
                                            {c.status}
                                        </Badge>
                                        <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 4 }}>{c.lastActivity || `Session ${c.sessions_completed}/${c.sessions_planned || '—'}`}</div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Right Column */}
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {/* Upcoming Sessions */}
                    <div style={{ background: "#fff", borderRadius: 16, border: "1.5px solid #e8edf2", overflow: "hidden", boxShadow: "0 2px 12px #0000000a" }}>
                        <div style={{ padding: "16px 18px", borderBottom: "1px solid #f0f4f8" }}>
                            <div style={{ fontSize: 14, fontWeight: 800, color: "#0f172a" }}>📅 Upcoming Sessions</div>
                        </div>
                        <div style={{ padding: "8px 0" }}>
                            {sessions.length === 0 ? (
                                <div style={{ padding: "20px 18px", textAlign: "center", fontSize: 12, color: "#94a3b8" }}>No upcoming sessions</div>
                            ) : (
                                sessions.slice(0, 4).map(s => (
                                    <div key={s.id} style={{ padding: "10px 18px", display: "flex", gap: 12, alignItems: "flex-start" }}>
                                        <div style={{ width: 36, height: 36, borderRadius: 10, background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>📋</div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: 12, fontWeight: 700, color: "#0f172a" }}>{s.client_name || 'Client'}</div>
                                            <div style={{ fontSize: 11, color: "#64748b" }}>{s.session_type} · {s.duration_minutes} min</div>
                                            <div style={{ fontSize: 10, color: "#0ea5e9", fontWeight: 600, marginTop: 2 }}>{formatDate(s.scheduled_at)}</div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Pipeline Snapshot */}
                    <div style={{ background: "#fff", borderRadius: 16, border: "1.5px solid #e8edf2", overflow: "hidden", boxShadow: "0 2px 12px #0000000a" }}>
                        <div style={{ padding: "16px 18px", borderBottom: "1px solid #f0f4f8", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div style={{ fontSize: 14, fontWeight: 800, color: "#0f172a" }}>🎯 Active Pipeline</div>
                            <button onClick={() => setView("pipeline")} style={{ fontSize: 11, color: "#0ea5e9", fontWeight: 700, background: "none", border: "none", cursor: "pointer" }}>View all →</button>
                        </div>
                        <div style={{ padding: "8px 0" }}>
                            {pipelineItems.length === 0 ? (
                                <div style={{ padding: "20px 18px", textAlign: "center", fontSize: 12, color: "#94a3b8" }}>No pipeline items</div>
                            ) : (
                                pipelineItems.slice(0, 4).map(p => {
                                    const sc = stageConfig[p.stage] || stageConfig.researching
                                    return (
                                        <div key={p.id} style={{ padding: "10px 18px", display: "flex", gap: 10, alignItems: "center" }}>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontSize: 12, fontWeight: 700, color: "#0f172a" }}>{p.company_name}</div>
                                                <div style={{ fontSize: 11, color: "#64748b" }}>{p.client_name} · {p.job_title}</div>
                                            </div>
                                            <span style={{ background: sc.bg, color: sc.color, fontSize: 10, fontWeight: 700, padding: "3px 7px", borderRadius: 5 }}>{sc.label}</span>
                                        </div>
                                    )
                                })
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

// ─── CLIENT DETAIL VIEW ─────────────────────────────────────────────────────

interface PlatformProgress {
    hasWorkExperience: boolean
    hasEducation: boolean
    hasCertifications: boolean
    hasParStories: boolean
    hasAccomplishmentBank: boolean
    hasQuestionnaire: boolean
    hasGeneratedProfile: boolean
    hasProfile: boolean
    workExpCount: number
    parStoriesCount: number
    tailoredResumesCount: number
    careerVisionCompleted: boolean
    careerVisionStarted: boolean
}

function ClientView({ relation, onBack }: { relation: ClientRelation & { progress?: number; mood?: number }; onBack: () => void }) {
    const [tab, setTab] = useState("overview")
    const [goals, setGoals] = useState<any[]>([])
    const [clientSessions, setClientSessions] = useState<any[]>([])
    const [notes, setNotes] = useState<any[]>([])
    const [noteText, setNoteText] = useState("")
    const [wellbeing, setWellbeing] = useState<any[]>([])
    const [platformProgress, setPlatformProgress] = useState<PlatformProgress | null>(null)

    const client = relation.client
    const color = avatarColors[0]

    useEffect(() => {
        loadClientData()
        loadPlatformProgress()
    }, [relation.id])

    const loadClientData = async () => {
        // Load goals
        const { data: goalsData } = await supabase
            .from('coaching_goals')
            .select('*')
            .eq('coach_client_id', relation.id)
            .order('created_at', { ascending: false })
        if (goalsData) setGoals(goalsData)

        // Load sessions
        const { data: sessionsData } = await supabase
            .from('coaching_sessions')
            .select('*')
            .eq('coach_client_id', relation.id)
            .order('scheduled_at', { ascending: false })
        if (sessionsData) setClientSessions(sessionsData)

        // Load notes
        const { data: notesData } = await supabase
            .from('coaching_notes')
            .select('*')
            .eq('coach_client_id', relation.id)
            .order('created_at', { ascending: false })
        if (notesData) setNotes(notesData)

        // Load wellbeing checkins
        const { data: wellbeingData } = await supabase
            .from('client_wellbeing_checkins')
            .select('*')
            .eq('coach_client_id', relation.id)
            .order('checkin_date', { ascending: true })
            .limit(6)
        if (wellbeingData) setWellbeing(wellbeingData)
    }

    // ── Load client's NovaWork platform progress (the 4 module cards) ──
    const loadPlatformProgress = async () => {
        const clientId = relation.client_id
        const progress: PlatformProgress = {
            hasWorkExperience: false, hasEducation: false, hasCertifications: false,
            hasParStories: false, hasAccomplishmentBank: false, hasQuestionnaire: false,
            hasGeneratedProfile: false, hasProfile: false, workExpCount: 0,
            parStoriesCount: 0, tailoredResumesCount: 0, careerVisionCompleted: false,
            careerVisionStarted: false,
        }

        try {
            // Work Experience
            const { data: resumes } = await supabase.from('user_resumes').select('id, profile_summary, areas_of_excellence').eq('user_id', clientId)
            if (resumes && resumes.length > 0) {
                const profileResume = resumes.find((r: any) => r.profile_summary && r.profile_summary.length > 10 && r.areas_of_excellence && r.areas_of_excellence.length > 0)
                if (profileResume) progress.hasProfile = true

                let totalWorkExp = 0
                for (const resume of resumes) {
                    const { count } = await supabase.from('work_experience').select('*', { count: 'exact', head: true }).eq('resume_id', resume.id)
                    totalWorkExp += count || 0
                }
                if (totalWorkExp === 0) {
                    const { count: legacyCount } = await supabase.from('work_experience').select('*', { count: 'exact', head: true }).eq('resume_id', clientId)
                    totalWorkExp += legacyCount || 0
                }
                progress.workExpCount = totalWorkExp
                progress.hasWorkExperience = totalWorkExp > 0
            }

            // Education
            const { data: edu } = await supabase.from('education').select('id').eq('user_id', clientId).limit(1)
            progress.hasEducation = !!(edu && edu.length > 0)

            // Certifications
            const { data: certs } = await supabase.from('certifications').select('id').eq('user_id', clientId).limit(1)
            progress.hasCertifications = !!(certs && certs.length > 0)

            // PAR/CAR Stories
            const { count: parCount } = await supabase.from('par_stories').select('*', { count: 'exact', head: true }).eq('user_id', clientId)
            progress.parStoriesCount = parCount || 0
            progress.hasParStories = (parCount || 0) > 0

            // Accomplishment Bank
            const { data: bank } = await supabase.from('accomplishment_bank').select('id').eq('user_id', clientId).limit(1)
            progress.hasAccomplishmentBank = !!(bank && bank.length > 0)

            // Positioning Questionnaire
            try {
                const { data: quest } = await supabase.from('positioning_questionnaire').select('id').eq('user_id', clientId).maybeSingle()
                progress.hasQuestionnaire = !!quest
            } catch { /* table may not exist */ }

            // Generated Profile
            try {
                const { data: genProf } = await supabase.from('generated_professional_profile').select('id').eq('user_id', clientId).limit(1)
                progress.hasGeneratedProfile = !!(genProf && genProf.length > 0)
            } catch { /* table may not exist */ }

            // Tailored Resumes
            const { count: tailoredCount } = await supabase.from('tailored_resumes').select('*', { count: 'exact', head: true }).eq('user_id', clientId)
            progress.tailoredResumesCount = tailoredCount || 0

            // Career Vision
            const { data: cv } = await supabase.from('user_profiles').select('career_vision_started, career_vision_completed').eq('user_id', clientId).maybeSingle()
            if (cv) {
                progress.careerVisionStarted = cv.career_vision_started || false
                progress.careerVisionCompleted = cv.career_vision_completed || false
            }
        } catch (e) {
            console.error('Error loading platform progress:', e)
        }

        setPlatformProgress(progress)
    }

    const saveNote = async () => {
        if (!noteText.trim()) return
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { error } = await supabase.from('coaching_notes').insert({
            coach_client_id: relation.id,
            coach_id: user.id,
            client_id: relation.client_id,
            content: noteText,
            note_type: 'general',
        })
        if (!error) {
            setNoteText("")
            loadClientData()
        }
    }

    const tabs = [
        { id: "overview", label: "Overview" },
        { id: "platform", label: "Platform Progress" },
        { id: "goals", label: "Goals" },
        { id: "sessions", label: "Sessions" },
        { id: "notes", label: "Notes" },
    ]

    return (
        <div>
            {/* Client Header */}
            <div style={{ background: "#fff", borderRadius: 16, border: "1.5px solid #e8edf2", padding: "22px 26px", marginBottom: 20, boxShadow: "0 2px 12px #0000000a" }}>
                <button onClick={onBack} style={{ fontSize: 12, color: "#64748b", background: "none", border: "none", cursor: "pointer", marginBottom: 14, padding: 0, display: "flex", alignItems: "center", gap: 4 }}>← Back to Dashboard</button>
                <div style={{ display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" }}>
                    <Avatar initials={getInitials(client?.full_name, client?.email)} size={64} color={color} />
                    <div style={{ flex: 1, minWidth: 200 }}>
                        <div style={{ fontSize: 22, fontWeight: 900, color: "#0f172a" }}>{client?.full_name || client?.email || 'Unknown'}</div>
                        <div style={{ fontSize: 13, color: "#64748b", marginTop: 3 }}>{relation.program_type || 'Custom Program'}</div>
                        <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
                            <Badge color={color} bg={`${color}18`}>{relation.sessions_completed} sessions</Badge>
                            <Badge color="#64748b" bg="#f1f5f9">{relation.status}</Badge>
                        </div>
                    </div>
                    <div style={{ textAlign: "center" }}>
                        <div style={{ position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                            <ProgressRing value={relation.progress || 0} size={80} stroke={7} color={(relation.progress || 0) > 70 ? "#22c55e" : "#0ea5e9"} />
                            <div style={{ position: "absolute", textAlign: "center" }}>
                                <div style={{ fontSize: 18, fontWeight: 900, color: "#0f172a" }}>{relation.progress || 0}%</div>
                                <div style={{ fontSize: 9, color: "#94a3b8" }}>progress</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div style={{ display: "flex", gap: 4, marginBottom: 18 }}>
                {tabs.map(t => (
                    <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: "8px 18px", borderRadius: 10, border: "1.5px solid", borderColor: tab === t.id ? "#0f172a" : "#e2e8f0", background: tab === t.id ? "#0f172a" : "#fff", color: tab === t.id ? "#fff" : "#64748b", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>{t.label}</button>
                ))}
            </div>

            {/* Overview Tab */}
            {tab === "overview" && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    {/* Wellbeing */}
                    <div style={{ background: "#fff", borderRadius: 14, border: "1.5px solid #e8edf2", padding: "20px 22px" }}>
                        <div style={{ fontSize: 14, fontWeight: 800, color: "#0f172a", marginBottom: 4 }}>🧘 Emotional Wellbeing</div>
                        <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 16 }}>Last check-ins</div>
                        {wellbeing.length > 0 ? (
                            <div style={{ display: "flex", alignItems: "flex-end", gap: 10, height: 90, marginBottom: 8 }}>
                                {wellbeing.map((w, i) => {
                                    const v = w.overall_mood || 5
                                    return (
                                        <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                                            <div style={{ fontSize: 10, fontWeight: 700, color: v >= 7 ? "#22c55e" : v >= 5 ? "#f59e0b" : "#ef4444" }}>{v}</div>
                                            <div style={{ width: "100%", height: `${v * 9}px`, borderRadius: "6px 6px 0 0", background: v >= 7 ? "#22c55e" : v >= 5 ? "#f59e0b" : "#ef4444", opacity: i === wellbeing.length - 1 ? 1 : 0.5 }} />
                                        </div>
                                    )
                                })}
                            </div>
                        ) : (
                            <div style={{ padding: "24px 0", textAlign: "center", fontSize: 12, color: "#94a3b8" }}>No check-ins yet</div>
                        )}
                    </div>

                    {/* Active Goal */}
                    {goals.length > 0 ? (
                        <div style={{ background: "linear-gradient(135deg, #0f172a, #1e3a5f)", borderRadius: 14, padding: "20px 22px", color: "#fff" }}>
                            <div style={{ fontSize: 12, color: "#93c5fd", fontWeight: 700, marginBottom: 8 }}>🎯 ACTIVE GOAL</div>
                            <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 4 }}>{goals[0].title}</div>
                            {goals[0].target_date && <div style={{ fontSize: 12, color: "#7dd3fc", marginBottom: 16 }}>Deadline: {new Date(goals[0].target_date).toLocaleDateString()}</div>}
                            <div style={{ height: 8, background: "#ffffff20", borderRadius: 99, overflow: "hidden" }}>
                                <div style={{ width: `${goals[0].progress_percentage || 0}%`, height: "100%", background: "linear-gradient(90deg, #0ea5e9, #22c55e)", borderRadius: 99 }} />
                            </div>
                            <div style={{ fontSize: 11, color: "#93c5fd", marginTop: 6 }}>{goals[0].progress_percentage || 0}% complete</div>
                        </div>
                    ) : (
                        <div style={{ background: "#f8fafc", borderRadius: 14, border: "1.5px solid #e8edf2", padding: "20px 22px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <div style={{ textAlign: "center", color: "#94a3b8", fontSize: 12 }}>No active goals set</div>
                        </div>
                    )}

                    {/* Latest Note */}
                    <div style={{ background: "#fff", borderRadius: 14, border: "1.5px solid #e8edf2", padding: "20px 22px", gridColumn: "span 2" }}>
                        <div style={{ fontSize: 14, fontWeight: 800, color: "#0f172a", marginBottom: 12 }}>📝 Latest Coach Note</div>
                        {notes.length > 0 ? (
                            <>
                                <div style={{ fontSize: 12, color: "#374151", lineHeight: 1.7, background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 8, padding: "12px 14px" }}>
                                    "{notes[0].content}"
                                </div>
                                <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 8 }}>
                                    {new Date(notes[0].created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </div>
                            </>
                        ) : (
                            <div style={{ fontSize: 12, color: "#94a3b8" }}>No notes yet. Click "Notes" tab to add one.</div>
                        )}
                    </div>
                </div>
            )}

            {/* Platform Progress Tab — The 4 NovaWork module cards */}
            {tab === "platform" && platformProgress && (() => {
                const pp = platformProgress
                const resumeScore = Math.min(100, Math.round(
                    (pp.hasProfile ? 25 : 0) +
                    (pp.workExpCount > 0 ? Math.min(25, pp.workExpCount * 8) : 0) +
                    (pp.parStoriesCount > 0 ? Math.min(25, pp.parStoriesCount * 5) : 0) +
                    (pp.tailoredResumesCount > 0 ? 25 : 0)
                ))

                const moduleCards = [
                    {
                        title: 'Career Vision', icon: '🧭',
                        completed: pp.careerVisionCompleted, started: pp.careerVisionStarted,
                        color: '#3b82f6', bg: '#eff6ff',
                        details: pp.careerVisionCompleted ? 'Completed' : pp.careerVisionStarted ? 'In Progress' : 'Not started',
                    },
                    {
                        title: 'Work Experience & Education', icon: '💼',
                        completed: pp.hasWorkExperience && pp.hasEducation,
                        started: pp.hasWorkExperience || pp.hasEducation,
                        color: '#10b981', bg: '#ecfdf5',
                        details: `${pp.workExpCount} roles · Education: ${pp.hasEducation ? '✓' : '✗'} · Certs: ${pp.hasCertifications ? '✓' : '✗'}`,
                    },
                    {
                        title: 'Accomplishment Bank & CARs', icon: '🏆',
                        completed: pp.hasAccomplishmentBank && pp.hasParStories,
                        started: pp.hasAccomplishmentBank || pp.hasParStories,
                        color: '#f59e0b', bg: '#fffbeb',
                        details: `${pp.parStoriesCount} CAR stories · Bank: ${pp.hasAccomplishmentBank ? '✓' : '✗'}`,
                    },
                    {
                        title: 'Professional Profile', icon: '📋',
                        completed: pp.hasQuestionnaire,
                        started: pp.hasQuestionnaire,
                        color: '#14b8a6', bg: '#f0fdfa',
                        details: pp.hasQuestionnaire ? 'Questionnaire completed' : 'Not started',
                    },
                    {
                        title: 'Finalize & Adapt', icon: '✅',
                        completed: pp.hasGeneratedProfile,
                        started: pp.tailoredResumesCount > 0,
                        color: '#6366f1', bg: '#eef2ff',
                        details: `Generated profile: ${pp.hasGeneratedProfile ? '✓' : '✗'} · ${pp.tailoredResumesCount} tailored resumes`,
                    },
                ]

                const completedModules = moduleCards.filter(m => m.completed).length

                return (
                    <div>
                        {/* Resume Score Card */}
                        <div style={{ background: 'linear-gradient(135deg, #0f172a, #1e3a5f)', borderRadius: 16, padding: '24px 28px', marginBottom: 20, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div>
                                <div style={{ fontSize: 12, color: '#93c5fd', fontWeight: 700, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>NovaWork Platform Progress</div>
                                <div style={{ fontSize: 20, fontWeight: 900, marginBottom: 8 }}>{client?.full_name || 'Client'}</div>
                                <div style={{ fontSize: 13, color: '#7dd3fc' }}>{completedModules} of {moduleCards.length} modules completed</div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <ProgressRing value={resumeScore} size={90} stroke={8} color={resumeScore > 70 ? '#22c55e' : resumeScore > 40 ? '#0ea5e9' : '#f59e0b'} />
                                    <div style={{ position: 'absolute', textAlign: 'center' }}>
                                        <div style={{ fontSize: 22, fontWeight: 900 }}>{resumeScore}%</div>
                                        <div style={{ fontSize: 9, color: '#93c5fd' }}>resume score</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Module Cards Grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                            {moduleCards.map(m => (
                                <div key={m.title} style={{ background: '#fff', borderRadius: 14, border: `1.5px solid ${m.completed ? m.color + '44' : '#e8edf2'}`, padding: '20px 22px', position: 'relative', overflow: 'hidden' }}>
                                    {m.completed && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: m.color }} />}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                                        <div style={{ width: 42, height: 42, borderRadius: 12, background: m.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{m.icon}</div>
                                        {m.completed ? (
                                            <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#dcfce7', border: '2px solid #22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#22c55e' }}>✓</div>
                                        ) : m.started ? (
                                            <Badge color={m.color} bg={m.bg}>In Progress</Badge>
                                        ) : (
                                            <Badge color="#94a3b8" bg="#f1f5f9">Not Started</Badge>
                                        )}
                                    </div>
                                    <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>{m.title}</div>
                                    <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.5 }}>{m.details}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )
            })()}

            {/* Goals Tab */}
            {tab === "goals" && (
                <div style={{ background: "#fff", borderRadius: 14, border: "1.5px solid #e8edf2", padding: "22px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                        <div style={{ fontSize: 15, fontWeight: 800, color: "#0f172a" }}>SMART Goals</div>
                    </div>
                    {goals.length === 0 ? (
                        <div style={{ padding: "40px 0", textAlign: "center", fontSize: 12, color: "#94a3b8" }}>No goals set yet for this client</div>
                    ) : (
                        goals.map((g, i) => (
                            <div key={g.id} style={{ display: "flex", gap: 14, alignItems: "flex-start", padding: "14px 0", borderBottom: i < goals.length - 1 ? "1px solid #f8fafc" : "none" }}>
                                <div style={{ width: 24, height: 24, borderRadius: "50%", background: g.status === "completed" ? "#dcfce7" : "#f1f5f9", border: `2px solid ${g.status === "completed" ? "#22c55e" : "#e2e8f0"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, flexShrink: 0, marginTop: 2 }}>
                                    {g.status === "completed" ? "✓" : "○"}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 13, fontWeight: 700, color: g.status === "completed" ? "#94a3b8" : "#0f172a", textDecoration: g.status === "completed" ? "line-through" : "none" }}>{g.title}</div>
                                    <div style={{ display: "flex", gap: 8, marginTop: 5 }}>
                                        {g.category && <Badge color="#8b5cf6" bg="#ede9fe">{g.category}</Badge>}
                                        {g.target_date && <Badge color={g.status === "completed" ? "#22c55e" : "#f59e0b"} bg={g.status === "completed" ? "#dcfce7" : "#fef3c7"}>📅 {new Date(g.target_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</Badge>}
                                    </div>
                                    {g.status !== "completed" && g.progress_percentage > 0 && (
                                        <div style={{ marginTop: 8 }}>
                                            <div style={{ height: 5, background: "#f1f5f9", borderRadius: 99, overflow: "hidden" }}>
                                                <div style={{ width: `${g.progress_percentage}%`, height: "100%", background: "#0ea5e9", borderRadius: 99 }} />
                                            </div>
                                            <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 3 }}>{g.progress_percentage}% complete</div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* Sessions Tab */}
            {tab === "sessions" && (
                <div style={{ background: "#fff", borderRadius: 14, border: "1.5px solid #e8edf2", padding: "22px" }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", marginBottom: 18 }}>Session History</div>
                    {clientSessions.length === 0 ? (
                        <div style={{ padding: "40px 0", textAlign: "center", fontSize: 12, color: "#94a3b8" }}>No sessions recorded yet</div>
                    ) : (
                        clientSessions.map((s, i) => (
                            <div key={s.id} style={{ display: "flex", gap: 16, padding: "14px 0", borderBottom: i < clientSessions.length - 1 ? "1px solid #f8fafc" : "none", alignItems: "flex-start" }}>
                                <div style={{ width: 40, height: 40, borderRadius: 10, background: s.status === "scheduled" ? "#eff6ff" : "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>
                                    {s.status === "scheduled" ? "📅" : "✅"}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                                        <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{s.session_type || 'Session'}</div>
                                        <Badge color={s.status === "scheduled" ? "#0ea5e9" : "#22c55e"} bg={s.status === "scheduled" ? "#e0f2fe" : "#dcfce7"}>
                                            {s.status}
                                        </Badge>
                                    </div>
                                    <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>{formatDate(s.scheduled_at)} · {s.duration_minutes} min</div>
                                    {s.session_notes && <div style={{ fontSize: 12, color: "#374151", marginTop: 6, fontStyle: "italic" }}>"{s.session_notes}"</div>}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* Notes Tab */}
            {tab === "notes" && (
                <div style={{ background: "#fff", borderRadius: 14, border: "1.5px solid #e8edf2", padding: "22px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
                        <div style={{ fontSize: 15, fontWeight: 800, color: "#0f172a" }}>Private Coach Notes</div>
                        <Badge color="#ef4444" bg="#fee2e2">🔒 Only visible to coach</Badge>
                    </div>
                    <textarea
                        value={noteText}
                        onChange={e => setNoteText(e.target.value)}
                        placeholder="Write a note about this client..."
                        style={{ width: "100%", height: 120, borderRadius: 10, border: "1.5px solid #e2e8f0", padding: "14px 16px", fontSize: 13, color: "#374151", lineHeight: 1.7, resize: "vertical", boxSizing: "border-box", marginBottom: 8 }}
                    />
                    <button onClick={saveNote} style={{ background: "#0f172a", color: "#fff", border: "none", padding: "9px 18px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", marginBottom: 20 }}>Save Note</button>

                    {notes.map((n, i) => (
                        <div key={n.id} style={{ padding: "12px 0", borderTop: i === 0 ? "1px solid #f0f4f8" : "none", borderBottom: "1px solid #f8fafc" }}>
                            <div style={{ fontSize: 12, color: "#374151", lineHeight: 1.7 }}>{n.content}</div>
                            <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                                <span style={{ fontSize: 10, color: "#94a3b8" }}>
                                    {new Date(n.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </span>
                                {n.note_type !== 'general' && <Badge color="#8b5cf6" bg="#ede9fe">{n.note_type}</Badge>}
                                {n.is_flagged && <Badge color="#ef4444" bg="#fee2e2">⚠ Flagged</Badge>}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

// ─── PIPELINE VIEW ──────────────────────────────────────────────────────────

function PipelineView({ items }: { items: PipelineItem[] }) {
    const stages = ["researching", "networking", "applied", "screening", "interview_1", "interview_final", "offer"]

    return (
        <div>
            <div style={{ fontSize: 20, fontWeight: 900, color: "#0f172a", marginBottom: 6 }}>Opportunities Pipeline</div>
            <div style={{ fontSize: 13, color: "#94a3b8", marginBottom: 20 }}>Kanban view across all active clients · {items.length} opportunities</div>
            <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 12 }}>
                {stages.map(stage => {
                    const sc = stageConfig[stage]
                    const stageItems = items.filter(p => p.stage === stage)
                    return (
                        <div key={stage} style={{ minWidth: 210, background: "#f8fafc", borderRadius: 14, border: "1.5px solid #e8edf2", overflow: "hidden", flexShrink: 0 }}>
                            <div style={{ padding: "12px 14px", background: sc.bg, borderBottom: `2px solid ${sc.color}44` }}>
                                <div style={{ fontSize: 12, fontWeight: 800, color: sc.color }}>{sc.label}</div>
                                <div style={{ fontSize: 11, color: sc.color + "99" }}>{stageItems.length} opportunit{stageItems.length !== 1 ? "ies" : "y"}</div>
                            </div>
                            <div style={{ padding: "10px 10px", display: "flex", flexDirection: "column", gap: 8, minHeight: 120 }}>
                                {stageItems.map(p => (
                                    <div key={p.id} style={{ background: "#fff", borderRadius: 10, padding: "12px 12px", border: "1px solid #e8edf2", boxShadow: "0 1px 4px #0000000a" }}>
                                        <div style={{ fontSize: 12, fontWeight: 800, color: "#0f172a" }}>{p.company_name}</div>
                                        <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{p.job_title}</div>
                                        <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 2 }}>{p.client_name}</div>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
                                            <span style={{ fontSize: 11, fontWeight: 700, color: "#22c55e" }}>{formatSalary(p.salary_min, p.salary_max)}</span>
                                            <div style={{ display: "flex", gap: 1 }}>
                                                {[1, 2, 3, 4, 5].map(s => <span key={s} style={{ fontSize: 10, color: s <= (p.interest_level || 0) ? "#f59e0b" : "#e2e8f0" }}>★</span>)}
                                            </div>
                                        </div>
                                        {p.next_step && <div style={{ fontSize: 10, color: "#0ea5e9", marginTop: 6, fontWeight: 600 }}>→ {p.next_step}</div>}
                                    </div>
                                ))}
                                {stageItems.length === 0 && <div style={{ textAlign: "center", color: "#cbd5e1", fontSize: 11, paddingTop: 20 }}>No opportunities</div>}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

// ─── MAIN COACH DASHBOARD ───────────────────────────────────────────────────

// ─── ADD CLIENT MODAL ────────────────────────────────────────────────────────

function AddClientModal({ coachId, onClose, onAdded }: { coachId: string; onClose: () => void; onAdded: () => void }) {
    const [email, setEmail] = useState('')
    const [programType, setProgramType] = useState('custom')
    const [sessionsPlanned, setSessionsPlanned] = useState(12)
    const [searchResult, setSearchResult] = useState<any>(null)
    const [error, setError] = useState('')
    const [saving, setSaving] = useState(false)

    const searchUser = async () => {
        setError('')
        setSearchResult(null)
        if (!email.trim()) return

        const { data, error: err } = await supabase
            .from('users')
            .select('id, email, full_name, avatar_url, subscription_tier')
            .eq('email', email.trim().toLowerCase())
            .single()

        if (err || !data) {
            setError('No user found with that email')
            return
        }

        if (data.id === coachId) {
            setError('You cannot add yourself as a client')
            return
        }

        // Check if already assigned
        const { data: existing } = await supabase
            .from('coach_clients')
            .select('id')
            .eq('coach_id', coachId)
            .eq('client_id', data.id)
            .limit(1)

        if (existing && existing.length > 0) {
            setError('This user is already assigned to you')
            return
        }

        setSearchResult(data)
    }

    const assignClient = async () => {
        if (!searchResult) return
        setSaving(true)

        const { error: err } = await supabase.from('coach_clients').insert({
            coach_id: coachId,
            client_id: searchResult.id,
            status: 'active',
            program_type: programType,
            sessions_planned: sessionsPlanned,
            sessions_completed: 0,
        })

        if (err) {
            setError('Failed to assign client: ' + err.message)
            setSaving(false)
            return
        }

        onAdded()
    }

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
            <div style={{ position: 'absolute', inset: 0, background: '#00000060', backdropFilter: 'blur(4px)' }} />
            <div style={{ position: 'relative', background: '#fff', borderRadius: 20, padding: '32px', maxWidth: 480, width: '100%', boxShadow: '0 20px 60px #00000030' }} onClick={e => e.stopPropagation()}>
                <div style={{ fontSize: 20, fontWeight: 900, color: '#0f172a', marginBottom: 4 }}>Add New Client</div>
                <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 24 }}>Search by email to assign a NovaWork user to your coaching practice</div>

                {/* Email Search */}
                <div style={{ marginBottom: 16 }}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>Client Email</label>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <input
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && searchUser()}
                            placeholder="client@example.com"
                            style={{ flex: 1, padding: '10px 14px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 14, color: '#0f172a', outline: 'none' }}
                        />
                        <button onClick={searchUser} style={{ padding: '10px 18px', borderRadius: 10, border: 'none', background: '#0f172a', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Search</button>
                    </div>
                </div>

                {error && <div style={{ padding: '10px 14px', borderRadius: 8, background: '#fee2e2', color: '#dc2626', fontSize: 12, fontWeight: 600, marginBottom: 16 }}>{error}</div>}

                {/* Search Result */}
                {searchResult && (
                    <div style={{ background: '#f0fdf4', border: '1.5px solid #bbf7d0', borderRadius: 14, padding: '16px 18px', marginBottom: 20 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                            <Avatar initials={getInitials(searchResult.full_name, searchResult.email)} size={44} color="#22c55e" />
                            <div>
                                <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a' }}>{searchResult.full_name || searchResult.email}</div>
                                <div style={{ fontSize: 12, color: '#64748b' }}>{searchResult.email}</div>
                                <div style={{ fontSize: 11, color: '#22c55e', fontWeight: 600, marginTop: 2 }}>✓ User found · {searchResult.subscription_tier} plan</div>
                            </div>
                        </div>

                        {/* Program Type */}
                        <div style={{ marginBottom: 12 }}>
                            <label style={{ fontSize: 11, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 4 }}>Program Type</label>
                            <select value={programType} onChange={e => setProgramType(e.target.value)} style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: 13, color: '#0f172a' }}>
                                <option value="custom">Custom Program</option>
                                <option value="novanext">NovaNEXT</option>
                                <option value="novarearchitect">Nova ReArchitect</option>
                                <option value="novaalign">NovaAlign</option>
                            </select>
                        </div>

                        {/* Sessions Planned */}
                        <div style={{ marginBottom: 16 }}>
                            <label style={{ fontSize: 11, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 4 }}>Planned Sessions</label>
                            <input type="number" value={sessionsPlanned} onChange={e => setSessionsPlanned(Number(e.target.value))} min={1} max={100}
                                style={{ width: 80, padding: '8px 12px', borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: 13, color: '#0f172a' }} />
                        </div>

                        <button onClick={assignClient} disabled={saving}
                            style={{ width: '100%', padding: '12px', borderRadius: 10, border: 'none', background: '#0f172a', color: '#fff', fontSize: 14, fontWeight: 700, cursor: saving ? 'wait' : 'pointer', opacity: saving ? 0.6 : 1 }}>
                            {saving ? 'Assigning...' : `Assign ${searchResult.full_name?.split(' ')[0] || 'Client'} to Me`}
                        </button>
                    </div>
                )}

                <button onClick={onClose} style={{ width: '100%', padding: '10px', borderRadius: 10, border: '1.5px solid #e2e8f0', background: '#f8fafc', color: '#64748b', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
            </div>
        </div>
    )
}

// ─── MAIN COACH DASHBOARD ───────────────────────────────────────────────────

export default function CoachDashboard() {
    const navigate = useNavigate()
    const [view, setView] = useState("overview")
    const [user, setUser] = useState<any>(null)
    const [userProfile, setUserProfile] = useState<any>(null)
    const [clients, setClients] = useState<any[]>([])
    const [sessions, setSessions] = useState<Session[]>([])
    const [pipelineItems, setPipelineItems] = useState<PipelineItem[]>([])
    const [selectedClient, setSelectedClient] = useState<any>(null)
    const [stats, setStats] = useState<CoachStats>({ totalClients: 0, activeClients: 0, upcomingSessions: 0, pendingCommitments: 0, activeGoals: 0, unreadMessages: 0, placementRate: 0 })
    const [loading, setLoading] = useState(true)
    const [showAddClient, setShowAddClient] = useState(false)

    useEffect(() => {
        loadCoachData()
    }, [])

    const loadCoachData = async () => {
        try {
            const { data: { user: authUser } } = await supabase.auth.getUser()
            if (!authUser) return
            setUser(authUser)

            // Load user data
            const { data: profile } = await supabase.from('users').select('*').eq('id', authUser.id).single()
            setUserProfile(profile)

            // Ensure coach profile exists
            const { data: existingCoach } = await supabase.from('coach_profiles').select('*').eq('user_id', authUser.id).single()
            if (!existingCoach) {
                await supabase.from('coach_profiles').insert({ user_id: authUser.id })
            }

            // Load client relations
            const { data: clientRelations } = await supabase
                .from('coach_clients')
                .select(`*, client:client_id (id, email, full_name, avatar_url)`)
                .eq('coach_id', authUser.id)
                .order('created_at', { ascending: false })

            if (clientRelations) {
                setClients(clientRelations)

                const activeClients = clientRelations.filter(c => c.status === 'active')
                const completedClients = clientRelations.filter(c => c.status === 'completed')

                // Load upcoming sessions
                const { data: sessionsData } = await supabase
                    .from('coaching_sessions')
                    .select('*')
                    .eq('coach_id', authUser.id)
                    .eq('status', 'scheduled')
                    .gte('scheduled_at', new Date().toISOString())
                    .order('scheduled_at', { ascending: true })
                    .limit(10)

                if (sessionsData) {
                    // Map client names to sessions
                    const mapped = sessionsData.map(s => {
                        const rel = clientRelations.find(r => r.client_id === s.client_id)
                        return { ...s, client_name: rel?.client?.full_name || rel?.client?.email || 'Client' }
                    })
                    setSessions(mapped)
                }

                // Load pipeline items
                const clientIds = clientRelations.map(r => r.client_id)
                if (clientIds.length > 0) {
                    const { data: pipeData } = await supabase
                        .from('client_pipeline')
                        .select('*')
                        .in('client_id', clientIds)
                        .order('updated_at', { ascending: false })

                    if (pipeData) {
                        const mapped = pipeData.map(p => {
                            const rel = clientRelations.find(r => r.client_id === p.client_id)
                            return { ...p, client_name: rel?.client?.full_name?.split(' ')[0] || 'Client' }
                        })
                        setPipelineItems(mapped)
                    }
                }

                // Stats
                const { count: pendingCount } = await supabase
                    .from('session_commitments')
                    .select('*', { count: 'exact', head: true })
                    .in('coach_client_id', clientRelations.map(c => c.id))
                    .eq('status', 'pending')

                const { count: goalsCount } = await supabase
                    .from('coaching_goals')
                    .select('*', { count: 'exact', head: true })
                    .eq('coach_id', authUser.id)
                    .eq('status', 'active')

                const { count: msgCount } = await supabase
                    .from('coaching_messages')
                    .select('*', { count: 'exact', head: true })
                    .eq('recipient_id', authUser.id)
                    .eq('is_read', false)

                const placementRate = clientRelations.length > 0
                    ? Math.round((completedClients.length / clientRelations.length) * 100)
                    : 0

                setStats({
                    totalClients: clientRelations.length,
                    activeClients: activeClients.length,
                    upcomingSessions: sessionsData?.length || 0,
                    pendingCommitments: pendingCount || 0,
                    activeGoals: goalsCount || 0,
                    unreadMessages: msgCount || 0,
                    placementRate,
                })
            }
        } catch (error) {
            console.error('Error loading coach data:', error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center", background: "#f0f4f8" }}>
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500"></div>
            </div>
        )
    }

    const navItems = [
        { id: "overview", icon: "⚡", label: "Dashboard" },
        { id: "pipeline", icon: "🎯", label: "Pipeline" },
        { id: "sessions", icon: "📅", label: "Sessions" },
        { id: "resources", icon: "📚", label: "Resources" },
        { id: "analytics", icon: "📊", label: "Analytics" },
    ]

    const alertCount = clients.filter(c => c.alert).length
    const activeCount = clients.filter(c => c.status === 'active').length

    const currentDate = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })

    return (
        <div style={{ display: "flex", height: "100vh", fontFamily: "'Inter', 'DM Sans', 'Segoe UI', sans-serif", background: "#f0f4f8" }}>
            {/* Sidebar */}
            <div style={{ width: 220, background: "#0f172a", display: "flex", flexDirection: "column", flexShrink: 0 }}>
                {/* Logo */}
                <div style={{ padding: "22px 20px 16px", borderBottom: "1px solid #ffffff10" }}>
                    <div style={{ fontSize: 18, fontWeight: 900, color: "#fff", letterSpacing: -0.5 }}>Nova<span style={{ color: "#38bdf8" }}>Work</span></div>
                    <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 2, letterSpacing: 1.5, textTransform: "uppercase" }}>Coach Portal</div>
                </div>

                {/* Coach Profile */}
                <div style={{ padding: "16px 20px", borderBottom: "1px solid #ffffff10" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg, #38bdf8, #818cf8)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: "#fff" }}>
                            {getInitials(userProfile?.full_name, user?.email)}
                        </div>
                        <div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: "#f8fafc" }}>{userProfile?.full_name || user?.email || 'Coach'}</div>
                            <div style={{ fontSize: 10, color: "#38bdf8" }}>Career Coach</div>
                        </div>
                    </div>
                </div>

                {/* Nav */}
                <nav style={{ padding: "12px 12px", flex: 1 }}>
                    {navItems.map(n => (
                        <button key={n.id} onClick={() => { setView(n.id); setSelectedClient(null) }}
                            style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10, border: "none", background: view === n.id || (view === "client" && n.id === "overview") ? "#ffffff15" : "none", color: view === n.id || (view === "client" && n.id === "overview") ? "#fff" : "#94a3b8", fontSize: 13, fontWeight: view === n.id ? 700 : 500, cursor: "pointer", marginBottom: 2, textAlign: "left" as const, borderLeft: view === n.id || (view === "client" && n.id === "overview") ? "3px solid #38bdf8" : "3px solid transparent", transition: "all 0.15s" }}>
                            <span>{n.icon}</span>{n.label}
                        </button>
                    ))}
                </nav>

                {/* Bottom Stats */}
                <div style={{ padding: "16px 20px", borderTop: "1px solid #ffffff10" }}>
                    <div style={{ display: "flex", gap: 6 }}>
                        <div style={{ flex: 1, background: "#ffffff08", borderRadius: 8, padding: "8px 10px", textAlign: "center" as const }}>
                            <div style={{ fontSize: 16, fontWeight: 900, color: "#f8fafc" }}>{activeCount}</div>
                            <div style={{ fontSize: 9, color: "#64748b", textTransform: "uppercase" as const, letterSpacing: 0.5 }}>Active</div>
                        </div>
                        <div style={{ flex: 1, background: alertCount > 0 ? "#ef444420" : "#ffffff08", borderRadius: 8, padding: "8px 10px", textAlign: "center" as const }}>
                            <div style={{ fontSize: 16, fontWeight: 900, color: alertCount > 0 ? "#ef4444" : "#f8fafc" }}>{alertCount}</div>
                            <div style={{ fontSize: 9, color: alertCount > 0 ? "#ef4444" : "#64748b", textTransform: "uppercase" as const, letterSpacing: 0.5 }}>Alerts</div>
                        </div>
                    </div>

                    {/* Back to App Button */}
                    <button
                        onClick={() => navigate('/dashboard')}
                        style={{ width: "100%", marginTop: 12, padding: "8px", borderRadius: 8, border: "1px solid #ffffff20", background: "none", color: "#94a3b8", fontSize: 11, fontWeight: 600, cursor: "pointer", transition: "all 0.15s" }}
                        onMouseEnter={e => { e.currentTarget.style.background = "#ffffff10"; e.currentTarget.style.color = "#fff" }}
                        onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "#94a3b8" }}
                    >
                        ← Back to NovaWork
                    </button>
                </div>
            </div>

            {/* Main */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                {/* Topbar */}
                <div style={{ background: "#fff", borderBottom: "1px solid #e8edf2", padding: "14px 28px", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
                    <div>
                        <div style={{ fontSize: 18, fontWeight: 900, color: "#0f172a" }}>
                            {view === "overview" && "Coach Dashboard"}
                            {view === "pipeline" && "Opportunities Pipeline"}
                            {view === "client" && (selectedClient?.client?.full_name || "Client")}
                            {view === "sessions" && "Session Management"}
                            {view === "resources" && "Resource Library"}
                            {view === "analytics" && "Coach Analytics"}
                        </div>
                        <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 1 }}>{currentDate}</div>
                    </div>
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                        <button onClick={() => setShowAddClient(true)} style={{ background: "#0f172a", color: "#fff", border: "none", padding: "9px 16px", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>+ New Client</button>
                        {stats.unreadMessages > 0 && (
                            <div style={{ position: "relative" }}>
                                <button style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "8px 12px", cursor: "pointer", fontSize: 16 }}>🔔</button>
                                <div style={{ position: "absolute", top: -4, right: -4, width: 16, height: 16, borderRadius: "50%", background: "#ef4444", color: "#fff", fontSize: 9, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center" }}>{stats.unreadMessages}</div>
                            </div>
                        )}
                        <UserMenu user={user} userProfile={userProfile} />
                    </div>
                </div>

                {/* Content */}
                <div style={{ flex: 1, overflow: "auto", padding: "24px 28px" }}>
                    {view === "overview" && (
                        <OverviewView
                            stats={stats}
                            clients={clients}
                            sessions={sessions}
                            pipelineItems={pipelineItems}
                            setView={setView}
                            setSelectedClient={setSelectedClient}
                        />
                    )}
                    {view === "client" && selectedClient && (
                        <ClientView relation={selectedClient} onBack={() => setView("overview")} />
                    )}
                    {view === "pipeline" && <PipelineView items={pipelineItems} />}
                    {["sessions", "resources", "analytics"].includes(view) && (
                        <div style={{ background: "#fff", borderRadius: 16, border: "1.5px solid #e8edf2", padding: "60px 40px", textAlign: "center" as const }}>
                            <div style={{ fontSize: 48, marginBottom: 12 }}>{view === "sessions" ? "📅" : view === "resources" ? "📚" : "📊"}</div>
                            <div style={{ fontSize: 20, fontWeight: 800, color: "#0f172a", marginBottom: 8 }}>
                                {view === "sessions" ? "Session Management" : view === "resources" ? "Resource Library" : "Coach Analytics"}
                            </div>
                            <div style={{ fontSize: 14, color: "#94a3b8" }}>This section is under construction. Click <strong>"Dashboard"</strong> or <strong>"Pipeline"</strong> to see the full experience.</div>
                        </div>
                    )}
                </div>
            </div>

            {/* Add Client Modal */}
            {showAddClient && user && (
                <AddClientModal
                    coachId={user.id}
                    onClose={() => setShowAddClient(false)}
                    onAdded={() => { setShowAddClient(false); loadCoachData() }}
                />
            )}
        </div>
    )
}
