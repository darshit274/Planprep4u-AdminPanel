import api from './api';
import { DashboardStats, ChartData, TestSeriesAttemptData, ApiResponse } from '../types';

export const dashboardService = {
  // Get dashboard statistics
  getStats: async (): Promise<ApiResponse<DashboardStats>> => {
    const response = await api.get('/admin/dashboard/stats');
    return response.data;
  },

  // Get registration data for charts
  getRegistrationData: async (period: 'week' | 'month' | 'year' = 'month'): Promise<ApiResponse<ChartData[]>> => {
    const response = await api.get(`/admin/analytics/registrations?period=${period}`);
    return response.data;
  },

  // Get test attempt data
  getTestAttemptData: async (period: 'week' | 'month' = 'week'): Promise<ApiResponse<ChartData[]>> => {
    const response = await api.get(`/admin/analytics/test-attempts?period=${period}`);
    return response.data;
  },

  // Get category distribution
  getCategoryData: async (): Promise<ApiResponse<ChartData[]>> => {
    const response = await api.get('/admin/analytics/categories');
    return response.data;
  },

  // Get recent activity
  getRecentActivity: async (limit: number = 10): Promise<ApiResponse<any[]>> => {
    const response = await api.get(`/admin/analytics/recent-activity?limit=${limit}`);
    return response.data;
  },

  // Get test attempts grouped by test series
  getTestSeriesAttemptsData: async (period: 'week' | 'month' = 'week'): Promise<ApiResponse<TestSeriesAttemptData[]>> => {
    const response = await api.get(`/admin/analytics/test-series-attempts?period=${period}`);
    return response.data;
  }
};