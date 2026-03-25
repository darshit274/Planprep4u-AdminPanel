import React from 'react';
import { 
  Calendar, 
  Clock, 
  FileText, 
  Users, 
  Star, 
  Edit3, 
  Trash2, 
  Copy, 
  Eye, 
  BarChart3,
  GraduationCap,
  Award,
  MoreVertical,
  CheckCircle,
  XCircle,
  Globe,
  Target
} from 'lucide-react';
import { PYQ } from '../../services/pyqService';

interface PYQCardProps {
  pyq: PYQ;
  onEdit: (pyq: PYQ) => void;
  onDelete: (pyq: PYQ) => void;
  onDuplicate: (pyq: PYQ) => void;
  onToggleStatus: (pyq: PYQ) => void;
  onToggleFeatured: (pyq: PYQ) => void;
  onViewQuestions: (pyq: PYQ) => void;
  onViewAnalytics: (pyq: PYQ) => void;
  onPreview: (pyq: PYQ) => void;
}

export const PYQCard: React.FC<PYQCardProps> = ({
  pyq,
  onEdit,
  onDelete,
  onDuplicate,
  onToggleStatus,
  onToggleFeatured,
  onViewQuestions,
  onViewAnalytics,
  onPreview
}) => {
  const [showActions, setShowActions] = React.useState(false);

  const getPaperTypeColor = (type: string) => {
    switch (type) {
      case 'prelims': return 'bg-primary-100 text-primary-800 border-primary-200';
      case 'mains': return 'bg-primary-100 text-primary-800 border-primary-200';
      case 'full': return 'bg-green-100 text-green-800 border-green-200';
      case 'sectional': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPaperTypeLabel = (type: string) => {
    switch (type) {
      case 'prelims': return 'Prelims';
      case 'mains': return 'Mains';
      case 'full': return 'Full Paper';
      case 'sectional': return 'Sectional';
      default: return type;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 group">
      {/* Header */}
      <div className="p-6 pb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-lg font-semibold text-gray-900 group-hover:text-primary-700 transition-colors">
                {pyq.title}
              </h3>
              {pyq.is_featured && (
                <Star className="h-4 w-4 text-yellow-500 fill-current" />
              )}
            </div>
            
            {pyq.description && (
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                {pyq.description}
              </p>
            )}

            {/* Exam Details */}
            <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
              <div className="flex items-center gap-1">
                <GraduationCap className="h-4 w-4" />
                <span>{pyq.examType?.name || 'Unknown Exam'}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>{pyq.exam_year}</span>
                {pyq.exam_session && <span>({pyq.exam_session})</span>}
              </div>
            </div>

            {/* Paper Type and Details */}
            <div className="flex items-center gap-2 mb-4">
              <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getPaperTypeColor(pyq.paper_type)}`}>
                {getPaperTypeLabel(pyq.paper_type)}
                {pyq.paper_number && ` ${pyq.paper_number}`}
              </span>
              {pyq.conducting_authority && (
                <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">
                  {pyq.conducting_authority}
                </span>
              )}
              {pyq.supports_multilanguage && (
                <Globe className="h-4 w-4 text-primary-500" title="Multi-language support" />
              )}
            </div>
          </div>

          {/* Status and Actions */}
          <div className="flex items-center gap-2 ml-4">
            <div className={`w-3 h-3 rounded-full ${pyq.is_active ? 'bg-green-400' : 'bg-red-400'}`} 
                 title={pyq.is_active ? 'Active' : 'Inactive'} />
            
            <div className="relative">
              <button
                onClick={() => setShowActions(!showActions)}
                className="p-1 rounded-full hover:bg-gray-100 transition-colors"
              >
                <MoreVertical className="h-4 w-4 text-gray-500" />
              </button>

              {showActions && (
                <div className="absolute right-0 top-8 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                  <div className="py-1">
                    <button
                      onClick={() => { onEdit(pyq); setShowActions(false); }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <Edit3 className="h-4 w-4" />
                      Edit PYQ
                    </button>
                    <button
                      onClick={() => { onViewQuestions(pyq); setShowActions(false); }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <FileText className="h-4 w-4" />
                      Manage Questions
                    </button>
                    <button
                      onClick={() => { onPreview(pyq); setShowActions(false); }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <Eye className="h-4 w-4" />
                      Preview
                    </button>
                    <button
                      onClick={() => { onViewAnalytics(pyq); setShowActions(false); }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <BarChart3 className="h-4 w-4" />
                      Analytics
                    </button>
                    <div className="border-t border-gray-100 my-1" />
                    <button
                      onClick={() => { onDuplicate(pyq); setShowActions(false); }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <Copy className="h-4 w-4" />
                      Duplicate
                    </button>
                    <button
                      onClick={() => { onToggleStatus(pyq); setShowActions(false); }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      {pyq.is_active ? (
                        <>
                          <XCircle className="h-4 w-4" />
                          Deactivate
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4" />
                          Activate
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => { onToggleFeatured(pyq); setShowActions(false); }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <Star className={`h-4 w-4 ${pyq.is_featured ? 'text-yellow-500' : ''}`} />
                      {pyq.is_featured ? 'Remove from Featured' : 'Mark as Featured'}
                    </button>
                    <div className="border-t border-gray-100 my-1" />
                    <button
                      onClick={() => { onDelete(pyq); setShowActions(false); }}
                      className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="px-6 pb-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary-600" />
              <div>
                <p className="text-xs text-gray-600">Questions</p>
                <p className="text-sm font-semibold text-gray-900">{pyq.total_questions}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-xs text-gray-600">Duration</p>
                <p className="text-sm font-semibold text-gray-900">{formatDuration(pyq.duration_minutes)}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4 text-primary-600" />
              <div>
                <p className="text-xs text-gray-600">Total Marks</p>
                <p className="text-sm font-semibold text-gray-900">{pyq.total_marks}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-orange-600" />
              <div>
                <p className="text-xs text-gray-600">Attempts</p>
                <p className="text-sm font-semibold text-gray-900">{pyq.attemptCount || 0}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Info */}
      <div className="px-6 pb-4">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-4">
            {pyq.negative_marking && (
              <div className="flex items-center gap-1">
                <Target className="h-3 w-3 text-red-500" />
                <span>Negative marking: -{pyq.negative_marks}</span>
              </div>
            )}
            {pyq.original_exam_date && (
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>Exam: {formatDate(pyq.original_exam_date)}</span>
              </div>
            )}
          </div>
          <div>
            Created: {formatDate(pyq.created_at)}
          </div>
        </div>
      </div>

      {/* Click overlay to close actions menu */}
      {showActions && (
        <div 
          className="fixed inset-0 z-0" 
          onClick={() => setShowActions(false)}
        />
      )}
    </div>
  );
};