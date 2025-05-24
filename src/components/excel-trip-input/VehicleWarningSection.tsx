
import React from 'react';
import { Button } from '@/components/ui/button';
import { Car } from 'lucide-react';
import { Vehicle } from '@/types/trip';

interface VehicleWarningSectionProps {
  vehicles: Vehicle[];
}

const VehicleWarningSection: React.FC<VehicleWarningSectionProps> = ({ vehicles }) => {
  if (vehicles.length > 0) return null;

  return (
    <div className="p-4 bg-amber-50 border-b border-amber-100 text-center">
      <p className="text-amber-700 mb-2">등록된 차량이 없습니다. 차량을 먼저 등록해주세요.</p>
      <Button 
        variant="outline" 
        size="sm"
        className="bg-white border-amber-500 text-amber-700 hover:bg-amber-100"
        onClick={() => {
          const activeTabElement = document.querySelector('[data-state="active"][value="vehicles"]');
          if (activeTabElement) {
            (activeTabElement as HTMLElement).click();
          }
        }}
      >
        <Car className="mr-2 h-4 w-4" />
        차량 등록하기
      </Button>
    </div>
  );
};

export default VehicleWarningSection;
