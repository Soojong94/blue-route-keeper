
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Vehicle } from '@/types/trip';

interface VehicleSelectorProps {
  value: string;
  vehicles: Vehicle[];
  onChange: (value: string) => void;
}

const VehicleSelector: React.FC<VehicleSelectorProps> = ({
  value,
  vehicles,
  onChange
}) => {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-9 p-1 w-full">
        <SelectValue placeholder="차량 선택" />
      </SelectTrigger>
      <SelectContent>
        {vehicles.map((vehicle) => (
          <SelectItem key={vehicle.id} value={vehicle.id} className="flex flex-col items-start">
            <div className="w-full">
              <div className="font-bold text-base">{vehicle.licensePlate} - {vehicle.name}</div>
              {vehicle.mainDriver && (
                <div className="text-sm text-gray-600">운전자: {vehicle.mainDriver}</div>
              )}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default VehicleSelector;
