// src/services/countryMembersService.js
import http from './http';

// Correct API endpoints based on backend controller mappings
const COMMISSIONER_GENERALS_API = `${process.env.REACT_APP_BASE_URL}/commissioner-generals`;
const COUNTRY_COMMITTEE_MEMBERS_API = `${process.env.REACT_APP_BASE_URL}/country-committee-members`;

export const getCountryMembers = async (countryId) => {
  try {
    console.log(`🔍 Fetching members for country ID: ${countryId}`);
    
    // Fetch all three types of members in parallel
    const [committeeMembers, subCommitteeMembers, delegationSecretaries] = await Promise.all([
      // Commissioner Generals (Country Committee Members)
      http.get(`${COMMISSIONER_GENERALS_API}/by-country/${countryId}`).catch(err => {
        console.warn(`⚠️ No commissioner generals found for country ${countryId}:`, err.message);
        return { data: [] };
      }),
      
      // Sub-Committee Members
      http.get(`${COUNTRY_COMMITTEE_MEMBERS_API}/country/${countryId}`).catch(err => {
        console.warn(`⚠️ No sub-committee members found for country ${countryId}:`, err.message);
        return { data: [] };
      }),
      
      // Delegation Secretaries
      http.get(`${COUNTRY_COMMITTEE_MEMBERS_API}/delegation-secretaries`).then(response => {
        // Filter by country ID since this endpoint returns all delegation secretaries
        const allSecretaries = response.data;
        const countrySecretaries = allSecretaries.filter(secretary => 
          secretary.countryId === countryId || secretary.country?.id === countryId
        );
        return { data: countrySecretaries };
      }).catch(err => {
        console.warn(`⚠️ No delegation secretaries found for country ${countryId}:`, err.message);
        return { data: [] };
      })
    ]);
    
    const result = {
      committeeMembers: committeeMembers.data || [],
      subCommitteeMembers: subCommitteeMembers.data || [],
      delegationSecretaries: delegationSecretaries.data || []
    };
    
    console.log(`✅ Successfully fetched members for country ${countryId}:`, {
      commissionerGenerals: result.committeeMembers.length,
      subCommitteeMembers: result.subCommitteeMembers.length,
      delegationSecretaries: result.delegationSecretaries.length
    });
    
    return result;
  } catch (error) {
    console.error(`❌ Error fetching country members for country ${countryId}:`, error);
    
    // Return empty structure on error to prevent crashes
    return {
      committeeMembers: [],
      subCommitteeMembers: [],
      delegationSecretaries: []
    };
  }
};