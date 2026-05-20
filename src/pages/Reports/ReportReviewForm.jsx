import React, { useState, useEffect } from 'react';
import { FaFileAlt, FaCheck, FaTimes, FaComment, FaUser, FaCalendar, FaSpinner, FaExclamationTriangle, FaDownload } from 'react-icons/fa';
import AuthService from '../services/authService';
import HODPermissionService from '../../services/hodPermissionService';
import PDFService from '../../services/pdfService';
import ReportExportBar from '../../components/ReportExportBar';
import http from '../../services/http';

const ReportReviewForm = () => {
  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [reviewAction, setReviewAction] = useState('');
  const [comments, setComments] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [pdfLoading, setPdfLoading] = useState(false);

  const reviewReportTypes = [
    { value: 'all', label: 'All Reports' },
    { value: 'pending', label: 'Pending Reports' },
    { value: 'approved', label: 'Approved Reports' },
    { value: 'rejected', label: 'Rejected Reports' },
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
      if (reportType === 'pending') filtered = filtered.filter(r => ['SUBMITTED','APPROVED_BY_HOD'].includes(r.status));
      else if (reportType === 'approved') filtered = filtered.filter(r => ['APPROVED_BY_HOD','APPROVED_BY_COMMISSIONER'].includes(r.status));
      else if (reportType === 'rejected') filtered = filtered.filter(r => ['REJECTED_BY_HOD','REJECTED_BY_COMMISSIONER'].includes(r.status));
      PDFService.generateReportsListPDF(filtered, fromDate, toDate, 'Report Review');
    } catch (err) { console.error('PDF export error:', err); }
    finally { setPdfLoading(false); }
  };

  const currentUser = AuthService.getCurrentUser();
  const isHOD = HODPermissionService.hasHODPrivileges(currentUser);
  const canHODApproveOrReject = HODPermissionService.canReviewReports(currentUser);
  const isCommissioner = currentUser?.role === 'COMMISSIONER_GENERAL';

  useEffect(() => {
    fetchReportsForReview();
  }, []);

  const fetchReportsForReview = async () => {
    try {
      if (!currentUser?.id) {
        setError('You must be logged in to review reports');
        setLoading(false);
        return;
      }
      let endpoint = '';
      if (isHOD) {
        // HOD sees all reports (including reviewed ones for download)
        endpoint = `/api/reports`;
      } else if (isCommissioner) {
        // Commissioner sees all reports (including reviewed ones for download)
        endpoint = `/api/reports`;
      } else {
        setError('You do not have permission to review reports');
        setLoading(false);
        return;
      }

      const { data } = await http.get(endpoint);
      setReports(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching reports:', error);
      setError(error.response?.data?.error || 'Failed to load reports for review');
    } finally {
      setLoading(false);
    }
  };

  const handleReportSelect = (report) => {
    setSelectedReport(report);
    setReviewAction('');
    setComments('');
    setError('');
    setSuccess('');
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();

    if (!selectedReport) {
      setError('Please select a report to review');
      return;
    }

    if ((isCommissioner || canHODApproveOrReject) && !reviewAction) {
      setError('Please select approve or reject');
      return;
    }

    if ((reviewAction === 'reject' || (isHOD && !canHODApproveOrReject)) && !comments.trim()) {
      setError('Comments are required when rejecting a report');
      return;
    }

    const confirmationMessage = (isHOD && !canHODApproveOrReject)
      ? 'Are you sure you want to submit this comment?'
      : reviewAction === 'approve'
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
      const endpoint = isHOD
        ? `/api/reports/${selectedReport.id}/hod-review`
        : `/api/reports/${selectedReport.id}/commissioner-review`;

      const reviewData = isHOD ? {
        hodId: currentUser.id,
        ...(canHODApproveOrReject ? { approved: isApproved } : {}),
        comments: comments.trim() || (isApproved ? 'Approved' : 'Rejected')
      } : {
        commissionerId: currentUser.id,
        approved: isApproved,
        comments: comments.trim() || (isApproved ? 'Approved' : 'Rejected')
      };

      await http.post(endpoint, reviewData);
        if (isHOD && !canHODApproveOrReject) {
          setSuccess('Comment submitted successfully!');
        } else {
          const action = isApproved ? 'approved' : 'rejected';
          const nextStep = isHOD && isApproved
            ? ' The report has been forwarded to the Commissioner General.'
            : isCommissioner && isApproved
            ? ' The report has been marked as final approved.'
            : ' The report has been sent back to the Chair with your feedback.';

          setSuccess(`Report ${action} successfully!${nextStep}`);
        }

        setSelectedReport(null);
        setReviewAction('');
        setComments('');
        await fetchReportsForReview();
    } catch (error) {
      console.error('Error submitting review:', error);
      setError(error.response?.data?.error || error.message || 'Failed to submit review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const getPerformanceColor = (percentage) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    if (percentage >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getPerformanceLabel = (percentage) => {
    if (percentage >= 90) return 'Excellent';
    if (percentage >= 80) return 'Very Good';
    if (percentage >= 70) return 'Good';
    if (percentage >= 60) return 'Satisfactory';
    if (percentage >= 50) return 'Fair';
    if (percentage >= 30) return 'Poor';
    return 'Very Poor';
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <FaSpinner className="animate-spin text-4xl text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading reports for review...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <FaFileAlt className="text-blue-600" />
            Report Review - {isHOD ? 'HOD Review' : 'Commissioner Review'}
          </h1>
          <p className="mt-2 text-gray-600">
            {isHOD 
              ? 'Review progress reports submitted by committee chairs'
              : 'Final review of reports approved by HODs'
            }
          </p>
        </div>

        {/* Report Export Bar */}
        <div className="mb-6">
          <ReportExportBar
            reportTypes={reviewReportTypes}
            onExport={handleExportPDF}
            loading={pdfLoading}
          />
        </div>

        {/* Alert Messages */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
            <FaExclamationTriangle />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
            <FaCheck />
            <span>{success}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Reports List */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                Reports ({reports.length})
              </h2>
              <p className="text-sm text-gray-600">
                Select a report to review or download
              </p>
            </div>
            
            <div className="p-6">
              {reports.length === 0 ? (
                <div className="text-center py-12">
                  <FaFileAlt className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No Reports Pending</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {isHOD 
                      ? 'No reports submitted by chairs require your review.'
                      : 'No reports approved by HODs require your review.'
                    }
                  </p>
                </div>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {reports.map(report => (
                    <div
                      key={report.id}
                      className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                        selectedReport?.id === report.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handleReportSelect(report)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-gray-900">
                          {report.resolution?.title || 'Resolution Report'}
                        </h4>
                        <span className={`text-lg font-bold ${getPerformanceColor(report.performancePercentage)}`}>
                          {report.performancePercentage}%
                        </span>
                      </div>
                      
                      <div className="text-sm text-gray-600 space-y-1">
                        <div className="flex items-center gap-2">
                          <FaUser className="text-gray-400" />
                          <span>By: {report.submittedBy?.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <FaCalendar className="text-gray-400" />
                          <span>Submitted: {formatDate(report.submittedAt)}</span>
                        </div>
                        <div>
                          <span className="font-medium">Subcommittee:</span> {report.subcommittee?.name}
                        </div>
                      </div>

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

                      {/* Status Badge */}
                      <div className="mt-2 flex items-center justify-between">
                        <span className={`inline-block px-2 py-1 text-xs font-semibold rounded ${
                          report.status === 'APPROVED_BY_COMMISSIONER' ? 'bg-green-100 text-green-800' :
                          report.status === 'REJECTED_BY_COMMISSIONER' ? 'bg-red-100 text-red-800' :
                          report.status === 'APPROVED_BY_HOD' ? 'bg-blue-100 text-blue-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {(report.status || '').replace(/_/g, ' ')}
                        </span>
                        <button
                          onClick={(e) => { e.stopPropagation(); PDFService.generateReportPDF(report); }}
                          className="flex items-center gap-1 px-3 py-1 text-xs font-medium text-white rounded"
                          style={{ backgroundColor: '#003366' }}
                          title="Download as PDF"
                        >
                          <FaDownload /> PDF
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Review Form */}
          {selectedReport && (
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">
                  {(isHOD && !canHODApproveOrReject) ? 'Comment on Report' : 'Review Report'}
                </h2>
                <p className="text-sm text-gray-600">{selectedReport.resolution?.title}</p>
              </div>

              <div className="p-6">
                {/* Report Details */}
                <div className="mb-6 space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-3">Report Summary</h3>
                    <div className="grid grid-cols-1 gap-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Performance Rating:</span>
                        <span className={`font-bold ${getPerformanceColor(selectedReport.performancePercentage)}`}>
                          {selectedReport.performancePercentage}% ({getPerformanceLabel(selectedReport.performancePercentage)})
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Submitted by:</span>
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
                    <div className="bg-white border border-gray-200 rounded-lg p-3">
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">
                        {selectedReport.progressDetails || 'No progress details provided'}
                      </p>
                    </div>
                  </div>

                  {/* Hindrances */}
                  {selectedReport.hindrances && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Challenges & Hindrances</h4>
                      <div className="bg-white border border-gray-200 rounded-lg p-3">
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">
                          {selectedReport.hindrances}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Previous Reviews */}
                  {selectedReport.hodComments && isCommissioner && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">HOD Review</h4>
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <FaCheck className="text-green-600" />
                          <span className="text-sm font-medium text-green-800">
                            Approved by {selectedReport.reviewedByHod?.name}
                          </span>
                          <span className="text-xs text-green-600">
                            ({formatDate(selectedReport.hodReviewedAt)})
                          </span>
                        </div>
                        <p className="text-sm text-green-700">
                          {selectedReport.hodComments}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Review Form */}
                <form onSubmit={handleReviewSubmit} className="space-y-6">
                  {/* Review Decision */}
                  {(isCommissioner || canHODApproveOrReject) && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
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
                          <span className="text-green-800 font-medium">
                            Approve {isHOD ? '(Forward to Commissioner)' : '(Final Approval)'}
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
                          <span className="text-red-800 font-medium">
                            Reject (Send back to Chair)
                          </span>
                        </label>
                      </div>
                    </div>
                  )}

                  {/* Comments */}
                  <div>
                    <label htmlFor="comments" className="block text-sm font-medium text-gray-700 mb-2">
                      Review Comments {(reviewAction === 'reject' || (isHOD && !canHODApproveOrReject)) && <span className="text-red-500">*</span>}
                    </label>
                    <textarea
                      id="comments"
                      value={comments}
                      onChange={(e) => setComments(e.target.value)}
                      rows="4"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder={
                        (isHOD && !canHODApproveOrReject)
                          ? 'Add your comment on this report...'
                          : reviewAction === 'approve'
                          ? "Optional: Provide positive feedback or recommendations..."
                          : reviewAction === 'reject'
                          ? "Required: Explain why the report is being rejected and what needs to be improved..."
                          : "Provide your review comments..."
                      }
                      disabled={submitting}
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      {(reviewAction === 'reject' || (isHOD && !canHODApproveOrReject))
                        ? 'Detailed feedback is required when rejecting a report'
                        : 'Your comments will be sent to the chair as feedback'
                      }
                    </p>
                  </div>

                  {/* Performance Assessment (for reference) */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-2">Performance Assessment</h4>
                    <div className="text-sm text-blue-800 space-y-1">
                      <div>
                        <strong>Current Rating:</strong> 
                        <span className={`ml-1 font-bold ${getPerformanceColor(selectedReport.performancePercentage)}`}>
                          {selectedReport.performancePercentage}% ({getPerformanceLabel(selectedReport.performancePercentage)})
                        </span>
                      </div>
                      <div>
                        <strong>Resolution:</strong> {selectedReport.resolution?.title}
                      </div>
                      <div>
                        <strong>Contribution:</strong> This subcommittee's assigned portion of the resolution
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={() => setSelectedReport(null)}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                      disabled={submitting}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className={`px-4 py-2 text-sm font-medium text-white border border-transparent rounded-md disabled:opacity-50 flex items-center gap-2 ${
                        (isHOD && !canHODApproveOrReject)
                          ? 'bg-blue-600 hover:bg-blue-700'
                          : reviewAction === 'approve'
                          ? 'bg-green-600 hover:bg-green-700' 
                          : 'bg-red-600 hover:bg-red-700'
                      }`}
                      disabled={submitting || ((isCommissioner || canHODApproveOrReject) && !reviewAction)}
                    >
                      {submitting ? (
                        <>
                          <FaSpinner className="animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          {(isHOD && !canHODApproveOrReject)
                            ? <FaComment />
                            : reviewAction === 'approve' ? <FaCheck /> : <FaTimes />}
                          {(isHOD && !canHODApproveOrReject)
                            ? 'Submit Comment'
                            : reviewAction === 'approve' ? 'Approve Report' : 'Reject Report'}
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {isHOD ? 'HOD Review Guidelines' : 'Commissioner Review Guidelines'}
          </h3>
          <div className="prose text-sm text-gray-600">
            <ul className="space-y-2">
              {isHOD ? (
                <>
                  <li>• <strong>Review Progress:</strong> Assess if the progress details are realistic and measurable</li>
                  <li>• <strong>Performance Rating:</strong> Verify if the percentage aligns with the actual progress described</li>
                  <li>• <strong>Approve:</strong> Forward well-documented reports with reasonable progress to Commissioner</li>
                  <li>• <strong>Reject:</strong> Send back reports needing more detail, clarification, or realistic assessment</li>
                  <li>• <strong>Feedback:</strong> Always provide constructive comments to help chairs improve</li>
                </>
              ) : (
                <>
                  <li>• <strong>Final Review:</strong> This is the final approval stage for the report</li>
                  <li>• <strong>Strategic Assessment:</strong> Consider the overall impact and strategic alignment</li>
                  <li>• <strong>Approve:</strong> Mark reports as finally approved for organizational records</li>
                  <li>• <strong>Reject:</strong> Send back to Chair with detailed feedback for improvement</li>
                  <li>• <strong>System Impact:</strong> Your decision affects final resolution tracking and metrics</li>
                </>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportReviewForm;