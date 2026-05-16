import React, { useState, useEffect } from 'react';
import { 
  FaFileAlt, 
  FaCheck, 
  FaTimes, 
  FaUser, 
  FaCalendar, 
  FaSpinner, 
  FaExclamationTriangle,
  FaSearch,
  FaFilter,
  FaSort,
  FaEye,
  FaComment,
  FaDownload
} from 'react-icons/fa';
import HODService from '../../services/hodService';
import PDFService from '../../services/pdfService';
import ReportExportBar from '../ReportExportBar';

const HODReportReview = ({ user }) => {
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [reviewAction, setReviewAction] = useState('');
  const [comments, setComments] = useState('');
  const [hodRanking, setHodRanking] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Filter and search states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('SUBMITTED');
  const [sortBy, setSortBy] = useState('submittedAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [pdfLoading, setPdfLoading] = useState(false);

  const hodReviewReportTypes = [
    { value: 'all', label: 'All Reports' },
    { value: 'submitted', label: 'Pending Review' },
    { value: 'approved', label: 'Approved by HOD' },
    { value: 'rejected', label: 'Rejected by HOD' },
  ];

  const handleExportPDF = ({ fromDate, toDate, reportType }) => {
    setPdfLoading(true);
    try {
      const from = new Date(fromDate);
      const to = new Date(toDate);
      to.setHours(23, 59, 59);
      let filtered = reports.filter(r => {
        const d = new Date(r.submittedAt);
        return d >= from && d <= to;
      });
      if (reportType === 'submitted') filtered = filtered.filter(r => r.status === 'SUBMITTED');
      else if (reportType === 'approved') filtered = filtered.filter(r => r.status === 'APPROVED_BY_HOD');
      else if (reportType === 'rejected') filtered = filtered.filter(r => r.status === 'REJECTED_BY_HOD');
      const titles = { all: 'All Reports (HOD Review)', submitted: 'Pending Review Reports', approved: 'HOD Approved Reports', rejected: 'HOD Rejected Reports' };
      PDFService.generateReportsListPDF(filtered, fromDate, toDate, titles[reportType] || 'Reports');
    } catch (err) { console.error('PDF export error:', err); }
    finally { setPdfLoading(false); }
  };

  useEffect(() => {
    fetchReportsForReview();
  }, [statusFilter]);

  useEffect(() => {
    filterAndSortReports();
  }, [reports, searchTerm, sortBy, sortOrder]);

  const fetchReportsForReview = async () => {
    try {
      setLoading(true);
      const reportsData = await HODService.getAllReports(statusFilter);
      setReports(reportsData);
    } catch (error) {
      console.error('Error fetching reports:', error);
      setError('Failed to load reports for review');
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortReports = () => {
    let filtered = [...reports];

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(report => 
        report.resolution?.title?.toLowerCase().includes(searchLower) ||
        report.submittedBy?.name?.toLowerCase().includes(searchLower) ||
        report.subcommittee?.name?.toLowerCase().includes(searchLower)
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let valueA, valueB;
      
      switch (sortBy) {
        case 'submittedAt':
          valueA = new Date(a.submittedAt);
          valueB = new Date(b.submittedAt);
          break;
        case 'performancePercentage':
          valueA = a.performancePercentage;
          valueB = b.performancePercentage;
          break;
        case 'resolutionTitle':
          valueA = a.resolution?.title?.toLowerCase() || '';
          valueB = b.resolution?.title?.toLowerCase() || '';
          break;
        case 'chairName':
          valueA = a.submittedBy?.name?.toLowerCase() || '';
          valueB = b.submittedBy?.name?.toLowerCase() || '';
          break;
        default:
          return 0;
      }

      if (valueA < valueB) return sortOrder === 'asc' ? -1 : 1;
      if (valueA > valueB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredReports(filtered);
  };

  const handleReportSelect = (report) => {
    setSelectedReport(report);
    setReviewAction('');
    setComments('');
    setHodRanking(0);
    setError('');
    setSuccess('');
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();

    if (!selectedReport) {
      setError('Please select a report to review');
      return;
    }

    if (!reviewAction) {
      setError('Please select approve or reject');
      return;
    }

    if (reviewAction === 'reject' && !comments.trim()) {
      setError('Comments are required when rejecting a report');
      return;
    }

    if (reviewAction === 'approve' && !hodRanking) {
      setError('Please provide a ranking (1-5) when approving a report');
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
    setError('');
    setSuccess('');

    try {
      const isApproved = reviewAction === 'approve';
      await HODService.reviewReport(
        selectedReport.id, 
        isApproved, 
        comments.trim() || (isApproved ? 'Approved' : 'Rejected'),
        user.id,
        isApproved ? hodRanking : null
      );

      const action = isApproved ? 'approved' : 'rejected';
      const nextStep = isApproved 
        ? ' The report has been forwarded to the Commissioner General.'
        : ' The report has been sent back to the Chair with your feedback.';

      setSuccess(`Report ${action} successfully!${nextStep}`);
      
      // Reset form
      setSelectedReport(null);
      setReviewAction('');
      setComments('');
      setHodRanking(0);

      // Refresh reports list
      await fetchReportsForReview();
    } catch (error) {
      console.error('Error submitting review:', error);
      setError(error.message || 'Failed to submit review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadReport = async (report, format = 'pdf', e) => {
    if (e) e.stopPropagation();
    try {
      if (format === 'pdf') {
        PDFService.generateReportPDF(report);
      } else {
        await HODService.downloadReport(report.id, format);
      }
    } catch (err) {
      console.error('Download failed:', err);
      setError('Failed to download report. Please try again.');
    }
  };

  const getPerformanceColor = (percentage) => {
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 80) return 'text-green-500';
    if (percentage >= 70) return 'text-yellow-600';
    if (percentage >= 60) return 'text-orange-500';
    return 'text-red-600';
  };

  const getPerformanceLabel = (percentage) => {
    if (percentage >= 90) return 'Excellent';
    if (percentage >= 80) return 'Very Good';
    if (percentage >= 70) return 'Good';
    if (percentage >= 60) return 'Satisfactory';
    if (percentage >= 50) return 'Fair';
    return 'Poor';
  };

  const getUrgencyLevel = (submittedAt) => {
    const submitted = new Date(submittedAt);
    const now = new Date();
    const hoursAgo = (now - submitted) / (1000 * 60 * 60);
    
    if (hoursAgo > 72) return { level: 'overdue', color: 'text-red-600', bg: 'bg-red-50' };
    if (hoursAgo > 48) return { level: 'urgent', color: 'text-orange-600', bg: 'bg-orange-50' };
    if (hoursAgo > 24) return { level: 'warning', color: 'text-yellow-600', bg: 'bg-yellow-50' };
    return { level: 'normal', color: 'text-green-600', bg: 'bg-green-50' };
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <FaSpinner className="animate-spin text-4xl text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading reports for review...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FaFileAlt className="text-blue-600" />
            Report Review Dashboard
          </h2>
          <p className="text-gray-600">Review and approve progress reports submitted by committee chairs</p>
        </div>
        <div className="text-sm text-gray-500">
          {filteredReports.length} of {reports.length} reports
        </div>
      </div>

      {/* Report Export Bar */}
      <ReportExportBar
        reportTypes={hodReviewReportTypes}
        onExport={handleExportPDF}
        loading={pdfLoading}
      />

      {/* Alert Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <FaExclamationTriangle />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <FaCheck />
          <span>{success}</span>
        </div>
      )}

      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-wrap items-center gap-4">
          {/* Search */}
          <div className="flex-1 min-w-64">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by resolution, chair, or subcommittee..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <FaFilter className="text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="SUBMITTED">Pending Review</option>
              <option value="APPROVED_BY_HOD">Approved</option>
              <option value="REJECTED_BY_HOD">Rejected</option>
            </select>
          </div>

          {/* Sort */}
          <div className="flex items-center gap-2">
            <FaSort className="text-gray-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="submittedAt">Submission Date</option>
              <option value="performancePercentage">Performance</option>
              <option value="resolutionTitle">Resolution</option>
              <option value="chairName">Chair Name</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Reports List */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Reports ({filteredReports.length})
            </h3>
          </div>
          
          <div className="p-4">
            {filteredReports.length === 0 ? (
              <div className="text-center py-12">
                <FaFileAlt className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No Reports Found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchTerm ? 'No reports match your search criteria.' : 'No reports available for review.'}
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {filteredReports.map(report => {
                  const urgency = getUrgencyLevel(report.submittedAt);
                  return (
                    <div
                      key={report.id}
                      className={`border rounded-lg p-4 cursor-pointer transition-all ${
                        selectedReport?.id === report.id
                          ? 'border-blue-500 bg-blue-50 shadow-md'
                          : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                      }`}
                      onClick={() => handleReportSelect(report)}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <h4 className="font-medium text-gray-900 text-sm">
                          {report.resolution?.title || 'Resolution Report'}
                        </h4>
                        <div className="flex items-center gap-2">
                          <span className={`text-lg font-bold ${getPerformanceColor(report.performancePercentage)}`}>
                            {report.performancePercentage}%
                          </span>
                          <div className={`px-2 py-1 rounded-full text-xs ${urgency.bg} ${urgency.color}`}>
                            {urgency.level}
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-xs text-gray-600 space-y-1">
                        <div className="flex items-center gap-2">
                          <FaUser className="text-gray-400" />
                          <span>Chair: {report.submittedBy?.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <FaCalendar className="text-gray-400" />
                          <span>Submitted: {formatDate(report.submittedAt)}</span>
                        </div>
                        <div>
                          <span className="font-medium">Subcommittee:</span> {report.subcommittee?.name}
                        </div>
                      </div>

                      {/* Performance Bar */}
                      <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="h-2 rounded-full transition-all"
                          style={{
                            width: `${report.performancePercentage}%`,
                            backgroundColor: 
                              report.performancePercentage >= 80 ? '#16a34a' :
                              report.performancePercentage >= 60 ? '#eab308' :
                              report.performancePercentage >= 40 ? '#f59e0b' : '#ef4444'
                          }}
                        ></div>
                      </div>

                      {/* Action Buttons */}
                      <div className="mt-3 flex justify-end gap-3">
                        <button
                          onClick={(e) => handleDownloadReport(report, 'pdf', e)}
                          className="text-xs flex items-center gap-1 px-3 py-1 rounded text-white"
                          style={{ backgroundColor: '#003366' }}
                          title="Download Report as PDF"
                        >
                          <FaDownload />
                          PDF
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleReportSelect(report);
                          }}
                          className="text-blue-600 hover:text-blue-800 text-xs flex items-center gap-1"
                        >
                          <FaEye />
                          Review
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Review Panel */}
        {selectedReport ? (
          <div className="bg-white shadow-sm rounded-lg border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Review Report</h3>
                <p className="text-sm text-gray-600">{selectedReport.resolution?.title}</p>
              </div>
              <button
                onClick={() => handleDownloadReport(selectedReport, 'pdf')}
                className="px-3 py-1.5 text-sm font-medium text-white rounded-lg flex items-center gap-1.5"
                style={{ backgroundColor: '#003366' }}
                title="Download PDF"
              >
                <FaDownload />
                Download PDF
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Report Summary */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">Report Summary</h4>
                <div className="grid grid-cols-1 gap-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Performance:</span>
                    <span className={`font-bold ${getPerformanceColor(selectedReport.performancePercentage)}`}>
                      {selectedReport.performancePercentage}% ({getPerformanceLabel(selectedReport.performancePercentage)})
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Chair:</span>
                    <span className="font-medium">{selectedReport.submittedBy?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subcommittee:</span>
                    <span className="font-medium">{selectedReport.subcommittee?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Submitted:</span>
                    <span className="font-medium">{formatDate(selectedReport.submittedAt)}</span>
                  </div>
                </div>
              </div>

              {/* Progress Details */}
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Progress Details</h4>
                <div className="bg-white border border-gray-200 rounded-lg p-3 max-h-32 overflow-y-auto">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {selectedReport.progressDetails || 'No progress details provided'}
                  </p>
                </div>
              </div>

              {/* Hindrances */}
              {selectedReport.hindrances && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Challenges & Hindrances</h4>
                  <div className="bg-white border border-gray-200 rounded-lg p-3 max-h-24 overflow-y-auto">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {selectedReport.hindrances}
                    </p>
                  </div>
                </div>
              )}

              {/* Review Form */}
              <form onSubmit={handleReviewSubmit} className="space-y-4">
                {/* Review Decision */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Review Decision *
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="reviewAction"
                        value="approve"
                        checked={reviewAction === 'approve'}
                        onChange={(e) => setReviewAction(e.target.value)}
                        className="mr-2"
                        disabled={submitting}
                      />
                      <FaCheck className="text-green-600 mr-2" />
                      <span className="text-green-800 font-medium text-sm">
                        Approve (Forward to Commissioner)
                      </span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="reviewAction"
                        value="reject"
                        checked={reviewAction === 'reject'}
                        onChange={(e) => setReviewAction(e.target.value)}
                        className="mr-2"
                        disabled={submitting}
                      />
                      <FaTimes className="text-red-600 mr-2" />
                      <span className="text-red-800 font-medium text-sm">
                        Reject (Send back to Chair)
                      </span>
                    </label>
                  </div>
                </div>

                {/* Report Ranking (when approving) */}
                {reviewAction === 'approve' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Report Ranking (1-5) *
                    </label>
                    <p className="text-xs text-gray-500 mb-2">Rate this report's quality before approving</p>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map(star => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setHodRanking(star)}
                          className="transition-all"
                          style={{
                            width: 44, height: 44, borderRadius: '50%', border: 'none',
                            fontSize: '1.1rem', cursor: 'pointer', fontWeight: 700,
                            background: hodRanking >= star ? '#f59e0b' : '#e5e7eb',
                            color: hodRanking >= star ? '#fff' : '#6b7280',
                          }}
                          title={['Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][star - 1]}
                          disabled={submitting}
                        >
                          {star}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {hodRanking > 0 ? `${['Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][hodRanking - 1]} (${hodRanking}/5)` : 'Please select a ranking'}
                    </p>
                  </div>
                )}

                {/* Comments */}
                <div>
                  <label htmlFor="comments" className="block text-sm font-medium text-gray-700 mb-2">
                    Review Comments {reviewAction === 'reject' && <span className="text-red-500">*</span>}
                  </label>
                  <div className="relative">
                    <FaComment className="absolute left-3 top-3 text-gray-400" />
                    <textarea
                      id="comments"
                      value={comments}
                      onChange={(e) => setComments(e.target.value)}
                      rows="3"
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                      placeholder={
                        reviewAction === 'approve' 
                          ? "Optional: Provide positive feedback..."
                          : reviewAction === 'reject'
                          ? "Required: Explain rejection reasons..."
                          : "Provide your review comments..."
                      }
                      disabled={submitting}
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setSelectedReport(null)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={`px-4 py-2 text-sm font-medium text-white border border-transparent rounded-lg disabled:opacity-50 flex items-center gap-2 ${
                      reviewAction === 'approve' 
                        ? 'bg-green-600 hover:bg-green-700' 
                        : 'bg-red-600 hover:bg-red-700'
                    }`}
                    disabled={submitting || !reviewAction}
                  >
                    {submitting ? (
                      <>
                        <FaSpinner className="animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        {reviewAction === 'approve' ? <FaCheck /> : <FaTimes />}
                        {reviewAction === 'approve' ? 'Approve Report' : 'Reject Report'}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : (
          <div className="bg-white shadow-sm rounded-lg border border-gray-200 flex items-center justify-center">
            <div className="text-center py-12">
              <FaFileAlt className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900">Select a Report to Review</h3>
              <p className="text-sm text-gray-500">
                Choose a report from the list to view details and provide your review
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HODReportReview;
