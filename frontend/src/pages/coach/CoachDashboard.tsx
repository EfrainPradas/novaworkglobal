import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import UserMenu from '../../components/common/UserMenu'
import {
    LayoutDashboard,
    Target,
    Calendar,
    BookOpen,
    BarChart3,
    Users,
    MessageSquare,
    FileText,
    Clock,
    CheckCircle2,
    AlertCircle,
    X,
    CheckSquare,
    Search,
    TrendingUp,
    Play,
    CalendarPlus,
    Briefcase,
    Award,
    ExternalLink,
    Mail,
    Sparkles,
    ChevronRight,
    Menu,
    FileCheck,
    Check,
    ShieldCheck,
    Download,
    Navigation
} from 'lucide-react'
import { downloadICS, CalendarEvent } from '../../utils/calendar'

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
    totalApps: number
    totalRejections: number
    totalResumes: number
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

const AppStats = ({ apps, rejections }: { apps: number; rejections: number }) => {
    return (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 10, color: "#94a3b8", marginBottom: 2 }}>Apps</div>
                <div style={{ fontSize: 12, fontWeight: 800, color: "#0ea5e9" }}>{apps}</div>
            </div>
            <div style={{ width: 1, height: 20, background: "#e2e8f0" }} />
            <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 10, color: "#94a3b8", marginBottom: 2 }}>Rej.</div>
                <div style={{ fontSize: 12, fontWeight: 800, color: "#ef4444" }}>{rejections}</div>
            </div>
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

