# HOD Chair Frontend Integration Guide

## 🎯 Overview

This guide provides complete instructions for integrating the HOD Chair frontend components into your EaraConnect Committee Management System. The HOD Chair interface features a distinct blue-themed design with enhanced functionality for committee oversight.

## 🚀 Quick Setup

### 1. Install Required Dependencies

```bash
# Core dependencies
npm install chart.js react-chartjs-2 @heroicons/react axios react-toastify

# Optional: For enhanced functionality
npm install react-router-dom react-hook-form date-fns
```

### 2. Add Tailwind CSS Configuration

Update your `tailwind.config.js`:

```javascript
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        blue: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        // Add other colors as needed
      },
      boxShadow: {
        'xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      }
    },
  },
  plugins: [],
}
```

### 3. Setup React Toastify

In your main `App.js`:

```javascript
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  return (
    <div className="App">
      {/* Your app content */}
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        toastStyle={{
          borderRadius: '12px',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
        }}
      />
    </div>
  );
}
```

## 📁 File Structure

```
src/
├── components/
│   └── HODChair/
│       ├── HodReportReview.js        ✅ Card-based report review interface
│       ├── HodProfile.js             ✅ Enhanced profile management
│       ├── HodNotifications.js       ✅ Real-time notifications sidebar
│       └── HodPerformanceDashboard.js ✅ Advanced analytics dashboard
├── services/
│   └── hodChairAPI.js                ✅ HOD-specific API service layer
├── pages/
│   └── HodChairDashboard.js          ✅ Main dashboard layout
└── styles/
    └── hod-chair-theme.css           📝 Optional custom styling
```

## 🔗 Integration with React Router

### Add HOD Chair Routes

```javascript
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HodChairDashboard from './pages/HodChairDashboard';
import HodReportReview from './components/HODChair/HodReportReview';
import HodProfile from './components/HODChair/HodProfile';
import HodNotifications from './components/HODChair/HodNotifications';
import HodPerformanceDashboard from './components/HODChair/HodPerformanceDashboard';

function App() {
  return (
    <Router>
      <Routes>
        {/* HOD Chair Routes */}
        <Route path="/hod/dashboard" element={<HodChairDashboard />} />
        <Route path="/hod/reports" element={<HodReportReview />} />
        <Route path="/hod/profile" element={<HodProfile />} />
        <Route path="/hod/notifications" element={<HodNotifications />} />
        <Route path="/hod/performance" element={<HodPerformanceDashboard />} />
        
        {/* Your existing routes */}
        <Route path="/chair/dashboard" element={<ChairDashboard />} />
        <Route path="/secretary/dashboard" element={<SecretaryDashboard />} />
      </Routes>
    </Router>
  );
}
```

### Protected Route Example

```javascript
import { Navigate } from 'react-router-dom';

const ProtectedHODRoute = ({ children }) => {
  const user = getCurrentUser();
  
  if (!user || user.role !== 'HOD') {
    return <Navigate to="/unauthorized" replace />;
  }
  
  return children;
};

// Usage
<Route 
  path="/hod/*" 
  element={
    <ProtectedHODRoute>
      <HodChairDashboard />
    </ProtectedHODRoute>
  } 
/>
```

## 🔧 Backend API Integration

### Required API Endpoints

```javascript
// Reports Management
GET    /api/hod/reports/pending           // Fetch pending reports with full details
POST   /api/hod/reports/approve           // Approve report { reportId }
POST   /api/hod/reports/reject            // Reject report { reportId, comment }
GET    /api/hod/reports/{id}              // Get specific report details

// Profile Management
GET    /api/hod/profile                   // Get HOD profile
PUT    /api/hod/profile/update            // Update HOD profile
POST   /api/hod/profile/upload-picture    // Upload profile picture (multipart/form-data)

// Notifications
GET    /api/hod/notifications/meetings    // Get meeting notifications
PATCH  /api/hod/notifications/{id}/read   // Mark notification as read
PATCH  /api/hod/notifications/mark-all-read // Mark all as read

// Performance Dashboard
GET    /api/hod/performance/data          // Get dashboard data with filters
GET    /api/hod/performance/summary       // Get performance summary stats
GET    /api/hod/performance/export        // Export performance data

// Dashboard Statistics
GET    /api/hod/dashboard/stats           // Get real-time dashboard stats

// WebSocket Endpoints
WS     /ws/hod-reports                    // Real-time report updates
WS     /ws/hod-notifications              // Real-time notification updates
```

