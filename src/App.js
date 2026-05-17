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

import CommitteeForm from './pages/Committees/CommitteeForm';
import CountryForm from './pages/Countries/CountryForm';
import MemberForm from './pages/CountryCommitteeMembers/MemberForm';
import SubMemberForm from './pages/SubCommitteeMembers/MemberForm';
import SubMemberView from './pages/SubCommitteeMembers/MemberView';
import ArchiveMeetings from './pages/Meetings/ArchiveMeetings';
import MeetingResolutions from './pages/Resolutions/MeetingResolutions';
import CommitteeSecretaryTaskManagement from './pages/Tasks/CommitteeSecretaryTaskManagement';

import InvitationManager from './pages/InvitationManager/InvitationManager';
import EnhancedSendInvitations from './pages/InvitationManager/EnhancedSendInvitations';
import EnhancedMeetingInvitationManager from './pages/Meetings/EnhancedMeetingInvitationManager';
import EnhancedResolutionWorkflow from './pages/Resolutions/EnhancedResolutionWorkflow';

import Notifications from './pages/Notifications/Notifications';
import EARAPerformanceDashboardPage from './pages/EARAPerformanceDashboard/EARAPerformanceDashboardPage';
import SimplePerformanceDashboardPage from './pages/SimplePerformanceDashboard/SimplePerformanceDashboardPage';
import ReportsHubPage from './pages/Reports/ReportsHubPage';
import FilterReportsPage from './pages/Reports/FilterReportsPage';

