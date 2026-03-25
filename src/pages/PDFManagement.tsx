import React, { useState, useEffect, useCallback } from 'react';
import { Upload, Plus, Grid, List, RefreshCw } from 'lucide-react';
import { PDFCard } from '../components/pdf/PDFCard';
import { PDFFilters } from '../components/pdf/PDFFilters';
import { PDFStats } from '../components/pdf/PDFStats';
import { PDFEditModal } from '../components/modals/PDFEditModal';
import { PDFPreviewModal } from '../components/modals/PDFPreviewModal';
import { PDFUploadDropzone } from '../components/pdf/PDFUploadDropzone';
import { ConfirmModal } from '../components/modals/ConfirmModal';
import { PDFListSkeleton, PDFHeaderSkeleton, PDFFilterSkeleton } from '../components/common/PDFSkeletonLoader';
import pdfService, { PDF, PDFFilters as PDFFiltersType, PDFStats as PDFStatsType } from '../services/pdfService';
import toast from 'react-hot-toast';

export const PDFManagement: React.FC = () => {
  // State management
  const [pdfs, setPdfs] = useState<PDF[]>([]);
  const [stats, setStats] = useState<PDFStatsType | null>(null);
  const [examTypes, setExamTypes] = useState<Array<{ id: number; name: string }>>([]);
  const [testSeries, setTestSeries] = useState<Array<{ id: string; title: string }>>([]);
  const [courses, setCourses] = useState<Array<{ id: string; title: string }>>([]);
  
  // Loading states
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [filtersLoading, setFiltersLoading] = useState(true);
  
  // UI states
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showUploadForm, setShowUploadForm] = useState(false);
  
  // Modal states
  const [editModal, setEditModal] = useState({ isOpen: false, pdf: null as PDF | null });
  const [previewModal, setPreviewModal] = useState({ isOpen: false, pdf: null as PDF | null });
  const [confirmModal, setConfirmModal] = useState({ 
    isOpen: false, 
    pdf: null as PDF | null, 
    loading: false 
  });

  // Filter state
  const [filters, setFilters] = useState<PDFFiltersType>({
    search: '',
    category_id: '',
    access_level: '',
    exam_type_id: '',
    test_series_id: '',
    page: 1,
    limit: 12,
    sort_by: 'created_at',
    sort_order: 'DESC'
  });

  // Pagination state
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 12,
    totalPages: 0
  });

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  // Load PDFs when filters change
  useEffect(() => {
    loadPDFs();
  }, [filters]);

  const loadInitialData = async () => {
    try {
      await Promise.all([
        loadStats(),
        loadExamTypes(),
        loadTestSeries(),
        loadCourses()
      ]);
    } catch (error) {
      console.error('Error loading initial data:', error);
      toast.error('Failed to load initial data');
    } finally {
      setFiltersLoading(false);
    }
  };

  const loadPDFs = async () => {
    setLoading(true);
    try {
      const response = await pdfService.getPDFs(filters);
      
      // Handle different response structures
      if (response.success && Array.isArray(response.data)) {
        setPdfs(response.data);
        setPagination(response.pagination);
      } else if (Array.isArray(response)) {
        // Direct array response
        setPdfs(response);
        setPagination({ 
          total: response.length, 
          page: 1, 
          limit: 12, 
          totalPages: Math.ceil(response.length / 12) 
        });
      } else {
        setPdfs([]);
        setPagination({ total: 0, page: 1, limit: 12, totalPages: 0 });
      }
    } catch (error: any) {
      console.error('Error loading PDFs:', error);
      toast.error('Failed to load PDFs');
      setPdfs([]);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    setStatsLoading(true);
    try {
      const response = await pdfService.getStats();
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setStatsLoading(false);
    }
  };


  const loadExamTypes = async () => {
    try {
      const response = await pdfService.getExamTypes();
      if (response.success && response.data) {
        setExamTypes(response.data);
      }
    } catch (error) {
      console.error('Error loading exam types:', error);
      setExamTypes([]);
    }
  };

  const loadTestSeries = async () => {
    try {
      const response = await pdfService.getTestSeries();
      if (response.success && response.data) {
        setTestSeries(response.data);
      }
    } catch (error) {
      console.error('Error loading test series:', error);
      setTestSeries([]);
    }
  };

  const loadCourses = async () => {
    try {
      // Use the test management API to get courses
      const token = sessionStorage.getItem('admin_token');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/admin/test-management`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      console.log('Course API Response:', data);
      console.log('Response success:', data.success);
      console.log('Response data:', data.data);
      if (data.success && data.data) {
        // Map test series data to courses format
        const coursesList = data.data.map((series: any) => {
          console.log('Mapping series:', series);
          return {
            id: series.uuid,
            title: series.title
          };
        });
        console.log('Final courses list:', coursesList);
        setCourses(coursesList);
      } else {
        console.log('API call failed or no data:', data);
        setCourses([]);
      }
    } catch (error) {
      console.error('Error loading courses:', error);
      setCourses([]);
    }
  };

  // Event handlers
  const handleFiltersChange = useCallback((newFilters: PDFFiltersType) => {
    setFilters(newFilters);
  }, []);

  const handleRefresh = async () => {
    await Promise.all([loadPDFs(), loadStats(), loadCourses()]);
    toast.success('Data refreshed successfully');
  };

  const handlePreview = (pdf: PDF) => {
    setPreviewModal({ isOpen: true, pdf });
  };

  const handleEdit = (pdf: PDF) => {
    setEditModal({ isOpen: true, pdf });
  };

  const handleDownload = async (pdf: PDF) => {
    try {
      const blob = await pdfService.downloadPDF(pdf.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = pdf.original_filename || `${pdf.title}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('PDF downloaded successfully');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download PDF');
    }
  };

  const handleDelete = (pdf: PDF) => {
    setConfirmModal({ isOpen: true, pdf, loading: false });
  };

  const handleConfirmDelete = async () => {
    if (!confirmModal.pdf) return;

    setConfirmModal(prev => ({ ...prev, loading: true }));
    try {
      await pdfService.deletePDF(confirmModal.pdf.id);
      toast.success('PDF deleted successfully');
      loadPDFs();
      loadStats();
      setConfirmModal({ isOpen: false, pdf: null, loading: false });
    } catch (error: any) {
      console.error('Delete error:', error);
      toast.error(error.response?.data?.message || 'Failed to delete PDF');
      setConfirmModal(prev => ({ ...prev, loading: false }));
    }
  };

  const handleUploadSuccess = () => {
    toast.success('PDF uploaded successfully');
    loadPDFs();
    loadStats();
    setShowUploadForm(false);
  };

  const handleUploadError = (error: string) => {
    toast.error(error);
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  // Render pagination
  const renderPagination = () => {
    if (pagination.totalPages <= 1) return null;

    const pages = [];
    const maxVisiblePages = 5;
    const startPage = Math.max(1, pagination.page - Math.floor(maxVisiblePages / 2));
    const endPage = Math.min(pagination.totalPages, startPage + maxVisiblePages - 1);

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`px-3 py-2 text-sm font-medium rounded-md ${
            i === pagination.page
              ? 'bg-primary-600 text-white'
              : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
          }`}
        >
          {i}
        </button>
      );
    }

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-700">
            Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
            {pagination.total} results
          </p>
          <div className="flex items-center space-x-1">
            <button
              onClick={() => handlePageChange(Math.max(1, pagination.page - 1))}
              disabled={pagination.page === 1}
              className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            {pages}
            <button
              onClick={() => handlePageChange(Math.min(pagination.totalPages, pagination.page + 1))}
              disabled={pagination.page === pagination.totalPages}
              className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        {filtersLoading || statsLoading ? (
          <PDFHeaderSkeleton />
        ) : (
          <>
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">PDF Management</h1>
                <p className="text-gray-600 mt-2">
                  Manage your educational resources and study materials
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleRefresh}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                  disabled={loading}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
                <div className="flex items-center bg-white border border-gray-200 rounded-lg">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 ${viewMode === 'grid' ? 'bg-primary-100 text-primary-600' : 'text-gray-400'}`}
                  >
                    <Grid className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 ${viewMode === 'list' ? 'bg-primary-100 text-primary-600' : 'text-gray-400'}`}
                  >
                    <List className="h-4 w-4" />
                  </button>
                </div>
                <button
                  onClick={() => setShowUploadForm(true)}
                  className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload PDF
                </button>
              </div>
            </div>

            {/* Statistics */}
            <div className="mb-8">
              <PDFStats stats={stats!} loading={statsLoading} />
            </div>
          </>
        )}

        {/* Upload Form */}
        {showUploadForm && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Upload New PDF</h2>
              <button
                onClick={() => setShowUploadForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <Plus className="h-6 w-6 rotate-45" />
              </button>
            </div>
            <PDFUploadDropzone
              courses={courses}
              testSeries={testSeries}
              examTypes={examTypes}
              onUploadSuccess={handleUploadSuccess}
              onUploadError={handleUploadError}
            />
          </div>
        )}

        {/* Filters */}
        {filtersLoading ? (
          <PDFFilterSkeleton />
        ) : (
          <div className="mb-8">
            <PDFFilters
              filters={filters}
              onFiltersChange={handleFiltersChange}
                            examTypes={examTypes}
              testSeries={testSeries}
              loading={loading}
            />
          </div>
        )}

        {/* PDF Grid */}
        {loading ? (
          <PDFListSkeleton count={filters.limit} />
        ) : pdfs.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12">
              <Upload className="h-24 w-24 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No PDFs found</h3>
              <p className="text-gray-600 mb-6">
                {filters.search || filters.access_level
                  ? 'Try adjusting your search criteria or filters.'
                  : 'Upload your first PDF to get started.'}
              </p>
              <button
                onClick={() => setShowUploadForm(true)}
                className="inline-flex items-center px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                <Upload className="h-5 w-5 mr-2" />
                Upload PDF
              </button>
            </div>
          </div>
        ) : (
          <div className={viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' 
            : 'space-y-4'
          }>
            {pdfs.map((pdf) => (
              <PDFCard
                key={pdf.id}
                pdf={pdf}
                onPreview={handlePreview}
                onEdit={handleEdit}
                onDownload={handleDownload}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && pdfs.length > 0 && (
          <div className="mt-8">
            {renderPagination()}
          </div>
        )}

        {/* Modals */}
        <PDFEditModal
          isOpen={editModal.isOpen}
          onClose={() => setEditModal({ isOpen: false, pdf: null })}
          pdf={editModal.pdf}
          courses={courses}
          testSeries={testSeries}
          examTypes={examTypes}
          onUpdate={() => {
            loadPDFs();
            loadStats();
          }}
        />

        <PDFPreviewModal
          isOpen={previewModal.isOpen}
          onClose={() => setPreviewModal({ isOpen: false, pdf: null })}
          pdf={previewModal.pdf}
        />

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

      </div>
    </div>
  );
};