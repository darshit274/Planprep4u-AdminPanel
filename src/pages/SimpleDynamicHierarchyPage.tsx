import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeftIcon,
  PlusIcon,
  FolderIcon,
  QuestionMarkCircleIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { Upload } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { ConfirmModal } from '../components/modals/ConfirmModal';
import QuestionImportModal from '../components/modals/QuestionImportModal';
import RichTextEditor from '../components/common/RichTextEditor';

// Types
interface TestSeries {
  id: number;
  uuid: string;
  name: string;
  description: string;
}

interface Category {
  id: number;
  uuid: string;
  name: string;
  description?: string;
  node_type: 'unset' | 'container' | 'question_holder';
  hierarchy_level: number;
  negative_marking_enabled?: boolean;
  negative_marks_per_wrong?: number;
  test_duration_minutes?: number;
  is_free_in_paid_series?: boolean;
}

interface Question {
  id: number;
  uuid: string;
  question_text: string | null;
  option_a: string | null;
  option_b: string | null;
  option_c: string | null;
  option_d: string | null;
  correct_answer: 'A' | 'B' | 'C' | 'D';
  explanation?: string | null;
  marks: number;
  question_text_gujarati?: string | null;
  option_a_gujarati?: string | null;
  option_b_gujarati?: string | null;
  option_c_gujarati?: string | null;
  option_d_gujarati?: string | null;
  explanation_gujarati?: string | null;
}

interface HierarchyData {
  test_series: TestSeries;
  content_type: 'empty' | 'categories' | 'questions';
  content: Category[] | Question[];
  buttons_state: {
    can_add_category: boolean;
    can_add_question: boolean;
  };
  statistics: {
    root_categories_count?: number;
    child_categories_count?: number;
    questions_count?: number;
    root_questions_count?: number;
    total_hierarchy_levels?: number;
    total_nested_categories?: number;
    total_questions_all_levels?: number;
    hierarchy_level?: number;
    is_leaf_category?: boolean;
    total_descendants?: number;
    total_descendant_questions?: number;
    content_distribution?: {
      categories_with_subcategories?: number;
      categories_with_questions?: number;
      leaf_categories?: number;
      direct_questions?: number;
      nested_categories?: number;
    };
    active_vs_inactive?: {
      active_categories?: number;
      inactive_categories?: number;
      active_questions?: number;
      inactive_questions?: number;
      active_children?: number;
      inactive_children?: number;
    };
  };
}

interface CategoryFormData {
  name: string;
  description: string;
  name_gujarati: string;
  description_gujarati: string;
  negative_marking_enabled: boolean;
  negative_marks_per_wrong: number;
  test_duration_minutes: number;
  is_free_in_paid_series: boolean;
  is_active: boolean;
}

interface QuestionFormData {
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: 'A' | 'B' | 'C' | 'D';
  explanation: string;
  marks: number;
  question_text_gujarati: string;
  option_a_gujarati: string;
  option_b_gujarati: string;
  option_c_gujarati: string;
  option_d_gujarati: string;
  explanation_gujarati: string;
}

