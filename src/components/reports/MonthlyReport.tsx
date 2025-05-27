import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MapPin, Calculator, Edit2, Check, X } from 'lucide-react';
import { MonthlyReportData } from '@/utils/reportUtils';

interface MonthlyReportProps {
  data: MonthlyReportData;
}

const MonthlyReport: React.FC<MonthlyReportProps> = ({ data }) => {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [customPrices, setCustomPrices] = useState<{ [key: number]: string }>({});

  if (!data.departureStats.length) {
    return (
      <div className="text-center py-8 text-gray-500">
        선택한 기간에 운행 기록이 없습니다.
      </div>
    );
  }

  const handleEditStart = (index: number, currentAmount: number, currentCount: number) => {
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

  const totalOriginalAmount = data.departureStats.reduce((sum, stat) => sum + stat.totalAmount, 0);
  const totalCalculatedAmount = data.departureStats.reduce((sum, stat, index) => 
    sum + getCalculatedAmount(index, stat.totalAmount, stat.totalCount), 0
  );
  const totalCount = data.departureStats.reduce((sum, stat) => sum + stat.totalCount, 0);

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">{data.period} 월간 운행 보고서</h2>
        <div className="flex justify-center gap-4">
          <Badge className="bg-blue-100 text-blue-800 px-4 py-2">
            총 {totalCount}회 운행
          </Badge>
          <Badge className="bg-green-100 text-green-800 px-4 py-2">
            총 {totalCalculatedAmount.toLocaleString()}원
          </Badge>
        </div>
      </div>

      {/* 테이블 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            출발지별 운행 통계
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>출발지</TableHead>
                  <TableHead className="text-center">운행 횟수</TableHead>
                  <TableHead className="text-right">개당 단가</TableHead>
                  <TableHead className="text-right">총액</TableHead>
                  <TableHead className="text-center">수정</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.departureStats.map((stat, index) => {
                  const isEditing = editingIndex === index;
                  const calculatedAmount = getCalculatedAmount(index, stat.totalAmount, stat.totalCount);
                  const unitPrice = calculatedAmount / stat.totalCount;

                  return (
                    <TableRow key={stat.departure} className="hover:bg-gray-50">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-blue-600" />
                          <span className="font-medium">{stat.departure}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className="bg-purple-100 text-purple-800">
                          {stat.totalCount}회
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {isEditing ? (
                          <div className="flex items-center gap-2 justify-end">
                            <Input
                              type="number"
                              value={customPrices[index] || ''}
                              onChange={(e) => setCustomPrices({
                                ...customPrices,
                                [index]: e.target.value
                              })}
                              className="w-24 text-right"
                              min="0"
                            />
                            <span className="text-sm text-gray-500">원</span>
                          </div>
                        ) : (
                          <span className="font-medium">
                            {Math.round(unitPrice).toLocaleString()}원
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={`font-semibold ${
                          calculatedAmount !== stat.totalAmount ? 'text-blue-600' : 'text-gray-900'
                        }`}>
                          {calculatedAmount.toLocaleString()}원
                        </span>
                        {calculatedAmount !== stat.totalAmount && (
                          <div className="text-xs text-gray-500 line-through">
                            {stat.totalAmount.toLocaleString()}원
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {isEditing ? (
                          <div className="flex gap-1 justify-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditSave(index)}
                              className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditCancel(index)}
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditStart(index, stat.totalAmount, stat.totalCount)}
                            className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* 총계 */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-sm text-gray-600">총 운행 횟수</div>
                <div className="text-xl font-bold text-blue-600">{totalCount}회</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-600">평균 단가</div>
                <div className="text-xl font-bold text-green-600">
                  {Math.round(totalCalculatedAmount / totalCount).toLocaleString()}원
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-600">총 금액</div>
                <div className="text-xl font-bold text-purple-600">
                  {totalCalculatedAmount.toLocaleString()}원
                </div>
                {totalCalculatedAmount !== totalOriginalAmount && (
                  <div className="text-sm text-gray-500 line-through">
                    원래: {totalOriginalAmount.toLocaleString()}원
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MonthlyReport;