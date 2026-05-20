// components/ReportExportBar.jsx
// Reusable filter bar: FROM date, TO date, TYPE OF REPORT, Export PDF button
import React, { useState } from 'react';
import { FaFilePdf, FaFilter } from 'react-icons/fa';
import './ReportExportBar.css';

/**
 * @param {Object} props
 * @param {Array<{value:string, label:string}>} props.reportTypes - Dropdown options
 * @param {Function} props.onExport - Called with { fromDate, toDate, reportType }
 * @param {boolean} [props.loading] - Disables button while generating
 */
const ReportExportBar = ({ reportTypes = [], onExport, loading = false }) => {
  const today = new Date().toISOString().slice(0, 10);
  const yearAgo = new Date(Date.now() - 365 * 86400000).toISOString().slice(0, 10);

  const [fromDate, setFromDate] = useState(yearAgo);
  const [toDate, setToDate] = useState(today);
  const [reportType, setReportType] = useState(reportTypes[0]?.value || '');

  const dateRangeError =
    fromDate > today || toDate > today
      ? 'Future dates are not allowed.'
      : fromDate > toDate
        ? 'From date cannot be after To date.'
        : '';

  const handleExport = () => {
    if (dateRangeError) return;
    if (onExport) onExport({ fromDate, toDate, reportType });
  };

  return (
    <div className="report-export-bar">
      <span className="report-export-label"><FaFilter /> Filter Report:</span>

      <label className="report-export-label">
        From
        <input
          type="date"
          className="report-export-input"
          value={fromDate}
          max={today}
          onChange={(e) => setFromDate(e.target.value)}
        />
      </label>

      <label className="report-export-label">
        To
        <input
          type="date"
          className="report-export-input"
          value={toDate}
          max={today}
          onChange={(e) => setToDate(e.target.value)}
        />
      </label>

      <label className="report-export-label">
        Type of Report
        <select
          className="report-export-select"
          value={reportType}
          onChange={(e) => setReportType(e.target.value)}
        >
          {reportTypes.map((rt) => (
            <option key={rt.value} value={rt.value}>{rt.label}</option>
          ))}
        </select>
      </label>

      <button
        className={`report-export-btn ${loading || !!dateRangeError ? 'disabled' : ''}`}
        onClick={handleExport}
        disabled={loading || !!dateRangeError}
        title="Export PDF"
      >
        <FaFilePdf /> {loading ? 'Generating...' : 'Export PDF'}
      </button>

      {dateRangeError && (
        <span className="report-export-error">
          {dateRangeError}
        </span>
      )}
    </div>
  );
};

export default ReportExportBar;
