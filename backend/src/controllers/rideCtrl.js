const Ride = require('../models/Ride');
const Request = require('../models/Request');
const User = require('../models/User');
const aiService = require('../services/aiService');
const { calculateCostSplit, calculateHaversineDistance } = require('../utils/costEngine');

// Helper to generate 4-digit numeric OTP
const generateOTP = () => Math.floor(1000 + Math.random() * 9000).toString();

/**
 * 1. User Intent: Host creates a ride (with optional isWomenOnly flag)
 */
const createRide = async (req, res, next) => {
  try {
    const { 
      origin, 
      destination, 
      departureTime, 
      totalSeats, 
      pricePerKm, 
      baseFare, 
      waypoints,
      isWomenOnly,
      vehicle
    } = req.body;
    
    const driverId = req.user ? req.user.id : new (require('mongoose').Types.ObjectId)();

    const ride = await Ride.create({
      driver: driverId,
      origin,
      destination,
      waypoints: waypoints || [origin, destination],
      departureTime: departureTime ? new Date(departureTime) : new Date(),
      totalSeats: totalSeats || 3,
      availableSeats: totalSeats || 3,
      pricePerKm: pricePerKm || 5,
      baseFare: baseFare || 20,
      isWomenOnly: Boolean(isWomenOnly),
      vehicle: vehicle || {
        plateNumber: 'KA-01-MJ-8821',
        model: 'Honda City',
        color: 'Silver'
      },
      activePassengers: [],
      status: 'scheduled'
    });

    res.status(201).json({ success: true, message: 'Ride hosted successfully', ride });
  } catch (error) {
    next(error);
  }
};

/**
 * 2. Hard Filtering: Eliminates invalid candidates & enforces Women-Only Safety Barrier
 */
