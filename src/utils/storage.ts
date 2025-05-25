// src/utils/storage.ts
import { Trip, Vehicle, Location } from '@/types/trip';

const TRIPS_KEY = 'car-trips';
const VEHICLES_KEY = 'car-vehicles';
const LOCATIONS_KEY = 'car-locations';

// Trip 관련
// Trip 관련
export const saveTrip = (tripData: {
  date: string;
  departure: string;
  destination: string;
  unitPrice: number;
  count: number;
  vehicleId: string;
  driverName?: string;
  memo?: string;
}): Trip => {
  const trips = getTrips();
  const newTrip: Trip = {
    id: crypto.randomUUID(),
    date: tripData.date,
    departure: tripData.departure,
    destination: tripData.destination,
    unitPrice: tripData.unitPrice,
    count: tripData.count,
    totalAmount: tripData.unitPrice * tripData.count, // 자동 계산
    vehicleId: tripData.vehicleId,
    driverName: tripData.driverName,
    memo: tripData.memo,
    createdAt: new Date().toISOString(),
  };
  
  trips.push(newTrip);
  localStorage.setItem(TRIPS_KEY, JSON.stringify(trips));
  return newTrip;
};

export const getTrips = (): Trip[] => {
  const stored = localStorage.getItem(TRIPS_KEY);
  return stored ? JSON.parse(stored) : [];
};

export const getTripsByDateRange = (startDate: Date, endDate: Date): Trip[] => {
  const trips = getTrips();
  return trips.filter(trip => {
    const tripDate = new Date(trip.date);
    
    // 시간을 00:00:00으로 설정하여 날짜만 비교
    const tripDateOnly = new Date(tripDate.getFullYear(), tripDate.getMonth(), tripDate.getDate());
    const startDateOnly = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    const endDateOnly = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
    
    // 시작일과 종료일을 포함하여 비교 (>= startDate && <= endDate)
    return tripDateOnly >= startDateOnly && tripDateOnly <= endDateOnly;
  });
};

export const updateTrip = (id: string, updates: Partial<Omit<Trip, 'id' | 'createdAt'>>): Trip | undefined => {
  const trips = getTrips();
  const index = trips.findIndex(trip => trip.id === id);
  
  if (index !== -1) {
    const updatedTrip = { 
      ...trips[index], 
      ...updates,
      totalAmount: (updates.unitPrice || trips[index].unitPrice) * (updates.count || trips[index].count),
      updatedAt: new Date().toISOString()
    };
    trips[index] = updatedTrip;
    localStorage.setItem(TRIPS_KEY, JSON.stringify(trips));
    return updatedTrip;
  }
  
  return undefined;
};

export const deleteTrip = (id: string): void => {
  const trips = getTrips().filter(trip => trip.id !== id);
  localStorage.setItem(TRIPS_KEY, JSON.stringify(trips));
};

// Vehicle 관련
export const saveVehicle = (vehicle: Omit<Vehicle, 'id' | 'createdAt'>): Vehicle => {
  const vehicles = getVehicles();
  const newVehicle: Vehicle = {
    ...vehicle,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  
  vehicles.push(newVehicle);
  localStorage.setItem(VEHICLES_KEY, JSON.stringify(vehicles));
  return newVehicle;
};

export const getVehicles = (): Vehicle[] => {
  const stored = localStorage.getItem(VEHICLES_KEY);
  return stored ? JSON.parse(stored) : [];
};

export const updateVehicle = (id: string, updates: Partial<Omit<Vehicle, 'id' | 'createdAt'>>): Vehicle | undefined => {
  const vehicles = getVehicles();
  const index = vehicles.findIndex(v => v.id === id);
  
  if (index !== -1) {
    vehicles[index] = { ...vehicles[index], ...updates };
    localStorage.setItem(VEHICLES_KEY, JSON.stringify(vehicles));
    return vehicles[index];
  }
  
  return undefined;
};

export const deleteVehicle = (id: string): void => {
  const vehicles = getVehicles().filter(vehicle => vehicle.id !== id);
  localStorage.setItem(VEHICLES_KEY, JSON.stringify(vehicles));
};

// Location 관련
export const saveLocation = (location: Omit<Location, 'id' | 'createdAt'>): Location => {
  const locations = getLocations();
  const newLocation: Location = {
    ...location,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  
  locations.push(newLocation);
  localStorage.setItem(LOCATIONS_KEY, JSON.stringify(locations));
  return newLocation;
};

export const getLocations = (): Location[] => {
  const stored = localStorage.getItem(LOCATIONS_KEY);
  return stored ? JSON.parse(stored) : [];
};

export const updateLocation = (id: string, updates: Partial<Omit<Location, 'id' | 'createdAt'>>): Location | undefined => {
  const locations = getLocations();
  const index = locations.findIndex(l => l.id === id);
  
  if (index !== -1) {
    locations[index] = { ...locations[index], ...updates };
    localStorage.setItem(LOCATIONS_KEY, JSON.stringify(locations));
    return locations[index];
  }
  
  return undefined;
};

export const deleteLocation = (id: string): void => {
  const locations = getLocations().filter(location => location.id !== id);
  localStorage.setItem(LOCATIONS_KEY, JSON.stringify(locations));
};