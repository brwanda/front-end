# HOD Frontend Integration Guide

## 🚀 Quick Setup

### 1. Install Required Dependencies

```bash
npm install chart.js react-chartjs-2 @heroicons/react axios react-toastify
```

### 2. Add Tailwind CSS Classes

Ensure your `tailwind.config.js` includes all the utility classes used in the components:

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
          600: '#2563eb',
          700: '#1d4ed8',
        },
        green: {
          50: '#f0fdf4',
          100: '#dcfce7',
          600: '#16a34a',
          700: '#15803d',
        },
        // Add other colors as needed
      }
    },
  },
  plugins: [],
}
```

### 3. Setup React Toastify

In your main `App.js` or `index.js`:

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
      />
    </div>
  );
}
```

## 📁 File Structure

```
src/
├── components/
│   └── HOD/
│       ├── ReportReview.js          ✅ Main report review interface
│       ├── ProfileUpdate.js         ✅ Profile management component
│       ├── Notifications.js         ✅ Notifications with real-time updates
│       └── PerformanceDashboard.js  ✅ Dashboard with Chart.js visualizations
├── context/
│   └── HODContext.js                ✅ React Context for state management
├── hooks/
│   └── useHOD.js                    ✅ Custom hooks for HOD functionality
├── services/
│   └── hodAPI.js                    ✅ API service functions
├── utils/
│   └── constants.js                 ✅ Constants and utility functions
└── pages/
    └── HODDashboard.js              ✅ Main dashboard layout
```

## 🔗 Integration with Existing Routes

### Add HOD Routes to Your Router

```javascript
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HODDashboard from './pages/HODDashboard';

function App() {
  return (
    <Router>
      <Routes>
        {/* Your existing routes */}
        <Route path="/hod/dashboard" element={<HODDashboard />} />
        <Route path="/hod/reports" element={<ReportReview />} />
        <Route path="/hod/profile" element={<ProfileUpdate />} />
        <Route path="/hod/notifications" element={<Notifications />} />
        <Route path="/hod/performance" element={<PerformanceDashboard />} />
      </Routes>
    </Router>
  );
}
```

### Add Navigation Links

```javascript
// In your main navigation component
{user?.role === 'HOD' && (
  <Link 
    to="/hod/dashboard" 
    className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
  >
    <UserIcon className="mr-3 h-5 w-5" />
    HOD Dashboard
  </Link>
)}
```

## 🔧 API Integration

### Backend API Endpoints Required

```javascript
// Reports
GET    /api/reports/pending           // Fetch pending reports
POST   /api/reports/review           // Review report (approve/reject)
GET    /api/reports/{id}             // Get specific report

// Profile
GET    /api/users/profile            // Get user profile
PUT    /api/users/profile/update     // Update profile

// Notifications
GET    /api/notifications/meetings   // Get meeting notifications
PATCH  /api/notifications/{id}/read  // Mark as read
PATCH  /api/notifications/mark-all-read // Mark all as read

// Performance Dashboard
GET    /api/performance/data         // Get dashboard data
GET    /api/performance/summary      // Get performance summary
```

### Sample API Response Formats

#### Reports Response:
```json
[
  {
    "id": 123,
    "chairName": "John Doe",
    "submissionDate": "2024-01-15T10:30:00Z",
    "resolution": "Digital Transformation Initiative",
    "performance": 85,
    "status": "pending",
    "progressDetails": "Completed phase 1...",
    "hindrances": "Budget constraints..."
  }
]
```

#### Profile Response:
```json
{
  "name": "Dr. Michael Anderson",
  "email": "hod@department.eara.org",
  "contactNumber": "+256-700-987654",
  "role": "Head of Delegation",
  "department": "Technical Operations",
  "country": "Uganda"
}
```

#### Dashboard Data Response:
```json
{
  "summary": {
    "avgPerformance": 82,
    "completedReports": 45,
    "pendingReviews": 3,
    "activeSubcommittees": 7
  },
  "subcommitteePerformance": [
    {
      "name": "Domestic Revenue",
      "performance": 87,
      "reportCount": 8,
      "trend": "up"
    }
  ],
  "contributionPercentages": [
    {
      "name": "IT Committee",
      "percentage": 25
    }
  ],
  "timeSeriesData": {
    "labels": ["Jan", "Feb", "Mar"],
    "performance": [78, 81, 85],
    "reports": [5, 7, 9]
  }
}
```

