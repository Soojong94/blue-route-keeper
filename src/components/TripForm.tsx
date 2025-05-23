
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { CalendarIcon, Clock, MapPin, DollarSign, Car, User, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { saveTrip } from '@/utils/tripStorage';
import { getVehicles, getDriversForVehicle } from '@/utils/vehicleStorage';
import { getLocations, getLocationsByType } from '@/utils/locationStorage';
import { useToast } from '@/hooks/use-toast';
import { Vehicle, Location } from '@/types/trip';

interface TripFormProps {
  onTripSaved: () => void;
}

const TripForm: React.FC<TripFormProps> = ({ onTripSaved }) => {
  // Set default date to today
  const [date, setDate] = useState<Date>(new Date());
  
  // Set default times
  const now = new Date();
  const defaultStartTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
  const defaultEndTime = `${String(oneHourLater.getHours()).padStart(2, '0')}:${String(oneHourLater.getMinutes()).padStart(2, '0')}`;

  const [startTime, setStartTime] = useState(defaultStartTime);
  const [endTime, setEndTime] = useState(defaultEndTime);
  const [departure, setDeparture] = useState('');
  const [destination, setDestination] = useState('');
  const [amount, setAmount] = useState('');
  const [vehicleId, setVehicleId] = useState('');
  const [driverName, setDriverName] = useState('');
  const [purpose, setPurpose] = useState('');
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [departureLocations, setDepartureLocations] = useState<Location[]>([]);
  const [destinationLocations, setDestinationLocations] = useState<Location[]>([]);

  // For autocomplete functionality
  const [recentDrivers, setRecentDrivers] = useState<string[]>([]);
  const [recentLocations, setRecentLocations] = useState<{departures: string[], destinations: string[]}>({
    departures: [],
    destinations: []
  });
  
  const { toast } = useToast();

  useEffect(() => {
    // Load all vehicles
    setVehicles(getVehicles());

    // Load all locations
    const allLocations = getLocations();
    setLocations(allLocations);
    setDepartureLocations(allLocations.filter(loc => loc.type === 'departure' || loc.type === 'both'));
    setDestinationLocations(allLocations.filter(loc => loc.type === 'destination' || loc.type === 'both'));
    
    // Load recent drivers from localStorage
    const loadRecentDrivers = () => {
      try {
        const savedTrips = JSON.parse(localStorage.getItem('car-trips') || '[]');
        // Use explicit filtering to ensure we have a string array
        const drivers = savedTrips
          .map((trip: any) => trip.driverName)
          .filter((driver: unknown): driver is string => typeof driver === 'string')
          .filter((value: string, index: number, self: string[]) => self.indexOf(value) === index); // Deduplicate
        
        setRecentDrivers(drivers);
      } catch (error) {
        console.error('Error loading recent drivers:', error);
        setRecentDrivers([]);
      }
    };
    
    // Load recent locations from localStorage
    const loadRecentLocations = () => {
      try {
        const savedTrips = JSON.parse(localStorage.getItem('car-trips') || '[]');
        
        // Use explicit filtering for departures
        const departures = savedTrips
          .map((trip: any) => trip.departure)
          .filter((place: unknown): place is string => typeof place === 'string')
          .filter((value: string, index: number, self: string[]) => self.indexOf(value) === index); // Deduplicate
        
        // Use explicit filtering for destinations
        const destinations = savedTrips
          .map((trip: any) => trip.destination)
          .filter((place: unknown): place is string => typeof place === 'string')
          .filter((value: string, index: number, self: string[]) => self.indexOf(value) === index); // Deduplicate
        
        setRecentLocations({
          departures,
          destinations
        });
      } catch (error) {
        console.error('Error loading recent locations:', error);
        setRecentLocations({ departures: [], destinations: [] });
      }
    };
    
    loadRecentDrivers();
    loadRecentLocations();
  }, []);

  // When vehicle changes, try to set its main driver if no driver is already selected
  useEffect(() => {
    if (vehicleId && !driverName) {
      const vehicle = vehicles.find(v => v.id === vehicleId);
      if (vehicle && vehicle.mainDriver) {
        setDriverName(vehicle.mainDriver);
      }
    }
  }, [vehicleId, driverName, vehicles]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!date || !startTime || !endTime || !departure || !destination || !amount || !vehicleId || !driverName) {
      toast({
        title: "입력 오류",
        description: "필수 필드를 모두 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    if (startTime >= endTime) {
      toast({
        title: "시간 오류",
        description: "출차시간은 입차시간보다 늦어야 합니다.",
        variant: "destructive",
      });
      return;
    }

    if (isNaN(parseFloat(amount)) || parseFloat(amount) < 0) {
      toast({
        title: "금액 오류",
        description: "유효한 금액을 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    try {
      saveTrip({
        date: format(date, 'yyyy-MM-dd'),
        startTime,
        endTime,
        departure,
        destination,
        amount: parseInt(amount),
        vehicleId,
        driverName,
        purpose,
      });

      toast({
        title: "운행 기록 저장",
        description: "운행 기록이 성공적으로 저장되었습니다.",
      });

      // Reset form
      setDate(new Date());
      setStartTime(defaultStartTime);
      setEndTime(defaultEndTime);
      setDeparture('');
      setDestination('');
      setAmount('');
      setVehicleId('');
      setDriverName('');
      setPurpose('');
      
      onTripSaved();
    } catch (error) {
      toast({
        title: "저장 실패",
        description: "운행 기록 저장 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

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
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-t-lg">
        <CardTitle className="text-xl font-bold flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          운행 기록 입력
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 차량 선택 */}
          <div className="space-y-2">
            <Label htmlFor="vehicle" className="text-sm font-medium text-gray-700 flex items-center gap-1">
              <Car className="h-4 w-4" />
              차량
            </Label>
            <Select value={vehicleId} onValueChange={setVehicleId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="차량을 선택하세요" />
              </SelectTrigger>
              <SelectContent>
                {vehicles.length > 0 ? (
                  vehicles.map((vehicle) => (
                    <SelectItem key={vehicle.id} value={vehicle.id} className="flex flex-col items-start">
                      <span className="font-bold text-lg">{vehicle.licensePlate}</span>
                      <span className="text-sm text-gray-500">{vehicle.name}</span>
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="none" disabled>
                    등록된 차량이 없습니다
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* 운전자명 - with datalist autocomplete */}
          <div className="space-y-2">
            <Label htmlFor="driverName" className="text-sm font-medium text-gray-700 flex items-center gap-1">
              <User className="h-4 w-4" />
              운전자
            </Label>
            <Input
              id="driverName"
              type="text"
              placeholder="운전자명을 입력하세요"
              value={driverName}
              onChange={(e) => setDriverName(e.target.value)}
              className="w-full"
              list="drivers-datalist"
            />
            <datalist id="drivers-datalist">
              {/* First show the registered drivers for this vehicle */}
              {vehicleId && getDriversForVehicle(vehicleId).map((driver, idx) => (
                <option key={`driver-reg-${idx}`} value={driver} />
              ))}
              {/* Then show other recent drivers */}
              {recentDrivers
                .filter(driver => !vehicleId || !getDriversForVehicle(vehicleId).includes(driver))
                .map((driver, idx) => (
                  <option key={`driver-${idx}`} value={driver} />
                ))}
            </datalist>
          </div>

          {/* 날짜 선택 - default today */}
          <div className="space-y-2">
            <Label htmlFor="date" className="text-sm font-medium text-gray-700 flex items-center gap-1">
              <CalendarIcon className="h-4 w-4" />
              운행 날짜
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "yyyy년 MM월 dd일", { locale: ko }) : "날짜를 선택하세요"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(selectedDate) => selectedDate && setDate(selectedDate)}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* 시간 입력 - with defaults */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startTime" className="text-sm font-medium text-gray-700 flex items-center gap-1">
                <Clock className="h-4 w-4" />
                입차시간
              </Label>
              <Input
                id="startTime"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endTime" className="text-sm font-medium text-gray-700 flex items-center gap-1">
                <Clock className="h-4 w-4" />
                출차시간
              </Label>
              <Input
                id="endTime"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full"
              />
            </div>
          </div>

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

          {/* 금액 입력 */}
          <div className="space-y-2">
            <Label htmlFor="amount" className="text-sm font-medium text-gray-700 flex items-center gap-1">
              <DollarSign className="h-4 w-4" />
              금액 (원)
            </Label>
            <Input
              id="amount"
              type="number"
              placeholder="금액을 입력하세요"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full"
              min="0"
            />
          </div>

          {/* 목적 또는 메모 */}
          <div className="space-y-2">
            <Label htmlFor="purpose" className="text-sm font-medium text-gray-700 flex items-center gap-1">
              <FileText className="h-4 w-4" />
              목적 / 메모
            </Label>
            <Textarea
              id="purpose"
              placeholder="운행 목적이나 메모를 입력하세요 (선택사항)"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              className="w-full"
              rows={3}
            />
          </div>

          {/* 저장 버튼 */}
          <Button 
            type="submit" 
            className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200"
          >
            운행 기록 저장
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default TripForm;
