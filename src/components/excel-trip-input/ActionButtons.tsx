
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Save } from 'lucide-react';

interface ActionButtonsProps {
  onAddRow: () => void;
  onSaveAll: () => void;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({ onAddRow, onSaveAll }) => {
  return (
    <div className="p-4 border-t border-gray-200 flex justify-between">
      <Button 
        variant="outline" 
        onClick={onAddRow}
        className="flex items-center"
      >
        <Plus className="mr-1 h-4 w-4" />
        새 행 추가
      </Button>
      
      <Button 
        onClick={onSaveAll}
        className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
      >
        <Save className="mr-1 h-4 w-4" />
        일괄 저장
      </Button>
    </div>
  );
};

export default ActionButtons;
