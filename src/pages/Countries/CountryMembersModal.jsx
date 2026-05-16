import React from 'react';
import { FaTimes, FaUserTie, FaUserShield, FaUserSecret, FaUser, FaEnvelope, FaPhone, FaSpinner, FaGlobe } from 'react-icons/fa';
import './Countries.css';

// Import revenue authority logos
import TanzaniaLogo from '../../assets/Tanzania.png';
import BurundiLogo from '../../assets/Burundi.jpeg';
import KenyaLogo from '../../assets/Kenya.jpeg';
import RwandaLogo from '../../assets/Rwanda.jpeg';
import SouthSudanLogo from '../../assets/South Sudan.jpeg';
import UgandaLogo from '../../assets/Uganda.jpeg';
import ZanzibarLogo from '../../assets/Zanzibar.jpeg';

const CountryMembersModal = ({ country, membersData, onClose, isLoading }) => {
  // Add default values to prevent destructuring errors
  const { 
    committeeMembers = [], 
    subCommitteeMembers = [], 
    delegationSecretaries = [] 
  } = membersData || {};

  // Function to get revenue authority logo based on country name
  const getRevenueAuthorityLogo = (countryName) => {
    if (!countryName) return null;
    
    const logoMap = {
      'Tanzania': TanzaniaLogo,
      'Burundi': BurundiLogo,
      'Kenya': KenyaLogo,
      'Rwanda': RwandaLogo,
      'South Sudan': SouthSudanLogo,
      'Uganda': UgandaLogo,
      'Zanzibar': ZanzibarLogo
    };
    
    return logoMap[countryName] || null;
  };

  // Component for revenue authority logo display
  const RevenueAuthorityLogo = ({ countryName, className = "modal-revenue-logo" }) => {
    const logo = getRevenueAuthorityLogo(countryName);
    
    if (!logo) {
      return <FaGlobe className={`${className} fallback-icon`} />;
    }

    return (
      <img 
        src={logo}
        alt={`${countryName} Revenue Authority Logo`}
        className={className}
        onError={(e) => {
          console.error(`Failed to load logo for ${countryName}:`, e);
          e.target.style.display = 'none';
          e.target.nextSibling.style.display = 'inline';
        }}
      />
    );
  };


  const renderMember = (member, memberType = 'member') => (
    <div key={member.id} className="member-card">
      <div className="member-header">
        <h4 className="member-name">
          {member.isChair && <FaUserTie className="role-icon chair-icon" title="Chair" />}
          {member.isViceChair && <FaUserShield className="role-icon vice-chair-icon" title="Vice Chair" />}
          {(member.isCommitteeSecretary || member.isDelegationSecretary) && 
            <FaUserSecret className="role-icon secretary-icon" title="Secretary" />}
          {!member.isChair && !member.isViceChair && !member.isCommitteeSecretary && !member.isDelegationSecretary && 
            <FaUser className="role-icon member-icon" title="Member" />}
          {member.name || 'Unknown Name'}
        </h4>
        {/* Show position for all members if available */}
        {(member.positionInYourRA || member.position || member.role) && (
          <span className="member-position">
            {member.positionInYourRA || member.position || member.role}
          </span>
        )}
      </div>
      
      <div className="member-contacts">
        {member.email && (
          <div className="contact-item">
            <FaEnvelope className="contact-icon" />
            <a href={`mailto:${member.email}`}>{member.email}</a>
          </div>
        )}
        {member.phone && (
          <div className="contact-item">
            <FaPhone className="contact-icon" />
            <a href={`tel:${member.phone}`}>{member.phone}</a>
          </div>
        )}
        {/* Show additional contact info if available */}
        {member.contactNumber && (
          <div className="contact-item">
            <FaPhone className="contact-icon" />
            <a href={`tel:${member.contactNumber}`}>{member.contactNumber}</a>
          </div>
        )}
        {member.contactEmail && (
          <div className="contact-item">
            <FaEnvelope className="contact-icon" />
            <a href={`mailto:${member.contactEmail}`}>{member.contactEmail}</a>
          </div>
        )}
      </div>
      
      {/* Show appointment date for all members if available */}
      {(member.appointedDate || member.appointmentDate || member.dateAppointed) && (
        <div className="member-meta">
          <span>Appointed: {new Date(member.appointedDate || member.appointmentDate || member.dateAppointed).toLocaleDateString()}</span>
        </div>
      )}
      
      {/* Show subcommittee information if available */}
      {member.subCommittee && (
        <div className="member-meta">
          <span>Subcommittee: {member.subCommittee.name}</span>
          {member.subCommittee.parentCommittee && (
            <span>Parent Committee: {member.subCommittee.parentCommittee.name}</span>
          )}
        </div>
      )}
      
      {/* Show additional member information if available */}
      {member.department && (
        <div className="member-meta">
          <span>Department: {member.department}</span>
        </div>
      )}
      {member.organization && (
        <div className="member-meta">
          <span>Organization: {member.organization}</span>
        </div>
      )}
    </div>
  );

  return (
    <div className="modal-overlay">
      <div className="country-members-modal">
        <div className="modal-header">
          <div className="modal-header-content">
            <h3>
              <span className="country-flag">🌍</span>
              {country.name} Members
            </h3>
            <RevenueAuthorityLogo 
              countryName={country.name}
              className="modal-revenue-logo"
            />
          </div>
          <button onClick={onClose} className="close-btn">
            <FaTimes />
          </button>
        </div>
        
        <div className="modal-body">
          {isLoading ? (
            <div className="modal-loading">
              <div className="spinner"><FaSpinner className="spinner-icon" /></div>
              <p>Loading members data...</p>
            </div>
                      ) : (
              <>

                
                                <div className="members-section">
                  <h4 className="section-title">Commissioner Generals (Country Committee Members)</h4>
                  {committeeMembers.length > 0 ? (
                    <div className="members-grid">
                      {committeeMembers.map(member => renderMember(member, 'commissioner'))}
                    </div>
                  ) : (
                    <p className="no-members">No commissioner generals found</p>
                  )}
                </div>
                
                <div className="members-section">
                  <h4 className="section-title">Sub-Committee Members</h4>
                  {subCommitteeMembers.length > 0 ? (
                    <div className="members-grid">
                      {subCommitteeMembers.map(member => renderMember(member, 'subcommittee'))}
                    </div>
                  ) : (
                    <p className="no-members">No sub-committee members found</p>
                  )}
                </div>
                
                <div className="members-section">
                  <h4 className="section-title">Delegation Secretaries</h4>
                  {delegationSecretaries.length > 0 ? (
                    <div className="members-grid">
                      {delegationSecretaries.map(member => renderMember(member, 'secretary'))}
                    </div>
                  ) : (
                    <p className="no-members">No delegation secretaries found</p>
                  )}
                </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CountryMembersModal;