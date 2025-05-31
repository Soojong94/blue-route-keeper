/* src/components/reports/DailyReportSettings.tsx 수정 - 추가 필드 저장 기능 추가 */
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
import { getVehicles, getTripsByDateRange } from '@/utils/storage';
import { generateDailyReport } from '@/utils/reportUtils';
import SmartInput, { SearchResult } from '@/components/SmartInput';
import { searchVehicles, addRecentVehicle, getRecentVehicles } from '@/utils/smartSearch';
import DailyReport from '@/components/reports/DailyReport';

interface DailyReportSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerate: (settings: {
    title: string;
    startDate: Date;
    endDate: Date;
    vehicleId: string;
    additionalText?: string;
    driverName?: string;
    contact?: string;
  }) => void;
}

const DailyReportSettings: React.FC<DailyReportSettingsProps> = ({
  open,
  onOpenChange,
  onGenerate
}) => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const [settings, setSettings] = useState({
    title: '',
    startDate: new Date(),
    endDate: new Date(),
    vehicleId: 'all',
    vehicleInput: '',
    additionalText: '', // 추가 필드
    driverName: '',     // 추가 필드
    contact: ''         // 추가 필드
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
        vehicleInput: '',
        additionalText: '',
        driverName: '',
        contact: ''
      }));
      setPreviewData(null);
    }
  }, [open]);

  // 설정 변경 시 실시간 미리보기 생성
  useEffect(() => {
    if (open && settings.title && settings.startDate && settings.endDate) {
      generatePreview();
    }
  }, [settings.startDate, settings.endDate, settings.vehicleId, open]);

  const loadVehicles = async () => {
    try {
      const vehiclesData = await getVehicles();
      setVehicles(vehiclesData);
    } catch (error) {
      console.error('Error loading vehicles:', error);
    }
  };

  const generatePreview = async () => {
    setPreviewLoading(true);
    try {
      // 실제 데이터로 보고서 생성
      const trips = await getTripsByDateRange(settings.startDate, settings.endDate);
      const reportData = generateDailyReport(
        trips,
        vehicles,
        settings.startDate,
        settings.endDate,
        settings.vehicleId
      );
      setPreviewData(reportData);
    } catch (error) {
      console.error('Preview generation error:', error);
      setPreviewData(null);
    } finally {
      setPreviewLoading(false);
    }
  };

  const getFavoriteVehicles = useCallback((): SearchResult[] => {
    return [
      {
        id: 'all-vehicles',
        value: '',
        label: '전체 차량',
        type: 'favorite' as const,
        category: 'vehicle' as const,
        metadata: { vehicleId: 'all' }
      },
      ...vehicles.map(vehicle => ({
        id: `fav-vehicle-${vehicle.id}`,
        value: vehicle.licensePlate,
        label: `${vehicle.licensePlate}${vehicle.name ? ` (${vehicle.name})` : ''}`,
        type: 'favorite' as const,
        category: 'vehicle' as const,
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

    if (!previewData) {
      toast({
        title: "미리보기 오류",
        description: "보고서 미리보기를 생성한 후 저장해주세요.",
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
        vehicleId: settings.vehicleId,
        additionalText: settings.additionalText,
        driverName: settings.driverName,
        contact: settings.contact
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
      <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto">
        {/* 상단: 설정 폼 */}
        <DialogHeader>
          <DialogTitle>운행 보고서 설정</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>보고서 제목</Label>
            <Input
              value={settings.title}
              onChange={(e) => setSettings(prev => ({ ...prev, title: e.target.value }))}
              placeholder="예: 2024년 12월 운행보고서"
            />
          </div>

          {/* 추가 필드들 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>추가 텍스트 (선택)</Label>
              <Input
                value={settings.additionalText}
                onChange={(e) => setSettings(prev => ({ ...prev, additionalText: e.target.value }))}
                placeholder="예: 특별 운행, 긴급 운송 등"
              />
            </div>
            <div className="space-y-2">
              <Label>성명 (선택)</Label>
              <Input
                value={settings.driverName}
                onChange={(e) => setSettings(prev => ({ ...prev, driverName: e.target.value }))}
                placeholder="예: 홍길동"
              />
            </div>
            <div className="space-y-2">
              <Label>연락처 (선택)</Label>
              <Input
                value={settings.contact}
                onChange={(e) => setSettings(prev => ({ ...prev, contact: e.target.value }))}
                placeholder="예: 010-1234-5678"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>시작일</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !settings.startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
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

            <div className="space-y-2">
              <Label>종료일</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !settings.endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
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

            <div className="space-y-2">
              <Label>차량 선택</Label>
              <div className="flex gap-2">
                <Button
                  variant={settings.vehicleId === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setSettings(prev => ({ ...prev, vehicleId: 'all', vehicleInput: '' }));
                  }}
                  className="shrink-0"
                >
                  전체
                </Button>
                <SmartInput
                  value={settings.vehicleInput}
                  onChange={handleVehicleInputChange}
                  onSelect={handleVehicleSelect}
                  placeholder="차량번호"
                  searchFunction={searchVehicles}
                  recentItems={getRecentVehicles()}
                  favoriteItems={getFavoriteVehicles()}
                  debounceMs={300}
                />
              </div>
            </div>
          </div>
        </div>

        {/* 하단: 실시간 미리보기 */}
        <div className="border-t pt-4 mt-4">
          <h3 className="font-medium mb-3">미리보기</h3>
          {previewLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin inline-block h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full"></div>
              <p className="mt-2 text-gray-500">보고서 생성 중...</p>
            </div>
          ) : previewData ? (
            <div className="max-h-96 overflow-y-auto border rounded-lg report-container">
              <DailyReport
                data={previewData}
                vehicles={vehicles}
                selectedVehicleId={settings.vehicleId}
                startDate={settings.startDate}
                endDate={settings.endDate}
                onDateChange={() => { }}
                onVehicleChange={() => { }}
                onRefresh={() => { }}
                viewMode="preview"
                savedSettings={{
                  additionalText: settings.additionalText,
                  driverName: settings.driverName,
                  contact: settings.contact
                }}
              />
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              설정을 완료하면 미리보기가 표시됩니다
            </div>
          )}
        </div>

        {/* 최하단: 버튼 */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>취소</Button>
          <Button
            onClick={handleGenerate}
            disabled={loading || !previewData}
          >
            <Save className="h-4 w-4 mr-2" />
            {loading ? '저장 중...' : '저장'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DailyReportSettings;