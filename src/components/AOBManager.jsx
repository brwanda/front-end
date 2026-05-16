import React, { useState, useEffect } from 'react';
import { FaPlus, FaTrash, FaSave, FaSpinner, FaCheck, FaExclamationTriangle } from 'react-icons/fa';
import './AOBManager.css';

/**
 * AOBManager Component
 * Manages Any Other Business (AOB) items for Technical Committee meetings
 * Used by Delegation Secretary to add multiple AOB items during TC minutes
 */
const AOBManager = ({ meetingId, onSave, readOnly = false }) => {
  const [aobItems, setAobItems] = useState(['']);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (meetingId) {
      loadAOBItems();
    }
  }, [meetingId]);

  const loadAOBItems = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${process.env.REACT_APP_BASE_URL}/secretary/meetings/${meetingId}/aob`,
        { credentials: 'include' }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.aobItems && data.aobItems.length > 0) {
          setAobItems(data.aobItems);
        } else {
          setAobItems(['']); // Start with one empty item
        }
      }
    } catch (error) {
      console.error('Error loading AOB items:', error);
      setError('Failed to load AOB items');
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = () => {
    setAobItems([...aobItems, '']);
  };

  const handleRemoveItem = (index) => {
    if (aobItems.length > 1) {
      const newItems = aobItems.filter((_, i) => i !== index);
      setAobItems(newItems);
    }
  };

  const handleItemChange = (index, value) => {
    const newItems = [...aobItems];
    newItems[index] = value;
    setAobItems(newItems);
  };

  const handleSave = async () => {
    // Filter out empty items
    const nonEmptyItems = aobItems.filter(item => item.trim() !== '');

    if (nonEmptyItems.length === 0) {
      setError('Please add at least one AOB item');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user) {
        throw new Error('User not authenticated');
      }

      const response = await fetch(
        `${process.env.REACT_APP_BASE_URL}/secretary/meetings/${meetingId}/aob`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            aobItems: nonEmptyItems,
            secretaryId: user.id,
          }),
        }
      );

      const result = await response.json();

      if (response.ok && result.success) {
        setSuccess(`${result.itemCount} AOB item(s) saved successfully!`);
        if (onSave) {
          onSave(nonEmptyItems);
        }
        // Reload to show saved items
        setTimeout(() => {
          loadAOBItems();
          setSuccess('');
        }, 2000);
      } else {
        setError(result.error || 'Failed to save AOB items');
      }
    } catch (error) {
      console.error('Error saving AOB items:', error);
      setError('Failed to save AOB items. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="aob-manager loading">
        <FaSpinner className="spinner" />
        <p>Loading AOB items...</p>
      </div>
    );
  }

  return (
    <div className="aob-manager">
      <div className="aob-header">
        <h3>Any Other Business (AOB)</h3>
        <p className="aob-description">
          Add items for discussion that are not part of the main agenda
        </p>
      </div>

      {error && (
        <div className="alert alert-error">
          <FaExclamationTriangle />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          <FaCheck />
          <span>{success}</span>
        </div>
      )}

      <div className="aob-items">
        {aobItems.map((item, index) => (
          <div key={index} className="aob-item">
            <div className="aob-item-number">{index + 1}</div>
            <textarea
              className="aob-item-input"
              value={item}
              onChange={(e) => handleItemChange(index, e.target.value)}
              placeholder={`AOB Item ${index + 1}`}
              rows={2}
              disabled={readOnly || saving}
            />
            {!readOnly && aobItems.length > 1 && (
              <button
                type="button"
                className="btn-remove"
                onClick={() => handleRemoveItem(index)}
                disabled={saving}
                title="Remove this item"
              >
                <FaTrash />
              </button>
            )}
          </div>
        ))}
      </div>

      {!readOnly && (
        <div className="aob-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleAddItem}
            disabled={saving}
          >
            <FaPlus /> Add Another Item
          </button>

          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSave}
            disabled={saving || aobItems.every(item => item.trim() === '')}
          >
            {saving ? (
              <>
                <FaSpinner className="spinner" /> Saving...
              </>
            ) : (
              <>
                <FaSave /> Save AOB Items
              </>
            )}
          </button>
        </div>
      )}

      {readOnly && aobItems.length > 0 && aobItems[0] !== '' && (
        <div className="aob-readonly-note">
          <p className="text-muted">
            <em>AOB items are read-only. {aobItems.length} item(s) recorded.</em>
          </p>
        </div>
      )}
    </div>
  );
};

export default AOBManager;
