/* src/components/reports/SavedReportViewer.tsx 수정 */
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FileText, BarChart3, Download, Printer } from 'lucide-react';
import DailyReport from '@/components/reports/DailyReport';
import MonthlyReport from '@/components/reports/MonthlyReport';

interface SavedReport {
  id: string;
  title: string;
  type: 'daily' | 'monthly';
  settings: any;
  data: any;
  created_at: string;
  updated_at: string | null;
}

interface SavedReportViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  report: SavedReport | null;
}

const SavedReportViewer: React.FC<SavedReportViewerProps> = ({
  open,
  onOpenChange,
  report
}) => {
  if (!report) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    // CSV 내보내기 로직
    if (report.type === 'daily') {
      const csvData = report.data.dailyTrips.map((trip: any) => [
        `${trip.month}/${trip.day}`,
        trip.vehicleNumber,
        trip.departure,
        trip.destination,
        trip.unitPrice,
        trip.count,
        trip.dailyTotal
      ]);

      const headers = ['날짜', '차량번호', '출발지', '목적지', '단가', '횟수', '총액'];
      const csvContent = [headers, ...csvData]
        .map(row => row.join(','))
        .join('\n');

      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${report.title}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } else {
      const csvData = report.data.rows?.map((row: any) => [
        row.date,
        row.item,
        row.count,
        row.unitPrice,
        row.totalAmount
      ]) || [];

      const headers = ['날짜', '품목', '횟수', '단가', '총액'];
      const csvContent = [headers, ...csvData]
        .map(row => row.join(','))
        .join('\n');

      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${report.title}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
        {/* 다이얼로그 헤더 - 인쇄 시 숨김 */}
        <DialogHeader className="no-print">
          <DialogTitle className="flex items-center gap-2">
            {report.type === 'daily' ? (
              <FileText className="h-5 w-5" />
            ) : (
              <BarChart3 className="h-5 w-5" />
            )}
            {report.title}
          </DialogTitle>
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="no-print"
            >
              <Printer className="h-4 w-4 mr-2" />
              인쇄
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              className="no-print"
            >
              <Download className="h-4 w-4 mr-2" />
              CSV 내보내기
            </Button>
          </div>
        </DialogHeader>

        {/* 보고서 내용 - 인쇄 시 이 부분만 출력 */}
        <div className="py-4">
          <div className="report-container">
            {report.type === 'daily' ? (
              <DailyReport
                data={report.data}
                vehicles={[]}
                selectedVehicleId={report.settings.vehicleId || 'all'}
                startDate={new Date(report.settings.startDate)}
                endDate={new Date(report.settings.endDate)}
                onDateChange={() => { }}
                onVehicleChange={() => { }}
                onRefresh={() => { }}
                viewMode="view"
                savedSettings={report.settings}
              />
            ) : (
              <MonthlyReport
                data={report.data}
                viewMode="view"
              />
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SavedReportViewer;