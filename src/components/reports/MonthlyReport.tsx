// src/components/reports/MonthlyReport.tsx
import React, { useState, useEffect } from 'react';
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

  useEffect(() => {
    setReportData(data);
  }, [data]);

  const handleRowsChange = (newRows: MonthlyReportRow[]) => {
    const totalAmount = newRows.reduce((sum, row) => sum + row.totalAmount, 0);

    const newReportData: MonthlyReportData = {
      ...reportData,
      rows: newRows,
      totalAmount
    };

    setReportData(newReportData);

    if (onDataChange) {
      onDataChange(newReportData);
    }
  };

  return (
    <div className="space-y-4 p-4 bg-white report-container">
      {/* 헤더 - showTitle이 true일 때만 표시 */}
      {showTitle && (
        <div className="text-center border-b pb-4">
          <h2 className="text-xl font-bold text-gray-900">{reportData.period}</h2>
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