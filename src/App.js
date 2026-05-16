import React, { useState, useEffect } from 'react';
import { API_BASE } from './services/apiConfig';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import HODPermissionService from './services/hodPermissionService';

// Import Global Styles and Theme
import './styles/GlobalStyles.css';
import './styles/shared/loaders.css';
import './styles/Theme.css';
import './styles/DarkModeOverrides.css';
import { ThemeProvider } from './context/ThemeContext';

// Components and Layout
import Layout from './components/Layout';
import PublicLayout from './components/PublicLayout';
import LoadingScreen from './components/LoadingScreen';

// Eagerly loaded pages (critical path)
import HomePage from './pages/HomePage';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

// Eagerly load dashboards for instant navigation
import EnhancedAdminDashboard from './pages/EnhancedAdminDashboard';
import ComprehensiveSecretaryDashboard from './pages/SecretaryPortal/ComprehensiveSecretaryDashboard';
import EnhancedChairDashboard from './pages/ChairDashboard/EnhancedChairDashboard';
import EnhancedHODDashboard from './pages/EnhancedHODDashboard';
import EnhancedCommissionerDashboard from './pages/EnhancedCommissionerDashboard';
import EnhancedMemberDashboard from './pages/EnhancedMemberDashboard';

// Eagerly load frequently used pages
import CommitteeList from './pages/Committees/CommitteeList';
import CountryList from './pages/Countries/CountryList';
import MemberList from './pages/CountryCommitteeMembers/MemberList';
import SubMemberList from './pages/SubCommitteeMembers/MemberList';
import CreateMeeting from './pages/Meetings/CreateMeeting';
import TakeMinutes from './pages/Minutes/TakeMinutes';
import TakeAttendance from './pages/Attendance/TakeAttendance';
import UserProfile from './pages/UserProfile/UserProfile';

// Eagerly load all pages for instant navigation
import CommitteeForm from './pages/Committees/CommitteeForm';
import CountryForm from './pages/Countries/CountryForm';
import MemberForm from './pages/CountryCommitteeMembers/MemberForm';
import SubMemberForm from './pages/SubCommitteeMembers/MemberForm';
import SubMemberView from './pages/SubCommitteeMembers/MemberView';
import ArchiveMeetings from './pages/Meetings/ArchiveMeetings';
import MeetingResolutions from './pages/Resolutions/MeetingResolutions';
import CommitteeSecretaryTaskManagement from './pages/Tasks/CommitteeSecretaryTaskManagement';

// Invitation Pages
import InvitationManager from './pages/InvitationManager/InvitationManager';
import EnhancedSendInvitations from './pages/InvitationManager/EnhancedSendInvitations';

// Enhanced Secretary Portal Components
import EnhancedMeetingInvitationManager from './pages/Meetings/EnhancedMeetingInvitationManager';
import EnhancedResolutionWorkflow from './pages/Resolutions/EnhancedResolutionWorkflow';

// Other Pages
import Notifications from './pages/Notifications/Notifications';
import EARAPerformanceDashboardPage from './pages/EARAPerformanceDashboard/EARAPerformanceDashboardPage';
import SimplePerformanceDashboardPage from './pages/SimplePerformanceDashboard/SimplePerformanceDashboardPage';
import ReportsHubPage from './pages/Reports/ReportsHubPage';
import FilterReportsPage from './pages/Reports/FilterReportsPage';

// Authentication Service (single source of truth)
const AuthService = {
  SESSION_TIMEOUT: 30 * 60 * 1000, // 30 minutes in milliseconds
  ACTIVITY_CHECK_INTERVAL: 60 * 1000, // Check every minute

  getCurrentUser: () => {
    try {
      const userData = localStorage.getItem('user');
      const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
      const lastActivity = localStorage.getItem('lastActivity');
      
      if (isAuthenticated && userData) {
        // Check if session has expired
        if (lastActivity) {
          const timeSinceLastActivity = Date.now() - parseInt(lastActivity, 10);
          if (timeSinceLastActivity > AuthService.SESSION_TIMEOUT) {
            // Session expired, clear everything
            AuthService.logout();
            return null;
          }
        }
        
        // Update last activity timestamp
        AuthService.updateActivity();
        return JSON.parse(userData);
      }
      return null;
    } catch (error) {
      return null;
    }
  },

  isAuthenticated: () => {
    const user = AuthService.getCurrentUser();
    return !!(user && user.id);
  },

  updateActivity: () => {
    localStorage.setItem('lastActivity', Date.now().toString());
  },

  logout: () => {
    localStorage.removeItem('user');
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('token');
    localStorage.removeItem('lastActivity');
  },

  // Verify session with backend
  verifySession: async () => {
    try {
      // Try to fetch current user from backend to verify session is still valid
      const response = await fetch(`${API_BASE}/auth/current-user`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const userData = await response.json();
        if (userData && userData.id) {
          // Session is valid, update localStorage
          localStorage.setItem('user', JSON.stringify(userData));
          localStorage.setItem('isAuthenticated', 'true');
          AuthService.updateActivity();
          return userData;
        }
      }
      
      // Session invalid, clear localStorage
      AuthService.logout();
      return null;
    } catch (error) {
      console.error('Session verification failed:', error);
      // On error, clear localStorage and return null
      AuthService.logout();
      return null;
    }
  }
};

