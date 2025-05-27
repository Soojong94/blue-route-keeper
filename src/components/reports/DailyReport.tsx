import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Car, Hash } from 'lucide-react';
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
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">{data.date} 일간 운행 보고서</h2>
        <div className="flex justify-center">
          <Badge className="bg-blue-100 text-blue-800 px-4 py-2">
            총 {totalTrips}회 운행
          </Badge>
        </div>
      </div>

      {/* 출발지별 블록 */}
      <div className="space-y-4">
        {data.departureGroups.map((group, groupIndex) => (
          <Card key={group.departure} className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <MapPin className="h-5 w-5" />
                출발지: {group.departure}
                <Badge className="bg-white/20 text-white ml-auto">
                  {group.destinations.reduce((sum, dest) => sum + dest.count, 0)}회
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {group.destinations.map((dest, destIndex) => (
                  <div key={`${dest.destination}-${dest.vehicle}-${destIndex}`} 
                       className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-green-600" />
                          <span className="font-medium">{dest.destination}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Car className="h-4 w-4 text-blue-600" />
                          <span className="text-gray-600">{dest.vehicle}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Hash className="h-4 w-4 text-purple-600" />
                        <Badge className="bg-purple-100 text-purple-800 font-semibold">
                          {dest.count}회
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 요약 */}
      <Card className="bg-gray-50">
        <CardContent className="p-4">
          <div className="text-center text-sm text-gray-600">
            <p>총 {data.departureGroups.length}개 출발지에서 {totalTrips}회 운행</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DailyReport;