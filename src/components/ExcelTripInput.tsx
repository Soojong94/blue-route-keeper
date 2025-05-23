
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { CalendarIcon, Clock, MapPin, DollarSign, Car, User, FileText, Plus, Trash2, Save } from 'lucide-react';
import { saveTrip } from '@/utils/tripStorage';
import { getVehicles } from '@/utils/vehicleStorage';
import { useToast } from '@/hooks/use-toast';
import { Vehicle, Trip } from '@/types/trip';

interface ExcelTripInputProps {
  onTripSaved: () => void;
}

interface TripRow {
  id: string;
  date: string;
  driverName: string;
  vehicleId: string;
  startTime: string;
  endTime: string;
  departure: string;
  destination: string;
  amount: string;
  purpose: string;
}

const ExcelTripInput: React.FC<ExcelTripInputProps> = ({ onTripSaved }) => {
  const [rows, setRows] = useState<TripRow[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [recentDrivers, setRecentDrivers] = useState<string[]>([]);
  const [recentLocations, setRecentLocations] = useState<{
    departures: string[];
    destinations: string[];
  }>({
    departures: [],
    destinations: []
  });
  
  const { toast } = useToast();

  // Load vehicles and recent data on mount
  useEffect(() => {
    // Load vehicles
    setVehicles(getVehicles());
    
    // Load recent drivers from localStorage
    const loadRecentDrivers = () => {
      try {
        const savedTrips = JSON.parse(localStorage.getItem('car-trips') || '[]');
        const driversFromStorage = savedTrips.map((trip: any) => trip.driverName)
          .filter((driver: string | null | undefined) => driver) // Remove null/undefined values
          .filter((value: string, index: number, self: string[]) => self.indexOf(value) === index); // Deduplicate
        
        setRecentDrivers(driversFromStorage as string[]);
      } catch (error) {
        console.error('Error loading recent drivers:', error);
        setRecentDrivers([]);
      }
    };
    
    // Load recent locations from localStorage
    const loadRecentLocations = () => {
      try {
        const savedTrips = JSON.parse(localStorage.getItem('car-trips') || '[]');
        
        const departuresFromStorage = savedTrips.map((trip: any) => trip.departure)
          .filter((place: string | null | undefined) => place)
          .filter((value: string, index: number, self: string[]) => self.indexOf(value) === index);
        
        const destinationsFromStorage = savedTrips.map((trip: any) => trip.destination)
          .filter((place: string | null | undefined) => place)
          .filter((value: string, index: number, self: string[]) => self.indexOf(value) === index);
        
        setRecentLocations({
          departures: departuresFromStorage as string[],
          destinations: destinationsFromStorage as string[]
        });
      } catch (error) {
        console.error('Error loading recent locations:', error);
        setRecentLocations({ departures: [], destinations: [] });
      }
    };
    
    loadRecentDrivers();
    loadRecentLocations();
    
    // Add a default row if no rows exist
    if (rows.length === 0) {
      addNewRow();
    }
  }, []);

  // Generate default values for a new row
  const createDefaultRow = (): TripRow => {
    const now = new Date();
    const defaultStartTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
    const defaultEndTime = `${String(oneHourLater.getHours()).padStart(2, '0')}:${String(oneHourLater.getMinutes()).padStart(2, '0')}`;
    
    return {
      id: `row-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      date: format(now, 'yyyy-MM-dd'),
      driverName: '',
      vehicleId: '',
      startTime: defaultStartTime,
      endTime: defaultEndTime,
      departure: '',
      destination: '',
      amount: '',
      purpose: ''
    };
  };
  
  // Add a new row to the table
  const addNewRow = () => {
    setRows([...rows, createDefaultRow()]);
  };
  
  // Remove a row from the table
  const removeRow = (id: string) => {
    setRows(rows.filter(row => row.id !== id));
  };
  
  // Handle cell value changes
  const handleChange = (id: string, field: keyof TripRow, value: string) => {
    setRows(
      rows.map(row => 
        row.id === id ? { ...row, [field]: value } : row
      )
    );
  };
  
  // Save all rows as trips
  const saveAllRows = () => {
    let hasErrors = false;
    let savedCount = 0;
    
    // Validate and save each row
    rows.forEach(row => {
      // Skip empty rows (no driver, departure, destination, or amount)
      if (!row.driverName && !row.departure && !row.destination && !row.amount) {
        return;
      }
      
      // Validate required fields
      if (!row.date || !row.driverName || !row.vehicleId || !row.departure || 
          !row.destination || !row.amount || !row.startTime || !row.endTime) {
        hasErrors = true;
        return;
      }
      
      // Validate time
      if (row.startTime >= row.endTime) {
        hasErrors = true;
        return;
      }
      
      // Validate amount
      const amountNumber = parseFloat(row.amount);
      if (isNaN(amountNumber) || amountNumber < 0) {
        hasErrors = true;
        return;
      }
      
      // Save the trip
      try {
        saveTrip({
          date: row.date,
          startTime: row.startTime,
          endTime: row.endTime,
          departure: row.departure,
          destination: row.destination,
          amount: parseInt(row.amount),
          vehicleId: row.vehicleId,
          driverName: row.driverName,
          purpose: row.purpose
        });
        savedCount++;
      } catch (error) {
        console.error('Error saving trip:', error);
        hasErrors = true;
      }
    });
    
    // Show result toast
    if (hasErrors) {
      toast({
        title: "저장 실패",
        description: "일부 항목을 저장하는 데 문제가 있습니다. 입력 내용을 확인해 주세요.",
        variant: "destructive",
      });
    } else if (savedCount > 0) {
      toast({
        title: "저장 완료",
        description: `${savedCount}건의 운행 기록이 저장되었습니다.`,
      });
      
      // Reset the table with one empty row
      setRows([createDefaultRow()]);
      
      // Notify parent component
      onTripSaved();
    } else {
      toast({
        title: "저장할 항목 없음",
        description: "저장할 운행 기록이 없습니다.",
      });
    }
  };

  // Calculate totals for the summary
  const totalTrips = rows.filter(row => 
    row.driverName && row.departure && row.destination && row.amount
  ).length;
  
  const totalAmount = rows.reduce((sum, row) => {
    const amount = parseFloat(row.amount) || 0;
    return sum + amount;
  }, 0);
  
  // Get vehicle name by ID
  const getVehicleName = (vehicleId: string) => {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    return vehicle ? `${vehicle.name} (${vehicle.licensePlate})` : '';
  };

  return (
    <Card className="w-full">
      <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-t-lg">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            운행 기록 일괄 입력
          </CardTitle>
          <div className="text-sm">
            {format(new Date(), 'yyyy년 MM월 dd일', { locale: ko })}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {/* Summary Section */}
        <div className="grid grid-cols-2 gap-4 p-4 bg-blue-50 border-b border-blue-100">
          <div className="text-center p-2 bg-white rounded-md shadow-sm">
            <div className="text-sm text-blue-600">총 입력 건수</div>
            <div className="text-2xl font-semibold">{totalTrips}건</div>
          </div>
          <div className="text-center p-2 bg-white rounded-md shadow-sm">
            <div className="text-sm text-green-600">총 금액</div>
            <div className="text-2xl font-semibold">
              {new Intl.NumberFormat('ko-KR').format(totalAmount)}원
            </div>
          </div>
        </div>
        
        {/* Vehicle Warning If No Vehicles */}
        {vehicles.length === 0 && (
          <div className="p-4 bg-amber-50 border-b border-amber-100 text-center">
            <p className="text-amber-700 mb-2">등록된 차량이 없습니다. 차량을 먼저 등록해주세요.</p>
            <Button 
              variant="outline" 
              size="sm"
              className="bg-white border-amber-500 text-amber-700 hover:bg-amber-100"
              onClick={() => {
                const activeTabElement = document.querySelector('[data-state="active"][value="vehicles"]');
                if (activeTabElement) {
                  (activeTabElement as HTMLElement).click();
                }
              }}
            >
              <Car className="mr-2 h-4 w-4" />
              차량 등록하기
            </Button>
          </div>
        )}

        {/* Excel-like Table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead className="w-[100px]">날짜</TableHead>
                <TableHead className="w-[120px]">운전자</TableHead>
                <TableHead className="w-[150px]">차량</TableHead>
                <TableHead className="w-[90px]">출발시간</TableHead>
                <TableHead className="w-[90px]">도착시간</TableHead>
                <TableHead className="w-[140px]">출발지</TableHead>
                <TableHead className="w-[140px]">목적지</TableHead>
                <TableHead className="w-[100px]">금액</TableHead>
                <TableHead className="w-[150px]">메모</TableHead>
                <TableHead className="w-[60px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <Input 
                      type="date" 
                      value={row.date}
                      onChange={(e) => handleChange(row.id, 'date', e.target.value)}
                      className="w-full h-9 p-1"
                    />
                  </TableCell>
                  <TableCell>
                    <Input 
                      type="text" 
                      value={row.driverName}
                      onChange={(e) => handleChange(row.id, 'driverName', e.target.value)}
                      list={`drivers-${row.id}`}
                      className="w-full h-9 p-1"
                      placeholder="운전자명"
                    />
                    <datalist id={`drivers-${row.id}`}>
                      {recentDrivers.map((driver, idx) => (
                        <option key={`driver-${idx}`} value={driver} />
                      ))}
                    </datalist>
                  </TableCell>
                  <TableCell>
                    <Select 
                      value={row.vehicleId}
                      onValueChange={(value) => handleChange(row.id, 'vehicleId', value)}
                    >
                      <SelectTrigger className="h-9 p-1 w-full">
                        <SelectValue placeholder="차량 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        {vehicles.map((vehicle) => (
                          <SelectItem key={vehicle.id} value={vehicle.id}>
                            {vehicle.name} ({vehicle.licensePlate})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Input 
                      type="time" 
                      value={row.startTime}
                      onChange={(e) => handleChange(row.id, 'startTime', e.target.value)}
                      className="w-full h-9 p-1"
                    />
                  </TableCell>
                  <TableCell>
                    <Input 
                      type="time" 
                      value={row.endTime}
                      onChange={(e) => handleChange(row.id, 'endTime', e.target.value)}
                      className="w-full h-9 p-1"
                    />
                  </TableCell>
                  <TableCell>
                    <Input 
                      type="text" 
                      value={row.departure}
                      onChange={(e) => handleChange(row.id, 'departure', e.target.value)}
                      list={`departures-${row.id}`}
                      className="w-full h-9 p-1"
                      placeholder="출발지"
                    />
                    <datalist id={`departures-${row.id}`}>
                      {recentLocations.departures.map((loc, idx) => (
                        <option key={`dep-${idx}`} value={loc} />
                      ))}
                    </datalist>
                  </TableCell>
                  <TableCell>
                    <Input 
                      type="text" 
                      value={row.destination}
                      onChange={(e) => handleChange(row.id, 'destination', e.target.value)}
                      list={`destinations-${row.id}`}
                      className="w-full h-9 p-1"
                      placeholder="목적지"
                    />
                    <datalist id={`destinations-${row.id}`}>
                      {recentLocations.destinations.map((loc, idx) => (
                        <option key={`dest-${idx}`} value={loc} />
                      ))}
                    </datalist>
                  </TableCell>
                  <TableCell>
                    <Input 
                      type="number" 
                      value={row.amount}
                      onChange={(e) => handleChange(row.id, 'amount', e.target.value)}
                      className="w-full h-9 p-1"
                      placeholder="금액"
                      min="0"
                    />
                  </TableCell>
                  <TableCell>
                    <Input 
                      type="text" 
                      value={row.purpose}
                      onChange={(e) => handleChange(row.id, 'purpose', e.target.value)}
                      className="w-full h-9 p-1"
                      placeholder="메모"
                    />
                  </TableCell>
                  <TableCell>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="h-8 w-8 text-red-500"
                      onClick={() => removeRow(row.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        {/* Action Buttons */}
        <div className="p-4 border-t border-gray-200 flex justify-between">
          <Button 
            variant="outline" 
            onClick={addNewRow}
            className="flex items-center"
          >
            <Plus className="mr-1 h-4 w-4" />
            새 행 추가
          </Button>
          
          <Button 
            onClick={saveAllRows}
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
          >
            <Save className="mr-1 h-4 w-4" />
            일괄 저장
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ExcelTripInput;