// Role-based access control configuration
const ROLE_PERMISSIONS = {
  ADMIN: {
    dashboards: ['/admin/dashboard'],
    routes: [
      '/dashboard', '/admin/dashboard', '/committees', '/countries',
      '/members', '/sub-committee-members', '/meetings', '/invitations',
      '/notifications', '/resolutions', '/reports', '/profile',
      '/simple-performance-dashboard', '/eara-performance-dashboard'
    ]
  },
  SECRETARY: {
    dashboards: ['/secretary/dashboard'],
    routes: [
      '/dashboard', '/secretary/dashboard', '/committees', '/countries',
      '/members', '/sub-committee-members', '/meetings', '/minutes',
      '/resolutions', '/invitations', '/notifications', '/meetings/archive',
      '/minutes/take', '/resolutions/meeting', '/attendance', '/profile',
      '/simple-performance-dashboard'
    ]
  },
  CHAIR: {
    dashboards: ['/chair/dashboard', '/hod/dashboard'],
    routes: [
      '/dashboard', '/chair/dashboard', '/hod/dashboard', '/committees', '/members',
      '/sub-committee-members', '/meetings', '/invitations', '/notifications',
      '/reports', '/resolutions', '/hod/reports', '/hod/profile',
      '/hod/notifications', '/countries', '/profile', '/simple-performance-dashboard'
    ]
  },
  VICE_CHAIR: {
    dashboards: ['/chair/dashboard', '/hod/dashboard'],
    routes: [
      '/dashboard', '/chair/dashboard', '/hod/dashboard', '/committees', '/members',
      '/sub-committee-members', '/meetings', '/invitations', '/notifications',
      '/reports', '/resolutions', '/hod/reports', '/hod/profile',
      '/hod/notifications', '/countries', '/profile', '/simple-performance-dashboard'
    ]
  },
  COMMISSIONER_GENERAL: {
    dashboards: ['/commissioner/dashboard', '/eara-performance-dashboard'],
    routes: [
      '/dashboard', '/commissioner/dashboard', '/activities', '/committees', '/countries',
      '/members', '/sub-committee-members', '/meetings', '/invitations',
      '/notifications', '/reports', '/resolutions', '/eara-performance-dashboard',
      '/simple-performance-dashboard', '/meetings/archive', '/profile'
    ]
  },
  SUBCOMMITTEE_MEMBER: {
    dashboards: ['/member/dashboard'],
    routes: ['/dashboard', '/member/dashboard', '/committees', '/notifications',
      '/reports', '/meetings', '/countries', '/profile', '/simple-performance-dashboard']
  },
  COMMITTEE_MEMBER: {
    dashboards: ['/member/dashboard'],
    routes: ['/dashboard', '/member/dashboard', '/committees', '/notifications',
      '/reports', '/meetings', '/countries', '/profile', '/simple-performance-dashboard']
  },
  COMMITTEE_SECRETARY: {
    dashboards: ['/secretary/dashboard'],
    routes: [
      '/dashboard', '/secretary/dashboard', '/member/dashboard', '/committees',
      '/sub-committee-members', '/meetings', '/minutes', '/invitations',
      '/notifications', '/reports', '/countries', '/minutes/take',
      '/resolutions', '/attendance', '/profile', '/simple-performance-dashboard',
      '/meetings/archive'
    ]
  },
  DELEGATION_SECRETARY: {
    dashboards: ['/secretary/dashboard'],
    routes: [
      '/dashboard', '/secretary/dashboard', '/member/dashboard', '/committees',
      '/members', '/sub-committee-members', '/meetings', '/minutes', '/invitations',
      '/notifications', '/reports', '/countries', '/minutes/take',
      '/resolutions', '/attendance', '/profile', '/simple-performance-dashboard',
      '/meetings/archive'
    ]
  },
  HOD: {
    dashboards: ['/hod/dashboard', '/chair/dashboard'],
    routes: [
      '/dashboard', '/hod/dashboard', '/chair/dashboard', '/committees', '/members',
      '/sub-committee-members', '/meetings', '/invitations', '/notifications',
      '/reports', '/resolutions', '/hod/reports', '/hod/profile',
      '/hod/notifications', '/countries', '/profile', '/simple-performance-dashboard'
    ]
  },
  CHAIR_OF_HOD: {
    dashboards: ['/hod/dashboard', '/chair/dashboard'],
    routes: [
      '/dashboard', '/hod/dashboard', '/chair/dashboard', '/committees', '/members',
      '/sub-committee-members', '/meetings', '/invitations', '/notifications',
      '/reports', '/resolutions', '/hod/reports', '/hod/profile',
      '/hod/notifications', '/countries', '/profile', '/simple-performance-dashboard'
    ]
  }
};

