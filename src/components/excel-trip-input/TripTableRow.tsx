
import React from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectLabel, SelectGroup } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { TripRow } from './TripRowData';
import { Vehicle, Location } from '@/types/trip';

interface TripTableRowProps {
  row: TripRow;
  vehicles: Vehicle[];
  departureLocations: Location[];
  destinationLocations: Location[];
  recentDrivers: string[];
  recentLocations: {
    departures: string[];
    destinations: string[];
  };
  onChange: (id: string, field: keyof TripRow, value: string) => void;
  onRemove: (id: string) => void;
}

const TripTableRow: React.FC<TripTableRowProps> = ({
  row,
  vehicles,
  departureLocations,
  destinationLocations,
  recentLocations,
  onChange,
  onRemove
}) => {
  const getLocationName = (locationId: string, type: 'departure' | 'destination'): string => {
    const locationList = type === 'departure' ? departureLocations : destinationLocations;
    const location = locationList.find(l => l.id === locationId);
    
    if (location) {
      return location.alias || location.name;
    }
    
    return locationId;
  };

  const getVehicleDisplayName = (vehicleId: string): string => {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    if (vehicle) {
      const driverInfo = vehicle.mainDriver ? ` (${vehicle.mainDriver})` : '';
      return `${vehicle.licensePlate} - ${vehicle.name}${driverInfo}`;
    }
    return '';
  };

  const handleAmountChange = (increment: boolean) => {
    const currentAmount = parseFloat(row.amount) || 0;
    const newAmount = increment ? currentAmount + 10000 : Math.max(0, currentAmount - 10000);
    onChange(row.id, 'amount', newAmount.toString());
  };

  const calculateTotal = (): number => {
    const amount = parseFloat(row.amount) || 0;
    const purpose = parseInt(row.purpose) || 0;
    return amount * purpose;
  };

  return (
    <TableRow>
      <TableCell>
        <Input 
          type="date" 
          value={row.date}
          onChange={(e) => onChange(row.id, 'date', e.target.value)}
          className="w-full h-9 p-1"
        />
      </TableCell>
      <TableCell className="min-w-[250px]">
        <Select 
          value={row.vehicleId}
          onValueChange={(value) => onChange(row.id, 'vehicleId', value)}
        >
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
      </TableCell>
      <TableCell>
        <Select
          value={row.departure}
          onValueChange={(value) => onChange(row.id, 'departure', value)}
        >
          <SelectTrigger className="h-9 p-1 w-full">
            <SelectValue placeholder="출발지 선택" />
          </SelectTrigger>
          <SelectContent>
            {departureLocations.length > 0 && (
              <SelectGroup>
                <SelectLabel>등록된 장소</SelectLabel>
                {departureLocations.map((loc) => (
                  <SelectItem key={`dep-${loc.id}`} value={loc.id}>
                    {loc.alias ? `${loc.alias} (${loc.name})` : loc.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            )}
            {recentLocations.departures.length > 0 && (
              <SelectGroup>
                <SelectLabel>최근 장소</SelectLabel>
                {recentLocations.departures.map((loc, idx) => (
                  <SelectItem key={`recent-dep-${idx}`} value={loc}>
                    {loc}
                  </SelectItem>
                ))}
              </SelectGroup>
            )}
          </SelectContent>
        </Select>
        <Input 
          type="text" 
          value={
            departureLocations.find(loc => loc.id === row.departure) 
              ? getLocationName(row.departure, 'departure') 
              : row.departure
          }
          onChange={(e) => onChange(row.id, 'departure', e.target.value)}
          list={`departures-${row.id}`}
          className="w-full h-9 p-1 mt-1"
          placeholder="직접 입력"
        />
        <datalist id={`departures-${row.id}`}>
          {recentLocations.departures.map((loc, idx) => (
            <option key={`dep-${idx}`} value={loc} />
          ))}
        </datalist>
      </TableCell>
      <TableCell>
        <Select
          value={row.destination}
          onValueChange={(value) => onChange(row.id, 'destination', value)}
        >
          <SelectTrigger className="h-9 p-1 w-full">
            <SelectValue placeholder="목적지 선택" />
          </SelectTrigger>
          <SelectContent>
            {destinationLocations.length > 0 && (
              <SelectGroup>
                <SelectLabel>등록된 장소</SelectLabel>
                {destinationLocations.map((loc) => (
                  <SelectItem key={`dest-${loc.id}`} value={loc.id}>
                    {loc.alias ? `${loc.alias} (${loc.name})` : loc.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            )}
            {recentLocations.destinations.length > 0 && (
              <SelectGroup>
                <SelectLabel>최근 장소</SelectLabel>
              {recentLocations.destinations.map((loc, idx) => (
                <SelectItem key={`recent-dest-${idx}`} value={loc}>
                  {loc}
                </SelectItem>
              ))}
              </SelectGroup>
            )}
          </SelectContent>
        </Select>
        <Input 
          type="text" 
          value={
            destinationLocations.find(loc => loc.id === row.destination) 
              ? getLocationName(row.destination, 'destination') 
              : row.destination
          }
          onChange={(e) => onChange(row.id, 'destination', e.target.value)}
          list={`destinations-${row.id}`}
          className="w-full h-9 p-1 mt-1"
          placeholder="직접 입력"
        />
        <datalist id={`destinations-${row.id}`}>
          {recentLocations.destinations.map((loc, idx) => (
            <option key={`dest-${idx}`} value={loc} />
          ))}
        </datalist>
      </TableCell>
      <TableCell>
        <Input 
          type="number" 
          value={row.purpose}
          onChange={(e) => onChange(row.id, 'purpose', e.target.value)}
          className="w-full h-9 p-1"
          placeholder="횟수"
          min="1"
        />
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          <Input 
            type="number" 
            value={row.amount}
            onChange={(e) => onChange(row.id, 'amount', e.target.value)}
            className="w-full h-9 p-1"
            placeholder="건당 금액"
            min="0"
            step="10000"
          />
          <div className="flex flex-col gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-4 w-6 p-0 text-xs"
              onClick={() => handleAmountChange(true)}
            >
              ▲
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-4 w-6 p-0 text-xs"
              onClick={() => handleAmountChange(false)}
            >
              ▼
            </Button>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <div className="text-center font-medium">
          {new Intl.NumberFormat('ko-KR').format(calculateTotal())}원
        </div>
      </TableCell>
      <TableCell>
        <Button 
          variant="ghost" 
          size="icon"
          className="h-8 w-8 text-red-500"
          onClick={() => onRemove(row.id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
};

export default TripTableRow;
