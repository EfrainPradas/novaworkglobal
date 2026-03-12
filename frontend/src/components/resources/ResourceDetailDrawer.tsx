import React, { useEffect } from 'react';
import { Resource } from '../../types/resources';
import { X, ExternalLink, Download, FileText, Video, Link as LinkIcon, File } from 'lucide-react';
import { format } from 'date-fns';

interface ResourceDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  resource: Resource | null;
}

const getResourceIcon = (type: string) => {
  switch (type) {
    case 'pdf': return <FileText className="w-12 h-12 text-red-500" />;
    case 'video': return <Video className="w-12 h-12 text-blue-500" />;
    case 'link': return <LinkIcon className="w-12 h-12 text-green-500" />;
    case 'doc':
    case 'worksheet':
    case 'template':
    case 'guide':
    default:
      return <File className="w-12 h-12 text-primary-500" />;
  }
};

export const ResourceDetailDrawer: React.FC<ResourceDetailDrawerProps> = ({
  isOpen,
  onClose,
  resource
}) => {
  // Handle ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  if (!isOpen || !resource) return null;

  const url = resource.file_url || resource.external_url;
  const isExternalUrl = !!resource.external_url;

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
      />
      
      <div className={`fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'} flex flex-col`}>
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Resource Details</h2>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-gray-50 rounded-2xl">
              {getResourceIcon(resource.resource_type)}
            </div>
          </div>

          <div className="text-center mb-6">
            {resource.category && (
              <span className="inline-block px-3 py-1 bg-primary-50 text-primary-700 text-sm font-medium rounded-full mb-3">
                {resource.category}
              </span>
            )}
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{resource.title}</h1>
            <p className="text-sm text-gray-500">
              Added on {format(new Date(resource.created_at), 'MMMM d, yyyy')}
            </p>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Description</h3>
            <p className="text-gray-600 text-sm whitespace-pre-wrap">
              {resource.description || 'No description provided.'}
            </p>
          </div>

          <div className="bg-gray-50 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Details</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex justify-between">
                <span className="text-gray-500">Type</span>
                <span className="font-medium text-gray-900 capitalize">{resource.resource_type}</span>
              </li>
              <li className="flex justify-between">
                <span className="text-gray-500">Category</span>
                <span className="font-medium text-gray-900">{resource.category || 'Uncategorized'}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="p-4 border-t border-gray-100 bg-white">
          {url ? (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center w-full gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors shadow-sm"
            >
              {isExternalUrl ? <ExternalLink className="w-5 h-5" /> : <Download className="w-5 h-5" />}
              {isExternalUrl ? 'Open Link' : 'Download File'}
            </a>
          ) : (
            <div className="flex items-center justify-center w-full px-6 py-3 bg-gray-100 text-gray-500 font-medium rounded-lg">
              No link available
            </div>
          )}
        </div>
      </div>
    </>
  );
};
