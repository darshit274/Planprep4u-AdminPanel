import { clsx } from 'clsx';
import {
  BookOpen,
  CreditCard,
  FileText,
  Flag,
  Home,
  LogOut,
  MessageSquare,
  Settings,
  Users
} from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import logo from '../../assets/planprep4u-logo.jpg';
import { useAuth } from '../../hooks/useAuth';
import { reportsService } from '../../services/reports';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Students', href: '/students', icon: Users },
  { name: 'Subscriptions', href: '/subscriptions', icon: CreditCard },
  { name: 'Course Management', href: '/test-management', icon: BookOpen },
  { name: 'PDFs', href: '/pdfs', icon: FileText },
  { name: 'User Queries', href: '/queries', icon: MessageSquare },
  { name: 'Reports', href: '/reports', icon: Flag },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export const Sidebar: React.FC = () => {
  const { admin, logout } = useAuth();
  const location = useLocation();
  const [pendingReportsCount, setPendingReportsCount] = useState<number>(0);

  useEffect(() => {
    // Fetch pending reports count
    const fetchPendingCount = async () => {
      try {
        const response = await reportsService.getPendingCount();
        if (response.success) {
          setPendingReportsCount(response.data.count);
        }
      } catch (error) {
        console.error('Error fetching pending reports count:', error);
      }
    };

    fetchPendingCount();

    // Refresh count every 5 minutes
    const interval = setInterval(fetchPendingCount, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="flex flex-col w-64 bg-white shadow-lg border-r border-gray-200 h-full">
      {/* Logo and Title */}
      <div className="flex items-center px-6 py-4 border-b border-gray-200">
        <div className="flex items-center w-10 h-10">
            <img src={logo} alt="PlanPrep4u Logo" style={{borderRadius:"50%"}} />
          <div className="ml-3">
            <h1 className="text-lg font-semibold text-gray-900">PlanPrep4u</h1>
            <p className="text-xs text-gray-500">Admin Panel</p>
          </div>
        </div>
      </div>

      {/* Admin Profile */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            {admin?.avatar ? (
              <img
                className="h-10 w-10 rounded-full"
                src={admin.avatar}
                alt={admin.name}
              />
            ) : (
              <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                <span className="text-sm font-medium text-primary-600">
                  {admin?.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-900">{admin?.name}</p>
            <p className="text-xs text-gray-500 capitalize">{admin?.role.replace('_', ' ')}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href || location.pathname.startsWith(item.href + '/');
          const showBadge = item.name === 'Reports' && pendingReportsCount > 0;

          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={clsx(
                'group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                isActive
                  ? 'bg-primary-50 text-primary-700 border-r-2 border-primary-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <item.icon
                className={clsx(
                  'mr-3 h-5 w-5 flex-shrink-0',
                  isActive ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-500'
                )}
              />
              <span className="flex-1">{item.name}</span>
              {showBadge && (
                <span className="ml-auto px-2 py-0.5 text-xs font-bold bg-red-500 text-white rounded-full">
                  {pendingReportsCount > 99 ? '99+' : pendingReportsCount}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={handleLogout}
          className="group flex items-center w-full px-3 py-2 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 transition-colors"
        >
          <LogOut className="mr-3 h-5 w-5 flex-shrink-0" />
          Sign Out
        </button>
      </div>
    </div>
  );
};