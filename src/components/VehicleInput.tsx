// src/components/VehicleInput.tsx 새 파일 생성
import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, Car, Plus } from 'lucide-react';
import { Vehicle } from '@/types/trip';
import { cn } from '@/lib/utils';

interface VehicleInputProps {
  value: string;
  onChange: (vehicleId: string) => void;
  vehicles: Vehicle[];
  onNewVehicle: (licensePlate: string) => Promise<string>;
  placeholder?: string;
  className?: string;
}

const VehicleInput: React.FC<VehicleInputProps> = ({
  value,
  onChange,
  vehicles,
  onNewVehicle,
  placeholder = "차량번호 입력",
  className
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 현재 선택된 차량 정보 가져오기
  const selectedVehicle = vehicles.find(v => v.id === value);

  useEffect(() => {
    if (selectedVehicle) {
      setInputValue(selectedVehicle.licensePlate);
    } else {
      setInputValue('');
    }
  }, [selectedVehicle]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleInputChange = async (licensePlate: string) => {
    setInputValue(licensePlate);

    if (!licensePlate.trim()) {
      onChange('');
      return;
    }

    // 기존 차량 검색
    const existingVehicle = vehicles.find(v => v.licensePlate === licensePlate);

    if (existingVehicle) {
      onChange(existingVehicle.id);
    } else {
      // 새 차량 자동 생성
      setIsLoading(true);
      try {
        const newVehicleId = await onNewVehicle(licensePlate);
        onChange(newVehicleId);
      } catch (error) {
        console.error('Error creating new vehicle:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleVehicleSelect = (vehicle: Vehicle) => {
    setInputValue(vehicle.licensePlate);
    onChange(vehicle.id);
    setIsDropdownOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="flex">
        <Input
          value={inputValue}
          onChange={(e) => handleInputChange(e.target.value)}
          placeholder={placeholder}
          className={cn("pr-10", className)}
          disabled={isLoading}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="ml-1 px-2"
          disabled={isLoading}
        >
          <ChevronDown className={cn("h-4 w-4 transition-transform", isDropdownOpen && "rotate-180")} />
        </Button>
      </div>

      {selectedVehicle && selectedVehicle.name && (
        <div className="mt-1">
          <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
            {selectedVehicle.name}
          </Badge>
        </div>
      )}

      {isDropdownOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto">
          {vehicles.length > 0 ? (
            vehicles.map((vehicle) => (
              <div
                key={vehicle.id}
                onClick={() => handleVehicleSelect(vehicle)}
                className="flex items-center gap-2 p-2 hover:bg-gray-100 cursor-pointer"
              >
                <Car className="h-4 w-4 text-gray-400" />
                <div className="flex-1">
                  <div className="font-medium">{vehicle.licensePlate}</div>
                  {vehicle.name && (
                    <div className="text-sm text-gray-500">{vehicle.name}</div>
                  )}
                  {vehicle.defaultUnitPrice && (
                    <div className="text-xs text-blue-600">
                      기본단가: {vehicle.defaultUnitPrice.toLocaleString()}원
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="p-3 text-gray-500 text-center">
              <Plus className="h-4 w-4 mx-auto mb-1" />
              <div className="text-sm">등록된 차량이 없습니다</div>
            </div>
          )}
        </div>
      )}

      {isLoading && (
        <div className="absolute right-12 top-2">
          <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
        </div>
      )}
    </div>
  );
};

export default VehicleInput;