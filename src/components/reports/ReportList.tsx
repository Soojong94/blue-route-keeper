// src/components/reports/ReportList.tsx 수정
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { FileText, BarChart3, Eye, Edit, Trash2, Search, Car, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

interface SavedReport {
  id: string;
  title: string;
  type: 'daily' | 'monthly';
  settings: any;
  data: any;
  created_at: string;
  updated_at: string | null;
}

interface ReportListProps {
  reports: SavedReport[];
  onView: (report: SavedReport) => void;
  onEdit: (report: SavedReport) => void;
  onDelete: (id: string) => void;
  loading: boolean;
  vehicles?: any[]; // 차량 목록 추가
}

const ReportList: React.FC<ReportListProps> = ({
  reports,
  onView,
  onEdit,
  onDelete,
  loading,
  vehicles = []
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredReports, setFilteredReports] = useState<SavedReport[]>([]);

  const { toast } = useToast();

  useEffect(() => {
    if (searchQuery) {
      const filtered = reports.filter(report =>
        report.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredReports(filtered);
    } else {
      setFilteredReports(reports);
    }
  }, [reports, searchQuery]);

  const handleDelete = (id: string, title: string) => {
    if (confirm(`"${title}" 보고서를 정말로 삭제하시겠습니까?`)) {
      onDelete(id);
    }
  };

  const getTypeIcon = (type: string) => {
    return type === 'daily' ? (
      <FileText className="h-4 w-4 text-blue-600" />
    ) : (
      <BarChart3 className="h-4 w-4 text-green-600" />
    );
  };

  const getTypeLabel = (type: string) => {
    return type === 'daily' ? '운행보고서' : '월간보고서';
  };

  const getTypeBadgeColor = (type: string) => {
    return type === 'daily'
      ? 'bg-blue-100 text-blue-800 border-blue-300'
      : 'bg-green-100 text-green-800 border-green-300';
  };

  // 🔥 차량 정보 표시 함수 추가
  const getVehicleInfo = (report: SavedReport) => {
    if (report.type !== 'daily' || !report.settings) return null;

    const vehicleId = report.settings.vehicleId;
    if (vehicleId === 'all') {
      return <Badge variant="outline" className="bg-gray-50 text-gray-700 text-xs">전체 차량</Badge>;
    }

    const vehicle = vehicles.find(v => v.id === vehicleId);
    if (vehicle) {
      return (
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
          <Car className="h-3 w-3 mr-1" />
          {vehicle.licensePlate}{vehicle.name ? ` (${vehicle.name})` : ''}
        </Badge>
      );
    }

    return null;
  };

  // 🔥 장소 필터 정보 표시 함수 추가
  const getLocationFilters = (report: SavedReport) => {
    if (report.type !== 'daily' || !report.settings) return null;

    const filters = [];

    if (report.settings.departureFilter) {
      filters.push(
        <Badge key="departure" variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
          <MapPin className="h-3 w-3 mr-1" />
          출발: {report.settings.departureFilter}
        </Badge>
      );
    }

    if (report.settings.destinationFilter) {
      filters.push(
        <Badge key="destination" variant="outline" className="bg-red-50 text-red-700 border-red-200 text-xs">
          <MapPin className="h-3 w-3 mr-1" />
          목적: {report.settings.destinationFilter}
        </Badge>
      );
    }

    return filters.length > 0 ? filters : null;
  };

  if (loading) {
    return (
      <div className="text-center py-8 text-gray-500">
        보고서를 불러오는 중입니다...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 검색 */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="보고서 제목으로 검색..."
          className="pl-10"
        />
      </div>

      {/* 보고서 목록 */}
      {filteredReports.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          {searchQuery ? '검색 결과가 없습니다.' : '저장된 보고서가 없습니다.'}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredReports.map((report) => (
            <Card key={report.id} className="hover:bg-gray-50 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {getTypeIcon(report.type)}
                      <h3
                        className="font-medium cursor-pointer hover:text-blue-600 transition-colors"
                        onClick={() => onView(report)}
                      >
                        {report.title}
                      </h3>
                    </div>

                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <Badge className={`${getTypeBadgeColor(report.type)} px-2 py-1`}>
                        {getTypeLabel(report.type)}
                      </Badge>

                      {/* 🔥 차량 정보 표시 */}
                      {getVehicleInfo(report)}

                      {/* 🔥 장소 필터 정보 표시 */}
                      {getLocationFilters(report)}

                      {report.settings?.startDate && report.settings?.endDate && (
                        <Badge variant="outline" className="text-xs">
                          {format(new Date(report.settings.startDate), 'yyyy.MM.dd')} ~
                          {format(new Date(report.settings.endDate), 'MM.dd')}
                        </Badge>
                      )}
                    </div>

                    <div className="text-sm text-gray-500">
                      생성: {format(new Date(report.created_at), 'yyyy.MM.dd HH:mm')}
                    </div>
                  </div>

                  {/* 액션 버튼 */}
                  <div className="flex gap-2 ml-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onView(report)}
                      className="text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                      title="보기"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(report)}
                      className="text-green-500 hover:text-green-700 hover:bg-green-50"
                      title="보기 및 편집"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(report.id, report.title)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      title="삭제"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReportList;