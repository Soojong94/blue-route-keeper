// src/components/TripInput.tsx
import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
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
import { CalendarIcon, Car, MapPin, Calculator, Plus, Trash2, ChevronDown, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { saveTrip, getVehicles, getLocations, getTrips } from '@/utils/storage';
import { calculateTotalAmount, getVehicleStats } from '@/utils/calculations';
import { getRecentUnitPrice } from '@/utils/smartPricing';
import { Trip, Vehicle, Location } from '@/types/trip';
import { useLocalStorage } from '@/hooks/useLocalStorage';

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
  isPriceAutoLoaded?: boolean;
}

interface TripInputProps {
  onTripSaved: () => void;
}

const TripInput: React.FC<TripInputProps> = ({ onTripSaved }) => {
  const [savedRows, setSavedRows] = useLocalStorage<TripRow[]>('tripInputRows', []);
  const [rows, setRows] = useState<TripRow[]>(() =>
    savedRows.length > 0 ? savedRows : [createNewRow()]
  );

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [recentData, setRecentData] = useState<{
    departures: string[];
    destinations: string[];
    drivers: string[];
  }>({ departures: [], destinations: [], drivers: [] });
  const [loading, setLoading] = useState(false);
  const [priceLoadingRows, setPriceLoadingRows] = useState<Set<string>>(new Set());

  const smartPriceTimeouts = useRef(new Map<string, NodeJS.Timeout>());

  const { toast } = useToast();

  function createNewRow(): TripRow {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return {
      id: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
      date: today,
      vehicleId: '',
      departure: '',
      destination: '',
      unitPrice: '',
      count: '1',
      driverName: '',
      memo: '',
      isPriceAutoLoaded: false,
    };
  }

  useEffect(() => {
    return () => {
      smartPriceTimeouts.current.forEach(timeout => clearTimeout(timeout));
      smartPriceTimeouts.current.clear();
    };
  }, []);

  useEffect(() => {
    const nonEmptyRows = rows.filter(row =>
      row.departure || row.destination || row.unitPrice || row.driverName || row.memo
    );
    setSavedRows(nonEmptyRows);
  }, [rows, setSavedRows]);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const [vehiclesData, locationsData, tripsData] = await Promise.all([
        getVehicles(),
        getLocations(),
        getTrips()
      ]);

      setVehicles(vehiclesData);
      setLocations(locationsData);

      const departures = [...new Set(tripsData.map(t => t.departure).filter(Boolean))].slice(0, 10);
      const destinations = [...new Set(tripsData.map(t => t.destination).filter(Boolean))].slice(0, 10);
      const drivers = [...new Set(tripsData.map(t => t.driverName).filter(Boolean))].slice(0, 10);

      setRecentData({
        departures: departures as string[],
        destinations: destinations as string[],
        drivers: drivers as string[]
      });
    } catch (error) {
      console.error('Error loading initial data:', error);
      toast({
        title: "데이터 로드 실패",
        description: "초기 데이터를 불러오는 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

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
      row.id === id ? { ...row, [field]: value, isPriceAutoLoaded: field === 'unitPrice' ? false : row.isPriceAutoLoaded } : row
    ));
  };

  const handleVehicleSelect = (rowId: string, vehicleId: string) => {
    updateRow(rowId, 'vehicleId', vehicleId);

    const vehicle = vehicles.find(v => v.id === vehicleId);
    if (vehicle?.defaultUnitPrice) {
      updateRow(rowId, 'unitPrice', vehicle.defaultUnitPrice.toString());
    }
  };

  const loadSmartPrice = useCallback(async (rowId: string, departure: string, destination: string) => {
    if (!departure || !destination) {
      console.log('🚫 Smart pricing skipped: missing departure or destination');
      return;
    }

    const currentRow = rows.find(r => r.id === rowId);
    if (!currentRow || currentRow.unitPrice) {
      console.log('🚫 Smart pricing skipped: row not found or price already set');
      return;
    }

    console.log('🔍 Starting smart price loading for:', { rowId, departure, destination });

    const existingTimeout = smartPriceTimeouts.current.get(rowId);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    const timeoutId = setTimeout(async () => {
      try {
        setPriceLoadingRows(prev => new Set([...prev, rowId]));

        const recentPrice = await getRecentUnitPrice(departure, destination);

        if (recentPrice) {
          console.log('✅ Setting smart price:', recentPrice);

          setRows(prevRows => {
            const targetRow = prevRows.find(r => r.id === rowId);
            if (!targetRow || targetRow.unitPrice) {
              console.log('🚫 Smart pricing cancelled: row changed');
              return prevRows;
            }

            return prevRows.map(r =>
              r.id === rowId
                ? { ...r, unitPrice: recentPrice.toString(), isPriceAutoLoaded: true }
                : r
            );
          });

          toast({
            title: "스마트 단가 적용",
            description: `${departure} → ${destination}: ${recentPrice.toLocaleString()}원`,
            duration: 2000,
          });
        } else {
          console.log('🚫 No smart price found');
        }
      } catch (error) {
        console.error('❌ Smart pricing error:', error);
      } finally {
        setPriceLoadingRows(prev => {
          const newSet = new Set(prev);
          newSet.delete(rowId);
          return newSet;
        });
        smartPriceTimeouts.current.delete(rowId);
      }
    }, 300);

    smartPriceTimeouts.current.set(rowId, timeoutId);
  }, [rows, toast]);

  const handleLocationChange = useCallback((rowId: string, field: 'departure' | 'destination', value: string) => {
    console.log('📍 Location changed called:', { rowId, field, value });

    console.log('🔄 Calling updateRow...');
    updateRow(rowId, field, value);

    setRows(prevRows => {
      console.log('🔍 setRows callback called, current rows:', prevRows.length);

      const row = prevRows.find(r => r.id === rowId);
      if (!row) {
        console.log('❌ Row not found:', rowId);
        return prevRows;
      }

      console.log('✅ Found row:', { departure: row.departure, destination: row.destination, unitPrice: row.unitPrice });

      const departure = field === 'departure' ? value : row.departure;
      const destination = field === 'destination' ? value : row.destination;

      console.log('🔍 Checking smart price conditions:', {
        departure,
        destination,
        hasPrice: !!row.unitPrice,
        areDifferent: departure !== destination,
        bothExist: !!(departure && destination)
      });

      if (departure && destination && departure !== destination && !row.unitPrice) {
        console.log('✅ All conditions met - Triggering smart price loading');
        loadSmartPrice(rowId, departure, destination);
      } else {
        console.log('🚫 Conditions not met for smart pricing');
      }

      return prevRows;
    });
  }, [updateRow, loadSmartPrice]);

  const saveAllRows = async () => {
    setLoading(true);
    let savedCount = 0;
    const errors: string[] = [];

    const formatDateForSupabase = (dateInput: any): string => {
      let date: Date;

      if (dateInput instanceof Date && !isNaN(dateInput.getTime())) {
        date = dateInput;
      } else if (typeof dateInput === 'string') {
        date = new Date(dateInput);
        if (isNaN(date.getTime())) {
          console.warn('Invalid date string, using current date:', dateInput);
          date = new Date();
        }
      } else {
        console.warn('Invalid date format, using current date:', dateInput);
        date = new Date();
      }

      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    for (const row of rows) {
      if (!row.departure && !row.destination && !row.unitPrice) {
        continue;
      }

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
        const dateToSave = formatDateForSupabase(row.date);

        console.log('💾 Saving trip with processed date:', {
          originalDate: row.date,
          processedDate: dateToSave,
          dateType: typeof row.date
        });

        await saveTrip({
          date: dateToSave,
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
        console.error('Save trip error:', error);
        errors.push(`${row.departure} → ${row.destination}: 저장 중 오류가 발생했습니다.`);
      }
    }

    setLoading(false);

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

      setRows([createNewRow()]);
      setSavedRows([]);
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
                    onLocationChange={handleLocationChange}
                    onRemove={removeRow}
                    onVehicleSelect={handleVehicleSelect}
                    isPriceLoading={priceLoadingRows.has(row.id)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="lg:hidden space-y-4 p-4">
          {rows.map((row) => (
            <MobileTripCard
              key={row.id}
              row={row}
              vehicles={vehicles}
              locations={locations}
              recentData={recentData}
              onUpdate={updateRow}
              onLocationChange={handleLocationChange}
              onRemove={removeRow}
              onVehicleSelect={handleVehicleSelect}
              isPriceLoading={priceLoadingRows.has(row.id)}
            />
          ))}
        </div>

        <div className="p-4 border-t bg-gray-50 flex flex-col sm:flex-row justify-between gap-4">
          <Button variant="outline" onClick={addRow} className="w-full sm:w-auto" disabled={loading}>
            <Plus className="mr-2 h-4 w-4" />
            행 추가
          </Button>
          <Button
            onClick={saveAllRows}
            className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
            disabled={loading}
          >
            <Calculator className="mr-2 h-4 w-4" />
            {loading ? '저장 중...' : '일괄 저장'}
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
  onLocationChange: (id: string, field: 'departure' | 'destination', value: string) => void;
  onRemove: (id: string) => void;
  onVehicleSelect: (rowId: string, vehicleId: string) => void;
  isPriceLoading: boolean;
}

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

  console.log('🏗️ LocationSelector rendered:', { value, placeholder, locationsCount: locations.length, recentCount: recentLocations.length });

  useEffect(() => {
    const isRegistered = locations.some(loc => loc.name === value) ||
      recentLocations.includes(value);
    if (value && !isRegistered) {
      console.log('🔄 Switching to custom input mode:', value);
      setIsCustomInput(true);
      setCustomValue(value);
    }
  }, [value, locations, recentLocations]);

  const handleSelectChange = (selectedValue: string) => {
    console.log('🎯 LocationSelector handleSelectChange called:', { selectedValue, placeholder });

    if (selectedValue === 'custom') {
      setIsCustomInput(true);
      setCustomValue(value);
    } else {
      setIsCustomInput(false);
      setCustomValue('');
      console.log('🚀 Calling onChange from LocationSelector:', selectedValue);
      onChange(selectedValue);
    }
  };

  const handleCustomInputChange = (inputValue: string) => {
    console.log('✏️ Custom input change:', { inputValue, placeholder });
    setCustomValue(inputValue);
    onChange(inputValue);
  };

  if (isCustomInput) {
    return (
      <div className="flex gap-1">
        <Input
          value={customValue}
          onChange={(e) => {
            console.log('📝 Direct input change:', { value: e.target.value, placeholder });
            handleCustomInputChange(e.target.value);
          }}
          placeholder={placeholder}
          className={className}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            console.log('🔙 Switching back to select mode');
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
// src/components/TripInput.tsx - LocationSelector 대신 간단한 Input으로 임시 교체

const DesktopTripRow: React.FC<TripRowProps> = ({
  row,
  vehicles,
  locations,
  recentData,
  onUpdate,
  onLocationChange,
  onRemove,
  onVehicleSelect,
  isPriceLoading
}) => {
  const totalAmount = useMemo(() => {
    const unitPrice = parseFloat(row.unitPrice) || 0;
    const count = parseInt(row.count) || 0;
    return unitPrice * count;
  }, [row.unitPrice, row.count]);

  return (
    <tr className="border-b hover:bg-gray-50">
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
              onSelect={(date) => {
                if (date) {
                  const localDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
                  onUpdate(row.id, 'date', localDate);
                }
              }}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </td>

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

      {/* ✅ 임시로 간단한 Input으로 교체 - 출발지 */}
      <td className="px-2 py-3">
        <Input
          value={row.departure}
          onChange={(e) => {
            console.log('🖥️ Desktop departure DIRECT INPUT onChange:', { rowId: row.id, value: e.target.value });
            onLocationChange(row.id, 'departure', e.target.value);
          }}
          placeholder="출발지"
          className="text-xs h-8"
        />
      </td>

      {/* ✅ 임시로 간단한 Input으로 교체 - 목적지 */}
      <td className="px-2 py-3">
        <Input
          value={row.destination}
          onChange={(e) => {
            console.log('🖥️ Desktop destination DIRECT INPUT onChange:', { rowId: row.id, value: e.target.value });
            onLocationChange(row.id, 'destination', e.target.value);
          }}
          placeholder="목적지"
          className="text-xs h-8"
        />
      </td>

      <td className="px-2 py-3">
        <div className="relative">
          <Input
            type="number"
            value={row.unitPrice}
            onChange={(e) => onUpdate(row.id, 'unitPrice', e.target.value)}
            placeholder="단가"
            className={cn(
              "text-xs h-8 w-full pr-8",
              row.isPriceAutoLoaded && "bg-blue-50 border-blue-200"
            )}
            min="0"
            step="1000"
          />
          {isPriceLoading && (
            <div className="absolute right-2 top-2">
              <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
            </div>
          )}
          {row.isPriceAutoLoaded && (
            <div className="absolute right-2 top-2">
              <Zap className="h-3 w-3 text-blue-500" />
            </div>
          )}
        </div>
      </td>

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

      <td className="px-2 py-3">
        <div className="font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded text-center text-xs">
          {totalAmount.toLocaleString()}원
        </div>
      </td>

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

      <td className="px-2 py-3">
        <Input
          value={row.memo}
          onChange={(e) => onUpdate(row.id, 'memo', e.target.value)}
          placeholder="메모"
          className="text-xs h-8"
        />
      </td>

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
const MobileTripCard: React.FC<TripRowProps> = ({
  row,
  vehicles,
  locations,
  recentData,
  onUpdate,
  onLocationChange,
  onRemove,
  onVehicleSelect,
  isPriceLoading
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
                onSelect={(date) => {
                  if (date) {
                    const localDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
                    onUpdate(row.id, 'date', localDate);
                  }
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

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

        {/* ✅ 임시로 간단한 Input으로 교체 - 출발지 */}
        <div className="space-y-2">
          <Label className="text-sm">출발지</Label>
          <Input
            value={row.departure}
            onChange={(e) => {
              console.log('📱 Mobile departure DIRECT INPUT onChange:', { rowId: row.id, value: e.target.value });
              onLocationChange(row.id, 'departure', e.target.value);
            }}
            placeholder="출발지"
          />
        </div>

        {/* ✅ 임시로 간단한 Input으로 교체 - 목적지 */}
        <div className="space-y-2">
          <Label className="text-sm">목적지</Label>
          <Input
            value={row.destination}
            onChange={(e) => {
              console.log('📱 Mobile destination DIRECT INPUT onChange:', { rowId: row.id, value: e.target.value });
              onLocationChange(row.id, 'destination', e.target.value);
            }}
            placeholder="목적지"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-sm flex items-center gap-2">
            단가
            {row.isPriceAutoLoaded && (
              <Badge className="bg-blue-100 text-blue-800 text-xs">
                <Zap className="h-3 w-3 mr-1" />
                자동
              </Badge>
            )}
          </Label>
          <div className="relative">
            <Input
              type="number"
              value={row.unitPrice}
              onChange={(e) => onUpdate(row.id, 'unitPrice', e.target.value)}
              placeholder="단가"
              className={cn(
                row.isPriceAutoLoaded && "bg-blue-50 border-blue-200"
              )}
              min="0"
            />
            {isPriceLoading && (
              <div className="absolute right-3 top-3">
                <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
              </div>
            )}
          </div>
        </div>

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

      <div className="bg-blue-50 p-3 rounded-lg">
        <div className="text-sm text-blue-600 mb-1">총액</div>
        <div className="text-xl font-bold text-blue-800">
          {totalAmount.toLocaleString()}원
        </div>
      </div>

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