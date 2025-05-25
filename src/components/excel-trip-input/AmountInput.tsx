
import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface AmountInputProps {
  value: string;
  onChange: (value: string) => void;
}

const AmountInput: React.FC<AmountInputProps> = ({ value, onChange }) => {
  const handleAmountChange = (increment: boolean) => {
    const currentAmount = parseFloat(value) || 0;
    const newAmount = increment ? currentAmount + 10000 : Math.max(0, currentAmount - 10000);
    onChange(newAmount.toString());
  };

  return (
    <div className="flex items-center gap-1">
      <Input 
        type="number" 
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-9 p-1"
        placeholder="건당 금액"
        min="0"
        step="10000"
      />
      <div className="flex flex-col gap-0">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-4 w-6 p-0 text-xs"
          onClick={() => handleAmountChange(true)}
        >
          ▲
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-4 w-6 p-0 text-xs"
          onClick={() => handleAmountChange(false)}
        >
          ▼
        </Button>
      </div>
    </div>
  );
};

export default AmountInput;