const AuthService = {
  SESSION_TIMEOUT: 30 * 60 * 1000,
  ACTIVITY_CHECK_INTERVAL: 60 * 1000,

  getCurrentUser: () => {
    try {
      const userData = localStorage.getItem('user');
      const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
      const lastActivity = localStorage.getItem('lastActivity');

      console.log('[AUTH:getCurrentUser] isAuthenticated flag:', isAuthenticated);
      console.log('[AUTH:getCurrentUser] userData exists:', !!userData);
      console.log('[AUTH:getCurrentUser] lastActivity:', lastActivity);

      if (isAuthenticated && userData) {
        if (lastActivity) {
          const timeSinceLastActivity = Date.now() - parseInt(lastActivity, 10);
          const minutesAgo = Math.round(timeSinceLastActivity / 60000);
          console.log('[AUTH:getCurrentUser] Time since last activity:', minutesAgo, 'minutes');
          console.log('[AUTH:getCurrentUser] Session timeout is:', AuthService.SESSION_TIMEOUT / 60000, 'minutes');
          if (timeSinceLastActivity > AuthService.SESSION_TIMEOUT) {
            console.warn('[AUTH:getCurrentUser] ⏰ Session EXPIRED — logging out');
            AuthService.logout();
            return null;
          }
        }
        AuthService.updateActivity();
        const parsed = JSON.parse(userData);
        console.log('[AUTH:getCurrentUser] ✅ Returning user:', parsed?.email);
        return parsed;
      }
      console.warn('[AUTH:getCurrentUser] ❌ isAuthenticated=false or no userData — returning null');
      return null;
    } catch (error) {
      console.error('[AUTH:getCurrentUser] 💥 Error parsing user:', error);
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

  verifySession: async () => {
    const localUser = AuthService.getCurrentUser();
    const url = `${API_BASE}/auth/current-user`;
    console.log('[AUTH:verifySession] 📡 Fetching:', url);
    console.log('[AUTH:verifySession] API_BASE value:', API_BASE);
    try {
      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      console.log('[AUTH:verifySession] 📥 Response status:', response.status);
      console.log('[AUTH:verifySession] 📥 Response ok:', response.ok);

      if (response.ok) {
        const userData = await response.json();
        console.log('[AUTH:verifySession] 📥 Response data:', userData);
        if (userData && userData.id) {
          localStorage.setItem('user', JSON.stringify(userData));
          localStorage.setItem('isAuthenticated', 'true');
          AuthService.updateActivity();
          console.log('[AUTH:verifySession] ✅ Session valid for:', userData.email);
          return userData;
        }
        console.warn('[AUTH:verifySession] ⚠️ Response ok but no id in data:', userData);
      }

      if (response.status === 401) {
        console.warn('[AUTH:verifySession] 🔒 401 — session truly invalid, logging out');
        AuthService.logout();
        return null;
      }

      console.warn('[AUTH:verifySession] ⚠️ Status', response.status, '— keeping local session');
      return localUser;

    } catch (error) {
      console.error('[AUTH:verifySession] 💥 Network/fetch error:', error.message);
      console.error('[AUTH:verifySession] 💥 Full error:', error);
      console.warn('[AUTH:verifySession] ↩️ Falling back to localUser:', localUser?.email);
      return localUser;
    }
  },
};

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

const ProtectedRoute = ({ children, requiredPermissions = [], user }) => {
  if (!AuthService.isAuthenticated() || !user?.role) {
    return <Navigate to="/login" replace />;
  }

  const userPermissions = ROLE_PERMISSIONS[user.role];
  if (!userPermissions) {
    return <Navigate to="/login" replace />;
  }

  if (requiredPermissions.length > 0) {
    const hasPermission = requiredPermissions.some(permission =>
      userPermissions.routes.some(route =>
        route === permission || (permission.startsWith(route) && (permission[route.length] === '/' || route.endsWith('/')))
      )
    );

    if (!hasPermission) {
      AuthService.logout();
      return <Navigate to="/login" replace />;
    }
  }

  return children;
};

const DashboardRouter = ({ user }) => {
  const getDefaultDashboard = (user) => {
    if (HODPermissionService.hasHODPrivileges(user)) return '/hod/dashboard';
    if (user.role === 'COMMISSIONER_GENERAL') return '/commissioner/dashboard';
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
      console.log('[APP:INIT] ▶️ initializeAuth started');
      console.log('[APP:INIT] 📦 localStorage keys:', Object.keys(localStorage));
      console.log('[APP:INIT] 📦 isAuthenticated in storage:', localStorage.getItem('isAuthenticated'));
      console.log('[APP:INIT] 📦 user in storage:', localStorage.getItem('user'));
      console.log('[APP:INIT] 📦 lastActivity in storage:', localStorage.getItem('lastActivity'));

      try {
        const localUser = AuthService.getCurrentUser();
        console.log('[APP:INIT] 👤 getCurrentUser() returned:', localUser);

        if (!localUser) {
          console.log('[APP:INIT] ❌ No local user — staying on loading until we confirm no session');
          setIsAuthenticated(false);
          setUser(null);
          // DO NOT setLoading(false) here — stay stuck so we can see this in console
          // Comment the next line in once we know why localUser is null:
          // setLoading(false);
          console.log('[APP:INIT] ⏸️  STUCK HERE — localUser is null. Check localStorage above.');
          return;
        }

        console.log('[APP:INIT] ✅ Local user found:', localUser.email, '| role:', localUser.role);
        console.log('[APP:INIT] 🌐 API_BASE is:', API_BASE);
        console.log('[APP:INIT] 📡 Calling verifySession → GET', API_BASE + '/auth/current-user');

        const verifiedUser = await AuthService.verifySession();

        console.log('[APP:INIT] 📥 verifySession returned:', verifiedUser);

        if (verifiedUser) {
          console.log('[APP:INIT] ✅ Verified! Setting user + isAuthenticated=true, then setLoading(false)');
          setUser(verifiedUser);
          setIsAuthenticated(true);
          console.log('[APP:INIT] 🔓 About to call setLoading(false)...');
          setLoading(false);
          console.log('[APP:INIT] 🟢 setLoading(false) called — dashboard should render now');
        } else {
          console.warn('[APP:INIT] ❌ verifySession returned null — going to login');
          setIsAuthenticated(false);
          setUser(null);
          setLoading(false);
        }

      } catch (error) {
        console.error('[APP:INIT] 💥 Caught error in initializeAuth:', error);
        console.error('[APP:INIT] 💥 Error message:', error.message);
        console.error('[APP:INIT] 💥 Error stack:', error.stack);
        const localUser = AuthService.getCurrentUser();
        console.log('[APP:INIT] 🔄 Fallback: getCurrentUser after error:', localUser);
        if (localUser) {
          setUser(localUser);
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
          setUser(null);
        }
        setLoading(false);
      }
    };

    initializeAuth();

    const handleStorageChange = (e) => {
      if (e.key === 'isAuthenticated' || e.key === 'user') {
        initializeAuth();
      }
    };

    const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    const handleActivity = () => {
      if (AuthService.isAuthenticated()) AuthService.updateActivity();
    };

    const sessionCheckInterval = setInterval(() => {
      if (isAuthenticated) {
        const isStillValid = AuthService.isAuthenticated();
        if (!isStillValid) {
          setIsAuthenticated(false);
          setUser(null);
          window.location.href = '/login';
        }
      }
    }, AuthService.ACTIVITY_CHECK_INTERVAL);

    activityEvents.forEach(event => window.addEventListener(event, handleActivity));
    window.addEventListener('storage', handleStorageChange);

    return () => {
      clearInterval(sessionCheckInterval);
      activityEvents.forEach(event => window.removeEventListener(event, handleActivity));
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []); // ← empty: run once on mount only

  if (loading) {
    return <LoadingScreen message="Initializing dashboard..." />;
  }

  return (
    <ThemeProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<PublicLayout><HomePage /></PublicLayout>} />
          <Route path="/login" element={<PublicLayout><Login /></PublicLayout>} />
          <Route path="/forgot-password" element={<PublicLayout><ForgotPassword /></PublicLayout>} />
          <Route path="/reset-password" element={<PublicLayout><ResetPassword /></PublicLayout>} />

          {/* Protected Routes */}
          <Route
            path="/*"
            element={
              isAuthenticated && user ? (
                <Layout user={user}>
                  <Routes>
                    <Route path="/dashboard" element={<DashboardRouter user={user} />} />

                    <Route path="/admin/dashboard" element={<ProtectedRoute user={user} requiredPermissions={['/admin/dashboard']}><EnhancedAdminDashboard /></ProtectedRoute>} />
                    <Route path="/secretary/dashboard" element={<ProtectedRoute user={user} requiredPermissions={['/secretary/dashboard']}><ComprehensiveSecretaryDashboard /></ProtectedRoute>} />
                    <Route path="/chair/dashboard" element={<ProtectedRoute user={user} requiredPermissions={['/chair/dashboard']}><EnhancedChairDashboard /></ProtectedRoute>} />
                    <Route path="/hod/dashboard" element={<ProtectedRoute user={user} requiredPermissions={['/hod/dashboard']}><EnhancedHODDashboard /></ProtectedRoute>} />
                    <Route path="/commissioner/dashboard" element={<ProtectedRoute user={user} requiredPermissions={['/commissioner/dashboard']}><EnhancedCommissionerDashboard /></ProtectedRoute>} />
                    <Route path="/activities" element={<Navigate to="/commissioner/dashboard" replace />} />
                    <Route path="/member/dashboard" element={<ProtectedRoute user={user} requiredPermissions={['/member/dashboard']}><EnhancedMemberDashboard /></ProtectedRoute>} />

                    <Route path="/eara-performance-dashboard" element={<ProtectedRoute user={user} requiredPermissions={['/eara-performance-dashboard']}><EARAPerformanceDashboardPage /></ProtectedRoute>} />
                    <Route path="/simple-performance-dashboard" element={<ProtectedRoute user={user} requiredPermissions={['/simple-performance-dashboard']}><SimplePerformanceDashboardPage /></ProtectedRoute>} />

                    <Route path="/committees" element={<ProtectedRoute user={user} requiredPermissions={['/committees']}><CommitteeList /></ProtectedRoute>} />
                    <Route path="/committees/new" element={<ProtectedRoute user={user} requiredPermissions={['/committees']}><CommitteeForm /></ProtectedRoute>} />
                    <Route path="/committees/:id/edit" element={<ProtectedRoute user={user} requiredPermissions={['/committees']}><CommitteeForm /></ProtectedRoute>} />

                    <Route path="/countries" element={<ProtectedRoute user={user} requiredPermissions={['/countries']}><CountryList /></ProtectedRoute>} />
                    <Route path="/countries/new" element={<ProtectedRoute user={user} requiredPermissions={['/countries']}><CountryForm /></ProtectedRoute>} />
                    <Route path="/countries/:id/edit" element={<ProtectedRoute user={user} requiredPermissions={['/countries']}><CountryForm /></ProtectedRoute>} />

                    <Route path="/members" element={<ProtectedRoute user={user} requiredPermissions={['/members']}><MemberList /></ProtectedRoute>} />
                    <Route path="/members/new" element={<ProtectedRoute user={user} requiredPermissions={['/members']}><MemberForm /></ProtectedRoute>} />
                    <Route path="/members/:id/edit" element={<ProtectedRoute user={user} requiredPermissions={['/members']}><MemberForm /></ProtectedRoute>} />

                    <Route path="/sub-committee-members" element={<ProtectedRoute user={user} requiredPermissions={['/sub-committee-members']}><SubMemberList /></ProtectedRoute>} />
                    <Route path="/sub-committee-members/new" element={<ProtectedRoute user={user} requiredPermissions={['/sub-committee-members']}><SubMemberForm /></ProtectedRoute>} />
                    <Route path="/sub-committee-members/:id/edit" element={<ProtectedRoute user={user} requiredPermissions={['/sub-committee-members']}><SubMemberForm /></ProtectedRoute>} />
                    <Route path="/sub-committee-members/:id" element={<ProtectedRoute user={user} requiredPermissions={['/sub-committee-members']}><SubMemberView /></ProtectedRoute>} />

                    <Route path="/meetings/create" element={<ProtectedRoute user={user} requiredPermissions={['/meetings']}><CreateMeeting /></ProtectedRoute>} />
                    <Route path="/meetings/archive" element={<ProtectedRoute user={user} requiredPermissions={['/meetings']}><ArchiveMeetings /></ProtectedRoute>} />
                    <Route path="/meetings/:meetingId/resolutions" element={<ProtectedRoute user={user} requiredPermissions={['/meetings']}><MeetingResolutions /></ProtectedRoute>} />
                    <Route path="/meetings/:meetingId/tasks" element={<ProtectedRoute user={user} requiredPermissions={['/meetings']}><MeetingResolutions /></ProtectedRoute>} />
                    <Route path="/meetings/:meetingId/task-management" element={<ProtectedRoute user={user} requiredPermissions={['/meetings']}><CommitteeSecretaryTaskManagement /></ProtectedRoute>} />

                    <Route path="/invitations" element={<ProtectedRoute user={user} requiredPermissions={['/invitations']}><InvitationManager /></ProtectedRoute>} />
                    <Route path="/invitations/send" element={<ProtectedRoute user={user} requiredPermissions={['/invitations']}><EnhancedSendInvitations /></ProtectedRoute>} />
                    <Route path="/invitations/manage" element={<ProtectedRoute user={user} requiredPermissions={['/invitations']}><InvitationManager /></ProtectedRoute>} />

                    <Route path="/profile" element={<ProtectedRoute user={user} requiredPermissions={['/profile']}><UserProfile /></ProtectedRoute>} />

                    <Route path="/secretary/meeting-invitations" element={<ProtectedRoute user={user} requiredPermissions={['/secretary/dashboard']}><EnhancedMeetingInvitationManager /></ProtectedRoute>} />
                    <Route path="/secretary/resolution-assignment" element={<ProtectedRoute user={user} requiredPermissions={['/secretary/dashboard']}><EnhancedResolutionWorkflow /></ProtectedRoute>} />
                    <Route path="/meeting-invitations/enhanced" element={<ProtectedRoute user={user} requiredPermissions={['/invitations']}><EnhancedMeetingInvitationManager /></ProtectedRoute>} />
                    <Route path="/resolutions/enhanced" element={<ProtectedRoute user={user} requiredPermissions={['/resolutions']}><EnhancedResolutionWorkflow /></ProtectedRoute>} />

                    <Route path="/minutes/take" element={<ProtectedRoute user={user} requiredPermissions={['/minutes']}><TakeMinutes /></ProtectedRoute>} />
                    <Route path="/attendance/take" element={<ProtectedRoute user={user} requiredPermissions={['/attendance']}><TakeAttendance /></ProtectedRoute>} />
                    <Route path="/notifications" element={<ProtectedRoute user={user} requiredPermissions={['/notifications']}><Notifications /></ProtectedRoute>} />
                    <Route path="/reports" element={<ProtectedRoute user={user} requiredPermissions={['/reports']}><ReportsHubPage /></ProtectedRoute>} />
                    <Route path="/reports/filter" element={<ProtectedRoute user={user} requiredPermissions={['/reports/filter']}><FilterReportsPage /></ProtectedRoute>} />

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