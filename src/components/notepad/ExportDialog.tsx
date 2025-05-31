import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, FileText, Table } from 'lucide-react';

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  noteTitle: string;
  noteData: any[][];
}

const ExportDialog: React.FC<ExportDialogProps> = ({
  open,
  onOpenChange,
  noteTitle,
  noteData
}) => {
  const [exportFormat, setExportFormat] = useState<'csv' | 'excel'>('csv');

  const handleExport = () => {
    if (exportFormat === 'csv') {
      exportToCsv();
    } else {
      exportToExcel();
    }
    onOpenChange(false);
  };

  const exportToCsv = () => {
    const csvData = noteData.map(row =>
      row.map(cell => cell?.value || '').join(',')
    ).join('\n');

    const blob = new Blob(['\uFEFF' + csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${noteTitle}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportToExcel = () => {
    // Excel 내보내기는 간단한 HTML 테이블 형태로 구현
    const htmlContent = `
      <table>
        ${noteData.map(row => `
          <tr>
            ${row.map(cell => `<td>${cell?.value || ''}</td>`).join('')}
          </tr>
        `).join('')}
      </table>
    `;

    const blob = new Blob([htmlContent], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${noteTitle}.xls`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-sm flex items-center gap-2">
            <Download className="h-4 w-4" />
            메모 내보내기
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label className="text-xs">파일 형식</Label>
            <Select value={exportFormat} onValueChange={(value: 'csv' | 'excel') => setExportFormat(value)}>
              <SelectTrigger className="text-xs h-7">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv" className="text-xs">
                  <div className="flex items-center gap-2">
                    <FileText className="h-3 w-3" />
                    CSV 파일 (.csv)
                  </div>
                </SelectItem>
                <SelectItem value="excel" className="text-xs">
                  <div className="flex items-center gap-2">
                    <Table className="h-3 w-3" />
                    Excel 파일 (.xls)
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="bg-gray-50 p-3 rounded text-xs">
            <p className="text-gray-600">
              내보낼 파일: <span className="font-medium">{noteTitle}.{exportFormat === 'csv' ? 'csv' : 'xls'}</span>
            </p>
            <p className="text-gray-500 mt-1">
              {noteData.length}행 × {noteData[0]?.length || 0}열
            </p>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 text-xs h-7"
            >
              취소
            </Button>
            <Button
              onClick={handleExport}
              className="flex-1 text-xs h-7"
            >
              <Download className="h-3 w-3 mr-1" />
              내보내기
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExportDialog;