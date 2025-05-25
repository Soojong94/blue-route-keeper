
import React from 'react';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import TripTableRow from './TripTableRow';
import { TripRow } from './TripRowData';
import { Vehicle, Location } from '@/types/trip';

interface TripTableProps {
  rows: TripRow[];
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

const TripTable: React.FC<TripTableProps> = ({
  rows,
  vehicles,
  departureLocations,
  destinationLocations,
  recentLocations,
  onChange,
  onRemove
}) => {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader className="bg-gray-50">
          <TableRow>
            <TableHead className="w-[100px]">날짜</TableHead>
            <TableHead className="min-w-[250px]">차량</TableHead>
            <TableHead className="w-[140px]">출발지</TableHead>
            <TableHead className="w-[140px]">목적지</TableHead>
            <TableHead className="w-[80px]">횟수</TableHead>
            <TableHead className="w-[120px]">건당 금액</TableHead>
            <TableHead className="w-[140px]">총액</TableHead>
            <TableHead className="w-[60px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TripTableRow
              key={row.id}
              row={row}
              vehicles={vehicles}
              departureLocations={departureLocations}
              destinationLocations={destinationLocations}
              recentDrivers={recentDrivers}
              recentLocations={recentLocations}
              onChange={onChange}
              onRemove={onRemove}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default TripTable;
