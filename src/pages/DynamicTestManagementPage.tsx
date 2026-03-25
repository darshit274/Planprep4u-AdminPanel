import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ChevronRightIcon,
  FolderIcon,
  DocumentTextIcon,
  PlusIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  QuestionMarkCircleIcon,
  ArrowLeftIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import {
  useGetTestSeriesHierarchyQuery,
  useCreateCategoryMutation,
  useDeleteCategoryMutation,
  DynamicCategory,
  HierarchyNode,
  AvailableActions
} from '../../../mocktail-app-design-bolt/store/api/dynamicTestApi';

interface DynamicTestManagementPageProps {}

const DynamicTestManagementPage: React.FC<DynamicTestManagementPageProps> = () => {
  const { testSeriesId } = useParams<{ testSeriesId: string }>();
  const navigate = useNavigate();
  
  const [expandedNodes, setExpandedNodes] = useState<Set<number>>(new Set());
  const [selectedCategory, setSelectedCategory] = useState<DynamicCategory | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createModalParent, setCreateModalParent] = useState<number | null>(null);

  // API calls
  const {
    data: hierarchyData,
    isLoading,
    error,
    refetch
  } = useGetTestSeriesHierarchyQuery({
    testSeriesId: parseInt(testSeriesId!),
    includeQuestions: true
  }, {
    skip: !testSeriesId
  });

  const [createCategory, { isLoading: isCreating }] = useCreateCategoryMutation();
  const [deleteCategory, { isLoading: isDeleting }] = useDeleteCategoryMutation();

  const testSeries = hierarchyData?.testSeries;
  const hierarchy = hierarchyData?.hierarchy || [];
  const statistics = hierarchyData?.statistics;

  // =====================
  // TREE NAVIGATION HANDLERS
  // =====================

  const toggleExpanded = (categoryId: number) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedNodes(newExpanded);
  };

  const handleCategorySelect = (category: DynamicCategory) => {
    setSelectedCategory(category);
  };

  const handleAddSubcategory = (parentId: number | null) => {
    setCreateModalParent(parentId);
    setShowCreateModal(true);
  };

  const handleAddQuestions = (categoryId: number) => {
    navigate(`/admin/dynamic-test/categories/${categoryId}/questions`);
  };

  const handleViewQuestions = (categoryId: number) => {
    navigate(`/admin/dynamic-test/categories/${categoryId}/questions?mode=view`);
  };

  const handleEditCategory = (categoryId: number) => {
    navigate(`/admin/dynamic-test/categories/${categoryId}/edit`);
  };

  const handleDeleteCategory = async (categoryId: number, categoryName: string) => {
    if (!window.confirm(`Are you sure you want to delete "${categoryName}"?`)) {
      return;
    }

    try {
      await deleteCategory(categoryId).unwrap();
      toast.success('Category deleted successfully');
      setSelectedCategory(null);
      refetch();
    } catch (error: any) {
      toast.error(error.data?.message || 'Failed to delete category');
    }
  };

  // =====================
  // RENDERING HELPERS
  // =====================

  const renderCategoryIcon = (category: DynamicCategory) => {
    switch (category.node_type) {
      case 'container':
        return <FolderIcon className="w-5 h-5 text-primary-500" />;
      case 'question_holder':
        return <DocumentTextIcon className="w-5 h-5 text-green-500" />;
      default:
        return <QuestionMarkCircleIcon className="w-5 h-5 text-gray-400" />;
    }
  };

  const renderCategoryNode = (category: DynamicCategory, depth = 0): React.ReactNode => {
    const isExpanded = expandedNodes.has(category.id);
    const hasChildren = category.subcategories && category.subcategories.length > 0;
    const isSelected = selectedCategory?.id === category.id;
    
    return (
      <div key={category.id} className="w-full">
        {/* Category Row */}
        <div
          className={`
            flex items-center p-3 rounded-lg cursor-pointer transition-all duration-200
            ${isSelected 
              ? 'bg-primary-50 border-2 border-primary-200' 
              : 'hover:bg-gray-50 border-2 border-transparent'
            }
          `}
          style={{ marginLeft: `${depth * 24}px` }}
          onClick={() => handleCategorySelect(category)}
        >
          {/* Expand/Collapse Button */}
          <div className="w-6 h-6 flex items-center justify-center mr-2">
            {hasChildren && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleExpanded(category.id);
                }}
                className="p-1 rounded hover:bg-gray-200 transition-colors"
              >
                {isExpanded ? (
                  <ChevronDownIcon className="w-4 h-4" />
                ) : (
                  <ChevronRightIcon className="w-4 h-4" />
                )}
              </button>
            )}
          </div>

          {/* Category Icon */}
          <div className="mr-3">
            {renderCategoryIcon(category)}
          </div>

          {/* Category Info */}
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900">{category.name}</h3>
                <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                  <span>Level {category.hierarchy_level}</span>
                  <span>{category.node_type.replace('_', ' ')}</span>
                  {category.questions_count > 0 && (
                    <span>{category.questions_count} questions</span>
                  )}
                  {category.subcategories_count > 0 && (
                    <span>{category.subcategories_count} subcategories</span>
                  )}
                  {category.total_questions_count > 0 && (
                    <span>({category.total_questions_count} total questions)</span>
                  )}
                </div>
              </div>
              
              {/* Quick Action Badges */}
              <div className="flex items-center space-x-2">
                {category.node_type === 'question_holder' && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {category.questions_count} Q
                  </span>
                )}
                {category.node_type === 'container' && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                    {category.subcategories_count} Sub
                  </span>
                )}
                {category.node_type === 'unset' && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                    Empty
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Children */}
        {hasChildren && isExpanded && (
          <div className="mt-2">
            {category.subcategories!.map(child => 
              renderCategoryNode(child, depth + 1)
            )}
          </div>
        )}
      </div>
    );
  };

  const renderActionButtons = (category: DynamicCategory): React.ReactNode => {
    const actions: AvailableActions = {
      canAddSubcategory: category.node_type !== 'question_holder',
      canAddQuestions: category.node_type !== 'container',
      canEditCategory: true,
      canDeleteCategory: category.subcategories_count === 0 && category.questions_count === 0
    };

    return (
      <div className="space-y-2">
        <h4 className="font-medium text-gray-900 mb-3">Available Actions</h4>
        
        {actions.canAddSubcategory && (
          <button
            onClick={() => handleAddSubcategory(category.id)}
            className="w-full flex items-center px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            Add Subcategory
          </button>
        )}

        {actions.canAddQuestions && (
          <button
            onClick={() => handleAddQuestions(category.id)}
            className="w-full flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            Add Questions
          </button>
        )}

        {category.questions_count > 0 && (
          <button
            onClick={() => handleViewQuestions(category.id)}
            className="w-full flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <EyeIcon className="w-4 h-4 mr-2" />
            View Questions ({category.questions_count})
          </button>
        )}

        <button
          onClick={() => handleEditCategory(category.id)}
          className="w-full flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-yellow-100 rounded-lg hover:bg-yellow-200 transition-colors"
        >
          <PencilIcon className="w-4 h-4 mr-2" />
          Edit Category
        </button>

        {actions.canDeleteCategory && (
          <button
            onClick={() => handleDeleteCategory(category.id, category.name)}
            disabled={isDeleting}
            className="w-full flex items-center px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            <TrashIcon className="w-4 h-4 mr-2" />
            Delete Category
          </button>
        )}

        {!actions.canAddSubcategory && !actions.canAddQuestions && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-800">
              This category already contains {category.node_type === 'container' ? 'subcategories' : 'questions'}. 
              You cannot add {category.node_type === 'container' ? 'questions' : 'subcategories'} to it.
            </p>
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-600">
          Error loading hierarchy: {error.toString()}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/admin/test-management')}
                className="mr-4 p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <ArrowLeftIcon className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Dynamic Test Hierarchy
                </h1>
                <p className="text-sm text-gray-600">
                  {testSeries?.name || 'Test Series'}
                </p>
              </div>
            </div>
            
            <button
              onClick={() => handleAddSubcategory(null)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              Add Root Category
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-12 gap-8">
          
          {/* Hierarchy Tree */}
          <div className="col-span-8">
            <div className="bg-white rounded-lg shadow">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Category Hierarchy</h2>
                  
                  {/* Statistics */}
                  {statistics && (
                    <div className="flex space-x-4 text-sm">
                      <span className="px-3 py-1 bg-primary-100 text-primary-800 rounded-full">
                        {statistics.totalCategories} Categories
                      </span>
                      <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full">
                        {statistics.totalQuestions} Questions
                      </span>
                    </div>
                  )}
                </div>

                {/* Tree View */}
                <div className="space-y-2">
                  {hierarchy.length === 0 ? (
                    <div className="text-center py-12">
                      <FolderIcon className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No categories yet</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Get started by creating your first category.
                      </p>
                      <div className="mt-6">
                        <button
                          onClick={() => handleAddSubcategory(null)}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                        >
                          <PlusIcon className="w-4 h-4 mr-2" />
                          Create Category
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {hierarchy.map(category => renderCategoryNode(category))}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Details Panel */}
          <div className="col-span-4">
            <div className="bg-white rounded-lg shadow">
              <div className="p-6">
                {selectedCategory ? (
                  <>
                    <div className="flex items-center mb-4">
                      {renderCategoryIcon(selectedCategory)}
                      <h3 className="ml-2 text-lg font-semibold text-gray-900">
                        {selectedCategory.name}
                      </h3>
                    </div>

                    {selectedCategory.description && (
                      <p className="text-sm text-gray-600 mb-4">
                        {selectedCategory.description}
                      </p>
                    )}

                    <div className="space-y-3 mb-6">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Type:</span>
                        <span className="capitalize">{selectedCategory.node_type.replace('_', ' ')}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Level:</span>
                        <span>{selectedCategory.hierarchy_level}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Questions:</span>
                        <span>{selectedCategory.questions_count}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Subcategories:</span>
                        <span>{selectedCategory.subcategories_count}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Total Questions:</span>
                        <span>{selectedCategory.total_questions_count}</span>
                      </div>
                    </div>

                    {renderActionButtons(selectedCategory)}
                  </>
                ) : (
                  <div className="text-center py-8">
                    <FolderIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No category selected</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Click on a category to see details and available actions.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Create Category Modal would go here */}
      {/* This would be a separate component */}
    </div>
  );
};

export default DynamicTestManagementPage;