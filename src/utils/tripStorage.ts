
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
