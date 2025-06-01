/* src/components/reports/DailyReport.tsx - formatAmount 함수 제거 */
import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { DailyReportData } from '@/utils/reportUtils';
import { Vehicle } from '@/types/trip';
import SmartInput, { SearchResult } from '@/components/SmartInput';
import { searchVehicles, addRecentVehicle, getRecentVehicles } from '@/utils/smartSearch';

interface DailyReportProps {
  data: DailyReportData;
  vehicles: Vehicle[];
  selectedVehicleId: string;
  startDate: Date;
  endDate: Date;
  onDateChange: (startDate: Date, endDate: Date) => void;
  onVehicleChange: (vehicleId: string) => void;
  onRefresh: () => void;
  viewMode?: 'edit' | 'preview' | 'view';
  savedSettings?: any;
}

const DailyReport: React.FC<DailyReportProps> = ({
  data,
  vehicles = [],
  selectedVehicleId = 'all',
  startDate,
  endDate,
  onDateChange,
  onVehicleChange,
  onRefresh,
  viewMode = 'edit',
  savedSettings = {}
}) => {
  const [localStartDate, setLocalStartDate] = useState<Date>(startDate);
  const [localEndDate, setLocalEndDate] = useState<Date>(endDate);
  const [vehicleInput, setVehicleInput] = useState<string>('');

  // 저장된 설정에서 값 가져오기 (뷰 모드일 때)
  const [additionalText, setAdditionalText] = useState<string>(
    viewMode === 'view' ? (savedSettings.additionalText || '') : ''
  );
  const [driverName, setDriverName] = useState<string>(
    viewMode === 'view' ? (savedSettings.driverName || '') : ''
  );
  const [contact, setContact] = useState<string>(
    viewMode === 'view' ? (savedSettings.contact || '') : ''
  );

  // props 유효성 검사
  if (!data || (!onDateChange && viewMode !== 'view') || (!onVehicleChange && viewMode !== 'view') || (!onRefresh && viewMode !== 'view')) {
    if (viewMode !== 'view') {
      return (
        <div className="text-center py-6 text-gray-500">
          데이터를 불러오는 중입니다...
        </div>
      );
    }
  }

  const getVehicleDisplayName = (vehicleId: string) => {
    if (vehicleId === 'all') return '전체 차량';
    const vehicle = vehicles.find(v => v.id === vehicleId);
    return vehicle ? vehicle.licensePlate : '알 수 없음';
  };

  // 날짜 범위 포맷팅
  const getDateRangeString = () => {
    const isSameDate = format(localStartDate, 'yyyy-MM-dd') === format(localEndDate, 'yyyy-MM-dd');
    if (isSameDate) {
      return format(localStartDate, 'yyyy.MM.dd');
    }
    const isSameYear = localStartDate.getFullYear() === localEndDate.getFullYear();
    if (isSameYear) {
      return `${format(localStartDate, 'yyyy.MM.dd')}~${format(localEndDate, 'MM.dd')}`;
    }
    return `${format(localStartDate, 'yyyy.MM.dd')}~${format(localEndDate, 'yyyy.MM.dd')}`;
  };

  // 현재 선택된 차량의 번호판을 input에 표시
  React.useEffect(() => {
    if (viewMode !== 'view') {
      if (selectedVehicleId === 'all') {
        setVehicleInput('');
      } else {
        const vehicle = vehicles.find(v => v.id === selectedVehicleId);
        if (vehicle) {
          setVehicleInput(vehicle.licensePlate);
        }
      }
    }
  }, [selectedVehicleId, vehicles, viewMode]);

  // 즐겨찾기 차량 목록 생성
  const getFavoriteVehicles = useCallback((): SearchResult[] => {
    return [
      {
        id: 'all-vehicles',
        value: '',
        label: '전체 차량',
        type: 'favorite' as const,
        category: 'vehicle' as const,
        metadata: { vehicleId: 'all' }
      },
      ...vehicles.map(vehicle => ({
        id: `fav-vehicle-${vehicle.id}`,
        value: vehicle.licensePlate,
        label: `${vehicle.licensePlate}${vehicle.name ? ` (${vehicle.name})` : ''}`,
        type: 'favorite' as const,
        category: 'vehicle' as const,
        metadata: {
          vehicleId: vehicle.id,
          vehicle,
          category: vehicle.defaultUnitPrice ? `${vehicle.defaultUnitPrice.toLocaleString()}원` : undefined
        }
      }))
    ];
  }, [vehicles]);

  // 차량 선택 처리
  const handleVehicleSelect = useCallback((result: SearchResult) => {
    if (viewMode !== 'view' && result.metadata?.vehicleId) {
      onVehicleChange(result.metadata.vehicleId);
      if (result.value) {
        addRecentVehicle(result.value);
      }
    }
  }, [onVehicleChange, viewMode]);

  // 차량 입력값 변경 처리
  const handleVehicleInputChange = useCallback((value: string) => {
    if (viewMode !== 'view') {
      setVehicleInput(value);

      if (!value.trim()) {
        onVehicleChange('all');
        return;
      }

      const matchingVehicle = vehicles.find(v => v.licensePlate === value);
      if (matchingVehicle) {
        onVehicleChange(matchingVehicle.id);
      } else {
        onVehicleChange('all');
      }
    }
  }, [vehicles, onVehicleChange, viewMode]);

  // 날짜 포맷팅 함수 (월/일 통합)
  const formatTripDate = (month: number, day: number) => {
    return `${String(month).padStart(2, '0')}/${String(day).padStart(2, '0')}`;
  };

  // 📱 차량번호 축약 (모바일에서 뒤 4자리만)
  const getShortVehicleNumber = (vehicleNumber: string) => {
    const plateOnly = vehicleNumber.split(' ')[0];
    // 모바일 환경에서는 뒤 4자리만 표시
    if (window.innerWidth <= 768) {
      return plateOnly.length > 4 ? plateOnly.slice(-4) : plateOnly;
    }
    return plateOnly;
  };

  return (
    <div className="space-y-2 p-3 bg-white report-container">
      {/* 필터 컨트롤 - 뷰 모드에서는 숨김 */}
      {viewMode === 'edit' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2">
          {/* 시작일 */}
          <div>
            <label className="text-xs text-gray-500 block mb-1">시작일</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "w-full justify-start text-left font-normal h-8 text-xs",
                    !localStartDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-1 h-3 w-3" />
                  {localStartDate ? format(localStartDate, "MM/dd", { locale: ko }) : "시작일"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={localStartDate}
                  onSelect={(date) => {
                    if (date) {
                      const localDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
                      setLocalStartDate(localDate);
                      if (localDate > localEndDate) {
                        setLocalEndDate(localDate);
                      }
                      onDateChange(localDate, localDate > localEndDate ? localDate : localEndDate);
                      onRefresh();
                    }
                  }}
                  locale={ko}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* 종료일 */}
          <div>
            <label className="text-xs text-gray-500 block mb-1">종료일</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "w-full justify-start text-left font-normal h-8 text-xs",
                    !localEndDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-1 h-3 w-3" />
                  {localEndDate ? format(localEndDate, "MM/dd", { locale: ko }) : "종료일"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={localEndDate}
                  onSelect={(date) => {
                    if (date) {
                      const localDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
                      setLocalEndDate(localDate);
                      if (localDate < localStartDate) {
                        setLocalStartDate(localDate);
                      }
                      onDateChange(localDate < localStartDate ? localDate : localStartDate, localDate);
                      onRefresh();
                    }
                  }}
                  locale={ko}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* 차량 선택 */}
          <div>
            <label className="text-xs text-gray-500 block mb-1">차량</label>
            <div className="flex gap-1">
              <Button
                variant={selectedVehicleId === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  onVehicleChange('all');
                  setVehicleInput('');
                  onRefresh();
                }}
                className="shrink-0 h-8 text-xs px-2"
              >
                전체
              </Button>
              <SmartInput
                value={vehicleInput}
                onChange={handleVehicleInputChange}
                onSelect={(result) => {
                  handleVehicleSelect(result);
                  onRefresh();
                }}
                placeholder="차량번호"
                className="text-xs h-8"
                searchFunction={searchVehicles}
                recentItems={getRecentVehicles()}
                favoriteItems={getFavoriteVehicles()}
                debounceMs={300}
              />
            </div>
          </div>
        </div>
      )}

      {/* 추가 텍스트 입력 - 뷰 모드에서는 입력 불가, 저장된 값만 표시 */}
      {(viewMode === 'edit' || (viewMode === 'view' && additionalText)) && (
        <div className="text-center mb-2">
          {viewMode === 'edit' ? (
            <Input
              value={additionalText}
              onChange={(e) => setAdditionalText(e.target.value)}
              placeholder="추가 텍스트 입력 (선택사항)"
              className="text-center text-sm h-8 max-w-md mx-auto border-gray-200"
            />
          ) : (
            <div className="text-center text-sm font-medium text-gray-700">
              {additionalText}
            </div>
          )}
        </div>
      )}

      {/* 제목 줄 - 왼쪽에 날짜, 가운데 제목 */}
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-medium text-gray-700">
          {getDateRangeString()}
        </div>
        <div className="text-lg font-bold text-gray-900">
          운행 보고서
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
                {getVehicleDisplayName(selectedVehicleId)}
                {selectedVehicleId !== 'all' && `(${getVehicleDisplayName(selectedVehicleId)})`}
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
                {viewMode === 'edit' ? (
                  <Input
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    placeholder="이름"
                    className="h-6 w-28 text-xs"
                  />
                ) : (
                  <span className="text-gray-800 font-medium">{driverName || '-'}</span>
                )}
              </div>
              <div className="flex items-center gap-1">
                <span className="text-gray-600">연락처:</span>
                {viewMode === 'edit' ? (
                  <Input
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    placeholder="연락처"
                    className="h-6 w-32 text-xs"
                  />
                ) : (
                  <span className="text-gray-800 font-medium">{contact || '-'}</span>
                )}
              </div>
            </div>
          </div>

          {/* 통합 정보 라인 - 모바일 (2줄로 분할) */}
          <div className="md:hidden space-y-2">
            <div className="flex items-center justify-between bg-blue-50 px-3 py-2 rounded border border-blue-200 text-xs">
              <span className="font-medium text-blue-800">
                {getVehicleDisplayName(selectedVehicleId)}
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
                {viewMode === 'edit' ? (
                  <Input
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    placeholder="이름"
                    className="h-6 w-20 text-xs"
                  />
                ) : (
                  <span className="text-gray-800 font-medium">{driverName || '-'}</span>
                )}
              </div>
              <div className="flex items-center gap-1">
                <span className="text-gray-600">연락처:</span>
                {viewMode === 'edit' ? (
                  <Input
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    placeholder="연락처"
                    className="h-6 w-32 text-xs"
                  />
                ) : (
                  <span className="text-gray-800 font-medium">{contact || '-'}</span>
                )}
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