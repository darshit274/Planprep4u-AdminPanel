import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  FileText, 
  HelpCircle,
  GraduationCap,
  Library,
  Award,
  Settings,
  Tags,
  Globe,
  BarChart3,
  Folder
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NewSidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const location = useLocation();

  const menuItems = [
    {
      title: 'Dashboard',
      icon: LayoutDashboard,
      path: '/dashboard',
      category: 'main'
    },
    {
      title: 'User Management',
      icon: Users,
      path: '/users',
      category: 'management'
    },
    
    // Content Management Section
    {
      title: 'Exam Types',
      icon: Award,
      path: '/exams',
      category: 'content',
      description: 'Manage exam categories (PSI, GPSC, etc.)'
    },
    {
      title: 'Subjects',
      icon: BookOpen,
      path: '/subjects',
      category: 'content',
      description: 'Manage subjects with hierarchy'
    },
    
    // Test Management
    {
      title: 'Test Management',
      icon: GraduationCap,
      path: '/test-management',
      category: 'tests',
      description: 'Manage test series → categories → sub-categories → tests → questions'
    },
    
    // Free Content Management
    {
      title: 'PYQs',
      icon: FileText,
      path: '/pyqs',
      category: 'free',
      description: 'Previous Year Questions'
    },
    
    // Question Management
    {
      title: 'Question Bank',
      icon: HelpCircle,
      path: '/questions',
      category: 'content',
      description: 'Manage all questions'
    },
    {
      title: 'Multi-language',
      icon: Globe,
      path: '/translations',
      category: 'content',
      description: 'Manage question translations'
    },
    
    // PDF Management
    {
      title: 'PDF Resources',
      icon: Folder,
      path: '/pdf-resources',
      category: 'content',
      description: 'Study materials and documents'
    },
    
    // Analytics and Settings
    {
      title: 'Analytics',
      icon: BarChart3,
      path: '/analytics',
      category: 'system'
    },
    {
      title: 'Settings',
      icon: Settings,
      path: '/settings',
      category: 'system'
    }
  ];

  const categories = {
    main: 'Dashboard',
    management: 'User Management',
    content: 'Content Management',
    tests: 'Test Series',
    free: 'Free Content',
    system: 'System'
  };

  const groupedItems = menuItems.reduce((groups, item) => {
    const category = item.category;
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(item);
    return groups;
  }, {} as Record<string, typeof menuItems>);

  return (
    <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out ${
      isOpen ? 'translate-x-0' : '-translate-x-full'
    } lg:translate-x-0 lg:static lg:inset-0`}>
      
      {/* Header */}
      <div className="flex items-center justify-center h-16 px-4 bg-primary-600 text-white">
        <div className="flex items-center space-x-2">
          <GraduationCap className="h-8 w-8" />
          <span className="text-xl font-bold">PlanPrep4u Admin</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 bg-gray-50 overflow-y-auto">
        {Object.entries(groupedItems).map(([category, items]) => (
          <div key={category} className="mb-6">
            {/* Category Header */}
            <h3 className="px-3 mb-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              {categories[category as keyof typeof categories]}
            </h3>
            
            {/* Category Items */}
            <div className="space-y-1">
              {items.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={onClose}
                    className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      isActive
                        ? 'bg-primary-100 text-primary-900 border-r-2 border-primary-600'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                    title={item.description}
                  >
                    <Icon className={`mr-3 h-5 w-5 flex-shrink-0 ${
                      isActive ? 'text-primary-600' : 'text-gray-400 group-hover:text-gray-500'
                    }`} />
                    <span className="truncate">{item.title}</span>
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
        <div className="flex items-center w-full">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
              <Users className="w-4 h-4 text-primary-600" />
            </div>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-700">Admin Panel</p>
            <p className="text-xs text-gray-500">Educational Platform</p>
          </div>
        </div>
      </div>
    </div>
  );
};