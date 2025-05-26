// src/utils/calculations.ts
import { Trip, Vehicle, VehicleStats, PeriodStats } from '@/types/trip';

export const calculateTotalAmount = (unitPrice: number, count: number): number => {
  return unitPrice * count;
};

export const getVehicleStats = (vehicleId: string, trips: Trip[], vehicles: Vehicle[]): VehicleStats | null => {
  const vehicle = vehicles.find((v: Vehicle) => v.id === vehicleId);
  
  if (!vehicle) return null;

  const vehicleTrips = trips.filter(trip => trip.vehicleId === vehicleId);
  
  if (vehicleTrips.length === 0) {
    return {
      vehicle,
      totalTrips: 0,
      totalAmount: 0,
      avgUnitPrice: 0,
    };
  }

  const totalAmount = vehicleTrips.reduce((sum, trip) => sum + trip.totalAmount, 0);
  const avgUnitPrice = vehicleTrips.reduce((sum, trip) => sum + trip.unitPrice, 0) / vehicleTrips.length;

  // 가장 빈번한 경로 찾기
  const routeCount = new Map<string, { departure: string; destination: string; count: number }>();
  vehicleTrips.forEach(trip => {
    const routeKey = `${trip.departure}-${trip.destination}`;
    const existing = routeCount.get(routeKey);
    if (existing) {
      existing.count += trip.count;
    } else {
      routeCount.set(routeKey, {
        departure: trip.departure,
        destination: trip.destination,
        count: trip.count
      });
    }
  });

  const mostFrequentRoute = Array.from(routeCount.values())
    .sort((a, b) => b.count - a.count)[0];

  return {
    vehicle,
    totalTrips: vehicleTrips.reduce((sum, trip) => sum + trip.count, 0),
    totalAmount,
    avgUnitPrice,
    mostFrequentRoute,
  };
};

export const getPeriodStats = (trips: Trip[]): PeriodStats => {
  const totalTrips = trips.reduce((sum, trip) => sum + trip.count, 0);
  const totalAmount = trips.reduce((sum, trip) => sum + trip.totalAmount, 0);

  // 고유 경로 계산
  const uniqueRoutes = new Set(trips.map(trip => `${trip.departure}-${trip.destination}`)).size;

  // 상위 경로 계산
  const routeStats = new Map<string, { departure: string; destination: string; totalCount: number; totalAmount: number }>();
  
  trips.forEach(trip => {
    const routeKey = `${trip.departure}-${trip.destination}`;
    const existing = routeStats.get(routeKey);
    if (existing) {
      existing.totalCount += trip.count;
      existing.totalAmount += trip.totalAmount;
    } else {
      routeStats.set(routeKey, {
        departure: trip.departure,
        destination: trip.destination,
        totalCount: trip.count,
        totalAmount: trip.totalAmount
      });
    }
  });

  const topRoutes = Array.from(routeStats.values())
    .sort((a, b) => b.totalAmount - a.totalAmount)
    .slice(0, 5);

  return {
    totalTrips,
    totalAmount,
    uniqueRoutes,
    topRoutes,
  };
};