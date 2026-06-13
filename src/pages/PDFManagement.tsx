import React, { useState, useEffect, useMemo } from 'react';
import {
  Upload, Plus, Grid, List, RefreshCw, Folder, FolderOpen, FolderPlus,
  ChevronRight, Home, Pencil, Trash2, FileText, Search, X
} from 'lucide-react';
import { PDFCard } from '../components/pdf/PDFCard';
import { PDFStats } from '../components/pdf/PDFStats';
import { PDFEditModal } from '../components/modals/PDFEditModal';
import { PDFPreviewModal } from '../components/modals/PDFPreviewModal';
import { PDFUploadDropzone } from '../components/pdf/PDFUploadDropzone';
import { ConfirmModal } from '../components/modals/ConfirmModal';
import { PDFListSkeleton, PDFHeaderSkeleton } from '../components/common/PDFSkeletonLoader';
import pdfService, { PDF, PDFCategory, PDFStats as PDFStatsType } from '../services/pdfService';
import toast from 'react-hot-toast';

const FOLDER_COLORS = [
  '#3B82F6', '#8B5CF6', '#EC4899', '#EF4444', '#F59E0B',
  '#10B981', '#06B6D4', '#6366F1', '#84CC16', '#F97316'
];

interface CategoryModalState {
  isOpen: boolean;
  mode: 'create' | 'edit';
  category: PDFCategory | null;
  parentId: number | null;
}

