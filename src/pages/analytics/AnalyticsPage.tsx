import React, { useState, useEffect } from 'react';
import { 
  Users, 
  BookOpen, 
  Trophy, 
  TrendingUp, 
  Calendar, 
  Eye, 
  Target,
  Activity,
  BarChart3,
  PieChart,
  RefreshCw,
  Download,
  Filter
} from 'lucide-react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend
} from 'recharts';
import api from '../../services/api';
import { analyticsService } from '../../services/analytics';
import toast from 'react-hot-toast';

interface AnalyticsData {
  overview: {
    total_users: number;
    active_users: number;
    total_tests: number;
    total_attempts: number;
    average_score: number;
    completion_rate: number;
  };
  user_growth: Array<{
    date: string;
    new_users: number;
    total_users: number;
  }>;
  test_performance: Array<{
    test_name: string;
    attempts: number;
    average_score: number;
    completion_rate: number;
  }>;
  score_distribution: Array<{
    range: string;
    count: number;
  }>;
  daily_activity: Array<{
    date: string;
    logins: number;
    test_attempts: number;
    registrations: number;
  }>;
  popular_categories: Array<{
    category: string;
    tests: number;
    attempts: number;
  }>;
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

// Safe number formatting helper
const formatNumber = (value: number | undefined | null): string => {
  if (value === undefined || value === null || isNaN(value)) {
    return '0';
  }
  return value.toLocaleString();
};

// Safe percentage formatting helper
const formatPercentage = (value: number | undefined | null): string => {
  if (value === undefined || value === null || isNaN(value)) {
    return '0.0';
  }
  return value.toFixed(1);
};

export const AnalyticsPage: React.FC = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('7d');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadAnalytics();
  }, [dateRange]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const response = await analyticsService.getAnalytics({ range: dateRange });
      if (response.success && response.data) {
        // Validate and merge with defaults to ensure all properties exist
        const validatedData: AnalyticsData = {
          overview: {
            total_users: response.data.overview?.total_users ?? 0,
            active_users: response.data.overview?.active_users ?? 0,
            total_tests: response.data.overview?.total_tests ?? 0,
            total_attempts: response.data.overview?.total_attempts ?? 0,
            average_score: response.data.overview?.average_score ?? 0,
            completion_rate: response.data.overview?.completion_rate ?? 0
          },
          user_growth: response.data.user_growth || [],
          test_performance: response.data.test_performance || [],
          score_distribution: response.data.score_distribution || [],
          daily_activity: response.data.daily_activity || [],
          popular_categories: response.data.popular_categories || []
        };
        setData(validatedData);
      } else {
        // Fallback to mock data if API response is incomplete
        console.warn('Analytics API returned no data, using mock data');
        setData(mockData);
      }
    } catch (error: any) {
      console.error('Error loading analytics:', error);
      toast.error('Failed to load analytics data');
      setData(mockData); // Use mock data as fallback
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAnalytics();
    setRefreshing(false);
    toast.success('Analytics data refreshed');
  };

  const handleExport = async () => {
    try {
      const blob = await analyticsService.exportAnalytics({ 
        range: dateRange, 
        format: 'csv' 
      });
      
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `analytics_${dateRange}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('Analytics data exported successfully');
    } catch (error: any) {
      console.error('Export error:', error);
      toast.error('Failed to export analytics data');
    }
  };

  // Mock data for demonstration
  const mockData: AnalyticsData = {
    overview: {
      total_users: 1250,
      active_users: 890,
      total_tests: 45,
      total_attempts: 3420,
      average_score: 78.5,
      completion_rate: 85.2
    },
    user_growth: [
      { date: '2024-01-01', new_users: 25, total_users: 1000 },
      { date: '2024-01-02', new_users: 32, total_users: 1032 },
      { date: '2024-01-03', new_users: 28, total_users: 1060 },
      { date: '2024-01-04', new_users: 45, total_users: 1105 },
      { date: '2024-01-05', new_users: 38, total_users: 1143 },
      { date: '2024-01-06', new_users: 52, total_users: 1195 },
      { date: '2024-01-07', new_users: 55, total_users: 1250 }
    ],
    test_performance: [
      { test_name: 'GPSC Preliminary', attempts: 450, average_score: 82.3, completion_rate: 89.1 },
      { test_name: 'PSI Mock Test', attempts: 380, average_score: 75.6, completion_rate: 92.4 },
      { test_name: 'NCERT Science', attempts: 290, average_score: 68.9, completion_rate: 78.3 },
      { test_name: 'JEE Practice', attempts: 520, average_score: 71.2, completion_rate: 85.8 },
      { test_name: 'NEET Biology', attempts: 340, average_score: 79.4, completion_rate: 88.7 }
    ],
    score_distribution: [
      { range: '0-20', count: 45 },
      { range: '21-40', count: 120 },
      { range: '41-60', count: 280 },
      { range: '61-80', count: 450 },
      { range: '81-100', count: 320 }
    ],
    daily_activity: [
      { date: '2024-01-01', logins: 320, test_attempts: 180, registrations: 25 },
      { date: '2024-01-02', logins: 395, test_attempts: 220, registrations: 32 },
      { date: '2024-01-03', logins: 368, test_attempts: 195, registrations: 28 },
      { date: '2024-01-04', logins: 440, test_attempts: 285, registrations: 45 },
      { date: '2024-01-05', logins: 412, test_attempts: 265, registrations: 38 },
      { date: '2024-01-06', logins: 485, test_attempts: 310, registrations: 52 },
      { date: '2024-01-07', logins: 520, test_attempts: 340, registrations: 55 }
    ],
    popular_categories: [
      { category: 'GPSC', tests: 12, attempts: 1250 },
      { category: 'PSI', tests: 8, attempts: 890 },
      { category: 'NCERT', tests: 15, attempts: 750 },
      { category: 'JEE', tests: 6, attempts: 520 },
      { category: 'NEET', tests: 4, attempts: 340 }
    ]
  };

  // Ensure analytics always has valid data with all required properties
  const analytics: AnalyticsData = data || mockData;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600">Comprehensive insights into your platform's performance</p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          <button
            onClick={handleExport}
            className="btn-secondary inline-flex items-center"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
          <button
            onClick={handleRefresh}
            className="btn-primary inline-flex items-center"
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-primary-100">
              <Users className="h-6 w-6 text-primary-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatNumber(analytics.overview.total_users)}
              </p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100">
              <Activity className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Users</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatNumber(analytics.overview.active_users)}
              </p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-primary-100">
              <BookOpen className="h-6 w-6 text-primary-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Tests</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatNumber(analytics.overview.total_tests)}
              </p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100">
              <Eye className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Test Attempts</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatNumber(analytics.overview.total_attempts)}
              </p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-primary-100">
              <Trophy className="h-6 w-6 text-primary-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg Score</p>
              <p className="text-2xl font-bold text-gray-900">
                {analytics.overview.average_score?.toFixed(1) ?? '0.0'}%
              </p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-pink-100">
              <Target className="h-6 w-6 text-pink-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Completion Rate</p>
              <p className="text-2xl font-bold text-gray-900">
                {analytics.overview.completion_rate?.toFixed(1) ?? '0.0'}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Growth Chart */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">User Growth</h3>
            <TrendingUp className="h-5 w-5 text-gray-400" />
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={analytics.user_growth}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(value) => new Date(value).toLocaleDateString()}
              />
              <YAxis />
              <Tooltip 
                labelFormatter={(value) => new Date(value).toLocaleDateString()}
                formatter={(value: number, name: string) => [value, name === 'new_users' ? 'New Users' : 'Total Users']}
              />
              <Area 
                type="monotone" 
                dataKey="total_users" 
                stackId="1" 
                stroke="#3B82F6" 
                fill="#3B82F6" 
                fillOpacity={0.3}
              />
              <Area 
                type="monotone" 
                dataKey="new_users" 
                stackId="1" 
                stroke="#10B981" 
                fill="#10B981" 
                fillOpacity={0.6}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Daily Activity Chart */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Daily Activity</h3>
            <Activity className="h-5 w-5 text-gray-400" />
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analytics.daily_activity}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(value) => new Date(value).toLocaleDateString()}
              />
              <YAxis />
              <Tooltip 
                labelFormatter={(value) => new Date(value).toLocaleDateString()}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="logins" 
                stroke="#3B82F6" 
                strokeWidth={2}
                name="Logins"
              />
              <Line 
                type="monotone" 
                dataKey="test_attempts" 
                stroke="#10B981" 
                strokeWidth={2}
                name="Test Attempts"
              />
              <Line 
                type="monotone" 
                dataKey="registrations" 
                stroke="#F59E0B" 
                strokeWidth={2}
                name="Registrations"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Score Distribution */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Score Distribution</h3>
            <PieChart className="h-5 w-5 text-gray-400" />
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <RechartsPieChart>
              <Pie
                data={analytics.score_distribution}
                cx="50%"
                cy="50%"
                outerRadius={100}
                fill="#8884d8"
                dataKey="count"
                nameKey="range"
                label={({ range, count }) => `${range}: ${count}`}
              >
                {Array.isArray(analytics.score_distribution) ? analytics.score_distribution.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                )) : null}
              </Pie>
              <Tooltip />
            </RechartsPieChart>
          </ResponsiveContainer>
        </div>

        {/* Popular Categories */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Popular Categories</h3>
            <BarChart3 className="h-5 w-5 text-gray-400" />
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics.popular_categories}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="tests" fill="#3B82F6" name="Tests" />
              <Bar dataKey="attempts" fill="#10B981" name="Attempts" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Test Performance Table */}
      <div className="card">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Test Performance</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Test Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Attempts
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Average Score
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Completion Rate
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {Array.isArray(analytics.test_performance) && analytics.test_performance.length > 0 ? analytics.test_performance.map((test, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{test.test_name || 'N/A'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{formatNumber(test.attempts)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{formatPercentage(test.average_score)}%</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{formatPercentage(test.completion_rate)}%</div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                    No test performance data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};