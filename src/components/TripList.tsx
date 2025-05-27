// src/components/TripList.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { CalendarIcon, Search, Edit, Trash2, ArrowRight, BarChart3, MapPin, Car, FileText, Calendar as CalendarReport } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { getTrips, getTripsByDateRange, getVehicles, deleteTrip, updateTrip } from '@/utils/storage';
import { getPeriodStats } from '@/utils/calculations';
import { generateDailyReport, generateMonthlyReport } from '@/utils/reportUtils';
import { Trip, Vehicle, PeriodStats } from '@/types/trip';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import DailyReport from '@/components/reports/DailyReport';
import MonthlyReport from '@/components/reports/MonthlyReport';
import ReportDialog from '@/components/reports/ReportDialog';

interface TripListProps {
  refreshTrigger: number;
}

interface TripListState {
  startDate: string;
  endDate: string;
  selectedVehicle: string;
  searchQuery: string;
}

const TripList: React.FC<TripListProps> = ({ refreshTrigger }) => {
  // ✅ 오늘 날짜를 정확하게 가져오는 함수
  const getTodayString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [savedState, setSavedState] = useLocalStorage<TripListState>('tripList', {
    startDate: getTodayString(),
    endDate: getTodayString(),
    selectedVehicle: 'all',
    searchQuery: ''
  });

  // ✅ 문자열을 Date 객체로 안전하게 변환
  const [startDate, setStartDate] = useState<Date>(() => {
    const today = new Date();
    if (savedState.startDate) {
      const [year, month, day] = savedState.startDate.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      date.setHours(0, 0, 0, 0);
      return date;
    }
    today.setHours(0, 0, 0, 0);
    return today;
  });

  const [endDate, setEndDate] = useState<Date>(() => {
    const today = new Date();
    if (savedState.endDate) {
      const [year, month, day] = savedState.endDate.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      date.setHours(0, 0, 0, 0);
      return date;
    }
    today.setHours(0, 0, 0, 0);
    return today;
  });

  const [trips, setTrips] = useState<Trip[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [filteredTrips, setFilteredTrips] = useState<Trip[]>([]);
  const [searchQuery, setSearchQuery] = useState(savedState.searchQuery);
  const [selectedVehicle, setSelectedVehicle] = useState<string>(savedState.selectedVehicle);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // 보고서 다이얼로그 상태
  const [isDailyReportOpen, setIsDailyReportOpen] = useState(false);
  const [isMonthlyReportOpen, setIsMonthlyReportOpen] = useState(false);

  const { toast } = useToast();

  // 상태 변경 시 localStorage 업데이트
  useEffect(() => {
    const formatDate = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    setSavedState({
      startDate: formatDate(startDate),
      endDate: formatDate(endDate),
      selectedVehicle,
      searchQuery
    });
  }, [startDate, endDate, selectedVehicle, searchQuery, setSavedState]);

  useEffect(() => {
    loadTrips();
    loadVehicles();
  }, [startDate, endDate, refreshTrigger]);

  useEffect(() => {
    applyFilters();
  }, [trips, searchQuery, selectedVehicle]);

  const loadTrips = async () => {
    try {
      setLoading(true);
      const loadedTrips = await getTripsByDateRange(startDate, endDate);
      setTrips(loadedTrips);
    } catch (error) {
      console.error('Error loading trips:', error);
      toast({
        title: "로드 실패",
        description: "운행 기록을 불러오는 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadVehicles = async () => {
    try {
      const vehiclesData = await getVehicles();
      setVehicles(vehiclesData);
    } catch (error) {
      console.error('Error loading vehicles:', error);
    }
  };

  const applyFilters = () => {
    let filtered = [...trips];

    // 차량 필터
    if (selectedVehicle !== 'all') {
      filtered = filtered.filter(trip => trip.vehicleId === selectedVehicle);
    }

    // 검색 필터
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(trip =>
        trip.departure.toLowerCase().includes(query) ||
        trip.destination.toLowerCase().includes(query) ||
        (trip.driverName && trip.driverName.toLowerCase().includes(query)) ||
        (trip.memo && trip.memo.toLowerCase().includes(query))
      );
    }

    setFilteredTrips(filtered);
  };

  const handleEdit = (trip: Trip) => {
    setEditingTrip({ ...trip });
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingTrip) return;

    try {
      const updated = await updateTrip(editingTrip.id, {
        date: editingTrip.date,
        departure: editingTrip.departure,
        destination: editingTrip.destination,
        unitPrice: editingTrip.unitPrice,
        count: editingTrip.count,
        vehicleId: editingTrip.vehicleId,
        driverName: editingTrip.driverName,
        memo: editingTrip.memo,
      });

      if (updated) {
        toast({
          title: "수정 완료",
          description: "운행 기록이 수정되었습니다.",
        });
        setIsEditDialogOpen(false);
        await loadTrips();
      }
    } catch (error) {
      console.error('Update trip error:', error);
      toast({
        title: "수정 실패",
        description: "운행 기록 수정 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('정말로 이 운행 기록을 삭제하시겠습니까?')) {
      try {
        await deleteTrip(id);
        toast({
          title: "삭제 완료",
          description: "운행 기록이 삭제되었습니다.",
        });
        await loadTrips();
      } catch (error) {
        console.error('Delete trip error:', error);
        toast({
          title: "삭제 실패",
          description: "운행 기록 삭제 중 오류가 발생했습니다.",
          variant: "destructive",
        });
      }
    }
  };

  const stats = useMemo(() => getPeriodStats(filteredTrips), [filteredTrips]);
  const dailyReportData = useMemo(() => {
    return generateDailyReport(filteredTrips, vehicles);
  }, [filteredTrips, vehicles]);

  const monthlyReportData = useMemo(() => {
    return generateMonthlyReport(filteredTrips);
  }, [filteredTrips]);

  const getVehicleName = (vehicleId: string) => {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    return vehicle ? `${vehicle.licensePlate} (${vehicle.name})` : '알 수 없음';
  };

  // 차량별 운행 통계 계산
  const vehicleStats = useMemo(() => {
    const stats = new Map();

    filteredTrips.forEach(trip => {
      const vehicleKey = trip.vehicleId;
      if (!stats.has(vehicleKey)) {
        stats.set(vehicleKey, {
          vehicle: getVehicleName(vehicleKey),
          totalTrips: 0,
          totalAmount: 0,
          routes: new Map()
        });
      }

      const vehicleStat = stats.get(vehicleKey);
      vehicleStat.totalTrips += trip.count;
      vehicleStat.totalAmount += trip.totalAmount;

      // 경로별 통계
      const routeKey = `${trip.departure} → ${trip.destination}`;
      if (!vehicleStat.routes.has(routeKey)) {
        vehicleStat.routes.set(routeKey, { count: 0, amount: 0 });
      }
      const routeStat = vehicleStat.routes.get(routeKey);
      routeStat.count += trip.count;
      routeStat.amount += trip.totalAmount;
    });

    return Array.from(stats.values());
  }, [filteredTrips, vehicles]);

  return (
    <div className="space-y-6">
      {/* 필터 및 기본 통계 카드 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            운행 기록 조회
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 필터 컨트롤 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 시작일 */}
            <div className="space-y-2">
              <Label>시작일</Label>
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
                    {startDate ? format(startDate, "yyyy-MM-dd") : "시작일"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={(date) => {
                      if (date) {
                        const localDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
                        setStartDate(localDate);
                        if (localDate > endDate) {
                          setEndDate(localDate);
                        }
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* 종료일 */}
            <div className="space-y-2">
              <Label>종료일</Label>
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
                    {endDate ? format(endDate, "yyyy-MM-dd") : "종료일"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={(date) => {
                      if (date) {
                        const localDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
                        setEndDate(localDate);
                        if (localDate < startDate) {
                          setStartDate(localDate);
                        }
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* 차량 필터 */}
            <div className="space-y-2">
              <Label>차량</Label>
              <Select value={selectedVehicle} onValueChange={setSelectedVehicle}>
                <SelectTrigger>
                  <SelectValue placeholder="전체 차량" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체 차량</SelectItem>
                  {vehicles.map((vehicle) => (
                    <SelectItem key={vehicle.id} value={vehicle.id}>
                      {vehicle.licensePlate} ({vehicle.name})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 검색 */}
            <div className="space-y-2">
              <Label>검색</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="출발지, 목적지, 운전자, 메모 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
          </div>

          {/* 기본 통계 - 총 운행과 총 금액만 표시 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm text-blue-600">총 운행</p>
                  <p className="text-2xl font-bold text-blue-800">{stats.totalTrips}회</p>
                </div>
              </div>
            </div>

            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm text-green-600">총 금액</p>
                  <p className="text-2xl font-bold text-green-800">
                    {stats.totalAmount.toLocaleString()}원
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 보고서 버튼 */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => setIsDailyReportOpen(true)}
              className="flex items-center gap-2"
              disabled={filteredTrips.length === 0}
            >
              <FileText className="h-4 w-4" />
              일간 보고서
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsMonthlyReportOpen(true)}
              className="flex items-center gap-2"
              disabled={filteredTrips.length === 0}
            >
              <CalendarReport className="h-4 w-4" />
              월간 보고서
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 차량별 운행 요약 */}
      {vehicleStats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Car className="h-5 w-5" />
              차량별 운행 요약
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {vehicleStats.map((stat, index) => (
                <div key={index} className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-semibold text-lg">{stat.vehicle}</h3>
                    <div className="flex gap-4 text-sm">
                      <span className="text-blue-600 font-medium">{stat.totalTrips}회</span>
                      <span className="text-green-600 font-medium">{stat.totalAmount.toLocaleString()}원</span>
                    </div>
                  </div>

                  {/* 상위 3개 경로 표시 */}
                  <div className="space-y-2">
                    <div className="text-sm text-gray-600 mb-2">주요 운행 경로</div>
                    {Array.from(stat.routes.entries())
                      .sort((a, b) => b[1].count - a[1].count)
                      .slice(0, 3)
                      .map(([route, routeStat], idx) => (
                        <div key={idx} className="flex justify-between items-center text-sm bg-white p-2 rounded">
                          <span className="font-medium">{route}</span>
                          <div className="flex gap-2 text-xs">
                            <span className="text-blue-600">{routeStat.count}회</span>
                            <span className="text-green-600">{routeStat.amount.toLocaleString()}원</span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 운행 기록 테이블 */}
      <Card>
        <CardHeader>
          <CardTitle>
            운행 기록 목록 ({filteredTrips.length}건)
            {loading && <span className="text-sm font-normal text-gray-500 ml-2">로딩 중...</span>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredTrips.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {loading ? '데이터를 불러오는 중입니다...' : '조건에 맞는 운행 기록이 없습니다.'}
            </div>
          ) : (
            <>
              {/* 데스크톱 테이블 */}
              <div className="hidden lg:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>운행일</TableHead>
                      <TableHead>차량</TableHead>
                      <TableHead>경로</TableHead>
                      <TableHead className="text-center">횟수</TableHead>
                      <TableHead className="text-right">단가</TableHead>
                      <TableHead className="text-right">총액</TableHead>
                      <TableHead>운전자</TableHead>
                      <TableHead>저장일시</TableHead>
                      <TableHead className="text-center">관리</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTrips.map((trip) => (
                      <TableRow key={trip.id} className="hover:bg-gray-50">
                        <TableCell className="font-medium">
                          {format(new Date(trip.date), 'MM/dd', { locale: ko })}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="font-medium">{getVehicleName(trip.vehicleId)}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="bg-blue-50 text-blue-700">
                              {trip.departure}
                            </Badge>
                            <ArrowRight className="h-4 w-4 text-gray-400" />
                            <Badge variant="outline" className="bg-green-50 text-green-700">
                              {trip.destination}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="text-center font-medium">
                          {trip.count}회
                        </TableCell>
                        <TableCell className="text-right">
                          {trip.unitPrice.toLocaleString()}원
                        </TableCell>
                        <TableCell className="text-right font-semibold text-blue-600">
                          {trip.totalAmount.toLocaleString()}원
                        </TableCell>
                        <TableCell>
                          {trip.driverName ? (
                            <Badge variant="outline" className="bg-purple-50 text-purple-700">
                              {trip.driverName}
                            </Badge>
                          ) : (
                            <span className="text-gray-400 text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {format(new Date(trip.createdAt), 'MM/dd HH:mm')}
                          {trip.updatedAt && (
                            <div className="text-xs text-blue-500">
                              (수정: {format(new Date(trip.updatedAt), 'MM/dd HH:mm')})
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(trip)}
                              className="h-8 w-8 p-0 text-blue-500 hover:text-blue-700"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(trip.id)}
                              className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
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

              {/* 모바일 카드 뷰 */}
              <div className="lg:hidden space-y-4">
                {filteredTrips.map((trip) => (
                  <Card key={trip.id} className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="space-y-1">
                        <div className="font-medium text-sm">
                          {format(new Date(trip.date), 'MM/dd', { locale: ko })} |
                          <span className="text-blue-600 ml-1">{getVehicleName(trip.vehicleId)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 text-xs">
                            {trip.departure}
                          </Badge>
                          <ArrowRight className="h-3 w-3 text-gray-400" />
                          <Badge variant="outline" className="bg-green-50 text-green-700 text-xs">
                            {trip.destination}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(trip)}
                          className="h-8 w-8 p-0 text-blue-500 hover:text-blue-700"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(trip.id)}
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">횟수:</span>
                        <span className="font-medium ml-1">{trip.count}회</span>
                      </div>
                      <div>
                        <span className="text-gray-500">단가:</span>
                        <span className="font-medium ml-1">{trip.unitPrice.toLocaleString()}원</span>
                      </div>
                    </div>

                    <div className="mt-3 p-2 bg-blue-50 rounded flex justify-between items-center">
                      <span className="text-sm text-blue-600">총액</span>
                      <span className="font-bold text-blue-800">{trip.totalAmount.toLocaleString()}원</span>
                    </div>

                    {(trip.driverName || trip.memo) && (
                      <div className="mt-3 space-y-1 text-sm">
                        {trip.driverName && (
                          <div>
                            <span className="text-gray-500">운전자:</span>
                            <Badge variant="outline" className="bg-purple-50 text-purple-700 ml-2">
                              {trip.driverName}
                            </Badge>
                          </div>
                        )}
                        {trip.memo && (
                          <div>
                            <span className="text-gray-500">메모:</span>
                            <span className="ml-1">{trip.memo}</span>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="mt-3 text-xs text-gray-500">
                      저장: {format(new Date(trip.createdAt), 'MM/dd HH:mm')}
                      {trip.updatedAt && (
                        <span className="text-blue-500 ml-2">
                          (수정: {format(new Date(trip.updatedAt), 'MM/dd HH:mm')})
                        </span>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* 수정 다이얼로그 */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>운행 기록 수정</DialogTitle>
          </DialogHeader>
          {editingTrip && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>날짜</Label>
                  <Input
                    type="date"
                    value={editingTrip.date}
                    onChange={(e) => setEditingTrip({ ...editingTrip, date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>차량</Label>
                  <Select
                    value={editingTrip.vehicleId}
                    onValueChange={(value) => setEditingTrip({ ...editingTrip, vehicleId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {vehicles.map((vehicle) => (
                        <SelectItem key={vehicle.id} value={vehicle.id}>
                          {vehicle.licensePlate} ({vehicle.name})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>출발지</Label>
                  <Input
                    value={editingTrip.departure}
                    onChange={(e) => setEditingTrip({ ...editingTrip, departure: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>목적지</Label>
                  <Input
                    value={editingTrip.destination}
                    onChange={(e) => setEditingTrip({ ...editingTrip, destination: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>단가</Label>
                  <Input
                    type="number"
                    value={editingTrip.unitPrice}
                    onChange={(e) => setEditingTrip({
                      ...editingTrip,
                      unitPrice: parseInt(e.target.value) || 0
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>횟수</Label>
                  <Input
                    type="number"
                    value={editingTrip.count}
                    onChange={(e) => setEditingTrip({
                      ...editingTrip,
                      count: parseInt(e.target.value) || 1
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>총액</Label>
                  <div className="px-3 py-2 bg-blue-50 rounded border font-semibold text-blue-800 text-sm">
                    {(editingTrip.unitPrice * editingTrip.count).toLocaleString()}원
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>운전자 (선택)</Label>
                <Input
                  value={editingTrip.driverName || ''}
                  onChange={(e) => setEditingTrip({ ...editingTrip, driverName: e.target.value })}
                  placeholder="운전자명"
                />
              </div>

              <div className="space-y-2">
                <Label>메모 (선택)</Label>
                <Input
                  value={editingTrip.memo || ''}
                  onChange={(e) => setEditingTrip({ ...editingTrip, memo: e.target.value })}
                  placeholder="메모"
                />
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                  className="w-full sm:w-auto"
                >
                  취소
                </Button>
                <Button onClick={handleSaveEdit} className="w-full sm:w-auto">
                  저장
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 보고서 다이얼로그들 */}
      <ReportDialog
        open={isDailyReportOpen}
        onOpenChange={setIsDailyReportOpen}
        title="일간 운행 보고서"
      >
        <DailyReport data={dailyReportData} />
      </ReportDialog>

      <ReportDialog
        open={isMonthlyReportOpen}
        onOpenChange={setIsMonthlyReportOpen}
        title="월간 운행 보고서"
      >
        <MonthlyReport data={monthlyReportData} />
      </ReportDialog>
    </div>
  );
};

export default TripList;