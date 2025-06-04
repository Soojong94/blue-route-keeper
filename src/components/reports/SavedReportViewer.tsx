// src/components/reports/SavedReportViewer.tsx (수정)
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FileText, BarChart3, Receipt, Edit, Save, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { updateReport } from '@/utils/reportStorage';
import { getTripsByDateRange } from '@/utils/storage';
import { generateDailyReport } from '@/utils/reportUtils';
import { Vehicle } from '@/types/trip';
import DailyReport from '@/components/reports/DailyReport';
import MonthlyReport from '@/components/reports/MonthlyReport';
import InvoiceReport from '@/components/reports/InvoiceReport';
import ReportDownloader from '@/components/reports/ReportDownloader';
import { MonthlyReportData, InvoiceReportData } from '@/utils/reportUtils';
import { cn } from '@/lib/utils';

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

interface SavedReport {
  id: string;
  title: string;
  type: 'daily' | 'monthly' | 'invoice'; // 'invoice' 타입 추가
  settings: any;
  data: any;
  editable_rows?: any;
  created_at: string;
  updated_at: string | null;
}

interface SavedReportViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  report: SavedReport | null;
  vehicles: Vehicle[];
  onReportUpdated?: () => void;
}

const SavedReportViewer: React.FC<SavedReportViewerProps> = ({
  open,
  onOpenChange,
  report,
  vehicles,
  onReportUpdated
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [editedData, setEditedData] = useState<any>(null);
  const [editedSettings, setEditedSettings] = useState<any>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const { toast } = useToast();

  const convertStringToDate = (dateStr: string | Date): Date => {
    if (dateStr instanceof Date && !isNaN(dateStr.getTime())) return dateStr;
    if (typeof dateStr === 'string') {
      const parsed = new Date(dateStr);
      if (!isNaN(parsed.getTime())) return parsed;
    }
    return new Date();
  };

  const convertSettings = (settings: any): ReportSettings => {
    return {
      title: settings.title || '',
      startDate: convertStringToDate(settings.startDate),
      endDate: convertStringToDate(settings.endDate),
      vehicleId: settings.vehicleId || 'all',
      additionalText: settings.additionalText || '',
      driverName: settings.driverName || '',
      contact: settings.contact || '',
      departureFilter: settings.departureFilter || '',
      destinationFilter: settings.destinationFilter || ''
    };
  };

  useEffect(() => {
    if (open && report) {
      setIsEditing(false);
      setEditedData(null);
      setEditedSettings(null);
      setHasUnsavedChanges(false);
      setSaving(false);
      setRegenerating(false);
    }
  }, [open, report?.id]);

  useEffect(() => {
    if (!open) {
      setIsEditing(false);
      setEditedData(null);
      setEditedSettings(null);
      setHasUnsavedChanges(false);
      setSaving(false);
      setRegenerating(false);
    }
  }, [open]);

  useEffect(() => {
    if (report && isEditing && !editedData) {
      let safeData;

      // 🔥 타입별로 안전한 데이터 생성
      if (report.type === 'invoice') {
        safeData = report.data || {
          title: report.title || '',
          siteInfo: {
            siteName: '',
            registrationNumber: '',
            companyName: '',
            ownerName: '',
            address: '',
            businessType: '',
            businessCategory: ''
          },
          rows: [],
          totalCount: 0,
          totalAmount: 0
        };
      } else {
        safeData = report.data ? JSON.parse(JSON.stringify(report.data)) : {
          period: report.title || '',
          rows: [],
          totalAmount: 0
        };
      }

      setEditedData(safeData);

      // 일간보고서인 경우에만 설정 변환
      if (report.type === 'daily') {
        setEditedSettings(convertSettings(report.settings));
      }

      setHasUnsavedChanges(false);
    }
  }, [report, isEditing]);

  if (!report) {
    return null;
  }

  const handleStartEdit = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    if (hasUnsavedChanges) {
      if (confirm('저장하지 않은 변경사항이 있습니다. 정말로 취소하시겠습니까?')) {
        setIsEditing(false);
        setEditedData(null);
        setEditedSettings(null);
        setHasUnsavedChanges(false);
      }
    } else {
      setIsEditing(false);
      setEditedData(null);
      setEditedSettings(null);
      setHasUnsavedChanges(false);
    }
  };

  const handleCloseModal = (shouldClose: boolean) => {
    if (isEditing && hasUnsavedChanges) {
      if (confirm('저장하지 않은 변경사항이 있습니다. 정말로 닫으시겠습니까?')) {
        setIsEditing(false);
        setEditedData(null);
        setEditedSettings(null);
        setHasUnsavedChanges(false);
        onOpenChange(shouldClose);
      }
    } else {
      onOpenChange(shouldClose);
    }
  };

  const handleDailySettingsChange = (newSettings: ReportSettings) => {
    setEditedSettings(newSettings);
    setHasUnsavedChanges(true);
  };

  const handleRegenerateDaily = async () => {
    if (!editedSettings) return;

    setRegenerating(true);
    try {
      const trips = await getTripsByDateRange(
        editedSettings.startDate,
        editedSettings.endDate
      );

      const filters = {
        departureFilter: editedSettings.departureFilter,
        destinationFilter: editedSettings.destinationFilter
      };

      const newReportData = generateDailyReport(
        trips,
        vehicles,
        editedSettings.startDate,
        editedSettings.endDate,
        editedSettings.vehicleId,
        filters
      );

      setEditedData(newReportData);
      setHasUnsavedChanges(true);

      toast({
        title: "데이터 새로고침 완료",
        description: "최신 운행 데이터로 보고서가 업데이트되었습니다.",
      });
    } catch (error) {
      console.error('Regenerate report error:', error);
      toast({
        title: "데이터 새로고침 실패",
        description: "보고서 데이터 새로고침 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setRegenerating(false);
    }
  };

  const handleMonthlyDataChange = (newData: MonthlyReportData) => {
    setEditedData(newData);

    if (editedSettings && newData.period !== editedSettings.title) {
      setEditedSettings({
        ...editedSettings,
        title: newData.period
      });
    }

    setHasUnsavedChanges(true);
  };

  // 🔥 새로운 청구서 데이터 변경 핸들러
  const handleInvoiceDataChange = (newData: InvoiceReportData) => {
    setEditedData(newData);
    setHasUnsavedChanges(true);
  };

  const handleSaveChanges = async () => {
    if (!hasUnsavedChanges) {
      toast({
        title: "변경사항 없음",
        description: "저장할 변경사항이 없습니다.",
      });
      return;
    }

    setSaving(true);
    try {
      const updateData: any = {
        data: editedData
      };

      // 타입별로 다른 저장 로직
      if (report.type === 'monthly' && editedData.period) {
        updateData.title = editedData.period;
        updateData.settings = {
          ...report.settings,
          title: editedData.period
        };
        updateData.editableRows = editedData.rows;
      } else if (report.type === 'invoice' && editedData.title) {
        updateData.title = editedData.title;
        updateData.settings = {
          ...report.settings,
          title: editedData.title
        };
        updateData.editableRows = editedData.rows;
      } else if (editedSettings) {
        updateData.settings = {
          ...editedSettings,
          startDate: editedSettings.startDate.toISOString(),
          endDate: editedSettings.endDate.toISOString()
        };
      }

      await updateReport(report.id, updateData);

      toast({
        title: "저장 완료",
        description: "보고서가 성공적으로 수정되었습니다.",
      });

      setIsEditing(false);
      setEditedData(null);
      setEditedSettings(null);
      setHasUnsavedChanges(false);

      if (onReportUpdated) {
        onReportUpdated();
      }
    } catch (error) {
      console.error('Update report error:', error);
      toast({
        title: "저장 실패",
        description: "보고서 수정 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const displayData = isEditing ? editedData : report.data;
  const displaySettings = isEditing ? editedSettings : (report.type === 'daily' ? convertSettings(report.settings) : null);
  const reportElementId = `report-content-${report.id}`;

  // 타입별 안전한 데이터 처리
  const getSafeDisplayData = () => {
    if (report.type === 'invoice') {
      return displayData || {
        title: report.title || '',
        siteInfo: {
          siteName: '',
          registrationNumber: '',
          companyName: '',
          ownerName: '',
          address: '',
          businessType: '',
          businessCategory: ''
        },
        rows: [],
        totalCount: 0,
        totalAmount: 0
      };
    } else {
      return displayData || {
        period: report.title || '',
        rows: [],
        totalAmount: 0
      };
    }
  };

  const safeDisplayData = getSafeDisplayData();

  // 🔥 타입별 아이콘 표시
  const getReportIcon = () => {
    switch (report.type) {
      case 'daily':
        return <FileText className="h-5 w-5" />;
      case 'monthly':
        return <BarChart3 className="h-5 w-5" />;
      case 'invoice':
        return <Receipt className="h-5 w-5" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };

  // 🔥 타입별 설명 표시
  const getReportDescription = () => {
    switch (report.type) {
      case 'daily':
        return isEditing
          ? "운행보고서를 편집하고 있습니다. 설정을 변경하고 데이터를 새로고침할 수 있습니다."
          : "저장된 운행보고서를 확인하고 필요시 편집하거나 다운로드할 수 있습니다.";
      case 'monthly':
        return isEditing
          ? "월간보고서를 편집하고 있습니다. 표를 직접 편집할 수 있습니다."
          : "저장된 월간보고서를 확인하고 필요시 편집하거나 다운로드할 수 있습니다.";
      case 'invoice':
        return isEditing
          ? "청구서를 편집하고 있습니다. 현장 정보와 청구 항목을 수정할 수 있습니다."
          : "저장된 청구서를 확인하고 필요시 편집하거나 다운로드할 수 있습니다.";
      default:
        return "저장된 보고서를 확인하고 필요시 편집하거나 다운로드할 수 있습니다.";
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleCloseModal}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
        <DialogHeader className="no-print">
          <DialogTitle className="flex items-center gap-2">
            {getReportIcon()}
            {isEditing ? (displaySettings?.title || report.title) : report.title}
            {isEditing && (
              <span className="text-sm font-normal text-orange-600 ml-2">
                (편집 중{hasUnsavedChanges ? ' - 저장되지 않음' : ''})
              </span>
            )}
          </DialogTitle>

          <DialogDescription className="text-sm text-gray-600">
            {getReportDescription()}
          </DialogDescription>

          <div className="flex gap-2 pt-2">
            {!isEditing ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleStartEdit}
                  className="no-print"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  편집
                </Button>
                <ReportDownloader
                  targetElementId={reportElementId}
                  filename={report.title}
                  showText={true}
                />
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancelEdit}
                  disabled={saving || regenerating}
                  className="no-print"
                >
                  <X className="h-4 w-4 mr-2" />
                  취소
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveChanges}
                  disabled={saving || !hasUnsavedChanges || regenerating}
                  className={cn(
                    "no-print",
                    hasUnsavedChanges ? "bg-orange-600 hover:bg-orange-700" : "bg-gray-400"
                  )}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? '저장 중...' : hasUnsavedChanges ? '저장' : '변경사항 없음'}
                </Button>
              </>
            )}
          </div>

          {isEditing && (
            <div className="bg-orange-50 p-3 rounded mt-2">
              <p className="text-sm text-orange-700">
                💡 <strong>편집 모드:</strong>
                {report.type === 'daily' && ' 설정을 변경하고 "데이터 새로고침" 버튼을 누르면 최신 데이터로 보고서가 업데이트됩니다.'}
                {report.type === 'monthly' && ' 표를 직접 편집할 수 있습니다.'}
                {report.type === 'invoice' && ' 현장 정보와 청구 항목을 직접 편집할 수 있습니다.'}
                {hasUnsavedChanges && (
                  <span className="font-bold text-orange-800"> 현재 저장되지 않은 변경사항이 있습니다!</span>
                )}
              </p>
            </div>
          )}
        </DialogHeader>

        <div className="py-4">
          <div className="report-container" id={reportElementId}>
            {report.type === 'daily' ? (
              <DailyReport
                data={safeDisplayData}
                vehicles={vehicles}
                viewMode={isEditing ? "edit" : "view"}
                initialSettings={displaySettings}
                onSettingsChange={isEditing ? handleDailySettingsChange : undefined}
                onRegenerate={isEditing ? handleRegenerateDaily : undefined}
              />
            ) : report.type === 'monthly' ? (
              <MonthlyReport
                data={safeDisplayData}
                viewMode={isEditing ? "edit" : "view"}
                onDataChange={isEditing ? handleMonthlyDataChange : undefined}
              />
            ) : report.type === 'invoice' ? (
              // 🔥 새로운 청구서 렌더링
              <InvoiceReport
                data={safeDisplayData}
                viewMode={isEditing ? "edit" : "view"}
                onDataChange={isEditing ? handleInvoiceDataChange : undefined}
              />
            ) : (
              <div className="text-center py-8 text-gray-500">
                지원하지 않는 보고서 타입입니다.
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SavedReportViewer;