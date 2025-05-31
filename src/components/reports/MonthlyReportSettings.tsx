// src/components/reports/MonthlyReportSettings.tsx
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { MonthlyReportData } from '@/utils/reportUtils';
import MonthlyReport from '@/components/reports/MonthlyReport';

interface MonthlyReportSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerate: (settings: {
    title: string;
    reportData: MonthlyReportData;
  }) => void;
}

const MonthlyReportSettings: React.FC<MonthlyReportSettingsProps> = ({
  open,
  onOpenChange,
  onGenerate
}) => {
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [reportData, setReportData] = useState<MonthlyReportData | null>(null);

  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      const now = new Date();
      const defaultTitle = `${now.getFullYear()}년 ${String(now.getMonth() + 1).padStart(2, '0')}월 월간보고서`;
      setTitle(defaultTitle);

      // 빈 템플릿 생성 (5행)
      const emptyData: MonthlyReportData = {
        period: defaultTitle,
        rows: Array(5).fill(null).map((_, index) => ({
          id: `empty-${Date.now()}-${index}`,
          date: '',
          item: '',
          count: 0,
          unitPrice: 0,
          totalAmount: 0
        })),
        totalAmount: 0
      };
      setReportData(emptyData);
    }
  }, [open]);

  const handleDataChange = (newData: MonthlyReportData) => {
    setReportData(newData);
  };

  const handleGenerate = async () => {
    if (!title.trim()) {
      toast({
        title: "입력 오류",
        description: "보고서 제목을 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    if (!reportData) {
      toast({
        title: "데이터 오류",
        description: "보고서 데이터가 없습니다.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      await onGenerate({
        title,
        reportData: {
          ...reportData,
          period: title
        }
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
        <DialogHeader>
          <DialogTitle>월간 보고서 작성</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* 제목 편집 */}
          <div className="space-y-2">
            <Label>보고서 제목</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: 2024년 12월 월간보고서"
              className="text-lg font-medium"
            />
          </div>

          {/* 직접 편집 그리드 */}
          <div className="border-t pt-4">
            <h3 className="font-medium mb-3">보고서 내용 작성</h3>
            <div className="bg-blue-50 p-3 rounded mb-4">
              <p className="text-sm text-blue-700">
                💡 아래 표에 직접 입력하세요. 행 추가 버튼으로 항목을 늘릴 수 있습니다.
              </p>
            </div>

            {reportData && (
              <div className="border rounded-lg report-container">
                <MonthlyReport
                  data={reportData}
                  viewMode="edit"
                  onDataChange={handleDataChange}
                  showTitle={false}
                />
              </div>
            )}
          </div>

          {/* 저장 버튼 */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              취소
            </Button>
            <Button
              onClick={handleGenerate}
              disabled={loading || !reportData}
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

export default MonthlyReportSettings;