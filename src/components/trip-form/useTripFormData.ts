
import { useState, useEffect } from 'react';
import { Vehicle, Location } from '@/types/trip';
import { getVehicles } from '@/utils/vehicleStorage';
import { getLocations } from '@/utils/locationStorage';

export const useTripFormData = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [departureLocations, setDepartureLocations] = useState<Location[]>([]);
  const [destinationLocations, setDestinationLocations] = useState<Location[]>([]);
  const [recentDrivers, setRecentDrivers] = useState<string[]>([]);
  const [recentLocations, setRecentLocations] = useState<{departures: string[], destinations: string[]}>({
    departures: [],
    destinations: []
  });

  useEffect(() => {
    // Load all vehicles
    setVehicles(getVehicles());

    // Load all locations
    const allLocations = getLocations();
    setLocations(allLocations);
    setDepartureLocations(allLocations.filter(loc => loc.type === 'departure' || loc.type === 'both'));
    setDestinationLocations(allLocations.filter(loc => loc.type === 'destination' || loc.type === 'both'));
    
    // Load recent drivers from localStorage
    const loadRecentDrivers = () => {
      try {
        const savedTrips = JSON.parse(localStorage.getItem('car-trips') || '[]');
        const drivers = savedTrips
          .map((trip: any) => trip.driverName)
          .filter((driver: unknown): driver is string => typeof driver === 'string')
          .filter((value: string, index: number, self: string[]) => self.indexOf(value) === index);
        
        setRecentDrivers(drivers);
      } catch (error) {
        console.error('Error loading recent drivers:', error);
        setRecentDrivers([]);
      }
    };
    
    // Load recent locations from localStorage
    const loadRecentLocations = () => {
      try {
        const savedTrips = JSON.parse(localStorage.getItem('car-trips') || '[]');
        
        const departures = savedTrips
          .map((trip: any) => trip.departure)
          .filter((place: unknown): place is string => typeof place === 'string')
          .filter((value: string, index: number, self: string[]) => self.indexOf(value) === index);
        
        const destinations = savedTrips
          .map((trip: any) => trip.destination)
          .filter((place: unknown): place is string => typeof place === 'string')
          .filter((value: string, index: number, self: string[]) => self.indexOf(value) === index);
        
        setRecentLocations({
          departures,
          destinations
        });
      } catch (error) {
        console.error('Error loading recent locations:', error);
        setRecentLocations({ departures: [], destinations: [] });
      }
    };
    
    loadRecentDrivers();
    loadRecentLocations();
  }, []);

  return {
    vehicles,
    locations,
    departureLocations,
    destinationLocations,
    recentDrivers,
    recentLocations
  };
};
