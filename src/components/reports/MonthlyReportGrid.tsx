// src/components/reports/MonthlyReportGrid.tsx
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Minus, Trash2 } from 'lucide-react';
import { MonthlyReportRow, calculateRowTotal, createEmptyMonthlyReportRow } from '@/utils/reportUtils';

interface MonthlyReportGridProps {
  rows: MonthlyReportRow[];
  onRowsChange: (rows: MonthlyReportRow[]) => void;
  readonly?: boolean;
}

const MonthlyReportGrid: React.FC<MonthlyReportGridProps> = ({
  rows: initialRows,
  onRowsChange,
  readonly = false
}) => {
  const [rows, setRows] = useState<MonthlyReportRow[]>(initialRows);
  const [editingCell, setEditingCell] = useState<{ rowIndex: number; field: keyof MonthlyReportRow } | null>(null);
  const [editValue, setEditValue] = useState('');

  const inputRef = useRef<HTMLInputElement>(null);

  // rows 변경 시 부모에게 알림
  const notifyRowsChange = useCallback((newRows: MonthlyReportRow[]) => {
    setRows(newRows);
    onRowsChange(newRows);
  }, [onRowsChange]);

  // 초기 데이터 동기화
  useEffect(() => {
    if (JSON.stringify(initialRows) !== JSON.stringify(rows)) {
      setRows(initialRows);
    }
  }, [initialRows]);

  // 셀 업데이트
  const updateCell = useCallback((rowIndex: number, field: keyof MonthlyReportRow, value: any) => {
    const newRows = [...rows];
    const row = { ...newRows[rowIndex] };

    if (field === 'count' || field === 'unitPrice') {
      const numValue = parseFloat(value) || 0;
      row[field] = numValue;
      // 자동 계산
      row.totalAmount = calculateRowTotal(row.count, row.unitPrice);
    } else {
      row[field] = value;
    }

    newRows[rowIndex] = row;
    notifyRowsChange(newRows);
  }, [rows, notifyRowsChange]);

  // 셀 클릭 핸들러
  const handleCellClick = (rowIndex: number, field: keyof MonthlyReportRow) => {
    if (readonly) return;

    setEditingCell({ rowIndex, field });
    const value = rows[rowIndex][field];
    setEditValue(value?.toString() || '');
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  // 편집 완료
  const handleCellBlur = () => {
    if (editingCell) {
      updateCell(editingCell.rowIndex, editingCell.field, editValue);
      setEditingCell(null);
    }
  };

  // 키보드 네비게이션
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!editingCell) return;

    switch (e.key) {
      case 'Enter':
        e.preventDefault();
        handleCellBlur();
        // 다음 행으로 이동
        const nextRow = Math.min(editingCell.rowIndex + 1, rows.length - 1);
        setEditingCell({ rowIndex: nextRow, field: editingCell.field });
        setEditValue(rows[nextRow][editingCell.field]?.toString() || '');
        setTimeout(() => inputRef.current?.focus(), 0);
        break;
      case 'Tab':
        e.preventDefault();
        handleCellBlur();
        // 다음 필드로 이동
        const fields: (keyof MonthlyReportRow)[] = ['date', 'item', 'count', 'unitPrice'];
        const currentFieldIndex = fields.indexOf(editingCell.field);
        const nextFieldIndex = e.shiftKey
          ? Math.max(currentFieldIndex - 1, 0)
          : Math.min(currentFieldIndex + 1, fields.length - 1);
        const nextField = fields[nextFieldIndex];

        setEditingCell({ rowIndex: editingCell.rowIndex, field: nextField });
        setEditValue(rows[editingCell.rowIndex][nextField]?.toString() || '');
        setTimeout(() => inputRef.current?.focus(), 0);
        break;
      case 'Escape':
        setEditingCell(null);
        break;
    }
  };

  // 행 추가
  const addRow = () => {
    const newRow = createEmptyMonthlyReportRow();
    notifyRowsChange([...rows, newRow]);
  };

  // 행 삭제
  const removeRow = (index: number) => {
    if (rows.length > 1) {
      const newRows = rows.filter((_, i) => i !== index);
      notifyRowsChange(newRows);
    }
  };

  // 날짜 병합을 위한 rowspan 계산
  const getDateRowSpan = (rowIndex: number): number => {
    const currentDate = rows[rowIndex].date;
    if (!currentDate) return 1;

    // 이전 행들에서 같은 날짜가 있는지 확인
    for (let i = 0; i < rowIndex; i++) {
      if (rows[i].date === currentDate) {
        return 0; // 이미 병합됨
      }
    }

    // 현재 행부터 같은 날짜인 행의 개수 계산
    let span = 1;
    for (let i = rowIndex + 1; i < rows.length; i++) {
      if (rows[i].date === currentDate) {
        span++;
      } else {
        break;
      }
    }

    return span;
  };

  // 입력 타입 결정
  const getInputType = (field: keyof MonthlyReportRow): string => {
    switch (field) {
      case 'date':
        return 'date';
      case 'count':
      case 'unitPrice':
        return 'number';
      default:
        return 'text';
    }
  };

  // 셀 렌더링
  const renderCell = (row: MonthlyReportRow, rowIndex: number, field: keyof MonthlyReportRow) => {
    const isEditing = editingCell?.rowIndex === rowIndex && editingCell?.field === field;
    const value = row[field];

    if (field === 'totalAmount') {
      // 총액은 읽기 전용
      return (
        <div className="text-right font-medium text-blue-600">
          {typeof value === 'number' ? value.toLocaleString() : '0'}원
        </div>
      );
    }

    if (isEditing && !readonly) {
      return (
        <Input
          ref={inputRef}
          type={getInputType(field)}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleCellBlur}
          onKeyDown={handleKeyDown}
          className="w-full h-8 text-xs border-0 bg-blue-50 focus:ring-2 focus:ring-blue-500"
          min={field === 'count' || field === 'unitPrice' ? '0' : undefined}
        />
      );
    }

    const displayValue = (() => {
      if (field === 'date' && value) {
        const date = new Date(value as string);
        return `${date.getMonth() + 1}/${date.getDate()}`;
      }
      if ((field === 'count' || field === 'unitPrice') && typeof value === 'number') {
        return value === 0 ? '' : value.toLocaleString();
      }
      return value?.toString() || '';
    })();

    return (
      <div
        className={`w-full h-8 px-2 py-1 text-xs cursor-pointer hover:bg-gray-50 ${field === 'count' || field === 'unitPrice' ? 'text-right' : ''
          }`}
        onClick={() => handleCellClick(rowIndex, field)}
      >
        {displayValue}
      </div>
    );
  };

  return (
    <div className="space-y-3">
      {/* 컨트롤 버튼 */}
      {!readonly && (
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={addRow} className="text-xs h-7 px-3">
            <Plus className="h-3 w-3 mr-1" />
            행 추가
          </Button>
        </div>
      )}

      {/* 그리드 테이블 */}
      <div className="border rounded-lg overflow-auto">
        <table className="w-full border-collapse text-xs">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              <th className="border px-2 py-2 text-center font-medium text-gray-700 w-20">날짜</th>
              <th className="border px-2 py-2 text-center font-medium text-gray-700 min-w-40">품목</th>
              <th className="border px-2 py-2 text-center font-medium text-gray-700 w-16">횟수</th>
              <th className="border px-2 py-2 text-center font-medium text-gray-700 w-24">단가</th>
              <th className="border px-2 py-2 text-center font-medium text-gray-700 w-24">금액</th>
              {!readonly && <th className="border px-2 py-2 text-center font-medium text-gray-700 w-12">삭제</th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => {
              const dateRowSpan = getDateRowSpan(rowIndex);

              return (
                <tr key={row.id} className="hover:bg-gray-50">
                  {/* 날짜 셀 (병합) */}
                  {dateRowSpan > 0 && (
                    <td
                      className="border text-center align-top bg-blue-50"
                      rowSpan={dateRowSpan}
                    >
                      {renderCell(row, rowIndex, 'date')}
                    </td>
                  )}

                  {/* 품목 */}
                  <td className="border">
                    {renderCell(row, rowIndex, 'item')}
                  </td>

                  {/* 횟수 */}
                  <td className="border">
                    {renderCell(row, rowIndex, 'count')}
                  </td>

                  {/* 단가 */}
                  <td className="border">
                    {renderCell(row, rowIndex, 'unitPrice')}
                  </td>

                  {/* 금액 (자동계산) */}
                  <td className="border">
                    {renderCell(row, rowIndex, 'totalAmount')}
                  </td>

                  {/* 삭제 버튼 */}
                  {!readonly && (
                    <td className="border text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeRow(rowIndex)}
                        className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                        disabled={rows.length <= 1}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MonthlyReportGrid;