const SimpleDynamicHierarchyPage: React.FC = () => {
  const { testSeriesUuid, categoryUuid } = useParams<{
    testSeriesUuid: string;
    categoryUuid?: string;
  }>();
  const navigate = useNavigate();

  // State
  const [data, setData] = useState<HierarchyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [breadcrumb, setBreadcrumb] = useState<Category[]>([]);

  // Modal states
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [showEditCategoryModal, setShowEditCategoryModal] = useState(false);
  const [showEditQuestionModal, setShowEditQuestionModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);

  // Loading states
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [questionLoading, setQuestionLoading] = useState(false);
  const [editCategoryLoading, setEditCategoryLoading] = useState(false);
  const [editQuestionLoading, setEditQuestionLoading] = useState(false);

  // Bulk actions state
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
  const [showBulkCategoryModal, setShowBulkCategoryModal] = useState(false);
  const [showBulkQuestionModal, setShowBulkQuestionModal] = useState(false);
  const [bulkAction, setBulkAction] = useState<'delete' | 'activate' | 'deactivate' | ''>('');

  // Confirmation modal state
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    loading: false,
    item: null as Category | Question | null,
    action: '' as 'delete_category' | 'delete_question' | ''
  });
  const [categoryForm, setCategoryForm] = useState<CategoryFormData>({
    name: '',
    description: '',
    name_gujarati: '',
    description_gujarati: '',
    negative_marking_enabled: false,
    negative_marks_per_wrong: 0.25,
    test_duration_minutes: 60,
    is_free_in_paid_series: false,
    is_active: true
  });
  const [questionForm, setQuestionForm] = useState<QuestionFormData>({
    question_text: '',
    option_a: '',
    option_b: '',
    option_c: '',
    option_d: '',
    correct_answer: 'A',
    explanation: '',
    marks: 1,
    question_text_gujarati: '',
    option_a_gujarati: '',
    option_b_gujarati: '',
    option_c_gujarati: '',
    option_d_gujarati: '',
    explanation_gujarati: ''
  });

  // API Configuration
  const API_BASE = `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/admin/test-management/simple-hierarchy`;

  const getAuthToken = () => {
    return sessionStorage.getItem('admin_token') ||
      sessionStorage.getItem('token') ||
      sessionStorage.getItem('authToken');
  };

  const apiHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${getAuthToken()}`
  };

  // Build breadcrumb trail
  const buildBreadcrumb = async (currentCategoryUuid: string): Promise<Category[]> => {
    const breadcrumbTrail: Category[] = [];

    try {
      // For now, we'll build a simple breadcrumb based on the current category
      // In a full implementation, you'd need to fetch parent categories
      const response = await fetch(`${API_BASE}/categories/${currentCategoryUuid}`, { headers: apiHeaders });
      const result = await response.json();

      if (result.success && result.data.category) {
        const category = result.data.category;

        // If the category has a parent, we could recursively build the full path
        // For now, we'll just add the current category's parent info if available
        if (category.parent_category_id) {
          // This is a simplified approach - in a full implementation you'd recursively fetch parents
          breadcrumbTrail.push({
            uuid: category.parent_category_id,
            name: 'Parent Category', // In real implementation, fetch the actual parent name
            hierarchy_level: category.hierarchy_level - 1
          } as Category);
        }
      }
    } catch (error) {
      console.warn('Failed to build breadcrumb:', error);
    }

    return breadcrumbTrail;
  };

  // Fetch hierarchy data
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      let url: string;
      if (categoryUuid) {
        // Fetch category content
        url = `${API_BASE}/categories/${categoryUuid}`;

        // Build breadcrumb for category navigation
        const breadcrumbTrail = await buildBreadcrumb(categoryUuid);
        setBreadcrumb(breadcrumbTrail);
      } else {
        // Fetch root categories for course
        url = `${API_BASE}/${testSeriesUuid}`;
        setBreadcrumb([]); // Clear breadcrumb for root level
      }

      const response = await fetch(url, { headers: apiHeaders });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        setData(result.data);
      } else {
        setError(result.message || 'Failed to fetch data');
      }

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to determine if negative marking should be shown
  // Rule: Only show for categories with node_type === 'question_holder'
  const shouldShowNegativeMarking = (): boolean => {
    if (!data) return false;

    // When editing a category, check the editingCategory's node_type directly
    if (editingCategory) {
      return editingCategory.node_type === 'question_holder';
    }

    // For creating new categories, DON'T show these fields
    // We don't know the node_type yet (it will be 'unset' until questions/subcategories are added)
    return false;
  };

  // Helper function to determine if test timing should be shown
  // Rule: Only show for categories with node_type === 'question_holder' (same as negative marking)
  const shouldShowTestTiming = (): boolean => {
    return shouldShowNegativeMarking();
  };

  // Create category
  const createCategory = async () => {
    try {
      setCategoryLoading(true);

      if (!categoryForm.name.trim()) {
        toast.error('Category name is required');
        setCategoryLoading(false);
        return;
      }

      const payload = {
        name: categoryForm.name.trim(),
        description: categoryForm.description.trim() || undefined,
        name_gujarati: categoryForm.name_gujarati.trim() || undefined,
        description_gujarati: categoryForm.description_gujarati.trim() || undefined,
        negative_marking_enabled: categoryForm.negative_marking_enabled,
        negative_marks_per_wrong: categoryForm.negative_marks_per_wrong,
        test_duration_minutes: categoryForm.test_duration_minutes,
        is_free_in_paid_series: categoryForm.is_free_in_paid_series,
        is_active: categoryForm.is_active,
        ...(categoryUuid ? {} : { testSeriesUuid })
      };

      const url = categoryUuid
        ? `${API_BASE}/categories/${categoryUuid}/subcategories`
        : `${API_BASE}/categories`;

      const response = await fetch(url, {
        method: 'POST',
        headers: apiHeaders,
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Category created successfully');
        setShowCategoryModal(false);
        setCategoryForm({
          name: '',
          description: '',
          name_gujarati: '',
          description_gujarati: '',
          negative_marking_enabled: false,
          negative_marks_per_wrong: 0.25,
          test_duration_minutes: 60,
          is_free_in_paid_series: false,
          is_active: false
        });
        await fetchData();
      } else {
        toast.error(result.message || 'Failed to create category');
      }

    } catch (err: any) {
      toast.error(err.message || 'Failed to create category');
    } finally {
      setCategoryLoading(false);
    }
  };

  // Create question
  const createQuestion = async () => {
    try {
      setQuestionLoading(true);

      // Smart validation: Check if we have content in at least one language
      const hasEnglishQuestion = questionForm.question_text.trim();
      const hasGujaratiQuestion = questionForm.question_text_gujarati?.trim();

      if (!hasEnglishQuestion && !hasGujaratiQuestion) {
        toast.error('Question text is required in English or Gujarati or both');
        setQuestionLoading(false);
        return;
      }

      // Validate options - at least one language required for each option
      const optionPairs = [
        { en: questionForm.option_a.trim(), gu: questionForm.option_a_gujarati?.trim(), label: 'Option A' },
        { en: questionForm.option_b.trim(), gu: questionForm.option_b_gujarati?.trim(), label: 'Option B' },
        { en: questionForm.option_c.trim(), gu: questionForm.option_c_gujarati?.trim(), label: 'Option C' },
        { en: questionForm.option_d.trim(), gu: questionForm.option_d_gujarati?.trim(), label: 'Option D' }
      ];

      for (const pair of optionPairs) {
        if (!pair.en && !pair.gu) {
          toast.error(`${pair.label} is required in English or Gujarati or both`);
          setQuestionLoading(false);
          return;
        }
      }

      let apiEndpoint;

      if (!categoryUuid) {
        // Root level question creation
        apiEndpoint = `${API_BASE}/${testSeriesUuid}/questions`;
      } else {
        // Category level question creation
        apiEndpoint = `${API_BASE}/categories/${categoryUuid}/questions`;
      }

      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: apiHeaders,
        body: JSON.stringify(questionForm)
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Question created successfully');
        setShowQuestionModal(false);
        setQuestionForm({
          question_text: '',
          option_a: '',
          option_b: '',
          option_c: '',
          option_d: '',
          correct_answer: 'A',
          explanation: '',
          marks: 1,
          question_text_gujarati: '',
          option_a_gujarati: '',
          option_b_gujarati: '',
          option_c_gujarati: '',
          option_d_gujarati: '',
          explanation_gujarati: ''
        });
        await fetchData();
      } else {
        toast.error(result.message || 'Failed to create question');
      }

    } catch (err: any) {
      toast.error(err.message || 'Failed to create question');
    } finally {
      setQuestionLoading(false);
    }
  };

  // Edit category
  const editCategory = (category: Category) => {
    setEditingCategory(category);
    setCategoryForm({
      name: category.name,
      description: category.description || '',
      name_gujarati: (category as any).name_gujarati || '',
      description_gujarati: (category as any).description_gujarati || '',
      negative_marking_enabled: category.negative_marking_enabled || false,
      negative_marks_per_wrong: category.negative_marks_per_wrong || 0.25,
      test_duration_minutes: category.test_duration_minutes || 60,
      is_free_in_paid_series: category.is_free_in_paid_series || false,
      is_active: (category as any).is_active || false
    });
    setShowEditCategoryModal(true);
  };

  // Update category
  const updateCategory = async () => {
    if (!editingCategory) return;

    try {
      setEditCategoryLoading(true);
      const response = await fetch(`${API_BASE}/categories/${editingCategory.uuid}`, {
        method: 'PUT',
        headers: apiHeaders,
        body: JSON.stringify(categoryForm)
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Category updated successfully');
        setShowEditCategoryModal(false);
        setCategoryForm({
          name: '',
          description: '',
          name_gujarati: '',
          description_gujarati: '',
          negative_marking_enabled: false,
          negative_marks_per_wrong: 0.25,
          test_duration_minutes: 60,
          is_free_in_paid_series: false,
          is_active: false
        });
        setEditingCategory(null);
        await fetchData();
      } else {
        toast.error(result.message || 'Failed to update category');
      }

    } catch (err: any) {
      toast.error(err.message || 'Failed to update category');
    } finally {
      setEditCategoryLoading(false);
    }
  };

  // Delete category
  const deleteCategory = async (category: Category) => {
    try {
      const response = await fetch(`${API_BASE}/categories/${category.uuid}`, {
        method: 'DELETE',
        headers: apiHeaders
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Category deleted successfully');
        await fetchData();
      } else {
        toast.error(result.message || 'Failed to delete category');
      }

    } catch (err: any) {
      toast.error(err.message || 'Failed to delete category');
    }
  };

  // Edit question
  const editQuestion = (question: Question) => {
    setEditingQuestion(question);
    setQuestionForm({
      question_text: question.question_text,
      option_a: question.option_a,
      option_b: question.option_b,
      option_c: question.option_c,
      option_d: question.option_d,
      correct_answer: question.correct_answer,
      explanation: question.explanation || '',
      marks: question.marks,
      question_text_gujarati: (question as any).question_text_gujarati || '',
      option_a_gujarati: (question as any).option_a_gujarati || '',
      option_b_gujarati: (question as any).option_b_gujarati || '',
      option_c_gujarati: (question as any).option_c_gujarati || '',
      option_d_gujarati: (question as any).option_d_gujarati || '',
      explanation_gujarati: (question as any).explanation_gujarati || ''
    });
    setShowEditQuestionModal(true);
  };

  // Update question
  const updateQuestion = async () => {
    if (!editingQuestion) return;

    try {
      setEditQuestionLoading(true);

      // Smart validation: Check if we have content in at least one language
      const hasEnglishQuestion = questionForm?.question_text?.trim();
      const hasGujaratiQuestion = questionForm?.question_text_gujarati?.trim();

      if (!hasEnglishQuestion && !hasGujaratiQuestion) {
        toast.error('Question text is required in English or Gujarati or both');
        setEditQuestionLoading(false);
        return;
      }

      // Validate options - at least one language required for each option
      const optionPairs = [
        { en: questionForm?.option_a?.trim(), gu: questionForm?.option_a_gujarati?.trim(), label: 'Option A' },
        { en: questionForm?.option_b?.trim(), gu: questionForm?.option_b_gujarati?.trim(), label: 'Option B' },
        { en: questionForm?.option_c?.trim(), gu: questionForm?.option_c_gujarati?.trim(), label: 'Option C' },
        { en: questionForm?.option_d?.trim(), gu: questionForm?.option_d_gujarati?.trim(), label: 'Option D' }
      ];

      for (const pair of optionPairs) {
        if (!pair.en && !pair.gu) {
          toast.error(`${pair.label} is required in English or Gujarati or both`);
          setEditQuestionLoading(false);
          return;
        }
      }

      const response = await fetch(`${API_BASE}/questions/${editingQuestion.uuid}`, {
        method: 'PUT',
        headers: apiHeaders,
        body: JSON.stringify(questionForm)
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Question updated successfully');
        setShowEditQuestionModal(false);
        setQuestionForm({
          question_text: '',
          option_a: '',
          option_b: '',
          option_c: '',
          option_d: '',
          correct_answer: 'A',
          explanation: '',
          marks: 1,
          question_text_gujarati: '',
          option_a_gujarati: '',
          option_b_gujarati: '',
          option_c_gujarati: '',
          option_d_gujarati: '',
          explanation_gujarati: ''
        });
        setEditingQuestion(null);
        await fetchData();
      } else {
        toast.error(result.message || 'Failed to update question');
      }

    } catch (err: any) {
      toast.error(err.message || 'Failed to update question');
    } finally {
      setEditQuestionLoading(false);
    }
  };

  // Delete question
  const deleteQuestion = async (question: Question) => {
    try {
      const response = await fetch(`${API_BASE}/questions/${question.uuid}`, {
        method: 'DELETE',
        headers: apiHeaders
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Question deleted successfully');
        await fetchData();
      } else {
        toast.error(result.message || 'Failed to delete question');
      }

    } catch (err: any) {
      toast.error(err.message || 'Failed to delete question');
    }
  };

  // Navigate to category
  const navigateToCategory = (category: Category) => {
    navigate(`/simple-hierarchy/${testSeriesUuid}/categories/${category.uuid}`);
  };

  // Bulk actions for categories
  const handleCategorySelection = (categoryUuid: string, checked: boolean) => {
    setSelectedCategories(prev =>
      checked
        ? [...prev, categoryUuid]
        : prev.filter(id => id !== categoryUuid)
    );
  };

  const handleQuestionSelection = (questionUuid: string, checked: boolean) => {
    setSelectedQuestions(prev =>
      checked
        ? [...prev, questionUuid]
        : prev.filter(id => id !== questionUuid)
    );
  };

  const selectAllCategories = (checked: boolean) => {
    if (checked) {
      const allCategoryIds = data?.content_type === 'categories'
        ? (data.content as Category[]).map(cat => cat.uuid)
        : [];
      setSelectedCategories(allCategoryIds);
    } else {
      setSelectedCategories([]);
    }
  };

  const selectAllQuestions = (checked: boolean) => {
    if (checked) {
      const allQuestionIds = data?.content_type === 'questions'
        ? (data.content as Question[]).map(q => q.uuid)
        : [];
      setSelectedQuestions(allQuestionIds);
    } else {
      setSelectedQuestions([]);
    }
  };

  const performBulkCategoryAction = async () => {
    if (!bulkAction || selectedCategories.length === 0) return;

    try {
      const response = await fetch(`${API_BASE}/categories/bulk`, {
        method: 'POST',
        headers: apiHeaders,
        body: JSON.stringify({
          action: bulkAction,
          categoryIds: selectedCategories
        })
      });

      const result = await response.json();

      if (result.success) {
        toast.success(`${selectedCategories.length} categories ${bulkAction}d successfully`);
        setSelectedCategories([]);
        setShowBulkCategoryModal(false);
        setBulkAction('');
        await fetchData();
      } else {
        toast.error(result.message || `Failed to ${bulkAction} categories`);
      }

    } catch (err: any) {
      console.error(`Error performing bulk ${bulkAction} on categories:`, err);
      toast.error(`Failed to ${bulkAction} categories`);
    }
  };

  const performBulkQuestionAction = async () => {
    if (!bulkAction || selectedQuestions.length === 0) return;

    try {
      const response = await fetch(`${API_BASE}/questions/bulk`, {
        method: 'POST',
        headers: apiHeaders,
        body: JSON.stringify({
          action: bulkAction,
          questionIds: selectedQuestions
        })
      });

      const result = await response.json();

      if (result.success) {
        toast.success(`${selectedQuestions.length} questions ${bulkAction}d successfully`);
        setSelectedQuestions([]);
        setShowBulkQuestionModal(false);
        setBulkAction('');
        await fetchData();
      } else {
        toast.error(result.message || `Failed to ${bulkAction} questions`);
      }

    } catch (err: any) {
      console.error(`Error performing bulk ${bulkAction} on questions:`, err);
      toast.error(`Failed to ${bulkAction} questions`);
    }
  };

  // Confirmation modal helper functions
  const openConfirmModal = (item: Category | Question, action: 'delete_category' | 'delete_question') => {
    setConfirmModal({
      isOpen: true,
      loading: false,
      item,
      action
    });
  };

  const closeConfirmModal = () => {
    setConfirmModal({
      isOpen: false,
      loading: false,
      item: null,
      action: ''
    });
  };

  const setConfirmModalLoading = (loading: boolean) => {
    setConfirmModal(prev => ({ ...prev, loading }));
  };

  const getConfirmModalContent = () => {
    if (confirmModal.action === 'delete_category' && confirmModal.item) {
      const category = confirmModal.item as Category;
      return {
        title: 'Delete Category',
        message: `Are you sure you want to delete the category "${category.name}"? This will also delete all subcategories and questions within it. This action cannot be undone.`,
      };
    } else if (confirmModal.action === 'delete_question' && confirmModal.item) {
      const question = confirmModal.item as Question;
      return {
        title: 'Delete Question',
        message: `Are you sure you want to delete this question: "${(question.question_text || question.question_text_gujarati || 'No question text').slice(0, 50)}..."? This action cannot be undone.`,
      };
    }
    return { title: '', message: '' };
  };

  const handleConfirmAction = async () => {
    if (!confirmModal.item) return;

    setConfirmModalLoading(true);

    try {
      if (confirmModal.action === 'delete_category') {
        await deleteCategory(confirmModal.item as Category);
      } else if (confirmModal.action === 'delete_question') {
        await deleteQuestion(confirmModal.item as Question);
      }
      closeConfirmModal();
    } catch (error) {
      setConfirmModalLoading(false);
      // Error handling is already done in the delete functions
    }
  };

  // Navigate back
  const navigateBack = () => {
    if (categoryUuid) {
      navigate(`/simple-hierarchy/${testSeriesUuid}`);
    } else {
      navigate('/test-management');
    }
  };

  useEffect(() => {
    if (testSeriesUuid) {
      fetchData();
    }
  }, [testSeriesUuid, categoryUuid]);

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
          <div className="text-red-600 mb-4">Error: {error}</div>
          <button
            onClick={fetchData}
            className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 mr-2"
          >
            Try Again
          </button>
          <button
            onClick={() => navigate('/test-management')}
            className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
          >
            Back to Course Management
          </button>
        </div>
      </div>
    );
  }

  const isRootLevel = !categoryUuid;
  const currentCategory = data?.category;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            {/* Header Row */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <button
                  onClick={navigateBack}
                  className="mr-4 p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <ArrowLeftIcon className="w-5 h-5" />
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {isRootLevel
                      ? (data?.test_series?.name || 'Course')
                      : (currentCategory?.name || 'Category')
                    }
                  </h1>
                  <p className="text-sm text-gray-600">
                    {isRootLevel
                      ? 'Course Categories'
                      : `Level ${currentCategory?.hierarchy_level || 0} Category`
                    }
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-2">
                <button
                  onClick={() => setShowCategoryModal(true)}
                  disabled={!data?.buttons_state.can_add_category}
                  className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${data?.buttons_state.can_add_category
                    ? 'bg-primary-600 text-white hover:bg-primary-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                >
                  <PlusIcon className="w-4 h-4 mr-2" />
                  Add Category
                </button>

                <button
                  onClick={() => {
                    if (isRootLevel) {
                      toast.error('Questions cannot be added directly to the course level. Please create categories first and add questions inside them.');
                      return;
                    }
                    setShowQuestionModal(true);
                  }}
                  disabled={!data?.buttons_state.can_add_question || isRootLevel}
                  className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${data?.buttons_state.can_add_question && !isRootLevel
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                >
                  <PlusIcon className="w-4 h-4 mr-2" />
                  Add Question
                </button>

                <button
                  onClick={() => {
                    if (isRootLevel) {
                      toast.error('Bulk import cannot be used at the course level. Please create categories first and import questions inside them.');
                      return;
                    }
                    setShowImportModal(true);
                  }}
                  disabled={!data?.buttons_state.can_add_question || isRootLevel}
                  className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${data?.buttons_state.can_add_question && !isRootLevel
                    ? 'bg-primary-600 text-white hover:bg-primary-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Bulk Import
                </button>
              </div>
            </div>

            {/* Breadcrumb Navigation */}
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <button
                onClick={() => navigate('/test-management')}
                className="text-primary-600 hover:text-primary-800 transition-colors"
              >
                Course Management
              </button>
              <span>/</span>

              {isRootLevel ? (
                <span className="text-gray-900 font-medium">
                  {data?.test_series?.name || 'Course'}
                </span>
              ) : (
                <>
                  <button
                    onClick={() => navigate(`/simple-hierarchy/${testSeriesUuid}`)}
                    className="text-primary-600 hover:text-primary-800 transition-colors"
                  >
                    {data?.test_series?.name || 'Course'}
                  </button>

                  {breadcrumb.map((category, index) => (
                    <React.Fragment key={category.uuid}>
                      <span>/</span>
                      <button
                        onClick={() => {
                          // Navigate to this category level
                          const categoryPath = breadcrumb.slice(0, index + 1);
                          const targetCategory = categoryPath[categoryPath.length - 1];
                          navigate(`/simple-hierarchy/${testSeriesUuid}/categories/${targetCategory.uuid}`);
                        }}
                        className="text-primary-600 hover:text-primary-800 transition-colors"
                      >
                        {category.name}
                      </button>
                    </React.Fragment>
                  ))}

                  {currentCategory && (
                    <>
                      <span>/</span>
                      <span className="text-gray-900 font-medium">{currentCategory.name}</span>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            {data?.content_type === 'empty' ? (
              <div className="text-center py-12">
                <FolderIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No content yet</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Choose "Add Category" or "Add Question" to get started.
                </p>
              </div>
            ) : data?.content_type === 'categories' ? (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Categories</h2>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={selectedCategories.length === (data.content as Category[])?.length && (data.content as Category[])?.length > 0}
                      onChange={(e) => selectAllCategories(e.target.checked)}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-600">Select All</span>
                    {selectedCategories.length > 0 && (
                      <button
                        onClick={() => setShowBulkCategoryModal(true)}
                        className="ml-4 px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600"
                      >
                        Bulk Actions ({selectedCategories.length})
                      </button>
                    )}
                  </div>
                </div>
                <div className="grid gap-4">
                  {(data.content as Category[]).map((category) => (
                    <div
                      key={category.uuid}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedCategories.includes(category.uuid)}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleCategorySelection(category.uuid, e.target.checked);
                          }}
                          className="mr-3 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <div
                          className="flex items-center cursor-pointer"
                          onClick={() => navigateToCategory(category)}
                        >
                          <FolderIcon className="w-5 h-5 text-primary-500 mr-3" />
                          <div>
                            <h3 className="font-medium text-gray-900" dangerouslySetInnerHTML={{ __html: category.name }}></h3>
                            {category.description && (
                              <p className="text-sm text-gray-500" dangerouslySetInnerHTML={{ __html: category.description }}></p>
                            )}
                            <div className="flex items-center space-x-4 text-xs text-gray-400 mt-1">
                              <span>Level {category.hierarchy_level}</span>
                              <span className="capitalize">{category.node_type.replace('_', ' ')}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            editCategory(category);
                          }}
                          className="p-1 text-gray-400 hover:text-primary-600"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openConfirmModal(category, 'delete_category');
                          }}
                          className="p-1 text-gray-400 hover:text-red-600"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : data?.content_type === 'questions' ? (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Questions</h2>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={selectedQuestions.length === (data.content as Question[])?.length && (data.content as Question[])?.length > 0}
                      onChange={(e) => selectAllQuestions(e.target.checked)}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-600">Select All</span>
                    {selectedQuestions.length > 0 && (
                      <button
                        onClick={() => setShowBulkQuestionModal(true)}
                        className="ml-4 px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600"
                      >
                        Bulk Actions ({selectedQuestions.length})
                      </button>
                    )}
                  </div>
                </div>
                <div className="space-y-4">
                  {(data.content as Question[]).map((question, index) => (
                    <div key={question.uuid} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start">
                          <input
                            type="checkbox"
                            checked={selectedQuestions.includes(question.uuid)}
                            onChange={(e) => handleQuestionSelection(question.uuid, e.target.checked)}
                            className="mt-1 mr-3 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                          />
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h3 className="font-medium text-gray-900" dangerouslySetInnerHTML={{ __html: `Q${index + 1}. ${question.question_text || question.question_text_gujarati || 'No question text'}` }}>
                              {/* Q{index + 1}. {question.question_text || question.question_text_gujarati || 'No question text'} */}
                            </h3>
                            {/* Language indicator */}
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${question.question_text && question.question_text_gujarati ? 'bg-primary-100 text-primary-800' :
                              question.question_text ? 'bg-primary-100 text-primary-800' :
                                question.question_text_gujarati ? 'bg-orange-100 text-orange-800' : 'bg-gray-100 text-gray-800'
                              }`}>
                              {question.question_text && question.question_text_gujarati ? 'Both' :
                                question.question_text ? 'English' :
                                  question.question_text_gujarati ? 'Gujarati' : 'Unknown'}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className={`p-2 rounded ${question.correct_answer === 'A' ? 'bg-green-100' : 'bg-gray-100'}`}>
                              A. {question.option_a || question.option_a_gujarati || 'No option A'}
                            </div>
                            <div className={`p-2 rounded ${question.correct_answer === 'B' ? 'bg-green-100' : 'bg-gray-100'}`}>
                              B. {question.option_b || question.option_b_gujarati || 'No option B'}
                            </div>
                            <div className={`p-2 rounded ${question.correct_answer === 'C' ? 'bg-green-100' : 'bg-gray-100'}`}>
                              C. {question.option_c || question.option_c_gujarati || 'No option C'}
                            </div>
                            <div className={`p-2 rounded ${question.correct_answer === 'D' ? 'bg-green-100' : 'bg-gray-100'}`}>
                              D. {question.option_d || question.option_d_gujarati || 'No option D'}
                            </div>
                          </div>
                          {(question.explanation || question.explanation_gujarati) && (
                            <div className="mt-2 p-2 bg-primary-50 rounded text-sm">
                              <strong>Explanation:</strong> {question.explanation || question.explanation_gujarati}
                            </div>
                          )}
                          <div className="mt-2 text-xs text-gray-500">
                            Marks: {question.marks}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        <button
                          onClick={() => {
                            editQuestion(question);
                          }}
                          className="p-1 text-gray-400 hover:text-primary-600"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            openConfirmModal(question, 'delete_question');
                          }}
                          className="p-1 text-gray-400 hover:text-red-600"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    </div>
                  ))}
              </div>
              </div>
            ) : null}

          {/* Enhanced Statistics */}
          {data?.statistics && (
            <div className="mt-8 p-6 bg-gradient-to-r from-primary-50 to-primary-50 rounded-lg border border-primary-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z"></path>
                  <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z"></path>
                </svg>
                Detailed Statistics
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Basic Counts */}
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <h4 className="font-medium text-gray-700 mb-2">Current Level</h4>
                  <div className="space-y-1 text-sm">
                    {data.statistics.root_categories_count !== undefined && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Categories:</span>
                        <span className="font-semibold text-primary-600">{data.statistics.root_categories_count}</span>
                      </div>
                    )}
                    {data.statistics.root_questions_count !== undefined && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Questions:</span>
                        <span className="font-semibold text-green-600">{data.statistics.root_questions_count}</span>
                      </div>
                    )}
                    {data.statistics.child_categories_count !== undefined && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Subcategories:</span>
                        <span className="font-semibold text-primary-600">{data.statistics.child_categories_count}</span>
                      </div>
                    )}
                    {data.statistics.questions_count !== undefined && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Category Questions:</span>
                        <span className="font-semibold text-orange-600">{data.statistics.questions_count}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Category-specific information */}
                {(data.statistics.hierarchy_level !== undefined ||
                  data.statistics.total_descendants !== undefined ||
                  data.statistics.total_descendant_questions !== undefined) && (
                    <div className="bg-white p-4 rounded-lg shadow-sm">
                      <h4 className="font-medium text-gray-700 mb-2">Category Details</h4>
                      <div className="space-y-1 text-sm">
                        {data.statistics.hierarchy_level !== undefined && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Current Level:</span>
                            <span className="font-semibold text-primary-600">{data.statistics.hierarchy_level}</span>
                          </div>
                        )}
                        {data.statistics.is_leaf_category !== undefined && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Type:</span>
                            <span className={`font-semibold ${data.statistics.is_leaf_category ? 'text-orange-600' : 'text-primary-600'}`}>
                              {data.statistics.is_leaf_category ? 'Leaf Category' : 'Parent Category'}
                            </span>
                          </div>
                        )}
                        {data.statistics.total_descendants !== undefined && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Descendants:</span>
                            <span className="font-semibold text-primary-600">{data.statistics.total_descendants}</span>
                          </div>
                        )}
                        {data.statistics.total_descendant_questions !== undefined && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">All Questions:</span>
                            <span className="font-semibold text-green-600">{data.statistics.total_descendant_questions}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                {/* Hierarchy Overview */}
                {(data.statistics.total_hierarchy_levels !== undefined ||
                  data.statistics.total_nested_categories !== undefined ||
                  data.statistics.total_questions_all_levels !== undefined) && (
                    <div className="bg-white p-4 rounded-lg shadow-sm">
                      <h4 className="font-medium text-gray-700 mb-2">Hierarchy Overview</h4>
                      <div className="space-y-1 text-sm">
                        {data.statistics.total_hierarchy_levels !== undefined && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Max Levels:</span>
                            <span className="font-semibold text-primary-600">{data.statistics.total_hierarchy_levels}</span>
                          </div>
                        )}
                        {data.statistics.total_nested_categories !== undefined && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Nested Categories:</span>
                            <span className="font-semibold text-primary-600">{data.statistics.total_nested_categories}</span>
                          </div>
                        )}
                        {data.statistics.total_questions_all_levels !== undefined && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Total Questions:</span>
                            <span className="font-semibold text-green-600">{data.statistics.total_questions_all_levels}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                {/* Content Distribution */}
                {data.statistics.content_distribution && (
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <h4 className="font-medium text-gray-700 mb-2">Content Distribution</h4>
                    <div className="space-y-1 text-sm">
                      {/* Course Level Stats */}
                      {data.statistics.content_distribution.categories_with_subcategories !== undefined && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">With Subcategories:</span>
                          <span className="font-semibold text-primary-600">{data.statistics.content_distribution.categories_with_subcategories}</span>
                        </div>
                      )}
                      {data.statistics.content_distribution.categories_with_questions !== undefined && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">With Questions:</span>
                          <span className="font-semibold text-green-600">{data.statistics.content_distribution.categories_with_questions}</span>
                        </div>
                      )}
                      {data.statistics.content_distribution.leaf_categories !== undefined && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Leaf Categories:</span>
                          <span className="font-semibold text-orange-600">{data.statistics.content_distribution.leaf_categories}</span>
                        </div>
                      )}

                      {/* Category Level Stats */}
                      {data.statistics.content_distribution.direct_questions !== undefined && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Direct Questions:</span>
                          <span className="font-semibold text-green-600">{data.statistics.content_distribution.direct_questions}</span>
                        </div>
                      )}
                      {data.statistics.content_distribution.nested_categories !== undefined && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Child Categories:</span>
                          <span className="font-semibold text-primary-600">{data.statistics.content_distribution.nested_categories}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Active vs Inactive */}
                {data.statistics.active_vs_inactive && (
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <h4 className="font-medium text-gray-700 mb-2">Active vs Inactive</h4>
                    <div className="space-y-2">
                      {/* Course Level Categories */}
                      {(data.statistics.active_vs_inactive.active_categories !== undefined ||
                        data.statistics.active_vs_inactive.inactive_categories !== undefined) && (
                          <div>
                            <div className="text-xs text-gray-500 mb-1">All Categories</div>
                            <div className="flex justify-between text-sm">
                              {data.statistics.active_vs_inactive.active_categories !== undefined && (
                                <span className="text-green-600">
                                  ✓ {data.statistics.active_vs_inactive.active_categories}
                                </span>
                              )}
                              {data.statistics.active_vs_inactive.inactive_categories !== undefined && (
                                <span className="text-red-600">
                                  ✗ {data.statistics.active_vs_inactive.inactive_categories}
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                      {/* Category Level Children */}
                      {(data.statistics.active_vs_inactive.active_children !== undefined ||
                        data.statistics.active_vs_inactive.inactive_children !== undefined) && (
                          <div>
                            <div className="text-xs text-gray-500 mb-1">Child Categories</div>
                            <div className="flex justify-between text-sm">
                              {data.statistics.active_vs_inactive.active_children !== undefined && (
                                <span className="text-green-600">
                                  ✓ {data.statistics.active_vs_inactive.active_children}
                                </span>
                              )}
                              {data.statistics.active_vs_inactive.inactive_children !== undefined && (
                                <span className="text-red-600">
                                  ✗ {data.statistics.active_vs_inactive.inactive_children}
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      {(data.statistics.active_vs_inactive.active_questions !== undefined ||
                        data.statistics.active_vs_inactive.inactive_questions !== undefined) && (
                          <div>
                            <div className="text-xs text-gray-500 mb-1">Questions</div>
                            <div className="flex justify-between text-sm">
                              {data.statistics.active_vs_inactive.active_questions !== undefined && (
                                <span className="text-green-600">
                                  ✓ {data.statistics.active_vs_inactive.active_questions}
                                </span>
                              )}
                              {data.statistics.active_vs_inactive.inactive_questions !== undefined && (
                                <span className="text-red-600">
                                  ✗ {data.statistics.active_vs_inactive.inactive_questions}
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>

      {/* Create Category Modal */ }
  {
    showCategoryModal && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
          <h3 className="text-lg font-semibold mb-4">
            Create {isRootLevel ? 'Category' : 'Subcategory'}
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name *
              </label>
              <input
                type="text"
                value={categoryForm.name}
                onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Enter category name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              {/* <textarea
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Enter description (optional)"
                  rows={3}
                /> */}
              <RichTextEditor
                value={categoryForm.description}
                onChange={(value) => setCategoryForm({ ...categoryForm, description: value })}
              />
            </div>

            {/* Gujarati Fields */}
            <div className="pt-4 border-t border-gray-200">
              <h4 className="text-sm font-medium text-gray-800 mb-3">🌐 Gujarati Translation</h4>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name (Gujarati)
                  </label>
                  <input
                    type="text"
                    value={categoryForm.name_gujarati}
                    onChange={(e) => setCategoryForm({ ...categoryForm, name_gujarati: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="કેટેગરી નામ દાખલ કરો"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description (Gujarati)
                  </label>
                  {/* <textarea
                      value={categoryForm.description_gujarati}
                      onChange={(e) => setCategoryForm({ ...categoryForm, description_gujarati: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="વર્ણન દાખલ કરો (વૈકલ્પિક)"
                      rows={3}
                    /> */}
                  <RichTextEditor
                    value={categoryForm.description_gujarati}
                    onChange={(value) => setCategoryForm({ ...categoryForm, description_gujarati: value })}
                  />
                </div>
              </div>
            </div>

            {/* Negative Marking Configuration */}
            <div className="border-t pt-4">
              <h4 className="text-md font-medium text-gray-800 mb-3">⚖️ Negative Marking (For Question-Holder Categories)</h4>
              <div className="space-y-4">
                {shouldShowNegativeMarking() && (
                  <>
                    <div className="flex items-start">
                      <input
                        type="checkbox"
                        id="negative_marking_enabled"
                        checked={categoryForm.negative_marking_enabled}
                        onChange={(e) => setCategoryForm({ ...categoryForm, negative_marking_enabled: e.target.checked })}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded mt-1"
                      />
                      <div className="ml-3">
                        <label htmlFor="negative_marking_enabled" className="block text-sm font-medium text-gray-700">
                          Enable Negative Marking
                        </label>
                        <p className="text-xs text-gray-500 mt-1">
                          Deduct marks for incorrect answers in this category. Only applies to categories with questions.
                        </p>
                      </div>
                    </div>

                    {categoryForm.negative_marking_enabled && (
                      <div className="ml-7">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Negative Marks per Wrong Answer
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            step="0.25"
                            min="0"
                            max="1"
                            value={categoryForm.negative_marks_per_wrong}
                            onChange={(e) => setCategoryForm({ ...categoryForm, negative_marks_per_wrong: parseFloat(e.target.value) || 0.25 })}
                            className="w-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                            required={categoryForm.negative_marking_enabled}
                          />
                          <span className="text-sm text-gray-600">marks</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Common values: 0.25 (for 4-option MCQs), 0.33 (for 3-option MCQs)
                        </p>
                      </div>
                    )}
                  </>
                )}

                {!shouldShowNegativeMarking() && (
                  <div className="bg-primary-50 p-3 rounded-md border border-primary-200">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-primary-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-primary-700">
                          <strong>Negative marking is not available for this category.</strong><br />
                          Negative marking only applies to categories that directly contain questions.
                          This category contains subcategories or is empty, so negative marking is not applicable.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Test Timing Configuration */}
            <div className="border-t pt-4">
              <h4 className="text-md font-medium text-gray-800 mb-3">⏱️ Test Timing (For Question-Holder Categories)</h4>
              <div className="space-y-4">
                {shouldShowTestTiming() && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Test Duration (Minutes)
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        min="1"
                        max="600"
                        step="1"
                        value={categoryForm.test_duration_minutes}
                        onChange={(e) => setCategoryForm({ ...categoryForm, test_duration_minutes: parseInt(e.target.value) || 60 })}
                        className="w-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        required
                      />
                      <span className="text-sm text-gray-600">minutes</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Set the test duration for questions in this category (default: 60 minutes)
                    </p>
                  </div>
                )}

                {!shouldShowTestTiming() && (
                  <div className="bg-primary-50 p-3 rounded-md border border-primary-200">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-primary-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-primary-700">
                          <strong>Test timing is not available for this category.</strong><br />
                          Test timing only applies to categories that directly contain questions.
                          This category contains subcategories or is empty, so test timing is not applicable.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Free in Paid Series Configuration */}
            <div className="border-t pt-4">
              <h4 className="text-md font-medium text-gray-800 mb-3">💰 Free in Paid Series (For Question-Holder Categories)</h4>
              <div className="space-y-4">
                {shouldShowNegativeMarking() && (
                  <div className="flex items-start">
                    <input
                      type="checkbox"
                      id="is_free_in_paid_series"
                      checked={categoryForm.is_free_in_paid_series}
                      onChange={(e) => setCategoryForm({ ...categoryForm, is_free_in_paid_series: e.target.checked })}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded mt-1"
                    />
                    <div className="ml-3">
                      <label htmlFor="is_free_in_paid_series" className="block text-sm font-medium text-gray-700">
                        Mark as Free in Paid Series
                      </label>
                      <p className="text-xs text-gray-500 mt-1">
                        When enabled, this quiz category will be accessible for free even if the parent test series is paid.
                        Use this to offer sample/demo quizzes within paid test series.
                      </p>
                    </div>
                  </div>
                )}

                {!shouldShowNegativeMarking() && (
                  <div className="bg-primary-50 p-3 rounded-md border border-primary-200">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-primary-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-primary-700">
                          <strong>Free access option is not available for this category.</strong><br />
                          This setting only applies to categories that directly contain questions.
                          This category contains subcategories or is empty, so this option is not applicable.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Is Active Configuration */}
            {shouldShowNegativeMarking() && (
              <div className="border-t pt-4">
                <h4 className="text-md font-medium text-gray-800 mb-3">Active</h4>
                <div className="space-y-4">
                  <div className="flex items-start">
                    <input
                      type="checkbox"
                      id="is_active"
                      checked={categoryForm.is_active}
                      onChange={(e) => setCategoryForm({ ...categoryForm, is_active: e.target.checked })}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded mt-1"
                    />
                    <div className="ml-3">
                      <label htmlFor="is_active" className="block text-sm font-medium text-gray-700">
                        Active (test is available for use)
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={() => setShowCategoryModal(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              onClick={createCategory}
              disabled={categoryLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {categoryLoading && (
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {categoryLoading ? 'Creating...' : 'Create'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  {/* Create Question Modal */ }
  {
    showQuestionModal && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[95vh] overflow-y-auto">
          <h3 className="text-lg font-semibold mb-4">Create Question</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Question Text *
              </label>
              <RichTextEditor
                value={questionForm.question_text}
                onChange={(content) => setQuestionForm({ ...questionForm, question_text: content })}
                placeholder="Enter question text"
                height={250}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Option A *
                </label>
                <input
                  type="text"
                  value={questionForm.option_a}
                  onChange={(e) => setQuestionForm({ ...questionForm, option_a: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Option A"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Option B *
                </label>
                <input
                  type="text"
                  value={questionForm.option_b}
                  onChange={(e) => setQuestionForm({ ...questionForm, option_b: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Option B"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Option C *
                </label>
                <input
                  type="text"
                  value={questionForm.option_c}
                  onChange={(e) => setQuestionForm({ ...questionForm, option_c: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Option C"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Option D *
                </label>
                <input
                  type="text"
                  value={questionForm.option_d}
                  onChange={(e) => setQuestionForm({ ...questionForm, option_d: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Option D"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Correct Answer *
                </label>
                <select
                  value={questionForm.correct_answer}
                  onChange={(e) => setQuestionForm({ ...questionForm, correct_answer: e.target.value as 'A' | 'B' | 'C' | 'D' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="A">Option A</option>
                  <option value="B">Option B</option>
                  <option value="C">Option C</option>
                  <option value="D">Option D</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Marks
                </label>
                <input
                  type="number"
                  min="1"
                  value={questionForm.marks}
                  onChange={(e) => setQuestionForm({ ...questionForm, marks: parseInt(e.target.value) || 1 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="1"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Explanation
              </label>
              <RichTextEditor
                value={questionForm.explanation}
                onChange={(content) => setQuestionForm({ ...questionForm, explanation: content })}
                placeholder="Enter explanation (optional)"
                height={200}
              />
            </div>

            {/* Gujarati Fields */}
            <div className="pt-6 border-t border-gray-200">
              <h4 className="text-lg font-medium text-gray-800 mb-4">🌐 Gujarati Translation</h4>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Question Text (Gujarati)
                  </label>
                  <RichTextEditor
                    value={questionForm.question_text_gujarati}
                    onChange={(content) => setQuestionForm({ ...questionForm, question_text_gujarati: content })}
                    placeholder="પ્રશ્ન ટેક્સ્ટ દાખલ કરો"
                    height={250}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Option A (Gujarati)
                    </label>
                    <input
                      type="text"
                      value={questionForm.option_a_gujarati}
                      onChange={(e) => setQuestionForm({ ...questionForm, option_a_gujarati: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="વિકલ્પ A"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Option B (Gujarati)
                    </label>
                    <input
                      type="text"
                      value={questionForm.option_b_gujarati}
                      onChange={(e) => setQuestionForm({ ...questionForm, option_b_gujarati: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="વિકલ્પ B"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Option C (Gujarati)
                    </label>
                    <input
                      type="text"
                      value={questionForm.option_c_gujarati}
                      onChange={(e) => setQuestionForm({ ...questionForm, option_c_gujarati: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="વિકલ્પ C"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Option D (Gujarati)
                    </label>
                    <input
                      type="text"
                      value={questionForm.option_d_gujarati}
                      onChange={(e) => setQuestionForm({ ...questionForm, option_d_gujarati: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="વિકલ્પ D"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Explanation (Gujarati)
                  </label>
                  <RichTextEditor
                    value={questionForm.explanation_gujarati}
                    onChange={(content) => setQuestionForm({ ...questionForm, explanation_gujarati: content })}
                    placeholder="ગુજરાતીમાં સમજુતી દાખલ કરો (વૈકલ્પિક)..."
                    height={200}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={() => setShowQuestionModal(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              onClick={createQuestion}
              disabled={questionLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {questionLoading && (
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {questionLoading ? 'Creating...' : 'Create Question'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  {/* Edit Category Modal */ }
  {
    showEditCategoryModal && editingCategory && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Edit Category</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category Name *
              </label>
              <input
                type="text"
                value={categoryForm.name}
                onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Enter category name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              {/* <textarea
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Enter description"
                  rows={3}
                /> */}
              <RichTextEditor
                value={categoryForm.description}
                onChange={(content) => setCategoryForm({ ...categoryForm, description: content })}
              />
            </div>

            {/* Gujarati Fields */}
            <div className="pt-4 border-t border-gray-200">
              <h4 className="text-sm font-medium text-gray-800 mb-3">🌐 Gujarati Translation</h4>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category Name (Gujarati)
                  </label>
                  <input
                    type="text"
                    value={categoryForm.name_gujarati}
                    onChange={(e) => setCategoryForm({ ...categoryForm, name_gujarati: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="કેટેગરી નામ દાખલ કરો"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description (Gujarati)
                  </label>
                  {/* <textarea
                      value={categoryForm.description_gujarati}
                      onChange={(e) => setCategoryForm({ ...categoryForm, description_gujarati: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="વર્ણન દાખલ કરો"
                      rows={3}
                    /> */}
                  <RichTextEditor
                    value={categoryForm.description_gujarati}
                    onChange={(content) => setCategoryForm({ ...categoryForm, description_gujarati: content })}
                  />
                </div>
              </div>
            </div>

            {/* Negative Marking Configuration */}
            <div className="border-t pt-4">
              <h4 className="text-md font-medium text-gray-800 mb-3">⚖️ Negative Marking (For Question-Holder Categories)</h4>
              <div className="space-y-4">
                {shouldShowNegativeMarking() && (
                  <>
                    <div className="flex items-start">
                      <input
                        type="checkbox"
                        id="edit_negative_marking_enabled"
                        checked={categoryForm.negative_marking_enabled}
                        onChange={(e) => setCategoryForm({ ...categoryForm, negative_marking_enabled: e.target.checked })}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded mt-1"
                      />
                      <div className="ml-3">
                        <label htmlFor="edit_negative_marking_enabled" className="block text-sm font-medium text-gray-700">
                          Enable Negative Marking
                        </label>
                        <p className="text-xs text-gray-500 mt-1">
                          Deduct marks for incorrect answers in this category. Only applies to categories with questions.
                        </p>
                      </div>
                    </div>

                    {categoryForm.negative_marking_enabled && (
                      <div className="ml-7">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Negative Marks per Wrong Answer
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            step="0.25"
                            min="0"
                            max="1"
                            value={categoryForm.negative_marks_per_wrong}
                            onChange={(e) => setCategoryForm({ ...categoryForm, negative_marks_per_wrong: parseFloat(e.target.value) || 0.25 })}
                            className="w-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                            required={categoryForm.negative_marking_enabled}
                          />
                          <span className="text-sm text-gray-600">marks</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Common values: 0.25 (for 4-option MCQs), 0.33 (for 3-option MCQs)
                        </p>
                      </div>
                    )}
                  </>
                )}

                {!shouldShowNegativeMarking() && (
                  <div className="bg-primary-50 p-3 rounded-md border border-primary-200">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-primary-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-primary-700">
                          <strong>Negative marking is not available for this category.</strong><br />
                          Negative marking only applies to categories that directly contain questions.
                          This category contains subcategories or is empty, so negative marking is not applicable.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Test Timing Configuration */}
            <div className="border-t pt-4">
              <h4 className="text-md font-medium text-gray-800 mb-3">⏱️ Test Timing (For Question-Holder Categories)</h4>
              <div className="space-y-4">
                {shouldShowTestTiming() && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Test Duration (Minutes)
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        min="1"
                        max="600"
                        step="1"
                        value={categoryForm.test_duration_minutes}
                        onChange={(e) => setCategoryForm({ ...categoryForm, test_duration_minutes: parseInt(e.target.value) || 60 })}
                        className="w-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        required
                      />
                      <span className="text-sm text-gray-600">minutes</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Set the test duration for questions in this category (default: 60 minutes)
                    </p>
                  </div>
                )}

                {!shouldShowTestTiming() && (
                  <div className="bg-primary-50 p-3 rounded-md border border-primary-200">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-primary-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-primary-700">
                          <strong>Test timing is not available for this category.</strong><br />
                          Test timing only applies to categories that directly contain questions.
                          This category contains subcategories or is empty, so test timing is not applicable.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Free in Paid Series Configuration */}
            <div className="border-t pt-4">
              <h4 className="text-md font-medium text-gray-800 mb-3">💰 Free in Paid Series (For Question-Holder Categories)</h4>
              <div className="space-y-4">
                {shouldShowNegativeMarking() && (
                  <div className="flex items-start">
                    <input
                      type="checkbox"
                      id="edit_is_free_in_paid_series"
                      checked={categoryForm.is_free_in_paid_series}
                      onChange={(e) => setCategoryForm({ ...categoryForm, is_free_in_paid_series: e.target.checked })}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded mt-1"
                    />
                    <div className="ml-3">
                      <label htmlFor="edit_is_free_in_paid_series" className="block text-sm font-medium text-gray-700">
                        Mark as Free in Paid Series
                      </label>
                      <p className="text-xs text-gray-500 mt-1">
                        When enabled, this quiz category will be accessible for free even if the parent test series is paid.
                        Use this to offer sample/demo quizzes within paid test series.
                      </p>
                    </div>
                  </div>
                )}

                {!shouldShowNegativeMarking() && (
                  <div className="bg-primary-50 p-3 rounded-md border border-primary-200">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-primary-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-primary-700">
                          <strong>Free access option is not available for this category.</strong><br />
                          This setting only applies to categories that directly contain questions.
                          This category contains subcategories or is empty, so this option is not applicable.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Is Active Configuration */}
            {shouldShowNegativeMarking() && (
              <div className="border-t pt-4">
                <h4 className="text-md font-medium text-gray-800 mb-3">Active</h4>
                <div className="space-y-4">
                  <div className="flex items-start">
                    <input
                      type="checkbox"
                      id="is_active"
                      checked={categoryForm.is_active}
                      onChange={(e) => setCategoryForm({ ...categoryForm, is_active: e.target.checked })}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded mt-1"
                    />
                    <div className="ml-3">
                      <label htmlFor="is_active" className="block text-sm font-medium text-gray-700">
                        Active (test is available for use)
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={() => {
                setShowEditCategoryModal(false);
                setEditingCategory(null);
                setCategoryForm({
                  name: '',
                  description: '',
                  name_gujarati: '',
                  description_gujarati: '',
                  negative_marking_enabled: false,
                  negative_marks_per_wrong: 0.25,
                  test_duration_minutes: 60,
                  is_free_in_paid_series: false,
                  is_active: false,
                });
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              onClick={updateCategory}
              disabled={editCategoryLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {editCategoryLoading && (
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {editCategoryLoading ? 'Updating...' : 'Update Category'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  {/* Edit Question Modal */ }
  {
    showEditQuestionModal && editingQuestion && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[95vh] overflow-y-auto">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Edit Question</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Question Text *
              </label>
              <RichTextEditor
                value={questionForm.question_text}
                onChange={(content) => setQuestionForm({ ...questionForm, question_text: content })}
                placeholder="Enter question text"
                height={250}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Option A *
                </label>
                <input
                  type="text"
                  value={questionForm.option_a}
                  onChange={(e) => setQuestionForm({ ...questionForm, option_a: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Enter option A"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Option B *
                </label>
                <input
                  type="text"
                  value={questionForm.option_b}
                  onChange={(e) => setQuestionForm({ ...questionForm, option_b: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Enter option B"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Option C *
                </label>
                <input
                  type="text"
                  value={questionForm.option_c}
                  onChange={(e) => setQuestionForm({ ...questionForm, option_c: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Enter option C"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Option D *
                </label>
                <input
                  type="text"
                  value={questionForm.option_d}
                  onChange={(e) => setQuestionForm({ ...questionForm, option_d: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Enter option D"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Correct Answer *
                </label>
                <select
                  value={questionForm.correct_answer}
                  onChange={(e) => setQuestionForm({ ...questionForm, correct_answer: e.target.value as 'A' | 'B' | 'C' | 'D' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                  <option value="D">D</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Marks *
                </label>
                <input
                  type="number"
                  min="1"
                  value={questionForm.marks}
                  onChange={(e) => setQuestionForm({ ...questionForm, marks: parseInt(e.target.value) || 1 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Enter marks"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Explanation (Rich Text Editor)
              </label>
              <RichTextEditor
                value={questionForm.explanation}
                onChange={(content) => setQuestionForm({ ...questionForm, explanation: content })}
                placeholder="Enter explanation (optional)..."
                height={200}
              />
            </div>

            {/* Gujarati Fields */}
            <div className="pt-6 border-t border-gray-200">
              <h4 className="text-lg font-medium text-gray-800 mb-4">🌐 Gujarati Translation</h4>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Question Text (Gujarati)
                  </label>
                  <RichTextEditor
                    value={questionForm.question_text_gujarati}
                    onChange={(content) => setQuestionForm({ ...questionForm, question_text_gujarati: content })}
                    placeholder="પ્રશ્ન ટેક્સ્ટ દાખલ કરો"
                    height={250}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Option A (Gujarati)
                    </label>
                    <input
                      type="text"
                      value={questionForm.option_a_gujarati}
                      onChange={(e) => setQuestionForm({ ...questionForm, option_a_gujarati: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="વિકલ્પ A"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Option B (Gujarati)
                    </label>
                    <input
                      type="text"
                      value={questionForm.option_b_gujarati}
                      onChange={(e) => setQuestionForm({ ...questionForm, option_b_gujarati: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="વિકલ્પ B"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Option C (Gujarati)
                    </label>
                    <input
                      type="text"
                      value={questionForm.option_c_gujarati}
                      onChange={(e) => setQuestionForm({ ...questionForm, option_c_gujarati: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="વિકલ્પ C"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Option D (Gujarati)
                    </label>
                    <input
                      type="text"
                      value={questionForm.option_d_gujarati}
                      onChange={(e) => setQuestionForm({ ...questionForm, option_d_gujarati: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="વિકલ્પ D"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Explanation (Gujarati)
                  </label>
                  <RichTextEditor
                    value={questionForm.explanation_gujarati}
                    onChange={(content) => setQuestionForm({ ...questionForm, explanation_gujarati: content })}
                    placeholder="ગુજરાતીમાં સમજુતી દાખલ કરો (વૈકલ્પિક)..."
                    height={200}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={() => {
                setShowEditQuestionModal(false);
                setEditingQuestion(null);
                setQuestionForm({
                  question_text: '',
                  option_a: '',
                  option_b: '',
                  option_c: '',
                  option_d: '',
                  correct_answer: 'A',
                  explanation: '',
                  marks: 1
                });
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              onClick={updateQuestion}
              disabled={editQuestionLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {editQuestionLoading && (
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {editQuestionLoading ? 'Updating...' : 'Update Question'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  {/* Bulk Category Actions Modal */ }
  {
    showBulkCategoryModal && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Bulk Actions for Categories ({selectedCategories.length})
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Action:
              </label>
              <select
                value={bulkAction}
                onChange={(e) => setBulkAction(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">Choose action...</option>
                <option value="delete">Delete Categories</option>
                <option value="activate">Activate Categories</option>
                <option value="deactivate">Deactivate Categories</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={() => {
                setShowBulkCategoryModal(false);
                setBulkAction('');
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              onClick={performBulkCategoryAction}
              disabled={!bulkAction}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Execute Action
            </button>
          </div>
        </div>
      </div>
    )
  }

  {/* Bulk Question Actions Modal */ }
  {
    showBulkQuestionModal && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Bulk Actions for Questions ({selectedQuestions.length})
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Action:
              </label>
              <select
                value={bulkAction}
                onChange={(e) => setBulkAction(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">Choose action...</option>
                <option value="delete">Delete Questions</option>
                <option value="activate">Activate Questions</option>
                <option value="deactivate">Deactivate Questions</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={() => {
                setShowBulkQuestionModal(false);
                setBulkAction('');
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              onClick={performBulkQuestionAction}
              disabled={!bulkAction}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Execute Action
            </button>
          </div>
        </div>
      </div>
    )
  }

  {/* Confirmation Modal */ }
  <ConfirmModal
    isOpen={confirmModal.isOpen}
    onClose={closeConfirmModal}
    onConfirm={handleConfirmAction}
    title={getConfirmModalContent().title}
    message={getConfirmModalContent().message}
    confirmText="Delete"
    cancelText="Cancel"
    type="danger"
    loading={confirmModal.loading}
  />

  {/* Question Import Modal */ }
  <QuestionImportModal
    isOpen={showImportModal}
    onClose={() => setShowImportModal(false)}
    categoryId={currentCategory?.id || 0}
    categoryName={currentCategory?.name || data?.test_series?.name || 'Root Level'}
    onImportComplete={async () => {
      setShowImportModal(false);
      await fetchData();
    }}
  />

  {/* Constraint Rules Info */ }
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
      <h3 className="text-sm font-medium text-amber-800 mb-2">Hierarchy Rules:</h3>
      <ul className="text-xs text-amber-700 space-y-1">
        <li>• <strong>Course Level:</strong> Questions cannot be added directly - create categories first</li>
        <li>• <strong>Category Levels:</strong> Each level can contain EITHER categories OR questions, never both</li>
        <li>• Once you add a category, the "Add Question" button gets disabled</li>
        <li>• Once you add a question, the "Add Category" button gets disabled</li>
        <li>• Navigate into categories to create deeper hierarchies</li>
      </ul>
    </div>
  </div>
    </div >
  );
};

export default SimpleDynamicHierarchyPage;