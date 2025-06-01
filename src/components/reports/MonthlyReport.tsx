// src/components/reports/MonthlyReport.tsx 수정
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
  const [reportData, setReportData] = useState<MonthlyReportData>(data);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editingTitle, setEditingTitle] = useState(data.period);

  // 🔥 props 변경 시 즉시 동기화
  useEffect(() => {
    setReportData(data);
    setEditingTitle(data.period);
  }, [data]);

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

  // 🔥 제목 편집 관련 함수들 추가
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
    setEditingTitle(reportData.period);
    setIsEditingTitle(false);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTitleSave();
    } else if (e.key === 'Escape') {
      handleTitleCancel();
    }
  };

  return (
    <div className="space-y-4 p-4 bg-white report-container mx-auto" style={{ maxWidth: '210mm' }}>
      {/* 헤더 - showTitle이 true일 때만 표시 */}
      {showTitle && (
        <div className="text-center border-b pb-4">
          {/* 🔥 제목 편집 기능 추가 */}
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
                  <h2 className="text-xl font-bold text-gray-900">{reportData.period}</h2>
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
            <h2 className="text-xl font-bold text-gray-900">{reportData.period}</h2>
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
          rows={reportData.rows}
          onRowsChange={handleRowsChange}
          readonly={viewMode === 'view'}
        />
      </div>

      {/* 총액 표시 */}
      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="text-center">
          <div className="text-sm text-blue-600 mb-1">총 금액</div>
          <div className="text-2xl font-bold text-blue-800">
            {reportData.totalAmount.toLocaleString()}원
          </div>
          <div className="text-sm text-blue-600 mt-1">
            ({reportData.rows.filter(row => row.totalAmount > 0).length}개 항목)
          </div>
        </div>
      </div>
    </div>
  );
};

export default MonthlyReport;