import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeftIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import { testManagementService } from '../services/test-management.service';
import HTMLContent from '../components/common/HTMLContent';

const TestSeriesDetailPageNew: React.FC = () => {
  const { testSeriesUuid } = useParams<{ testSeriesUuid: string }>();
  const navigate = useNavigate();

  // Data fetching for test series only (categories now handled by dynamic hierarchy)
  const { data: testSeries, isLoading, error } = useQuery({
    queryKey: ['testSeries', testSeriesUuid],
    queryFn: () => testManagementService.testSeries.getById(testSeriesUuid!),
    enabled: !!testSeriesUuid,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            Error loading test series: {(error as any).message}
          </div>
          <button
            onClick={() => navigate('/test-management')}
            className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700"
          >
            Back to Test Management
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center space-x-2 text-sm">
        <Link to="/test-management" className="text-primary-600 hover:text-primary-800">
          Test Management
        </Link>
        <span className="text-gray-400">/</span>
        <span className="text-gray-600">{testSeries?.name}</span>
      </nav>

      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/test-management')}
            className="p-2 text-gray-600 hover:text-gray-800"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <div>
            <HTMLContent as="h1" className="text-2xl font-bold text-gray-900" content={testSeries?.name} />
            <HTMLContent as="p" className="text-gray-600 mt-1" content={testSeries?.description} />
          </div>
        </div>
        <button
          onClick={() => navigate(`/simple-hierarchy/${testSeriesUuid}`)}
          className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 flex items-center gap-2"
        >
          <ChartBarIcon className="h-5 w-5" />
          Manage Categories
        </button>
      </div>

      {/* Test Series Details */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Test Series Details</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-sm text-gray-500">Name:</span>
              <HTMLContent as="p" className="font-medium" content={testSeries?.name} />
            </div>
            <div>
              <span className="text-sm text-gray-500">Status:</span>
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${testSeries?.is_active
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
                }`}>
                {testSeries?.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div>
              <span className="text-sm text-gray-500">Pricing:</span>
              <p className="font-medium capitalize">{testSeries?.pricing_type}</p>
            </div>
            <div>
              <span className="text-sm text-gray-500">Price:</span>
              <p className="font-medium">{testSeries?.price} {testSeries?.currency}</p>
            </div>
            {testSeries?.description && (
              <div className="col-span-2">
                <span className="text-sm text-gray-500">Description:</span>
                <HTMLContent as="p" className="font-medium" content={testSeries?.description} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dynamic Hierarchy Notice */}
      <div className="bg-primary-50 border border-primary-200 rounded-lg p-6">
        <div className="flex items-center">
          <ChartBarIcon className="h-6 w-6 text-primary-600 mr-3" />
          <div>
            <h3 className="text-lg font-medium text-primary-900">Dynamic Hierarchy System</h3>
            <p className="text-primary-700 mt-1">
              This test series now uses the new dynamic hierarchy system. Click "Manage Categories" to create and organize your test structure with flexible categories and questions.
            </p>
            <ul className="text-sm text-primary-600 mt-2 space-y-1">
              <li>• Categories can contain subcategories OR questions, not both</li>
              <li>• Unlimited nesting levels with proper constraint enforcement</li>
              <li>• Real-time statistics and progress tracking</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestSeriesDetailPageNew;