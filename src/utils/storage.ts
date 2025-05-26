// src/utils/storage.ts
import { Trip, Vehicle, Location } from '@/types/trip';
import {
  saveSupabaseTrip,
  getSupabaseTrips,
  getSupabaseTripsByDateRange,
  updateSupabaseTrip,
  deleteSupabaseTrip,
  saveSupabaseVehicle,
  getSupabaseVehicles,
  updateSupabaseVehicle,
  deleteSupabaseVehicle,
  saveSupabaseLocation,
  getSupabaseLocations,
  updateSupabaseLocation,
  deleteSupabaseLocation,
} from './supabaseStorage';

// Trip 관련
export const saveTrip = saveSupabaseTrip;
export const getTrips = getSupabaseTrips;
export const getTripsByDateRange = getSupabaseTripsByDateRange;
export const updateTrip = updateSupabaseTrip;
export const deleteTrip = deleteSupabaseTrip;

// Vehicle 관련
export const saveVehicle = saveSupabaseVehicle;
export const getVehicles = getSupabaseVehicles;
export const updateVehicle = updateSupabaseVehicle;
export const deleteVehicle = deleteSupabaseVehicle;

// Location 관련
export const saveLocation = saveSupabaseLocation;
export const getLocations = getSupabaseLocations;
export const updateLocation = updateSupabaseLocation;
export const deleteLocation = deleteSupabaseLocation;