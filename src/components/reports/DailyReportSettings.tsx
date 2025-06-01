// src/components/reports/DailyReportSettings.tsx
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Vehicle } from '@/types/trip';
import { getVehicles, getTripsByDateRange } from '@/utils/storage';
import { generateDailyReport } from '@/utils/reportUtils';
import { ReportControls } from '@/components/reports/ReportControls';
import DailyReport from '@/components/reports/DailyReport';
import { format } from 'date-fns'; // 🔥 이 줄 추가
import { ko } from 'date-fns/locale'; // 🔥 이 줄도 추가 (필요한 경우)

interface ReportSettings {
  title: string;
  startDate: Date;
  endDate: Date;
  vehicleId: string;
  additionalText: string;
  driverName: string;
  contact: string;
}

interface DailyReportSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerate: (settings: ReportSettings) => void;
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
  const [settings, setSettings] = useState<ReportSettings>({
    title: '',
    startDate: new Date(),
    endDate: new Date(),
    vehicleId: 'all',
    additionalText: '',
    driverName: '',
    contact: ''
  });

  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      loadVehicles();
      const today = new Date();
      setSettings(prev => ({
        ...prev,
        title: `${format(today, 'yyyy년 MM월', { locale: ko })} 운행보고서`, // 🔥 여기서 format 사용
        startDate: today,
        endDate: today
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

  const handleSettingsChange = (field: keyof ReportSettings, value: any) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

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
      await onGenerate(settings);
      onOpenChange(false);
    } catch (error) {
      console.error('Generate report error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto mx-auto">
        <DialogHeader>
          <DialogTitle>운행 보고서 설정</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* 보고서 설정 */}
          <ReportControls
            settings={settings}
            vehicles={vehicles}
            onSettingsChange={handleSettingsChange}
            onRegenerate={generatePreview}
            showRegenerate={true}
            compact={false}
          />

          {/* 미리보기 */}
          <div className="border-t pt-4 mt-4">
            <h3 className="font-medium mb-3">미리보기</h3>
            {previewLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin inline-block h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                <p className="mt-2 text-gray-500">보고서 생성 중...</p>
              </div>
            ) : previewData ? (
              <div className="max-h-96 overflow-y-auto border rounded-lg report-container mx-auto" style={{ maxWidth: '210mm' }}>
                <DailyReport
                  data={previewData}
                  vehicles={vehicles}
                  viewMode="preview"
                  initialSettings={settings}
                />
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                설정을 완료하면 미리보기가 표시됩니다
              </div>
            )}
          </div>

          {/* 저장 버튼 */}
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
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DailyReportSettings;