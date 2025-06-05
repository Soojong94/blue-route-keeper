// src/utils/reportUtils.ts (월간보고서 관련 코드 제거)
import { Trip, Vehicle } from '@/types/trip';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

// 기존 일간보고서 인터페이스 유지
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

// 청구서 인터페이스들
export interface InvoiceReportRow {
  id: string;
  date: string;          // 날짜 (YYYY-MM-DD)
  item: string;          // 품목
  direction: '반입' | '반출';  // 반입/반출 (기본값: 반출)
  count: number;         // 횟수
  unitPrice: number;     // 단가
  amount: number;        // 금액 (자동계산: count * unitPrice)
  memo: string;          // 비고
}

export interface InvoiceSiteInfo {
  siteName: string;      // 현장명
  registrationNumber: string; // 등록번호
  companyName: string;   // 상호
  ownerName: string;     // 성명
  address: string;       // 사업장 주소
  businessType: string;  // 업태
  businessCategory: string; // 종목
}

export interface InvoiceReportData {
  title: string;         // "5월 청구서" 등
  siteInfo: InvoiceSiteInfo;
  rows: InvoiceReportRow[];
  totalCount: number;    // 총 횟수
  totalAmount: number;   // 총액
}

// 청구서 관련 유틸리티 함수들
export const createEmptyInvoiceRow = (): InvoiceReportRow => ({
  id: `invoice-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  date: '',
  item: '',
  direction: '반출', // 기본값
  count: 0,
  unitPrice: 0,
  amount: 0,
  memo: ''
});

export const calculateInvoiceRowAmount = (count: number, unitPrice: number): number => {
  return count * unitPrice;
};

export const updateInvoiceRowCalculation = (row: InvoiceReportRow): InvoiceReportRow => ({
  ...row,
  amount: calculateInvoiceRowAmount(row.count, row.unitPrice)
});

export const createEmptyInvoiceData = (title: string = ''): InvoiceReportData => ({
  title: title || `${new Date().getMonth() + 1}월 청구서`,
  siteInfo: {
    siteName: '',
    registrationNumber: '',
    companyName: '',
    ownerName: '',
    address: '',
    businessType: '',
    businessCategory: ''
  },
  rows: Array(10).fill(null).map(() => createEmptyInvoiceRow()), // 기본 10행
  totalCount: 0,
  totalAmount: 0
});

// 일간보고서 생성 함수 유지
export const generateDailyReport = (
  trips: Trip[], 
  vehicles: Vehicle[], 
  startDate: Date, 
  endDate: Date,
  selectedVehicleId?: string,
  filters?: {
    departureFilter?: string;
    destinationFilter?: string;
  }
): DailyReportData => {
  let filteredTrips = selectedVehicleId && selectedVehicleId !== 'all'
    ? trips.filter(trip => trip.vehicleId === selectedVehicleId)
    : trips;

  if (filters?.departureFilter) {
    filteredTrips = filteredTrips.filter(trip => 
      trip.departure.toLowerCase().includes(filters.departureFilter!.toLowerCase())
    );
  }

  if (filters?.destinationFilter) {
    filteredTrips = filteredTrips.filter(trip => 
      trip.destination.toLowerCase().includes(filters.destinationFilter!.toLowerCase())
    );
  }

  if (filteredTrips.length === 0) {
    return {
      period: '',
      vehicleName: '데이터 없음',
      dailyTrips: [],
      monthlyTotal: 0
    };
  }

  const vehicleMap = new Map(vehicles.map(v => [v.id, `${v.licensePlate}${v.name ? ` (${v.name})` : ''}`]));

  let vehicleName = '전체 차량';
  if (selectedVehicleId && selectedVehicleId !== 'all') {
    const selectedVehicle = vehicles.find(v => v.id === selectedVehicleId);
    if (selectedVehicle) {
      vehicleName = `${selectedVehicle.licensePlate}${selectedVehicle.name ? ` (${selectedVehicle.name})` : ''}`;
    }
  }

  if (filters?.departureFilter || filters?.destinationFilter) {
    const filterParts = [];
    if (filters.departureFilter) filterParts.push(`출발지: ${filters.departureFilter}`);
    if (filters.destinationFilter) filterParts.push(`목적지: ${filters.destinationFilter}`);
    vehicleName += ` (${filterParts.join(', ')})`;
  }

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
    if (a.month !== b.month) return a.month - b.month;
    return a.day - b.day;
  });

  const monthlyTotal = dailyTrips.reduce((sum, trip) => sum + trip.dailyTotal, 0);

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