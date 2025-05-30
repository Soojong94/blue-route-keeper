// src/components/VehicleManagement.tsx 일부 수정
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Car, Plus, Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { getVehicles, saveVehicle, updateVehicle, deleteVehicle, getTrips } from '@/utils/storage';
import { getVehicleStats } from '@/utils/calculations';
import { Vehicle } from '@/types/trip';
import SmartInput, { SearchResult } from '@/components/SmartInput';
import { searchVehicles, addRecentVehicle, getRecentVehicles } from '@/utils/smartSearch';
import { useModalBackHandler } from '@/hooks/useBackHandler';

const VehicleManagement: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredVehicles, setFilteredVehicles] = useState<Vehicle[]>([]);
  const [formData, setFormData] = useState({
    licensePlate: '',
    name: '',
    defaultUnitPrice: '',
  });

  const { toast } = useToast();

  // 뒤로가기 핸들러 - 컴포넌트 상단에 위치해야 함
  useModalBackHandler(isDialogOpen, () => {
    setIsDialogOpen(false);
    resetForm();
  }, 'dialog');

  useEffect(() => {
    loadVehicles();
  }, []);

  useEffect(() => {
    // 검색 필터링
    if (searchQuery) {
      const filtered = vehicles.filter(vehicle =>
        vehicle.licensePlate.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (vehicle.name && vehicle.name.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      setFilteredVehicles(filtered);
    } else {
      setFilteredVehicles(vehicles);
    }
  }, [vehicles, searchQuery]);

  // 즐겨찾기 차량 목록 (전체 차량 목록)
  const getFavoriteVehicles = (): SearchResult[] => {
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
  };

  // 검색어 선택 처리
  const handleSearchSelect = (result: SearchResult) => {
    setSearchQuery(result.value);
    addRecentVehicle(result.value);
  };

  const loadVehicles = async () => {
    try {
      const vehiclesData = await getVehicles();
      setVehicles(vehiclesData);
    } catch (error) {
      console.error('Error loading vehicles:', error);
      toast({
        title: "로드 실패",
        description: "차량 목록을 불러오는 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.licensePlate) {
      toast({
        title: "입력 오류",
        description: "차량번호는 필수 입력항목입니다.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const vehicleData = {
        licensePlate: formData.licensePlate,
        ...(formData.name && { name: formData.name }),
        defaultUnitPrice: formData.defaultUnitPrice ? parseInt(formData.defaultUnitPrice) : undefined,
      };

      if (editingVehicle) {
        await updateVehicle(editingVehicle.id, vehicleData);
        toast({
          title: "수정 완료",
          description: "차량 정보가 수정되었습니다.",
        });
      } else {
        await saveVehicle(vehicleData);
        toast({
          title: "등록 완료",
          description: "차량이 등록되었습니다.",
        });
      }

      resetForm();
      setIsDialogOpen(false);
      await loadVehicles();
    } catch (error) {
      console.error('Save vehicle error:', error);
      toast({
        title: "저장 실패",
        description: "차량 정보 저장 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setFormData({
      licensePlate: vehicle.licensePlate,
      name: vehicle.name || '',
      defaultUnitPrice: vehicle.defaultUnitPrice?.toString() || '',
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('정말로 이 차량을 삭제하시겠습니까?')) {
      try {
        await deleteVehicle(id);
        toast({
          title: "삭제 완료",
          description: "차량이 삭제되었습니다.",
        });
        await loadVehicles();
      } catch (error) {
        console.error('Delete vehicle error:', error);
        toast({
          title: "삭제 실패",
          description: "차량 삭제 중 오류가 발생했습니다.",
          variant: "destructive",
        });
      }
    }
  };

  const resetForm = () => {
    setFormData({
      licensePlate: '',
      name: '',
      defaultUnitPrice: '',
    });
    setEditingVehicle(null);
  };

  const handleAddNew = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const getVehicleStatsData = async (vehicleId: string) => {
    try {
      const [trips, vehicles] = await Promise.all([getTrips(), getVehicles()]);
      return getVehicleStats(vehicleId, trips, vehicles);
    } catch (error) {
      console.error('Error getting vehicle stats:', error);
      return null;
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto">
      <Card>
        <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardTitle className="flex items-center gap-2">
            <Car className="h-5 w-5" />
            차량 관리
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row justify-between gap-4 mb-4">
            {/* 검색 */}
            <div className="flex-1 max-w-md">
              <SmartInput
                value={searchQuery}
                onChange={setSearchQuery}
                onSelect={handleSearchSelect}
                placeholder="차량번호 또는 이름으로 검색..."
                searchFunction={searchVehicles}
                recentItems={getRecentVehicles()}
                favoriteItems={getFavoriteVehicles()}
                debounceMs={300}
              />
            </div>

            <Button onClick={handleAddNew} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="mr-2 h-4 w-4" />
              차량 등록
            </Button>
          </div>

          {filteredVehicles.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchQuery ? '검색 결과가 없습니다.' : '등록된 차량이 없습니다. 차량을 등록해주세요.'}
            </div>
          ) : (
            <>
              {/* 데스크톱 테이블 */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>번호판</TableHead>
                      <TableHead>성명 (선택)</TableHead>
                      <TableHead>기본 단가</TableHead>
                      <TableHead>총 운행</TableHead>
                      <TableHead>총 금액</TableHead>
                      <TableHead>등록일</TableHead>
                      <TableHead className="text-center">관리</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredVehicles.map((vehicle) => (
                      <VehicleTableRow
                        key={vehicle.id}
                        vehicle={vehicle}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        getStats={getVehicleStatsData}
                      />
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* 모바일 카드 뷰 */}
              <div className="md:hidden space-y-4">
                {filteredVehicles.map((vehicle) => (
                  <VehicleCard
                    key={vehicle.id}
                    vehicle={vehicle}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    getStats={getVehicleStatsData}
                  />
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* 차량 등록/수정 다이얼로그 */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingVehicle ? '차량 정보 수정' : '새 차량 등록'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="licensePlate">번호판 (필수)</Label>
              <Input
                id="licensePlate"
                value={formData.licensePlate}
                onChange={(e) => setFormData({ ...formData, licensePlate: e.target.value })}
                placeholder="예: 12가3456"
                className="text-lg font-semibold"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">성명 (선택)</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="예: 홍길동 (선택사항)"
              />
              <p className="text-sm text-gray-500">
                성명은 선택사항입니다. 비워두셔도 됩니다.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="defaultUnitPrice">기본 단가 (선택)</Label>
              <Input
                id="defaultUnitPrice"
                type="number"
                value={formData.defaultUnitPrice}
                onChange={(e) => setFormData({ ...formData, defaultUnitPrice: e.target.value })}
                placeholder="예: 50000"
                min="0"
              />
              <p className="text-sm text-gray-500">
                운행 기록 입력 시 자동으로 설정됩니다
              </p>
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsDialogOpen(false);
                  resetForm();
                }}
                className="w-full sm:w-auto"
                disabled={loading}
              >
                취소
              </Button>
              <Button type="submit" className="w-full sm:w-auto" disabled={loading}>
                {loading ? '저장 중...' : (editingVehicle ? '수정' : '등록')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// 기존 VehicleTableRow, VehicleCard 컴포넌트들은 그대로 유지
const VehicleTableRow: React.FC<{
  vehicle: Vehicle;
  onEdit: (vehicle: Vehicle) => void;
  onDelete: (id: string) => void;
  getStats: (vehicleId: string) => Promise<any>;
}> = ({ vehicle, onEdit, onDelete, getStats }) => {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    const loadStats = async () => {
      const statsData = await getStats(vehicle.id);
      setStats(statsData);
    };
    loadStats();
  }, [vehicle.id, getStats]);

  return (
    <TableRow className="hover:bg-gray-50">
      <TableCell>
        <Badge className="bg-blue-100 text-blue-800 border-blue-300 font-bold text-base px-3 py-1">
          {vehicle.licensePlate}
        </Badge>
      </TableCell>
      <TableCell>
        {vehicle.name ? (
          <span className="font-medium">{vehicle.name}</span>
        ) : (
          <span className="text-gray-400 italic">미입력</span>
        )}
      </TableCell>
      <TableCell>
        {vehicle.defaultUnitPrice ? (
          <span className="text-green-600 font-medium">
            {vehicle.defaultUnitPrice.toLocaleString()}원
          </span>
        ) : (
          <span className="text-gray-400">미설정</span>
        )}
      </TableCell>
      <TableCell>
        <span className="font-medium">{stats?.totalTrips || 0}회</span>
      </TableCell>
      <TableCell>
        <span className="font-medium text-blue-600">
          {(stats?.totalAmount || 0).toLocaleString()}원
        </span>
      </TableCell>
      <TableCell className="text-gray-500">
        {format(new Date(vehicle.createdAt), 'yyyy-MM-dd', { locale: ko })}
      </TableCell>
      <TableCell>
        <div className="flex justify-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(vehicle)}
            className="h-8 w-8 p-0 text-blue-500 hover:text-blue-700"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(vehicle.id)}
            className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
};

const VehicleCard: React.FC<{
  vehicle: Vehicle;
  onEdit: (vehicle: Vehicle) => void;
  onDelete: (id: string) => void;
  getStats: (vehicleId: string) => Promise<any>;
}> = ({ vehicle, onEdit, onDelete, getStats }) => {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    const loadStats = async () => {
      const statsData = await getStats(vehicle.id);
      setStats(statsData);
    };
    loadStats();
  }, [vehicle.id, getStats]);

  return (
    <Card className="p-4">
      <div className="flex justify-between items-start mb-3">
        <div>
          <Badge className="bg-blue-100 text-blue-800 border-blue-300 font-bold text-lg px-3 py-1 mb-2">
            {vehicle.licensePlate}
          </Badge>
          {vehicle.name ? (
            <h3 className="font-medium text-lg">{vehicle.name}</h3>
          ) : (
            <h3 className="font-medium text-lg text-gray-400 italic">성명 미입력</h3>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(vehicle)}
            className="h-8 w-8 p-0 text-blue-500 hover:text-blue-700"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(vehicle.id)}
            className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm mb-3">
        <div>
          <span className="text-gray-500">기본 단가:</span>
          <div className="font-medium">
            {vehicle.defaultUnitPrice ? (
              <span className="text-green-600">
                {vehicle.defaultUnitPrice.toLocaleString()}원
              </span>
            ) : (
              <span className="text-gray-400">미설정</span>
            )}
          </div>
        </div>
        <div>
          <span className="text-gray-500">총 운행:</span>
          <div className="font-medium">{stats?.totalTrips || 0}회</div>
        </div>
      </div>

      <div className="bg-blue-50 p-3 rounded-lg mb-3">
        <div className="text-sm text-blue-600">총 운행 금액</div>
        <div className="text-xl font-bold text-blue-800">
          {(stats?.totalAmount || 0).toLocaleString()}원
        </div>
      </div>

      <div className="text-sm text-gray-500">
        등록일: {format(new Date(vehicle.createdAt), 'yyyy-MM-dd', { locale: ko })}
      </div>
    </Card>
  );
};

export default VehicleManagement;