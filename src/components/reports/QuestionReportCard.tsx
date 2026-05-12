import React, { useState } from 'react';
import {
  Eye,
  Pencil,
  CheckCircle,
  BookOpen,
  Folder,
  AlertCircle,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { QuestionWithReports } from '../../types/reports';
import { ConfirmModal } from '../modals/ConfirmModal';
import HTMLContent from '../common/HTMLContent';

interface QuestionReportCardProps {
  question: QuestionWithReports;
  onBulkResolve: (questionId: number) => void;
}

export const QuestionReportCard: React.FC<QuestionReportCardProps> = ({
  question,
  onBulkResolve,
}) => {
  const navigate = useNavigate();
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const urgencyColors = {
    high: 'border-red-500 bg-red-50',
    medium: 'border-yellow-500 bg-yellow-50',
    normal: 'border-gray-200 bg-white',
  };

  const urgencyBadgeColors = {
    high: 'bg-red-500 text-white',
    medium: 'bg-yellow-500 text-white',
    normal: 'bg-gray-300 text-gray-700',
  };

  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return 'just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const reportTypeLabels: Record<string, string> = {
    wrong_question: 'Wrong Question',
    wrong_solution: 'Wrong Solution',
    other: 'Other Issue',
  };

  return (
    <div
      className={`border-2 rounded-xl p-6 transition-all hover:shadow-md ${
        urgencyColors[question.urgencyLevel]
      }`}
    >
      {/* Urgency Badge */}
      {question.urgencyLevel !== 'normal' && (
        <div className="flex items-center gap-2 mb-3">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full ${
              urgencyBadgeColors[question.urgencyLevel]
            }`}
          >
            <AlertCircle className="h-3.5 w-3.5" />
            {question.urgencyLevel === 'high' ? 'URGENT' : 'MEDIUM PRIORITY'}: {question.totalReports} reports
          </span>
        </div>
      )}

      {/* Test Series & Hierarchy Path */}
      {(question.testSeries || question.hierarchyString) && (
        <div className="mb-3">
          {question.testSeries && (
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
              <BookOpen className="h-4 w-4 flex-shrink-0" />
              <span className="font-medium">{question.testSeries.name}</span>
            </div>
          )}
          {question.hierarchyString && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Folder className="h-4 w-4 flex-shrink-0" />
              <span className="truncate" title={question.hierarchyString || ''}>
                {question.hierarchyString}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Question Text */}
      <div className="mb-4">
        <h3 className="font-semibold text-gray-900 mb-2">
          Question #{question.questionId}
        </h3>
        <HTMLContent
          className="text-gray-700 line-clamp-2"
          content={question.questionText || '<p class="text-gray-400 italic">No question text available</p>'}
        />
        <p className="text-sm text-green-600 mt-1 font-medium">
          ✓ Correct Answer: {question.correctAnswer || 'N/A'}
        </p>
      </div>

      {/* Report Summary */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
        <h4 className="text-sm font-medium text-gray-700 mb-2">
          📊 Report Summary:
        </h4>
        <div className="flex flex-wrap gap-3 text-sm">
          {question.reportBreakdown.wrong_question > 0 && (
            <span className="inline-flex items-center gap-1 text-red-600">
              <span className="font-semibold">
                {question.reportBreakdown.wrong_question}
              </span>
              <span>Wrong Question</span>
            </span>
          )}
          {question.reportBreakdown.wrong_solution > 0 && (
            <span className="inline-flex items-center gap-1 text-orange-600">
              <span className="font-semibold">
                {question.reportBreakdown.wrong_solution}
              </span>
              <span>Wrong Solution</span>
            </span>
          )}
          {question.reportBreakdown.other > 0 && (
            <span className="inline-flex items-center gap-1 text-primary-600">
              <span className="font-semibold">
                {question.reportBreakdown.other}
              </span>
              <span>Other</span>
            </span>
          )}
        </div>
      </div>

      {/* Latest Report Info */}
      <div className="mb-4 p-3 bg-white rounded-lg border border-gray-200">
        <div className="text-xs text-gray-500 mb-1">Latest Report:</div>
        <div className="text-sm">
          <span className="font-medium">{question.latestReport.userEmail}</span>
          <span className="text-gray-400"> • </span>
          <span className="text-gray-600">
            {reportTypeLabels[question.latestReport.reportType]}
          </span>
          <span className="text-gray-400"> • </span>
          <span className="text-gray-500">
            {formatTimeAgo(question.latestReport.createdAt)}
          </span>
        </div>
        {question.latestReport.reportText && (
          <p className="text-xs text-gray-600 mt-1 italic line-clamp-2">
            "{question.latestReport.reportText}"
          </p>
        )}
      </div>

      {/* Status Badge */}
      <div className="mb-4">
        <div className="flex flex-wrap gap-2 text-xs">
          {question.statusBreakdown.pending > 0 && (
            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full font-medium">
              {question.statusBreakdown.pending} Pending
            </span>
          )}
          {question.statusBreakdown.under_review > 0 && (
            <span className="px-2 py-1 bg-primary-100 text-primary-800 rounded-full font-medium">
              {question.statusBreakdown.under_review} Under Review
            </span>
          )}
          {question.statusBreakdown.resolved > 0 && (
            <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full font-medium">
              {question.statusBreakdown.resolved} Resolved
            </span>
          )}
          {question.statusBreakdown.rejected > 0 && (
            <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full font-medium">
              {question.statusBreakdown.rejected} Rejected
            </span>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => navigate(`/reports/question/${question.questionId}`)}
          className="flex-1 min-w-[200px] px-4 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center gap-2 font-medium"
        >
          <Eye className="h-4 w-4" />
          View All Reports ({question.totalReports})
        </button>

        <button
          onClick={() => {
            // Navigate to questions page where admin can search and edit
            navigate(`/questions`);
          }}
          className="px-4 py-2.5 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors flex items-center gap-2 font-medium"
        >
          <Pencil className="h-4 w-4" />
          Go to Questions
        </button>

        <button
          onClick={() => setShowConfirmModal(true)}
          className="px-4 py-2.5 border-2 border-green-600 text-green-600 rounded-lg hover:bg-green-50 transition-colors flex items-center gap-2 font-medium"
        >
          <CheckCircle className="h-4 w-4" />
          Mark Resolved
        </button>
      </div>

      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={() => {
          setShowConfirmModal(false);
          onBulkResolve(question.questionId);
        }}
        title="Mark All as Resolved"
        message={`Are you sure you want to mark all ${question.totalReports} pending report(s) for this question as resolved? This action will update the status of all reports.`}
        confirmText="Mark Resolved"
        cancelText="Cancel"
        type="info"
      />
    </div>
  );
};
