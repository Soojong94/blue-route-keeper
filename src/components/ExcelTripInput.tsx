
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin } from 'lucide-react';
import TripSummarySection from './excel-trip-input/TripSummarySection';
import VehicleWarningSection from './excel-trip-input/VehicleWarningSection';
import LocationWarningSection from './excel-trip-input/LocationWarningSection';
import TripTable from './excel-trip-input/TripTable';
import ActionButtons from './excel-trip-input/ActionButtons';
import { useTripData } from './excel-trip-input/useTripData';
import { useTripSaving } from './excel-trip-input/useTripSaving';

interface ExcelTripInputProps {
  onTripSaved: () => void;
}

const ExcelTripInput: React.FC<ExcelTripInputProps> = ({ onTripSaved }) => {
  const {
    rows,
    vehicles,
    locations,
    departureLocations,
    destinationLocations,
    recentDrivers,
    recentLocations,
    addNewRow,
    removeRow,
    handleChange,
    resetRows
  } = useTripData();

  const { saveAllRows } = useTripSaving(onTripSaved, resetRows);

  // Calculate totals for the summary
  const totalTrips = rows.filter(row => 
    row.driverName && row.departure && row.destination && row.amount
  ).length;
  
  const totalAmount = rows.reduce((sum, row) => {
    const amount = parseFloat(row.amount) || 0;
    return sum + amount;
  }, 0);

  return (
    <Card className="w-full">
      <CardHeader className="p-0">
        <TripSummarySection totalTrips={totalTrips} totalAmount={totalAmount} />
      </CardHeader>
      <CardContent className="p-0">
        <VehicleWarningSection vehicles={vehicles} />
        <LocationWarningSection locations={locations} />
        
        <TripTable
          rows={rows}
          vehicles={vehicles}
          departureLocations={departureLocations}
          destinationLocations={destinationLocations}
          recentDrivers={recentDrivers}
          recentLocations={recentLocations}
          onChange={handleChange}
          onRemove={removeRow}
        />
        
        <ActionButtons 
          onAddRow={addNewRow}
          onSaveAll={() => saveAllRows(rows)}
        />
      </CardContent>
    </Card>
  );
};

export default ExcelTripInput;
