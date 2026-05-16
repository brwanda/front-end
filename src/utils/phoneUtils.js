const COUNTRY_DIAL_CODES = {
  rwanda: '+250',
  kenya: '+254',
  uganda: '+256',
  tanzania: '+255',
  burundi: '+257',
  'south sudan': '+211',
  zanzibar: '+255',
  'democratic republic of congo': '+243',
  drc: '+243'
};

const COUNTRY_ISO2_CODES = {
  rwanda: 'rw',
  kenya: 'ke',
  uganda: 'ug',
  tanzania: 'tz',
  burundi: 'bi',
  'south sudan': 'ss',
  zanzibar: 'tz',
  'democratic republic of congo': 'cd',
  drc: 'cd',
  'united states': 'us',
  'united kingdom': 'gb'
};

export const getDialCodeByCountryName = (countryName = '') => {
  const key = String(countryName).trim().toLowerCase();
  return COUNTRY_DIAL_CODES[key] || '';
};

export const getIso2ByCountryName = (countryName = '') => {
  const key = String(countryName).trim().toLowerCase();
  return COUNTRY_ISO2_CODES[key] || '';
};

export const normalizeIntlPhoneValue = (phone = '') => {
  const digits = String(phone || '').replace(/\D/g, '');
  return digits ? `+${digits}` : '';
};

export const toIntlPhoneInputValue = (phone = '') => {
  return String(phone || '').replace(/\D/g, '');
};

export const applyCountryCodeToPhone = (phone = '', countryName = '') => {
  const dialCode = getDialCodeByCountryName(countryName);
  const value = String(phone || '').trim();

  if (!dialCode) return value;
  if (!value) return `${dialCode} `;
  if (value.startsWith('+')) return value;

  return `${dialCode} ${value}`;
};
