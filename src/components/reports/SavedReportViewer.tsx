// src/components/reports/SavedReportViewer.tsx (수정된 부분)
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FileText, BarChart3, Edit, Save, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { updateReport } from '@/utils/reportStorage';
import { getTripsByDateRange } from '@/utils/storage';
import { generateDailyReport } from '@/utils/reportUtils';
import { Vehicle } from '@/types/trip';
import DailyReport from '@/components/reports/DailyReport';
import MonthlyReport from '@/components/reports/MonthlyReport';
import ReportDownloader from '@/components/reports/ReportDownloader';
import { MonthlyReportData } from '@/utils/reportUtils';
import { cn } from '@/lib/utils';

interface ReportSettings {
  title: string;
  startDate: Date;
  endDate: Date;
  vehicleId: string;
  additionalText: string;
  driverName: string;
  contact: string;
  // 🔥 새로 추가된 필터링 옵션
  departureFilter?: string;
  destinationFilter?: string;
}

interface SavedReport {
  id: string;
  title: string;
  type: 'daily' | 'monthly';
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

  // 🔥 날짜 변환 헬퍼 함수 추가
  const convertStringToDate = (dateStr: string | Date): Date => {
    if (dateStr instanceof Date && !isNaN(dateStr.getTime())) return dateStr;
    if (typeof dateStr === 'string') {
      const parsed = new Date(dateStr);
      if (!isNaN(parsed.getTime())) return parsed;
    }
    return new Date(); // 기본값
  };

  // 🔥 설정 변환 함수 추가
  const convertSettings = (settings: any): ReportSettings => {
    return {
      title: settings.title || '',
      startDate: convertStringToDate(settings.startDate),
      endDate: convertStringToDate(settings.endDate),
      vehicleId: settings.vehicleId || 'all',
      additionalText: settings.additionalText || '',
      driverName: settings.driverName || '',
      contact: settings.contact || '',
      // 🔥 필터링 옵션 추가
      departureFilter: settings.departureFilter || '',
      destinationFilter: settings.destinationFilter || ''
    };
  };

  // 데이터 초기화
  useEffect(() => {
    if (report && isEditing) {
      setEditedData(JSON.parse(JSON.stringify(report.data)));
      // 🔥 설정도 날짜 변환하여 설정
      setEditedSettings(convertSettings(report.settings));
      setHasUnsavedChanges(false);
    }
  }, [report, isEditing]);

  if (!report) {
    return null;
  }

  // 편집 모드 진입
  const handleStartEdit = () => {
    setIsEditing(true);
    setEditedData(JSON.parse(JSON.stringify(report.data)));
    // 🔥 설정도 날짜 변환하여 설정
    setEditedSettings(convertSettings(report.settings));
    setHasUnsavedChanges(false);
  };

  // 편집 취소
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

  // 🔥 일간 보고서 설정 변경 처리 수정
  const handleDailySettingsChange = (newSettings: ReportSettings) => {
    // 이미 Date 객체로 변환된 상태이므로 그대로 저장
    setEditedSettings(newSettings);
    setHasUnsavedChanges(true);
  };

  // 🔥 일간 보고서 데이터 재생성 (필터링 포함)
  const handleRegenerateDaily = async () => {
    if (!editedSettings) return;

    setRegenerating(true);
    try {
      const trips = await getTripsByDateRange(
        editedSettings.startDate,
        editedSettings.endDate
      );

      // 🔥 필터링 옵션 전달
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

  // 월간 보고서 데이터 변경 처리
  const handleMonthlyDataChange = (newData: MonthlyReportData) => {
    setEditedData(newData);
    setHasUnsavedChanges(true);
  };

  // 변경사항 저장
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

      // 설정도 변경된 경우 - 날짜를 문자열로 변환하여 저장
      if (editedSettings) {
        updateData.settings = {
          ...editedSettings,
          startDate: editedSettings.startDate.toISOString(),
          endDate: editedSettings.endDate.toISOString()
        };
      }

      // 월간 보고서의 경우 편집 가능한 행도 저장
      if (report.type === 'monthly') {
        updateData.editableRows = editedData.rows;
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

      // 🔥 실시간 반영을 위해 부모 컴포넌트에 즉시 알림
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

  // 현재 표시할 데이터와 설정 결정
  const displayData = isEditing ? editedData : report.data;
  const displaySettings = isEditing ? editedSettings : convertSettings(report.settings);

  // 🔥 다운로드용 고유 ID 생성
  const reportElementId = `report-content-${report.id}`;

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
            {isEditing ? (displaySettings?.title || report.title) : report.title}
            {isEditing && (
              <span className="text-sm font-normal text-orange-600 ml-2">
                (편집 중{hasUnsavedChanges ? ' - 저장되지 않음' : ''})
              </span>
            )}
          </DialogTitle>

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
                {/* 🔥 다운로드 컴포넌트로 교체 */}
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

          {/* 편집 모드 안내 */}
          {isEditing && (
            <div className="bg-orange-50 p-3 rounded mt-2">
              <p className="text-sm text-orange-700">
                💡 <strong>편집 모드:</strong>
                {report.type === 'daily' ?
                  ' 설정을 변경하고 "데이터 새로고침" 버튼을 누르면 최신 데이터로 보고서가 업데이트됩니다.' :
                  ' 표를 직접 편집할 수 있습니다.'
                }
                {hasUnsavedChanges && (
                  <span className="font-bold text-orange-800"> 현재 저장되지 않은 변경사항이 있습니다!</span>
                )}
              </p>
            </div>
          )}
        </DialogHeader>

        {/* 🔥 보고서 내용 - 다운로드용 ID 추가 */}
        <div className="py-4">
          <div className="report-container" id={reportElementId}>
            {report.type === 'daily' ? (
              <DailyReport
                data={displayData}
                vehicles={vehicles}
                viewMode={isEditing ? "edit" : "view"}
                initialSettings={displaySettings}
                onSettingsChange={isEditing ? handleDailySettingsChange : undefined}
                onRegenerate={isEditing ? handleRegenerateDaily : undefined}
              />
            ) : (
              <MonthlyReport
                data={displayData}
                viewMode={isEditing ? "edit" : "view"}
                onDataChange={isEditing ? handleMonthlyDataChange : undefined}
              />
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SavedReportViewer;