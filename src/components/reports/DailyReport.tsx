// src/components/reports/DailyReport.tsx (필터 표시 부분 제거)
import React, { useState, useEffect, useCallback } from 'react';
import { DailyReportData } from '@/utils/reportUtils';
import { Vehicle } from '@/types/trip';
import { ReportControls } from '@/components/reports/ReportControls';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

interface ReportSettings {
  title: string;
  startDate: Date;
  endDate: Date;
  vehicleId: string;
  additionalText: string;
  driverName: string;
  contact: string;
  departureFilter?: string;
  destinationFilter?: string;
}

interface DailyReportProps {
  data: DailyReportData;
  vehicles: Vehicle[];
  viewMode: 'edit' | 'preview' | 'view';
  initialSettings?: Partial<ReportSettings>;
  onSettingsChange?: (settings: ReportSettings) => void;
  onRegenerate?: () => void;
}

const DailyReport: React.FC<DailyReportProps> = ({
  data,
  vehicles = [],
  viewMode = 'view',
  initialSettings = {},
  onSettingsChange,
  onRegenerate
}) => {
  const ensureDate = (date: any): Date => {
    if (date instanceof Date && !isNaN(date.getTime())) {
      return date;
    }
    if (typeof date === 'string') {
      const parsed = new Date(date);
      if (!isNaN(parsed.getTime())) {
        return parsed;
      }
    }
    return new Date();
  };

  const [settings, setSettings] = useState<ReportSettings>({
    title: initialSettings.title || '운행 보고서',
    startDate: ensureDate(initialSettings.startDate),
    endDate: ensureDate(initialSettings.endDate),
    vehicleId: initialSettings.vehicleId || 'all',
    additionalText: initialSettings.additionalText || '',
    driverName: initialSettings.driverName || '',
    contact: initialSettings.contact || '',
    departureFilter: initialSettings.departureFilter || '',
    destinationFilter: initialSettings.destinationFilter || ''
  });

  const handleSettingsChange = useCallback((field: keyof ReportSettings, value: any) => {
    const newSettings = { ...settings, [field]: value };
    setSettings(newSettings);

    if (onSettingsChange) {
      onSettingsChange(newSettings);
    }
  }, [settings, onSettingsChange]);

  useEffect(() => {
    if (initialSettings) {
      setSettings(prev => ({
        ...prev,
        ...initialSettings,
        startDate: ensureDate(initialSettings.startDate),
        endDate: ensureDate(initialSettings.endDate),
        departureFilter: initialSettings.departureFilter || '',
        destinationFilter: initialSettings.destinationFilter || ''
      }));
    }
  }, [initialSettings]);

  const getVehicleDisplayName = (vehicleId: string) => {
    if (vehicleId === 'all') return '전체 차량';
    const vehicle = vehicles.find(v => v.id === vehicleId);
    return vehicle ? vehicle.licensePlate : '알 수 없음';
  };

  const getDateRangeString = () => {
    try {
      const startDate = ensureDate(settings.startDate);
      const endDate = ensureDate(settings.endDate);

      const isSameDate = format(startDate, 'yyyy-MM-dd') === format(endDate, 'yyyy-MM-dd');
      if (isSameDate) {
        return format(startDate, 'yyyy.MM.dd');
      }
      const isSameYear = startDate.getFullYear() === endDate.getFullYear();
      if (isSameYear) {
        return `${format(startDate, 'yyyy.MM.dd')}~${format(endDate, 'MM.dd')}`;
      }
      return `${format(startDate, 'yyyy.MM.dd')}~${format(endDate, 'yyyy.MM.dd')}`;
    } catch (error) {
      console.error('Date formatting error:', error);
      return '날짜 오류';
    }
  };

  const formatTripDate = (month: number, day: number) => {
    return `${String(month).padStart(2, '0')}/${String(day).padStart(2, '0')}`;
  };

  const getShortVehicleNumber = (vehicleNumber: string) => {
    const plateOnly = vehicleNumber.split(' ')[0];
    if (window.innerWidth <= 768) {
      return plateOnly.length > 4 ? plateOnly.slice(-4) : plateOnly;
    }
    return plateOnly;
  };

  return (
    <div className="space-y-4 p-3 bg-white report-container" id="daily-report-content">
      {/* 편집 컨트롤 - 편집 모드에서만 표시 */}
      {viewMode === 'edit' && (
        <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
          <h3 className="text-sm font-medium mb-3 text-blue-800 flex items-center gap-2">
            <span>📝</span> 보고서 설정 편집
          </h3>
          <ReportControls
            settings={settings}
            vehicles={vehicles}
            onSettingsChange={handleSettingsChange}
            onRegenerate={onRegenerate}
            showRegenerate={true}
            compact={true}
            enableLocationFilters={true}
          />
        </div>
      )}

      {/* 추가 텍스트 - 값이 있을 때만 표시 */}
      {settings.additionalText && (
        <div className="text-center mb-2">
          <div className="text-sm font-medium text-gray-700">
            {settings.additionalText}
          </div>
        </div>
      )}

      {/* 제목 줄 - 왼쪽에 날짜, 가운데 제목 */}
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-medium text-gray-700">
          {getDateRangeString()}
        </div>
        <div className="text-lg font-bold text-gray-900">
          {viewMode === 'edit' ? settings.title : '운행 보고서'}
        </div>
        <div className="w-24"></div>
      </div>

      {/* 운행 내역이 없는 경우 */}
      {!data.dailyTrips.length ? (
        <div className="text-center py-6 text-gray-500 text-sm">
          선택한 조건에 운행 기록이 없습니다.
        </div>
      ) : (
        <>
          {/* 통합 정보 라인 - 데스크톱 */}
          <div className="hidden md:flex items-center justify-between bg-blue-50 px-3 py-2 rounded border border-blue-200 text-xs">
            <div className="flex items-center gap-4">
              <span className="font-medium text-blue-800">
                {getVehicleDisplayName(settings.vehicleId)}
              </span>
              <span className="text-blue-600">
                총 {data.dailyTrips.reduce((sum, trip) => sum + trip.count, 0)}회 운행
              </span>
              <span className="font-bold text-blue-800">
                총 금액: {data.monthlyTotal.toLocaleString()}원
              </span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <span className="text-gray-600">성명:</span>
                <span className="text-gray-800 font-medium">{settings.driverName || '-'}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-gray-600">연락처:</span>
                <span className="text-gray-800 font-medium">{settings.contact || '-'}</span>
              </div>
            </div>
          </div>

          {/* 통합 정보 라인 - 모바일 (2줄로 분할) */}
          <div className="md:hidden space-y-2">
            <div className="flex items-center justify-between bg-blue-50 px-3 py-2 rounded border border-blue-200 text-xs">
              <span className="font-medium text-blue-800">
                {getVehicleDisplayName(settings.vehicleId)}
              </span>
              <span className="text-blue-600">
                총 {data.dailyTrips.reduce((sum, trip) => sum + trip.count, 0)}회
              </span>
              <span className="font-bold text-blue-800">
                {data.monthlyTotal.toLocaleString()}원
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1">
                <span className="text-gray-600">성명:</span>
                <span className="text-gray-800 font-medium">{settings.driverName || '-'}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-gray-600">연락처:</span>
                <span className="text-gray-800 font-medium">{settings.contact || '-'}</span>
              </div>
            </div>
          </div>

          {/* 운행 내역 테이블 */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse border border-gray-200 min-w-[300px]">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-200 px-2 py-1 text-center font-medium text-gray-700 w-[10%]">날짜</th>
                  <th className="border border-gray-200 px-2 py-1 text-center font-medium text-gray-700 w-[12%]">차량</th>
                  <th className="border border-gray-200 px-2 py-1 text-center font-medium text-gray-700 w-[22%]">출발지</th>
                  <th className="border border-gray-200 px-2 py-1 text-center font-medium text-gray-700 w-[22%]">목적지</th>
                  <th className="border border-gray-200 px-2 py-1 text-center font-medium text-gray-700 w-[12%]">단가</th>
                  <th className="border border-gray-200 px-2 py-1 text-center font-medium text-gray-700 w-[6%]">횟수</th>
                  <th className="border border-gray-200 px-2 py-1 text-center font-medium text-gray-700 w-[16%]">총액</th>
                </tr>
              </thead>
              <tbody>
                {data.dailyTrips.map((trip, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="border border-gray-200 px-2 py-0.5 text-center font-medium">
                      {formatTripDate(trip.month, trip.day)}
                    </td>
                    <td className="border border-gray-200 px-2 py-0.5 text-center font-medium text-blue-700">
                      {getShortVehicleNumber(trip.vehicleNumber)}
                    </td>
                    <td className="border border-gray-200 px-2 py-0.5 text-center bg-green-50 text-green-800 font-medium">
                      {trip.departure}
                    </td>
                    <td className="border border-gray-200 px-2 py-0.5 text-center bg-red-50 text-red-800 font-medium">
                      {trip.destination}
                    </td>
                    <td className="border border-gray-200 px-2 py-0.5 text-right">
                      {trip.unitPrice.toLocaleString()}
                    </td>
                    <td className="border border-gray-200 px-2 py-0.5 text-center">{trip.count}</td>
                    <td className="border border-gray-200 px-2 py-0.5 text-right font-medium text-blue-600">
                      {trip.dailyTotal.toLocaleString()}원
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default DailyReport;