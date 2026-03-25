import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { PlusIcon, EyeIcon, PencilIcon, TrashIcon, ArrowLeftIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { formatDate } from '../lib/utils';

// New centralized services and types
import { testManagementService } from '../services/test-management.service';
import { BulkOperationHelpers } from '../lib/api/base-service';
import type { SubCategory, SubCategoryFormData, Category } from '../types/test-management';

// New reusable components
import { DataTable, Column } from '../components/common/DataTable/DataTable';
import { SearchFilters } from '../components/common/SearchFilters';
import { BulkActionsBar } from '../components/common/BulkActionsBar';
import { ConfirmModal } from '../components/modals/ConfirmModal';
import { Pagination } from '../components/common/Pagination';

// New custom hooks
import { usePagination } from '../hooks/usePagination';
import { useBulkSelection } from '../hooks/useBulkSelection';
import { useConfirmModal } from '../hooks/useConfirmModal';

const CategoryDetailPageNew: React.FC = () => {
  const { categoryUuid } = useParams<{ categoryUuid: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // State management using custom hooks
  const { filters, handleSearch, handlePageChange, handleLimitChange, handleStatusChange } = usePagination();
  const { confirmModal, openConfirmModal, closeConfirmModal, setConfirmModalLoading } = useConfirmModal<SubCategory>();

  // Form state for create/edit modal
  const [showModal, setShowModal] = useState(false);
  const [editingSubCategory, setEditingSubCategory] = useState<SubCategory | null>(null);
  const [formData, setFormData] = useState<SubCategoryFormData>({
    name: '',
    description: '',
    name_gujarati: '',
    description_gujarati: '',
    is_active: true,
  });

  // Data fetching using new service
  const { data, isLoading, error } = useQuery({
    queryKey: ['subCategories', categoryUuid, filters],
    queryFn: () => testManagementService.subCategories.list(categoryUuid!, filters),
    enabled: !!categoryUuid,
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
    items: data?.subCategories || [],
    getItemId: (item) => item.uuid,
  });

  // Mutations using new service
  const createMutation = useMutation({
    mutationFn: (subCategoryData: SubCategoryFormData) =>
      testManagementService.subCategories.create(categoryUuid!, subCategoryData),
    onSuccess: () => {
      toast.success('Sub-category created successfully');
      queryClient.invalidateQueries({ queryKey: ['subCategories', categoryUuid] });
      setShowModal(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create sub-category');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ uuid, data }: { uuid: string; data: SubCategoryFormData }) =>
      testManagementService.subCategories.update(uuid, data),
    onSuccess: () => {
      toast.success('Sub-category updated successfully');
      queryClient.invalidateQueries({ queryKey: ['subCategories', categoryUuid] });
      setShowModal(false);
      setEditingSubCategory(null);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update sub-category');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: testManagementService.subCategories.delete,
    onSuccess: () => {
      toast.success('Sub-category deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['subCategories', categoryUuid] });
      closeConfirmModal();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete sub-category');
      setConfirmModalLoading(false);
    },
  });

  const bulkMutation = useMutation({
    mutationFn: testManagementService.subCategories.bulkOperations,
    onSuccess: (result) => {
      const { action, processedCount } = result;
      toast.success(`${processedCount} sub-categories ${action}d successfully`);
      queryClient.invalidateQueries({ queryKey: ['subCategories', categoryUuid] });
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
      name: '',
      description: '',
      name_gujarati: '',
      description_gujarati: '',
      is_active: true,
    });
  };

  const handleCreate = () => {
    setEditingSubCategory(null);
    resetForm();
    setShowModal(true);
  };

  const handleEdit = (subCategory: SubCategory) => {
    setEditingSubCategory(subCategory);
    setFormData({
      name: subCategory.name,
      description: subCategory.description,
      name_gujarati: subCategory.name_gujarati || '',
      description_gujarati: subCategory.description_gujarati || '',
      is_active: subCategory.is_active,
    });
    setShowModal(true);
  };

  const handleDelete = (subCategory: SubCategory) => {
    openConfirmModal(subCategory, 'delete');
  };

  const handleBulkAction = (action: 'activate' | 'deactivate' | 'delete') => {
    if (selectedCount === 0) {
      toast.error('Please select at least one sub-category');
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
      const params = BulkOperationHelpers.forSubCategories(action, selectedIds);
      bulkMutation.mutate(params);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSubCategory) {
      updateMutation.mutate({ uuid: editingSubCategory.uuid, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  // Table configuration
  const columns: Column<SubCategory>[] = [
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      render: (item) => (
        <div>
          <div className="font-semibold text-gray-900">{item.name}</div>
          {item.name_gujarati && (
            <div className="text-sm text-gray-500">{item.name_gujarati}</div>
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
      key: 'tests_count',
      label: 'Tests',
      sortable: true,
      render: (item) => (
        <span className="text-gray-900 font-medium">{item.tests_count}</span>
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
  const renderActions = (item: SubCategory) => (
    <div className="flex gap-2">
      <button
        onClick={() => navigate(`/sub-categories/${item.uuid}`)}
        className="p-2 text-primary-600 hover:text-primary-800 hover:bg-primary-50 rounded-lg"
        title="View Tests"
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
        title: 'Delete Sub-category',
        message: `Are you sure you want to delete "${confirmModal.item.name}"? This will also delete all associated tests and questions. This action cannot be undone.`,
      };
    } else if (confirmModal.action === 'bulk_delete') {
      return {
        title: 'Delete Sub-categories',
        message: `Are you sure you want to delete ${selectedCount} sub-categories? This will also delete all associated content. This action cannot be undone.`,
      };
    } else if (confirmModal.action === 'bulk_activate') {
      return {
        title: 'Activate Sub-categories',
        message: `Are you sure you want to activate ${selectedCount} sub-categories?`,
      };
    } else if (confirmModal.action === 'bulk_deactivate') {
      return {
        title: 'Deactivate Sub-categories',
        message: `Are you sure you want to deactivate ${selectedCount} sub-categories?`,
      };
    }
    return { title: '', message: '' };
  };

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">Error loading sub-categories</div>
        <button
          onClick={() => queryClient.invalidateQueries({ queryKey: ['subCategories', categoryUuid] })}
          className="text-primary-600 hover:text-primary-800"
        >
          Try again
        </button>
      </div>
    );
  }

  const category = data?.category;
  const subCategories = data?.subCategories || [];
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
          Categories
        </button>
        <span className="text-gray-400">/</span>
        <span className="text-gray-600">{category?.name}</span>
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
              {category?.name} - Sub-categories
            </h1>
            <p className="text-gray-600 mt-1">{category?.description}</p>
          </div>
        </div>
        <button
          onClick={handleCreate}
          className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 flex items-center gap-2"
        >
          <PlusIcon className="h-5 w-5" />
          Add Sub-category
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
                <p className="text-sm font-medium text-gray-600">Total Sub-categories</p>
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
                <p className="text-sm font-medium text-gray-600">With Tests</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.withTests}</p>
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
          totalCount={subCategories.length}
          actions={bulkActions}
          onClearSelection={clearSelection}
        />

        {/* Data Table */}
        <DataTable
          data={subCategories}
          columns={columns}
          loading={isLoading}
          emptyMessage="No sub-categories found"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">
              {editingSubCategory ? 'Edit Sub-category' : 'Add Sub-category'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                    Name (Gujarati)
                  </label>
                  <input
                    type="text"
                    value={formData.name_gujarati}
                    onChange={(e) => setFormData({ ...formData, name_gujarati: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="ગુજરાતીમાં નામ"
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
                    Active (sub-category is available for use)
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingSubCategory(null);
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

export default CategoryDetailPageNew;