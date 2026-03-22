import React from 'react';
import { 
  GraduationCap, 
  BookOpen, 
  HelpCircle, 
  FileText, 
  Users, 
  Award,
  TrendingUp,
  CheckCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const NewDashboard: React.FC = () => {
  const navigate = useNavigate();

  const platformSections = [
    {
      title: 'Exam Types',
      description: 'Manage exam categories (PSI, GPSC, DSO, etc.)',
      icon: Award,
      color: 'bg-blue-500',
      path: '/exam-types',
      status: 'ready',
      count: '0'
    },
    {
      title: 'Subjects & Hierarchy',
      description: 'Manage subjects with hierarchical structure (NCERT → Classes → Chapters)',
      icon: BookOpen,
      color: 'bg-green-500',
      path: '/subjects',
      status: 'development',
      count: '0'
    },
    {
      title: 'Exam-wise Test Series',
      description: 'Mock test series for specific exams (DSO, PSI Mock Series)',
      icon: GraduationCap,
      color: 'bg-purple-500',
      path: '/exam-test-series',
      status: 'development',
      count: '0'
    },
    {
      title: 'Topic-wise Test Series',
      description: 'Subject/topic based test series with hierarchical structure',
      icon: BookOpen,
      color: 'bg-indigo-500',
      path: '/topic-test-series',
      status: 'development',
      count: '0'
    },
    {
      title: 'Free Tests',
      description: 'Free practice tests and quizzes for students',
      icon: HelpCircle,
      color: 'bg-teal-500',
      path: '/free-tests',
      status: 'development',
      count: '0'
    },
    {
      title: 'Previous Year Questions',
      description: 'Authentic PYQs from past exams',
      icon: FileText,
      color: 'bg-orange-500',
      path: '/pyqs',
      status: 'development',
      count: '0'
    }
  ];

  const features = [
    'Exam-wise test series (e.g., PSI Mock Series with 10 tests)',
    'Topic-wise test series with hierarchical structure (NCERT → Class → Chapter)',
    'Free evaluation tests within each paid series',
    'Multi-language support for questions',
    'Pause & Resume test functionality',
    'One-time completion tests for high-stakes',
    'Negative marking configuration',
    'Grid view navigation during tests',
    'Detailed solutions with "Show Answer" feature',
    'Score cards and leaderboards',
    'PDF resources linked to tests',
    'Previous Year Questions (PYQs) management'
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ready':
        return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Ready</span>;
      case 'development':
        return <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">In Development</span>;
      default:
        return <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">Planned</span>;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center mb-4">
          <GraduationCap className="h-12 w-12 text-primary-600 mr-3" />
          <h1 className="text-3xl font-bold text-gray-900">PlanPrep4u Educational Platform</h1>
        </div>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Complete admin dashboard for managing your comprehensive educational platform with 
          exam-wise and topic-wise test series structure
        </p>
      </div>

      {/* Platform Features Overview */}
      <div className="card p-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6 text-center">
          🎯 Platform Features Based on Documentation
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {features.map((feature, index) => (
            <div key={index} className="flex items-start space-x-3">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
              <span className="text-gray-700">{feature}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Management Sections */}
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">Content Management Sections</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {platformSections.map((section, index) => {
            const Icon = section.icon;
            return (
              <div key={index} className="card hover:shadow-lg transition-shadow cursor-pointer"
                   onClick={() => section.status === 'ready' && navigate(section.path)}>
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center">
                      <div className={`p-3 rounded-lg ${section.color} bg-opacity-10`}>
                        <Icon className={`h-8 w-8 ${section.color.replace('bg-', 'text-')}`} />
                      </div>
                      <div className="ml-3">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {section.title}
                        </h3>
                      </div>
                    </div>
                    {getStatusBadge(section.status)}
                  </div>

                  <p className="text-sm text-gray-600 mb-4">
                    {section.description}
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-sm text-gray-500">
                      <TrendingUp className="h-4 w-4 mr-1" />
                      <span>{section.count} items</span>
                    </div>
                    {section.status === 'ready' ? (
                      <button className="text-primary-600 hover:text-primary-800 text-sm font-medium">
                        Manage →
                      </button>
                    ) : (
                      <span className="text-gray-400 text-sm">Coming soon</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Current Status */}
      <div className="card p-6 bg-blue-50 border-blue-200">
        <div className="flex items-start space-x-4">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Users className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-blue-900 mb-2">
              🚀 Implementation Status
            </h3>
            <div className="text-blue-800 space-y-1">
              <p>✅ <strong>Exam Types Management:</strong> Fully implemented and ready to use</p>
              <p>🔧 <strong>Subjects & Hierarchy:</strong> Database models created, UI in development</p>
              <p>⏳ <strong>Test Series Management:</strong> Being restructured according to documentation</p>
              <p>📋 <strong>Multi-language Questions:</strong> Database structure ready</p>
            </div>
            <div className="mt-4 p-4 bg-white rounded-lg border">
              <h4 className="font-semibold text-blue-900 mb-2">Next Steps:</h4>
              <ol className="list-decimal list-inside text-blue-800 space-y-1">
                <li>Start with <strong>Exam Types</strong> - create your exam categories (PSI, GPSC, etc.)</li>
                <li>Set up <strong>Subjects</strong> with hierarchical structure</li>
                <li>Create <strong>Test Series</strong> following the documentation structure</li>
                <li>Add <strong>Questions</strong> with multi-language support</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};