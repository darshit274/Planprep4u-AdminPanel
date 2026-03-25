import React, { useState, useEffect } from 'react';
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

interface HierarchyNode {
  id: number;
  uuid: string;
  name: string;
  description?: string;
  hierarchy_level: number;
  node_type: 'container' | 'question_holder' | 'unset';
  has_questions: boolean;
  has_subcategories: boolean;
  questions_count: number;
  subcategories_count: number;
  total_questions_count: number;
  display_order: number;
  is_active: boolean;
  children?: HierarchyNode[];
  tests?: any[];
}

interface TestSeries {
  id: number;
  uuid: string;
  name: string;
  description?: string;
}

interface HierarchyData {
  testSeries: TestSeries;
  hierarchy: HierarchyNode[];
  statistics: {
    totalCategories: number;
    totalSubCategories: number;
    totalTests: number;
    totalQuestions: number;
  };
}

interface AvailableActions {
  canAddSubcategory: boolean;
  canAddQuestions: boolean;
  canEditCategory: boolean;
  canDeleteCategory: boolean;
}

const DynamicHierarchyPage: React.FC = () => {
  const { testSeriesId } = useParams<{ testSeriesId: string }>();
  const navigate = useNavigate();
  
  const [data, setData] = useState<HierarchyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<number>>(new Set());
  const [selectedCategory, setSelectedCategory] = useState<HierarchyNode | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createModalParent, setCreateModalParent] = useState<number | null>(null);

  // API Base URL
  const API_BASE_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/admin/test-management`;

  // Get admin token
  const getAuthToken = () => {
    // Try different possible token keys
    return sessionStorage.getItem('token') || 
           sessionStorage.getItem('admin_token') || 
           sessionStorage.getItem('authToken') ||
           sessionStorage.getItem('token');
  };

  // Fetch hierarchy data
  const fetchHierarchy = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = getAuthToken();
      console.log('Token:', token ? 'Found' : 'Not found');
      console.log('Fetching hierarchy for:', testSeriesId);
      
      const response = await fetch(`${API_BASE_URL}/hierarchy/${testSeriesId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', errorText);
        throw new Error(`Failed to fetch hierarchy: ${response.status} ${errorText}`);
      }

      const result = await response.json();
      console.log('API Response:', result);
      
      if (result.success) {
        setData(result.data);
        // Auto-expand first level
        if (result.data.hierarchy.length > 0) {
          const newExpanded = new Set<number>();
          result.data.hierarchy.forEach((node: HierarchyNode) => {
            if (node.has_subcategories) {
              newExpanded.add(node.id);
            }
          });
          setExpandedNodes(newExpanded);
        }
      } else {
        setError(result.message || 'Failed to fetch hierarchy');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Create new category
  const createCategory = async (data: { name: string; description?: string; parentCategoryId?: number }) => {
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_BASE_URL}/hierarchy/${testSeriesId}/categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();
      
      if (result.success) {
        toast.success('Category created successfully');
        await fetchHierarchy(); // Refresh data
        setShowCreateModal(false);
        setCreateModalParent(null);
      } else {
        toast.error(result.message || 'Failed to create category');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to create category');
    }
  };

  // Get available actions for a category
  const getAvailableActions = async (categoryId: number, type: 'category' | 'subcategory'): Promise<AvailableActions> => {
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_BASE_URL}/categories/${categoryId}/actions?type=${type}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to get actions');
      }

      const result = await response.json();
      return result.success ? result.data.actions : {
        canAddSubcategory: false,
        canAddQuestions: false,
        canEditCategory: true,
        canDeleteCategory: false
      };
    } catch (err) {
      return {
        canAddSubcategory: false,
        canAddQuestions: false,
        canEditCategory: true,
        canDeleteCategory: false
      };
    }
  };

  useEffect(() => {
    if (testSeriesId) {
      fetchHierarchy();
    }
  }, [testSeriesId]);

  // Event handlers
  const toggleExpanded = (categoryId: number) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedNodes(newExpanded);
  };

  const handleCategorySelect = (category: HierarchyNode) => {
    setSelectedCategory(category);
  };

  const handleAddCategory = (parentId: number | null = null) => {
    setCreateModalParent(parentId);
    setShowCreateModal(true);
  };

  const handleAddQuestions = (categoryId: number) => {
    // Navigate to questions management for this category
    navigate(`/test-management/categories/${categoryId}/questions`);
  };

  const handleViewTests = (categoryId: number) => {
    // Navigate to tests view for this subcategory
    navigate(`/test-management/categories/${categoryId}/tests`);
  };

  // Rendering helpers
  const renderCategoryIcon = (category: HierarchyNode) => {
    switch (category.node_type) {
      case 'container':
        return <FolderIcon className="w-5 h-5 text-primary-500" />;
      case 'question_holder':
        return <DocumentTextIcon className="w-5 h-5 text-green-500" />;
      default:
        return <QuestionMarkCircleIcon className="w-5 h-5 text-gray-400" />;
    }
  };

  const renderCategoryNode = (category: HierarchyNode, depth = 0): React.ReactNode => {
    const isExpanded = expandedNodes.has(category.id);
    const hasChildren = category.children && category.children.length > 0;
    const isSelected = selectedCategory?.id === category.id;
    
    return (
      <div key={category.id} className="w-full">
        {/* Category Row */}
        <div
          className={`
            flex items-center p-3 rounded-lg cursor-pointer transition-all duration-200 mb-1
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
                  <span className="capitalize">{category.node_type.replace('_', ' ')}</span>
                  {category.questions_count > 0 && (
                    <span>{category.questions_count} questions</span>
                  )}
                  {category.subcategories_count > 0 && (
                    <span>{category.subcategories_count} subcategories</span>
                  )}
                  {category.total_questions_count > 0 && (
                    <span className="text-primary-600">({category.total_questions_count} total Q)</span>
                  )}
                </div>
              </div>
              
              {/* Status Badges */}
              <div className="flex items-center space-x-2">
                {category.node_type === 'question_holder' && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Questions: {category.questions_count}
                  </span>
                )}
                {category.node_type === 'container' && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                    Subs: {category.subcategories_count}
                  </span>
                )}
                {category.node_type === 'unset' && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    Empty
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Children */}
        {hasChildren && isExpanded && (
          <div className="mt-1">
            {category.children!.map(child => 
              renderCategoryNode(child, depth + 1)
            )}
          </div>
        )}
      </div>
    );
  };

  const renderActionPanel = () => {
    if (!selectedCategory) {
      return (
        <div className="text-center py-8">
          <FolderIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No category selected</h3>
          <p className="mt-1 text-sm text-gray-500">
            Click on a category to see details and available actions.
          </p>
        </div>
      );
    }

    return (
      <div>
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

        {/* Category Details */}
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
            <span className="font-medium text-primary-600">{selectedCategory.total_questions_count}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          <h4 className="font-medium text-gray-900 mb-3">Available Actions</h4>
          
          {/* Add Subcategory - only for categories that don't have questions */}
          {(selectedCategory.node_type === 'unset' || selectedCategory.node_type === 'container') && selectedCategory.hierarchy_level === 0 && (
            <button
              onClick={() => handleAddCategory(selectedCategory.id)}
              className="w-full flex items-center px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              Add Subcategory
            </button>
          )}

          {/* Add Questions - only for subcategories that don't have subcategories */}
          {selectedCategory.hierarchy_level === 1 && selectedCategory.node_type !== 'container' && (
            <button
              onClick={() => handleAddQuestions(selectedCategory.id)}
              className="w-full flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              Add Questions
            </button>
          )}

          {/* View Tests - for subcategories with questions */}
          {selectedCategory.hierarchy_level === 1 && selectedCategory.questions_count > 0 && selectedCategory.tests && selectedCategory.tests.length > 0 && (
            <button
              onClick={() => handleViewTests(selectedCategory.id)}
              className="w-full flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <EyeIcon className="w-4 h-4 mr-2" />
              View Tests ({selectedCategory.tests.length})
            </button>
          )}

          {/* Edit Category */}
          <button
            className="w-full flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-yellow-100 rounded-lg hover:bg-yellow-200 transition-colors"
          >
            <PencilIcon className="w-4 h-4 mr-2" />
            Edit Category
          </button>

          {/* Constraint Information */}
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg mt-4">
            <h5 className="text-sm font-medium text-amber-800 mb-1">Dynamic Hierarchy Rules:</h5>
            <ul className="text-xs text-amber-700 space-y-1">
              <li>• Categories can have subcategories OR questions, not both</li>
              <li>• Root categories (Level 0) can have subcategories</li>
              <li>• Subcategories (Level 1) can have questions</li>
              <li>• Once you add subcategories, you cannot add questions</li>
              <li>• Once you add questions, you cannot add subcategories</li>
            </ul>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            Error: {error}
          </div>
          <button 
            onClick={fetchHierarchy}
            className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700"
          >
            Try Again
          </button>
          <div className="mt-4 text-sm text-gray-600">
            <p>Test Series ID: {testSeriesId}</p>
            <p>API URL: {API_BASE_URL}</p>
            <p>Token: {getAuthToken() ? 'Present' : 'Missing'}</p>
          </div>
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
                onClick={() => navigate('/test-management')}
                className="mr-4 p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <ArrowLeftIcon className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Dynamic Test Hierarchy
                </h1>
                <p className="text-sm text-gray-600">
                  {data?.testSeries.name || 'Test Series'}
                </p>
              </div>
            </div>
            
            <button
              onClick={() => handleAddCategory(null)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              Add Category
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
                  {data?.statistics && (
                    <div className="flex space-x-4 text-sm">
                      <span className="px-3 py-1 bg-primary-100 text-primary-800 rounded-full">
                        {data.statistics.totalCategories} Categories
                      </span>
                      <span className="px-3 py-1 bg-primary-100 text-primary-800 rounded-full">
                        {data.statistics.totalSubCategories} Subcategories
                      </span>
                      <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full">
                        {data.statistics.totalQuestions} Questions
                      </span>
                      <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full">
                        {data.statistics.totalTests} Tests
                      </span>
                    </div>
                  )}
                </div>

                {/* Tree View */}
                <div className="space-y-1">
                  {data?.hierarchy.length === 0 ? (
                    <div className="text-center py-12">
                      <FolderIcon className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No categories yet</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Get started by creating your first category.
                      </p>
                      <div className="mt-6">
                        <button
                          onClick={() => handleAddCategory(null)}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                        >
                          <PlusIcon className="w-4 h-4 mr-2" />
                          Create Category
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {data?.hierarchy.map(category => renderCategoryNode(category))}
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
                {renderActionPanel()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Create Category Modal */}
      {showCreateModal && (
        <CreateCategoryModal
          isOpen={showCreateModal}
          onClose={() => {
            setShowCreateModal(false);
            setCreateModalParent(null);
          }}
          onSubmit={(data) => createCategory({ ...data, parentCategoryId: createModalParent })}
          parentCategory={createModalParent ? 
            data?.hierarchy.find(cat => cat.id === createModalParent) ||
            data?.hierarchy.flatMap(cat => cat.children || []).find(sub => sub.id === createModalParent)
            : null
          }
        />
      )}
    </div>
  );
};

// Simple Create Category Modal Component
const CreateCategoryModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; description?: string }) => void;
  parentCategory?: HierarchyNode | null;
}> = ({ isOpen, onClose, onSubmit, parentCategory }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSubmit({ name: name.trim(), description: description.trim() || undefined });
      setName('');
      setDescription('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">
          Create {parentCategory ? 'Subcategory' : 'Category'}
        </h3>
        
        {parentCategory && (
          <div className="mb-4 p-3 bg-primary-50 rounded-lg">
            <p className="text-sm text-primary-800">
              Parent: <span className="font-medium">{parentCategory.name}</span>
            </p>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Enter category name"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Enter description (optional)"
              rows={3}
            />
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700"
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DynamicHierarchyPage;