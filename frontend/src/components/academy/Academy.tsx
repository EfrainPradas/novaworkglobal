import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../../lib/supabase'
import MediaPlayerModal from './MediaPlayerModal'
import {
  Brain,
  FileText,
  FileDown,
  MessageCircle,
  Briefcase,
  Network,
  DollarSign,
  CheckCircle,
  ChevronDown,
  Play,
  Headphones,
  FileBadge,
  Clock,
  Search,
  Bell,
  Settings,
  GitBranch,
  BookOpen,
  FlaskConical,
  Archive,
  Users,
  HelpCircle,
  LogOut,
  Plus,
  Sparkles,
  ArrowLeft
} from 'lucide-react'
import type { AcademyNode, Resource } from '../../types/academy'

/* ── Framer Motion Variants ── */
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.15 }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 120, damping: 16 }
  }
}

/* ── SVG Progress Ring ── */
const ProgressRing: React.FC<{ percent: number; size?: number; stroke?: number }> = ({
  percent,
  size = 80,
  stroke = 6
}) => {
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (percent / 100) * circumference

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <defs>
        <linearGradient id="progressGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6366F1" />
          <stop offset="100%" stopColor="#A855F7" />
        </linearGradient>
      </defs>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#E2E8F0"
        strokeWidth={stroke}
      />
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="url(#progressGrad)"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circumference}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1.2, delay: 0.4, ease: 'easeOut' }}
      />
    </svg>
  )
}

/* ── Module Card (compact, for grid layout) ── */
interface ModuleCardProps {
  node: AcademyNode
  resources: Resource[]
  onResourceClick: (resource: Resource) => void
  isExpanded: boolean
  onToggle: () => void
}

