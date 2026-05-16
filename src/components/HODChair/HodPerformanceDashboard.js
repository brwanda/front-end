import React, { useState, useEffect, useMemo, useRef } from 'react';
import { toast } from 'react-toastify';
import HODPermissionService from '../../services/hodPermissionService';
import {
  ChartBarIcon,
  ChartPieIcon,
  FunnelIcon,
  ArrowPathIcon,
  ArrowDownTrayIcon,
  CalendarIcon,
  UserIcon,
  DocumentTextIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  EyeIcon,
  LockClosedIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Bar, Pie, Line, Doughnut } from 'react-chartjs-2';
import http from '../../services/http';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const HodPerformanceDashboard = () => {
  // State management
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState(false);
  
  // Filter states
  const [filters, setFilters] = useState({
    subcommittee: 'all',
    resolution: 'all',
    chair: 'all',
    dateRange: '3months'
  });

  // User role state (for access control)
  const [userRole, setUserRole] = useState('HOD'); // This would come from auth context
  const [viewOnly, setViewOnly] = useState(false);

  // Chart refs for export
  const barChartRef = useRef(null);
  const pieChartRef = useRef(null);
  const lineChartRef = useRef(null);

  // Chart options with HOD-specific styling
  const chartOptions = {
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
        backgroundColor: 'rgba(30, 64, 175, 0.9)', // Blue theme
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 2,
        cornerRadius: 8,
        padding: 12
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
  };

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const params = new URLSearchParams({
        ...filters,
        userRole: userRole
      });
      
      const { data } = await http.get(`/api/hod/performance/data?${params}`);
      setDashboardData(data);
      
    } catch (error) {
      console.error('Error fetching HOD dashboard data:', error);
      setError('Failed to load dashboard data. Please try again.');
      toast.error('Failed to load performance dashboard');
    } finally {
      setLoading(false);
    }
  };

  // Check user permissions
  useEffect(() => {
    const checkPermissions = async () => {
      try {
        const { data: user } = await http.get('/api/auth/user');
        setUserRole(user.role);
        setViewOnly(!HODPermissionService.hasHODPrivileges(user));
      } catch (error) {
        console.error('Error checking user permissions:', error);
        setViewOnly(true);
      }
    };

    checkPermissions();
  }, []);

  // Initial data fetch
  useEffect(() => {
    fetchDashboardData();
  }, [filters, userRole]);

  // Export data as comprehensive CSV
  const exportData = async () => {
    if (!dashboardData) return;
    
    try {
      setExporting(true);
      const csvData = [];
      const timestamp = new Date().toISOString().split('T')[0];
      
      // Header information
      csvData.push(['HOD Performance Dashboard Export']);
      csvData.push(['Generated on:', new Date().toLocaleString()]);
      csvData.push(['Exported by:', userRole]);
      csvData.push(['Filters Applied:']);
      csvData.push(['  Subcommittee:', filters.subcommittee]);
      csvData.push(['  Resolution:', filters.resolution]);
      csvData.push(['  Chair:', filters.chair]);
      csvData.push(['  Date Range:', filters.dateRange]);
      csvData.push(['']); // Empty row
      
      // Summary statistics
      if (dashboardData.summary) {
        csvData.push(['EXECUTIVE SUMMARY']);
        csvData.push(['Metric', 'Value']);
        csvData.push(['Total Reports', dashboardData.summary.totalReports || 0]);
        csvData.push(['Average Performance', `${dashboardData.summary.avgPerformance || 0}%`]);
        csvData.push(['Pending Reviews', dashboardData.summary.pendingReviews || 0]);
        csvData.push(['Active Subcommittees', dashboardData.summary.activeSubcommittees || 0]);
        csvData.push(['']); // Empty row
      }
      
      // Subcommittee performance data
      if (dashboardData.subcommitteePerformance) {
        csvData.push(['SUBCOMMITTEE PERFORMANCE']);
        csvData.push(['Subcommittee', 'Performance %', 'Reports Count', 'Trend', 'Last Updated']);
        
        dashboardData.subcommitteePerformance.forEach(item => {
          csvData.push([
            item.name,
            item.performance,
            item.reportCount,
            item.trend || 'stable',
            item.lastUpdated || 'N/A'
          ]);
        });
        csvData.push(['']); // Empty row
      }
      
      // Chair performance data
      if (dashboardData.chairPerformance) {
        csvData.push(['CHAIR PERFORMANCE']);
        csvData.push(['Chair Name', 'Subcommittee', 'Performance %', 'Reports Submitted', 'Approval Rate %']);
        
        dashboardData.chairPerformance.forEach(item => {
          csvData.push([
            item.chairName,
            item.subcommittee,
            item.performance,
            item.reportsSubmitted,
            item.approvalRate
          ]);
        });
        csvData.push(['']); // Empty row
      }
      
      // Resolution progress data
      if (dashboardData.resolutionProgress) {
        csvData.push(['RESOLUTION PROGRESS']);
        csvData.push(['Resolution', 'Progress %', 'Assigned Subcommittees', 'Status']);
        
        dashboardData.resolutionProgress.forEach(item => {
          csvData.push([
            item.name,
            item.progress,
            item.subcommittees,
            item.status || 'Active'
          ]);
        });
      }
      
      // Convert to CSV string
      const csvContent = csvData.map(row => 
        row.map(field => `"${field}"`).join(',')
      ).join('\n');
      
      // Download file
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `hod-performance-dashboard-${timestamp}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Dashboard data exported successfully!');
    } catch (error) {
      console.error('Error exporting dashboard data:', error);
      toast.error('Failed to export data');
    } finally {
      setExporting(false);
    }
  };

  // Memoized chart data with HOD-specific colors
  const barChartData = useMemo(() => {
    if (!dashboardData?.subcommitteePerformance) return null;
    
    return {
      labels: dashboardData.subcommitteePerformance.map(item => item.name),
      datasets: [
        {
          label: 'Performance %',
          data: dashboardData.subcommitteePerformance.map(item => item.performance),
          backgroundColor: dashboardData.subcommitteePerformance.map(item => {
            if (item.performance >= 90) return 'rgba(16, 185, 129, 0.8)'; // Emerald
            if (item.performance >= 80) return 'rgba(59, 130, 246, 0.8)'; // Blue
            if (item.performance >= 70) return 'rgba(245, 158, 11, 0.8)'; // Amber
            if (item.performance >= 60) return 'rgba(249, 115, 22, 0.8)'; // Orange
            return 'rgba(239, 68, 68, 0.8)'; // Red
          }),
          borderColor: dashboardData.subcommitteePerformance.map(item => {
            if (item.performance >= 90) return 'rgba(16, 185, 129, 1)';
            if (item.performance >= 80) return 'rgba(59, 130, 246, 1)';
            if (item.performance >= 70) return 'rgba(245, 158, 11, 1)';
            if (item.performance >= 60) return 'rgba(249, 115, 22, 1)';
            return 'rgba(239, 68, 68, 1)';
          }),
          borderWidth: 3,
          borderRadius: 8,
          borderSkipped: false,
        }
      ]
    };
  }, [dashboardData?.subcommitteePerformance]);

  const pieChartData = useMemo(() => {
    if (!dashboardData?.contributionPercentages) return null;
    
    const colors = [
      'rgba(59, 130, 246, 0.8)',   // Blue
      'rgba(16, 185, 129, 0.8)',   // Emerald
      'rgba(245, 158, 11, 0.8)',   // Amber
      'rgba(239, 68, 68, 0.8)',    // Red
      'rgba(168, 85, 247, 0.8)',   // Purple
      'rgba(236, 72, 153, 0.8)',   // Pink
      'rgba(34, 197, 94, 0.8)',    // Green
      'rgba(249, 115, 22, 0.8)'    // Orange
    ];
    
    return {
      labels: dashboardData.contributionPercentages.map(item => item.name),
      datasets: [
        {
          label: 'Contribution %',
          data: dashboardData.contributionPercentages.map(item => item.percentage),
          backgroundColor: colors,
          borderColor: colors.map(color => color.replace('0.8', '1')),
          borderWidth: 3
        }
      ]
    };
  }, [dashboardData?.contributionPercentages]);

  const lineChartData = useMemo(() => {
    if (!dashboardData?.timeSeriesData) return null;
    
    return {
      labels: dashboardData.timeSeriesData.labels,
      datasets: [
        {
          label: 'Average Performance',
          data: dashboardData.timeSeriesData.performance,
          borderColor: 'rgba(59, 130, 246, 1)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          fill: true,
          tension: 0.4,
          borderWidth: 3,
          pointBackgroundColor: 'rgba(59, 130, 246, 1)',
          pointBorderColor: 'rgba(255, 255, 255, 1)',
          pointBorderWidth: 3,
          pointRadius: 6
        },
        {
          label: 'Reports Submitted',
          data: dashboardData.timeSeriesData.reports,
          borderColor: 'rgba(16, 185, 129, 1)',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          fill: false,
          tension: 0.4,
          borderWidth: 3,
          pointBackgroundColor: 'rgba(16, 185, 129, 1)',
          pointBorderColor: 'rgba(255, 255, 255, 1)',
          pointBorderWidth: 3,
          pointRadius: 6
        }
      ]
    };
  }, [dashboardData?.timeSeriesData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96" role="status" aria-label="Loading HOD dashboard">
        <div className="text-center">
          <div className="animate-spin rounded-full h-20 w-20 border-b-4 border-blue-600 mx-auto mb-6"></div>
          <p className="text-gray-600 font-medium text-lg">Loading Performance Dashboard...</p>
          <p className="text-gray-500 text-sm mt-2">Analyzing committee performance data</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white shadow-2xl rounded-2xl p-8">
        <div className="text-center">
          <div className="text-red-600 mb-6">
            <ExclamationTriangleIcon className="mx-auto h-20 w-20" />
          </div>
          <h3 className="text-xl font-medium text-gray-900 mb-4">Unable to Load Dashboard</h3>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-xl text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            <ArrowPathIcon className="h-5 w-5 mr-2" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-700 to-blue-900 rounded-2xl shadow-2xl overflow-hidden">
        <div className="px-8 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="p-4 bg-white bg-opacity-20 rounded-xl">
                <ChartBarIcon className="h-10 w-10 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">HOD Performance Dashboard</h1>
                <p className="text-blue-100 text-lg mt-2">
                  Comprehensive analytics and insights for committee oversight
                </p>
                {viewOnly && (
                  <div className="flex items-center mt-2">
                    <LockClosedIcon className="h-4 w-4 text-blue-200 mr-2" />
                    <span className="text-blue-200 text-sm">View-only access</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={fetchDashboardData}
                className="inline-flex items-center px-6 py-3 bg-white bg-opacity-20 text-white rounded-xl hover:bg-opacity-30 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-800 transition-all font-medium"
                aria-label="Refresh dashboard"
              >
                <ArrowPathIcon className="h-5 w-5 mr-2" />
                Refresh Data
              </button>
              
              <button
                onClick={exportData}
                disabled={exporting}
                className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-800 disabled:opacity-50 transition-all font-medium"
                aria-label="Export dashboard data"
              >
                {exporting ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Exporting...
                  </div>
                ) : (
                  <>
                    <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
                    Export CSV
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Advanced Filters */}
        <div className="px-8 pb-8">
          <div className="bg-white bg-opacity-10 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <FunnelIcon className="h-5 w-5 text-white" />
                <h3 className="text-lg font-semibold text-white">Advanced Analytics Filters</h3>
              </div>
              
              {userRole === 'HOD' && (
                <span className="text-blue-200 text-sm">Full access enabled</span>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-blue-100 mb-2">Subcommittee</label>
                <select
                  value={filters.subcommittee}
                  onChange={(e) => !viewOnly && setFilters(prev => ({ ...prev, subcommittee: e.target.value }))}
                  disabled={viewOnly}
                  className="w-full px-4 py-3 border border-white border-opacity-30 rounded-lg bg-white bg-opacity-20 text-white placeholder-blue-200 focus:ring-2 focus:ring-white focus:border-transparent disabled:opacity-50"
                  aria-label="Filter by subcommittee"
                >
                  <option value="all" className="text-gray-900">All Subcommittees</option>
                  <option value="Domestic Revenue" className="text-gray-900">Domestic Revenue</option>
                  <option value="Customs Revenue" className="text-gray-900">Customs Revenue</option>
                  <option value="IT Committee" className="text-gray-900">IT Committee</option>
                  <option value="Legal Committee" className="text-gray-900">Legal Committee</option>
                  <option value="HR Committee" className="text-gray-900">HR Committee</option>
                  <option value="Research Committee" className="text-gray-900">Research Committee</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-blue-100 mb-2">Resolution</label>
                <select
                  value={filters.resolution}
                  onChange={(e) => !viewOnly && setFilters(prev => ({ ...prev, resolution: e.target.value }))}
                  disabled={viewOnly}
                  className="w-full px-4 py-3 border border-white border-opacity-30 rounded-lg bg-white bg-opacity-20 text-white placeholder-blue-200 focus:ring-2 focus:ring-white focus:border-transparent disabled:opacity-50"
                  aria-label="Filter by resolution"
                >
                  <option value="all" className="text-gray-900">All Resolutions</option>
                  <option value="Digital Transformation" className="text-gray-900">Digital Transformation</option>
                  <option value="Policy Updates" className="text-gray-900">Policy Updates</option>
                  <option value="Infrastructure" className="text-gray-900">Infrastructure</option>
                  <option value="Training Programs" className="text-gray-900">Training Programs</option>
                  <option value="Compliance Review" className="text-gray-900">Compliance Review</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-blue-100 mb-2">Chair</label>
                <select
                  value={filters.chair}
                  onChange={(e) => !viewOnly && setFilters(prev => ({ ...prev, chair: e.target.value }))}
                  disabled={viewOnly}
                  className="w-full px-4 py-3 border border-white border-opacity-30 rounded-lg bg-white bg-opacity-20 text-white placeholder-blue-200 focus:ring-2 focus:ring-white focus:border-transparent disabled:opacity-50"
                  aria-label="Filter by chair"
                >
                  <option value="all" className="text-gray-900">All Chairs</option>
                  {dashboardData?.chairList?.map(chair => (
                    <option key={chair.id} value={chair.id} className="text-gray-900">
                      {chair.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-blue-100 mb-2">Date Range</label>
                <select
                  value={filters.dateRange}
                  onChange={(e) => !viewOnly && setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
                  disabled={viewOnly}
                  className="w-full px-4 py-3 border border-white border-opacity-30 rounded-lg bg-white bg-opacity-20 text-white placeholder-blue-200 focus:ring-2 focus:ring-white focus:border-transparent disabled:opacity-50"
                  aria-label="Filter by date range"
                >
                  <option value="1month" className="text-gray-900">Last Month</option>
                  <option value="3months" className="text-gray-900">Last 3 Months</option>
                  <option value="6months" className="text-gray-900">Last 6 Months</option>
                  <option value="1year" className="text-gray-900">Last Year</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Executive Summary Cards */}
      {dashboardData?.summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white shadow-xl rounded-2xl p-8 border-l-4 border-blue-500">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="p-3 bg-blue-100 rounded-xl">
                  <ChartBarIcon className="h-8 w-8 text-blue-600" />
                </div>
              </div>
              <div className="ml-6">
                <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">Average Performance</p>
                <p className="text-3xl font-bold text-gray-900">{dashboardData.summary.avgPerformance}%</p>
                <div className="flex items-center mt-2">
                  {dashboardData.summary.performanceTrend === 'up' ? (
                    <TrendingUpIcon className="h-4 w-4 text-green-500 mr-1" />
                  ) : (
                    <TrendingDownIcon className="h-4 w-4 text-red-500 mr-1" />
                  )}
                  <span className={`text-sm ${dashboardData.summary.performanceTrend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                    {dashboardData.summary.performanceChange || 0}% from last period
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white shadow-xl rounded-2xl p-8 border-l-4 border-green-500">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="p-3 bg-green-100 rounded-xl">
                  <DocumentTextIcon className="h-8 w-8 text-green-600" />
                </div>
              </div>
              <div className="ml-6">
                <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">Total Reports</p>
                <p className="text-3xl font-bold text-gray-900">{dashboardData.summary.totalReports}</p>
                <p className="text-sm text-gray-500 mt-2">
                  {dashboardData.summary.completedReports} completed
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white shadow-xl rounded-2xl p-8 border-l-4 border-yellow-500">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="p-3 bg-yellow-100 rounded-xl">
                  <EyeIcon className="h-8 w-8 text-yellow-600" />
                </div>
              </div>
              <div className="ml-6">
                <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">Pending Reviews</p>
                <p className="text-3xl font-bold text-gray-900">{dashboardData.summary.pendingReviews}</p>
                <p className="text-sm text-gray-500 mt-2">
                  Require HOD attention
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white shadow-xl rounded-2xl p-8 border-l-4 border-purple-500">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="p-3 bg-purple-100 rounded-xl">
                  <UserIcon className="h-8 w-8 text-purple-600" />
                </div>
              </div>
              <div className="ml-6">
                <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">Active Subcommittees</p>
                <p className="text-3xl font-bold text-gray-900">{dashboardData.summary.activeSubcommittees}</p>
                <p className="text-sm text-gray-500 mt-2">
                  Currently reporting
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Bar Chart - Subcommittee Performance */}
        <div className="bg-white shadow-2xl rounded-2xl p-8 border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <ChartBarIcon className="h-6 w-6 text-blue-600" />
              <h3 className="text-xl font-bold text-gray-900">Performance by Subcommittee</h3>
            </div>
            <div className="text-sm text-gray-500">
              Last updated: {new Date().toLocaleDateString()}
            </div>
          </div>
          <div className="h-96">
            {barChartData ? (
              <Bar ref={barChartRef} data={barChartData} options={chartOptions} />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <ChartBarIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p>No performance data available</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Pie Chart - Contribution Distribution */}
        <div className="bg-white shadow-2xl rounded-2xl p-8 border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <ChartPieIcon className="h-6 w-6 text-blue-600" />
              <h3 className="text-xl font-bold text-gray-900">Contribution Distribution</h3>
            </div>
            <div className="text-sm text-gray-500">
              By resolution assignment
            </div>
          </div>
          <div className="h-96">
            {pieChartData ? (
              <Doughnut ref={pieChartRef} data={pieChartData} options={chartOptions} />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <ChartPieIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p>No contribution data available</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Line Chart - Performance Trends */}
      <div className="bg-white shadow-2xl rounded-2xl p-8 border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <TrendingUpIcon className="h-6 w-6 text-blue-600" />
            <h3 className="text-xl font-bold text-gray-900">Performance Trends Over Time</h3>
          </div>
          <div className="text-sm text-gray-500">
            Historical analysis
          </div>
        </div>
        <div className="h-96">
          {lineChartData ? (
            <Line ref={lineChartRef} data={lineChartData} options={chartOptions} />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <TrendingUpIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p>No trend data available</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Detailed Performance Table */}
      {dashboardData?.detailedData && (
        <div className="bg-white shadow-2xl rounded-2xl overflow-hidden border border-gray-200">
          <div className="px-8 py-6 bg-gray-50 border-b border-gray-200">
            <h3 className="text-xl font-bold text-gray-900">Detailed Performance Analysis</h3>
            <p className="text-gray-600 mt-1">Comprehensive breakdown by subcommittee and chair</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Subcommittee
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Chair
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Performance
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reports
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trend
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Updated
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {dashboardData.detailedData.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{item.subcommittee}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-gray-900">{item.chairName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                          item.performance >= 90 ? 'bg-green-100 text-green-800' :
                          item.performance >= 80 ? 'bg-blue-100 text-blue-800' :
                          item.performance >= 70 ? 'bg-yellow-100 text-yellow-800' :
                          item.performance >= 60 ? 'bg-orange-100 text-orange-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {item.performance}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                      {item.reportCount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center text-sm font-medium ${
                        item.trend === 'up' ? 'text-green-600' :
                        item.trend === 'down' ? 'text-red-600' :
                        'text-gray-600'
                      }`}>
                        {item.trend === 'up' ? (
                          <TrendingUpIcon className="h-4 w-4 mr-1" />
                        ) : item.trend === 'down' ? (
                          <TrendingDownIcon className="h-4 w-4 mr-1" />
                        ) : (
                          <div className="h-4 w-4 mr-1 bg-gray-400 rounded-full"></div>
                        )}
                        <span className="capitalize">{item.trend}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(item.lastUpdated).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Access Control Notice */}
      <div className={`border-2 rounded-2xl p-6 ${viewOnly ? 'bg-amber-50 border-amber-200' : 'bg-blue-50 border-blue-200'}`}>
        <div className="flex">
          <div className="flex-shrink-0">
            {viewOnly ? (
              <LockClosedIcon className="h-6 w-6 text-amber-400" />
            ) : (
              <InformationCircleIcon className="h-6 w-6 text-blue-400" />
            )}
          </div>
          <div className="ml-4">
            <h3 className={`text-sm font-medium ${viewOnly ? 'text-amber-800' : 'text-blue-800'}`}>
              {viewOnly ? 'Limited Access Mode' : 'Full HOD Access'}
            </h3>
            <div className={`mt-2 text-sm ${viewOnly ? 'text-amber-700' : 'text-blue-700'}`}>
              {viewOnly ? (
                <ul className="list-disc list-inside space-y-1">
                  <li>Dashboard is in view-only mode for non-HOD users</li>
                  <li>Filters and export functionality are disabled</li>
                  <li>Contact your system administrator for HOD access</li>
                </ul>
              ) : (
                <ul className="list-disc list-inside space-y-1">
                  <li>Full access to all dashboard features and filters</li>
                  <li>Data export and advanced analytics enabled</li>
                  <li>Real-time updates and comprehensive reporting available</li>
                  <li>Use filters to customize your analysis and export data for external use</li>
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HodPerformanceDashboard;
