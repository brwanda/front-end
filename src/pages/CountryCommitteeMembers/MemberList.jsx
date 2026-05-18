
import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getMembers, deleteMember } from '../../services/countryMemberService';
import { FaEdit, FaTrash, FaEnvelope, FaKey } from 'react-icons/fa';
import './Members.css';

const MemberList = () => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filter for committee members only and ensure members is always an array
  const safeMembers = useMemo(() => {
    if (!members) return [];
    if (!Array.isArray(members)) {
      console.error('Members is not an array:', members);
      return [];
    }
    
    // All members from CountryCommitteeMemberController are Commissioner General members
    console.log('All committee members:', members);
    console.log('Total members:', members.length);
    
    return members;
  }, [members]);

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getMembers();
        console.log('CountryCommitteeMembers received data:', data);
        
        if (data && Array.isArray(data)) {
          setMembers(data);
        } else {
          console.error('Invalid data structure:', data);
          setError('Invalid response from server');
          setMembers([]);
        }
      } catch (err) {
        console.error('Error loading members:', err);
        setError(err.message);
        setMembers([]);
      } finally {
        setLoading(false);
      }
    };
    fetchMembers();
  }, []);

  const handleDelete = async (id) => {
    try {
      if (window.confirm('Are you sure you want to delete this member?')) {
        await deleteMember(id);
        setMembers(safeMembers.filter(member => member.id !== id));
        console.log('Member deleted successfully');
      }
    } catch (error) {
      console.error('Error deleting member:', error);
      alert('Failed to delete member. Please try again.');
    }
  };

  const handleResendCredentials = async (memberId) => {
    if (window.confirm('Are you sure you want to resend credentials to this Commissioner General?')) {
      try {
        const response = await fetch(`${process.env.REACT_APP_BASE_URL}/commissioner-generals/${memberId}/resend-credentials`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            alert('✅ Credentials sent successfully to Commissioner General!');
          } else {
            alert('❌ Failed to send credentials: ' + result.message);
          }
        } else {
          const errorData = await response.json();
          alert('❌ Failed to send credentials: ' + (errorData.message || 'Unknown error'));
        }
      } catch (err) {
        alert('❌ Error resending credentials: ' + err.message);
      }
    }
  };

  const handleCheckPasswordStatus = async (memberId) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BASE_URL}/commissioner-generals/${memberId}/password-status`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (response.ok) {
        const status = await response.json();
        
        let statusMessage = `🔍 Password Status for ${status.memberName}:\n\n`;
        statusMessage += `📧 Email: ${status.memberEmail || 'Not provided'}\n`;
        statusMessage += `👤 Has User Account: ${status.hasUserAccount ? '✅ Yes' : '❌ No'}\n`;
        
        if (status.hasUserAccount) {
          statusMessage += `🔑 Has Password: ${status.hasPassword ? '✅ Yes' : '❌ No'}\n`;
          statusMessage += `📍 Password Location: ${status.passwordLocation}\n`;
          statusMessage += `🎭 User Role: ${status.userRole}\n`;
          statusMessage += `✅ Account Active: ${status.userActive ? 'Yes' : 'No'}\n`;
          if (status.lastLogin) {
            statusMessage += `🕒 Last Login: ${new Date(status.lastLogin).toLocaleString()}\n`;
          }
        } else {
          statusMessage += `📍 Password Location: ${status.passwordLocation}\n`;
        }
        
        alert(statusMessage);
      } else {
        const errorData = await response.json();
        alert('❌ Failed to check password status: ' + (errorData.error || 'Unknown error'));
      }
    } catch (err) {
      alert('❌ Error checking password status: ' + err.message);
    }
  };

    const getRoles = (member) => {
    console.log('Member data:', member);
    console.log('Member roles:', {
      isChair: member.isChair,
      isViceChair: member.isViceChair,
      isCommitteeSecretary: member.isCommitteeSecretary,
      isCommitteeMember: member.isCommitteeMember,
      chair: member.chair,
      viceChair: member.viceChair,
      committeeSecretary: member.committeeSecretary,
      committeeMember: member.committeeMember
    });
    
    // Get committee name for context
    const committeeName = member.committee?.name || '';
    const isHOD = committeeName.toLowerCase().includes('head of delegation');
    const isCommissionerGeneral = committeeName.toLowerCase().includes('commissioner general');
    
    // Determine committee prefix
    let committeePrefix = '';
    if (isHOD) {
      committeePrefix = 'HOD ';
    } else if (isCommissionerGeneral) {
      committeePrefix = 'CG ';
    }
    
    const roles = [];
    // Check both naming conventions with explicit === true check
    // Add committee prefix to show context (e.g., "HOD Chair", "CG Secretary")
    if (member.isChair === true || member.chair === true) roles.push(committeePrefix + 'Chair');
    if (member.isViceChair === true || member.viceChair === true) roles.push(committeePrefix + 'Vice Chair');
    if (member.isDelegationSecretary === true || member.delegationSecretary === true) roles.push(committeePrefix + 'Delegation Secretary');
    if (member.isCommitteeSecretary === true || member.committeeSecretary === true) roles.push(committeePrefix + 'Committee Secretary');
    if (member.isCommitteeMember === true || member.committeeMember === true) roles.push(committeePrefix + 'Member');
    
    const result = roles.join(', ');
    console.log('Roles result:', result);
    return result || 'No role assigned';
  };

  const handleFixCommittees = async () => {
    if (!window.confirm('This will fix incorrect committee names in the database. Continue?')) {
      return;
    }

    try {
      // Get all committees
      const response = await fetch(`${process.env.REACT_APP_BASE_URL}/committees`, {
        credentials: 'include'
      });
      const committees = await response.json();
      
      console.log('Current committees:', committees);
      
      // Find and fix incorrect committees
      for (const committee of committees) {
        const name = (committee.name || '').toLowerCase();
        
        // Fix "single room" to "Head Of Delegation"
        if (name === 'single room' || name === 'foreman' || name === 'commissioner genera') {
          const newName = name === 'single room' ? 'Head Of Delegation' : 
                         name === 'foreman' ? 'Head Of Delegation' : 
                         'Commissioner General';
          
          console.log(`Fixing committee ${committee.id}: "${committee.name}" -> "${newName}"`);
          
          await fetch(`${process.env.REACT_APP_BASE_URL}/committees/${committee.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ id: committee.id, name: newName })
          });
        }
      }
      
      alert('✅ Committees fixed! Refreshing page...');
      window.location.reload();
    } catch (error) {
      console.error('Error fixing committees:', error);
      alert('❌ Failed to fix committees: ' + error.message);
    }
  };

  return (
    <div className="member-container">
      <div className="header">
        <h2>Committee Members</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={handleFixCommittees} className="btn btn-secondary" style={{ backgroundColor: '#ffc107', color: '#000' }}>
            Fix Committee Names
          </button>
          <Link to="/members/new" className="btn btn-primary">Add Member</Link>
        </div>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      {loading ? (
        <div className="loading">Loading members...</div>
      ) : (
        <table className="member-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Country</th>
              <th>Committee</th>
              <th>Roles</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {safeMembers && Array.isArray(safeMembers) && safeMembers.length > 0 ? (
              safeMembers.map(member => (
            <tr key={member.id}>
              <td>{member.name}</td>
              <td>{member.email}</td>
              <td>{member.phone}</td>
              <td>{member.country?.name}</td>
              <td>{member.committee?.name || 'N/A'}</td>
              <td>{getRoles(member)}</td>
              <td>
                <Link to={`/members/${member.id}/edit`} className="btn btn-edit">
                  <FaEdit title="Edit" />
                  
                </Link>
                <button onClick={() => handleDelete(member.id)} className="btn btn-delete">
                  <FaTrash title="Delete" />
                </button>
                <button onClick={() => handleResendCredentials(member.id)} className="btn btn-resend">
                  <FaEnvelope title="Resend Credentials" />
                </button>
                <button onClick={() => handleCheckPasswordStatus(member.id)} className="btn btn-status">
                  <FaKey title="Check Password Status" />
                </button>
              </td>
            </tr>
          ))
            ) : (
              <tr>
                <td colSpan="7" className="no-results">
                  {!safeMembers || !Array.isArray(safeMembers) ? 'Error loading members' : 'No members found'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default MemberList;