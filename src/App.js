import React, { useState, useEffect } from 'react';
import { API_BASE } from './services/apiConfig';
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
  Outlet
} from 'react-router-dom';

import HODPermissionService from './services/hodPermissionService';

// Styles
import './styles/GlobalStyles.css';
import './styles/shared/loaders.css';
import './styles/Theme.css';
import './styles/DarkModeOverrides.css';

import { ThemeProvider } from './context/ThemeContext';

// Layouts
import Layout from './components/Layout';
import PublicLayout from './components/PublicLayout';
import LoadingScreen from './components/LoadingScreen';

// Public Pages
import HomePage from './pages/HomePage';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

// Dashboards
import EnhancedAdminDashboard from './pages/EnhancedAdminDashboard';
import ComprehensiveSecretaryDashboard from './pages/SecretaryPortal/ComprehensiveSecretaryDashboard';
import EnhancedChairDashboard from './pages/ChairDashboard/EnhancedChairDashboard';
import EnhancedHODDashboard from './pages/EnhancedHODDashboard';
import EnhancedCommissionerDashboard from './pages/EnhancedCommissionerDashboard';
import EnhancedMemberDashboard from './pages/EnhancedMemberDashboard';

// Other Pages
import CommitteeList from './pages/Committees/CommitteeList';
import CountryList from './pages/Countries/CountryList';
import MemberList from './pages/CountryCommitteeMembers/MemberList';
import SubMemberList from './pages/SubCommitteeMembers/MemberList';
import CreateMeeting from './pages/Meetings/CreateMeeting';
import TakeMinutes from './pages/Minutes/TakeMinutes';
import TakeAttendance from './pages/Attendance/TakeAttendance';
import UserProfile from './pages/UserProfile/UserProfile';

