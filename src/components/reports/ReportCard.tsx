import React, { useState } from 'react';
import { QuestionReport } from '../../types/reports';

interface ReportCardProps {
  report: QuestionReport;
  onStatusChange: (reportUuid: string, status: string, notes: string) => void;
  onSaveNote: (reportUuid: string, notes: string) => void;
}

export const ReportCard: React.FC<ReportCardProps> = ({
  report,
  onStatusChange,
  onSaveNote,
}) => {
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [adminNotes, setAdminNotes] = useState(report.adminNotes || '');

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    under_review: 'bg-primary-100 text-primary-800 border-primary-300',
    resolved: 'bg-green-100 text-green-800 border-green-300',
    rejected: 'bg-red-100 text-red-800 border-red-300',
  };

  const reportTypeLabels: Record<string, string> = {
    wrong_question: 'Wrong Question',
    wrong_solution: 'Wrong Solution',
    other: 'Other Issue',
  };

  const formatDateTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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

  const handleSaveNote = () => {
    onSaveNote(report.uuid, adminNotes);
    setIsEditingNote(false);
  };

  const handleCancelEdit = () => {
    setAdminNotes(report.adminNotes || '');
    setIsEditingNote(false);
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-white hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="text-xs text-gray-500 mb-1">Report #{report.id}</div>
          <div className="flex items-center gap-2">
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium border ${
                statusColors[report.status]
              }`}
            >
              {report.status === 'pending' && '🔴 '}
              {report.status === 'under_review' && '🟡 '}
              {report.status === 'resolved' && '✅ '}
              {report.status === 'rejected' && '❌ '}
              {report.status.replace('_', ' ').toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      {/* User Info */}
      <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
        <div>
          <span className="text-gray-500">👤 User:</span>
          <span className="ml-2 font-medium">
            {report.user?.email || 'Unknown'}
          </span>
        </div>
        <div>
          <span className="text-gray-500">📅 Reported:</span>
          <span className="ml-2">{formatDateTime(report.createdAt)}</span>
          <span className="text-gray-400 ml-1">
            ({formatTimeAgo(report.createdAt)})
          </span>
        </div>
      </div>

      {/* Report Details */}
      <div className="mb-3 text-sm">
        <div className="mb-2">
          <span className="text-gray-500">🚩 Type:</span>
          <span className="ml-2 font-medium">
            {reportTypeLabels[report.reportType]}
          </span>
        </div>

        {report.userSelectedAnswer && (
          <div className="mb-2">
            <span className="text-gray-500">📝 User's Answer:</span>
            <span className="ml-2 font-medium">{report.userSelectedAnswer}</span>
          </div>
        )}

        {report.reportText && (
          <div className="mb-2">
            <span className="text-gray-500">💬 User Comment:</span>
            <div className="mt-1 p-2 bg-gray-50 rounded border border-gray-200 text-sm">
              {report.reportText}
            </div>
          </div>
        )}
      </div>

      {/* Admin Notes */}
      <div className="mb-3">
        <div className="text-sm text-gray-500 mb-1">📝 Admin Notes:</div>
        {isEditingNote ? (
          <div>
            <textarea
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              rows={3}
              placeholder="Add internal notes..."
            />
            <div className="flex gap-2 mt-2">
              <button
                onClick={handleSaveNote}
                className="px-3 py-1 bg-primary-600 text-white text-sm rounded hover:bg-primary-700 transition-colors"
              >
                Save Note
              </button>
              <button
                onClick={handleCancelEdit}
                className="px-3 py-1 border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div>
            {report.adminNotes ? (
              <div className="p-2 bg-primary-50 rounded border border-primary-200 text-sm">
                {report.adminNotes}
              </div>
            ) : (
              <div className="text-sm text-gray-400 italic">No notes added</div>
            )}
            <button
              onClick={() => setIsEditingNote(true)}
              className="text-sm text-primary-600 hover:underline mt-1"
            >
              {report.adminNotes ? 'Edit Note' : 'Add Note'}
            </button>
          </div>
        )}

        {report.reviewer && (
          <div className="text-xs text-gray-500 mt-2">
            👨‍💼 Reviewed by: {report.reviewer.email} on{' '}
            {formatDateTime(report.reviewedAt || '')}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        {report.status === 'pending' && (
          <>
            <button
              onClick={() => onStatusChange(report.uuid, 'under_review', adminNotes)}
              className="px-3 py-1.5 bg-primary-600 text-white text-sm rounded hover:bg-primary-700 transition-colors"
            >
              Mark as Under Review
            </button>
            <button
              onClick={() => onStatusChange(report.uuid, 'resolved', adminNotes)}
              className="px-3 py-1.5 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
            >
              Resolve
            </button>
            <button
              onClick={() => onStatusChange(report.uuid, 'rejected', adminNotes)}
              className="px-3 py-1.5 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
            >
              Reject
            </button>
          </>
        )}

        {report.status === 'under_review' && (
          <>
            <button
              onClick={() => onStatusChange(report.uuid, 'resolved', adminNotes)}
              className="px-3 py-1.5 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
            >
              Resolve
            </button>
            <button
              onClick={() => onStatusChange(report.uuid, 'rejected', adminNotes)}
              className="px-3 py-1.5 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
            >
              Reject
            </button>
          </>
        )}

        {(report.status === 'resolved' || report.status === 'rejected') && (
          <button
            onClick={() => onStatusChange(report.uuid, 'pending', adminNotes)}
            className="px-3 py-1.5 border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50 transition-colors"
          >
            Reopen
          </button>
        )}
      </div>
    </div>
  );
};
