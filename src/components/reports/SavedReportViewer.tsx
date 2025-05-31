import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FileText, BarChart3, Download, Printer } from 'lucide-react'; // Print → Printer
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
      const csvData = report.data.departureStats.map((stat: any) => [
        stat.departure,
        stat.totalCount,
        stat.totalAmount
      ]);

      const headers = ['출발지', '횟수', '총액'];
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
      <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-sm flex items-center gap-2">
            {report.type === 'daily' ? (
              <FileText className="h-4 w-4" />
            ) : (
              <BarChart3 className="h-4 w-4" />
            )}
            {report.title}
          </DialogTitle>
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="text-xs h-7"
            >
              <Printer className="h-3 w-3 mr-1" />
              인쇄
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              className="text-xs h-7"
            >
              <Download className="h-3 w-3 mr-1" />
              CSV 내보내기
            </Button>
          </div>
        </DialogHeader>

        <div className="py-2">
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
            />
          ) : (
            <MonthlyReport data={report.data} />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SavedReportViewer;