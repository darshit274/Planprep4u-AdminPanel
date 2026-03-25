import React, { useState, useEffect } from 'react';
import { X, Download, ExternalLink, Loader, AlertCircle } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

interface PDFPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  pdf: any;
}

export const PDFPreviewModal: React.FC<PDFPreviewModalProps> = ({
  isOpen,
  onClose,
  pdf
}) => {
  const [pdfUrl, setPdfUrl] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (isOpen && pdf?.id) {
      loadPdfPreview();
    }
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [isOpen, pdf?.id]);

  const loadPdfPreview = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get(`/admin/pdfs/${pdf.id}/download`, {
        responseType: 'blob'
      });
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
    } catch (err: any) {
      console.error('PDF preview error:', err);
      setError('Failed to load PDF preview');
      toast.error('Failed to load PDF preview');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    try {
      const response = await api.get(`/admin/pdfs/${pdf.id}/download`, {
        responseType: 'blob'
      });
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = pdf.original_filename || pdf.title + '.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success('PDF downloaded successfully');
    } catch (err: any) {
      console.error('PDF download error:', err);
      toast.error('Failed to download PDF');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[95vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-900 truncate">
              {pdf?.title || 'PDF Preview'}
            </h2>
            <p className="text-sm text-gray-500">
              {pdf?.formatted_file_size || 'Unknown size'}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleDownload}
              className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 inline-flex items-center"
              title="Download PDF"
            >
              <Download className="h-4 w-4 mr-1" />
              Download
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="p-4" style={{ height: 'calc(95vh - 120px)' }}>
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Loader className="animate-spin h-8 w-8 text-primary-600 mx-auto mb-4" />
                <p className="text-gray-600">Loading PDF preview...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">{error}</p>
                <button
                  onClick={loadPdfPreview}
                  className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Try Again
                </button>
              </div>
            </div>
          ) : pdfUrl ? (
            <iframe
              src={pdfUrl}
              className="w-full h-full border rounded"
              title="PDF Preview"
            />
          ) : null}
        </div>

        <div className="flex items-center justify-between p-4 border-t bg-gray-50">
          <div className="text-sm text-gray-600">
            {pdf?.category && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mr-2"
                    style={{ backgroundColor: pdf.category.color + '20', color: pdf.category.color }}>
                {pdf.category.name}
              </span>
            )}
            {pdf?.access_level && (
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                pdf.access_level === 'free' 
                  ? 'bg-green-100 text-green-800'
                  : pdf.access_level === 'premium'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {pdf.access_level.charAt(0).toUpperCase() + pdf.access_level.slice(1)}
              </span>
            )}
          </div>
          <div className="text-sm text-gray-500">
            {pdf?.download_count || 0} downloads
          </div>
        </div>
      </div>
    </div>
  );
};