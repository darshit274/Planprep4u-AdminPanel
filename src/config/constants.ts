// Environment configuration
export const ENV = {
  API_URL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  NODE_ENV: import.meta.env.MODE,
  IS_DEVELOPMENT: import.meta.env.DEV,
  IS_PRODUCTION: import.meta.env.PROD,
} as const;

// Application constants
export const APP_CONFIG = {
  NAME: 'PlanPrep4u Admin',
  VERSION: '1.0.0',
  DESCRIPTION: 'Admin Panel for PlanPrep4u Education Platform',
  COMPANY: 'PlanPrep4u',
} as const;

// API endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/admin/login',
    LOGOUT: '/admin/logout',
    PROFILE: '/admin/profile',
    REFRESH: '/admin/refresh-token',
  },
  DASHBOARD: {
    STATS: '/admin/dashboard/stats',
  },
  STUDENTS: {
    LIST: '/admin/students',
    DETAIL: (id: string) => `/admin/students/${id}`,
  },
  ANALYTICS: {
    REGISTRATIONS: '/admin/analytics/registrations',
    TEST_ATTEMPTS: '/admin/analytics/test-attempts',
    CATEGORIES: '/admin/analytics/categories',
    RECENT_ACTIVITY: '/admin/analytics/recent-activity',
  },
} as const;

// UI Constants
export const UI_CONFIG = {
  PAGINATION: {
    DEFAULT_PAGE_SIZE: 10,
    PAGE_SIZE_OPTIONS: [10, 25, 50, 100],
  },
  CHART: {
    COLORS: {
      PRIMARY: '#1e586f',
      SUCCESS: '#10B981',
      WARNING: '#F59E0B',
      DANGER: '#EF4444',
      INFO: '#6366F1',
      PURPLE: '#8B5CF6',
    },
  },
  ANIMATION: {
    DURATION: {
      FAST: 150,
      NORMAL: 300,
      SLOW: 500,
    },
  },
} as const;

// Storage keys
export const STORAGE_KEYS = {
  ADMIN_TOKEN: 'admin_token',
  ADMIN_USER: 'admin_user',
  THEME: 'admin_theme',
  LANGUAGE: 'admin_language',
} as const;

// Validation rules
export const VALIDATION = {
  EMAIL: {
    PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    MESSAGE: 'Please enter a valid email address',
  },
  PASSWORD: {
    MIN_LENGTH: 6,
    MESSAGE: 'Password must be at least 6 characters long',
  },
} as const;