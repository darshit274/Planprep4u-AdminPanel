import React, { useState, useEffect } from 'react';
import { X, Save, Loader2, Calendar, Clock, Award, GraduationCap, FileText } from 'lucide-react';
import pyqService, { PYQ } from '../../services/pyqService';
import examService, { ExamType } from '../../services/examService';
import toast from 'react-hot-toast';

interface PYQModalProps {
  isOpen: boolean;
  onClose: () => void;
  pyq?: PYQ | null;
  onUpdate: () => void;
}

export const PYQModal: React.FC<PYQModalProps> = ({
  isOpen,
  onClose,
  pyq,
  onUpdate
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    exam_type_id: '',
    exam_year: new Date().getFullYear(),
    exam_session: '',
    paper_type: 'full' as 'prelims' | 'mains' | 'full' | 'sectional',
    paper_number: '',
    total_questions: '',
    duration_minutes: '',
    total_marks: '',
    negative_marking: false,
    negative_marks: '',
    supports_multilanguage: false,
    original_exam_date: '',
    conducting_authority: '',
    instructions: '',
    exam_pattern_notes: '',
    is_active: true,
    is_featured: false
  });

  const [examTypes, setExamTypes] = useState<ExamType[]>([]);
  const [examYears, setExamYears] = useState<number[]>([]);
  const [examSessions, setExamSessions] = useState<string[]>([]);
  const [conductingAuthorities, setConductingAuthorities] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'basic' | 'details' | 'settings'>('basic');

  useEffect(() => {
    if (isOpen) {
      loadInitialData();
      if (pyq) {
        setFormData({
          title: pyq.title,
          description: pyq.description || '',
          exam_type_id: pyq.exam_type_id.toString(),
          exam_year: pyq.exam_year,
          exam_session: pyq.exam_session || '',
          paper_type: pyq.paper_type,
          paper_number: pyq.paper_number?.toString() || '',
          total_questions: pyq.total_questions.toString(),
          duration_minutes: pyq.duration_minutes.toString(),
          total_marks: pyq.total_marks.toString(),
          negative_marking: pyq.negative_marking,
          negative_marks: pyq.negative_marks.toString(),
          supports_multilanguage: pyq.supports_multilanguage,
          original_exam_date: pyq.original_exam_date ? pyq.original_exam_date.split('T')[0] : '',
          conducting_authority: pyq.conducting_authority || '',
          instructions: pyq.instructions || '',
          exam_pattern_notes: pyq.exam_pattern_notes || '',
          is_active: pyq.is_active,
          is_featured: pyq.is_featured
        });
      } else {
        resetForm();
      }
    }
  }, [isOpen, pyq]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [examTypesRes, yearsRes, sessionsRes, authoritiesRes] = await Promise.all([
        examService.getExamTypes(),
        pyqService.getExamYears(),
        pyqService.getExamSessions(),
        pyqService.getConductingAuthorities()
      ]);

      if (examTypesRes.success) setExamTypes(examTypesRes.data);
      if (yearsRes.success) setExamYears(yearsRes.data.map(y => y.year));
      if (sessionsRes.success) setExamSessions(sessionsRes.data.map(s => s.session));
      if (authoritiesRes.success) setConductingAuthorities(authoritiesRes.data);
    } catch (error) {
      console.error('Error loading initial data:', error);
      toast.error('Failed to load form data');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      exam_type_id: '',
      exam_year: new Date().getFullYear(),
      exam_session: '',
      paper_type: 'full',
      paper_number: '',
      total_questions: '',
      duration_minutes: '',
      total_marks: '',
      negative_marking: false,
      negative_marks: '',
      supports_multilanguage: false,
      original_exam_date: '',
      conducting_authority: '',
      instructions: '',
      exam_pattern_notes: '',
      is_active: true,
      is_featured: false
    });
    setActiveTab('basic');
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.exam_type_id || !formData.total_questions) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      const submitData = {
        title: formData.title,
        description: formData.description || undefined,
        exam_type_id: parseInt(formData.exam_type_id),
        exam_year: formData.exam_year,
        exam_session: formData.exam_session || undefined,
        paper_type: formData.paper_type,
        paper_number: formData.paper_number ? parseInt(formData.paper_number) : undefined,
        total_questions: parseInt(formData.total_questions),
        duration_minutes: parseInt(formData.duration_minutes),
        total_marks: parseInt(formData.total_marks),
        negative_marking: formData.negative_marking,
        negative_marks: formData.negative_marking ? parseFloat(formData.negative_marks) : 0,
        supports_multilanguage: formData.supports_multilanguage,
        original_exam_date: formData.original_exam_date || undefined,
        conducting_authority: formData.conducting_authority || undefined,
        instructions: formData.instructions || undefined,
        exam_pattern_notes: formData.exam_pattern_notes || undefined,
        is_active: formData.is_active,
        is_featured: formData.is_featured
      };

      if (pyq) {
        await pyqService.updatePYQ(pyq.id, submitData);
        toast.success('PYQ updated successfully');
      } else {
        await pyqService.createPYQ(submitData);
        toast.success('PYQ created successfully');
      }

      onUpdate();
      onClose();
    } catch (error: any) {
      console.error('Error saving PYQ:', error);
      toast.error(error.response?.data?.message || 'Failed to save PYQ');
    } finally {
      setSaving(false);
    }
  };

  const paperTypes = pyqService.getPaperTypes();

  // Generate year options (current year + 10 years back)
  const yearOptions = Array.from({ length: 11 }, (_, i) => new Date().getFullYear() - i);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            {pyq ? 'Edit PYQ' : 'Create New PYQ'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            disabled={saving}
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('basic')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'basic'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Basic Information
          </button>
          <button
            onClick={() => setActiveTab('details')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'details'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Exam Details
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'settings'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Settings
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
            <span className="ml-2 text-gray-600">Loading form data...</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto p-6">
              {/* Basic Information Tab */}
              {activeTab === 'basic' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Title *
                      </label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => handleInputChange('title', e.target.value)}
                        placeholder="e.g., PSI 2023 Prelims Paper"
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        required
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                        placeholder="Brief description of this PYQ..."
                        rows={3}
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Exam Type *
                      </label>
                      <select
                        value={formData.exam_type_id}
                        onChange={(e) => handleInputChange('exam_type_id', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        required
                      >
                        <option value="">Select Exam Type</option>
                        {examTypes.map((examType) => (
                          <option key={examType.id} value={examType.id}>
                            {examType.name} ({examType.code})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Exam Year *
                      </label>
                      <select
                        value={formData.exam_year}
                        onChange={(e) => handleInputChange('exam_year', parseInt(e.target.value))}
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        required
                      >
                        {yearOptions.map((year) => (
                          <option key={year} value={year}>
                            {year}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Exam Session
                      </label>
                      <input
                        type="text"
                        value={formData.exam_session}
                        onChange={(e) => handleInputChange('exam_session', e.target.value)}
                        placeholder="e.g., Prelims, Mains, January"
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        list="sessions"
                      />
                      <datalist id="sessions">
                        {examSessions.map((session) => (
                          <option key={session} value={session} />
                        ))}
                      </datalist>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Paper Type *
                      </label>
                      <select
                        value={formData.paper_type}
                        onChange={(e) => handleInputChange('paper_type', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        required
                      >
                        {paperTypes.map((type) => (
                          <option key={type.value} value={type.value}>
                            {type.label} - {type.description}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Paper Number
                      </label>
                      <input
                        type="number"
                        value={formData.paper_number}
                        onChange={(e) => handleInputChange('paper_number', e.target.value)}
                        placeholder="1, 2, 3..."
                        min="1"
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Conducting Authority
                      </label>
                      <input
                        type="text"
                        value={formData.conducting_authority}
                        onChange={(e) => handleInputChange('conducting_authority', e.target.value)}
                        placeholder="e.g., GPSC, Gujarat Police"
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        list="authorities"
                      />
                      <datalist id="authorities">
                        {conductingAuthorities.map((authority) => (
                          <option key={authority} value={authority} />
                        ))}
                      </datalist>
                    </div>
                  </div>
                </div>
              )}

              {/* Exam Details Tab */}
              {activeTab === 'details' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <FileText className="inline h-4 w-4 mr-1" />
                        Total Questions *
                      </label>
                      <input
                        type="number"
                        value={formData.total_questions}
                        onChange={(e) => handleInputChange('total_questions', e.target.value)}
                        placeholder="100"
                        min="1"
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Clock className="inline h-4 w-4 mr-1" />
                        Duration (minutes) *
                      </label>
                      <input
                        type="number"
                        value={formData.duration_minutes}
                        onChange={(e) => handleInputChange('duration_minutes', e.target.value)}
                        placeholder="120"
                        min="1"
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Award className="inline h-4 w-4 mr-1" />
                        Total Marks *
                      </label>
                      <input
                        type="number"
                        value={formData.total_marks}
                        onChange={(e) => handleInputChange('total_marks', e.target.value)}
                        placeholder="100"
                        min="1"
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Calendar className="inline h-4 w-4 mr-1" />
                        Original Exam Date
                      </label>
                      <input
                        type="date"
                        value={formData.original_exam_date}
                        onChange={(e) => handleInputChange('original_exam_date', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg">
                        <input
                          type="checkbox"
                          checked={formData.negative_marking}
                          onChange={(e) => handleInputChange('negative_marking', e.target.checked)}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                        <span className="text-sm font-medium text-gray-700">Negative Marking</span>
                      </label>
                      {formData.negative_marking && (
                        <input
                          type="number"
                          value={formData.negative_marks}
                          onChange={(e) => handleInputChange('negative_marks', e.target.value)}
                          placeholder="0.25"
                          step="0.01"
                          min="0"
                          className="w-full mt-2 px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Instructions
                    </label>
                    <textarea
                      value={formData.instructions}
                      onChange={(e) => handleInputChange('instructions', e.target.value)}
                      placeholder="Original exam instructions..."
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Exam Pattern Notes
                    </label>
                    <textarea
                      value={formData.exam_pattern_notes}
                      onChange={(e) => handleInputChange('exam_pattern_notes', e.target.value)}
                      placeholder="Notes about marking scheme, exam pattern, etc..."
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>
              )}

              {/* Settings Tab */}
              {activeTab === 'settings' && (
                <div className="space-y-6">
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">General Settings</h3>
                    <div className="space-y-4">
                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={formData.is_active}
                          onChange={(e) => handleInputChange('is_active', e.target.checked)}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                        <div>
                          <span className="text-sm font-medium text-gray-700">Active</span>
                          <p className="text-xs text-gray-500">PYQ will be visible to students</p>
                        </div>
                      </label>

                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={formData.is_featured}
                          onChange={(e) => handleInputChange('is_featured', e.target.checked)}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                        <div>
                          <span className="text-sm font-medium text-gray-700">Featured</span>
                          <p className="text-xs text-gray-500">Show in featured PYQs section</p>
                        </div>
                      </label>

                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={formData.supports_multilanguage}
                          onChange={(e) => handleInputChange('supports_multilanguage', e.target.checked)}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                        <div>
                          <span className="text-sm font-medium text-gray-700">Multi-language Support</span>
                          <p className="text-xs text-gray-500">PYQ has questions in multiple languages</p>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {pyq ? 'Update PYQ' : 'Create PYQ'}
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};