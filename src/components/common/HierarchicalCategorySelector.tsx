import React, { useState, useEffect } from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { ExamCategory, TestManagementService } from '../../services/testManagement';

interface HierarchicalCategorySelectorProps {
  selectedCategoryId?: number;
  onCategorySelect: (category: ExamCategory | null) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}

interface CategoryLevel {
  categories: ExamCategory[];
  selectedId?: number;
  loading: boolean;
}

export const HierarchicalCategorySelector: React.FC<HierarchicalCategorySelectorProps> = ({
  selectedCategoryId,
  onCategorySelect,
  placeholder = "Select category",
  disabled = false,
  required = false,
  className = ""
}) => {
  const [levels, setLevels] = useState<CategoryLevel[]>([
    { categories: [], loading: true } // Level 0: Exam-wise
  ]);
  const [selectedPath, setSelectedPath] = useState<ExamCategory[]>([]);

  // Load initial level 0 categories
  useEffect(() => {
    loadCategories(0);
  }, []);

  // If there's a pre-selected category, load its path
  useEffect(() => {
    if (selectedCategoryId) {
      loadCategoryPath(selectedCategoryId);
    }
  }, [selectedCategoryId]);

  const loadCategories = async (level: number, parentId?: number) => {
    try {
      const response = await TestManagementService.getExamCategories({
        level,
        parent_id: parentId
      });

      setLevels(prev => {
        const newLevels = [...prev];
        if (newLevels[level]) {
          newLevels[level] = {
            categories: response.data || [],
            selectedId: newLevels[level].selectedId,
            loading: false
          };
        } else {
          newLevels[level] = {
            categories: response.data || [],
            loading: false
          };
        }
        // Clear subsequent levels
        return newLevels.slice(0, level + 1);
      });
    } catch (error) {
      console.error(`Error loading level ${level} categories:`, error);
      setLevels(prev => {
        const newLevels = [...prev];
        newLevels[level] = {
          categories: [],
          selectedId: newLevels[level]?.selectedId,
          loading: false
        };
        return newLevels.slice(0, level + 1);
      });
    }
  };

  const loadCategoryPath = async (categoryId: number) => {
    // This would need to be implemented if you want to support pre-selection
    // For now, we'll just select the category if it exists in current levels
  };

  const handleCategorySelect = async (level: number, category: ExamCategory) => {
    // Update selected category for this level
    setLevels(prev => {
      const newLevels = [...prev];
      newLevels[level] = {
        ...newLevels[level],
        selectedId: category.id
      };
      // Clear subsequent levels
      return newLevels.slice(0, level + 1);
    });

    // Update selected path
    const newPath = [...selectedPath.slice(0, level), category];
    setSelectedPath(newPath);

    // If this category can have children (level < 2), load them
    if (level < 2) {
      // Add next level
      setLevels(prev => [
        ...prev,
        { categories: [], loading: true }
      ]);
      
      await loadCategories(level + 1, category.id);
    }

    // Notify parent component
    onCategorySelect(category);
  };

  const handleClearSelection = () => {
    setLevels([{ categories: levels[0].categories, loading: false }]);
    setSelectedPath([]);
    onCategorySelect(null);
  };

  const getLevelLabel = (level: number): string => {
    switch (level) {
      case 0: return 'Exam Type';
      case 1: return 'Subject';
      case 2: return 'Chapter';
      default: return 'Category';
    }
  };

  const getSelectedCategoryPath = (): string => {
    if (selectedPath.length === 0) return '';
    return selectedPath.map(cat => cat.name).join(' → ');
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Selected Path Display */}
      {selectedPath.length > 0 && (
        <div className="bg-primary-50 border border-primary-200 rounded-md p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-primary-900">Selected Category:</p>
              <p className="text-sm text-primary-700">{getSelectedCategoryPath()}</p>
            </div>
            <button
              type="button"
              onClick={handleClearSelection}
              className="text-primary-600 hover:text-primary-800 text-sm font-medium"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Level Selectors */}
      {levels.map((level, levelIndex) => (
        <div key={levelIndex}>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {getLevelLabel(levelIndex)}
            {required && levelIndex === 0 && <span className="text-red-500 ml-1">*</span>}
          </label>
          
          {level.loading ? (
            <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50">
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400 mr-2"></div>
                <span className="text-gray-500 text-sm">Loading...</span>
              </div>
            </div>
          ) : (
            <div className="relative">
              <select
                value={level.selectedId || ''}
                onChange={(e) => {
                  const categoryId = parseInt(e.target.value);
                  const category = level.categories.find(cat => cat.id === categoryId);
                  if (category) {
                    handleCategorySelect(levelIndex, category);
                  }
                }}
                disabled={disabled || level.categories.length === 0}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50 disabled:text-gray-500 appearance-none"
                required={required && levelIndex === 0}
              >
                <option value="">
                  {level.categories.length === 0 
                    ? `No ${getLevelLabel(levelIndex).toLowerCase()} available`
                    : `Select ${getLevelLabel(levelIndex).toLowerCase()}`
                  }
                </option>
                {level.categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                    {category.name_gujarati && ` (${category.name_gujarati})`}
                  </option>
                ))}
              </select>
              <ChevronDownIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>
          )}
        </div>
      ))}

      {/* Help Text */}
      <p className="text-xs text-gray-500">
        Select categories hierarchically from general to specific (Exam → Subject → Chapter)
      </p>
    </div>
  );
};

export default HierarchicalCategorySelector;