### Sample API Response Formats

#### HOD Reports Response:
```json
[
  {
    "id": 123,
    "chairName": "Dr. Michael Anderson",
    "subcommittee": "IT Committee",
    "submissionDate": "2024-01-15T10:30:00Z",
    "resolution": "Digital Transformation Initiative for Revenue Collection",
    "performance": 85,
    "status": "pending",
    "progressDetails": "Completed phase 1 of system implementation...",
    "hindrances": "Budget allocation delays affecting timeline...",
    "priority": "high",
    "estimatedCompletion": "2024-03-15T00:00:00Z"
  }
]
```

#### HOD Profile Response:
```json
{
  "name": "Dr. Sarah Johnson",
  "email": "hod.chair@eara.org",
  "contactNumber": "+256-700-123456",
  "profilePicture": "https://cdn.eara.org/profiles/hod-chair.jpg",
  "role": "Head of Delegation",
  "department": "Technical Operations",
  "country": "Uganda",
  "joinDate": "2023-01-15T00:00:00Z",
  "lastLogin": "2024-01-20T08:30:00Z",
  "permissions": ["REVIEW_REPORTS", "APPROVE_REPORTS", "VIEW_ANALYTICS"]
}
```

#### Dashboard Stats Response:
```json
{
  "pendingReports": 5,
  "unreadNotifications": 3,
  "avgPerformance": 82,
  "activeSubcommittees": 7,
  "totalReports": 45,
  "completedReports": 38,
  "performanceTrend": "up",
  "performanceChange": 5.2
}
```

#### Performance Dashboard Response:
```json
{
  "summary": {
    "avgPerformance": 82,
    "totalReports": 45,
    "pendingReviews": 5,
    "activeSubcommittees": 7,
    "performanceTrend": "up",
    "performanceChange": 5.2
  },
  "subcommitteePerformance": [
    {
      "name": "IT Committee",
      "performance": 87,
      "reportCount": 8,
      "trend": "up",
      "lastUpdated": "2024-01-20T10:00:00Z"
    }
  ],
  "chairPerformance": [
    {
      "chairName": "Dr. Michael Anderson",
      "subcommittee": "IT Committee",
      "performance": 87,
      "reportsSubmitted": 8,
      "approvalRate": 95
    }
  ],
  "contributionPercentages": [
    {
      "name": "Digital Transformation",
      "percentage": 35
    }
  ],
  "timeSeriesData": {
    "labels": ["Oct", "Nov", "Dec", "Jan"],
    "performance": [78, 81, 85, 87],
    "reports": [5, 7, 9, 8]
  },
  "detailedData": [
    {
      "subcommittee": "IT Committee",
      "chairName": "Dr. Michael Anderson",
      "performance": 87,
      "reportCount": 8,
      "trend": "up",
      "lastUpdated": "2024-01-20T10:00:00Z"
    }
  ],
  "chairList": [
    {
      "id": 1,
      "name": "Dr. Michael Anderson"
    }
  ]
}
```

## 🎨 HOD Chair Theme Customization

### Custom CSS (Optional)

Create `src/styles/hod-chair-theme.css`:

```css
/* HOD Chair specific styling */
.hod-gradient-bg {
  background: linear-gradient(135deg, #1e40af 0%, #1d4ed8 50%, #2563eb 100%);
}

.hod-card {
  @apply bg-white rounded-2xl shadow-xl border border-gray-200 hover:shadow-2xl transition-all duration-300;
}

.hod-card-hover {
  @apply transform hover:-translate-y-1;
}

.hod-primary-button {
  @apply inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-xl text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200;
}

.hod-secondary-button {
  @apply inline-flex items-center px-6 py-3 border-2 border-blue-600 text-sm font-medium rounded-xl text-blue-600 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200;
}

.hod-danger-button {
  @apply inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-xl text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200;
}

.hod-performance-excellent { @apply bg-green-100 text-green-800 border-green-200; }
.hod-performance-good { @apply bg-blue-100 text-blue-800 border-blue-200; }
.hod-performance-average { @apply bg-yellow-100 text-yellow-800 border-yellow-200; }
.hod-performance-poor { @apply bg-red-100 text-red-800 border-red-200; }

.hod-sidebar {
  @apply w-80 bg-white shadow-2xl border-r border-gray-200;
}

.hod-sidebar-item {
  @apply w-full text-left group flex items-center px-4 py-4 text-sm font-medium rounded-xl transition-all duration-200 border-2 border-transparent;
}

.hod-sidebar-item-active {
  @apply bg-blue-100 text-blue-700 shadow-md border-blue-200;
}

.hod-sidebar-item-inactive {
  @apply text-gray-700 hover:bg-gray-100 hover:text-gray-900 hover:border-gray-200;
}

/* Chart customizations */
.hod-chart-container {
  @apply bg-white shadow-2xl rounded-2xl p-8 border border-gray-200;
}

/* Animation classes */
.hod-fade-in {
  animation: hodFadeIn 0.5s ease-in-out;
}

@keyframes hodFadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.hod-slide-in {
  animation: hodSlideIn 0.3s ease-out;
}

@keyframes hodSlideIn {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
```

