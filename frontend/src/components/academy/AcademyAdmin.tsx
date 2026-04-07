import React, { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import i18n from '../../i18n'
import {
  Upload,
  Video,
  Headphones,
  FileText,
  FileDown,
  X,
  Check,
  Loader2,
  Trash2,
  Plus,
  FolderOpen,
  File,
  ArrowLeft
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import type { AcademyNode, AcademyResource } from '../../types/academy'

const LOCALE_FILES = ['en', 'es', 'fr', 'pt', 'it']

const ADMIN_EMAIL = 'efrain.pradas@gmail.com'

const AcademyAdmin: React.FC<AcademyAdminProps> = ({ isOpen, onClose, initialTab }) => {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'nodes' | 'resources'>('nodes')
  const [nodes, setNodes] = useState<AcademyNode[]>([])
  const [resources, setResources] = useState<AcademyResource[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [selectedTopic, setSelectedTopic] = useState<string>('')
  const [uploadProgress, setUploadProgress] = useState<string>('')
  const [showNewNodeForm, setShowNewNodeForm] = useState(false)
  const [newNode, setNewNode] = useState({
    label: '',
    icon: 'file-text',
    color: '#6366F1',
  })

  const iconOptions = [
    { value: 'file-text', label: 'Documento' },
    { value: 'users', label: 'Personas' },
    { value: 'briefcase', label: 'Trabajo' },
    { value: 'network', label: 'Red' },
    { value: 'dollar-sign', label: 'Dinero' },
    { value: 'book-open', label: 'Libro' },
    { value: 'target', label: 'Objetivo' },
    { value: 'award', label: 'Premio' },
  ]

  const colorOptions = [
    '#6366F1', '#3B82F6', '#8B5CF6', '#10B981',
    '#F59E0B', '#EC4899', '#EF4444', '#14B8A6',
  ]
  const [newResource, setNewResource] = useState({
    type: 'video' as 'video' | 'audio' | 'article' | 'document',
    title: '',
    description: '',
    language: 'en',
    url: '',
    duration_minutes: 0,
  })

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'pt', name: 'Português', flag: '🇧🇷' },
    { code: 'it', name: 'Italiano', flag: '🇮🇹' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
  ]

  useEffect(() => {
    if (isOpen && initialTab) {
      setActiveTab(initialTab)
      if (initialTab === 'nodes') setShowNewNodeForm(true)
    }
  }, [isOpen, initialTab])

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.email === ADMIN_EMAIL) {
        setUserEmail(user.email)
        loadData()
      } else {
        onClose()
      }
    }
    checkAdmin()
  }, [])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [nodesRes, resourcesRes] = await Promise.all([
        supabase.from('academy_nodes').select('*').order('level').order('sort_order'),
        supabase.from('academy_resources').select('*').order('sort_order')
      ])
      
      if (nodesRes.data) setNodes(nodesRes.data)
      if (resourcesRes.data) setResources(resourcesRes.data)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const uploadFile = async (file: File, type: 'videos' | 'audio' | 'thumbnails') => {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`
    const filePath = `${type}/${fileName}`

    const { data, error } = await supabase.storage
      .from('academy')
      .upload(filePath, file)

    if (error) throw error

    const { data: { publicUrl } } = supabase.storage
      .from('academy')
      .getPublicUrl(filePath)

    return publicUrl
  }

  const handleAddResource = async () => {
    if (!selectedTopic || !newResource.url || !newResource.title) return

    setUploading(true)
    try {
      const { error } = await supabase.from('academy_resources').insert({
        topic_id: selectedTopic,
        type: newResource.type,
        language: newResource.language,
        title: newResource.title,
        description: newResource.description,
        url: newResource.url,
        duration_minutes: newResource.duration_minutes,
        sort_order: resources.filter(r => r.topic_id === selectedTopic).length + 1,
      })

      if (!error) {
        setNewResource({
          type: 'video',
          language: 'en',
          title: '', description: '',
          url: '', duration_minutes: 0
        })
        loadData()
        alert('✅ Recurso agregado exitosamente!')
      }
    } catch (error) {
      console.error('Error adding resource:', error)
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteResource = async (id: string) => {
    if (!confirm('¿Eliminar este recurso?')) return
    
    await supabase.from('academy_resources').delete().eq('id', id)
    loadData()
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setUploadProgress(`Subiendo ${file.name}...`)

    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`
      const folder = newResource.type === 'audio' ? 'audios' : newResource.type === 'document' || newResource.type === 'article' ? 'documents' : 'videos'
      const filePath = `${folder}/${fileName}`

      const { data, error } = await supabase.storage
        .from('academy')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) {
        throw error
      }

      const { data: { publicUrl } } = supabase.storage
        .from('academy')
        .getPublicUrl(filePath)

      setNewResource({ ...newResource, url: publicUrl })
      setUploadProgress('¡Archivo subido! URL copiada.')
      
      setTimeout(() => setUploadProgress(''), 2000)
    } catch (error) {
      console.error('Upload error:', error)
      setUploadProgress('Error al subir archivo')
      setTimeout(() => setUploadProgress(''), 3000)
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleAddNode = async () => {
    if (!newNode.label.trim()) return
    setUploading(true)
    try {
      const rootNode = nodes.find(n => n.level === 1)
      if (!rootNode) {
        alert('❌ Primero inicializa la estructura base.')
        return
      }
      const labelKey = `topics.${newNode.label.toLowerCase().replace(/\s+/g, '_')}`
      const maxSort = nodes.filter(n => n.level === 2).reduce((max, n) => Math.max(max, n.sort_order ?? 0), 0)
      const { error } = await supabase.from('academy_nodes').insert({
        parent_id: rootNode.id,
        level: 2,
        label_key: labelKey,
        type: 'topic',
        default_x: 400,
        default_y: 400,
        icon: newNode.icon,
        color: newNode.color,
        sort_order: maxSort + 1,
      })
      if (error) {
        alert('❌ Error: ' + error.message)
      } else {
        const key = labelKey.replace('topics.', '')
        
        try {
          await fetch('/api/translations/academy-topic', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key, value: newNode.label })
          })
        } catch (e) {
          console.warn('Could not save translation to backend, using memory only')
        }
        
        LOCALE_FILES.forEach(locale => {
          i18n.addResourceBundle(locale, 'translation', { topics: { [key]: newNode.label } }, true)
        })
        setNewNode({ label: '', icon: 'file-text', color: '#6366F1' })
        setShowNewNodeForm(false)
        loadData()
        alert(`✅ Módulo "${newNode.label}" creado y añadido a las traducciones (5 idiomas).`)
      }
    } catch (err) {
      alert('❌ Error: ' + (err as Error).message)
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteNode = async (id: string, labelKey: string) => {
    if (!confirm(`¿Eliminar el módulo "${t(labelKey) || labelKey}"? También se eliminarán sus recursos.`)) return
    setUploading(true)
    try {
      // Delete resources first
      await supabase.from('academy_resources').delete().eq('topic_id', id)
      await supabase.from('academy_nodes').delete().eq('id', id)
      loadData()
    } catch (err) {
      alert('❌ Error: ' + (err as Error).message)
    } finally {
      setUploading(false)
    }
  }

  const handleSeedData = async () => {
    setUploading(true)
    try {
      const rootId = '00000000-0000-0000-0000-000000000001'
      
      // First check if the table exists and has data
      const { data: existingNodes, error: checkError } = await supabase
        .from('academy_nodes')
        .select('id')
        .limit(1)

      if (checkError) {
        alert('❌ Error: La tabla academy_nodes no existe.\n\nEjecuta el SQL migration en Supabase:\nbackend/supabase/migrations/001_create_academy_tables.sql')
        setUploading(false)
        return
      }

      // Insert nodes directly
      const { error: insertError } = await supabase
        .from('academy_nodes')
        .upsert([
          { id: rootId, parent_id: null, level: 1, label_key: 'academy.title', type: 'root', default_x: 400, default_y: 400, icon: 'graduation-cap', color: '#10B981', sort_order: 0 },
          { id: '00000000-0000-0000-0000-000000000010', parent_id: rootId, level: 2, label_key: 'topics.resume', type: 'topic', default_x: 150, default_y: 150, icon: 'file-text', color: '#3B82F6', sort_order: 1 },
          { id: '00000000-0000-0000-0000-000000000020', parent_id: rootId, level: 2, label_key: 'topics.interview', type: 'topic', default_x: 400, default_y: 100, icon: 'users', color: '#8B5CF6', sort_order: 2 },
          { id: '00000000-0000-0000-0000-000000000030', parent_id: rootId, level: 2, label_key: 'topics.jobSearch', type: 'topic', default_x: 650, default_y: 150, icon: 'briefcase', color: '#F59E0B', sort_order: 3 },
          { id: '00000000-0000-0000-0000-000000000040', parent_id: rootId, level: 2, label_key: 'topics.networking', type: 'topic', default_x: 150, default_y: 650, icon: 'network', color: '#EC4899', sort_order: 4 },
          { id: '00000000-0000-0000-0000-000000000050', parent_id: rootId, level: 2, label_key: 'topics.salary', type: 'topic', default_x: 650, default_y: 650, icon: 'dollar-sign', color: '#10B981', sort_order: 5 },
        ], { onConflict: 'id' })

      if (insertError) {
        alert('❌ Error insertando nodos: ' + insertError.message)
        console.error('Insert error:', insertError)
      } else {
        alert('✅ ¡Datos inicializados! Recargando...')
        loadData()
      }
    } catch (error) {
      console.error('Error seeding data:', error)
      alert('❌ Error: ' + (error as Error).message)
    } finally {
      setUploading(false)
    }
  }

  if (!isOpen || userEmail !== ADMIN_EMAIL) return null

  const topics = nodes.filter(n => n.level === 2)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-1.5 text-slate-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg px-2 py-1.5 text-sm transition-colors"
            >
              <ArrowLeft size={16} />
            </button>
            <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
              <FolderOpen size={20} className="text-primary-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">Academy Admin</h2>
              <p className="text-xs text-slate-500">{userEmail}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-6 py-3 border-b border-slate-100">
          <button
            onClick={() => setActiveTab('nodes')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'nodes' ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Estructura de Nodos
          </button>
          <button
            onClick={() => setActiveTab('resources')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'resources' ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Recursos (Videos/Audio/Docs)
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={24} className="animate-spin text-slate-400" />
            </div>
          ) : (
            <>
              {activeTab === 'nodes' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-slate-800">Módulos del Mapa</h3>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowNewNodeForm(!showNewNodeForm)}
                        className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 flex items-center gap-2"
                      >
                        <Plus size={14} />
                        Nuevo Módulo
                      </button>
                      {nodes.length === 0 && (
                        <button
                          onClick={handleSeedData}
                          disabled={uploading}
                          className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2"
                        >
                          {uploading ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                          Inicializar Base
                        </button>
                      )}
                    </div>
                  </div>

                  {/* New Node Form */}
                  {showNewNodeForm && (
                    <div className="p-4 bg-primary-50 border border-primary-200 rounded-xl space-y-3">
                      <h4 className="text-sm font-bold text-primary-800">Nuevo Módulo</h4>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre del módulo</label>
                        <input
                          type="text"
                          value={newNode.label}
                          onChange={(e) => setNewNode({ ...newNode, label: e.target.value })}
                          placeholder="ej. Marca Personal"
                          className="w-full px-3 py-2 border-2 border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">Ícono</label>
                          <select
                            value={newNode.icon}
                            onChange={(e) => setNewNode({ ...newNode, icon: e.target.value })}
                            className="w-full px-3 py-2 border-2 border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-primary-500"
                          >
                            {iconOptions.map(opt => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">Color</label>
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {colorOptions.map(c => (
                              <button
                                key={c}
                                onClick={() => setNewNode({ ...newNode, color: c })}
                                className={`w-6 h-6 rounded-full transition-transform ${newNode.color === c ? 'scale-125 ring-2 ring-offset-1 ring-slate-400' : ''}`}
                                style={{ backgroundColor: c }}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={handleAddNode}
                          disabled={uploading || !newNode.label.trim()}
                          className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-semibold hover:bg-primary-700 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          {uploading ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                          Crear Módulo
                        </button>
                        <button
                          onClick={() => setShowNewNodeForm(false)}
                          className="px-4 py-2 bg-white border border-slate-300 text-slate-600 rounded-lg text-sm hover:bg-slate-50"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    {nodes.map((node) => (
                      <div key={node.id} className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl shadow-sm group">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold flex-shrink-0 ${
                          node.level === 1 ? 'bg-primary-500 text-white' :
                          node.level === 2 ? 'bg-blue-500 text-white' :
                          'bg-slate-400 text-white'
                        }`}>
                          L{node.level}
                        </span>
                        {node.color && (
                          <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: node.color }} />
                        )}
                        <span className="flex-1 text-sm font-medium text-slate-800">
                          {node.label || t(node.label_key) || node.label_key}
                        </span>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded flex-shrink-0 ${
                          node.type === 'root' ? 'bg-primary-100 text-primary-700' :
                          node.type === 'topic' ? 'bg-blue-100 text-blue-700' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {node.type}
                        </span>
                        {node.level === 2 && (
                          <button
                            onClick={() => handleDeleteNode(node.id, node.label_key)}
                            className="opacity-0 group-hover:opacity-100 p-1.5 text-primary-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'resources' && (
                <div className="space-y-6">
                  {/* Add Resource Form */}
                  <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                      <Plus size={18} className="text-primary-500" />
                      Agregar Nuevo Recurso
                    </h3>
                    
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-2">Tema</label>
                        <div className="relative">
                          <select
                            value={selectedTopic}
                            onChange={(e) => setSelectedTopic(e.target.value)}
                            className="w-full px-3 py-3 border-2 border-slate-400 rounded-lg text-sm bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 appearance-none cursor-pointer font-bold text-slate-900"
                            style={{ 
                              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23333'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2.5' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                              backgroundRepeat: 'no-repeat',
                              backgroundPosition: 'right 12px center',
                              backgroundSize: '20px',
                              paddingRight: '40px'
                            }}
                          >
                            <option value="" className="text-slate-500 font-semibold">Seleccionar tema...</option>
                            {topics.map((topic) => (
                              <option key={topic.id} value={topic.id} className="text-slate-900 font-bold py-2">
                                {topic.label || t(topic.label_key)}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-2">Tipo</label>
                        <div className="flex gap-2">
                          {(['video', 'audio', 'article', 'document'] as const).map((type) => (
                            <button
                              key={type}
                              onClick={() => setNewResource({ ...newResource, type })}
                              className={`flex-1 px-2 py-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                                newResource.type === type
                                  ? 'bg-slate-800 text-white shadow-md'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              {type === 'video' && <Video size={14} />}
                              {type === 'audio' && <Headphones size={14} />}
                              {type === 'article' && <FileText size={14} />}
                              {type === 'document' && <FileDown size={14} />}
                              {type === 'document' ? 'Doc' : type.charAt(0).toUpperCase() + type.slice(1)}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="col-span-2">
                        <label className="block text-xs font-semibold text-slate-700 mb-2">Archivo o URL</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={newResource.url}
                            onChange={(e) => setNewResource({ ...newResource, url: e.target.value })}
                            placeholder="URL del video o audio..."
                            className="flex-1 px-3 py-2.5 border-2 border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 font-medium"
                          />
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept={
                              newResource.type === 'audio' ? 'audio/*' :
                              newResource.type === 'document' ? '.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx' :
                              newResource.type === 'article' ? '.pdf,.html,.txt' :
                              'video/*'
                            }
                            onChange={handleFileUpload}
                            className="hidden"
                          />
                          <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading}
                            className="px-4 py-2.5 bg-primary-600 text-white rounded-lg text-sm font-semibold hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2 transition-colors"
                          >
                            {uploading ? (
                              <Loader2 size={16} className="animate-spin" />
                            ) : (
                              <Upload size={16} />
                            )}
                            Subir
                          </button>
                        </div>
                        {uploadProgress && (
                          <p className={`text-xs mt-2 font-medium ${uploadProgress.includes('Error') ? 'text-primary-500' : uploadProgress.includes('¡') ? 'text-primary-600' : 'text-slate-500'}`}>
                            {uploadProgress}
                          </p>
                        )}
                        {newResource.url && (
                          <p className="text-[10px] text-slate-400 mt-1 truncate">
                            📎 {newResource.url.split('/').pop()}
                          </p>
                        )}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                          <label className="block text-xs font-semibold text-slate-800 mb-2">Idioma del Contenido</label>
                          <select
                            value={newResource.language}
                            onChange={(e) => setNewResource({ ...newResource, language: e.target.value })}
                            className="w-full px-3 py-3 border-2 border-slate-400 rounded-lg text-sm font-bold text-slate-900 bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          >
                            {languages.map((lang) => (
                              <option key={lang.code} value={lang.code}>
                                {lang.flag} {lang.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-800 mb-2">Duración (minutos)</label>
                          <input
                            type="number"
                            value={newResource.duration_minutes}
                            onChange={(e) => setNewResource({ ...newResource, duration_minutes: parseInt(e.target.value) || 0 })}
                            className="w-full px-3 py-2.5 border-2 border-slate-400 rounded-lg text-sm font-bold text-slate-900 bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-xs font-semibold text-slate-800 mb-2">Título</label>
                          <input
                            type="text"
                            value={newResource.title}
                            onChange={(e) => setNewResource({ ...newResource, title: e.target.value })}
                            placeholder="Título del video o audio..."
                            className="w-full px-3 py-2.5 border-2 border-slate-400 rounded-lg text-sm font-bold text-slate-900 bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 placeholder-slate-400"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-xs font-semibold text-slate-800 mb-2">Descripción</label>
                          <input
                            type="text"
                            value={newResource.description}
                            onChange={(e) => setNewResource({ ...newResource, description: e.target.value })}
                            placeholder="Breve descripción del contenido..."
                            className="w-full px-3 py-2.5 border-2 border-slate-400 rounded-lg text-sm font-semibold text-slate-900 bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 placeholder-slate-400"
                          />
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={handleAddResource}
                      disabled={uploading || !selectedTopic || !newResource.url}
                      className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {uploading ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                      Agregar Recurso
                    </button>
                  </div>

                  {/* Resources List */}
                  <div>
                    <h3 className="font-bold text-slate-800 mb-4">Recursos Existentes</h3>
                    <div className="space-y-2">
                      {resources.length === 0 ? (
                        <p className="text-sm text-slate-500 text-center py-8">
                          No hay recursos. Agrega uno usando el formulario de arriba.
                        </p>
                      ) : (
                        resources.map((resource) => (
                          <div key={resource.id} className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl shadow-sm group">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                              resource.type === 'video' ? 'bg-primary-100' :
                              resource.type === 'audio' ? 'bg-primary-100' :
                              resource.type === 'document' ? 'bg-primary-100' :
                              'bg-blue-100'
                            }`}>
                              {resource.type === 'video' && <Video size={18} className="text-primary-500" />}
                              {resource.type === 'audio' && <Headphones size={18} className="text-primary-500" />}
                              {resource.type === 'article' && <FileText size={18} className="text-blue-500" />}
                              {resource.type === 'document' && <FileDown size={18} className="text-primary-600" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-slate-800 truncate">{resource.title}</p>
                              <p className="text-xs text-slate-500 truncate">{resource.url}</p>
                            </div>
                            {resource.duration_minutes && (
                              <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded">
                                {resource.duration_minutes} min
                              </span>
                            )}
                            <button
                              onClick={() => handleDeleteResource(resource.id)}
                              className="opacity-0 group-hover:opacity-100 p-2 text-primary-500 hover:bg-primary-50 rounded-lg transition-opacity"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default AcademyAdmin
