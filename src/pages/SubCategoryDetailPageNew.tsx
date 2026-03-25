import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { PlusIcon, EyeIcon, PencilIcon, TrashIcon, ArrowLeftIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { formatDate } from '../lib/utils';

// Import services and types  
import { testManagementService } from '../services/test-management.service';
import { BulkOperationHelpers } from '../lib/api/base-service';
import type { Test, TestFormData, SubCategory } from '../types/test-management';

// Import reusable components
import { DataTable, Column } from '../components/common/DataTable/DataTable';
import { SearchFilters } from '../components/common/SearchFilters';
import { BulkActionsBar } from '../components/common/BulkActionsBar';
import { ConfirmModal } from '../components/modals/ConfirmModal';
import { Pagination } from '../components/common/Pagination';

// Import custom hooks
import { usePagination } from '../hooks/usePagination';
import { useBulkSelection } from '../hooks/useBulkSelection';
import { useConfirmModal } from '../hooks/useConfirmModal';

// Interfaces
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
  instructions?: string;
  instructions_gujarati?: string;
  created_at: string;
  updated_at: string;
  questions_count: number;
}

interface TestFormData {
  title: string;
  description: string;
  title_gujarati?: string;
  description_gujarati?: string;
  duration_minutes: number;
  total_marks: number;
  is_active: boolean;
  is_demo: boolean;
  is_free_in_paid_series: boolean;
  negative_marking_enabled: boolean;
  negative_marks_per_wrong: number;
  is_one_time_only: boolean;
  max_duration_minutes?: number;
  passing_marks?: number;
  instructions?: string;
  instructions_gujarati?: string;
  attempt_restrictions?: {
    max_attempts: number;
    cooldown_hours: number;
  };
}

