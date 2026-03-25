import React, { useState } from 'react';
import { Query } from '../../services/queries';
import {
  XMarkIcon,
  EnvelopeIcon,
  PhoneIcon,
  ClockIcon,
  UserIcon,
  CheckCircleIcon,
  EyeIcon,
  TrashIcon,
  ClipboardDocumentIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

interface QueryDetailModalProps {
  query: Query;
  onClose: () => void;
  onUpdate: (id: number, status: 'viewed' | 'solved', notes?: string) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}

const QueryDetailModal: React.FC<QueryDetailModalProps> = ({
  query,
  onClose,
  onUpdate,
  onDelete
}) => {
  const [adminNotes, setAdminNotes] = useState(query.admin_notes || '');
  const [isUpdating, setIsUpdating] = useState(false);

  const handleStatusUpdate = async (newStatus: 'viewed' | 'solved') => {
    setIsUpdating(true);
    try {
      await onUpdate(query.id, newStatus, adminNotes);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this query? This action cannot be undone.')) {
      await onDelete(query.id);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-200' },
      viewed: { bg: 'bg-primary-100', text: 'text-primary-800', border: 'border-primary-200' },
      solved: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200' }
    };
    return badges[status as keyof typeof badges] || badges.pending;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const badge = getStatusBadge(query.status);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-gray-900">Query #{query.id}</h2>
            <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${badge.bg} ${badge.text} ${badge.border}`}>
              {query.status.charAt(0).toUpperCase() + query.status.slice(1)}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Contact Information */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                  <UserIcon className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Full Name</p>
                  <p className="text-sm font-medium text-gray-900">{query.full_name}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <EnvelopeIcon className="w-5 h-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500">Email</p>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-900">{query.email}</p>
                    <button
                      onClick={() => copyToClipboard(query.email, 'Email')}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <ClipboardDocumentIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                  <PhoneIcon className="w-5 h-5 text-primary-600" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500">Mobile Number</p>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-900">{query.mobile_number}</p>
                    <button
                      onClick={() => copyToClipboard(query.mobile_number, 'Mobile')}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <ClipboardDocumentIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                  <ClockIcon className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Submitted</p>
                  <p className="text-sm font-medium text-gray-900">{formatDate(query.created_at)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Query Message */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Query Message</h3>
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                {query.query_message}
              </p>
            </div>
          </div>

          {/* Admin Notes */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Admin Notes</h3>
            <textarea
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="Add internal notes about this query..."
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
            />
            <p className="mt-1 text-xs text-gray-500">
              These notes are internal and will not be visible to the user.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            {query.status === 'pending' && (
              <button
                onClick={() => handleStatusUpdate('viewed')}
                disabled={isUpdating}
                className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <EyeIcon className="w-5 h-5" />
                Mark as Viewed
              </button>
            )}

            {(query.status === 'pending' || query.status === 'viewed') && (
              <button
                onClick={() => handleStatusUpdate('solved')}
                disabled={isUpdating}
                className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CheckCircleIcon className="w-5 h-5" />
                Mark as Solved
              </button>
            )}

            <button
              onClick={handleDelete}
              disabled={isUpdating}
              className="flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ml-auto"
            >
              <TrashIcon className="w-5 h-5" />
              Delete Query
            </button>
          </div>

          {/* Metadata */}
          <div className="bg-gray-50 rounded-lg p-4 border-t border-gray-200">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Query Metadata</h4>
            <div className="grid md:grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-gray-500">IP Address</p>
                <p className="text-gray-900 font-mono">{query.ip_address || 'N/A'}</p>
              </div>
              <div>
                <p className="text-gray-500">User Agent</p>
                <p className="text-gray-900 font-mono text-xs truncate" title={query.user_agent}>
                  {query.user_agent ? query.user_agent.substring(0, 50) + '...' : 'N/A'}
                </p>
              </div>
              {query.viewed_at && (
                <>
                  <div>
                    <p className="text-gray-500">Viewed At</p>
                    <p className="text-gray-900">{formatDate(query.viewed_at)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Viewed By</p>
                    <p className="text-gray-900">
                      {query.viewedByAdmin?.name || `Admin #${query.viewed_by}`}
                    </p>
                  </div>
                </>
              )}
              {query.solved_at && (
                <>
                  <div>
                    <p className="text-gray-500">Solved At</p>
                    <p className="text-gray-900">{formatDate(query.solved_at)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Solved By</p>
                    <p className="text-gray-900">
                      {query.solvedByAdmin?.name || `Admin #${query.solved_by}`}
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QueryDetailModal;
