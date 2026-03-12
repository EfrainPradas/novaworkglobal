export type ResourceType = 'pdf' | 'doc' | 'video' | 'link' | 'worksheet' | 'template' | 'guide';

export interface Resource {
  id: string;
  coach_id: string;
  title: string;
  description: string | null;
  category: string | null;
  resource_type: ResourceType;
  file_url: string | null;
  external_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface ResourceShare {
  id: string;
  resource_id: string;
  coach_id: string;
  client_id: string;
  message: string | null;
  status: 'shared' | 'viewed' | 'completed';
  shared_at: string;
  viewed_at: string | null;
  completed_at: string | null;
}

export interface ResourceShareWithDetails extends ResourceShare {
  resources: Resource | null;
}
