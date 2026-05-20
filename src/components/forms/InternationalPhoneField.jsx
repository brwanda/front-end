import React, { useMemo } from 'react';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import '../../styles/PhoneField.css';
import {
  getIso2ByCountryName,
  normalizeIntlPhoneValue,
  toIntlPhoneInputValue
} from '../../utils/phoneUtils';

const InternationalPhoneField = ({
  value,
  countryName,
  onChange,
  onBlur,
  placeholder = 'Enter phone number',
  id = 'phone',
  name = 'phone'
}) => {
  const countryIso2 = useMemo(() => getIso2ByCountryName(countryName), [countryName]);

  const handleChange = (nextValue) => {
    onChange(normalizeIntlPhoneValue(nextValue));
  };

  return (
    <PhoneInput
      country={countryIso2 || undefined}
      value={toIntlPhoneInputValue(value)}
      onChange={handleChange}
      onBlur={onBlur}
      enableSearch
      countryCodeEditable={false}
      placeholder={placeholder}
      inputProps={{ id, name }}
      containerClass="intl-phone-container"
      buttonClass="intl-phone-flag-button"
      inputClass="intl-phone-input"
      dropdownClass="intl-phone-dropdown"
      searchClass="intl-phone-search"
    />
  );
};

export default InternationalPhoneField;
