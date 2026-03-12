import React, { useState } from 'react';
import { X, CheckCircle, Search, Loader2 } from 'lucide-react';
import { Resource } from '../../../types/resources';

interface Client {
  id: string;
  name: string;
  email: string;
}

interface ShareResourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  resource: Resource | null;
  clients: Client[];
  onShare: (resourceId: string, clientIds: string[], message?: string) => Promise<void>;
}

export const ShareResourceModal: React.FC<ShareResourceModalProps> = ({
  isOpen,
  onClose,
  resource,
  clients,
  onShare
}) => {
  const [selectedClients, setSelectedClients] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !resource) return null;

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleClient = (id: string) => {
    const next = new Set(selectedClients);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedClients(next);
  };

  const handleShare = async () => {
    if (selectedClients.size === 0) {
      setError('Please select at least one client.');
      return;
    }
    
    try {
      setIsLoading(true);
      setError('');
      await onShare(resource.id, Array.from(selectedClients), message);
      
      // Reset state and close
      setSelectedClients(new Set());
      setMessage('');
      setSearchQuery('');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to share resource');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Share Resource</h2>
            <p className="text-sm text-gray-500 mt-1 line-clamp-1">{resource.title}</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
              {error}
            </div>
          )}

          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Select Clients
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text"
                placeholder="Search clients..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all text-gray-900"
              />
            </div>
            
            <div className="border border-gray-200 rounded-lg max-h-48 overflow-y-auto bg-gray-50">
              {filteredClients.length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {filteredClients.map(client => (
                    <label 
                      key={client.id}
                      className="flex items-center gap-3 p-3 hover:bg-white cursor-pointer transition-colors"
                    >
                      <input 
                        type="checkbox"
                        checked={selectedClients.has(client.id)}
                        onChange={() => toggleClient(client.id)}
                        className="w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{client.name}</p>
                        <p className="text-xs text-gray-500 truncate">{client.email}</p>
                      </div>
                    </label>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-sm text-gray-500">
                  No clients found.
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500 flex items-center justify-between">
              <span>{selectedClients.size} selected</span>
              {selectedClients.size > 0 && (
                <button 
                  onClick={() => setSelectedClients(new Set(filteredClients.map(c => c.id)))}
                  className="text-primary-600 hover:text-primary-700 font-medium"
                >
                  Select All
                </button>
              )}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Personal Message (Optional)
            </label>
            <textarea
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Add a note for the selected clients..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 text-sm text-gray-900"
            />
          </div>
        </div>

        <div className="p-6 border-t border-gray-100 bg-white flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            onClick={handleShare}
            disabled={isLoading || selectedClients.size === 0}
            className="flex items-center gap-2 px-6 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
            Share with {selectedClients.size} Client{selectedClients.size !== 1 ? 's' : ''}
          </button>
        </div>
      </div>
    </div>
  );
};
