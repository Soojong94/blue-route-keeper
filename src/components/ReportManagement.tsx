// src/components/ReportManagement.tsx (수정)
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getTripsByDateRange, getVehicles } from '@/utils/storage';
import { generateDailyReport, generateMonthlyReport, MonthlyReportData, InvoiceReportData } from '@/utils/reportUtils';
import { saveReport, getReports, updateReport, deleteReport, SavedReport } from '@/utils/reportStorage';
import { Vehicle } from '@/types/trip';
import ReportTypeSelector from '@/components/reports/ReportTypeSelector';
import DailyReportSettings from '@/components/reports/DailyReportSettings';
import MonthlyReportSettings from '@/components/reports/MonthlyReportSettings';
import InvoiceReportSettings from '@/components/reports/InvoiceReportSettings';
import ReportList from '@/components/reports/ReportList';
import SavedReportViewer from '@/components/reports/SavedReportViewer';

interface ReportSettings {
  title: string;
  startDate: Date;
  endDate: Date;
  vehicleId: string;
  additionalText: string;
  driverName: string;
  contact: string;
  departureFilter?: string;
  destinationFilter?: string;
}

const ReportManagement: React.FC = () => {
  const [reports, setReports] = useState<SavedReport[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedReportType, setSelectedReportType] = useState<'daily' | 'monthly' | 'invoice' | null>(null);
  const [viewingReport, setViewingReport] = useState<SavedReport | null>(null);

  // 다이얼로그 상태
  const [isTypeSelectorOpen, setIsTypeSelectorOpen] = useState(false);
  const [isDailySettingsOpen, setIsDailySettingsOpen] = useState(false);
  const [isMonthlySettingsOpen, setIsMonthlySettingsOpen] = useState(false);
  const [isInvoiceSettingsOpen, setIsInvoiceSettingsOpen] = useState(false); // 새로 추가
  const [isReportViewerOpen, setIsReportViewerOpen] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    loadReports();
    loadVehicles();
  }, []);

  const loadReports = async () => {
    try {
      setLoading(true);
      const reportsData = await getReports();
      setReports(reportsData);
    } catch (error) {
      console.error('Error loading reports:', error);
      toast({
        title: "로드 실패",
        description: "보고서 목록을 불러오는 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadVehicles = async () => {
    try {
      const vehiclesData = await getVehicles();
      setVehicles(vehiclesData);
    } catch (error) {
      console.error('Error loading vehicles:', error);
    }
  };

  const handleCreateNew = () => {
    setIsTypeSelectorOpen(true);
  };

  const handleSelectType = (type: 'daily' | 'monthly' | 'invoice') => {
    setSelectedReportType(type);
    if (type === 'daily') {
      setIsDailySettingsOpen(true);
    } else if (type === 'monthly') {
      setIsMonthlySettingsOpen(true);
    } else if (type === 'invoice') {
      setIsInvoiceSettingsOpen(true);
    }
  };

  const handleGenerateDailyReport = async (settings: ReportSettings) => {
    try {
      setLoading(true);

      const [trips, vehicles] = await Promise.all([
        getTripsByDateRange(settings.startDate, settings.endDate),
        getVehicles()
      ]);

      const filters = {
        departureFilter: settings.departureFilter,
        destinationFilter: settings.destinationFilter
      };

      const reportData = generateDailyReport(
        trips,
        vehicles,
        settings.startDate,
        settings.endDate,
        settings.vehicleId,
        filters
      );

      await saveReport({
        title: settings.title,
        type: 'daily',
        settings: {
          title: settings.title,
          startDate: settings.startDate.toISOString(),
          endDate: settings.endDate.toISOString(),
          vehicleId: settings.vehicleId,
          additionalText: settings.additionalText,
          driverName: settings.driverName,
          contact: settings.contact,
          departureFilter: settings.departureFilter,
          destinationFilter: settings.destinationFilter
        },
        data: reportData
      });

      toast({
        title: "보고서 생성 완료",
        description: `"${settings.title}" 보고서가 생성되어 저장되었습니다.`,
      });

      await loadReports();
    } catch (error) {
      console.error('Generate daily report error:', error);
      toast({
        title: "보고서 생성 실패",
        description: "운행 보고서 생성 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateMonthlyReport = async (settings: {
    title: string;
    reportData: MonthlyReportData;
  }) => {
    try {
      setLoading(true);

      await saveReport({
        title: settings.title,
        type: 'monthly',
        settings: {
          title: settings.title
        },
        data: settings.reportData,
        editableRows: settings.reportData.rows
      });

      toast({
        title: "보고서 생성 완료",
        description: `"${settings.title}" 보고서가 생성되어 저장되었습니다.`,
      });

      await loadReports();
    } catch (error) {
      console.error('Generate monthly report error:', error);
      toast({
        title: "보고서 생성 실패",
        description: "월간 보고서 생성 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // 🔥 새로운 청구서 생성 핸들러
  const handleGenerateInvoiceReport = async (settings: {
    title: string;
    reportData: InvoiceReportData;
  }) => {
    try {
      setLoading(true);

      await saveReport({
        title: settings.title,
        type: 'invoice' as any, // 새로운 타입이므로 임시로 as any 사용
        settings: {
          title: settings.title
        },
        data: settings.reportData,
        editableRows: settings.reportData.rows
      });

      toast({
        title: "청구서 생성 완료",
        description: `"${settings.title}" 청구서가 생성되어 저장되었습니다.`,
      });

      await loadReports();
    } catch (error) {
      console.error('Generate invoice report error:', error);
      toast({
        title: "청구서 생성 실패",
        description: "청구서 생성 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewReport = (report: SavedReport) => {
    setViewingReport(report);
    setIsReportViewerOpen(true);
  };

  const handleEditReport = (report: SavedReport) => {
    setViewingReport(report);
    setIsReportViewerOpen(true);
  };

  const handleReportUpdated = async () => {
    await loadReports();

    if (viewingReport) {
      try {
        const updatedReports = await getReports();
        const updatedReport = updatedReports.find(r => r.id === viewingReport.id);
        if (updatedReport) {
          setViewingReport(updatedReport);
        }
      } catch (error) {
        console.error('Error updating viewing report:', error);
      }
    }
  };

  const handleDeleteReport = async (id: string) => {
    try {
      await deleteReport(id);
      toast({
        title: "삭제 완료",
        description: "보고서가 삭제되었습니다.",
      });
      await loadReports();
    } catch (error) {
      console.error('Delete report error:', error);
      toast({
        title: "삭제 실패",
        description: "보고서 삭제 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto">
      <Card>
        <CardHeader className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardTitle className="flex items-center gap-2 text-sm">
            <FileText className="h-4 w-4" />
            보고서 관리
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="flex justify-between items-center mb-4">
            <div className="text-xs text-gray-600">
              총 {reports.length}개의 보고서가 저장되어 있습니다.
            </div>
            <Button
              onClick={handleCreateNew}
              className="text-xs h-7 px-3"
              disabled={loading}
            >
              <Plus className="mr-1 h-3 w-3" />
              새 보고서 작성
            </Button>
          </div>

          <ReportList
            reports={reports}
            onView={handleViewReport}
            onEdit={handleEditReport}
            onDelete={handleDeleteReport}
            loading={loading}
            vehicles={vehicles}
          />
        </CardContent>
      </Card>

      {/* 다이얼로그들 */}
      <ReportTypeSelector
        open={isTypeSelectorOpen}
        onOpenChange={setIsTypeSelectorOpen}
        onSelectType={handleSelectType}
      />

      <DailyReportSettings
        open={isDailySettingsOpen}
        onOpenChange={setIsDailySettingsOpen}
        onGenerate={handleGenerateDailyReport}
      />

      <MonthlyReportSettings
        open={isMonthlySettingsOpen}
        onOpenChange={setIsMonthlySettingsOpen}
        onGenerate={handleGenerateMonthlyReport}
      />

      {/* 🔥 새로운 청구서 설정 다이얼로그 */}
      <InvoiceReportSettings
        open={isInvoiceSettingsOpen}
        onOpenChange={setIsInvoiceSettingsOpen}
        onGenerate={handleGenerateInvoiceReport}
      />

      <SavedReportViewer
        open={isReportViewerOpen}
        onOpenChange={setIsReportViewerOpen}
        report={viewingReport}
        vehicles={vehicles}
        onReportUpdated={handleReportUpdated}
      />
    </div>
  );
};

export default ReportManagement;