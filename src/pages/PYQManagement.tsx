import React, { useState, useEffect, useCallback } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Upload,
  BarChart3,
  Calendar,
  GraduationCap,
  Target,
  Users,
  FileText,
  TrendingUp,
  AlertCircle,
  RefreshCw,
  ChevronDown,
  X
} from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { PYQCard } from '../components/pyqs/PYQCard';
import { PYQModal } from '../components/modals/PYQModal';
import pyqService, { PYQ, PYQFilters, PYQStats } from '../services/pyqService';
import examService, { ExamType } from '../services/examService';
import toast from 'react-hot-toast';

const PYQManagement: React.FC = () => {
  const location = useLocation();
  const examTypeFilter = location.state as { examTypeId?: string; examTypeName?: string } | null;
  
  const [pyqs, setPyqs] = useState<PYQ[]>([]);
  const [stats, setStats] = useState<PYQStats | null>(null);
  const [examTypes, setExamTypes] = useState<ExamType[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPyq, setSelectedPyq] = useState<PYQ | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 12;

  // Filters
  const [filters, setFilters] = useState<PYQFilters>({
    page: 1,
    limit: pageSize,
    sortBy: 'created_at',
    sortOrder: 'DESC',
    exam_type_id: examTypeFilter?.examTypeId
  });

  // UI State
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedPyqs, setSelectedPyqs] = useState<number[]>([]);

  // Clear location state after reading it
  useEffect(() => {
    if (examTypeFilter) {
      window.history.replaceState({}, document.title);
    }
  }, []);

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  // Load PYQs when filters change
  useEffect(() => {
    loadPYQs();
  }, [filters]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [pyqsRes, statsRes, examTypesRes] = await Promise.all([
        pyqService.getPYQs(filters),
        pyqService.getPYQStats(),
        examService.getExamTypes()
      ]);

      if (pyqsRes.success) {
        setPyqs(pyqsRes.data);
        setCurrentPage(pyqsRes.pagination.page);
        setTotalPages(pyqsRes.pagination.totalPages);
        setTotalCount(pyqsRes.pagination.total);
      }

      if (statsRes.success) {
        setStats(statsRes.data);
      }

      if (examTypesRes.success) {
        setExamTypes(examTypesRes.data);
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
      toast.error('Failed to load PYQ data');
    } finally {
      setLoading(false);
    }
  };

  const loadPYQs = async () => {
    if (loading) return; // Don't show refresh loader during initial load
    
    setRefreshing(true);
    try {
      const response = await pyqService.getPYQs(filters);
      if (response.success) {
        setPyqs(response.data);
        setCurrentPage(response.pagination.page);
        setTotalPages(response.pagination.totalPages);
        setTotalCount(response.pagination.total);
      }
    } catch (error) {
      console.error('Error loading PYQs:', error);
      toast.error('Failed to load PYQs');
    } finally {
      setRefreshing(false);
    }
  };

  const handleFilterChange = useCallback((newFilters: Partial<PYQFilters>) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters,
      page: 1 // Reset to first page when filters change
    }));
  }, []);

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const handleSort = (sortBy: string) => {
    const newSortOrder = filters.sortBy === sortBy && filters.sortOrder === 'DESC' ? 'ASC' : 'DESC';
    setFilters(prev => ({ ...prev, sortBy, sortOrder: newSortOrder }));
  };

  const handleCreatePyq = () => {
    setSelectedPyq(null);
    setShowModal(true);
  };

  const handleEditPyq = (pyq: PYQ) => {
    setSelectedPyq(pyq);
    setShowModal(true);
  };

  const handleDeletePyq = async (pyq: PYQ) => {
    if (!confirm(`Are you sure you want to delete "${pyq.title}"?`)) {
      return;
    }

    try {
      await pyqService.deletePYQ(pyq.id);
      toast.success('PYQ deleted successfully');
      loadPYQs();
      loadInitialData(); // Refresh stats
    } catch (error: any) {
      console.error('Error deleting PYQ:', error);
      toast.error(error.response?.data?.message || 'Failed to delete PYQ');
    }
  };

  const handleDuplicatePyq = async (pyq: PYQ) => {
    const title = prompt('Enter title for the duplicated PYQ:', `${pyq.title} (Copy)`);
    if (!title) return;

    try {
      await pyqService.duplicatePYQ(pyq.id, title);
      toast.success('PYQ duplicated successfully');
      loadPYQs();
      loadInitialData(); // Refresh stats
    } catch (error: any) {
      console.error('Error duplicating PYQ:', error);
      toast.error(error.response?.data?.message || 'Failed to duplicate PYQ');
    }
  };

  const handleToggleStatus = async (pyq: PYQ) => {
    try {
      await pyqService.togglePYQStatus(pyq.id);
      toast.success(`PYQ ${pyq.is_active ? 'deactivated' : 'activated'} successfully`);
      loadPYQs();
    } catch (error: any) {
      console.error('Error toggling PYQ status:', error);
      toast.error(error.response?.data?.message || 'Failed to update PYQ status');
    }
  };

  const handleToggleFeatured = async (pyq: PYQ) => {
    try {
      await pyqService.toggleFeaturedStatus(pyq.id);
      toast.success(`PYQ ${pyq.is_featured ? 'removed from' : 'added to'} featured`);
      loadPYQs();
    } catch (error: any) {
      console.error('Error toggling featured status:', error);
      toast.error(error.response?.data?.message || 'Failed to update featured status');
    }
  };

  const handleViewQuestions = (pyq: PYQ) => {
    // Navigate to questions management for this PYQ
    console.log('View questions for PYQ:', pyq.id);
    // TODO: Implement navigation to questions page
  };

  const handleViewAnalytics = (pyq: PYQ) => {
    // Navigate to analytics page for this PYQ
    console.log('View analytics for PYQ:', pyq.id);
    // TODO: Implement navigation to analytics page
  };

  const handlePreview = (pyq: PYQ) => {
    // Open PYQ preview
    console.log('Preview PYQ:', pyq.id);
    // TODO: Implement preview functionality
  };

  const handleModalUpdate = () => {
    loadPYQs();
    loadInitialData(); // Refresh stats
  };

  const clearFilters = () => {
    setFilters({
      page: 1,
      limit: pageSize,
      sortBy: 'created_at',
      sortOrder: 'DESC'
    });
  };

  const getActiveFiltersCount = () => {
    const { page, limit, sortBy, sortOrder, ...activeFilters } = filters;
    return Object.values(activeFilters).filter(value => 
      value !== undefined && value !== '' && value !== null
    ).length;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        <span className="ml-3 text-gray-600">Loading PYQs...</span>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">PYQ Management</h1>
            <p className="text-gray-600 mt-1">
              {examTypeFilter?.examTypeName 
                ? `Showing PYQs for ${examTypeFilter.examTypeName}`
                : 'Manage Previous Year Questions and exam papers'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`inline-flex items-center px-4 py-2 border rounded-lg text-sm font-medium transition-colors ${
                showFilters || getActiveFiltersCount() > 0
                  ? 'border-primary-200 bg-primary-50 text-primary-700'
                  : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
              {getActiveFiltersCount() > 0 && (
                <span className="ml-2 bg-primary-100 text-primary-700 rounded-full px-2 py-0.5 text-xs">
                  {getActiveFiltersCount()}
                </span>
              )}
            </button>
            <button
              onClick={handleCreatePyq}
              className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add PYQ
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-primary-100 rounded-lg">
                  <FileText className="h-6 w-6 text-primary-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total PYQs</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalPYQs}</p>
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className="text-green-600">
                  {stats.activePYQs} active
                </span>
                <span className="text-gray-400 mx-2">•</span>
                <span className="text-yellow-600">
                  {stats.featuredPYQs} featured
                </span>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Target className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Questions</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalQuestions.toLocaleString()}</p>
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm text-gray-600">
                <TrendingUp className="h-4 w-4 mr-1" />
                Across {stats.uniqueExamTypes} exam types
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-primary-100 rounded-lg">
                  <Users className="h-6 w-6 text-primary-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Attempts</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalAttempts.toLocaleString()}</p>
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm text-gray-600">
                <BarChart3 className="h-4 w-4 mr-1" />
                Performance tracking
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-primary-100 rounded-lg">
                  <Calendar className="h-6 w-6 text-primary-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Year Range</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.yearRange.earliest} - {stats.yearRange.latest}
                  </p>
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm text-gray-600">
                <GraduationCap className="h-4 w-4 mr-1" />
                Historical coverage
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Filters</h3>
            <div className="flex items-center gap-2">
              {getActiveFiltersCount() > 0 && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
                >
                  <X className="h-4 w-4" />
                  Clear all
                </button>
              )}
              <button
                onClick={() => setShowFilters(false)}
                className="p-1 hover:bg-gray-100 rounded-full"
              >
                <X className="h-4 w-4 text-gray-500" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search PYQs..."
                  value={filters.search || ''}
                  onChange={(e) => handleFilterChange({ search: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Exam Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Exam Type</label>
              <select
                value={filters.exam_type_id || ''}
                onChange={(e) => handleFilterChange({ exam_type_id: e.target.value ? parseInt(e.target.value) : undefined })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">All Exam Types</option>
                {examTypes.map((examType) => (
                  <option key={examType.id} value={examType.id}>
                    {examType.name} ({examType.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Year */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
              <select
                value={filters.exam_year || ''}
                onChange={(e) => handleFilterChange({ exam_year: e.target.value ? parseInt(e.target.value) : undefined })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">All Years</option>
                {Array.from({ length: 11 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            {/* Paper Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Paper Type</label>
              <select
                value={filters.paper_type || ''}
                onChange={(e) => handleFilterChange({ paper_type: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">All Types</option>
                <option value="prelims">Prelims</option>
                <option value="mains">Mains</option>
                <option value="full">Full Paper</option>
                <option value="sectional">Sectional</option>
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={filters.is_active === undefined ? '' : filters.is_active.toString()}
                onChange={(e) => handleFilterChange({ 
                  is_active: e.target.value === '' ? undefined : e.target.value === 'true'
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">All Status</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>

            {/* Featured */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Featured</label>
              <select
                value={filters.is_featured === undefined ? '' : filters.is_featured.toString()}
                onChange={(e) => handleFilterChange({ 
                  is_featured: e.target.value === '' ? undefined : e.target.value === 'true'
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">All</option>
                <option value="true">Featured</option>
                <option value="false">Not Featured</option>
              </select>
            </div>

            {/* Sort */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
              <select
                value={`${filters.sortBy}-${filters.sortOrder}`}
                onChange={(e) => {
                  const [sortBy, sortOrder] = e.target.value.split('-');
                  handleFilterChange({ sortBy, sortOrder: sortOrder as 'ASC' | 'DESC' });
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="created_at-DESC">Newest First</option>
                <option value="created_at-ASC">Oldest First</option>
                <option value="title-ASC">Title A-Z</option>
                <option value="title-DESC">Title Z-A</option>
                <option value="exam_year-DESC">Year (Latest)</option>
                <option value="exam_year-ASC">Year (Earliest)</option>
                <option value="total_questions-DESC">Most Questions</option>
                <option value="total_questions-ASC">Least Questions</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Results Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <p className="text-sm text-gray-600">
            Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalCount)} of {totalCount} PYQs
          </p>
          {refreshing && (
            <RefreshCw className="h-4 w-4 animate-spin text-primary-600" />
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg transition-colors ${
              viewMode === 'grid' ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-600'
            }`}
          >
            <div className="w-4 h-4 grid grid-cols-2 gap-0.5">
              <div className="bg-current rounded-sm"></div>
              <div className="bg-current rounded-sm"></div>
              <div className="bg-current rounded-sm"></div>
              <div className="bg-current rounded-sm"></div>
            </div>
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg transition-colors ${
              viewMode === 'list' ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-600'
            }`}
          >
            <div className="w-4 h-4 flex flex-col gap-0.5">
              <div className="bg-current h-0.5 rounded-sm"></div>
              <div className="bg-current h-0.5 rounded-sm"></div>
              <div className="bg-current h-0.5 rounded-sm"></div>
              <div className="bg-current h-0.5 rounded-sm"></div>
            </div>
          </button>
        </div>
      </div>

      {/* PYQ Grid/List */}
      {pyqs.length > 0 ? (
        <div className={viewMode === 'grid' 
          ? 'grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6' 
          : 'space-y-4'
        }>
          {pyqs.map((pyq) => (
            <PYQCard
              key={pyq.id}
              pyq={pyq}
              onEdit={handleEditPyq}
              onDelete={handleDeletePyq}
              onDuplicate={handleDuplicatePyq}
              onToggleStatus={handleToggleStatus}
              onToggleFeatured={handleToggleFeatured}
              onViewQuestions={handleViewQuestions}
              onViewAnalytics={handleViewAnalytics}
              onPreview={handlePreview}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No PYQs found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {getActiveFiltersCount() > 0 
              ? 'Try adjusting your filters or search terms.' 
              : 'Get started by creating your first PYQ.'
            }
          </p>
          {getActiveFiltersCount() === 0 && (
            <div className="mt-6">
              <button
                onClick={handleCreatePyq}
                className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create First PYQ
              </button>
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 mt-8">
          <div className="flex flex-1 justify-between sm:hidden">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{((currentPage - 1) * pageSize) + 1}</span> to{' '}
                <span className="font-medium">{Math.min(currentPage * pageSize, totalCount)}</span> of{' '}
                <span className="font-medium">{totalCount}</span> results
              </p>
            </div>
            <div>
              <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="sr-only">Previous</span>
                  <ChevronDown className="h-5 w-5 rotate-90" aria-hidden="true" />
                </button>
                
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 7) {
                    pageNum = i + 1;
                  } else if (currentPage <= 4) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 3) {
                    pageNum = totalPages - 6 + i;
                  } else {
                    pageNum = currentPage - 3 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                        pageNum === currentPage
                          ? 'z-10 bg-primary-600 text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600'
                          : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="sr-only">Next</span>
                  <ChevronDown className="h-5 w-5 -rotate-90" aria-hidden="true" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* PYQ Modal */}
      <PYQModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        pyq={selectedPyq}
        onUpdate={handleModalUpdate}
      />
    </div>
  );
};

export default PYQManagement;