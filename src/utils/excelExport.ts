
import { format } from 'date-fns';
import { Trip, Vehicle } from '@/types/trip';

/**
 * Convert JSON data to CSV format
 */
export const convertToCSV = (trips: Trip[], vehicles: Vehicle[]): string => {
  // Define headers
  const headers = [
    '날짜',
    '운전자',
    '차량',
    '차량번호',
    '출발시간',
    '도착시간',
    '출발지',
    '목적지',
    '금액(원)',
    '메모'
  ];
  
  // Convert data to CSV rows
  const rows = trips.map(trip => {
    const vehicle = vehicles.find(v => v.id === trip.vehicleId);
    return [
      trip.date,
      trip.driverName,
      vehicle ? vehicle.name : '-',
      vehicle ? vehicle.licensePlate : '-',
      trip.startTime,
      trip.endTime,
      trip.departure,
      trip.destination,
      trip.amount.toString(),
      trip.purpose || ''
    ].map(value => `"${value}"`).join(',');
  });
  
  // Combine headers and rows
  return [
    headers.join(','),
    ...rows
  ].join('\n');
};

/**
 * Export trips data to CSV file and trigger download
 */
export const exportToCSV = (trips: Trip[], vehicles: Vehicle[]): void => {
  // Convert data to CSV
  const csv = convertToCSV(trips, vehicles);
  
  // Create blob and download link
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  
  // Set up download attributes
  const now = new Date();
  const timestamp = format(now, 'yyyyMMdd_HHmmss');
  link.setAttribute('href', url);
  link.setAttribute('download', `운행기록_${timestamp}.csv`);
  
  // Trigger download and cleanup
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
