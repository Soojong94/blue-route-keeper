// src/utils/reportUtils.ts - 완전히 새로운 버전
import { Trip, Vehicle } from '@/types/trip';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

export interface DailyReportData {
  period: string;
  vehicleName: string;
  dailyTrips: {
    month: number;
    day: number;
    vehicleNumber: string;
    departure: string;
    destination: string;
    unitPrice: number;
    count: number;
    dailyTotal: number;
  }[];
  monthlyTotal: number;
}

// 새로운 월간 리포트 데이터 구조
export interface MonthlyReportRow {
  id: string;
  date: string;          // 날짜 (YYYY-MM-DD)
  item: string;          // 품목/항목명
  count: number;         // 횟수
  unitPrice: number;     // 단가
  totalAmount: number;   // 금액 (자동계산: count * unitPrice)
}

export interface MonthlyReportData {
  period: string;
  rows: MonthlyReportRow[];
  totalAmount: number;   // 전체 총액
  originalDepartureStats?: any[]; // 기존 출발지 통계 (참고용)
}

export const generateDailyReport = (
  trips: Trip[], 
  vehicles: Vehicle[], 
  startDate: Date, 
  endDate: Date,
  selectedVehicleId?: string
): DailyReportData => {
  // 차량별 필터링
  const filteredTrips = selectedVehicleId && selectedVehicleId !== 'all'
    ? trips.filter(trip => trip.vehicleId === selectedVehicleId)
    : trips;

  if (filteredTrips.length === 0) {
    return {
      period: '',
      vehicleName: '데이터 없음',
      dailyTrips: [],
      monthlyTotal: 0
    };
  }

  // 차량 정보 매핑
  const vehicleMap = new Map(vehicles.map(v => [v.id, `${v.licensePlate}${v.name ? ` (${v.name})` : ''}`]));

  // 선택된 차량 이름 결정
  let vehicleName = '전체 차량';
  if (selectedVehicleId && selectedVehicleId !== 'all') {
    const selectedVehicle = vehicles.find(v => v.id === selectedVehicleId);
    if (selectedVehicle) {
      vehicleName = `${selectedVehicle.licensePlate}${selectedVehicle.name ? ` (${selectedVehicle.name})` : ''}`;
    }
  }

  // 날짜별 운행 데이터 생성
  const dailyTrips = filteredTrips.map(trip => {
    const tripDate = new Date(trip.date);
    const vehicleNumber = vehicleMap.get(trip.vehicleId) || '알 수 없음';
    
    return {
      month: tripDate.getMonth() + 1,
      day: tripDate.getDate(),
      vehicleNumber,
      departure: trip.departure,
      destination: trip.destination,
      unitPrice: trip.unitPrice,
      count: trip.count,
      dailyTotal: trip.totalAmount
    };
  }).sort((a, b) => {
    // 월, 일 순으로 정렬
    if (a.month !== b.month) return a.month - b.month;
    return a.day - b.day;
  });

  // 총액 계산
  const monthlyTotal = dailyTrips.reduce((sum, trip) => sum + trip.dailyTotal, 0);

  // 기간 계산
  const isSameDate = format(startDate, 'yyyy-MM-dd') === format(endDate, 'yyyy-MM-dd');
  const period = isSameDate 
    ? format(startDate, 'yyyy년 MM월 dd일', { locale: ko })
    : `${format(startDate, 'yyyy년 MM월 dd일', { locale: ko })} ~ ${format(endDate, 'MM월 dd일', { locale: ko })}`;

  return {
    period,
    vehicleName,
    dailyTrips,
    monthlyTotal
  };
};

// 새로운 월간 리포트 생성 함수
export const generateMonthlyReport = (trips: Trip[]): MonthlyReportData => {
  if (trips.length === 0) {
    return {
      period: '',
      rows: [],
      totalAmount: 0,
      originalDepartureStats: []
    };
  }

  // 기존 출발지별 집계 (참고용으로 보관)
  const departureStats = new Map<string, { totalCount: number; totalAmount: number }>();

  trips.forEach(trip => {
    if (departureStats.has(trip.departure)) {
      const existing = departureStats.get(trip.departure)!;
      existing.totalCount += trip.count;
      existing.totalAmount += trip.totalAmount;
    } else {
      departureStats.set(trip.departure, {
        totalCount: trip.count,
        totalAmount: trip.totalAmount
      });
    }
  });

  const originalDepartureStats = Array.from(departureStats.entries()).map(([departure, stats]) => ({
    departure,
    totalCount: stats.totalCount,
    totalAmount: stats.totalAmount
  })).sort((a, b) => b.totalAmount - a.totalAmount);

  // 기본 그리드 행들 생성 (날짜별로 정리)
  const sortedTrips = trips.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const rows: MonthlyReportRow[] = [];

  // 날짜별로 그룹화하여 행 생성
  const dateGroups = new Map<string, Trip[]>();
  sortedTrips.forEach(trip => {
    const date = trip.date;
    if (!dateGroups.has(date)) {
      dateGroups.set(date, []);
    }
    dateGroups.get(date)!.push(trip);
  });

  // 각 날짜별로 행 생성
  Array.from(dateGroups.entries()).forEach(([date, tripsOnDate]) => {
    tripsOnDate.forEach((trip, index) => {
      const item = `${trip.departure} → ${trip.destination}`;
      rows.push({
        id: `${trip.id}-${index}`,
        date: date,
        item: item,
        count: trip.count,
        unitPrice: trip.unitPrice,
        totalAmount: trip.totalAmount
      });
    });
  });

  // 빈 행들 추가 (최소 3개 빈 행)
  for (let i = 0; i < 3; i++) {
    rows.push({
      id: `empty-${Date.now()}-${i}`,
      date: '',
      item: '',
      count: 0,
      unitPrice: 0,
      totalAmount: 0
    });
  }

  // 기간 계산
  const dates = trips.map(t => new Date(t.date)).sort((a, b) => a.getTime() - b.getTime());
  const startDate = dates[0];
  const endDate = dates[dates.length - 1];
  const period = startDate.getMonth() === endDate.getMonth() 
    ? format(startDate, 'yyyy년 MM월', { locale: ko })
    : `${format(startDate, 'yyyy년 MM월', { locale: ko })} ~ ${format(endDate, 'yyyy년 MM월', { locale: ko })}`;

  const totalAmount = rows.reduce((sum, row) => sum + row.totalAmount, 0);

  return {
    period,
    rows,
    totalAmount,
    originalDepartureStats
  };
};

// 유틸리티 함수들
export const createEmptyMonthlyReportRow = (): MonthlyReportRow => ({
  id: `empty-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  date: '',
  item: '',
  count: 0,
  unitPrice: 0,
  totalAmount: 0
});

export const calculateRowTotal = (count: number, unitPrice: number): number => {
  return count * unitPrice;
};

export const updateRowCalculation = (row: MonthlyReportRow): MonthlyReportRow => ({
  ...row,
  totalAmount: calculateRowTotal(row.count, row.unitPrice)
});