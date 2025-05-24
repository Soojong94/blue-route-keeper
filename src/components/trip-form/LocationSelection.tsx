
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Location } from '@/types/trip';

interface LocationSelectionProps {
  departure: string;
  setDeparture: (value: string) => void;
  destination: string;
  setDestination: (value: string) => void;
  departureLocations: Location[];
  destinationLocations: Location[];
  recentLocations: {departures: string[], destinations: string[]};
}

const LocationSelection: React.FC<LocationSelectionProps> = ({
  departure,
  setDeparture,
  destination,
  setDestination,
  departureLocations,
  destinationLocations,
  recentLocations
}) => {
  // Helper function to get location name by id or return original if not found
  const getLocationName = (locationId: string, type: 'departure' | 'destination'): string => {
    const locationList = type === 'departure' ? departureLocations : destinationLocations;
    const location = locationList.find(l => l.id === locationId);
    
    if (location) {
      return location.alias || location.name;
    }
    
    return locationId;
  };

  return (
    <>
      {/* 출발지 입력 */}
      <div className="space-y-2">
        <Label htmlFor="departure" className="text-sm font-medium text-gray-700">
          출발지
        </Label>
        <Select value={departure} onValueChange={setDeparture}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="출발지를 선택하세요" />
          </SelectTrigger>
          <SelectContent>
            {departureLocations.length > 0 && (
              <>
                <SelectItem value="" disabled className="italic text-gray-400">
                  등록된 장소
                </SelectItem>
                {departureLocations.map((loc) => (
                  <SelectItem key={`dep-${loc.id}`} value={loc.id}>
                    {loc.alias ? `${loc.alias} (${loc.name})` : loc.name}
                  </SelectItem>
                ))}
                <SelectItem value="" disabled className="italic text-gray-400">
                  최근 장소
                </SelectItem>
              </>
            )}
            {recentLocations.departures.map((loc, idx) => (
              <SelectItem key={`recent-dep-${idx}`} value={loc}>
                {loc}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {/* Allow direct text input */}
        <Input
          id="departure"
          type="text"
          placeholder="직접 입력하세요"
          value={
            departureLocations.find(loc => loc.id === departure) 
              ? getLocationName(departure, 'departure') 
              : departure
          }
          onChange={(e) => setDeparture(e.target.value)}
          className="w-full mt-1"
          list="departure-options"
        />
        <datalist id="departure-options">
          {recentLocations.departures.map((loc, index) => (
            <option key={`dep-${index}`} value={loc} />
          ))}
        </datalist>
      </div>

      {/* 목적지 입력 */}
      <div className="space-y-2">
        <Label htmlFor="destination" className="text-sm font-medium text-gray-700">
          목적지
        </Label>
        <Select value={destination} onValueChange={setDestination}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="목적지를 선택하세요" />
          </SelectTrigger>
          <SelectContent>
            {destinationLocations.length > 0 && (
              <>
                <SelectItem value="" disabled className="italic text-gray-400">
                  등록된 장소
                </SelectItem>
                {destinationLocations.map((loc) => (
                  <SelectItem key={`dest-${loc.id}`} value={loc.id}>
                    {loc.alias ? `${loc.alias} (${loc.name})` : loc.name}
                  </SelectItem>
                ))}
                <SelectItem value="" disabled className="italic text-gray-400">
                  최근 장소
                </SelectItem>
              </>
            )}
            {recentLocations.destinations.map((loc, idx) => (
              <SelectItem key={`recent-dest-${idx}`} value={loc}>
                {loc}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {/* Allow direct text input */}
        <Input
          id="destination"
          type="text"
          placeholder="직접 입력하세요"
          value={
            destinationLocations.find(loc => loc.id === destination) 
              ? getLocationName(destination, 'destination') 
              : destination
          }
          onChange={(e) => setDestination(e.target.value)}
          className="w-full mt-1"
          list="destination-options"
        />
        <datalist id="destination-options">
          {recentLocations.destinations.map((loc, index) => (
            <option key={`dest-${index}`} value={loc} />
          ))}
        </datalist>
      </div>
    </>
  );
};

export default LocationSelection;
