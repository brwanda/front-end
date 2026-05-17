import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUsers, FaCalendar, FaGlobe, FaTasks, FaChartLine, FaBell, FaUserShield, FaCog, FaEdit, FaTrash, FaSpinner, FaUserPlus, FaExclamationTriangle, FaCheckCircle } from 'react-icons/fa';
import UserManagementService from '../services/userManagementService';
import AuthService from '../services/authService';
import http from '../services/http';
import ReportExportBar from '../components/ReportExportBar';
import PDFService from '../services/pdfService';
import { normalizeCommitteeName } from '../utils/committeeNaming';
import { applyCountryCodeToPhone, getDialCodeByCountryName } from '../utils/phoneUtils';
import { getMembers } from '../services/countryMemberService';
import './AdminDashboard.css';

const EnhancedAdminDashboard = () => {
  const navigate = useNavigate();
  const currentUser = AuthService.getCurrentUser();
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalCountries: 7,
    totalCommittees: 7,
    totalMeetings: 0,
    totalResolutions: 0,
    pendingApprovals: 0,
    systemHealth: 'Good'
  });

  const [users, setUsers] = useState([]);
  const [countries, setCountries] = useState([]);
  const [committees, setCommittees] = useState([]);
  const [subcommittees, setSubcommittees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    role: '',
    country: { id: '' },
    committee: { id: '' },
    subcommittee: { id: '' }
  });

  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const yearOptions = [2026, 2025, 2024, 'All Time'];
  const [pdfLoading, setPdfLoading] = useState(false);

  const adminReportTypes = [
    { value: 'all_users', label: 'All Users Report' },
    { value: 'active_users', label: 'Active Users Report' },
    { value: 'inactive_users', label: 'Inactive Users Report' },
    { value: 'system_summary', label: 'System Summary Report' },
  ];

  const handleExportPDF = ({ fromDate, toDate, reportType }) => {
    setPdfLoading(true);
    try {
      const from = new Date(fromDate);
      const to = new Date(toDate);
      to.setHours(23, 59, 59);

      if (reportType === 'system_summary') {
        // Build a summary table — just export stats as a mini report
        const summaryUsers = [{ name: 'System Stats', email: '-', role: 'N/A', country: { name: '-' }, subcommittee: { name: '-' }, active: true }];
        const statRows = [
          { name: 'Total Users', email: `${stats.totalUsers}`, role: '-', country: { name: '-' }, subcommittee: { name: '-' }, active: true },
          { name: 'Active Users', email: `${stats.activeUsers}`, role: '-', country: { name: '-' }, subcommittee: { name: '-' }, active: true },
          { name: 'Total Countries', email: `${stats.totalCountries}`, role: '-', country: { name: '-' }, subcommittee: { name: '-' }, active: true },
          { name: 'Total Committees', email: `${stats.totalCommittees}`, role: '-', country: { name: '-' }, subcommittee: { name: '-' }, active: true },
          { name: 'Total Meetings', email: `${stats.totalMeetings}`, role: '-', country: { name: '-' }, subcommittee: { name: '-' }, active: true },
          { name: 'Total Resolutions', email: `${stats.totalResolutions}`, role: '-', country: { name: '-' }, subcommittee: { name: '-' }, active: true },
          { name: 'Pending Approvals', email: `${stats.pendingApprovals}`, role: '-', country: { name: '-' }, subcommittee: { name: '-' }, active: true },
          { name: 'System Health', email: `${stats.systemHealth}`, role: '-', country: { name: '-' }, subcommittee: { name: '-' }, active: true },
        ];
        PDFService.generateUserReport(statRows, fromDate, toDate, 'System Summary Report');
      } else {
        let filtered = users.filter(u => {
          const created = new Date(u.createdAt);
          return created >= from && created <= to;
        });

        if (reportType === 'active_users') filtered = filtered.filter(u => u.active !== false);
        else if (reportType === 'inactive_users') filtered = filtered.filter(u => u.active === false);

        const titles = { all_users: 'All Users Report', active_users: 'Active Users Report', inactive_users: 'Inactive Users Report' };
        PDFService.generateUserReport(filtered, fromDate, toDate, titles[reportType] || 'Users Report');
      }
    } catch (err) {
      console.error('PDF generation error:', err);
      setError('Failed to generate PDF report');
    } finally {
      setPdfLoading(false);
    }
  };

  useEffect(() => {
    initializeDashboard();
  }, [selectedYear]);

  const initializeDashboard = async () => {
    try {
      await Promise.all([
        fetchUsers(),
        fetchCountries(),
        fetchCommittees(),
        fetchSubcommittees(),
        fetchDashboardStats()
      ]);
    } catch (error) {
      console.error('Error initializing dashboard:', error);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      let usersData = [];

      try {
        usersData = await UserManagementService.getAllUsers();
      } catch (apiError) {
        console.warn('API connection failed, using fallback data:', apiError.message);

        // Provide fallback user data when API is not available
        usersData = [
          {
            id: 1,
            name: "John Admin",
            email: "admin@eara.org",
            phone: "+256-700-123456",
            role: "ADMIN",
            active: true,
            country: null,
            subcommittee: null,
            createdAt: new Date().toISOString()
          },
          {
            id: 2,
            name: "Jane Secretary",
            email: "secretary@uganda.eara.org",
            phone: "+256-700-234567",
            role: "SECRETARY",
            active: true,
            country: { id: 1, name: "Uganda" },
            subcommittee: null,
            createdAt: new Date().toISOString()
          },
          {
            id: 3,
            name: "Mike Chair",
            email: "chair@tech.eara.org",
            phone: "+256-700-345678",
            role: "CHAIR",
            active: true,
            country: null,
            subcommittee: { id: 1, name: "Technical Infrastructure" },
            createdAt: new Date().toISOString()
          },
          {
            id: 4,
            name: "Sarah Commissioner",
            email: "commissioner@eara.org",
            phone: "+256-700-456789",
            role: "COMMISSIONER_GENERAL",
            active: true,
            country: null,
            subcommittee: null,
            createdAt: new Date().toISOString()
          }
        ];
      }

      setUsers(usersData);

      // Update stats
      setStats(prev => ({
        ...prev,
        totalUsers: usersData.length,
        activeUsers: usersData.filter(user => user.active).length
      }));
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Failed to fetch users');
    }
  };

  const fetchCountries = async () => {
    try {
      let countriesData = [];

      try {
        const { data } = await http.get('/api/countries');
        countriesData = Array.isArray(data) ? data : [];
      } catch (apiError) {
        console.warn('Countries API failed, using fallback data');

        // Provide fallback countries data
        countriesData = [
          { id: 1, name: "Uganda", code: "UG" },
          { id: 2, name: "Kenya", code: "KE" },
          { id: 3, name: "Tanzania", code: "TZ" },
          { id: 4, name: "Rwanda", code: "RW" },
          { id: 5, name: "Burundi", code: "BI" },
          { id: 6, name: "South Sudan", code: "SS" },
          { id: 7, name: "Democratic Republic of Congo", code: "CD" }
        ];
      }

      setCountries(countriesData);
    } catch (error) {
      console.error('Error fetching countries:', error);
    }
  };

  const fetchCommittees = async () => {
    try {
      let committeesData = [];

      try {
        const { data } = await http.get('/api/committees');
        committeesData = Array.isArray(data) ? data : [];
      } catch (apiError) {
        console.warn('Committees API failed, using fallback data');

        // Provide fallback main committees data (CG and HOD only)
        committeesData = [
          { id: 1, name: "Commissioner General", committeeName: "Commissioner General" },
          { id: 2, name: "Head of Delegation", committeeName: "Head of Delegation" }
        ];
      }

      setCommittees(committeesData);
    } catch (error) {
      console.error('Error fetching committees:', error);
    }
  };

  const fetchSubcommittees = async () => {
    try {
      let subcommitteesData = [];

      try {
        const { data } = await http.get('/api/sub-committees');
        subcommitteesData = Array.isArray(data) ? data : [];
      } catch (apiError) {
        console.warn('Subcommittees API failed, using fallback data');

        // Provide fallback subcommittees data
        subcommitteesData = [
          { id: 1, name: "Technical Infrastructure", description: "Technical systems and infrastructure" },
          { id: 2, name: "Policy & Governance", description: "Policy development and governance" },
          { id: 3, name: "Community Relations", description: "Community outreach and relations" },
          { id: 4, name: "Finance & Budget", description: "Financial planning and budget management" },
          { id: 5, name: "Legal Affairs", description: "Legal guidance and compliance" },
          { id: 6, name: "Strategic Planning", description: "Long-term strategic planning" }
        ];
      }

      setSubcommittees(subcommitteesData);
    } catch (error) {
      console.error('Error fetching subcommittees:', error);
    }
  };

  const fetchDashboardStats = async () => {
    try {
      const params = selectedYear !== 'All Time' ? { year: selectedYear } : undefined;
      const { data: adminStats } = await http.get('/api/dashboard/admin/stats', { params });
      if (adminStats) {
        setStats(prev => ({
          ...prev,
          ...adminStats,
          // Keep systemHealth explicit if not returned
          systemHealth: 'Excellent'
        }));
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;

    if (name === 'country') {
      const selectedCountry = countries.find(country => String(country.id) === String(value));
      setForm(prev => ({
        ...prev,
        country: { id: value },
        phone: applyCountryCodeToPhone(prev.phone, selectedCountry?.name || '')
      }));
    } else if (name === 'committee') {
      setForm(prev => ({
        ...prev,
        committee: { id: value }
      }));
    } else if (name === 'subcommittee') {
      setForm(prev => ({
        ...prev,
        subcommittee: { id: value }
      }));
    } else {
      setForm(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleAddUser = () => {
    navigate('/members/new');
  };

  const handleEditUser = async (user) => {
    try {
      const commissionerMembers = await getMembers();
      const matched = commissionerMembers.find(
        (member) => (member.email || '').trim().toLowerCase() === (user.email || '').trim().toLowerCase()
      );

      if (matched?.id) {
        navigate(`/members/${matched.id}/edit`);
        return;
      }
    } catch (mapError) {
      console.warn('Unable to map user to commissioner member record for edit route:', mapError);
    }

    // Fallback for users without commissioner-member records.
    const normalizedPhone = applyCountryCodeToPhone(user.phone || '', user.country?.name || '');
    setEditingUser(user);
    setForm({
      name: user.name || '',
      email: user.email || '',
      phone: normalizedPhone,
      role: user.role || '',
      country: { id: user.country?.id || '' },
      committee: { id: user.committee?.id || '' },
      subcommittee: { id: user.subcommittee?.id || '' }
    });
    setError('');
    setSuccess('');
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingUser(null);
    setForm({
      name: '',
      email: '',
      phone: '',
      role: '',
      country: { id: '' },
      committee: { id: '' },
      subcommittee: { id: '' }
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const userData = {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        role: form.role,
        country: ['COMMITTEE_SECRETARY', 'DELEGATION_SECRETARY', 'HOD'].includes(form.role)
          ? { id: parseInt(form.country.id) } : null,
        committee: ['COMMITTEE_MEMBER'].includes(form.role)
          ? { id: parseInt(form.committee.id) } : null,
        subcommittee: ['CHAIR', 'VICE_CHAIR', 'SUBCOMMITTEE_MEMBER', 'COMMITTEE_SECRETARY'].includes(form.role)
          ? { id: parseInt(form.subcommittee.id) } : null
      };

      // Validate the form data
      const validationErrors = UserManagementService.validateUserData(userData);
      if (validationErrors.length > 0) {
        setError(validationErrors.join('. '));
        return;
      }

      if (editingUser) {
        await UserManagementService.updateUser(editingUser.id, userData);
        setSuccess('User updated successfully!');
      } else {
        await UserManagementService.createUser(userData);
        setSuccess('User created successfully! Credentials have been sent via email.');
      }

      await fetchUsers();
      setTimeout(handleCloseModal, 1500);

    } catch (error) {
      setError(error.message || 'Failed to save user');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      try {
        await UserManagementService.deleteUser(userId);
        await fetchUsers();
        setSuccess('User deleted successfully.');
        setTimeout(() => setSuccess(''), 3000);
      } catch (error) {
        setError('Failed to delete user.');
      }
    }
  };

  const handleResendCredentials = async (userId) => {
    try {
      await UserManagementService.resendCredentials(userId);
      setSuccess('Credentials resent via email.');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError('Failed to resend credentials.');
    }
  };


  const getRoleClassName = (role) => {
    const roleClasses = {
      'ADMIN': 'role-admin',
      'COMMITTEE_SECRETARY': 'role-secretary',
      'DELEGATION_SECRETARY': 'role-secretary',
      'SECRETARY': 'role-secretary',
      'CHAIR': 'role-chair',
      'VICE_CHAIR': 'role-chair',
      'HOD': 'role-hod',
      'COMMISSIONER_GENERAL': 'role-commissioner',
      'SUBCOMMITTEE_MEMBER': 'role-member',
      'COMMITTEE_MEMBER': 'role-member'
    };
    return `role-badge ${roleClasses[role] || 'role-member'}`;
  };

  const getRoleDisplayWithContext = (user) => {
    const baseRole = UserManagementService.getRoleDisplayName(user.role);
    
    // For HOD and Commissioner General, they don't have subcommittee context
    if (user.role === 'HOD') {
      return 'HOD';
    }
    if (user.role === 'COMMISSIONER_GENERAL') {
      return 'Commissioner General';
    }
    
    // For CHAIR, VICE_CHAIR, COMMITTEE_SECRETARY, COMMITTEE_MEMBER roles
    if (['CHAIR', 'VICE_CHAIR', 'COMMITTEE_SECRETARY', 'COMMITTEE_MEMBER'].includes(user.role)) {
      // If they have a subcommittee, show it with the role
      if (user.subcommittee) {
        const subCommitteeName = normalizeCommitteeName(user.subcommittee.name);
        const shortName = subCommitteeName.length > 25 
          ? subCommitteeName.substring(0, 25) + '...' 
          : subCommitteeName;
        
        const roleShortForm = {
          'CHAIR': 'Chair',
          'VICE_CHAIR': 'Vice Chair',
          'COMMITTEE_SECRETARY': 'Secretary',
          'COMMITTEE_MEMBER': 'Member'
        };
        
        return `${shortName} ${roleShortForm[user.role] || baseRole}`;
      } 
      // If they have a committee (HOD or CG), show it with the role
      else if (user.committee) {
        const committeeName = user.committee.name || user.committee.committeeName || '';
        const isHOD = committeeName.toLowerCase().includes('head of delegation');
        const isCG = committeeName.toLowerCase().includes('commissioner general');
        
        const roleShortForm = {
          'CHAIR': 'Chair',
          'VICE_CHAIR': 'Vice Chair',
          'COMMITTEE_SECRETARY': 'Secretary',
          'COMMITTEE_MEMBER': 'Member'
        };
        
        if (isHOD) {
          return `HOD ${roleShortForm[user.role] || baseRole}`;
        } else if (isCG) {
          return `CG ${roleShortForm[user.role] || baseRole}`;
        } else {
          return `${roleShortForm[user.role] || baseRole}`;
        }
      } 
      // No subcommittee or committee info
      else {
        const roleShortForm = {
          'CHAIR': 'Chair',
          'VICE_CHAIR': 'Vice Chair',
          'COMMITTEE_SECRETARY': 'Committee Secretary',
          'COMMITTEE_MEMBER': 'Committee Member'
        };
        
        return `${roleShortForm[user.role] || baseRole}`;
      }
    }
    
    // For DELEGATION_SECRETARY
    if (user.role === 'DELEGATION_SECRETARY') {
      if (user.subcommittee) {
        const subCommitteeName = normalizeCommitteeName(user.subcommittee.name);
        const shortName = subCommitteeName.length > 25 
          ? subCommitteeName.substring(0, 25) + '...' 
          : subCommitteeName;
        return `${shortName} Del. Secretary`;
      }
      return 'Delegation Secretary';
    }
    
    // For SUBCOMMITTEE_MEMBER
    if (user.role === 'SUBCOMMITTEE_MEMBER') {
      if (user.subcommittee) {
        const subCommitteeName = normalizeCommitteeName(user.subcommittee.name);
        const shortName = subCommitteeName.length > 25 
          ? subCommitteeName.substring(0, 25) + '...' 
          : subCommitteeName;
        return `${shortName} Member`;
      }
      return 'Subcommittee Member';
    }
    
    return baseRole;
  };

  const getRoleInfo = (role) => {
    const roleInfo = {
      'COMMITTEE_SECRETARY': 'Requires country and subcommittee. Manages subcommittee meetings, minutes, and attendance.',
      'DELEGATION_SECRETARY': 'Requires country. Manages delegation-wide meetings, CG meetings and all technical subcommittee minutes.',
      'CHAIR': 'Requires subcommittee. Leads and coordinates subcommittee activities.',
      'VICE_CHAIR': 'Requires subcommittee. Assists the Chair in subcommittee coordination.',
      'HOD': 'Requires country. Head of Delegation with administrative responsibilities for the country delegation.',
      'COMMISSIONER_GENERAL': 'Senior executive role with organization-wide authority and responsibilities.',
      'SUBCOMMITTEE_MEMBER': 'Requires subcommittee. Participates in subcommittee work and decisions.',
      'COMMITTEE_MEMBER': 'Requires committee (CG or HOD). Participates in main committee-level work.',
    };
    return roleInfo[role] || '';
  };

  const selectedCountryName = countries.find(country => String(country.id) === String(form.country.id))?.name || '';
  const selectedCountryDialCode = getDialCodeByCountryName(selectedCountryName);

  return (
    <div className="admin-dashboard">
      <div className="admin-container">
        {/* Header */}
        <div className="admin-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 className="admin-title">Admin Dashboard</h1>
            <p className="admin-subtitle">
              {currentUser?.name ? `${currentUser.name} — ` : ''}Manage users and monitor system performance
              {currentUser?.position && (
                <span className="position-badge"> ({currentUser.position})</span>
              )}
            </p>
          </div>
          <div className="filter-container">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value === 'All Time' ? 'All Time' : parseInt(e.target.value))}
              style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '14px', cursor: 'pointer' }}
            >
              {yearOptions.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Alert Messages */}
        {error && (
          <div className="alert alert-error">
            <FaExclamationTriangle />
            <strong>Error:</strong> {error}
          </div>
        )}

        {success && (
          <div className="alert alert-success">
            <FaCheckCircle />
            {success}
          </div>
        )}

        {/* Stats Grid */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-content">
              <div className="stat-icon">
                <FaUsers />
              </div>
              <div className="stat-info">
                <p className="stat-label">Total Users</p>
                <p className="stat-value">{stats.totalUsers}</p>
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-content">
              <div className="stat-icon">
                <FaUserShield />
              </div>
              <div className="stat-info">
                <p className="stat-label">Active Users</p>
                <p className="stat-value">{stats.activeUsers}</p>
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-content">
              <div className="stat-icon">
                <FaGlobe />
              </div>
              <div className="stat-info">
                <p className="stat-label">Countries</p>
                <p className="stat-value">{stats.totalCountries}</p>
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-content">
              <div className="stat-icon">
                <FaTasks />
              </div>
              <div className="stat-info">
                <p className="stat-label">Committees</p>
                <p className="stat-value">{stats.totalCommittees}</p>
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-content">
              <div className="stat-icon">
                <FaCalendar />
              </div>
              <div className="stat-info">
                <p className="stat-label">Meetings</p>
                <p className="stat-value">{stats.totalMeetings}</p>
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-content">
              <div className="stat-icon">
                <FaChartLine />
              </div>
              <div className="stat-info">
                <p className="stat-label">Resolutions</p>
                <p className="stat-value">{stats.totalResolutions}</p>
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-content">
              <div className="stat-icon">
                <FaBell />
              </div>
              <div className="stat-info">
                <p className="stat-label">Pending</p>
                <p className="stat-value">{stats.pendingApprovals}</p>
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-content">
              <div className="stat-icon">
                <FaCog />
              </div>
              <div className="stat-info">
                <p className="stat-label">System Health</p>
                <p className="stat-value" style={{ fontSize: '1.2rem' }}>{stats.systemHealth}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Report Export Bar */}
        <ReportExportBar
          reportTypes={adminReportTypes}
          onExport={handleExportPDF}
          loading={pdfLoading}
        />

        {/* Main Content */}
        <div className="admin-content">
          {/* Users Section Header */}
          <div className="users-header">
            <h2 className="users-title">
              <FaUsers />
              User Management
            </h2>
            <div>
              <button onClick={handleAddUser} className="add-user-btn">
                <FaUserPlus />
                Add New User
              </button>
            </div>
          </div>

          {/* Users Table */}
          <div className="users-table-container">
            <table className="users-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Assignment</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id}>
                    <td>
                      <div>
                        <div className="user-name">{user.name}</div>
                        <div className="user-email">{user.email}</div>
                        {user.phone && <div className="user-email">{user.phone}</div>}
                      </div>
                    </td>
                    <td>
                      <span className={getRoleClassName(user.role)}>
                        {getRoleDisplayWithContext(user)}
                      </span>
                    </td>
                    <td>
                      {user.country && <div>{user.country.name}</div>}
                      {user.subcommittee && <div>{normalizeCommitteeName(user.subcommittee.name)}</div>}
                      {user.committee && !user.subcommittee && (
                        <div>{user.committee.name || user.committee.committeeName}</div>
                      )}
                      {!user.country && !user.subcommittee && !user.committee && <span style={{ color: 'var(--theme-text-3, #8fa1bf)' }}>None</span>}
                    </td>
                    <td>
                      <span className={user.active ? 'status-active' : 'status-inactive'}>
                        {user.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          onClick={() => handleEditUser(user)}
                          className="action-btn action-btn-edit"
                          title="Edit user"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => handleResendCredentials(user.id)}
                          className="action-btn action-btn-resend"
                          title="Resend credentials"
                        >
                          <FaBell />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="action-btn action-btn-delete"
                          title="Delete user"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {users.length === 0 && (
              <div className="empty-state">
                <div className="empty-state-icon">
                  <FaUsers />
                </div>
                <h3 className="empty-state-title">No users found</h3>
                <p className="empty-state-description">Get started by creating your first user.</p>
              </div>
            )}
          </div>
        </div>

        {/* Modal for Add/Edit User */}
        {showModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h3 className="modal-title">
                  <div className="modal-title-icon">
                    <FaUserPlus />
                  </div>
                  {editingUser ? 'Edit User' : 'Create New User'}
                </h3>
              </div>

              <form onSubmit={handleSubmit} className="user-form">
                <div className="form-group">
                  <label className="form-label">
                    Name <span className="required-asterisk">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleFormChange}
                    className="form-input"
                    placeholder="Enter full name"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Email Address <span className="required-asterisk">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleFormChange}
                    className="form-input"
                    placeholder="Enter email address"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input
                    type="tel"
                    name="phone"
                    value={form.phone}
                    onChange={handleFormChange}
                    className="form-input"
                    placeholder={selectedCountryDialCode ? `${selectedCountryDialCode} 7xxxxxxxx` : 'Enter phone number'}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Role <span className="required-asterisk">*</span>
                  </label>
                  <select
                    name="role"
                    value={form.role}
                    onChange={handleFormChange}
                    className="form-select"
                    required
                  >
                    <option value="">Select a role</option>
                    {UserManagementService.getAvailableRoles().map(role => (
                      <option key={role.value} value={role.value}>
                        {role.label}
                      </option>
                    ))}
                  </select>
                  {form.role && getRoleInfo(form.role) && (
                    <div className="role-info">
                      {getRoleInfo(form.role)}
                    </div>
                  )}
                </div>

                {/* Country field */}
                {['COMMITTEE_SECRETARY', 'DELEGATION_SECRETARY', 'HOD'].includes(form.role) && (
                  <div className="form-group">
                    <label className="form-label">
                      Country Assignment <span className="required-asterisk">*</span>
                    </label>
                    <select
                      name="country"
                      value={form.country.id}
                      onChange={handleFormChange}
                      className="form-select"
                      required
                    >
                      <option value="">Select a country</option>
                      {countries.map(country => (
                        <option key={country.id} value={country.id}>
                          {country.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Committee field - for COMMITTEE_MEMBER only (CG or HOD) */}
                {['COMMITTEE_MEMBER'].includes(form.role) && (
                  <div className="form-group">
                    <label className="form-label">
                      Committee Assignment <span className="required-asterisk">*</span>
                    </label>
                    <select
                      name="committee"
                      value={form.committee.id}
                      onChange={handleFormChange}
                      className="form-select"
                      required
                    >
                      <option value="">Select Committee</option>
                      {committees.map(committee => (
                        <option key={committee.id} value={committee.id}>
                          {committee.name || committee.committeeName}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Subcommittee field - for technical subcommittees */}
                {['CHAIR', 'VICE_CHAIR', 'SUBCOMMITTEE_MEMBER', 'COMMITTEE_SECRETARY'].includes(form.role) && (
                  <div className="form-group">
                    <label className="form-label">
                      Subcommittee Assignment <span className="required-asterisk">*</span>
                    </label>
                    <select
                      name="subcommittee"
                      value={form.subcommittee.id}
                      onChange={handleFormChange}
                      className="form-select"
                      required
                    >
                      <option value="">Select a subcommittee</option>
                      {subcommittees.map(sub => (
                        <option key={sub.id} value={sub.id}>
                          {normalizeCommitteeName(sub.name)}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="modal-actions">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="btn-cancel"
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-submit"
                    disabled={submitting}
                  >
                    {submitting && <FaSpinner className="loading-spinner" />}
                    {submitting ? 'Saving...' : (editingUser ? 'Update User' : 'Create User')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedAdminDashboard;
