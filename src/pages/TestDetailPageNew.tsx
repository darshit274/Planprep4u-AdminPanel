import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ArrowLeftIcon,
  ChartBarIcon,
  CheckCircleIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import { toast } from "react-hot-toast";

// New centralized services and types
import { testManagementService } from "../services/test-management.service";
import { BulkOperationHelpers } from "../lib/api/base-service";
import type {
  Question,
  QuestionFormData,
  Test,
} from "../types/test-management";

// New reusable components
import { DataTable, Column } from "../components/common/DataTable/DataTable";
import { SearchFilters } from "../components/common/SearchFilters";
import { BulkActionsBar } from "../components/common/BulkActionsBar";
import { ConfirmModal } from "../components/modals/ConfirmModal";
import { Pagination } from "../components/common/Pagination";

// New custom hooks
import { usePagination } from "../hooks/usePagination";
import { useBulkSelection } from "../hooks/useBulkSelection";
import { useConfirmModal } from "../hooks/useConfirmModal";

const TestDetailPageNew: React.FC = () => {
  const { testUuid } = useParams<{ testUuid: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // State management using custom hooks
  const {
    filters,
    handleSearch,
    handlePageChange,
    handleLimitChange,
    handleStatusChange,
  } = usePagination();
  const {
    confirmModal,
    openConfirmModal,
    closeConfirmModal,
    setConfirmModalLoading,
  } = useConfirmModal<Question>();

  // Form state for create/edit modal
  const [showModal, setShowModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [formData, setFormData] = useState<QuestionFormData>({
    question_text: "",
    option_a: "",
    option_b: "",
    option_c: "",
    option_d: "",
    correct_answer: "A",
    explanation: "",
    marks: 1,
    question_text_gujarati: "",
    option_a_gujarati: "",
    option_b_gujarati: "",
    option_c_gujarati: "",
    option_d_gujarati: "",
    explanation_gujarati: "",
    is_active: true,
  });

  // Data fetching using new service
  const { data, isLoading, error } = useQuery({
    queryKey: ["questions", testUuid, filters],
    queryFn: () => testManagementService.questions.list(testUuid!, filters),
    enabled: !!testUuid,
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
    items: data?.questions || [],
    getItemId: (item) => item.uuid,
  });

  // Mutations using new service
  const createMutation = useMutation({
    mutationFn: (questionData: QuestionFormData) =>
      testManagementService.questions.create(testUuid!, questionData),
    onSuccess: () => {
      toast.success("Question created successfully");
      queryClient.invalidateQueries({ queryKey: ["questions", testUuid] });
      setShowModal(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create question");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ uuid, data }: { uuid: string; data: QuestionFormData }) =>
      testManagementService.questions.update(uuid, data),
    onSuccess: () => {
      toast.success("Question updated successfully");
      queryClient.invalidateQueries({ queryKey: ["questions", testUuid] });
      setShowModal(false);
      setEditingQuestion(null);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update question");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: testManagementService.questions.delete,
    onSuccess: () => {
      toast.success("Question deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["questions", testUuid] });
      closeConfirmModal();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete question");
      setConfirmModalLoading(false);
    },
  });

  const bulkMutation = useMutation({
    mutationFn: testManagementService.questions.bulkOperations,
    onSuccess: (result) => {
      const { action, processedCount } = result;
      toast.success(`${processedCount} questions ${action}d successfully`);
      queryClient.invalidateQueries({ queryKey: ["questions", testUuid] });
      clearSelection();
      closeConfirmModal();
    },
    onError: (error: any) => {
      toast.error(error.message || "Bulk operation failed");
      setConfirmModalLoading(false);
    },
  });

  // Event handlers
  const resetForm = () => {
    setFormData({
      question_text: "",
      option_a: "",
      option_b: "",
      option_c: "",
      option_d: "",
      correct_answer: "A",
      explanation: "",
      marks: 1,
      question_text_gujarati: "",
      option_a_gujarati: "",
      option_b_gujarati: "",
      option_c_gujarati: "",
      option_d_gujarati: "",
      explanation_gujarati: "",
      is_active: true,
    });
  };

  const handleCreate = () => {
    setEditingQuestion(null);
    resetForm();
    setShowModal(true);
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
      question_text_gujarati: question.question_text_gujarati || "",
      option_a_gujarati: question.option_a_gujarati || "",
      option_b_gujarati: question.option_b_gujarati || "",
      option_c_gujarati: question.option_c_gujarati || "",
      option_d_gujarati: question.option_d_gujarati || "",
      explanation_gujarati: question.explanation_gujarati || "",
      is_active: question.is_active,
    });
    setShowModal(true);
  };

  const handleDelete = (question: Question) => {
    openConfirmModal(question, "delete");
  };

  const handleBulkAction = (action: "activate" | "deactivate" | "delete") => {
    if (selectedCount === 0) {
      toast.error("Please select at least one question");
      return;
    }
    openConfirmModal(null, `bulk_${action}`);
  };

  const handleConfirm = async () => {
    if (!confirmModal.item && !confirmModal.action.startsWith("bulk_")) return;

    setConfirmModalLoading(true);

    if (confirmModal.action === "delete" && confirmModal.item) {
      deleteMutation.mutate(confirmModal.item.uuid);
    } else if (confirmModal.action.startsWith("bulk_")) {
      const action = confirmModal.action.replace("bulk_", "") as
        | "activate"
        | "deactivate"
        | "delete";
      const params = BulkOperationHelpers.forQuestions(action, selectedIds);
      bulkMutation.mutate(params);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingQuestion) {
      updateMutation.mutate({ uuid: editingQuestion.uuid, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  // Helper function to get option styling
  const getOptionClass = (option: string, correctAnswer: string) => {
    return option === correctAnswer
      ? "text-green-600 font-medium"
      : "text-gray-700";
  };

  // Table configuration
  const columns: Column<Question>[] = [
    {
      key: "question_text",
      label: "Question",
      sortable: true,
      render: (item) => (
        <div className="max-w-md">
          <div className="font-medium text-gray-900 truncate">
            {item.question_text}
          </div>
          {item.question_text_gujarati && (
            <div className="text-sm text-gray-500 truncate">
              {item.question_text_gujarati}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "options",
      label: "Options",
      render: (item) => (
        <div className="space-y-1">
          <div
            className={`text-xs flex items-center gap-1 ${getOptionClass(
              "A",
              item.correct_answer
            )}`}
          >
            {item.correct_answer === "A" ? (
              <CheckCircleIcon className="h-3 w-3 text-green-600" />
            ) : (
              <XCircleIcon className="h-3 w-3 text-gray-400" />
            )}
            <span>A: {item.option_a}</span>
          </div>
          <div
            className={`text-xs flex items-center gap-1 ${getOptionClass(
              "B",
              item.correct_answer
            )}`}
          >
            {item.correct_answer === "B" ? (
              <CheckCircleIcon className="h-3 w-3 text-green-600" />
            ) : (
              <XCircleIcon className="h-3 w-3 text-gray-400" />
            )}
            <span>B: {item.option_b}</span>
          </div>
          <div
            className={`text-xs flex items-center gap-1 ${getOptionClass(
              "C",
              item.correct_answer
            )}`}
          >
            {item.correct_answer === "C" ? (
              <CheckCircleIcon className="h-3 w-3 text-green-600" />
            ) : (
              <XCircleIcon className="h-3 w-3 text-gray-400" />
            )}
            <span>C: {item.option_c}</span>
          </div>
          <div
            className={`text-xs flex items-center gap-1 ${getOptionClass(
              "D",
              item.correct_answer
            )}`}
          >
            {item.correct_answer === "D" ? (
              <CheckCircleIcon className="h-3 w-3 text-green-600" />
            ) : (
              <XCircleIcon className="h-3 w-3 text-gray-400" />
            )}
            <span>D: {item.option_d}</span>
          </div>
        </div>
      ),
    },
    {
      key: "correct_answer",
      label: "Correct",
      sortable: true,
      render: (item) => (
        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
          {item.correct_answer}
        </span>
      ),
    },
    {
      key: "marks",
      label: "Marks",
      sortable: true,
      render: (item) => (
        <span className="text-gray-900 font-medium">{item.marks}</span>
      ),
    },
    {
      key: "is_active",
      label: "Status",
      sortable: true,
      render: (item) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            item.is_active
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {item.is_active ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      key: "explanation",
      label: "Explanation",
      render: (item) => (
        <div className="max-w-xs">
          {item.explanation ? (
            <div className="text-sm text-gray-600 truncate">
              {item.explanation}
            </div>
          ) : (
            <span className="text-gray-400 text-sm">No explanation</span>
          )}
        </div>
      ),
    },
  ];

  // Filter configuration
  const searchFilters = [
    {
      key: "status",
      label: "Status",
      type: "select" as const,
      value: filters.status || "all",
      options: [
        { label: "Active", value: "active" },
        { label: "Inactive", value: "inactive" },
      ],
    },
  ];

  // Bulk actions configuration
  const bulkActions = [
    {
      label: "Activate",
      icon: <PlusIcon className="h-4 w-4" />,
      onClick: () => handleBulkAction("activate"),
      variant: "success" as const,
    },
    {
      label: "Deactivate",
      icon: <PlusIcon className="h-4 w-4" />,
      onClick: () => handleBulkAction("deactivate"),
      variant: "warning" as const,
    },
    {
      label: "Delete",
      icon: <TrashIcon className="h-4 w-4" />,
      onClick: () => handleBulkAction("delete"),
      variant: "danger" as const,
    },
  ];

  // Render actions for each row
  const renderActions = (item: Question) => (
    <div className="flex gap-2">
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
    if (confirmModal.action === "delete" && confirmModal.item) {
      return {
        title: "Delete Question",
        message: `Are you sure you want to delete this question? This action cannot be undone.`,
      };
    } else if (confirmModal.action === "bulk_delete") {
      return {
        title: "Delete Questions",
        message: `Are you sure you want to delete ${selectedCount} questions? This action cannot be undone.`,
      };
    } else if (confirmModal.action === "bulk_activate") {
      return {
        title: "Activate Questions",
        message: `Are you sure you want to activate ${selectedCount} questions?`,
      };
    } else if (confirmModal.action === "bulk_deactivate") {
      return {
        title: "Deactivate Questions",
        message: `Are you sure you want to deactivate ${selectedCount} questions?`,
      };
    }
    return { title: "", message: "" };
  };

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">Error loading questions</div>
        <button
          onClick={() =>
            queryClient.invalidateQueries({ queryKey: ["questions", testUuid] })
          }
          className="text-primary-600 hover:text-primary-800"
        >
          Try again
        </button>
      </div>
    );
  }

  const test = data?.test;
  const questions = data?.questions || [];
  const stats = data?.stats;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center space-x-2 text-sm">
        <Link
          to="/test-management"
          className="text-primary-600 hover:text-primary-800"
        >
          Test Management
        </Link>
        <span className="text-gray-400">/</span>
        <button
          onClick={() => navigate(-1)}
          className="text-primary-600 hover:text-primary-800"
        >
          Tests
        </button>
        <span className="text-gray-400">/</span>
        <span className="text-gray-600">{test?.title}</span>
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
              {test?.title} - Questions
            </h1>
            <p className="text-gray-600 mt-1">{test?.description}</p>
            {test && (
              <div className="flex gap-4 text-sm text-gray-500 mt-1">
                <span>Duration: {test.duration_minutes} min</span>
                <span>Total Marks: {test.total_marks}</span>
                <span>Questions: {stats?.total || 0}</span>
                {stats && (
                  <>
                    <span>Active: {stats.active}</span>
                    <span>Total Marks Available: {stats.totalMarks}</span>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
        <button
          onClick={handleCreate}
          className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 flex items-center gap-2"
        >
          <PlusIcon className="h-5 w-5" />
          Add Question
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
                <p className="text-sm font-medium text-gray-600">
                  Total Questions
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats.total}
                </p>
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
                <p className="text-2xl font-semibold text-gray-900">
                  {stats.active}
                </p>
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
                <p className="text-2xl font-semibold text-gray-900">
                  {stats.inactive}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-primary-100 rounded-lg">
                <ChartBarIcon className="h-6 w-6 text-primary-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Marks</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats.totalMarks}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Data Table with all components */}
      <div className="bg-white rounded-lg shadow">
        {/* Search and Filters */}
        <SearchFilters
          searchValue={filters.search || ""}
          onSearchChange={handleSearch}
          filters={searchFilters}
          onFilterChange={(key, value) => {
            if (key === "status") handleStatusChange(value as any);
          }}
          onClearFilters={() => {
            handleSearch("");
            handleStatusChange("all");
          }}
        />

        {/* Bulk Actions Bar */}
        <BulkActionsBar
          selectedCount={selectedCount}
          totalCount={questions.length}
          actions={bulkActions}
          onClearSelection={clearSelection}
        />

        {/* Data Table */}
        <DataTable
          data={questions}
          columns={columns}
          loading={isLoading}
          emptyMessage="No questions found"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div style={{ maxHeight: "90vh" }}>
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl m-4">
              <h2 className="text-xl font-semibold mb-4">
                {editingQuestion ? "Edit Question" : "Add Question"}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Question Text *
                  </label>
                  <textarea
                    value={formData.question_text}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        question_text: e.target.value,
                      })
                    }
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
                      onChange={(e) =>
                        setFormData({ ...formData, option_a: e.target.value })
                      }
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
                      onChange={(e) =>
                        setFormData({ ...formData, option_b: e.target.value })
                      }
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
                      onChange={(e) =>
                        setFormData({ ...formData, option_c: e.target.value })
                      }
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
                      onChange={(e) =>
                        setFormData({ ...formData, option_d: e.target.value })
                      }
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
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          correct_answer: e.target.value as
                            | "A"
                            | "B"
                            | "C"
                            | "D",
                        })
                      }
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
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          marks: parseInt(e.target.value) || 1,
                        })
                      }
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
                    onChange={(e) =>
                      setFormData({ ...formData, explanation: e.target.value })
                    }
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Optional explanation for the correct answer"
                  />
                </div>

                {/* Gujarati Fields */}
                <div className="border-t pt-4">
                  <h3 className="text-md font-medium text-gray-800 mb-3">
                    Gujarati Translation
                  </h3>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Question Text (Gujarati)
                    </label>
                    <textarea
                      value={formData.question_text_gujarati}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          question_text_gujarati: e.target.value,
                        })
                      }
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
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            option_a_gujarati: e.target.value,
                          })
                        }
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
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            option_b_gujarati: e.target.value,
                          })
                        }
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
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            option_c_gujarati: e.target.value,
                          })
                        }
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
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            option_d_gujarati: e.target.value,
                          })
                        }
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
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          explanation_gujarati: e.target.value,
                        })
                      }
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
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          is_active: e.target.checked,
                        })
                      }
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label
                      htmlFor="is_active"
                      className="ml-2 block text-sm text-gray-700"
                    >
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
                      resetForm();
                    }}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={
                      createMutation.isPending || updateMutation.isPending
                    }
                    className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50"
                  >
                    {createMutation.isPending || updateMutation.isPending
                      ? "Saving..."
                      : "Save"}
                  </button>
                </div>
              </form>
            </div>
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
        confirmText={
          confirmModal.action.includes("delete")
            ? "Delete"
            : confirmModal.action.includes("activate")
            ? "Activate"
            : "Deactivate"
        }
        type={confirmModal.action.includes("delete") ? "danger" : "warning"}
        loading={confirmModal.loading}
      />
    </div>
  );
};

export default TestDetailPageNew;
