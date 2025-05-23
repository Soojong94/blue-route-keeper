
import { Location, LocationStats } from '@/types/trip';
import { getTrips } from './tripStorage';

const STORAGE_KEY = 'car-locations';

export const saveLocation = (location: Omit<Location, 'id' | 'createdAt'>): Location => {
  const locations = getLocations();
  const newLocation: Location = {
    ...location,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  
  locations.push(newLocation);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(locations));
  return newLocation;
};

export const getLocations = (): Location[] => {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
};

export const updateLocation = (id: string, updates: Partial<Omit<Location, 'id' | 'createdAt'>>): Location | undefined => {
  const locations = getLocations();
  const index = locations.findIndex(l => l.id === id);
  
  if (index !== -1) {
    locations[index] = { ...locations[index], ...updates };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(locations));
    return locations[index];
  }
  
  return undefined;
};

export const deleteLocation = (id: string): boolean => {
  const locations = getLocations().filter(location => location.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(locations));
  return true;
};

export const getLocationById = (id: string): Location | undefined => {
  return getLocations().find(location => location.id === id);
};

export const getLocationsByType = (type: 'departure' | 'destination' | 'both'): Location[] => {
  return getLocations().filter(location => location.type === type || location.type === 'both');
};

export const getLocationsByCategory = (category: string): Location[] => {
  return getLocations().filter(location => location.category === category);
};

export const getLocationStats = (locationId: string): LocationStats => {
  const trips = getTrips();
  const departureTrips = trips.filter(trip => trip.departure === locationId).length;
  const destinationTrips = trips.filter(trip => trip.destination === locationId).length;
  
  return {
    totalTrips: departureTrips + destinationTrips,
  };
};
