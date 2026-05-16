// src/components/CountryList.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getCountries, deleteCountry } from '../../services/countryService';
import { getCountryMembers } from '../../services/countryMembersService';
import { FaEdit, FaTrash, FaGlobe, FaEnvelope, FaPlus } from 'react-icons/fa';
import CountryMembersModal from './CountryMembersModal';
import './Countries.css';

// Import revenue authority logos
import TanzaniaLogo from '../../assets/Tanzania.png';
import BurundiLogo from '../../assets/Burundi.jpeg';
import KenyaLogo from '../../assets/Kenya.jpeg';
import RwandaLogo from '../../assets/Rwanda.jpeg';
import SouthSudanLogo from '../../assets/South Sudan.jpeg';
import UgandaLogo from '../../assets/Uganda.jpeg';
import ZanzibarLogo from '../../assets/Zanzibar.jpeg';

const CountryList = () => {
  // CRITICAL: This component must display the SAME data for ALL roles
  // Chair, HOD, Sub-Committee Member, Secretary, etc. should all see identical countries data
  // No role-based filtering or data variation allowed

  // Role-based access control – only ADMIN can edit/delete countries
  const currentUserData = localStorage.getItem('user');
  const currentUser = currentUserData ? JSON.parse(currentUserData) : null;
  const isAdmin = currentUser?.role === 'ADMIN';
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [membersData, setMembersData] = useState(null);
  const [membersLoading, setMembersLoading] = useState(false);

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
  const RevenueAuthorityLogo = ({ countryName, className = "revenue-logo" }) => {
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

  useEffect(() => {
    const fetchCountries = async () => {
      try {
        // CRITICAL: Force all roles to use the same data source as Secretary
        // This ensures Chair, HOD, Sub-Committee Member, etc. all see identical data
        // No role-based filtering - everyone gets the same countries data
        const data = await getCountries();

        // Ensure we're getting the complete dataset (same as Secretary)
        console.log('Countries data fetched for all roles:', data);

        setCountries(data);
      } catch (error) {
        console.error('Error fetching countries:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCountries();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this country?')) {
      try {
        await deleteCountry(id);
        setCountries(countries.filter(country => country.id !== id));
      } catch (error) {
        console.error('Error deleting country:', error);
        alert('Failed to delete country. Please try again.');
      }
    }
  };

  const handleCountryClick = async (country) => {
    setSelectedCountry(country);
    setMembersLoading(true);
    try {
      console.log(`🔍 Fetching members for country: ${country.name} (ID: ${country.id})`);
      const data = await getCountryMembers(country.id);
      console.log('✅ Country members data fetched successfully:', data);
      setMembersData(data);
    } catch (error) {
      console.error('❌ Error fetching country members:', error);
      // Set empty data structure to prevent errors
      setMembersData({
        committeeMembers: [],
        subCommitteeMembers: [],
        delegationSecretaries: []
      });
      // Show user-friendly error message
      alert(`Failed to fetch members for ${country.name}. Please try again.`);
    } finally {
      setMembersLoading(false);
    }
  };

  const closeModal = () => {
    setSelectedCountry(null);
    setMembersData(null);
  };

  // Function to get flag URL using the country's isCode
  const getFlagUrl = (isCode) => {
    if (!isCode) return null;
    return `https://flagsapi.com/${isCode.toUpperCase()}/flat/64.png`;

  };

  // Component for flag display with error handling
  const CountryFlag = ({ isCode, countryName }) => {
    const [flagError, setFlagError] = useState(false);

    if (!isCode || flagError) {
      return <FaGlobe className="country-icon fallback-icon" />;
    }

    return (
      <img
        src={getFlagUrl(isCode)}
        alt={`${countryName} flag`}
        className="country-flag"
        onError={() => setFlagError(true)}
        onLoad={() => setFlagError(false)}
      />
    );
  };

  if (loading) {
    return (
      <div className="country-container">
        <div className="loading-spinner shared-loading-container">
          <div className="spinner shared-loader shared-loader--lg"></div>
          <p className="shared-loading-text">Loading countries...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="country-container">
      <div className="header">
        <div className="header-content">
          <h2 className="page-title">
            <FaGlobe className="title-icon" />
            Countries
          </h2>
          <p className="page-subtitle">Manage countries</p>
        </div>
        {isAdmin && (
          <Link to="/countries/new" className="btn btn-primary">
            <FaPlus className="btn-icon" />
            New Country
          </Link>
        )}
      </div>

      {countries.length === 0 ? (
        <div className="empty-state">
          <FaGlobe className="empty-icon" />
          <h3>No Countries Found</h3>
          <p>Start by adding your first country to the database.</p>
          <Link to="/countries/new" className="btn btn-primary">
            <FaPlus className="btn-icon" />
            Add First Country
          </Link>
        </div>
      ) : (
        <>
          <div className="results-header">
            <span className="results-count">
              {countries.length} {countries.length === 1 ? 'Country' : 'Countries'} Found
            </span>
          </div>

          <div className="countries-grid">
            {countries.map(country => (
              <div key={country.id} className="country-card">
                <div
                  className={`card-header clickable ${selectedCountry?.id === country.id && membersLoading ? 'loading' : ''}`}
                  onClick={() => handleCountryClick(country)}
                >
                  <div className="country-info">
                    <div className="country-header-row">
                      <h3 className="country-name">
                        <CountryFlag
                          isCode={country.isCode}
                          countryName={country.name}
                        />
                        {country.name}
                        {selectedCountry?.id === country.id && membersLoading && (
                          <span className="loading-indicator">🔄 Loading...</span>
                        )}
                      </h3>
                      <RevenueAuthorityLogo
                        countryName={country.name}
                        className="revenue-logo"
                      />
                    </div>
                    <div className="country-email">
                      <FaEnvelope className="email-icon" />
                      <span>{country.email}</span>
                    </div>
                  </div>
                </div>

                {isAdmin && (
                  <div className="card-actions">
                    <Link
                      to={`/countries/${country.id}/edit`}
                      className="btn btn-edit"
                      title="Edit Country"
                    >
                      <FaEdit />
                      <span>Edit</span>
                    </Link>
                    <button
                      onClick={() => handleDelete(country.id)}
                      className="btn btn-delete"
                      title="Delete Country"
                    >
                      <FaTrash />
                      <span>Delete</span>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {selectedCountry && (
        <CountryMembersModal
          country={selectedCountry}
          membersData={membersData}
          onClose={closeModal}
          isLoading={membersLoading}
        />
      )}
    </div>
  );
};

export default CountryList;