const formatDuration = (minutes?: number) => {
  if (!minutes) return ''
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours}h ${mins}m`
}

// Cleans raw filenames: removes extension, replaces _ and - with spaces, trims
const cleanTitle = (title: string) => {
  if (!title) return 'Untitled Resource'
  return title
    .replace(/\.[^/.]+$/, '')       // remove extension
    .replace(/[_-]+/g, ' ')         // underscores/dashes → spaces
    .replace(/\s+/g, ' ')           // collapse multiple spaces
    .trim()
}

const getModuleIcon = (iconName: string | undefined) => {
  switch (iconName) {
    case 'file-text': return FileText
    case 'users': return MessageCircle
    case 'briefcase': return Briefcase
    case 'network': return Network
    case 'dollar-sign': return DollarSign
    default: return FileText
  }
}

const ModuleCard: React.FC<ModuleCardProps> = ({ node, resources, onResourceClick, isExpanded, onToggle }) => {
  const { t } = useTranslation()
  const Icon = getModuleIcon(node.icon)
  const completedCount = resources.filter(r => r.status === 'completed').length
  const progress = resources.length > 0 ? Math.round((completedCount / resources.length) * 100) : 0

  return (
    <motion.div
      variants={itemVariants}
      whileHover={{ y: -4, transition: { type: 'spring', stiffness: 400, damping: 25 } }}
      className="relative rounded-2xl bg-white border border-slate-200/60 shadow-md hover:shadow-xl transition-shadow duration-300 flex flex-col"
      style={{ overflow: 'visible' }}
    >
      {/* Gradient top accent */}
      <div
        className="h-[3px] w-full rounded-t-2xl"
        style={{ background: `linear-gradient(to right, ${node.color}, ${node.color}88)` }}
      />

      {/* Card Content */}
      <div
        onClick={onToggle}
        className="p-5 cursor-pointer hover:bg-slate-50/40 transition-colors flex-1 flex flex-col"
      >
        {/* Icon + Progress */}
        <div className="flex items-start justify-between mb-4">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center shadow-sm"
            style={{ backgroundColor: `${node.color}12`, border: `1px solid ${node.color}20` }}
          >
            <Icon size={24} style={{ color: node.color }} />
          </div>
          <span className="text-xl font-bold" style={{ color: node.color }}>{progress}%</span>
        </div>

        {/* Title */}
        <h3 className="text-base font-bold text-slate-900 mb-1">{node.label || t(node.label_key)}</h3>
        <p className="text-xs text-slate-400 mb-4">
          {resources.length} resources · {completedCount} completed
        </p>

        {/* Progress Bar */}
        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mt-auto">
          <motion.div
            className="h-full rounded-full"
            style={{ background: `linear-gradient(to right, ${node.color}, ${node.color}bb)` }}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>

        {/* Expand hint */}
        <div className="flex items-center justify-center mt-3">
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.25 }}
          >
            <ChevronDown size={16} className="text-slate-300" />
          </motion.div>
        </div>
      </div>

      {/* Resources List (expands below) */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            style={{ overflow: 'visible' }}
          >
            <div className="border-t border-slate-100 bg-gradient-to-b from-slate-50/80 to-white">
              {resources.length === 0 ? (
                <div className="p-6 text-center">
                  <BookOpen size={24} className="text-slate-300 mx-auto mb-2" />
                  <p className="text-slate-400 text-sm font-medium">Coming soon</p>
                  <p className="text-slate-300 text-xs mt-0.5">New content is being prepared for this module.</p>
                </div>
              ) : (
                <div className="p-3 space-y-1.5">
                  {resources.map((resource, idx) => (
                    <motion.div
                      key={resource.id}
                      className="relative group/tip"
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.04 }}
                    >
                      {/* Elegant Tooltip */}
                      <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50
                        opacity-0 group-hover/tip:opacity-100 translate-y-1 group-hover/tip:translate-y-0
                        transition-all duration-200 ease-out"
                      >
                        <div className="bg-slate-900/95 backdrop-blur-sm text-white text-xs font-medium
                          px-3 py-1.5 rounded-lg shadow-xl shadow-black/20 whitespace-nowrap max-w-[240px] truncate"
                        >
                          {cleanTitle(resource.title)}
                          {resource.durationMinutes && (
                            <span className="ml-2 text-slate-400">· {formatDuration(resource.durationMinutes)}</span>
                          )}
                        </div>
                        {/* Arrow */}
                        <div className="flex justify-center">
                          <div className="w-2 h-2 bg-slate-900/95 rotate-45 -mt-1" />
                        </div>
                      </div>

                      <button
                        onClick={(e) => { e.stopPropagation(); onResourceClick(resource) }}
                        className="w-full flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-200/60 hover:border-indigo-200 hover:shadow-md transition-all text-left group"
                      >
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          resource.type === 'video' ? 'bg-rose-50 ring-1 ring-rose-200/50' :
                          resource.type === 'audio' ? 'bg-purple-50 ring-1 ring-purple-200/50' :
                          resource.type === 'document' ? 'bg-amber-50 ring-1 ring-amber-200/50' :
                          'bg-blue-50 ring-1 ring-blue-200/50'
                        }`}>
                          {resource.type === 'video' && <Play size={15} className="text-rose-500" />}
                          {resource.type === 'audio' && <Headphones size={15} className="text-purple-500" />}
                          {resource.type === 'document' && <FileDown size={15} className="text-amber-600" />}
                          {resource.type === 'article' && <FileBadge size={15} className="text-blue-500" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors text-xs truncate">
                            {cleanTitle(resource.title)}
                          </h4>
                          {resource.description && resource.description !== resource.title && (
                            <p className="text-[11px] text-slate-400 line-clamp-1">
                              {resource.description}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {resource.durationMinutes && (
                            <span className="text-[11px] text-slate-400">{formatDuration(resource.durationMinutes)}</span>
                          )}
                          {resource.status === 'completed' && (
                            <CheckCircle size={14} className="text-emerald-500" />
                          )}
                        </div>
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

/* ── Main Academy Component ── */
const Academy: React.FC<{ onOpenAdmin?: () => void; onNewNode?: () => void }> = ({ onOpenAdmin, onNewNode }) => {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null)
  const [nodes, setNodes] = useState<AcademyNode[]>([])
  const [resources, setResources] = useState<Resource[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set())
  const [userEmail, setUserEmail] = useState<string | null>(null)

  const ADMIN_EMAIL = 'efrain.pradas@gmail.com'

  useEffect(() => {
    const loadData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          setUserEmail(user.email)

          const [nodesRes, resourcesRes, progressRes] = await Promise.all([
            supabase.from('academy_nodes').select('*').eq('level', 2).order('sort_order'),
            supabase.from('academy_resources').select('*'),
            supabase.from('user_learning_progress').select('*')
          ])

          if (nodesRes.data) setNodes(nodesRes.data)
          if (resourcesRes.data) {
            const mapped = resourcesRes.data.map(r => ({
              id: r.id,
              topicId: r.topic_id,
              type: r.type,
              language: r.language || 'en',
              title: r.title,
              description: r.description || '',
              url: r.url,
              durationMinutes: r.duration_minutes,
              progress: progressRes.data?.find(p => p.resource_id === r.id)?.progress_percent,
              status: progressRes.data?.find(p => p.resource_id === r.id)?.status,
            }))
            setResources(mapped)

            if (nodesRes.data && nodesRes.data.length > 0) {
              setExpandedModules(new Set([nodesRes.data[0].id]))
            }
          }
        }
      } catch (error) {
        console.error('Error loading academy data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  const handleResourceClick = (resource: Resource) => {
    setSelectedResource(resource)
  }

  const toggleModule = (nodeId: string) => {
    setExpandedModules(prev => {
      const next = new Set(prev)
      if (next.has(nodeId)) {
        next.delete(nodeId)
      } else {
        next.add(nodeId)
      }
      return next
    })
  }

  const currentLang = i18n.language?.split('-')[0] || 'en'

  const getResourcesForModule = (moduleId: string) => {
    const byLang = resources.filter(r => r.topicId === moduleId && r.language === currentLang)
    // Fallback: if no resources in current language, show all resources for that module
    return byLang.length > 0 ? byLang : resources.filter(r => r.topicId === moduleId)
  }

  const resourcesForCurrentLang = resources.filter(r => r.language === currentLang)
  // Fallback for total progress: use all resources if none match current language
  const resourcesForProgress = resourcesForCurrentLang.length > 0 ? resourcesForCurrentLang : resources
  const totalCompleted = resourcesForProgress.filter(r => r.status === 'completed').length
  const totalProgress = resourcesForProgress.length > 0
    ? Math.round((totalCompleted / resourcesForProgress.length) * 100)
    : 0

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500 text-sm">Loading Academy...</p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen overflow-hidden flex flex-col" style={{ background: 'linear-gradient(135deg, #F8FAFC 0%, #FFFFFF 40%, #EEF2FF 100%)' }}>
      {/* Top NavBar */}
      <header className="bg-white/70 backdrop-blur-xl border-b border-slate-200/40 px-8 py-3 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-full px-3 py-1.5 text-sm transition-colors"
          >
            <ArrowLeft size={16} />
            <span className="hidden sm:inline">Back</span>
          </button>
          <span className="text-xl font-bold bg-gradient-to-r from-indigo-700 to-violet-600 bg-clip-text text-transparent">
            NovaNext Academy
          </span>
          <nav className="hidden md:flex gap-1 ml-8">
            <a className="text-indigo-700 bg-indigo-50 rounded-full px-4 py-1.5 text-sm font-medium" href="#">Explorer</a>
            <a className="text-slate-500 hover:text-indigo-600 hover:bg-slate-50 rounded-full px-4 py-1.5 text-sm transition-colors" href="#">Collections</a>
            <a className="text-slate-500 hover:text-indigo-600 hover:bg-slate-50 rounded-full px-4 py-1.5 text-sm transition-colors" href="#">Network</a>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
            <input
              className="bg-slate-100/80 border border-slate-200/50 rounded-full pl-9 pr-4 py-1.5 text-xs w-56 focus:ring-2 focus:ring-indigo-400 focus:bg-white transition-all"
              placeholder="Search knowledge..."
              type="text"
            />
          </div>
          <button className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <Bell size={18} className="text-slate-400" />
          </button>
          <button className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <Settings size={18} className="text-slate-400" />
          </button>
          <img
            alt="User"
            className="w-8 h-8 rounded-full ring-2 ring-indigo-100 ring-offset-1"
            src="https://ui-avatars.com/api/?name=User&background=6366f1&color=fff"
          />
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 bg-white/80 backdrop-blur-sm border-r border-slate-200/40 flex flex-col py-6 px-3 fixed left-0 top-[57px] bottom-0">
          <div className="mb-8 px-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md shadow-indigo-500/20">N</div>
              <div>
                <h2 className="font-bold text-slate-900 leading-tight">NovaNext</h2>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest">The Living Archive</p>
              </div>
            </div>
          </div>

          <nav className="flex flex-col gap-0.5 flex-1">
            {[
              { icon: GitBranch, label: 'My Canvas', active: true },
              { icon: BookOpen, label: 'Library', active: false },
              { icon: FlaskConical, label: 'Research Labs', active: false },
              { icon: Archive, label: 'Archives', active: false },
              { icon: Users, label: 'Collaboration', active: false },
            ].map((item) => (
              <a
                key={item.label}
                className={`flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm transition-all duration-200 ${
                  item.active
                    ? 'bg-gradient-to-r from-indigo-50 to-violet-50 text-indigo-700 font-semibold shadow-sm shadow-indigo-500/5'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700 hover:translate-x-0.5'
                }`}
                href="#"
              >
                <item.icon size={18} />
                <span>{item.label}</span>
              </a>
            ))}
          </nav>

          <div className="mt-auto pt-5 flex flex-col gap-0.5">
            <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent mb-3" />
            {userEmail === ADMIN_EMAIL && (
              <button
                onClick={onOpenAdmin}
                className="flex items-center gap-3 text-slate-500 px-4 py-2 hover:bg-slate-50 rounded-xl text-sm transition-colors"
              >
                <Settings size={16} />
                <span>Admin Panel</span>
              </button>
            )}
            <button
              onClick={onNewNode}
              className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl py-2.5 px-4 font-semibold text-sm flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-indigo-500/25 transition-all active:scale-[0.98]"
            >
              <Plus size={16} />
              <span>New Node</span>
            </button>
            <a className="flex items-center gap-3 text-slate-500 px-4 py-2 hover:bg-slate-50 rounded-xl text-sm transition-colors" href="#">
              <HelpCircle size={16} />
              <span>Help Center</span>
            </a>
            <a className="flex items-center gap-3 text-slate-500 px-4 py-2 hover:bg-slate-50 rounded-xl text-sm transition-colors" href="#">
              <LogOut size={16} />
              <span>Logout</span>
            </a>
          </div>
        </aside>

        {/* Main Content */}
        <main
          className="ml-64 flex-1 overflow-auto p-10"
          style={{
            backgroundImage: 'radial-gradient(circle, #E2E8F0 0.5px, transparent 0.5px)',
            backgroundSize: '28px 28px',
          }}
        >
          <motion.div
            className="max-w-4xl mx-auto"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* ── Learning Map Hero (compact) ── */}
            <motion.div variants={itemVariants} className="mb-8">
              <div className="relative rounded-2xl overflow-hidden shadow-lg shadow-indigo-500/10">
                {/* Gradient background */}
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700" />

                {/* Content */}
                <div className="relative z-10 px-8 py-7 flex items-center justify-between">
                  <div className="flex items-center gap-5">
                    <div className="w-12 h-12 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                      <Sparkles size={22} className="text-amber-300" />
                    </div>
                    <div>
                      <h1 className="text-xl font-bold text-white" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                        Learning Map
                      </h1>
                      <p className="text-white/60 text-xs mt-0.5">
                        Your personalized journey through career knowledge.
                      </p>
                    </div>
                  </div>
                  {resourcesForCurrentLang.length > 0 && totalCompleted === 0 ? (
                    <button
                      onClick={() => {
                        const firstNodeWithResources = nodes.find(n => getResourcesForModule(n.id).length > 0)
                        if (firstNodeWithResources) {
                          setExpandedModules(new Set([firstNodeWithResources.id]))
                          document.getElementById('module-grid')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                        }
                      }}
                      className="flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white text-sm font-semibold rounded-xl px-5 py-2.5 transition-all"
                    >
                      Start your first lesson
                      <Play size={14} />
                    </button>
                  ) : (
                    <Brain className="text-white/10 flex-shrink-0" size={56} />
                  )}
                </div>
              </div>
            </motion.div>

            {/* ── Progress Overview ── */}
            <motion.div
              variants={itemVariants}
              className="rounded-2xl border border-slate-200/60 p-6 mb-8 shadow-sm"
              style={{ background: 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)' }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Academy Milestone</p>
                  <h3 className="text-2xl font-bold text-slate-900">Total Progress</h3>
                  {resourcesForCurrentLang.length > 0 ? (
                    <div className="flex items-center gap-3 mt-3">
                      <div className="w-40 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full rounded-full"
                          style={{ background: 'linear-gradient(to right, #6366F1, #A855F7)' }}
                          initial={{ width: 0 }}
                          animate={{ width: `${totalProgress}%` }}
                          transition={{ duration: 1, delay: 0.3, ease: 'easeOut' }}
                        />
                      </div>
                      <span className="text-xs text-slate-400">{totalCompleted} of {resourcesForCurrentLang.length} resources</span>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 mt-2">Explore the modules below to start learning.</p>
                  )}
                </div>
                {resourcesForCurrentLang.length > 0 ? (
                  <div className="relative flex items-center justify-center">
                    <ProgressRing percent={totalProgress} size={88} stroke={7} />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <span className="text-2xl font-bold text-slate-800">{totalProgress}</span>
                        <span className="text-xs text-slate-400 block -mt-0.5">%</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center">
                    <BookOpen size={28} className="text-indigo-300" />
                  </div>
                )}
              </div>
            </motion.div>

            {/* ── Module Cards (horizontal grid) ── */}
            <motion.div id="module-grid" variants={containerVariants} className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {nodes.map((node) => (
                <ModuleCard
                  key={node.id}
                  node={node}
                  resources={getResourcesForModule(node.id)}
                  onResourceClick={handleResourceClick}
                  isExpanded={expandedModules.has(node.id)}
                  onToggle={() => toggleModule(node.id)}
                />
              ))}
            </motion.div>
          </motion.div>
        </main>
      </div>

      {/* Media Player Modal */}
      <MediaPlayerModal
        resource={selectedResource}
        onClose={() => setSelectedResource(null)}
      />
    </div>
  )
}

export default Academy
