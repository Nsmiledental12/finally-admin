import React, { useState, useEffect } from 'react';
import LoginPage from './components/LoginPage';
import ForgotPasswordPage from './components/ForgotPasswordPage';
import ResetPasswordPage from './components/ResetPasswordPage';
import Sidebar from './components/Sidebar';
import DoctorApplications from './components/DoctorApplications';
import DoctorManagement from './components/DoctorManagement';
import ClinicManagement from './components/ClinicManagement';
import UserManagement from './components/UserManagement';
import Analytics from './components/Analytics';
import AdminSettings from './components/AdminSettings';
import SuperAdminProfile from './components/SuperAdminProfile';

type AuthView = 'login' | 'forgot-password' | 'reset-password';

function App() {
  const [activeSection, setActiveSection] = useState('applications');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<'super_admin' | 'admin' | 'moderator'>('super_admin');
  const [authView, setAuthView] = useState<AuthView>('login');
  const [resetToken, setResetToken] = useState<string>('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');

    if (token) {
      setResetToken(token);
      setAuthView('reset-password');
      window.history.replaceState({}, document.title, window.location.pathname);
      return;
    }

    const authToken = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (authToken && userStr) {
      try {
        const user = JSON.parse(userStr);
        setIsAuthenticated(true);

        if (user.userType === 'super_admin') {
          setUserRole('super_admin');
        } else if (user.role === 'moderator') {
          setUserRole('moderator');
        } else {
          setUserRole('admin');
        }
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
  }, []);

  const renderActiveSection = () => {
    if ((activeSection === 'settings' || activeSection === 'profile') && userRole !== 'super_admin') {
      setActiveSection('applications');
      return <DoctorApplications userRole={userRole} />;
    }

    switch (activeSection) {
      case 'applications':
        return <DoctorApplications userRole={userRole} />;
      case 'doctors':
        return <DoctorManagement />;
      case 'clinics':
        return <ClinicManagement />;
      case 'users':
        return <UserManagement />;
      case 'analytics':
        return <Analytics />;
      case 'profile':
        return <SuperAdminProfile />;
      case 'settings':
        return <AdminSettings />;
      default:
        return <DoctorApplications userRole={userRole} />;
    }
  };

  const handleLogin = (role: 'super_admin' | 'admin' | 'moderator' = 'super_admin') => {
    setIsAuthenticated(true);
    setUserRole(role);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setActiveSection('applications');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  // Show authentication pages if not authenticated
  if (!isAuthenticated) {
    if (authView === 'forgot-password') {
      return (
        <ForgotPasswordPage
          onBackToLogin={() => setAuthView('login')}
        />
      );
    }

    if (authView === 'reset-password') {
      return (
        <ResetPasswordPage
          token={resetToken}
          onResetSuccess={() => {
            setAuthView('login');
            setResetToken('');
          }}
        />
      );
    }

    return (
      <LoginPage
        onLogin={handleLogin}
        onForgotPassword={() => setAuthView('forgot-password')}
      />
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar activeSection={activeSection} setActiveSection={setActiveSection} userRole={userRole} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <img
                src="https://files.catbox.moe/cctahm.png"
                alt="Logo"
                className="h-10 w-auto object-contain"
              />
              <h1 className="text-2xl font-semibold text-gray-900">
                Medical Admin Dashboard
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                {userRole === 'super_admin' ? 'Super Admin' : userRole === 'admin' ? 'Admin' : 'Moderator'}
              </div>
              <button
                onClick={handleLogout}
                className="bg-red-50 text-red-700 px-3 py-1 rounded-full text-sm font-medium hover:bg-red-100 transition-colors duration-200"
              >
                Logout
              </button>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-6">
          {renderActiveSection()}
        </main>
      </div>
    </div>
  );
}

export default App;
