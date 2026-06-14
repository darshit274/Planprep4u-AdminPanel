import api from './api';

export interface PDFFilters {
  search?: string;
  category_id?: string | number;
  access_level?: 'free' | 'premium' | 'restricted' | '';
  exam_type_id?: string | number;
  test_series_id?: string | number;
  page?: number;
  limit?: number;
  sort_by?: 'created_at' | 'title' | 'download_count' | 'file_size';
  sort_order?: 'ASC' | 'DESC';
}

export interface PDFResponse {
  success: boolean;
  data: PDF[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface PDF {
  id: string;
  title: string;
  description?: string;
  category_id?: number;
  file_path: string;
  original_filename: string;
  file_size: number;
  formatted_file_size?: string;
  mime_type: string;
  access_level: 'free' | 'premium' | 'restricted';
  test_series_id?: string;
  exam_type_id?: number;
  tags?: string[] | null;
  download_count: number;
  view_count: number;
  is_active: boolean;
  is_featured: boolean;
  uploaded_by: string;
  created_at: string;
  updated_at: string;
  category?: {
    id: number;
    name: string;
    color: string;
    icon: string;
  };
  examType?: {
    id: number;
    name: string;
  };
  testSeries?: {
    id: string;
    title: string;
  };
}

export interface PDFCategory {
  id: number;
  name: string;
  slug: string;
  description?: string;
  icon: string;
  color: string;
  sort_order: number;
  is_active: boolean;
  pdf_count?: number;
  parent_category_id?: number | null;
  children_count?: number;
}

export interface PDFStats {
  total_pdfs: number;
  free_pdfs: number;
  paid_pdfs: number;
  premium_pdfs: number;
  total_downloads: number;
  category_stats: Array<{
    category: string;
    count: number;
    downloads: number;
  }>;
  top_downloads: Array<{
    id: string;
    title: string;
    download_count: number;
    category: string;
  }>;
}

class PDFService {
  // Get PDFs with filters and pagination
  async getPDFs(filters: PDFFilters = {}): Promise<PDFResponse> {
    const params = new URLSearchParams();
    
    if (filters.search) params.append('search', filters.search);
    if (filters.category_id) params.append('category_id', filters.category_id.toString());
    if (filters.access_level) params.append('access_level', filters.access_level);
    if (filters.exam_type_id) params.append('exam_type_id', filters.exam_type_id.toString());
    if (filters.test_series_id) params.append('test_series_id', filters.test_series_id.toString());
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.sort_by) params.append('sortBy', filters.sort_by);
    if (filters.sort_order) params.append('sortOrder', filters.sort_order);

    const response = await api.get(`/admin/pdfs?${params.toString()}`);
    return response.data;
  }

  // Get single PDF by ID
  async getPDFById(id: string): Promise<{ success: boolean; data: PDF }> {
    const response = await api.get(`/admin/pdfs/${id}`);
    return response.data;
  }

  // Get PDF categories
  async getCategories(): Promise<{ success: boolean; data: { categories: PDFCategory[]; examTypes: any[]; accessLevels: any[] } }> {
    const response = await api.get('/admin/pdfs/filters');
    return response.data;
  }

  // Get PDF statistics
  async getStats(): Promise<{ success: boolean; data: PDFStats }> {
    const response = await api.get('/admin/pdfs/stats');
    return response.data;
  }

  // Download PDF
  async downloadPDF(id: string): Promise<Blob> {
    const response = await api.get(`/admin/pdfs/${id}/download`, {
      responseType: 'blob'
    });
    return response.data;
  }

  // Update PDF
  async updatePDF(id: string, data: Partial<PDF>): Promise<{ success: boolean; data: PDF }> {
    const response = await api.put(`/admin/pdfs/${id}`, data);
    return response.data;
  }

  // Delete PDF
  async deletePDF(id: string): Promise<{ success: boolean; message: string }> {
    const response = await api.delete(`/admin/pdfs/${id}`);
    return response.data;
  }

  // Get exam types for dropdown
  async getExamTypes(): Promise<{ success: boolean; data: Array<{ id: number; name: string }> }> {
    const response = await api.get('/admin/exam-types/dropdown');
    return response.data;
  }

  // Get test series for dropdown
  async getTestSeries(): Promise<{ success: boolean; data: Array<{ id: string; title: string }> }> {
    const response = await api.get('/admin/test-management');
    return response.data;
  }

  // Upload PDF file
  async uploadPDF(formData: FormData): Promise<{ success: boolean; data: PDF; message: string }> {
    const response = await api.post('/admin/pdf/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 120000, // 2 minutes for file uploads
    });
    return response.data;
  }

  // Get PDF category hierarchy (flat list with parent_category_id + counts)
  async getCategoryTree(): Promise<{ success: boolean; data: PDFCategory[] }> {
    const response = await api.get('/admin/pdf/categories');
    return response.data;
  }

  // Create PDF category (pass parent_category_id to nest it)
  async createCategory(data: {
    name: string;
    description?: string;
    icon?: string;
    color?: string;
    sort_order?: number;
    parent_category_id?: number | null;
  }): Promise<{ success: boolean; data: PDFCategory; message: string }> {
    const response = await api.post('/admin/pdf/categories', data);
    return response.data;
  }

  // Update PDF category
  async updateCategory(id: number, data: {
    name?: string;
    description?: string;
    icon?: string;
    color?: string;
    sort_order?: number;
  }): Promise<{ success: boolean; data: PDFCategory; message: string }> {
    const response = await api.put(`/admin/pdf/categories/${id}`, data);
    return response.data;
  }

  // Delete PDF category (fails while it still has sub-categories or PDFs)
  async deleteCategory(id: number): Promise<{ success: boolean; message: string }> {
    const response = await api.delete(`/admin/pdf/categories/${id}`);
    return response.data;
  }
}

export const pdfService = new PDFService();
export default pdfService;