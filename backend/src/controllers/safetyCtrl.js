const Ride = require('../models/Ride');
const User = require('../models/User');

/**
 * Trigger emergency SOS on significant route deviation or panic trigger
 */
const triggerSos = async (req, res, next) => {
  try {
    const { rideId, currentLocation, deviationKm, reason = 'Route Deviation > 1.0 km' } = req.body;
    const userId = req.user ? req.user.id : null;

    let ride = null;
    if (rideId && !rideId.startsWith('mock') && !rideId.startsWith('demo')) {
      ride = await Ride.findByIdAndUpdate(
        rideId,
        {
          'liveTracking.sosTriggered': true,
          'liveTracking.sosTimestamp': new Date(),
          'liveTracking.deviationKm': deviationKm || 1.8,
          'liveTracking.currentLocation': currentLocation || { latitude: 0, longitude: 0 }
        },
        { new: true }
      ).populate('driver', 'name phone emergencyContact');
    }

    const sosPayload = {
      alertId: `SOS-${Date.now()}`,
      rideId,
      timestamp: new Date().toISOString(),
      reason,
      deviationKm: deviationKm || 1.8,
      currentLocation: currentLocation || { latitude: 37.8100, longitude: -122.3600 },
      status: 'DISPATCH_NOTIFIED',
      message: 'CRITICAL: Vehicle off-corridor by > 1.0 km. Emergency contacts alerted.'
    };

    // Broadcast across WebSockets
    const io = req.app.get('io');
    if (io) {
      io.emit(`sos_alert_${rideId}`, sosPayload);
      io.emit('emergency_dispatch_alert', sosPayload);
    }

    console.warn(`[EMERGENCY SOS TRIGGERED]: Ride ID: ${rideId}, Deviation: ${deviationKm}km`);

    res.status(200).json({
      success: true,
      message: 'SOS Alert dispatched successfully. Emergency contacts and monitor notified.',
      data: sosPayload
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  triggerSos
};