## 🔒 Security & Access Control

### Role-Based Access Control

```javascript
// HOD access control hook
import { useState, useEffect } from 'react';

export const useHODAccess = () => {
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAccess = async () => {
      try {
        const response = await fetch('/api/auth/user');
        const user = await response.json();
        setHasAccess(user.role === 'HOD');
      } catch (error) {
        console.error('Error checking HOD access:', error);
        setHasAccess(false);
      } finally {
        setLoading(false);
      }
    };

    checkAccess();
  }, []);

  return { hasAccess, loading };
};

// Usage in components
const HodReportReview = () => {
  const { hasAccess, loading } = useHODAccess();

  if (loading) return <LoadingSpinner />;
  if (!hasAccess) return <Navigate to="/unauthorized" />;

  return (
    // Component content
  );
};
```

### API Security Headers

```javascript
// In hodChairAPI.js
hodAPI.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  // HOD-specific security headers
  config.headers['X-User-Role'] = 'HOD';
  config.headers['X-Request-Source'] = 'HOD-Dashboard';
  config.headers['X-API-Version'] = '2.0';
  
  return config;
});
```

## 🌐 WebSocket Integration

### Real-time Updates Setup

```javascript
// HOD WebSocket service
class HODWebSocketService {
  constructor() {
    this.connections = new Map();
  }

  connect(endpoint, onMessage, onError) {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/${endpoint}`;
    
    try {
      const ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        console.log(`HOD WebSocket connected: ${endpoint}`);
        // Send authentication
        ws.send(JSON.stringify({
          type: 'auth',
          token: localStorage.getItem('authToken'),
          role: 'HOD'
        }));
      };
      
      ws.onmessage = onMessage;
      ws.onerror = onError;
      
      ws.onclose = () => {
        console.log(`HOD WebSocket disconnected: ${endpoint}`);
        // Attempt reconnection
        setTimeout(() => this.connect(endpoint, onMessage, onError), 5000);
      };
      
      this.connections.set(endpoint, ws);
    } catch (error) {
      console.error(`Failed to connect to HOD WebSocket: ${endpoint}`, error);
    }
  }

  disconnect(endpoint) {
    const ws = this.connections.get(endpoint);
    if (ws) {
      ws.close();
      this.connections.delete(endpoint);
    }
  }

  disconnectAll() {
    this.connections.forEach((ws, endpoint) => {
      ws.close();
    });
    this.connections.clear();
  }
}

// Usage in components
const hodWebSocket = new HODWebSocketService();

