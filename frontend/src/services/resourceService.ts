import { supabase } from '../lib/supabase';
import { Resource, ResourceShare, ResourceShareWithDetails } from '../types/resources';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

async function getAuthToken(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token || '';
}

export const resourceService = {
  // --- RESOURCES ---
  async getCoachResources(coachId: string): Promise<Resource[]> {
    const { data, error } = await supabase
      .from('resources')
      .select('*')
      .eq('coach_id', coachId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Resource[];
  },

  async createResource(resource: Omit<Resource, 'id' | 'created_at' | 'updated_at'>): Promise<Resource> {
    const { data, error } = await supabase
      .from('resources')
      .insert([resource])
      .select()
      .single();

    if (error) throw error;
    return data as Resource;
  },

  async deleteResource(id: string): Promise<void> {
    const { error } = await supabase
      .from('resources')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async uploadResourceFile(file: File, _coachId: string): Promise<string> {
    const token = await getAuthToken();

    // 1. Get presigned URL from backend
    const res = await fetch(`${API_BASE_URL}/api/upload/presigned-url`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        fileName: file.name,
        contentType: file.type || 'application/octet-stream',
        folder: 'coach-resources',
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to get upload URL');
    }

    const { uploadUrl, publicUrl } = await res.json();

    // 2. Upload directly to R2
    const uploadRes = await fetch(uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': file.type || 'application/octet-stream' },
      body: file,
    });

    if (!uploadRes.ok) {
      throw new Error('Failed to upload file to storage');
    }

    return publicUrl;
  },

  // --- SHARES ---
  async getSharesForResource(resourceId: string): Promise<ResourceShare[]> {
    const { data, error } = await supabase
      .from('resource_shares')
      .select('*')
      .eq('resource_id', resourceId);

    if (error) throw error;
    return data as ResourceShare[];
  },

  async getSharedResourcesForClient(clientId: string): Promise<ResourceShareWithDetails[]> {
    const { data, error } = await supabase
      .from('resource_shares')
      .select(`
        *,
        resources (*)
      `)
      .eq('client_id', clientId)
      .order('shared_at', { ascending: false });

    if (error) throw error;
    return data as ResourceShareWithDetails[];
  },

  async shareResource(share: Omit<ResourceShare, 'id' | 'shared_at' | 'viewed_at' | 'completed_at' | 'status'>): Promise<ResourceShare> {
    const { data, error } = await supabase
      .from('resource_shares')
      .insert([{ ...share, status: 'shared' }])
      .select()
      .single();

    if (error) throw error;
    return data as ResourceShare;
  },

  async updateShareStatus(shareId: string, updates: Partial<Pick<ResourceShare, 'status' | 'viewed_at' | 'completed_at'>>): Promise<ResourceShare> {
    const { data, error } = await supabase
      .from('resource_shares')
      .update(updates)
      .eq('id', shareId)
      .select()
      .single();

    if (error) throw error;
    return data as ResourceShare;
  },

  async revokeShare(shareId: string): Promise<void> {
    const { error } = await supabase
      .from('resource_shares')
      .delete()
      .eq('id', shareId);

    if (error) throw error;
  }
};