export const PDFManagement: React.FC = () => {
  // Data state
  const [pdfs, setPdfs] = useState<PDF[]>([]);
  const [categories, setCategories] = useState<PDFCategory[]>([]);
  const [stats, setStats] = useState<PDFStatsType | null>(null);
  const [examTypes, setExamTypes] = useState<Array<{ id: number; name: string }>>([]);
  const [testSeries, setTestSeries] = useState<Array<{ id: string; title: string }>>([]);
  const [courses, setCourses] = useState<Array<{ id: string; title: string }>>([]);

  // Hierarchy navigation: null = root level
  const [currentFolderId, setCurrentFolderId] = useState<number | null>(null);

  // Loading states
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  // UI states
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [search, setSearch] = useState('');
  const [accessLevel, setAccessLevel] = useState('');
  const [page, setPage] = useState(1);

  // Modal states
  const [editModal, setEditModal] = useState({ isOpen: false, pdf: null as PDF | null });
  const [previewModal, setPreviewModal] = useState({ isOpen: false, pdf: null as PDF | null });
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    pdf: null as PDF | null,
    loading: false
  });
  const [categoryModal, setCategoryModal] = useState<CategoryModalState>({
    isOpen: false,
    mode: 'create',
    category: null,
    parentId: null
  });
  const [categoryForm, setCategoryForm] = useState({ name: '', description: '', color: FOLDER_COLORS[0] });
  const [categorySaving, setCategorySaving] = useState(false);
  const [deleteCategoryModal, setDeleteCategoryModal] = useState({
    isOpen: false,
    category: null as PDFCategory | null,
    loading: false
  });

  // Pagination
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 12, totalPages: 0 });

  // Derived hierarchy data
  const currentFolder = useMemo(
    () => categories.find(c => c.id === currentFolderId) || null,
    [categories, currentFolderId]
  );

  const childFolders = useMemo(
    () => categories.filter(c => (c.parent_category_id ?? null) === currentFolderId),
    [categories, currentFolderId]
  );

  const breadcrumb = useMemo(() => {
    const trail: PDFCategory[] = [];
    let node = currentFolder;
    while (node) {
      trail.unshift(node);
      node = categories.find(c => c.id === node!.parent_category_id) || null;
    }
    return trail;
  }, [categories, currentFolder]);

  // Initial load
  useEffect(() => {
    loadCategories();
    loadStats();
    loadExamTypes();
    loadTestSeries();
    loadCourses();
  }, []);

  // Reload PDFs when folder / search / filter / page changes
  useEffect(() => {
    loadPDFs();
  }, [currentFolderId, search, accessLevel, page]);

  // Reset page when navigation or filters change
  useEffect(() => {
    setPage(1);
  }, [currentFolderId, search, accessLevel]);

  const loadCategories = async () => {
    setCategoriesLoading(true);
    try {
      const response = await pdfService.getCategoryTree();
      if (response.success && Array.isArray(response.data)) {
        setCategories(response.data);
      }
    } catch (error) {
      console.error('Error loading PDF categories:', error);
      toast.error('Failed to load folders');
    } finally {
      setCategoriesLoading(false);
    }
  };

  const loadPDFs = async () => {
    setLoading(true);
    try {
      const response = await pdfService.getPDFs({
        search,
        access_level: accessLevel as any,
        category_id: currentFolderId ?? '',
        page,
        limit: 12,
        sort_by: 'created_at',
        sort_order: 'DESC'
      });

      if (response.success && Array.isArray(response.data)) {
        setPdfs(response.data);
        setPagination(response.pagination);
      } else {
        setPdfs([]);
        setPagination({ total: 0, page: 1, limit: 12, totalPages: 0 });
      }
    } catch (error) {
      console.error('Error loading PDFs:', error);
      toast.error('Failed to load PDFs');
      setPdfs([]);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    setStatsLoading(true);
    try {
      const response = await pdfService.getStats();
      if (response.success) setStats(response.data);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  const loadExamTypes = async () => {
    try {
      const response = await pdfService.getExamTypes();
      if (response.success && response.data) setExamTypes(response.data);
    } catch {
      setExamTypes([]);
    }
  };

  const loadTestSeries = async () => {
    try {
      const response = await pdfService.getTestSeries();
      if (response.success && response.data) setTestSeries(response.data);
    } catch {
      setTestSeries([]);
    }
  };

  const loadCourses = async () => {
    try {
      const token = sessionStorage.getItem('admin_token');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/admin/test-management`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success && data.data) {
        setCourses(data.data.map((series: any) => ({ id: series.uuid, title: series.title })));
      } else {
        setCourses([]);
      }
    } catch {
      setCourses([]);
    }
  };

  const handleRefresh = async () => {
    await Promise.all([loadPDFs(), loadStats(), loadCategories()]);
    toast.success('Data refreshed successfully');
  };

  // ---- Folder handlers ----

  const openCreateFolder = () => {
    setCategoryForm({ name: '', description: '', color: FOLDER_COLORS[0] });
    setCategoryModal({ isOpen: true, mode: 'create', category: null, parentId: currentFolderId });
  };

  const openEditFolder = (category: PDFCategory, e: React.MouseEvent) => {
    e.stopPropagation();
    setCategoryForm({
      name: category.name,
      description: category.description || '',
      color: category.color || FOLDER_COLORS[0]
    });
    setCategoryModal({ isOpen: true, mode: 'edit', category, parentId: null });
  };

  const handleSaveCategory = async () => {
    if (!categoryForm.name.trim()) {
      toast.error('Folder name is required');
      return;
    }
    setCategorySaving(true);
    try {
      if (categoryModal.mode === 'create') {
        await pdfService.createCategory({
          name: categoryForm.name.trim(),
          description: categoryForm.description.trim() || undefined,
          color: categoryForm.color,
          parent_category_id: categoryModal.parentId
        });
        toast.success('Folder created');
      } else if (categoryModal.category) {
        await pdfService.updateCategory(categoryModal.category.id, {
          name: categoryForm.name.trim(),
          description: categoryForm.description.trim(),
          color: categoryForm.color
        });
        toast.success('Folder updated');
      }
      setCategoryModal({ isOpen: false, mode: 'create', category: null, parentId: null });
      loadCategories();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save folder');
    } finally {
      setCategorySaving(false);
    }
  };

  const handleDeleteFolder = (category: PDFCategory, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteCategoryModal({ isOpen: true, category, loading: false });
  };

  const handleConfirmDeleteFolder = async () => {
    if (!deleteCategoryModal.category) return;
    setDeleteCategoryModal(prev => ({ ...prev, loading: true }));
    try {
      await pdfService.deleteCategory(deleteCategoryModal.category.id);
      toast.success('Folder deleted');
      setDeleteCategoryModal({ isOpen: false, category: null, loading: false });
      loadCategories();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete folder');
      setDeleteCategoryModal(prev => ({ ...prev, loading: false }));
    }
  };

  // ---- PDF handlers ----

  const handlePreview = (pdf: PDF) => setPreviewModal({ isOpen: true, pdf });
  const handleEdit = (pdf: PDF) => setEditModal({ isOpen: true, pdf });
  const handleDelete = (pdf: PDF) => setConfirmModal({ isOpen: true, pdf, loading: false });

  const handleDownload = async (pdf: PDF) => {
    try {
      const blob = await pdfService.downloadPDF(pdf.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = pdf.original_filename || `${pdf.title}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('PDF downloaded successfully');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download PDF');
    }
  };

  const handleConfirmDelete = async () => {
    if (!confirmModal.pdf) return;
    setConfirmModal(prev => ({ ...prev, loading: true }));
    try {
      await pdfService.deletePDF(confirmModal.pdf.id);
      toast.success('PDF deleted successfully');
      loadPDFs();
      loadStats();
      loadCategories();
      setConfirmModal({ isOpen: false, pdf: null, loading: false });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete PDF');
      setConfirmModal(prev => ({ ...prev, loading: false }));
    }
  };

  const handleUploadSuccess = () => {
    toast.success('PDF uploaded successfully');
    loadPDFs();
    loadStats();
    loadCategories();
    setShowUploadForm(false);
  };

  // ---- Render helpers ----

  const renderBreadcrumb = () => (
    <div className="flex items-center flex-wrap gap-1 bg-white rounded-xl shadow-sm border border-gray-100 px-4 py-3 mb-6">
      <button
        onClick={() => setCurrentFolderId(null)}
        className={`inline-flex items-center px-2 py-1 rounded-md text-sm font-medium transition-colors ${
          currentFolderId === null
            ? 'text-primary-700 bg-primary-50'
            : 'text-gray-600 hover:text-primary-600 hover:bg-gray-50'
        }`}
      >
        <Home className="h-4 w-4 mr-1.5" />
        PDF Library
      </button>
      {breadcrumb.map((node) => (
        <React.Fragment key={node.id}>
          <ChevronRight className="h-4 w-4 text-gray-300" />
          <button
            onClick={() => setCurrentFolderId(node.id)}
            className={`inline-flex items-center px-2 py-1 rounded-md text-sm font-medium transition-colors ${
              node.id === currentFolderId
                ? 'text-primary-700 bg-primary-50'
                : 'text-gray-600 hover:text-primary-600 hover:bg-gray-50'
            }`}
          >
            <Folder className="h-4 w-4 mr-1.5" style={{ color: node.color }} />
            {node.name}
          </button>
        </React.Fragment>
      ))}
    </div>
  );

  const renderFolderCard = (folder: PDFCategory) => (
    <div
      key={folder.id}
      onClick={() => setCurrentFolderId(folder.id)}
      className="group bg-white rounded-xl shadow-sm border border-gray-100 p-5 cursor-pointer hover:shadow-md hover:border-primary-200 transition-all"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center min-w-0">
          <div
            className="p-3 rounded-lg flex-shrink-0"
            style={{ backgroundColor: `${folder.color}1A` }}
          >
            <FolderOpen className="h-7 w-7" style={{ color: folder.color }} />
          </div>
          <div className="ml-3 min-w-0">
            <h3 className="text-base font-semibold text-gray-900 truncate group-hover:text-primary-700 transition-colors">
              {folder.name}
            </h3>
            {folder.description && (
              <p className="text-sm text-gray-500 truncate">{folder.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          <button
            onClick={(e) => openEditFolder(folder, e)}
            className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-md"
            title="Edit folder"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => handleDeleteFolder(folder, e)}
            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md"
            title="Delete folder"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="flex items-center mt-4 space-x-4 text-xs text-gray-500">
        <span className="inline-flex items-center">
          <Folder className="h-3.5 w-3.5 mr-1" />
          {folder.children_count || 0} sub-folders
        </span>
        <span className="inline-flex items-center">
          <FileText className="h-3.5 w-3.5 mr-1" />
          {folder.pdf_count || 0} PDFs
        </span>
      </div>
    </div>
  );

  const renderPagination = () => {
    if (pagination.totalPages <= 1) return null;
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mt-6">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-700">
            Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} PDFs
          </p>
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setPage(Math.max(1, pagination.page - 1))}
              disabled={pagination.page === 1}
              className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="px-3 py-2 text-sm text-gray-600">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              onClick={() => setPage(Math.min(pagination.totalPages, pagination.page + 1))}
              disabled={pagination.page === pagination.totalPages}
              className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        {statsLoading ? (
          <PDFHeaderSkeleton />
        ) : (
          <>
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">PDF Management</h1>
                <p className="text-gray-600 mt-2">
                  Organize study materials into folders and sub-folders
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleRefresh}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                  disabled={loading}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
                <button
                  onClick={openCreateFolder}
                  className="inline-flex items-center px-4 py-2 border border-primary-200 rounded-lg text-primary-700 bg-primary-50 hover:bg-primary-100 transition-colors"
                >
                  <FolderPlus className="h-4 w-4 mr-2" />
                  {currentFolderId ? 'New Sub-Folder' : 'New Folder'}
                </button>
                <button
                  onClick={() => setShowUploadForm(true)}
                  className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload PDF
                </button>
              </div>
            </div>

            {/* Statistics */}
            <div className="mb-8">
              <PDFStats stats={stats!} loading={statsLoading} />
            </div>
          </>
        )}

        {/* Upload Form */}
        {showUploadForm && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Upload New PDF
                {currentFolder && (
                  <span className="ml-2 text-sm font-normal text-gray-500">
                    into <span className="font-medium" style={{ color: currentFolder.color }}>{currentFolder.name}</span>
                  </span>
                )}
              </h2>
              <button
                onClick={() => setShowUploadForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <Plus className="h-6 w-6 rotate-45" />
              </button>
            </div>
            <PDFUploadDropzone
              courses={courses}
              testSeries={testSeries}
              examTypes={examTypes}
              categoryId={currentFolderId}
              categoryName={currentFolder?.name}
              onUploadSuccess={handleUploadSuccess}
              onUploadError={(e) => toast.error(e)}
            />
          </div>
        )}

        {/* Breadcrumb navigation */}
        {renderBreadcrumb()}

        {/* Folders grid */}
        {categoriesLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-100 p-5 animate-pulse">
                <div className="flex items-center">
                  <div className="h-13 w-13 p-3 rounded-lg bg-gray-200">
                    <div className="h-7 w-7" />
                  </div>
                  <div className="ml-3 flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-2/3" />
                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : childFolders.length > 0 ? (
          <div className="mb-8">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Folders
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {childFolders.map(renderFolderCard)}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-dashed border-gray-200 p-8 text-center mb-8">
            <Folder className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600 mb-3">
              {currentFolderId ? 'No sub-folders inside this folder.' : 'No folders yet. Create your first folder to organize PDFs.'}
            </p>
            <button
              onClick={openCreateFolder}
              className="inline-flex items-center px-4 py-2 text-sm border border-primary-200 rounded-lg text-primary-700 bg-primary-50 hover:bg-primary-100 transition-colors"
            >
              <FolderPlus className="h-4 w-4 mr-2" />
              {currentFolderId ? 'Add Sub-Folder' : 'Add Folder'}
            </button>
          </div>
        )}

        {/* PDFs section */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
            {currentFolder ? `PDFs in "${currentFolder.name}"` : 'All PDFs'}
          </h2>
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search PDFs..."
                className="pl-9 pr-8 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 w-56"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <select
              value={accessLevel}
              onChange={(e) => setAccessLevel(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All access levels</option>
              <option value="free">Free</option>
              <option value="premium">Premium</option>
              <option value="restricted">Restricted</option>
            </select>
            <div className="flex items-center bg-white border border-gray-200 rounded-lg">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 ${viewMode === 'grid' ? 'bg-primary-100 text-primary-600' : 'text-gray-400'}`}
              >
                <Grid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 ${viewMode === 'list' ? 'bg-primary-100 text-primary-600' : 'text-gray-400'}`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <PDFListSkeleton count={6} />
        ) : pdfs.length === 0 ? (
          <div className="text-center py-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-10">
              <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No PDFs here</h3>
              <p className="text-gray-600 mb-6">
                {search || accessLevel
                  ? 'Try adjusting your search or filters.'
                  : currentFolder
                    ? `Upload a PDF into "${currentFolder.name}" to get started.`
                    : 'Upload your first PDF to get started.'}
              </p>
              <button
                onClick={() => setShowUploadForm(true)}
                className="inline-flex items-center px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                <Upload className="h-5 w-5 mr-2" />
                Upload PDF
              </button>
            </div>
          </div>
        ) : (
          <div className={viewMode === 'grid'
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
            : 'space-y-4'
          }>
            {pdfs.map((pdf) => (
              <PDFCard
                key={pdf.id}
                pdf={pdf}
                onPreview={handlePreview}
                onEdit={handleEdit}
                onDownload={handleDownload}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}

        {!loading && pdfs.length > 0 && renderPagination()}

        {/* Folder create/edit modal */}
        {categoryModal.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-semibold text-gray-900">
                  {categoryModal.mode === 'create'
                    ? (categoryModal.parentId ? `New sub-folder in "${currentFolder?.name}"` : 'New folder')
                    : `Edit "${categoryModal.category?.name}"`}
                </h3>
                <button
                  onClick={() => setCategoryModal({ isOpen: false, mode: 'create', category: null, parentId: null })}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input
                    type="text"
                    value={categoryForm.name}
                    onChange={(e) => setCategoryForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="e.g. Previous Year Papers"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={categoryForm.description}
                    onChange={(e) => setCategoryForm(prev => ({ ...prev, description: e.target.value }))}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Optional description"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
                  <div className="flex flex-wrap gap-2">
                    {FOLDER_COLORS.map(color => (
                      <button
                        key={color}
                        onClick={() => setCategoryForm(prev => ({ ...prev, color }))}
                        className={`h-8 w-8 rounded-full border-2 transition-transform ${
                          categoryForm.color === color ? 'border-gray-800 scale-110' : 'border-transparent'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setCategoryModal({ isOpen: false, mode: 'create', category: null, parentId: null })}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveCategory}
                  disabled={categorySaving || !categoryForm.name.trim()}
                  className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50"
                >
                  {categorySaving ? 'Saving...' : categoryModal.mode === 'create' ? 'Create Folder' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* PDF Modals */}
        <PDFEditModal
          isOpen={editModal.isOpen}
          onClose={() => setEditModal({ isOpen: false, pdf: null })}
          pdf={editModal.pdf}
          courses={courses}
          testSeries={testSeries}
          examTypes={examTypes}
          onUpdate={() => {
            loadPDFs();
            loadStats();
            loadCategories();
          }}
        />

        <PDFPreviewModal
          isOpen={previewModal.isOpen}
          onClose={() => setPreviewModal({ isOpen: false, pdf: null })}
          pdf={previewModal.pdf}
        />

        <ConfirmModal
          isOpen={confirmModal.isOpen}
          onClose={() => setConfirmModal({ isOpen: false, pdf: null, loading: false })}
          onConfirm={handleConfirmDelete}
          title="Delete PDF"
          message={`Are you sure you want to delete "${confirmModal.pdf?.title}"? This action cannot be undone.`}
          confirmText="Delete"
          type="danger"
          loading={confirmModal.loading}
        />

        <ConfirmModal
          isOpen={deleteCategoryModal.isOpen}
          onClose={() => setDeleteCategoryModal({ isOpen: false, category: null, loading: false })}
          onConfirm={handleConfirmDeleteFolder}
          title="Delete Folder"
          message={`Are you sure you want to delete the folder "${deleteCategoryModal.category?.name}"? Folders containing sub-folders or PDFs cannot be deleted.`}
          confirmText="Delete"
          type="danger"
          loading={deleteCategoryModal.loading}
        />
      </div>
    </div>
  );
};
