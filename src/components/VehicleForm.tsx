
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { saveVehicle, updateVehicle } from '@/utils/vehicleStorage';
import { useToast } from '@/hooks/use-toast';
import { Vehicle } from '@/types/trip';

interface VehicleFormProps {
  onVehicleSaved: () => void;
  vehicleToEdit?: Vehicle;
  onCancel?: () => void;
}

const VehicleForm: React.FC<VehicleFormProps> = ({ 
  onVehicleSaved, 
  vehicleToEdit,
  onCancel
}) => {
  const [name, setName] = useState('');
  const [licensePlate, setLicensePlate] = useState('');
  const { toast } = useToast();

  // Load vehicle data if editing
  useEffect(() => {
    if (vehicleToEdit) {
      setName(vehicleToEdit.name);
      setLicensePlate(vehicleToEdit.licensePlate);
    }
  }, [vehicleToEdit]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !licensePlate) {
      toast({
        title: "입력 오류",
        description: "모든 필드를 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (vehicleToEdit) {
        updateVehicle(vehicleToEdit.id, { name, licensePlate });
        toast({
          title: "차량 정보 수정",
          description: "차량 정보가 성공적으로 수정되었습니다.",
        });
      } else {
        saveVehicle({ name, licensePlate });
        toast({
          title: "차량 등록",
          description: "차량이 성공적으로 등록되었습니다.",
        });
      }

      // Reset form
      setName('');
      setLicensePlate('');
      
      onVehicleSaved();
    } catch (error) {
      toast({
        title: "저장 실패",
        description: "차량 정보 저장 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-t-lg">
        <CardTitle className="text-xl font-bold">
          {vehicleToEdit ? '차량 정보 수정' : '차량 등록'}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium text-gray-700">
              차량명
            </Label>
            <Input
              id="name"
              type="text"
              placeholder="차량명을 입력하세요"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="licensePlate" className="text-sm font-medium text-gray-700">
              번호판
            </Label>
            <Input
              id="licensePlate"
              type="text"
              placeholder="번호판을 입력하세요 (예: 12가3456)"
              value={licensePlate}
              onChange={(e) => setLicensePlate(e.target.value)}
              className="w-full"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button 
              type="submit" 
              className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
            >
              {vehicleToEdit ? '수정' : '등록'}
            </Button>
            
            {onCancel && (
              <Button 
                type="button"
                variant="outline"
                onClick={onCancel}
                className="flex-1"
              >
                취소
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default VehicleForm;