## 🎨 Styling and Customization

### Tailwind CSS Classes Used

The components use these main Tailwind classes:
- `bg-white`, `bg-gray-50`, `bg-blue-600` - Background colors
- `text-gray-900`, `text-blue-600`, `text-green-600` - Text colors
- `shadow-lg`, `rounded-lg`, `border` - Layout styling
- `hover:bg-gray-50`, `focus:ring-2` - Interactive states
- `grid`, `flex`, `space-y-4` - Layout utilities

### Custom Styling

To customize colors, update your Tailwind config or add custom CSS:

```css
/* Custom HOD theme */
.hod-primary {
  @apply bg-blue-600 text-white;
}

.hod-secondary {
  @apply bg-gray-100 text-gray-900;
}

.hod-success {
  @apply bg-green-600 text-white;
}

.hod-danger {
  @apply bg-red-600 text-white;
}
```

## 🔒 Security Considerations

### Authentication

```javascript
// Add to your axios interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### Role-Based Access Control

```javascript
// Protect HOD routes
const ProtectedHODRoute = ({ children }) => {
  const user = getCurrentUser();
  
  if (!user || user.role !== 'HOD') {
    return <Navigate to="/unauthorized" />;
  }
  
  return children;
};

// Usage
<Route 
  path="/hod/*" 
  element={
    <ProtectedHODRoute>
      <HODDashboard />
    </ProtectedHODRoute>
  } 
/>
```

## 📱 Responsive Design

All components are built with mobile-first responsive design:

- **Mobile (sm)**: Single column layout, collapsible sidebar
- **Tablet (md)**: Two-column layout for cards
- **Desktop (lg)**: Full multi-column layout with persistent sidebar

### Mobile Optimization Features:
- Touch-friendly button sizes (minimum 44px)
- Swipe-friendly modals and overlays
- Responsive tables with horizontal scroll
- Collapsible navigation for small screens

## ⚡ Performance Optimization

### Chart.js Performance
```javascript
// Optimize chart rendering
const chartOptions = {
  animation: {
    duration: 0 // Disable animations for better performance
  },
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: window.innerWidth > 768 // Hide legend on mobile
    }
  }
};
```

### React Performance
```javascript
// Memoize expensive calculations
const chartData = useMemo(() => {
  return processChartData(dashboardData);
}, [dashboardData]);

// Lazy load components
const PerformanceDashboard = lazy(() => import('./components/HOD/PerformanceDashboard'));
```

## 🧪 Testing Examples

### Component Testing with React Testing Library

```javascript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ReportReview from '../components/HOD/ReportReview';

