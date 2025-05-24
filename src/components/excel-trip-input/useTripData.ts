
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
  const [recentDrivers, setRecentDrivers] = useState<string[]>([]);
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
    const defaultStartTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
    const defaultEndTime = `${String(oneHourLater.getHours()).padStart(2, '0')}:${String(oneHourLater.getMinutes()).padStart(2, '0')}`;
    
    return {
      id: `row-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      date: format(now, 'yyyy-MM-dd'),
      driverName: '',
      vehicleId: '',
      startTime: defaultStartTime,
      endTime: defaultEndTime,
      departure: '',
      destination: '',
      amount: '',
      purpose: ''
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
    
    // Load recent drivers from localStorage
    const loadRecentDrivers = () => {
      try {
        const savedTrips = JSON.parse(localStorage.getItem('car-trips') || '[]');
        const driversList = savedTrips
          .map((trip: any) => trip.driverName)
          .filter((driver: unknown): driver is string => typeof driver === 'string')
          .filter((value: string, index: number, self: string[]) => self.indexOf(value) === index);
        
        setRecentDrivers(driversList);
      } catch (error) {
        console.error('Error loading recent drivers:', error);
        setRecentDrivers([]);
      }
    };
    
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
    
    loadRecentDrivers();
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
    if (field === 'vehicleId' && value) {
      // If a vehicle is selected, get its main driver
      const vehicle = getVehicleById(value);
      if (vehicle && vehicle.mainDriver) {
        // Update the row with the vehicle's main driver if driver is not already set
        setRows(
          rows.map(row => 
            row.id === id ? { 
              ...row, 
              [field]: value,
              driverName: row.driverName ? row.driverName : vehicle.mainDriver || ''
            } : row
          )
        );
        return;
      }
    }
    
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
    recentDrivers,
    recentLocations,
    addNewRow,
    removeRow,
    handleChange,
    resetRows
  };
};
