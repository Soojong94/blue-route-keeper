
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Car } from 'lucide-react';
import { Button } from '@/components/ui/button';
import TripSummarySection from './excel-trip-input/TripSummarySection';
import TripTable from './excel-trip-input/TripTable';
import ActionButtons from './excel-trip-input/ActionButtons';
import { useTripData } from './excel-trip-input/useTripData';
import { useTripSaving } from './excel-trip-input/useTripSaving';

interface ExcelTripInputProps {
  onTripSaved: () => void;
  onTabChange: (tab: string) => void;
}

const ExcelTripInput: React.FC<ExcelTripInputProps> = ({ onTripSaved, onTabChange }) => {
  const {
    rows,
    vehicles,
    locations,
    departureLocations,
    destinationLocations,
    recentLocations,
    addNewRow,
    removeRow,
    handleChange,
    resetRows
  } = useTripData();

  const { saveAllRows } = useTripSaving(onTripSaved, resetRows);

  // Calculate totals for the summary
  const totalTrips = rows.filter(row => 
    row.departure && row.destination && row.amount && row.purpose
  ).reduce((sum, row) => sum + (parseInt(row.purpose) || 0), 0);
  
  const totalAmount = rows.reduce((sum, row) => {
    const amount = parseFloat(row.amount) || 0;
    const purpose = parseInt(row.purpose) || 0;
    return sum + (amount * purpose);
  }, 0);

  const showVehicleButton = vehicles.length === 0;
  const showLocationButton = locations.length === 0;

  return (
    <Card className="w-full">
      <CardHeader className="p-0 relative">
        <TripSummarySection totalTrips={totalTrips} totalAmount={totalAmount} />
        
        {/* Top right buttons */}
        {(showVehicleButton || showLocationButton) && (
          <div className="absolute top-4 right-4 flex gap-2">
            {showVehicleButton && (
              <Button 
                variant="outline" 
                size="sm"
                className="bg-white border-amber-300 text-amber-700 hover:bg-amber-100 h-8 px-3 text-xs"
                onClick={() => onTabChange('vehicles')}
              >
                <Car className="mr-1 h-3 w-3" />
                차량 등록
              </Button>
            )}
            {showLocationButton && (
              <Button 
                variant="outline" 
                size="sm"
                className="bg-white border-blue-300 text-blue-700 hover:bg-blue-100 h-8 px-3 text-xs"
                onClick={() => onTabChange('locations')}
              >
                <MapPin className="mr-1 h-3 w-3" />
                장소 등록
              </Button>
            )}
          </div>
        )}
      </CardHeader>
      <CardContent className="p-0">
        <TripTable
          rows={rows}
          vehicles={vehicles}
          departureLocations={departureLocations}
          destinationLocations={destinationLocations}
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
