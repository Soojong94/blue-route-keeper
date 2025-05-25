// src/components/VehicleManagement.tsx
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
import { getVehicles, saveVehicle, updateVehicle, deleteVehicle } from '@/utils/storage';
import { getVehicleStats } from '@/utils/calculations';
import { Vehicle } from '@/types/trip';

const VehicleManagement: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    licensePlate: '',
    defaultUnitPrice: '',
  });

  const { toast } = useToast();

  useEffect(() => {
    loadVehicles();
  }, []);

  const loadVehicles = () => {
    setVehicles(getVehicles());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.licensePlate) {
      toast({
        title: "입력 오류",
        description: "차량명과 번호판은 필수 입력항목입니다.",
        variant: "destructive",
      });
      return;
    }

    try {
      const vehicleData = {
        name: formData.name,
        licensePlate: formData.licensePlate,
        defaultUnitPrice: formData.defaultUnitPrice ? parseInt(formData.defaultUnitPrice) : undefined,
      };

      if (editingVehicle) {
        updateVehicle(editingVehicle.id, vehicleData);
        toast({
          title: "수정 완료",
          description: "차량 정보가 수정되었습니다.",
        });
      } else {
        saveVehicle(vehicleData);
        toast({
          title: "등록 완료",
          description: "차량이 등록되었습니다.",
        });
      }

      resetForm();
      setIsDialogOpen(false);
      loadVehicles();
    } catch (error) {
      toast({
        title: "저장 실패",
        description: "차량 정보 저장 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setFormData({
      name: vehicle.name,
      licensePlate: vehicle.licensePlate,
      defaultUnitPrice: vehicle.defaultUnitPrice?.toString() || '',
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('정말로 이 차량을 삭제하시겠습니까?')) {
      try {
        deleteVehicle(id);
        toast({
          title: "삭제 완료",
          description: "차량이 삭제되었습니다.",
        });
        loadVehicles();
      } catch (error) {
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
      name: '',
      licensePlate: '',
      defaultUnitPrice: '',
    });
    setEditingVehicle(null);
  };

  const handleAddNew = () => {
    resetForm();
    setIsDialogOpen(true);
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
          <div className="flex justify-end mb-4">
            <Button onClick={handleAddNew} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="mr-2 h-4 w-4" />
              차량 등록
            </Button>
          </div>

          {vehicles.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              등록된 차량이 없습니다. 차량을 등록해주세요.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>번호판</TableHead>
                    <TableHead>차량명</TableHead>
                    <TableHead>기본 단가</TableHead>
                    <TableHead>총 운행</TableHead>
                    <TableHead>총 금액</TableHead>
                    <TableHead>등록일</TableHead>
                    <TableHead className="text-center">관리</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vehicles.map((vehicle) => {
                    const stats = getVehicleStats(vehicle.id, JSON.parse(localStorage.getItem('car-trips') || '[]'));
                    return (
                      <TableRow key={vehicle.id} className="hover:bg-gray-50">
                        <TableCell>
                          <Badge className="bg-blue-100 text-blue-800 border-blue-300 font-bold text-base px-3 py-1">
                            {vehicle.licensePlate}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">{vehicle.name}</TableCell>
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
                              onClick={() => handleEdit(vehicle)}
                              className="h-8 w-8 p-0 text-blue-500 hover:text-blue-700"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(vehicle.id)}
                              className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
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
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">차량명 (필수)</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="예: 아반떼, 소나타"
              />
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

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsDialogOpen(false);
                  resetForm();
                }}
              >
                취소
              </Button>
              <Button type="submit">
                {editingVehicle ? '수정' : '등록'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VehicleManagement;