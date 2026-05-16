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
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/solid';
import http from '../../services/http';
import AuthService from '../../services/authService';

const HodReportReview = () => {
  const currentUser = AuthService.getCurrentUser();
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [reviewAction, setReviewAction] = useState('');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  const [filters, setFilters] = useState({
    search: '',
    subcommittee: 'all',
    status: 'all',
    dateRange: 'all'
  });

  const [ws, setWs] = useState(null);

  const fetchReports = useCallback(async () => {
    if (!currentUser?.id) return;
    try {
      setLoading(true);
      const { data } = await http.get(`/api/reports/hod-review/${currentUser.id}`);
      const list = Array.isArray(data) ? data : [];
      setReports(list);
      setFilteredReports(list);
    } catch (error) {
      console.error('Error fetching HOD reports:', error);
      toast.error(error.response?.data?.error || 'Failed to load reports. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [currentUser?.id]);

  // Initialize WebSocket connection for real-time updates
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/hod-reports`;
    
    try {
      const websocket = new WebSocket(wsUrl);
      
      websocket.onopen = () => {
        console.log('HOD WebSocket connected for real-time report updates');
        setWs(websocket);
      };
      
      websocket.onmessage = (event) => {
        try {
          const update = JSON.parse(event.data);
          if (update.type === 'NEW_REPORT') {
            setReports(prev => [update.report, ...prev]);
            toast.info(`New report submitted by ${update.report.chairName}`);
          } else if (update.type === 'REPORT_UPDATE') {
            setReports(prev => prev.map(r => r.id === update.reportId ? update.report : r));
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
      
      websocket.onerror = (error) => {
        console.error('HOD WebSocket error:', error);
      };
      
      websocket.onclose = () => {
        console.log('HOD WebSocket connection closed');
        setWs(null);
      };
      
    } catch (error) {
      console.error('Failed to establish HOD WebSocket connection:', error);
    }

    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, []);

  // Initial data fetch
  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  // Filter reports based on all filter criteria
  const filteredData = useMemo(() => {
    let filtered = reports;
    
    // Search filter
    if (filters.search) {
      filtered = filtered.filter(report => 
        report.chairName.toLowerCase().includes(filters.search.toLowerCase()) ||
        report.resolution.toLowerCase().includes(filters.search.toLowerCase()) ||
        report.subcommittee.toLowerCase().includes(filters.search.toLowerCase())
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

  const handleApprove = async (reportId) => {
    if (!currentUser?.id) {
      toast.error('You must be logged in to approve reports.');
      return;
    }
    try {
      setSubmitting(true);
      await http.post(`/api/reports/${reportId}/hod-review`, {
        hodId: currentUser.id,
        approved: true,
        comments: 'Approved'
      });
      setReports(prev => prev.map(report =>
        report.id === reportId ? { ...report, status: 'APPROVED_BY_HOD', hodReviewedAt: new Date().toISOString() } : report
      ));
      setFilteredReports(prev => prev.map(report =>
        report.id === reportId ? { ...report, status: 'APPROVED_BY_HOD', hodReviewedAt: new Date().toISOString() } : report
      ));
      toast.success('Report approved successfully! Forwarded to Commissioner General.');
      setShowModal(false);
      setSelectedReport(null);
    } catch (error) {
      console.error('Error approving report:', error);
      toast.error(error.response?.data?.error || 'Failed to approve report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async (reportId, rejectionComment) => {
    if (!rejectionComment || !rejectionComment.trim()) {
      toast.error('Rejection comment is required when rejecting a report.');
      return;
    }
    if (rejectionComment.trim().length < 10) {
      toast.error('Rejection comment must be at least 10 characters long');
      return;
    }
    if (!currentUser?.id) {
      toast.error('You must be logged in to reject reports.');
      return;
    }

    try {
      setSubmitting(true);
      await http.post(`/api/reports/${reportId}/hod-review`, {
        hodId: currentUser.id,
        approved: false,
        comments: rejectionComment.trim()
      });
      
      setReports(prev => prev.map(report =>
        report.id === reportId
          ? { ...report, status: 'REJECTED_BY_HOD', hodComments: rejectionComment.trim(), hodReviewedAt: new Date().toISOString() }
          : report
      ));
      setFilteredReports(prev => prev.map(report =>
        report.id === reportId
          ? { ...report, status: 'REJECTED_BY_HOD', hodComments: rejectionComment.trim(), hodReviewedAt: new Date().toISOString() }
          : report
      ));
      
      toast.success('Report rejected and feedback sent to Chair.');
      setShowModal(false);
      setSelectedReport(null);
      setComment('');
    } catch (error) {
      console.error('Error rejecting report:', error);
      toast.error(error.response?.data?.error || 'Failed to reject report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle review submission
  const handleReviewSubmit = async () => {
    if (!reviewAction) {
      toast.error('Please select an action (Approve or Reject)');
      return;
    }

    const confirmationMessage =
      reviewAction === 'approve'
        ? 'Are you sure you want to approve?'
        : 'Are you sure you want to reject?';

    if (!window.confirm(confirmationMessage)) {
      return;
    }

    if (reviewAction === 'approve') {
      await handleApprove(selectedReport.id);
    } else {
      await handleReject(selectedReport.id, comment);
    }
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

  // Get performance badge color
  const getPerformanceBadge = (percentage) => {
    if (percentage >= 90) return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    if (percentage >= 80) return 'bg-blue-100 text-blue-800 border-blue-200';
    if (percentage >= 70) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    if (percentage >= 60) return 'bg-orange-100 text-orange-800 border-orange-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  // Get status badge
  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending': 
        return {
          color: 'bg-amber-100 text-amber-800 border-amber-200',
          icon: ClockIcon,
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
          icon: ClockIcon,
          label: 'Unknown'
        };
    }
  };

  // Get priority indicator based on submission date and performance
  const getPriorityLevel = (submissionDate, performance) => {
    const daysSinceSubmission = (new Date() - new Date(submissionDate)) / (1000 * 60 * 60 * 24);
    
    if (daysSinceSubmission > 3 || performance < 60) {
      return { level: 'high', color: 'border-l-red-500', label: 'High Priority' };
    } else if (daysSinceSubmission > 1 || performance < 80) {
      return { level: 'medium', color: 'border-l-yellow-500', label: 'Medium Priority' };
    }
    return { level: 'low', color: 'border-l-green-500', label: 'Normal Priority' };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96" role="status" aria-label="Loading HOD reports">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading HOD Report Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-700 to-blue-900 rounded-xl shadow-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-white bg-opacity-20 rounded-lg">
              <DocumentTextIcon className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">HOD Report Review Dashboard</h1>
              <p className="text-blue-100 text-sm">
                Comprehensive oversight and approval system for all committee reports
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-center">
              <p className="text-2xl font-bold">{filteredReports.filter(r => r.status === 'pending').length}</p>
              <p className="text-blue-100 text-sm">Pending</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{filteredReports.filter(r => r.status === 'approved').length}</p>
              <p className="text-blue-100 text-sm">Approved</p>
            </div>
            <button
              onClick={fetchReports}
              className="inline-flex items-center px-4 py-2 bg-white bg-opacity-20 text-white rounded-lg hover:bg-opacity-30 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-800 transition-all"
              aria-label="Refresh reports"
            >
              <ArrowPathIcon className="h-5 w-5 mr-2" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Advanced Filters Section */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <FunnelIcon className="h-5 w-5 text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900">Advanced Filters</h3>
          </div>
          
          {/* Connection Status */}
          <div className="flex items-center space-x-2">
            <div className={`h-2 w-2 rounded-full ${ws ? 'bg-green-400' : 'bg-yellow-400'}`}></div>
            <span className="text-sm text-gray-500">
              {ws ? 'Real-time updates active' : 'Periodic updates'}
            </span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search reports, chairs, resolutions..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              aria-label="Search reports"
            />
          </div>
          
          {/* Subcommittee Filter */}
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
          </select>
          
          {/* Status Filter */}
          <select
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            aria-label="Filter by status"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          
          {/* Date Range Filter */}
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
          </select>
        </div>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredReports.length === 0 ? (
          <div className="col-span-full bg-white rounded-xl shadow-lg p-12 text-center">
            <DocumentTextIcon className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Reports Found</h3>
            <p className="text-gray-500">
              {filters.search || filters.subcommittee !== 'all' || filters.status !== 'all' || filters.dateRange !== 'all'
                ? 'Try adjusting your filters to see more reports.'
                : 'No reports have been submitted yet.'
              }
            </p>
          </div>
        ) : (
          filteredReports.map((report) => {
            const statusInfo = getStatusBadge(report.status);
            const StatusIcon = statusInfo.icon;
            const priority = getPriorityLevel(report.submissionDate, report.performance);
            
            return (
              <div
                key={report.id}
                className={`bg-white rounded-xl shadow-lg border-l-4 ${priority.color} hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1`}
              >
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <DocumentTextIcon className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">Report #{report.id}</h3>
                        <p className="text-sm text-gray-500">{priority.label}</p>
                      </div>
                    </div>
                    
                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${statusInfo.color}`}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {statusInfo.label}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <UserGroupIcon className="h-4 w-4 text-gray-400" />
                      <span className="font-medium text-gray-900">{report.chairName}</span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <div className="h-4 w-4 bg-blue-100 rounded flex items-center justify-center">
                        <span className="text-xs font-bold text-blue-600">SC</span>
                      </div>
                      <span className="text-sm text-gray-600">{report.subcommittee}</span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <CalendarIcon className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">{formatDate(report.submissionDate)}</span>
                    </div>
                    
                    <div className="pt-2">
                      <p className="text-sm text-gray-700 line-clamp-2">{report.resolution}</p>
                    </div>
                    
                    {/* Performance Indicator */}
                    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                      <div className="flex items-center space-x-2">
                        <ChartBarIcon className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">Performance</span>
                      </div>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getPerformanceBadge(report.performance)}`}>
                        {report.performance}%
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-6 flex space-x-2">
                    <button
                      onClick={() => {
                        setSelectedReport(report);
                        setReviewAction('');
                        setComment('');
                        setShowModal(true);
                      }}
                      className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                      aria-label={`View details for report ${report.id}`}
                    >
                      <EyeIcon className="h-4 w-4 mr-2" />
                      View Details
                    </button>
                    
                    {report.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleApprove(report.id)}
                          disabled={submitting}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 transition-colors"
                          aria-label={`Approve report ${report.id}`}
                        >
                          <CheckIcon className="h-4 w-4 mr-1" />
                          Approve
                        </button>
                        
                        <button
                          onClick={() => {
                            setSelectedReport(report);
                            setReviewAction('reject');
                            setComment('');
                            setShowModal(true);
                          }}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
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

      {/* Full-Screen Modal for Report Details */}
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
                        Report #{selectedReport.id} - Detailed Review
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
                      setReviewAction('');
                      setComment('');
                    }}
                    className="text-white hover:text-gray-200 p-2 rounded-lg hover:bg-white hover:bg-opacity-20 transition-colors"
                    aria-label="Close modal"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-8 space-y-8">
                {/* Report Overview Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                    <div className="flex items-center space-x-3">
                      <UserGroupIcon className="h-8 w-8 text-blue-600" />
                      <div>
                        <p className="text-sm font-medium text-blue-600">Chair</p>
                        <p className="text-lg font-bold text-blue-900">{selectedReport.chairName}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                    <div className="flex items-center space-x-3">
                      <ChartBarIcon className="h-8 w-8 text-green-600" />
                      <div>
                        <p className="text-sm font-medium text-green-600">Performance</p>
                        <p className="text-lg font-bold text-green-900">{selectedReport.performance}%</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-purple-50 border border-purple-200 rounded-xl p-6">
                    <div className="flex items-center space-x-3">
                      <div className="h-8 w-8 bg-purple-100 rounded flex items-center justify-center">
                        <span className="text-sm font-bold text-purple-600">SC</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-purple-600">Subcommittee</p>
                        <p className="text-lg font-bold text-purple-900">{selectedReport.subcommittee}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Report Details */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Resolution Details</h3>
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                      <p className="text-gray-900 leading-relaxed">{selectedReport.resolution}</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Progress Report</h3>
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                      <p className="text-gray-900 leading-relaxed">
                        {selectedReport.progressDetails || 'No progress details provided.'}
                      </p>
                    </div>
                  </div>

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

                  {/* Previous HOD Comments (if rejected before) */}
                  {selectedReport.hodComments && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Previous HOD Comments</h3>
                      <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                        <p className="text-gray-900 leading-relaxed">{selectedReport.hodComments}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Review Actions */}
                {selectedReport.status === 'pending' && (
                  <div className="border-t border-gray-200 pt-8">
                    <h3 className="text-lg font-semibold text-gray-900 mb-6">HOD Review Decision</h3>
                    
                    <div className="space-y-6">
                      {/* Action Selection */}
                      <div className="flex space-x-4">
                        <label className="flex items-center p-4 border-2 border-green-200 rounded-xl cursor-pointer hover:bg-green-50 transition-colors">
                          <input
                            type="radio"
                            name="reviewAction"
                            value="approve"
                            checked={reviewAction === 'approve'}
                            onChange={(e) => setReviewAction(e.target.value)}
                            className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
                          />
                          <div className="ml-4">
                            <div className="flex items-center space-x-2">
                              <CheckCircleIcon className="h-5 w-5 text-green-600" />
                              <span className="font-medium text-green-900">Approve Report</span>
                            </div>
                            <p className="text-sm text-green-700 mt-1">
                              Forward to Commissioner General for final review
                            </p>
                          </div>
                        </label>
                        
                        <label className="flex items-center p-4 border-2 border-red-200 rounded-xl cursor-pointer hover:bg-red-50 transition-colors">
                          <input
                            type="radio"
                            name="reviewAction"
                            value="reject"
                            checked={reviewAction === 'reject'}
                            onChange={(e) => setReviewAction(e.target.value)}
                            className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300"
                          />
                          <div className="ml-4">
                            <div className="flex items-center space-x-2">
                              <XCircleIcon className="h-5 w-5 text-red-600" />
                              <span className="font-medium text-red-900">Reject Report</span>
                            </div>
                            <p className="text-sm text-red-700 mt-1">
                              Send back to Chair with feedback for revision
                            </p>
                          </div>
                        </label>
                      </div>

                      {/* Rejection Comment */}
                      {reviewAction === 'reject' && (
                        <div>
                          <label htmlFor="rejectionComment" className="block text-sm font-medium text-gray-700 mb-2">
                            Detailed Feedback for Chair *
                          </label>
                          <textarea
                            id="rejectionComment"
                            rows="4"
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="Please provide specific feedback on what needs to be improved or corrected. Be detailed and constructive to help the Chair understand the required changes."
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            aria-describedby="comment-help"
                          />
                          <div className="flex items-center justify-between mt-2">
                            <p id="comment-help" className="text-xs text-gray-500">
                              Minimum 10 characters required for rejection
                            </p>
                            <p className={`text-xs ${comment.length >= 10 ? 'text-green-600' : 'text-red-600'}`}>
                              {comment.length}/10 characters
                            </p>
                          </div>
                        </div>
                      )}
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
                      setReviewAction('');
                      setComment('');
                    }}
                    className="px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                  >
                    Close
                  </button>
                  
                  {selectedReport.status === 'pending' && reviewAction && (
                    <button
                      onClick={handleReviewSubmit}
                      disabled={submitting || (reviewAction === 'reject' && comment.trim().length < 10)}
                      className={`px-6 py-3 text-sm font-medium text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors ${
                        reviewAction === 'approve'
                          ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
                          : 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {submitting ? (
                        <div className="flex items-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Processing...
                        </div>
                      ) : (
                        <>
                          {reviewAction === 'approve' ? (
                            <>
                              <CheckIcon className="h-4 w-4 mr-2 inline" />
                              Approve & Forward
                            </>
                          ) : (
                            <>
                              <XMarkIcon className="h-4 w-4 mr-2 inline" />
                              Reject & Send Feedback
                            </>
                          )}
                        </>
                      )}
                    </button>
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

export default HodReportReview;
