
import { Vehicle, VehicleStats } from '@/types/trip';
import { getTrips } from './tripStorage';

const STORAGE_KEY = 'car-vehicles';

export const saveVehicle = (vehicle: Omit<Vehicle, 'id' | 'createdAt'>): Vehicle => {
  const vehicles = getVehicles();
  const newVehicle: Vehicle = {
    ...vehicle,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  
  vehicles.push(newVehicle);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(vehicles));
  return newVehicle;
};

export const getVehicles = (): Vehicle[] => {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
};

export const updateVehicle = (id: string, updates: Partial<Omit<Vehicle, 'id' | 'createdAt'>>): Vehicle | undefined => {
  const vehicles = getVehicles();
  const index = vehicles.findIndex(v => v.id === id);
  
  if (index !== -1) {
    vehicles[index] = { ...vehicles[index], ...updates };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(vehicles));
    return vehicles[index];
  }
  
  return undefined;
};

export const deleteVehicle = (id: string): boolean => {
  const vehicles = getVehicles().filter(vehicle => vehicle.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(vehicles));
  return true;
};

export const getVehicleById = (id: string): Vehicle | undefined => {
  return getVehicles().find(vehicle => vehicle.id === id);
};

export const getVehicleStats = (vehicleId: string): VehicleStats => {
  const trips = getTrips().filter(trip => trip.vehicleId === vehicleId);
  
  return {
    totalTrips: trips.length,
    totalAmount: trips.reduce((sum, trip) => sum + trip.amount, 0),
  };
};

export const getDriversForVehicle = (vehicleId: string): string[] => {
  const vehicle = getVehicleById(vehicleId);
  const drivers: string[] = [];
  
  if (vehicle) {
    if (vehicle.mainDriver) {
      drivers.push(vehicle.mainDriver);
    }
    if (vehicle.drivers) {
      drivers.push(...vehicle.drivers);
    }
  }
  
  return drivers;
};

export const getAllRegisteredDrivers = (): string[] => {
  const vehicles = getVehicles();
  const drivers = new Set<string>();
  
  vehicles.forEach(vehicle => {
    if (vehicle.mainDriver) {
      drivers.add(vehicle.mainDriver);
    }
    if (vehicle.drivers) {
      vehicle.drivers.forEach(driver => drivers.add(driver));
    }
  });
  
  return Array.from(drivers);
};