// In HodReportReview component
useEffect(() => {
  hodWebSocket.connect(
    'hod-reports',
    (event) => {
      const update = JSON.parse(event.data);
      if (update.type === 'NEW_REPORT') {
        setReports(prev => [update.report, ...prev]);
        toast.info(`New report from ${update.report.chairName}`);
      }
    },
    (error) => console.error('HOD Reports WebSocket error:', error)
  );

  return () => hodWebSocket.disconnect('hod-reports');
}, []);
```

## 📊 Chart.js Configuration

### HOD-Specific Chart Themes

```javascript
// Chart.js configuration for HOD dashboard
export const HOD_CHART_CONFIG = {
  colors: {
    primary: '#2563eb',    // Blue-600
    secondary: '#10b981',  // Emerald-500
    warning: '#f59e0b',    // Amber-500
    danger: '#ef4444',     // Red-500
    info: '#6366f1'        // Indigo-500
  },
  
  defaultOptions: {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
      mode: 'index'
    },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12,
            weight: 'bold'
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(30, 64, 175, 0.9)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 2,
        cornerRadius: 8,
        padding: 12,
        titleFont: {
          size: 14,
          weight: 'bold'
        },
        bodyFont: {
          size: 13
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(59, 130, 246, 0.1)'
        },
        ticks: {
          font: {
            weight: 'bold'
          }
        }
      },
      x: {
        grid: {
          display: false
        },
        ticks: {
          font: {
            weight: 'bold'
          }
        }
      }
    }
  }
};
```

## 📱 Mobile Responsiveness

### Responsive Design Features

1. **Mobile-First Approach**: All components use Tailwind's responsive classes
2. **Touch-Friendly**: Minimum 44px touch targets
3. **Collapsible Sidebar**: Mobile navigation with overlay
4. **Responsive Charts**: Charts adapt to screen size
5. **Optimized Tables**: Horizontal scroll for large datasets

### Mobile Testing Checklist

```javascript
// Mobile testing utilities
export const MOBILE_BREAKPOINTS = {
  sm: '640px',   // Small devices
  md: '768px',   // Medium devices  
  lg: '1024px',  // Large devices
  xl: '1280px'   // Extra large devices
};

// Test responsive behavior
const testMobileLayout = () => {
  const viewports = [
    { width: 375, height: 667 },  // iPhone SE
    { width: 414, height: 896 },  // iPhone 11
    { width: 768, height: 1024 }, // iPad
    { width: 1024, height: 768 }  // iPad Landscape
  ];
  
  // Test each viewport...
};
```

## 🧪 Testing Examples

### Component Testing

```javascript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import HodReportReview from '../components/HODChair/HodReportReview';

// Mock API responses
jest.mock('../services/hodChairAPI', () => ({
  hodChairAPI: {
    fetchPendingReports: jest.fn(() => Promise.resolve([
      {
        id: 1,
        chairName: 'Test Chair',
        subcommittee: 'IT Committee',
        status: 'pending',
        performance: 85
      }
    ])),
    approveReport: jest.fn(() => Promise.resolve()),
    rejectReport: jest.fn(() => Promise.resolve())
  }
}));

const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('HodReportReview', () => {
  test('renders report review dashboard', async () => {
    renderWithRouter(<HodReportReview />);
    
    await waitFor(() => {
      expect(screen.getByText('HOD Report Review Dashboard')).toBeInTheDocument();
    });
  });

  test('approves report successfully', async () => {
    renderWithRouter(<HodReportReview />);
    
    await waitFor(() => {
      const approveButton = screen.getByText('Approve');
      fireEvent.click(approveButton);
    });

    await waitFor(() => {
      expect(screen.getByText(/approved successfully/i)).toBeInTheDocument();
    });
  });

  test('rejects report with comment', async () => {
    renderWithRouter(<HodReportReview />);
    
    await waitFor(() => {
      const rejectButton = screen.getByText('Reject');
      fireEvent.click(rejectButton);
    });

    const commentField = screen.getByPlaceholderText(/provide detailed feedback/i);
    fireEvent.change(commentField, { 
      target: { value: 'More details needed for performance metrics' } 
    });

    const submitButton = screen.getByText('Reject & Send Feedback');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/rejected and feedback sent/i)).toBeInTheDocument();
    });
  });
});
```

### API Testing

```javascript
import { hodChairAPI } from '../services/hodChairAPI';

describe('HOD Chair API', () => {
  test('fetches pending reports', async () => {
    const mockReports = [
      { id: 1, chairName: 'Test Chair', status: 'pending' }
    ];
    
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockReports)
      })
    );

    const reports = await hodChairAPI.fetchPendingReports();
    expect(reports).toEqual(mockReports);
  });

  test('handles API errors gracefully', async () => {
    global.fetch = jest.fn(() =>
      Promise.reject(new Error('Network error'))
    );

    await expect(hodChairAPI.fetchPendingReports()).rejects.toThrow('Failed to fetch pending reports');
  });
});
```

## 🚀 Performance Optimization

### Code Splitting

```javascript
import { lazy, Suspense } from 'react';

