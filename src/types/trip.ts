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
  mainDriver?: string;
  drivers?: string[];
}

export interface VehicleStats {
  totalTrips: number;
  totalAmount: number;
}

export interface Location {
  id: string;
  name: string;
  alias?: string;
  category: 'company' | 'client' | 'personal' | 'other';
  type: 'departure' | 'destination' | 'both';
  createdAt: string;
}

export interface LocationStats {
  totalTrips: number;
}
