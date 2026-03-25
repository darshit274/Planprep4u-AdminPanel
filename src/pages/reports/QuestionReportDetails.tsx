import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  BookOpen,
  Folder,
  ArrowRight,
  CheckCircle,
  Download,
  Edit,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { reportsService } from '../../services/reports';
import { ReportCard } from '../../components/reports/ReportCard';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { QuestionReportsDetailResponse } from '../../types/reports';
import { ConfirmModal } from '../../components/modals/ConfirmModal';
import { QuestionModal } from '../../components/modals/QuestionModal';

export const QuestionReportDetails: React.FC = () => {
  const { questionId } = useParams<{ questionId: string }>();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [detailsData, setDetailsData] = useState<QuestionReportsDetailResponse | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('latest');
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    action: string;
    title: string;
    message: string;
  }>({
    isOpen: false,
    action: '',
    title: '',
    message: '',
  });
  const [questionModal, setQuestionModal] = useState<{
    isOpen: boolean;
  }>({
    isOpen: false,
  });

  useEffect(() => {
    if (questionId) {
      fetchQuestionReports();
    }
  }, [questionId, statusFilter, sortBy]);

  const fetchQuestionReports = async () => {
    try {
      setIsLoading(true);
      const response = await reportsService.getQuestionReports(
        parseInt(questionId!),
        {
          status: statusFilter !== 'all' ? statusFilter : undefined,
          sortBy,
        }
      );

      if (response.success) {
        setDetailsData(response.data);
      } else {
        toast.error(response.message || 'Failed to load question reports');
      }
    } catch (error: any) {
      console.error('Error fetching question reports:', error);
      toast.error(
        error.response?.data?.message || 'Failed to load question reports'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (
    reportUuid: string,
    status: string,
    notes: string
  ) => {
    try {
      const response = await reportsService.updateReportStatus(reportUuid, {
        status: status as any,
        adminNotes: notes,
      });

      if (response.success) {
        toast.success(`Report marked as ${status.replace('_', ' ')}`);
        fetchQuestionReports(); // Refresh data
      } else {
        toast.error(response.message || 'Failed to update report');
      }
    } catch (error: any) {
      console.error('Error updating report status:', error);
      toast.error(
        error.response?.data?.message || 'Failed to update report'
      );
    }
  };

  const handleSaveNote = async (reportUuid: string, notes: string) => {
    try {
      const report = detailsData?.reports.find((r) => r.uuid === reportUuid);
      if (!report) return;

      const response = await reportsService.updateReportStatus(reportUuid, {
        status: report.status,
        adminNotes: notes,
      });

      if (response.success) {
        toast.success('Admin notes saved');
        fetchQuestionReports(); // Refresh data
      } else {
        toast.error(response.message || 'Failed to save notes');
      }
    } catch (error: any) {
      console.error('Error saving admin notes:', error);
      toast.error(error.response?.data?.message || 'Failed to save notes');
    }
  };

  const handleBulkActionClick = (action: string) => {
    const actionTitles = {
      resolve_all: 'Mark All as Resolved',
      reject_all: 'Mark All as Rejected',
      mark_under_review: 'Mark All as Under Review',
    };

    const actionMessages = {
      resolve_all: 'Are you sure you want to mark all reports as resolved?',
      reject_all: 'Are you sure you want to mark all reports as rejected?',
      mark_under_review: 'Are you sure you want to mark all reports as under review?',
    };

    setConfirmModal({
      isOpen: true,
      action,
      title: actionTitles[action as keyof typeof actionTitles],
      message: actionMessages[action as keyof typeof actionMessages] +
        (statusFilter !== 'all' ? ` Only ${statusFilter} reports will be affected.` : ' All reports will be affected.'),
    });
  };

  const handleBulkAction = async () => {
    const { action } = confirmModal;
    setConfirmModal({ ...confirmModal, isOpen: false });

    try {
      const response = await reportsService.bulkUpdateReports(
        parseInt(questionId!),
        {
          action: action as any,
          filterStatus: statusFilter !== 'all' ? (statusFilter as any) : undefined,
        }
      );

      if (response.success) {
        toast.success(
          `${response.data.updatedCount} report(s) updated successfully`
        );
        fetchQuestionReports(); // Refresh data
      } else {
        toast.error(response.message || 'Failed to update reports');
      }
    } catch (error: any) {
      console.error('Error performing bulk action:', error);
      toast.error(
        error.response?.data?.message || 'Failed to update reports'
      );
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner text="Loading question reports..." />
      </div>
    );
  }

  if (!detailsData) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <p className="text-gray-500">Question not found</p>
          <button
            onClick={() => navigate('/reports')}
            className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Back to Reports
          </button>
        </div>
      </div>
    );
  }

  const { question, reports, summary } = detailsData;

  return (
    <div className="space-y-6">
      {/* Breadcrumb & Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/reports')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Reports Dashboard
        </button>

        <h1 className="text-2xl font-bold text-gray-900">
          Question Report Details
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Viewing all reports for Question #{question.id}
        </p>
      </div>

      {/* Location Card */}
      {(question.testSeries || (question.hierarchyPath && question.hierarchyPath.length > 0)) && (
        <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
          <h3 className="font-medium text-primary-900 mb-2 flex items-center gap-2">
            <Folder className="h-4 w-4" />
            Location
          </h3>
          <div className="text-sm text-primary-800">
            {question.testSeries && (
              <div className="mb-1 flex items-center gap-2">
                <BookOpen className="h-4 w-4 flex-shrink-0" />
                <span>
                  Test Series: <strong>{question.testSeries.name}</strong>
                </span>
              </div>
            )}
            {question.hierarchyPath && question.hierarchyPath.length > 0 && (
              <div className="flex items-center gap-2 text-xs text-primary-700">
                <span>Path:</span>
                <span>
                  {question.hierarchyPath.map((item, index) => (
                    <span key={item.id}>
                      {item.name}
                      {index < question.hierarchyPath.length - 1 && ' → '}
                    </span>
                  ))}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Question Preview Card */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="font-semibold text-gray-900 mb-4 text-lg">
          ❓ Question Preview
        </h3>

        <div className="mb-4">
          <div
            className="text-gray-900 font-medium mb-3"
            dangerouslySetInnerHTML={{ __html: question.questionText }}
          />

          <div className="space-y-2">
            {Object.entries(question.options).map(([key, value]) => {
              const isCorrect = key === question.correctAnswer;
              return (
                <div
                  key={key}
                  className={`p-3 rounded-lg border-2 ${
                    isCorrect
                      ? 'bg-green-50 border-green-300'
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <span className="font-medium">{key})</span> {value}
                  {isCorrect && (
                    <span className="ml-2 text-green-600 font-bold">✓</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {question.explanation && (
          <div className="mt-4 p-4 bg-primary-50 rounded-lg border border-primary-200">
            <h4 className="font-medium text-gray-700 mb-2 text-sm">
              📖 Solution:
            </h4>
            <div
              className="text-gray-700 text-sm"
              dangerouslySetInnerHTML={{ __html: question.explanation }}
            />
          </div>
        )}

        <div className="flex gap-3 mt-4">
          <button
            onClick={() => setQuestionModal({ isOpen: true })}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2"
          >
            <Edit className="h-4 w-4" />
            Edit Question
          </button>
        </div>
      </div>

      {/* Report Summary */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="font-semibold text-gray-900 mb-4">
          📊 Report Summary ({summary.totalReports} Total)
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-yellow-50 rounded-lg border border-yellow-200">
            <div className="text-2xl font-bold text-yellow-800">
              {summary.statusBreakdown.pending}
            </div>
            <div className="text-sm text-yellow-600">Pending</div>
          </div>
          <div className="text-center p-3 bg-primary-50 rounded-lg border border-primary-200">
            <div className="text-2xl font-bold text-primary-800">
              {summary.statusBreakdown.under_review}
            </div>
            <div className="text-sm text-primary-600">Under Review</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
            <div className="text-2xl font-bold text-green-800">
              {summary.statusBreakdown.resolved}
            </div>
            <div className="text-sm text-green-600">Resolved</div>
          </div>
          <div className="text-center p-3 bg-red-50 rounded-lg border border-red-200">
            <div className="text-2xl font-bold text-red-800">
              {summary.statusBreakdown.rejected}
            </div>
            <div className="text-sm text-red-600">Rejected</div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
          <div className="text-center">
            <div className="text-lg font-semibold text-red-600">
              {summary.reportBreakdown.wrong_question}
            </div>
            <div className="text-xs text-gray-600">Wrong Question</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-orange-600">
              {summary.reportBreakdown.wrong_solution}
            </div>
            <div className="text-xs text-gray-600">Wrong Solution</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-primary-600">
              {summary.reportBreakdown.other}
            </div>
            <div className="text-xs text-gray-600">Other</div>
          </div>
        </div>
      </div>

      {/* Reports List */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">
            📋 Individual Reports ({reports.length})
          </h3>

          <div className="flex gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-sm border border-gray-300 rounded-lg px-3 py-1 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="under_review">Under Review</option>
              <option value="resolved">Resolved</option>
              <option value="rejected">Rejected</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="text-sm border border-gray-300 rounded-lg px-3 py-1 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="latest">Latest First</option>
              <option value="oldest">Oldest First</option>
              <option value="type">Group by Type</option>
            </select>
          </div>
        </div>

        <div className="space-y-4">
          {reports.length > 0 ? (
            reports.map((report) => (
              <ReportCard
                key={report.id}
                report={report}
                onStatusChange={handleStatusChange}
                onSaveNote={handleSaveNote}
              />
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              No reports found matching the current filters
            </div>
          )}
        </div>
      </div>

      {/* Bulk Actions */}
      {reports.length > 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-3 text-sm">
            Bulk Actions
          </h4>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => handleBulkActionClick('resolve_all')}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              <CheckCircle className="h-4 w-4" />
              Mark All as Resolved
            </button>
            <button
              onClick={() => handleBulkActionClick('reject_all')}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Mark All as Rejected
            </button>
            <button
              onClick={() => handleBulkActionClick('mark_under_review')}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Mark All as Under Review
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {statusFilter !== 'all'
              ? `Bulk actions will only affect ${statusFilter} reports`
              : 'Bulk actions will affect all reports for this question'}
          </p>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={handleBulkAction}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText="Confirm"
        cancelText="Cancel"
        type="warning"
      />

      <QuestionModal
        isOpen={questionModal.isOpen}
        onClose={() => setQuestionModal({ isOpen: false })}
        onSuccess={() => {
          fetchQuestionReports(); // Refresh the question data
          toast.success('Question updated successfully');
        }}
        question={{
          id: question.id,
          question_text: question.questionText,
          question_text_gujarati: question.questionTextGujarati || '',
          option_a: question.options.A,
          option_b: question.options.B,
          option_c: question.options.C,
          option_d: question.options.D,
          option_a_gujarati: question.optionsGujarati?.A || '',
          option_b_gujarati: question.optionsGujarati?.B || '',
          option_c_gujarati: question.optionsGujarati?.C || '',
          option_d_gujarati: question.optionsGujarati?.D || '',
          correct_answer: question.correctAnswer,
          explanation: question.explanation || '',
          explanation_gujarati: question.explanationGujarati || '',
          marks: question.marks,
          difficulty: question.difficulty || 'medium',
          subject: question.subject || '',
          topic: question.topic || '',
          negative_marks: question.negativeMarks || 0,
        }}
        mode="edit"
        simplified={true}
      />
    </div>
  );
};