const AuthService = {
  SESSION_TIMEOUT: 30 * 60 * 1000,
  ACTIVITY_CHECK_INTERVAL: 60 * 1000,

  getCurrentUser: () => {
    try {
      const userData = localStorage.getItem('user');
      const isAuthenticated =
        localStorage.getItem('isAuthenticated') === 'true';

      const lastActivity = localStorage.getItem('lastActivity');

      console.log(
        '[AUTH:getCurrentUser] isAuthenticated:',
        isAuthenticated
      );

      if (isAuthenticated && userData) {
        if (lastActivity) {
          const timeSinceLastActivity =
            Date.now() - parseInt(lastActivity, 10);

          if (timeSinceLastActivity > AuthService.SESSION_TIMEOUT) {
            console.warn('[AUTH] Session expired');
            AuthService.logout();
            return null;
          }
        }

        const parsed = JSON.parse(userData);

        console.log('[AUTH] Returning user:', parsed);

        return parsed;
      }

      return null;
    } catch (error) {
      console.error('[AUTH:getCurrentUser] Error:', error);
      return null;
    }
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

    try {
      const response = await fetch(
        `${API_BASE}/auth/current-user`,
        {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('[AUTH] verifySession status:', response.status);

      if (response.ok) {
        const userData = await response.json();

        console.log('[AUTH] verifySession userData:', userData);

        if (userData?.id) {
          localStorage.setItem(
            'user',
            JSON.stringify(userData)
          );

          localStorage.setItem(
            'isAuthenticated',
            'true'
          );

          AuthService.updateActivity();

          return userData;
        }
      }

      if (response.status === 401) {
        AuthService.logout();
        return null;
      }

      return localUser;
    } catch (error) {
      console.error('[AUTH] verifySession error:', error);

      return localUser;
    }
  }
};

const ROLE_PERMISSIONS = {
  ADMIN: {
    dashboards: ['/admin/dashboard'],
    routes: [
      '/dashboard',
      '/admin/dashboard',
      '/committees',
      '/countries',
      '/members',
      '/sub-committee-members',
      '/meetings',
      '/notifications',
      '/reports',
      '/profile'
    ]
  },

  SECRETARY: {
    dashboards: ['/secretary/dashboard'],
    routes: [
      '/dashboard',
      '/secretary/dashboard',
      '/committees',
      '/meetings',
      '/minutes',
      '/attendance',
      '/profile'
    ]
  },

  CHAIR: {
    dashboards: ['/chair/dashboard'],
    routes: [
      '/dashboard',
      '/chair/dashboard',
      '/reports',
      '/profile'
    ]
  },

  HOD: {
    dashboards: ['/hod/dashboard'],
    routes: [
      '/dashboard',
      '/hod/dashboard',
      '/reports',
      '/profile'
    ]
  },

  COMMISSIONER_GENERAL: {
    dashboards: ['/commissioner/dashboard'],
    routes: [
      '/dashboard',
      '/commissioner/dashboard',
      '/reports',
      '/profile'
    ]
  },

  COMMITTEE_MEMBER: {
    dashboards: ['/member/dashboard'],
    routes: [
      '/dashboard',
      '/member/dashboard',
      '/profile'
    ]
  }
};

const ProtectedLayout = ({
  user,
  isAuthenticated
}) => {

  console.log('[ProtectedLayout]', {
    user,
    isAuthenticated
  });

  if (!isAuthenticated || !user) {
    console.log('[ProtectedLayout] Redirect login');

    return <Navigate to="/login" replace />;
  }

  return (
    <Layout user={user}>
      <Outlet />
    </Layout>
  );
};

const ProtectedRoute = ({
  children,
  user,
  isAuthenticated,
  requiredPermissions = []
}) => {

  console.log('[ProtectedRoute]', {
    user,
    isAuthenticated,
    requiredPermissions
  });

  if (!isAuthenticated || !user?.role) {
    console.log('[ProtectedRoute] Redirect login');

    return <Navigate to="/login" replace />;
  }

  const userPermissions =
    ROLE_PERMISSIONS[user.role];

  if (!userPermissions) {
    console.log('[ProtectedRoute] No permissions');

    return <Navigate to="/login" replace />;
  }

  if (requiredPermissions.length > 0) {
    const hasPermission =
      requiredPermissions.some(permission =>
        userPermissions.routes.includes(permission)
      );

    console.log(
      '[ProtectedRoute] hasPermission:',
      hasPermission
    );

    if (!hasPermission) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return children;
};

const DashboardRouter = ({ user }) => {

  const getDefaultDashboard = () => {

    if (HODPermissionService.hasHODPrivileges(user)) {
      return '/hod/dashboard';
    }

    switch (user.role) {
      case 'ADMIN':
        return '/admin/dashboard';

      case 'SECRETARY':
        return '/secretary/dashboard';

      case 'CHAIR':
        return '/chair/dashboard';

      case 'HOD':
        return '/hod/dashboard';

      case 'COMMISSIONER_GENERAL':
        return '/commissioner/dashboard';

      default:
        return '/member/dashboard';
    }
  };

  return (
    <Navigate
      to={getDefaultDashboard()}
      replace
    />
  );
};

function App() {

  const [user, setUser] = useState(null);

  const [isAuthenticated, setIsAuthenticated] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {

    const initializeAuth = async () => {

      console.log('[APP INIT] START');

      try {

        const localUser =
          AuthService.getCurrentUser();

        console.log(
          '[APP INIT] localUser:',
          localUser
        );

        if (!localUser) {
          setUser(null);
          setIsAuthenticated(false);
          setLoading(false);
          return;
        }

        const verifiedUser =
          await AuthService.verifySession();

        console.log(
          '[APP INIT] verifiedUser:',
          verifiedUser
        );

        if (verifiedUser) {

          setUser(verifiedUser);

          setIsAuthenticated(true);

          AuthService.updateActivity();

        } else {

          setUser(null);

          setIsAuthenticated(false);
        }

      } catch (error) {

        console.error(
          '[APP INIT] Error:',
          error
        );

        setUser(null);

        setIsAuthenticated(false);

      } finally {

        setLoading(false);
      }
    };

    initializeAuth();

    const activityEvents = [
      'mousedown',
      'keydown',
      'scroll',
      'touchstart',
      'click'
    ];

    const handleActivity = () => {
      if (isAuthenticated) {
        AuthService.updateActivity();
      }
    };

    activityEvents.forEach(event => {
      window.addEventListener(
        event,
        handleActivity
      );
    });

    return () => {
      activityEvents.forEach(event => {
        window.removeEventListener(
          event,
          handleActivity
        );
      });
    };

  }, []);

  console.log('[APP RENDER]', {
    loading,
    isAuthenticated,
    user
  });

  if (loading) {
    return (
      <LoadingScreen
        message="Initializing dashboard..."
      />
    );
  }

  return (
    <ThemeProvider>
      <Router>

        <Routes>

          {/* PUBLIC */}

          <Route
            path="/"
            element={
              <PublicLayout>
                <HomePage />
              </PublicLayout>
            }
          />

         <Route
  path="/login"
  element={
    isAuthenticated ? (
      <Navigate to="/dashboard" replace />
    ) : (
      <PublicLayout>
        <Login />
      </PublicLayout>
    )
  }
/>

         <Route
  path="/forgot-password"
  element={
    isAuthenticated ? (
      <Navigate to="/dashboard" replace />
    ) : (
      <PublicLayout>
        <ForgotPassword />
      </PublicLayout>
    )
  }
/>

<Route
  path="/reset-password"
  element={
    isAuthenticated ? (
      <Navigate to="/dashboard" replace />
    ) : (
      <PublicLayout>
        <ResetPassword />
      </PublicLayout>
    )
  }
/>

          {/* PROTECTED LAYOUT */}

          <Route
            element={
              <ProtectedLayout
                user={user}
                isAuthenticated={isAuthenticated}
              />
            }
          >

            <Route
              path="/dashboard"
              element={
                <DashboardRouter user={user} />
              }
            />

            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute
                  user={user}
                  isAuthenticated={isAuthenticated}
                  requiredPermissions={[
                    '/admin/dashboard'
                  ]}
                >
                  <EnhancedAdminDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/secretary/dashboard"
              element={
                <ProtectedRoute
                  user={user}
                  isAuthenticated={isAuthenticated}
                  requiredPermissions={[
                    '/secretary/dashboard'
                  ]}
                >
                  <ComprehensiveSecretaryDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/chair/dashboard"
              element={
                <ProtectedRoute
                  user={user}
                  isAuthenticated={isAuthenticated}
                  requiredPermissions={[
                    '/chair/dashboard'
                  ]}
                >
                  <EnhancedChairDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/hod/dashboard"
              element={
                <ProtectedRoute
                  user={user}
                  isAuthenticated={isAuthenticated}
                  requiredPermissions={[
                    '/hod/dashboard'
                  ]}
                >
                  <EnhancedHODDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/commissioner/dashboard"
              element={
                <ProtectedRoute
                  user={user}
                  isAuthenticated={isAuthenticated}
                  requiredPermissions={[
                    '/commissioner/dashboard'
                  ]}
                >
                  <EnhancedCommissionerDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/member/dashboard"
              element={
                <ProtectedRoute
                  user={user}
                  isAuthenticated={isAuthenticated}
                  requiredPermissions={[
                    '/member/dashboard'
                  ]}
                >
                  <EnhancedMemberDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/committees"
              element={
                <ProtectedRoute
                  user={user}
                  isAuthenticated={isAuthenticated}
                  requiredPermissions={[
                    '/committees'
                  ]}
                >
                  <CommitteeList />
                </ProtectedRoute>
              }
            />

            <Route
              path="/countries"
              element={
                <ProtectedRoute
                  user={user}
                  isAuthenticated={isAuthenticated}
                  requiredPermissions={[
                    '/countries'
                  ]}
                >
                  <CountryList />
                </ProtectedRoute>
              }
            />

            <Route
              path="/members"
              element={
                <ProtectedRoute
                  user={user}
                  isAuthenticated={isAuthenticated}
                  requiredPermissions={[
                    '/members'
                  ]}
                >
                  <MemberList />
                </ProtectedRoute>
              }
            />

            <Route
              path="/sub-committee-members"
              element={
                <ProtectedRoute
                  user={user}
                  isAuthenticated={isAuthenticated}
                  requiredPermissions={[
                    '/sub-committee-members'
                  ]}
                >
                  <SubMemberList />
                </ProtectedRoute>
              }
            />

            <Route
              path="/meetings/create"
              element={
                <ProtectedRoute
                  user={user}
                  isAuthenticated={isAuthenticated}
                  requiredPermissions={[
                    '/meetings'
                  ]}
                >
                  <CreateMeeting />
                </ProtectedRoute>
              }
            />

            <Route
              path="/minutes/take"
              element={
                <ProtectedRoute
                  user={user}
                  isAuthenticated={isAuthenticated}
                  requiredPermissions={[
                    '/minutes'
                  ]}
                >
                  <TakeMinutes />
                </ProtectedRoute>
              }
            />

            <Route
              path="/attendance/take"
              element={
                <ProtectedRoute
                  user={user}
                  isAuthenticated={isAuthenticated}
                  requiredPermissions={[
                    '/attendance'
                  ]}
                >
                  <TakeAttendance />
                </ProtectedRoute>
              }
            />

            <Route
              path="/profile"
              element={
                <ProtectedRoute
                  user={user}
                  isAuthenticated={isAuthenticated}
                  requiredPermissions={[
                    '/profile'
                  ]}
                >
                  <UserProfile />
                </ProtectedRoute>
              }
            />

          </Route>

          {/* FALLBACK */}

          <Route
            path="*"
            element={
              isAuthenticated ? (
                <Navigate
                  to="/dashboard"
                  replace
                />
              ) : (
                <Navigate
                  to="/login"
                  replace
                />
              )
            }
          />

        </Routes>

      </Router>
    </ThemeProvider>
  );
}

export default App;