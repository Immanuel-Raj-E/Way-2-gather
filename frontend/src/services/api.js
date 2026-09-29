import axios from 'axios';
import { io } from 'socket.io-client';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
const SOCKET_URL = import.meta.env.VITE_API_BASE_URL ? import.meta.env.VITE_API_BASE_URL.replace('/api', '') : 'http://localhost:5000';

export const socket = io(SOCKET_URL, {
  autoConnect: true,
  reconnection: true
});

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor to attach JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('syncride_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authService = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (data) => api.post('/auth/register', data),
  getProfile: () => api.get('/auth/profile')
};

export const userService = {
  verifyKyc: (userId, kycData) => api.post(`/users/${userId}/verify-kyc`, kycData),
  getUserProfile: (userId) => api.get(`/users/${userId}/profile`)
};

export const reviewService = {
  submitReview: (reviewData) => api.post('/reviews/submit', reviewData),
  getUserReviews: (userId) => api.get(`/reviews/user/${userId}`)
};

export const rideService = {
  getAvailableRides: () => api.get('/rides'),
  findMatches: (requestData) => api.post('/rides/match', requestData),
  createRide: (rideData) => api.post('/rides/create', rideData),
  requestRide: (data) => api.post('/rides/request', data),
  verifyPassengerOtp: (rideId, data) => api.post(`/rides/${rideId}/verify-passenger-otp`, data),
  dropoffPassenger: (rideId, data) => api.post(`/rides/${rideId}/dropoff`, data)
};

export const safetyService = {
  triggerSos: (sosData) => api.post('/safety/sos', sosData)
};

export default api;
