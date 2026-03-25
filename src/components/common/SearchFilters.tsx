import React from 'react';
import { MagnifyingGlassIcon, FunnelIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface FilterOption {
  label: string;
  value: string;
}

interface Filter {
  key: string;
  label: string;
  type: 'select' | 'text' | 'date';
  options?: FilterOption[];
  placeholder?: string;
  value: string;
}

interface SearchFiltersProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  filters: Filter[];
  onFilterChange: (key: string, value: string) => void;
  onClearFilters?: () => void;
  showClearFilters?: boolean;
  className?: string;
}

export const SearchFilters: React.FC<SearchFiltersProps> = ({
  searchValue,
  onSearchChange,
  filters,
  onFilterChange,
  onClearFilters,
  showClearFilters = true,
  className = '',
}) => {
  const hasActiveFilters = filters.some(filter => filter.value && filter.value !== 'all');

  const renderFilter = (filter: Filter) => {
    switch (filter.type) {
      case 'select':
        return (
          <select
            key={filter.key}
            value={filter.value}
            onChange={(e) => onFilterChange(filter.key, e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
          >
            <option value="all">All {filter.label}</option>
            {filter.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );
      
      case 'text':
        return (
          <input
            key={filter.key}
            type="text"
            placeholder={filter.placeholder || `Filter by ${filter.label.toLowerCase()}`}
            value={filter.value}
            onChange={(e) => onFilterChange(filter.key, e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
          />
        );
      
      case 'date':
        return (
          <input
            key={filter.key}
            type="date"
            value={filter.value}
            onChange={(e) => onFilterChange(filter.key, e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
          />
        );
      
      default:
        return null;
    }
  };

  return (
    <div className={`p-4 border-b border-gray-200 bg-white ${className}`}>
      <div className="flex flex-col gap-4">
        {/* Search bar */}
        <div className="flex-1">
          <div className="relative">
            <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        {/* Filters */}
        {filters.length > 0 && (
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1 text-sm font-medium text-gray-700">
              <FunnelIcon className="h-4 w-4" />
              Filters:
            </div>
            
            {filters.map(renderFilter)}
            
            {/* Clear filters button */}
            {showClearFilters && (hasActiveFilters || searchValue) && onClearFilters && (
              <button
                onClick={onClearFilters}
                className="flex items-center gap-1 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
              >
                <XMarkIcon className="h-4 w-4" />
                Clear filters
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};