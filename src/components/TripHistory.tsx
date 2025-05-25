import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { ko } from 'date-fns/locale';
import { CalendarIcon, BarChart3, MapPin, Clock, Trash2, Search, Edit, Car, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getTripsByDateRange, deleteTrip, updateTrip } from '@/utils/tripStorage';
import { getVehicles } from '@/utils/vehicleStorage';
import { getLocations } from '@/utils/locationStorage';
import { Trip, Vehicle, Location } from '@/types/trip';
import { useToast } from '@/hooks/use-toast';

interface TripHistoryProps {
  refreshTrigger: number;
}

interface FilterOptions {
  vehicleId: string;
  location: string;
  driverName: string;
  searchQuery: string;
}

interface VehicleStats {
  id: string;
  name: string;
  trips: number;
  totalAmount: number;
  avgAmount: number;
}

const TripHistory: React.FC<TripHistoryProps> = ({ refreshTrigger }) => {
  const [startDate, setStartDate] = useState<Date>(startOfMonth(new Date()));
  const [endDate, setEndDate] = useState<Date>(endOfMonth(new Date()));
  const [allTrips, setAllTrips] = useState<Trip[]>([]);
  const [filteredTrips, setFilteredTrips] = useState<Trip[]>([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [vehicleStats, setVehicleStats] = useState<VehicleStats[]>([]);
  const [filters, setFilters] = useState<FilterOptions>({
    vehicleId: 'all',
    location: '',
    driverName: '',
    searchQuery: '',
  });
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const { toast } = useToast();

  useEffect(() => {
    loadTrips();
    loadVehicles();
    loadLocations();
  }, [startDate, endDate, refreshTrigger]);

  useEffect(() => {
    applyFilters();
  }, [allTrips, filters]);

  const loadTrips = () => {
    const trips = getTripsByDateRange(startDate, endDate);
    setAllTrips(trips);
    setFilteredTrips(trips);
    setTotalAmount(trips.reduce((sum, trip) => sum + trip.amount, 0));
    calculateVehicleStats(trips);
  };

  const loadVehicles = () => {
    setVehicles(getVehicles());
  };

  const loadLocations = () => {
    setLocations(getLocations());
  };

  // Helper function to get location name
  const getLocationDisplayName = (locationValue: string): string => {
    // First check if it's a registered location by ID
    const location = locations.find(loc => loc.id === locationValue);
    if (location) {
      return location.alias || location.name;
    }
    
    // If not found as ID, return the value as is (it's probably a direct text input)
    return locationValue;
  };

  const calculateVehicleStats = (trips: Trip[]) => {
    const stats: Record<string, { trips: number, totalAmount: number }> = {};
    
    // Initialize stats for all vehicles
    getVehicles().forEach(vehicle => {
      stats[vehicle.id] = { trips: 0, totalAmount: 0 };
    });
    
    // Add data from trips
    trips.forEach(trip => {
      if (stats[trip.vehicleId]) {
        stats[trip.vehicleId].trips++;
        stats[trip.vehicleId].totalAmount += trip.amount;
      }
    });
    
    // Convert to array with calculated averages
    const statsArray: VehicleStats[] = getVehicles().map(vehicle => {
      const vehicleStats = stats[vehicle.id] || { trips: 0, totalAmount: 0 };
      return {
        id: vehicle.id,
        name: vehicle.name,
        trips: vehicleStats.trips,
        totalAmount: vehicleStats.totalAmount,
        avgAmount: vehicleStats.trips > 0 
          ? vehicleStats.totalAmount / vehicleStats.trips 
          : 0
      };
    });
    
    setVehicleStats(statsArray);
  };

  const applyFilters = () => {
    let filtered = [...allTrips];
    
    // Apply vehicle filter
    if (filters.vehicleId !== 'all') {
      filtered = filtered.filter(trip => trip.vehicleId === filters.vehicleId);
    }
    
    // Apply location filter
    if (filters.location) {
      const locationQuery = filters.location.toLowerCase();
      filtered = filtered.filter(
        trip => {
          const departureDisplay = getLocationDisplayName(trip.departure).toLowerCase();
          const destinationDisplay = getLocationDisplayName(trip.destination).toLowerCase();
          return departureDisplay.includes(locationQuery) || destinationDisplay.includes(locationQuery);
        }
      );
    }
    
    // Apply driver filter
    if (filters.driverName) {
      filtered = filtered.filter(
        trip => trip.driverName.toLowerCase().includes(filters.driverName.toLowerCase())
      );
    }
    
    // Apply search query
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter(
        trip => {
          const departureDisplay = getLocationDisplayName(trip.departure).toLowerCase();
          const destinationDisplay = getLocationDisplayName(trip.destination).toLowerCase();
          return destinationDisplay.includes(query) || 
                 departureDisplay.includes(query) ||
                 trip.driverName.toLowerCase().includes(query) ||
                 trip.purpose.toLowerCase().includes(query);
        }
      );
    }
    
    setFilteredTrips(filtered);
    setTotalAmount(filtered.reduce((sum, trip) => sum + trip.amount, 0));
  };

  const handleFilterChange = (key: keyof FilterOptions, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleDeleteTrip = (id: string) => {
    try {
      deleteTrip(id);
      loadTrips();
      toast({
        title: "삭제 완료",
        description: "운행 기록이 삭제되었습니다.",
      });
    } catch (error) {
      toast({
        title: "삭제 실패",
        description: "운행 기록 삭제 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  const handleEditTrip = (trip: Trip) => {
    setEditingTrip(trip);
    setIsDialogOpen(true);
  };

  const saveEditedTrip = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTrip) return;

    try {
      updateTrip(editingTrip.id, editingTrip);
      setIsDialogOpen(false);
      loadTrips();
      toast({
        title: "수정 완료",
        description: "운행 기록이 수정되었습니다.",
      });
    } catch (error) {
      toast({
        title: "수정 실패",
        description: "운행 기록 수정 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR').format(amount);
  };

  return (
    <Card className="w-full">
      {/* 기간 선택 */}
      <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-t-lg">
        <CardTitle className="text-xl font-bold flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          운행 기록 조회
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* 기간 선택 */}
          <div className="flex flex-col sm:flex-row gap-2 items-center">
            <span className="text-sm font-medium text-gray-700">조회 기간:</span>
            <div className="flex flex-col sm:flex-row gap-2 items-center">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full sm:w-[140px] justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "MM/dd", { locale: ko }) : "시작일"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={(date) => date && setStartDate(date)}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>

              <span className="text-gray-500">~</span>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full sm:w-[140px] justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "MM/dd", { locale: ko }) : "종료일"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={(date) => date && setEndDate(date)}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* 검색 필드 */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <Input
              placeholder="검색 (목적지, 운전자, 메모 등)"
              className="pl-9"
              value={filters.searchQuery}
              onChange={(e) => handleFilterChange('searchQuery', e.target.value)}
            />
          </div>
        </div>

        {/* 추가 필터링 옵션 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {/* 차량 필터 */}
          <div>
            <Select 
              value={filters.vehicleId} 
              onValueChange={(value) => handleFilterChange('vehicleId', value)}
            >
              <SelectTrigger className="w-full">
                <div className="flex items-center gap-2">
                  <Car className="h-4 w-4 text-gray-500" />
                  <SelectValue placeholder="모든 차량" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">모든 차량</SelectItem>
                {vehicles.map(vehicle => (
                  <SelectItem key={vehicle.id} value={vehicle.id}>
                    {vehicle.name} ({vehicle.licensePlate})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 출발지/목적지 필터 */}
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <Input
              placeholder="출발지/목적지 필터"
              className="pl-9"
              value={filters.location}
              onChange={(e) => handleFilterChange('location', e.target.value)}
            />
          </div>

          {/* 운전자 필터 */}
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <Input
              placeholder="운전자명 필터"
              className="pl-9"
              value={filters.driverName}
              onChange={(e) => handleFilterChange('driverName', e.target.value)}
            />
          </div>
        </div>
      </CardContent>
    </Card>

    {/* 통계 요약 */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">총 운행 횟수</p>
              <p className="text-3xl font-bold text-blue-800">{filteredTrips.length}회</p>
            </div>
            <MapPin className="h-8 w-8 text-blue-500" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">총 금액</p>
              <p className="text-3xl font-bold text-green-800">{formatCurrency(totalAmount)}원</p>
            </div>
            <BarChart3 className="h-8 w-8 text-green-500" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600">평균 금액</p>
              <p className="text-3xl font-bold text-purple-800">
                {filteredTrips.length > 0 
                  ? formatCurrency(Math.round(totalAmount / filteredTrips.length)) 
                  : '0'}원
              </p>
            </div>
            <BarChart3 className="h-8 w-8 text-purple-500" />
          </div>
        </CardContent>
      </Card>
    </div>

    {/* 차량별 통계 */}
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-800">차량별 통계</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>차량</TableHead>
                <TableHead>운행 횟수</TableHead>
                <TableHead>총 금액</TableHead>
                <TableHead>평균 금액</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vehicleStats.length > 0 ? (
                vehicleStats.map((stat) => (
                  <TableRow key={stat.id}>
                    <TableCell className="font-medium">{stat.name}</TableCell>
                    <TableCell>{stat.trips}회</TableCell>
                    <TableCell>{formatCurrency(stat.totalAmount)}원</TableCell>
                    <TableCell>
                      {stat.trips > 0 ? `${formatCurrency(Math.round(stat.avgAmount))}원` : '-'}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-4 text-gray-500">
                    차량 통계 데이터가 없습니다
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>

    {/* 운행 목록 테이블 */}
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-800">운행 목록</CardTitle>
      </CardHeader>
      <CardContent>
        {filteredTrips.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            선택된 기간 및 조건에 맞는 운행 기록이 없습니다.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">날짜</TableHead>
                  <TableHead className="w-[120px]">시간</TableHead>
                  <TableHead>차량</TableHead>
                  <TableHead>운전자</TableHead>
                  <TableHead>출발지</TableHead>
                  <TableHead>목적지</TableHead>
                  <TableHead className="text-right w-[100px]">금액</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTrips.map((trip) => (
                  <TableRow key={trip.id} className="hover:bg-gray-50">
                    <TableCell className="font-medium">
                      {format(new Date(trip.date), 'MM/dd', { locale: ko })}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Clock className="h-3 w-3 text-gray-400" />
                        <span>{trip.startTime}</span>
                        <span className="text-gray-400">~</span>
                        <span>{trip.endTime}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {vehicles.find(v => v.id === trip.vehicleId)?.name || '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                        {trip.driverName}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        {getLocationDisplayName(trip.departure)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        {getLocationDisplayName(trip.destination)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(trip.amount)}원
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditTrip(trip)}
                          className="h-8 w-8 p-0 text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteTrip(trip.id)}
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>

    {/* Edit Trip Dialog */}
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>운행 기록 수정</DialogTitle>
        </DialogHeader>
        {editingTrip && (
          <form onSubmit={saveEditedTrip} className="space-y-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-vehicle">차량</Label>
                <Select 
                  value={editingTrip.vehicleId} 
                  onValueChange={(value) => setEditingTrip({...editingTrip, vehicleId: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="차량을 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {vehicles.map(vehicle => (
                      <SelectItem key={vehicle.id} value={vehicle.id}>
                        {vehicle.name} ({vehicle.licensePlate})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-driver">운전자</Label>
                <Input
                  id="edit-driver"
                  value={editingTrip.driverName}
                  onChange={(e) => setEditingTrip({...editingTrip, driverName: e.target.value})}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-departure">출발지</Label>
                <Input
                  id="edit-departure"
                  value={editingTrip.departure}
                  onChange={(e) => setEditingTrip({...editingTrip, departure: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-destination">목적지</Label>
                <Input
                  id="edit-destination"
                  value={editingTrip.destination}
                  onChange={(e) => setEditingTrip({...editingTrip, destination: e.target.value})}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-amount">금액</Label>
                <Input
                  id="edit-amount"
                  type="number"
                  value={editingTrip.amount}
                  onChange={(e) => setEditingTrip({
                    ...editingTrip, 
                    amount: parseInt(e.target.value) || 0
                  })}
                  min="0"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-purpose">목적/메모</Label>
                <Input
                  id="edit-purpose"
                  value={editingTrip.purpose}
                  onChange={(e) => setEditingTrip({...editingTrip, purpose: e.target.value})}
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                취소
              </Button>
              <Button
                type="submit"
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
              >
                저장
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default TripHistory;
