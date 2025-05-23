
export interface Trip {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  departure: string;
  destination: string;
  amount: number;
  vehicleId: string;
  driverName: string;
  purpose: string;
  createdAt: string;
}

export interface TripSummary {
  totalTrips: number;
  totalAmount: number;
  trips: Trip[];
}

export interface Vehicle {
  id: string;
  name: string;
  licensePlate: string;
  createdAt: string;
}

export interface VehicleStats {
  totalTrips: number;
  totalAmount: number;
}
