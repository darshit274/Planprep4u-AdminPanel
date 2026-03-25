import React, { useState, useEffect } from 'react';
import { Search, Filter, Download, Eye, Edit, Trash2, UserPlus, X, CheckCircle, XCircle } from 'lucide-react';
import { LoadingSpinner, CardSkeleton } from '../../components/common/LoadingSpinner';
import { ApiError, ErrorBoundary } from '../../components/common/ErrorBoundary';
import { studentsService } from '../../services/students';
import { StudentModal } from '../../components/modals/StudentModal';
import { ConfirmModal } from '../../components/modals/ConfirmModal';
import toast from 'react-hot-toast';
import { formatDate } from '../../lib/utils';

export const StudentsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Advanced filter states
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [verificationFilter, setVerificationFilter] = useState<'all' | 'verified' | 'unverified'>('all');
  const [premiumFilter, setPremiumFilter] = useState<'all' | 'premium' | 'free'>('all');
  const [dateFilter, setDateFilter] = useState({
    from: '',
    to: ''
  });
  
  // Simple state management instead of useApi hook
  const [students, setStudents] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exportLoading, setExportLoading] = useState(false);
  
  // Modal states
  const [studentModal, setStudentModal] = useState({ isOpen: false, mode: 'create' as 'create' | 'edit', student: null as any });
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, student: null as any, loading: false });

  const fetchStudents = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await studentsService.getStudents({
        page: currentPage,
        limit: pageSize,
        search: searchTerm,
        sortBy,
        sortOrder
      });
      
      const backendData = response.data;
      
      if (backendData && backendData.success) {
        setStudents(backendData.data || []);
        setPagination(backendData.pagination || { total: 0, page: 1, limit: 10, totalPages: 0 });
      } else {
        setError('Invalid response format');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch students');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [currentPage, pageSize, searchTerm, sortBy, sortOrder]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setVerificationFilter('all');
    setPremiumFilter('all');
    setDateFilter({ from: '', to: '' });
    setCurrentPage(1);
    setShowAdvancedFilters(false);
  };

  const applyAdvancedFilters = () => {
    setCurrentPage(1);
    // The loadStudents function will automatically use the current filter states
    loadStudents();
  };

  const hasActiveFilters = statusFilter !== 'all' || 
                          verificationFilter !== 'all' || 
                          premiumFilter !== 'all' || 
                          dateFilter.from || 
                          dateFilter.to ||
                          searchTerm;

  const handleExport = async () => {
    setExportLoading(true);
    try {
      // Prepare filters for export
      const exportFilters = {
        search: searchTerm,
        is_active: statusFilter === 'all' ? undefined : statusFilter === 'active',
        is_verified: verificationFilter === 'all' ? undefined : verificationFilter === 'verified',
        is_premium: premiumFilter === 'all' ? undefined : premiumFilter === 'premium',
        date_from: dateFilter.from,
        date_to: dateFilter.to
      };

      const blob = await studentsService.exportStudents(exportFilters);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `students_export_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('Students data exported successfully');
    } catch (error: any) {
      console.error('Export error:', error);
      toast.error(error.response?.data?.message || 'Failed to export students data');
    } finally {
      setExportLoading(false);
    }
  };

  const getStatusBadge = (isActive: boolean, isEmailVerified: boolean) => {
    if (!isEmailVerified) {
      return <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">Unverified</span>;
    }
    if (isActive) {
      return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Active</span>;
    }
    return <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">Inactive</span>;
  };

  // CRUD handlers
  const handleAddStudent = () => {
    setStudentModal({ isOpen: true, mode: 'create', student: null });
  };

  const handleEditStudent = (student: any) => {
    setStudentModal({ isOpen: true, mode: 'edit', student });
  };

  const handleDeleteStudent = (student: any) => {
    setConfirmModal({ isOpen: true, student, loading: false });
  };

  const handleConfirmDelete = async () => {
    try {
      setConfirmModal(prev => ({ ...prev, loading: true }));
      await studentsService.deleteStudent(confirmModal.student.uuid);
      toast.success('Student deleted successfully');
      fetchStudents();
      setConfirmModal({ isOpen: false, student: null, loading: false });
    } catch (error: any) {
      console.error('Delete student error:', error);
      toast.error(error.response?.data?.message || 'Failed to delete student');
      setConfirmModal(prev => ({ ...prev, loading: false }));
    }
  };

  const handleModalSuccess = () => {
    fetchStudents();
  };

  const handleVerifyStudent = async (student: any) => {
    try {
      await studentsService.verifyStudent(student.uuid);
      toast.success(`Student ${student.isEmailVerified ? 'unverified' : 'verified'} successfully`);
      fetchStudents(); // Refresh the list
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to update verification status');
    }
  };

  if (error) {
    return <ApiError error={error} onRetry={fetchStudents} />;
  }

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Student Management</h1>
            <p className="text-gray-600">Manage and monitor student accounts</p>
          </div>
          <button 
            onClick={handleAddStudent}
            className="btn-primary inline-flex items-center"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Add Student
          </button>
        </div>

        {/* Search and Filters */}
        <div className="card p-6">
          <form onSubmit={handleSearch} className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Students
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by name or email..."
                  className="input-field pl-10"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Page Size
              </label>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="input-field"
              >
                <option value={10}>10 per page</option>
                <option value={25}>25 per page</option>
                <option value={50}>50 per page</option>
                <option value={100}>100 per page</option>
              </select>
            </div>

            <button type="submit" className="btn-primary">
              <Search className="h-4 w-4 mr-2" />
              Search
            </button>

            <button 
              type="button" 
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`btn-secondary ${hasActiveFilters ? 'border-primary-500 bg-primary-50 text-primary-700' : ''}`}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
              {hasActiveFilters && (
                <span className="ml-2 bg-primary-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {[statusFilter !== 'all', verificationFilter !== 'all', premiumFilter !== 'all', dateFilter.from, dateFilter.to, searchTerm].filter(Boolean).length}
                </span>
              )}
            </button>

            <button 
              type="button" 
              onClick={handleExport}
              disabled={exportLoading}
              className="btn-secondary"
            >
              <Download className="h-4 w-4 mr-2" />
              {exportLoading ? 'Exporting...' : 'Export'}
            </button>
          </form>
        </div>

        {/* Advanced Filters Panel */}
        {showAdvancedFilters && (
          <div className="card p-6 border-t-2 border-primary-500">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Advanced Filters</h3>
              <button
                onClick={clearFilters}
                className="text-sm text-gray-500 hover:text-gray-700 flex items-center"
              >
                <X className="h-4 w-4 mr-1" />
                Clear All
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Account Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="input-field"
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              {/* Verification Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Verification Status
                </label>
                <select
                  value={verificationFilter}
                  onChange={(e) => setVerificationFilter(e.target.value as any)}
                  className="input-field"
                >
                  <option value="all">All Verification</option>
                  <option value="verified">Verified</option>
                  <option value="unverified">Unverified</option>
                </select>
              </div>

              {/* Premium Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subscription Type
                </label>
                <select
                  value={premiumFilter}
                  onChange={(e) => setPremiumFilter(e.target.value as any)}
                  className="input-field"
                >
                  <option value="all">All Types</option>
                  <option value="premium">Premium</option>
                  <option value="free">Free</option>
                </select>
              </div>

              {/* Date Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Registration Date
                </label>
                <div className="flex space-x-2">
                  <input
                    type="date"
                    value={dateFilter.from}
                    onChange={(e) => setDateFilter(prev => ({ ...prev, from: e.target.value }))}
                    className="input-field text-sm"
                    placeholder="From"
                  />
                  <input
                    type="date"
                    value={dateFilter.to}
                    onChange={(e) => setDateFilter(prev => ({ ...prev, to: e.target.value }))}
                    className="input-field text-sm"
                    placeholder="To"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={clearFilters}
                className="btn-secondary"
              >
                Reset
              </button>
              <button
                onClick={applyAdvancedFilters}
                className="btn-primary"
              >
                Apply Filters
              </button>
            </div>
          </div>
        )}

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="card p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-primary-100">
                <UserPlus className="h-6 w-6 text-primary-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Students</p>
                <p className="text-2xl font-bold text-gray-900">{pagination.total}</p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100">
                <Eye className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Verified</p>
                <p className="text-2xl font-bold text-gray-900">
                  {students.filter(s => s.isEmailVerified).length}
                </p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-yellow-100">
                <Edit className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Unverified</p>
                <p className="text-2xl font-bold text-gray-900">
                  {students.filter(s => !s.isEmailVerified).length}
                </p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-primary-100">
                <Trash2 className="h-6 w-6 text-primary-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">This Week</p>
                <p className="text-2xl font-bold text-gray-900">
                  {students.filter(s => {
                    const weekAgo = new Date();
                    weekAgo.setDate(weekAgo.getDate() - 7);
                    return new Date(s.created_at) > weekAgo;
                  }).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Students Table */}
        <div className="card">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Students List</h3>
          </div>

          {loading ? (
            <div className="p-6">
              <div className="space-y-4">
                {Array.from({ length: pageSize }).map((_, index) => (
                  <CardSkeleton key={index} />
                ))}
              </div>
            </div>
          ) : students.length === 0 ? (
            <div className="p-12 text-center">
              <UserPlus className="mx-auto h-24 w-24 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No students found</h3>
              <p className="text-gray-600 mb-6">
                {searchTerm ? 'Try adjusting your search criteria.' : 'No students have registered yet.'}
              </p>
              {!searchTerm && (
                <button onClick={handleAddStudent} className="btn-primary">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add First Student
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('username')}
                    >
                      Name
                      {sortBy === 'username' && (
                        <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('email')}
                    >
                      Email
                      {sortBy === 'email' && (
                        <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Phone
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('created_at')}
                    >
                      Joined
                      {sortBy === 'created_at' && (
                        <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {students.map((student: any) => (
                    <tr key={student.uuid} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {student.profileImage ? (
                            <img 
                              className="h-8 w-8 rounded-full" 
                              src={student.profileImage} 
                              alt={student.username}
                            />
                          ) : (
                            <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                              <span className="text-sm font-medium text-gray-600">
                                {student.username?.charAt(0)?.toUpperCase()}
                              </span>
                            </div>
                          )}
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900">{student.username}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="text-sm text-gray-900">{student.email}</p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="text-sm text-gray-900">{student.phone || '-'}</p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(true, student.isEmailVerified)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="text-sm text-gray-900">
                          {formatDate(student.created_at)}
                        </p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => handleEditStudent(student)}
                            className="text-primary-600 hover:text-primary-900"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => handleEditStudent(student)}
                            className="text-green-600 hover:text-green-900"
                            title="Edit Student"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => handleVerifyStudent(student)}
                            className={`${student.isEmailVerified ? 'text-orange-600 hover:text-orange-900' : 'text-green-600 hover:text-green-900'}`}
                            title={student.isEmailVerified ? 'Unverify Student' : 'Verify Student'}
                          >
                            {student.isEmailVerified ? <XCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                          </button>
                          <button 
                            onClick={() => handleDeleteStudent(student)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete Student"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-700">
                  Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, pagination.total)} of {pagination.total} results
                </p>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 text-sm border rounded disabled:opacity-50"
                  >
                    Previous
                  </button>
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    const page = i + 1;
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-1 text-sm border rounded ${
                          currentPage === page 
                            ? 'bg-primary-600 text-white border-primary-600' 
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setCurrentPage(Math.min(pagination.totalPages, currentPage + 1))}
                    disabled={currentPage === pagination.totalPages}
                    className="px-3 py-1 text-sm border rounded disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modals */}
        <StudentModal
          isOpen={studentModal.isOpen}
          onClose={() => setStudentModal({ isOpen: false, mode: 'create', student: null })}
          onSuccess={handleModalSuccess}
          student={studentModal.student}
          mode={studentModal.mode}
        />

        <ConfirmModal
          isOpen={confirmModal.isOpen}
          onClose={() => setConfirmModal({ isOpen: false, student: null, loading: false })}
          onConfirm={handleConfirmDelete}
          title="Delete Student"
          message={`Are you sure you want to delete "${confirmModal.student?.username}"? This action cannot be undone.`}
          confirmText="Delete"
          type="danger"
          loading={confirmModal.loading}
        />
      </div>
    </ErrorBoundary>
  );
};