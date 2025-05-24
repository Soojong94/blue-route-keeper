
import React from 'react';
import { Button } from '@/components/ui/button';
import { MapPin } from 'lucide-react';
import { Location } from '@/types/trip';

interface LocationWarningSectionProps {
  locations: Location[];
}

const LocationWarningSection: React.FC<LocationWarningSectionProps> = ({ locations }) => {
  if (locations.length > 0) return null;

  return (
    <div className="p-4 bg-blue-50 border-b border-blue-100 text-center">
      <p className="text-blue-700 mb-2">등록된 장소가 없습니다. 자주 사용하는 장소를 등록하면 더 빠르게 입력할 수 있습니다.</p>
      <Button 
        variant="outline" 
        size="sm"
        className="bg-white border-blue-500 text-blue-700 hover:bg-blue-100"
        onClick={() => {
          const activeTabElement = document.querySelector('[data-state="active"][value="locations"]');
          if (activeTabElement) {
            (activeTabElement as HTMLElement).click();
          }
        }}
      >
        <MapPin className="mr-2 h-4 w-4" />
        장소 등록하기
      </Button>
    </div>
  );
};

export default LocationWarningSection;