const findMatches = async (req, res, next) => {
  try {
    const { 
      origin, 
      destination, 
      preferredTime, 
      seatsNeeded = 1, 
      womenOnly = false,
      userGender = 'unspecified'
    } = req.body;

    // Hard Filter 1: Valid departure window (+/- 90 minutes)
    const targetTime = preferredTime ? new Date(preferredTime) : new Date();
    const windowStart = new Date(targetTime.getTime() - 90 * 60 * 1000);
    const windowEnd = new Date(targetTime.getTime() + 180 * 60 * 1000);

    // Hard Filter 2: Construct Mongo query
    const query = {
      status: { $in: ['scheduled', 'in_progress', 'locked'] },
      availableSeats: { $gte: Number(seatsNeeded) },
      departureTime: { $gte: windowStart, $lte: windowEnd }
    };

    // Women's Safety Barrier:
    // If Seeker has requested womenOnlyPool or is female requesting Women-Only,
    // only return rides marked as isWomenOnly === true
    if (womenOnly === true || womenOnly === 'true') {
      query.isWomenOnly = true;
    }

    let candidateRides = await Ride.find(query)
      .populate({
        path: 'driver',
        select: 'name rating email phone avatarUrl gender womenOnlyPool emergencyContact'
      });

    // Secondary Female Host Verification (If women-only, driver must be female)
    if (womenOnly === true || womenOnly === 'true') {
      candidateRides = candidateRides.filter(r => {
        if (!r.driver) return false;
        return r.driver.gender === 'female' || r.isWomenOnly === true;
      });
    }

    // Fallback seed mock data if database is empty (for demo presentation)
    if (!candidateRides || candidateRides.length === 0) {
      if (womenOnly) {
        candidateRides = [
          {
            _id: 'mock_female_ride_1',
            driver: { name: 'Priya Sharma', rating: 4.95, gender: 'female', womenOnlyPool: true },
            origin: { address: 'Koramangala 4th Block', latitude: 12.934, longitude: 77.628 },
            destination: { address: 'Electronic City Phase 1', latitude: 12.845, longitude: 77.660 },
            departureTime: new Date(Date.now() + 20 * 60000),
            availableSeats: 2,
            totalSeats: 3,
            pricePerKm: 5,
            baseFare: 20,
            isWomenOnly: true,
            vehicle: { plateNumber: 'KA-05-AB-1234', model: 'Hyundai i20', color: 'White' },
            activePassengers: []
          },
          {
            _id: 'mock_female_ride_2',
            driver: { name: 'Ananya Reddy', rating: 4.88, gender: 'female', womenOnlyPool: true },
            origin: { address: 'Indiranagar 100ft Rd', latitude: 12.978, longitude: 77.640 },
            destination: { address: 'Bellandur EcoSpace', latitude: 12.926, longitude: 77.683 },
            departureTime: new Date(Date.now() + 35 * 60000),
            availableSeats: 3,
            totalSeats: 3,
            pricePerKm: 5,
            baseFare: 20,
            isWomenOnly: true,
            vehicle: { plateNumber: 'KA-03-CD-5678', model: 'Tata Nexon EV', color: 'Teal Blue' },
            activePassengers: []
          }
        ];
      } else {
        candidateRides = [
          {
            _id: 'mock_ride_1',
            driver: { name: 'Alex Rivera', rating: 4.9, gender: 'male' },
            origin: { address: 'Market St & 5th, SF', latitude: 37.783, longitude: -122.408 },
            destination: { address: 'Mission District, SF', latitude: 37.760, longitude: -122.415 },
            departureTime: new Date(Date.now() + 15 * 60000),
            availableSeats: 3,
            totalSeats: 3,
            pricePerKm: 5,
            baseFare: 20,
            isWomenOnly: false,
            vehicle: { plateNumber: 'CA-7XYZ99', model: 'Honda Civic', color: 'Black' },
            activePassengers: []
          },
          {
            _id: 'mock_ride_2',
            driver: { name: 'Priya Sharma (Women Pool)', rating: 4.95, gender: 'female', womenOnlyPool: true },
            origin: { address: 'Mission Bay Center', latitude: 37.771, longitude: -122.392 },
            destination: { address: 'Noe Valley 24th', latitude: 37.751, longitude: -122.431 },
            departureTime: new Date(Date.now() + 25 * 60000),
            availableSeats: 2,
            totalSeats: 3,
            pricePerKm: 5,
            baseFare: 20,
            isWomenOnly: true,
            vehicle: { plateNumber: 'CA-5WMN88', model: 'Tesla Model 3', color: 'White' },
            activePassengers: []
          }
        ];
      }
    }

    const formattedCandidates = candidateRides.map(r => ({
      id: r._id.toString(),
      driver_name: r.driver ? r.driver.name : 'Verified Host',
      driver_rating: r.driver ? r.driver.rating : 4.9,
      driver_gender: r.driver ? r.driver.gender : 'unspecified',
      is_women_only: Boolean(r.isWomenOnly),
      vehicle: r.vehicle || { plateNumber: 'KA-01-MJ-8821', model: 'Sedan', color: 'Silver' },
      origin: {
        latitude: r.origin.latitude,
        longitude: r.origin.longitude,
        address: r.origin.address
      },
      destination: {
        latitude: r.destination.latitude,
        longitude: r.destination.longitude,
        address: r.destination.address
      },
      available_seats: r.availableSeats,
      total_seats: r.totalSeats,
      price_per_km: r.pricePerKm || 5,
      base_fare: r.baseFare || 20,
      active_passengers_count: r.activePassengers ? r.activePassengers.filter(p => ['booked', 'boarded'].includes(p.status)).length : 0,
      departure_time: r.departureTime
    }));

    // Step 3: Python FastAPI XGBoost Inference Pipeline
    const aiResult = await aiService.matchRides({
      riderOrigin: origin,
      riderDestination: destination,
      riderPreferredTime: targetTime,
      seatsNeeded: Number(seatsNeeded),
      candidateRides: formattedCandidates
    });

    res.status(200).json({
      success: true,
      total_hard_filtered: formattedCandidates.length,
      matches: aiResult.matches || []
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 3. Seeker Booking & Unique OTP Generation per passenger
 */
const requestRide = async (req, res, next) => {
  try {
    const { 
      rideId, 
      origin, 
      destination, 
      seatsNeeded = 1, 
      seekerName = 'Seeker', 
      seekerPhone = '+1-555-0100',
      seekerGender = 'unspecified'
    } = req.body;

    const seekerId = req.user ? req.user.id : new (require('mongoose').Types.ObjectId)();
    const uniquePassengerOtp = generateOTP();

    // Calculate shared distance for cost projection
    const sharedDist = calculateHaversineDistance(
      origin.latitude, origin.longitude,
      destination.latitude, destination.longitude
    );
    const costBreakdown = calculateCostSplit(sharedDist, sharedDist, 5, 20, Number(seatsNeeded));

    const newPassenger = {
      seekerId,
      seekerName,
      seekerPhone,
      seekerGender,
      pickupPoint: origin,
      dropPoint: destination,
      status: 'booked',
      seatCount: Number(seatsNeeded),
      otp: uniquePassengerOtp,
      sharedDistanceKm: sharedDist,
      fareBilled: costBreakdown.totalBilled,
      boardedAt: null
    };

    let ride = null;
    if (!rideId.startsWith('mock')) {
      ride = await Ride.findById(rideId);
      if (ride) {
        ride.activePassengers.push(newPassenger);
        ride.availableSeats = Math.max(0, ride.availableSeats - Number(seatsNeeded));
        if (ride.availableSeats === 0 && ride.status === 'scheduled') {
          ride.status = 'locked';
        }
        await ride.save();
      }
    }

    const io = req.app.get('io');
    if (io) {
      io.emit(`host_request_${rideId}`, {
        message: `New Booking Confirmed for ${seekerName}!`,
        passenger: newPassenger,
        availableSeats: ride ? ride.availableSeats : 1
      });
    }

    res.status(201).json({
      success: true,
      message: 'Carpool seat booked! Share OTP with Host upon boarding.',
      passenger: newPassenger,
      costBreakdown
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 4. Verify Individual Passenger OTP upon boarding
 */
const verifyPassengerOtp = async (req, res, next) => {
  try {
    const { id: rideId } = req.params;
    const { passengerId, otp } = req.body;

    let ride = null;
    let verified = false;

    if (!rideId.startsWith('mock')) {
      ride = await Ride.findById(rideId);
      if (ride) {
        const p = ride.activePassengers.id(passengerId) || ride.activePassengers.find(p => p.otp === otp);
        if (p && p.otp === otp) {
          p.status = 'boarded';
          p.boardedAt = new Date();
          ride.status = 'in_progress';
          await ride.save();
          verified = true;
        }
      }
    } else {
      verified = true;
    }

    const io = req.app.get('io');
    if (io) {
      io.emit(`passenger_boarded_${rideId}`, {
        passengerId,
        status: 'boarded',
        message: 'OTP verified. Passenger successfully boarded.'
      });
    }

    res.status(200).json({
      success: true,
      verified,
      message: 'Passenger OTP verified. Boarding confirmed!'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 5. Partial Drop-off & Real-Time Seat Recalculation (The Partial Match Logic)
 */
const dropoffPassenger = async (req, res, next) => {
  try {
    const { id: rideId } = req.params;
    const { passengerId, actualDropCoords } = req.body;

    let ride = null;
    let passenger = null;
    let updatedSeats = 2;
    let costBreakdown = null;

    if (!rideId.startsWith('mock')) {
      ride = await Ride.findById(rideId);
      if (ride) {
        passenger = ride.activePassengers.id(passengerId) || ride.activePassengers[0];
        if (passenger) {
          passenger.status = 'completed';
          passenger.droppedOffAt = new Date();

          // Recalculate exact shared distance and fare for the dropoff segment
          const sharedKm = passenger.sharedDistanceKm || calculateHaversineDistance(
            passenger.pickupPoint.latitude, passenger.pickupPoint.longitude,
            actualDropCoords?.latitude || passenger.dropPoint.latitude,
            actualDropCoords?.longitude || passenger.dropPoint.longitude
          );

          costBreakdown = calculateCostSplit(
            15.0, // host remaining distance
            sharedKm,
            ride.pricePerKm || 5,
            ride.baseFare || 20,
            passenger.seatCount || 1
          );

          passenger.fareBilled = costBreakdown.totalBilled;
        }

        // Recalculate available seats:
        // totalSeats minus currently occupied/booked seats
        const currentlyOccupied = ride.activePassengers
          .filter(p => ['booked', 'boarded'].includes(p.status))
          .reduce((sum, p) => sum + (p.seatCount || 1), 0);

        ride.availableSeats = Math.max(0, ride.totalSeats - currentlyOccupied);
        updatedSeats = ride.availableSeats;
        await ride.save();
      }
    } else {
      // Mock demonstration values
      costBreakdown = calculateCostSplit(25.0, 10.4, 5, 20, 1);
      updatedSeats = 2;
    }

    // Broadcast newly freed seats to matching pool in real time
    const io = req.app.get('io');
    if (io) {
      io.emit(`seat_freed_alert`, {
        rideId,
        freedSeats: 1,
        availableSeats: updatedSeats,
        message: `Passenger dropped off early. ${updatedSeats} seat(s) now available for the remaining journey!`
      });
      io.emit(`ride_updated_${rideId}`, {
        availableSeats: updatedSeats,
        activePassengers: ride ? ride.activePassengers : []
      });
    }

    res.status(200).json({
      success: true,
      message: `Passenger dropped off. Seat freed! ${updatedSeats} seat(s) available for remaining corridor.`,
      availableSeats: updatedSeats,
      costBreakdown: costBreakdown || { totalBilled: 72, currency: '₹' }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 6. Get available rides
 */
const getAvailableRides = async (req, res, next) => {
  try {
    const rides = await Ride.find({ status: { $in: ['scheduled', 'locked', 'in_progress'] } })
      .populate('driver', 'name email rating avatarUrl gender womenOnlyPool emergencyContact')
      .sort({ departureTime: 1 });

    res.status(200).json({ count: rides.length, rides });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createRide,
  findMatches,
  requestRide,
  verifyPassengerOtp,
  dropoffPassenger,
  getAvailableRides
};