test('renders report review table', async () => {
  render(<ReportReview />);
  
  // Wait for reports to load
  await waitFor(() => {
    expect(screen.getByText('Report Review Dashboard')).toBeInTheDocument();
  });
  
  // Test approve button functionality
  const approveButton = screen.getByText('Approve');
  fireEvent.click(approveButton);
  
  // Assert modal opens
  expect(screen.getByText('Approve Report')).toBeInTheDocument();
});
```

### API Testing

```javascript
// Mock API responses for testing
jest.mock('../services/hodAPI', () => ({
  fetchPendingReports: jest.fn(() => Promise.resolve([
    {
      id: 1,
      chairName: 'Test Chair',
      status: 'pending',
      performance: 85
    }
  ]))
}));
```

## 🚨 Error Handling

### Global Error Boundary

```javascript
class HODErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('HOD Dashboard Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Something went wrong
            </h2>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Wrap your HOD components
<HODErrorBoundary>
  <HODDashboard />
</HODErrorBoundary>
```

## 🔄 WebSocket Integration

### Real-time Notifications

```javascript
// In your main App component or HOD context
useEffect(() => {
  const ws = new WebSocket('ws://localhost:8080/ws/notifications');
  
  ws.onmessage = (event) => {
    const notification = JSON.parse(event.data);
    // Update notification state
    setNotifications(prev => [notification, ...prev]);
    // Show toast
    toast.info('New notification received!');
  };

  return () => ws.close();
}, []);
```

## 📊 Analytics Integration

### Track User Actions

```javascript
// Add analytics tracking to key actions
const handleReportReview = async (reportId, status) => {
  try {
    await reviewReport(reportId, status);
    
    // Track action
    analytics.track('Report Reviewed', {
      reportId,
      status,
      userId: user.id,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    // Handle error
  }
};
```

## 🌐 Internationalization (i18n)

### Adding Multi-language Support

```javascript
// Install react-i18next
npm install react-i18next i18next

// Setup i18n
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

i18n.use(initReactI18next).init({
  resources: {
    en: {
      translation: {
        "dashboard.title": "HOD Dashboard",
        "reports.pending": "Pending Reports",
        "profile.update": "Update Profile"
      }
    },
    fr: {
      translation: {
        "dashboard.title": "Tableau de Bord HOD",
        "reports.pending": "Rapports en Attente",
        "profile.update": "Mettre à Jour le Profil"
      }
    }
  },
  lng: 'en',
  fallbackLng: 'en'
});

// Usage in components
import { useTranslation } from 'react-i18next';

const ReportReview = () => {
  const { t } = useTranslation();
  
  return (
    <h2>{t('reports.pending')}</h2>
  );
};
```

## 🎯 Accessibility (a11y)

### ARIA Labels and Screen Reader Support

The components include comprehensive accessibility features:
- ARIA labels for all interactive elements
- Proper heading hierarchy (h1, h2, h3)
- Focus management for modals
- Screen reader announcements for dynamic content
- Keyboard navigation support

### Testing Accessibility

```javascript
// Install accessibility testing tools
npm install --save-dev @testing-library/jest-dom jest-axe

// Test accessibility
import { axe, toHaveNoViolations } from 'jest-axe';

test('should not have accessibility violations', async () => {
  const { container } = render(<ReportReview />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

## 🚀 Deployment Checklist

### Before Deploying:

1. ✅ **Environment Variables**: Set API base URL
2. ✅ **Build Optimization**: Run `npm run build`
3. ✅ **Bundle Analysis**: Check bundle size with `npm run analyze`
4. ✅ **Cross-browser Testing**: Test in Chrome, Firefox, Safari, Edge
5. ✅ **Mobile Testing**: Test on actual mobile devices
6. ✅ **Accessibility Testing**: Run axe-core accessibility tests
7. ✅ **Performance Testing**: Check Lighthouse scores
8. ✅ **API Integration**: Verify all endpoints work correctly
9. ✅ **Error Handling**: Test error scenarios
10. ✅ **Security Review**: Ensure no sensitive data in client-side code

### Environment Configuration:

```bash
# .env.production
REACT_APP_API_BASE_URL=https://your-api-domain.com/api
REACT_APP_WS_URL=wss://your-api-domain.com/ws
```

## 🆘 Troubleshooting

### Common Issues and Solutions:

#### 1. Charts Not Rendering
```javascript
// Ensure Chart.js is properly imported
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
// Add fallback to polling if WebSocket fails
useEffect(() => {
  let ws;
  let pollInterval;
  
  try {
    ws = new WebSocket(wsUrl);
    ws.onerror = () => {
      // Fallback to polling
      pollInterval = setInterval(fetchNotifications, 30000);
    };
  } catch (error) {
    // Start polling immediately if WebSocket fails
    pollInterval = setInterval(fetchNotifications, 30000);
  }
  
  return () => {
    if (ws) ws.close();
    if (pollInterval) clearInterval(pollInterval);
  };
}, []);
```

#### 3. Mobile Layout Issues
```javascript
// Ensure proper viewport meta tag
<meta name="viewport" content="width=device-width, initial-scale=1.0">

// Use responsive breakpoints consistently
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
```

This comprehensive integration guide provides everything needed to successfully implement the HOD frontend components in your React application with Tailwind CSS.
