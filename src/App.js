// App.js

import React, { useState, useEffect } from 'react';
import { API_BASE } from './services/apiConfig';

import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
  Outlet
} from 'react-router-dom';

import { ThemeProvider } from './context/ThemeContext';
import { AuthContext } from './context/AuthContext';

import Layout from './components/Layout';
import PublicLayout from './components/PublicLayout';
import LoadingScreen from './components/LoadingScreen';

import HomePage from './pages/HomePage';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

import EnhancedAdminDashboard from './pages/EnhancedAdminDashboard';
import ComprehensiveSecretaryDashboard from './pages/SecretaryPortal/ComprehensiveSecretaryDashboard';
import EnhancedChairDashboard from './pages/ChairDashboard/EnhancedChairDashboard';
import EnhancedHODDashboard from './pages/EnhancedHODDashboard';
import EnhancedCommissionerDashboard from './pages/EnhancedCommissionerDashboard';
import EnhancedMemberDashboard from './pages/EnhancedMemberDashboard';

import HODPermissionService from './services/hodPermissionService';

import './styles/GlobalStyles.css';
import './styles/shared/loaders.css';
import './styles/Theme.css';
import './styles/DarkModeOverrides.css';

const AuthService = {

  SESSION_TIMEOUT: 30 * 60 * 1000,

  getCurrentUser: () => {

    try {

      const userData =
        localStorage.getItem('user');

      const isAuthenticated =
        localStorage.getItem('isAuthenticated') === 'true';

      const lastActivity =
        localStorage.getItem('lastActivity');

      console.log(
        '[AUTH:getCurrentUser] isAuthenticated:',
        isAuthenticated
      );

      if (isAuthenticated && userData) {

        if (lastActivity) {

          const timeSinceLastActivity =
            Date.now() - parseInt(lastActivity, 10);

          if (
            timeSinceLastActivity >
            AuthService.SESSION_TIMEOUT
          ) {

            console.warn(
              '[AUTH] Session expired'
            );

            AuthService.logout();

            return null;
          }
        }

        const parsed = JSON.parse(userData);

        console.log(
          '[AUTH] Returning user:',
          parsed
        );

        return parsed;
      }

      return null;

    } catch (error) {

      console.error(
        '[AUTH:getCurrentUser] Error:',
        error
      );

      return null;
    }
  },

  updateActivity: () => {
    localStorage.setItem(
      'lastActivity',
      Date.now().toString()
    );
  },

  logout: () => {

    localStorage.removeItem('user');

    localStorage.removeItem(
      'isAuthenticated'
    );

    localStorage.removeItem(
      'lastActivity'
    );
  },

  verifySession: async () => {

    const localUser =
      AuthService.getCurrentUser();

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

      console.log(
        '[AUTH] verifySession status:',
        response.status
      );

      if (response.ok) {

        const userData =
          await response.json();

        console.log(
          '[AUTH] verifySession userData:',
          userData
        );

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

      console.error(
        '[AUTH] verifySession error:',
        error
      );

      return localUser;
    }
  }
};

const ROLE_PERMISSIONS = {

  ADMIN: {
    dashboards: ['/admin/dashboard']
  },

  SECRETARY: {
    dashboards: ['/secretary/dashboard']
  },

  CHAIR: {
    dashboards: ['/chair/dashboard']
  },

  HOD: {
    dashboards: ['/hod/dashboard']
  },

  COMMISSIONER_GENERAL: {
    dashboards: ['/commissioner/dashboard']
  },

  COMMITTEE_MEMBER: {
    dashboards: ['/member/dashboard']
  }
};

const ProtectedLayout = ({
  user,
  isAuthenticated
}) => {

  console.log(
    '[ProtectedLayout]',
    {
      user,
      isAuthenticated
    }
  );

  if (!isAuthenticated || !user) {

    console.log(
      '[ProtectedLayout] Redirect login'
    );

    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  return (
    <Layout user={user}>
      <Outlet />
    </Layout>
  );
};

const DashboardRouter = ({ user }) => {

  console.log(
    '[DashboardRouter] user:',
    user
  );

  const getDefaultDashboard = () => {

    if (
      HODPermissionService.hasHODPrivileges(
        user
      )
    ) {
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

  const target =
    getDefaultDashboard();

  console.log(
    '[DashboardRouter] redirecting:',
    target
  );

  return (
    <Navigate
      to={target}
      replace
    />
  );
};

function App() {

  const [user, setUser] =
    useState(null);

  const [
    isAuthenticated,
    setIsAuthenticated
  ] = useState(false);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {

    const initializeAuth =
      async () => {

      console.log(
        '[APP INIT] START'
      );

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

  }, []);

  console.log(
    '[APP RENDER]',
    {
      loading,
      isAuthenticated,
      user
    }
  );

  if (loading) {

    return (
      <LoadingScreen
        message="Initializing dashboard..."
      />
    );
  }

  return (

    <AuthContext.Provider
      value={{
        user,
        setUser,
        isAuthenticated,
        setIsAuthenticated
      }}
    >

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
                  <Navigate
                    to="/dashboard"
                    replace
                  />
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
                  <Navigate
                    to="/dashboard"
                    replace
                  />
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
                  <Navigate
                    to="/dashboard"
                    replace
                  />
                ) : (
                  <PublicLayout>
                    <ResetPassword />
                  </PublicLayout>
                )
              }
            />

            {/* PROTECTED */}

            <Route
              element={
                <ProtectedLayout
                  user={user}
                  isAuthenticated={
                    isAuthenticated
                  }
                />
              }
            >

              <Route
                path="/dashboard"
                element={
                  <DashboardRouter
                    user={user}
                  />
                }
              />

              <Route
                path="/admin/dashboard"
                element={
                  <EnhancedAdminDashboard />
                }
              />

              <Route
                path="/secretary/dashboard"
                element={
                  <ComprehensiveSecretaryDashboard />
                }
              />

              <Route
                path="/chair/dashboard"
                element={
                  <EnhancedChairDashboard />
                }
              />

              <Route
                path="/hod/dashboard"
                element={
                  <EnhancedHODDashboard />
                }
              />

              <Route
                path="/commissioner/dashboard"
                element={
                  <EnhancedCommissionerDashboard />
                }
              />

              <Route
                path="/member/dashboard"
                element={
                  <EnhancedMemberDashboard />
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

    </AuthContext.Provider>
  );
}

export default App;