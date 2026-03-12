import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, getCurrentSession } from '../../lib/supabase';
import { resourceService } from '../../services/resourceService';
import { ResourceShareWithDetails } from '../../types/resources';
import { ResourceCard } from '../../components/resources/ResourceCard';
import { ResourceFilters } from '../../components/resources/ResourceFilters';
import { ResourceDetailDrawer } from '../../components/resources/ResourceDetailDrawer';
import { ArrowLeft, Library, Loader2, CheckCircle2 } from 'lucide-react';

export default function ClientSharedResources() {
  const navigate = useNavigate();
  const [shares, setShares] = useState<ResourceShareWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [clientId, setClientId] = useState<string | null>(null);

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Drawer state
  const [viewResource, setViewResource] = useState<ResourceShareWithDetails | null>(null);

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
      setClientId(cId);

      // Fetch shares for client
      const sharesData = await resourceService.getSharedResourcesForClient(cId);
      setShares(sharesData);
    } catch (err) {
      console.error('Error loading client resources:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (shareId: string, status: 'viewed' | 'completed') => {
    try {
      const updates: any = { status };
      if (status === 'viewed') updates.viewed_at = new Date().toISOString();
      if (status === 'completed') updates.completed_at = new Date().toISOString();
      await resourceService.updateShareStatus(shareId, updates);
      // Update local state
      setShares(shares.map(s => s.id === shareId ? { ...s, status } : s));
    } catch (err) {
      console.error('Error updating resource status:', err);
    }
  };

  const activeShares = shares.filter(s => !!s.resources);
  const categories = Array.from(new Set(activeShares.map(s => s.resources?.category).filter(Boolean) as string[]));
  
  const filteredShares = activeShares.filter(s => {
    const res = s.resources;
    if (!res) return false;
    const matchesSearch = res.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (res.description && res.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCat = selectedCategory ? res.category === selectedCategory : true;
    return matchesSearch && matchesCat;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-200"><CheckCircle2 className="w-3 h-3" /> Completed</span>;
      case 'viewed':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">Viewed</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-800 border border-gray-200">New</span>;
    }
  };

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
              onClick={() => navigate('/dashboard')}
              className="flex items-center text-sm text-gray-500 hover:text-gray-800 transition-colors mb-2"
            >
              <ArrowLeft className="w-4 h-4 mr-1" /> Back to Dashboard
            </button>
            <h1 className="text-2xl font-bold flex items-center gap-2 text-gray-900">
              <Library className="w-6 h-6 text-primary-600" />
              Shared Resources
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Materials, guides, and templates shared by your coach
            </p>
          </div>
        </div>

        {/* Filters */}
        {activeShares.length > 0 && (
          <ResourceFilters
            categories={categories}
            selectedCategory={selectedCategory}
            searchQuery={searchQuery}
            onCategoryChange={setSelectedCategory}
            onSearchChange={setSearchQuery}
          />
        )}

        {/* Resources Grid */}
        {activeShares.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <div className="w-16 h-16 bg-primary-50 text-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Library className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">No Shared Resources Yet</h3>
            <p className="text-gray-500 max-w-sm mx-auto">
              Your coach hasn't shared any resources with you yet. Check back later!
            </p>
          </div>
        ) : filteredShares.length === 0 ? (
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
            {filteredShares.map(share => {
              const res = share.resources;
              if (!res) return null;
              
              return (
                <div key={share.id} className="relative">
                  <div className="absolute top-4 right-4 z-10">
                    {getStatusBadge(share.status)}
                  </div>
                  <ResourceCard
                    resource={res}
                    isClientView={true}
                    onOpen={() => {
                      setViewResource(share);
                      if (share.status === 'shared') {
                        handleUpdateStatus(share.id, 'viewed');
                      }
                    }}
                  />
                  {share.message && (
                    <div className="mt-2 bg-blue-50 border border-blue-100 rounded-lg p-3 text-sm text-blue-900 relative">
                      <span className="font-semibold block mb-1">Message from Coach:</span>
                      {share.message}
                    </div>
                  )}
                  {share.status !== 'completed' && (
                    <button
                      onClick={() => handleUpdateStatus(share.id, 'completed')}
                      className="mt-3 w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors flex justify-center items-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Mark as Completed
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

      </div>

      <ResourceDetailDrawer
        isOpen={!!viewResource}
        onClose={() => setViewResource(null)}
        resource={viewResource?.resources || null}
      />
    </div>
  );
}
