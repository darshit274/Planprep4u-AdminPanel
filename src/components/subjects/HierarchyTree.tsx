import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Plus, Edit, Trash2, FileText, Users, MoreVertical } from 'lucide-react';
import { SubjectHierarchy } from '../../services/subjectService';

interface HierarchyTreeProps {
  hierarchies: SubjectHierarchy[];
  onCreateChild: (parent: SubjectHierarchy | null) => void;
  onEdit: (hierarchy: SubjectHierarchy) => void;
  onDelete: (hierarchy: SubjectHierarchy) => void;
  onViewTestSeries: (hierarchy: SubjectHierarchy) => void;
  level?: number;
}

const levelColors = {
  standard: 'bg-primary-50 border-primary-200 text-primary-800',
  class: 'bg-green-50 border-green-200 text-green-800',
  chapter: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  topic: 'bg-primary-50 border-primary-200 text-primary-800'
};

const levelIcons = {
  standard: '📚',
  class: '🎓',
  chapter: '📖',
  topic: '📝'
};

export const HierarchyTree: React.FC<HierarchyTreeProps> = ({
  hierarchies,
  onCreateChild,
  onEdit,
  onDelete,
  onViewTestSeries,
  level = 0
}) => {
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());

  const toggleExpanded = (id: number) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  const HierarchyItem: React.FC<{ hierarchy: SubjectHierarchy }> = ({ hierarchy }) => {
    const hasChildren = hierarchy.children && hierarchy.children.length > 0;
    const isExpanded = expandedItems.has(hierarchy.id);
    const indentLevel = level * 20;

    return (
      <div className="hierarchy-item">
        <div 
          className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-all duration-200 group"
          style={{ marginLeft: `${indentLevel}px` }}
        >
          <div className="flex items-center flex-1">
            {hasChildren ? (
              <button
                onClick={() => toggleExpanded(hierarchy.id)}
                className="p-1 hover:bg-gray-100 rounded mr-2 transition-colors"
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-gray-600" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-gray-600" />
                )}
              </button>
            ) : (
              <div className="w-6 h-6 mr-2" />
            )}

            <div className="flex items-center">
              <span className="text-lg mr-2">
                {levelIcons[hierarchy.level_type]}
              </span>
              <span className={`px-2 py-1 text-xs font-medium rounded-full border ${levelColors[hierarchy.level_type]}`}>
                {hierarchy.level_type}
              </span>
            </div>

            <div className="ml-3 flex-1">
              <h4 className="font-medium text-gray-900 group-hover:text-primary-600 transition-colors">
                {hierarchy.level_name}
              </h4>
              {hierarchy.description && (
                <p className="text-sm text-gray-500 truncate max-w-md">
                  {hierarchy.description}
                </p>
              )}
            </div>

            <div className="flex items-center space-x-4 text-sm text-gray-500">
              {hierarchy.testSeriesCount !== undefined && (
                <div className="flex items-center">
                  <FileText className="h-4 w-4 mr-1" />
                  <span>{hierarchy.testSeriesCount} tests</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onCreateChild(hierarchy)}
              className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
              title="Add child"
            >
              <Plus className="h-4 w-4" />
            </button>
            <button
              onClick={() => onViewTestSeries(hierarchy)}
              className="p-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
              title="View test series"
            >
              <FileText className="h-4 w-4" />
            </button>
            <div className="relative group/menu">
              <button className="p-2 text-gray-600 hover:text-gray-800 rounded-lg transition-colors">
                <MoreVertical className="h-4 w-4" />
              </button>
              <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all duration-200 z-10">
                <div className="py-1">
                  <button
                    onClick={() => onEdit(hierarchy)}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </button>
                  <button
                    onClick={() => onCreateChild(hierarchy)}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Child
                  </button>
                  <button
                    onClick={() => onViewTestSeries(hierarchy)}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Test Series
                  </button>
                  <div className="border-t border-gray-100"></div>
                  <button
                    onClick={() => onDelete(hierarchy)}
                    className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div className="mt-2 space-y-2">
            <HierarchyTree
              hierarchies={hierarchy.children!}
              onCreateChild={onCreateChild}
              onEdit={onEdit}
              onDelete={onDelete}
              onViewTestSeries={onViewTestSeries}
              level={level + 1}
            />
          </div>
        )}
      </div>
    );
  };

  if (!hierarchies || hierarchies.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-400 mb-2">
          <FileText className="h-12 w-12 mx-auto" />
        </div>
        <p className="text-gray-600">No hierarchy items found</p>
        <button
          onClick={() => onCreateChild(null)}
          className="mt-4 inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add First Item
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {hierarchies.map((hierarchy) => (
        <HierarchyItem key={hierarchy.id} hierarchy={hierarchy} />
      ))}
    </div>
  );
};