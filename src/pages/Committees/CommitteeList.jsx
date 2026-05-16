import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  getCommittees,
  deleteCommittee,
  getSubCommittees,
  deleteSubCommittee,
  getHodMembers,
  getHodUsersByRole,
  getCommissionerGeneralUsersByRole
} from '../../services/committeeService';
import { deleteMember } from '../../services/countryMemberService';
import {
  FaEdit,
  FaTrash,
  FaPlus,
  FaUsers,
  FaLayerGroup,
  FaTimes,
  FaCrown,
  FaUserTie,
  FaFileAlt,
  FaUser
} from 'react-icons/fa';
import { normalizeCommitteeName, isHeadOfDelegationCommittee } from '../../utils/committeeNaming';
import './Committees.css';

const CommitteeList = () => {
  const navigate = useNavigate();
  const currentUserData = localStorage.getItem('user');
  const currentUser = currentUserData ? JSON.parse(currentUserData) : null;
  const isAdmin = currentUser?.role === 'ADMIN';

  const [committees, setCommittees] = useState([]);
  const [subCommittees, setSubCommittees] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showMembersModal, setShowMembersModal] = useState(false);
  const [selectedCommittee, setSelectedCommittee] = useState(null);
  const [committeeMembers, setCommitteeMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [activeTab, setActiveTab] = useState('cg');
  const [hodMembers, setHodMembers] = useState([]);
  const [commissionerUsers, setCommissionerUsers] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [committeesData, subCommitteesData] = await Promise.all([
          getCommittees(),
          getSubCommittees()
        ]);

        let hodMembersData = [];
        let hodRoleUsers = [];
        let commissionerRoleUsers = [];
        try {
          hodMembersData = await getHodMembers();
        } catch (hodError) {
          console.warn('Unable to load HOD members from /api/commissioner-generals/hod:', hodError);
        }

        try {
          hodRoleUsers = await getHodUsersByRole();
        } catch (hodRoleError) {
          console.warn('Unable to load HOD users from /api/users/role/HOD:', hodRoleError);
        }

        try {
          commissionerRoleUsers = await getCommissionerGeneralUsersByRole();
        } catch (commissionerRoleError) {
          console.warn('Unable to load Commissioner General users from /api/users/role/COMMISSIONER_GENERAL:', commissionerRoleError);
        }

        setCommittees(
          (Array.isArray(committeesData) ? committeesData : []).map((committee) => ({
            ...committee,
            name: normalizeCommitteeName(committee?.name)
          }))
        );

        setSubCommittees(
          (Array.isArray(subCommitteesData) ? subCommitteesData : []).map((subCommittee) => ({
            ...subCommittee,
            name: normalizeCommitteeName(subCommittee?.name)
          }))
        );

        const normalizedHodCommitteeMembers = (Array.isArray(hodMembersData) ? hodMembersData : []).map((member) => ({
          ...member,
          source: member?.source || 'committee'
        }));

        const normalizedHodRoleUsers = (Array.isArray(hodRoleUsers) ? hodRoleUsers : []).map((user) => ({
          id: user?.id,
          name: user?.name,
          email: user?.email,
          phone: user?.phone,
          country: user?.country,
          hod: true,
          source: 'user-role'
        }));

        const mergedHodMembersById = new Map();
        [...normalizedHodCommitteeMembers, ...normalizedHodRoleUsers].forEach((member) => {
          if (!member?.id) return;
          mergedHodMembersById.set(member.id, { ...member, ...(mergedHodMembersById.get(member.id) || {}) });
        });

        setCommissionerUsers(
          (Array.isArray(commissionerRoleUsers) ? commissionerRoleUsers : []).map((user) => ({
            id: user?.id,
            name: user?.name,
            email: user?.email,
            phone: user?.phone,
            country: user?.country,
            chair: true,
            source: 'user-role'
          }))
        );

        setHodMembers(
          Array.from(mergedHodMembersById.values()).map((member) => ({
             ...member,
             source: member?.source || 'committee'
           }))
         );
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const fetchCommitteeMembers = async (id, isSubCommittee, committeeName = '') => {
    setLoadingMembers(true);
    try {
      const base = process.env.REACT_APP_BASE_URL;
      const endpoint = isSubCommittee
        ? `${base}/country-committee-members/sub-committee/${id}`
        : `${base}/commissioner-generals/committee/${id}`;

      const response = await fetch(endpoint, {
        credentials: 'include'
      });

      const isCommissionerGeneralCommittee = String(committeeName).toLowerCase().includes('commissioner general');

      if (response.status === 204) {
        if (!isSubCommittee && isCommissionerGeneralCommittee && commissionerUsers.length > 0) {
          setCommitteeMembers(
            commissionerUsers.map((user) => ({
              ...user,
              chair: true,
              viceChair: false,
              hod: false,
              secretary: false,
              committeeMember: false
            }))
          );
          return;
        }
        setCommitteeMembers([]);
        return;
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch members: ${response.status}`);
      }

      let members = await response.json();
      members = Array.isArray(members) ? members : [];

      let normalized = members.map((member) => ({
        ...member,
        chair: member.isChair === true || member.chair === true,
        viceChair: member.isViceChair === true || member.viceChair === true,
        hod: member.isHod === true || member.isHOD === true || member.hod === true,
        secretary:
          member.isCommitteeSecretary === true ||
          member.isDelegationSecretary === true ||
          member.secretary === true,
        committeeMember: member.isCommitteeMember === true || member.committeeMember === true
      }));

      if (!isSubCommittee && isCommissionerGeneralCommittee && normalized.length === 0 && commissionerUsers.length > 0) {
        normalized = commissionerUsers.map((user) => ({
          ...user,
          chair: true,
          viceChair: false,
          hod: false,
          secretary: false,
          committeeMember: false
        }));
      }

      setCommitteeMembers(normalized);
    } catch (error) {
      console.error('Error fetching members:', error);
      const isCommissionerGeneralCommittee = String(committeeName).toLowerCase().includes('commissioner general');
      if (!isSubCommittee && isCommissionerGeneralCommittee && commissionerUsers.length > 0) {
        setCommitteeMembers(
          commissionerUsers.map((user) => ({
            ...user,
            chair: true,
            viceChair: false,
            hod: false,
            secretary: false,
            committeeMember: false
          }))
        );
      } else {
        setCommitteeMembers([]);
      }
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleCommitteeClick = async (committee, isSubCommittee = false, typeLabel = '') => {
    setSelectedCommittee({ ...committee, isSubCommittee, typeLabel });
    setShowMembersModal(true);
    await fetchCommitteeMembers(committee.id, isSubCommittee, committee?.name || '');
  };

  const closeMembersModal = () => {
    setShowMembersModal(false);
    setSelectedCommittee(null);
    setCommitteeMembers([]);
  };

  const handleDelete = async (id, isSubCommittee) => {
    const itemType = isSubCommittee ? 'sub-committee' : 'committee';
    if (window.confirm(`Are you sure you want to delete this ${itemType}?`)) {
      try {
        if (isSubCommittee) {
          await deleteSubCommittee(id);
          setSubCommittees((prev) => prev.filter((sub) => sub.id !== id));
        } else {
          await deleteCommittee(id);
          setCommittees((prev) => prev.filter((committee) => committee.id !== id));
        }
      } catch (error) {
        console.error(`Error deleting ${itemType}:`, error);
        alert(`Failed to delete ${itemType}. Please try again.`);
      }
    }
  };

  const commissionerGeneralCommittees = useMemo(
    () => committees.filter((committee) => committee?.name?.toLowerCase().includes('commissioner general')),
    [committees]
  );

  const commissionerGeneralCommittee = useMemo(
    () => commissionerGeneralCommittees[0] || null,
    [commissionerGeneralCommittees]
  );

  const technicalCommittees = useMemo(
    () => subCommittees.filter((subCommittee) => {
      const name = subCommittee?.name?.toLowerCase() || '';
      return !isHeadOfDelegationCommittee(subCommittee?.name) && !name.includes('commissioner general');
    }),
    [subCommittees]
  );

  const hodCards = useMemo(() => {
    // Group HOD members by country to avoid duplicates
    // Only show one card per country with the chair as the representative
    const hodByCountry = new Map();
    
    hodMembers.forEach((member) => {
      const countryId = member.country?.id;
      const countryName = member.country?.name || 'Unknown';
      
      if (!countryId) return;
      
      // If we already have an HOD for this country, keep the chair
      if (hodByCountry.has(countryId)) {
        const existing = hodByCountry.get(countryId);
        // Prefer the chair over other members
        if (member.chair || member.isChair || member.hod) {
          hodByCountry.set(countryId, member);
        }
      } else {
        hodByCountry.set(countryId, member);
      }
    });
    
    // Convert map to array of cards
    return Array.from(hodByCountry.values()).map((member) => ({
      id: `hod-${member.country?.id || member.id}`,
      name: `Head of Delegation - ${member.country?.name || 'Unknown Country'}`,
      hodMember: member
    }));
  }, [hodMembers]);

  const handleHodMemberClick = (member) => {
    setSelectedCommittee({ name: 'Head of Delegation', isSubCommittee: false, typeLabel: 'Head of Delegation' });
    setCommitteeMembers([
      {
        ...member,
        id: member.id,
        name: member.name,
        email: member.email,
        phone: member.phone,
        country: member.country,
        hod: true,
        chair: false,
        viceChair: false,
        secretary: false,
        committeeMember: false
      }
    ]);
    setShowMembersModal(true);
  };

  const getRoleIcon = (member) => {
    if (!member) return <FaUser className="role-icon member" />;
    if (member.hod === true) return <FaUserTie className="role-icon vice-chair" />;
    if (member.chair === true || member.isChair === true) return <FaCrown className="role-icon chair" />;
    if (member.viceChair === true || member.isViceChair === true) return <FaUserTie className="role-icon vice-chair" />;
    if (member.secretary === true || member.isCommitteeSecretary === true || member.isDelegationSecretary === true) {
      return <FaFileAlt className="role-icon secretary" />;
    }
    return <FaUser className="role-icon member" />;
  };

  const getRoleLabel = (member) => {
    if (!member) return 'Member';
    if (member.hod === true) return 'Head of Delegation';
    if (member.chair === true || member.isChair === true) return 'Chair';
    if (member.viceChair === true || member.isViceChair === true) return 'Vice Chair';
    if (member.secretary === true || member.isCommitteeSecretary === true || member.isDelegationSecretary === true) return 'Secretary';
    return 'Member';
  };

  const groupMembersByRole = (members = []) => {
    const groups = { hods: [], chairs: [], viceChairs: [], secretaries: [], members: [] };

    members.forEach((member) => {
      if (!member) return;
      if (member.hod === true) groups.hods.push(member);
      else if (member.chair === true || member.isChair === true) groups.chairs.push(member);
      else if (member.viceChair === true || member.isViceChair === true) groups.viceChairs.push(member);
      else if (member.secretary === true || member.isCommitteeSecretary === true || member.isDelegationSecretary === true) groups.secretaries.push(member);
      else groups.members.push(member);
    });

    return groups;
  };

  const renderRoleGroup = ({ title, icon, members, cardClass, emptyMessage }) => (
    <div className="role-group">
      <h4 className="role-group-title">
        {icon} {title} ({members.length})
      </h4>
      {members.length > 0 ? (
        <div className="members-grid">
          {members.map((m) => (
            <div key={m.id} className={`member-card ${cardClass}`}>
              <div className="member-info">
                <div className="member-avatar">{getRoleIcon(m)}</div>
                <div className="member-details">
                  <h5 className="member-name">{m.name}</h5>
                  <p className="member-role">{getRoleLabel(m)}</p>
                  {m.email && <p className="member-email">{m.email}</p>}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="role-empty-text">{emptyMessage}</p>
      )}
    </div>
  );

  const handleDeleteHodMember = async (memberId, source = 'committee') => {
    if (!window.confirm('Are you sure you want to delete this HOD record?')) {
      return;
    }

    try {
      if (source !== 'committee') {
        throw new Error('HOD records must be managed from committee members only.');
      }
      await deleteMember(memberId);
      setHodMembers((prev) => prev.filter((member) => member.id !== memberId));
    } catch (error) {
      console.error('Error deleting HOD member:', error);
      alert('Failed to delete HOD record. Please try again.');
    }
  };

  return (
    <div className="committee-container">
      <div className="header">
        <div className="header-content">
          <h2 className="page-title">
            <FaUsers className="title-icon" />
            EARA Committees
          </h2>
          <p className="page-subtitle">Commissioner General, Heads of Delegation, and Technical Committees</p>
        </div>
        {isAdmin && (
          <Link to="/committees/new" className="btn btn-primary">
            <FaPlus className="btn-icon" />
            New Committee
          </Link>
        )}
      </div>

      <div className="tab-navigation">
        <button
          type="button"
          className={`tab-btn ${activeTab === 'cg' ? 'active' : ''}`}
          onClick={() => setActiveTab('cg')}
        >
          <FaUsers className="tab-icon" />
          Commissioner General ({commissionerUsers.length > 0 ? commissionerUsers.length : (commissionerGeneralCommittee ? 1 : 0)})
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === 'hod' ? 'active' : ''}`}
          onClick={() => setActiveTab('hod')}
        >
          <FaUserTie className="tab-icon" />
          Head Of Delegation ({hodCards.length})
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === 'technical' ? 'active' : ''}`}
          onClick={() => setActiveTab('technical')}
        >
          <FaLayerGroup className="tab-icon" />
          Technical Sub-Committees ({technicalCommittees.length})
        </button>
      </div>

      {activeTab === 'cg' && (
        <section className="committee-section-block">
          {commissionerGeneralCommittee ? (
            <div className="committees-grid" style={{ marginBottom: '10px' }}>
              <div key={`cg-${commissionerGeneralCommittee.id}`} className="committee-card">
                <div className="card-header clickable" onClick={() => handleCommitteeClick(commissionerGeneralCommittee, false, 'Commissioner General')}>
                  <div className="committee-info">
                    <div className="committee-title-row">
                      <h3 className="committee-name">
                        <FaUsers className="committee-icon" />
                        {commissionerGeneralCommittee.name}
                      </h3>
                      <span className="committee-type">Committee</span>
                    </div>
                  </div>
                  <div className="view-members-hint"><span>Click to view members</span></div>
                </div>

                {isAdmin && (
                  <div className="card-actions">
                    <Link to={`/committees/${commissionerGeneralCommittee.id}/edit`} className="btn btn-edit" onClick={(e) => e.stopPropagation()}>
                      <FaEdit /><span>Edit</span>
                    </Link>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(commissionerGeneralCommittee.id, false); }}
                      className="btn btn-delete"
                    >
                      <FaTrash /><span>Delete</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="empty-state compact-empty">
              <p>No Commissioner General committee found.</p>
            </div>
          )}
        </section>
      )}

      {activeTab === 'hod' && (
        <section className="committee-section-block">
          {hodCards.length > 0 ? (
            <div className="committees-grid">
              {hodCards.map((committee) => (
                <div key={`hod-${committee.id}`} className="committee-card">
                  <div
                    className="card-header clickable"
                    onClick={() => handleHodMemberClick(committee.hodMember)}
                  >
                    <div className="committee-info">
                      <div className="committee-title-row">
                        <h3 className="committee-name">
                          <FaUserTie className="committee-icon" />
                          {committee.name}
                        </h3>
                        <span className="committee-type">Committee</span>
                      </div>
                    </div>
                    <div className="view-members-hint"><span>Click to view members</span></div>
                  </div>

                  {isAdmin && (
                    <div className="card-actions">
                      <button
                        type="button"
                        className="btn btn-edit"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/members/${committee.hodMember.id}/edit`);
                        }}
                      >
                        <FaEdit /><span>Edit</span>
                      </button>
                      <button
                        type="button"
                        className="btn btn-delete"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteHodMember(committee.hodMember.id, committee.hodMember.source);
                        }}
                      >
                        <FaTrash /><span>Delete</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state compact-empty">
              <p>No HOD records found.</p>
            </div>
          )}
        </section>
      )}

      {activeTab === 'technical' && (
        <section className="committee-section-block">
          {technicalCommittees.length === 0 ? (
            <div className="empty-state compact-empty">
              <p>No technical sub-committees found.</p>
            </div>
          ) : (
            <div className="committees-grid">
              {technicalCommittees.map((subCommittee) => (
                <div key={`sub-${subCommittee.id}`} className="committee-card sub-committee-card">
                  <div className="card-header clickable" onClick={() => handleCommitteeClick(subCommittee, true, 'Technical Sub-Committee')}>
                    <div className="committee-info">
                      <div className="committee-title-row">
                        <h3 className="committee-name">
                          <FaLayerGroup className="committee-icon" />
                          {subCommittee.name}
                        </h3>
                        <span className="committee-type sub-type">Sub-Committee</span>
                      </div>
                    </div>
                    <div className="view-members-hint"><span>Click to view members</span></div>
                  </div>

                  {isAdmin && (
                    <div className="card-actions">
                      <Link to={`/committees/${subCommittee.id}/edit`} className="btn btn-edit" onClick={(e) => e.stopPropagation()}>
                        <FaEdit /><span>Edit</span>
                      </Link>
                      <button onClick={(e) => { e.stopPropagation(); handleDelete(subCommittee.id, true); }} className="btn btn-delete">
                        <FaTrash /><span>Delete</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {showMembersModal && (
        <div className="modal-overlay" onClick={closeMembersModal}>
          <div className="members-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                <div className="modal-title-content">
                  {selectedCommittee?.isSubCommittee ? <FaLayerGroup className="modal-icon" /> : <FaUsers className="modal-icon" />}
                  <div>
                    <h3>{selectedCommittee?.name}</h3>
                    <p className="modal-subtitle">
                      {selectedCommittee?.typeLabel || (selectedCommittee?.isSubCommittee ? 'Sub-Committee' : 'Committee')} Members
                    </p>
                  </div>
                </div>
              </div>
              <button className="close-btn" onClick={closeMembersModal}><FaTimes /></button>
            </div>

            <div className="modal-body">
              {!loadingMembers && committeeMembers.length === 0 ? (
                <div className="empty-members">
                  <FaUsers className="empty-members-icon" />
                  <h4>No Members Found</h4>
                  <p>This committee does not have any members yet.</p>
                </div>
              ) : !loadingMembers ? (
                <div className="members-list">
                  {(() => {
                    const grouped = groupMembersByRole(committeeMembers);

                    return (
                      <>
                        {!selectedCommittee?.isSubCommittee && renderRoleGroup({
                          title: 'Heads of Delegation',
                          icon: <FaUserTie className="role-group-icon vice-chair" />,
                          members: grouped.hods,
                          cardClass: 'vice-chair',
                          emptyMessage: 'No heads of delegation assigned.'
                        })}

                        {renderRoleGroup({
                          title: 'Chairs',
                          icon: <FaCrown className="role-group-icon chair" />,
                          members: grouped.chairs,
                          cardClass: 'chair',
                          emptyMessage: 'No chairs assigned.'
                        })}

                        {renderRoleGroup({
                          title: 'Vice Chairs',
                          icon: <FaUserTie className="role-group-icon vice-chair" />,
                          members: grouped.viceChairs,
                          cardClass: 'vice-chair',
                          emptyMessage: 'No vice chairs assigned.'
                        })}

                        {renderRoleGroup({
                          title: 'Secretaries',
                          icon: <FaFileAlt className="role-group-icon secretary" />,
                          members: grouped.secretaries,
                          cardClass: 'secretary',
                          emptyMessage: 'No secretaries assigned.'
                        })}

                        {renderRoleGroup({
                          title: 'Members',
                          icon: <FaUser className="role-group-icon member" />,
                          members: grouped.members,
                          cardClass: 'member',
                          emptyMessage: 'No general members assigned.'
                        })}
                      </>
                    );
                  })()}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommitteeList;
