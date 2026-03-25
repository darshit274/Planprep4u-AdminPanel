import React from 'react';
import { BookOpen, Layers, FileText, Edit, Trash2, Calendar, MoreVertical, TreePine } from 'lucide-react';
import { Subject } from '../../services/subjectService';

interface SubjectCardProps {
  subject: Subject;
  onEdit: (subject: Subject) => void;
  onDelete: (subject: Subject) => void;
  onManageHierarchy: (subject: Subject) => void;
  onViewTestSeries: (subject: Subject) => void;
}

export const SubjectCard: React.FC<SubjectCardProps> = ({
  subject,
  onEdit,
  onDelete,
  onManageHierarchy,
  onViewTestSeries
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 group">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-primary-50">
              <BookOpen className="h-6 w-6 text-primary-600" />
            </div>
            <div className="ml-3">
              <div className="flex items-center">
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                  {subject.name}
                </h3>
                <span className="ml-2 px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">
                  {subject.code}
                </span>
                {subject.has_hierarchy && (
                  <span className="ml-2 px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full flex items-center">
                    <TreePine className="h-3 w-3 mr-1" />
                    Hierarchical
                  </span>
                )}
              </div>
              <div className="flex items-center mt-1">
                <Calendar className="h-4 w-4 text-gray-400 mr-1" />
                <span className="text-sm text-gray-500">
                  Created {formatDate(subject.created_at)}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
              subject.is_active 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {subject.is_active ? 'Active' : 'Inactive'}
            </span>
            <div className="relative group/menu">
              <button className="p-1 text-gray-400 hover:text-gray-600 rounded">
                <MoreVertical className="h-4 w-4" />
              </button>
              <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all duration-200 z-10">
                <div className="py-1">
                  <button
                    onClick={() => onEdit(subject)}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Details
                  </button>
                  {subject.has_hierarchy && (
                    <button
                      onClick={() => onManageHierarchy(subject)}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <Layers className="h-4 w-4 mr-2" />
                      Manage Hierarchy
                    </button>
                  )}
                  <button
                    onClick={() => onViewTestSeries(subject)}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    View Test Series
                  </button>
                  <div className="border-t border-gray-100"></div>
                  <button
                    onClick={() => onDelete(subject)}
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

        {/* Description */}
        {subject.description && (
          <p className="text-sm text-gray-600 mb-4 line-clamp-3 leading-relaxed">
            {subject.description}
          </p>
        )}

        {/* Statistics */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          {subject.has_hierarchy && (
            <div className="bg-primary-50 rounded-lg p-3">
              <div className="flex items-center">
                <Layers className="h-5 w-5 text-primary-600 mr-2" />
                <div>
                  <p className="text-sm font-medium text-primary-900">Hierarchies</p>
                  <p className="text-lg font-bold text-primary-600">
                    {subject.hierarchies?.length || 0}
                  </p>
                </div>
              </div>
            </div>
          )}
          <div className="bg-green-50 rounded-lg p-3">
            <div className="flex items-center">
              <FileText className="h-5 w-5 text-green-600 mr-2" />
              <div>
                <p className="text-sm font-medium text-green-900">Test Series</p>
                <p className="text-lg font-bold text-green-600">
                  {subject.testSeriesCount || 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-2">
          {subject.has_hierarchy && (
            <button
              onClick={() => onManageHierarchy(subject)}
              className="flex-1 bg-primary-50 hover:bg-primary-100 text-primary-700 font-medium py-2 px-3 rounded-lg transition-colors duration-200 inline-flex items-center justify-center"
            >
              <Layers className="h-4 w-4 mr-2" />
              Hierarchy
            </button>
          )}
          <button
            onClick={() => onViewTestSeries(subject)}
            className="flex-1 bg-green-50 hover:bg-green-100 text-green-700 font-medium py-2 px-3 rounded-lg transition-colors duration-200 inline-flex items-center justify-center"
          >
            <FileText className="h-4 w-4 mr-2" />
            Tests
          </button>
          <button
            onClick={() => onEdit(subject)}
            className="p-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors duration-200"
          >
            <Edit className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};