const SubCategoryDetailPageNew: React.FC = () => {
  const { subCategoryUuid } = useParams<{ subCategoryUuid: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // State management using custom hooks
  const { filters, handleSearch, handlePageChange, handleLimitChange, handleStatusChange } = usePagination();
  const { confirmModal, openConfirmModal, closeConfirmModal, setConfirmModalLoading } = useConfirmModal<Test>();

  // Form state for create/edit modal
  const [showModal, setShowModal] = useState(false);
  const [editingTest, setEditingTest] = useState<Test | null>(null);
  const [formData, setFormData] = useState<TestFormData>({
    title: '',
    description: '',
    title_gujarati: '',
    description_gujarati: '',
    duration_minutes: 60,
    total_marks: 0,
    is_active: true,
    is_demo: false,
    is_free_in_paid_series: false,
    negative_marking_enabled: false,
    negative_marks_per_wrong: 0.25,
    is_one_time_only: false,
    max_duration_minutes: undefined,
    passing_marks: undefined,
    instructions: '',
    instructions_gujarati: '',
    attempt_restrictions: {
      max_attempts: 1,
      cooldown_hours: 0
    }
  });

  // Data fetching using service
  const { data, isLoading, error } = useQuery({
    queryKey: ['tests', subCategoryUuid, filters],
    queryFn: () => testManagementService.tests.list(subCategoryUuid!, filters),
    enabled: !!subCategoryUuid,
  });

  // Bulk selection management
  const {
    selectedIds,
    isSelected,
    isAllSelected,
    toggleSelection,
    toggleSelectAll,
    clearSelection,
    selectedCount,
  } = useBulkSelection({
    items: data?.tests || [],
    getItemId: (item) => item.uuid,
  });

  // Mutations using new service
  const createMutation = useMutation({
    mutationFn: (testData: TestFormData) =>
      testManagementService.tests.create(subCategoryUuid!, testData),
    onSuccess: () => {
      toast.success('Test created successfully');
      queryClient.invalidateQueries({ queryKey: ['tests', subCategoryUuid] });
      setShowModal(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create test');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ uuid, data }: { uuid: string; data: TestFormData }) =>
      testManagementService.tests.update(uuid, data),
    onSuccess: () => {
      toast.success('Test updated successfully');
      queryClient.invalidateQueries({ queryKey: ['tests', subCategoryUuid] });
      setShowModal(false);
      setEditingTest(null);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update test');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: testManagementService.tests.delete,
    onSuccess: () => {
      toast.success('Test deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['tests', subCategoryUuid] });
      closeConfirmModal();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete test');
      setConfirmModalLoading(false);
    },
  });

  const bulkMutation = useMutation({
    mutationFn: testManagementService.tests.bulkOperations,
    onSuccess: (result) => {
      const { action, processedCount } = result;
      toast.success(`${processedCount} tests ${action}d successfully`);
      queryClient.invalidateQueries({ queryKey: ['tests', subCategoryUuid] });
      clearSelection();
      closeConfirmModal();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Bulk operation failed');
      setConfirmModalLoading(false);
    },
  });

  // Event handlers
  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      title_gujarati: '',
      description_gujarati: '',
      duration_minutes: 60,
      total_marks: 0,
      is_active: true,
      is_demo: false,
      is_free_in_paid_series: false,
      negative_marking_enabled: false,
      negative_marks_per_wrong: 0.25,
      is_one_time_only: false,
      max_duration_minutes: undefined,
      passing_marks: undefined,
      instructions: '',
      instructions_gujarati: '',
      attempt_restrictions: {
        max_attempts: 1,
        cooldown_hours: 0
      },
    });
  };

  const handleCreate = () => {
    setEditingTest(null);
    resetForm();
    setShowModal(true);
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
      is_active: test.is_active,
      is_demo: test.is_demo || false,
      is_free_in_paid_series: test.is_free_in_paid_series || false,
      negative_marking_enabled: test.negative_marking_enabled || false,
      negative_marks_per_wrong: test.negative_marks_per_wrong || 0.25,
      is_one_time_only: test.is_one_time_only || false,
      max_duration_minutes: test.max_duration_minutes,
      passing_marks: test.passing_marks,
      instructions: test.instructions || '',
      instructions_gujarati: test.instructions_gujarati || '',
      attempt_restrictions: test.attempt_restrictions || {
        max_attempts: 1,
        cooldown_hours: 0
      },
    });
    setShowModal(true);
  };

  const handleDelete = (test: Test) => {
    openConfirmModal(test, 'delete');
  };

  const handleBulkAction = (action: 'activate' | 'deactivate' | 'delete') => {
    if (selectedCount === 0) {
      toast.error('Please select at least one test');
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
      const params = BulkOperationHelpers.forTests(action, selectedIds);
      bulkMutation.mutate(params);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTest) {
      updateMutation.mutate({ uuid: editingTest.uuid, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  // Table configuration
  const columns: Column<Test>[] = [
    {
      key: 'title',
      label: 'Title',
      sortable: true,
      render: (item) => (
        <div>
          <div className="font-semibold text-gray-900">{item.title}</div>
          {item.title_gujarati && (
            <div className="text-sm text-gray-500">{item.title_gujarati}</div>
          )}
        </div>
      ),
    },
    {
      key: 'description',
      label: 'Description',
      render: (item) => (
        <div className="max-w-xs truncate">
          <div className="text-sm text-gray-600">{item.description}</div>
          {item.description_gujarati && (
            <div className="text-xs text-gray-500 truncate">{item.description_gujarati}</div>
          )}
        </div>
      ),
    },
    {
      key: 'duration_minutes',
      label: 'Duration',
      sortable: true,
      render: (item) => (
        <span className="text-gray-900 font-medium">{item.duration_minutes} min</span>
      ),
    },
    {
      key: 'total_marks',
      label: 'Total Marks',
      sortable: true,
      render: (item) => (
        <span className="text-gray-900 font-medium">{item.total_marks}</span>
      ),
    },
    {
      key: 'is_active',
      label: 'Status',
      sortable: true,
      render: (item) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            item.is_active
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          }`}
        >
          {item.is_active ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'test_features',
      label: 'Features',
      render: (item) => (
        <div className="flex flex-wrap gap-1">
          {item.is_demo && (
            <span className="px-2 py-1 bg-primary-100 text-primary-800 rounded-full text-xs">
              Demo
            </span>
          )}
          {item.is_free_in_paid_series && (
            <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
              Free
            </span>
          )}
          {item.negative_marking_enabled && (
            <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">
              -ve Marking
            </span>
          )}
          {item.is_one_time_only && (
            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
              One-time
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'questions_count',
      label: 'Questions',
      sortable: true,
      render: (item) => (
        <span className="text-gray-900 font-medium">{item.questions_count}</span>
      ),
    },
    {
      key: 'created_at',
      label: 'Created',
      sortable: true,
      render: (item) => (
        <span className="text-sm text-gray-500">
          {formatDate(item.created_at)}
        </span>
      ),
    },
  ];

  // Filter configuration
  const searchFilters = [
    {
      key: 'status',
      label: 'Status',
      type: 'select' as const,
      value: filters.status || 'all',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Inactive', value: 'inactive' },
      ],
    },
  ];

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

  // Render actions for each row
  const renderActions = (item: Test) => (
    <div className="flex gap-2">
      <button
        onClick={() => navigate(`/tests/${item.uuid}`)}
        className="p-2 text-primary-600 hover:text-primary-800 hover:bg-primary-50 rounded-lg"
        title="View Questions"
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
  );

  // Get confirm modal content
  const getConfirmModalContent = () => {
    if (confirmModal.action === 'delete' && confirmModal.item) {
      return {
        title: 'Delete Test',
        message: `Are you sure you want to delete "${confirmModal.item.title}"? This will also delete all associated questions. This action cannot be undone.`,
      };
    } else if (confirmModal.action === 'bulk_delete') {
      return {
        title: 'Delete Tests',
        message: `Are you sure you want to delete ${selectedCount} tests? This will also delete all associated content. This action cannot be undone.`,
      };
    } else if (confirmModal.action === 'bulk_activate') {
      return {
        title: 'Activate Tests',
        message: `Are you sure you want to activate ${selectedCount} tests?`,
      };
    } else if (confirmModal.action === 'bulk_deactivate') {
      return {
        title: 'Deactivate Tests',
        message: `Are you sure you want to deactivate ${selectedCount} tests?`,
      };
    }
    return { title: '', message: '' };
  };

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">Error loading tests</div>
        <button
          onClick={() => queryClient.invalidateQueries({ queryKey: ['tests', subCategoryUuid] })}
          className="text-primary-600 hover:text-primary-800"
        >
          Try again
        </button>
      </div>
    );
  }

  const subCategory = data?.subCategory;
  const tests = data?.tests || [];
  const stats = data?.stats;

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
        <span className="text-gray-600">{subCategory?.name}</span>
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
            <h1 className="text-2xl font-bold text-gray-900">
              {subCategory?.name} - Tests
            </h1>
            <p className="text-gray-600 mt-1">{subCategory?.description}</p>
          </div>
        </div>
        <button
          onClick={handleCreate}
          className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 flex items-center gap-2"
        >
          <PlusIcon className="h-5 w-5" />
          Add Test
        </button>
      </div>

      {/* Statistics Cards */}
      {stats && (
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
      )}

      {/* Data Table with all components */}
      <div className="bg-white rounded-lg shadow">
        {/* Search and Filters */}
        <SearchFilters
          searchValue={filters.search || ''}
          onSearchChange={handleSearch}
          filters={searchFilters}
          onFilterChange={(key, value) => {
            if (key === 'status') handleStatusChange(value as any);
          }}
          onClearFilters={() => {
            handleSearch('');
            handleStatusChange('all');
          }}
        />

        {/* Bulk Actions Bar */}
        <BulkActionsBar
          selectedCount={selectedCount}
          totalCount={tests.length}
          actions={bulkActions}
          onClearSelection={clearSelection}
        />

        {/* Data Table */}
        <DataTable
          data={tests}
          columns={columns}
          loading={isLoading}
          emptyMessage="No tests found"
          selectable
          selectedIds={selectedIds}
          onSelectItem={toggleSelection}
          onSelectAll={toggleSelectAll}
          isAllSelected={isAllSelected}
          renderActions={renderActions}
        />

        {/* Pagination */}
        {data?.pagination && (
          <Pagination
            currentPage={data.pagination.page}
            totalPages={data.pagination.totalPages}
            totalItems={data.pagination.total}
            itemsPerPage={data.pagination.limit}
            onPageChange={handlePageChange}
            onItemsPerPageChange={handleLimitChange}
          />
        )}
      </div>

      {/* Form Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
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

              {/* Advanced Test Configuration */}
              <div className="border-t pt-4">
                <h3 className="text-md font-medium text-gray-800 mb-3">⚙️ Advanced Test Settings</h3>
                <p className="text-sm text-gray-600 mb-4">Configure special features for this test</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="flex items-start">
                    <input
                      type="checkbox"
                      id="is_demo"
                      checked={formData.is_demo}
                      onChange={(e) => setFormData({ ...formData, is_demo: e.target.checked })}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded mt-1"
                    />
                    <div className="ml-2">
                      <label htmlFor="is_demo" className="block text-sm font-medium text-gray-700">
                       Demo Test
                      </label>
                      <p className="text-xs text-gray-500">Free preview test for paid series</p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <input
                      type="checkbox"
                      id="is_free_in_paid_series"
                      checked={formData.is_free_in_paid_series}
                      onChange={(e) => setFormData({ ...formData, is_free_in_paid_series: e.target.checked })}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded mt-1"
                    />
                    <div className="ml-2">
                      <label htmlFor="is_free_in_paid_series" className="block text-sm font-medium text-gray-700">
                        Free in Paid Series
                      </label>
                      <p className="text-xs text-gray-500">Available without subscription in paid series</p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <input
                      type="checkbox"
                      id="negative_marking_enabled"
                      checked={formData.negative_marking_enabled}
                      onChange={(e) => setFormData({ ...formData, negative_marking_enabled: e.target.checked })}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded mt-1"
                    />
                    <div className="ml-2">
                      <label htmlFor="negative_marking_enabled" className="block text-sm font-medium text-gray-700">
                        Negative Marking
                      </label>
                      <p className="text-xs text-gray-500">Deduct marks for wrong answers</p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <input
                      type="checkbox"
                      id="is_one_time_only"
                      checked={formData.is_one_time_only}
                      onChange={(e) => setFormData({ ...formData, is_one_time_only: e.target.checked })}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded mt-1"
                    />
                    <div className="ml-2">
                      <label htmlFor="is_one_time_only" className="block text-sm font-medium text-gray-700">
                        One-time Test
                      </label>
                      <p className="text-xs text-gray-500">Student can take this test only once</p>
                    </div>
                  </div>
                </div>

                {formData.negative_marking_enabled && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                    <label className="block text-sm font-medium text-red-800 mb-1">
                      ⚠️ Negative Marks per Wrong Answer
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="5"
                      value={formData.negative_marks_per_wrong}
                      onChange={(e) => setFormData({ ...formData, negative_marks_per_wrong: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-red-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                      placeholder="0.25"
                    />
                    <p className="text-xs text-red-600 mt-1">
                      💡 Common values: <strong>0.25</strong> (1/4 mark), <strong>0.33</strong> (1/3 mark), <strong>0.50</strong> (1/2 mark)
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  {formData.is_one_time_only && (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                      <label className="block text-sm font-medium text-yellow-800 mb-1">
                        ⏰ Max Duration (minutes)
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={formData.max_duration_minutes || ''}
                        onChange={(e) => setFormData({ ...formData, max_duration_minutes: parseInt(e.target.value) || undefined })}
                        className="w-full px-3 py-2 border border-yellow-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 bg-white"
                        placeholder="120"
                      />
                      <p className="text-xs text-yellow-600 mt-1">Maximum time allowed for one-time test</p>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Passing Marks (optional)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.passing_marks || ''}
                      onChange={(e) => setFormData({ ...formData, passing_marks: parseInt(e.target.value) || undefined })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="40"
                    />
                    <p className="text-xs text-gray-500 mt-1">Minimum marks required to pass the test</p>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Test Instructions
                  </label>
                  <textarea
                    value={formData.instructions}
                    onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Instructions for students taking this test..."
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Test Instructions (Gujarati)
                  </label>
                  <textarea
                    value={formData.instructions_gujarati}
                    onChange={(e) => setFormData({ ...formData, instructions_gujarati: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="વિદ્યાર્થીઓ માટે સૂચનાઓ..."
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

export default SubCategoryDetailPageNew;