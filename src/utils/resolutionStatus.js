export const normalizeResolutionStatus = (status) => {
  const raw = (status || '').toString().trim().toUpperCase();

  if (!raw || raw === 'ASSIGNED' || raw === 'TODO' || raw === 'PENDING') {
    return 'PENDING';
  }
  if (raw === 'IN_PROGRESS' || raw === 'IN PROGRESS') {
    return 'IN_PROGRESS';
  }
  if (raw === 'DONE' || raw === 'COMPLETED') {
    return 'COMPLETED';
  }
  if (raw === 'CANCELLED' || raw === 'CANCELED') {
    return 'CANCELLED';
  }

  return raw;
};

export const formatResolutionStatusLabel = (status) => {
  const normalized = normalizeResolutionStatus(status);

  switch (normalized) {
    case 'PENDING':
      return 'PENDING';
    case 'IN_PROGRESS':
      return 'IN PROGRESS';
    case 'COMPLETED':
      return 'COMPLETED';
    case 'CANCELLED':
      return 'CANCELLED';
    default:
      return normalized.replace(/_/g, ' ');
  }
};
