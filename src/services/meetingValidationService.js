/**
 * Meeting Validation Service
 * Provides client-side validation for meeting creation and editing.
 */
const MeetingValidationService = {

  /**
   * Returns the list of meeting types available for the given role.
   */
  getMeetingTypes(role) {
    const types = [
      { value: 'SUBCOMMITTEE_MEETING', label: 'Subcommittee Meeting' },
      { value: 'TECHNICAL_MEETING', label: 'Technical Meeting' },
    ];

    // Only ADMIN and COMMISSIONER_GENERAL can create the top-level meeting type
    if (role === 'ADMIN' || role === 'COMMISSIONER_GENERAL' || role === 'SECRETARY') {
      types.push({ value: 'COMMISSIONER_GENERAL_MEETING', label: 'Commissioner General Meeting' });
    }

    return types;
  },

  /**
   * Check whether a Secretary is allowed to create a meeting in the given
   * hosting country.  Secretaries may only create meetings for their own country.
   */
  canSecretaryCreateMeeting(user, hostingCountryId) {
    if (!user || user.role !== 'SECRETARY') return true; // non-secretary: no restriction
    if (!hostingCountryId) return true; // no country selected yet
    const userCountryId = user.countryId || user.country?.id;
    if (!userCountryId) return true; // country unknown — allow (backend will enforce)
    return Number(userCountryId) === Number(hostingCountryId);
  },

  /**
   * Validate meeting form data before submission.
   * Returns an array of error strings (empty = valid).
   */
  validateMeetingData(formData, currentUser) {
    const errors = [];

    if (!formData.title || formData.title.trim().length < 3) {
      errors.push('Meeting title must be at least 3 characters.');
    }

    if (!formData.meetingDate) {
      errors.push('Please select a meeting date.');
    } else {
      const meetingDate = new Date(formData.meetingDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (meetingDate < today) {
        errors.push('Meeting date cannot be in the past.');
      }
    }

    if (!formData.meetingType) {
      errors.push('Please select a meeting type.');
    }

    if (!formData.venue || formData.venue.trim().length < 2) {
      errors.push('Please provide a venue.');
    }

    if (!formData.hostingCountry?.id) {
      errors.push('Please select a hosting country.');
    }

    // Secretary location restriction
    if (currentUser?.role === 'SECRETARY' && formData.hostingCountry?.id) {
      if (!this.canSecretaryCreateMeeting(currentUser, parseInt(formData.hostingCountry.id))) {
        errors.push(`Secretaries may only create meetings in their own country (${currentUser.country?.name || 'your country'}).`);
      }
    }

    return errors;
  }
};

export default MeetingValidationService;
