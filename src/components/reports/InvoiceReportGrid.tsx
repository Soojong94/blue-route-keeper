// src/components/reports/InvoiceReportGrid.tsx
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { InvoiceReportRow, calculateInvoiceRowAmount, createEmptyInvoiceRow } from '@/utils/reportUtils';

interface InvoiceReportGridProps {
  rows: InvoiceReportRow[];
  onRowsChange: (rows: InvoiceReportRow[]) => void;
  readonly?: boolean;
}

const InvoiceReportGrid: React.FC<InvoiceReportGridProps> = ({
  rows: initialRows,
  onRowsChange,
  readonly = false
}) => {
  const [rows, setRows] = useState<InvoiceReportRow[]>(initialRows);
  const [editingCell, setEditingCell] = useState<{ rowIndex: number; field: keyof InvoiceReportRow } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [datePickerOpen, setDatePickerOpen] = useState<{ [key: string]: boolean }>({});

  const inputRef = useRef<HTMLInputElement>(null);

  const notifyRowsChange = useCallback((newRows: InvoiceReportRow[]) => {
    setRows(newRows);
    onRowsChange(newRows);
  }, [onRowsChange]);

  useEffect(() => {
    if (JSON.stringify(initialRows) !== JSON.stringify(rows)) {
      setRows(initialRows);
    }
  }, [initialRows]);

  const updateCell = useCallback((rowIndex: number, field: keyof InvoiceReportRow, value: any) => {
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
      case 'direction':
        row.direction = value;
        break;
      case 'count':
        row.count = parseFloat(value) || 0;
        row.amount = calculateInvoiceRowAmount(row.count, row.unitPrice);
        break;
      case 'unitPrice':
        row.unitPrice = parseFloat(value) || 0;
        row.amount = calculateInvoiceRowAmount(row.count, row.unitPrice);
        break;
      case 'memo':
        row.memo = value;
        break;
      case 'amount':
        return; // 금액은 자동 계산이므로 직접 수정 불가
    }

    newRows[rowIndex] = row;
    notifyRowsChange(newRows);
  }, [rows, notifyRowsChange]);

  const handleCellClick = (rowIndex: number, field: keyof InvoiceReportRow) => {
    if (readonly) return;

    if (field === 'date') {
      const popoverKey = `${rowIndex}-${field}`;
      setDatePickerOpen(prev => ({ ...prev, [popoverKey]: true }));
      return;
    }

    if (field === 'direction') {
      return; // Select 컴포넌트가 자체적으로 처리
    }

    if (field === 'amount') {
      return; // 금액은 편집 불가
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

  const handleDirectionChange = (rowIndex: number, value: '반입' | '반출') => {
    updateCell(rowIndex, 'direction', value);
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
        const fields: (keyof InvoiceReportRow)[] = ['date', 'item', 'direction', 'count', 'unitPrice', 'memo'];
        const currentFieldIndex = fields.indexOf(editingCell.field);
        const nextFieldIndex = e.shiftKey
          ? Math.max(currentFieldIndex - 1, 0)
          : Math.min(currentFieldIndex + 1, fields.length - 1);
        const nextField = fields[nextFieldIndex];

        if (nextField === 'date') {
          const popoverKey = `${editingCell.rowIndex}-date`;
          setDatePickerOpen(prev => ({ ...prev, [popoverKey]: true }));
        } else if (nextField === 'direction') {
          // direction은 Select로 처리되므로 스킵
          const skipFieldIndex = e.shiftKey ? currentFieldIndex - 2 : currentFieldIndex + 2;
          const skipField = fields[Math.max(0, Math.min(skipFieldIndex, fields.length - 1))];
          setEditingCell({ rowIndex: editingCell.rowIndex, field: skipField });
          setEditValue(rows[editingCell.rowIndex][skipField]?.toString() || '');
          setTimeout(() => inputRef.current?.focus(), 0);
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
    const newRow = createEmptyInvoiceRow();
    notifyRowsChange([...rows, newRow]);
  };

  const removeRow = (index: number) => {
    if (rows.length > 1) {
      const newRows = rows.filter((_, i) => i !== index);
      notifyRowsChange(newRows);
    }
  };

  const getInputType = (field: keyof InvoiceReportRow): string => {
    switch (field) {
      case 'count':
      case 'unitPrice':
        return 'number';
      default:
        return 'text';
    }
  };

  const renderCell = (row: InvoiceReportRow, rowIndex: number, field: keyof InvoiceReportRow) => {
    const isEditing = editingCell?.rowIndex === rowIndex && editingCell?.field === field;
    const value = row[field];

    // 금액 셀 (자동 계산, 편집 불가)
    if (field === 'amount') {
      return (
        <div className="text-right font-medium text-blue-600 px-2 py-1">
          {typeof value === 'number' ? value.toLocaleString() : '0'}원
        </div>
      );
    }

    // 날짜 셀
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
                  <span>날짜</span>
                </div>
              )}
            </div>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={dateValue}
              onSelect={(date) => handleDateSelect(rowIndex, date)}
              locale={ko}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      );
    }

    // 반입/반출 셀
    if (field === 'direction') {
      return (
        <Select
          value={value as string}
          onValueChange={(newValue: '반입' | '반출') => handleDirectionChange(rowIndex, newValue)}
          disabled={readonly}
        >
          <SelectTrigger className="w-full h-8 text-xs border-0 hover:bg-gray-50">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="반입" className="text-xs">반입</SelectItem>
            <SelectItem value="반출" className="text-xs">반출</SelectItem>
          </SelectContent>
        </Select>
      );
    }

    // 일반 편집 가능한 셀
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

    // 일반 표시 셀
    const displayValue = (() => {
      if (field === 'count' && typeof value === 'number') {
        return value === 0 ? '' : value.toLocaleString();
      }
      // 🔥 단가에 '원' 단위 추가
      if (field === 'unitPrice' && typeof value === 'number') {
        return value === 0 ? '' : value.toLocaleString() + '원';
      }
      return value?.toString() || '';
    })();

    return (
      <div
        className={`w-full h-8 px-2 py-1 text-xs cursor-pointer hover:bg-gray-50 ${field === 'count' ? 'text-center' :
          field === 'unitPrice' || field === 'amount' ? 'text-right' :
            field === 'memo' ? 'text-left' : 'text-center'
          }`}
        onClick={() => handleCellClick(rowIndex, field)}
      >
        {displayValue}
      </div>
    );
  };

  return (
    <div className="space-y-3">
      {!readonly && (
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={addRow} className="text-xs h-7 px-3">
            <Plus className="h-3 w-3 mr-1" />
            행 추가
          </Button>
        </div>
      )}



      <div className="border rounded-lg overflow-auto">
        <table className="w-full border-collapse text-xs min-w-[700px]" style={{ tableLayout: 'fixed' }}>
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              <th className="border px-2 py-2 text-center font-medium text-gray-700" style={{ width: '12%' }}>날짜</th>
              <th className="border px-2 py-2 text-center font-medium text-gray-700" style={{ width: '28%' }}>품목</th>
              <th className="border px-2 py-2 text-center font-medium text-gray-700" style={{ width: '12%' }}>반입/반출</th>
              <th className="border px-2 py-2 text-center font-medium text-gray-700" style={{ width: '8%' }}>횟수</th>
              <th className="border px-2 py-2 text-center font-medium text-gray-700" style={{ width: '15%' }}>단가</th>
              <th className="border px-2 py-2 text-center font-medium text-gray-700" style={{ width: '15%' }}>금액</th>
              <th className="border px-2 py-2 text-center font-medium text-gray-700" style={{ width: '10%' }}>비고</th>
              {!readonly && <th className="border px-2 py-2 text-center font-medium text-gray-700" style={{ width: '5%' }}>삭제</th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={row.id} className="hover:bg-gray-50">
                <td className="border" style={{ width: '12%' }}>{renderCell(row, rowIndex, 'date')}</td>
                <td className="border" style={{ width: '28%' }}>{renderCell(row, rowIndex, 'item')}</td>
                <td className="border" style={{ width: '12%' }}>{renderCell(row, rowIndex, 'direction')}</td>
                <td className="border" style={{ width: '8%' }}>{renderCell(row, rowIndex, 'count')}</td>
                <td className="border" style={{ width: '15%' }}>{renderCell(row, rowIndex, 'unitPrice')}</td>
                <td className="border" style={{ width: '15%' }}>{renderCell(row, rowIndex, 'amount')}</td>
                <td className="border" style={{ width: '10%' }}>{renderCell(row, rowIndex, 'memo')}</td>
                {!readonly && (
                  <td className="border text-center" style={{ width: '5%' }}>
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

export default InvoiceReportGrid;