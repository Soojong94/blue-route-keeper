// src/components/TripInput.tsx
import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { CalendarIcon, Car, Calculator, Plus, Trash2, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { saveTrip, getVehicles, getLocations, ensureVehicleExists, ensureLocationExists, findVehicleByLicensePlate, saveVehicle } from '@/utils/storage';
import { Trip, Vehicle, Location } from '@/types/trip';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { getRecentUnitPrice, clearRoutePriceCache } from '@/utils/smartPricing';
import SmartInput, { SearchResult } from '@/components/SmartInput';
import {
  searchVehicles,
  searchLocations,
  searchDrivers,
  addRecentVehicle,
  addRecentLocation,
  addRecentDriver,
  getRecentVehicles,
  getRecentLocations,
  getRecentDrivers
} from '@/utils/smartSearch';



interface TripRow {
  id: string;
  date: Date;
  vehicleId: string;
  licensePlate: string;
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
  const [loading, setLoading] = useState(false);
  const [priceLoadingRows, setPriceLoadingRows] = useState<Set<string>>(new Set());

  const smartPriceTimeouts = useRef(new Map<string, NodeJS.Timeout>());
  const isInitialMount = useRef(true);

  const { toast } = useToast();

  function createNewRow(): TripRow {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return {
      id: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
      date: today,
      vehicleId: '',
      licensePlate: '',
      departure: '',
      destination: '',
      unitPrice: '1',
      count: '1',
      driverName: '',
      memo: '',
      isPriceAutoLoaded: false,
    };
  }

  // 즐겨찾기 항목들을 SearchResult 형태로 변환 (useCallback으로 메모이제이션)
  const getFavoriteVehicles = useCallback((): SearchResult[] => {
    return vehicles.map(vehicle => ({
      id: `fav-vehicle-${vehicle.id}`,
      value: vehicle.licensePlate,
      label: `${vehicle.licensePlate}${vehicle.name ? ` (${vehicle.name})` : ''}`,
      type: 'favorite',
      category: 'vehicle',
      metadata: {
        vehicleId: vehicle.id,
        vehicle,
        additionalInfo: vehicle.defaultUnitPrice ? `${vehicle.defaultUnitPrice.toLocaleString()}원` : undefined
      }
    }));
  }, [vehicles]);

  const getFavoriteLocations = useCallback((): SearchResult[] => {
    const categoryLabels = {
      company: '회사',
      client: '고객사',
      personal: '개인',
      other: '기타'
    };

    return locations.map(location => ({
      id: `fav-location-${location.id}`,
      value: location.name,
      label: location.name,
      type: 'favorite',
      category: 'location',
      metadata: {
        locationId: location.id,
        location,
        category: categoryLabels[location.category as keyof typeof categoryLabels]
      }
    }));
  }, [locations]);

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      smartPriceTimeouts.current.forEach(timeout => clearTimeout(timeout));
      smartPriceTimeouts.current.clear();
    };
  }, []);

  // 행 변경 시 localStorage 저장 (무한 루프 방지)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    const nonEmptyRows = rows.filter(row =>
      row.departure || row.destination || (row.unitPrice && row.unitPrice !== '1') || row.driverName || row.memo || row.licensePlate
    );

    // 실제 변경이 있을 때만 저장 (깊은 비교로 무한 루프 방지)
    const hasChanges = JSON.stringify(nonEmptyRows) !== JSON.stringify(savedRows);
    if (hasChanges) {
      setSavedRows(nonEmptyRows);
    }
  }, [rows]);

  // 초기 데이터 로드
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const [vehiclesData, locationsData] = await Promise.all([
        getVehicles(),
        getLocations()
      ]);

      setVehicles(vehiclesData);
      setLocations(locationsData);
    } catch (error) {
      console.error('Error loading initial data:', error);
      toast({
        title: "데이터 로드 실패",
        description: "초기 데이터를 불러오는 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  const addRow = useCallback(() => {
    setRows(prev => [...prev, createNewRow()]);
  }, []);

  const removeRow = useCallback((id: string) => {
    setRows(prev => prev.length > 1 ? prev.filter(row => row.id !== id) : prev);
  }, []);

  const updateRow = useCallback((id: string, field: keyof TripRow, value: any) => {
    setRows(prev => prev.map(row =>
      row.id === id
        ? {
          ...row,
          [field]: value,
          isPriceAutoLoaded: field === 'unitPrice' ? false : row.isPriceAutoLoaded
        }
        : row
    ));
  }, []);

  // 차량번호로 기존 차량 찾기 또는 새 차량 생성
  const ensureVehicleExists = async (licensePlate: string): Promise<string> => {
    if (!licensePlate.trim()) {
      throw new Error('차량번호가 없습니다.');
    }

    // 먼저 기존 차량 찾기
    let existingVehicle = vehicles.find(v => v.licensePlate === licensePlate);

    if (!existingVehicle) {
      // 서버에서도 찾아보기
      existingVehicle = await findVehicleByLicensePlate(licensePlate);
    }

    if (existingVehicle) {
      return existingVehicle.id;
    }

    // 없으면 새로 생성
    try {
      const newVehicle = await saveVehicle({
        licensePlate: licensePlate,
      });

      // 차량 목록 새로고침
      const updatedVehicles = await getVehicles();
      setVehicles(updatedVehicles);

      toast({
        title: "새 차량 등록",
        description: `차량번호 ${licensePlate}가 자동으로 등록되었습니다.`,
      });

      return newVehicle.id;
    } catch (error) {
      console.error('Error creating new vehicle:', error);
      throw new Error(`차량 ${licensePlate} 생성 중 오류가 발생했습니다.`);
    }
  };

  // 차량 선택 처리
  const handleVehicleSelect = useCallback((rowId: string, result: SearchResult) => {
    const licensePlate = result.value;
    updateRow(rowId, 'licensePlate', licensePlate);

    if (result.metadata?.vehicleId) {
      updateRow(rowId, 'vehicleId', result.metadata.vehicleId);
      const vehicle = result.metadata.vehicle;
      if (vehicle?.defaultUnitPrice) {
        updateRow(rowId, 'unitPrice', vehicle.defaultUnitPrice.toString());
      }
    } else {
      updateRow(rowId, 'vehicleId', '');
    }

    addRecentVehicle(licensePlate);
  }, [updateRow]);

  // 장소 선택 처리
  const handleLocationSelect = useCallback((rowId: string, field: 'departure' | 'destination', result: SearchResult) => {
    const location = result.value;
    updateRow(rowId, field, location);
    addRecentLocation(location);

    // 스마트 가격 로딩 로직 (setTimeout으로 다른 상태 업데이트와 분리)
    setTimeout(() => {
      const currentRow = rows.find(r => r.id === rowId);
      if (currentRow) {
        const departure = field === 'departure' ? location : currentRow.departure;
        const destination = field === 'destination' ? location : currentRow.destination;

        if (departure && destination && departure !== destination) {
          loadSmartPrice(rowId, departure, destination);
        }
      }
    }, 100);
  }, [updateRow, rows]);

  // 운전자 선택 처리
  const handleDriverSelect = useCallback((rowId: string, result: SearchResult) => {
    const driver = result.value;
    updateRow(rowId, 'driverName', driver);
    addRecentDriver(driver);
  }, [updateRow]);

  const loadSmartPrice = useCallback(async (rowId: string, departure: string, destination: string) => {
    if (!departure || !destination || departure === destination) {
      return;
    }

    const currentRow = rows.find(r => r.id === rowId);
    if (!currentRow) {
      return;
    }

    const canLoadSmartPrice =
      currentRow.unitPrice === '1' ||
      currentRow.isPriceAutoLoaded === true;

    if (!canLoadSmartPrice) {
      return;
    }

    const existingTimeout = smartPriceTimeouts.current.get(rowId);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    const timeoutId = setTimeout(async () => {
      try {
        setPriceLoadingRows(prev => new Set([...prev, rowId]));

        const recentPrice = await getRecentUnitPrice(departure, destination);

        if (recentPrice) {
          setRows(prevRows => {
            const targetRow = prevRows.find(r => r.id === rowId);
            if (!targetRow) {
              return prevRows;
            }

            const canUpdate =
              targetRow.unitPrice === '1' ||
              targetRow.isPriceAutoLoaded === true;

            if (!canUpdate) {
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
        }
      } catch (error) {
        console.error('Smart pricing error:', error);
      } finally {
        setPriceLoadingRows(prev => {
          const newSet = new Set(prev);
          newSet.delete(rowId);
          return newSet;
        });
        smartPriceTimeouts.current.delete(rowId);
      }
    }, 500);

    smartPriceTimeouts.current.set(rowId, timeoutId);
  }, [rows, toast]);

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
          date = new Date();
        }
      } else {
        date = new Date();
      }

      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    for (const row of rows) {
      // 빈 행 체크 (개선됨)
      if (!row.departure && !row.destination && !row.licensePlate && (!row.unitPrice || row.unitPrice === '0')) {
        continue;
      }

      // 필수 필드 체크
      if (!row.date || !row.licensePlate || !row.departure || !row.destination) {
        errors.push(`${row.licensePlate || '차량번호 없음'} ${row.departure || '출발지 없음'} → ${row.destination || '목적지 없음'}: 필수 정보가 누락되었습니다.`);
        continue;
      }

      // unitPrice와 count 검증 (개선됨)
      const unitPrice = parseFloat(row.unitPrice);
      const count = parseInt(row.count);

      if (!row.unitPrice || isNaN(unitPrice) || unitPrice < 1) {
        errors.push(`${row.licensePlate} ${row.departure} → ${row.destination}: 단가는 1원 이상이어야 합니다. (현재: ${row.unitPrice || '빈값'})`);
        continue;
      }

      if (!row.count || isNaN(count) || count < 1) {
        errors.push(`${row.licensePlate} ${row.departure} → ${row.destination}: 횟수는 1회 이상이어야 합니다. (현재: ${row.count || '빈값'})`);
        continue;
      }

      try {
        // 1. 차량 자동 생성 또는 찾기
        const vehicleId = await ensureVehicleExists(row.licensePlate);

        // 2. 출발지 자동 생성 또는 찾기
        await ensureLocationExists(row.departure);

        // 3. 목적지 자동 생성 또는 찾기 (출발지와 다른 경우에만)
        if (row.destination !== row.departure) {
          await ensureLocationExists(row.destination);
        }

        const dateToSave = formatDateForSupabase(row.date);

        await saveTrip({
          date: dateToSave,
          departure: row.departure,
          destination: row.destination,
          unitPrice: unitPrice,
          count: count,
          vehicleId: vehicleId,
          ...(row.driverName && { driverName: row.driverName }),
          ...(row.memo && { memo: row.memo }),
        });

        clearRoutePriceCache(row.departure, row.destination);
        savedCount++;
      } catch (error) {
        console.error('Save trip error:', error);
        errors.push(`${row.licensePlate} ${row.departure} → ${row.destination}: ${error instanceof Error ? error.message : '저장 중 오류가 발생했습니다.'}`);
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
      // 새로 생성된 장소들이 있을 수 있으므로 장소 목록 새로고침
      await loadInitialData();

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

  const totalAmount = useMemo(() => {
    return rows.reduce((sum, row) => {
      const unitPrice = parseFloat(row.unitPrice) || 0;
      const count = parseInt(row.count) || 0;
      return sum + (unitPrice * count);
    }, 0);
  }, [rows]);

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
          <div className="w-full">
            <table className="w-full table-fixed">
              <thead className="bg-gray-50">
                <tr>
                  <th className="w-[8%] px-2 py-3 text-left text-xs font-medium text-gray-700">날짜</th>
                  <th className="w-[15%] px-2 py-3 text-left text-xs font-medium text-gray-700">차량번호</th>
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
                {rows.map((row) => (
                  <DesktopTripRow
                    key={row.id}
                    row={row}
                    favoriteVehicles={getFavoriteVehicles()}
                    favoriteLocations={getFavoriteLocations()}
                    onUpdate={updateRow}
                    onVehicleSelect={handleVehicleSelect}
                    onLocationSelect={handleLocationSelect}
                    onDriverSelect={handleDriverSelect}
                    onRemove={removeRow}
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
              favoriteVehicles={getFavoriteVehicles()}
              favoriteLocations={getFavoriteLocations()}
              onUpdate={updateRow}
              onVehicleSelect={handleVehicleSelect}
              onLocationSelect={handleLocationSelect}
              onDriverSelect={handleDriverSelect}
              onRemove={removeRow}
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
  favoriteVehicles: SearchResult[];
  favoriteLocations: SearchResult[];
  onUpdate: (id: string, field: keyof TripRow, value: any) => void;
  onVehicleSelect: (rowId: string, result: SearchResult) => void;
  onLocationSelect: (rowId: string, field: 'departure' | 'destination', result: SearchResult) => void;
  onDriverSelect: (rowId: string, result: SearchResult) => void;
  onRemove: (id: string) => void;
  isPriceLoading: boolean;
}

const DesktopTripRow: React.FC<TripRowProps> = ({
  row,
  favoriteVehicles,
  favoriteLocations,
  onUpdate,
  onVehicleSelect,
  onLocationSelect,
  onDriverSelect,
  onRemove,
  isPriceLoading
}) => {
  const totalAmount = useMemo(() => {
    const unitPrice = parseFloat(row.unitPrice) || 0;
    const count = parseInt(row.count) || 0;
    return unitPrice * count;
  }, [row.unitPrice, row.count]);

  return (
    <tr className="border-b hover:bg-gray-50">
      <td className="px-2 py-3 relative">
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

      <td className="px-2 py-3 relative">
        <SmartInput
          value={row.licensePlate}
          onChange={(value) => onUpdate(row.id, 'licensePlate', value)}
          onSelect={(result) => onVehicleSelect(row.id, result)}
          placeholder="차량번호"
          className="text-xs h-8"
          searchFunction={searchVehicles}
          recentItems={getRecentVehicles()}
          favoriteItems={favoriteVehicles}
          debounceMs={300}
        />
      </td>

      <td className="px-2 py-3 relative">
        <SmartInput
          value={row.departure}
          onChange={(value) => onUpdate(row.id, 'departure', value)}
          onSelect={(result) => onLocationSelect(row.id, 'departure', result)}
          placeholder="출발지"
          className="text-xs h-8"
          searchFunction={searchLocations}
          recentItems={getRecentLocations()}
          favoriteItems={favoriteLocations}
          debounceMs={300}
        />
      </td>

      <td className="px-2 py-3 relative">
        <SmartInput
          value={row.destination}
          onChange={(value) => onUpdate(row.id, 'destination', value)}
          onSelect={(result) => onLocationSelect(row.id, 'destination', result)}
          placeholder="목적지"
          className="text-xs h-8"
          searchFunction={searchLocations}
          recentItems={getRecentLocations()}
          favoriteItems={favoriteLocations}
          debounceMs={300}
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
            step="1000"
          />
          {isPriceLoading && (
            <div className="absolute right-2 top-2">
              <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
            </div>
          )}
          {row.isPriceAutoLoaded && !isPriceLoading && (
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
        />
      </td>

      <td className="px-2 py-3">
        <div className="font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded text-center text-xs">
          {totalAmount.toLocaleString()}원
        </div>
      </td>

      <td className="px-2 py-3 relative">
        <SmartInput
          value={row.driverName}
          onChange={(value) => onUpdate(row.id, 'driverName', value)}
          onSelect={(result) => onDriverSelect(row.id, result)}
          placeholder="운전자"
          className="text-xs h-8"
          searchFunction={searchDrivers}
          recentItems={getRecentDrivers()}
          favoriteItems={[]}
          debounceMs={300}
        />
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
  favoriteVehicles,
  favoriteLocations,
  onUpdate,
  onVehicleSelect,
  onLocationSelect,
  onDriverSelect,
  onRemove,
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
                locale={ko}  // 👈 이 부분 추가
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label className="text-sm">차량번호</Label>
          <SmartInput
            value={row.licensePlate}
            onChange={(value) => onUpdate(row.id, 'licensePlate', value)}
            onSelect={(result) => onVehicleSelect(row.id, result)}
            placeholder="차량번호"
            searchFunction={searchVehicles}
            recentItems={getRecentVehicles()}
            favoriteItems={favoriteVehicles}
            debounceMs={300}
          />
        </div>

        <div className="space-y-2">
          <Label className="text-sm">출발지</Label>
          <SmartInput
            value={row.departure}
            onChange={(value) => onUpdate(row.id, 'departure', value)}
            onSelect={(result) => onLocationSelect(row.id, 'departure', result)}
            placeholder="출발지"
            searchFunction={searchLocations}
            recentItems={getRecentLocations()}
            favoriteItems={favoriteLocations}
            debounceMs={300}
          />
        </div>

        <div className="space-y-2">
          <Label className="text-sm">목적지</Label>
          <SmartInput
            value={row.destination}
            onChange={(value) => onUpdate(row.id, 'destination', value)}
            onSelect={(result) => onLocationSelect(row.id, 'destination', result)}
            placeholder="목적지"
            searchFunction={searchLocations}
            recentItems={getRecentLocations()}
            favoriteItems={favoriteLocations}
            debounceMs={300}
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
              min="1"
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
        <SmartInput
          value={row.driverName}
          onChange={(value) => onUpdate(row.id, 'driverName', value)}
          onSelect={(result) => onDriverSelect(row.id, result)}
          placeholder="운전자명"
          searchFunction={searchDrivers}
          recentItems={getRecentDrivers()}
          favoriteItems={[]}
          debounceMs={300}
        />
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