// Enhanced Protected Route Component
const ProtectedRoute = ({ children, requiredPermissions = [], user }) => {
  if (!AuthService.isAuthenticated() || !user?.role) {
    return <Navigate to="/login" replace />;
  }

  const userPermissions = ROLE_PERMISSIONS[user.role];

  if (!userPermissions) {
    return <Navigate to="/login" replace />;
  }

  // Check if user has required permissions
  if (requiredPermissions.length > 0) {
    const hasPermission = requiredPermissions.some(permission =>
      userPermissions.routes.some(route =>
        route === permission || (permission.startsWith(route) && (permission[route.length] === '/' || route.endsWith('/')))
      )
    );

    if (!hasPermission) {
      // Unauthorized access attempt - force logout and redirect to login
      AuthService.logout();
      return <Navigate to="/login" replace />;
    }
  }

  return children;
};

// Dashboard Router Component
const DashboardRouter = ({ user }) => {
  const getDefaultDashboard = (user) => {
    // Check if user has HoD privileges first (Chair of Head of Delegation)
    if (HODPermissionService.hasHODPrivileges(user)) {
      return '/hod/dashboard';
    }

    // CG default dashboard is Commissioner Dashboard
    if (user.role === 'COMMISSIONER_GENERAL') {
      return '/commissioner/dashboard';
    }

    const permissions = ROLE_PERMISSIONS[user.role];
    return permissions?.dashboards[0] || '/member/dashboard';
  };

  return <Navigate to={getDefaultDashboard(user)} replace />;
};

