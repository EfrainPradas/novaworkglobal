import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase, getCurrentSession } from '../../lib/supabase';
import { resourceService } from '../../services/resourceService';
import { Resource, ResourceShareWithDetails, ResourceType } from '../../types/resources';
import { ResourceCard } from '../../components/resources/ResourceCard';
import { ResourceFilters } from '../../components/resources/ResourceFilters';
import { ResourceDetailDrawer } from '../../components/resources/ResourceDetailDrawer';
import { UploadResourceModal } from '../../components/coach/resources/UploadResourceModal';
import { ShareResourceModal } from '../../components/coach/resources/ShareResourceModal';
import { Plus, ArrowLeft, Library, Loader2, Users } from 'lucide-react';

interface Client {
  id: string;
  name: string;
  email: string;
}

export default function CoachResources() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [resources, setResources] = useState<Resource[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [coachId, setCoachId] = useState<string | null>(null);

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Modals / Drawer state
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [shareResource, setShareResource] = useState<Resource | null>(null);
  const [viewResource, setViewResource] = useState<Resource | null>(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const session = await getCurrentSession();
      if (!session) {
        navigate('/signin');
        return;
      }
      const cId = session.user.id;
      setCoachId(cId);

      // Load resources
      const resData = await resourceService.getCoachResources(cId);
      setResources(resData);

      // Load clients for this coach
      const { data: relations, error } = await supabase
        .from('coach_clients')
        .select(`
          client_id,
          client:client_id(id, full_name, email)
        `)
        .eq('coach_id', cId);
        
      if (relations) {
        const parsedClients = relations.map(r => {
          const c = r.client as any;
          return {
            id: c.id,
            name: c.full_name || 'Unknown Client',
            email: c.email || ''
          };
        });
        // Deduplicate clients in case of multiple relations
        const uniqueClientsMap = new Map();
        parsedClients.forEach(c => uniqueClientsMap.set(c.id, c));
        setClients(Array.from(uniqueClientsMap.values()));
      }

    } catch (err) {
      console.error('Error loading coach resources:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveResource = async (data: {
    title: string;
    description: string;
    category: string;
    resource_type: ResourceType;
    external_url?: string;
    file?: File;
  }) => {
    if (!coachId) return;

    let fileUrl = data.external_url || null;
    let externalUrl = data.external_url || null;

    if (data.file) {
      const publicUrl = await resourceService.uploadResourceFile(data.file, coachId);
      fileUrl = publicUrl;
      externalUrl = null;
    }

    const newRes = await resourceService.createResource({
      coach_id: coachId,
      title: data.title,
      description: data.description,
      category: data.category,
      resource_type: data.resource_type,
      file_url: fileUrl,
      external_url: externalUrl
    });

    setResources([newRes, ...resources]);
  };

  const handleShareResource = async (resourceId: string, clientIds: string[], message?: string) => {
    if (!coachId) return;
    
    // Create share record for each client
    for (const cid of clientIds) {
      // Check if already shared
      const { data: existing } = await supabase
        .from('resource_shares')
        .select('id')
        .eq('resource_id', resourceId)
        .eq('client_id', cid)
        .maybeSingle();
        
      if (!existing) {
        await resourceService.shareResource({
          resource_id: resourceId,
          coach_id: coachId,
          client_id: cid,
          message: message || null
        });
      }
    }
    // Optionally show a success toast here
  };

  const handleDeleteResource = async (resource: Resource) => {
    if (confirm('Are you sure you want to delete this resource? This will remove access for all clients.')) {
      try {
        await resourceService.deleteResource(resource.id);
        setResources(resources.filter(r => r.id !== resource.id));
      } catch (err) {
        console.error('Error deleting resource:', err);
        alert('Failed to delete resource.');
      }
    }
  };

  // Derived state for UI
  const categories = Array.from(new Set(resources.map(r => r.category).filter(Boolean) as string[]));
  
  const filteredResources = resources.filter(r => {
    const matchesSearch = r.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (r.description && r.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCat = selectedCategory ? r.category === selectedCategory : true;
    return matchesSearch && matchesCat;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div>
            <button 
              onClick={() => navigate('/coach')}
              className="flex items-center text-sm text-gray-500 hover:text-gray-800 transition-colors mb-2"
            >
              <ArrowLeft className="w-4 h-4 mr-1" /> {t('coach.resources.backToDashboard', 'Back to Dashboard')}
            </button>
            <h1 className="text-2xl font-bold flex items-center gap-2 text-gray-900">
              <Library className="w-6 h-6 text-primary-600" />
              {t('coach.resources.title', 'Resource Library')}
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              {t('coach.resources.subtitle', 'Manage and share files, links, and templates with your clients')}
            </p>
          </div>
          
          <button
            onClick={() => setIsUploadOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white font-medium rounded-xl hover:bg-primary-700 transition-colors shadow-sm"
          >
            <Plus className="w-5 h-5" /> {t('coach.resources.addResource', 'Add Resource')}
          </button>
        </div>

        {/* Filters */}
        {resources.length > 0 && (
          <ResourceFilters
            categories={categories}
            selectedCategory={selectedCategory}
            searchQuery={searchQuery}
            onCategoryChange={setSelectedCategory}
            onSearchChange={setSearchQuery}
          />
        )}

        {/* Resources Grid */}
        {resources.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <div className="w-16 h-16 bg-primary-50 text-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Library className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">{t('coach.resources.emptyTitle', 'Your Library is Empty')}</h3>
            <p className="text-gray-500 mb-6 max-w-sm mx-auto">
              {t('coach.resources.emptyDesc', 'Start building your resource library by adding interview guides, resume templates, or helpful videos.')}
            </p>
            <button
              onClick={() => setIsUploadOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white font-medium rounded-xl hover:bg-primary-700 transition-colors"
            >
              <Plus className="w-5 h-5" /> Add First Resource
            </button>
          </div>
        ) : filteredResources.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <h3 className="text-lg font-bold text-gray-900 mb-2">No results found</h3>
            <p className="text-gray-500">Try adjusting your search or category filter.</p>
            <button 
              onClick={() => { setSearchQuery(''); setSelectedCategory(null); }}
              className="mt-4 text-primary-600 font-medium hover:text-primary-700"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredResources.map(resource => (
              <ResourceCard
                key={resource.id}
                resource={resource}
                onOpen={setViewResource}
                onShare={setShareResource}
                onDelete={handleDeleteResource}
              />
            ))}
          </div>
        )}

      </div>

      {/* Modals & Drawers */}
      <UploadResourceModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onSave={handleSaveResource}
        categories={categories}
      />

      <ShareResourceModal
        isOpen={!!shareResource}
        onClose={() => setShareResource(null)}
        resource={shareResource}
        clients={clients}
        onShare={handleShareResource}
      />

      <ResourceDetailDrawer
        isOpen={!!viewResource}
        onClose={() => setViewResource(null)}
        resource={viewResource}
      />
    </div>
  );
}
