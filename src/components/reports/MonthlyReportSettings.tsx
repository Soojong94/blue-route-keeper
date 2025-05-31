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
    }
  }, [open]);

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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-sm">월간 보고서 설정</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="space-y-1">
            <Label className="text-xs">보고서 제목</Label>
            <Input
              value={settings.title}
              onChange={(e) => setSettings(prev => ({ ...prev, title: e.target.value }))}
              placeholder="예: 2024년 12월 월간보고서"
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

          <div className="bg-gray-50 p-2 rounded text-xs">
            <p className="text-gray-600">
              기간: {format(settings.startDate, 'yyyy년 MM월 dd일')} ~ {format(settings.endDate, 'MM월 dd일')}
            </p>
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

export default MonthlyReportSettings;