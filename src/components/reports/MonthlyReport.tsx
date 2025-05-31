// src/components/reports/MonthlyReport.tsx - 완전히 새로운 버전
import React, { useState, useEffect } from 'react';
import { MonthlyReportData, MonthlyReportRow } from '@/utils/reportUtils';
import MonthlyReportGrid from './MonthlyReportGrid';

interface MonthlyReportProps {
  data: MonthlyReportData;
  viewMode?: 'edit' | 'view';
  onDataChange?: (newData: MonthlyReportData) => void;
}

const MonthlyReport: React.FC<MonthlyReportProps> = ({
  data,
  viewMode = 'edit',
  onDataChange
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

  if (!reportData.rows || reportData.rows.length === 0) {
    return (
      <div className="space-y-4 p-4 bg-white report-container">
        <div className="text-center border-b pb-4">
          <h2 className="text-xl font-bold text-gray-900">{reportData.period} 월간 운행 보고서</h2>
        </div>
        <div className="text-center py-8 text-gray-500">
          선택한 기간에 운행 기록이 없습니다.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 bg-white report-container">
      {/* 헤더 */}
      <div className="text-center border-b pb-4">
        <h2 className="text-xl font-bold text-gray-900">{reportData.period} 월간 운행 보고서</h2>

        {/* 총액 표시 */}
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="text-sm text-blue-600 mb-1">총 금액</div>
          <div className="text-3xl font-bold text-blue-800">
            {reportData.totalAmount.toLocaleString()}원
          </div>
          <div className="text-sm text-blue-600 mt-1">
            ({reportData.rows.filter(row => row.totalAmount > 0).length}개 항목)
          </div>
        </div>
      </div>

      {/* 편집 가능한 그리드 */}
      <div className="space-y-3">
        <MonthlyReportGrid
          rows={reportData.rows}
          onRowsChange={handleRowsChange}
          readonly={viewMode === 'view'}
        />
      </div>

      {/* 기존 데이터 참고 (편집 모드에서만) */}
      {viewMode === 'edit' && reportData.originalDepartureStats && reportData.originalDepartureStats.length > 0 && (
        <div className="mt-6 p-4 bg-gray-50 border rounded-lg">
          <h3 className="text-sm font-medium text-gray-700 mb-3">📊 기존 출발지별 통계 (참고용)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {reportData.originalDepartureStats.slice(0, 6).map((stat, index) => (
              <div key={index} className="flex justify-between items-center bg-white p-2 rounded text-xs">
                <span className="font-medium">{stat.departure}</span>
                <div className="text-right">
                  <div>{stat.totalCount}회</div>
                  <div className="text-blue-600">{stat.totalAmount.toLocaleString()}원</div>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            💡 위 데이터를 참고하여 그리드에 직접 입력하세요.
          </p>
        </div>
      )}
    </div>
  );
};

export default MonthlyReport;