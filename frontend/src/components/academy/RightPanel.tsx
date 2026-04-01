import React from 'react'
import { useTranslation } from 'react-i18next'
import { 
  X, 
  Play, 
  Headphones, 
  FileText, 
  Clock, 
  ChevronRight,
  CheckCircle,
  BookOpen,
  Sparkles,
  RotateCcw,
  ArrowRight
} from 'lucide-react'
import ResourceTabs from './ResourceTabs'
import type { AcademyNode, Resource, LearningStatus } from '../../types/academy'

interface RightPanelProps {
  isOpen: boolean
  onClose: () => void
  selectedNode: AcademyNode | null
  resources: Resource[]
  continueLearningResource?: Resource
  onResourceClick: (resource: Resource) => void
  onProgressUpdate: (resourceId: string, status: LearningStatus, progress: number) => void
  onContinueLearning: () => void
}

const RightPanel: React.FC<RightPanelProps> = ({
  isOpen,
  onClose,
  selectedNode,
  resources,
  continueLearningResource,
  onResourceClick,
  onProgressUpdate,
  onContinueLearning,
}) => {
  const { t } = useTranslation()

  if (!isOpen) return null

  const nodeTitle = selectedNode ? (selectedNode.label || t(selectedNode.label_key)) : ''

  const getResourceTypeIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Play size={16} className="text-red-500" />
      case 'audio':
        return <Headphones size={16} className="text-purple-500" />
      case 'article':
        return <FileText size={16} className="text-blue-500" />
      default:
        return <FileText size={16} />
    }
  }

  return (
    <div 
      className={`
        w-80 lg:w-96 flex-shrink-0 h-full flex flex-col
        bg-white border-l border-slate-200
        transition-all duration-300 ease-out
        ${isOpen ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
      `}
      style={{ boxShadow: '-4px 0 20px rgba(0,0,0,0.05)' }}
    >
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-slate-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: selectedNode?.color ? `${selectedNode.color}15` : '#10B98115' }}
            >
              <BookOpen size={18} style={{ color: selectedNode?.color || '#10B981' }} />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                {t('panel.learningPanel')}
              </p>
              <h3 className="text-base font-bold text-slate-800 leading-tight">
                {nodeTitle || t('academy.title')}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Continue Learning Section */}
      {continueLearningResource && (
        <div className="flex-shrink-0 p-4 border-b border-slate-100">
          <div className="flex items-center gap-2 mb-3">
            <RotateCcw size={14} className="text-amber-500" />
            <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider">
              {t('panel.continueLearning')}
            </p>
          </div>
          
          <button
            onClick={onContinueLearning}
            className="w-full flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 hover:border-amber-300 hover:shadow-sm transition-all duration-200 group"
          >
            <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
              {getResourceTypeIcon(continueLearningResource.type)}
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm font-semibold text-slate-800 leading-tight truncate group-hover:text-amber-700 transition-colors">
                {continueLearningResource.title}
              </p>
              <div className="flex items-center gap-2 mt-1">
                {continueLearningResource.durationMinutes && (
                  <span className="text-xs text-slate-500">
                    <Clock size={10} className="inline mr-1" />
                    {continueLearningResource.durationMinutes} min
                  </span>
                )}
                {continueLearningResource.progress !== undefined && (
                  <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden max-w-[60px]">
                    <div 
                      className="h-full bg-amber-500 rounded-full"
                      style={{ width: `${continueLearningResource.progress}%` }}
                    />
                  </div>
                )}
              </div>
            </div>
            <ArrowRight size={16} className="text-amber-500 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      )}

      {/* AI Recommendations */}
      {selectedNode && resources.length > 0 && (
        <div className="flex-shrink-0 p-4 border-b border-slate-100">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={14} className="text-emerald-500" />
            <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">
              {t('panel.recommended')}
            </p>
          </div>
          
          <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
              <Sparkles size={18} className="text-emerald-500" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-semibold text-slate-700 leading-tight">
                {t('panel.aiRecommendation')}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {t('panel.aiRecommendationDesc')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Resources */}
      <div className="flex-1 overflow-hidden flex flex-col p-4">
        <div className="flex items-center gap-2 mb-4">
          <div 
            className="w-5 h-5 rounded flex items-center justify-center"
            style={{ backgroundColor: selectedNode?.color ? `${selectedNode.color}15` : '#10B98115' }}
          >
            <BookOpen size={12} style={{ color: selectedNode?.color || '#10B981' }} />
          </div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            {t('panel.resources')}
          </p>
          <span className="ml-auto text-xs text-slate-400">
            {resources.length} {t('panel.items')}
          </span>
        </div>
        
        <div className="flex-1 overflow-hidden">
          <ResourceTabs
            resources={resources}
            onResourceClick={onResourceClick}
            onProgressUpdate={onProgressUpdate}
          />
        </div>
      </div>
    </div>
  )
}

export default RightPanel
