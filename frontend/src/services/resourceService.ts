import { supabase } from '../lib/supabase';
import { Resource, ResourceShare, ResourceShareWithDetails } from '../types/resources';

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

  async uploadResourceFile(file: File, coachId: string): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${coachId}/${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;

    const { error } = await supabase.storage
      .from('coach_resources')
      .upload(fileName, file);

    if (error) throw error;

    const { data } = supabase.storage
      .from('coach_resources')
      .getPublicUrl(fileName);

    return data.publicUrl;
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
