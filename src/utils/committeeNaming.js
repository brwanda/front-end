const COMMITTEE_NAME_RENAMES = {
  'domestic revenue sub committee': 'Domestic Revenues Sub Committee'
};

export const normalizeCommitteeName = (name = '') => {
  const normalizedKey = String(name).trim().toLowerCase();
  return COMMITTEE_NAME_RENAMES[normalizedKey] || name;
};

export const isHeadOfDelegationCommittee = (name = '') => {
  const normalized = String(name).trim().toLowerCase();
  if (!normalized) return false;

  // Treat common aliases/punctuation variants as the same HOD committee.
  const condensed = normalized.replace(/[^a-z0-9]/g, '');

  return (
    normalized.includes('head of delegation') ||
    condensed === 'hod' ||
    condensed.includes('headofdelegation')
  );
};
