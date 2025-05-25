// src/components/TripInput.tsx
import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { CalendarIcon, Car, MapPin, Calculator, Plus, Trash2, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { saveTrip, getVehicles, getLocations } from '@/utils/storage';
import { calculateTotalAmount, getVehicleStats } from '@/utils/calculations';
import { Trip, Vehicle, Location } from '@/types/trip';

interface TripRow {
  id: string;
  date: Date;
  vehicleId: string;
  departure: string;
  destination: string;
  unitPrice: string;
  count: string;
  driverName: string;
  memo: string;
}

interface TripInputProps {
  onTripSaved: () => void;
}

const TripInput: React.FC<TripInputProps> = ({ onTripSaved }) => {
  const [rows, setRows] = useState<TripRow[]>([createNewRow()]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [recentData, setRecentData] = useState<{
    departures: string[];
    destinations: string[];
    drivers: string[];
  }>({ departures: [], destinations: [], drivers: [] });

  const { toast } = useToast();

  function createNewRow(): TripRow {
    return {
      id: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
      date: new Date(),
      vehicleId: '',
      departure: '',
      destination: '',
      unitPrice: '',
      count: '1',
      driverName: '',
      memo: '',
    };
  }

  useEffect(() => {
    setVehicles(getVehicles());
    setLocations(getLocations());

    // 최근 데이터 로드
    try {
      const trips = JSON.parse(localStorage.getItem('car-trips') || '[]');
      const departures = [...new Set(trips.map((t: any) => t.departure).filter(Boolean))].slice(0, 10);
      const destinations = [...new Set(trips.map((t: any) => t.destination).filter(Boolean))].slice(0, 10);
      const drivers = [...new Set(trips.map((t: any) => t.driverName).filter(Boolean))].slice(0, 10);

      setRecentData({
        departures: departures as string[],
        destinations: destinations as string[],
        drivers: drivers as string[]
      });
    } catch (error) {
      console.error('Error loading recent data:', error);
      setRecentData({ departures: [], destinations: [], drivers: [] });
    }
  }, []);

  const addRow = () => {
    setRows([...rows, createNewRow()]);
  };

  const removeRow = (id: string) => {
    if (rows.length > 1) {
      setRows(rows.filter(row => row.id !== id));
    }
  };

  const updateRow = (id: string, field: keyof TripRow, value: any) => {
    setRows(rows.map(row =>
      row.id === id ? { ...row, [field]: value } : row
    ));
  };

  const handleVehicleSelect = (rowId: string, vehicleId: string) => {
    updateRow(rowId, 'vehicleId', vehicleId);

    const vehicle = vehicles.find(v => v.id === vehicleId);
    if (vehicle?.defaultUnitPrice) {
      updateRow(rowId, 'unitPrice', vehicle.defaultUnitPrice.toString());
    }
  };

  const saveAllRows = async () => {
    let savedCount = 0;
    const errors: string[] = [];

    for (const row of rows) {
      // 빈 행 건너뛰기
      if (!row.departure && !row.destination && !row.unitPrice) {
        continue;
      }

      // 필수 필드 검증
      if (!row.date || !row.vehicleId || !row.departure || !row.destination || !row.unitPrice || !row.count) {
        errors.push(`${row.departure || '미입력'} → ${row.destination || '미입력'}: 필수 정보가 누락되었습니다.`);
        continue;
      }

      const unitPrice = parseFloat(row.unitPrice);
      const count = parseInt(row.count);

      if (isNaN(unitPrice) || unitPrice < 0) {
        errors.push(`${row.departure} → ${row.destination}: 올바른 단가를 입력해주세요.`);
        continue;
      }

      if (isNaN(count) || count < 1) {
        errors.push(`${row.departure} → ${row.destination}: 횟수는 1 이상이어야 합니다.`);
        continue;
      }

      try {
        saveTrip({
          date: format(row.date, 'yyyy-MM-dd'),
          departure: row.departure,
          destination: row.destination,
          unitPrice: unitPrice,
          count: count,
          vehicleId: row.vehicleId,
          ...(row.driverName && { driverName: row.driverName }),
          ...(row.memo && { memo: row.memo }),
        });
        savedCount++;
      } catch (error) {
        errors.push(`${row.departure} → ${row.destination}: 저장 중 오류가 발생했습니다.`);
      }
    }

    if (errors.length > 0) {
      toast({
        title: "일부 저장 실패",
        description: `${savedCount}건 저장 완료, ${errors.length}건 실패\n${errors[0]}`,
        variant: "destructive",
      });
    } else if (savedCount > 0) {
      toast({
        title: "저장 완료",
        description: `${savedCount}건의 운행 기록이 저장되었습니다.`,
      });

      // 폼 초기화
      setRows([createNewRow()]);
      onTripSaved();
    } else {
      toast({
        title: "저장할 데이터 없음",
        description: "입력된 운행 기록이 없습니다.",
      });
    }
  };

  const totalAmount = rows.reduce((sum, row) => {
    const unitPrice = parseFloat(row.unitPrice) || 0;
    const count = parseInt(row.count) || 0;
    return sum + (unitPrice * count);
  }, 0);

  return (
    <Card className="w-full">
      <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
        <CardTitle className="flex items-center gap-2">
          <Car className="h-5 w-5" />
          운행 기록 입력
        </CardTitle>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="bg-white/20 rounded-lg p-3 text-center">
            <div className="text-sm opacity-90">총 건수</div>
            <div className="text-xl font-bold">
              {rows.reduce((sum, row) => sum + (parseInt(row.count) || 0), 0)}건
            </div>
          </div>
          <div className="bg-white/20 rounded-lg p-3 text-center">
            <div className="text-sm opacity-90">총 금액</div>
            <div className="text-xl font-bold">
              {totalAmount.toLocaleString()}원
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {/* 데스크톱 테이블 뷰 - 스크롤 없이 보이도록 컬럼 너비 최적화 */}
        <div className="hidden lg:block">
          <div className="w-full overflow-hidden">
            <table className="w-full table-fixed">
              <thead className="bg-gray-50">
                <tr>
                  <th className="w-[8%] px-2 py-3 text-left text-xs font-medium text-gray-700">날짜</th>
                  <th className="w-[15%] px-2 py-3 text-left text-xs font-medium text-gray-700">차량</th>
                  <th className="w-[12%] px-2 py-3 text-left text-xs font-medium text-gray-700">출발지</th>
                  <th className="w-[12%] px-2 py-3 text-left text-xs font-medium text-gray-700">목적지</th>
                  <th className="w-[10%] px-2 py-3 text-left text-xs font-medium text-gray-700">단가</th>
                  <th className="w-[6%] px-2 py-3 text-left text-xs font-medium text-gray-700">횟수</th>
                  <th className="w-[10%] px-2 py-3 text-left text-xs font-medium text-gray-700">총액</th>
                  <th className="w-[10%] px-2 py-3 text-left text-xs font-medium text-gray-700">운전자</th>
                  <th className="w-[10%] px-2 py-3 text-left text-xs font-medium text-gray-700">메모</th>
                  <th className="w-[7%] px-2 py-3 text-center text-xs font-medium text-gray-700">삭제</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <DesktopTripRow
                    key={row.id}
                    row={row}

                    vehicles={vehicles}
                    locations={locations}
                    recentData={recentData}
                    onUpdate={updateRow}
                    onRemove={removeRow}
                    onVehicleSelect={handleVehicleSelect}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 태블릿/모바일 카드 뷰 */}
        <div className="xl:hidden space-y-4 p-4">
          {rows.map((row) => (
            <MobileTripCard
              key={row.id}
              row={row}
              vehicles={vehicles}
              locations={locations}
              recentData={recentData}
              onUpdate={updateRow}
              onRemove={removeRow}
              onVehicleSelect={handleVehicleSelect}
            />
          ))}
        </div>

        <div className="p-4 border-t bg-gray-50 flex flex-col sm:flex-row justify-between gap-4">
          <Button variant="outline" onClick={addRow} className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            행 추가
          </Button>
          <Button onClick={saveAllRows} className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto">
            <Calculator className="mr-2 h-4 w-4" />
            일괄 저장
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

interface TripRowProps {
  row: TripRow;
  vehicles: Vehicle[];
  locations: Location[];
  recentData: {
    departures: string[];
    destinations: string[];
    drivers: string[];
  };
  onUpdate: (id: string, field: keyof TripRow, value: any) => void;
  onRemove: (id: string) => void;
  onVehicleSelect: (rowId: string, vehicleId: string) => void;
}

// 장소 선택 드롭다운 컴포넌트
interface LocationSelectorProps {
  value: string;
  onChange: (value: string) => void;
  locations: Location[];
  recentLocations: string[];
  placeholder: string;
  className?: string;
}

const LocationSelector: React.FC<LocationSelectorProps> = ({
  value,
  onChange,
  locations,
  recentLocations,
  placeholder,
  className
}) => {
  const [isCustomInput, setIsCustomInput] = useState(false);
  const [customValue, setCustomValue] = useState('');

  useEffect(() => {
    // 현재 값이 등록된 장소나 최근 사용 장소에 없으면 직접 입력 모드로 설정
    const isRegistered = locations.some(loc => loc.name === value) ||
      recentLocations.includes(value);
    if (value && !isRegistered) {
      setIsCustomInput(true);
      setCustomValue(value);
    }
  }, [value, locations, recentLocations]);

  const handleSelectChange = (selectedValue: string) => {
    if (selectedValue === 'custom') {
      setIsCustomInput(true);
      setCustomValue(value);
    } else {
      setIsCustomInput(false);
      setCustomValue('');
      onChange(selectedValue);
    }
  };

  const handleCustomInputChange = (inputValue: string) => {
    setCustomValue(inputValue);
    onChange(inputValue);
  };

  if (isCustomInput) {
    return (
      <div className="flex gap-1">
        <Input
          value={customValue}
          onChange={(e) => handleCustomInputChange(e.target.value)}
          placeholder={placeholder}
          className={className}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            setIsCustomInput(false);
            onChange('');
            setCustomValue('');
          }}
          className="px-2 text-xs"
        >
          선택
        </Button>
      </div>
    );
  }

  return (
    <Select value={value} onValueChange={handleSelectChange}>
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {/* 즐겨찾기 장소 */}
        {locations.length > 0 && (
          <>
            <div className="px-2 py-1.5 text-xs font-medium text-gray-500 bg-gray-50">
              즐겨찾기 장소
            </div>
            {locations.map((location) => (
              <SelectItem key={location.id} value={location.name}>
                <div className="flex items-center gap-2">
                  <MapPin className="h-3 w-3 text-gray-400" />
                  <span>{location.name}</span>
                  <Badge variant="outline" className="text-xs ml-auto">
                    {location.category === 'company' && '회사'}
                    {location.category === 'client' && '고객사'}
                    {location.category === 'personal' && '개인'}
                    {location.category === 'other' && '기타'}
                  </Badge>
                </div>
              </SelectItem>
            ))}
          </>
        )}

        {/* 최근 사용 장소 */}
        {recentLocations.length > 0 && (
          <>
            <div className="px-2 py-1.5 text-xs font-medium text-gray-500 bg-gray-50">
              최근 사용
            </div>
            {recentLocations
              .filter(recent => !locations.some(loc => loc.name === recent))
              .map((recent, idx) => (
                <SelectItem key={`recent-${idx}`} value={recent}>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3 w-3 text-gray-400" />
                    <span>{recent}</span>
                  </div>
                </SelectItem>
              ))}
          </>
        )}

        {/* 직접 입력 옵션 */}
        <div className="px-2 py-1.5 text-xs font-medium text-gray-500 bg-gray-50">
          기타
        </div>
        <SelectItem value="custom">
          <div className="flex items-center gap-2">
            <Plus className="h-3 w-3 text-blue-500" />
            <span className="text-blue-600">직접 입력</span>
          </div>
        </SelectItem>
      </SelectContent>
    </Select>
  );
};

// 데스크톱용 테이블 행
const DesktopTripRow: React.FC<TripRowProps> = ({
  row,
  vehicles,
  locations,
  recentData,
  onUpdate,
  onRemove,
  onVehicleSelect
}) => {
  const totalAmount = useMemo(() => {
    const unitPrice = parseFloat(row.unitPrice) || 0;
    const count = parseInt(row.count) || 0;
    return unitPrice * count;
  }, [row.unitPrice, row.count]);

  return (
    <tr className="border-b hover:bg-gray-50">
      {/* 날짜 */}
      <td className="px-2 py-3">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal text-xs h-8",
                !row.date && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-1 h-3 w-3" />
              {row.date ? format(row.date, "MM/dd") : "날짜"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={row.date}
              onSelect={(date) => date && onUpdate(row.id, 'date', date)}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </td>

      {/* 차량 */}
      <td className="px-2 py-3">
        <Select value={row.vehicleId} onValueChange={(value) => onVehicleSelect(row.id, value)}>
          <SelectTrigger className="text-xs h-8">
            <SelectValue placeholder="차량 선택" />
          </SelectTrigger>
          <SelectContent>
            {vehicles.map((vehicle) => (
              <SelectItem key={vehicle.id} value={vehicle.id}>
                <div className="flex flex-col">
                  <span className="font-medium">{vehicle.licensePlate}</span>
                  <span className="text-sm text-gray-500">{vehicle.name}</span>
                  {vehicle.defaultUnitPrice && (
                    <span className="text-xs text-blue-600">
                      기본단가: {vehicle.defaultUnitPrice.toLocaleString()}원
                    </span>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </td>

      {/* 출발지 */}
      <td className="px-2 py-3">
        <LocationSelector
          value={row.departure}
          onChange={(value) => onUpdate(row.id, 'departure', value)}
          locations={locations}
          recentLocations={recentData.departures}
          placeholder="출발지"
          className="text-xs h-8"
        />
      </td>

      {/* 목적지 */}
      <td className="px-2 py-3">
        <LocationSelector
          value={row.destination}
          onChange={(value) => onUpdate(row.id, 'destination', value)}
          locations={locations}
          recentLocations={recentData.destinations}
          placeholder="목적지"
          className="text-xs h-8"
        />
      </td>

      {/* 단가 */}
      <td className="px-2 py-3">
        <Input
          type="number"
          value={row.unitPrice}
          onChange={(e) => onUpdate(row.id, 'unitPrice', e.target.value)}
          placeholder="단가"
          className="text-xs h-8 w-full"
          min="0"
          step="1000"
        />
      </td>

      {/* 횟수 */}
      <td className="px-2 py-3">
        <Input
          type="number"
          value={row.count}
          onChange={(e) => onUpdate(row.id, 'count', e.target.value)}
          placeholder="횟수"
          className="text-xs h-8"
          min="1"
        />
      </td>

      {/* 총액 */}
      <td className="px-2 py-3">
        <div className="font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded text-center text-xs">
          {totalAmount.toLocaleString()}원
        </div>
      </td>

      {/* 운전자 */}
      <td className="px-2 py-3">
        <Input
          value={row.driverName}
          onChange={(e) => onUpdate(row.id, 'driverName', e.target.value)}
          placeholder="운전자"
          className="text-xs h-8"
          list={`drivers-${row.id}`}
        />
        <datalist id={`drivers-${row.id}`}>
          {recentData.drivers.map((driver, idx) => (
            <option key={idx} value={driver} />
          ))}
        </datalist>
      </td>

      {/* 메모 */}
      <td className="px-2 py-3">
        <Input
          value={row.memo}
          onChange={(e) => onUpdate(row.id, 'memo', e.target.value)}
          placeholder="메모"
          className="text-xs h-8"
        />
      </td>

      {/* 삭제 */}
      <td className="px-2 py-3">
        <div className="flex justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onRemove(row.id)}
            className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-16 text-xs border-red-200"
          >
            삭제
          </Button>
        </div>
      </td>
    </tr>
  );
};

// 모바일용 카드 컴포넌트
const MobileTripCard: React.FC<TripRowProps> = ({
  row,
  vehicles,
  locations,
  recentData,
  onUpdate,
  onRemove,
  onVehicleSelect
}) => {
  const totalAmount = useMemo(() => {
    const unitPrice = parseFloat(row.unitPrice) || 0;
    const count = parseInt(row.count) || 0;
    return unitPrice * count;
  }, [row.unitPrice, row.count]);

  return (
    <Card className="p-4 space-y-4">
      <div className="flex justify-between items-center">
        <Badge variant="outline">운행</Badge>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onRemove(row.id)}
          className="text-red-500 hover:text-red-700 h-8 w-8 p-0"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* 날짜 */}
        <div className="space-y-2">
          <Label className="text-sm">날짜</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !row.date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {row.date ? format(row.date, "MM/dd") : "날짜"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={row.date}
                onSelect={(date) => date && onUpdate(row.id, 'date', date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* 차량 */}
        <div className="space-y-2">
          <Label className="text-sm">차량</Label>
          <Select value={row.vehicleId} onValueChange={(value) => onVehicleSelect(row.id, value)}>
            <SelectTrigger>
              <SelectValue placeholder="차량 선택" />
            </SelectTrigger>
            <SelectContent>
              {vehicles.map((vehicle) => (
                <SelectItem key={vehicle.id} value={vehicle.id}>
                  <div className="flex flex-col">
                    <span className="font-medium">{vehicle.licensePlate}</span>
                    <span className="text-sm text-gray-500">{vehicle.name}</span>
                    {vehicle.defaultUnitPrice && (
                      <span className="text-xs text-blue-600">
                        기본단가: {vehicle.defaultUnitPrice.toLocaleString()}원
                      </span>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 출발지 */}
        <div className="space-y-2">
          <Label className="text-sm">출발지</Label>
          <LocationSelector
            value={row.departure}
            onChange={(value) => onUpdate(row.id, 'departure', value)}
            locations={locations}
            recentLocations={recentData.departures}
            placeholder="출발지"
          />
        </div>

        {/* 목적지 */}
        <div className="space-y-2">
          <Label className="text-sm">목적지</Label>
          <LocationSelector
            value={row.destination}
            onChange={(value) => onUpdate(row.id, 'destination', value)}
            locations={locations}
            recentLocations={recentData.destinations}
            placeholder="목적지"
          />
        </div>

        {/* 단가 */}
        <div className="space-y-2">
          <Label className="text-sm">단가</Label>
          <Input
            type="number"
            value={row.unitPrice}
            onChange={(e) => onUpdate(row.id, 'unitPrice', e.target.value)}
            placeholder="단가"
            min="0"
          />
        </div>

        {/* 횟수 */}
        <div className="space-y-2">
          <Label className="text-sm">횟수</Label>
          <Input
            type="number"
            value={row.count}
            onChange={(e) => onUpdate(row.id, 'count', e.target.value)}
            placeholder="횟수"
            min="1"
          />
        </div>
      </div>

      {/* 총액 */}
      <div className="bg-blue-50 p-3 rounded-lg">
        <div className="text-sm text-blue-600 mb-1">총액</div>
        <div className="text-xl font-bold text-blue-800">
          {totalAmount.toLocaleString()}원
        </div>
      </div>

      {/* 운전자 */}
      <div className="space-y-2">
        <Label className="text-sm">운전자 (선택)</Label>
        <Input
          value={row.driverName}
          onChange={(e) => onUpdate(row.id, 'driverName', e.target.value)}
          placeholder="운전자명"
          list={`drivers-${row.id}`}
        />
        <datalist id={`drivers-${row.id}`}>
          {recentData.drivers.map((driver, idx) => (
            <option key={idx} value={driver} />
          ))}
        </datalist>
      </div>

      {/* 메모 */}
      <div className="space-y-2">
        <Label className="text-sm">메모 (선택)</Label>
        <Input
          value={row.memo}
          onChange={(e) => onUpdate(row.id, 'memo', e.target.value)}
          placeholder="메모"
        />
      </div>
    </Card>
  );
};

export default TripInput;