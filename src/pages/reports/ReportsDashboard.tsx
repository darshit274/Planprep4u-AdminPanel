import React, { useState, useEffect } from 'react';
import {
  Clock,
  Eye,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { reportsService } from '../../services/reports';
import { QuestionReportCard } from '../../components/reports/QuestionReportCard';
import { StatsCard } from '../../components/dashboard/StatsCard';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Pagination } from '../../components/common/Pagination';
import { ConfirmModal } from '../../components/modals/ConfirmModal';
import {
  ReportsFilterParams,
  ReportsDashboardResponse,
} from '../../types/reports';

export const ReportsDashboard: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<ReportsDashboardResponse | null>(null);
  const [filters, setFilters] = useState<ReportsFilterParams>({
    status: 'all',
    reportType: 'all',
    search: '',
    sortBy: 'reportCount',
    page: 1,
    limit: 20,
  });

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    questionId: number | null;
  }>({
    isOpen: false,
    questionId: null,
  });

  const fetchDashboardData = async (showLoadingSpinner = true) => {
    try {
      if (showLoadingSpinner) {
        setIsLoading(true);
      } else {
        setIsRefreshing(true);
      }

      const response = await reportsService.getDashboard(filters);

      if (response.success) {
        setDashboardData(response.data);
      } else {
        toast.error(response.message || 'Failed to load reports dashboard');
      }
    } catch (error: any) {
      console.error('Error fetching dashboard data:', error);
      toast.error(
        error.response?.data?.message || 'Failed to load reports dashboard'
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [filters]);

  const handleFilterChange = (
    field: keyof ReportsFilterParams,
    value: any
  ) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
      page: field === 'page' ? value : 1, // Reset to page 1 when other filters change
    }));
  };

  const handleRefresh = () => {
    fetchDashboardData(false);
  };

  const handleBulkResolveClick = (questionId: number) => {
    setConfirmModal({
      isOpen: true,
      questionId,
    });
  };

  const handleBulkResolve = async () => {
    const { questionId } = confirmModal;
    if (!questionId) return;

    setConfirmModal({ isOpen: false, questionId: null });

    try {
      const response = await reportsService.bulkUpdateReports(questionId, {
        action: 'resolve_all',
        filterStatus: 'pending',
      });

      if (response.success) {
        toast.success(
          `${response.data.updatedCount} report(s) marked as resolved`
        );
        fetchDashboardData(false); // Refresh data
      } else {
        toast.error(response.message || 'Failed to update reports');
      }
    } catch (error: any) {
      console.error('Error bulk resolving reports:', error);
      toast.error(
        error.response?.data?.message || 'Failed to update reports'
      );
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner text="Loading reports dashboard..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Question Reports Dashboard
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Review and manage user-reported question issues
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <RefreshCw
            className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`}
          />
          Refresh
        </button>
      </div>

      {/* Summary Stats Cards */}
      {dashboardData?.summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Pending Reports"
            value={dashboardData.summary.totalPending}
            icon={Clock}
            color="yellow"
          />
          <StatsCard
            title="Under Review"
            value={dashboardData.summary.totalUnderReview}
            icon={Eye}
            color="blue"
          />
          <StatsCard
            title="Resolved"
            value={dashboardData.summary.totalResolved}
            icon={CheckCircle}
            color="green"
          />
          <StatsCard
            title="Rejected"
            value={dashboardData.summary.totalRejected}
            icon={XCircle}
            color="red"
          />
        </div>
      )}

      {/* Filters Bar */}
      <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={filters.status || 'all'}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-sm"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="under_review">Under Review</option>
              <option value="resolved">Resolved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {/* Report Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Report Type
            </label>
            <select
              value={filters.reportType || 'all'}
              onChange={(e) => handleFilterChange('reportType', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-sm"
            >
              <option value="all">All Types</option>
              <option value="wrong_question">Wrong Question</option>
              <option value="wrong_solution">Wrong Solution</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Sort By Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sort By
            </label>
            <select
              value={filters.sortBy || 'reportCount'}
              onChange={(e) => handleFilterChange('sortBy', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-sm"
            >
              <option value="reportCount">Most Reports</option>
              <option value="latest">Latest Reports</option>
              <option value="oldest">Oldest Reports</option>
            </select>
          </div>

          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search question text..."
                value={filters.search || ''}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-sm"
              />
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Results Info */}
      {dashboardData && (
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div>
            Showing{' '}
            <span className="font-medium">
              {dashboardData.questions.length}
            </span>{' '}
            of{' '}
            <span className="font-medium">
              {dashboardData.pagination.totalItems}
            </span>{' '}
            questions with reports
          </div>
        </div>
      )}

      {/* Question Cards */}
      {dashboardData && dashboardData.questions.length > 0 ? (
        <div className="space-y-4">
          {dashboardData.questions.map((question) => (
            <QuestionReportCard
              key={question.questionId}
              question={question}
              onBulkResolve={handleBulkResolveClick}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <div className="text-gray-400 mb-3">
            <Filter className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">
            No reports found
          </h3>
          <p className="text-sm text-gray-500">
            {filters.status !== 'all' || filters.reportType !== 'all' || filters.search
              ? 'Try adjusting your filters to see more results'
              : 'There are no question reports at this time'}
          </p>
        </div>
      )}

      {/* Pagination */}
      {dashboardData && dashboardData.pagination.totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination
            currentPage={dashboardData.pagination.currentPage}
            totalPages={dashboardData.pagination.totalPages}
            onPageChange={(page) => handleFilterChange('page', page)}
          />
        </div>
      )}

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, questionId: null })}
        onConfirm={handleBulkResolve}
        title="Mark All as Resolved"
        message="Are you sure you want to mark all pending reports for this question as resolved?"
        confirmText="Mark Resolved"
        cancelText="Cancel"
        type="info"
      />
    </div>
  );
};
