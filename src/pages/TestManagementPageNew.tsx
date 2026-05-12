import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { PlusIcon, EyeIcon, PencilIcon, TrashIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { formatDate } from '../lib/utils';

// API Base URL — VITE_API_URL already includes /api, we add /admin here.
// Default falls back to the backend's documented dev port (3000), matching ENV.API_URL.
const apiBaseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api') + '/admin';

// Simple API service that works
const testSeriesApi = {
  fetchTestSeries: async (params: any = {}) => {
    const token = sessionStorage.getItem('admin_token');
    const queryParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        queryParams.append(key, value.toString());
      }
    });

    const response = await fetch(`${apiBaseUrl}/test-management?${queryParams}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    return data;
  },

  createTestSeries: async (testSeries: any) => {
    const token = sessionStorage.getItem('admin_token');
    const response = await fetch(`${apiBaseUrl}/test-management`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(testSeries)
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.message);
    return data.data;
  },

  updateTestSeries: async (uuid: string, testSeries: any) => {
    const token = sessionStorage.getItem('admin_token');
    const response = await fetch(`${apiBaseUrl}/test-management/${uuid}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(testSeries)
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.message);
    return data.data;
  },

  deleteTestSeries: async (uuid: string) => {
    const token = sessionStorage.getItem('admin_token');
    const response = await fetch(`${apiBaseUrl}/test-management/${uuid}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.message);
    return data.data;
  },

  bulkOperations: async (action: string, uuids: string[]) => {
    const token = sessionStorage.getItem('admin_token');
    const response = await fetch(`${apiBaseUrl}/test-management/bulk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ action, testSeriesIds: uuids })
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.message);
    return data;
  }
};

// Interface for test series with subscription features
interface TestSeries {
  id: number;
  uuid: string;
  title: string;
  description: string;
  title_gujarati?: string;
  description_gujarati?: string;
  is_active: boolean;
  pricing_type?: 'free' | 'paid' | 'previous_years_question_papers';
  price?: number;
  currency?: string;
  discount_percentage?: number;
  is_featured?: boolean;
  features?: any;
  // Negative marking moved to category level
  // has_negative_marking?: boolean;
  // negative_marks?: number;
  created_at: string;
  updated_at: string;
  categories_count: number;
}

interface TestSeriesFormData {
  title: string;
  description: string;
  title_gujarati?: string;
  description_gujarati?: string;
  is_active?: boolean;
  pricing_type?: 'free' | 'paid' | 'previous_years_question_papers';
  price?: number;
  currency?: string;
  discount_percentage?: number;
  is_featured?: boolean;
  features?: any;
  // Negative marking moved to category level
  // has_negative_marking?: boolean;
  // negative_marks?: number;
}

// Import existing components
import { ConfirmModal } from '../components/modals/ConfirmModal';
import RichTextEditor from '../components/common/RichTextEditor';

const TestManagementPageNew: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // State management
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    search: '',
    status: 'all'
  });
  const [pricingTypeFilter, setPricingTypeFilter] = useState<'all' | 'free' | 'paid' | 'previous_years_question_papers'>('all');

  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    loading: false,
    item: null as TestSeries | null,
    action: '' as string
  });

  // Form state for create/edit modal
  const [showModal, setShowModal] = useState(false);
  const [editingTestSeries, setEditingTestSeries] = useState<TestSeries | null>(null);
  const [formData, setFormData] = useState<TestSeriesFormData>({
    title: '',
    description: '',
    title_gujarati: '',
    description_gujarati: '',
    is_active: true,
    pricing_type: 'free',
    price: 0,
    currency: 'INR',
    discount_percentage: 0,
    is_featured: false,
    features: null,
    validity_days: 365,
    is_course_closed: false,
  });

  // Data fetching using simple API
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['testSeries', filters],
    queryFn: () => testSeriesApi.fetchTestSeries(filters),
    refetchOnWindowFocus: true,
    staleTime: 0, // Always refetch when needed
  });

  // Bulk selection management
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const allTestSeries = data?.data || [];

  // Apply pricing type filter
  const testSeries = pricingTypeFilter === 'all'
    ? allTestSeries
    : allTestSeries.filter((item: TestSeries) => item.pricing_type === pricingTypeFilter);

  const selectedCount = selectedIds.length;
  const isAllSelected = testSeries.length > 0 && selectedIds.length === testSeries.length;

  const toggleSelection = (uuid: string) => {
    setSelectedIds(prev =>
      prev.includes(uuid) ? prev.filter(id => id !== uuid) : [...prev, uuid]
    );
  };

  const toggleSelectAll = () => {
    setSelectedIds(isAllSelected ? [] : testSeries.map(item => item.uuid));
  };

  const clearSelection = () => setSelectedIds([]);

  const isSelected = (uuid: string) => selectedIds.includes(uuid);

  // Mutations using simple API
  const createMutation = useMutation({
    mutationFn: testSeriesApi.createTestSeries,
    onSuccess: async () => {
      toast.success('Course created successfully');

      // Multiple strategies to ensure refresh
      try {
        // 1. Invalidate all related queries
        await queryClient.invalidateQueries({ queryKey: ['testSeries'] });

        // 2. Force refetch with exact query key
        await queryClient.refetchQueries({
          queryKey: ['testSeries', filters],
          type: 'active'
        });

        // 3. Direct refetch of current query
        await refetch();

        // 4. Clear query cache and refetch
        queryClient.removeQueries({ queryKey: ['testSeries'] });
        await refetch();

        // 5. Force refresh after delay to ensure backend consistency
        setTimeout(async () => {
          console.log('🔄 Delayed refresh - invalidating queries...');
          await queryClient.invalidateQueries({ queryKey: ['testSeries'] });
          await refetch();
          console.log('🔄 Delayed refresh completed');
        }, 1500);

      } catch (error) {
        console.log('Refresh error:', error);
      }

      setShowModal(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create test series');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ uuid, data }: { uuid: string; data: TestSeriesFormData }) =>
      testSeriesApi.updateTestSeries(uuid, data),
    onSuccess: async () => {
      toast.success('Course updated successfully');

      // Multiple strategies to ensure refresh
      try {
        // 1. Invalidate all related queries
        await queryClient.invalidateQueries({ queryKey: ['testSeries'] });

        // 2. Force refetch with exact query key
        await queryClient.refetchQueries({
          queryKey: ['testSeries', filters],
          type: 'active'
        });

        // 3. Direct refetch of current query
        await refetch();

        // 4. Clear query cache and refetch
        queryClient.removeQueries({ queryKey: ['testSeries'] });
        await refetch();

        // 5. Force refresh after delay to ensure backend consistency  
        setTimeout(async () => {
          console.log('🔄 Update: Delayed refresh - invalidating queries...');
          await queryClient.invalidateQueries({ queryKey: ['testSeries'] });
          await refetch();
          console.log('🔄 Update: Delayed refresh completed');
        }, 1500);

      } catch (error) {
        console.log('Refresh error:', error);
      }

      setShowModal(false);
      setEditingTestSeries(null);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update test series');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: testSeriesApi.deleteTestSeries,
    onSuccess: () => {
      toast.success('Test series deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['testSeries'] });
      closeConfirmModal();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete test series');
      setConfirmModalLoading(false);
    },
  });

  const bulkMutation = useMutation({
    mutationFn: ({ action, uuids }: { action: string; uuids: string[] }) =>
      testSeriesApi.bulkOperations(action, uuids),
    onSuccess: (result) => {
      toast.success(`Test series ${result.action}d successfully`);
      queryClient.invalidateQueries({ queryKey: ['testSeries'] });
      clearSelection();
      closeConfirmModal();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Bulk operation failed');
      setConfirmModalLoading(false);
    },
  });

  // Helper functions
  const openConfirmModal = (item: TestSeries | null, action: string) => {
    setConfirmModal({ isOpen: true, loading: false, item, action });
  };

  const closeConfirmModal = () => {
    setConfirmModal({ isOpen: false, loading: false, item: null, action: '' });
  };

  const setConfirmModalLoading = (loading: boolean) => {
    setConfirmModal(prev => ({ ...prev, loading }));
  };

  const handleSearch = (search: string) => {
    setFilters(prev => ({ ...prev, search, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const handleLimitChange = (limit: number) => {
    setFilters(prev => ({ ...prev, limit, page: 1 }));
  };

  const handleStatusChange = (status: string) => {
    setFilters(prev => ({ ...prev, status, page: 1 }));
  };

  // Event handlers
  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      title_gujarati: '',
      description_gujarati: '',
      is_active: true,
      pricing_type: 'free',
      price: 0,
      currency: 'INR',
      discount_percentage: 0,
      is_featured: false,
      features: null,
      has_negative_marking: false,
      negative_marks: 0.25,
      validity_days: 365,
      is_course_closed: false
    });
  };

  const handleCreate = () => {
    setEditingTestSeries(null);
    resetForm();
    setShowModal(true);
  };

  const handleEdit = (testSeries: TestSeries) => {
    setEditingTestSeries(testSeries);
    setFormData({
      title: testSeries.title,
      description: testSeries.description,
      title_gujarati: testSeries.title_gujarati || '',
      description_gujarati: testSeries.description_gujarati || '',
      is_active: testSeries.is_active,
      pricing_type: testSeries.pricing_type || 'free',
      price: testSeries.price || 0,
      currency: testSeries.currency || 'INR',
      discount_percentage: testSeries.discount_percentage || 0,
      is_featured: testSeries.is_featured || false,
      features: testSeries.features || null,
      has_negative_marking: (testSeries as any).has_negative_marking || false,
      negative_marks: (testSeries as any).negative_marks || 0.25,
      validity_days: testSeries.validity_days || 365,
      is_course_closed: testSeries.is_course_closed || false,
    });
    setShowModal(true);
  };

  const handleDelete = (testSeries: TestSeries) => {
    openConfirmModal(testSeries, 'delete');
  };

  const handleBulkAction = (action: 'activate' | 'deactivate' | 'delete') => {
    if (selectedCount === 0) {
      toast.error('Please select at least one test series');
      return;
    }
    openConfirmModal(null, `bulk_${action}`);
  };

  const handleConfirm = async () => {
    if (!confirmModal.item && !confirmModal.action.startsWith('bulk_')) return;

    setConfirmModalLoading(true);

    if (confirmModal.action === 'delete' && confirmModal.item) {
      deleteMutation.mutate(confirmModal.item.uuid);
    } else if (confirmModal.action.startsWith('bulk_')) {
      const action = confirmModal.action.replace('bulk_', '') as 'activate' | 'deactivate' | 'delete';
      bulkMutation.mutate({ action, uuids: selectedIds });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTestSeries) {
      updateMutation.mutate({ uuid: editingTestSeries.uuid, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  // Bulk actions configuration
  const bulkActions = [
    {
      label: 'Activate',
      icon: <PlusIcon className="h-4 w-4" />,
      onClick: () => handleBulkAction('activate'),
      variant: 'success' as const,
    },
    {
      label: 'Deactivate',
      icon: <PlusIcon className="h-4 w-4" />,
      onClick: () => handleBulkAction('deactivate'),
      variant: 'warning' as const,
    },
    {
      label: 'Delete',
      icon: <TrashIcon className="h-4 w-4" />,
      onClick: () => handleBulkAction('delete'),
      variant: 'danger' as const,
    },
  ];

  

  // Get confirm modal content
  const getConfirmModalContent = () => {
    if (confirmModal.action === 'delete' && confirmModal.item) {
      return {
        title: 'Delete Course',
        message: `Are you sure you want to delete "${confirmModal.item.title}"? This will also delete all associated categories, sub-categories, tests, and questions. This action cannot be undone.`,
      };
    } else if (confirmModal.action === 'bulk_delete') {
      return {
        title: 'Delete Course',
        message: `Are you sure you want to delete ${selectedCount} test series? This will also delete all associated content. This action cannot be undone.`,
      };
    } else if (confirmModal.action === 'bulk_activate') {
      return {
        title: 'Activate Course',
        message: `Are you sure you want to activate ${selectedCount} test series?`,
      };
    } else if (confirmModal.action === 'bulk_deactivate') {
      return {
        title: 'Deactivate Course',
        message: `Are you sure you want to deactivate ${selectedCount} test series?`,
      };
    }
    return { title: '', message: '' };
  };

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">Error loading test series</div>
        <button
          onClick={() => queryClient.invalidateQueries({ queryKey: ['testSeries'] })}
          className="text-primary-600 hover:text-primary-800"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Course Management</h1>
          <p className="text-gray-600 mt-1">Manage your course series and their hierarchical structure</p>
        </div>
        <button
          onClick={handleCreate}
          className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 flex items-center gap-2"
        >
          <PlusIcon className="h-5 w-5" />
          Add Course
        </button>
      </div>

      {/* Statistics Cards */}
      {data?.stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-primary-100 rounded-lg">
                <ChartBarIcon className="h-6 w-6 text-primary-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Series</p>
                <p className="text-2xl font-semibold text-gray-900">{data.stats.total}</p>
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
                <p className="text-2xl font-semibold text-gray-900">{data.stats.active}</p>
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
                <p className="text-2xl font-semibold text-gray-900">{data.stats.inactive}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-primary-100 rounded-lg">
                <ChartBarIcon className="h-6 w-6 text-primary-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">With Categories</p>
                <p className="text-2xl font-semibold text-gray-900">{data.stats.withCategories}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Simple Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {/* Search */}
        <div className="p-4 border-b">
          <div className="flex gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search test series..."
                value={filters.search}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <select
              value={filters.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <select
              value={pricingTypeFilter}
              onChange={(e) => setPricingTypeFilter(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Types</option>
              <option value="free">Free</option>
              <option value="paid">Paid</option>
              <option value="previous_years_question_papers">Previous Years Papers</option>
            </select>
          </div>
        </div>

        {/* Bulk Actions Bar */}
        {selectedCount > 0 && (
          <div className="px-4 py-3 bg-primary-50 border-b flex items-center justify-between">
            <div className="text-sm text-primary-700">
              {selectedCount} item{selectedCount > 1 ? 's' : ''} selected
            </div>
            <div className="flex gap-2">
              {bulkActions.map((action) => (
                <button
                  key={action.key}
                  onClick={action.onClick}
                  className={`px-3 py-1 rounded text-sm font-medium ${action.className}`}
                >
                  {action.label}
                </button>
              ))}
              <button
                onClick={clearSelection}
                className="px-3 py-1 rounded text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-200"
              >
                Clear
              </button>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={toggleSelectAll}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type & Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Categories
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : testSeries.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                    No test series found
                  </td>
                </tr>
              ) : (
                testSeries.map((item: TestSeries) => (
                  <tr key={item.uuid} className={`hover:bg-gray-50 ${isSelected(item.uuid) ? 'bg-primary-50' : ''}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={isSelected(item.uuid)}
                        onChange={() => toggleSelection(item.uuid)}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="font-semibold text-gray-900">{item.title}</div>
                        {item.title_gujarati && (
                          <div className="text-sm text-gray-500">{item.title_gujarati}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${item.pricing_type === 'paid'
                          ? 'bg-yellow-100 text-yellow-800'
                          : item.pricing_type === 'previous_years_question_papers'
                            ? 'bg-primary-100 text-primary-800'
                            : 'bg-primary-100 text-primary-800'
                          }`}>
                          {item.pricing_type === 'paid'
                            ? 'Paid'
                            : item.pricing_type === 'previous_years_question_papers'
                              ? 'PYQ'
                              : 'Free'
                          }
                        </span>
                        {item.pricing_type === 'paid' && item.price && (
                          <span className="text-sm font-medium text-gray-900">
                            ₹{item.price}
                          </span>
                        )}
                        {item.is_featured && (
                          <span className="px-1 py-0.5 bg-primary-100 text-primary-800 text-xs rounded">⭐</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${item.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                        }`}>
                        {item.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-900 font-medium">
                      {item.categories_count}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(item.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex gap-2">
                        <button
                          onClick={() => navigate(`/test-series/${item.uuid}`)}
                          className="p-2 text-primary-600 hover:text-primary-800 hover:bg-primary-50 rounded-lg"
                          title="View Categories"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(item)}
                          className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg"
                          title="Edit"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item)}
                          className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg"
                          title="Delete"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Simple Pagination */}
        {data?.pagination && (
          <div className="px-6 py-3 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {((data.pagination.page - 1) * data.pagination.limit) + 1} to{' '}
                {Math.min(data.pagination.page * data.pagination.limit, data.pagination.total)} of{' '}
                {data.pagination.total} results
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handlePageChange(data.pagination.page - 1)}
                  disabled={data.pagination.page <= 1}
                  className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="px-3 py-1 bg-primary-100 text-primary-800 rounded">
                  {data.pagination.page} of {data.pagination.totalPages}
                </span>
                <button
                  onClick={() => handlePageChange(data.pagination.page + 1)}
                  disabled={data.pagination.page >= data.pagination.totalPages}
                  className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Form Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4">
              {editingTestSeries ? 'Edit Course' : 'Add Course'}
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
                {/* <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                /> */}
                <RichTextEditor
                  value={formData.description}
                  onChange={(content) => setFormData({ ...formData, description: content })}
                  placeholder="Enter explanation (optional)"
                  height={200}
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
                  {/* <textarea
                    value={formData.description_gujarati}
                    onChange={(e) => setFormData({ ...formData, description_gujarati: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="ગુજરાતીમાં વર્ણન"
                  /> */}
                  <RichTextEditor
                    value={formData?.description_gujarati}
                    onChange={(content) => setFormData({ ...formData, description_gujarati: content })}
                    placeholder="Enter explanation (optional)"
                    height={200}
                  />
                </div>
              </div>

              {/* Pricing Configuration */}
              <div className="border-t pt-4">
                <h3 className="text-md font-medium text-gray-800 mb-3">💰 Pricing & Subscription Settings</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Pricing Type *
                      <span className="text-xs text-gray-500 ml-1">(Choose test series type)</span>
                    </label>
                    <select
                      value={formData.pricing_type}
                      onChange={(e) => {
                        const newPricingType = e.target.value as 'free' | 'paid' | 'previous_years_question_papers';
                        const isNonPaid = newPricingType === 'free' || newPricingType === 'previous_years_question_papers';
                        setFormData({
                          ...formData,
                          pricing_type: newPricingType,
                          // Reset price and is_course_closed if switching to free or PYQ
                          price: isNonPaid ? 0 : formData.price,
                          is_course_closed: isNonPaid ? false : formData.is_course_closed
                        });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="free">Free - Open access for all students</option>
                      <option value="paid">Paid - Requires subscription to access</option>
                      <option value="previous_years_question_papers">Previous Years Question Papers</option>
                    </select>
                  </div>

                  {formData.pricing_type === 'paid' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Price *
                      </label>
                      <div className="flex">
                        <select
                          value={formData.currency}
                          onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                          className="px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-primary-500 bg-gray-50"
                        >
                          <option value="INR">₹</option>
                          <option value="USD">$</option>
                        </select>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.price}
                          onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                          className="flex-1 px-3 py-2 border-l-0 border border-gray-300 rounded-r-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                          required
                        />
                      </div>
                    </div>
                  )}
                </div>


                {formData.pricing_type === 'paid' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Discount Percentage
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={formData.discount_percentage}
                        onChange={(e) => setFormData({ ...formData, discount_percentage: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="0.00"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Course Validity (Days)
                        <span className="text-xs text-gray-500 ml-1">(Default: 365 days)</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={formData.validity_days || 365}
                        onChange={(e) => setFormData({ ...formData, validity_days: parseInt(e.target.value) || 365 })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="365"
                      />
                    </div>
                  </div>
                )}

                {formData.pricing_type === 'paid' && (
                  <div className="mt-4">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="is_featured"
                        checked={formData.is_featured}
                        onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <label htmlFor="is_featured" className="ml-2 block text-sm text-gray-700">
                        Featured Series ⭐
                      </label>
                    </div>
                  </div>
                )}
              </div>

              {/* Test Configuration - Negative marking moved to category level */}
              <div className="border-t pt-4">
                <h3 className="text-md font-medium text-gray-800 mb-3">⚙️ Test Configuration</h3>
                <p className="text-sm text-gray-600">
                  ℹ️ Negative marking is now configured at the category level for more granular control.
                </p>
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
                    Active (test series is available for use)
                  </label>
                </div>
              </div>
              {/* is_course_closed Toggle - Only visible for paid pricing type */}
              {formData.pricing_type === 'paid' && (
                <div className="border-t pt-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="is_course_closed"
                      checked={formData.is_course_closed}
                      onChange={(e) => setFormData({ ...formData, is_course_closed: e.target.checked })}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label htmlFor="is_course_closed" className="ml-2 block text-sm text-gray-700">
                      Course Closed (prevents new enrollments)
                    </label>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingTestSeries(null);
                    resetForm();
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
        onClose={closeConfirmModal}
        onConfirm={handleConfirm}
        title={getConfirmModalContent().title}
        message={getConfirmModalContent().message}
        confirmText={confirmModal.action.includes('delete') ? 'Delete' : confirmModal.action.includes('activate') ? 'Activate' : 'Deactivate'}
        type={confirmModal.action.includes('delete') ? 'danger' : 'warning'}
        loading={confirmModal.loading}
      />
    </div>
  );
};

export default TestManagementPageNew;