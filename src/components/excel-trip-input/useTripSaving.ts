
import { useToast } from '@/hooks/use-toast';
import { saveTrip } from '@/utils/tripStorage';
import { getVehicleById } from '@/utils/vehicleStorage';
import { TripRow } from './TripRowData';

export const useTripSaving = (onTripSaved: () => void, resetRows: () => void) => {
  const { toast } = useToast();

  const saveAllRows = (rows: TripRow[]) => {
    let hasErrors = false;
    let savedCount = 0;
    
    // Validate and save each row
    rows.forEach(row => {
      // Skip empty rows (no essential data)
      if (!row.departure && !row.destination && !row.amount) {
        return;
      }
      
      // Validate required fields
      if (!row.date || !row.vehicleId || !row.departure || 
          !row.destination || !row.amount) {
        hasErrors = true;
        return;
      }
      
      // Get vehicle information
      const vehicle = getVehicleById(row.vehicleId);
      if (!vehicle) {
        hasErrors = true;
        return;
      }
      
      // Get driver name from vehicle (use mainDriver or first driver)
      const driverName = vehicle.mainDriver || (vehicle.drivers && vehicle.drivers[0]) || '운전자 미지정';
      
      // Validate amount
      const amountNumber = parseFloat(row.amount);
      if (isNaN(amountNumber) || amountNumber < 0) {
        hasErrors = true;
        return;
      }
      
      // Save the trip
      try {
        saveTrip({
          date: row.date,
          startTime: '09:00', // 기본값
          endTime: '18:00', // 기본값
          departure: row.departure,
          destination: row.destination,
          amount: parseInt(row.amount),
          vehicleId: row.vehicleId,
          driverName: driverName,
          purpose: row.purpose
        });
        savedCount++;
      } catch (error) {
        console.error('Error saving trip:', error);
        hasErrors = true;
      }
    });
    
    // Show result toast
    if (hasErrors) {
      toast({
        title: "저장 실패",
        description: "일부 항목을 저장하는 데 문제가 있습니다. 입력 내용을 확인해 주세요.",
        variant: "destructive",
      });
    } else if (savedCount > 0) {
      toast({
        title: "저장 완료",
        description: `${savedCount}건의 운행 기록이 저장되었습니다.`,
      });
      
      // Reset the table with one empty row
      resetRows();
      
      // Notify parent component
      onTripSaved();
    } else {
      toast({
        title: "저장할 항목 없음",
        description: "저장할 운행 기록이 없습니다.",
      });
    }
  };

  return { saveAllRows };
};