function ProgressTooltip({ children }: { children: React.ReactNode }) {
    const [visible, setVisible] = useState(false)
    return (
        <div
            style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
            onMouseEnter={() => setVisible(true)}
            onMouseLeave={() => setVisible(false)}
        >
            {children}
            {visible && (
                <div style={{
                    position: 'absolute',
                    bottom: '100%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    marginBottom: 12,
                    padding: '12px 16px',
                    background: 'rgba(15, 23, 42, 0.98)',
                    backdropFilter: 'blur(10px)',
                    color: '#fff',
                    borderRadius: 12,
                    fontSize: 11,
                    width: 200,
                    zIndex: 2000,
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.4)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    pointerEvents: 'none',
                    textAlign: 'left'
                }}>
                    <div style={{ fontWeight: 800, marginBottom: 8, borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 6, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>NovaWork Progress Metric</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', opacity: 0.9 }}><span>🧭 Career Vision</span> <span>20%</span></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', opacity: 0.9 }}><span>💼 Work Experience</span> <span>20%</span></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', opacity: 0.9 }}><span>🏆 3+ CAR Stories</span> <span>20%</span></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', opacity: 0.9 }}><span>📋 Questionnaire</span> <span>20%</span></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', opacity: 0.9 }}><span>✅ 1+ Applications</span> <span>20%</span></div>
                    </div>
                    {/* Arrow */}
                    <div style={{
                        position: 'absolute',
                        top: '100%',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        borderWidth: '6px 6px 0 6px',
                        borderStyle: 'solid',
                        borderColor: 'rgba(15, 23, 42, 0.98) transparent transparent transparent'
                    }} />
                </div>
            )}
        </div>
    )
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
    clients: (ClientRelation & { progress?: number; apps?: number; rejections?: number; resumes?: number; alert?: string | null })[]
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
                    { label: "Active Clients", value: String(stats.activeClients), sub: `${stats.totalClients} total`, icon: <Users size={22} />, accent: "#0ea5e9" },
                    { label: "Total Applications", value: String(stats.totalApps), sub: `${stats.totalRejections} rejections`, icon: <Target size={22} />, accent: "#22c55e" },
                    { label: "Tailored Resumes", value: String(stats.totalResumes), sub: "Across all clients", icon: <FileText size={22} />, accent: "#8b5cf6" },
                    { label: "Upcoming Sessions", value: String(stats.upcomingSessions), sub: "Next 7 days", icon: <Calendar size={22} />, accent: "#f59e0b" },
                ].map(k => (
                    <div key={k.label} style={{ background: "#fff", borderRadius: 14, padding: "18px 20px", border: "1.5px solid #e8edf2", boxShadow: "0 2px 8px #0000000a" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                            <span style={{ color: k.accent }}>{k.icon}</span>
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
                                        <ProgressTooltip>
                                            <ProgressRing value={c.progress || 0} size={48} stroke={4} color={(c.progress || 0) > 70 ? "#22c55e" : (c.progress || 0) > 0 ? "#0ea5e9" : "#e2e8f0"} />
                                            <span style={{ position: "absolute", fontSize: 11, fontWeight: 800, color: "#0f172a" }}>{c.progress || 0}%</span>
                                        </ProgressTooltip>
                                    </div>
                                    <div style={{ minWidth: 100 }}>
                                        <AppStats apps={c.apps || 0} rejections={c.rejections || 0} />
                                    </div>
                                    <div style={{ textAlign: "right" }}>
                                        <Badge
                                            color={c.status === "active" ? "#16a34a" : c.status === "paused" ? "#64748b" : c.status === "completed" ? "#0ea5e9" : "#dc2626"}
                                            bg={c.status === "active" ? "#dcfce7" : c.status === "paused" ? "#f1f5f9" : c.status === "completed" ? "#e0f2fe" : "#fee2e2"}
                                        >
                                            {c.status}
                                        </Badge>
                                        <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 4 }}>Session {c.sessions_completed}/{c.sessions_planned || '—'}</div>
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
    const [platformProgress, setPlatformProgress] = useState<PlatformProgress | null>(null)
    const [expandedModule, setExpandedModule] = useState<string | null>(null)
    const [moduleData, setModuleData] = useState<any>(null)
    const [loadingModule, setLoadingModule] = useState(false)

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
            const { data: resumes } = await supabase.from('user_resumes').select('id, profile_summary, areas_of_excellence, is_master').eq('user_id', clientId).order('is_master', { ascending: false }).order('created_at', { ascending: false })

            if (resumes && resumes.length > 0) {
                // Check for profile completeness (summary/excellence)
                const profileResume = resumes.find((r: any) => r.profile_summary && r.profile_summary.length > 10 && r.areas_of_excellence && r.areas_of_excellence.length > 0)
                if (profileResume) progress.hasProfile = true

                // Target the primary resume for work experience count
                const masterResume = resumes.find(r => r.is_master) || resumes[0]
                const { count } = await supabase.from('work_experience').select('*', { count: 'exact', head: true }).eq('resume_id', masterResume.id)
                progress.workExpCount = count || 0

                // Legacy fallback if no work exp found on resume
                if (progress.workExpCount === 0) {
                    const { count: legacyCount } = await supabase.from('work_experience').select('*', { count: 'exact', head: true }).eq('resume_id', clientId)
                    progress.workExpCount = legacyCount || 0
                }

                progress.hasWorkExperience = progress.workExpCount > 0
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

    const loadModuleDetails = async (moduleTitle: string) => {
        if (expandedModule === moduleTitle) {
            setExpandedModule(null)
            return
        }

        setLoadingModule(true)
        setExpandedModule(moduleTitle)
        setModuleData(null)

        const clientId = relation.client_id
        try {
            if (moduleTitle === 'Career Vision') {
                // career_vision_profiles stores: skills_knowledge, core_values, interests, career_vision_statement
                const { data: visionProfile } = await supabase.from('career_vision_profiles')
                    .select('career_vision_statement, skills_knowledge, core_values, interests, job_history_insights')
                    .eq('user_id', clientId)
                    .maybeSingle()
                const { data: skillsData } = await supabase.from('user_skills').select('skill_name').eq('user_id', clientId)
                const { data: interestsData } = await supabase.from('user_interests').select('interest_name').eq('user_id', clientId)
                const { data: jobHistory } = await supabase.from('job_history_analysis').select('*').eq('user_id', clientId).order('job_order', { ascending: true })
                const { data: preferences } = await supabase.from('ideal_work_preferences').select('*').eq('user_id', clientId).maybeSingle()

                // Skills can come from career_vision_profiles.skills_knowledge OR user_skills table
                const profileSkills: string[] = visionProfile?.skills_knowledge || []
                const tableSkills: string[] = skillsData?.map((s: any) => s.skill_name) || []
                const skills = profileSkills.length > 0 ? profileSkills : tableSkills

                // Interests can come from career_vision_profiles.interests OR user_interests table
                const profileInterests: string[] = visionProfile?.interests || []
                const tableInterests: string[] = interestsData?.map((i: any) => i.interest_name) || []
                const interests = profileInterests.length > 0 ? profileInterests : tableInterests

                // Calculate Sweet Spot (Overlapping words > 3 chars)
                const skillWords = skills.flatMap((s: string) => s.toLowerCase().split(/\s+/).filter((w: string) => w.length > 3))
                const interestWords = interests.flatMap((i: string) => i.toLowerCase().split(/\s+/).filter((w: string) => w.length > 3))
                const sweetSpot = [...new Set(skillWords.filter((w: string) => interestWords.includes(w)))]

                setModuleData({
                    career_vision_statement: visionProfile?.career_vision_statement,
                    short_term_goals: null,
                    long_term_goals: null,
                    skills,
                    interests,
                    sweetSpot,
                    jobHistory: jobHistory || [],
                    jobHistoryInsights: {
                        satisfiers: visionProfile?.job_history_insights?.satisfiers,
                        dissatisfiers: visionProfile?.job_history_insights?.dissatisfiers,
                        patterns: visionProfile?.job_history_insights?.patterns
                    },
                    preferences: preferences || null
                })
            } else if (moduleTitle === 'Work Experience & Education') {
                // Fetch only the master resume
                const { data: resumes } = await supabase.from('user_resumes')
                    .select('id')
                    .eq('user_id', clientId)
                    .eq('is_master', true)
                    .limit(1)

                let allWork = []
                if (resumes && resumes.length > 0) {
                    const { data } = await supabase.from('work_experience').select('*').eq('resume_id', resumes[0].id)
                    if (data) allWork = data
                } else {
                    // Fallback 1: search by clientId directly (legacy)
                    const { data: fallbackWork } = await supabase.from('work_experience').select('*').eq('resume_id', clientId)
                    if (fallbackWork && fallbackWork.length > 0) {
                        allWork = fallbackWork
                    } else {
                        // Fallback 2: get the single most recent resume
                        const { data: recentResume } = await supabase.from('user_resumes')
                            .select('id')
                            .eq('user_id', clientId)
                            .order('created_at', { ascending: false })
                            .limit(1)
                            .maybeSingle()

                        if (recentResume) {
                            const { data } = await supabase.from('work_experience').select('*').eq('resume_id', recentResume.id)
                            if (data) allWork = data
                        }
                    }
                }
                const { data: edu } = await supabase.from('education').select('*').eq('user_id', clientId)
                setModuleData({ work: allWork, education: edu })
            } else if (moduleTitle === 'Accomplishment Bank & CARs') {
                const { data: cars } = await supabase.from('par_stories').select('*').eq('user_id', clientId)
                const { data: bank } = await supabase.from('accomplishment_bank').select('*').eq('user_id', clientId)
                setModuleData({ cars, bank })
            } else if (moduleTitle === 'Finalize & Adapt') {
                const { data } = await supabase
                    .from('tailored_resumes')
                    .select('*, job_description_analysis(job_description_text)')
                    .eq('user_id', clientId)
                    .order('created_at', { ascending: false })
                setModuleData(data)
            } else if (moduleTitle === 'Professional Profile') {
                const { data } = await supabase
                    .from('generated_professional_profile')
                    .select('*')
                    .eq('user_id', clientId)
                    .order('version', { ascending: false })
                    .limit(1)
                    .maybeSingle()

                setModuleData(data)
            }
        } catch (err) {
            console.error('Error loading module details:', err)
        } finally {
            setLoadingModule(false)
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
                        <ProgressTooltip>
                            <ProgressRing value={relation.progress || 0} size={80} stroke={7} color={(relation.progress || 0) > 70 ? "#22c55e" : "#0ea5e9"} />
                            <div style={{ position: "absolute", textAlign: "center" }}>
                                <div style={{ fontSize: 18, fontWeight: 900, color: "#0f172a" }}>{relation.progress || 0}%</div>
                                <div style={{ fontSize: 9, color: "#94a3b8" }}>progress</div>
                            </div>
                        </ProgressTooltip>
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
                    {/* Application & Platform Activity Summary */}
                    <div style={{ background: "#fff", borderRadius: 14, border: "1.5px solid #e8edf2", padding: "20px 22px", gridColumn: "span 2" }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <div>
                                <div style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", marginBottom: 2 }}>📈 Client Activity Overview</div>
                                <div style={{ fontSize: 12, color: "#64748b" }}>Pipeline and platform completion</div>
                            </div>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>

                            {/* App Pipeline */}
                            <div style={{ background: "#f8fafc", borderRadius: 12, padding: 14, border: '1px solid #e2e8f0' }}>
                                <div style={{ fontSize: 10, fontWeight: 800, color: "#64748b", textTransform: "uppercase", marginBottom: 8 }}>Job Applications</div>
                                <div style={{ display: "flex", gap: 8 }}>
                                    <div style={{ flex: 1, background: "#f0f9ff", borderRadius: 8, padding: '10px 8px', textAlign: "center" }}>
                                        <div style={{ fontSize: 20, fontWeight: 900, color: "#0ea5e9", lineHeight: 1 }}>{(relation as any).apps || 0}</div>
                                        <div style={{ fontSize: 9, fontWeight: 700, color: "#0369a1", textTransform: "uppercase", marginTop: 4 }}>Total Apps</div>
                                    </div>
                                    <div style={{ flex: 1, background: "#fef2f2", borderRadius: 8, padding: '10px 8px', textAlign: "center" }}>
                                        <div style={{ fontSize: 20, fontWeight: 900, color: "#ef4444", lineHeight: 1 }}>{(relation as any).rejections || 0}</div>
                                        <div style={{ fontSize: 9, fontWeight: 700, color: "#991b1b", textTransform: "uppercase", marginTop: 4 }}>Rejections</div>
                                    </div>
                                </div>
                            </div>

                            {/* Resumes */}
                            <div style={{ background: "#f8fafc", borderRadius: 12, padding: 14, border: '1px solid #e2e8f0' }}>
                                <div style={{ fontSize: 10, fontWeight: 800, color: "#64748b", textTransform: "uppercase", marginBottom: 8 }}>Resume Builder</div>
                                <div style={{ display: "flex", alignItems: 'center', gap: 12 }}>
                                    <div style={{ background: "#e0e7ff", color: "#4f46e5", height: 42, width: 42, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                                        📄
                                    </div>
                                    <div>
                                        <div style={{ fontSize: 20, fontWeight: 900, color: "#0f172a", lineHeight: 1 }}>{platformProgress?.tailoredResumesCount || 0}</div>
                                        <div style={{ fontSize: 11, fontWeight: 600, color: "#64748b", marginTop: 2 }}>Tailored Resumes</div>
                                    </div>
                                </div>
                            </div>

                            {/* Achievements */}
                            <div style={{ background: "#f8fafc", borderRadius: 12, padding: 14, border: '1px solid #e2e8f0' }}>
                                <div style={{ fontSize: 10, fontWeight: 800, color: "#64748b", textTransform: "uppercase", marginBottom: 8 }}>Accomplishments</div>
                                <div style={{ display: "flex", alignItems: 'center', gap: 12 }}>
                                    <div style={{ background: "#dcfce7", color: "#16a34a", height: 42, width: 42, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                                        🏆
                                    </div>
                                    <div>
                                        <div style={{ fontSize: 20, fontWeight: 900, color: "#0f172a", lineHeight: 1 }}>{platformProgress?.parStoriesCount || 0}</div>
                                        <div style={{ fontSize: 11, fontWeight: 600, color: "#64748b", marginTop: 2 }}>CAR Stories</div>
                                    </div>
                                </div>
                            </div>

                            {/* Career Vision Status */}
                            <div style={{ background: "#f8fafc", borderRadius: 12, padding: 14, border: '1px solid #e2e8f0' }}>
                                <div style={{ fontSize: 10, fontWeight: 800, color: "#64748b", textTransform: "uppercase", marginBottom: 8 }}>Foundation</div>
                                <div style={{ display: "flex", alignItems: 'center', gap: 12 }}>
                                    <div style={{ background: platformProgress?.careerVisionCompleted ? "#dcfce7" : platformProgress?.careerVisionStarted ? "#fef3c7" : "#f1f5f9", color: platformProgress?.careerVisionCompleted ? "#16a34a" : platformProgress?.careerVisionStarted ? "#d97706" : "#94a3b8", height: 42, width: 42, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                                        👁️
                                    </div>
                                    <div>
                                        <div style={{ fontSize: 13, fontWeight: 800, color: "#0f172a", lineHeight: 1.2 }}>Career Vision</div>
                                        <div style={{ fontSize: 11, fontWeight: 600, color: platformProgress?.careerVisionCompleted ? "#16a34a" : platformProgress?.careerVisionStarted ? "#d97706" : "#64748b", marginTop: 4 }}>
                                            {platformProgress?.careerVisionCompleted ? 'Completed' : platformProgress?.careerVisionStarted ? 'In Progress' : 'Not Started'}
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </div>
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

            {/* Platform Progress Tab */}
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
                        {!expandedModule ? (
                            <>
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
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                                    {moduleCards.map(m => (
                                        <div
                                            key={m.title}
                                            onClick={() => loadModuleDetails(m.title)}
                                            style={{
                                                background: '#fff',
                                                borderRadius: 14,
                                                border: `1.5px solid ${expandedModule === m.title ? m.color : m.completed ? m.color + '44' : '#e8edf2'}`,
                                                padding: '20px 22px',
                                                position: 'relative',
                                                overflow: 'hidden',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s',
                                                transform: expandedModule === m.title ? 'scale(1.02)' : 'none',
                                                boxShadow: expandedModule === m.title ? `0 10px 20px ${m.color}20` : 'none'
                                            }}
                                        >
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
                                            <div style={{ marginTop: 10, fontSize: 10, fontWeight: 700, color: m.color, textTransform: 'uppercase' }}>
                                                {expandedModule === m.title ? 'Hide Details ↑' : 'View Details →'}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : (
                            /* Module Detail Drill-down takeover */
                            <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #e2e8f0', padding: 24, animation: 'fadeIn 0.3s ease-out' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid #f1f5f9' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <button
                                            onClick={() => setExpandedModule(null)}
                                            style={{
                                                background: '#f1f5f9',
                                                border: 'none',
                                                color: '#64748b',
                                                cursor: 'pointer',
                                                width: 32,
                                                height: 32,
                                                borderRadius: '50%',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: 16,
                                                fontWeight: 800,
                                                transition: 'all 0.2s'
                                            }}
                                            onMouseOver={(e) => e.currentTarget.style.background = '#e2e8f0'}
                                            onMouseOut={(e) => e.currentTarget.style.background = '#f1f5f9'}
                                        >
                                            ←
                                        </button>
                                        <h3 style={{ fontSize: 20, fontWeight: 900, color: '#0f172a', margin: 0 }}>
                                            {moduleCards.find(m => m.title === expandedModule)?.icon} {expandedModule} Details
                                        </h3>
                                    </div>
                                    <button
                                        onClick={() => setExpandedModule(null)}
                                        style={{
                                            background: '#fff',
                                            border: '1.5px solid #e2e8f0',
                                            padding: '8px 16px',
                                            borderRadius: 10,
                                            color: '#64748b',
                                            fontWeight: 700,
                                            fontSize: 12,
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Back to Overview
                                    </button>
                                </div>

                                {loadingModule ? (
                                    <div style={{ padding: '40px 0', textAlign: 'center', color: '#94a3b8' }}>Loading component details...</div>
                                ) : moduleData ? (
                                    <div style={{ fontSize: 13, color: '#334155' }}>
                                        {expandedModule === 'Career Vision' && (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                                                {/* Section 1: Vision & Goals */}
                                                <div style={{ background: '#f8fafc', padding: 20, borderRadius: 14, border: '1px solid #e2e8f0' }}>
                                                    <h4 style={{ fontWeight: 800, marginBottom: 12, color: '#0f172a', fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                                                        <span style={{ fontSize: 18 }}>🧭</span> Vision & Career Goals
                                                    </h4>

                                                    {/* Sweet Spot Insight Section */}
                                                    {moduleData.sweetSpot?.length > 0 && (
                                                        <div style={{ marginBottom: 20, background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)', padding: 16, borderRadius: 12, color: '#fff', boxShadow: '0 4px 12px rgba(79, 70, 229, 0.2)' }}>
                                                            <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.9, textTransform: 'uppercase', marginBottom: 8, letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: 6 }}>
                                                                <span style={{ fontSize: 14 }}>✨</span> Professional Sweet Spot
                                                            </div>
                                                            <div style={{ fontSize: 13, lineHeight: 1.5, fontWeight: 500 }}>
                                                                {client?.full_name?.split(' ')[0] || 'Client'}'s career thrives at the intersection of <strong>{moduleData.sweetSpot.slice(0, 3).join(', ')}</strong>.
                                                                This alignment drives both technical excellence and personal fulfillment.
                                                            </div>
                                                        </div>
                                                    )}

                                                    <div style={{ marginBottom: 16 }}>
                                                        <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 6, letterSpacing: '0.5px' }}>Vision Statement</div>
                                                        <div style={{ fontSize: 14, lineHeight: 1.6, color: '#334155', background: '#fff', padding: 14, borderRadius: 10, border: '1px solid #e2e8f0' }}>
                                                            {moduleData.career_vision_statement || "No vision statement written yet."}
                                                        </div>
                                                    </div>
                                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                                        <div>
                                                            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 4 }}>Short-term Goals</div>
                                                            <div style={{ fontSize: 12, color: '#475569', background: '#fff', padding: 12, borderRadius: 10, border: '1px solid #e2e8f0' }}>
                                                                {moduleData.short_term_goals || "None defined."}
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 4 }}>Long-term Goals</div>
                                                            <div style={{ fontSize: 12, color: '#475569', background: '#fff', padding: 12, borderRadius: 10, border: '1px solid #e2e8f0' }}>
                                                                {moduleData.long_term_goals || "None defined."}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Section 2: Skills & Interests */}
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                                    <div style={{ background: '#f0f9ff', padding: 16, borderRadius: 14, border: '1px solid #bae6fd' }}>
                                                        <h4 style={{ fontWeight: 800, marginBottom: 12, color: '#0369a1', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                                                            <span>💪</span> Key Skills
                                                        </h4>
                                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                                            {moduleData.skills?.length > 0 ? moduleData.skills.map((s: string) => (
                                                                <span key={s} style={{ background: '#fff', padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 600, color: '#0ea5e9', border: '1px solid #0ea5e930', boxShadow: '0 1px 2px #00000005' }}>{s}</span>
                                                            )) : <span style={{ fontSize: 12, color: '#94a3b8' }}>No skills listed.</span>}
                                                        </div>
                                                    </div>
                                                    <div style={{ background: '#f0fdf4', padding: 16, borderRadius: 14, border: '1px solid #bbf7d0' }}>
                                                        <h4 style={{ fontWeight: 800, marginBottom: 12, color: '#15803d', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                                                            <span>❤️</span> Interests
                                                        </h4>
                                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                                            {moduleData.interests?.length > 0 ? moduleData.interests.map((i: string) => (
                                                                <span key={i} style={{ background: '#fff', padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 600, color: '#22c55e', border: '1px solid #22c55e30', boxShadow: '0 1px 2px #00000005' }}>{i}</span>
                                                            )) : <span style={{ fontSize: 12, color: '#94a3b8' }}>No interests listed.</span>}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Section 3: Job History AI Insights */}
                                                {moduleData.jobHistoryInsights && (
                                                    <div style={{ background: '#f5f3ff', padding: 20, borderRadius: 14, border: '1px solid #ddd6fe' }}>
                                                        <h4 style={{ fontWeight: 800, marginBottom: 12, color: '#6d28d9', fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                                                            <span style={{ fontSize: 18 }}>✨</span> Job History AI Analysis
                                                        </h4>
                                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                                                            <div style={{ background: '#fff', padding: 12, borderRadius: 10, border: '1px solid #ddd6fe30' }}>
                                                                <div style={{ fontSize: 11, fontWeight: 700, color: '#7c3aed', textTransform: 'uppercase', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                                                                    <span style={{ color: '#22c55e' }}>↑</span> Satisfiers
                                                                </div>
                                                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                                                    {moduleData.jobHistoryInsights.satisfiers?.slice(0, 3).map((s: string, idx: number) => (
                                                                        <div key={idx} style={{ fontSize: 12, color: '#4c1d95', display: 'flex', gap: 6 }}>
                                                                            <span style={{ color: '#ddd6fe' }}>•</span> {s}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                            <div style={{ background: '#fff', padding: 12, borderRadius: 10, border: '1px solid #ddd6fe30' }}>
                                                                <div style={{ fontSize: 11, fontWeight: 700, color: '#7c3aed', textTransform: 'uppercase', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                                                                    <span style={{ color: '#ef4444' }}>↓</span> Dissatisfiers
                                                                </div>
                                                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                                                    {moduleData.jobHistoryInsights.dissatisfiers?.slice(0, 3).map((d: string, idx: number) => (
                                                                        <div key={idx} style={{ fontSize: 12, color: '#4c1d95', display: 'flex', gap: 6 }}>
                                                                            <span style={{ color: '#ddd6fe' }}>•</span> {d}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div style={{ fontSize: 13, color: '#4c1d95', background: 'linear-gradient(to right, #fff, #f5f3ff)', padding: 14, borderRadius: 10, border: '1px solid #ddd6fe', lineHeight: 1.5 }}>
                                                            <strong style={{ color: '#7c3aed' }}>Summary Pattern:</strong> {moduleData.jobHistoryInsights.patterns}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Section 4: Work Preferences */}
                                                {moduleData.preferences && (
                                                    <div style={{ background: '#fff7ed', padding: 20, borderRadius: 14, border: '1px solid #ffedd5' }}>
                                                        <h4 style={{ fontWeight: 800, marginBottom: 12, color: '#c2410c', fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                                                            <span style={{ fontSize: 18 }}>⚙️</span> Work Preferences
                                                        </h4>
                                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
                                                            {Object.entries(moduleData.preferences)
                                                                .filter(([k, v]) => k.includes('_weight') && (v === 'M' || parseInt(v as string) >= 8))
                                                                .sort((a, b) => {
                                                                    if (a[1] === 'M') return -1;
                                                                    if (b[1] === 'M') return 1;
                                                                    return parseInt(b[1] as string) - parseInt(a[1] as string);
                                                                })
                                                                .slice(0, 6)
                                                                .map(([k, v]) => {
                                                                    const category = k.replace('_weight', '');
                                                                    const label = category.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                                                                    const pref = (moduleData.preferences as any)[`${category}_preference`];
                                                                    return (
                                                                        <div key={k} style={{ background: '#fff', padding: 14, borderRadius: 12, border: '1px solid #fed7aa60' }}>
                                                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, borderBottom: '1px solid #fff7ed', paddingBottom: 4 }}>
                                                                                <span style={{ fontSize: 11, fontWeight: 800, color: '#9a3412' }}>{label}</span>
                                                                                <span style={{ fontSize: 10, fontWeight: 900, background: v === 'M' ? '#fee2e2' : '#ffedd5', color: v === 'M' ? '#ef4444' : '#f59e0b', padding: '2px 6px', borderRadius: 6 }}>{v === 'M' ? 'MUST' : (v as React.ReactNode)}</span>
                                                                            </div>
                                                                            <div style={{ fontSize: 12, color: '#7c2d12', opacity: 0.8, lineHeight: 1.4, height: '2.8em', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any }}>{(pref as string) || "No details."}</div>
                                                                        </div>
                                                                    );
                                                                })
                                                            }
                                                        </div>
                                                        {Object.entries(moduleData.preferences).filter(([k, v]) => k.includes('_weight') && (v === 'M' || parseInt(v as string) >= 8)).length === 0 && (
                                                            <div style={{ textAlign: 'center', padding: '10px 0', color: '#9a3412', opacity: 0.5, fontSize: 12 }}>No high-priority preferences set.</div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {expandedModule === 'Work Experience & Education' && (
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }}>
                                                {/* Work Experience Section */}
                                                <div style={{ background: '#fff', padding: 20, borderRadius: 14, border: '1px solid #e2e8f0' }}>
                                                    <h4 style={{ fontWeight: 800, marginBottom: 16, color: '#0f172a', fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                                                        <span style={{ fontSize: 18 }}>💼</span> Work Experience ({moduleData.work?.length || 0})
                                                    </h4>
                                                    {moduleData.work?.length > 0 ? (
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                                            {moduleData.work.map((w: any, i: number) => (
                                                                <div key={i} style={{ padding: 14, border: '1px solid #f1f5f9', background: '#f8fafc', borderRadius: 12, transition: 'all 0.2s' }}>
                                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                                                                        <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 14 }}>{w.job_title}</div>
                                                                        <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', background: '#fff', padding: '2px 8px', borderRadius: 6, border: '1px solid #e2e8f0' }}>Role {(moduleData.work.length - i)}</div>
                                                                    </div>
                                                                    <div style={{ fontSize: 12, color: '#475569', fontWeight: 600 }}>{w.company_name}</div>
                                                                    <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>{w.start_date || w.duration} - {w.end_date || 'Present'}</div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <div style={{ textAlign: 'center', padding: '24px 0', background: '#f8fafc', borderRadius: 12, border: '1px dashed #e2e8f0' }}>
                                                            <div style={{ fontSize: 24, marginBottom: 8, opacity: 0.5 }}>📂</div>
                                                            <p style={{ color: '#94a3b8', fontSize: 12 }}>No work experience entries found.</p>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Education Section */}
                                                <div style={{ background: '#fff', padding: 20, borderRadius: 14, border: '1px solid #e2e8f0' }}>
                                                    <h4 style={{ fontWeight: 800, marginBottom: 16, color: '#0f172a', fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                                                        <span style={{ fontSize: 18 }}>🎓</span> Education ({moduleData.education?.length || 0})
                                                    </h4>
                                                    {moduleData.education?.length > 0 ? (
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                                            {moduleData.education.map((e: any, i: number) => (
                                                                <div key={i} style={{ padding: 14, border: '1px solid #f1f5f9', background: '#f8fafc', borderRadius: 12 }}>
                                                                    <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 14 }}>{e.degree}</div>
                                                                    <div style={{ fontSize: 12, color: '#475569', fontWeight: 600 }}>{e.institution}</div>
                                                                    <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>Class of {e.year}</div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <div style={{ textAlign: 'center', padding: '24px 0', background: '#f8fafc', borderRadius: 12, border: '1px dashed #e2e8f0' }}>
                                                            <div style={{ fontSize: 24, marginBottom: 8, opacity: 0.5 }}>📚</div>
                                                            <p style={{ color: '#94a3b8', fontSize: 12 }}>No education entries found.</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {expandedModule === 'Accomplishment Bank & CARs' && (() => {
                                            const cars = moduleData.cars || []
                                            const bullets = moduleData.bank || []
                                            // Distribute bank bullets evenly across stories
                                            const bulletsPerStory = cars.length > 0 ? Math.ceil(bullets.length / cars.length) : bullets.length
                                            return (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                                                    <div style={{ background: '#fff', padding: 20, borderRadius: 14, border: '1px solid #e2e8f0' }}>
                                                        <h4 style={{ fontWeight: 800, marginBottom: 16, color: '#0f172a', fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                                                            <span style={{ fontSize: 18 }}>✨</span> CAR Stories ({cars.length})
                                                            <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 600, color: '#94a3b8' }}>
                                                                🏛️ {bullets.length} Accomplishments
                                                            </span>
                                                        </h4>
                                                        {cars.length > 0 ? (
                                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                                                                {cars.map((c: any, i: number) => {
                                                                    const storyBullets = bullets.slice(i * bulletsPerStory, (i + 1) * bulletsPerStory)
                                                                    return (
                                                                        <div key={i} style={{ borderRadius: 14, border: '1px solid #e8f4ff', overflow: 'hidden' }}>
                                                                            {/* Story Header */}
                                                                            <div style={{ background: 'linear-gradient(135deg, #f0f7ff, #f8faff)', padding: '14px 18px', borderBottom: '1px solid #e8f4ff' }}>
                                                                                <div style={{ fontWeight: 800, fontSize: 14, color: '#0f172a', marginBottom: 2 }}>
                                                                                    {c.role_title ? `${c.role_title}${c.company_name ? ` @ ${c.company_name}` : ''}` : (c.role_company || `Story ${i + 1}`)}
                                                                                </div>
                                                                                <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                                                                                    {c.problem_challenge && <Badge color="#f59e0b" bg="#fef3c7">Challenge ✓</Badge>}
                                                                                    {(c.actions?.length > 0 || c.action) && <Badge color="#3b82f6" bg="#dbeafe">Action ✓</Badge>}
                                                                                    {c.result && <Badge color="#10b981" bg="#d1fae5">Result ✓</Badge>}
                                                                                </div>
                                                                            </div>
                                                                            {/* C/A/R Detail */}
                                                                            <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                                                                                {c.problem_challenge && (
                                                                                    <div>
                                                                                        <div style={{ fontSize: 10, fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', marginBottom: 4, letterSpacing: '0.5px' }}>Challenge</div>
                                                                                        <div style={{ fontSize: 12, color: '#475569', lineHeight: 1.6 }}>{c.problem_challenge}</div>
                                                                                    </div>
                                                                                )}
                                                                                {(c.actions?.filter((a: string) => a)?.length > 0) && (
                                                                                    <div>
                                                                                        <div style={{ fontSize: 10, fontWeight: 700, color: '#3b82f6', textTransform: 'uppercase', marginBottom: 4, letterSpacing: '0.5px' }}>Action</div>
                                                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                                                                            {c.actions.filter((a: string) => a).map((act: string, ai: number) => (
                                                                                                <div key={ai} style={{ fontSize: 12, color: '#475569', lineHeight: 1.6, display: 'flex', gap: 6 }}>
                                                                                                    <span style={{ color: '#3b82f6', fontWeight: 700 }}>•</span><span>{act}</span>
                                                                                                </div>
                                                                                            ))}
                                                                                        </div>
                                                                                    </div>
                                                                                )}
                                                                                {c.result && (
                                                                                    <div>
                                                                                        <div style={{ fontSize: 10, fontWeight: 700, color: '#10b981', textTransform: 'uppercase', marginBottom: 4, letterSpacing: '0.5px' }}>Result</div>
                                                                                        <div style={{ fontSize: 12, color: '#475569', lineHeight: 1.6 }}>{c.result}</div>
                                                                                    </div>
                                                                                )}
                                                                                {/* Accomplishment bullets for this story slot */}
                                                                                {storyBullets.length > 0 && (
                                                                                    <div style={{ marginTop: 6, paddingTop: 12, borderTop: '1px dashed #e2e8f0' }}>
                                                                                        <div style={{ fontSize: 10, fontWeight: 700, color: '#7c3aed', textTransform: 'uppercase', marginBottom: 8, letterSpacing: '0.5px' }}>Accomplishment Bullets</div>
                                                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                                                                            {storyBullets.map((b: any, bi: number) => (
                                                                                                <div key={bi} style={{ fontSize: 12, color: '#334155', lineHeight: 1.5, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                                                                                                    <span style={{ color: '#10b981', fontWeight: 700, flexShrink: 0 }}>•</span>
                                                                                                    <span>{b.bullet_text || b.text}</span>
                                                                                                </div>
                                                                                            ))}
                                                                                        </div>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    )
                                                                })}
                                                                {/* Remaining bullets not assigned to any story */}
                                                                {bullets.length > cars.length * bulletsPerStory && (
                                                                    <div style={{ padding: 16, background: '#faf5ff', borderRadius: 14, border: '1px solid #ede9fe' }}>
                                                                        <div style={{ fontSize: 10, fontWeight: 700, color: '#7c3aed', textTransform: 'uppercase', marginBottom: 8 }}>Additional Accomplishments</div>
                                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                                                            {bullets.slice(cars.length * bulletsPerStory).map((b: any, bi: number) => (
                                                                                <div key={bi} style={{ fontSize: 12, color: '#334155', lineHeight: 1.5, display: 'flex', gap: 8 }}>
                                                                                    <span style={{ color: '#10b981', fontWeight: 700 }}>•</span>
                                                                                    <span>{b.bullet_text || b.text}</span>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <div style={{ textAlign: 'center', padding: '24px 0', background: '#f8fafc', borderRadius: 12, border: '1px dashed #e2e8f0' }}>
                                                                <p style={{ color: '#94a3b8', fontSize: 12 }}>No CAR stories created yet.</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )
                                        })()}

                                        {expandedModule === 'Finalize & Adapt' && (() => {
                                            const resumes = Array.isArray(moduleData) ? moduleData : []
                                            const statusColors: Record<string, { color: string, bg: string }> = {
                                                found: { color: '#64748b', bg: '#f1f5f9' },
                                                tailoring: { color: '#7c3aed', bg: '#f5f3ff' },
                                                applied: { color: '#0ea5e9', bg: '#e0f2fe' },
                                                followed_up: { color: '#f59e0b', bg: '#fef3c7' },
                                                interviewing: { color: '#8b5cf6', bg: '#ede9fe' },
                                                offer: { color: '#10b981', bg: '#d1fae5' },
                                                rejected: { color: '#ef4444', bg: '#fee2e2' },
                                                draft: { color: '#94a3b8', bg: '#f8fafc' },
                                            }
                                            return (
                                                <div style={{ background: '#fff', padding: 20, borderRadius: 14, border: '1px solid #e2e8f0' }}>
                                                    <h4 style={{ fontWeight: 800, marginBottom: 16, color: '#0f172a', fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                                                        <span style={{ fontSize: 18 }}>📄</span> Tailored Resumes ({resumes.length})
                                                    </h4>
                                                    {resumes.length > 0 ? (
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                                                            {resumes.map((r: any, i: number) => {
                                                                const appStatus = r.application_status || r.status || 'found'
                                                                const sc = statusColors[appStatus] || statusColors.found
                                                                const matchColor = r.match_score > 80 ? '#22c55e' : r.match_score > 60 ? '#f59e0b' : '#ef4444'
                                                                return (
                                                                    <div key={i} style={{ borderRadius: 14, border: '1px solid #e8edf5', overflow: 'hidden' }}>
                                                                        {/* Header row */}
                                                                        <div style={{ background: 'linear-gradient(135deg, #f8faff, #f0f4ff)', padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #e8edf5' }}>
                                                                            <div>
                                                                                <div style={{ fontWeight: 800, fontSize: 14, color: '#0f172a', marginBottom: 2 }}>{r.job_title || 'Untitled Position'}</div>
                                                                                <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>{r.company_name || r.sent_to_company || '—'}</div>
                                                                            </div>
                                                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                                                {/* Application Status Badge */}
                                                                                <span style={{ fontSize: 10, fontWeight: 700, color: sc.color, background: sc.bg, padding: '3px 10px', borderRadius: 20, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                                                    {appStatus.replace('_', ' ')}
                                                                                </span>
                                                                                {/* Match Score */}
                                                                                {r.match_score > 0 && (
                                                                                    <div style={{ textAlign: 'center' }}>
                                                                                        <div style={{ fontSize: 20, fontWeight: 900, color: matchColor, lineHeight: 1 }}>{r.match_score}%</div>
                                                                                        <div style={{ fontSize: 8, color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>match</div>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                        {/* Detail rows */}
                                                                        <div style={{ padding: '12px 18px', display: 'flex', flexWrap: 'wrap', gap: 16 }}>
                                                                            {r.created_at && (
                                                                                <div style={{ minWidth: 120 }}>
                                                                                    <div style={{ fontSize: 9, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 2 }}>Created</div>
                                                                                    <div style={{ fontSize: 12, color: '#334155' }}>{new Date(r.created_at).toLocaleDateString()}</div>
                                                                                </div>
                                                                            )}
                                                                            {r.sent_at && (
                                                                                <div style={{ minWidth: 120 }}>
                                                                                    <div style={{ fontSize: 9, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 2 }}>Applied</div>
                                                                                    <div style={{ fontSize: 12, color: '#334155' }}>{new Date(r.sent_at).toLocaleDateString()}</div>
                                                                                </div>
                                                                            )}
                                                                            {r.interview_date && (
                                                                                <div style={{ minWidth: 120 }}>
                                                                                    <div style={{ fontSize: 9, fontWeight: 700, color: '#7c3aed', textTransform: 'uppercase', marginBottom: 2 }}>Interview</div>
                                                                                    <div style={{ fontSize: 12, color: '#7c3aed', fontWeight: 600 }}>{new Date(r.interview_date).toLocaleDateString()}</div>
                                                                                </div>
                                                                            )}
                                                                            {r.recruiter_contact && (
                                                                                <div style={{ minWidth: 160 }}>
                                                                                    <div style={{ fontSize: 9, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 2 }}>Recruiter</div>
                                                                                    <div style={{ fontSize: 12, color: '#334155' }}>{r.recruiter_contact}</div>
                                                                                </div>
                                                                            )}
                                                                            {r.last_status_update && (
                                                                                <div style={{ minWidth: 120 }}>
                                                                                    <div style={{ fontSize: 9, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 2 }}>Last Update</div>
                                                                                    <div style={{ fontSize: 12, color: '#334155' }}>{new Date(r.last_status_update).toLocaleDateString()}</div>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                        {/* Notes */}
                                                                        {r.notes && (
                                                                            <div style={{ padding: '0 18px 12px', borderTop: '1px dashed #e8edf5' }}>
                                                                                <div style={{ fontSize: 9, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 4, marginTop: 10 }}>Notes</div>
                                                                                <div style={{ fontSize: 12, color: '#475569', lineHeight: 1.6, fontStyle: 'italic' }}>{r.notes}</div>
                                                                            </div>
                                                                        )}
                                                                        {/* Content Toggle (JD & Resume) */}
                                                                        {(r.job_description_analysis?.job_description_text || r.tailored_profile || r.tailored_skills?.length > 0 || r.tailored_bullets?.work_experience?.length > 0) && (
                                                                            <details style={{ padding: '12px 18px', borderTop: '1px solid #e8edf5', background: '#f8fafc' }} className="group">
                                                                                <summary style={{ fontSize: 12, fontWeight: 700, color: '#4f46e5', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, listStyle: 'none' }}>
                                                                                    <svg className="w-4 h-4 transition-transform group-open:rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6" /></svg>
                                                                                    View Application Content
                                                                                </summary>
                                                                                <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 16 }}>
                                                                                    {r.job_description_analysis?.job_description_text && (
                                                                                        <div>
                                                                                            <div style={{ fontSize: 10, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: 6 }}>Job Description</div>
                                                                                            <div style={{ fontSize: 11, color: '#475569', background: '#fff', padding: 12, borderRadius: 8, border: '1px solid #e2e8f0', whiteSpace: 'pre-wrap', maxHeight: 300, overflowY: 'auto' }}>
                                                                                                {r.job_description_analysis.job_description_text}
                                                                                            </div>
                                                                                        </div>
                                                                                    )}

                                                                                    {(r.tailored_profile || r.tailored_skills?.length > 0 || r.tailored_bullets?.work_experience?.length > 0) && (
                                                                                        <div>
                                                                                            <div style={{ fontSize: 10, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: 6 }}>Tailored Resume Content</div>
                                                                                            <div style={{ fontSize: 11, color: '#0f172a', background: '#fff', padding: 18, borderRadius: 8, border: '1px solid #e2e8f0', maxHeight: 400, overflowY: 'auto' }}>

                                                                                                {/* Profile Summary */}
                                                                                                {r.tailored_profile && (
                                                                                                    <div style={{ marginBottom: 16 }}>
                                                                                                        <div style={{ fontWeight: 800, fontSize: 12, borderBottom: '1px solid #e2e8f0', paddingBottom: 4, marginBottom: 8 }}>Professional Profile</div>
                                                                                                        <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{r.tailored_profile}</div>
                                                                                                    </div>
                                                                                                )}

                                                                                                {/* Skills */}
                                                                                                {r.tailored_skills && r.tailored_skills.length > 0 && (
                                                                                                    <div style={{ marginBottom: 16 }}>
                                                                                                        <div style={{ fontWeight: 800, fontSize: 12, borderBottom: '1px solid #e2e8f0', paddingBottom: 4, marginBottom: 8 }}>Areas of Excellence</div>
                                                                                                        <div style={{ lineHeight: 1.5 }}>{r.tailored_skills.join(' • ')}</div>
                                                                                                    </div>
                                                                                                )}

                                                                                                {/* Work Experience */}
                                                                                                {r.tailored_bullets?.work_experience && r.tailored_bullets.work_experience.length > 0 && (
                                                                                                    <div style={{ marginBottom: 16 }}>
                                                                                                        <div style={{ fontWeight: 800, fontSize: 12, borderBottom: '1px solid #e2e8f0', paddingBottom: 4, marginBottom: 8 }}>Work Experience</div>
                                                                                                        {r.tailored_bullets.work_experience.map((exp: any, idx: number) => (
                                                                                                            <div key={idx} style={{ marginBottom: 12 }}>
                                                                                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                                                                                                                    <span>{exp.job_title}</span>
                                                                                                                    <span style={{ fontSize: 10, color: '#64748b' }}>
                                                                                                                        {exp.start_date || ''} - {exp.is_current ? 'Present' : (exp.end_date || '')}
                                                                                                                    </span>
                                                                                                                </div>
                                                                                                                <div style={{ fontWeight: 600, color: '#475569', marginBottom: 4 }}>{exp.company_name}</div>
                                                                                                                <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{exp.scope_description}</div>
                                                                                                            </div>
                                                                                                        ))}
                                                                                                    </div>
                                                                                                )}

                                                                                                {/* PAR Stories inside tailored_bullets */}
                                                                                                {r.tailored_bullets?.par_stories && r.tailored_bullets.par_stories.length > 0 && (
                                                                                                    <div style={{ marginBottom: 16 }}>
                                                                                                        <div style={{ fontWeight: 800, fontSize: 12, borderBottom: '1px solid #e2e8f0', paddingBottom: 4, marginBottom: 8 }}>Key Accomplishments</div>
                                                                                                        {r.tailored_bullets.par_stories.map((story: any, idx: number) => (
                                                                                                            <div key={idx} style={{ marginBottom: 12, paddingLeft: 12, borderLeft: '2px solid #e2e8f0' }}>
                                                                                                                <div style={{ marginBottom: 4 }}><strong>Challenge:</strong> {story.problem_challenge}</div>
                                                                                                                <div style={{ marginBottom: 4 }}>
                                                                                                                    <strong>Actions:</strong>
                                                                                                                    <ul style={{ margin: '4px 0 4px 20px', padding: 0 }}>
                                                                                                                        {(Array.isArray(story.actions) ? story.actions : [story.actions]).map((act: string, aIdx: number) => (
                                                                                                                            <li key={aIdx}>{act}</li>
                                                                                                                        ))}
                                                                                                                    </ul>
                                                                                                                </div>
                                                                                                                <div><strong>Result:</strong> {story.result}</div>
                                                                                                            </div>
                                                                                                        ))}
                                                                                                    </div>
                                                                                                )}

                                                                                            </div>
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            </details>
                                                                        )}
                                                                    </div>
                                                                )
                                                            })}
                                                        </div>
                                                    ) : (
                                                        <div style={{ textAlign: 'center', padding: '24px 0', background: '#f8fafc', borderRadius: 12, border: '1px dashed #e2e8f0' }}>
                                                            <p style={{ color: '#94a3b8', fontSize: 12 }}>No tailored resumes generated.</p>
                                                        </div>
                                                    )}
                                                </div>
                                            )
                                        })()}

                                        {expandedModule === 'Professional Profile' && moduleData && (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

                                                {/* Identity Sentence */}
                                                {(moduleData.output_identity_sentence || moduleData.output_blended_value_sentence) && (
                                                    <div style={{ background: '#f8fafc', padding: 20, borderRadius: 12, border: '1px solid #e2e8f0' }}>
                                                        {moduleData.output_identity_sentence && (
                                                            <div style={{ marginBottom: moduleData.output_blended_value_sentence ? 16 : 0 }}>
                                                                <div style={{ fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: 6 }}>Identity Sentence</div>
                                                                <div style={{ fontSize: 16, color: '#0f172a', fontWeight: 600, lineHeight: 1.5 }}>
                                                                    "{moduleData.output_identity_sentence}"
                                                                </div>
                                                            </div>
                                                        )}
                                                        {moduleData.output_blended_value_sentence && (
                                                            <div>
                                                                <div style={{ fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: 6 }}>Blended Value Sentence</div>
                                                                <div style={{ fontSize: 14, color: '#334155', fontWeight: 500, lineHeight: 1.5 }}>
                                                                    {moduleData.output_blended_value_sentence}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {/* Competency Paragraph & Areas of Excellence */}
                                                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: 24 }}>
                                                    {moduleData.output_competency_paragraph && (
                                                        <div>
                                                            <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', marginBottom: 10 }}>Competency Paragraph</div>
                                                            <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                                                                {moduleData.output_competency_paragraph}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {moduleData.output_areas_of_excellence && (
                                                        <div>
                                                            <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', marginBottom: 10 }}>Areas of Excellence (ATS)</div>
                                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                                                {moduleData.output_areas_of_excellence.split('|').map((area: string, i: number) => {
                                                                    const trimmed = area.trim()
                                                                    if (!trimmed) return null
                                                                    return (
                                                                        <span key={i} style={{ background: '#e0e7ff', color: '#4f46e5', padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600 }}>
                                                                            {trimmed}
                                                                        </span>
                                                                    )
                                                                })}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Skills Section */}
                                                {moduleData.output_skills_section && (
                                                    <div>
                                                        <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', marginBottom: 12, borderBottom: '1px solid #e2e8f0', paddingBottom: 8 }}>Skills & Tools</div>
                                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
                                                            {moduleData.output_skills_section.tools_platforms && moduleData.output_skills_section.tools_platforms.length > 0 && (
                                                                <div>
                                                                    <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 8 }}>Tools & Platforms</div>
                                                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                                                        {moduleData.output_skills_section.tools_platforms.map((skill: string, i: number) => (
                                                                            <span key={i} style={{ background: '#f1f5f9', color: '#475569', padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600 }}>{skill}</span>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}
                                                            {moduleData.output_skills_section.methodologies && moduleData.output_skills_section.methodologies.length > 0 && (
                                                                <div>
                                                                    <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 8 }}>Methodologies</div>
                                                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                                                        {moduleData.output_skills_section.methodologies.map((skill: string, i: number) => (
                                                                            <span key={i} style={{ background: '#f1f5f9', color: '#475569', padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600 }}>{skill}</span>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}
                                                            {moduleData.output_skills_section.languages && moduleData.output_skills_section.languages.length > 0 && (
                                                                <div>
                                                                    <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 8 }}>Languages</div>
                                                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                                                        {moduleData.output_skills_section.languages.map((skill: string, i: number) => (
                                                                            <span key={i} style={{ background: '#f1f5f9', color: '#475569', padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600 }}>{skill}</span>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}

                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div style={{ padding: '40px 0', textAlign: 'center', color: '#94a3b8' }}>No detailed data found for this module.</div>
                                )}
                            </div>
                        )}
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

// ─── SESSIONS VIEW ──────────────────────────────────────────────────────────

function SessionsView({ coachId, sessions, loadData }: { coachId: string; sessions: Session[]; loadData: () => void }) {
    const [filter, setFilter] = useState('upcoming')

    const filtered = sessions.filter(s => {
        const isPast = new Date(s.scheduled_at) < new Date()
        if (filter === 'upcoming') return !isPast && (s.status === 'scheduled' || s.status === 'in_progress')
        if (filter === 'past') return isPast || s.status === 'completed' || s.status === 'no_show'
        return true
    })

    const handleAddToCalendar = (session: Session) => {
        const startDate = new Date(session.scheduled_at)
        const duration = session.duration_minutes || 60
        const endDate = new Date(startDate.getTime() + duration * 60000)

        const event: CalendarEvent = {
            title: `Coaching Session with ${session.client_name}`,
            description: `NovaWork Global Coaching Session\nType: ${session.session_type}\nStatus: ${session.status}\nPlease connect on time.`,
            startTime: startDate,
            endTime: endDate,
            location: 'NovaWork Platform / Video Call',
            organizer: {
                name: 'NovaWork Global',
                email: 'support@novaworkglobal.com' // Placeholder email
            }
        }

        downloadICS(event, `coaching-session-${session.client_id}.ics`)
    }

    return (
        <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #e8edf2', overflow: 'hidden', boxShadow: '0 2px 12px #0000000a' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #f0f4f8', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', margin: 0 }}>Session Management</h2>
                    <p style={{ fontSize: 12, color: '#94a3b8', margin: '4px 0 0 0' }}>Schedule and track coaching calls with your clients</p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => setFilter('upcoming')} style={{ padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, border: '1px solid #e2e8f0', background: filter === 'upcoming' ? '#0f172a' : '#fff', color: filter === 'upcoming' ? '#fff' : '#64748b', cursor: 'pointer' }}>Upcoming</button>
                    <button onClick={() => setFilter('past')} style={{ padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, border: '1px solid #e2e8f0', background: filter === 'past' ? '#0f172a' : '#fff', color: filter === 'past' ? '#fff' : '#64748b', cursor: 'pointer' }}>History</button>
                </div>
            </div>
            <div style={{ padding: '12px' }}>
                {filtered.length === 0 ? (
                    <div style={{ padding: '60px 20px', textAlign: 'center' }}>
                        <Calendar size={48} color="#cbd5e1" style={{ marginBottom: 16 }} />
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>No sessions found</div>
                        <p style={{ fontSize: 12, color: '#94a3b8' }}>{filter === 'upcoming' ? "You don't have any sessions scheduled for the coming days." : "No past session history found."}</p>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 12 }}>
                        {filtered.map(s => (
                            <div key={s.id} style={{ border: '1.5px solid #f0f4f8', borderRadius: 12, padding: '16px', display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                                <div style={{ width: 44, height: 44, borderRadius: 10, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0ea5e9' }}>
                                    <Calendar size={22} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div>
                                            <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>{s.client_name}</div>
                                            <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{s.session_type}</div>
                                        </div>
                                        <Badge color={s.status === 'scheduled' ? '#0ea5e9' : s.status === 'completed' ? '#22c55e' : '#64748b'}>
                                            {s.status}
                                        </Badge>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#64748b' }}>
                                            <Clock size={12} /> {formatDate(s.scheduled_at)}
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#64748b' }}>
                                            <Sparkles size={12} /> {s.duration_minutes} min
                                        </div>
                                    </div>

                                    {/* Action Buttons for Upcoming */}
                                    {filter === 'upcoming' && (
                                        <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid #f0f4f8', display: 'flex', gap: 8 }}>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleAddToCalendar(s) }}
                                                style={{ flex: 1, padding: '8px', borderRadius: 8, fontSize: 12, fontWeight: 700, color: '#0ea5e9', background: '#eff6ff', border: '1px solid #bae6fd', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                                            >
                                                <CalendarPlus size={14} /> Add to Calendar
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

// ─── RESOURCES VIEW ─────────────────────────────────────────────────────────

function ResourcesView({ coachId }: { coachId: string }) {
    return (
        <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #e8edf2', padding: '60px 40px', textAlign: 'center' }}>
            <BookOpen size={64} color="#6366f1" style={{ marginBottom: 20, margin: '0 auto' }} />
            <h2 style={{ fontSize: 20, fontWeight: 900, color: '#0f172a', marginBottom: 8 }}>Coach Resource Library</h2>
            <p style={{ fontSize: 14, color: '#64748b', maxWidth: 450, margin: '0 auto 24px' }}>
                Store and share guides, templates, and videos with your clients. This section is currently being integrated with Supabase Storage.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
                <button style={{ padding: '10px 20px', borderRadius: 10, background: '#0f172a', color: '#fff', border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>+ Add Resource</button>
                <button style={{ padding: '10px 20px', borderRadius: 10, background: '#fff', color: '#0f172a', border: '1.5px solid #e2e8f0', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Browse Community</button>
            </div>
        </div>
    )
}

// ─── ANALYTICS VIEW ─────────────────────────────────────────────────────────

function AnalyticsView({ stats }: { stats: CoachStats }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #e8edf2', padding: '24px', boxShadow: '0 2px 10px #00000005' }}>
                    <div style={{ color: '#22c55e', marginBottom: 12 }}><TrendingUp size={24} /></div>
                    <div style={{ fontSize: 32, fontWeight: 900, color: '#0f172a' }}>{stats.placementRate}%</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#64748b', marginTop: 4 }}>Success Rate</div>
                    <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 8 }}>Clients successfully placed in new roles</div>
                </div>
                <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #e8edf2', padding: '24px', boxShadow: '0 2px 10px #00000005' }}>
                    <div style={{ color: '#0ea5e9', marginBottom: 12 }}><Clock size={24} /></div>
                    <div style={{ fontSize: 32, fontWeight: 900, color: '#0f172a' }}>{stats.totalClients * 4.2}h</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#64748b', marginTop: 4 }}>Total Coaching Time</div>
                    <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 8 }}>Estimated hours spent in direct coaching</div>
                </div>
                <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #e8edf2', padding: '24px', boxShadow: '0 2px 10px #00000005' }}>
                    <div style={{ color: '#8b5cf6', marginBottom: 12 }}><Briefcase size={24} /></div>
                    <div style={{ fontSize: 32, fontWeight: 900, color: '#0f172a' }}>{stats.totalClients}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#64748b', marginTop: 4 }}>Impacted Careers</div>
                    <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 8 }}>Total unique clients coached to date</div>
                </div>
            </div>

            <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #e8edf2', padding: '32px', textAlign: 'center' }}>
                <BarChart3 size={48} color="#94a3b8" style={{ marginBottom: 16, margin: '0 auto' }} />
                <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>Engagement Analytics</h3>
                <p style={{ fontSize: 13, color: '#64748b' }}>Advanced charting showing client engagement trends and session distribution will appear here.</p>
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
    const [stats, setStats] = useState<CoachStats>({
        totalClients: 0, activeClients: 0, upcomingSessions: 0, pendingCommitments: 0,
        activeGoals: 0, unreadMessages: 0, placementRate: 0, totalApps: 0, totalRejections: 0, totalResumes: 0
    })
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
                // Fetch extra details for each client
                const enhancedClients = await Promise.all(clientRelations.map(async (rel) => {
                    // Get Applications count from tailored_resumes (synced with Job Tracker)
                    const { count: appsCount } = await supabase
                        .from('tailored_resumes')
                        .select('*', { count: 'exact', head: true })
                        .eq('user_id', rel.client_id)
                        .neq('application_status', 'draft')

                    // Get Rejections count from tailored_resumes
                    const { count: rejCount } = await supabase
                        .from('tailored_resumes')
                        .select('*', { count: 'exact', head: true })
                        .eq('user_id', rel.client_id)
                        .eq('application_status', 'rejected')

                    // Get Resumes count
                    const { count: resCount } = await supabase
                        .from('user_resumes')
                        .select('*', { count: 'exact', head: true })
                        .eq('user_id', rel.client_id)

                    // Get other platform progress components
                    const { count: workCount } = await supabase
                        .from('work_experience')
                        .select('*', { count: 'exact', head: true })
                        .in('resume_id', (await supabase.from('user_resumes').select('id').eq('user_id', rel.client_id)).data?.map(r => r.id) || [])

                    const { count: carCount } = await supabase
                        .from('par_stories')
                        .select('*', { count: 'exact', head: true })
                        .eq('user_id', rel.client_id)

                    const { data: visionProfile } = await supabase
                        .from('career_vision_profiles')
                        .select('career_vision_statement')
                        .eq('user_id', rel.client_id)
                        .maybeSingle()

                    const { data: questProfile } = await supabase
                        .from('positioning_questionnaire')
                        .select('id')
                        .eq('user_id', rel.client_id)
                        .maybeSingle()

                    // Calculate Platform Progress Score (0-100)
                    const platformScore = Math.min(100, Math.round(
                        (visionProfile?.career_vision_statement ? 20 : 0) +
                        (workCount && workCount > 0 ? 20 : 0) +
                        (carCount && carCount >= 3 ? 20 : carCount ? 10 : 0) +
                        (questProfile ? 20 : 0) +
                        (appsCount && appsCount > 0 ? 20 : 0)
                    ))

                    // Get alerts
                    const { data: noteAlert } = await supabase
                        .from('coaching_notes')
                        .select('content')
                        .eq('coach_client_id', rel.id)
                        .eq('is_flagged', true)
                        .limit(1)

                    return {
                        ...rel,
                        apps: appsCount || 0,
                        rejections: rejCount || 0,
                        resumes: resCount || 0,
                        progress: platformScore,
                        alert: noteAlert?.[0]?.content || null
                    }
                }))

                setClients(enhancedClients)

                const activeClients = clientRelations.filter(c => c.status === 'active')
                const completedClients = clientRelations.filter(c => c.status === 'completed')

                // Load upcoming sessions
                const { data: sessionsData } = await supabase
                    .from('coaching_sessions')
                    .select('*')
                    .eq('coach_id', authUser.id)
                    .order('scheduled_at', { ascending: true })

                if (sessionsData) {
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

                const totalApps = enhancedClients.reduce((acc, c) => acc + (c.apps || 0), 0)
                const totalRejections = enhancedClients.reduce((acc, c) => acc + (c.rejections || 0), 0)
                const totalResumes = enhancedClients.reduce((acc, c) => acc + (c.resumes || 0), 0)

                setStats({
                    totalClients: clientRelations.length,
                    activeClients: activeClients.length,
                    upcomingSessions: sessionsData?.filter(s => s.status === 'scheduled').length || 0,
                    pendingCommitments: pendingCount || 0,
                    activeGoals: goalsCount || 0,
                    unreadMessages: msgCount || 0,
                    placementRate,
                    totalApps,
                    totalRejections,
                    totalResumes,
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
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
            </div>
        )
    }

    const navItems = [
        { id: "overview", icon: <LayoutDashboard size={18} />, label: "Dashboard" },
        { id: "pipeline", icon: <Navigation size={18} />, label: "Pipeline" },
        { id: "sessions", icon: <Calendar size={18} />, label: "Sessions" },
        { id: "resources", icon: <BookOpen size={18} />, label: "Resources" },
        { id: "analytics", icon: <BarChart3 size={18} />, label: "Analytics" },
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
                                <button style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "8px 12px", cursor: "pointer", fontSize: 16 }}><AlertCircle size={18} /></button>
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
                    {view === "sessions" && (
                        <SessionsView
                            coachId={user?.id}
                            sessions={sessions}
                            loadData={loadCoachData}
                        />
                    )}
                    {view === "resources" && <ResourcesView coachId={user?.id} />}
                    {view === "analytics" && <AnalyticsView stats={stats} />}
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
