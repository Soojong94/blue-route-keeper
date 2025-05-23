
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X, Plus, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
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
  const [mainDriver, setMainDriver] = useState('');
  const [driverInput, setDriverInput] = useState('');
  const [drivers, setDrivers] = useState<string[]>([]);
  const { toast } = useToast();

  // Load all recent drivers for suggestions
  const [recentDrivers, setRecentDrivers] = useState<string[]>([]);

  useEffect(() => {
    // Load recent drivers from localStorage
    try {
      const savedTrips = JSON.parse(localStorage.getItem('car-trips') || '[]');
      const driversList = savedTrips
        .map((trip: any) => trip.driverName)
        .filter((driver: unknown): driver is string => typeof driver === 'string')
        .filter((value: string, index: number, self: string[]) => self.indexOf(value) === index);
      
      setRecentDrivers(driversList);
    } catch (error) {
      console.error('Error loading recent drivers:', error);
      setRecentDrivers([]);
    }
  }, []);

  // Load vehicle data if editing
  useEffect(() => {
    if (vehicleToEdit) {
      setName(vehicleToEdit.name);
      setLicensePlate(vehicleToEdit.licensePlate);
      setMainDriver(vehicleToEdit.mainDriver || '');
      setDrivers(vehicleToEdit.drivers || []);
    }
  }, [vehicleToEdit]);

  const handleAddDriver = () => {
    if (driverInput && !drivers.includes(driverInput)) {
      setDrivers([...drivers, driverInput]);
      setDriverInput('');
    }
  };

  const handleRemoveDriver = (driver: string) => {
    setDrivers(drivers.filter(d => d !== driver));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !licensePlate) {
      toast({
        title: "입력 오류",
        description: "차량명과 번호판은 필수 입력항목입니다.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (vehicleToEdit) {
        updateVehicle(vehicleToEdit.id, { 
          name, 
          licensePlate,
          mainDriver,
          drivers: drivers.length > 0 ? drivers : undefined
        });
        toast({
          title: "차량 정보 수정",
          description: "차량 정보가 성공적으로 수정되었습니다.",
        });
      } else {
        saveVehicle({ 
          name, 
          licensePlate,
          mainDriver,
          drivers: drivers.length > 0 ? drivers : undefined
        });
        toast({
          title: "차량 등록",
          description: "차량이 성공적으로 등록되었습니다.",
        });
      }

      // Reset form
      setName('');
      setLicensePlate('');
      setMainDriver('');
      setDrivers([]);
      
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
            <Label htmlFor="licensePlate" className="text-sm font-medium text-gray-700">
              번호판 (필수)
            </Label>
            <Input
              id="licensePlate"
              type="text"
              placeholder="번호판을 입력하세요 (예: 12가3456)"
              value={licensePlate}
              onChange={(e) => setLicensePlate(e.target.value)}
              className="w-full text-lg font-semibold"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium text-gray-700">
              차량명 (필수)
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
            <Label htmlFor="mainDriver" className="text-sm font-medium text-gray-700 flex items-center gap-1">
              <User className="h-4 w-4" />
              주요 운전자
            </Label>
            <Input
              id="mainDriver"
              type="text"
              placeholder="주요 운전자명을 입력하세요"
              value={mainDriver}
              onChange={(e) => setMainDriver(e.target.value)}
              list="main-drivers-list"
              className="w-full"
            />
            <datalist id="main-drivers-list">
              {recentDrivers.map((driver, idx) => (
                <option key={`main-driver-${idx}`} value={driver} />
              ))}
            </datalist>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">
              추가 운전자 목록
            </Label>
            
            <div className="flex space-x-2">
              <Input
                type="text"
                placeholder="추가 운전자명을 입력하세요"
                value={driverInput}
                onChange={(e) => setDriverInput(e.target.value)}
                list="additional-drivers-list"
                className="flex-1"
              />
              <Button 
                type="button" 
                onClick={handleAddDriver}
                className="bg-blue-500 hover:bg-blue-600"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <datalist id="additional-drivers-list">
              {recentDrivers
                .filter(driver => !drivers.includes(driver) && driver !== mainDriver)
                .map((driver, idx) => (
                  <option key={`add-driver-${idx}`} value={driver} />
                ))}
            </datalist>
            
            <div className="flex flex-wrap gap-2 mt-2">
              {drivers.map((driver, index) => (
                <Badge 
                  key={index} 
                  className="bg-blue-100 text-blue-800 border border-blue-300 flex items-center gap-1"
                >
                  {driver}
                  <button 
                    type="button" 
                    onClick={() => handleRemoveDriver(driver)}
                    className="ml-1 text-blue-600 hover:text-blue-800 focus:outline-none"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              {drivers.length === 0 && (
                <span className="text-sm text-gray-500 italic">등록된 추가 운전자가 없습니다</span>
              )}
            </div>
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
