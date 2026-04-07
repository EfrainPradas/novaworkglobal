import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../../lib/supabase'
import MindMapNode from './MindMapNode'
import MindMapEdges from './MindMapEdges'
import RightPanel from './RightPanel'
import MediaPlayerModal from './MediaPlayerModal'
import { GraduationCap, Video, Headphones, FileText, BookOpen } from 'lucide-react'
import type { 
  AcademyNode, 
  AcademyResource, 
  UserLearningProgress,
  NodeState, 
  Resource,
  LearningStatus
} from '../../types/academy'

const ROOT_NODE_ID = '00000000-0000-0000-0000-000000000001'

const MindMap: React.FC = () => {
  const { t, i18n } = useTranslation()
  const currentLang = i18n.language || 'en'
  
  const [userId, setUserId] = useState<string | null>(null)
  
  const [nodes, setNodes] = useState<AcademyNode[]>([])
  const [nodeStates, setNodeStates] = useState<Record<string, NodeState>>({})
  const [selectedNode, setSelectedNode] = useState<AcademyNode | null>(null)
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null)
  const [resources, setResources] = useState<Resource[]>([])
  const [learningProgress, setLearningProgress] = useState<Record<string, UserLearningProgress>>({})
  const [isDragging, setIsDragging] = useState(false)
  const [isPanelOpen, setIsPanelOpen] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id)
    })
  }, [])

  useEffect(() => {
    const loadData = async () => {
      try {
        const { data: nodesData, error: nodesError } = await supabase
          .from('academy_nodes')
          .select('*')
          .order('level', { ascending: true })
          .order('sort_order', { ascending: true })

        if (nodesError) throw nodesError
        setNodes(nodesData || [])

        const { data: resourcesData } = await supabase
          .from('academy_resources')
          .select('*')
          .order('sort_order', { ascending: true })

        let layoutsData: any[] = []
        let stateData: any = null
        let progressData: any[] = []

        if (userId) {
          try {
            const layouts = await supabase
              .from('user_node_layouts')
              .select('*')
              .eq('user_id', userId)
            if (!layouts.error) layoutsData = layouts.data || []
          } catch (e) { console.warn('Layouts query failed:', e) }

          try {
            const state = await supabase
              .from('user_academy_state')
              .select('*')
              .eq('user_id', userId)
              .single()
            if (!state.error) stateData = state.data
          } catch (e) { console.warn('State query failed:', e) }

          try {
            const progress = await supabase
              .from('user_learning_progress')
              .select('*')
              .eq('user_id', userId)
            if (!progress.error) progressData = progress.data || []
          } catch (e) { console.warn('Progress query failed:', e) }
        }

        const initialStates: Record<string, NodeState> = {}
        nodesData?.forEach((node) => {
          const layout = layoutsData?.find((l: any) => l.node_id === node.id)
          initialStates[node.id] = {
            id: node.id,
            x: layout?.x ?? node.default_x,
            y: layout?.y ?? node.default_y,
            isExpanded: layout?.is_expanded ?? false,
            isSelected: false,
            children: nodesData?.filter((n) => n.parent_id === node.id).map((n) => n.id) || [],
          }
        })
        
        setNodeStates(initialStates)
        setLearningProgress(
          progressData?.reduce((acc, p) => ({ ...acc, [p.resource_id]: p }), {}) || {}
        )

        if (stateData?.selected_topic_id) {
          const topicNode = nodesData?.find((n) => n.id === stateData.selected_topic_id)
          if (topicNode) {
            setSelectedTopicId(stateData.selected_topic_id)
            setSelectedNode(topicNode)
            loadTopicResources(topicNode.id, resourcesData || [])
          }
        }

      } catch (error) {
        console.error('Error loading academy data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [userId])

  const loadTopicResources = useCallback(async (topicId: string, staticResources?: AcademyResource[]) => {
    try {
      if (staticResources) {
        const topicResources = staticResources.filter(
          (r) => r.topic_id === topicId && r.language === currentLang
        )
        const mapped = topicResources.map((r) => ({
          id: r.id,
          topicId: r.topic_id,
          type: r.type,
          title: r.title,
          description: r.description || '',
          url: r.url,
          durationMinutes: r.duration_minutes,
          thumbnail: r.thumbnail,
          progress: learningProgress[r.id]?.progress_percent,
          status: learningProgress[r.id]?.status,
          lastViewedAt: learningProgress[r.id]?.last_viewed_at,
        }))
        setResources(mapped)
      }
    } catch (error) {
      console.error('Error loading resources:', error)
    }
  }, [learningProgress, currentLang])

  useEffect(() => {
    if (selectedTopicId) {
      loadTopicResources(selectedTopicId)
    }
  }, [learningProgress, selectedTopicId, loadTopicResources])

  const visibleNodes = useMemo(() => {
    return nodes.filter((node) => {
      if (node.level === 1) return true
      if (node.level === 2) {
        const rootState = nodeStates[ROOT_NODE_ID]
        return rootState?.isExpanded
      }
      if (node.level === 3) {
        const rootState = nodeStates[ROOT_NODE_ID]
        if (!rootState?.isExpanded) return false
        const parentState = nodeStates[node.parent_id || '']
        return parentState?.isExpanded
      }
      return false
    })
  }, [nodes, nodeStates])

  const edges = useMemo(() => {
    return visibleNodes.flatMap((node) => {
      if (!node.parent_id) return []
      const parent = nodeStates[node.parent_id]
      if (!parent) return []
      return [{
        from: node.parent_id,
        to: node.id,
        fromX: parent.x,
        fromY: parent.y,
        toX: nodeStates[node.id]?.x ?? node.default_x,
        toY: nodeStates[node.id]?.y ?? node.default_y,
      }]
    })
  }, [visibleNodes, nodeStates])

  const handlePositionChange = useCallback((nodeId: string, x: number, y: number) => {
    setNodeStates((prev) => ({
      ...prev,
      [nodeId]: {
        ...prev[nodeId],
        x,
        y,
      },
    }))
  }, [])

  const handleNodeClick = useCallback((node: AcademyNode) => {
    if (node.type === 'topic') {
      const newExpanded = !nodeStates[node.id]?.isExpanded
      setNodeStates((prev) => ({
        ...prev,
        [node.id]: {
          ...prev[node.id],
          isExpanded: newExpanded,
        },
      }))
      if (newExpanded) {
        setSelectedNode(node)
        setSelectedTopicId(node.id)
        saveUserState(node.id)
      }
    } else if (node.type === 'resource') {
      const parentNode = nodes.find(n => n.id === node.parent_id)
      if (parentNode) {
        setSelectedNode(parentNode)
        setSelectedTopicId(parentNode.id)
      }
    }
  }, [nodeStates, nodes])

  const handleDragEnd = useCallback(async () => {
    setIsDragging(false)
    
    const savePromises = Object.entries(nodeStates).map(([nodeId, state]) => {
      return saveNodeLayout(nodeId, state)
    })
    
    await Promise.all(savePromises)
  }, [nodeStates])

  const saveNodeLayout = async (nodeId: string, state: NodeState) => {
    try {
      await supabase
        .from('user_node_layouts')
        .upsert({
          user_id: userId,
          node_id: nodeId,
          x: state.x,
          y: state.y,
          is_expanded: state.isExpanded,
          updated_at: new Date().toISOString(),
        })
    } catch (error) {
      console.error('Error saving node layout:', error)
    }
  }

  const saveUserState = async (topicId: string) => {
    try {
      await supabase
        .from('user_academy_state')
        .upsert({
          user_id: userId,
          selected_topic_id: topicId,
          selected_node_id: topicId,
          updated_at: new Date().toISOString(),
        })
    } catch (error) {
      console.error('Error saving user state:', error)
    }
  }

  const handleProgressUpdate = async (
    resourceId: string,
    status: LearningStatus,
    progress: number
  ) => {
    try {
      await supabase
        .from('user_learning_progress')
        .upsert({
          user_id: userId,
          resource_id: resourceId,
          topic_id: selectedTopicId,
          status,
          progress_percent: progress,
          last_viewed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })

      setLearningProgress((prev) => ({
        ...prev,
        [resourceId]: {
          ...prev[resourceId],
          status,
          progress_percent: progress,
          last_viewed_at: new Date().toISOString(),
        },
      }))
    } catch (error) {
      console.error('Error updating progress:', error)
    }
  }

  const handleResourceClick = useCallback((resource: Resource) => {
    if (resource.progress === undefined || resource.progress === 0) {
      handleProgressUpdate(resource.id, 'in_progress', 10)
    }
    setSelectedResource(resource)
  }, [handleProgressUpdate])

  const continueLearningResource = useMemo(() => {
    const inProgressResources = resources.filter(
      (r) => r.progress !== undefined && r.progress > 0 && r.progress < 100
    )
    if (inProgressResources.length > 0) {
      return inProgressResources.sort(
        (a, b) => (b.progress || 0) - (a.progress || 0)
      )[0]
    }
    return undefined
  }, [resources])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 text-sm">{t('common.loading')}</p>
        </div>
      </div>
    )
  }

  const placeholderNodes: AcademyNode[] = nodes.length > 0 ? [] : [
    { id: 'root', parent_id: null, level: 1, label_key: 'academy.title', type: 'root', default_x: 400, default_y: 400, icon: 'graduation-cap', color: '#10B981' },
    { id: 'resume', parent_id: 'root', level: 2, label_key: 'topics.resume', type: 'topic', default_x: 150, default_y: 150, icon: 'file-text', color: '#3B82F6' },
    { id: 'interview', parent_id: 'root', level: 2, label_key: 'topics.interview', type: 'topic', default_x: 400, default_y: 100, icon: 'users', color: '#8B5CF6' },
    { id: 'jobsearch', parent_id: 'root', level: 2, label_key: 'topics.jobSearch', type: 'topic', default_x: 650, default_y: 150, icon: 'briefcase', color: '#F59E0B' },
    { id: 'networking', parent_id: 'root', level: 2, label_key: 'topics.networking', type: 'topic', default_x: 150, default_y: 650, icon: 'network', color: '#EC4899' },
    { id: 'salary', parent_id: 'root', level: 2, label_key: 'topics.salary', type: 'topic', default_x: 650, default_y: 650, icon: 'dollar-sign', color: '#10B981' },
  ]

  const placeholderStates: Record<string, NodeState> = {
    'root': { id: 'root', x: 400, y: 400, isExpanded: false, isSelected: false, children: ['resume', 'interview', 'jobsearch', 'networking', 'salary'] },
    'resume': { id: 'resume', x: 150, y: 150, isExpanded: false, isSelected: false, children: [] },
    'interview': { id: 'interview', x: 400, y: 100, isExpanded: false, isSelected: false, children: [] },
    'jobsearch': { id: 'jobsearch', x: 650, y: 150, isExpanded: false, isSelected: false, children: [] },
    'networking': { id: 'networking', x: 150, y: 650, isExpanded: false, isSelected: false, children: [] },
    'salary': { id: 'salary', x: 650, y: 650, isExpanded: false, isSelected: false, children: [] },
  }

  const displayNodes = nodes.length > 0 ? visibleNodes : placeholderNodes
  const displayStates = nodes.length > 0 ? nodeStates : placeholderStates
  const displayEdges = nodes.length > 0 ? edges : []

  return (
    <div className="flex h-full overflow-hidden" style={{ background: '#F0F3F8' }}>
      {/* Mind Map Area */}
      <div 
        className="flex-1 relative overflow-hidden"
        onMouseUp={() => isDragging && handleDragEnd()}
      >
        {/* Background with subtle grid */}
        <div 
          className="absolute inset-0"
          style={{
            background: `
              linear-gradient(135deg, rgba(241, 245, 249, 0.03) 0%, rgba(241, 245, 249, 0.01) 100%),
              radial-gradient(circle at 1px 1px, rgba(148, 163, 184, 0.15) 1px, transparent 0)
            `,
            backgroundSize: '100% 100%, 40px 40px',
          }}
        />

        {/* SVG Edges */}
        <MindMapEdges edges={displayEdges} />

        {/* Nodes */}
        {displayNodes.map((node) => (
          <MindMapNode
            key={node.id}
            node={node}
            state={displayStates[node.id]}
            isVisible={true}
            isSelected={selectedNode?.id === node.id || selectedTopicId === node.id}
            onPositionChange={handlePositionChange}
            onNodeClick={handleNodeClick}
            onDragStart={() => setIsDragging(true)}
            onDragEnd={handleDragEnd}
          />
        ))}

        {/* Hint Text */}
        {!displayStates[ROOT_NODE_ID]?.isExpanded && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-center">
            <p className="text-sm text-slate-500 animate-pulse">
              {nodes.length === 0 ? t('academy.setupRequired') : t('academy.clickToExplore')}
            </p>
          </div>
        )}
      </div>

      {/* Right Panel */}
      <RightPanel
        isOpen={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
        selectedNode={selectedNode}
        resources={resources}
        continueLearningResource={continueLearningResource}
        onResourceClick={handleResourceClick}
        onProgressUpdate={handleProgressUpdate}
        onContinueLearning={() => continueLearningResource && handleResourceClick(continueLearningResource)}
      />

      {/* Panel Toggle */}
      {!isPanelOpen && (
        <button
          onClick={() => setIsPanelOpen(true)}
          className="absolute right-4 top-4 w-10 h-10 rounded-xl bg-white border border-slate-200 shadow-md flex items-center justify-center text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-all z-30"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
      )}

      {/* Media Player Modal */}
      <MediaPlayerModal
        resource={selectedResource}
        onClose={() => setSelectedResource(null)}
      />
    </div>
  )
}

export default MindMap
