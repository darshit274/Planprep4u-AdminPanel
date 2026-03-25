import React, { useState, useEffect } from 'react';
import { Users, BookOpen, FileText, TrendingUp, DollarSign, Activity } from 'lucide-react';
import { StatsCard } from '../../components/dashboard/StatsCard';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell
} from 'recharts';
import { useApi } from '../../hooks/useApi';
import { dashboardService } from '../../services/dashboard';
import { LoadingSpinner, CardSkeleton } from '../../components/common/LoadingSpinner';
import { ApiError, ErrorBoundary } from '../../components/common/ErrorBoundary';
import { UI_CONFIG } from '../../config/constants';
import { TestSeriesAttemptData } from '../../types';

export const Dashboard: React.FC = () => {
  const [seriesPeriod, setSeriesPeriod] = useState<'week' | 'month'>('week');

  // API hooks for data fetching
  const {
    data: stats,
    loading: statsLoading,
    error: statsError,
    refresh: refreshStats
  } = useApi(dashboardService.getStats);

  const {
    data: registrationData,
    loading: registrationLoading,
    error: registrationError
  } = useApi(() => dashboardService.getRegistrationData('month'));

  const {
    data: testAttemptData,
    loading: testAttemptLoading,
    error: testAttemptError
  } = useApi(() => dashboardService.getTestAttemptData('week'));

  const {
    data: categoryData,
    loading: categoryLoading,
    error: categoryError
  } = useApi(dashboardService.getCategoryData);

  const {
    data: recentActivity,
    loading: activityLoading,
    error: activityError
  } = useApi(() => dashboardService.getRecentActivity(5));

  const [seriesAttemptsData, setSeriesAttemptsData] = useState<TestSeriesAttemptData[] | null>(null);
  const [seriesAttemptsLoading, setSeriesAttemptsLoading] = useState(false);
  const [seriesAttemptsError, setSeriesAttemptsError] = useState<string | null>(null);

  useEffect(() => {
    setSeriesAttemptsLoading(true);
    setSeriesAttemptsError(null);
    dashboardService.getTestSeriesAttemptsData(seriesPeriod)
      .then(res => setSeriesAttemptsData(res.data ?? []))
      .catch(() => setSeriesAttemptsError('Failed to load test series data'))
      .finally(() => setSeriesAttemptsLoading(false));
  }, [seriesPeriod]);

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
          {statsLoading ? (
            Array.from({ length: 6 }).map((_, index) => (
              <CardSkeleton key={index} />
            ))
          ) : statsError ? (
            <div className="col-span-full">
              <ApiError error={statsError} onRetry={refreshStats} />
            </div>
          ) : stats ? (
            <>
              <StatsCard
                title="Total Students"
                value={stats.total_students.toLocaleString()}
                change="12%"
                changeType="increase"
                icon={Users}
                color="blue"
              />
              <StatsCard
                title="Active Today"
                value={stats.active_students_today}
                change="8%"
                changeType="increase"
                icon={Activity}
                color="green"
              />
              <StatsCard
                title="Test Series"
                value={stats.total_test_series}
                change="3 new"
                changeType="increase"
                icon={BookOpen}
                color="purple"
              />
              <StatsCard
                title="Test Attempts Today"
                value={stats.test_attempts_today}
                change="23%"
                changeType="increase"
                icon={TrendingUp}
                color="yellow"
              />
              <StatsCard
                title="PDF Resources"
                value={stats.total_pdfs}
                change="5 new"
                changeType="increase"
                icon={FileText}
                color="red"
              />
              <StatsCard
                title="Monthly Revenue"
                value={`₹${stats.monthly_revenue.toLocaleString()}`}
                change="18%"
                changeType="increase"
                icon={DollarSign}
                color="green"
              />
            </>
          ) : null}
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Student Registration Chart */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Student Registrations</h3>
            {registrationLoading ? (
              <div className="h-[300px] flex items-center justify-center">
                <LoadingSpinner text="Loading chart data..." />
              </div>
            ) : registrationError ? (
              <div className="h-[300px] flex items-center justify-center">
                <p className="text-gray-500">Failed to load registration data</p>
              </div>
            ) : registrationData ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={registrationData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar 
                    dataKey="value" 
                    fill={UI_CONFIG.CHART.COLORS.PRIMARY} 
                    radius={[4, 4, 0, 0]} 
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : null}
          </div>

          {/* Test Attempts Chart */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Test Attempts</h3>
            {testAttemptLoading ? (
              <div className="h-[300px] flex items-center justify-center">
                <LoadingSpinner text="Loading chart data..." />
              </div>
            ) : testAttemptError ? (
              <div className="h-[300px] flex items-center justify-center">
                <p className="text-gray-500">Failed to load test attempt data</p>
              </div>
            ) : testAttemptData ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={testAttemptData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke={UI_CONFIG.CHART.COLORS.SUCCESS} 
                    strokeWidth={3}
                    dot={{ fill: UI_CONFIG.CHART.COLORS.SUCCESS, strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : null}
          </div>

          {/* Category Distribution */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Test Categories</h3>
            {categoryLoading ? (
              <div className="h-[300px] flex items-center justify-center">
                <LoadingSpinner text="Loading chart data..." />
              </div>
            ) : categoryError ? (
              <div className="h-[300px] flex items-center justify-center">
                <p className="text-gray-500">Failed to load category data</p>
              </div>
            ) : categoryData ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => {
                      const colors = Object.values(UI_CONFIG.CHART.COLORS);
                      return (
                        <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                      );
                    })}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : null}
          </div>

          {/* Recent Activity */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
            {activityLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="animate-pulse flex items-center space-x-3">
                    <div className="w-2 h-2 bg-gray-200 rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded mb-1"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : activityError ? (
              <p className="text-gray-500">Failed to load recent activity</p>
            ) : recentActivity ? (
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className={`w-2 h-2 rounded-full ${
                      activity.type === 'user' ? 'bg-blue-500' :
                      activity.type === 'test' ? 'bg-green-500' : 'bg-yellow-500'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {activity.action}
                      </p>
                      <p className="text-sm text-gray-500 truncate">
                        {activity.user} • {activity.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        {/* Test Attempts by Test Series */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Test Attempts by Series</h3>
              <p className="text-sm text-gray-500 mt-0.5">Which test series students attempt the most</p>
            </div>
            <div className="flex rounded-lg border border-gray-200 overflow-hidden">
              <button
                onClick={() => setSeriesPeriod('week')}
                className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                  seriesPeriod === 'week'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                This Week
              </button>
              <button
                onClick={() => setSeriesPeriod('month')}
                className={`px-3 py-1.5 text-sm font-medium border-l border-gray-200 transition-colors ${
                  seriesPeriod === 'month'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                This Month
              </button>
            </div>
          </div>

          {seriesAttemptsLoading ? (
            <div className="h-[320px] flex items-center justify-center">
              <LoadingSpinner text="Loading series data..." />
            </div>
          ) : seriesAttemptsError ? (
            <div className="h-[320px] flex items-center justify-center text-gray-500 text-sm">
              {seriesAttemptsError}
            </div>
          ) : seriesAttemptsData && seriesAttemptsData.length > 0 ? (
            <div className="flex gap-6">
              {/* Horizontal bar chart */}
              <div className="flex-1">
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart
                    data={seriesAttemptsData}
                    layout="vertical"
                    margin={{ top: 0, right: 60, left: 8, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 12 }} />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={160}
                      tick={{ fontSize: 12 }}
                      tickFormatter={(v: string) => v.length > 22 ? `${v.slice(0, 22)}…` : v}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const d = payload[0].payload as TestSeriesAttemptData;
                        return (
                          <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm">
                            <p className="font-semibold text-gray-900 mb-2">{d.name}</p>
                            <p className="text-gray-600">Total attempts: <span className="font-medium text-blue-600">{d.total_attempts}</span></p>
                            <p className="text-gray-600">Completed: <span className="font-medium text-green-600">{d.completed_attempts}</span></p>
                            <p className="text-gray-600">Completion rate: <span className="font-medium text-yellow-600">{d.completion_rate}%</span></p>
                            {d.avg_score > 0 && (
                              <p className="text-gray-600">Avg score: <span className="font-medium text-purple-600">{d.avg_score}%</span></p>
                            )}
                          </div>
                        );
                      }}
                    />
                    <Bar dataKey="total_attempts" fill={UI_CONFIG.CHART.COLORS.PRIMARY} radius={[0, 4, 4, 0]} label={{ position: 'right', fontSize: 12 }} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Summary table */}
              <div className="w-56 shrink-0">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Top Series</p>
                <div className="space-y-3">
                  {seriesAttemptsData.slice(0, 5).map((s, i) => (
                    <div key={s.name} className="flex items-start gap-2">
                      <span className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 ${
                        i === 0 ? 'bg-yellow-500' : i === 1 ? 'bg-gray-400' : i === 2 ? 'bg-amber-600' : 'bg-blue-400'
                      }`}>
                        {i + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{s.name}</p>
                        <p className="text-xs text-gray-500">{s.total_attempts} attempts · {s.completion_rate}% done</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-[320px] flex flex-col items-center justify-center text-gray-400">
              <BookOpen className="w-10 h-10 mb-2 opacity-40" />
              <p className="text-sm">No test attempts recorded {seriesPeriod === 'week' ? 'this week' : 'this month'}</p>
            </div>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
};