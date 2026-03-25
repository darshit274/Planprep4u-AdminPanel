import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { PlusIcon, PencilIcon, TrashIcon, ArrowLeftIcon, CheckCircleIcon, XCircleIcon, MagnifyingGlassIcon, FunnelIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { ConfirmModal } from '../components/modals/ConfirmModal';

interface Test {
  id: number;
  uuid: string;
  title: string;
  description: string;
  duration_minutes: number;
  total_marks: number;
  sub_category_id: number;
}

interface Question {
  id: number;
  uuid: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: 'A' | 'B' | 'C' | 'D';
  explanation: string;
  marks: number;
  test_id: number;
  is_active: boolean;
  question_text_gujarati?: string;
  option_a_gujarati?: string;
  option_b_gujarati?: string;
  option_c_gujarati?: string;
  option_d_gujarati?: string;
  explanation_gujarati?: string;
}

// API functions
const apiBaseUrl = 'http://localhost:5004/api/admin';

const questionsApi = {
  getTestQuestions: async (testUuid: string, params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: string;
  }) => {
    const token = sessionStorage.getItem('admin_token');
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);
    
    const response = await fetch(`${apiBaseUrl}/test-management/tests/${testUuid}?${queryParams}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    return data.data;
  },

  createQuestion: async (testUuid: string, question: {
    question_text: string;
    option_a: string;
    option_b: string;
    option_c: string;
    option_d: string;
    correct_answer: string;
    explanation: string;
    marks: number;
    question_text_gujarati?: string;
    option_a_gujarati?: string;
    option_b_gujarati?: string;
    option_c_gujarati?: string;
    option_d_gujarati?: string;
    explanation_gujarati?: string;
    is_active?: boolean;
  }) => {
    const token = sessionStorage.getItem('admin_token');
    const response = await fetch(`${apiBaseUrl}/test-management/tests/${testUuid}/questions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(question)
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.message);
    return data.data;
  },

  updateQuestion: async (uuid: string, question: {
    question_text: string;
    option_a: string;
    option_b: string;
    option_c: string;
    option_d: string;
    correct_answer: string;
    explanation: string;
    marks: number;
    question_text_gujarati?: string;
    option_a_gujarati?: string;
    option_b_gujarati?: string;
    option_c_gujarati?: string;
    option_d_gujarati?: string;
    explanation_gujarati?: string;
    is_active?: boolean;
  }) => {
    const token = sessionStorage.getItem('admin_token');
    const response = await fetch(`${apiBaseUrl}/test-management/questions/${uuid}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(question)
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.message);
    return data.data;
  },

  deleteQuestion: async (uuid: string) => {
    const token = sessionStorage.getItem('admin_token');
    const response = await fetch(`${apiBaseUrl}/test-management/questions/${uuid}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.message);
  },

  bulkOperations: async (action: string, questionIds: string[]) => {
    const token = sessionStorage.getItem('admin_token');
    const response = await fetch(`${apiBaseUrl}/test-management/questions/bulk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ action, questionIds })
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.message);
    return data;
  }
};

const TestDetailPage: React.FC = () => {
  const { testUuid } = useParams<{ testUuid: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [showModal, setShowModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [formData, setFormData] = useState({
    question_text: '',
    option_a: '',
    option_b: '',
    option_c: '',
    option_d: '',
    correct_answer: 'A' as 'A' | 'B' | 'C' | 'D',
    explanation: '',
    marks: 1,
    question_text_gujarati: '',
    option_a_gujarati: '',
    option_b_gujarati: '',
    option_c_gujarati: '',
    option_d_gujarati: '',
    explanation_gujarati: '',
    is_active: true
  });
  
  // Pagination and filtering states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('DESC');
  const [showFilters, setShowFilters] = useState(false);
  
  // Bulk operations state
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  
  // Confirm modal state
  const [confirmModal, setConfirmModal] = useState({ 
    isOpen: false, 
    question: null as Question | null,
    action: null as string | null,
    loading: false 
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ['testQuestions', testUuid, currentPage, pageSize, searchTerm, statusFilter, sortBy, sortOrder],
    queryFn: () => questionsApi.getTestQuestions(testUuid!, {
      page: currentPage,
      limit: pageSize,
      search: searchTerm,
      status: statusFilter,
      sortBy,
      sortOrder
    }),
    enabled: !!testUuid
  });

  const createMutation = useMutation({
    mutationFn: (question: {
      question_text: string;
      option_a: string;
      option_b: string;
      option_c: string;
      option_d: string;
      correct_answer: string;
      explanation: string;
      marks: number;
      question_text_gujarati?: string;
      option_a_gujarati?: string;
      option_b_gujarati?: string;
      option_c_gujarati?: string;
      option_d_gujarati?: string;
      explanation_gujarati?: string;
      is_active?: boolean;
    }) => questionsApi.createQuestion(testUuid!, question),
    onSuccess: () => {
      toast.success('Question created successfully');
      queryClient.invalidateQueries({ queryKey: ['testQuestions', testUuid] });
      setShowModal(false);
      setFormData(resetFormData());
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create question');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ uuid, data }: { uuid: string; data: {
      question_text: string;
      option_a: string;
      option_b: string;
      option_c: string;
      option_d: string;
      correct_answer: string;
      explanation: string;
      marks: number;
      question_text_gujarati?: string;
      option_a_gujarati?: string;
      option_b_gujarati?: string;
      option_c_gujarati?: string;
      option_d_gujarati?: string;
      explanation_gujarati?: string;
      is_active?: boolean;
    }}) => questionsApi.updateQuestion(uuid, data),
    onSuccess: () => {
      toast.success('Question updated successfully');
      queryClient.invalidateQueries({ queryKey: ['testQuestions', testUuid] });
      setShowModal(false);
      setEditingQuestion(null);
      setFormData(resetFormData());
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update question');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: questionsApi.deleteQuestion,
    onSuccess: () => {
      toast.success('Question deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['testQuestions', testUuid] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete question');
    }
  });

  const bulkOperationsMutation = useMutation({
    mutationFn: ({ action, questionIds }: { action: string; questionIds: string[] }) => 
      questionsApi.bulkOperations(action, questionIds),
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: ['testQuestions', testUuid] });
      setSelectedQuestions([]);
      setShowBulkActions(false);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to perform bulk operation');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingQuestion) {
      updateMutation.mutate({ uuid: editingQuestion.uuid, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (question: Question) => {
    setEditingQuestion(question);
    setFormData({
      question_text: question.question_text,
      option_a: question.option_a,
      option_b: question.option_b,
      option_c: question.option_c,
      option_d: question.option_d,
      correct_answer: question.correct_answer,
      explanation: question.explanation,
      marks: question.marks,
      question_text_gujarati: question.question_text_gujarati || '',
      option_a_gujarati: question.option_a_gujarati || '',
      option_b_gujarati: question.option_b_gujarati || '',
      option_c_gujarati: question.option_c_gujarati || '',
      option_d_gujarati: question.option_d_gujarati || '',
      explanation_gujarati: question.explanation_gujarati || '',
      is_active: question.is_active
    });
    setShowModal(true);
  };

  const handleDelete = (question: Question) => {
    setConfirmModal({ isOpen: true, question, action: 'delete', loading: false });
  };

  const handleConfirmDelete = async () => {
    if (!confirmModal.question && !confirmModal.action) return;
    
    setConfirmModal(prev => ({ ...prev, loading: true }));
    
    if (confirmModal.action === 'delete' && confirmModal.question) {
      // Individual delete
      deleteMutation.mutate(confirmModal.question.uuid, {
        onSuccess: () => {
          setConfirmModal({ isOpen: false, question: null, action: null, loading: false });
        },
        onError: () => {
          setConfirmModal(prev => ({ ...prev, loading: false }));
        }
      });
    } else if (confirmModal.action && ['bulk_delete', 'bulk_activate', 'bulk_deactivate'].includes(confirmModal.action)) {
      // Bulk operations
      const action = confirmModal.action.replace('bulk_', '');
      bulkOperationsMutation.mutate({ action, questionIds: selectedQuestions }, {
        onSuccess: () => {
          setConfirmModal({ isOpen: false, question: null, action: null, loading: false });
        },
        onError: () => {
          setConfirmModal(prev => ({ ...prev, loading: false }));
        }
      });
    }
  };

  const handleSelectQuestion = (uuid: string) => {
    setSelectedQuestions(prev => 
      prev.includes(uuid) 
        ? prev.filter(id => id !== uuid)
        : [...prev, uuid]
    );
  };

  const handleSelectAll = () => {
    if (selectedQuestions.length === questions.length) {
      setSelectedQuestions([]);
    } else {
      setSelectedQuestions(questions.map(q => q.uuid));
    }
  };

  const handleBulkOperation = (action: string) => {
    if (selectedQuestions.length === 0) {
      toast.error('Please select at least one question');
      return;
    }

    setConfirmModal({ isOpen: true, question: null, action: `bulk_${action}`, loading: false });
  };

  const getOptionClass = (option: string, correctAnswer: string) => {
    return option === correctAnswer ? 'text-green-600 font-medium' : 'text-gray-700';
  };

  const getConfirmModalContent = () => {
    if (confirmModal.action === 'delete' && confirmModal.question) {
      return {
        title: 'Delete Question',
        message: `Are you sure you want to delete this question? This action cannot be undone.`
      };
    } else if (confirmModal.action === 'bulk_delete') {
      return {
        title: 'Delete Questions',
        message: `Are you sure you want to delete ${selectedQuestions.length} questions? This action cannot be undone.`
      };
    } else if (confirmModal.action === 'bulk_activate') {
      return {
        title: 'Activate Questions',
        message: `Are you sure you want to activate ${selectedQuestions.length} questions?`
      };
    } else if (confirmModal.action === 'bulk_deactivate') {
      return {
        title: 'Deactivate Questions',
        message: `Are you sure you want to deactivate ${selectedQuestions.length} questions?`
      };
    }
    return { title: 'Confirm Action', message: 'Are you sure you want to perform this action?' };
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
        <div className="text-red-600 mb-4">Error loading questions</div>
        <button
          onClick={() => queryClient.invalidateQueries({ queryKey: ['testQuestions', testUuid] })}
          className="text-primary-600 hover:text-primary-800"
        >
          Try again
        </button>
      </div>
    );
  }

  const { test, questions, pagination, stats } = data;
  
  const resetFormData = () => ({
    question_text: '',
    option_a: '',
    option_b: '',
    option_c: '',
    option_d: '',
    correct_answer: 'A' as 'A' | 'B' | 'C' | 'D',
    explanation: '',
    marks: 1,
    question_text_gujarati: '',
    option_a_gujarati: '',
    option_b_gujarati: '',
    option_c_gujarati: '',
    option_d_gujarati: '',
    explanation_gujarati: '',
    is_active: true
  });
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1); // Reset to first page when searching
  };
  
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };
  
  const totalPages = Math.ceil((pagination?.total || 0) / pageSize);
  
  const renderPagination = () => {
    if (!pagination || totalPages <= 1) return null;
    
    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return (
      <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
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
              <span className="font-medium">
                {Math.min(currentPage * pageSize, pagination.total)}
              </span>{' '}
              of <span className="font-medium">{pagination.total}</span> results
            </p>
          </div>
          <div>
            <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeftIcon className="h-5 w-5" />
              </button>
              {pages.map((page) => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                    page === currentPage
                      ? 'z-10 bg-primary-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600'
                      : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRightIcon className="h-5 w-5" />
              </button>
            </nav>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center space-x-2 text-sm">
        <Link to="/test-management" className="text-primary-600 hover:text-primary-800">
          Test Management
        </Link>
        <span className="text-gray-400">/</span>
        <button onClick={() => navigate(-1)} className="text-primary-600 hover:text-primary-800">
          Tests
        </button>
        <span className="text-gray-400">/</span>
        <span className="text-gray-600">{test.title}</span>
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
            <h1 className="text-2xl font-bold text-gray-900">{test.title} - Questions</h1>
            <p className="text-gray-600 mt-1">{test.description}</p>
            <div className="flex gap-4 text-sm text-gray-500 mt-1">
              <span>Duration: {test.duration_minutes} min</span>
              <span>Total Marks: {test.total_marks}</span>
              <span>Questions: {pagination?.total || 0}</span>
              {stats && (
                <>
                  <span>Active: {stats.active}</span>
                  <span>Total Marks: {stats.totalMarks}</span>
                </>
              )}
            </div>
          </div>
        </div>
        <button
          onClick={() => {
            setEditingQuestion(null);
            setFormData(resetFormData());
            setShowModal(true);
          }}
          className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 flex items-center gap-2"
        >
          <PlusIcon className="h-5 w-5" />
          Add Question
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search questions or explanations..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-primary-600 text-white px-3 py-1 rounded text-sm hover:bg-primary-700"
              >
                Search
              </button>
            </div>
          </form>

          {/* Filters Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            <FunnelIcon className="h-4 w-4" />
            Filters
          </button>

          {/* Page Size */}
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(parseInt(e.target.value));
              setCurrentPage(1);
            }}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value={5}>5 per page</option>
            <option value={10}>10 per page</option>
            <option value={20}>20 per page</option>
            <option value={50}>50 per page</option>
          </select>

          {/* Bulk Actions Toggle */}
          <button
            onClick={() => {
              setShowBulkActions(!showBulkActions);
              setSelectedQuestions([]);
            }}
            className={`px-4 py-2 rounded-md border ${
              showBulkActions 
                ? 'bg-primary-50 border-primary-300 text-primary-700' 
                : 'border-gray-300 hover:bg-gray-50'
            }`}
          >
            {showBulkActions ? 'Cancel Bulk' : 'Bulk Actions'}
          </button>
        </div>

        {/* Bulk Actions Bar */}
        {showBulkActions && (
          <div className="mt-4 p-3 bg-primary-50 border border-primary-200 rounded-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedQuestions.length === questions.length && questions.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="ml-2 text-sm">
                    Select All ({selectedQuestions.length} selected)
                  </span>
                </label>
              </div>
              
              {selectedQuestions.length > 0 && (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleBulkOperation('activate')}
                    disabled={bulkOperationsMutation.isPending}
                    className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50"
                  >
                    Activate
                  </button>
                  <button
                    onClick={() => handleBulkOperation('deactivate')}
                    disabled={bulkOperationsMutation.isPending}
                    className="px-3 py-1 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700 disabled:opacity-50"
                  >
                    Deactivate
                  </button>
                  <button
                    onClick={() => handleBulkOperation('delete')}
                    disabled={bulkOperationsMutation.isPending}
                    className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Expanded Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
                <select
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="created_at">Created Date</option>
                  <option value="updated_at">Updated Date</option>
                  <option value="marks">Marks</option>
                  <option value="question_text">Question Text</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Order</label>
                <select
                  value={sortOrder}
                  onChange={(e) => {
                    setSortOrder(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="DESC">Descending</option>
                  <option value="ASC">Ascending</option>
                </select>
              </div>
            </div>

            {/* Clear Filters */}
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setSortBy('created_at');
                  setSortOrder('DESC');
                  setCurrentPage(1);
                }}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Clear Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Questions List */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          {questions.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-500 mb-4">No questions found</div>
              <button
                onClick={() => setShowModal(true)}
                className="text-primary-600 hover:text-primary-800"
              >
                Create your first question
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {questions.map((question, index) => (
                <div key={question.uuid} className="border border-gray-200 rounded-lg p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex gap-2 items-center">
                      {showBulkActions && (
                        <input
                          type="checkbox"
                          checked={selectedQuestions.includes(question.uuid)}
                          onChange={() => handleSelectQuestion(question.uuid)}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                      )}
                      <span className="bg-primary-100 text-primary-800 text-xs px-2 py-1 rounded-full">
                        Q{index + 1}
                      </span>
                      <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                        {question.marks} mark{question.marks !== 1 ? 's' : ''}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        question.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {question.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(question)}
                        className="p-1 text-gray-600 hover:text-gray-800"
                        title="Edit"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(question)}
                        className="p-1 text-red-600 hover:text-red-800"
                        title="Delete"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <p className="text-gray-900 font-medium">{question.question_text}</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                    <div className={`p-3 rounded-md bg-gray-50 flex items-center gap-2 ${getOptionClass('A', question.correct_answer)}`}>
                      {question.correct_answer === 'A' ? (
                        <CheckCircleIcon className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircleIcon className="h-4 w-4 text-gray-400" />
                      )}
                      <span className="font-medium">A.</span> {question.option_a}
                    </div>
                    <div className={`p-3 rounded-md bg-gray-50 flex items-center gap-2 ${getOptionClass('B', question.correct_answer)}`}>
                      {question.correct_answer === 'B' ? (
                        <CheckCircleIcon className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircleIcon className="h-4 w-4 text-gray-400" />
                      )}
                      <span className="font-medium">B.</span> {question.option_b}
                    </div>
                    <div className={`p-3 rounded-md bg-gray-50 flex items-center gap-2 ${getOptionClass('C', question.correct_answer)}`}>
                      {question.correct_answer === 'C' ? (
                        <CheckCircleIcon className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircleIcon className="h-4 w-4 text-gray-400" />
                      )}
                      <span className="font-medium">C.</span> {question.option_c}
                    </div>
                    <div className={`p-3 rounded-md bg-gray-50 flex items-center gap-2 ${getOptionClass('D', question.correct_answer)}`}>
                      {question.correct_answer === 'D' ? (
                        <CheckCircleIcon className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircleIcon className="h-4 w-4 text-gray-400" />
                      )}
                      <span className="font-medium">D.</span> {question.option_d}
                    </div>
                  </div>
                  
                  {question.explanation && (
                    <div className="bg-primary-50 p-3 rounded-md">
                      <p className="text-sm text-primary-800">
                        <span className="font-medium">Explanation:</span> {question.explanation}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Pagination */}
        {renderPagination()}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl m-4">
            <h2 className="text-xl font-semibold mb-4">
              {editingQuestion ? 'Edit Question' : 'Add Question'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Question Text *
                </label>
                <textarea
                  value={formData.question_text}
                  onChange={(e) => setFormData({ ...formData, question_text: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Option A *
                  </label>
                  <input
                    type="text"
                    value={formData.option_a}
                    onChange={(e) => setFormData({ ...formData, option_a: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Option B *
                  </label>
                  <input
                    type="text"
                    value={formData.option_b}
                    onChange={(e) => setFormData({ ...formData, option_b: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Option C *
                  </label>
                  <input
                    type="text"
                    value={formData.option_c}
                    onChange={(e) => setFormData({ ...formData, option_c: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Option D *
                  </label>
                  <input
                    type="text"
                    value={formData.option_d}
                    onChange={(e) => setFormData({ ...formData, option_d: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Correct Answer *
                  </label>
                  <select
                    value={formData.correct_answer}
                    onChange={(e) => setFormData({ ...formData, correct_answer: e.target.value as 'A' | 'B' | 'C' | 'D' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  >
                    <option value="A">Option A</option>
                    <option value="B">Option B</option>
                    <option value="C">Option C</option>
                    <option value="D">Option D</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Marks *
                  </label>
                  <input
                    type="number"
                    value={formData.marks}
                    onChange={(e) => setFormData({ ...formData, marks: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    min="1"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Explanation
                </label>
                <textarea
                  value={formData.explanation}
                  onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Optional explanation for the correct answer"
                />
              </div>

              {/* Gujarati Fields */}
              <div className="border-t pt-4">
                <h3 className="text-md font-medium text-gray-800 mb-3">Gujarati Translation</h3>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Question Text (Gujarati)
                  </label>
                  <textarea
                    value={formData.question_text_gujarati}
                    onChange={(e) => setFormData({ ...formData, question_text_gujarati: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="ગુજરાતીમાં પ્રશ્ન"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Option A (Gujarati)
                    </label>
                    <input
                      type="text"
                      value={formData.option_a_gujarati}
                      onChange={(e) => setFormData({ ...formData, option_a_gujarati: e.target.value })}
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
                      value={formData.option_b_gujarati}
                      onChange={(e) => setFormData({ ...formData, option_b_gujarati: e.target.value })}
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
                      value={formData.option_c_gujarati}
                      onChange={(e) => setFormData({ ...formData, option_c_gujarati: e.target.value })}
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
                      value={formData.option_d_gujarati}
                      onChange={(e) => setFormData({ ...formData, option_d_gujarati: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="વિકલ્પ D"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Explanation (Gujarati)
                  </label>
                  <textarea
                    value={formData.explanation_gujarati}
                    onChange={(e) => setFormData({ ...formData, explanation_gujarati: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="ગુજરાતીમાં સમજૂતી"
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
                    Active (question is available for use)
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingQuestion(null);
                    setFormData(resetFormData());
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

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, question: null, action: null, loading: false })}
        onConfirm={handleConfirmDelete}
        title={getConfirmModalContent().title}
        message={getConfirmModalContent().message}
        confirmText={confirmModal.action?.includes('delete') ? 'Delete' : 'Confirm'}
        type="danger"
        loading={confirmModal.loading}
      />
    </div>
  );
};

export default TestDetailPage;