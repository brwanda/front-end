import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getMemberById as getCommitteeMemberById,
  createMember as createCommitteeMember,
  updateMember as updateCommitteeMember
} from '../../services/countryMemberService';
import { getCountries } from '../../services/countryService';
import { getCommittees } from '../../services/committeeService';
import {
  fetchMemberById as getSubCommitteeMemberById,
  createMember as createSubCommitteeMember,
  updateMember as updateSubCommitteeMember,
  fetchSubCommittees
} from '../../services/SubmemberService';
import { normalizeCommitteeName } from '../../utils/committeeNaming';
import { applyCountryCodeToPhone } from '../../utils/phoneUtils';
import InternationalPhoneField from '../../components/forms/InternationalPhoneField';
import './Members.css';

const EMPTY_ROLES = {
  chair: false,
  viceChair: false,
  committeeSecretary: false,
  committeeMember: false,
  delegationSecretary: false
};

const MemberForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [loadError, setLoadError] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [scope, setScope] = useState('committee');
  const [member, setMember] = useState({
    name: '',
    phone: '',
    email: '',
    country: { id: '' },
    committee: { id: '' },
    subCommittee: { id: '' },
    positionInYourRA: '',
    appointedDate: '',
    appointmentLetter: null,
    roles: { ...EMPTY_ROLES }
  });

  const [countries, setCountries] = useState([]);
  const [committees, setCommittees] = useState([]);
  const [subCommittees, setSubCommittees] = useState([]);
  const [filePreview, setFilePreview] = useState(null);

  const selectedCountryName = countries.find((country) => String(country.id) === String(member.country?.id))?.name || '';
  const selectedRolesCount = Object.values(member.roles).filter(Boolean).length;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        console.log('🔍 MemberForm: Fetching form data...');
        
        const [countriesData, committeesData, subCommitteesData] = await Promise.all([
          getCountries(),
          getCommittees(),
          fetchSubCommittees()
        ]);

        console.log('✅ MemberForm: Countries data:', countriesData);
        console.log('✅ MemberForm: Committees data (raw):', committeesData);
        console.log('✅ MemberForm: SubCommittees data:', subCommitteesData);

        // Filter committees to only show Commissioner General and Head of Delegation
        const allCommittees = Array.isArray(committeesData) ? committeesData : [];
        const filteredCommittees = allCommittees.filter(committee => {
          const name = (committee.name || committee.committeeName || '').toLowerCase();
          return name.includes('commissioner general') || 
                 name.includes('head of delegation') ||
                 name.includes('commissioner-general') ||
                 name.includes('head-of-delegation');
        });

        // If no CG or HOD committees found, use fallback
        const finalCommittees = filteredCommittees.length > 0 ? filteredCommittees : [
          { id: 1, name: "Commissioner General", committeeName: "Commissioner General" },
          { id: 2, name: "Head of Delegation", committeeName: "Head of Delegation" }
        ];

        console.log('✅ MemberForm: Filtered committees:', finalCommittees);

        setCountries(Array.isArray(countriesData) ? countriesData : []);
        setCommittees(finalCommittees);
        setSubCommittees(Array.isArray(subCommitteesData) ? subCommitteesData : []);

        if (!id) {
          return;
        }

        // First try loading as committee member.
        try {
          const committeeMember = await getCommitteeMemberById(id);
          setScope('committee');
          setMember({
            name: committeeMember.name || '',
            phone: committeeMember.phone || '',
            email: committeeMember.email || '',
            country: committeeMember.country || { id: '' },
            committee: committeeMember.committee || { id: '' },
            subCommittee: { id: '' },
            positionInYourRA: '',
            appointedDate: '',
            appointmentLetter: null,
            roles: {
              chair: committeeMember.isChair || false,
              viceChair: committeeMember.isViceChair || false,
              committeeSecretary: committeeMember.isCommitteeSecretary || false,
              committeeMember: committeeMember.isCommitteeMember || false,
              delegationSecretary: committeeMember.isDelegationSecretary || false
            }
          });
          return;
        } catch (committeeError) {
          // Fall through and try subcommittee member record.
        }

        const subCommitteeMember = await getSubCommitteeMemberById(id);
        setScope('subcommittee');
        setMember({
          name: subCommitteeMember.name || '',
          phone: subCommitteeMember.phone || '',
          email: subCommitteeMember.email || '',
          country: subCommitteeMember.country || { id: '' },
          committee: { id: '' },
          subCommittee: subCommitteeMember.subCommittee || { id: '' },
          positionInYourRA: subCommitteeMember.positionInYourRA || '',
          appointedDate: subCommitteeMember.appointedDate || '',
          appointmentLetter: null,
          roles: {
            chair: subCommitteeMember.chair || false,
            viceChair: subCommitteeMember.viceChair || false,
            committeeSecretary: subCommitteeMember.committeeSecretary || false,
            committeeMember: subCommitteeMember.committeeMember || false,
            delegationSecretary: subCommitteeMember.delegationSecretary || false
          }
        });

        if (subCommitteeMember.appointedLetterDoc) {
          setFilePreview({
            name: subCommitteeMember.appointedLetterDoc.originalFilename,
            id: subCommitteeMember.appointedLetterDoc.id
          });
        }
      } catch (error) {
        console.error('❌ MemberForm: Error loading member form data:', error);
        console.error('❌ MemberForm: Error details:', error.response || error.message);
        if (id) {
          setLoadError('The member record was not found for this edit link.');
        } else {
          setLoadError('Failed to load form data. Please check your connection and try again.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  useEffect(() => {
    if (!selectedCountryName) {
      return;
    }

    const normalizedPhone = applyCountryCodeToPhone(member.phone || '', selectedCountryName);
    if (normalizedPhone !== (member.phone || '')) {
      setMember((prev) => ({ ...prev, phone: normalizedPhone }));
    }
  }, [selectedCountryName, member.phone]);

  const handleScopeChange = (e) => {
    const nextScope = e.target.value;
    setScope(nextScope);
    setFilePreview(null);

    setMember((prev) => ({
      ...prev,
      committee: nextScope === 'committee' ? prev.committee : { id: '' },
      subCommittee: nextScope === 'subcommittee' ? prev.subCommittee : { id: '' },
      positionInYourRA: nextScope === 'subcommittee' ? prev.positionInYourRA : '',
      appointedDate: nextScope === 'subcommittee' ? prev.appointedDate : '',
      appointmentLetter: null,
      roles: { ...EMPTY_ROLES }
    }));
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (type === 'checkbox') {
      if (checked && selectedRolesCount >= 2 && !member.roles[name]) {
        alert('You can select at most two roles.');
        return;
      }

      setMember((prev) => ({
        ...prev,
        roles: {
          ...prev.roles,
          [name]: checked
        }
      }));
      return;
    }

    setMember((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectChange = (e) => {
    const { name, value } = e.target;

    if (name === 'country') {
      const selectedCountry = countries.find((country) => String(country.id) === String(value));
      setMember((prev) => ({
        ...prev,
        country: { id: value },
        committee: { id: '' },
        subCommittee: { id: '' },
        phone: applyCountryCodeToPhone(prev.phone, selectedCountry?.name || '')
      }));
      return;
    }

    setMember((prev) => ({
      ...prev,
      [name]: { id: value }
    }));
  };

  const handlePhoneBlur = () => {
    if (!selectedCountryName) {
      return;
    }

    setMember((prev) => ({
      ...prev,
      phone: applyCountryCodeToPhone(prev.phone || '', selectedCountryName)
    }));
  };

  const handlePhoneChange = (nextPhone) => {
    setMember((prev) => ({
      ...prev,
      phone: nextPhone
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) {
      return;
    }

    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      alert('Please select a PDF or image file (JPG, PNG).');
      return;
    }

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      alert('File size must be less than 10MB.');
      return;
    }

    setMember((prev) => ({ ...prev, appointmentLetter: file }));
    setFilePreview({ name: file.name });
  };

  const removeFile = () => {
    setMember((prev) => ({ ...prev, appointmentLetter: null }));
    setFilePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const isRoleDisabled = (roleName) => {
    const selected = Boolean(member.roles[roleName]);
    if (!selected && selectedRolesCount >= 2) {
      return true;
    }
    return false;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    const hasRole = Object.values(member.roles).some(Boolean);
    if (!hasRole) {
      alert('At least one role must be selected.');
      return;
    }

    if (!member.name.trim()) {
      alert('Name is required.');
      return;
    }
    if (!member.email.trim()) {
      alert('Email is required.');
      return;
    }
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(member.email.trim())) {
      alert('Please enter a valid email address.');
      return;
    }
    if (!member.country?.id) {
      alert('Country is required.');
      return;
    }

    if (scope === 'committee' && !member.committee?.id) {
      alert('Committee is required.');
      return;
    }
    if (scope === 'subcommittee' && !member.subCommittee?.id) {
      alert('Sub-Committee is required.');
      return;
    }
    if (scope === 'subcommittee' && !member.appointedDate) {
      alert('Appointment date is required for Sub-Committee members.');
      return;
    }

    if (scope === 'subcommittee') {
      const appointedDate = new Date(member.appointedDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (appointedDate > today) {
        alert('Appointment date cannot be in the future.');
        return;
      }
    }

    try {
      setSubmitting(true);

      const normalizedPhone = selectedCountryName
        ? applyCountryCodeToPhone(member.phone || '', selectedCountryName)
        : member.phone;

      if (scope === 'committee') {
        const payload = {
          ...(id ? { id: parseInt(id, 10) } : {}),
          name: member.name,
          phone: normalizedPhone,
          email: member.email,
          country: member.country,
          committee: member.committee,
          isChair: member.roles.chair || false,
          isViceChair: member.roles.viceChair || false,
          isCommitteeSecretary: member.roles.committeeSecretary || false,
          isCommitteeMember: member.roles.committeeMember || false,
          isDelegationSecretary: member.roles.delegationSecretary || false
        };

        if (id) {
          await updateCommitteeMember(id, payload);
        } else {
          await createCommitteeMember(payload);
        }

        navigate('/members');
        return;
      }

      const subPayload = {
        name: member.name,
        phone: normalizedPhone,
        email: member.email,
        positionInYourRA: member.positionInYourRA,
        country: member.country,
        subCommittee: member.subCommittee,
        appointedDate: member.appointedDate,
        chair: member.roles.chair || false,
        viceChair: member.roles.viceChair || false,
        committeeSecretary: member.roles.committeeSecretary || false,
        committeeMember: member.roles.committeeMember || false,
        delegationSecretary: member.roles.delegationSecretary || false,
        appointmentLetter: member.appointmentLetter || null
      };

      if (id) {
        await updateSubCommitteeMember(id, subPayload);
      } else {
        await createSubCommitteeMember(subPayload);
      }

      navigate('/sub-committee-members');
    } catch (error) {
      console.error('Error saving member:', error);
      const message = error?.response?.data?.error || `Failed to ${id ? 'update' : 'create'} member. Please try again.`;
      alert(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="member-form-container">
      <h2>{id ? 'Edit Member' : 'Add Member'}</h2>
      {loadError && (
        <div className="error-message" style={{ marginBottom: '12px' }}>
          {loadError}
        </div>
      )}
      {loading && <p>Loading form data...</p>}
      
      {!loading && countries.length === 0 && (
        <div className="error-message" style={{ marginBottom: '12px' }}>
          ⚠️ No countries loaded. Please check your backend connection.
        </div>
      )}
      
      {!loading && committees.length === 0 && scope === 'committee' && (
        <div className="error-message" style={{ marginBottom: '12px' }}>
          ⚠️ No committees loaded. Please check your backend connection.
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Entry Type:</label>
          <select
            name="scope"
            value={scope}
            onChange={handleScopeChange}
            disabled={Boolean(id) || submitting || loading}
            required
          >
            <option value="committee">Committee Member</option>
            <option value="subcommittee">Sub-Committee Member</option>
          </select>
          {id && <small className="form-help">Entry type cannot be changed while editing.</small>}
        </div>

        <div className="form-group">
          <label>Name:</label>
          <input
            type="text"
            name="name"
            value={member.name || ''}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Email:</label>
          <input
            type="email"
            name="email"
            value={member.email || ''}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Phone:</label>
          <InternationalPhoneField
            value={member.phone || ''}
            countryName={selectedCountryName}
            onChange={handlePhoneChange}
            onBlur={handlePhoneBlur}
            placeholder="Enter phone number"
            id="phone"
            name="phone"
          />
        </div>

        <div className="form-group">
          <label>Country:</label>
          <select
            name="country"
            value={member.country?.id || ''}
            onChange={handleSelectChange}
            required
            disabled={loading || countries.length === 0}
          >
            <option value="">Select Country</option>
            {countries.length === 0 && !loading && (
              <option value="" disabled>No countries available - check backend</option>
            )}
            {countries.map((country) => (
              <option key={country.id} value={country.id}>{country.name}</option>
            ))}
          </select>
          {!loading && countries.length === 0 && (
            <small style={{ color: 'red' }}>⚠️ Failed to load countries. Check console for errors.</small>
          )}
        </div>

        {scope === 'committee' ? (
          <div className="form-group">
            <label>Committee:</label>
            <select
              name="committee"
              value={member.committee?.id || ''}
              onChange={handleSelectChange}
              required
              disabled={loading || committees.length === 0}
            >
              <option value="">Select Committee</option>
              {committees.length === 0 && !loading && (
                <option value="" disabled>No committees available - check backend</option>
              )}
              {committees.map((committee) => (
                <option key={committee.id} value={committee.id}>{normalizeCommitteeName(committee.name)}</option>
              ))}
            </select>
            {!loading && committees.length === 0 && (
              <small style={{ color: 'red' }}>⚠️ Failed to load committees. Check console for errors.</small>
            )}
          </div>
        ) : (
          <>
            <div className="form-group">
              <label>Sub-Committee:</label>
              <select
                name="subCommittee"
                value={member.subCommittee?.id || ''}
                onChange={handleSelectChange}
                required
                disabled={loading || subCommittees.length === 0}
              >
                <option value="">Select Sub-Committee</option>
                {subCommittees.length === 0 && !loading && (
                  <option value="" disabled>No sub-committees available - check backend</option>
                )}
                {subCommittees.map((sc) => (
                  <option key={sc.id} value={sc.id}>{normalizeCommitteeName(sc.name)}</option>
                ))}
              </select>
              {!loading && subCommittees.length === 0 && (
                <small style={{ color: 'red' }}>⚠️ Failed to load sub-committees. Check console for errors.</small>
              )}
            </div>

            <div className="form-group">
              <label>Position in Your RA:</label>
              <input
                type="text"
                name="positionInYourRA"
                value={member.positionInYourRA || ''}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Appointed Date: <span className="required">*</span></label>
              <input
                type="date"
                name="appointedDate"
                value={member.appointedDate || ''}
                onChange={handleChange}
                max={new Date().toISOString().split('T')[0]}
                required
              />
              <small className="form-help">Appointment date must be today or in the past.</small>
            </div>
          </>
        )}

        <div className="form-group checkbox-group">
          <label>Roles:</label>
          <div>
            <label>
              <input
                type="checkbox"
                name="chair"
                checked={member.roles.chair}
                onChange={handleChange}
                disabled={isRoleDisabled('chair')}
              /> Chair
            </label>
            <label>
              <input
                type="checkbox"
                name="viceChair"
                checked={member.roles.viceChair}
                onChange={handleChange}
                disabled={isRoleDisabled('viceChair')}
              /> Vice Chair
            </label>
            <label>
              <input
                type="checkbox"
                name="committeeSecretary"
                checked={member.roles.committeeSecretary}
                onChange={handleChange}
                disabled={isRoleDisabled('committeeSecretary')}
              /> Secretary
            </label>
            <label>
              <input
                type="checkbox"
                name="committeeMember"
                checked={member.roles.committeeMember}
                onChange={handleChange}
                disabled={isRoleDisabled('committeeMember')}
              /> Member
            </label>
            <label>
              <input
                type="checkbox"
                name="delegationSecretary"
                checked={member.roles.delegationSecretary}
                onChange={handleChange}
                disabled={isRoleDisabled('delegationSecretary')}
              /> Delegation Secretary
            </label>
          </div>
          <small className="form-help">Select at least one and at most two roles.</small>
        </div>

        {scope === 'subcommittee' && (
          <div className="form-group">
            <label>Appointment Letter:</label>
            {filePreview ? (
              <div className="file-preview">
                <span>{filePreview.name}</span>
                <button type="button" onClick={removeFile}>Remove</button>
                {id && filePreview.id && (
                  <a
                    href={`${process.env.REACT_APP_BASE_URL}/country-committee-members/${id}/appointment-letter`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-secondary"
                  >
                    Download Current Appointment Letter
                  </a>
                )}
              </div>
            ) : (
              <div>
                <input
                  type="file"
                  id="appointmentLetter"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".pdf,.jpg,.jpeg,.png"
                />
                <small>PDF or Image (JPG, PNG) - Max 10MB</small>
              </div>
            )}
          </div>
        )}

        <button type="submit" className="btn btn-primary" disabled={submitting || loading}>
          {submitting ? 'Saving...' : 'Save'}
        </button>
        <button
          type="button"
          onClick={() => navigate(scope === 'committee' ? '/members' : '/sub-committee-members')}
          className="btn btn-cancel"
          disabled={submitting}
        >
          Cancel
        </button>
      </form>
    </div>
  );
};

export default MemberForm;
