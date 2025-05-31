// src/components/profile/DataManagementDialog.tsx
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Database,
  Trash2,
  AlertTriangle,
  FileText,
  Car,
  MapPin,
  Edit3,
  RefreshCw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import {
  getTrips,
  getVehicles,
  getLocations
} from '@/utils/storage';
import {
  getReports
} from '@/utils/reportStorage';
import {
  getNotes
} from '@/utils/noteStorage';

interface DataManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface DataCounts {
  trips: number;
  vehicles: number;
  locations: number;
  reports: number;
  notes: number;
}

const DataManagementDialog: React.FC<DataManagementDialogProps> = ({
  open,
  onOpenChange
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [dataCounts, setDataCounts] = useState<DataCounts>({
    trips: 0,
    vehicles: 0,
    locations: 0,
    reports: 0,
    notes: 0
  });
  const [deletingCategory, setDeletingCategory] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      loadDataCounts();
    }
  }, [open]);

  const loadDataCounts = async () => {
    try {
      setLoading(true);
      const [trips, vehicles, locations, reports, notes] = await Promise.all([
        getTrips(),
        getVehicles(),
        getLocations(),
        getReports(),
        getNotes()
      ]);

      setDataCounts({
        trips: trips.length,
        vehicles: vehicles.length,
        locations: locations.length,
        reports: reports.length,
        notes: notes.length
      });
    } catch (error) {
      console.error('Error loading data counts:', error);
      toast({
        title: "데이터 로드 실패",
        description: "데이터 개수를 불러오는 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteAllTrips = async () => {
    if (!user) return;

    const confirmed = confirm(
      `정말로 모든 운행 기록(${dataCounts.trips}건)을 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.`
    );

    if (!confirmed) return;

    try {
      setDeletingCategory('trips');
      const { error } = await supabase
        .from('trips')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "삭제 완료",
        description: "모든 운행 기록이 삭제되었습니다.",
      });

      await loadDataCounts();
    } catch (error) {
      console.error('Error deleting trips:', error);
      toast({
        title: "삭제 실패",
        description: "운행 기록 삭제 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setDeletingCategory(null);
    }
  };

  const deleteAllVehicles = async () => {
    if (!user) return;

    const confirmed = confirm(
      `정말로 모든 차량(${dataCounts.vehicles}대)을 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.`
    );

    if (!confirmed) return;

    try {
      setDeletingCategory('vehicles');
      const { error } = await supabase
        .from('vehicles')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "삭제 완료",
        description: "모든 차량이 삭제되었습니다.",
      });

      await loadDataCounts();
    } catch (error) {
      console.error('Error deleting vehicles:', error);
      toast({
        title: "삭제 실패",
        description: "차량 삭제 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setDeletingCategory(null);
    }
  };

  const deleteAllLocations = async () => {
    if (!user) return;

    const confirmed = confirm(
      `정말로 모든 장소(${dataCounts.locations}개)를 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.`
    );

    if (!confirmed) return;

    try {
      setDeletingCategory('locations');
      const { error } = await supabase
        .from('locations')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "삭제 완료",
        description: "모든 장소가 삭제되었습니다.",
      });

      await loadDataCounts();
    } catch (error) {
      console.error('Error deleting locations:', error);
      toast({
        title: "삭제 실패",
        description: "장소 삭제 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setDeletingCategory(null);
    }
  };

  const deleteAllReports = async () => {
    if (!user) return;

    const confirmed = confirm(
      `정말로 모든 보고서(${dataCounts.reports}개)를 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.`
    );

    if (!confirmed) return;

    try {
      setDeletingCategory('reports');
      const { error } = await supabase
        .from('reports')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "삭제 완료",
        description: "모든 보고서가 삭제되었습니다.",
      });

      await loadDataCounts();
    } catch (error) {
      console.error('Error deleting reports:', error);
      toast({
        title: "삭제 실패",
        description: "보고서 삭제 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setDeletingCategory(null);
    }
  };

  const deleteAllNotes = async () => {
    if (!user) return;

    const confirmed = confirm(
      `정말로 모든 메모(${dataCounts.notes}개)를 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.`
    );

    if (!confirmed) return;

    try {
      setDeletingCategory('notes');
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "삭제 완료",
        description: "모든 메모가 삭제되었습니다.",
      });

      await loadDataCounts();
    } catch (error) {
      console.error('Error deleting notes:', error);
      toast({
        title: "삭제 실패",
        description: "메모 삭제 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setDeletingCategory(null);
    }
  };

  const deleteAllData = async () => {
    if (!user) return;

    const totalItems = Object.values(dataCounts).reduce((sum, count) => sum + count, 0);

    const confirmed = confirm(
      `정말로 모든 데이터를 삭제하시겠습니까?\n\n삭제될 데이터:\n- 운행 기록: ${dataCounts.trips}건\n- 차량: ${dataCounts.vehicles}대\n- 장소: ${dataCounts.locations}개\n- 보고서: ${dataCounts.reports}개\n- 메모: ${dataCounts.notes}개\n\n총 ${totalItems}개 항목이 삭제됩니다.\n\n이 작업은 되돌릴 수 없습니다.`
    );

    if (!confirmed) return;

    try {
      setDeletingCategory('all');

      // 모든 테이블에서 사용자 데이터 삭제
      await Promise.all([
        supabase.from('trips').delete().eq('user_id', user.id),
        supabase.from('vehicles').delete().eq('user_id', user.id),
        supabase.from('locations').delete().eq('user_id', user.id),
        supabase.from('reports').delete().eq('user_id', user.id),
        supabase.from('notes').delete().eq('user_id', user.id)
      ]);

      toast({
        title: "전체 삭제 완료",
        description: "모든 데이터가 삭제되었습니다.",
      });

      await loadDataCounts();
    } catch (error) {
      console.error('Error deleting all data:', error);
      toast({
        title: "삭제 실패",
        description: "데이터 삭제 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setDeletingCategory(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-sm flex items-center gap-2 text-red-600">
            <Database className="h-4 w-4" />
            데이터 관리
          </DialogTitle>
        </DialogHeader>

        <div className="py-2">
          <Alert className="border-amber-200 bg-amber-50 mb-4">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-xs">
              <strong>주의:</strong> 삭제된 데이터는 복구할 수 없습니다. 신중하게 선택해주세요.
            </AlertDescription>
          </Alert>

          {/* 새로고침 버튼 */}
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-medium">현재 저장된 데이터</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={loadDataCounts}
              disabled={loading}
              className="text-xs h-7"
            >
              <RefreshCw className={`h-3 w-3 mr-1 ${loading ? 'animate-spin' : ''}`} />
              새로고침
            </Button>
          </div>

          {/* 데이터 카테고리별 카드 */}
          <div className="space-y-3">
            {/* 운행 기록 */}
            <Card className="border-blue-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Car className="h-3 w-3 text-blue-600" />
                    운행 기록
                  </div>
                  <Badge variant="outline" className="bg-blue-50 text-blue-700">
                    {dataCounts.trips}건
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex justify-between items-center">
                  <p className="text-xs text-gray-600">
                    모든 차량 운행 기록이 삭제됩니다
                  </p>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={deleteAllTrips}
                    disabled={dataCounts.trips === 0 || deletingCategory !== null}
                    className="text-xs h-6"
                  >
                    {deletingCategory === 'trips' ? (
                      <>삭제 중...</>
                    ) : (
                      <>
                        <Trash2 className="h-3 w-3 mr-1" />
                        전체 삭제
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* 차량 */}
            <Card className="border-green-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Car className="h-3 w-3 text-green-600" />
                    차량
                  </div>
                  <Badge variant="outline" className="bg-green-50 text-green-700">
                    {dataCounts.vehicles}대
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex justify-between items-center">
                  <p className="text-xs text-gray-600">
                    등록된 모든 차량 정보가 삭제됩니다
                  </p>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={deleteAllVehicles}
                    disabled={dataCounts.vehicles === 0 || deletingCategory !== null}
                    className="text-xs h-6"
                  >
                    {deletingCategory === 'vehicles' ? (
                      <>삭제 중...</>
                    ) : (
                      <>
                        <Trash2 className="h-3 w-3 mr-1" />
                        전체 삭제
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* 장소 */}
            <Card className="border-purple-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3 w-3 text-purple-600" />
                    장소
                  </div>
                  <Badge variant="outline" className="bg-purple-50 text-purple-700">
                    {dataCounts.locations}개
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex justify-between items-center">
                  <p className="text-xs text-gray-600">
                    등록된 모든 장소 정보가 삭제됩니다
                  </p>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={deleteAllLocations}
                    disabled={dataCounts.locations === 0 || deletingCategory !== null}
                    className="text-xs h-6"
                  >
                    {deletingCategory === 'locations' ? (
                      <>삭제 중...</>
                    ) : (
                      <>
                        <Trash2 className="h-3 w-3 mr-1" />
                        전체 삭제
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* 보고서 */}
            <Card className="border-orange-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-3 w-3 text-orange-600" />
                    보고서
                  </div>
                  <Badge variant="outline" className="bg-orange-50 text-orange-700">
                    {dataCounts.reports}개
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex justify-between items-center">
                  <p className="text-xs text-gray-600">
                    저장된 모든 보고서가 삭제됩니다
                  </p>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={deleteAllReports}
                    disabled={dataCounts.reports === 0 || deletingCategory !== null}
                    className="text-xs h-6"
                  >
                    {deletingCategory === 'reports' ? (
                      <>삭제 중...</>
                    ) : (
                      <>
                        <Trash2 className="h-3 w-3 mr-1" />
                        전체 삭제
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* 메모 */}
            <Card className="border-indigo-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Edit3 className="h-3 w-3 text-indigo-600" />
                    메모
                  </div>
                  <Badge variant="outline" className="bg-indigo-50 text-indigo-700">
                    {dataCounts.notes}개
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex justify-between items-center">
                  <p className="text-xs text-gray-600">
                    저장된 모든 메모가 삭제됩니다
                  </p>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={deleteAllNotes}
                    disabled={dataCounts.notes === 0 || deletingCategory !== null}
                    className="text-xs h-6"
                  >
                    {deletingCategory === 'notes' ? (
                      <>삭제 중...</>
                    ) : (
                      <>
                        <Trash2 className="h-3 w-3 mr-1" />
                        전체 삭제
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 전체 삭제 버튼 */}
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-red-800">모든 데이터 삭제</h4>
                <p className="text-xs text-red-600 mt-1">
                  위의 모든 카테고리 데이터를 한번에 삭제합니다
                </p>
              </div>
              <Button
                variant="destructive"
                onClick={deleteAllData}
                disabled={Object.values(dataCounts).every(count => count === 0) || deletingCategory !== null}
                className="text-xs"
              >
                {deletingCategory === 'all' ? (
                  <>전체 삭제 중...</>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    모든 데이터 삭제
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* 닫기 버튼 */}
          <div className="flex justify-end mt-6">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="text-xs h-7"
            >
              닫기
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DataManagementDialog;