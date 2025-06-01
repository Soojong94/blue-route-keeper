// src/components/reports/ReportControls.tsx
import React, { useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, RefreshCw, X } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Vehicle } from '@/types/trip';
import SmartInput, { SearchResult } from '@/components/SmartInput';
import { searchVehicles, searchLocations, addRecentVehicle, addRecentLocation, getRecentVehicles, getRecentLocations } from '@/utils/smartSearch';

interface ReportSettings {
  title: string;
  startDate: Date;
  endDate: Date;
  vehicleId: string;
  additionalText: string;
  driverName: string;
  contact: string;
  // 🔥 새로 추가된 필터링 옵션
  departureFilter?: string;
  destinationFilter?: string;
}

interface ReportControlsProps {
  settings: ReportSettings;
  vehicles: Vehicle[];
  onSettingsChange: (field: keyof ReportSettings, value: any) => void;
  onRegenerate?: () => void;
  showRegenerate?: boolean;
  compact?: boolean;
  // 🔥 새로 추가 - 필터링 활성화 옵션
  enableLocationFilters?: boolean;
}

export const ReportControls: React.FC<ReportControlsProps> = ({
  settings,
  vehicles,
  onSettingsChange,
  onRegenerate,
  showRegenerate = false,
  compact = false,
  enableLocationFilters = false
}) => {
  // 즐겨찾기 차량 목록 생성
  const getFavoriteVehicles = useCallback((): SearchResult[] => {
    return [
      {
        id: 'all-vehicles',
        value: '',
        label: '전체 차량',
        type: 'favorite' as const,
        category: 'vehicle' as const,
        metadata: { vehicleId: 'all' }
      },
      ...vehicles.map(vehicle => ({
        id: `fav-vehicle-${vehicle.id}`,
        value: vehicle.licensePlate,
        label: `${vehicle.licensePlate}${vehicle.name ? ` (${vehicle.name})` : ''}`,
        type: 'favorite' as const,
        category: 'vehicle' as const,
        metadata: {
          vehicleId: vehicle.id,
          vehicle,
          category: vehicle.defaultUnitPrice ? `${vehicle.defaultUnitPrice.toLocaleString()}원` : undefined
        }
      }))
    ];
  }, [vehicles]);

  // 차량 선택 처리
  const handleVehicleSelect = useCallback((result: SearchResult) => {
    if (result.metadata?.vehicleId) {
      onSettingsChange('vehicleId', result.metadata.vehicleId);
      if (result.value) {
        addRecentVehicle(result.value);
      }
    }
  }, [onSettingsChange]);

  // 차량 입력값 변경 처리
  const handleVehicleInputChange = useCallback((value: string) => {
    if (!value.trim()) {
      onSettingsChange('vehicleId', 'all');
      return;
    }

    const matchingVehicle = vehicles.find(v => v.licensePlate === value);
    if (matchingVehicle) {
      onSettingsChange('vehicleId', matchingVehicle.id);
    } else {
      onSettingsChange('vehicleId', 'all');
    }
  }, [vehicles, onSettingsChange]);

  // 🔥 장소 선택 처리 함수들 추가
  const handleLocationSelect = useCallback((field: 'departureFilter' | 'destinationFilter', result: SearchResult) => {
    onSettingsChange(field, result.value);
    addRecentLocation(result.value);
  }, [onSettingsChange]);

  // 🔥 필터 초기화 함수
  const clearLocationFilter = useCallback((field: 'departureFilter' | 'destinationFilter') => {
    onSettingsChange(field, '');
  }, [onSettingsChange]);

  // 현재 선택된 차량의 번호판 표시
  const getVehicleInputValue = () => {
    if (settings.vehicleId === 'all') return '';
    const vehicle = vehicles.find(v => v.id === settings.vehicleId);
    return vehicle ? vehicle.licensePlate : '';
  };

  if (compact) {
    return (
      <div className="space-y-3">
        {/* 제목 */}
        <div>
          <Label className="text-xs">보고서 제목</Label>
          <Input
            value={settings.title}
            onChange={(e) => onSettingsChange('title', e.target.value)}
            className="text-sm h-8"
          />
        </div>

        {/* 날짜와 차량 */}
        <div className="grid grid-cols-3 gap-2">
          <div>
            <Label className="text-xs">시작일</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "w-full justify-start text-left font-normal h-8 text-xs",
                    !settings.startDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-1 h-3 w-3" />
                  {settings.startDate ? format(settings.startDate, "MM/dd") : "시작일"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={settings.startDate}
                  onSelect={(date) => {
                    if (date) {
                      const localDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
                      onSettingsChange('startDate', localDate);
                      if (localDate > settings.endDate) {
                        onSettingsChange('endDate', localDate);
                      }
                    }
                  }}
                  locale={ko}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <Label className="text-xs">종료일</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "w-full justify-start text-left font-normal h-8 text-xs",
                    !settings.endDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-1 h-3 w-3" />
                  {settings.endDate ? format(settings.endDate, "MM/dd") : "종료일"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={settings.endDate}
                  onSelect={(date) => {
                    if (date) {
                      const localDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
                      onSettingsChange('endDate', localDate);
                      if (localDate < settings.startDate) {
                        onSettingsChange('startDate', localDate);
                      }
                    }
                  }}
                  locale={ko}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <Label className="text-xs">차량</Label>
            <div className="flex gap-1">
              <Button
                variant={settings.vehicleId === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => onSettingsChange('vehicleId', 'all')}
                className="shrink-0 h-8 text-xs px-2"
              >
                전체
              </Button>
              <SmartInput
                value={getVehicleInputValue()}
                onChange={handleVehicleInputChange}
                onSelect={handleVehicleSelect}
                placeholder="차량번호"
                className="text-xs h-8"
                searchFunction={searchVehicles}
                recentItems={getRecentVehicles()}
                favoriteItems={getFavoriteVehicles()}
                debounceMs={300}
              />
            </div>
          </div>
        </div>

        {/* 🔥 장소 필터링 (활성화된 경우에만) */}
        {enableLocationFilters && (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">출발지 필터 (선택)</Label>
              <div className="flex gap-1">
                <SmartInput
                  value={settings.departureFilter || ''}
                  onChange={(value) => onSettingsChange('departureFilter', value)}
                  onSelect={(result) => handleLocationSelect('departureFilter', result)}
                  placeholder="출발지 필터"
                  className="text-xs h-8"
                  searchFunction={searchLocations}
                  recentItems={getRecentLocations()}
                  favoriteItems={[]}
                  debounceMs={300}
                />
                {settings.departureFilter && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => clearLocationFilter('departureFilter')}
                    className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>

            <div>
              <Label className="text-xs">목적지 필터 (선택)</Label>
              <div className="flex gap-1">
                <SmartInput
                  value={settings.destinationFilter || ''}
                  onChange={(value) => onSettingsChange('destinationFilter', value)}
                  onSelect={(result) => handleLocationSelect('destinationFilter', result)}
                  placeholder="목적지 필터"
                  className="text-xs h-8"
                  searchFunction={searchLocations}
                  recentItems={getRecentLocations()}
                  favoriteItems={[]}
                  debounceMs={300}
                />
                {settings.destinationFilter && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => clearLocationFilter('destinationFilter')}
                    className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 추가 필드들 */}
        <div className="grid grid-cols-3 gap-2">
          <div>
            <Label className="text-xs">추가 텍스트</Label>
            <Input
              value={settings.additionalText}
              onChange={(e) => onSettingsChange('additionalText', e.target.value)}
              placeholder="예: 특별 운행"
              className="text-xs h-8"
            />
          </div>
          <div>
            <Label className="text-xs">성명</Label>
            <Input
              value={settings.driverName}
              onChange={(e) => onSettingsChange('driverName', e.target.value)}
              placeholder="예: 홍길동"
              className="text-xs h-8"
            />
          </div>
          <div>
            <Label className="text-xs">연락처</Label>
            <Input
              value={settings.contact}
              onChange={(e) => onSettingsChange('contact', e.target.value)}
              placeholder="예: 010-1234-5678"
              className="text-xs h-8"
            />
          </div>
        </div>

        {/* 🔥 필터 상태 표시 */}
        {enableLocationFilters && (settings.departureFilter || settings.destinationFilter) && (
          <div className="bg-blue-50 p-2 rounded text-xs">
            <div className="text-blue-700 font-medium">활성 필터:</div>
            <div className="flex gap-2 mt-1">
              {settings.departureFilter && (
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                  출발지: {settings.departureFilter}
                </span>
              )}
              {settings.destinationFilter && (
                <span className="bg-red-100 text-red-800 px-2 py-1 rounded">
                  목적지: {settings.destinationFilter}
                </span>
              )}
            </div>
          </div>
        )}

        {/* 새로고침 버튼 */}
        {showRegenerate && onRegenerate && (
          <div className="flex justify-end">
            <Button size="sm" onClick={onRegenerate} className="text-xs h-7">
              <RefreshCw className="h-3 w-3 mr-1" />
              데이터 새로고침
            </Button>
          </div>
        )}
      </div>
    );
  }

  // 일반 모드 (기존 DailyReportSettings와 동일하지만 필터링 추가)
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>보고서 제목</Label>
        <Input
          value={settings.title}
          onChange={(e) => onSettingsChange('title', e.target.value)}
          placeholder="예: 2024년 12월 운행보고서"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label className="text-xs">추가 텍스트 (선택)</Label>
          <Input
            value={settings.additionalText}
            onChange={(e) => onSettingsChange('additionalText', e.target.value)}
            placeholder="예: 특별 운행, 긴급 운송 등"
          />
        </div>
        <div>
          <Label className="text-xs">성명 (선택)</Label>
          <Input
            value={settings.driverName}
            onChange={(e) => onSettingsChange('driverName', e.target.value)}
            placeholder="예: 홍길동"
          />
        </div>
        <div>
          <Label className="text-xs">연락처 (선택)</Label>
          <Input
            value={settings.contact}
            onChange={(e) => onSettingsChange('contact', e.target.value)}
            placeholder="예: 010-1234-5678"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>시작일</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !settings.startDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {settings.startDate ? format(settings.startDate, "MM/dd") : "시작일"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={settings.startDate}
                onSelect={(date) => {
                  if (date) {
                    const localDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
                    onSettingsChange('startDate', localDate);
                    if (localDate > settings.endDate) {
                      onSettingsChange('endDate', localDate);
                    }
                  }
                }}
                locale={ko}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label>종료일</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !settings.endDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {settings.endDate ? format(settings.endDate, "MM/dd") : "종료일"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={settings.endDate}
                onSelect={(date) => {
                  if (date) {
                    const localDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
                    onSettingsChange('endDate', localDate);
                    if (localDate < settings.startDate) {
                      onSettingsChange('startDate', localDate);
                    }
                  }
                }}
                locale={ko}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label>차량 선택</Label>
          <div className="flex gap-2">
            <Button
              variant={settings.vehicleId === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onSettingsChange('vehicleId', 'all')}
              className="shrink-0"
            >
              전체
            </Button>
            <SmartInput
              value={getVehicleInputValue()}
              onChange={handleVehicleInputChange}
              onSelect={handleVehicleSelect}
              placeholder="차량번호"
              searchFunction={searchVehicles}
              recentItems={getRecentVehicles()}
              favoriteItems={getFavoriteVehicles()}
              debounceMs={300}
            />
          </div>
        </div>
      </div>

      {/* 🔥 장소 필터링 섹션 - 일반 모드에서도 사용 가능 */}
      {enableLocationFilters && (
        <>
          <div className="border-t pt-4">
            <h3 className="text-sm font-medium mb-3">장소 필터링 (선택)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>출발지 필터</Label>
                <div className="flex gap-2">
                  <SmartInput
                    value={settings.departureFilter || ''}
                    onChange={(value) => onSettingsChange('departureFilter', value)}
                    onSelect={(result) => handleLocationSelect('departureFilter', result)}
                    placeholder="특정 출발지만 포함하려면 입력"
                    searchFunction={searchLocations}
                    recentItems={getRecentLocations()}
                    favoriteItems={[]}
                    debounceMs={300}
                  />
                  {settings.departureFilter && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => clearLocationFilter('departureFilter')}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>목적지 필터</Label>
                <div className="flex gap-2">
                  <SmartInput
                    value={settings.destinationFilter || ''}
                    onChange={(value) => onSettingsChange('destinationFilter', value)}
                    onSelect={(result) => handleLocationSelect('destinationFilter', result)}
                    placeholder="특정 목적지만 포함하려면 입력"
                    searchFunction={searchLocations}
                    recentItems={getRecentLocations()}
                    favoriteItems={[]}
                    debounceMs={300}
                  />
                  {settings.destinationFilter && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => clearLocationFilter('destinationFilter')}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* 필터 상태 표시 */}
            {(settings.departureFilter || settings.destinationFilter) && (
              <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                <div className="text-sm font-medium text-blue-800 mb-2">활성 필터:</div>
                <div className="flex gap-2">
                  {settings.departureFilter && (
                    <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                      출발지: {settings.departureFilter}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => clearLocationFilter('departureFilter')}
                        className="h-4 w-4 p-0 text-green-600 hover:text-green-800"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </span>
                  )}
                  {settings.destinationFilter && (
                    <span className="inline-flex items-center gap-1 bg-red-100 text-red-800 px-2 py-1 rounded text-xs">
                      목적지: {settings.destinationFilter}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => clearLocationFilter('destinationFilter')}
                        className="h-4 w-4 p-0 text-red-600 hover:text-red-800"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {showRegenerate && onRegenerate && (
        <div className="flex justify-end">
          <Button onClick={onRegenerate}>
            <RefreshCw className="h-4 w-4 mr-2" />
            데이터 새로고침
          </Button>
        </div>
      )}
    </div>
  );
};