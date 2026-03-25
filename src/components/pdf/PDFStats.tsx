import React from 'react';
import { FileText, Download, Eye, Crown, TrendingUp, BarChart3 } from 'lucide-react';
import { PDFStats as PDFStatsType } from '../../services/pdfService';

interface PDFStatsProps {
  stats: PDFStatsType;
  loading?: boolean;
}

export const PDFStats: React.FC<PDFStatsProps> = ({ stats, loading = false }) => {
  const StatCard: React.FC<{
    title: string;
    value: number | string;
    icon: React.ReactNode;
    color: string;
    trend?: string;
  }> = ({ title, value, icon, color, trend }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <div className="flex items-baseline">
            <p className="text-2xl font-bold text-gray-900">
              {loading ? (
                <div className="h-8 w-20 bg-gray-200 rounded animate-pulse"></div>
              ) : (
                value
              )}
            </p>
            {trend && !loading && (
              <span className="ml-2 text-sm text-green-600 font-medium">
                {trend}
              </span>
            )}
          </div>
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          {loading ? (
            <div className="h-6 w-6 bg-gray-300 rounded animate-pulse"></div>
          ) : (
            icon
          )}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, index) => (
          <StatCard
            key={index}
            title=""
            value=""
            icon={null}
            color="bg-gray-100"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total PDFs"
          value={stats.total_pdfs || 0}
          icon={<FileText className="h-6 w-6 text-primary-600" />}
          color="bg-primary-100"
        />
        
        <StatCard
          title="Free PDFs"
          value={stats.free_pdfs || 0}
          icon={<Eye className="h-6 w-6 text-green-600" />}
          color="bg-green-100"
        />
        
        <StatCard
          title="Premium PDFs"
          value={stats.premium_pdfs || stats.paid_pdfs || 0}
          icon={<Crown className="h-6 w-6 text-yellow-600" />}
          color="bg-yellow-100"
        />
        
        <StatCard
          title="Total Downloads"
          value={stats.total_downloads || 0}
          icon={<Download className="h-6 w-6 text-primary-600" />}
          color="bg-primary-100"
        />
      </div>

      {/* Category Stats & Top Downloads */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Stats */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Categories</h3>
            <BarChart3 className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-3">
            {stats.category_stats && stats.category_stats.length > 0 ? (
              stats.category_stats.slice(0, 5).map((stat, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-primary-500 mr-3"></div>
                    <span className="text-sm font-medium text-gray-700 truncate">
                      {stat.category || 'Uncategorized'}
                    </span>
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <span className="mr-2">
                      {stat.count} PDF{stat.count !== 1 ? 's' : ''}
                    </span>
                    <span className="text-green-600">
                      {stat.downloads} downloads
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No category data available</p>
            )}
          </div>
        </div>

        {/* Top Downloads */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Most Downloaded</h3>
            <TrendingUp className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-3">
            {stats.top_downloads && stats.top_downloads.length > 0 ? (
              stats.top_downloads.slice(0, 5).map((pdf, index) => (
                <div key={pdf.id} className="flex items-center justify-between">
                  <div className="flex items-center min-w-0">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white mr-3 ${
                      index === 0 ? 'bg-yellow-500' : 
                      index === 1 ? 'bg-gray-400' : 
                      index === 2 ? 'bg-orange-500' : 'bg-primary-500'
                    }`}>
                      {index + 1}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {pdf.title}
                      </p>
                      <p className="text-xs text-gray-500">
                        {pdf.category || 'Uncategorized'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Download className="h-3 w-3 mr-1" />
                    {pdf.download_count}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No download data available</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};