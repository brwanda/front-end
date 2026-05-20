import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCountryById, createCountry, updateCountry } from '../../services/countryService';
import { createRevenueAuthority, updateRevenueAuthority } from '../../services/revenueAuthorityService';
import './Countries.css';

const CountryForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [country, setCountry] = useState({
    name: '',
    isCode: '',
    email: '',
    eac: { id: 1 }
  });
  const [revenueAuthority, setRevenueAuthority] = useState({
    name: '',
    countryId: null
  });
  
  const [allCountries, setAllCountries] = useState([]);
  const [filteredCountries, setFilteredCountries] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loadingCountries, setLoadingCountries] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    const fetchCountries = async () => {
      setLoadingCountries(true);
      setError(null);
      try {
        const response = await fetch('https://restcountries.com/v3.1/all?fields=name,cca2');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        const formattedCountries = data.map(c => ({
          name: c.name.common,
          isCode: c.cca2
        })).sort((a, b) => a.name.localeCompare(b.name));
        setAllCountries(formattedCountries);
      } catch (error) {
        console.error('Failed to fetch countries:', error);
        setError('Failed to load countries. Please try again later.');
      } finally {
        setLoadingCountries(false);
      }
    };

    fetchCountries();

    if (id) {
      const fetchCountryData = async () => {
        try {
          const countryData = await getCountryById(id);
          setCountry({
            name: countryData.name || '',
            isCode: countryData.isCode || '',
            email: countryData.email || '',
            eac: countryData.eac || { id: 1 }
          });
          
          // If there's revenue authority data, set it
          if (countryData.revenueAuthority) {
            setRevenueAuthority({
              id: countryData.revenueAuthority.id,
              name: countryData.revenueAuthority.name || '',
              countryId: countryData.id
            });
          }
        } catch (error) {
          console.error('Failed to fetch country:', error);
          setError('Failed to load country data.');
        }
      };
      fetchCountryData();
    }
  }, [id]);

  const handleCountryChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'name') {
      const filtered = allCountries.filter(c => 
        c.name.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredCountries(filtered);
      setShowDropdown(value.length > 0);
    }
    
    setCountry(prev => ({ ...prev, [name]: value }));
    
    // Clear any previous error/success messages
    setError(null);
    setSuccess(null);
  };

  const handleRevenueAuthorityChange = (e) => {
    const { name, value } = e.target;
    setRevenueAuthority(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear any previous error/success messages
    setError(null);
    setSuccess(null);
  };

  const handleCountrySelect = (selectedCountry) => {
    setCountry(prev => ({
      ...prev,
      name: selectedCountry.name,
      isCode: selectedCountry.isCode
    }));
    setShowDropdown(false);
  };

  const validateForm = () => {
    const errors = [];
    
    if (!country.name.trim()) {
      errors.push('Country name is required');
    }
    
    if (!country.isCode.trim()) {
      errors.push('ISO code is required');
    }
    
    if (!country.email.trim()) {
      errors.push('Email is required');
    } else if (!/\S+@\S+\.\S+/.test(country.email)) {
      errors.push('Please enter a valid email address');
    }
    
    if (!revenueAuthority.name.trim()) {
      errors.push('Revenue authority name is required');
    }

    const isValidCountry = allCountries.some(
      c => c.name === country.name && c.isCode === country.isCode
    );
    
    if (!isValidCountry) {
      errors.push('Please select a valid country from the dropdown list');
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setError(validationErrors.join('. '));
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      let savedCountry;
      
      if (id) {
        // Update existing country
        savedCountry = await updateCountry(id, country);
        
        // Update or create revenue authority
        if (revenueAuthority.id) {
          await updateRevenueAuthority(revenueAuthority.id, {
            ...revenueAuthority,
            countryId: savedCountry.id
          });
        } else {
          await createRevenueAuthority({
            ...revenueAuthority,
            countryId: savedCountry.id
          });
        }
        
        setSuccess('Country and revenue authority updated successfully!');
      } else {
        // Create new country first
        savedCountry = await createCountry(country);
        
        if (!savedCountry || !savedCountry.id) {
          throw new Error('Failed to create country - no ID returned');
        }
        
        // Create revenue authority with the country ID
        await createRevenueAuthority({
          ...revenueAuthority,
          countryId: savedCountry.id
        });
        
        setSuccess('Country and revenue authority created successfully!');
      }
      
      // Navigate after a short delay to show success message
      setTimeout(() => {
        navigate('/countries');
      }, 1500);
      
    } catch (error) {
      console.error('Save error:', error);
      setError(error.message || 'Failed to save data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/countries');
  };

  return (
    <div className="country-form-container">
      <div className="form-header">
        <h2 className="form-title">
          {id ? 'Edit Country & Revenue Authority' : 'Add New Country & Revenue Authority'}
        </h2>
        <p className="form-subtitle">
          Please fill in all required fields to {id ? 'update' : 'create'} the country and its revenue authority.
        </p>
      </div>

      {error && (
        <div className="alert alert-error">
          <span className="alert-icon">⚠️</span>
          <span>{error}</span>
        </div>
      )}
      
      {success && (
        <div className="alert alert-success">
          <span className="alert-icon">✅</span>
          <span>{success}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="country-form">
        {/* Country Information Section */}
        <div className="form-section">
          <h3 className="section-title">Country Information</h3>
          
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">
                Country Name <span className="required">*</span>
              </label>
              <div className="input-wrapper">
                <input
                  type="text"
                  name="name"
                  value={country.name}
                  onChange={handleCountryChange}
                  className="form-input"
                  placeholder="Start typing country name..."
                  autoComplete="off"
                  disabled={isLoading}
                />
                {loadingCountries && (
                  <small className="input-hint">Loading countries...</small>
                )}
                {showDropdown && country.name && (
                  <div className="country-dropdown">
                    {filteredCountries.length > 0 ? (
                      filteredCountries.slice(0, 10).map((c) => (
                        <div 
                          key={c.isCode}
                          className="dropdown-item"
                          onClick={() => handleCountrySelect(c)}
                        >
                          <span className="country-name">{c.name}</span>
                          <span className="country-code">({c.isCode})</span>
                        </div>
                      ))
                    ) : (
                      <div className="dropdown-item no-results">
                        No countries found matching "{country.name}"
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">
                ISO Code <span className="required">*</span>
              </label>
              <input
                type="text"
                name="isCode"
                value={country.isCode}
                onChange={handleCountryChange}
                className="form-input"
                readOnly
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">
              Email Address <span className="required">*</span>
            </label>
            <input
              type="email"
              name="email"
              value={country.email}
              onChange={handleCountryChange}
              className="form-input"
              disabled={isLoading}
            />
          </div>
        </div>

        {/* Revenue Authority Section */}
        <div className="form-section">
          <h3 className="section-title">Revenue Authority Information</h3>
          
          <div className="form-group">
            <label className="form-label">
              Revenue Authority Name <span className="required">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={revenueAuthority.name}
              onChange={handleRevenueAuthorityChange}
              className="form-input"
              disabled={isLoading}
            />
            <small className="input-hint">
              Enter the official name of the country's revenue authority
            </small>
          </div>
        </div>

        {/* Form Actions */}
        <div className="form-actions">
          <button 
            type="button" 
            onClick={handleCancel}
            className="btn btn-secondary"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="btn-spinner"></span>
                {id ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              <>
                {id ? 'Update Country & Revenue Authority' : 'Create Country & Revenue Authority'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CountryForm;