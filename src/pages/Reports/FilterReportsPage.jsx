import React, { useEffect, useMemo, useState } from 'react';
import { FaArrowLeft, FaCalendarAlt, FaFileAlt, FaFilter } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import AppButton from '../../components/ui/AppButton';
import AppCard from '../../components/ui/AppCard';
import DataTable from '../../components/ui/DataTable';
import PageShell from '../../components/ui/PageShell';
import http from '../../services/http';
import PDFService from '../../services/pdfService';
import './FilterReportsPage.css';

const REPORT_TYPES = [
  { value: 'full', label: 'Full Activity Report' },
  { value: 'meetings', label: 'Meetings Report' },
  { value: 'resolutions', label: 'Resolutions Report' }
];

const FilterReportsPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reportType, setReportType] = useState('full');
  const [meetings, setMeetings] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [reports, setReports] = useState([]);
  const [resolutions, setResolutions] = useState([]);

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().slice(0, 10);
  });
  const [toDate, setToDate] = useState(() => new Date().toISOString().slice(0, 10));

  const dateRangeError = useMemo(() => {
    if (fromDate > today || toDate > today) return 'Future dates are not allowed.';
    if (fromDate > toDate) return 'From date cannot be after To date.';
    return '';
  }, [fromDate, toDate, today]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError('');

        const [meetingsRes, attendanceRes, reportsRes, resolutionsRes] = await Promise.allSettled([
          http.get('/api/meetings'),
          http.get('/api/attendance'),
          http.get('/api/reports'),
          http.get('/api/resolutions')
        ]);

        setMeetings(meetingsRes.status === 'fulfilled' && Array.isArray(meetingsRes.value.data) ? meetingsRes.value.data : []);
        setAttendance(attendanceRes.status === 'fulfilled' && Array.isArray(attendanceRes.value.data) ? attendanceRes.value.data : []);
        setReports(reportsRes.status === 'fulfilled' && Array.isArray(reportsRes.value.data) ? reportsRes.value.data : []);
        setResolutions(resolutionsRes.status === 'fulfilled' && Array.isArray(resolutionsRes.value.data) ? resolutionsRes.value.data : []);
      } catch (err) {
        setError('Unable to load datasets for filtering.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const inRange = (dateValue) => {
    if (!dateValue) return false;
    const d = new Date(dateValue);
    const from = new Date(fromDate);
    const to = new Date(toDate);
    to.setHours(23, 59, 59, 999);
    return d >= from && d <= to;
  };

  const filteredMeetings = useMemo(
    () => meetings.filter((m) => inRange(m.meetingDate || m.createdAt || m.updatedAt)),
    [meetings, fromDate, toDate]
  );

  const filteredAttendance = useMemo(
    () => attendance.filter((a) => inRange(a.recordedAt || a.createdAt)),
    [attendance, fromDate, toDate]
  );

  const filteredReports = useMemo(
    () => reports.filter((r) => inRange(r.submittedAt || r.createdAt || r.updatedAt)),
    [reports, fromDate, toDate]
  );

  const filteredResolutions = useMemo(
    () => resolutions.filter((r) => inRange(r.createdAt || r.updatedAt)),
    [resolutions, fromDate, toDate]
  );

  const recordCount = useMemo(() => {
    switch (reportType) {
      case 'meetings':
        return filteredMeetings.length;
      case 'resolutions':
        return filteredResolutions.length;
      default:
        return filteredMeetings.length + filteredAttendance.length + filteredReports.length + filteredResolutions.length;
    }
  }, [reportType, filteredMeetings, filteredAttendance, filteredReports, filteredResolutions]);

  const handleExport = () => {
    if (dateRangeError) return;

    if (reportType === 'meetings') {
      PDFService.generateMeetingsReport(filteredMeetings, fromDate, toDate);
      return;
    }

    if (reportType === 'resolutions') {
      PDFService.generateResolutionsReport(filteredResolutions, fromDate, toDate);
      return;
    }

    PDFService.generateComprehensiveReport({
      meetings: filteredMeetings,
      attendance: filteredAttendance,
      reports: filteredReports,
      fromDate,
      toDate
    });
  };

  if (loading) {
    return (
      <PageShell title="Filter Report" subtitle="Preparing report filtering tools.">
        <AppCard className="filter-reports-loading">Loading report filter tools...</AppCard>
      </PageShell>
    );
  }

  const tableConfig = (() => {
    if (reportType === 'meetings') {
      return {
        columns: [
          { key: 'title', label: 'Meeting' },
          { key: 'date', label: 'Date' }
        ],
        rows: filteredMeetings.slice(0, 10).map((m) => ({
          id: m.id || `${m.title}-${m.meetingDate}`,
          title: m.title || 'Untitled meeting',
          date: m.meetingDate ? new Date(m.meetingDate).toLocaleString() : 'No date'
        })),
        emptyText: 'No meetings in selected date range.'
      };
    }

    if (reportType === 'resolutions') {
      return {
        columns: [
          { key: 'title', label: 'Resolution' },
          { key: 'updatedAt', label: 'Last Updated' }
        ],
        rows: filteredResolutions.slice(0, 10).map((r) => ({
          id: r.id || `${r.title}-${r.updatedAt}`,
          title: r.title || r.subject || 'Resolution',
          updatedAt: r.updatedAt ? new Date(r.updatedAt).toLocaleString() : 'N/A'
        })),
        emptyText: 'No resolutions in selected date range.'
      };
    }

    return {
      columns: [
        { key: 'source', label: 'Source' },
        { key: 'count', label: 'Records' }
      ],
      rows: [
        { id: 'meetings', source: 'Meetings', count: filteredMeetings.length },
        { id: 'attendance', source: 'Attendance', count: filteredAttendance.length },
        { id: 'reports', source: 'Reports', count: filteredReports.length },
        { id: 'resolutions', source: 'Resolutions', count: filteredResolutions.length }
      ],
      emptyText: 'No records found.'
    };
  })();

  return (
    <PageShell
      title={<><FaFilter /> Filter Report</>}
      subtitle="Run a targeted report for a date range and export it as PDF."
      className="filter-reports-page"
      actions={
        <AppButton variant="ghost" type="button" onClick={() => navigate('/reports')}>
          <FaArrowLeft /> Back To Reports Hub
        </AppButton>
      }
    >
      <AppCard className="filter-reports-card">
        <label>
          Report Type
          <select value={reportType} onChange={(e) => setReportType(e.target.value)}>
            {REPORT_TYPES.map((type) => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
        </label>

        <label>
          From Date
          <input type="date" value={fromDate} max={today} onChange={(e) => setFromDate(e.target.value)} />
        </label>

        <label>
          To Date
          <input type="date" value={toDate} max={today} onChange={(e) => setToDate(e.target.value)} />
        </label>

        <AppButton type="button" className="export-btn" disabled={!!dateRangeError} onClick={handleExport}>
          <FaFileAlt /> Export Filtered PDF
        </AppButton>
      </AppCard>

      {dateRangeError && <AppCard className="filter-reports-error">{dateRangeError}</AppCard>}
      {error && <AppCard className="filter-reports-error">{error}</AppCard>}

      <section className="filter-reports-kpis">
        <AppCard as="article" compact>
          <FaCalendarAlt />
          <strong>{filteredMeetings.length}</strong>
          <span>Meetings In Range</span>
        </AppCard>
        <AppCard as="article" compact>
          <FaFileAlt />
          <strong>{filteredResolutions.length}</strong>
          <span>Resolutions In Range</span>
        </AppCard>
        <AppCard as="article" compact>
          <FaFilter />
          <strong>{recordCount}</strong>
          <span>Records In Selected Report</span>
        </AppCard>
      </section>

      <AppCard>
        <h3>Preview</h3>
        <DataTable columns={tableConfig.columns} rows={tableConfig.rows} emptyText={tableConfig.emptyText} />
      </AppCard>
    </PageShell>
  );
};

export default FilterReportsPage;
