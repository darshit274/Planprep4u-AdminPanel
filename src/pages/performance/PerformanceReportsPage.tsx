import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Clock, 
  Target, 
  Award,
  Filter,
  Download,
  RefreshCw,
  Search,
  Calendar,
  BookOpen,
  BarChart3
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
  BarChart,
  Bar,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import api from '../../services/api';
import toast from 'react-hot-toast';

interface PerformanceData {
  summary: {
    total_students: number;
    active_students: number;
    average_performance: number;
    improvement_rate: number;
    completion_rate: number;
    average_time_spent: number;
  };
  student_performance: Array<{
    student_id: number;
    name: string;
    email: string;
    tests_taken: number;
    average_score: number;
    improvement: number;
    last_activity: string;
    performance_trend: 'up' | 'down' | 'stable';
  }>;
  test_performance: Array<{
    test_name: string;
    category: string;
    total_attempts: number;
    average_score: number;
    pass_rate: number;
    difficulty_rating: number;
  }>;
  performance_trends: Array<{
    date: string;
    average_score: number;
    participation_rate: number;
    completion_rate: number;
  }>;
  subject_performance: Array<{
    subject: string;
    average_score: number;
    tests_count: number;
    student_count: number;
    difficulty: number;
    engagement: number;
  }>;
  time_analytics: Array<{
    hour: number;
    attempts: number;
    average_score: number;
  }>;
}

