/* src/components/reports/MonthlyReport.tsx 수정 */
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Edit2, Check, X } from 'lucide-react';
import { MonthlyReportData } from '@/utils/reportUtils';

interface MonthlyReportProps {
  data: MonthlyReportData;
  viewMode?: 'edit' | 'view'; // 뷰 모드 추가
}

const MonthlyReport: React.FC<MonthlyReportProps> = ({
  data,
  viewMode = 'edit'
}) => {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [customPrices, setCustomPrices] = useState<{ [key: number]: string }>({});

  if (!data.departureStats.length) {
    return (
      <div className="text-center py-8 text-gray-500 report-container">
        선택한 기간에 운행 기록이 없습니다.
      </div>
    );
  }

  const handleEditStart = (index: number, currentAmount: number, currentCount: number) => {
    if (viewMode === 'view') return; // 뷰 모드에서는 편집 불가

    setEditingIndex(index);
    const currentUnitPrice = Math.round(currentAmount / currentCount);
    setCustomPrices({ ...customPrices, [index]: currentUnitPrice.toString() });
  };

  const handleEditSave = (index: number) => {
    setEditingIndex(null);
  };

  const handleEditCancel = (index: number) => {
    setEditingIndex(null);
    const newCustomPrices = { ...customPrices };
    delete newCustomPrices[index];
    setCustomPrices(newCustomPrices);
  };

  const getCalculatedAmount = (index: number, originalAmount: number, count: number) => {
    const customPrice = customPrices[index];
    if (customPrice && !isNaN(parseFloat(customPrice))) {
      return parseFloat(customPrice) * count;
    }
    return originalAmount;
  };

  const totalCalculatedAmount = data.departureStats.reduce((sum, stat, index) =>
    sum + getCalculatedAmount(index, stat.totalAmount, stat.totalCount), 0
  );
  const totalCount = data.departureStats.reduce((sum, stat) => sum + stat.totalCount, 0);

  return (
    <div className="space-y-4 p-4 bg-white report-container">
      {/* 헤더 */}
      <div className="text-center border-b pb-4">
        <h2 className="text-xl font-bold text-gray-900">{data.period} 월간 운행 보고서</h2>
        <div className="flex justify-center gap-4 mt-2 text-sm">
          <span>운행 {totalCount}회</span>
          <span>총액 {totalCalculatedAmount.toLocaleString()}원</span>
        </div>
      </div>

      {/* 출발지별 통계 테이블 */}
      <div className="overflow-hidden">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="text-left p-2 font-medium">출발지</th>
              <th className="text-center p-2 font-medium">횟수</th>
              <th className="text-right p-2 font-medium">단가</th>
              <th className="text-right p-2 font-medium">총액</th>
              {viewMode === 'edit' && (
                <th className="text-center p-2 font-medium w-16">수정</th>
              )}
            </tr>
          </thead>
          <tbody>
            {data.departureStats.map((stat, index) => {
              const isEditing = editingIndex === index;
              const calculatedAmount = getCalculatedAmount(index, stat.totalAmount, stat.totalCount);
              const unitPrice = calculatedAmount / stat.totalCount;

              return (
                <tr key={stat.departure} className="border-b hover:bg-gray-50">
                  <td className="p-2 font-medium">{stat.departure}</td>
                  <td className="text-center p-2">{stat.totalCount}회</td>
                  <td className="text-right p-2">
                    {isEditing ? (
                      <div className="flex items-center gap-1 justify-end">
                        <Input
                          type="number"
                          value={customPrices[index] || ''}
                          onChange={(e) => setCustomPrices({
                            ...customPrices,
                            [index]: e.target.value
                          })}
                          className="w-20 text-right text-xs h-7"
                          min="0"
                        />
                        <span className="text-xs">원</span>
                      </div>
                    ) : (
                      <span>{Math.round(unitPrice).toLocaleString()}원</span>
                    )}
                  </td>
                  <td className="text-right p-2 font-semibold">
                    {calculatedAmount.toLocaleString()}원
                  </td>
                  {viewMode === 'edit' && (
                    <td className="text-center p-2">
                      {isEditing ? (
                        <div className="flex gap-1 justify-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditSave(index)}
                            className="h-6 w-6 p-0 text-green-600"
                          >
                            <Check className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditCancel(index)}
                            className="h-6 w-6 p-0 text-red-600"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditStart(index, stat.totalAmount, stat.totalCount)}
                          className="h-6 w-6 p-0 text-blue-600"
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 총계 */}
      <div className="border-t pt-3">
        <div className="grid grid-cols-3 gap-4 text-center text-sm">
          <div>
            <div className="text-gray-600">총 운행</div>
            <div className="font-bold text-lg">{totalCount}회</div>
          </div>
          <div>
            <div className="text-gray-600">평균 단가</div>
            <div className="font-bold text-lg">
              {Math.round(totalCalculatedAmount / totalCount).toLocaleString()}원
            </div>
          </div>
          <div>
            <div className="text-gray-600">총 금액</div>
            <div className="font-bold text-lg text-blue-600">
              {totalCalculatedAmount.toLocaleString()}원
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MonthlyReport;