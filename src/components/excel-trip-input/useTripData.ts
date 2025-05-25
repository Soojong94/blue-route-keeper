
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { TripRow } from './TripRowData';
import { Vehicle, Location } from '@/types/trip';
import { getVehicles, getVehicleById } from '@/utils/vehicleStorage';
import { getLocations } from '@/utils/locationStorage';

export const useTripData = () => {
  const [rows, setRows] = useState<TripRow[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [departureLocations, setDepartureLocations] = useState<Location[]>([]);
  const [destinationLocations, setDestinationLocations] = useState<Location[]>([]);
  const [recentLocations, setRecentLocations] = useState<{
    departures: string[];
    destinations: string[];
  }>({
    departures: [],
    destinations: []
  });

  // Generate default values for a new row
  const createDefaultRow = (): TripRow => {
    const now = new Date();
    
    return {
      id: `row-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      date: format(now, 'yyyy-MM-dd'),
      vehicleId: '',
      departure: '',
      destination: '',
      amount: '',
      purpose: '1'
    };
  };

  // Load vehicles, locations and recent data on mount
  useEffect(() => {
    // Load vehicles
    setVehicles(getVehicles());
    
    // Load locations
    const allLocations = getLocations();
    setLocations(allLocations);
    setDepartureLocations(allLocations.filter(loc => loc.type === 'departure' || loc.type === 'both'));
    setDestinationLocations(allLocations.filter(loc => loc.type === 'destination' || loc.type === 'both'));
    
    // Load recent locations from localStorage
    const loadRecentLocations = () => {
      try {
        const savedTrips = JSON.parse(localStorage.getItem('car-trips') || '[]');
        
        const departuresFromStorage = savedTrips
          .map((trip: any) => trip.departure)
          .filter((place: unknown): place is string => typeof place === 'string')
          .filter((value: string, index: number, self: string[]) => self.indexOf(value) === index);
        
        const destinationsFromStorage = savedTrips
          .map((trip: any) => trip.destination)
          .filter((place: unknown): place is string => typeof place === 'string')
          .filter((value: string, index: number, self: string[]) => self.indexOf(value) === index);
        
        setRecentLocations({
          departures: departuresFromStorage,
          destinations: destinationsFromStorage
        });
      } catch (error) {
        console.error('Error loading recent locations:', error);
        setRecentLocations({ departures: [], destinations: [] });
      }
    };
    
    loadRecentLocations();
    
    // Add a default row if no rows exist
    if (rows.length === 0) {
      setRows([createDefaultRow()]);
    }
  }, []);

  // Add a new row to the table
  const addNewRow = () => {
    setRows([...rows, createDefaultRow()]);
  };
  
  // Remove a row from the table
  const removeRow = (id: string) => {
    setRows(rows.filter(row => row.id !== id));
  };
  
  // Handle cell value changes
  const handleChange = (id: string, field: keyof TripRow, value: string) => {
    setRows(
      rows.map(row => 
        row.id === id ? { ...row, [field]: value } : row
      )
    );
  };

  // Reset rows to single default row
  const resetRows = () => {
    setRows([createDefaultRow()]);
  };

  return {
    rows,
    vehicles,
    locations,
    departureLocations,
    destinationLocations,
    recentLocations,
    addNewRow,
    removeRow,
    handleChange,
    resetRows
  };
};
