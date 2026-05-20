import React, { useState, useEffect, useRef, useMemo } from 'react';
import { toast } from 'react-toastify';
import {
  ChartBarIcon,
  ChartPieIcon,
  FunnelIcon,
  ArrowPathIcon,
  ArrowDownTrayIcon,
  CalendarIcon
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
import { Bar, Pie, Line } from 'react-chartjs-2';
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

const PerformanceDashboard = () => {
  // State management
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filter states
  const [filters, setFilters] = useState({
    subcommittee: 'all',
    resolution: 'all',
    timePeriod: '3months'
  });
  
  // Chart options
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
          padding: 20
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        }
      },
      x: {
        grid: {
          display: false
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
        subcommittee: filters.subcommittee,
        resolution: filters.resolution,
        timePeriod: filters.timePeriod
      });
      
      const { data } = await http.get(`/api/performance/data?${params}`);
      setDashboardData(data);
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data. Please try again.');
      toast.error('Failed to load performance dashboard');
    } finally {
      setLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchDashboardData();
  }, [filters]);

  // Export data as CSV
  const exportData = () => {
    if (!dashboardData) return;
    
    try {
      const csvData = [];
      
      // Add subcommittee performance data
      csvData.push(['Subcommittee Performance']);
      csvData.push(['Subcommittee', 'Performance %', 'Reports Count']);
      
      dashboardData.subcommitteePerformance.forEach(item => {
        csvData.push([item.name, item.performance, item.reportCount]);
      });
      
      csvData.push(['']); // Empty row
      
      // Add resolution progress data
      csvData.push(['Resolution Progress']);
      csvData.push(['Resolution', 'Progress %', 'Subcommittees']);
      
      dashboardData.resolutionProgress.forEach(item => {
        csvData.push([item.name, item.progress, item.subcommittees]);
      });
      
      // Convert to CSV string
      const csvContent = csvData.map(row => 
        row.map(field => `"${field}"`).join(',')
      ).join('\n');
      
      // Download file
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `performance-dashboard-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Data exported successfully!');
    } catch (error) {
      console.error('Error exporting data:', error);
      toast.error('Failed to export data');
    }
  };

  // Memoized chart data to prevent unnecessary re-renders
  const barChartData = useMemo(() => {
    if (!dashboardData?.subcommitteePerformance) return null;
    
    return {
      labels: dashboardData.subcommitteePerformance.map(item => item.name),
      datasets: [
        {
          label: 'Performance %',
          data: dashboardData.subcommitteePerformance.map(item => item.performance),
          backgroundColor: dashboardData.subcommitteePerformance.map(item => {
            if (item.performance >= 90) return 'rgba(34, 197, 94, 0.8)';
            if (item.performance >= 80) return 'rgba(59, 130, 246, 0.8)';
            if (item.performance >= 70) return 'rgba(245, 158, 11, 0.8)';
            if (item.performance >= 60) return 'rgba(249, 115, 22, 0.8)';
            return 'rgba(239, 68, 68, 0.8)';
          }),
          borderColor: dashboardData.subcommitteePerformance.map(item => {
            if (item.performance >= 90) return 'rgba(34, 197, 94, 1)';
            if (item.performance >= 80) return 'rgba(59, 130, 246, 1)';
            if (item.performance >= 70) return 'rgba(245, 158, 11, 1)';
            if (item.performance >= 60) return 'rgba(249, 115, 22, 1)';
            return 'rgba(239, 68, 68, 1)';
          }),
          borderWidth: 2,
          borderRadius: 4
        }
      ]
    };
  }, [dashboardData?.subcommitteePerformance]);

  const pieChartData = useMemo(() => {
    if (!dashboardData?.contributionPercentages) return null;
    
    return {
      labels: dashboardData.contributionPercentages.map(item => item.name),
      datasets: [
        {
          label: 'Contribution %',
          data: dashboardData.contributionPercentages.map(item => item.percentage),
          backgroundColor: [
            'rgba(99, 102, 241, 0.8)',
            'rgba(34, 197, 94, 0.8)',
            'rgba(245, 158, 11, 0.8)',
            'rgba(239, 68, 68, 0.8)',
            'rgba(168, 85, 247, 0.8)',
            'rgba(236, 72, 153, 0.8)'
          ],
          borderColor: [
            'rgba(99, 102, 241, 1)',
            'rgba(34, 197, 94, 1)',
            'rgba(245, 158, 11, 1)',
            'rgba(239, 68, 68, 1)',
            'rgba(168, 85, 247, 1)',
            'rgba(236, 72, 153, 1)'
          ],
          borderWidth: 2
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
          tension: 0.4
        },
        {
          label: 'Reports Submitted',
          data: dashboardData.timeSeriesData.reports,
          borderColor: 'rgba(34, 197, 94, 1)',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          fill: false,
          tension: 0.4
        }
      ]
    };
  }, [dashboardData?.timeSeriesData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96" role="status" aria-label="Loading dashboard">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading performance dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white shadow-lg rounded-lg p-8">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <svg className="mx-auto h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Unable to Load Dashboard</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <ArrowPathIcon className="h-4 w-4 mr-2" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <ChartBarIcon className="h-8 w-8 text-white mr-3" />
              <div>
                <h2 className="text-xl font-semibold text-white">Performance Dashboard</h2>
                <p className="text-blue-100 text-sm">Real-time performance analytics and insights</p>
              </div>
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={fetchDashboardData}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                aria-label="Refresh dashboard"
              >
                <ArrowPathIcon className="h-4 w-4 mr-1" />
                Refresh
              </button>
              
              <button
                onClick={exportData}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                aria-label="Export data"
              >
                <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
                Export
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="px-6 py-4 bg-gray-50 border-b">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center">
              <FunnelIcon className="h-5 w-5 text-gray-400 mr-2" />
              <span className="text-sm font-medium text-gray-700">Filters:</span>
            </div>
            
            <div className="flex items-center">
              <label htmlFor="subcommittee-filter" className="sr-only">Filter by subcommittee</label>
              <select
                id="subcommittee-filter"
                value={filters.subcommittee}
                onChange={(e) => setFilters(prev => ({ ...prev, subcommittee: e.target.value }))}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Subcommittees</option>
                <option value="domestic">Domestic Revenue</option>
                <option value="customs">Customs Revenue</option>
                <option value="it">IT Committee</option>
                <option value="legal">Legal Committee</option>
                <option value="hr">HR Committee</option>
              </select>
            </div>
            
            <div className="flex items-center">
              <label htmlFor="resolution-filter" className="sr-only">Filter by resolution</label>
              <select
                id="resolution-filter"
                value={filters.resolution}
                onChange={(e) => setFilters(prev => ({ ...prev, resolution: e.target.value }))}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Resolutions</option>
                <option value="digital">Digital Transformation</option>
                <option value="policy">Policy Updates</option>
                <option value="infrastructure">Infrastructure</option>
                <option value="training">Training Programs</option>
              </select>
            </div>
            
            <div className="flex items-center">
              <CalendarIcon className="h-4 w-4 text-gray-400 mr-1" />
              <label htmlFor="time-filter" className="sr-only">Filter by time period</label>
              <select
                id="time-filter"
                value={filters.timePeriod}
                onChange={(e) => setFilters(prev => ({ ...prev, timePeriod: e.target.value }))}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="1month">Last Month</option>
                <option value="3months">Last 3 Months</option>
                <option value="6months">Last 6 Months</option>
                <option value="1year">Last Year</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Statistics */}
      {dashboardData?.summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white shadow-lg rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ChartBarIcon className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Average Performance</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardData.summary.avgPerformance}%</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white shadow-lg rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Reports Completed</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardData.summary.completedReports}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white shadow-lg rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending Reviews</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardData.summary.pendingReviews}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white shadow-lg rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Subcommittees</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardData.summary.activeSubcommittees}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart - Subcommittee Performance */}
        <div className="bg-white shadow-lg rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Performance by Subcommittee</h3>
            <ChartBarIcon className="h-5 w-5 text-gray-400" />
          </div>
          <div className="h-80">
            {barChartData ? (
              <Bar data={barChartData} options={chartOptions} />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                No data available
              </div>
            )}
          </div>
        </div>

        {/* Pie Chart - Contribution Percentages */}
        <div className="bg-white shadow-lg rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Contribution Distribution</h3>
            <ChartPieIcon className="h-5 w-5 text-gray-400" />
          </div>
          <div className="h-80">
            {pieChartData ? (
              <Pie data={pieChartData} options={chartOptions} />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                No data available
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Line Chart - Time Series */}
      <div className="bg-white shadow-lg rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Performance Trends Over Time</h3>
          <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 12l3-3 3 3 4-4" />
          </svg>
        </div>
        <div className="h-80">
          {lineChartData ? (
            <Line data={lineChartData} options={chartOptions} />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              No data available
            </div>
          )}
        </div>
      </div>

      {/* Data Table */}
      {dashboardData?.detailedData && (
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Detailed Performance Data</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Subcommittee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Performance %
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reports
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trend
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Updated
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {dashboardData.detailedData.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.reportCount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className={`inline-flex items-center ${
                        item.trend === 'up' ? 'text-green-600' :
                        item.trend === 'down' ? 'text-red-600' :
                        'text-gray-600'
                      }`}>
                        {item.trend === 'up' ? '↗' : item.trend === 'down' ? '↘' : '→'}
                        <span className="ml-1 capitalize">{item.trend}</span>
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

      {/* View-Only Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">Dashboard Information</h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>
                This dashboard is view-only and updates automatically when new reports are approved. 
                Data is refreshed every 5 minutes to ensure accuracy. Use the filters to customize your view 
                and export data for external analysis.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerformanceDashboard;