export const PerformanceReportsPage: React.FC = () => {
  const [data, setData] = useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    dateRange: '30d',
    category: '',
    minScore: 0,
    maxScore: 100
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('average_score');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    loadPerformanceData();
  }, [filters]);

  const loadPerformanceData = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/performance', {
        params: filters
      });
      setData(response.data.data);
    } catch (error: any) {
      console.error('Error loading performance data:', error);
      toast.error('Failed to load performance data');
      setData(mockData); // Use mock data for demonstration
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const response = await api.get('/admin/performance/export', {
        params: { ...filters, format: 'csv' },
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `performance_report_${filters.dateRange}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('Performance report exported successfully');
    } catch (error: any) {
      console.error('Export error:', error);
      toast.error('Failed to export performance report');
    }
  };

  // Mock data for demonstration
  const mockData: PerformanceData = {
    summary: {
      total_students: 1250,
      active_students: 890,
      average_performance: 78.5,
      improvement_rate: 12.4,
      completion_rate: 85.2,
      average_time_spent: 45.8
    },
    student_performance: [
      {
        student_id: 1,
        name: 'Rahul Sharma',
        email: 'rahul@example.com',
        tests_taken: 25,
        average_score: 89.5,
        improvement: 15.2,
        last_activity: '2024-01-07',
        performance_trend: 'up'
      },
      {
        student_id: 2,
        name: 'Priya Patel',
        email: 'priya@example.com',
        tests_taken: 32,
        average_score: 85.3,
        improvement: 8.7,
        last_activity: '2024-01-06',
        performance_trend: 'up'
      },
      {
        student_id: 3,
        name: 'Amit Kumar',
        email: 'amit@example.com',
        tests_taken: 18,
        average_score: 72.1,
        improvement: -3.2,
        last_activity: '2024-01-05',
        performance_trend: 'down'
      },
      {
        student_id: 4,
        name: 'Sneha Singh',
        email: 'sneha@example.com',
        tests_taken: 28,
        average_score: 91.2,
        improvement: 22.1,
        last_activity: '2024-01-07',
        performance_trend: 'up'
      },
      {
        student_id: 5,
        name: 'Vikash Gupta',
        email: 'vikash@example.com',
        tests_taken: 15,
        average_score: 68.9,
        improvement: 1.5,
        last_activity: '2024-01-04',
        performance_trend: 'stable'
      }
    ],
    test_performance: [
      { test_name: 'GPSC Preliminary', category: 'GPSC', total_attempts: 450, average_score: 82.3, pass_rate: 78.5, difficulty_rating: 7.2 },
      { test_name: 'PSI Mock Test', category: 'PSI', total_attempts: 380, average_score: 75.6, pass_rate: 68.9, difficulty_rating: 8.1 },
      { test_name: 'NCERT Science', category: 'NCERT', total_attempts: 290, average_score: 68.9, pass_rate: 62.4, difficulty_rating: 6.8 },
      { test_name: 'JEE Practice', category: 'JEE', total_attempts: 520, average_score: 71.2, pass_rate: 65.2, difficulty_rating: 8.7 },
      { test_name: 'NEET Biology', category: 'NEET', total_attempts: 340, average_score: 79.4, pass_rate: 72.8, difficulty_rating: 7.5 }
    ],
    performance_trends: [
      { date: '2024-01-01', average_score: 75.2, participation_rate: 82.1, completion_rate: 78.5 },
      { date: '2024-01-02', average_score: 76.8, participation_rate: 84.3, completion_rate: 80.2 },
      { date: '2024-01-03', average_score: 74.5, participation_rate: 79.8, completion_rate: 76.9 },
      { date: '2024-01-04', average_score: 78.2, participation_rate: 86.7, completion_rate: 82.4 },
      { date: '2024-01-05', average_score: 77.9, participation_rate: 85.2, completion_rate: 81.8 },
      { date: '2024-01-06', average_score: 79.1, participation_rate: 87.9, completion_rate: 84.1 },
      { date: '2024-01-07', average_score: 78.5, participation_rate: 88.4, completion_rate: 85.2 }
    ],
    subject_performance: [
      { subject: 'Mathematics', average_score: 82, tests_count: 15, student_count: 650, difficulty: 8, engagement: 7 },
      { subject: 'Science', average_score: 76, tests_count: 12, student_count: 720, difficulty: 7, engagement: 8 },
      { subject: 'English', average_score: 85, tests_count: 8, student_count: 890, difficulty: 5, engagement: 6 },
      { subject: 'History', average_score: 71, tests_count: 6, student_count: 420, difficulty: 6, engagement: 5 },
      { subject: 'Geography', average_score: 74, tests_count: 4, student_count: 380, difficulty: 6, engagement: 6 }
    ],
    time_analytics: [
      { hour: 6, attempts: 45, average_score: 72.3 },
      { hour: 7, attempts: 89, average_score: 75.1 },
      { hour: 8, attempts: 156, average_score: 78.4 },
      { hour: 9, attempts: 234, average_score: 80.2 },
      { hour: 10, attempts: 289, average_score: 82.1 },
      { hour: 11, attempts: 312, average_score: 79.8 },
      { hour: 12, attempts: 278, average_score: 77.5 },
      { hour: 13, attempts: 245, average_score: 76.2 },
      { hour: 14, attempts: 298, average_score: 81.3 },
      { hour: 15, attempts: 356, average_score: 83.7 },
      { hour: 16, attempts: 398, average_score: 84.2 },
      { hour: 17, attempts: 423, average_score: 85.1 },
      { hour: 18, attempts: 389, average_score: 83.8 },
      { hour: 19, attempts: 345, average_score: 82.4 },
      { hour: 20, attempts: 267, average_score: 80.6 },
      { hour: 21, attempts: 198, average_score: 78.9 },
      { hour: 22, attempts: 112, average_score: 76.2 },
      { hour: 23, attempts: 67, average_score: 73.5 }
    ]
  };

  const performance = data || mockData;

  const filteredStudents = performance.student_performance
    .filter(student => 
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      const aVal = a[sortBy as keyof typeof a];
      const bVal = b[sortBy as keyof typeof b];
      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      }
      return aVal < bVal ? 1 : -1;
    });

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
          <h1 className="text-2xl font-bold text-gray-900">Performance Reports</h1>
          <p className="text-gray-600">Detailed insights into student and test performance</p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={filters.dateRange}
            onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
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
            onClick={loadPerformanceData}
            className="btn-primary inline-flex items-center"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-primary-100">
              <Users className="h-6 w-6 text-primary-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Students</p>
              <p className="text-2xl font-bold text-gray-900">
                {performance.summary.total_students.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100">
              <Users className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Students</p>
              <p className="text-2xl font-bold text-gray-900">
                {performance.summary.active_students.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-primary-100">
              <Target className="h-6 w-6 text-primary-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg Performance</p>
              <p className="text-2xl font-bold text-gray-900">
                {performance.summary.average_performance.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100">
              <TrendingUp className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Improvement Rate</p>
              <p className="text-2xl font-bold text-gray-900">
                +{performance.summary.improvement_rate.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-primary-100">
              <Award className="h-6 w-6 text-primary-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Completion Rate</p>
              <p className="text-2xl font-bold text-gray-900">
                {performance.summary.completion_rate.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-pink-100">
              <Clock className="h-6 w-6 text-pink-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg Time (min)</p>
              <p className="text-2xl font-bold text-gray-900">
                {performance.summary.average_time_spent.toFixed(0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Trends */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Performance Trends</h3>
            <TrendingUp className="h-5 w-5 text-gray-400" />
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={performance.performance_trends}>
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
                dataKey="average_score" 
                stroke="#3B82F6" 
                strokeWidth={2}
                name="Average Score (%)"
              />
              <Line 
                type="monotone" 
                dataKey="participation_rate" 
                stroke="#10B981" 
                strokeWidth={2}
                name="Participation Rate (%)"
              />
              <Line 
                type="monotone" 
                dataKey="completion_rate" 
                stroke="#F59E0B" 
                strokeWidth={2}
                name="Completion Rate (%)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Subject Performance Radar */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Subject Performance</h3>
            <BarChart3 className="h-5 w-5 text-gray-400" />
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={performance.subject_performance}>
              <PolarGrid />
              <PolarAngleAxis dataKey="subject" />
              <PolarRadiusAxis angle={90} domain={[0, 100]} />
              <Radar
                name="Average Score"
                dataKey="average_score"
                stroke="#3B82F6"
                fill="#3B82F6"
                fillOpacity={0.3}
              />
              <Radar
                name="Engagement"
                dataKey="engagement"
                stroke="#10B981"
                fill="#10B981"
                fillOpacity={0.3}
              />
              <Tooltip />
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Time-based Performance */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Performance by Time of Day</h3>
            <Clock className="h-5 w-5 text-gray-400" />
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={performance.time_analytics}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="hour" 
                tickFormatter={(value) => `${value}:00`}
              />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip 
                labelFormatter={(value) => `${value}:00`}
                formatter={(value: number, name: string) => [
                  name === 'attempts' ? value : `${value}%`,
                  name === 'attempts' ? 'Attempts' : 'Average Score'
                ]}
              />
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="attempts"
                stackId="1"
                stroke="#3B82F6"
                fill="#3B82F6"
                fillOpacity={0.3}
              />
              <Area
                yAxisId="right"
                type="monotone"
                dataKey="average_score"
                stroke="#10B981"
                fill="#10B981"
                fillOpacity={0.2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Test Performance */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Test Performance Comparison</h3>
            <BookOpen className="h-5 w-5 text-gray-400" />
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={performance.test_performance.slice(0, 5)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="test_name" 
                angle={-45}
                textAnchor="end"
                height={80}
                interval={0}
              />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="average_score" fill="#3B82F6" name="Average Score (%)" />
              <Bar dataKey="pass_rate" fill="#10B981" name="Pass Rate (%)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Student Performance Table */}
      <div className="card">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Student Performance</h3>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search students..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="name">Sort by Name</option>
                <option value="average_score">Sort by Score</option>
                <option value="tests_taken">Sort by Tests Taken</option>
                <option value="improvement">Sort by Improvement</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </button>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tests Taken
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Average Score
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Improvement
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trend
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Activity
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredStudents.map((student) => (
                <tr key={student.student_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{student.name}</div>
                      <div className="text-sm text-gray-500">{student.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{student.tests_taken}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{student.average_score.toFixed(1)}%</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`text-sm font-medium ${
                      student.improvement > 0 ? 'text-green-600' : 
                      student.improvement < 0 ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      {student.improvement > 0 ? '+' : ''}{student.improvement.toFixed(1)}%
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {student.performance_trend === 'up' && (
                        <TrendingUp className="h-4 w-4 text-green-500" />
                      )}
                      {student.performance_trend === 'down' && (
                        <TrendingDown className="h-4 w-4 text-red-500" />
                      )}
                      {student.performance_trend === 'stable' && (
                        <div className="h-4 w-4 border-t-2 border-gray-400"></div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {new Date(student.last_activity).toLocaleDateString()}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};