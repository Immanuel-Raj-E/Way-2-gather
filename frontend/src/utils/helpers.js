/**
 * Formats a Date object or ISO string into a friendly localized string
 */
export function formatDateTime(isoString) {
  if (!isoString) return 'Flexible';
  const date = new Date(isoString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Format currency in Indian Rupees
 */
export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
}

/**
 * Truncate long strings/addresses
 */
export function truncateAddress(address, maxLength = 30) {
  if (!address) return '';
  if (address.length <= maxLength) return address;
  return address.substring(0, maxLength) + '...';
}
