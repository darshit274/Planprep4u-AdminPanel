import React, { useState, useEffect } from 'react';
import { X, HelpCircle, BookOpen, Target, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import RichTextEditor from '../common/RichTextEditor';

interface QuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  question?: any; // For edit mode
  mode: 'create' | 'edit';
  simplified?: boolean; // For report editing - hides difficulty, marks, subject, topic
}

export const QuestionModal: React.FC<QuestionModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  question,
  mode,
  simplified = false
}) => {
  const [formData, setFormData] = useState({
    question_text: '',
    option_a: '',
    option_b: '',
    option_c: '',
    option_d: '',
    correct_answer: 'A',
    explanation: '',
    difficulty: 'medium',
    subject: '',
    topic: '',
    marks: 1,
    negative_marks: 0
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (mode === 'edit' && question) {
      setFormData({
        question_text: question.question_text || '',
        option_a: question.option_a || '',
        option_b: question.option_b || '',
        option_c: question.option_c || '',
        option_d: question.option_d || '',
        correct_answer: question.correct_answer || 'A',
        explanation: question.explanation || '',
        difficulty: question.difficulty || 'medium',
        subject: question.subject || '',
        topic: question.topic || '',
        marks: question.marks || 1,
        negative_marks: question.negative_marks || 0
      });
    } else {
      setFormData({
        question_text: '',
        option_a: '',
        option_b: '',
        option_c: '',
        option_d: '',
        correct_answer: 'A',
        explanation: '',
        difficulty: 'medium',
        subject: '',
        topic: '',
        marks: 1,
        negative_marks: 0
      });
    }
    setErrors({});
  }, [mode, question, isOpen]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.question_text || formData.question_text.trim() === '') {
      newErrors.question_text = 'Question text is required';
    }

    (['a', 'b', 'c', 'd'] as const).forEach(option => {
      const key = `option_${option}` as keyof typeof formData;
      const value = formData[key] as string;
      if (!value || value.trim() === '') {
        newErrors[key] = `Option ${option.toUpperCase()} is required`;
      }
    });

    // Only validate subject, marks, and negative_marks if not in simplified mode
    if (!simplified) {
      if (!formData.subject?.trim()) {
        newErrors.subject = 'Subject is required';
      }

      if (formData.marks <= 0) {
        newErrors.marks = 'Marks must be greater than 0';
      }

      if (formData.negative_marks < 0) {
        newErrors.negative_marks = 'Negative marks cannot be negative';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      if (mode === 'create') {
        await api.post('/admin/questions', formData);
        toast.success('Question created successfully');
      } else {
        await api.put(`/admin/questions/${question.id}`, formData);
        toast.success('Question updated successfully');
      }
      
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Question operation error:', error);
      const errorMessage = error.response?.data?.message || `Failed to ${mode} question`;
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {mode === 'create' ? 'Add New Question' : 'Edit Question'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Language Tabs */}
          <div className="border-b border-gray-200">
            {/* Language tabs removed — Gujarati input was discontinued (English only). */}
          </div>

          {/* Question Text */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <div className="flex items-center space-x-2">
                <HelpCircle className="h-4 w-4" />
                <span>Question Text *</span>
              </div>
            </label>
            <RichTextEditor
              value={formData.question_text}
              onChange={(content) => {
                setFormData(prev => ({ ...prev, question_text: content }));
                if (errors.question_text) {
                  setErrors(prev => ({ ...prev, question_text: '' }));
                }
              }}
              placeholder="Enter the question text..."
              height={250}
              error={errors.question_text}
            />
          </div>

          {/* Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(['A', 'B', 'C', 'D'] as const).map((option) => {
              const optionKey = `option_${option.toLowerCase()}` as keyof typeof formData;
              const fieldValue = formData[optionKey] as string;

              return (
                <div key={option}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Option {option} *
                  </label>
                  <input
                    type="text"
                    name={optionKey}
                    value={fieldValue}
                    onChange={handleChange}
                    className={`input-field ${errors[optionKey] ? 'border-red-500' : ''}`}
                    placeholder={`Enter option ${option}`}
                  />
                  {errors[optionKey] && (
                    <p className="text-red-500 text-sm mt-1">{errors[optionKey]}</p>
                  )}
                </div>
              );
            })}
          </div>

          {/* Correct Answer and Settings */}
          <div className={`grid grid-cols-1 ${simplified ? 'md:grid-cols-1' : 'md:grid-cols-4'} gap-4`}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Correct Answer *
              </label>
              <div className="relative">
                <Target className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <select
                  name="correct_answer"
                  value={formData.correct_answer}
                  onChange={handleChange}
                  className="input-field pl-10"
                >
                  <option value="A">Option A</option>
                  <option value="B">Option B</option>
                  <option value="C">Option C</option>
                  <option value="D">Option D</option>
                </select>
              </div>
            </div>

            {!simplified && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Difficulty *
                  </label>
                  <select
                    name="difficulty"
                    value={formData.difficulty}
                    onChange={handleChange}
                    className="input-field"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Marks
                  </label>
                  <input
                    type="number"
                    name="marks"
                    value={formData.marks}
                    onChange={handleChange}
                    min="0.1"
                    step="0.1"
                    className={`input-field ${errors.marks ? 'border-red-500' : ''}`}
                  />
                  {errors.marks && (
                    <p className="text-red-500 text-sm mt-1">{errors.marks}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Negative Marks
                  </label>
                  <input
                    type="number"
                    name="negative_marks"
                    value={formData.negative_marks}
                    onChange={handleChange}
                    min="0"
                    step="0.1"
                    className={`input-field ${errors.negative_marks ? 'border-red-500' : ''}`}
                  />
                  {errors.negative_marks && (
                    <p className="text-red-500 text-sm mt-1">{errors.negative_marks}</p>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Subject and Topic - Only show if not simplified */}
          {!simplified && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject *
                </label>
                <div className="relative">
                  <BookOpen className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <select
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    className={`input-field pl-10 ${errors.subject ? 'border-red-500' : ''}`}
                  >
                    <option value="">Select Subject</option>
                    <option value="Mathematics">Mathematics</option>
                    <option value="Science">Science</option>
                    <option value="English">English</option>
                    <option value="History">History</option>
                    <option value="Geography">Geography</option>
                    <option value="Physics">Physics</option>
                    <option value="Chemistry">Chemistry</option>
                    <option value="Biology">Biology</option>
                    <option value="General Knowledge">General Knowledge</option>
                    <option value="Current Affairs">Current Affairs</option>
                  </select>
                </div>
                {errors.subject && (
                  <p className="text-red-500 text-sm mt-1">{errors.subject}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Topic
                </label>
                <input
                  type="text"
                  name="topic"
                  value={formData.topic}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Enter topic (optional)"
                />
              </div>
            </div>
          )}

          {/* Explanation with Rich Text Editor */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <div className="flex items-center space-x-2">
                <FileText className="h-4 w-4" />
                <span>Explanation</span>
              </div>
            </label>
            <RichTextEditor
              value={formData.explanation}
              onChange={(content) => {
                setFormData(prev => ({ ...prev, explanation: content }));
              }}
              placeholder="Enter explanation for the correct answer (optional)..."
              height={200}
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 btn-primary"
              disabled={loading}
            >
              {loading ? 'Saving...' : mode === 'create' ? 'Create Question' : 'Update Question'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};