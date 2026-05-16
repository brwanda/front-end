import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchMemberById } from '../../services/SubmemberService';
import './SubCommitteeMembers.css';

const MemberView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadMember = async () => {
      try {
        const memberData = await fetchMemberById(id);
        setMember(memberData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadMember();
  }, [id]);

  const getRoles = () => {
    const roles = [];
    // Use the same field names as your working MemberForm
    if (member.isChair) roles.push('Chair');
    if (member.isViceChair) roles.push('Vice Chair');
    if (member.isCommitteeSecretary) roles.push('Committee Secretary');
    if (member.isCommitteeMember) roles.push('Committee Member');
    if (member.isDelegationSecretary) roles.push('Delegation Secretary');
    return roles.join(', ');
  };

  if (loading) return <div className="loading">Loading member details...</div>;
  if (error) return <div className="error-message">{error}</div>;
  if (!member) return <div>Member not found</div>;

  return (
    <div className="member-view-container">
      <div className="header">
        <h2>Member Details</h2>
        <button
          onClick={() => navigate(`/sub-committee-members/${id}/edit`)}
          className="btn btn-edit"
        >
          Edit Member
        </button>
      </div>

      <div className="member-details">
        <div className="detail-section">
          <h3>Basic Information</h3>
          <div className="detail-row">
            <span className="detail-label">Name:</span>
            <span className="detail-value">{member.name}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Email:</span>
            <span className="detail-value">{member.email}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Phone:</span>
            <span className="detail-value">{member.phone || '-'}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Position in RA:</span>
            <span className="detail-value">{member.positionInYourRA || '-'}</span>
          </div>
        </div>

        <div className="detail-section">
          <h3>Committee Information</h3>
          <div className="detail-row">
            <span className="detail-label">Country:</span>
            <span className="detail-value">{member.country?.name || '-'}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Sub-Committee:</span>
            <span className="detail-value">{member.subCommittee?.name || '-'}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Appointed Date:</span>
            <span className="detail-value">{member.appointedDate || '-'}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Roles:</span>
            <span className="detail-value">{getRoles()}</span>
          </div>
        </div>

        {member.appointedLetterDoc && (
          <div className="detail-section">
            <h3>Appointment Letter</h3>
            <div className="file-preview">
              <span>{member.appointedLetterDoc.originalFilename}</span>
              <div className="document-actions">
                <a
                  href={`${process.env.REACT_APP_BASE_URL}/country-committee-members/${id}/appointment-letter`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary"
                >
                  Download Appointment Letter
                </a>
                <a
                  href={`${process.env.REACT_APP_BASE_URL}/country-committee-members/${id}/appointment-letter/view`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-info"
                >
                  View Appointment Letter
                </a>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="back-button">
        <button
          onClick={() => navigate('/sub-committee-members')}
          className="btn btn-back"
        >
          Back to Members List
        </button>
      </div>
    </div>
  );
};

export default MemberView;