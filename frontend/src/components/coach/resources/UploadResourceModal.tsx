import React, { useState } from 'react';
import { X, Upload, Link as LinkIcon, FileText, Loader2 } from 'lucide-react';
import { ResourceType } from '../../../types/resources';

interface UploadResourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    title: string;
    description: string;
    category: string;
    resource_type: ResourceType;
    external_url?: string;
    file?: File;
  }) => Promise<void>;
  categories: string[];
}

export const UploadResourceModal: React.FC<UploadResourceModalProps> = ({
  isOpen,
  onClose,
  onSave,
  categories
}) => {
  const [activeTab, setActiveTab] = useState<'file' | 'link'>('file');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [url, setUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (activeTab === 'file' && !file) {
      setError('Please select a file to upload.');
      return;
    }
    if (activeTab === 'link' && !url) {
      setError('Please enter a valid URL.');
      return;
    }

    const finalCategory = category === 'new' ? newCategory : category;
    if (!finalCategory) {
      setError('Please select or create a category.');
      return;
    }

    try {
      setIsLoading(true);
      await onSave({
        title,
        description,
        category: finalCategory,
        resource_type: activeTab === 'file' ? getFileType(file?.name || '') : 'link',
        external_url: activeTab === 'link' ? url : undefined,
        file: activeTab === 'file' && file ? file : undefined
      });
      handleClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save resource');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setTitle('');
    setDescription('');
    setCategory('');
    setNewCategory('');
    setUrl('');
    setFile(null);
    setError('');
    onClose();
  };

  const getFileType = (filename: string): ResourceType => {
    const ext = filename.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'pdf': return 'pdf';
      case 'doc': 
      case 'docx': return 'doc';
      case 'mp4':
      case 'mov': return 'video';
      default: return 'document' as ResourceType; // fallback
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900">Add New Resource</h2>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
              {error}
            </div>
          )}

          {/* Type Selection Tabs */}
          <div className="flex p-1 bg-gray-100 rounded-lg">
            <button
              type="button"
              onClick={() => setActiveTab('file')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'file' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Upload className="w-4 h-4" /> File Upload
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('link')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'link' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <LinkIcon className="w-4 h-4" /> External Link
            </button>
          </div>

          <div className="space-y-4 border-t border-gray-100 pt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 text-gray-900"
                placeholder="e.g. Interview Guide 2026"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 text-gray-900"
                placeholder="Briefly describe what this resource is about..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 mb-2 text-gray-900"
              >
                <option value="">Select a category...</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
                <option value="new">+ Create new category</option>
              </select>
              
              {category === 'new' && (
                <input
                  type="text"
                  required
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 text-gray-900"
                  placeholder="Enter new category name"
                />
              )}
            </div>

            {activeTab === 'link' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  required
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 text-gray-900"
                  placeholder="https://..."
                />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  File <span className="text-red-500">*</span>
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg">
                  <div className="space-y-1 text-center">
                    {file ? (
                      <div className="flex flex-col items-center">
                        <FileText className="mx-auto h-12 w-12 text-primary-500" />
                        <div className="text-sm text-gray-600 font-medium mt-2">{file.name}</div>
                        <div className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</div>
                        <button
                          type="button"
                          onClick={() => setFile(null)}
                          className="mt-2 text-xs text-red-600 hover:text-red-500"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <>
                        <Upload className="mx-auto h-12 w-12 text-gray-400" />
                        <div className="flex text-sm text-gray-600 justify-center">
                          <label className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500">
                            <span>Upload a file</span>
                            <input
                              type="file"
                              className="sr-only"
                              onChange={(e) => setFile(e.target.files?.[0] || null)}
                              accept=".pdf,.doc,.docx,.mp4,.mov"
                            />
                          </label>
                        </div>
                        <p className="text-xs text-gray-500">PDF, DOC, Video up to 50MB</p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </form>

        <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="flex items-center gap-2 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium transition-colors disabled:opacity-50"
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            Save Resource
          </button>
        </div>
      </div>
    </div>
  );
};
