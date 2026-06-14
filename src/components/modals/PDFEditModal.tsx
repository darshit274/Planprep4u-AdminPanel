import React, { useState, useEffect } from 'react';
import { X, Save, Loader, Folder } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

interface PDFEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  pdf: any;
  categories: any[];  // PDF folders (pdf_categories)
  courses: any[];     // Test series / courses
  onUpdate: () => void;
}

export const PDFEditModal: React.FC<PDFEditModalProps> = ({
  isOpen, onClose, pdf, categories, courses, onUpdate
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category_id: '',    // folder id (integer as string)
    course_id: '',      // test_series uuid string
    access_level: 'free',
    tags: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (pdf && isOpen) {
      setFormData({
        title: pdf.title || '',
        description: pdf.description || '',
        category_id: pdf.category_id != null ? String(pdf.category_id) : '',
        // PDF table stores test_series_id, not course_id
        course_id: pdf.test_series_id || '',
        access_level: pdf.access_level || 'free',
        tags: pdf.tags
          ? Array.isArray(pdf.tags) ? pdf.tags.join(', ') : pdf.tags
          : '',
      });
    }
  }, [pdf, isOpen]);

  const selectedFolder = categories.find(c => String(c.id) === formData.category_id);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pdf?.id) return;

    setLoading(true);
    try {
      const body: Record<string, any> = {
        title: formData.title,
        description: formData.description,
        access_level: formData.access_level,
        tags: formData.tags
          ? formData.tags.split(',').map(t => t.trim()).filter(Boolean)
          : null,
      };

      if (formData.category_id) {
        // Moving into / keeping in a folder
        body.category_id = parseInt(formData.category_id);
        body.course_id = null;
      } else if (formData.course_id) {
        // Course-linked PDF (no folder) — send UUID string, never parseInt
        body.course_id = formData.course_id;
        body.category_id = null;
      }

      await api.put(`/admin/pdf/${pdf.id}`, body);
      toast.success('PDF updated successfully');
      onUpdate();
      onClose();
    } catch (error: any) {
      console.error('Update PDF error:', error);
      toast.error(error.response?.data?.message || 'Failed to update PDF');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !pdf) return null;

  const folderAccessLevel = selectedFolder?.access_level;
  const effectiveAccessLevel = selectedFolder ? folderAccessLevel : formData.access_level;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Edit PDF</h2>
            <p className="text-sm text-gray-500 mt-0.5">{pdf.original_filename}</p>
          </div>
          <button onClick={onClose} disabled={loading} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={e => setFormData(p => ({ ...p, title: e.target.value }))}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Enter PDF title"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Enter PDF description (optional)"
            />
          </div>

          {/* Folder */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Folder className="inline h-4 w-4 mr-1 text-gray-500" />
              Folder
            </label>
            <select
              value={formData.category_id}
              onChange={e => setFormData(p => ({ ...p, category_id: e.target.value, course_id: '' }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">No folder (link to course instead)</option>
              {categories.map(cat => (
                <option key={cat.id} value={String(cat.id)}>
                  {cat.parent_category_id
                    ? `  └ ${cat.name}`
                    : cat.name
                  }{cat.access_level && cat.access_level !== 'free' ? ` [${cat.access_level}]` : ''}
                </option>
              ))}
            </select>
            {selectedFolder && (
              <p className="text-xs text-gray-500 mt-1">
                This folder is <span className={`font-semibold ${selectedFolder.access_level === 'premium' ? 'text-yellow-600' : 'text-green-600'}`}>
                  {selectedFolder.access_level}
                </span> — the PDF will inherit this access level.
              </p>
            )}
          </div>

          {/* Course (only when no folder selected) */}
          {!formData.category_id && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Course (optional)</label>
              <select
                value={formData.course_id}
                onChange={e => setFormData(p => ({ ...p, course_id: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">No course</option>
                {courses.map(c => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
            </div>
          )}

          {/* Access Level — only editable when NOT in a folder */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Access Level</label>
            {selectedFolder ? (
              <div className={`px-4 py-3 rounded-lg border-2 text-sm font-medium text-center ${
                effectiveAccessLevel === 'premium'
                  ? 'border-yellow-400 bg-yellow-50 text-yellow-700'
                  : 'border-green-400 bg-green-50 text-green-700'
              }`}>
                Inherited from folder: <span className="capitalize">{effectiveAccessLevel}</span>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {(['free', 'premium'] as const).map(level => (
                  <label
                    key={level}
                    className={`flex items-center justify-center p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                      formData.access_level === level
                        ? level === 'free'
                          ? 'border-green-500 bg-green-50 text-green-700'
                          : 'border-yellow-500 bg-yellow-50 text-yellow-700'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="access_level"
                      value={level}
                      checked={formData.access_level === level}
                      onChange={e => setFormData(p => ({ ...p, access_level: e.target.value }))}
                      className="hidden"
                    />
                    <span className="text-sm font-medium capitalize">{level}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
            <input
              type="text"
              value={formData.tags}
              onChange={e => setFormData(p => ({ ...p, tags: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="e.g. syllabus, 2024, physics"
            />
            <p className="text-xs text-gray-500 mt-1">Separate tags with commas</p>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-2 border-t">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50 inline-flex items-center"
            >
              {loading
                ? <><Loader className="animate-spin h-4 w-4 mr-2" />Saving...</>
                : <><Save className="h-4 w-4 mr-2" />Save Changes</>
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
