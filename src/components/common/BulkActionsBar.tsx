import React from 'react';
import { CheckIcon, XMarkIcon, TrashIcon } from '@heroicons/react/24/outline';

interface BulkAction {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'success' | 'warning' | 'danger';
  disabled?: boolean;
}

interface BulkActionsBarProps {
  selectedCount: number;
  totalCount: number;
  actions: BulkAction[];
  onClearSelection: () => void;
  className?: string;
}

export const BulkActionsBar: React.FC<BulkActionsBarProps> = ({
  selectedCount,
  totalCount,
  actions,
  onClearSelection,
  className = '',
}) => {
  // Show a placeholder when no items are selected to indicate bulk actions are available
  if (selectedCount === 0) {
    return (
      <div className={`px-4 py-2 bg-gray-50 border-b border-gray-200 text-sm text-gray-500 ${className}`}>
        💡 Select items to see bulk actions
      </div>
    );
  }

  const getActionClasses = (variant: BulkAction['variant'] = 'primary') => {
    const baseClasses = 'px-3 py-1.5 text-white text-sm rounded-md flex items-center gap-1 transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
    
    switch (variant) {
      case 'success':
        return `${baseClasses} bg-green-600 hover:bg-green-700`;
      case 'warning':
        return `${baseClasses} bg-yellow-500 hover:bg-yellow-600`;
      case 'danger':
        return `${baseClasses} bg-red-600 hover:bg-red-700`;
      default:
        return `${baseClasses} bg-primary-600 hover:bg-primary-700`;
    }
  };

  // Default actions if none provided
  const defaultActions: BulkAction[] = actions.length ? actions : [
    {
      label: 'Activate',
      icon: <CheckIcon className="h-4 w-4" />,
      onClick: () => console.log('Activate'),
      variant: 'success',
    },
    {
      label: 'Deactivate',
      icon: <XMarkIcon className="h-4 w-4" />,
      onClick: () => console.log('Deactivate'),
      variant: 'warning',
    },
    {
      label: 'Delete',
      icon: <TrashIcon className="h-4 w-4" />,
      onClick: () => console.log('Delete'),
      variant: 'danger',
    },
  ];

  return (
    <div className={`px-6 py-4 bg-primary-50 border-b border-primary-200 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-primary-700">
            {selectedCount} of {totalCount} selected
          </span>
          <button
            onClick={onClearSelection}
            className="text-sm text-primary-600 hover:text-primary-800 transition-colors"
          >
            Clear selection
          </button>
        </div>
        
        <div className="flex gap-2">
          {defaultActions.map((action, index) => (
            <button
              key={index}
              onClick={action.onClick}
              disabled={action.disabled}
              className={getActionClasses(action.variant)}
            >
              {action.icon}
              {action.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};