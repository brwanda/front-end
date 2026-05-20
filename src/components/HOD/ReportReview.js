import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { 
  EyeIcon, 
  CheckIcon, 
  XMarkIcon, 
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import http from '../../services/http';

const ReportReview = () => {
  // State management
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [reviewAction, setReviewAction] = useState('');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Fetch reports from API
  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await http.get('/api/reports/pending');
      setReports(data);
      setFilteredReports(data);
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast.error('Failed to load reports. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial data fetch
  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  // Filter reports based on search and status
  useEffect(() => {
    let filtered = reports;
    
    if (searchTerm) {
      filtered = filtered.filter(report => 
        report.chairName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.resolution.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(report => report.status === statusFilter);
    }
    
    setFilteredReports(filtered);
  }, [reports, searchTerm, statusFilter]);

  // Handle report review submission
  const handleReviewSubmit = async () => {
    // Validation
    if (!reviewAction) {
      toast.error('Please select an action (Approve or Reject)');
      return;
    }
    
    if (reviewAction === 'reject' && comment.trim().length < 10) {
      toast.error('Rejection comment must be at least 10 characters long');
      return;
    }

    const confirmationMessage =
      reviewAction === 'approve'
        ? 'Are you sure you want to approve?'
        : 'Are you sure you want to reject?';

    if (!window.confirm(confirmationMessage)) {
      return;
    }

    setSubmitting(true);
    
    try {
      const payload = {
        reportId: selectedReport.id,
        status: reviewAction,
        comment: reviewAction === 'reject' ? comment.trim() : 'Approved by HOD'
      };

      await http.post('/api/reports/review', payload);
      
      toast.success(
        reviewAction === 'approve' 
          ? 'Report approved successfully! Forwarded to Commissioner General.' 
          : 'Report rejected and feedback sent to Chair.'
      );
      
      // Close modal and refresh data
      setShowModal(false);
      setSelectedReport(null);
      setReviewAction('');
      setComment('');
      fetchReports();
      
    } catch (error) {
      console.error('Error reviewing report:', error);
      toast.error('Failed to review report. Please try again.');
    } finally {
      setSubmitting(false);
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
    if (percentage >= 90) return 'bg-green-100 text-green-800';
    if (percentage >= 80) return 'bg-blue-100 text-blue-800';
    if (percentage >= 70) return 'bg-yellow-100 text-yellow-800';
    if (percentage >= 60) return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  };

  // Get status badge color
  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64" role="status" aria-label="Loading reports">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading reports...</span>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-lg rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 sm:mb-0">
            Report Review Dashboard
          </h2>
          <button
            onClick={fetchReports}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            aria-label="Refresh reports"
          >
            <ArrowPathIcon className="h-4 w-4 mr-2" />
            Refresh
          </button>
        </div>
        
        {/* Search and Filter Controls */}
        <div className="mt-4 flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by chair name or resolution..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              aria-label="Search reports"
            />
          </div>
          <div className="flex items-center">
            <FunnelIcon className="h-5 w-5 text-gray-400 mr-2" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              aria-label="Filter by status"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Reports Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Report ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Chair Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Submission Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Resolution
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Performance
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredReports.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                  No reports found matching your criteria.
                </td>
              </tr>
            ) : (
              filteredReports.map((report) => (
                <tr key={report.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    #{report.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {report.chairName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(report.submissionDate)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                    {report.resolution}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPerformanceBadge(report.performance)}`}>
                      {report.performance}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(report.status)}`}>
                      {report.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setSelectedReport(report);
                          setShowModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-900 inline-flex items-center"
                        aria-label={`View details for report ${report.id}`}
                      >
                        <EyeIcon className="h-4 w-4 mr-1" />
                        View
                      </button>
                      {report.status === 'pending' && (
                        <>
                          <button
                            onClick={() => {
                              setSelectedReport(report);
                              setReviewAction('approve');
                              setShowModal(true);
                            }}
                            className="text-green-600 hover:text-green-900 inline-flex items-center"
                            aria-label={`Approve report ${report.id}`}
                          >
                            <CheckIcon className="h-4 w-4 mr-1" />
                            Approve
                          </button>
                          <button
                            onClick={() => {
                              setSelectedReport(report);
                              setReviewAction('reject');
                              setShowModal(true);
                            }}
                            className="text-red-600 hover:text-red-900 inline-flex items-center"
                            aria-label={`Reject report ${report.id}`}
                          >
                            <XMarkIcon className="h-4 w-4 mr-1" />
                            Reject
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Report Details Modal */}
      {showModal && selectedReport && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" role="dialog" aria-modal="true">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b">
              <h3 className="text-lg font-semibold text-gray-900">
                Report Details - #{selectedReport.id}
              </h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedReport(null);
                  setReviewAction('');
                  setComment('');
                }}
                className="text-gray-400 hover:text-gray-600"
                aria-label="Close modal"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Chair Name</label>
                  <p className="text-sm text-gray-900">{selectedReport.chairName}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Submission Date</label>
                  <p className="text-sm text-gray-900">{formatDate(selectedReport.submissionDate)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Performance</label>
                  <p className="text-sm text-gray-900">{selectedReport.performance}%</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(selectedReport.status)}`}>
                    {selectedReport.status}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Resolution</label>
                <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md">
                  {selectedReport.resolution}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Progress Details</label>
                <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md">
                  {selectedReport.progressDetails || 'No progress details provided.'}
                </p>
              </div>

              {selectedReport.hindrances && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Hindrances</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md">
                    {selectedReport.hindrances}
                  </p>
                </div>
              )}

              {/* Review Actions */}
              {selectedReport.status === 'pending' && (
                <div className="border-t pt-4">
                  <h4 className="text-md font-medium text-gray-900 mb-3">Review Actions</h4>
                  
                  <div className="flex space-x-4 mb-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="reviewAction"
                        value="approve"
                        checked={reviewAction === 'approve'}
                        onChange={(e) => setReviewAction(e.target.value)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <span className="ml-2 text-sm text-gray-900">Approve</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="reviewAction"
                        value="reject"
                        checked={reviewAction === 'reject'}
                        onChange={(e) => setReviewAction(e.target.value)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <span className="ml-2 text-sm text-gray-900">Reject</span>
                    </label>
                  </div>

                  {reviewAction === 'reject' && (
                    <div>
                      <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-2">
                        Rejection Comment *
                      </label>
                      <textarea
                        id="comment"
                        rows="3"
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Please provide detailed feedback (minimum 10 characters)..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        aria-describedby="comment-help"
                      />
                      <p id="comment-help" className="text-xs text-gray-500 mt-1">
                        {comment.length}/10 characters minimum
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end pt-4 border-t space-x-3">
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedReport(null);
                  setReviewAction('');
                  setComment('');
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              {selectedReport.status === 'pending' && reviewAction && (
                <button
                  onClick={handleReviewSubmit}
                  disabled={submitting || (reviewAction === 'reject' && comment.trim().length < 10)}
                  className={`px-4 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                    reviewAction === 'approve'
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-red-600 hover:bg-red-700'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {submitting ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Processing...
                    </div>
                  ) : (
                    reviewAction === 'approve' ? 'Approve Report' : 'Reject Report'
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportReview;