// Lazy load HOD components
const HodReportReview = lazy(() => import('./components/HODChair/HodReportReview'));
const HodPerformanceDashboard = lazy(() => import('./components/HODChair/HodPerformanceDashboard'));

// Usage with loading fallback
const HodChairDashboard = () => {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      {activeTab === 'reports' && <HodReportReview />}
      {activeTab === 'performance' && <HodPerformanceDashboard />}
    </Suspense>
  );
};
```

### Memoization

```javascript
import { useMemo, useCallback } from 'react';

const HodPerformanceDashboard = () => {
  // Memoize expensive chart calculations
  const chartData = useMemo(() => {
    return processChartData(dashboardData);
  }, [dashboardData]);

  // Memoize event handlers
  const handleFilterChange = useCallback((filterType, value) => {
    setFilters(prev => ({ ...prev, [filterType]: value }));
  }, []);

  return (
    // Component JSX
  );
};
```

## 🚨 Error Handling

### Global Error Boundary

```javascript
import React from 'react';

class HODErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('HOD Dashboard Error:', error, errorInfo);
    
    // Send error to monitoring service
    if (window.analytics) {
      window.analytics.track('HOD Dashboard Error', {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack
      });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center max-w-md mx-auto">
            <div className="text-red-600 mb-4">
              <svg className="mx-auto h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              HOD Dashboard Error
            </h2>
            <p className="text-gray-600 mb-6">
              Something went wrong with the HOD dashboard. Please try refreshing the page.
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
            >
              Reload Dashboard
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Usage
<HODErrorBoundary>
  <HodChairDashboard />
</HODErrorBoundary>
```

## 📈 Analytics Integration

### Track HOD Actions

```javascript
// Analytics utility for HOD dashboard
export const trackHODAction = (action, properties = {}) => {
  if (window.analytics) {
    window.analytics.track(`HOD: ${action}`, {
      timestamp: new Date().toISOString(),
      userRole: 'HOD',
      dashboard: 'HOD Chair',
      ...properties
    });
  }
};

// Usage in components
const handleReportApproval = async (reportId) => {
  try {
    await hodChairAPI.approveReport(reportId);
    trackHODAction('Report Approved', { reportId });
    toast.success('Report approved successfully!');
  } catch (error) {
    trackHODAction('Report Approval Failed', { reportId, error: error.message });
    toast.error('Failed to approve report');
  }
};
```

## 🔧 Troubleshooting

### Common Issues and Solutions

#### 1. Charts Not Rendering
```javascript
// Ensure Chart.js is properly registered
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);
```

#### 2. WebSocket Connection Issues
```javascript
// Add connection retry logic
const connectWithRetry = (endpoint, maxRetries = 5) => {
  let retries = 0;
  
  const connect = () => {
    try {
      const ws = new WebSocket(wsUrl);
      // ... connection logic
    } catch (error) {
      if (retries < maxRetries) {
        retries++;
        setTimeout(connect, 2000 * retries);
      }
    }
  };
  
  connect();
};
```

#### 3. Mobile Layout Issues
```javascript
// Add viewport meta tag
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">

// Use proper responsive classes
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
```

## 📋 Deployment Checklist

### Pre-deployment Steps

1. ✅ **Environment Variables**: Configure API endpoints
2. ✅ **Build Optimization**: Run `npm run build`
3. ✅ **Bundle Analysis**: Check for unused dependencies
4. ✅ **Cross-browser Testing**: Test in Chrome, Firefox, Safari, Edge
5. ✅ **Mobile Testing**: Test on actual devices
6. ✅ **Performance Testing**: Check Lighthouse scores
7. ✅ **Security Review**: Audit API calls and data handling
8. ✅ **Accessibility Testing**: Run axe-core tests
9. ✅ **Error Handling**: Test error scenarios
10. ✅ **WebSocket Testing**: Verify real-time functionality

### Environment Configuration

```bash
# .env.production
REACT_APP_API_BASE_URL=https://your-api-domain.com/api
REACT_APP_WS_URL=wss://your-api-domain.com/ws
REACT_APP_HOD_DASHBOARD_VERSION=2.0
REACT_APP_ENABLE_ANALYTICS=true
```

This comprehensive guide provides everything needed to successfully integrate the HOD Chair frontend components into your EaraConnect system with a professional, distinct interface that enhances the committee oversight experience.
