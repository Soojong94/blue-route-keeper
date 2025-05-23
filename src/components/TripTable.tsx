
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { format, startOfMonth, endOfMonth, differenceInDays } from 'date-fns';
import { ko } from 'date-fns/locale';
import { CalendarIcon, ArrowDown, ArrowUp, Trash2, Download, Edit, Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getTrips, getTripsByDateRange, deleteTrip, updateTrip } from '@/utils/tripStorage';
import { getVehicles } from '@/utils/vehicleStorage';
import { Trip, Vehicle } from '@/types/trip';
import { useToast } from '@/hooks/use-toast';

interface TripTableProps {
  refreshTrigger: number;
}

type SortField = 'date' | 'driverName' | 'vehicleId' | 'startTime' | 'endTime' | 'departure' | 'destination' | 'amount';
type SortDirection = 'asc' | 'desc';

interface SortState {
  field: SortField;
  direction: SortDirection;
}

const TripTable: React.FC<TripTableProps> = ({ refreshTrigger }) => {
  // State for filtering and pagination
  const [startDate, setStartDate] = useState<Date>(startOfMonth(new Date()));
  const [endDate, setEndDate] = useState<Date>(endOfMonth(new Date()));
  const [trips, setTrips] = useState<Trip[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [filteredTrips, setFilteredTrips] = useState<Trip[]>([]);
  const [selectedDriverName, setSelectedDriverName] = useState<string>('all');
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [drivers, setDrivers] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // State for sorting
  const [sortState, setSortState] = useState<SortState>({
    field: 'date',
    direction: 'desc'
  });

  // State for multi-select and editing
  const [selectedTrips, setSelectedTrips] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState<boolean>(false);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState<boolean>(false);

  const { toast } = useToast();

  // Load trips when refreshTrigger, startDate, or endDate changes
  useEffect(() => {
    loadData();
  }, [refreshTrigger, startDate, endDate]);

  // Apply filters, sorting, and pagination when dependencies change
  useEffect(() => {
    filterAndSortTrips();
  }, [trips, searchTerm, selectedDriverName, selectedVehicleId, sortState]);

  const loadData = () => {
    const loadedTrips = getTripsByDateRange(startDate, endDate);
    setTrips(loadedTrips);
    
    // Extract unique driver names
    const uniqueDrivers = [...new Set(loadedTrips.map(trip => trip.driverName))];
    setDrivers(uniqueDrivers);
    
    // Load vehicles
    setVehicles(getVehicles());
    
    // Clear selections when data reloads
    setSelectedTrips(new Set());
    setSelectAll(false);
  };

  const filterAndSortTrips = () => {
    // Apply filters
    let filtered = [...trips];
    
    if (selectedDriverName !== 'all') {
      filtered = filtered.filter(trip => trip.driverName === selectedDriverName);
    }
    
    if (selectedVehicleId !== 'all') {
      filtered = filtered.filter(trip => trip.vehicleId === selectedVehicleId);
    }
    
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(trip => 
        trip.departure.toLowerCase().includes(lowerSearchTerm) ||
        trip.destination.toLowerCase().includes(lowerSearchTerm) ||
        trip.driverName.toLowerCase().includes(lowerSearchTerm) ||
        trip.purpose.toLowerCase().includes(lowerSearchTerm)
      );
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      const { field, direction } = sortState;
      let comparison = 0;
      
      // Implement sorting logic for each field
      switch (field) {
        case 'date':
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
          break;
        case 'driverName':
          comparison = a.driverName.localeCompare(b.driverName);
          break;
        case 'vehicleId':
          comparison = a.vehicleId.localeCompare(b.vehicleId);
          break;
        case 'startTime':
          comparison = a.startTime.localeCompare(b.startTime);
          break;
        case 'endTime':
          comparison = a.endTime.localeCompare(b.endTime);
          break;
        case 'departure':
          comparison = a.departure.localeCompare(b.departure);
          break;
        case 'destination':
          comparison = a.destination.localeCompare(b.destination);
          break;
        case 'amount':
          comparison = a.amount - b.amount;
          break;
        default:
          break;
      }
      
      return direction === 'asc' ? comparison : -comparison;
    });
    
    setFilteredTrips(filtered);
    
    // Reset to first page when filters change
    setCurrentPage(1);
  };

  const handleHeaderClick = (field: SortField) => {
    setSortState(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleSelectAllChange = () => {
    if (selectAll) {
      // Deselect all
      setSelectedTrips(new Set());
    } else {
      // Select all filtered trips
      const newSelected = new Set(paginatedTrips.map(trip => trip.id));
      setSelectedTrips(newSelected);
    }
    setSelectAll(!selectAll);
  };

  const handleTripSelection = (id: string) => {
    const newSelected = new Set(selectedTrips);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedTrips(newSelected);
    
    // Update selectAll state
    setSelectAll(newSelected.size === paginatedTrips.length);
  };

  const handleDeleteSelected = () => {
    try {
      selectedTrips.forEach(id => {
        deleteTrip(id);
      });
      
      toast({
        title: "삭제 완료",
        description: `선택한 ${selectedTrips.size}개의 운행 기록이 삭제되었습니다.`
      });
      
      loadData();
    } catch (error) {
      toast({
        title: "삭제 실패",
        description: "운행 기록 삭제 중 오류가 발생했습니다.",
        variant: "destructive"
      });
    }
  };

  const handleEditTrip = (trip: Trip) => {
    setEditingTrip({...trip});
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = () => {
    if (!editingTrip) return;
    
    try {
      updateTrip(editingTrip.id, editingTrip);
      
      toast({
        title: "수정 완료",
        description: "운행 기록이 수정되었습니다."
      });
      
      setIsEditDialogOpen(false);
      loadData();
    } catch (error) {
      toast({
        title: "수정 실패",
        description: "운행 기록 수정 중 오류가 발생했습니다.",
        variant: "destructive"
      });
    }
  };

  // Pagination logic
  const totalPages = Math.ceil(filteredTrips.length / itemsPerPage);
  const paginatedTrips = filteredTrips.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  
  // Helper functions
  const getVehicleName = (vehicleId: string) => {
    return vehicles.find(v => v.id === vehicleId)?.name || '-';
  };

  const getVehicleLicensePlate = (vehicleId: string) => {
    return vehicles.find(v => v.id === vehicleId)?.licensePlate || '-';
  };
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR').format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Filter Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center text-lg">
            <Filter className="mr-2 h-5 w-5" /> 필터 및 검색
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Date Range Selection */}
            <div className="space-y-1">
              <Label>날짜 범위</Label>
              <div className="flex items-center space-x-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !startDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(startDate, "yyyy-MM-dd")}
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
                <span>~</span>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !endDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(endDate, "yyyy-MM-dd")}
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
              <div className="text-xs text-muted-foreground pt-1">
                {differenceInDays(endDate, startDate) + 1}일 선택됨
              </div>
            </div>
            
            {/* Driver Filter */}
            <div className="space-y-1">
              <Label>운전자</Label>
              <Select value={selectedDriverName} onValueChange={setSelectedDriverName}>
                <SelectTrigger>
                  <SelectValue placeholder="모든 운전자" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">모든 운전자</SelectItem>
                  {drivers.map((driver, index) => (
                    <SelectItem key={index} value={driver}>{driver}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Vehicle Filter */}
            <div className="space-y-1">
              <Label>차량</Label>
              <Select value={selectedVehicleId} onValueChange={setSelectedVehicleId}>
                <SelectTrigger>
                  <SelectValue placeholder="모든 차량" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">모든 차량</SelectItem>
                  {vehicles.map((vehicle) => (
                    <SelectItem key={vehicle.id} value={vehicle.id}>
                      {vehicle.name} ({vehicle.licensePlate})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Search */}
            <div className="space-y-1">
              <Label>검색</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="검색어 입력..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
          </div>
          
          {/* Summary Statistics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
            <div className="bg-blue-50 p-3 rounded-md border border-blue-100">
              <div className="text-sm text-blue-600">총 기록</div>
              <div className="text-xl font-semibold">{filteredTrips.length}건</div>
            </div>
            <div className="bg-green-50 p-3 rounded-md border border-green-100">
              <div className="text-sm text-green-600">총 금액</div>
              <div className="text-xl font-semibold">
                {formatCurrency(filteredTrips.reduce((sum, trip) => sum + trip.amount, 0))}원
              </div>
            </div>
            <div className="bg-purple-50 p-3 rounded-md border border-purple-100">
              <div className="text-sm text-purple-600">평균 금액</div>
              <div className="text-xl font-semibold">
                {filteredTrips.length ? formatCurrency(Math.round(filteredTrips.reduce((sum, trip) => sum + trip.amount, 0) / filteredTrips.length)) : 0}원
              </div>
            </div>
            <div className="bg-amber-50 p-3 rounded-md border border-amber-100">
              <div className="text-sm text-amber-600">선택됨</div>
              <div className="text-xl font-semibold">{selectedTrips.size}건</div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Table Card */}
      <Card>
        <CardContent className="p-0 sm:p-6">
          <div className="flex justify-between items-center py-4 px-2 sm:px-0">
            <div className="flex items-center space-x-2">
              <Checkbox 
                checked={selectAll} 
                onCheckedChange={handleSelectAllChange} 
                id="select-all"
              />
              <label htmlFor="select-all" className="text-sm font-medium">
                전체선택
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8 px-3"
                disabled={selectedTrips.size === 0}
                onClick={handleDeleteSelected}
              >
                <Trash2 className="mr-1 h-4 w-4" />
                선택 삭제
              </Button>
            </div>
          </div>
          
          {/* Excel-style Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-[40px]"></TableHead>
                  <TableHead 
                    className="w-[100px] cursor-pointer hover:bg-muted"
                    onClick={() => handleHeaderClick('date')}
                  >
                    <div className="flex items-center">
                      날짜
                      {sortState.field === 'date' && (
                        sortState.direction === 'asc' ? 
                          <ArrowUp className="ml-1 h-4 w-4" /> : 
                          <ArrowDown className="ml-1 h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted"
                    onClick={() => handleHeaderClick('driverName')}
                  >
                    <div className="flex items-center">
                      운전자
                      {sortState.field === 'driverName' && (
                        sortState.direction === 'asc' ? 
                          <ArrowUp className="ml-1 h-4 w-4" /> : 
                          <ArrowDown className="ml-1 h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted hidden lg:table-cell"
                    onClick={() => handleHeaderClick('vehicleId')}
                  >
                    <div className="flex items-center">
                      차량
                      {sortState.field === 'vehicleId' && (
                        sortState.direction === 'asc' ? 
                          <ArrowUp className="ml-1 h-4 w-4" /> : 
                          <ArrowDown className="ml-1 h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted hidden md:table-cell"
                    onClick={() => handleHeaderClick('startTime')}
                  >
                    <div className="flex items-center">
                      출발
                      {sortState.field === 'startTime' && (
                        sortState.direction === 'asc' ? 
                          <ArrowUp className="ml-1 h-4 w-4" /> : 
                          <ArrowDown className="ml-1 h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted hidden md:table-cell"
                    onClick={() => handleHeaderClick('endTime')}
                  >
                    <div className="flex items-center">
                      도착
                      {sortState.field === 'endTime' && (
                        sortState.direction === 'asc' ? 
                          <ArrowUp className="ml-1 h-4 w-4" /> : 
                          <ArrowDown className="ml-1 h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted"
                    onClick={() => handleHeaderClick('departure')}
                  >
                    <div className="flex items-center">
                      출발지
                      {sortState.field === 'departure' && (
                        sortState.direction === 'asc' ? 
                          <ArrowUp className="ml-1 h-4 w-4" /> : 
                          <ArrowDown className="ml-1 h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted"
                    onClick={() => handleHeaderClick('destination')}
                  >
                    <div className="flex items-center">
                      목적지
                      {sortState.field === 'destination' && (
                        sortState.direction === 'asc' ? 
                          <ArrowUp className="ml-1 h-4 w-4" /> : 
                          <ArrowDown className="ml-1 h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted text-right"
                    onClick={() => handleHeaderClick('amount')}
                  >
                    <div className="flex items-center justify-end">
                      금액
                      {sortState.field === 'amount' && (
                        sortState.direction === 'asc' ? 
                          <ArrowUp className="ml-1 h-4 w-4" /> : 
                          <ArrowDown className="ml-1 h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead className="w-[80px]">액션</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedTrips.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="h-24 text-center">
                      조회된 기록이 없습니다.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedTrips.map((trip) => (
                    <TableRow key={trip.id} className="hover:bg-muted/50">
                      <TableCell className="py-2">
                        <Checkbox 
                          checked={selectedTrips.has(trip.id)}
                          onCheckedChange={() => handleTripSelection(trip.id)}
                        />
                      </TableCell>
                      <TableCell className="font-medium py-2">
                        {format(new Date(trip.date), "MM.dd")}
                      </TableCell>
                      <TableCell className="py-2">{trip.driverName}</TableCell>
                      <TableCell className="hidden lg:table-cell py-2">
                        {getVehicleName(trip.vehicleId)}
                      </TableCell>
                      <TableCell className="hidden md:table-cell py-2">{trip.startTime}</TableCell>
                      <TableCell className="hidden md:table-cell py-2">{trip.endTime}</TableCell>
                      <TableCell className="py-2 max-w-[100px] truncate" title={trip.departure}>
                        {trip.departure}
                      </TableCell>
                      <TableCell className="py-2 max-w-[100px] truncate" title={trip.destination}>
                        {trip.destination}
                      </TableCell>
                      <TableCell className="text-right py-2">
                        {formatCurrency(trip.amount)}원
                      </TableCell>
                      <TableCell className="py-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => handleEditTrip(trip)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-red-500"
                          onClick={() => {
                            deleteTrip(trip.id);
                            loadData();
                            toast({
                              title: "삭제 완료",
                              description: "운행 기록이 삭제되었습니다."
                            });
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          
          {/* Pagination */}
          {filteredTrips.length > 0 && (
            <div className="flex items-center justify-between py-4">
              <div className="text-sm text-muted-foreground">
                총 {filteredTrips.length}개 중 {(currentPage - 1) * itemsPerPage + 1}-
                {Math.min(currentPage * itemsPerPage, filteredTrips.length)}개 표시
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="text-sm">
                  {currentPage} / {totalPages}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Edit Trip Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>운행 기록 수정</DialogTitle>
          </DialogHeader>
          
          {editingTrip && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-date">날짜</Label>
                  <Input
                    id="edit-date"
                    type="date"
                    value={editingTrip.date}
                    onChange={(e) => setEditingTrip({...editingTrip, date: e.target.value})}
                  />
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
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-start">출발 시간</Label>
                  <Input
                    id="edit-start"
                    type="time"
                    value={editingTrip.startTime}
                    onChange={(e) => setEditingTrip({...editingTrip, startTime: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-end">도착 시간</Label>
                  <Input
                    id="edit-end"
                    type="time"
                    value={editingTrip.endTime}
                    onChange={(e) => setEditingTrip({...editingTrip, endTime: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
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
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-vehicle">차량</Label>
                  <Select 
                    value={editingTrip.vehicleId}
                    onValueChange={(value) => setEditingTrip({...editingTrip, vehicleId: value})}
                  >
                    <SelectTrigger>
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
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-amount">금액</Label>
                  <Input
                    id="edit-amount"
                    type="number"
                    value={editingTrip.amount}
                    onChange={(e) => setEditingTrip({...editingTrip, amount: parseInt(e.target.value) || 0})}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-purpose">메모</Label>
                <Input
                  id="edit-purpose"
                  value={editingTrip.purpose}
                  onChange={(e) => setEditingTrip({...editingTrip, purpose: e.target.value})}
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>취소</Button>
            <Button onClick={handleSaveEdit}>저장</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TripTable;
