
import { Trip } from '@/types/trip';

const STORAGE_KEY = 'car-trips';

export const saveTrip = (trip: Omit<Trip, 'id' | 'createdAt'>): Trip => {
  const trips = getTrips();
  const newTrip: Trip = {
    ...trip,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  
  trips.push(newTrip);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trips));
  return newTrip;
};

export const getTrips = (): Trip[] => {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
};

export const getTripsByDateRange = (startDate: Date, endDate: Date): Trip[] => {
  const trips = getTrips();
  return trips.filter(trip => {
    const tripDate = new Date(trip.date);
    return tripDate >= startDate && tripDate <= endDate;
  });
};

export const deleteTrip = (id: string): void => {
  const trips = getTrips().filter(trip => trip.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trips));
};

export const updateTrip = (id: string, updates: Partial<Omit<Trip, 'id' | 'createdAt'>>): Trip | undefined => {
  const trips = getTrips();
  const index = trips.findIndex(trip => trip.id === id);
  
  if (index !== -1) {
    trips[index] = { ...trips[index], ...updates };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trips));
    return trips[index];
  }
  
  return undefined;
};

export const searchTrips = (query: string): Trip[] => {
  const trips = getTrips();
  const lowercaseQuery = query.toLowerCase();
  
  return trips.filter(trip => 
    trip.destination.toLowerCase().includes(lowercaseQuery) ||
    trip.driverName.toLowerCase().includes(lowercaseQuery) ||
    trip.purpose.toLowerCase().includes(lowercaseQuery)
  );
};

export const getTripsByVehicle = (vehicleId: string): Trip[] => {
  return getTrips().filter(trip => trip.vehicleId === vehicleId);
};
