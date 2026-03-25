import React, { useState } from 'react';
import { Search, Upload, Download, Eye, Edit, Trash2, FileText, X } from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import { CardSkeleton } from '../../components/common/LoadingSpinner';
import { ApiError, ErrorBoundary } from '../../components/common/ErrorBoundary';
import { PDFUploadDropzone } from '../../components/pdf/PDFUploadDropzone';
import { ConfirmModal } from '../../components/modals/ConfirmModal';
import { PDFEditModal } from '../../components/modals/PDFEditModal';
import { PDFPreviewModal } from '../../components/modals/PDFPreviewModal';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { ENV } from '../../config/constants';

const pdfsService = {
  getPdfs: async (params: any) => {
    console.log('pdfsService.getPdfs called with params:', params);
    const token = sessionStorage.getItem('admin_token');
    console.log('Token in pdfsService:', token ? 'Present' : 'Missing');
    const queryParams = new URLSearchParams(params);
    console.log('Query string:', queryParams.toString());
    
    try {
      const response = await api.get(`/admin/pdf/list?${queryParams}`);
      console.log('pdfsService response:', response);
      console.log('pdfsService response.data:', response.data);
      const serviceReturn = { data: response.data };
      console.log('pdfsService returning:', serviceReturn);
      return serviceReturn;
    } catch (error) {
      console.error('pdfsService error:', error);
      throw error;
    }
  },

  getPdfStats: async () => {
    const response = await api.get('/admin/pdf/stats');
    return { data: response.data };
  },

  getPdfCategories: async () => {
    const response = await api.get('/admin/pdf/categories');
    return { data: response.data };
  },

  getExamTypes: async () => {
    const response = await api.get('/admin/exam-types/dropdown');
    return { data: response.data };
  },

  getTestSeries: async () => {
    const response = await api.get('/admin/test-management');
    return { data: response.data };
  }
};

