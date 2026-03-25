import React, { useState } from 'react';
import { Upload } from 'lucide-react';
import QuestionImportModal from '../modals/QuestionImportModal';

interface QuestionImportButtonProps {
  categoryId: number;
  categoryName: string;
  testSeriesId?: number;
  onImportComplete?: () => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'outline';
}

export const QuestionImportButton: React.FC<QuestionImportButtonProps> = ({
  categoryId,
  categoryName,
  testSeriesId,
  onImportComplete,
  className = '',
  size = 'md',
  variant = 'primary'
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-2 text-sm',
    lg: 'px-4 py-3 text-base'
  };

  const variantClasses = {
    primary: 'bg-primary-600 text-white hover:bg-primary-700 border-transparent',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700 border-transparent',
    outline: 'bg-transparent text-primary-600 hover:bg-primary-50 border-primary-600'
  };

  const iconSizes = {
    sm: 12,
    md: 14,
    lg: 16
  };

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className={`
          inline-flex items-center justify-center
          border rounded-lg font-medium
          transition-colors duration-200
          ${sizeClasses[size]}
          ${variantClasses[variant]}
          ${className}
        `}
        title={`Import questions to ${categoryName}`}
      >
        <Upload size={iconSizes[size]} className="mr-1" />
        Import
      </button>

      <QuestionImportModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        categoryId={categoryId}
        categoryName={categoryName}
        testSeriesId={testSeriesId}
        onImportComplete={() => {
          if (onImportComplete) {
            onImportComplete();
          }
          setIsModalOpen(false);
        }}
      />
    </>
  );
};

export default QuestionImportButton;