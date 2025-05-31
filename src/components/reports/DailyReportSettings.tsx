import React, { useState, useCallback, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Save } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Vehicle } from '@/types/trip';
import { getVehicles } from '@/utils/storage';
import SmartInput, { SearchResult } from '@/components/SmartInput';
import { searchVehicles, addRecentVehicle, getRecentVehicles } from '@/utils/smartSearch';

interface DailyReportSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerate: (settings: {
    title: string;
    startDate: Date;
    endDate: Date;
    vehicleId: string;
  }) => void;
}

const DailyReportSettings: React.FC<DailyReportSettingsProps> = ({
  open,
  onOpenChange,
  onGenerate
}) => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    title: '',
    startDate: new Date(),
    endDate: new Date(),
    vehicleId: 'all',
    vehicleInput: ''
  });

  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      loadVehicles();
      // 기본값 설정
      const today = new Date();
      setSettings(prev => ({
        ...prev,
        title: `${format(today, 'yyyy년 MM월')} 운행보고서`,
        startDate: today,
        endDate: today,
        vehicleId: 'all',
        vehicleInput: ''
      }));
    }
  }, [open]);

  const loadVehicles = async () => {
    try {
      const vehiclesData = await getVehicles();
      setVehicles(vehiclesData);
    } catch (error) {
      console.error('Error loading vehicles:', error);
    }
  };

  const getFavoriteVehicles = useCallback((): SearchResult[] => {
    return [
      {
        id: 'all-vehicles',
        value: '',
        label: '전체 차량',
        type: 'favorite',
        category: 'vehicle',
        metadata: { vehicleId: 'all' }
      },
      ...vehicles.map(vehicle => ({
        id: `fav-vehicle-${vehicle.id}`,
        value: vehicle.licensePlate,
        label: `${vehicle.licensePlate}${vehicle.name ? ` (${vehicle.name})` : ''}`,
        type: 'favorite',
        category: 'vehicle',
        metadata: {
          vehicleId: vehicle.id,
          vehicle,
          category: vehicle.defaultUnitPrice ? `${vehicle.defaultUnitPrice.toLocaleString()}원` : undefined
        }
      }))
    ];
  }, [vehicles]);

  const handleVehicleSelect = useCallback((result: SearchResult) => {
    if (result.metadata?.vehicleId) {
      setSettings(prev => ({
        ...prev,
        vehicleId: result.metadata.vehicleId,
        vehicleInput: result.value
      }));
      if (result.value) {
        addRecentVehicle(result.value);
      }
    }
  }, []);

  const handleVehicleInputChange = useCallback((value: string) => {
    setSettings(prev => ({ ...prev, vehicleInput: value }));

    if (!value.trim()) {
      setSettings(prev => ({ ...prev, vehicleId: 'all' }));
      return;
    }

    const matchingVehicle = vehicles.find(v => v.licensePlate === value);
    if (matchingVehicle) {
      setSettings(prev => ({ ...prev, vehicleId: matchingVehicle.id }));
    } else {
      setSettings(prev => ({ ...prev, vehicleId: 'all' }));
    }
  }, [vehicles]);

  const handleGenerate = async () => {
    if (!settings.title.trim()) {
      toast({
        title: "입력 오류",
        description: "보고서 제목을 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      await onGenerate({
        title: settings.title,
        startDate: settings.startDate,
        endDate: settings.endDate,
        vehicleId: settings.vehicleId
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Generate report error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-sm">운행 보고서 설정</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="space-y-1">
            <Label className="text-xs">보고서 제목</Label>
            <Input
              value={settings.title}
              onChange={(e) => setSettings(prev => ({ ...prev, title: e.target.value }))}
              placeholder="예: 2024년 12월 운행보고서"
              className="text-xs h-7"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">시작일</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal text-xs h-7",
                      !settings.startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-1 h-3 w-3" />
                    {settings.startDate ? format(settings.startDate, "MM/dd") : "시작일"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={settings.startDate}
                    onSelect={(date) => {
                      if (date) {
                        const localDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
                        setSettings(prev => ({
                          ...prev,
                          startDate: localDate,
                          endDate: localDate > prev.endDate ? localDate : prev.endDate
                        }));
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">종료일</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal text-xs h-7",
                      !settings.endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-1 h-3 w-3" />
                    {settings.endDate ? format(settings.endDate, "MM/dd") : "종료일"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={settings.endDate}
                    onSelect={(date) => {
                      if (date) {
                        const localDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
                        setSettings(prev => ({
                          ...prev,
                          endDate: localDate,
                          startDate: localDate < prev.startDate ? localDate : prev.startDate
                        }));
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">차량 선택</Label>
            <div className="flex gap-1">
              <Button
                variant={settings.vehicleId === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setSettings(prev => ({ ...prev, vehicleId: 'all', vehicleInput: '' }));
                }}
                className="shrink-0 h-7 text-xs px-2"
              >
                전체
              </Button>
              <SmartInput
                value={settings.vehicleInput}
                onChange={handleVehicleInputChange}
                onSelect={handleVehicleSelect}
                placeholder="차량번호"
                className="text-xs h-7"
                searchFunction={searchVehicles}
                recentItems={getRecentVehicles()}
                favoriteItems={getFavoriteVehicles()}
                debounceMs={300}
              />
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 text-xs h-7"
              disabled={loading}
            >
              취소
            </Button>
            <Button
              onClick={handleGenerate}
              className="flex-1 text-xs h-7"
              disabled={loading}
            >
              <Save className="h-3 w-3 mr-1" />
              {loading ? '생성 중...' : '생성 및 저장'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DailyReportSettings;