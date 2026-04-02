export type NodeLevel = 1 | 2 | 3
export type NodeType = 'root' | 'topic' | 'resource'
export type ResourceType = 'video' | 'audio' | 'article' | 'document'
export type LearningStatus = 'not_started' | 'in_progress' | 'completed'

export interface AcademyNode {
  id: string
  parent_id: string | null
  level: NodeLevel
  label_key: string
  label?: string
  type: NodeType
  default_x: number
  default_y: number
  icon?: string
  color?: string
}

export interface UserNodeLayout {
  user_id: string
  node_id: string
  x: number
  y: number
  is_expanded: boolean
  updated_at?: string
}

export interface AcademyResource {
  id: string
  topic_id: string
  type: ResourceType
  language: string
  title: string
  description: string
  url: string
  duration_minutes?: number
  thumbnail?: string
  sort_order: number
}

export interface TopicResource {
  topic_id: string
  resource_id: string
  sort_order: number
}

export interface UserLearningProgress {
  user_id: string
  topic_id: string
  resource_id: string
  status: LearningStatus
  progress_percent: number
  last_viewed_at?: string
  created_at?: string
  updated_at?: string
}

export interface NodePosition {
  x: number
  y: number
}

export interface NodeState {
  id: string
  x: number
  y: number
  isExpanded: boolean
  isSelected: boolean
  children: string[]
}

export interface MindMapState {
  nodes: Record<string, NodeState>
  selectedNodeId: string | null
  selectedTopicId: string | null
  isDragging: boolean
}

export interface Resource {
  id: string
  topicId: string
  type: ResourceType
  language: string
  title: string
  description: string
  url: string
  durationMinutes?: number
  thumbnail?: string
  progress?: number
  status?: LearningStatus
  lastViewedAt?: string
}
