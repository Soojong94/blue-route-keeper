// src/components/reports/MonthlyReportGrid.tsx
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Plus, Trash2, CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
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
  const [datePickerOpen, setDatePickerOpen] = useState<{ [key: string]: boolean }>({});

  const inputRef = useRef<HTMLInputElement>(null);

  const notifyRowsChange = useCallback((newRows: MonthlyReportRow[]) => {
    setRows(newRows);
    onRowsChange(newRows);
  }, [onRowsChange]);

  useEffect(() => {
    if (JSON.stringify(initialRows) !== JSON.stringify(rows)) {
      setRows(initialRows);
    }
  }, [initialRows]);

  const updateCell = useCallback((rowIndex: number, field: keyof MonthlyReportRow, value: any) => {
    const newRows = [...rows];
    const row = { ...newRows[rowIndex] };

    switch (field) {
      case 'id':
        row.id = value;
        break;
      case 'date':
        row.date = value;
        break;
      case 'item':
        row.item = value;
        break;
      case 'count':
        row.count = parseFloat(value) || 0;
        row.totalAmount = calculateRowTotal(row.count, row.unitPrice);
        break;
      case 'unitPrice':
        row.unitPrice = parseFloat(value) || 0;
        row.totalAmount = calculateRowTotal(row.count, row.unitPrice);
        break;
      case 'totalAmount':
        return;
    }

    newRows[rowIndex] = row;
    notifyRowsChange(newRows);
  }, [rows, notifyRowsChange]);

  const handleCellClick = (rowIndex: number, field: keyof MonthlyReportRow) => {
    if (readonly) return;

    // 날짜 필드는 달력 팝오버로 처리
    if (field === 'date') {
      const popoverKey = `${rowIndex}-${field}`;
      setDatePickerOpen(prev => ({ ...prev, [popoverKey]: true }));
      return;
    }

    setEditingCell({ rowIndex, field });
    const value = rows[rowIndex][field];
    setEditValue(value?.toString() || '');
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleDateSelect = (rowIndex: number, date: Date | undefined) => {
    if (date) {
      const dateString = format(date, 'yyyy-MM-dd');
      updateCell(rowIndex, 'date', dateString);
    }
    const popoverKey = `${rowIndex}-date`;
    setDatePickerOpen(prev => ({ ...prev, [popoverKey]: false }));
  };

  const handleCellBlur = () => {
    if (editingCell) {
      updateCell(editingCell.rowIndex, editingCell.field, editValue);
      setEditingCell(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!editingCell) return;

    switch (e.key) {
      case 'Enter':
        e.preventDefault();
        handleCellBlur();
        const nextRow = Math.min(editingCell.rowIndex + 1, rows.length - 1);
        setEditingCell({ rowIndex: nextRow, field: editingCell.field });
        setEditValue(rows[nextRow][editingCell.field]?.toString() || '');
        setTimeout(() => inputRef.current?.focus(), 0);
        break;
      case 'Tab':
        e.preventDefault();
        handleCellBlur();
        const fields: (keyof MonthlyReportRow)[] = ['date', 'item', 'count', 'unitPrice'];
        const currentFieldIndex = fields.indexOf(editingCell.field);
        const nextFieldIndex = e.shiftKey
          ? Math.max(currentFieldIndex - 1, 0)
          : Math.min(currentFieldIndex + 1, fields.length - 1);
        const nextField = fields[nextFieldIndex];

        // 다음 필드가 날짜면 달력 열기
        if (nextField === 'date') {
          const popoverKey = `${editingCell.rowIndex}-date`;
          setDatePickerOpen(prev => ({ ...prev, [popoverKey]: true }));
        } else {
          setEditingCell({ rowIndex: editingCell.rowIndex, field: nextField });
          setEditValue(rows[editingCell.rowIndex][nextField]?.toString() || '');
          setTimeout(() => inputRef.current?.focus(), 0);
        }
        break;
      case 'Escape':
        setEditingCell(null);
        break;
    }
  };

  const addRow = () => {
    const newRow = createEmptyMonthlyReportRow();
    notifyRowsChange([...rows, newRow]);
  };

  const removeRow = (index: number) => {
    if (rows.length > 1) {
      const newRows = rows.filter((_, i) => i !== index);
      notifyRowsChange(newRows);
    }
  };

  const getInputType = (field: keyof MonthlyReportRow): string => {
    switch (field) {
      case 'count':
      case 'unitPrice':
        return 'number';
      default:
        return 'text';
    }
  };

  const renderCell = (row: MonthlyReportRow, rowIndex: number, field: keyof MonthlyReportRow) => {
    const isEditing = editingCell?.rowIndex === rowIndex && editingCell?.field === field;
    const value = row[field];

    if (field === 'totalAmount') {
      return (
        <div className="text-right font-medium text-blue-600 px-2 py-1">
          {typeof value === 'number' ? value.toLocaleString() : '0'}원
        </div>
      );
    }

    // 날짜 필드 특별 처리
    if (field === 'date') {
      const popoverKey = `${rowIndex}-${field}`;
      const dateValue = value ? new Date(value as string) : undefined;
      const displayDate = dateValue && !isNaN(dateValue.getTime())
        ? format(dateValue, 'MM/dd', { locale: ko })
        : '';

      return (
        <Popover
          open={datePickerOpen[popoverKey] || false}
          onOpenChange={(open) => {
            setDatePickerOpen(prev => ({ ...prev, [popoverKey]: open }));
          }}
        >
          <PopoverTrigger asChild>
            <div
              className="w-full h-8 px-2 py-1 text-xs cursor-pointer hover:bg-gray-50 flex items-center justify-center"
              onClick={() => handleCellClick(rowIndex, field)}
            >
              {displayDate || (
                <div className="flex items-center gap-1 text-gray-400">
                  <CalendarIcon className="h-3 w-3" />
                  <span>날짜선택</span>
                </div>
              )}
            </div>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={dateValue}
              onSelect={(date) => handleDateSelect(rowIndex, date)}
              locale={ko}  // 👈 이 부분 추가
              initialFocus
            />
          </PopoverContent>
        </Popover>
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
      {/* 상단 행 추가 버튼 */}
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
        <table className="w-full border-collapse text-xs min-w-[600px]">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              <th className="border px-2 py-2 text-center font-medium text-gray-700" style={{ width: '15%' }}>날짜</th>
              <th className="border px-2 py-2 text-center font-medium text-gray-700" style={{ width: '35%' }}>품목</th>
              <th className="border px-2 py-2 text-center font-medium text-gray-700" style={{ width: '15%' }}>횟수</th>
              <th className="border px-2 py-2 text-center font-medium text-gray-700" style={{ width: '15%' }}>단가</th>
              <th className="border px-2 py-2 text-center font-medium text-gray-700" style={{ width: '15%' }}>금액</th>
              {!readonly && <th className="border px-2 py-2 text-center font-medium text-gray-700" style={{ width: '5%' }}>삭제</th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={row.id} className="hover:bg-gray-50">
                <td className="border">{renderCell(row, rowIndex, 'date')}</td>
                <td className="border">{renderCell(row, rowIndex, 'item')}</td>
                <td className="border">{renderCell(row, rowIndex, 'count')}</td>
                <td className="border">{renderCell(row, rowIndex, 'unitPrice')}</td>
                <td className="border">{renderCell(row, rowIndex, 'totalAmount')}</td>
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
            ))}
          </tbody>
        </table>
      </div>

      {/* 하단 행 추가 버튼 */}
      {!readonly && (
        <div className="flex justify-center">
          <Button variant="outline" size="sm" onClick={addRow} className="text-xs h-7 px-3">
            <Plus className="h-3 w-3 mr-1" />
            행 추가
          </Button>
        </div>
      )}
    </div>
  );
};

export default MonthlyReportGrid;