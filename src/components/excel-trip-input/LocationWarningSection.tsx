
import React from 'react';
import { Button } from '@/components/ui/button';
import { MapPin } from 'lucide-react';
import { Location } from '@/types/trip';

interface LocationWarningSectionProps {
  locations: Location[];
  onTabChange: (tab: string) => void;
}

const LocationWarningSection: React.FC<LocationWarningSectionProps> = ({ locations, onTabChange }) => {
  if (locations.length > 0) return null;

  return (
    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg mb-4">
      <div className="flex items-center justify-between">
        <p className="text-blue-700 text-sm">등록된 장소가 없습니다.</p>
        <Button 
          variant="outline" 
          size="sm"
          className="bg-white border-blue-300 text-blue-700 hover:bg-blue-100 h-8 px-3 text-xs"
          onClick={() => onTabChange('locations')}
        >
          <MapPin className="mr-1 h-3 w-3" />
          장소 등록
        </Button>
      </div>
    </div>
  );
};

export default LocationWarningSection;
