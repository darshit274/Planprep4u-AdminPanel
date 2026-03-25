import React, { useState, useEffect } from 'react';
import { X, Save, Loader } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

interface PDFEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  pdf: any;
  courses: any[];
  testSeries: any[];
  examTypes: any[];
  onUpdate: () => void;
}

export const PDFEditModal: React.FC<PDFEditModalProps> = ({
  isOpen,
  onClose,
  pdf,
  courses,
  testSeries,
  examTypes,
  onUpdate
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    course_id: '',
    access_level: 'free',
    tags: '',
    // Pricing fields
    price: 0,
    currency: 'INR',
    discount_percentage: 0,
    subscription_required: false,
    preview_pages: 0
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (pdf && isOpen) {
      setFormData({
        title: pdf.title || '',
        description: pdf.description || '',
        course_id: pdf.course_id?.toString() || '',
        access_level: pdf.access_level || 'free',
        tags: pdf.tags ? (Array.isArray(pdf.tags) ? pdf.tags.join(', ') : pdf.tags) : '',
        // Pricing fields
        price: pdf.price || 0,
        currency: pdf.currency || 'INR',
        discount_percentage: pdf.discount_percentage || 0,
        subscription_required: pdf.subscription_required || false,
        preview_pages: pdf.preview_pages || 0
      });
    }
  }, [pdf, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pdf?.id) return;

    setLoading(true);
    try {
      const updateData = {
        ...formData,
        course_id: formData.course_id ? parseInt(formData.course_id) : null,
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()).filter(Boolean) : null
      };

      await api.put(`/admin/pdf/${pdf.id}`, updateData);
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? parseFloat(value) || 0 : value
    }));
  };

  if (!isOpen || !pdf) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Edit PDF</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={loading}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Enter PDF title"
            />
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Enter PDF description"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Course
              </label>
              <select
                name="course_id"
                value={formData.course_id}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">Select course</option>
                {Array.isArray(courses) && courses.length > 0 ? courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.title}
                  </option>
                )) : (
                  <option value="" disabled>Loading courses...</option>
                )}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Access Level
              </label>
              <select
                name="access_level"
                value={formData.access_level}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="free">Free</option>
                <option value="premium">Premium</option>
                <option value="restricted">Restricted</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tags
            </label>
            <input
              type="text"
              name="tags"
              value={formData.tags}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Enter tags separated by commas"
            />
            <p className="text-sm text-gray-500 mt-1">
              Separate multiple tags with commas (e.g., physics, chemistry, biology)
            </p>
          </div>

          {/* Pricing Section */}
          <div className="border-t pt-6">
            <h4 className="text-lg font-medium text-gray-900 mb-4">Pricing Settings</h4>

            <div className="space-y-4">
              {/* Price and Currency (show only if Premium) */}
              {formData.access_level === 'premium' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Price
                    </label>
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleChange}
                      step="0.01"
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Currency
                    </label>
                    <select
                      name="currency"
                      value={formData.currency}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="INR">INR (₹)</option>
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Discount Percentage (show only if Premium) */}
              {formData.access_level === 'premium' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Discount Percentage
                  </label>
                  <input
                    type="number"
                    name="discount_percentage"
                    value={formData.discount_percentage}
                    onChange={handleChange}
                    min="0"
                    max="100"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="0.00"
                  />
                  <p className="text-sm text-gray-500 mt-1">Optional discount percentage (0-100)</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Subscription Required */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="subscription_required"
                    id="subscription_required"
                    checked={formData.subscription_required}
                    onChange={handleChange}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="subscription_required" className="ml-2 block text-sm text-gray-700">
                    Requires subscription
                  </label>
                </div>

                {/* Preview Pages */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preview Pages
                  </label>
                  <input
                    type="number"
                    name="preview_pages"
                    value={formData.preview_pages}
                    onChange={handleChange}
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="0"
                  />
                  <p className="text-sm text-gray-500 mt-1">Number of free preview pages</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center"
            >
              {loading ? (
                <>
                  <Loader className="animate-spin h-4 w-4 mr-2" />
                  Updating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Update PDF
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};