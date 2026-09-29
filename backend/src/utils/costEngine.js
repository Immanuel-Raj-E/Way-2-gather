/**
 * Haversine distance formula in kilometers
 */
function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 100) / 100;
}

/**
 * Calculates dynamic cost split based on the exact geographic segment occupied by the seeker.
 * Pricing Rule: ₹10 per km
 * 
 * @param {number} totalDistanceKm - Total host route distance
 * @param {number} sharedDistanceKm - Exact distance seeker occupied a seat
 * @param {number} ratePerKm - Rate per kilometer (strictly ₹10/km)
 * @param {number} baseFare - Base booking convenience fare (default: ₹0 or ₹20)
 * @param {number} seatCount - Number of seats booked
 * @returns {object} Cost breakdown
 */
function calculateCostSplit(
  totalDistanceKm,
  sharedDistanceKm,
  ratePerKm = 10, // Pricing rule: ₹10 per km
  baseFare = 0,
  seatCount = 1
) {
  const safeSharedKm = Math.max(0.1, Number(sharedDistanceKm) || 0.1);
  // Total Seeker contribution = Shared Distance (km) * 10
  const distanceFare = safeSharedKm * ratePerKm * seatCount;
  const totalBilled = Math.round((baseFare + distanceFare) * 100) / 100;
  
  // Standard solo cab rate comparison (approx ₹22/km + ₹60 base in Tamil Nadu)
  const soloTaxiEstimate = Math.round((60 + safeSharedKm * 22 * seatCount) * 100) / 100;
  const savings = Math.max(0, Math.round((soloTaxiEstimate - totalBilled) * 100) / 100);
  const co2SavedKg = Math.round(safeSharedKm * 0.192 * seatCount * 100) / 100;

  return {
    sharedDistanceKm: safeSharedKm,
    totalHostDistanceKm: Number(totalDistanceKm) || safeSharedKm,
    ratePerKm,
    baseFare,
    seatCount,
    distanceFare: Math.round(distanceFare * 100) / 100,
    totalBilled,
    soloTaxiEstimate,
    savings,
    co2SavedKg,
    currency: '₹'
  };
}

module.exports = {
  calculateHaversineDistance,
  calculateCostSplit
};
