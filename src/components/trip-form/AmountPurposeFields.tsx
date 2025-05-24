
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DollarSign, FileText } from 'lucide-react';

interface AmountPurposeFieldsProps {
  amount: string;
  setAmount: (value: string) => void;
  purpose: string;
  setPurpose: (value: string) => void;
}

const AmountPurposeFields: React.FC<AmountPurposeFieldsProps> = ({
  amount,
  setAmount,
  purpose,
  setPurpose
}) => {
  return (
    <>
      {/* 금액 입력 */}
      <div className="space-y-2">
        <Label htmlFor="amount" className="text-sm font-medium text-gray-700 flex items-center gap-1">
          <DollarSign className="h-4 w-4" />
          금액 (원)
        </Label>
        <Input
          id="amount"
          type="number"
          placeholder="금액을 입력하세요"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full"
          min="0"
        />
      </div>

      {/* 목적 또는 메모 */}
      <div className="space-y-2">
        <Label htmlFor="purpose" className="text-sm font-medium text-gray-700 flex items-center gap-1">
          <FileText className="h-4 w-4" />
          목적 / 메모
        </Label>
        <Textarea
          id="purpose"
          placeholder="운행 목적이나 메모를 입력하세요 (선택사항)"
          value={purpose}
          onChange={(e) => setPurpose(e.target.value)}
          className="w-full"
          rows={3}
        />
      </div>
    </>
  );
};

export default AmountPurposeFields;
