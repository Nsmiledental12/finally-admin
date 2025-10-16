import React from 'react';
import {
  FileText,
  UserCheck,
  Users,
  BarChart3,
  Settings,
  Stethoscope,
  User,
  UserCircle
} from 'lucide-react';

interface SidebarProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
  userRole: 'super_admin' | 'admin' | 'moderator';
}

const Sidebar: React.FC<SidebarProps> = ({ activeSection, setActiveSection, userRole }) => {
  const menuItems = [
    { id: 'applications', label: 'Doctor Applications', icon: FileText },
    { id: 'doctors', label: 'Doctor Management', icon: UserCheck },
    { id: 'clinics', label: 'Clinic Management', icon: Users },
    { id: 'users', label: 'User Management', icon: User },
    { id: 'analytics', label: 'Analytics & Reports', icon: BarChart3 },
    { id: 'profile', label: 'My Profile', icon: UserCircle, superAdminOnly: true },
    { id: 'settings', label: 'Admin Settings', icon: Settings, superAdminOnly: true },
  ];

  const filteredMenuItems = menuItems.filter(item => {
    if (item.superAdminOnly) {
      return userRole === 'super_admin';
    }
    return true;
  });

  return (
    <div className="w-64 bg-white shadow-lg border-r border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <img
            src="https://files.catbox.moe/cctahm.png"
            alt="Logo"
            className="h-10 w-auto object-contain"
          />
          <div>
            <h2 className="text-lg font-semibold text-gray-900">MedAdmin</h2>
            <p className="text-sm text-gray-500">Healthcare Portal</p>
          </div>
        </div>
      </div>
      
      <nav className="mt-6">
        {filteredMenuItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`w-full flex items-center px-6 py-3 text-left transition-colors duration-200 ${
                activeSection === item.id
                  ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Icon className="h-5 w-5 mr-3" />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default Sidebar;
