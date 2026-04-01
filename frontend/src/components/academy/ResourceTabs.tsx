import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Video, Headphones, FileText, CheckCircle, Circle, PlayCircle } from 'lucide-react'
import type { Resource, LearningStatus } from '../../types/academy'

interface ResourceTabsProps {
  resources: Resource[]
  onResourceClick: (resource: Resource) => void
  onProgressUpdate: (resourceId: string, status: LearningStatus, progress: number) => void
}

type TabType = 'all' | 'video' | 'audio' | 'article'

const ResourceTabs: React.FC<ResourceTabsProps> = ({
  resources,
  onResourceClick,
  onProgressUpdate,
}) => {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<TabType>('all')

  const filteredResources = resources.filter((r) => {
    if (activeTab === 'all') return true
    return r.type === activeTab
  })

  const getTabIcon = (tab: TabType) => {
    switch (tab) {
      case 'video':
        return <Video size={14} />
      case 'audio':
        return <Headphones size={14} />
      case 'article':
        return <FileText size={14} />
      default:
        return null
    }
  }

  const getStatusIcon = (status?: LearningStatus, progress?: number) => {
    if (status === 'completed') {
      return <CheckCircle size={16} className="text-emerald-500" />
    }
    if (progress && progress > 0) {
      return <PlayCircle size={16} className="text-amber-500" />
    }
    return <Circle size={16} className="text-slate-300" />
  }

  const formatDuration = (minutes?: number) => {
    if (!minutes) return ''
    if (minutes < 60) return `${minutes} min`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
  }

  return (
    <div className="flex flex-col h-full">
      {/* Tab Navigation */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl mb-4">
        {(['all', 'video', 'audio', 'article'] as TabType[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
              transition-all duration-200
              ${activeTab === tab 
                ? 'bg-white text-slate-800 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
              }
            `}
          >
            {getTabIcon(tab)}
            <span className="hidden sm:inline">
              {tab === 'all' ? t('panel.all') : t(`panel.${tab}`)}
            </span>
          </button>
        ))}
      </div>

      {/* Resources List */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {filteredResources.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-slate-400">
            <FileText size={32} className="mb-2 opacity-50" />
            <p className="text-sm">{t('panel.noResources')}</p>
          </div>
        ) : (
          filteredResources.map((resource) => (
            <button
              key={resource.id}
              onClick={() => onResourceClick(resource)}
              className={`
                w-full flex items-start gap-3 p-3 rounded-xl
                text-left transition-all duration-200
                group
                ${resource.status === 'completed' 
                  ? 'bg-emerald-50 hover:bg-emerald-100 border border-emerald-200' 
                  : resource.progress && resource.progress > 0
                    ? 'bg-amber-50 hover:bg-amber-100 border border-amber-200'
                    : 'bg-slate-50 hover:bg-white border border-slate-200 hover:shadow-sm'
                }
              `}
            >
              {/* Type Icon */}
              <div className={`
                flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center
                ${resource.type === 'video' ? 'bg-red-100 text-red-500' : ''}
                ${resource.type === 'audio' ? 'bg-purple-100 text-purple-500' : ''}
                ${resource.type === 'article' ? 'bg-blue-100 text-blue-500' : ''}
              `}>
                {resource.type === 'video' && <Video size={18} />}
                {resource.type === 'audio' && <Headphones size={18} />}
                {resource.type === 'article' && <FileText size={18} />}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-sm font-semibold text-slate-700 leading-tight group-hover:text-slate-900 transition-colors">
                    {resource.title}
                  </h4>
                  {getStatusIcon(resource.status, resource.progress)}
                </div>
                
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                  {resource.description}
                </p>

                <div className="flex items-center gap-2 mt-2">
                  {resource.durationMinutes && (
                    <span className="text-[10px] text-slate-400 font-medium">
                      {formatDuration(resource.durationMinutes)}
                    </span>
                  )}
                  
                  {/* Progress Bar */}
                  {resource.progress !== undefined && resource.progress > 0 && resource.progress < 100 && (
                    <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-amber-500 rounded-full transition-all duration-300"
                        style={{ width: `${resource.progress}%` }}
                      />
                    </div>
                  )}

                  {/* Completion Badge */}
                  {resource.status === 'completed' && (
                    <span className="text-[10px] font-semibold text-emerald-600">
                      {t('panel.completed')}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  )
}

export default ResourceTabs
