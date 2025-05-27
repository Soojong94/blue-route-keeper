import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, Printer } from 'lucide-react';

interface ReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: React.ReactNode;
}

const ReportDialog: React.FC<ReportDialogProps> = ({ open, onOpenChange, title, children }) => {
  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    // 여기에 PDF 생성 로직을 추가할 수 있습니다
    console.log('Export functionality would be implemented here');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle>{title}</DialogTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="no-print"
            >
              <Printer className="mr-2 h-4 w-4" />
              인쇄
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              className="no-print"
            >
              <Download className="mr-2 h-4 w-4" />
              내보내기
            </Button>
          </div>
        </DialogHeader>
        <div className="mt-4">
          {children}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReportDialog;