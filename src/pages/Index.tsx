/* src/pages/Index.tsx 수정 */
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Car, BarChart3, FileText, Edit3, Plus } from 'lucide-react';
import TripInput from '@/components/TripInput';
import TripList from '@/components/TripList';
import ReportManagement from '@/components/ReportManagement';
import Notepad from '@/components/Notepad';
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
      {/* Header - 인쇄 시 숨김 */}
      <header className="no-print bg-white shadow-sm border-b border-blue-100 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-12">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg">
                <Car className="h-4 w-4 text-white" />
              </div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                차량 운행 관리 시스템
              </h1>
            </div>
            <UserProfile />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          {/* 데스크톱 탭 네비게이션 - 인쇄 시 숨김 */}
          <div className="no-print hidden md:block mb-6">
            <TabsList className="grid w-full grid-cols-4 bg-white shadow-sm h-10">
              <TabsTrigger
                value="input"
                className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 text-xs"
              >
                <Plus className="mr-1 h-3 w-3" />
                운행 입력
              </TabsTrigger>
              <TabsTrigger
                value="list"
                className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 text-xs"
              >
                <BarChart3 className="mr-1 h-3 w-3" />
                조회 & 통계
              </TabsTrigger>
              <TabsTrigger
                value="reports"
                className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 text-xs"
              >
                <FileText className="mr-1 h-3 w-3" />
                보고서 관리
              </TabsTrigger>
              <TabsTrigger
                value="notepad"
                className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 text-xs"
              >
                <Edit3 className="mr-1 h-3 w-3" />
                메모장
              </TabsTrigger>
            </TabsList>
          </div>

          {/* 탭 컨텐츠 */}
          <TabsContent value="input" className="space-y-4">
            <div className="no-print text-center mb-4">
              <h2 className="text-lg font-bold text-gray-800 mb-1">운행 기록 입력</h2>
              <p className="text-xs text-gray-600">차량 운행 정보를 입력하고 관리하세요</p>
            </div>
            <TripInput onTripSaved={handleTripSaved} />
          </TabsContent>

          <TabsContent value="list" className="space-y-4">
            <div className="no-print text-center mb-4">
              <h2 className="text-lg font-bold text-gray-800 mb-1">운행 기록 조회</h2>
              <p className="text-xs text-gray-600">운행 이력을 조회하고 통계를 확인하세요</p>
            </div>
            <TripList refreshTrigger={refreshTrigger} />
          </TabsContent>

          <TabsContent value="reports" className="space-y-4">
            <div className="no-print text-center mb-4">
              <h2 className="text-lg font-bold text-gray-800 mb-1">보고서 관리</h2>
              <p className="text-xs text-gray-600">운행 보고서를 생성하고 관리하세요</p>
            </div>
            <ReportManagement />
          </TabsContent>

          <TabsContent value="notepad" className="space-y-4">
            <div className="no-print text-center mb-4">
              <h2 className="text-lg font-bold text-gray-800 mb-1">메모장</h2>
              <p className="text-xs text-gray-600">엑셀 형식의 메모장을 사용하세요</p>
            </div>
            <Notepad />
          </TabsContent>

          {/* 모바일 하단 네비게이션 - 인쇄 시 숨김 */}
          <div className="no-print md:hidden fixed bottom-0 left-0 right-0 z-10 bg-white border-t border-gray-200 shadow-lg">
            <TabsList className="h-14 justify-around w-full bg-white">
              <TabsTrigger
                value="input"
                className="flex-1 flex flex-col items-center gap-0.5 h-full data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700"
              >
                <Plus className="h-4 w-4" />
                <span className="text-[10px]">입력</span>
              </TabsTrigger>
              <TabsTrigger
                value="list"
                className="flex-1 flex flex-col items-center gap-0.5 h-full data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700"
              >
                <BarChart3 className="h-4 w-4" />
                <span className="text-[10px]">조회</span>
              </TabsTrigger>
              <TabsTrigger
                value="reports"
                className="flex-1 flex flex-col items-center gap-0.5 h-full data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700"
              >
                <FileText className="h-4 w-4" />
                <span className="text-[10px]">보고서</span>
              </TabsTrigger>
              <TabsTrigger
                value="notepad"
                className="flex-1 flex flex-col items-center gap-0.5 h-full data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700"
              >
                <Edit3 className="h-4 w-4" />
                <span className="text-[10px]">메모장</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* 모바일에서 하단 여백 확보 - 인쇄 시 숨김 */}
          <div className="no-print md:hidden pb-16" />
        </Tabs>
      </main>
    </div>
  );
};

export default Index;