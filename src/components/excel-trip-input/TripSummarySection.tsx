
import React from 'react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

interface TripSummarySectionProps {
  totalTrips: number;
  totalAmount: number;
}

const TripSummarySection: React.FC<TripSummarySectionProps> = ({
  totalTrips,
  totalAmount
}) => {
  return (
    <>
      {/* Header */}
      <div className="flex justify-between items-center p-6 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-t-lg">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <span>운행 기록 일괄 입력</span>
        </h2>
        <div className="text-sm">
          {format(new Date(), 'yyyy년 MM월 dd일', { locale: ko })}
        </div>
      </div>

      {/* Summary Section */}
      <div className="grid grid-cols-2 gap-4 p-4 bg-blue-50 border-b border-blue-100">
        <div className="text-center p-2 bg-white rounded-md shadow-sm">
          <div className="text-sm text-blue-600">총 운행 건수</div>
          <div className="text-2xl font-semibold">{totalTrips}건</div>
        </div>
        <div className="text-center p-2 bg-white rounded-md shadow-sm">
          <div className="text-sm text-green-600">총 금액</div>
          <div className="text-2xl font-semibold">
            {new Intl.NumberFormat('ko-KR').format(totalAmount)}원
          </div>
        </div>
      </div>
    </>
  );
};

export default TripSummarySection;
