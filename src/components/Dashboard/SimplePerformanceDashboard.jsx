import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList
} from 'recharts';
import { 
  FaChartBar, FaGlobe, FaFileAlt, FaCheckCircle, FaClock, FaExclamationTriangle, FaCalendar, FaDatabase, FaDownload
} from 'react-icons/fa';
import http from '../../services/http';
import PDFService from '../../services/pdfService';
import './SimplePerformanceDashboard.css';

const SimplePerformanceDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [availableYears, setAvailableYears] = useState([]);

  useEffect(() => {
    fetchAvailableYears();
  }, []);

  useEffect(() => {
    if (selectedYear) {
      fetchDashboardData(selectedYear);
    }
  }, [selectedYear]);

  // Fetch available years from database
  const fetchAvailableYears = async () => {
    try {
      const { data } = await http.get('/dashboard/available-years');
      const years = Array.isArray(data) ? data : [];
      if (years.length > 0) {
        setAvailableYears(years);
        if (!years.includes(selectedYear)) {
          setSelectedYear(years[0]);
        }
      } else {
        setAvailableYears([new Date().getFullYear()]);
      }
    } catch (err) {
      console.error('Error fetching years:', err);
      setAvailableYears([new Date().getFullYear()]);
    }
  };

  // Fetch dashboard data from database
  const fetchDashboardData = async (year) => {
    try {
      setLoading(true);
      setError(null);

      const { data } = await http.get('/dashboard/performance/simple', {
        params: { year }
      });

      setDashboardData(data);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data. Please check your database connection.');
    } finally {
      setLoading(false);
    }
  };

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'up':
        return <FaCheckCircle className="trend-icon trend-icon-up" />;
      case 'down':
        return <FaExclamationTriangle className="trend-icon trend-icon-down" />;
      case 'stable':
        return <FaClock className="trend-icon trend-icon-stable" />;
      default:
        return <FaClock className="trend-icon trend-icon-default" />;
    }
  };

  const getTrendText = (trend) => {
    switch (trend) {
      case 'up': return 'up';
      case 'down': return 'down';
      case 'stable': return 'stable';
      default: return 'stable';
    }
  };

  const [allReports, setAllReports] = useState([]);
  const [highPerformers, setHighPerformers] = useState([]);

  // Fetch all reports for analytics PDF
  useEffect(() => {
    const fetchAllReports = async () => {
      try {
        const { data } = await http.get('/api/reports');
        setAllReports(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Error fetching reports for analytics:', err);
      }
    };
    fetchAllReports();

    // Fetch high performers for reward system
    const fetchHighPerformers = async () => {
      try {
        const { data } = await http.get('/api/dashboard/high-performers');
        setHighPerformers(Array.isArray(data) ? data : []);
      } catch (err) {
        console.warn('Error fetching high performers:', err);
      }
    };
    fetchHighPerformers();
  }, []);

  const handleDownloadAnalyticsPDF = () => {
    if (!dashboardData) return;
    PDFService.generateAnalyticsPDF(dashboardData, selectedYear, allReports);
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  if (loading) {
    return (
      <div className="simple-dashboard-loading shared-loading-container">
        <div className="loading-spinner shared-loader shared-loader--lg"></div>
        <p className="shared-loading-text">Loading performance data from database...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="simple-dashboard-error">
        <FaDatabase className="error-icon" />
        <h3>Database Connection Error</h3>
        <p>{error}</p>
        <p>Please ensure your backend API is running and database is connected.</p>
        <button onClick={() => fetchDashboardData(selectedYear)} className="retry-button">
          Retry
        </button>
      </div>
    );
  }

  // Debug: Log the dashboard data structure
  console.log('🔍 SimplePerformanceDashboard: dashboardData:', dashboardData);
  console.log('🔍 SimplePerformanceDashboard: dashboardData.subcommittees:', dashboardData?.subcommittees);

  if (!dashboardData) {
    return (
      <div className="simple-dashboard-no-data">
        <FaDatabase className="no-data-icon" />
        <h3>No Data Available</h3>
        <p>Dashboard data is null or undefined.</p>
        <p>Please check your backend API connection.</p>
      </div>
    );
  }

  // Only check for subcommittees data - this is a SUBCOMMITTEE performance dashboard
  if (!dashboardData.subcommittees || dashboardData.subcommittees.length === 0) {
    return (
      <div className="simple-dashboard-no-data">
        <FaDatabase className="no-data-icon" />
        <h3>No Data Available</h3>
        <p>No subcommittee performance data found for {selectedYear}.</p>
        <p>Available data keys: {Object.keys(dashboardData).join(', ')}</p>
        <p>Please check your database or try a different year.</p>
      </div>
    );
  }

  // Use subcommittees data only - this is what we want
  const dataToUse = dashboardData.subcommittees;
  const normalizedChartData = dataToUse.map((item) => ({
    ...item,
    reports: Number(item?.reports) || 0,
    assignedResolutions: Number(item?.assignedResolutions) || 0,
    approvalRate: Number(item?.approvalRate) || 0,
    performancePercentage: Number(item?.performancePercentage) || 0,
    taskAssignmentPercentage: Number(item?.taskAssignmentPercentage) || 0
  }));

  const performancePieData = normalizedChartData.filter((item) => item.performancePercentage > 0);

  return (
    <div className="simple-performance-dashboard">
      {/* Year Selector & Download */}
      <div className="year-selector year-selector-layout">
        <div className="year-selector-controls">
          <h3 className="year-selector-title"><FaCalendar /> Select Year</h3>
          <select 
            value={selectedYear} 
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="year-select"
          >
            {availableYears.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
        <div className="year-selector-actions">
          <button
            onClick={handleDownloadAnalyticsPDF}
            className="download-pdf-btn"
            title="Download full analytics report as PDF"
          >
            <FaDownload /> Download Analytics PDF
          </button>
        </div>
      </div>

      {/* Monthly Overview Widget - Database Driven */}
      <div className="monthly-overview-widget">
        <h3><FaChartBar /> Performance Overview for {selectedYear}</h3>
        <div className="overview-metrics">
          <div className="metric-item">
            <span className="metric-label">APPROVAL RATE</span>
            <span className="metric-value">{dashboardData.monthlyOverview?.approvalRate || 0}%</span>
          </div>
          <div className="metric-item">
            <span className="metric-label">TOTAL REVIEWS</span>
            <span className="metric-value">{dashboardData.monthlyOverview?.totalReviews || 0}</span>
          </div>
          <div className="metric-item">
            <span className="metric-label">TOTAL REPORTS</span>
            <span className="metric-value">{dashboardData.monthlyOverview?.totalReports || 0}</span>
          </div>
          <div className="metric-item">
            <span className="metric-label">TOTAL RESOLUTIONS</span>
            <span className="metric-value">{dashboardData.monthlyOverview?.totalResolutions || 0}</span>
          </div>
        </div>
      </div>

      {/* Subcommittee Performance Widget - Database Driven */}
      <div className="subcommittee-performance-widget">
        <h3><FaGlobe /> Subcommittee Performance for {selectedYear}</h3>
        <div className="performance-table">
          <table>
            <thead>
              <tr>
                <th>Subcommittee</th>
                <th>Reports</th>
                <th>Assigned Resolutions</th>
                <th>Approval Rate</th>
                <th>Performance %</th>
                <th>Task Assignment %</th>
                <th>Trend</th>
              </tr>
            </thead>
            <tbody>
              {normalizedChartData.map((item, index) => (
                <tr key={index}>
                  <td>{item.name}</td>
                  <td>{item.reports}</td>
                  <td>{item.assignedResolutions}</td>
                  <td>{item.approvalRate}%</td>
                  <td>{item.performancePercentage || 0}%</td>
                  <td>{item.taskAssignmentPercentage || 0}%</td>
                  <td className="trend-cell">
                    {getTrendIcon(item.trend)}
                    <span className="trend-text">{getTrendText(item.trend)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Enhanced Bar Chart - Performance Metrics for Subcommittees */}
      <div className="chart-widget">
        <h3><FaFileAlt /> Performance Metrics for Subcommittees - {selectedYear}</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={normalizedChartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="performancePercentage" fill="#8884d8" name="Performance %" />
            <Bar dataKey="taskAssignmentPercentage" fill="#82ca9d" name="Task Assignment %" />
            <Bar dataKey="approvalRate" fill="#ffc658" name="Approval Rate %" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Enhanced Pie Chart - Performance Percentage Distribution */}
      <div className="chart-widget">
        <h3><FaCheckCircle /> Performance Percentage Distribution for Subcommittees - {selectedYear}</h3>
        {performancePieData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={performancePieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, performancePercentage }) => `${name}: ${performancePercentage || 0}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="performancePercentage"
              >
                {performancePieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="empty-chart-state">
            No non-zero performance percentages were found for {selectedYear}. Submit or review reports with performance percentages to populate this chart.
          </div>
        )}
      </div>

      {/* Task Assignment Percentage Chart */}
      <div className="chart-widget">
        <h3><FaClock /> Task Assignment Percentage by Subcommittee - {selectedYear}</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={[...normalizedChartData].sort((a, b) => (b.taskAssignmentPercentage || 0) - (a.taskAssignmentPercentage || 0))}
            layout="vertical"
            margin={{ top: 6, right: 24, left: 90, bottom: 6 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
            <YAxis
              type="category"
              dataKey="name"
              width={170}
              interval={0}
              tick={{ fontSize: 11 }}
            />
            <Tooltip formatter={(value) => [`${value || 0}%`, 'Task Assignment %']} />
            <Bar dataKey="taskAssignmentPercentage" fill="#22c55e" radius={[0, 6, 6, 0]} barSize={16}>
              <LabelList dataKey="taskAssignmentPercentage" position="right" offset={8} style={{ fontSize: 11 }} formatter={(value) => `${value || 0}%`} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* High Performers Recognition Section */}
      {highPerformers.length > 0 && (
        <div className="chart-widget high-performers-widget">
          <h3 className="high-performers-title">
            <span className="high-performers-emoji">🏆</span> High Performers Recognition
          </h3>
          <p className="high-performers-subtitle">
            Members who have been rated highly for 3 or more consecutive evaluations
          </p>
          <div className="high-performers-grid">
            {highPerformers.map((performer, idx) => (
              <div key={idx} className="high-performer-card">
                <div className="high-performer-badge">
                  ⭐ {performer.consecutiveHighRatings}x High Rated
                </div>
                <h4 className="high-performer-name">{performer.memberName}</h4>
                <p className="high-performer-meta">
                  {performer.subcommittee} • Avg Rating: <strong className="high-performer-rating">{performer.averageRating}/5</strong>
                </p>
                <p className="high-performer-message">
                  {performer.recognitionMessage}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Data Source Info */}
      <div className="data-source-info">
        <p><FaDatabase /> All data is fetched from your database for {selectedYear}</p>
        <p>Data type: Subcommittees ({dataToUse.length} items)</p>
        <p>Available data keys: {Object.keys(dashboardData).join(', ')}</p>
        <p>Last updated: {new Date().toLocaleString()}</p>
      </div>
    </div>
  );
};

export default SimplePerformanceDashboard;
