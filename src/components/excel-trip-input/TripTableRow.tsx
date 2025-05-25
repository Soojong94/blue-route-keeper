
import React from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { TripRow } from './TripRowData';
import { Vehicle, Location } from '@/types/trip';
import VehicleSelector from './VehicleSelector';
import LocationSelector from './LocationSelector';
import AmountInput from './AmountInput';

interface TripTableRowProps {
  row: TripRow;
  vehicles: Vehicle[];
  departureLocations: Location[];
  destinationLocations: Location[];
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
        <VehicleSelector
          value={row.vehicleId}
          vehicles={vehicles}
          onChange={(value) => onChange(row.id, 'vehicleId', value)}
        />
      </TableCell>
      <TableCell>
        <LocationSelector
          value={row.departure}
          locations={departureLocations}
          recentLocations={recentLocations.departures}
          type="departure"
          rowId={row.id}
          onChange={(value) => onChange(row.id, 'departure', value)}
        />
      </TableCell>
      <TableCell>
        <LocationSelector
          value={row.destination}
          locations={destinationLocations}
          recentLocations={recentLocations.destinations}
          type="destination"
          rowId={row.id}
          onChange={(value) => onChange(row.id, 'destination', value)}
        />
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
        <AmountInput
          value={row.amount}
          onChange={(value) => onChange(row.id, 'amount', value)}
        />
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
