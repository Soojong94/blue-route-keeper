
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Car, FileText, BarChart3, Settings, MapPin } from 'lucide-react';
import TripHistory from '@/components/TripHistory';
import VehicleManagement from '@/components/VehicleManagement';
import TripTable from '@/components/TripTable';
import ExcelTripInput from '@/components/ExcelTripInput';
import LocationManagement from '@/components/LocationManagement';
import { Button } from '@/components/ui/button';

const Index = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [activeTab, setActiveTab] = useState('input');

  const handleTripSaved = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-blue-100 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center h-16">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg">
                <Car className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                자동차 운행 관리
              </h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsContent value="input" className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-2">운행 기록 입력</h2>
              <p className="text-gray-600">엑셀 형태로 한 번에 여러 운행 정보를 입력하세요.</p>
            </div>
            <ExcelTripInput onTripSaved={handleTripSaved} />
          </TabsContent>

          <TabsContent value="table" className="space-y-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-800">전체 운행 기록 조회</h2>
                <p className="text-gray-600">모든 운행 기록을 테이블로 확인하고 관리하세요.</p>
              </div>
            </div>
            <TripTable refreshTrigger={refreshTrigger} />
          </TabsContent>
          
          <TabsContent value="history" className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-2">운행 통계</h2>
              <p className="text-gray-600">기간별 운행 기록을 확인하고 통계를 조회하세요.</p>
            </div>
            <TripHistory refreshTrigger={refreshTrigger} />
          </TabsContent>
          
          <TabsContent value="vehicles" className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-2">차량 관리</h2>
              <p className="text-gray-600">차량을 등록하고 관리하세요.</p>
            </div>
            <VehicleManagement />
          </TabsContent>

          <TabsContent value="locations" className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-2">장소 관리</h2>
              <p className="text-gray-600">자주 사용하는 출발지와 목적지를 등록하고 관리하세요.</p>
            </div>
            <LocationManagement />
          </TabsContent>

          {/* Footer Navigation */}
          <div className="mt-auto">
            <div className="fixed bottom-0 left-0 right-0 z-10 bg-white border-t border-gray-200 shadow-lg">
              <TabsList className="h-16 justify-around w-full bg-white">
                <TabsTrigger 
                  value="input" 
                  className="flex-1 flex flex-col items-center gap-1 h-full data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 border-t-2 data-[state=active]:border-blue-600 data-[state=inactive]:border-transparent"
                >
                  <FileText className="h-5 w-5" />
                  <span className="text-xs font-medium">입력</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="table" 
                  className="flex-1 flex flex-col items-center gap-1 h-full data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 border-t-2 data-[state=active]:border-blue-600 data-[state=inactive]:border-transparent"
                >
                  <FileText className="h-5 w-5" />
                  <span className="text-xs font-medium">조회</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="history" 
                  className="flex-1 flex flex-col items-center gap-1 h-full data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 border-t-2 data-[state=active]:border-blue-600 data-[state=inactive]:border-transparent"
                >
                  <BarChart3 className="h-5 w-5" />
                  <span className="text-xs font-medium">통계</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="vehicles" 
                  className="flex-1 flex flex-col items-center gap-1 h-full data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 border-t-2 data-[state=active]:border-blue-600 data-[state=inactive]:border-transparent"
                >
                  <Car className="h-5 w-5" />
                  <span className="text-xs font-medium">차량</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="locations" 
                  className="flex-1 flex flex-col items-center gap-1 h-full data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 border-t-2 data-[state=active]:border-blue-600 data-[state=inactive]:border-transparent"
                >
                  <MapPin className="h-5 w-5" />
                  <span className="text-xs font-medium">장소</span>
                </TabsTrigger>
              </TabsList>
            </div>
            <div className="pb-20" />
          </div>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;
