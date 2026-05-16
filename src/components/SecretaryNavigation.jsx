import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  FaDashboard, 
  FaEnvelope, 
  FaFileAlt, 
  FaUsers, 
  FaCog, 
  FaSignOutAlt,
  FaBars,
  FaTimes,
  FaTestTube,
  FaChartLine
} from 'react-icons/fa';

const SecretaryNavigation = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    {
      title: 'Dashboard',
      icon: FaDashboard,
      path: '/secretary/dashboard',
      description: 'Overview and statistics'
    },
    {
      title: 'Meeting Invitations',
      icon: FaEnvelope,
      path: '/invitations/send',
      description: 'Send meeting invitations'
    },
    {
      title: 'Resolution Assignment',
      icon: FaFileAlt,
      path: '/resolutions/enhanced',
      description: 'Assign tasks to committees'
    },
    {
      title: 'Test Interface',
      icon: FaTestTube,
      path: '/test-interface',
      description: 'Quick testing tools'
    }
  ];

  const handleNavigation = (path) => {
    navigate(path);
    setIsMobileMenuOpen(false);
  };

  const isActivePath = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <>
      {/* Top Navigation Bar */}
      <nav className="nav" style={{
        background: 'linear-gradient(135deg, white 0%, var(--gray-50) 100%)',
        borderBottom: `1px solid var(--gray-200)`,
        position: 'sticky',
        top: 0,
        zIndex: 50
      }}>
        <div className="container">
          <div className="flex justify-between items-center h-16">
            {/* Logo/Brand */}
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, var(--primary-500) 0%, var(--secondary-500) 100%)'
                }}
              >
                <span className="text-white text-lg">🏛️</span>
              </div>
              <div>
                <h1 className="nav-brand text-xl">EAC Secretary Portal</h1>
                <p className="text-xs" style={{color: 'var(--gray-500)'}}>East African Community Connect</p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-2">
              {navItems.map((item, index) => (
                <button
                  key={index}
                  onClick={() => handleNavigation(item.path)}
                  className={`nav-link ${isActivePath(item.path) ? 'active' : ''}`}
                  title={item.description}
                >
                  <item.icon className="text-sm" />
                  <span className="text-sm">{item.title}</span>
                </button>
              ))}
            </div>

            {/* User Menu */}
            <div className="flex items-center gap-4">
              {/* User Info */}
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium" style={{color: 'var(--gray-800)'}}>{user?.name}</p>
                <p className="text-xs" style={{color: 'var(--gray-500)'}}>{user?.role}</p>
              </div>

              {/* User Avatar */}
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold"
                style={{
                  background: 'linear-gradient(135deg, var(--primary-500) 0%, var(--secondary-500) 100%)'
                }}
              >
                {user?.name?.charAt(0)?.toUpperCase() || 'S'}
              </div>

              {/* Logout Button */}
              <button
                onClick={onLogout}
                className="btn btn-secondary btn-sm"
                title="Logout"
              >
                <FaSignOutAlt />
                <span className="hidden sm:inline">Logout</span>
              </button>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden btn btn-secondary btn-sm"
              >
                {isMobileMenuOpen ? <FaTimes /> : <FaBars />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>
      )}

      {/* Mobile Menu */}
      <div 
        className={`fixed top-16 right-0 h-full w-80 bg-white shadow-xl transform transition-transform duration-300 ease-in-out z-50 md:hidden ${
          isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2" style={{color: 'var(--gray-800)'}}>Navigation</h3>
            <p className="text-sm" style={{color: 'var(--gray-600)'}}>Access all secretary functions</p>
          </div>

          <div className="space-y-2">
            {navItems.map((item, index) => (
              <button
                key={index}
                onClick={() => handleNavigation(item.path)}
                className={`w-full text-left p-4 rounded-lg border transition-all ${
                  isActivePath(item.path)
                    ? 'border-primary-300 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div 
                    className={`p-2 rounded-lg ${
                      isActivePath(item.path)
                        ? 'bg-primary-500 text-white'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    <item.icon />
                  </div>
                  <div>
                    <h4 className="font-medium" style={{color: 'var(--gray-800)'}}>{item.title}</h4>
                    <p className="text-sm" style={{color: 'var(--gray-600)'}}>{item.description}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div className="mt-8 pt-6 border-t" style={{borderColor: 'var(--gray-200)'}}>
            <div className="flex items-center gap-3 mb-4">
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold"
                style={{
                  background: 'linear-gradient(135deg, var(--primary-500) 0%, var(--secondary-500) 100%)'
                }}
              >
                {user?.name?.charAt(0)?.toUpperCase() || 'S'}
              </div>
              <div>
                <p className="font-medium" style={{color: 'var(--gray-800)'}}>{user?.name}</p>
                <p className="text-sm" style={{color: 'var(--gray-600)'}}>{user?.role}</p>
              </div>
            </div>
            
            <button
              onClick={() => {
                onLogout();
                setIsMobileMenuOpen(false);
              }}
              className="btn btn-error w-full"
            >
              <FaSignOutAlt />
              Logout
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default SecretaryNavigation;