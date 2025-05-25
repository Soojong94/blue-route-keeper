// src/components/TripInput.tsx
import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { CalendarIcon, Car, MapPin, Calculator, Plus, Trash2 } from 'lucide-react';
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
      id: crypto.randomUUID(),
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
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 min-w-[120px]">날짜</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 min-w-[200px]">차량</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 min-w-[150px]">출발지</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 min-w-[150px]">목적지</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 min-w-[100px]">단가</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 min-w-[80px]">횟수</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 min-w-[120px]">총액</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 min-w-[120px]">운전자</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 min-w-[100px]">메모</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-700 w-[60px]">삭제</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <TripRow
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

        <div className="p-4 border-t bg-gray-50 flex justify-between">
          <Button variant="outline" onClick={addRow}>
            <Plus className="mr-2 h-4 w-4" />
            행 추가
          </Button>
          <Button onClick={saveAllRows} className="bg-blue-600 hover:bg-blue-700">
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

const TripRow: React.FC<TripRowProps> = ({
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

  const selectedVehicle = vehicles.find(v => v.id === row.vehicleId);

  return (
    <tr className="border-b hover:bg-gray-50">
      {/* 날짜 */}
      <td className="px-4 py-3">
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
      </td>

      {/* 차량 */}
      <td className="px-4 py-3">
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
      </td>

      {/* 출발지 */}
      <td className="px-4 py-3">
        <Input
          value={row.departure}
          onChange={(e) => onUpdate(row.id, 'departure', e.target.value)}
          placeholder="출발지"
          list={`departures-${row.id}`}
        />
        <datalist id={`departures-${row.id}`}>
          {locations.map((loc) => (
            <option key={loc.id} value={loc.alias || loc.name} />
          ))}
          {recentData.departures.map((dep, idx) => (
            <option key={`recent-${idx}`} value={dep} />
          ))}
        </datalist>
      </td>

      {/* 목적지 */}
      <td className="px-4 py-3">
        <Input
          value={row.destination}
          onChange={(e) => onUpdate(row.id, 'destination', e.target.value)}
          placeholder="목적지"
          list={`destinations-${row.id}`}
        />
        <datalist id={`destinations-${row.id}`}>
          {locations.map((loc) => (
            <option key={loc.id} value={loc.alias || loc.name} />
          ))}
          {recentData.destinations.map((dest, idx) => (
            <option key={`recent-${idx}`} value={dest} />
          ))}
        </datalist>
      </td>

      {/* 단가 */}
      <td className="px-4 py-3">
        <Input
          type="number"
          value={row.unitPrice}
          onChange={(e) => onUpdate(row.id, 'unitPrice', e.target.value)}
          placeholder="단가"
          min="0"
        />
      </td>

      {/* 횟수 */}
      <td className="px-4 py-3">
        <Input
          type="number"
          value={row.count}
          onChange={(e) => onUpdate(row.id, 'count', e.target.value)}
          placeholder="횟수"
          min="1"
        />
      </td>

      {/* 총액 */}
      <td className="px-4 py-3">
        <div className="font-semibold text-blue-600 bg-blue-50 px-3 py-2 rounded text-center">
          {totalAmount.toLocaleString()}원
        </div>
      </td>

      {/* 운전자 */}
      <td className="px-4 py-3">
        <Input
          value={row.driverName}
          onChange={(e) => onUpdate(row.id, 'driverName', e.target.value)}
          placeholder="운전자 (선택)"
          list={`drivers-${row.id}`}
        />
        <datalist id={`drivers-${row.id}`}>
          {recentData.drivers.map((driver, idx) => (
            <option key={idx} value={driver} />
          ))}
        </datalist>
      </td>

      {/* 메모 */}
      <td className="px-4 py-3">
        <Input
          value={row.memo}
          onChange={(e) => onUpdate(row.id, 'memo', e.target.value)}
          placeholder="메모 (선택)"
        />
      </td>

      {/* 삭제 */}
      <td className="px-4 py-3 text-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onRemove(row.id)}
          className="text-red-500 hover:text-red-700"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </td>
    </tr>
  );
};

export default TripInput;