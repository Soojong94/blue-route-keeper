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
  findSupabaseVehicleByLicensePlate,
  searchSupabaseVehiclesByLicensePlate,
  findSupabaseLocationByName,
  ensureSupabaseLocationExists,
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

// Vehicle 검색 관련
export const findVehicleByLicensePlate = findSupabaseVehicleByLicensePlate;
export const searchVehiclesByLicensePlate = searchSupabaseVehiclesByLicensePlate;

// 차량 번호로 기존 차량 찾기 또는 새 차량 생성
export const ensureVehicleExists = async (licensePlate: string): Promise<string> => {
  if (!licensePlate.trim()) {
    throw new Error('차량번호가 없습니다.');
  }

  // 먼저 기존 차량 찾기
  let existingVehicle = await findVehicleByLicensePlate(licensePlate);

  if (existingVehicle) {
    return existingVehicle.id;
  }

  // 없으면 새로 생성
  try {
    const newVehicle = await saveVehicle({
      licensePlate: licensePlate,
    });

    console.log(`✅ 새 차량 '${licensePlate}' 자동 등록 완료`);

    return newVehicle.id;
  } catch (error) {
    console.error('Error creating new vehicle:', error);
    throw new Error(`차량 ${licensePlate} 생성 중 오류가 발생했습니다.`);
  }
};

// Location 관련
export const saveLocation = saveSupabaseLocation;
export const getLocations = getSupabaseLocations;
export const updateLocation = updateSupabaseLocation;
export const deleteLocation = deleteSupabaseLocation;

// Location 검색 관련
export const findLocationByName = findSupabaseLocationByName;
export const ensureLocationExists = ensureSupabaseLocationExists;