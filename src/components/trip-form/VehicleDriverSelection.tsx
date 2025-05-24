
import React, { useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Car, User } from 'lucide-react';
import { Vehicle } from '@/types/trip';
import { getDriversForVehicle } from '@/utils/vehicleStorage';

interface VehicleDriverSelectionProps {
  vehicles: Vehicle[];
  vehicleId: string;
  setVehicleId: (value: string) => void;
  driverName: string;
  setDriverName: (value: string) => void;
  recentDrivers: string[];
}

const VehicleDriverSelection: React.FC<VehicleDriverSelectionProps> = ({
  vehicles,
  vehicleId,
  setVehicleId,
  driverName,
  setDriverName,
  recentDrivers
}) => {
  // When vehicle changes, try to set its main driver if no driver is already selected
  useEffect(() => {
    if (vehicleId && !driverName) {
      const vehicle = vehicles.find(v => v.id === vehicleId);
      if (vehicle && vehicle.mainDriver) {
        setDriverName(vehicle.mainDriver);
      }
    }
  }, [vehicleId, driverName, vehicles, setDriverName]);

  return (
    <>
      {/* 차량 선택 */}
      <div className="space-y-2">
        <Label htmlFor="vehicle" className="text-sm font-medium text-gray-700 flex items-center gap-1">
          <Car className="h-4 w-4" />
          차량
        </Label>
        <Select value={vehicleId} onValueChange={setVehicleId}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="차량을 선택하세요" />
          </SelectTrigger>
          <SelectContent>
            {vehicles.length > 0 ? (
              vehicles.map((vehicle) => (
                <SelectItem key={vehicle.id} value={vehicle.id} className="flex flex-col items-start">
                  <span className="font-bold text-lg">{vehicle.licensePlate}</span>
                  <span className="text-sm text-gray-500">{vehicle.name}</span>
                </SelectItem>
              ))
            ) : (
              <SelectItem value="no-vehicles" disabled>
                등록된 차량이 없습니다
              </SelectItem>
            )}
          </SelectContent>
        </Select>
      </div>

      {/* 운전자명 - with datalist autocomplete */}
      <div className="space-y-2">
        <Label htmlFor="driverName" className="text-sm font-medium text-gray-700 flex items-center gap-1">
          <User className="h-4 w-4" />
          운전자
        </Label>
        <Input
          id="driverName"
          type="text"
          placeholder="운전자명을 입력하세요"
          value={driverName}
          onChange={(e) => setDriverName(e.target.value)}
          className="w-full"
          list="drivers-datalist"
        />
        <datalist id="drivers-datalist">
          {/* First show the registered drivers for this vehicle */}
          {vehicleId && getDriversForVehicle(vehicleId).map((driver, idx) => (
            <option key={`driver-reg-${idx}`} value={driver} />
          ))}
          {/* Then show other recent drivers */}
          {recentDrivers
            .filter(driver => !vehicleId || !getDriversForVehicle(vehicleId).includes(driver))
            .map((driver, idx) => (
              <option key={`driver-${idx}`} value={driver} />
            ))}
        </datalist>
      </div>
    </>
  );
};

export default VehicleDriverSelection;
