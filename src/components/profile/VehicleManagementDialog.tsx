// src/components/profile/VehicleManagementDialog.tsx 수정
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Car, Plus, Edit, Trash2, ChevronDown, ChevronUp, BarChart3 } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { getVehicles, saveVehicle, updateVehicle, deleteVehicle, getTrips } from '@/utils/storage';
import { getVehicleStats } from '@/utils/calculations';
import { Vehicle } from '@/types/trip';
import SmartInput, { SearchResult } from '@/components/SmartInput';
import { searchVehicles, addRecentVehicle, getRecentVehicles } from '@/utils/smartSearch';

interface VehicleManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const VehicleManagementDialog: React.FC<VehicleManagementDialogProps> = ({
  open,
  onOpenChange
}) => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredVehicles, setFilteredVehicles] = useState<Vehicle[]>([]);
  const [showStats, setShowStats] = useState(false); // 통계 표시 상태 (기본값: false)
  const [formData, setFormData] = useState({
    licensePlate: '',
    name: '',
    defaultUnitPrice: '',
  });

  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      loadVehicles();
    }
  }, [open]);

  useEffect(() => {
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
      setIsEditDialogOpen(false);
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
    setIsEditDialogOpen(true);
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
    setIsEditDialogOpen(true);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-sm flex items-center gap-2">
              <Car className="h-4 w-4" />
              차량 관리
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="flex flex-col sm:flex-row justify-between gap-2">
              <div className="flex gap-2 flex-1">
                <div className="flex-1 max-w-xs">
                  <SmartInput
                    value={searchQuery}
                    onChange={setSearchQuery}
                    onSelect={handleSearchSelect}
                    placeholder="차량번호 또는 이름으로 검색..."
                    className="text-xs h-7"
                    searchFunction={searchVehicles}
                    recentItems={getRecentVehicles()}
                    favoriteItems={getFavoriteVehicles()}
                    debounceMs={300}
                  />
                </div>

                {/* 통계 토글 버튼 */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowStats(!showStats)}
                  className="text-xs h-7 px-2 shrink-0"
                >
                  <BarChart3 className="h-3 w-3 mr-1" />
                  통계
                  {showStats ? (
                    <ChevronUp className="h-3 w-3 ml-1" />
                  ) : (
                    <ChevronDown className="h-3 w-3 ml-1" />
                  )}
                </Button>
              </div>

              <Button onClick={handleAddNew} className="text-xs h-7 px-3">
                <Plus className="mr-1 h-3 w-3" />
                차량 등록
              </Button>
            </div>

            {filteredVehicles.length === 0 ? (
              <div className="text-center py-6 text-gray-500 text-xs">
                {searchQuery ? '검색 결과가 없습니다.' : '등록된 차량이 없습니다.'}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredVehicles.map((vehicle) => (
                  <VehicleCard
                    key={vehicle.id}
                    vehicle={vehicle}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    showStats={showStats}
                  />
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* 차량 등록/수정 다이얼로그 */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm">
              {editingVehicle ? '차량 정보 수정' : '새 차량 등록'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3 py-2">
            <div className="space-y-1">
              <Label className="text-xs">번호판 (필수)</Label>
              <Input
                value={formData.licensePlate}
                onChange={(e) => setFormData({ ...formData, licensePlate: e.target.value })}
                placeholder="예: 12가3456"
                className="text-xs h-7"
                required
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">성명 (선택)</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="예: 홍길동"
                className="text-xs h-7"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">기본 단가 (선택)</Label>
              <Input
                type="number"
                value={formData.defaultUnitPrice}
                onChange={(e) => setFormData({ ...formData, defaultUnitPrice: e.target.value })}
                placeholder="예: 50000"
                className="text-xs h-7"
                min="0"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsEditDialogOpen(false);
                  resetForm();
                }}
                className="flex-1 text-xs h-7"
                disabled={loading}
              >
                취소
              </Button>
              <Button type="submit" className="flex-1 text-xs h-7" disabled={loading}>
                {loading ? '저장 중...' : (editingVehicle ? '수정' : '등록')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

// 수정된 VehicleCard - showStats prop 추가
const VehicleCard: React.FC<{
  vehicle: Vehicle;
  onEdit: (vehicle: Vehicle) => void;
  onDelete: (id: string) => void;
  showStats: boolean;
}> = ({ vehicle, onEdit, onDelete, showStats }) => {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    if (showStats) {
      const loadStats = async () => {
        try {
          const [trips, vehicles] = await Promise.all([getTrips(), getVehicles()]);
          const statsData = getVehicleStats(vehicle.id, trips, vehicles);
          setStats(statsData);
        } catch (error) {
          console.error('Error getting vehicle stats:', error);
        }
      };
      loadStats();
    }
  }, [vehicle.id, showStats]);

  return (
    <Card className="p-3">
      <div className="flex justify-between items-start mb-2">
        <div>
          <Badge className="bg-blue-100 text-blue-800 border-blue-300 text-xs px-2 py-0.5 mb-1">
            {vehicle.licensePlate}
          </Badge>
          {vehicle.name ? (
            <h3 className="text-xs font-medium">{vehicle.name}</h3>
          ) : (
            <h3 className="text-xs font-medium text-gray-400 italic">성명 미입력</h3>
          )}
        </div>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(vehicle)}
            className="h-6 w-6 p-0 text-blue-500 hover:text-blue-700"
          >
            <Edit className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(vehicle.id)}
            className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* 기본 정보 */}
      <div className="space-y-2">
        {vehicle.defaultUnitPrice && (
          <div className="bg-green-50 p-2 rounded text-xs">
            <div className="text-green-600">기본 단가</div>
            <div className="text-sm font-bold text-green-800">
              {vehicle.defaultUnitPrice.toLocaleString()}원
            </div>
          </div>
        )}

        {/* 통계 정보 - showStats가 true일 때만 표시 */}
        {showStats && stats && (
          <div className="space-y-2 border-t pt-2">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-gray-500">총 운행:</span>
                <div className="text-xs font-medium">{stats.totalTrips || 0}회</div>
              </div>
              <div>
                <span className="text-gray-500">평균 단가:</span>
                <div className="text-xs font-medium">
                  {stats.avgUnitPrice ? Math.round(stats.avgUnitPrice).toLocaleString() : 0}원
                </div>
              </div>
            </div>

            <div className="bg-blue-50 p-2 rounded text-xs">
              <div className="text-blue-600">총 운행 금액</div>
              <div className="text-sm font-bold text-blue-800">
                {(stats.totalAmount || 0).toLocaleString()}원
              </div>
            </div>

            {stats.mostFrequentRoute && (
              <div className="bg-gray-50 p-2 rounded text-xs">
                <div className="text-gray-600">최다 경로</div>
                <div className="text-xs font-medium">
                  {stats.mostFrequentRoute.departure} → {stats.mostFrequentRoute.destination}
                  <span className="ml-1 text-gray-500">({stats.mostFrequentRoute.count}회)</span>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="text-[10px] text-gray-500">
          등록일: {format(new Date(vehicle.createdAt), 'yyyy-MM-dd', { locale: ko })}
        </div>
      </div>
    </Card>
  );
};

export default VehicleManagementDialog;