function App() {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const isAuth = AuthService.isAuthenticated();
        const currentUser = AuthService.getCurrentUser();

        if (isAuth && currentUser) {
          // Verify session with backend to ensure it's still valid
          const verifiedUser = await AuthService.verifySession();
          
          if (verifiedUser) {
            setUser(verifiedUser);
            setIsAuthenticated(true);
          } else {
            // Session invalid, redirect to login
            setIsAuthenticated(false);
            setUser(null);
          }
        } else {
          setIsAuthenticated(false);
          setUser(null);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        setIsAuthenticated(false);
        setUser(null);
        localStorage.removeItem('user');
        localStorage.removeItem('isAuthenticated');
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for storage changes (logout from another tab)
    const handleStorageChange = (e) => {
      if (e.key === 'isAuthenticated' || e.key === 'user') {
        initializeAuth();
      }
    };

    // Track user activity to update session timestamp
    const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    const handleActivity = () => {
      if (AuthService.isAuthenticated()) {
        AuthService.updateActivity();
      }
    };

    // Check session validity periodically
    const sessionCheckInterval = setInterval(() => {
      if (isAuthenticated) {
        const isStillValid = AuthService.isAuthenticated();
        if (!isStillValid) {
          // Session expired, force logout
          setIsAuthenticated(false);
          setUser(null);
          window.location.href = '/login';
        }
      }
    }, AuthService.ACTIVITY_CHECK_INTERVAL);

    // Add activity listeners
    activityEvents.forEach(event => {
      window.addEventListener(event, handleActivity);
    });

    window.addEventListener('storage', handleStorageChange);

    return () => {
      clearInterval(sessionCheckInterval);
      activityEvents.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [isAuthenticated]);

  if (loading) {
    return <LoadingScreen message="Initializing dashboard..." />;
  }

  return (
    <ThemeProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route
            path="/"
            element={<PublicLayout><HomePage /></PublicLayout>}
          />
          <Route
            path="/login"
            element={<PublicLayout><Login /></PublicLayout>}
          />
          <Route path="/forgot-password" element={<PublicLayout><ForgotPassword /></PublicLayout>} />
          <Route path="/reset-password" element={<PublicLayout><ResetPassword /></PublicLayout>} />

          {/* Protected Routes */}
          <Route
            path="/*"
            element={
              isAuthenticated && user ? (
                <Layout user={user}>
                  <Routes>
                    {/* Dashboard Router */}
                    <Route
                      path="/dashboard"
                      element={<DashboardRouter user={user} />}
                    />

                    {/* Role-specific Dashboards */}
                    <Route
                      path="/admin/dashboard"
                      element={
                        <ProtectedRoute user={user} requiredPermissions={['/admin/dashboard']}>
                          <EnhancedAdminDashboard />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/secretary/dashboard"
                      element={
                        <ProtectedRoute user={user} requiredPermissions={['/secretary/dashboard']}>
                          <ComprehensiveSecretaryDashboard />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/chair/dashboard"
                      element={
                        <ProtectedRoute user={user} requiredPermissions={['/chair/dashboard']}>
                          <EnhancedChairDashboard />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/hod/dashboard"
                      element={
                        <ProtectedRoute user={user} requiredPermissions={['/hod/dashboard']}>
                          <EnhancedHODDashboard />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/commissioner/dashboard"
                      element={
                        <ProtectedRoute user={user} requiredPermissions={['/commissioner/dashboard']}>
                          <EnhancedCommissionerDashboard />
                        </ProtectedRoute>
                      }
                    />
                    {/* Keep /activities as alias for commissioner dashboard */}
                    <Route
                      path="/activities"
                      element={<Navigate to="/commissioner/dashboard" replace />}
                    />
                    <Route
                      path="/member/dashboard"
                      element={
                        <ProtectedRoute user={user} requiredPermissions={['/member/dashboard']}>
                          <EnhancedMemberDashboard />
                        </ProtectedRoute>
                      }
                    />

                    {/* Performance Dashboards */}
                    <Route
                      path="/eara-performance-dashboard"
                      element={
                        <ProtectedRoute user={user} requiredPermissions={['/eara-performance-dashboard']}>
                          <EARAPerformanceDashboardPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/simple-performance-dashboard"
                      element={
                        <ProtectedRoute user={user} requiredPermissions={['/simple-performance-dashboard']}>
                          <SimplePerformanceDashboardPage />
                        </ProtectedRoute>
                      }
                    />

                    {/* Committee Routes */}
                    <Route path="/committees" element={<ProtectedRoute user={user} requiredPermissions={['/committees']}><CommitteeList /></ProtectedRoute>} />
                    <Route path="/committees/new" element={<ProtectedRoute user={user} requiredPermissions={['/committees']}><CommitteeForm /></ProtectedRoute>} />
                    <Route path="/committees/:id/edit" element={<ProtectedRoute user={user} requiredPermissions={['/committees']}><CommitteeForm /></ProtectedRoute>} />

                    {/* Country Routes */}
                    <Route path="/countries" element={<ProtectedRoute user={user} requiredPermissions={['/countries']}><CountryList /></ProtectedRoute>} />
                    <Route path="/countries/new" element={<ProtectedRoute user={user} requiredPermissions={['/countries']}><CountryForm /></ProtectedRoute>} />
                    <Route path="/countries/:id/edit" element={<ProtectedRoute user={user} requiredPermissions={['/countries']}><CountryForm /></ProtectedRoute>} />

                    {/* Committee Members Routes */}
                    <Route path="/members" element={<ProtectedRoute user={user} requiredPermissions={['/members']}><MemberList /></ProtectedRoute>} />
                    <Route path="/members/new" element={<ProtectedRoute user={user} requiredPermissions={['/members']}><MemberForm /></ProtectedRoute>} />
                    <Route path="/members/:id/edit" element={<ProtectedRoute user={user} requiredPermissions={['/members']}><MemberForm /></ProtectedRoute>} />

                    {/* Sub-Committee Members Routes */}
                    <Route path="/sub-committee-members" element={<ProtectedRoute user={user} requiredPermissions={['/sub-committee-members']}><SubMemberList /></ProtectedRoute>} />
                    <Route path="/sub-committee-members/new" element={<ProtectedRoute user={user} requiredPermissions={['/sub-committee-members']}><SubMemberForm /></ProtectedRoute>} />
                    <Route path="/sub-committee-members/:id/edit" element={<ProtectedRoute user={user} requiredPermissions={['/sub-committee-members']}><SubMemberForm /></ProtectedRoute>} />
                    <Route path="/sub-committee-members/:id" element={<ProtectedRoute user={user} requiredPermissions={['/sub-committee-members']}><SubMemberView /></ProtectedRoute>} />

                    {/* Meeting Routes */}
                    <Route path="/meetings/create" element={<ProtectedRoute user={user} requiredPermissions={['/meetings']}><CreateMeeting /></ProtectedRoute>} />
                    <Route path="/meetings/archive" element={<ProtectedRoute user={user} requiredPermissions={['/meetings']}><ArchiveMeetings /></ProtectedRoute>} />
                    <Route path="/meetings/:meetingId/resolutions" element={<ProtectedRoute user={user} requiredPermissions={['/meetings']}><MeetingResolutions /></ProtectedRoute>} />
                    <Route path="/meetings/:meetingId/tasks" element={<ProtectedRoute user={user} requiredPermissions={['/meetings']}><MeetingResolutions /></ProtectedRoute>} />
                    <Route path="/meetings/:meetingId/task-management" element={<ProtectedRoute user={user} requiredPermissions={['/meetings']}><CommitteeSecretaryTaskManagement /></ProtectedRoute>} />

                    {/* Invitation Routes */}
                    <Route path="/invitations" element={<ProtectedRoute user={user} requiredPermissions={['/invitations']}><InvitationManager /></ProtectedRoute>} />
                    <Route path="/invitations/send" element={<ProtectedRoute user={user} requiredPermissions={['/invitations']}><EnhancedSendInvitations /></ProtectedRoute>} />
                    <Route path="/invitations/manage" element={<ProtectedRoute user={user} requiredPermissions={['/invitations']}><InvitationManager /></ProtectedRoute>} />

                    {/* User Profile */}
                    <Route path="/profile" element={<ProtectedRoute user={user} requiredPermissions={['/profile']}><UserProfile /></ProtectedRoute>} />

                    {/* Enhanced Secretary Portal Routes */}
                    <Route path="/secretary/meeting-invitations" element={<ProtectedRoute user={user} requiredPermissions={['/secretary/dashboard']}><EnhancedMeetingInvitationManager /></ProtectedRoute>} />
                    <Route path="/secretary/resolution-assignment" element={<ProtectedRoute user={user} requiredPermissions={['/secretary/dashboard']}><EnhancedResolutionWorkflow /></ProtectedRoute>} />
                    <Route path="/meeting-invitations/enhanced" element={<ProtectedRoute user={user} requiredPermissions={['/invitations']}><EnhancedMeetingInvitationManager /></ProtectedRoute>} />
                    <Route path="/resolutions/enhanced" element={<ProtectedRoute user={user} requiredPermissions={['/resolutions']}><EnhancedResolutionWorkflow /></ProtectedRoute>} />

                    {/* Minutes Routes */}
                    <Route path="/minutes/take" element={<ProtectedRoute user={user} requiredPermissions={['/minutes']}><TakeMinutes /></ProtectedRoute>} />

                    {/* Attendance Routes */}
                    <Route path="/attendance/take" element={<ProtectedRoute user={user} requiredPermissions={['/attendance']}><TakeAttendance /></ProtectedRoute>} />

                    {/* Notifications */}
                    <Route path="/notifications" element={<ProtectedRoute user={user} requiredPermissions={['/notifications']}><Notifications /></ProtectedRoute>} />

                    {/* Reports */}
                    <Route
                      path="/reports"
                      element={
                        <ProtectedRoute user={user} requiredPermissions={['/reports']}>
                          <ReportsHubPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/reports/filter"
                      element={
                        <ProtectedRoute user={user} requiredPermissions={['/reports/filter']}>
                          <FilterReportsPage />
                        </ProtectedRoute>
                      }
                    />

                    {/* Fallback - redirect to appropriate dashboard */}
                    <Route path="*" element={<DashboardRouter user={user} />} />
                  </Routes>
                </Layout>
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;