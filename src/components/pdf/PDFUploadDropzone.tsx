import React, { useState, useCallback } from 'react';
import { Upload, FileText, X, AlertCircle, CheckCircle } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

interface PDFUploadDropzoneProps {
  onUploadSuccess?: (pdf: any) => void;
  onUploadError?: (error: string) => void;
  courses: Array<{
    id: string;
    title: string;
  }>;
  testSeries?: Array<{
    id: string;
    title: string;
  }>;
  examTypes?: Array<{
    id: number;
    name: string;
  }>;
}

export const PDFUploadDropzone: React.FC<PDFUploadDropzoneProps> = ({
  onUploadSuccess,
  onUploadError,
  courses,
  testSeries = [],
  examTypes = []
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    course_id: '',
    access_level: 'free',
    test_series_id: '',
    exam_type_id: '',
    tags: '',
    // Pricing fields
    price: '',
    currency: 'INR',
    discount_percentage: '',
    subscription_required: false,
    preview_pages: ''
  });

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const validateFile = (file: File): string | null => {
    // Check file type
    if (file.type !== 'application/pdf') {
      return 'Only PDF files are allowed';
    }

    // Check file size (50MB limit)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      return 'File size must be less than 50MB';
    }

    return null;
  };

  const handleFileSelect = (file: File) => {
    const error = validateFile(file);
    if (error) {
      toast.error(error);
      if (onUploadError) onUploadError(error);
      return;
    }

    setSelectedFile(file);
    
    // Auto-fill title from filename if not set
    if (!formData.title) {
      const titleFromFilename = file.name.replace('.pdf', '').replace(/[-_]/g, ' ');
      setFormData(prev => ({ ...prev, title: titleFromFilename }));
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 1) {
      toast.error('Please upload only one PDF at a time');
      return;
    }

    if (files.length === 1) {
      handleFileSelect(files[0]);
    }
  }, [formData.title]);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !formData.title || !formData.course_id) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const uploadData = new FormData();
      uploadData.append('pdf', selectedFile);
      uploadData.append('title', formData.title);
      uploadData.append('description', formData.description);
      uploadData.append('course_id', formData.course_id);
      uploadData.append('access_level', formData.access_level);
      
      if (formData.test_series_id) {
        uploadData.append('test_series_id', formData.test_series_id);
      }
      
      if (formData.exam_type_id) {
        uploadData.append('exam_type_id', formData.exam_type_id);
      }
      
      if (formData.tags) {
        const tagsArray = formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
        uploadData.append('tags', JSON.stringify(tagsArray));
      }

      // Add pricing fields
      uploadData.append('price', formData.price || '0');
      uploadData.append('currency', formData.currency);
      uploadData.append('discount_percentage', formData.discount_percentage || '0');
      uploadData.append('subscription_required', formData.subscription_required.toString());
      uploadData.append('preview_pages', formData.preview_pages || '0');

      const response = await api.post('/admin/pdf/upload', uploadData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const progress = progressEvent.total 
            ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
            : 0;
          setUploadProgress(progress);
        }
      });

      toast.success('PDF uploaded successfully!');
      
      // Reset form
      setSelectedFile(null);
      setFormData({
        title: '',
        description: '',
        course_id: '',
        access_level: 'free',
        test_series_id: '',
        exam_type_id: '',
        tags: '',
        // Pricing fields
        price: '',
        currency: 'INR',
        discount_percentage: '',
        subscription_required: false,
        preview_pages: ''
      });
      setUploadProgress(0);

      if (onUploadSuccess) {
        onUploadSuccess(response.data.data);
      }
    } catch (error: any) {
      console.error('PDF upload error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to upload PDF';
      toast.error(errorMessage);
      
      if (onUploadError) {
        onUploadError(errorMessage);
      }
    } finally {
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const removeFile = () => {
    setSelectedFile(null);
    setUploadProgress(0);
  };

  return (
    <div className="space-y-6">
      {/* File Drop Zone */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragOver 
            ? 'border-primary-500 bg-primary-50' 
            : selectedFile 
              ? 'border-green-500 bg-green-50' 
              : 'border-gray-300 bg-gray-50 hover:border-gray-400'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {selectedFile ? (
          <div className="space-y-4">
            <div className="flex items-center justify-center">
              <CheckCircle className="h-12 w-12 text-green-500" />
            </div>
            <div>
              <p className="text-lg font-medium text-gray-900">{selectedFile.name}</p>
              <p className="text-sm text-gray-500">
                {formatFileSize(selectedFile.size)} • PDF Document
              </p>
            </div>
            <button
              onClick={removeFile}
              className="inline-flex items-center px-3 py-1 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100"
            >
              <X className="h-4 w-4 mr-2" />
              Remove File
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-center">
              <Upload className={`h-12 w-12 ${isDragOver ? 'text-primary-500' : 'text-gray-400'}`} />
            </div>
            <div>
              <p className="text-lg font-medium text-gray-900">
                {isDragOver ? 'Drop your PDF here' : 'Upload PDF Document'}
              </p>
              <p className="text-sm text-gray-500">
                Drag and drop your PDF file here, or click to browse
              </p>
              <p className="text-xs text-gray-400 mt-2">
                Maximum file size: 50MB • Only PDF files allowed
              </p>
            </div>
            <div>
              <input
                type="file"
                accept=".pdf,application/pdf"
                onChange={handleFileInputChange}
                className="hidden"
                id="pdf-upload"
              />
              <label
                htmlFor="pdf-upload"
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
              >
                <FileText className="h-4 w-4 mr-2" />
                Choose PDF File
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Upload Form */}
      {selectedFile && (
        <div className="space-y-4 p-6 bg-white border rounded-lg">
          <h3 className="text-lg font-medium text-gray-900">PDF Details</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Enter PDF title"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Course *
              </label>
              <select
                value={formData.course_id}
                onChange={(e) => setFormData(prev => ({ ...prev, course_id: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              >
                <option value="">Select a course</option>
                {Array.isArray(courses) && courses.length > 0 ? courses.map(course => (
                  <option key={course.id} value={course.id}>
                    {course.title}
                  </option>
                )) : (
                  <option value="" disabled>Loading courses...</option>
                )}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Enter PDF description (optional)"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Access Level
              </label>
              <select
                value={formData.access_level}
                onChange={(e) => setFormData(prev => ({ ...prev, access_level: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="free">Free</option>
                <option value="premium">Premium</option>
                <option value="restricted">Restricted</option>
              </select>
            </div>

            {testSeries.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Test Series (Optional)
                </label>
                <select
                  value={formData.test_series_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, test_series_id: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">None</option>
                  {Array.isArray(testSeries) && testSeries.length > 0 ? testSeries.map(ts => (
                    <option key={ts.id} value={ts.id}>
                      {ts.title}
                    </option>
                  )) : (
                    <option value="" disabled>Loading test series...</option>
                  )}
                </select>
              </div>
            )}

            {examTypes.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Exam Type (Optional)
                </label>
                <select
                  value={formData.exam_type_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, exam_type_id: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">None</option>
                  {Array.isArray(examTypes) && examTypes.length > 0 ? examTypes.map(et => (
                    <option key={et.id} value={et.id}>
                      {et.name}
                    </option>
                  )) : (
                    <option value="" disabled>Loading exam types...</option>
                  )}
                </select>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tags (Optional)
            </label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Enter tags separated by commas (e.g., study, notes, important)"
            />
            <p className="text-xs text-gray-500 mt-1">Separate multiple tags with commas</p>
          </div>

          {/* Pricing Section */}
          <div className="border-t pt-4">
            <h4 className="text-md font-medium text-gray-900 mb-4">Pricing Settings</h4>

            <div className="space-y-4">
              {/* Price and Currency (show only if Premium) */}
              {formData.access_level === 'premium' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Price
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.price}
                      onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Currency
                    </label>
                    <select
                      value={formData.currency}
                      onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Discount Percentage
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={formData.discount_percentage}
                    onChange={(e) => setFormData(prev => ({ ...prev, discount_percentage: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="0.00"
                  />
                  <p className="text-xs text-gray-500 mt-1">Optional discount percentage (0-100)</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Subscription Required */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="subscription_required"
                    checked={formData.subscription_required}
                    onChange={(e) => setFormData(prev => ({ ...prev, subscription_required: e.target.checked }))}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="subscription_required" className="ml-2 block text-sm text-gray-700">
                    Requires subscription
                  </label>
                </div>

                {/* Preview Pages */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Preview Pages
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.preview_pages}
                    onChange={(e) => setFormData(prev => ({ ...prev, preview_pages: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="0"
                  />
                  <p className="text-xs text-gray-500 mt-1">Number of free preview pages</p>
                </div>
              </div>
            </div>
          </div>

          {/* Upload Progress */}
          {isUploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Uploading PDF...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Upload Button */}
          <div className="flex justify-end">
            <button
              onClick={handleUpload}
              disabled={isUploading || !formData.title || !formData.course_id}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Upload className="h-4 w-4 mr-2" />
              {isUploading ? 'Uploading...' : 'Upload PDF'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};