// src/types/trip.ts
export interface Trip {
  id: string;
  date: string;                    // 운행 날짜
  departure: string;               // 출발지
  destination: string;             // 목적지
  unitPrice: number;              // 단가 (원)
  count: number;                  // 횟수
  totalAmount: number;            // 총액 (unitPrice × count)
  vehicleId: string;              // 차량 ID
  driverName?: string;            // 운전자 (선택사항)
  memo?: string;                  // 메모
  createdAt: string;              // 생성일시
  updatedAt?: string;             // 수정일시
}

// src/types/trip.ts 수정
export interface Vehicle {
  id: string;
  name?: string;                   // 선택사항으로 변경 (? 추가)
  licensePlate: string;           // 번호판은 필수 유지
  defaultUnitPrice?: number;      // 기본 단가 설정
  createdAt: string;
}

export interface Location {
  id: string;
  name: string;                   // 장소명
  category: 'company' | 'client' | 'personal' | 'other';
  createdAt: string;
}

export interface VehicleStats {
  vehicle: Vehicle;
  totalTrips: number;
  totalAmount: number;
  avgUnitPrice: number;
  mostFrequentRoute?: {
    departure: string;
    destination: string;
    count: number;
  };
}

export interface PeriodStats {
  totalTrips: number;
  totalAmount: number;
  uniqueRoutes: number;
  topRoutes: Array<{
    departure: string;
    destination: string;
    totalCount: number;
    totalAmount: number;
  }>;
}