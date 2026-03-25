import React from 'react';
import { FileText, Download, Eye, Edit, Trash2, Calendar, Tag } from 'lucide-react';
import { PDF } from '../../services/pdfService';

interface PDFCardProps {
  pdf: PDF;
  onPreview: (pdf: PDF) => void;
  onEdit: (pdf: PDF) => void;
  onDownload: (pdf: PDF) => void;
  onDelete: (pdf: PDF) => void;
}

export const PDFCard: React.FC<PDFCardProps> = ({
  pdf,
  onPreview,
  onEdit,
  onDownload,
  onDelete
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getAccessLevelColor = (level: string) => {
    switch (level) {
      case 'free':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'premium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'restricted':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 group">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center flex-1 min-w-0">
            <div className="flex-shrink-0 p-3 rounded-lg bg-red-50">
              <FileText className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-3 flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-gray-900 truncate group-hover:text-primary-600 transition-colors">
                {pdf.title}
              </h3>
              <p className="text-sm text-gray-500">
                {pdf.formatted_file_size || `${Math.round(pdf.file_size / 1024)} KB`}
              </p>
            </div>
          </div>
          <span className={`px-3 py-1 text-xs font-medium rounded-full border ${getAccessLevelColor(pdf.access_level)}`}>
            {pdf.access_level === 'free' ? 'Free' : 
             pdf.access_level === 'premium' ? 'Premium' : 'Restricted'}
          </span>
        </div>

        {/* Description */}
        {pdf.description && (
          <p className="text-sm text-gray-600 mb-4 line-clamp-2 leading-relaxed">
            {pdf.description}
          </p>
        )}

        {/* Tags and Category */}
        <div className="flex items-center flex-wrap gap-2 mb-4">
          {pdf.category && (
            <span 
              className="inline-flex items-center px-2 py-1 text-xs font-medium text-white rounded-md"
              style={{ backgroundColor: pdf.category.color }}
            >
              <Tag className="h-3 w-3 mr-1" />
              {pdf.category.name}
            </span>
          )}
          {pdf.examType && (
            <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-primary-100 text-primary-800 rounded-md">
              {pdf.examType.name}
            </span>
          )}
          {pdf.testSeries && (
            <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-primary-100 text-primary-800 rounded-md">
              {pdf.testSeries.title}
            </span>
          )}
        </div>

        {/* Tags if available */}
        {pdf.tags && pdf.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {pdf.tags.slice(0, 3).map((tag, index) => (
              <span 
                key={index}
                className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
              >
                #{tag}
              </span>
            ))}
            {pdf.tags.length > 3 && (
              <span className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                +{pdf.tags.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center justify-between mb-4 text-sm text-gray-500">
          <div className="flex items-center">
            <Download className="h-4 w-4 mr-1" />
            <span>{pdf.download_count || 0} downloads</span>
          </div>
          <div className="flex items-center">
            <Calendar className="h-4 w-4 mr-1" />
            <span>{formatDate(pdf.created_at)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button 
            onClick={() => onPreview(pdf)}
            className="flex-1 bg-primary-50 hover:bg-primary-100 text-primary-700 font-medium py-2 px-3 rounded-lg transition-colors duration-200 inline-flex items-center justify-center"
          >
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </button>
          <button 
            onClick={() => onEdit(pdf)}
            className="p-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors duration-200"
            title="Edit PDF"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button 
            onClick={() => onDownload(pdf)}
            className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors duration-200"
            title="Download PDF"
          >
            <Download className="h-4 w-4" />
          </button>
          <button 
            onClick={() => onDelete(pdf)}
            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
            title="Delete PDF"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};