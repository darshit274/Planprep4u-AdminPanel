import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, RefreshCw, BookOpen, FileText, BarChart3, Filter, Grid, List } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ExamTypeCard } from '../components/exams/ExamTypeCard';
import { ExamTypeModal } from '../components/modals/ExamTypeModal';
import { ConfirmModal } from '../components/modals/ConfirmModal';
import { PDFListSkeleton } from '../components/common/PDFSkeletonLoader';
import examService, { ExamType, ExamFilters } from '../services/examService';
import toast from 'react-hot-toast';

export const ExamManagement: React.FC = () => {
  // Hooks
  const navigate = useNavigate();
  
  // State management
  const [examTypes, setExamTypes] = useState<ExamType[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Filter and search state
  const [filters, setFilters] = useState<ExamFilters>({
    search: '',
    page: 1,
    limit: 12,
    sortBy: 'created_at',
    sortOrder: 'DESC'
  });

  // Pagination state
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 12,
    totalPages: 0
  });

  // Modal states
  const [examModal, setExamModal] = useState({ isOpen: false, examType: null as ExamType | null });
  const [confirmModal, setConfirmModal] = useState({ 
    isOpen: false, 
    examType: null as ExamType | null, 
    loading: false 
  });

  // Statistics state
  const [stats, setStats] = useState({
    totalExamTypes: 0,
    totalTestSeries: 0,
    totalPYQs: 0,
    activeExams: 0
  });

  // Load exam types when filters change
  useEffect(() => {
    loadExamTypes();
  }, [filters]);

  // Load initial data
  useEffect(() => {
    loadStats();
  }, []);

  const loadExamTypes = async () => {
    setLoading(true);
    try {
      const response = await examService.getExamTypes(filters);
      if (response.success) {
        setExamTypes(response.data);
        setPagination(response.pagination);
      }
    } catch (error: any) {
      console.error('Error loading exam types:', error);
      toast.error('Failed to load exam types');
      setExamTypes([]);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await examService.getExamStats();
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  // Event handlers
  const handleSearch = useCallback((searchTerm: string) => {
    setFilters(prev => ({ ...prev, search: searchTerm, page: 1 }));
  }, []);

  const handleRefresh = async () => {
    await Promise.all([loadExamTypes(), loadStats()]);
    toast.success('Data refreshed successfully');
  };

  const handleCreateExam = () => {
    setExamModal({ isOpen: true, examType: null });
  };

  const handleEditExam = (examType: ExamType) => {
    setExamModal({ isOpen: true, examType });
  };

  const handleDeleteExam = (examType: ExamType) => {
    setConfirmModal({ isOpen: true, examType, loading: false });
  };

  const handleConfirmDelete = async () => {
    if (!confirmModal.examType) return;

    setConfirmModal(prev => ({ ...prev, loading: true }));
    try {
      await examService.deleteExamType(confirmModal.examType.id);
      toast.success('Exam type deleted successfully');
      loadExamTypes();
      loadStats();
      setConfirmModal({ isOpen: false, examType: null, loading: false });
    } catch (error: any) {
      console.error('Delete error:', error);
      toast.error(error.response?.data?.message || 'Failed to delete exam type');
      setConfirmModal(prev => ({ ...prev, loading: false }));
    }
  };

  const handleViewTestSeries = (examType: ExamType) => {
    // Navigate to test series page with exam type filter
    navigate('/test-series', { state: { examTypeId: examType.id, examTypeName: examType.name } });
  };

  const handleViewPYQs = (examType: ExamType) => {
    // Navigate to PYQs page with exam type filter
    navigate('/pyqs', { state: { examTypeId: examType.id, examTypeName: examType.name } });
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
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Exam Management</h1>
            <p className="text-gray-600 mt-2">
              Manage exam types, test series, and previous year questions
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
              onClick={handleCreateExam}
              className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Exam Type
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-primary-100">
                <BookOpen className="h-6 w-6 text-primary-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Exam Types</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalExamTypes}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100">
                <FileText className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Test Series</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalTestSeries}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-primary-100">
                <BarChart3 className="h-6 w-6 text-primary-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">PYQs</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalPYQs}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-yellow-100">
                <Filter className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Exams</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activeExams}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={filters.search || ''}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search exam types by name or code..."
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                disabled={loading}
              />
            </div>
            <select
              value={filters.sortBy || 'created_at'}
              onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value as any, page: 1 }))}
              className="px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              disabled={loading}
            >
              <option value="created_at">Sort by Date</option>
              <option value="name">Sort by Name</option>
              <option value="code">Sort by Code</option>
            </select>
            <select
              value={filters.sortOrder || 'DESC'}
              onChange={(e) => setFilters(prev => ({ ...prev, sortOrder: e.target.value as any, page: 1 }))}
              className="px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              disabled={loading}
            >
              <option value="DESC">Newest First</option>
              <option value="ASC">Oldest First</option>
            </select>
          </div>
        </div>

        {/* Exam Types Grid */}
        {loading ? (
          <PDFListSkeleton count={filters.limit} />
        ) : examTypes.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12">
              <BookOpen className="h-24 w-24 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No exam types found</h3>
              <p className="text-gray-600 mb-6">
                {filters.search
                  ? 'Try adjusting your search criteria.'
                  : 'Create your first exam type to get started.'}
              </p>
              <button
                onClick={handleCreateExam}
                className="inline-flex items-center px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                <Plus className="h-5 w-5 mr-2" />
                Add Exam Type
              </button>
            </div>
          </div>
        ) : (
          <div className={viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' 
            : 'space-y-4'
          }>
            {examTypes.map((examType) => (
              <ExamTypeCard
                key={examType.id}
                examType={examType}
                onEdit={handleEditExam}
                onDelete={handleDeleteExam}
                onViewTestSeries={handleViewTestSeries}
                onViewPYQs={handleViewPYQs}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && examTypes.length > 0 && (
          <div className="mt-8">
            {renderPagination()}
          </div>
        )}

        {/* Modals */}
        <ExamTypeModal
          isOpen={examModal.isOpen}
          onClose={() => setExamModal({ isOpen: false, examType: null })}
          examType={examModal.examType}
          onUpdate={() => {
            loadExamTypes();
            loadStats();
          }}
        />

        <ConfirmModal
          isOpen={confirmModal.isOpen}
          onClose={() => setConfirmModal({ isOpen: false, examType: null, loading: false })}
          onConfirm={handleConfirmDelete}
          title="Delete Exam Type"
          message={`Are you sure you want to delete "${confirmModal.examType?.name}"? This will also delete all associated test series and PYQs. This action cannot be undone.`}
          confirmText="Delete"
          type="danger"
          loading={confirmModal.loading}
        />
      </div>
    </div>
  );
};