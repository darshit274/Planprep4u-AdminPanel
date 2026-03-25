import React, { useState, useCallback } from 'react';
import { X, Upload, Download, FileText, AlertCircle, CheckCircle, Eye } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface QuestionImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  categoryId: number;
  categoryName: string;
  testSeriesId?: number;
  onImportComplete?: () => void;
}

interface ImportStatus {
  import_id: string;
  status: 'uploaded' | 'validating' | 'validated' | 'importing' | 'completed' | 'failed';
  total_rows: number;
  successful_imports: number;
  failed_imports: number;
  validation_errors?: any[];
}

export const QuestionImportModal: React.FC<QuestionImportModalProps> = ({
  isOpen,
  onClose,
  categoryId,
  categoryName,
  testSeriesId,
  onImportComplete
}) => {
  const [currentStep, setCurrentStep] = useState<'upload' | 'preview' | 'importing' | 'complete'>('upload');
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importStatus, setImportStatus] = useState<ImportStatus | null>(null);
  const [previewData, setPreviewData] = useState<any>(null);

  const downloadTemplate = async (format: 'excel' | 'csv') => {
    try {
      const token = sessionStorage.getItem('admin_token');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/admin/questions/stats?download=template&format=${format}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Failed to download template');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `question_import_template.${format === 'excel' ? 'xlsx' : 'csv'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success(`Template downloaded successfully`);
    } catch (error) {
      console.error('Template download error:', error);
      toast.error('Failed to download template');
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
        'text/csv'
      ];

      if (allowedTypes.includes(file.type)) {
        setSelectedFile(file);
      } else {
        toast.error('Please select an Excel (.xlsx, .xls) or CSV file');
        event.target.value = '';
      }
    }
  };

  const uploadFile = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('category_id', categoryId.toString());
      if (testSeriesId) {
        formData.append('test_series_id', testSeriesId.toString());
      }

      const token = sessionStorage.getItem('admin_token');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/admin/questions/stats?action=import`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      const data = await response.json();
      if (data.success) {
        const importId = data.data.import_id;
        toast.success('File uploaded and validated successfully!');
        
        // Set import status
        setImportStatus({
          import_id: importId,
          status: 'validated',
          total_rows: data.data.total_rows,
          successful_imports: 0,
          failed_imports: 0,
          validation_errors: data.data.errors || []
        });

        // Map API response to frontend structure and show preview immediately
        const mappedData = {
          total_valid_questions: data.data.valid_rows,
          total_errors: data.data.error_rows,
          validation_errors: data.data.errors || [],
          preview_questions: data.data.preview || []
        };
        setPreviewData(mappedData);
        setCurrentStep('preview');
      } else {
        throw new Error(data.message || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('File upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const pollImportStatus = async (importId: string) => {
    try {
      const token = sessionStorage.getItem('admin_token');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/admin/questions/import/status/${importId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();
      if (data.success) {
        setImportStatus(data.data);
        
        if (data.data.status === 'validated') {
          // Load preview data
          loadPreviewData(importId);
        } else if (data.data.status === 'failed') {
          toast.error('File validation failed');
        } else if (['uploading', 'validating'].includes(data.data.status)) {
          // Continue polling
          setTimeout(() => pollImportStatus(importId), 2000);
        }
      }
    } catch (error) {
      console.error('Status polling error:', error);
      toast.error('Failed to check import status');
    }
  };

  const loadPreviewData = async (importId: string) => {
    try {
      const token = sessionStorage.getItem('admin_token');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/admin/questions/import/preview/${importId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();
      if (data.success) {
        // Map API response to frontend structure
        const mappedData = {
          total_valid_questions: data.data.total_rows,
          total_errors: 0, // No errors since it's validated
          validation_errors: data.data.validation_errors || [],
          preview_questions: data.data.preview || []
        };
        setPreviewData(mappedData);
        setCurrentStep('preview');
      } else {
        throw new Error(data.message || 'Preview failed');
      }
    } catch (error) {
      console.error('Preview error:', error);
      toast.error('Failed to load preview');
    }
  };

  const confirmImport = async () => {
    if (!importStatus) return;

    setCurrentStep('importing');
    try {
      const token = sessionStorage.getItem('admin_token');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/admin/questions/import/confirm/${importStatus.import_id}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Import started successfully');
        // Start polling for completion
        pollFinalImportStatus(importStatus.import_id);
      } else {
        throw new Error(data.message || 'Import failed');
      }
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Failed to start import');
      setCurrentStep('preview');
    }
  };

  const pollFinalImportStatus = async (importId: string) => {
    try {
      const token = sessionStorage.getItem('admin_token');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/admin/questions/import/status/${importId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();
      if (data.success) {
        setImportStatus(data.data);
        
        if (data.data.status === 'completed') {
          setCurrentStep('complete');
          toast.success(`Import completed! ${data.data.successful_imports} questions imported successfully.`);
          if (onImportComplete) {
            onImportComplete();
          }
        } else if (data.data.status === 'failed') {
          toast.error('Import failed');
          setCurrentStep('preview');
        } else if (data.data.status === 'importing') {
          // Continue polling
          setTimeout(() => pollFinalImportStatus(importId), 3000);
        }
      }
    } catch (error) {
      console.error('Final status polling error:', error);
    }
  };

  const resetModal = () => {
    setCurrentStep('upload');
    setSelectedFile(null);
    setImportStatus(null);
    setPreviewData(null);
    setIsUploading(false);
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto m-4">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">Import Questions</h2>
            <p className="text-sm text-gray-600">Category: {categoryName}</p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {currentStep === 'upload' && (
            <div className="space-y-6">
              {/* Step 1: Download Template */}
              <div className="border border-primary-200 bg-primary-50 rounded-lg p-4">
                <h3 className="font-semibold text-primary-800 mb-2 flex items-center">
                  <Download size={20} className="mr-2" />
                  Step 1: Download Template
                </h3>
                <p className="text-primary-700 mb-4 text-sm">
                  Download the template file, fill it with your questions, and then upload it.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => downloadTemplate('excel')}
                    className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <FileText size={16} className="mr-2" />
                    Download Excel Template
                  </button>
                  <button
                    onClick={() => downloadTemplate('csv')}
                    className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    <FileText size={16} className="mr-2" />
                    Download CSV Template
                  </button>
                </div>
              </div>

              {/* Step 2: Upload File */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 mb-2 flex items-center">
                  <Upload size={20} className="mr-2" />
                  Step 2: Upload Your File
                </h3>
                <div className="space-y-4">
                  <div>
                    <input
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      onChange={handleFileSelect}
                      className="w-full p-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  
                  {selectedFile && (
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-sm text-gray-700">
                        <strong>Selected:</strong> {selectedFile.name}
                      </p>
                      <p className="text-sm text-gray-600">
                        <strong>Size:</strong> {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  )}

                  <button
                    onClick={uploadFile}
                    disabled={!selectedFile || isUploading}
                    className="w-full flex items-center justify-center px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    {isUploading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                        Uploading & Validating...
                      </>
                    ) : (
                      <>
                        <Upload size={16} className="mr-2" />
                        Upload & Validate
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {currentStep === 'preview' && previewData && (
            <div className="space-y-6">
              {/* Import Summary */}
              <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
                <h3 className="font-semibold text-primary-800 mb-3 flex items-center">
                  <Eye size={20} className="mr-2" />
                  Import Preview
                </h3>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-green-600">{previewData.total_valid_questions}</div>
                    <div className="text-sm text-gray-600">Valid Questions</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-red-600">{previewData.total_errors}</div>
                    <div className="text-sm text-gray-600">Errors</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-primary-600">{previewData.preview_questions.length}</div>
                    <div className="text-sm text-gray-600">Preview Shown</div>
                  </div>
                </div>
              </div>

              {/* Validation Errors */}
              {previewData.validation_errors && previewData.validation_errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="font-semibold text-red-800 mb-3 flex items-center">
                    <AlertCircle size={16} className="mr-2" />
                    Validation Errors (First 10 shown)
                  </h4>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {previewData.validation_errors.slice(0, 10).map((error: any, index: number) => (
                      <div key={index} className="text-sm bg-white p-2 rounded border">
                        {typeof error === 'string' ? (
                          // Handle string errors directly from API
                          <span>{error}</span>
                        ) : (
                          // Handle structured errors
                          <span><strong>Row {error.row}:</strong> {error.field} - {error.error}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Preview Questions */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-semibold text-green-800 mb-3">Preview Questions</h4>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {previewData.preview_questions.map((question: any, index: number) => {
                    // Smart display: show available language content
                    const questionText = question.question_text || question.question_text_gujarati || 'No question text';
                    const optionA = question.option_a || question.option_a_gujarati || 'No option A';
                    const optionB = question.option_b || question.option_b_gujarati || 'No option B';
                    const optionC = question.option_c || question.option_c_gujarati || 'No option C';
                    const optionD = question.option_d || question.option_d_gujarati || 'No option D';
                    const language = question.question_text ? 'English' : question.question_text_gujarati ? 'Gujarati' : 'Unknown';

                    return (
                      <div key={index} className="bg-white p-4 rounded border">
                        <div className="flex justify-between items-start mb-2">
                          <div className="font-medium text-gray-800 flex-1">{questionText}</div>
                          <span className="text-xs bg-primary-100 text-primary-800 px-2 py-1 rounded ml-2">{language}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                          <div>A: {optionA}</div>
                          <div>B: {optionB}</div>
                          <div>C: {optionC}</div>
                          <div>D: {optionD}</div>
                        </div>
                        <div className="text-sm text-green-600 mt-2">
                          <strong>Correct Answer:</strong> {question.correct_answer} | <strong>Marks:</strong> {question.marks}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between">
                <button
                  onClick={() => setCurrentStep('upload')}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Back to Upload
                </button>
                <button
                  onClick={confirmImport}
                  disabled={previewData.total_valid_questions === 0}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  Confirm Import ({previewData.total_valid_questions} Questions)
                </button>
              </div>
            </div>
          )}

          {currentStep === 'importing' && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-500 border-t-transparent mx-auto mb-4"></div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Importing Questions...</h3>
              <p className="text-gray-600">Please wait while we import your questions to the database.</p>
              {importStatus && (
                <div className="mt-4 bg-primary-50 p-4 rounded-lg">
                  <p className="text-sm">Status: {importStatus.status}</p>
                  {importStatus.successful_imports > 0 && (
                    <p className="text-sm text-green-600">Imported: {importStatus.successful_imports} questions</p>
                  )}
                </div>
              )}
            </div>
          )}

          {currentStep === 'complete' && importStatus && (
            <div className="text-center py-8">
              <CheckCircle size={64} className="text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Import Completed!</h3>
              <div className="bg-green-50 p-6 rounded-lg mt-4">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-green-600">{importStatus.successful_imports}</div>
                    <div className="text-sm text-gray-600">Successfully Imported</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-red-600">{importStatus.failed_imports}</div>
                    <div className="text-sm text-gray-600">Failed</div>
                  </div>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="mt-6 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuestionImportModal;