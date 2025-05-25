
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectLabel, SelectGroup } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Location } from '@/types/trip';

interface LocationSelectorProps {
  value: string;
  locations: Location[];
  recentLocations: string[];
  type: 'departure' | 'destination';
  rowId: string;
  onChange: (value: string) => void;
}

const LocationSelector: React.FC<LocationSelectorProps> = ({
  value,
  locations,
  recentLocations,
  type,
  rowId,
  onChange
}) => {
  const getLocationName = (locationId: string): string => {
    const location = locations.find(l => l.id === locationId);
    
    if (location) {
      return location.alias || location.name;
    }
    
    return locationId;
  };

  const placeholder = type === 'departure' ? '출발지 선택' : '목적지 선택';
  const inputPlaceholder = '직접 입력';
  const datalistId = `${type}s-${rowId}`;

  return (
    <>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-9 p-1 w-full">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {locations.length > 0 && (
            <SelectGroup>
              <SelectLabel>등록된 장소</SelectLabel>
              {locations.map((loc) => (
                <SelectItem key={`${type}-${loc.id}`} value={loc.id}>
                  {loc.alias ? `${loc.alias} (${loc.name})` : loc.name}
                </SelectItem>
              ))}
            </SelectGroup>
          )}
          {recentLocations.length > 0 && (
            <SelectGroup>
              <SelectLabel>최근 장소</SelectLabel>
              {recentLocations.map((loc, idx) => (
                <SelectItem key={`recent-${type}-${idx}`} value={loc}>
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
          locations.find(loc => loc.id === value) 
            ? getLocationName(value) 
            : value
        }
        onChange={(e) => onChange(e.target.value)}
        list={datalistId}
        className="w-full h-9 p-1 mt-1"
        placeholder={inputPlaceholder}
      />
      <datalist id={datalistId}>
        {recentLocations.map((loc, idx) => (
          <option key={`${type}-${idx}`} value={loc} />
        ))}
      </datalist>
    </>
  );
};

export default LocationSelector;
