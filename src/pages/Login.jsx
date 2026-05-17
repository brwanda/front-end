// Login.jsx

import React, { useState } from 'react';

import {
  Link,
  useNavigate
} from 'react-router-dom';

import { FaArrowLeft }
from 'react-icons/fa';

import HODPermissionService
from '../services/hodPermissionService';

import http
from '../services/http';

import { useAuth }
from '../context/AuthContext';

import './Login.css';

const ROLE_REDIRECTS = {

  ADMIN:
    '/admin/dashboard',

  SECRETARY:
    '/secretary/dashboard',

  CHAIR:
    '/chair/dashboard',

  VICE_CHAIR:
    '/chair/dashboard',

  COMMISSIONER_GENERAL:
    '/commissioner/dashboard',

  HOD:
    '/hod/dashboard'
};

const Login = () => {

  const navigate =
    useNavigate();

  const {
    setUser,
    setIsAuthenticated
  } = useAuth();

  const [email, setEmail] =
    useState('');

  const [
    password,
    setPassword
  ] = useState('');

  const [
    loading,
    setLoading
  ] = useState(false);

  const [error, setError] =
    useState('');

  const clearStaleSession =
    () => {

    localStorage.removeItem(
      'user'
    );

    localStorage.removeItem(
      'isAuthenticated'
    );

    localStorage.removeItem(
      'lastActivity'
    );
  };

  const getRedirectPath =
    (user) => {

    if (
      HODPermissionService.hasHODPrivileges(
        user
      )
    ) {
      return '/hod/dashboard';
    }

    return (
      ROLE_REDIRECTS[user.role] ??
      '/dashboard'
    );
  };

  const handleSubmit =
    async (e) => {

    e.preventDefault();

    setLoading(true);

    setError('');

    clearStaleSession();

    try {

      await http.post(
        '/auth/logout'
      );

    } catch (_) {}

    try {

      const response =
        await http.post(
          '/auth/login',
          {
            email,
            password
          }
        );

      const { data } =
        response;

      console.log(
        '[LOGIN] response:',
        data
      );

      if (data?.success === true) {

        const user =
          data.user;

        localStorage.setItem(
          'user',
          JSON.stringify(user)
        );

        localStorage.setItem(
          'isAuthenticated',
          'true'
        );

        localStorage.setItem(
          'lastActivity',
          Date.now().toString()
        );

        // IMPORTANT
        setUser(user);

        setIsAuthenticated(
          true
        );

        const redirectPath =
          getRedirectPath(user);

        console.log(
          '[LOGIN] redirecting:',
          redirectPath
        );

        setLoading(false);

        setTimeout(() => {

          navigate(
            redirectPath,
            {
              replace: true
            }
          );

        }, 50);

        return;
      }

      setError(
        data?.message ||
        'Invalid credentials'
      );

      setLoading(false);

    } catch (err) {

      console.error(
        '[LOGIN ERROR]',
        err
      );

      const status =
        err?.response?.status;

      if (status === 401) {

        setError(
          'Invalid email or password.'
        );

      } else if (
        status === 403
      ) {

        setError(
          'Account disabled.'
        );

      } else {

        setError(
          err?.response?.data?.message ||
          'Login failed.'
        );
      }

      setLoading(false);
    }
  };

  return (
    <div className="login-container">

      <button
        className="login-back-to-home"
        onClick={() => navigate('/')}
      >
        <FaArrowLeft />
        <span>
          Back to Home
        </span>
      </button>

      <div className="login-card">

        <div className="login-header">
          <h1>EARA Connect</h1>
        </div>

        <form
          onSubmit={handleSubmit}
          className="login-form"
        >

          <div className="form-group">

            <label>
              Email
            </label>

            <input
              type="email"
              value={email}
              onChange={(e) =>
                setEmail(
                  e.target.value
                )
              }
              required
            />

          </div>

          <div className="form-group">

            <label>
              Password
            </label>

            <input
              type="password"
              value={password}
              onChange={(e) =>
                setPassword(
                  e.target.value
                )
              }
              required
            />

          </div>

          <div
            style={{
              textAlign: 'right',
              marginBottom: '16px'
            }}
          >

            <Link
              to="/forgot-password"
            >
              Forgot Password?
            </Link>

          </div>

          {error && (
            <div
              className="error-message"
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="login-button"
          >
            {loading
              ? 'Signing in...'
              : 'Sign In'}
          </button>

        </form>

      </div>

    </div>
  );
};

export default Login;