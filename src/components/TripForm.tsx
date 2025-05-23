
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
import { getVehicles } from '@/utils/vehicleStorage';
import { useToast } from '@/hooks/use-toast';
import { Vehicle } from '@/types/trip';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';

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

  // For autocomplete functionality
  const [recentDrivers, setRecentDrivers] = useState<string[]>([]);
  const [recentLocations, setRecentLocations] = useState<{departures: string[], destinations: string[]}>({
    departures: [],
    destinations: []
  });
  
  // For driver autocomplete popup
  const [showDriverPopover, setShowDriverPopover] = useState(false);
  
  const { toast } = useToast();

  useEffect(() => {
    // Load all vehicles
    setVehicles(getVehicles());
    
    // Load recent drivers from localStorage
    const loadRecentDrivers = () => {
      try {
        const savedTrips = JSON.parse(localStorage.getItem('car-trips') || '[]');
        const driversFromStorage = savedTrips.map((trip: any) => trip.driverName)
          .filter((driver: string | null | undefined) => driver) // Remove null/undefined values
          .filter((driver: unknown): driver is string => typeof driver === 'string'); // Type guard
        
        setRecentDrivers([...new Set(driversFromStorage)]); // Deduplicate
      } catch (error) {
        console.error('Error loading recent drivers:', error);
        setRecentDrivers([]);
      }
    };
    
    // Load recent locations from localStorage
    const loadRecentLocations = () => {
      try {
        const savedTrips = JSON.parse(localStorage.getItem('car-trips') || '[]');
        
        const departuresFromStorage = savedTrips.map((trip: any) => trip.departure)
          .filter((place: string | null | undefined) => place)
          .filter((place: unknown): place is string => typeof place === 'string');
        
        const destinationsFromStorage = savedTrips.map((trip: any) => trip.destination)
          .filter((place: string | null | undefined) => place)
          .filter((place: unknown): place is string => typeof place === 'string');
        
        setRecentLocations({
          departures: [...new Set(departuresFromStorage)],
          destinations: [...new Set(destinationsFromStorage)]
        });
      } catch (error) {
        console.error('Error loading recent locations:', error);
        setRecentLocations({ departures: [], destinations: [] });
      }
    };
    
    loadRecentDrivers();
    loadRecentLocations();
  }, []);

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

  // Handle selection from autocomplete
  const handleSelectDriver = (driver: string) => {
    setDriverName(driver);
    setShowDriverPopover(false);
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
                    <SelectItem key={vehicle.id} value={vehicle.id}>
                      {vehicle.name} ({vehicle.licensePlate})
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

          {/* 운전자명 - with autocomplete */}
          <div className="space-y-2">
            <Label htmlFor="driverName" className="text-sm font-medium text-gray-700 flex items-center gap-1">
              <User className="h-4 w-4" />
              운전자
            </Label>
            <Popover open={showDriverPopover} onOpenChange={setShowDriverPopover}>
              <PopoverTrigger asChild>
                <div className="relative">
                  <Input
                    id="driverName"
                    type="text"
                    placeholder="운전자명을 입력하세요"
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    onFocus={() => recentDrivers.length > 0 && setShowDriverPopover(true)}
                    className="w-full"
                  />
                </div>
              </PopoverTrigger>
              {recentDrivers.length > 0 && (
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="이름 검색..." />
                    <CommandEmpty>해당하는 운전자가 없습니다</CommandEmpty>
                    <CommandGroup>
                      {recentDrivers
                        .filter(driver => driver.toLowerCase().includes(driverName.toLowerCase()))
                        .map((driver, index) => (
                          <CommandItem 
                            key={index} 
                            value={driver}
                            onSelect={() => handleSelectDriver(driver)}
                          >
                            <User className="mr-2 h-4 w-4" />
                            {driver}
                          </CommandItem>
                        ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              )}
            </Popover>
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

          {/* 장소 입력 - Fixed Issue: Replaced the Select+Command implementation with simple inputs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="departure" className="text-sm font-medium text-gray-700">
                출발지
              </Label>
              <Input
                id="departure"
                type="text"
                placeholder="출발지를 입력하세요"
                value={departure}
                onChange={(e) => setDeparture(e.target.value)}
                className="w-full"
                list="departure-options"
              />
              <datalist id="departure-options">
                {recentLocations.departures.map((loc, index) => (
                  <option key={`dep-${index}`} value={loc} />
                ))}
              </datalist>
            </div>
            <div className="space-y-2">
              <Label htmlFor="destination" className="text-sm font-medium text-gray-700">
                목적지
              </Label>
              <Input
                id="destination"
                type="text"
                placeholder="목적지를 입력하세요"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="w-full"
                list="destination-options"
              />
              <datalist id="destination-options">
                {recentLocations.destinations.map((loc, index) => (
                  <option key={`dest-${index}`} value={loc} />
                ))}
              </datalist>
            </div>
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
