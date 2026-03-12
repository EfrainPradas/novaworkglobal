import React from 'react';
import { Resource, ResourceShareWithDetails } from '../../types/resources';
import { FileText, Video, Link as LinkIcon, File, Download, ExternalLink, Eye, CheckCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface ResourceCardProps {
  resource?: Resource;
  share?: ResourceShareWithDetails;
  isClientView?: boolean;
  onOpen?: (resource: Resource) => void;
  onShare?: (resource: Resource) => void;
  onDelete?: (resource: Resource) => void;
  onMarkStatus?: (shareId: string, status: 'viewed' | 'completed') => void;
}

const getResourceIcon = (type: string) => {
  switch (type) {
    case 'pdf': return <FileText className="w-8 h-8 text-red-500" />;
    case 'video': return <Video className="w-8 h-8 text-blue-500" />;
    case 'link': return <LinkIcon className="w-8 h-8 text-green-500" />;
    case 'doc':
    case 'worksheet':
    case 'template':
    case 'guide':
    default:
      return <File className="w-8 h-8 text-primary-500" />;
  }
};

export const ResourceCard: React.FC<ResourceCardProps> = ({ 
  resource, 
  share, 
  isClientView = false,
  onOpen,
  onShare,
  onDelete,
  onMarkStatus
}) => {
  const displayResource = isClientView && share ? share.resources : resource;
  
  if (!displayResource) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow overflow-hidden flex flex-col h-full">
      <div className="p-5 flex-grow">
        <div className="flex justify-between items-start mb-4">
          <div className="p-3 bg-gray-50 rounded-lg">
            {getResourceIcon(displayResource.resource_type)}
          </div>
          {displayResource.category && (
            <span className="px-2.5 py-1 bg-primary-50 text-primary-700 text-xs font-medium rounded-full">
              {displayResource.category}
            </span>
          )}
        </div>
        
        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2" title={displayResource.title}>
          {displayResource.title}
        </h3>
        
        {displayResource.description && (
          <p className="text-sm text-gray-500 line-clamp-3 mb-4">
            {displayResource.description}
          </p>
        )}
      </div>

      <div className="px-5 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
        <div className="text-xs text-gray-500 flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" />
          {format(new Date(displayResource.created_at), 'MMM d, yyyy')}
        </div>
        
        <div className="flex items-center gap-2">
          {!isClientView && (
            <>
              {onShare && (
                <button
                  onClick={() => onShare(displayResource)}
                  className="p-1.5 text-primary-600 hover:bg-primary-50 rounded-md transition-colors"
                  title="Share with client"
                >
                  <ExternalLink className="w-4 h-4" />
                </button>
              )}
            </>
          )}

          {isClientView && share && (
            <>
              {share.status === 'shared' && onMarkStatus && (
                <button
                  onClick={() => onMarkStatus(share.id, 'viewed')}
                  className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                  title="Mark as viewed"
                >
                  <Eye className="w-4 h-4" />
                </button>
              )}
              {scanStatusAndReturnAction(share, onMarkStatus)}
            </>
          )}

          {onOpen && (
            <button
              onClick={() => onOpen(displayResource)}
              className="px-3 py-1.5 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700 transition-colors"
            >
              Open
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Helper inside the file to keep code clean
function scanStatusAndReturnAction(share: ResourceShareWithDetails, onMarkStatus?: (id: string, st: 'completed') => void) {
  if (share.status === 'completed') {
    return <CheckCircle className="w-5 h-5 text-green-500" title="Completed" />;
  }
  if ((share.status === 'viewed' || share.status === 'shared') && onMarkStatus) {
    return (
      <button
        onClick={() => onMarkStatus(share.id, 'completed')}
        className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-md transition-colors"
        title="Mark as completed"
      >
        <CheckCircle className="w-4 h-4" />
      </button>
    );
  }
  return null;
}
