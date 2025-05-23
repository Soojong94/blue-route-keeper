
export interface Trip {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  departure: string;
  destination: string;
  amount: number;
  createdAt: string;
}

export interface TripSummary {
  totalTrips: number;
  totalAmount: number;
  trips: Trip[];
}
