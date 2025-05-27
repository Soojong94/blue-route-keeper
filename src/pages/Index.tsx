import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Car, BarChart3, MapPin, Plus } from 'lucide-react';
import TripInput from '@/components/TripInput';
import TripList from '@/components/TripList';
import VehicleManagement from '@/components/VehicleManagement';
import LocationManagement from '@/components/LocationManagement';
import UserProfile from '@/components/UserProfile';
import { useAuth } from '@/hooks/useAuth';
import { useLocalStorage } from '@/hooks/useLocalStorage';

const Index = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [activeTab, setActiveTab] = useLocalStorage('activeTab', 'input');
  const { user } = useAuth();

  const handleTripSaved = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-blue-100 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg">
                <Car className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                차량 운행 관리 시스템
              </h1>
            </div>
            <UserProfile />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          {/* 데스크톱 탭 네비게이션 */}
          <div className="hidden md:block mb-8">
            <TabsList className="grid w-full grid-cols-4 bg-white shadow-sm">
              <TabsTrigger
                value="input"
                className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700"
              >
                <Plus className="mr-2 h-4 w-4" />
                운행 입력
              </TabsTrigger>
              <TabsTrigger
                value="list"
                className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700"
              >
                <BarChart3 className="mr-2 h-4 w-4" />
                조회 & 통계
              </TabsTrigger>
              <TabsTrigger
                value="vehicles"
                className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700"
              >
                <Car className="mr-2 h-4 w-4" />
                차량 관리
              </TabsTrigger>
              <TabsTrigger
                value="locations"
                className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700"
              >
                <MapPin className="mr-2 h-4 w-4" />
                장소 관리
              </TabsTrigger>
            </TabsList>
          </div>

          {/* 탭 컨텐츠 */}
          <TabsContent value="input" className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">운행 기록 입력</h2>
              <p className="text-gray-600">차량 운행 정보를 입력하고 관리하세요</p>
            </div>
            <TripInput onTripSaved={handleTripSaved} />
          </TabsContent>

          <TabsContent value="list" className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">운행 기록 조회</h2>
              <p className="text-gray-600">운행 이력을 조회하고 통계를 확인하세요</p>
            </div>
            <TripList refreshTrigger={refreshTrigger} />
          </TabsContent>

          <TabsContent value="vehicles" className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">차량 관리</h2>
              <p className="text-gray-600">보유 차량을 등록하고 관리하세요</p>
            </div>
            <VehicleManagement />
          </TabsContent>

          <TabsContent value="locations" className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">장소 관리</h2>
              <p className="text-gray-600">자주 방문하는 장소를 등록하고 관리하세요</p>
            </div>
            <LocationManagement />
          </TabsContent>

          {/* 모바일 하단 네비게이션 */}
          <div className="md:hidden fixed bottom-0 left-0 right-0 z-10 bg-white border-t border-gray-200 shadow-lg">
            <TabsList className="h-16 justify-around w-full bg-white">
              <TabsTrigger
                value="input"
                className="flex-1 flex flex-col items-center gap-1 h-full data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700"
              >
                <Plus className="h-5 w-5" />
                <span className="text-xs">입력</span>
              </TabsTrigger>
              <TabsTrigger
                value="list"
                className="flex-1 flex flex-col items-center gap-1 h-full data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700"
              >
                <BarChart3 className="h-5 w-5" />
                <span className="text-xs">조회</span>
              </TabsTrigger>
              <TabsTrigger
                value="vehicles"
                className="flex-1 flex flex-col items-center gap-1 h-full data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700"
              >
                <Car className="h-5 w-5" />
                <span className="text-xs">차량</span>
              </TabsTrigger>
              <TabsTrigger
                value="locations"
                className="flex-1 flex flex-col items-center gap-1 h-full data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700"
              >
                <MapPin className="h-5 w-5" />
                <span className="text-xs">장소</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* 모바일에서 하단 여백 확보 */}
          <div className="md:hidden pb-20" />
        </Tabs>
      </main>
    </div>
  );
};

export default Index;