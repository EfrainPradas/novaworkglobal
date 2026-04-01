import React, { useState, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import {
  GraduationCap,
  FileText,
  Users,
  Briefcase,
  Network,
  DollarSign,
  PlayCircle,
  Video,
  Award,
  Tag,
  HelpCircle,
  Play,
  Mic,
  Mail,
  Search,
  FilePlus,
  Clipboard,
  Linkedin,
  MessageCircle,
  Package,
  MessageSquare,
  LinkedinIcon,
} from 'lucide-react'
import type { AcademyNode, NodeState } from '../../types/academy'

interface MindMapNodeProps {
  node: AcademyNode
  state: NodeState
  isVisible: boolean
  isSelected: boolean
  onPositionChange: (nodeId: string, x: number, y: number) => void
  onNodeClick: (nodeId: string) => void
  onDragStart: () => void
  onDragEnd: () => void
}

const ICON_MAP: Record<string, React.FC<{ size?: number; className?: string }>> = {
  'graduation-cap': GraduationCap,
  'file-text': FileText,
  'users': Users,
  'briefcase': Briefcase,
  'network': Network,
  'dollar-sign': DollarSign,
  'play-circle': PlayCircle,
  'video': Video,
  'award': Award,
  'tag': Tag,
  'help-circle': HelpCircle,
  'play': Play,
  'mic': Mic,
  'mail': Mail,
  'search': Search,
  'file-plus': FilePlus,
  'clipboard': Clipboard,
  'linkedin': LinkedinIcon,
  'linkedin-icon': Linkedin,
  'message-circle': MessageCircle,
  'package': Package,
  'message-square': MessageSquare,
}

const MindMapNode: React.FC<MindMapNodeProps> = ({
  node,
  state,
  isVisible,
  isSelected,
  onPositionChange,
  onNodeClick,
  onDragStart,
  onDragEnd,
}) => {
  const { t } = useTranslation()
  const nodeRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!nodeRef.current) return
    
    const rect = nodeRef.current.getBoundingClientRect()
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    })
    setIsDragging(true)
    onDragStart()
  }, [onDragStart])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return
    
    const parent = nodeRef.current?.parentElement
    if (!parent) return
    
    const parentRect = parent.getBoundingClientRect()
    const newX = e.clientX - parentRect.left - dragOffset.x
    const newY = e.clientY - parentRect.top - dragOffset.y
    
    onPositionChange(node.id, Math.max(0, newX), Math.max(0, newY))
  }, [isDragging, dragOffset, node.id, onPositionChange])

  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      setIsDragging(false)
      onDragEnd()
    }
  }, [isDragging, onDragEnd])

  React.useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
      return () => {
        window.removeEventListener('mousemove', handleMouseMove)
        window.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  const IconComponent = node.icon ? ICON_MAP[node.icon] || PlayCircle : PlayCircle
  const label = t(node.label_key)
  const nodeColor = node.color || '#10B981'

  const getNodeStyles = () => {
    switch (node.level) {
      case 1:
        return {
          width: 120,
          height: 60,
          borderRadius: 30,
          fontSize: 'text-sm',
          padding: 'px-6 py-3',
        }
      case 2:
        return {
          width: 140,
          height: 56,
          borderRadius: 28,
          fontSize: 'text-xs',
          padding: 'px-5 py-2.5',
        }
      case 3:
        return {
          width: 120,
          height: 50,
          borderRadius: 25,
          fontSize: 'text-[11px]',
          padding: 'px-4 py-2',
        }
      default:
        return {
          width: 120,
          height: 50,
          borderRadius: 25,
          fontSize: 'text-xs',
          padding: 'px-4 py-2',
        }
    }
  }

  const styles = getNodeStyles()

  return (
    <div
      ref={nodeRef}
      className={`
        absolute cursor-grab select-none
        flex items-center gap-2
        font-semibold
        transition-all duration-300 ease-out
        ${styles.fontSize} ${styles.padding}
        ${isSelected ? 'ring-2 ring-offset-2 ring-offset-slate-100 z-20' : 'z-10'}
        ${isDragging ? 'cursor-grabbing scale-105 shadow-xl' : 'hover:scale-105 hover:shadow-lg'}
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}
      `}
      style={{
        left: state.x,
        top: state.y,
        width: styles.width,
        height: styles.height,
        backgroundColor: isSelected ? nodeColor : '#FFFFFF',
        borderColor: nodeColor,
        borderWidth: 2,
        borderStyle: 'solid',
        color: isSelected ? '#FFFFFF' : nodeColor,
        boxShadow: isSelected 
          ? `0 4px 20px ${nodeColor}40, 0 0 30px ${nodeColor}20` 
          : `0 2px 12px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.05)`,
        transform: `translate(0, 0)`,
      }}
      onMouseDown={handleMouseDown}
      onClick={(e) => {
        e.stopPropagation()
        if (!isDragging) {
          onNodeClick(node.id)
        }
      }}
    >
      <span
        className="flex-shrink-0 flex items-center justify-center"
        style={{
          width: node.level === 1 ? 28 : node.level === 2 ? 24 : 20,
          height: node.level === 1 ? 28 : node.level === 2 ? 24 : 20,
        }}
      >
        <IconComponent 
          size={node.level === 1 ? 18 : node.level === 2 ? 16 : 14} 
        />
      </span>
      <span className="truncate flex-1 leading-tight">{label}</span>
    </div>
  )
}

export default MindMapNode
