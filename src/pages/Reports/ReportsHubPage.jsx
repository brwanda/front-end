import React, { useEffect, useMemo, useState } from 'react';
import { FaCalendarAlt, FaChartBar, FaCheckCircle, FaDownload, FaFileAlt, FaUsers } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import AppButton from '../../components/ui/AppButton';
import AppCard from '../../components/ui/AppCard';
import DataTable from '../../components/ui/DataTable';
import PageShell from '../../components/ui/PageShell';
import http from '../../services/http';
import PDFService from '../../services/pdfService';
import './ReportsHubPage.css';

const ReportsHubPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
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
    if (fromDate > today || toDate > today) {
      return 'Future dates are not allowed in report filters.';
    }
    if (fromDate > toDate) {
      return 'From date cannot be after To date.';
    }
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
        setError('Failed to load report datasets.');
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

  const countriesAttended = useMemo(() => {
    const names = new Set();
    filteredAttendance.forEach((a) => {
      const countryName = a?.user?.country?.name;
      if (countryName) names.add(countryName);
    });
    filteredMeetings.forEach((m) => {
      const host = m?.hostingCountry?.name;
      if (host) names.add(host);
    });
    return Array.from(names).sort();
  }, [filteredAttendance, filteredMeetings]);

  const activityCount =
    filteredMeetings.length + filteredAttendance.length + filteredReports.length + filteredResolutions.length;

  const handleExportComprehensive = () => {
    if (dateRangeError) return;
    PDFService.generateComprehensiveReport({
      meetings: filteredMeetings,
      attendance: filteredAttendance,
      reports: filteredReports,
      fromDate,
      toDate
    });
  };

  const handleExportMeetings = () => {
    if (dateRangeError) return;
    PDFService.generateMeetingsReport(filteredMeetings, fromDate, toDate);
  };

  const handleExportResolutions = () => {
    if (dateRangeError) return;
    PDFService.generateResolutionsReport(filteredResolutions, fromDate, toDate);
  };

  if (loading) {
    return (
      <PageShell title="Reports Hub" subtitle="Preparing datasets and report tools.">
        <AppCard className="reports-hub-loading">Loading reports...</AppCard>
      </PageShell>
    );
  }

  const meetingColumns = [
    { key: 'title', label: 'Meeting' },
    { key: 'date', label: 'Date' }
  ];

  const reportColumns = [
    { key: 'name', label: 'Report' },
    { key: 'status', label: 'Status' }
  ];

  const attendanceColumns = [
    { key: 'member', label: 'Member' },
    { key: 'state', label: 'Attendance' }
  ];

  const meetingsRows = filteredMeetings.slice(0, 8).map((m) => ({
    id: m.id || `${m.title}-${m.meetingDate}`,
    title: m.title || 'Untitled meeting',
    date: m.meetingDate ? new Date(m.meetingDate).toLocaleString() : 'No date'
  }));

  const reportRows = filteredReports.slice(0, 8).map((r) => ({
    id: r.id || `${r.submittedAt}-${r.status}`,
    name: r.resolution?.title || 'Progress report',
    status: (r.status || 'UNKNOWN').replace(/_/g, ' ')
  }));

  const attendanceRows = filteredAttendance.slice(0, 8).map((a) => ({
    id: a.id || `${a.user?.id}-${a.recordedAt}`,
    member: a.user?.name || 'Unknown member',
    state: a.status || 'N/A'
  }));

  return (
    <PageShell
      title="System Activities And Performance Reports"
      subtitle="Generate and export period-based reports across meetings, attendance, and resolutions."
      className="reports-hub-page"
      actions={
        <>
          <AppButton onClick={handleExportComprehensive} disabled={!!dateRangeError}>
            <FaDownload /> Download Full Report
          </AppButton>
          <AppButton variant="secondary" onClick={handleExportMeetings} disabled={!!dateRangeError}>
            <FaCalendarAlt /> Meetings PDF
          </AppButton>
          <AppButton variant="secondary" onClick={handleExportResolutions} disabled={!!dateRangeError}>
            <FaFileAlt /> Resolutions PDF
          </AppButton>
          <AppButton variant="ghost" onClick={() => navigate('/reports/filter')} type="button">
            <FaFileAlt /> Open Filter Report
          </AppButton>
        </>
      }
    >
      <AppCard className="reports-header-card">
        <div className="reports-header-brand">
          <div className="facet-logo" aria-hidden="true">
            <span className="facet f1" />
            <span className="facet f2" />
            <span className="facet f3" />
            <span className="facet f4" />
            <span className="facet f5" />
          </div>
          <div>
            <h1>East African Revenue Authorities Commissioner General</h1>
          </div>
        </div>
        <h2>SYSTEM ACTIVITIES AND PERFORMANCE REPORTS</h2>
      </AppCard>

      <AppCard className="reports-filter-row" compact>
        <label>
          From
          <input
            type="date"
            value={fromDate}
            max={today}
            onChange={(e) => setFromDate(e.target.value)}
          />
        </label>
        <label>
          To
          <input
            type="date"
            value={toDate}
            max={today}
            onChange={(e) => setToDate(e.target.value)}
          />
        </label>
      </AppCard>

      {dateRangeError && <AppCard className="reports-filter-error">{dateRangeError}</AppCard>}

      {error && <AppCard className="reports-error">{error}</AppCard>}

      <div className="reports-kpis">
        <AppCard as="article" compact>
          <FaChartBar />
          <strong>{activityCount}</strong>
          <span>Activities</span>
        </AppCard>
        <AppCard as="article" compact>
          <FaCalendarAlt />
          <strong>{filteredMeetings.length}</strong>
          <span>Meetings</span>
        </AppCard>
        <AppCard as="article" compact>
          <FaUsers />
          <strong>{filteredAttendance.length}</strong>
          <span>Attendance</span>
        </AppCard>
        <AppCard as="article" compact>
          <FaCheckCircle />
          <strong>{countriesAttended.length}</strong>
          <span>Countries Attended</span>
        </AppCard>
      </div>

      <div className="reports-grid">
        <AppCard>
          <h3>Recent Meetings</h3>
          <DataTable columns={meetingColumns} rows={meetingsRows} emptyText="No meetings in selected period." />
        </AppCard>

        <AppCard>
          <h3>Recent Reports</h3>
          <DataTable columns={reportColumns} rows={reportRows} emptyText="No reports in selected period." />
        </AppCard>

        <AppCard>
          <h3>Attendance Summary</h3>
          <DataTable columns={attendanceColumns} rows={attendanceRows} emptyText="No attendance records in selected period." />
        </AppCard>

        <AppCard>
          <h3>Countries Attended</h3>
          <ul>
            {countriesAttended.slice(0, 12).map((country) => (
              <li key={country}>
                <span>{country}</span>
              </li>
            ))}
            {countriesAttended.length === 0 && <li className="empty">No country attendance data in selected period.</li>}
          </ul>
        </AppCard>
      </div>
    </PageShell>
  );
};

export default ReportsHubPage;
