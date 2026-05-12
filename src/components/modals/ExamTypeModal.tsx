import React, { useState, useEffect } from 'react';
import { X, Save, Loader, BookOpen } from 'lucide-react';
import { ExamType } from '../../services/examService';
import examService from '../../services/examService';
import toast from 'react-hot-toast';

interface ExamTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  examType?: ExamType | null;
  onUpdate: () => void;
}

export const ExamTypeModal: React.FC<ExamTypeModalProps> = ({
  isOpen,
  onClose,
  examType,
  onUpdate
}) => {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    name_gujarati: '',
    description_gujarati: '',
    is_active: true
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEditing = !!examType;

  useEffect(() => {
    if (examType && isOpen) {
      setFormData({
        name: examType.name || '',
        code: examType.code || '',
        description: examType.description || '',
        name_gujarati: examType.name_gujarati || '',
        description_gujarati: examType.description_gujarati || '',
        is_active: examType.is_active
      });
    } else if (isOpen) {
      setFormData({
        name: '',
        code: '',
        description: '',
        name_gujarati: '',
        description_gujarati: '',
        is_active: true
      });
    }
    setErrors({});
  }, [examType, isOpen]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Exam name is required';
    }

    if (!formData.code.trim()) {
      newErrors.code = 'Exam code is required';
    } else if (formData.code.length < 2) {
      newErrors.code = 'Exam code must be at least 2 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const submitData = {
        ...formData,
        name: formData.name.trim(),
        code: formData.code.trim().toUpperCase(),
        description: formData.description.trim() || undefined
      };

      if (isEditing && examType) {
        await examService.updateExamType(examType.id, submitData);
        toast.success('Exam type updated successfully');
      } else {
        await examService.createExamType(submitData);
        toast.success('Exam type created successfully');
      }
      
      onUpdate();
      onClose();
    } catch (error: any) {
      console.error('Exam type save error:', error);
      const message = error.response?.data?.message || 
                     `Failed to ${isEditing ? 'update' : 'create'} exam type`;
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center">
            <div className="p-2 bg-primary-100 rounded-lg mr-3">
              <BookOpen className="h-5 w-5 text-primary-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">
              {isEditing ? 'Edit Exam Type' : 'Create New Exam Type'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={loading}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Exam Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                  errors.name ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="e.g., Joint Entrance Examination"
                disabled={loading}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Exam Code *
              </label>
              <input
                type="text"
                name="code"
                value={formData.code}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                  errors.code ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="e.g., JEE"
                disabled={loading}
                style={{ textTransform: 'uppercase' }}
              />
              {errors.code && (
                <p className="mt-1 text-sm text-red-600">{errors.code}</p>
              )}
              <p className="mt-1 text-sm text-gray-500">
                Code will be automatically converted to uppercase
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Brief description of the exam (optional)"
              disabled={loading}
            />
          </div>

          {/* Gujarati translation block removed — Gujarati input was discontinued. */}

          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_active"
              name="is_active"
              checked={formData.is_active}
              onChange={handleChange}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              disabled={loading}
            />
            <label htmlFor="is_active" className="ml-2 block text-sm text-gray-700">
              Active (exam type is available for use)
            </label>
          </div>

          {isEditing && examType && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Current Statistics</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Test Series:</span>
                  <span className="ml-2 font-medium">{examType.testSeriesCount || 0}</span>
                </div>
                <div>
                  <span className="text-gray-600">PYQs:</span>
                  <span className="ml-2 font-medium">{examType.pyqCount || 0}</span>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors inline-flex items-center"
            >
              {loading ? (
                <>
                  <Loader className="animate-spin h-4 w-4 mr-2" />
                  {isEditing ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {isEditing ? 'Update Exam Type' : 'Create Exam Type'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};