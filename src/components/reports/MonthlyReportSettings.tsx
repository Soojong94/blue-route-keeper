import React, { useState, useEffect } from 'react';
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
import { getTripsByDateRange } from '@/utils/storage';
import { generateMonthlyReport } from '@/utils/reportUtils';
import MonthlyReport from '@/components/reports/MonthlyReport';

interface MonthlyReportSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerate: (settings: {
    title: string;
    startDate: Date;
    endDate: Date;
  }) => void;
}

const MonthlyReportSettings: React.FC<MonthlyReportSettingsProps> = ({
  open,
  onOpenChange,
  onGenerate
}) => {
  const [loading, setLoading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const [settings, setSettings] = useState({
    title: '',
    startDate: new Date(),
    endDate: new Date()
  });

  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      // 기본값: 현재 달의 첫째 날부터 마지막 날까지
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      setSettings({
        title: `${format(now, 'yyyy년 MM월')} 월간보고서`,
        startDate: firstDay,
        endDate: lastDay
      });
      setPreviewData(null);
    }
  }, [open]);

  // 설정 변경 시 실시간 미리보기 생성
  useEffect(() => {
    if (open && settings.title && settings.startDate && settings.endDate) {
      generatePreview();
    }
  }, [settings.startDate, settings.endDate, open]);

  const generatePreview = async () => {
    setPreviewLoading(true);
    try {
      // 실제 데이터로 보고서 생성
      const trips = await getTripsByDateRange(settings.startDate, settings.endDate);
      const reportData = generateMonthlyReport(trips);
      setPreviewData(reportData);
    } catch (error) {
      console.error('Preview generation error:', error);
      setPreviewData(null);
    } finally {
      setPreviewLoading(false);
    }
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
      await onGenerate({
        title: settings.title,
        startDate: settings.startDate,
        endDate: settings.endDate
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
          <DialogTitle>월간 보고서 설정</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>보고서 제목</Label>
            <Input
              value={settings.title}
              onChange={(e) => setSettings(prev => ({ ...prev, title: e.target.value }))}
              placeholder="예: 2024년 12월 월간보고서"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
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
          </div>

          <div className="bg-gray-50 p-3 rounded">
            <p className="text-sm text-gray-600">
              기간: {format(settings.startDate, 'yyyy년 MM월 dd일')} ~ {format(settings.endDate, 'MM월 dd일')}
            </p>
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
              <MonthlyReport data={previewData} />
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

export default MonthlyReportSettings;