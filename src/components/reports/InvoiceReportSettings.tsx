// src/components/reports/InvoiceReportSettings.tsx
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { createEmptyInvoiceData, InvoiceReportData } from '@/utils/reportUtils';
import InvoiceReport from '@/components/reports/InvoiceReport';

interface InvoiceReportSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerate: (settings: {
    title: string;
    reportData: InvoiceReportData;
  }) => void;
}

const InvoiceReportSettings: React.FC<InvoiceReportSettingsProps> = ({
  open,
  onOpenChange,
  onGenerate
}) => {
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [reportData, setReportData] = useState<InvoiceReportData | null>(null);

  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      const now = new Date();
      const defaultTitle = `${now.getFullYear()}년 ${String(now.getMonth() + 1).padStart(2, '0')}월 청구서`;
      setTitle(defaultTitle);

      // 빈 청구서 템플릿 생성 (10행)
      const emptyData = createEmptyInvoiceData(defaultTitle);
      setReportData(emptyData);
    }
  }, [open]);

  const handleDataChange = (newData: InvoiceReportData) => {
    setReportData(newData);
    setTitle(newData.title); // 제목이 변경된 경우 동기화
  };

  const handleGenerate = async () => {
    if (!title.trim()) {
      toast({
        title: "입력 오류",
        description: "청구서 제목을 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    if (!reportData) {
      toast({
        title: "데이터 오류",
        description: "청구서 데이터가 없습니다.",
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
          title: title
        }
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Generate invoice error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>청구서 작성</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* 직접 편집 그리드 */}
          <div className="border-t pt-4">
            <h3 className="font-medium mb-3">청구서 내용 작성</h3>
            <div className="bg-blue-50 p-3 rounded mb-4">
              <p className="text-sm text-blue-700">
                💡 아래 청구서를 직접 편집하세요. 현장 정보와 청구 항목을 모두 입력할 수 있습니다.
              </p>
            </div>

            {reportData && (
              <div className="border rounded-lg invoice-container">
                <InvoiceReport
                  data={reportData}
                  viewMode="edit"
                  onDataChange={handleDataChange}
                  showTitle={true}
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

export default InvoiceReportSettings;