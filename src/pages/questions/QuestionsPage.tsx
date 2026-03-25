import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash2, Upload, Filter, Download, CheckSquare, Square, MoreHorizontal } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';
import { CardSkeleton } from '../../components/common/LoadingSpinner';
import { ApiError, ErrorBoundary } from '../../components/common/ErrorBoundary';
import { QuestionModal } from '../../components/modals/QuestionModal';
import { ConfirmModal } from '../../components/modals/ConfirmModal';
import QuestionImportModal from '../../components/modals/QuestionImportModal';
import api from '../../services/api';
import toast from 'react-hot-toast';

const questionsService = {
  getQuestions: async (params: any) => {
    const queryParams = new URLSearchParams(params);
    const response = await api.get(`/admin/questions?${queryParams}`);
    return { data: response.data };
  },

  getQuestionsStats: async () => {
    const response = await api.get('/admin/questions/stats');
    return { data: response.data };
  }
};

export const QuestionsPage: React.FC = () => {
  const location = useLocation();
  const testFilter = location.state as { testId?: string; testTitle?: string; testType?: string } | null;
  
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [difficulty, setDifficulty] = useState('');
  const [subject, setSubject] = useState('');
  const [testId, setTestId] = useState(testFilter?.testId || '');
  
  // Modal states
  const [questionModal, setQuestionModal] = useState({ isOpen: false, mode: 'create' as 'create' | 'edit', question: null as any });
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, question: null as any, loading: false });
  const [importModal, setImportModal] = useState({ isOpen: false, categoryId: null as number | null, categoryName: '' });
  
  // Bulk operations state
  const [selectedQuestions, setSelectedQuestions] = useState<Set<number>>(new Set());
  const [bulkAction, setBulkAction] = useState('');
  const [showBulkMenu, setShowBulkMenu] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);

  // Clear location state after reading it
  useEffect(() => {
    if (testFilter) {
      window.history.replaceState({}, document.title);
    }
  }, []);

  const { 
    data: questionsResponse, 
    loading, 
    error, 
    refresh 
  } = useApi(() => questionsService.getQuestions({
    page: currentPage,
    limit: pageSize,
    search: searchTerm,
    difficulty,
    subject,
    test_id: testId
  }));

  const { data: stats } = useApi(questionsService.getQuestionsStats);

  const questions = questionsResponse?.data?.data || [];
  const pagination = questionsResponse?.data?.pagination || { total: 0, page: 1, limit: 10, totalPages: 0 };

  const getDifficultyBadge = (difficulty: string) => {
    const colors = {
      easy: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      hard: 'bg-red-100 text-red-800'
    };
    return colors[difficulty as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  // CRUD handlers
  const handleAddQuestion = () => {
    setQuestionModal({ isOpen: true, mode: 'create', question: null });
  };

  const handleEditQuestion = (question: any) => {
    setQuestionModal({ isOpen: true, mode: 'edit', question });
  };

  const handleDeleteQuestion = (question: any) => {
    setConfirmModal({ isOpen: true, question, loading: false });
  };

  const handleConfirmDelete = async () => {
    try {
      setConfirmModal(prev => ({ ...prev, loading: true }));
      await api.delete(`/admin/questions/${confirmModal.question.id}`);
      toast.success('Question deleted successfully');
      refresh();
      setConfirmModal({ isOpen: false, question: null, loading: false });
    } catch (error: any) {
      console.error('Delete question error:', error);
      toast.error(error.response?.data?.message || 'Failed to delete question');
      setConfirmModal(prev => ({ ...prev, loading: false }));
    }
  };

  const handleModalSuccess = () => {
    refresh();
  };

  // Bulk operations handlers
  const handleSelectAll = () => {
    if (selectedQuestions.size === questions.length) {
      setSelectedQuestions(new Set());
    } else {
      setSelectedQuestions(new Set(questions.map((q: any) => q.id)));
    }
  };

  const handleSelectQuestion = (questionId: number) => {
    const newSelected = new Set(selectedQuestions);
    if (newSelected.has(questionId)) {
      newSelected.delete(questionId);
    } else {
      newSelected.add(questionId);
    }
    setSelectedQuestions(newSelected);
  };

  const handleBulkAction = async (action: string) => {
    if (selectedQuestions.size === 0) {
      toast.error('Please select questions first');
      return;
    }

    setBulkLoading(true);
    try {
      const questionIds = Array.from(selectedQuestions);
      
      switch (action) {
        case 'delete':
          await api.delete('/admin/questions/bulk', {
            data: { question_ids: questionIds }
          });
          toast.success(`${questionIds.length} questions deleted successfully`);
          break;
        case 'activate':
          await api.patch('/admin/questions/bulk-update', {
            question_ids: questionIds,
            is_active: true
          });
          toast.success(`${questionIds.length} questions activated`);
          break;
        case 'deactivate':
          await api.patch('/admin/questions/bulk-update', {
            question_ids: questionIds,
            is_active: false
          });
          toast.success(`${questionIds.length} questions deactivated`);
          break;
        case 'export':
          const response = await api.get('/admin/questions/export', {
            params: { question_ids: questionIds.join(',') },
            responseType: 'blob'
          });
          const url = window.URL.createObjectURL(new Blob([response.data]));
          const link = document.createElement('a');
          link.href = url;
          link.setAttribute('download', `questions_${Date.now()}.csv`);
          document.body.appendChild(link);
          link.click();
          link.remove();
          window.URL.revokeObjectURL(url);
          toast.success('Questions exported successfully');
          break;
      }
      
      setSelectedQuestions(new Set());
      refresh();
    } catch (error: any) {
      console.error('Bulk action error:', error);
      toast.error(error.response?.data?.message || 'Bulk action failed');
    } finally {
      setBulkLoading(false);
      setShowBulkMenu(false);
    }
  };

  const handleBulkImport = () => {
    // For now, open a simple category selection modal
    // In a real implementation, this would be more sophisticated
    const categoryId = parseInt(prompt('Enter Category ID for import:') || '0');
    const categoryName = prompt('Enter Category Name:') || 'Selected Category';
    
    if (categoryId > 0) {
      setImportModal({ 
        isOpen: true, 
        categoryId, 
        categoryName 
      });
    } else {
      toast.error('Please provide a valid category ID');
    }
  };

  if (error) {
    return <ApiError error={error} onRetry={refresh} />;
  }

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Question Bank</h1>
            <p className="text-gray-600">
              {testFilter?.testTitle 
                ? `Managing questions for ${testFilter.testTitle} (${testFilter.testType} test)`
                : 'Manage quiz questions and organize by subjects'}
            </p>
          </div>
          <div className="flex space-x-3">
            {selectedQuestions.size > 0 && (
              <div className="relative">
                <button
                  onClick={() => setShowBulkMenu(!showBulkMenu)}
                  className="btn-secondary inline-flex items-center"
                >
                  <MoreHorizontal className="h-4 w-4 mr-2" />
                  Bulk Actions ({selectedQuestions.size})
                </button>
                
                {showBulkMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-10">
                    <div className="py-1">
                      <button
                        onClick={() => handleBulkAction('activate')}
                        disabled={bulkLoading}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                      >
                        Activate Selected
                      </button>
                      <button
                        onClick={() => handleBulkAction('deactivate')}
                        disabled={bulkLoading}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                      >
                        Deactivate Selected
                      </button>
                      <button
                        onClick={() => handleBulkAction('export')}
                        disabled={bulkLoading}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                      >
                        Export Selected
                      </button>
                      <hr className="my-1" />
                      <button
                        onClick={() => handleBulkAction('delete')}
                        disabled={bulkLoading}
                        className="block px-4 py-2 text-sm text-red-700 hover:bg-red-50 w-full text-left"
                      >
                        Delete Selected
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            <button 
              onClick={handleBulkImport}
              disabled={bulkLoading}
              className="btn-secondary inline-flex items-center"
            >
              <Upload className="h-4 w-4 mr-2" />
              Bulk Import
            </button>
            
            <button 
              onClick={handleAddQuestion}
              className="btn-primary inline-flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Question
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="card p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-primary-100">
                <Edit className="h-6 w-6 text-primary-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Questions</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.data?.total_questions || 0}</p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100">
                <Plus className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Easy</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.data?.difficulty_stats?.find((d: any) => d.difficulty === 'easy')?.count || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-yellow-100">
                <Edit className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Medium</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.data?.difficulty_stats?.find((d: any) => d.difficulty === 'medium')?.count || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-red-100">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Hard</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.data?.difficulty_stats?.find((d: any) => d.difficulty === 'hard')?.count || 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="card p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Questions
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search questions..."
                  className="input-field pl-10"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Difficulty
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="input-field"
              >
                <option value="">All Difficulties</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subject
              </label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="input-field"
              >
                <option value="">All Subjects</option>
                <option value="Mathematics">Mathematics</option>
                <option value="Science">Science</option>
                <option value="English">English</option>
                <option value="History">History</option>
              </select>
            </div>

            <div className="flex gap-2">
              <button 
                onClick={refresh}
                className="btn-primary inline-flex items-center"
              >
                <Filter className="h-4 w-4 mr-2" />
                Apply Filters
              </button>
              
              {testId && (
                <button 
                  onClick={() => {
                    setTestId('');
                    refresh();
                  }}
                  className="btn-secondary inline-flex items-center"
                >
                  Clear Test Filter
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Questions List */}
        <div className="card">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {questions.length > 0 && (
                <button
                  onClick={handleSelectAll}
                  className="text-gray-400 hover:text-gray-600"
                  title={selectedQuestions.size === questions.length ? "Deselect All" : "Select All"}
                >
                  {selectedQuestions.size === questions.length ? (
                    <CheckSquare className="h-5 w-5" />
                  ) : (
                    <Square className="h-5 w-5" />
                  )}
                </button>
              )}
              <h3 className="text-lg font-medium text-gray-900">Questions</h3>
              {selectedQuestions.size > 0 && (
                <span className="text-sm text-gray-500">
                  ({selectedQuestions.size} selected)
                </span>
              )}
            </div>
            
            {questions.length > 0 && (
              <button
                onClick={() => handleBulkAction('export')}
                className="btn-secondary text-sm inline-flex items-center"
              >
                <Download className="h-4 w-4 mr-2" />
                Export All
              </button>
            )}
          </div>

          {loading ? (
            <div className="p-6 space-y-4">
              {Array.from({ length: pageSize }).map((_, index) => (
                <CardSkeleton key={index} />
              ))}
            </div>
          ) : questions.length === 0 ? (
            <div className="p-12 text-center">
              <Edit className="mx-auto h-24 w-24 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No questions found</h3>
              <p className="text-gray-600 mb-6">Create your first question to get started.</p>
              <button onClick={handleAddQuestion} className="btn-primary">
                <Plus className="h-4 w-4 mr-2" />
                Add Question
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {questions.map((question: any, index: number) => (
                <div key={question.id} className="p-6 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div className="flex items-start space-x-3">
                      <button
                        onClick={() => handleSelectQuestion(question.id)}
                        className="mt-1 text-gray-400 hover:text-gray-600"
                        title={selectedQuestions.has(question.id) ? "Deselect" : "Select"}
                      >
                        {selectedQuestions.has(question.id) ? (
                          <CheckSquare className="h-5 w-5" />
                        ) : (
                          <Square className="h-5 w-5" />
                        )}
                      </button>
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <span className="text-sm font-medium text-gray-500">
                            Q{((currentPage - 1) * pageSize) + index + 1}
                          </span>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getDifficultyBadge(question.difficulty)}`}>
                            {question.difficulty}
                          </span>
                          <span className="px-2 py-1 text-xs font-medium bg-primary-100 text-primary-800 rounded-full">
                            {question.subject}
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-2 mb-3">
                          <h4 className="text-lg font-medium text-gray-900">
                            {question.question_text || question.question_text_gujarati || 'No question text'}
                          </h4>
                          {/* Language indicator */}
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            question.question_text && question.question_text_gujarati ? 'bg-primary-100 text-primary-800' :
                            question.question_text ? 'bg-primary-100 text-primary-800' :
                            question.question_text_gujarati ? 'bg-orange-100 text-orange-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {question.question_text && question.question_text_gujarati ? 'Both' :
                             question.question_text ? 'English' :
                             question.question_text_gujarati ? 'Gujarati' : 'Unknown'}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="flex items-center">
                            <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium mr-2">A</span>
                            <span className="text-gray-700">{question.option_a || question.option_a_gujarati || 'No option A'}</span>
                          </div>
                          <div className="flex items-center">
                            <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium mr-2">B</span>
                            <span className="text-gray-700">{question.option_b || question.option_b_gujarati || 'No option B'}</span>
                          </div>
                          <div className="flex items-center">
                            <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium mr-2">C</span>
                            <span className="text-gray-700">{question.option_c || question.option_c_gujarati || 'No option C'}</span>
                          </div>
                          <div className="flex items-center">
                            <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium mr-2">D</span>
                            <span className="text-gray-700">{question.option_d || question.option_d_gujarati || 'No option D'}</span>
                          </div>
                        </div>

                        <div className="flex justify-between items-center mt-3">
                          {question.topic && (
                            <p className="text-sm text-gray-500">Topic: {question.topic}</p>
                          )}
                          <p className="text-sm text-green-600 font-medium">
                            <strong>Marks:</strong> {question.marks || 1}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="ml-6 flex space-x-2">
                      <button 
                        onClick={() => handleEditQuestion(question)}
                        className="text-green-600 hover:text-green-900"
                        title="Edit Question"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteQuestion(question)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete Question"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-700">
                  Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, pagination.total)} of {pagination.total} results
                </p>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 text-sm border rounded disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(Math.min(pagination.totalPages, currentPage + 1))}
                    disabled={currentPage === pagination.totalPages}
                    className="px-3 py-1 text-sm border rounded disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modals */}
        <QuestionModal
          isOpen={questionModal.isOpen}
          onClose={() => setQuestionModal({ isOpen: false, mode: 'create', question: null })}
          onSuccess={handleModalSuccess}
          question={questionModal.question}
          mode={questionModal.mode}
        />

        <ConfirmModal
          isOpen={confirmModal.isOpen}
          onClose={() => setConfirmModal({ isOpen: false, question: null, loading: false })}
          onConfirm={handleConfirmDelete}
          title="Delete Question"
          message={`Are you sure you want to delete this question? This action cannot be undone.`}
          confirmText="Delete"
          type="danger"
          loading={confirmModal.loading}
        />

        {importModal.categoryId && (
          <QuestionImportModal
            isOpen={importModal.isOpen}
            onClose={() => setImportModal({ isOpen: false, categoryId: null, categoryName: '' })}
            categoryId={importModal.categoryId}
            categoryName={importModal.categoryName}
            onImportComplete={() => {
              refresh();
              setImportModal({ isOpen: false, categoryId: null, categoryName: '' });
            }}
          />
        )}
      </div>
    </ErrorBoundary>
  );
};