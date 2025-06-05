// src/components/reports/ReportTypeSelector.tsx (수정)
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, Receipt } from 'lucide-react'; // BarChart3 제거

interface ReportTypeSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectType: (type: 'daily' | 'invoice') => void; // 'monthly' 제거
}

const ReportTypeSelector: React.FC<ReportTypeSelectorProps> = ({
  open,
  onOpenChange,
  onSelectType
}) => {
  const handleSelect = (type: 'daily' | 'invoice') => { // 'monthly' 제거
    onSelectType(type);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-sm">보고서 유형 선택</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <Card
            className="cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={() => handleSelect('daily')}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FileText className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-sm font-medium">운행 보고서</h3>
                  <p className="text-xs text-gray-500">일별 운행 내역을 정리한 보고서</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={() => handleSelect('invoice')}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Receipt className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-sm font-medium">청구서</h3>
                  <p className="text-xs text-gray-500">현장별 청구서 작성</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full text-xs h-7"
          >
            취소
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReportTypeSelector;