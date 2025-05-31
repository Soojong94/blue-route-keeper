import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { CalendarIcon, Search, Edit, Trash2, ArrowRight, BarChart3, MapPin, Eye, EyeOff, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useModalBackHandler } from '@/hooks/useBackHandler';
import { getTrips, getTripsByDateRange, getVehicles, deleteTrip, updateTrip } from '@/utils/storage';
import { getPeriodStats } from '@/utils/calculations';
import { Trip, Vehicle } from '@/types/trip';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import SmartInput, { SearchResult } from '@/components/SmartInput';
import {
  searchVehicles,
  searchGeneral,
  addRecentVehicle,
  addRecentGeneral,
  getRecentVehicles,
  getRecentGeneral
} from '@/utils/smartSearch';

interface TripListProps {
  refreshTrigger: number;
}

interface TripListState {
  startDate: string;
  endDate: string;
  selectedVehicle: string;
  searchQuery: string;
  showDetailedList: boolean;
}

interface TripGroup {
  key: string;
  date: string;
  vehicleId: string;
  vehicleName: string;
  trips: Trip[];
  totalCount: number;
  totalAmount: number;
}

const TripList: React.FC<TripListProps> = ({ refreshTrigger }) => {
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
    searchQuery: '',
    showDetailedList: true
  });

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
  const [showDetailedList, setShowDetailedList] = useState<boolean>(true);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // 모달 뒤로가기 핸들러
  useModalBackHandler(isEditDialogOpen, () => setIsEditDialogOpen(false), 'dialog');

  const { toast } = useToast();

  // 차량 필터 입력값 상태 (표시용)
  const [vehicleFilterInput, setVehicleFilterInput] = useState('');

  // 즐겨찾기 차량 목록을 SearchResult 형태로 변환
  const getFavoriteVehicles = useMemo((): SearchResult[] => {
    return vehicles.map(vehicle => ({
      id: `fav-vehicle-${vehicle.id}`,
      value: vehicle.licensePlate,
      label: `${vehicle.licensePlate}${vehicle.name ? ` (${vehicle.name})` : ''}`,
      type: 'favorite',
      category: 'vehicle',
      metadata: {
        vehicleId: vehicle.id,
        vehicle,
        category: vehicle.defaultUnitPrice ? `${vehicle.defaultUnitPrice.toLocaleString()}원` : undefined
      }
    }));
  }, [vehicles]);

  // 상태 변경 시 localStorage 업데이트
  useEffect(() => {
    const formatDate = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const newState = {
      startDate: formatDate(startDate),
      endDate: formatDate(endDate),
      selectedVehicle,
      searchQuery,
      showDetailedList
    };

    if (JSON.stringify(newState) !== JSON.stringify(savedState)) {
      setSavedState(newState);
    }
  }, [startDate, endDate, selectedVehicle, searchQuery, showDetailedList]);

  // 선택된 차량의 표시값 업데이트
  useEffect(() => {
    if (selectedVehicle === 'all') {
      setVehicleFilterInput('');
    } else {
      const vehicle = vehicles.find(v => v.id === selectedVehicle);
      if (vehicle) {
        setVehicleFilterInput(vehicle.licensePlate);
      } else {
        setVehicleFilterInput('');
        setSelectedVehicle('all');
      }
    }
  }, [selectedVehicle, vehicles]);

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

  // 운행 기록 그룹화
  const groupedTrips = useMemo((): TripGroup[] => {
    const groups = new Map<string, TripGroup>();

    filteredTrips.forEach(trip => {
      const key = `${trip.date}-${trip.vehicleId}`;

      if (groups.has(key)) {
        const group = groups.get(key)!;
        group.trips.push(trip);
        group.totalCount += trip.count;
        group.totalAmount += trip.totalAmount;
      } else {
        const vehicle = vehicles.find(v => v.id === trip.vehicleId);
        const vehicleName = vehicle
          ? (vehicle.name ? `${vehicle.licensePlate} (${vehicle.name})` : vehicle.licensePlate)
          : '알 수 없음';

        groups.set(key, {
          key,
          date: trip.date,
          vehicleId: trip.vehicleId,
          vehicleName,
          trips: [trip],
          totalCount: trip.count,
          totalAmount: trip.totalAmount
        });
      }
    });

    // 날짜 역순으로 정렬
    return Array.from(groups.values()).sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return dateB - dateA; // 최신 날짜가 먼저
    });
  }, [filteredTrips, vehicles]);

  // 새로운 데이터 로드 시 모든 그룹을 자동으로 펼친 상태로 설정
  useEffect(() => {
    if (groupedTrips.length > 0) {
      const allGroupKeys = groupedTrips.map(group => group.key);
      setExpandedGroups(new Set(allGroupKeys));
    }
  }, [groupedTrips]);

  // 차량 선택 처리
  const handleVehicleSelect = (result: SearchResult) => {
    if (result.metadata?.vehicleId) {
      setSelectedVehicle(result.metadata.vehicleId);
      setVehicleFilterInput(result.value);
      addRecentVehicle(result.value);
    }
  };

  // 차량 필터 입력값 변경 처리
  const handleVehicleFilterChange = (value: string) => {
    setVehicleFilterInput(value);

    if (!value.trim()) {
      setSelectedVehicle('all');
      return;
    }

    const matchingVehicle = vehicles.find(v => v.licensePlate === value);
    if (matchingVehicle) {
      setSelectedVehicle(matchingVehicle.id);
    } else {
      setSelectedVehicle('all');
    }
  };

  // 검색어 선택 처리
  const handleSearchSelect = (result: SearchResult) => {
    setSearchQuery(result.value);
    addRecentGeneral(result.value);
  };

  const handleEdit = (trip: Trip) => {
    setEditingTrip({ ...trip });
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingTrip) return;

    // Validation 체크
    if (editingTrip.unitPrice < 1) {
      toast({
        title: "입력 오류",
        description: "단가는 1원 이상이어야 합니다.",
        variant: "destructive",
      });
      return;
    }

    if (editingTrip.count < 1) {
      toast({
        title: "입력 오류",
        description: "횟수는 1회 이상이어야 합니다.",
        variant: "destructive",
      });
      return;
    }

    if (!editingTrip.departure.trim()) {
      toast({
        title: "입력 오류",
        description: "출발지를 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    if (!editingTrip.destination.trim()) {
      toast({
        title: "입력 오류",
        description: "목적지를 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

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

  // 그룹 확장/축소 토글
  const toggleGroup = (groupKey: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupKey)) {
        newSet.delete(groupKey);
      } else {
        newSet.add(groupKey);
      }
      return newSet;
    });
  };

  const stats = useMemo(() => getPeriodStats(filteredTrips), [filteredTrips]);

  const getVehicleName = (vehicleId: string) => {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    if (!vehicle) return '알 수 없음';
    return vehicle.name ? `${vehicle.licensePlate} (${vehicle.name})` : vehicle.licensePlate;
  };

  return (
    <div className="space-y-4">
      {/* 필터 및 기본 통계 카드 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <BarChart3 className="h-4 w-4" />
            운행 기록 조회
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* 필터 컨트롤 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* 시작일 */}
            <div className="space-y-1">
              <Label className="text-xs">시작일</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal text-xs h-7",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-1 h-3 w-3" />
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
            <div className="space-y-1">
              <Label className="text-xs">종료일</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal text-xs h-7",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-1 h-3 w-3" />
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
            <div className="space-y-1">
              <Label className="text-xs">차량</Label>
              <div className="flex gap-1">
                <Button
                  variant={selectedVehicle === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setSelectedVehicle('all');
                    setVehicleFilterInput('');
                  }}
                  className="shrink-0 text-xs h-7 px-2"
                >
                  전체
                </Button>
                <SmartInput
                  value={vehicleFilterInput}
                  onChange={handleVehicleFilterChange}
                  onSelect={handleVehicleSelect}
                  placeholder="차량번호"
                  className="text-xs h-7"
                  searchFunction={searchVehicles}
                  recentItems={getRecentVehicles()}
                  favoriteItems={getFavoriteVehicles}
                  debounceMs={300}
                />
              </div>
            </div>

            {/* 검색 */}
            <div className="space-y-1">
              <Label className="text-xs">검색</Label>
              <SmartInput
                value={searchQuery}
                onChange={setSearchQuery}
                onSelect={handleSearchSelect}
                placeholder="출발지, 목적지, 운전자, 메모 검색..."
                className="text-xs h-7"
                searchFunction={searchGeneral}
                recentItems={getRecentGeneral()}
                favoriteItems={[]}
                debounceMs={300}
              />
            </div>
          </div>

          {/* 기본 통계 */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-blue-600" />
                <div>
                  <p className="text-xs text-blue-600">총 운행</p>
                  <p className="text-lg font-bold text-blue-800">{stats.totalTrips}회</p>
                </div>
              </div>
            </div>

            <div className="bg-green-50 p-3 rounded-lg border border-green-200">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-green-600" />
                <div>
                  <p className="text-xs text-green-600">총 금액</p>
                  <p className="text-lg font-bold text-green-800">
                    {stats.totalAmount.toLocaleString()}원
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 목록 보기/숨기기 버튼 */}
          <div className="flex justify-end">
            <Button
              variant={showDetailedList ? "secondary" : "default"}
              onClick={() => setShowDetailedList(!showDetailedList)}
              className="flex items-center gap-2 text-xs h-7"
              disabled={filteredTrips.length === 0}
            >
              {showDetailedList ? (
                <>
                  <EyeOff className="h-3 w-3" />
                  목록 숨기기
                </>
              ) : (
                <>
                  <Eye className="h-3 w-3" />
                  목록 보기 ({filteredTrips.length}건)
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 운행 기록 상세 목록 - 조건부 표시 */}
      {showDetailedList && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">
              운행 기록 목록 ({filteredTrips.length}건)
              {loading && <span className="text-xs font-normal text-gray-500 ml-2">로딩 중...</span>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {groupedTrips.length === 0 ? (
              <div className="text-center py-6 text-gray-500 text-xs">
                {loading ? '데이터를 불러오는 중입니다...' : '조건에 맞는 운행 기록이 없습니다.'}
              </div>
            ) : (
              <div className="space-y-3">
                {groupedTrips.map((group) => (
                  <TripGroupCard
                    key={group.key}
                    group={group}
                    isExpanded={expandedGroups.has(group.key)}
                    onToggle={() => toggleGroup(group.key)}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 수정 다이얼로그 */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-sm">운행 기록 수정</DialogTitle>
          </DialogHeader>
          {editingTrip && (
            <div className="space-y-3 py-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">날짜</Label>
                  <Input
                    type="date"
                    value={editingTrip.date}
                    onChange={(e) => setEditingTrip({ ...editingTrip, date: e.target.value })}
                    className="text-xs h-7"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">차량</Label>
                  <Select
                    value={editingTrip.vehicleId}
                    onValueChange={(value) => setEditingTrip({ ...editingTrip, vehicleId: value })}
                  >
                    <SelectTrigger className="text-xs h-7">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {vehicles.map((vehicle) => (
                        <SelectItem key={vehicle.id} value={vehicle.id} className="text-xs">
                          {getVehicleName(vehicle.id)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">출발지</Label>
                  <Input
                    value={editingTrip.departure}
                    onChange={(e) => setEditingTrip({ ...editingTrip, departure: e.target.value })}
                    className={cn(
                      "text-xs h-7",
                      !editingTrip.departure.trim() && "border-red-300"
                    )}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">목적지</Label>
                  <Input
                    value={editingTrip.destination}
                    onChange={(e) => setEditingTrip({ ...editingTrip, destination: e.target.value })}
                    className={cn(
                      "text-xs h-7",
                      !editingTrip.destination.trim() && "border-red-300"
                    )}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">단가</Label>
                  <Input
                    type="number"
                    value={editingTrip.unitPrice}
                    onChange={(e) => setEditingTrip({
                      ...editingTrip,
                      unitPrice: parseInt(e.target.value) || 0
                    })}
                    className={cn(
                      "text-xs h-7",
                      editingTrip.unitPrice < 1 && "border-red-300"
                    )}
                    placeholder="1 이상"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">횟수</Label>
                  <Input
                    type="number"
                    value={editingTrip.count}
                    onChange={(e) => setEditingTrip({
                      ...editingTrip,
                      count: parseInt(e.target.value) || 0
                    })}
                    className={cn(
                      "text-xs h-7",
                      editingTrip.count < 1 && "border-red-300"
                    )}
                    placeholder="1 이상"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">총액</Label>
                  <div className="px-2 py-1.5 bg-blue-50 rounded border font-semibold text-blue-800 text-xs">
                    {(editingTrip.unitPrice * editingTrip.count).toLocaleString()}원
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">운전자 (선택)</Label>
                <Input
                  value={editingTrip.driverName || ''}
                  onChange={(e) => setEditingTrip({ ...editingTrip, driverName: e.target.value })}
                  placeholder="운전자명"
                  className="text-xs h-7"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">메모 (선택)</Label>
                <Input
                  value={editingTrip.memo || ''}
                  onChange={(e) => setEditingTrip({ ...editingTrip, memo: e.target.value })}
                  placeholder="메모"
                  className="text-xs h-7"
                />
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-2 pt-3">
                <Button
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                  className="w-full sm:w-auto text-xs h-7"
                >
                  취소
                </Button>
                <Button onClick={handleSaveEdit} className="w-full sm:w-auto text-xs h-7">
                  저장
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

// 그룹 카드 컴포넌트
interface TripGroupCardProps {
  group: TripGroup;
  isExpanded: boolean;
  onToggle: () => void;
  onEdit: (trip: Trip) => void;
  onDelete: (id: string) => void;
}

const TripGroupCard: React.FC<TripGroupCardProps> = ({
  group,
  isExpanded,
  onToggle,
  onEdit,
  onDelete
}) => {
  return (
    <Card className="overflow-hidden">
      {/* 그룹 헤더 */}
      <div
        className="p-3 bg-gradient-to-r from-blue-50 to-blue-100 cursor-pointer hover:from-blue-100 hover:to-blue-150 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              {isExpanded ? (
                <ChevronUp className="h-4 w-4 text-blue-600" />
              ) : (
                <ChevronDown className="h-4 w-4 text-blue-600" />
              )}
              <span className="font-semibold text-blue-800 text-sm">
                {format(new Date(group.date), 'MM/dd (EEE)', { locale: ko })}
              </span>
            </div>

            <div className="flex items-center gap-1">
              <Badge variant="outline" className="bg-white text-blue-700 border-blue-300 text-xs">
                <Card className="h-3 w-3 mr-1" />
                {group.vehicleName}
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="text-blue-600 font-medium">
              {group.totalCount}회
            </span>
            <span className="text-green-600 font-bold">
              {group.totalAmount.toLocaleString()}원
            </span>
          </div>
        </div>
      </div>

      {/* 그룹 내용 */}
      {isExpanded && (
        <div className="border-t">
          {group.trips.map((trip, index) => (
            <div
              key={trip.id}
              className={cn(
                "p-3 hover:bg-gray-50",
                index !== group.trips.length - 1 && "border-b"
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 space-y-1">
                  {/* 경로 */}
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
                      {trip.departure}
                    </Badge>
                    <ArrowRight className="h-3 w-3 text-gray-400" />
                    <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-xs">
                      {trip.destination}
                    </Badge>
                  </div>

                  {/* 운행 정보 */}
                  <div className="flex items-center gap-3 text-xs text-gray-600">
                    <span>횟수: <span className="font-medium text-gray-900">{trip.count}회</span></span>
                    <span>단가: <span className="font-medium text-gray-900">{trip.unitPrice.toLocaleString()}원</span></span>
                    <span>총액: <span className="font-medium text-blue-600">{trip.totalAmount.toLocaleString()}원</span></span>
                  </div>

                  {/* 추가 정보 */}
                  {(trip.driverName || trip.memo) && (
                    <div className="flex items-center gap-3 text-xs">
                      {trip.driverName && (
                        <div className="flex items-center gap-1">
                          <span className="text-gray-500">운전자:</span>
                          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 text-xs">
                            {trip.driverName}
                          </Badge>
                        </div>
                      )}
                      {trip.memo && (
                        <div className="flex items-center gap-1">
                          <span className="text-gray-500">메모:</span>
                          <span className="text-gray-700">{trip.memo}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 저장 시간 */}
                  <div className="text-[10px] text-gray-400">
                    저장: {format(new Date(trip.createdAt), 'MM/dd HH:mm')}
                    {trip.updatedAt && (
                      <span className="text-blue-500 ml-2">
                        (수정: {format(new Date(trip.updatedAt), 'MM/dd HH:mm')})
                      </span>
                    )}
                  </div>
                </div>

                {/* 액션 버튼 */}
                <div className="flex gap-1 ml-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(trip);
                    }}
                    className="h-6 w-6 p-0 text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(trip.id);
                    }}
                    className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};

export default TripList;