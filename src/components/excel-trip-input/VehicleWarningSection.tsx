
import React from 'react';
import { Button } from '@/components/ui/button';
import { Car } from 'lucide-react';
import { Vehicle } from '@/types/trip';

interface VehicleWarningSectionProps {
  vehicles: Vehicle[];
  onTabChange: (tab: string) => void;
}

const VehicleWarningSection: React.FC<VehicleWarningSectionProps> = ({ vehicles, onTabChange }) => {
  if (vehicles.length > 0) return null;

  return (
    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg mb-4">
      <div className="flex items-center justify-between">
        <p className="text-amber-700 text-sm">등록된 차량이 없습니다.</p>
        <Button 
          variant="outline" 
          size="sm"
          className="bg-white border-amber-300 text-amber-700 hover:bg-amber-100 h-8 px-3 text-xs"
          onClick={() => onTabChange('vehicles')}
        >
          <Car className="mr-1 h-3 w-3" />
          차량 등록
        </Button>
      </div>
    </div>
  );
};

export default VehicleWarningSection;
