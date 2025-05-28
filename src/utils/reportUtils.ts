// src/utils/reportUtils.ts 수정
import { Trip, Vehicle } from '@/types/trip';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

export interface DailyReportData {
  date: string;
  departureGroups: {
    departure: string;
    destinations: {
      destination: string;
      vehicle: string;
      count: number;
    }[];
  }[];
}

export interface MonthlyReportData {
  period: string;
  departureStats: {
    departure: string;
    totalCount: number;
    totalAmount: number;
    customUnitPrice?: number;
    calculatedAmount?: number;
  }[];
}

export const generateDailyReport = (
  trips: Trip[], 
  vehicles: Vehicle[], 
  startDate: Date, 
  endDate: Date
): DailyReportData => {
  if (trips.length === 0) {
    return {
      date: '',
      departureGroups: []
    };
  }

  // 차량 정보 매핑
  const vehicleMap = new Map(vehicles.map(v => [v.id, `${v.licensePlate}${v.name ? ` (${v.name})` : ''}`]));

  // 출발지별로 그룹핑
  const departureGroups = new Map<string, Map<string, { vehicle: string; count: number }>>();

  trips.forEach(trip => {
    const vehicleName = vehicleMap.get(trip.vehicleId) || '알 수 없음';
    
    if (!departureGroups.has(trip.departure)) {
      departureGroups.set(trip.departure, new Map());
    }
    
    const destinations = departureGroups.get(trip.departure)!;
    const key = `${trip.destination}-${vehicleName}`;
    
    if (destinations.has(key)) {
      destinations.get(key)!.count += trip.count;
    } else {
      destinations.set(key, {
        vehicle: vehicleName,
        count: trip.count
      });
    }
  });

  // 날짜 범위 계산
  const isSameDate = format(startDate, 'yyyy-MM-dd') === format(endDate, 'yyyy-MM-dd');
  const dateString = isSameDate 
    ? format(startDate, 'yyyy년 MM월 dd일', { locale: ko })
    : `${format(startDate, 'yyyy년 MM월 dd일', { locale: ko })}~${format(endDate, 'dd일', { locale: ko })}`;

  // 데이터 변환
  const result: DailyReportData = {
    date: dateString,
    departureGroups: Array.from(departureGroups.entries()).map(([departure, destinations]) => ({
      departure,
      destinations: Array.from(destinations.entries()).map(([key, data]) => {
        const destination = key.split('-')[0];
        return {
          destination,
          vehicle: data.vehicle,
          count: data.count
        };
      }).sort((a, b) => a.destination.localeCompare(b.destination))
    })).sort((a, b) => a.departure.localeCompare(b.departure))
  };

  return result;
};

export const generateMonthlyReport = (trips: Trip[]): MonthlyReportData => {
  if (trips.length === 0) {
    return {
      period: '',
      departureStats: []
    };
  }

  // 출발지별 집계
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

  // 기간 계산
  const dates = trips.map(t => new Date(t.date)).sort((a, b) => a.getTime() - b.getTime());
  const startDate = dates[0];
  const endDate = dates[dates.length - 1];
  const period = startDate.getMonth() === endDate.getMonth() 
    ? format(startDate, 'yyyy년 MM월', { locale: ko })
    : `${format(startDate, 'yyyy년 MM월', { locale: ko })} ~ ${format(endDate, 'yyyy년 MM월', { locale: ko })}`;

  return {
    period,
    departureStats: Array.from(departureStats.entries()).map(([departure, stats]) => ({
      departure,
      totalCount: stats.totalCount,
      totalAmount: stats.totalAmount
    })).sort((a, b) => b.totalAmount - a.totalAmount)
  };
};