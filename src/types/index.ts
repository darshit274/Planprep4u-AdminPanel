// Authentication types
export interface Admin {
  id: string;
  email: string;
  name: string;
  role: 'super_admin' | 'admin' | 'moderator';
  avatar?: string;
  created_at: string;
  last_login?: string;
}

export interface AuthResponse {
  admin: Admin;
  token: string;
  message: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

// User types
export interface Student {
  id: string;
  username: string;
  email: string;
  phone?: string;
  profileImage?: string;
  isEmailVerified: boolean;
  created_at: string;
  last_login?: string;
  test_attempts: number;
  total_score: number;
}

// Test types
export interface Question {
  id: string;
  question_text: string;
  question_text_gujarati?: string;
  option_a: string;
  option_a_gujarati?: string;
  option_b: string;
  option_b_gujarati?: string;
  option_c: string;
  option_c_gujarati?: string;
  option_d: string;
  option_d_gujarati?: string;
  correct_answer: 'A' | 'B' | 'C' | 'D';
  explanation?: string;
  explanation_gujarati?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  subject: string;
  topic: string;
  created_at: string;
}

export interface TestSeries {
  id: string;
  title: string;
  description: string;
  price: number;
  original_price?: number;
  category: string;
  exam_type: string;
  total_tests: number;
  free_tests: number;
  duration_months: number;
  negative_marking: boolean;
  negative_marks: number;
  pass_percentage: number;
  instructions?: string;
  is_active: boolean;
  created_at: string;
  questions: Question[];
}

export interface Test {
  id: string;
  title: string;
  description: string;
  test_series_id: string;
  duration_minutes: number;
  total_questions: number;
  total_marks: number;
  negative_marking: boolean;
  negative_marks: number;
  pass_marks: number;
  is_free: boolean;
  is_active: boolean;
  start_time?: string;
  end_time?: string;
  created_at: string;
  questions: Question[];
}

// PDF types
export interface PDFDocument {
  id: string;
  title: string;
  description?: string;
  file_url: string;
  file_size: number;
  category: string;
  subject?: string;
  is_free: boolean;
  download_count: number;
  uploaded_by: string;
  created_at: string;
}

// Analytics types
export interface TestSeriesAttemptData {
  name: string;
  total_attempts: number;
  completed_attempts: number;
  avg_score: number;
  completion_rate: number;
}

export interface DashboardStats {
  total_students: number;
  total_tests: number;
  total_test_series: number;
  total_pdfs: number;
  monthly_revenue: number;
  active_students_today: number;
  new_registrations_today: number;
  test_attempts_today: number;
}

export interface ChartData {
  name: string;
  value: number;
  date?: string;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
  total?: number;
  page?: number;
  limit?: number;
}

export interface PaginationParams {
  page: number;
  limit: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Form types
export interface CreateQuestionForm {
  question_text: string;
  question_text_gujarati?: string;
  option_a: string;
  option_a_gujarati?: string;
  option_b: string;
  option_b_gujarati?: string;
  option_c: string;
  option_c_gujarati?: string;
  option_d: string;
  option_d_gujarati?: string;
  correct_answer: 'A' | 'B' | 'C' | 'D';
  explanation?: string;
  explanation_gujarati?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  subject: string;
  topic: string;
}

export interface CreateTestSeriesForm {
  title: string;
  description: string;
  price: number;
  original_price?: number;
  category: string;
  exam_type: string;
  total_tests: number;
  free_tests: number;
  duration_months: number;
  negative_marking: boolean;
  negative_marks: number;
  pass_percentage: number;
  instructions?: string;
  is_active: boolean;
}