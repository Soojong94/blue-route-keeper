// src/components/VehicleFilterInput.tsx 새 파일 생성
import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Car, Search } from 'lucide-react';
import { Vehicle } from '@/types/trip';
import { searchVehiclesByLicensePlate } from '@/utils/storage';

interface VehicleFilterInputProps {
  value: string;
  onChange: (vehicleId: string) => void;
  vehicles: Vehicle[];
  placeholder?: string;
  className?: string;
}

const VehicleFilterInput: React.FC<VehicleFilterInputProps> = ({
  value,
  onChange,
  vehicles,
  placeholder = "차량번호 입력 (예: 12 입력시 1234 추천)",
  className
}) => {
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState<Vehicle[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 현재 선택된 차량 표시
  const selectedVehicle = vehicles.find(v => v.id === value);

  useEffect(() => {
    if (value === 'all') {
      setInputValue('');
    } else if (selectedVehicle) {
      setInputValue(selectedVehicle.licensePlate);
    }
  }, [value, selectedVehicle]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleInputChange = async (searchTerm: string) => {
    setInputValue(searchTerm);

    if (!searchTerm.trim()) {
      onChange('all');
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    // 로컬에서 먼저 검색
    const localFiltered = vehicles.filter(vehicle =>
      vehicle.licensePlate.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (vehicle.name && vehicle.name.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    // 정확히 일치하는 차량이 있다면 자동 선택
    const exactMatch = localFiltered.find(v => v.licensePlate === searchTerm);
    if (exactMatch) {
      onChange(exactMatch.id);
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    // 부분 일치하는 차량들을 제안으로 표시
    if (localFiltered.length > 0) {
      setSuggestions(localFiltered.slice(0, 5)); // 최대 5개까지만
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
      // 서버에서도 검색해보기 (추가 차량이 있을 수 있음)
      try {
        const serverResults = await searchVehiclesByLicensePlate(searchTerm);
        if (serverResults.length > 0) {
          setSuggestions(serverResults.slice(0, 5));
          setShowSuggestions(true);
        }
      } catch (error) {
        console.error('Error searching vehicles:', error);
      }
    }
  };

  const handleSuggestionClick = (vehicle: Vehicle) => {
    setInputValue(vehicle.licensePlate);
    onChange(vehicle.id);
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const handleClear = () => {
    setInputValue('');
    onChange('all');
    setSuggestions([]);
    setShowSuggestions(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="relative">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          value={inputValue}
          onChange={(e) => handleInputChange(e.target.value)}
          placeholder={placeholder}
          className={`pl-8 ${className}`}
          onFocus={() => {
            if (suggestions.length > 0) {
              setShowSuggestions(true);
            }
          }}
        />
        {inputValue && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2 top-2.5 text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
        )}
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto">
          <div className="p-2 text-xs text-gray-500 bg-gray-50 border-b">
            추천 차량 ({suggestions.length}개)
          </div>
          {suggestions.map((vehicle) => (
            <div
              key={vehicle.id}
              onClick={() => handleSuggestionClick(vehicle)}
              className="flex items-center gap-2 p-2 hover:bg-gray-100 cursor-pointer"
            >
              <Car className="h-4 w-4 text-gray-400" />
              <div className="flex-1">
                <div className="font-medium">{vehicle.licensePlate}</div>
                {vehicle.name && (
                  <div className="text-sm text-gray-500">{vehicle.name}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default VehicleFilterInput;