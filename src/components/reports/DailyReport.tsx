import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Car, MapPin } from 'lucide-react';
import { DailyReportData } from '@/utils/reportUtils';

interface DailyReportProps {
  data: DailyReportData;
}

const DailyReport: React.FC<DailyReportProps> = ({ data }) => {
  if (!data.departureGroups.length) {
    return (
      <div className="text-center py-8 text-gray-500">
        선택한 날짜에 운행 기록이 없습니다.
      </div>
    );
  }

  const totalTrips = data.departureGroups.reduce((sum, group) => 
    sum + group.destinations.reduce((destSum, dest) => destSum + dest.count, 0), 0
  );

  return (
    <div className="space-y-3 p-3 bg-white text-sm">
      {/* 헤더 */}
      <div className="text-center border-b pb-2">
        <h2 className="text-base font-bold text-gray-900">{data.date} 일간 운행 보고서</h2>
        <p className="text-xs text-gray-600 mt-1">총 {totalTrips}회 운행</p>
      </div>

      {/* 출발지별 운행 내역 */}
      <div className="space-y-2">
        {data.departureGroups.map((group, groupIndex) => (
          <div key={group.departure} className="border rounded p-2">
            <div className="flex justify-between items-center mb-1 border-b pb-1">
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3 text-blue-600" />
                <span className="text-xs text-gray-500">출발지:</span>
                <span className="font-medium text-sm">{group.departure}</span>
              </div>
              <Badge variant="outline" className="text-xs h-5">
                {group.destinations.reduce((sum, dest) => sum + dest.count, 0)}회
              </Badge>
            </div>
            
            <div className="space-y-1">
              {group.destinations.map((dest, destIndex) => (
                <div key={`${dest.destination}-${dest.vehicle}-${destIndex}`} 
                     className="flex justify-between items-center text-xs py-1">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <span>→</span>
                      <span className="text-gray-500">목적지:</span>
                      <span className="font-medium">{dest.destination}</span>
                    </div>
                    <div className="flex items-center gap-1 text-gray-600">
                      <Car className="h-3 w-3" />
                      <span className="text-gray-500">차량:</span>
                      <span>{dest.vehicle}</span>
                    </div>
                  </div>
                  <span className="font-medium text-purple-600">{dest.count}회</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* 요약 */}
      <div className="border-t pt-2 text-center text-xs text-gray-600">
        총 {data.departureGroups.length}개 출발지에서 {totalTrips}회 운행
      </div>
    </div>
  );
};

export default DailyReport;