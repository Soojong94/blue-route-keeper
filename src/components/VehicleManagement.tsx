
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Pencil, Trash2, Plus, Car } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getVehicles, deleteVehicle, getVehicleStats } from '@/utils/vehicleStorage';
import { Vehicle } from '@/types/trip';
import VehicleForm from './VehicleForm';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

const VehicleManagement: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehicleToEdit, setVehicleToEdit] = useState<Vehicle | undefined>(undefined);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    loadVehicles();
  }, [refreshTrigger]);

  const loadVehicles = () => {
    const allVehicles = getVehicles();
    setVehicles(allVehicles);
  };

  const handleDeleteVehicle = (id: string) => {
    try {
      deleteVehicle(id);
      loadVehicles();
      toast({
        title: "삭제 완료",
        description: "차량이 삭제되었습니다.",
      });
    } catch (error) {
      toast({
        title: "삭제 실패",
        description: "차량 삭제 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  const handleEditClick = (vehicle: Vehicle) => {
    setVehicleToEdit(vehicle);
    setIsDialogOpen(true);
  };

  const handleAddNew = () => {
    setVehicleToEdit(undefined);
    setIsDialogOpen(true);
  };

  const handleVehicleSaved = () => {
    setIsDialogOpen(false);
    setRefreshTrigger(prev => prev + 1);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR').format(amount);
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      <Card>
        <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-t-lg">
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <Car className="h-5 w-5" />
            차량 관리
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex justify-end mb-4">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  onClick={handleAddNew}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                >
                  <Plus className="mr-1 h-4 w-4" /> 새 차량 등록
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    {vehicleToEdit ? '차량 정보 수정' : '새 차량 등록'}
                  </DialogTitle>
                </DialogHeader>
                <VehicleForm 
                  onVehicleSaved={handleVehicleSaved} 
                  vehicleToEdit={vehicleToEdit}
                  onCancel={() => setIsDialogOpen(false)}
                />
              </DialogContent>
            </Dialog>
          </div>

          {vehicles.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              등록된 차량이 없습니다. 위의 '새 차량 등록' 버튼을 클릭하여 차량을 추가하세요.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>차량명</TableHead>
                    <TableHead>번호판</TableHead>
                    <TableHead>등록일</TableHead>
                    <TableHead>총 운행 횟수</TableHead>
                    <TableHead>총 운행 금액</TableHead>
                    <TableHead className="text-right">관리</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vehicles.map((vehicle) => {
                    const stats = getVehicleStats(vehicle.id);
                    return (
                      <TableRow key={vehicle.id} className="hover:bg-gray-50">
                        <TableCell className="font-medium">{vehicle.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            {vehicle.licensePlate}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {format(new Date(vehicle.createdAt), 'yyyy-MM-dd', { locale: ko })}
                        </TableCell>
                        <TableCell>{stats.totalTrips}회</TableCell>
                        <TableCell>{formatCurrency(stats.totalAmount)}원</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditClick(vehicle)}
                              className="h-8 w-8 p-0 text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteVehicle(vehicle.id)}
                              className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
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
    </div>
  );
};

export default VehicleManagement;
