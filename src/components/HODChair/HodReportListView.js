import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'react-toastify';
import { 
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  CheckIcon,
  XMarkIcon,
  ArrowPathIcon,
  CalendarIcon,
  ClockIcon,
  UserGroupIcon,
  DocumentTextIcon,
  ChartBarIcon,
  BellIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  ClockIcon as ClockSolidIcon,
  BellIcon as BellSolidIcon 
} from '@heroicons/react/24/solid';
import http from '../../services/http';

const HodReportListView = () => {
  // State management
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedReport, setSelectedReport] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [newReportCount, setNewReportCount] = useState(0);
  
  // Filter states
  const [filters, setFilters] = useState({
    search: '',
    subcommittee: 'all',
    status: 'all',
    dateRange: 'all'
  });

  // WebSocket connection for real-time updates
  const [ws, setWs] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');

  // Fetch all reports from API
  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await http.get('/api/hod/reports/pending');
      
      if (response.data && Array.isArray(response.data)) {
        setReports(response.data);
        setFilteredReports(response.data);
        setNewReportCount(0); // Reset new report count after fetching
      } else {
        setReports([]);
        setFilteredReports([]);
      }
      
    } catch (error) {
      console.error('Error fetching HOD reports:', error);
      const errorMessage = error.response?.data?.message || 'Failed to load reports';
      setError(errorMessage);
      toast.error(errorMessage);
      setReports([]);
      setFilteredReports([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initialize WebSocket connection for real-time updates
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/hod-reports`;
    
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 5;
    const reconnectInterval = 5000;

    const connectWebSocket = () => {
      try {
        setConnectionStatus('connecting');
        const websocket = new WebSocket(wsUrl);
        
        websocket.onopen = () => {
          console.log('HOD Reports WebSocket connected');
          setWs(websocket);
          setConnectionStatus('connected');
          reconnectAttempts = 0;
        };
        
        websocket.onmessage = (event) => {
          try {
            const update = JSON.parse(event.data);
            
            if (update.type === 'NEW_REPORT') {
              // Add new report to the list
              setReports(prev => [update.report, ...prev]);
              setNewReportCount(prev => prev + 1);
              
              // Show notification toast
              toast.info(
                <div className="flex items-center space-x-2">
                  <BellSolidIcon className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="font-medium">New Report Submitted</p>
                    <p className="text-sm text-gray-600">
                      {update.report.chairName} - {update.report.subcommittee}
                    </p>
                  </div>
                </div>,
                {
                  position: 'top-right',
                  autoClose: 8000,
                  hideProgressBar: false,
                  closeOnClick: true,
                  pauseOnHover: true,
                  draggable: true,
                }
              );
            } else if (update.type === 'REPORT_UPDATE') {
              // Update existing report
              setReports(prev => prev.map(r => 
                r.id === update.reportId ? { ...r, ...update.changes } : r
              ));
            }
            
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };
        
        websocket.onerror = (error) => {
          console.error('HOD Reports WebSocket error:', error);
          setConnectionStatus('error');
        };
        
        websocket.onclose = (event) => {
          console.log('HOD Reports WebSocket connection closed');
          setWs(null);
          setConnectionStatus('disconnected');
          
          // Attempt to reconnect
          if (reconnectAttempts < maxReconnectAttempts) {
            reconnectAttempts++;
            console.log(`Attempting to reconnect... (${reconnectAttempts}/${maxReconnectAttempts})`);
            setTimeout(connectWebSocket, reconnectInterval);
          } else {
            setConnectionStatus('failed');
            toast.warn('Real-time updates unavailable. Please refresh manually.');
          }
        };
        
      } catch (error) {
        console.error('Failed to establish WebSocket connection:', error);
        setConnectionStatus('failed');
        // Fallback to polling every 30 seconds
        const pollInterval = setInterval(fetchReports, 30000);
        return () => clearInterval(pollInterval);
      }
    };

    connectWebSocket();

    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, [fetchReports]);

  // Initial data fetch
  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  // Filter reports based on all criteria
  const filteredData = useMemo(() => {
    let filtered = reports;
    
    // Search filter (report title or chair name)
    if (filters.search.trim()) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(report => 
        report.chairName.toLowerCase().includes(searchTerm) ||
        report.resolution.toLowerCase().includes(searchTerm) ||
        report.subcommittee.toLowerCase().includes(searchTerm)
      );
    }
    
    // Subcommittee filter
    if (filters.subcommittee !== 'all') {
      filtered = filtered.filter(report => report.subcommittee === filters.subcommittee);
    }
    
    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(report => report.status === filters.status);
    }
    
    // Date range filter
    if (filters.dateRange !== 'all') {
      const now = new Date();
      let cutoffDate;
      
      switch (filters.dateRange) {
        case 'today':
          cutoffDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          cutoffDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
          break;
        case '3months':
          cutoffDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
          break;
        default:
          cutoffDate = null;
      }
      
      if (cutoffDate) {
        filtered = filtered.filter(report => new Date(report.submissionDate) >= cutoffDate);
      }
    }
    
    return filtered;
  }, [reports, filters]);

  useEffect(() => {
    setFilteredReports(filteredData);
  }, [filteredData]);

  // Handle approve action
  const handleApprove = async (reportId) => {
    try {
      await http.post('/api/hod/reports/approve', { reportId });
      
      // Update local state
      setReports(prev => prev.map(report =>
        report.id === reportId
          ? { ...report, status: 'approved', hodReviewedAt: new Date().toISOString() }
          : report
      ));
      
      toast.success('Report approved successfully! Forwarded to Commissioner General.');
      
    } catch (error) {
      console.error('Error approving report:', error);
      toast.error('Failed to approve report. Please try again.');
    }
  };

  // Handle reject action
  const handleReject = async (reportId) => {
    // For quick reject, we'll need a comment - this opens the modal
    const report = reports.find(r => r.id === reportId);
    setSelectedReport(report);
    setShowModal(true);
  };

  // Format date for display
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get performance badge styling
  const getPerformanceBadge = (percentage) => {
    if (percentage >= 90) return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    if (percentage >= 80) return 'bg-blue-100 text-blue-800 border-blue-200';
    if (percentage >= 70) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    if (percentage >= 60) return 'bg-orange-100 text-orange-800 border-orange-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  // Get status badge styling
  const getStatusInfo = (status) => {
    switch (status.toLowerCase()) {
      case 'pending': 
        return {
          color: 'bg-amber-100 text-amber-800 border-amber-200',
          icon: ClockSolidIcon,
          label: 'Pending Review'
        };
      case 'approved': 
        return {
          color: 'bg-green-100 text-green-800 border-green-200',
          icon: CheckCircleIcon,
          label: 'Approved'
        };
      case 'rejected': 
        return {
          color: 'bg-red-100 text-red-800 border-red-200',
          icon: XCircleIcon,
          label: 'Rejected'
        };
      default: 
        return {
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: ClockSolidIcon,
          label: 'Unknown'
        };
    }
  };

  // Get connection status indicator
  const getConnectionStatus = () => {
    switch (connectionStatus) {
      case 'connected':
        return { color: 'bg-green-400', text: 'Real-time updates active', icon: '🟢' };
      case 'connecting':
        return { color: 'bg-yellow-400', text: 'Connecting...', icon: '🟡' };
      case 'disconnected':
        return { color: 'bg-orange-400', text: 'Reconnecting...', icon: '🟠' };
      case 'error':
      case 'failed':
        return { color: 'bg-red-400', text: 'Connection failed', icon: '🔴' };
      default:
        return { color: 'bg-gray-400', text: 'Unknown status', icon: '⚪' };
    }
  };

  const connectionInfo = getConnectionStatus();

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96" role="status" aria-label="Loading reports">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium text-lg">Loading Report Dashboard...</p>
          <p className="text-gray-500 text-sm mt-2">Fetching all Chair submissions</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !loading) {
    return (
      <div className="bg-white shadow-2xl rounded-2xl p-8">
        <div className="text-center">
          <div className="text-red-600 mb-6">
            <ExclamationTriangleIcon className="mx-auto h-16 w-16" />
          </div>
          <h3 className="text-xl font-medium text-gray-900 mb-4">Failed to Load Reports</h3>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={fetchReports}
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
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-700 to-blue-900 rounded-2xl shadow-2xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className="p-4 bg-white bg-opacity-20 rounded-xl">
              <DocumentTextIcon className="h-10 w-10 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">HOD Report Dashboard</h1>
              <p className="text-blue-100 text-lg mt-2">
                Comprehensive view of all Chair-submitted reports
              </p>
              <div className="flex items-center space-x-4 mt-3">
                <div className="flex items-center">
                  <div className={`h-2 w-2 rounded-full ${connectionInfo.color} mr-2`}></div>
                  <span className="text-blue-200 text-sm">{connectionInfo.text}</span>
                </div>
                {newReportCount > 0 && (
                  <div className="flex items-center bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                    <BellIcon className="h-4 w-4 mr-2" />
                    {newReportCount} new report{newReportCount > 1 ? 's' : ''}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="text-center">
            <div className="bg-white bg-opacity-20 rounded-xl p-4">
              <p className="text-blue-100 text-sm">Total Reports</p>
              <p className="text-white font-bold text-3xl">{reports.length}</p>
              <p className="text-blue-200 text-sm">
                {filteredReports.filter(r => r.status === 'pending').length} pending review
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <FunnelIcon className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">Filter Reports</h2>
          </div>
          
          <button
            onClick={fetchReports}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            aria-label="Refresh reports"
          >
            <ArrowPathIcon className="h-5 w-5 mr-2" />
            Refresh
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search Bar */}
          <div className="relative">
            <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search report title or Chair name..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              aria-label="Search reports"
            />
          </div>
          
          {/* Subcommittee Filter */}
          <div>
            <select
              value={filters.subcommittee}
              onChange={(e) => setFilters(prev => ({ ...prev, subcommittee: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              aria-label="Filter by subcommittee"
            >
              <option value="all">All Subcommittees</option>
              <option value="Domestic Revenue">Domestic Revenue</option>
              <option value="Customs Revenue">Customs Revenue</option>
              <option value="IT Committee">IT Committee</option>
              <option value="Legal Committee">Legal Committee</option>
              <option value="HR Committee">HR Committee</option>
              <option value="Research Committee">Research Committee</option>
              <option value="Finance Committee">Finance Committee</option>
            </select>
          </div>
          
          {/* Status Filter */}
          <div>
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              aria-label="Filter by status"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending Review</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          
          {/* Date Range Filter */}
          <div>
            <select
              value={filters.dateRange}
              onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              aria-label="Filter by date range"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
              <option value="3months">Last 3 Months</option>
            </select>
          </div>
        </div>
      </div>

      {/* Reports Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredReports.length === 0 ? (
          <div className="col-span-full bg-white rounded-2xl shadow-xl p-12 text-center">
            <DocumentTextIcon className="mx-auto h-20 w-20 text-gray-400 mb-6" />
            <h3 className="text-2xl font-medium text-gray-900 mb-4">
              {reports.length === 0 ? 'No Reports Available' : 'No Reports Match Your Filters'}
            </h3>
            <p className="text-gray-500 text-lg">
              {reports.length === 0 
                ? 'No reports have been submitted by Chairs yet. New submissions will appear here automatically.'
                : 'Try adjusting your filters to see more reports, or check back later for new submissions.'
              }
            </p>
            {reports.length === 0 && (
              <button
                onClick={fetchReports}
                className="mt-6 inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-xl text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <ArrowPathIcon className="h-5 w-5 mr-2" />
                Refresh Reports
              </button>
            )}
          </div>
        ) : (
          filteredReports.map((report) => {
            const statusInfo = getStatusInfo(report.status);
            const StatusIcon = statusInfo.icon;
            
            return (
              <div
                key={report.id}
                className="bg-white rounded-2xl shadow-xl border border-gray-200 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden"
              >
                {/* Card Header */}
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <DocumentTextIcon className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 text-lg">Report #{report.id}</h3>
                        <p className="text-sm text-gray-500">{formatDate(report.submissionDate)}</p>
                      </div>
                    </div>
                    
                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${statusInfo.color}`}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {statusInfo.label}
                    </div>
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-6 space-y-4">
                  {/* Chair Information */}
                  <div className="flex items-center space-x-3">
                    <UserGroupIcon className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="font-semibold text-gray-900">{report.chairName}</p>
                      <p className="text-sm text-gray-600">{report.subcommittee}</p>
                    </div>
                  </div>
                  
                  {/* Resolution Title */}
                  <div className="space-y-2">
                    <div className="flex items-start space-x-3">
                      <DocumentTextIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-700">Resolution Title</p>
                        <p className="text-gray-900 line-clamp-2 leading-relaxed">
                          {report.resolution}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Performance Percentage */}
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <div className="flex items-center space-x-2">
                      <ChartBarIcon className="h-5 w-5 text-gray-400" />
                      <span className="text-sm font-medium text-gray-700">Performance</span>
                    </div>
                    <span className={`inline-flex px-3 py-1 text-sm font-bold rounded-full border ${getPerformanceBadge(report.performance)}`}>
                      {report.performance}%
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="px-6 pb-6">
                  <div className="flex space-x-2">
                    {/* View Details Button */}
                    <button
                      onClick={() => {
                        setSelectedReport(report);
                        setShowModal(true);
                      }}
                      className="flex-1 inline-flex items-center justify-center px-4 py-3 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                      aria-label={`View details for report ${report.id}`}
                    >
                      <EyeIcon className="h-4 w-4 mr-2" />
                      View Details
                    </button>
                    
                    {/* Approve/Reject Buttons (only for pending reports) */}
                    {report.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleApprove(report.id)}
                          className="inline-flex items-center px-4 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                          aria-label={`Approve report ${report.id}`}
                        >
                          <CheckIcon className="h-4 w-4 mr-1" />
                          Approve
                        </button>
                        
                        <button
                          onClick={() => handleReject(report.id)}
                          className="inline-flex items-center px-4 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                          aria-label={`Reject report ${report.id}`}
                        >
                          <XMarkIcon className="h-4 w-4 mr-1" />
                          Reject
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Report Details Modal */}
      {showModal && selectedReport && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 overflow-y-auto h-full w-full z-50" role="dialog" aria-modal="true">
          <div className="relative min-h-screen flex items-center justify-center p-4">
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-screen overflow-y-auto">
              {/* Modal Header */}
              <div className="sticky top-0 bg-gradient-to-r from-blue-700 to-blue-900 px-8 py-6 rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-white bg-opacity-20 rounded-lg">
                      <DocumentTextIcon className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">
                        Report #{selectedReport.id} - Details
                      </h2>
                      <p className="text-blue-100">
                        Submitted by {selectedReport.chairName} • {formatDate(selectedReport.submissionDate)}
                      </p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => {
                      setShowModal(false);
                      setSelectedReport(null);
                    }}
                    className="text-white hover:text-gray-200 p-2 rounded-lg hover:bg-white hover:bg-opacity-20 transition-colors"
                    aria-label="Close modal"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-8 space-y-6">
                {/* Report Information Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                    <div className="flex items-center space-x-3">
                      <UserGroupIcon className="h-8 w-8 text-blue-600" />
                      <div>
                        <p className="text-sm font-medium text-blue-600">Chair</p>
                        <p className="text-lg font-bold text-blue-900">{selectedReport.chairName}</p>
                        <p className="text-sm text-blue-700">{selectedReport.subcommittee}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                    <div className="flex items-center space-x-3">
                      <ChartBarIcon className="h-8 w-8 text-green-600" />
                      <div>
                        <p className="text-sm font-medium text-green-600">Performance</p>
                        <p className="text-lg font-bold text-green-900">{selectedReport.performance}%</p>
                        <p className="text-sm text-green-700">Self-rated</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-purple-50 border border-purple-200 rounded-xl p-6">
                    <div className="flex items-center space-x-3">
                      <CalendarIcon className="h-8 w-8 text-purple-600" />
                      <div>
                        <p className="text-sm font-medium text-purple-600">Submitted</p>
                        <p className="text-lg font-bold text-purple-900">
                          {new Date(selectedReport.submissionDate).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-purple-700">
                          {new Date(selectedReport.submissionDate).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Resolution Details */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Resolution Title</h3>
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                    <p className="text-gray-900 leading-relaxed">{selectedReport.resolution}</p>
                  </div>
                </div>

                {/* Additional Details */}
                {selectedReport.progressDetails && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Progress Details</h3>
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                      <p className="text-gray-900 leading-relaxed">{selectedReport.progressDetails}</p>
                    </div>
                  </div>
                )}

                {selectedReport.hindrances && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Challenges & Hindrances</h3>
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
                      <div className="flex items-start space-x-3">
                        <ExclamationTriangleIcon className="h-5 w-5 text-amber-600 mt-0.5" />
                        <p className="text-gray-900 leading-relaxed">{selectedReport.hindrances}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="sticky bottom-0 bg-gray-50 px-8 py-6 border-t border-gray-200 rounded-b-2xl">
                <div className="flex items-center justify-end space-x-4">
                  <button
                    onClick={() => {
                      setShowModal(false);
                      setSelectedReport(null);
                    }}
                    className="px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                  >
                    Close
                  </button>
                  
                  {selectedReport.status === 'pending' && (
                    <>
                      <button
                        onClick={() => {
                          handleApprove(selectedReport.id);
                          setShowModal(false);
                          setSelectedReport(null);
                        }}
                        className="px-6 py-3 text-sm font-medium text-white bg-green-600 rounded-xl hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                      >
                        <CheckIcon className="h-4 w-4 mr-2 inline" />
                        Approve Report
                      </button>
                      
                      <button
                        onClick={() => {
                          handleReject(selectedReport.id);
                          // Keep modal open for reject flow
                        }}
                        className="px-6 py-3 text-sm font-medium text-white bg-red-600 rounded-xl hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                      >
                        <XMarkIcon className="h-4 w-4 mr-2 inline" />
                        Reject Report
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HodReportListView;
