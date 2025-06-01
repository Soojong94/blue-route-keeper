/* src/components/notepad/GridEditor.tsx - 즉시 저장 방식으로 심플화 */
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Minus } from 'lucide-react';

interface CellData {
  value: string;
  style?: {
    bold?: boolean;
    italic?: boolean;
    color?: string;
    backgroundColor?: string;
  };
}

interface GridEditorProps {
  data: CellData[][];
  onDataChange: (data: CellData[][]) => void;
  rows?: number;
  cols?: number;
}

const GridEditor: React.FC<GridEditorProps> = ({
  data: initialData,
  onDataChange,
  rows: initialRows = 10,
  cols: initialCols = 5
}) => {
  const [data, setData] = useState<CellData[][]>(() => {
    if (initialData && initialData.length > 0 && Array.isArray(initialData[0])) {
      return JSON.parse(JSON.stringify(initialData));
    }
    return Array(initialRows).fill(null).map(() =>
      Array(initialCols).fill(null).map(() => ({ value: '' }))
    );
  });

  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
  const [editingCell, setEditingCell] = useState<{ row: number; col: number } | null>(null);
  const [editValue, setEditValue] = useState('');

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialData && initialData.length > 0) {
      setData(JSON.parse(JSON.stringify(initialData)));
    }
  }, [initialData]);

  // 🔥 즉시 상위 컴포넌트에 알림
  const notifyDataChange = useCallback((newData: CellData[][]) => {
    onDataChange(newData);
  }, [onDataChange]);

  const updateCell = useCallback((row: number, col: number, value: string) => {
    const newData = data.map((rowData, rowIndex) => {
      if (rowIndex === row) {
        return rowData.map((cell, colIndex) => {
          if (colIndex === col) {
            return { ...cell, value };
          }
          return { ...cell };
        });
      }
      return rowData.map(cell => ({ ...cell }));
    });

    setData(newData);
    notifyDataChange(newData);
  }, [data, notifyDataChange]);

  const handleCellClick = (row: number, col: number) => {
    setSelectedCell({ row, col });
    setEditingCell({ row, col });
    setEditValue(data[row]?.[col]?.value || '');
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleCellChange = (value: string) => {
    setEditValue(value);
  };

  const handleCellBlur = () => {
    if (editingCell) {
      updateCell(editingCell.row, editingCell.col, editValue);
      setEditingCell(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!selectedCell) return;

    switch (e.key) {
      case 'Enter':
        e.preventDefault();
        if (editingCell) {
          handleCellBlur();
        }
        const nextRow = Math.min(selectedCell.row + 1, data.length - 1);
        setSelectedCell({ row: nextRow, col: selectedCell.col });
        break;
      case 'Tab':
        e.preventDefault();
        if (editingCell) {
          handleCellBlur();
        }
        const nextCol = e.shiftKey
          ? Math.max(selectedCell.col - 1, 0)
          : Math.min(selectedCell.col + 1, (data[0]?.length || initialCols) - 1);
        setSelectedCell({ row: selectedCell.row, col: nextCol });
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedCell(prev => prev ? { ...prev, row: Math.max(prev.row - 1, 0) } : null);
        break;
      case 'ArrowDown':
        e.preventDefault();
        setSelectedCell(prev => prev ? { ...prev, row: Math.min(prev.row + 1, data.length - 1) } : null);
        break;
      case 'ArrowLeft':
        e.preventDefault();
        setSelectedCell(prev => prev ? { ...prev, col: Math.max(prev.col - 1, 0) } : null);
        break;
      case 'ArrowRight':
        e.preventDefault();
        setSelectedCell(prev => prev ? { ...prev, col: Math.min(prev.col + 1, (data[0]?.length || initialCols) - 1) } : null);
        break;
    }
  };

  const addRow = () => {
    const newData = [
      ...data,
      Array(data[0]?.length || initialCols).fill(null).map(() => ({ value: '' }))
    ];
    setData(newData);
    notifyDataChange(newData);
  };

  const addColumn = () => {
    const newData = data.map(row => [...row, { value: '' }]);
    setData(newData);
    notifyDataChange(newData);
  };

  const removeRow = () => {
    if (data.length > 1) {
      const newData = data.slice(0, -1);
      setData(newData);
      notifyDataChange(newData);
    }
  };

  const removeColumn = () => {
    if (data[0]?.length > 1) {
      const newData = data.map(row => row.slice(0, -1));
      setData(newData);
      notifyDataChange(newData);
    }
  };

  const getColumnLabel = (index: number) => {
    let label = '';
    let num = index;
    do {
      label = String.fromCharCode(65 + (num % 26)) + label;
      num = Math.floor(num / 26) - 1;
    } while (num >= 0);
    return label;
  };

  return (
    <div className="w-full">
      {/* 컨트롤 버튼 */}
      <div className="flex gap-2 mb-3">
        <Button variant="outline" size="sm" onClick={addRow} className="text-xs h-6 px-2">
          <Plus className="h-3 w-3 mr-1" />
          행 추가
        </Button>
        <Button variant="outline" size="sm" onClick={addColumn} className="text-xs h-6 px-2">
          <Plus className="h-3 w-3 mr-1" />
          열 추가
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={removeRow}
          className="text-xs h-6 px-2"
          disabled={data.length <= 1}
        >
          <Minus className="h-3 w-3 mr-1" />
          행 삭제
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={removeColumn}
          className="text-xs h-6 px-2"
          disabled={(data[0]?.length || 0) <= 1}
        >
          <Minus className="h-3 w-3 mr-1" />
          열 삭제
        </Button>
      </div>

      {/* 그리드 */}
      <div className="border rounded-lg overflow-auto max-h-96">
        <table className="w-full border-collapse">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              <th className="w-8 h-6 border text-[10px] font-medium text-gray-600"></th>
              {Array.from({ length: data[0]?.length || initialCols }, (_, index) => (
                <th key={index} className="min-w-16 h-6 border text-[10px] font-medium text-gray-600 px-1">
                  {getColumnLabel(index)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, rowIndex) => (
              <tr key={rowIndex}>
                <td className="w-8 h-6 border bg-gray-50 text-[10px] font-medium text-gray-600 text-center">
                  {rowIndex + 1}
                </td>
                {row.map((cell, colIndex) => (
                  <td
                    key={colIndex}
                    className={`min-w-16 h-6 border cursor-pointer hover:bg-blue-50 relative ${selectedCell?.row === rowIndex && selectedCell?.col === colIndex
                      ? 'ring-2 ring-blue-500 bg-blue-50'
                      : ''
                      }`}
                    onClick={() => handleCellClick(rowIndex, colIndex)}
                  >
                    {editingCell?.row === rowIndex && editingCell?.col === colIndex ? (
                      <Input
                        ref={inputRef}
                        value={editValue}
                        onChange={(e) => handleCellChange(e.target.value)}
                        onBlur={handleCellBlur}
                        onKeyDown={handleKeyDown}
                        className="w-full h-full border-0 bg-transparent text-[10px] p-0.5 focus:ring-0"
                      />
                    ) : (
                      <div className="w-full h-full text-[10px] p-0.5 overflow-hidden whitespace-nowrap">
                        {cell?.value || ''}
                      </div>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default GridEditor;