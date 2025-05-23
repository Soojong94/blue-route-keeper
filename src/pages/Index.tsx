
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Car, Plus, BarChart3 } from 'lucide-react';
import TripForm from '@/components/TripForm';
import TripHistory from '@/components/TripHistory';

const Index = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleTripSaved = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-blue-100">
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="input" className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8 bg-white shadow-sm">
            <TabsTrigger 
              value="input" 
              className="flex items-center gap-2 data-[state=active]:bg-blue-500 data-[state=active]:text-white"
            >
              <Plus className="h-4 w-4" />
              운행 입력
            </TabsTrigger>
            <TabsTrigger 
              value="history" 
              className="flex items-center gap-2 data-[state=active]:bg-blue-500 data-[state=active]:text-white"
            >
              <BarChart3 className="h-4 w-4" />
              운행 조회
            </TabsTrigger>
          </TabsList>

          <TabsContent value="input" className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-2">새 운행 기록 입력</h2>
              <p className="text-gray-600">운행 정보를 입력하여 기록을 저장하세요.</p>
            </div>
            <TripForm onTripSaved={handleTripSaved} />
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-2">운행 기록 조회</h2>
              <p className="text-gray-600">기간별 운행 기록을 확인하고 통계를 조회하세요.</p>
            </div>
            <TripHistory refreshTrigger={refreshTrigger} />
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-blue-100 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-sm text-gray-500">
            © 2024 자동차 운행 관리 시스템. 깔끔하고 효율적인 운행 기록 관리.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
