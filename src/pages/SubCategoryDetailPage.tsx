import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { PlusIcon, EyeIcon, PencilIcon, TrashIcon, ArrowLeftIcon, ClockIcon, AcademicCapIcon, MagnifyingGlassIcon, ChartBarIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { ConfirmModal } from '../components/modals/ConfirmModal';

interface SubCategory {
  id: number;
  uuid: string;
  name: string;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  category_id: number;
}

interface Test {
  id: number;
  uuid: string;
  title: string;
  description: string;
  title_gujarati?: string;
  description_gujarati?: string;
  duration_minutes: number;
  total_marks: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  sub_category_id: number;
  questions_count: number;
}

interface ApiResponse {
  success: boolean;
  data: {
    subCategory: SubCategory;
    tests: Test[];
  };
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  stats: {
    total: number;
    active: number;
    inactive: number;
    withQuestions: number;
  };
}

// API functions
const apiBaseUrl = 'http://localhost:5004/api/admin';

const testsApi = {
  getSubCategoryTests: async (subCategoryUuid: string, params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: string;
  }): Promise<ApiResponse> => {
    const token = sessionStorage.getItem('admin_token');
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        queryParams.append(key, value.toString());
      }
    });

    const response = await fetch(`${apiBaseUrl}/test-management/sub-categories/${subCategoryUuid}?${queryParams}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    return data;
  },

  createTest: async (subCategoryUuid: string, test: { title: string; description: string; title_gujarati?: string; description_gujarati?: string; duration_minutes: number; total_marks: number; is_active?: boolean }) => {
    const token = sessionStorage.getItem('admin_token');
    const response = await fetch(`${apiBaseUrl}/test-management/sub-categories/${subCategoryUuid}/tests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(test)
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.message);
    return data.data;
  },

  updateTest: async (uuid: string, test: { title: string; description: string; title_gujarati?: string; description_gujarati?: string; duration_minutes: number; total_marks: number; is_active?: boolean }) => {
    const token = sessionStorage.getItem('admin_token');
    const response = await fetch(`${apiBaseUrl}/test-management/tests/${uuid}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(test)
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.message);
    return data.data;
  },

  deleteTest: async (uuid: string) => {
    const token = sessionStorage.getItem('admin_token');
    const response = await fetch(`${apiBaseUrl}/test-management/tests/${uuid}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.message);
  },

  bulkOperations: async (data: { action: string; uuids: string[] }) => {
    const token = sessionStorage.getItem('admin_token');
    
    // Convert uuids to the correct field name expected by backend
    const payload = {
      action: data.action,
      testIds: data.uuids  // Backend expects testIds, not uuids
    };
    
    const response = await fetch(`${apiBaseUrl}/test-management/tests/bulk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });
    const result = await response.json();
    if (!result.success) throw new Error(result.message);
    return result;
  }
};

const SubCategoryDetailPage: React.FC = () => {
  const { subCategoryUuid } = useParams<{ subCategoryUuid: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // State management
  const [showModal, setShowModal] = useState(false);
  const [editingTest, setEditingTest] = useState<Test | null>(null);
  const [formData, setFormData] = useState({ 
    title: '', 
    description: '', 
    title_gujarati: '', 
    description_gujarati: '', 
    duration_minutes: 60, 
    total_marks: 0,
    is_active: true
  });
  
  // Selection state for bulk operations
  const [selectedTests, setSelectedTests] = useState<string[]>([]);
  
  // Confirm modal state
  const [confirmModal, setConfirmModal] = useState({ 
    isOpen: false, 
    test: null as Test | null,
    action: 'delete' as 'delete' | 'bulk_activate' | 'bulk_deactivate' | 'bulk_delete',
    loading: false 
  });

  // Filter and pagination state
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    search: '',
    status: 'all',
    sortBy: 'created_at',
    sortOrder: 'DESC'
  });

  // Query for tests data
  const { data, isLoading, error } = useQuery({
    queryKey: ['subCategoryTests', subCategoryUuid, filters],
    queryFn: () => testsApi.getSubCategoryTests(subCategoryUuid!, filters),
    enabled: !!subCategoryUuid
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (test: { title: string; description: string; title_gujarati?: string; description_gujarati?: string; duration_minutes: number; total_marks: number; is_active?: boolean }) =>
      testsApi.createTest(subCategoryUuid!, test),
    onSuccess: () => {
      toast.success('Test created successfully');
      queryClient.invalidateQueries({ queryKey: ['subCategoryTests', subCategoryUuid] });
      setShowModal(false);
      setFormData({ title: '', description: '', title_gujarati: '', description_gujarati: '', duration_minutes: 60, total_marks: 0, is_active: true });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create test');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ uuid, data }: { uuid: string; data: { title: string; description: string; title_gujarati?: string; description_gujarati?: string; duration_minutes: number; total_marks: number; is_active?: boolean } }) =>
      testsApi.updateTest(uuid, data),
    onSuccess: () => {
      toast.success('Test updated successfully');
      queryClient.invalidateQueries({ queryKey: ['subCategoryTests', subCategoryUuid] });
      setShowModal(false);
      setEditingTest(null);
      setFormData({ title: '', description: '', title_gujarati: '', description_gujarati: '', duration_minutes: 60, total_marks: 0, is_active: true });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update test');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: testsApi.deleteTest,
    onSuccess: () => {
      toast.success('Test deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['subCategoryTests', subCategoryUuid] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete test');
    }
  });

  const bulkMutation = useMutation({
    mutationFn: testsApi.bulkOperations,
    onSuccess: (data) => {
      const action = data.action;
      const count = data.processedCount || selectedTests.length;
      
      switch (action) {
        case 'activate':
          toast.success(`${count} tests activated successfully`);
          break;
        case 'deactivate':
          toast.success(`${count} tests deactivated successfully`);
          break;
        case 'delete':
          toast.success(`${count} tests deleted successfully`);
          break;
      }
      
      queryClient.invalidateQueries({ queryKey: ['subCategoryTests', subCategoryUuid] });
      setSelectedTests([]);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Bulk operation failed');
    }
  });

  // Event handlers
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTest) {
      updateMutation.mutate({ uuid: editingTest.uuid, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (test: Test) => {
    setEditingTest(test);
    setFormData({ 
      title: test.title, 
      description: test.description,
      title_gujarati: test.title_gujarati || '',
      description_gujarati: test.description_gujarati || '',
      duration_minutes: test.duration_minutes,
      total_marks: test.total_marks,
      is_active: test.is_active
    });
    setShowModal(true);
  };

  const handleDelete = (test: Test) => {
    setConfirmModal({ isOpen: true, test, action: 'delete', loading: false });
  };

  const handleConfirmDelete = async () => {
    setConfirmModal(prev => ({ ...prev, loading: true }));
    
    if (confirmModal.action === 'delete' && confirmModal.test) {
      // Individual delete
      deleteMutation.mutate(confirmModal.test.uuid, {
        onSuccess: () => {
          setConfirmModal({ isOpen: false, test: null, action: 'delete', loading: false });
        },
        onError: () => {
          setConfirmModal(prev => ({ ...prev, loading: false }));
        }
      });
    } else if (confirmModal.action.startsWith('bulk_')) {
      // Bulk operations
      const action = confirmModal.action.replace('bulk_', '');
      bulkMutation.mutate(
        { action, uuids: selectedTests },
        {
          onSuccess: () => {
            setConfirmModal({ isOpen: false, test: null, action: 'delete', loading: false });
          },
          onError: () => {
            setConfirmModal(prev => ({ ...prev, loading: false }));
          }
        }
      );
    }
  };

  // Bulk operation handlers
  const handleSelectAll = () => {
    if (selectedTests.length === tests.length) {
      setSelectedTests([]);
    } else {
      setSelectedTests(tests.map(test => test.uuid));
    }
  };

  const handleSelectTest = (uuid: string) => {
    setSelectedTests(prev => {
      if (prev.includes(uuid)) {
        return prev.filter(id => id !== uuid);
      } else {
        return [...prev, uuid];
      }
    });
  };

  const handleBulkAction = (action: 'activate' | 'deactivate' | 'delete') => {
    if (selectedTests.length === 0) {
      toast.error('Please select at least one test');
      return;
    }
    
    const modalAction = action === 'activate' ? 'bulk_activate' : 
                      action === 'deactivate' ? 'bulk_deactivate' : 'bulk_delete';
    
    setConfirmModal({ 
      isOpen: true, 
      test: null, 
      action: modalAction,
      loading: false 
    });
  };

  const getConfirmModalContent = () => {
    if (confirmModal.action === 'delete' && confirmModal.test) {
      return {
        title: 'Delete Test',
        message: `Are you sure you want to delete "${confirmModal.test.title}"? This will also delete all associated questions. This action cannot be undone.`
      };
    } else if (confirmModal.action === 'bulk_delete') {
      return {
        title: 'Delete Tests',
        message: `Are you sure you want to delete ${selectedTests.length} tests? This will also delete all associated questions. This action cannot be undone.`
      };
    } else if (confirmModal.action === 'bulk_activate') {
      return {
        title: 'Activate Tests',
        message: `Are you sure you want to activate ${selectedTests.length} tests?`
      };
    } else if (confirmModal.action === 'bulk_deactivate') {
      return {
        title: 'Deactivate Tests',
        message: `Are you sure you want to deactivate ${selectedTests.length} tests?`
      };
    }
    return { title: '', message: '' };
  };

  const handleViewQuestions = (testUuid: string) => {
    navigate(`/tests/${testUuid}`);
  };

  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">Error loading tests</div>
        <button
          onClick={() => queryClient.invalidateQueries({ queryKey: ['subCategoryTests', subCategoryUuid] })}
          className="text-primary-600 hover:text-primary-800"
        >
          Try again
        </button>
      </div>
    );
  }

  const { data: { subCategory, tests }, pagination, stats } = data;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center space-x-2 text-sm">
        <Link to="/test-management" className="text-primary-600 hover:text-primary-800">
          Test Management
        </Link>
        <span className="text-gray-400">/</span>
        <button onClick={() => navigate(-1)} className="text-primary-600 hover:text-primary-800">
          Sub-categories
        </button>
        <span className="text-gray-400">/</span>
        <span className="text-gray-600">{subCategory.name}</span>
      </nav>

      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 text-gray-600 hover:text-gray-800"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{subCategory.name} - Tests</h1>
            <p className="text-gray-600 mt-1">{subCategory.description}</p>
          </div>
        </div>
        <button
          onClick={() => {
            setEditingTest(null);
            setFormData({ title: '', description: '', title_gujarati: '', description_gujarati: '', duration_minutes: 60, total_marks: 0, is_active: true });
            setShowModal(true);
          }}
          className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 flex items-center gap-2"
        >
          <PlusIcon className="h-5 w-5" />
          Add Test
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-primary-100 rounded-lg">
              <ChartBarIcon className="h-6 w-6 text-primary-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Tests</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <ChartBarIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.active}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <ChartBarIcon className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Inactive</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.inactive}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-primary-100 rounded-lg">
              <ChartBarIcon className="h-6 w-6 text-primary-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">With Questions</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.withQuestions}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Tests */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search tests..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            {/* Status Filter */}
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>

            {/* Sort By */}
            <select
              value={filters.sortBy}
              onChange={(e) => handleFilterChange('sortBy', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="created_at">Created Date</option>
              <option value="title">Title</option>
              <option value="updated_at">Updated Date</option>
              <option value="duration_minutes">Duration</option>
              <option value="total_marks">Total Marks</option>
            </select>

            {/* Sort Order */}
            <select
              value={filters.sortOrder}
              onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="DESC">Descending</option>
              <option value="ASC">Ascending</option>
            </select>

            {/* Page Size */}
            <select
              value={filters.limit}
              onChange={(e) => handleFilterChange('limit', parseInt(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value={5}>5 per page</option>
              <option value={10}>10 per page</option>
              <option value={20}>20 per page</option>
              <option value={50}>50 per page</option>
            </select>
          </div>
        </div>

        {/* Bulk Actions Bar */}
        {selectedTests.length > 0 && (
          <div className="px-6 py-4 bg-primary-50 border-b border-primary-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-primary-700">
                  {selectedTests.length} tests selected
                </span>
                <button
                  onClick={() => setSelectedTests([])}
                  className="text-sm text-primary-600 hover:text-primary-800"
                >
                  Clear selection
                </button>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleBulkAction('activate')}
                  className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 flex items-center gap-1"
                >
                  <CheckIcon className="h-4 w-4" />
                  Activate
                </button>
                <button
                  onClick={() => handleBulkAction('deactivate')}
                  className="px-3 py-1.5 bg-yellow-500 text-white text-sm rounded-md hover:bg-yellow-600 flex items-center gap-1"
                >
                  <XMarkIcon className="h-4 w-4" />
                  Deactivate
                </button>
                <button
                  onClick={() => handleBulkAction('delete')}
                  className="px-3 py-1.5 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 flex items-center gap-1"
                >
                  <TrashIcon className="h-4 w-4" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tests List */}
        <div className="p-6">
          {tests.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-500 mb-4">No tests found</div>
              <button
                onClick={() => setShowModal(true)}
                className="text-primary-600 hover:text-primary-800"
              >
                Create your first test
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Select All Header */}
              {tests.length > 0 && (
                <div className="flex items-center gap-3 pb-2 border-b border-gray-200">
                  <input
                    type="checkbox"
                    checked={selectedTests.length === tests.length && tests.length > 0}
                    onChange={handleSelectAll}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Select all ({tests.length})
                  </span>
                </div>
              )}
              
              {tests.map((test) => (
                <div key={test.uuid} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={selectedTests.includes(test.uuid)}
                        onChange={() => handleSelectTest(test.uuid)}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded mt-1"
                      />
                      <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{test.title}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          test.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {test.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm mb-3">{test.description}</p>
                      
                      <div className="flex items-center gap-6 text-sm text-gray-500 mb-2">
                        <div className="flex items-center gap-1">
                          <ClockIcon className="h-4 w-4" />
                          <span>{test.duration_minutes} min</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <AcademicCapIcon className="h-4 w-4" />
                          <span>{test.total_marks} marks</span>
                        </div>
                        <span>Questions: {test.questions_count}</span>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>Created: {formatDate(test.created_at)}</span>
                        <span>Updated: {formatDate(test.updated_at)}</span>
                      </div>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => handleViewQuestions(test.uuid)}
                        className="p-2 text-primary-600 hover:text-primary-800 hover:bg-primary-50 rounded-lg"
                        title="View Questions"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleEdit(test)}
                        className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg"
                        title="Edit"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(test)}
                        className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg"
                        title="Delete"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} results
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Previous
                </button>
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-3 py-1 border rounded-md ${
                      page === pagination.page
                        ? 'bg-primary-600 text-white border-primary-600'
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages}
                  className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">
              {editingTest ? 'Edit Test' : 'Add Test'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              {/* Gujarati Fields */}
              <div className="border-t pt-4">
                <h3 className="text-md font-medium text-gray-800 mb-3">Gujarati Translation</h3>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title (Gujarati)
                  </label>
                  <input
                    type="text"
                    value={formData.title_gujarati}
                    onChange={(e) => setFormData({ ...formData, title_gujarati: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="ગુજરાતીમાં શીર્ષક"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description (Gujarati)
                  </label>
                  <textarea
                    value={formData.description_gujarati}
                    onChange={(e) => setFormData({ ...formData, description_gujarati: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="ગુજરાતીમાં વર્ણન"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Duration (minutes) *
                  </label>
                  <input
                    type="number"
                    value={formData.duration_minutes}
                    onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    min="1"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Total Marks
                  </label>
                  <input
                    type="number"
                    value={formData.total_marks}
                    onChange={(e) => setFormData({ ...formData, total_marks: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    min="0"
                  />
                </div>
              </div>

              {/* Status Toggle */}
              <div className="border-t pt-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="is_active" className="ml-2 block text-sm text-gray-700">
                    Active (test is available for use)
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingTest(null);
                    setFormData({ title: '', description: '', title_gujarati: '', description_gujarati: '', duration_minutes: 60, total_marks: 0, is_active: true });
                  }}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50"
                >
                  {createMutation.isPending || updateMutation.isPending ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, test: null, action: 'delete', loading: false })}
        onConfirm={handleConfirmDelete}
        title={getConfirmModalContent().title}
        message={getConfirmModalContent().message}
        confirmText={confirmModal.action.includes('delete') ? 'Delete' : confirmModal.action.includes('activate') ? 'Activate' : 'Deactivate'}
        type={confirmModal.action.includes('delete') ? 'danger' : 'warning'}
        loading={confirmModal.loading}
      />
    </div>
  );
};

export default SubCategoryDetailPage;