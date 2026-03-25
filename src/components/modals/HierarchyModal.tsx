import React, { useState, useEffect } from 'react';
import { X, Save, Loader, Layers } from 'lucide-react';
import { SubjectHierarchy, Subject } from '../../services/subjectService';
import subjectService from '../../services/subjectService';
import toast from 'react-hot-toast';

interface HierarchyModalProps {
  isOpen: boolean;
  onClose: () => void;
  subject: Subject;
  hierarchy?: SubjectHierarchy | null;
  parent?: SubjectHierarchy | null;
  onUpdate: () => void;
}

const levelTypes = [
  { value: 'standard', label: 'Standard', description: 'Educational standard (e.g., "NCERT", "CBSE")' },
  { value: 'class', label: 'Class', description: 'Class level (e.g., "Class 6", "Class 10")' },
  { value: 'chapter', label: 'Chapter', description: 'Chapter or unit (e.g., "Chapter 1", "Algebra")' },
  { value: 'topic', label: 'Topic', description: 'Specific topic (e.g., "Fractions", "Photosynthesis")' }
];

export const HierarchyModal: React.FC<HierarchyModalProps> = ({
  isOpen,
  onClose,
  subject,
  hierarchy,
  parent,
  onUpdate
}) => {
  const [formData, setFormData] = useState({
    level_name: '',
    level_type: 'class' as 'standard' | 'class' | 'chapter' | 'topic',
    parent_id: parent?.id || null,
    description: '',
    order_index: 0,
    is_active: true
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [availableParents, setAvailableParents] = useState<SubjectHierarchy[]>([]);

  const isEditing = !!hierarchy;

  useEffect(() => {
    if (isOpen) {
      loadAvailableParents();
    }
  }, [isOpen, subject.id]);

  useEffect(() => {
    if (hierarchy && isOpen) {
      setFormData({
        level_name: hierarchy.level_name || '',
        level_type: hierarchy.level_type || 'class',
        parent_id: hierarchy.parent_id || null,
        description: hierarchy.description || '',
        order_index: hierarchy.order_index || 0,
        is_active: hierarchy.is_active
      });
    } else if (isOpen) {
      setFormData({
        level_name: '',
        level_type: parent ? getNextLevelType(parent.level_type) : 'class',
        parent_id: parent?.id || null,
        description: '',
        order_index: 0,
        is_active: true
      });
    }
    setErrors({});
  }, [hierarchy, parent, isOpen]);

  const getNextLevelType = (currentType: string): 'standard' | 'class' | 'chapter' | 'topic' => {
    const order = ['standard', 'class', 'chapter', 'topic'];
    const currentIndex = order.indexOf(currentType);
    const nextIndex = Math.min(currentIndex + 1, order.length - 1);
    return order[nextIndex] as 'standard' | 'class' | 'chapter' | 'topic';
  };

  const loadAvailableParents = async () => {
    try {
      const response = await subjectService.getHierarchyTree(subject.id);
      if (response.success) {
        setAvailableParents(response.data);
      }
    } catch (error) {
      console.error('Error loading parents:', error);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.level_name.trim()) {
      newErrors.level_name = 'Level name is required';
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
        subject_id: subject.id,
        level_name: formData.level_name.trim(),
        description: formData.description.trim() || undefined,
        parent_id: formData.parent_id || undefined
      };

      if (isEditing && hierarchy) {
        await subjectService.updateHierarchy(hierarchy.id, submitData);
        toast.success('Hierarchy updated successfully');
      } else {
        await subjectService.createHierarchy(submitData);
        toast.success('Hierarchy created successfully');
      }
      
      onUpdate();
      onClose();
    } catch (error: any) {
      console.error('Hierarchy save error:', error);
      const message = error.response?.data?.message || 
                     `Failed to ${isEditing ? 'update' : 'create'} hierarchy`;
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : 
               name === 'parent_id' ? (value === '' ? null : parseInt(value)) :
               name === 'order_index' ? parseInt(value) || 0 : value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const renderParentOptions = (hierarchies: SubjectHierarchy[], prefix = '') => {
    const options: JSX.Element[] = [];
    
    hierarchies.forEach(h => {
      if (!isEditing || h.id !== hierarchy?.id) { // Don't allow self as parent
        options.push(
          <option key={h.id} value={h.id}>
            {prefix}{h.level_name} ({h.level_type})
          </option>
        );
        
        if (h.children && h.children.length > 0) {
          options.push(...renderParentOptions(h.children, prefix + '  '));
        }
      }
    });
    
    return options;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center">
            <div className="p-2 bg-primary-100 rounded-lg mr-3">
              <Layers className="h-5 w-5 text-primary-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {isEditing ? 'Edit Hierarchy' : 'Create New Hierarchy'}
              </h2>
              <p className="text-sm text-gray-600">Subject: {subject.name}</p>
            </div>
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
                Level Name *
              </label>
              <input
                type="text"
                name="level_name"
                value={formData.level_name}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                  errors.level_name ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="e.g., Class 6, Chapter 1, Fractions"
                disabled={loading}
              />
              {errors.level_name && (
                <p className="mt-1 text-sm text-red-600">{errors.level_name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Level Type *
              </label>
              <select
                name="level_type"
                value={formData.level_type}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                disabled={loading}
              >
                {levelTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">
                {levelTypes.find(t => t.value === formData.level_type)?.description}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Parent Level
              </label>
              <select
                name="parent_id"
                value={formData.parent_id || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                disabled={loading}
              >
                <option value="">No Parent (Top Level)</option>
                {renderParentOptions(availableParents)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Order Index
              </label>
              <input
                type="number"
                name="order_index"
                value={formData.order_index}
                onChange={handleChange}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                disabled={loading}
              />
              <p className="mt-1 text-xs text-gray-500">
                Lower numbers appear first (0 = first)
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
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Optional description of this hierarchy level"
              disabled={loading}
            />
          </div>

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
              Active (hierarchy level is available for use)
            </label>
          </div>

          {parent && (
            <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
              <p className="text-sm font-medium text-primary-900 mb-1">Parent Context</p>
              <p className="text-sm text-primary-700">
                This will be created under: <strong>{parent.level_name}</strong> ({parent.level_type})
              </p>
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
                  {isEditing ? 'Update Hierarchy' : 'Create Hierarchy'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};