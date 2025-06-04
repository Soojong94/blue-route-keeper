// src/components/reports/MonthlyReport.tsx - 완전히 수정된 버전
import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Edit, Check, X } from 'lucide-react';
import { MonthlyReportData, MonthlyReportRow } from '@/utils/reportUtils';
import MonthlyReportGrid from './MonthlyReportGrid';

interface MonthlyReportProps {
  data: MonthlyReportData;
  viewMode?: 'edit' | 'view';
  onDataChange?: (newData: MonthlyReportData) => void;
  showTitle?: boolean;
}

const MonthlyReport: React.FC<MonthlyReportProps> = ({
  data,
  viewMode = 'edit',
  onDataChange,
  showTitle = true
}) => {
  // 🔥 안전한 초기화 - data가 null일 경우 기본값 제공
  const safeData = data || {
    period: '',
    rows: [],
    totalAmount: 0
  };

  const [reportData, setReportData] = useState<MonthlyReportData>(safeData);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editingTitle, setEditingTitle] = useState(safeData.period || '');

  // 🔥 props 변경 시 즉시 동기화 - null 체크 추가
  useEffect(() => {
    if (data) {
      setReportData(data);
      setEditingTitle(data.period || '');
    }
  }, [data]);

  // 🔥 data가 없으면 로딩 상태 표시
  if (!data) {
    return (
      <div className="space-y-4 p-4 bg-white report-container mx-auto" style={{ maxWidth: '210mm' }}>
        <div className="text-center py-8 text-gray-500">
          보고서 데이터를 불러오는 중입니다...
        </div>
      </div>
    );
  }

  const handleRowsChange = (newRows: MonthlyReportRow[]) => {
    const totalAmount = newRows.reduce((sum, row) => sum + row.totalAmount, 0);

    const newReportData: MonthlyReportData = {
      ...reportData,
      rows: newRows,
      totalAmount
    };

    // 🔥 즉시 로컬 상태 업데이트
    setReportData(newReportData);

    // 🔥 즉시 상위 컴포넌트에 알림
    if (onDataChange) {
      onDataChange(newReportData);
    }
  };

  // 🔥 제목 편집 관련 함수들
  const handleTitleEdit = () => {
    setIsEditingTitle(true);
  };

  const handleTitleSave = () => {
    const newReportData: MonthlyReportData = {
      ...reportData,
      period: editingTitle
    };

    setReportData(newReportData);
    setIsEditingTitle(false);

    if (onDataChange) {
      onDataChange(newReportData);
    }
  };

  const handleTitleCancel = () => {
    setEditingTitle(reportData.period || '');
    setIsEditingTitle(false);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTitleSave();
    } else if (e.key === 'Escape') {
      handleTitleCancel();
    }
  };

  // 🔥 총 횟수 계산 함수 - 안전한 계산
  const getTotalCount = () => {
    return reportData.rows?.reduce((sum, row) => sum + (row.count || 0), 0) || 0;
  };

  return (
    <div className="space-y-4 p-4 bg-white report-container mx-auto" style={{ maxWidth: '210mm' }}>
      {/* 헤더 - showTitle이 true일 때만 표시 */}
      {showTitle && (
        <div className="text-center border-b pb-4">
          {/* 🔥 제목 편집 기능 */}
          {viewMode === 'edit' ? (
            <div className="flex items-center justify-center gap-2">
              {isEditingTitle ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={editingTitle}
                    onChange={(e) => setEditingTitle(e.target.value)}
                    onKeyDown={handleTitleKeyDown}
                    className="text-xl font-bold text-center border-2 border-blue-300"
                    autoFocus
                  />
                  <Button
                    size="sm"
                    onClick={handleTitleSave}
                    className="h-8 w-8 p-0"
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleTitleCancel}
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <h2 className="text-xl font-bold text-gray-900">{reportData.period || '제목 없음'}</h2>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleTitleEdit}
                    className="h-8 w-8 p-0 text-blue-600 hover:text-blue-800"
                    title="제목 편집"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <h2 className="text-xl font-bold text-gray-900">{reportData.period || '제목 없음'}</h2>
          )}
        </div>
      )}

      {/* 편집 모드 안내 */}
      {viewMode === 'edit' && (
        <div className="bg-blue-50 p-3 rounded mb-4">
          <p className="text-sm text-blue-700">
            💡 <strong>편집 모드:</strong> 제목 옆 편집 버튼을 클릭하여 제목을 수정할 수 있고, 아래 표를 직접 클릭하여 데이터를 수정할 수 있습니다. 행 추가/삭제도 가능합니다.
          </p>
        </div>
      )}

      {/* 편집 가능한 그리드 */}
      <div className="space-y-3">
        <MonthlyReportGrid
          rows={reportData.rows || []}
          onRowsChange={handleRowsChange}
          readonly={viewMode === 'view'}
        />
      </div>

      {/* 🔥 합계 행 - 테이블과 동일한 레이아웃으로 */}
      <div className="border rounded-lg">
        <table className="w-full border-collapse text-xs" style={{ tableLayout: 'fixed' }}>
          <tbody>
            <tr className="bg-blue-50">
              <td className="border px-2 py-2 text-center font-bold text-blue-800" style={{ width: '20%' }}>
                합계
              </td>
              <td className="border px-2 py-2 text-center font-bold text-blue-800" style={{ width: '35%' }}>
                -
              </td>
              <td className="border px-2 py-2 text-center font-bold text-blue-800" style={{ width: '6%' }}>
                {getTotalCount()}
              </td>
              <td className="border px-2 py-2 text-center font-bold text-blue-800" style={{ width: '19.5%' }}>
                -
              </td>
              <td className="border px-2 py-2 text-right font-bold text-blue-800" style={{ width: '19.5%' }}>
                {(reportData.totalAmount || 0).toLocaleString()}원
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MonthlyReport;