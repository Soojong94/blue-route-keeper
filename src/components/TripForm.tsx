
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { MapPin } from 'lucide-react';
import { saveTrip } from '@/utils/tripStorage';
import { useToast } from '@/hooks/use-toast';
import VehicleDriverSelection from './trip-form/VehicleDriverSelection';
import DateTimeSelection from './trip-form/DateTimeSelection';
import LocationSelection from './trip-form/LocationSelection';
import AmountPurposeFields from './trip-form/AmountPurposeFields';
import { useTripFormData } from './trip-form/useTripFormData';

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

  const {
    vehicles,
    departureLocations,
    destinationLocations,
    recentDrivers,
    recentLocations
  } = useTripFormData();
  
  const { toast } = useToast();

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
          <VehicleDriverSelection
            vehicles={vehicles}
            vehicleId={vehicleId}
            setVehicleId={setVehicleId}
            driverName={driverName}
            setDriverName={setDriverName}
            recentDrivers={recentDrivers}
          />

          <DateTimeSelection
            date={date}
            setDate={setDate}
            startTime={startTime}
            setStartTime={setStartTime}
            endTime={endTime}
            setEndTime={setEndTime}
          />

          <LocationSelection
            departure={departure}
            setDeparture={setDeparture}
            destination={destination}
            setDestination={setDestination}
            departureLocations={departureLocations}
            destinationLocations={destinationLocations}
            recentLocations={recentLocations}
          />

          <AmountPurposeFields
            amount={amount}
            setAmount={setAmount}
            purpose={purpose}
            setPurpose={setPurpose}
          />

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