export const PDFsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [category, setCategory] = useState('');
  const [accessLevel, setAccessLevel] = useState('');
  
  // Upload and modal states
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, pdf: null as any, loading: false });
  const [editModal, setEditModal] = useState({ isOpen: false, pdf: null as any });
  const [previewModal, setPreviewModal] = useState({ isOpen: false, pdf: null as any });

  const { 
    data: pdfsResponse, 
    loading, 
    error, 
    refresh 
  } = useApi(() => pdfsService.getPdfs({
    page: currentPage,
    limit: pageSize,
    search: searchTerm,
    category_id: category,
    access_level: accessLevel
  }));

  const { data: stats } = useApi(pdfsService.getPdfStats);
  const { data: categoriesResponse } = useApi(pdfsService.getPdfCategories);
  const { data: examTypesResponse } = useApi(pdfsService.getExamTypes);
  const { data: testSeriesResponse } = useApi(pdfsService.getTestSeries);

  const categories = categoriesResponse?.data || [];
  const examTypes = examTypesResponse?.data || [];
  const testSeries = testSeriesResponse?.data || [];

  // Debug logging
  console.log('PDFs Response:', pdfsResponse);
  console.log('PDFs Response Data:', pdfsResponse?.data);
  console.log('Error:', error);
  console.log('Loading:', loading);

  // Handle different possible response structures
  const apiData = pdfsResponse?.data;
  
  // If API returns direct array (old structure), use it directly
  // If API returns {success: true, data: [...], pagination: {...}}, extract data
  let pdfs, pagination;
  
  if (Array.isArray(apiData)) {
    // Direct array response
    pdfs = apiData;
    pagination = { total: apiData.length, page: 1, limit: 10, totalPages: 1 };
  } else if (apiData?.success && Array.isArray(apiData.data)) {
    // Structured response with success flag
    pdfs = apiData.data;
    pagination = apiData.pagination || { total: 0, page: 1, limit: 10, totalPages: 0 };
  } else if (Array.isArray(apiData?.data)) {
    // Nested data structure
    pdfs = apiData.data;
    pagination = apiData.pagination || { total: 0, page: 1, limit: 10, totalPages: 0 };
  } else {
    // Fallback
    pdfs = [];
    pagination = { total: 0, page: 1, limit: 10, totalPages: 0 };
  }
  
  console.log('Raw PDFs extraction:', pdfsResponse?.data?.data);
  console.log('Actual response structure:', pdfsResponse?.data);
  console.log('Parsed PDFs:', pdfs);
  console.log('Pagination:', pagination);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Upload handlers
  const handleAddPdf = () => {
    setShowUploadForm(true);
  };

  const handleUploadSuccess = (uploadedPdf: any) => {
    toast.success('PDF uploaded successfully!');
    refresh();
    setShowUploadForm(false);
  };

  const handleUploadError = (error: string) => {
    toast.error(error);
  };

  // Test API function
  const testApiCall = async () => {
    try {
      console.log('Testing API call...');
      const token = sessionStorage.getItem('admin_token');
      console.log('Token:', token ? 'Present' : 'Missing');
      
      const response = await fetch(ENV.API_URL + '/api/admin/pdf/list?page=1&limit=10', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);
      
      if (data.success) {
        toast.success(`Found ${data.data.length} PDFs`);
      } else {
        toast.error('API call failed: ' + data.message);
      }
    } catch (error) {
      console.error('API test error:', error);
      toast.error('API test failed: ' + error);
    }
  };

  const handleDeletePdf = (pdf: any) => {
    setConfirmModal({ isOpen: true, pdf, loading: false });
  };

  const handleEditPdf = (pdf: any) => {
    setEditModal({ isOpen: true, pdf });
  };

  const handlePreviewPdf = (pdf: any) => {
    setPreviewModal({ isOpen: true, pdf });
  };

  const handleDownloadPdf = async (pdf: any) => {
    try {
      const response = await api.get(`/admin/pdf/${pdf.id}/download`, {
        responseType: 'blob'
      });

      // IMPORTANT: Validate that we received a PDF, not JSON
      const contentType = response.headers['content-type'];
      console.log('Download response content-type:', contentType);

      // If we got JSON instead of PDF, it's an error
      if (contentType && contentType.includes('application/json')) {
        // Try to read the JSON error message
        const text = await response.data.text();
        console.error('Received JSON instead of PDF:', text);
        toast.error('Server error: Received invalid response instead of PDF file. Please contact support.');
        return;
      }

      // Validate that we got a real PDF file (minimum size check)
      if (response.data.size < 100) {
        console.error('Downloaded file is too small:', response.data.size, 'bytes');
        toast.error('Downloaded file is invalid (too small). PDF may be corrupted on server.');
        return;
      }

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = pdf.original_filename || pdf.title + '.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('PDF downloaded successfully');
    } catch (error: any) {
      console.error('PDF download error:', error);
      const message = error.response?.data?.message || 'Failed to download PDF';
      toast.error(message);
    }
  };

  const handleConfirmDelete = async () => {
    try {
      setConfirmModal(prev => ({ ...prev, loading: true }));
      await api.delete(`/admin/pdf/${confirmModal.pdf.id}`);
      toast.success('PDF deleted successfully');
      refresh();
      setConfirmModal({ isOpen: false, pdf: null, loading: false });
    } catch (error: any) {
      console.error('Delete PDF error:', error);
      toast.error(error.response?.data?.message || 'Failed to delete PDF');
      setConfirmModal(prev => ({ ...prev, loading: false }));
    }
  };

  if (error) {
    console.error('PDF Page Error:', error);
    return <ApiError error={error} onRetry={refresh} />;
  }

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">PDF Management</h1>
            <p className="text-gray-600">Upload and manage study materials and resources</p>
          </div>
          <div className="flex space-x-3">
            {showUploadForm && (
              <button 
                onClick={() => setShowUploadForm(false)}
                className="btn-secondary inline-flex items-center"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel Upload
              </button>
            )}
            <button 
              onClick={testApiCall}
              className="btn-secondary inline-flex items-center mr-3"
            >
              Test API
            </button>
            <button 
              onClick={handleAddPdf}
              disabled={showUploadForm}
              className="btn-primary inline-flex items-center disabled:opacity-50"
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload PDF
            </button>
          </div>
        </div>

        {/* PDF Upload Form */}
        {showUploadForm && (
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Upload New PDF</h2>
              <button 
                onClick={() => setShowUploadForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <PDFUploadDropzone
              categories={categories}
              testSeries={testSeries}
              examTypes={examTypes}
              onUploadSuccess={handleUploadSuccess}
              onUploadError={handleUploadError}
            />
          </div>
        )}

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="card p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-primary-100">
                <FileText className="h-6 w-6 text-primary-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total PDFs</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.data?.total_pdfs || 0}</p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100">
                <Download className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Free PDFs</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.data?.free_pdfs || 0}</p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-yellow-100">
                <Eye className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Premium PDFs</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.data?.paid_pdfs || 0}</p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-primary-100">
                <Download className="h-6 w-6 text-primary-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Downloads</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.data?.total_downloads || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="card p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search PDFs
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search PDFs..."
                  className="input-field pl-10"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="input-field"
              >
                <option value="">All Categories</option>
                {categories.map((cat: any) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Access Level
              </label>
              <select
                value={accessLevel}
                onChange={(e) => setAccessLevel(e.target.value)}
                className="input-field"
              >
                <option value="">All Levels</option>
                <option value="free">Free</option>
                <option value="premium">Premium</option>
                <option value="restricted">Restricted</option>
              </select>
            </div>

            <button 
              onClick={refresh}
              className="btn-primary"
            >
              <Search className="h-4 w-4 mr-2" />
              Search
            </button>
          </div>
        </div>

        {/* PDFs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            Array.from({ length: pageSize }).map((_, index) => (
              <CardSkeleton key={index} />
            ))
          ) : pdfs.length === 0 ? (
            <div className="col-span-full">
              <div className="card p-12 text-center">
                <FileText className="mx-auto h-24 w-24 text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No PDFs found</h3>
                <p className="text-gray-600 mb-6">Upload your first PDF to get started.</p>
                <button onClick={handleAddPdf} className="btn-primary">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload PDF
                </button>
              </div>
            </div>
          ) : (
            pdfs.map((pdf: any) => (
              <div key={pdf.id} className="card hover:shadow-lg transition-shadow">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center">
                      <div className="p-3 rounded-lg bg-red-100">
                        <FileText className="h-8 w-8 text-red-600" />
                      </div>
                      <div className="ml-3">
                        <h3 className="text-lg font-medium text-gray-900 truncate">
                          {pdf.title}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {pdf.formatted_file_size || formatFileSize(pdf.file_size || 0)}
                        </p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      pdf.access_level === 'free'
                        ? 'bg-green-100 text-green-800' 
                        : pdf.access_level === 'premium'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {pdf.access_level === 'free' ? 'Free' : pdf.access_level === 'premium' ? 'Premium' : 'Restricted'}
                    </span>
                  </div>

                  {pdf.description && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {pdf.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      {pdf.category && (
                        <span 
                          className="px-2 py-1 text-white rounded text-xs"
                          style={{ backgroundColor: pdf.category.color }}
                        >
                          {pdf.category.name}
                        </span>
                      )}
                      {pdf.examType && (
                        <span className="px-2 py-1 bg-primary-100 text-primary-800 rounded text-xs">
                          {pdf.examType.name}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <div className="flex items-center">
                      <Download className="h-4 w-4 mr-1" />
                      <span>{pdf.download_count || 0} downloads</span>
                    </div>
                    <span>{new Date(pdf.created_at).toLocaleDateString()}</span>
                  </div>

                  <div className="flex space-x-2">
                    <button 
                      onClick={() => handlePreviewPdf(pdf)}
                      className="flex-1 btn-secondary text-sm"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Preview
                    </button>
                    <button 
                      onClick={() => handleEditPdf(pdf)}
                      className="text-primary-600 hover:text-primary-900 p-2"
                      title="Edit PDF"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => handleDownloadPdf(pdf)}
                      className="text-green-600 hover:text-green-900 p-2"
                      title="Download PDF"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => handleDeletePdf(pdf)}
                      className="text-red-600 hover:text-red-900 p-2"
                      title="Delete PDF"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="card p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-700">
                Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, pagination.total)} of {pagination.total} results
              </p>
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-sm border rounded disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(Math.min(pagination.totalPages, currentPage + 1))}
                  disabled={currentPage === pagination.totalPages}
                  className="px-3 py-1 text-sm border rounded disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modals */}
        <ConfirmModal
          isOpen={confirmModal.isOpen}
          onClose={() => setConfirmModal({ isOpen: false, pdf: null, loading: false })}
          onConfirm={handleConfirmDelete}
          title="Delete PDF"
          message={`Are you sure you want to delete "${confirmModal.pdf?.title}"? This action cannot be undone.`}
          confirmText="Delete"
          type="danger"
          loading={confirmModal.loading}
        />

        <PDFEditModal
          isOpen={editModal.isOpen}
          onClose={() => setEditModal({ isOpen: false, pdf: null })}
          pdf={editModal.pdf}
          categories={categories}
          testSeries={testSeries}
          examTypes={examTypes}
          onUpdate={refresh}
        />

        <PDFPreviewModal
          isOpen={previewModal.isOpen}
          onClose={() => setPreviewModal({ isOpen: false, pdf: null })}
          pdf={previewModal.pdf}
        />
      </div>
    </ErrorBoundary>
  );
};