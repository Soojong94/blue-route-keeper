
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Pencil, Trash2, Plus, MapPin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getLocations, deleteLocation } from '@/utils/locationStorage';
import { Location } from '@/types/trip';
import LocationForm from './LocationForm';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

const LocationManagement: React.FC = () => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [locationToEdit, setLocationToEdit] = useState<Location | undefined>(undefined);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    loadLocations();
  }, [refreshTrigger]);

  const loadLocations = () => {
    const allLocations = getLocations();
    setLocations(allLocations);
  };

  const handleDeleteLocation = (id: string) => {
    try {
      deleteLocation(id);
      loadLocations();
      toast({
        title: "삭제 완료",
        description: "장소가 삭제되었습니다.",
      });
    } catch (error) {
      toast({
        title: "삭제 실패",
        description: "장소 삭제 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  const handleEditClick = (location: Location) => {
    setLocationToEdit(location);
    setIsDialogOpen(true);
  };

  const handleAddNew = () => {
    setLocationToEdit(undefined);
    setIsDialogOpen(true);
  };

  const handleLocationSaved = () => {
    setIsDialogOpen(false);
    setRefreshTrigger(prev => prev + 1);
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'company':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">회사</Badge>;
      case 'client':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">고객사</Badge>;
      case 'personal':
        return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">개인</Badge>;
      default:
        return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">기타</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'departure':
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">출발지</Badge>;
      case 'destination':
        return <Badge variant="outline" className="bg-cyan-50 text-cyan-700 border-cyan-200">도착지</Badge>;
      case 'both':
        return <Badge variant="outline" className="bg-pink-50 text-pink-700 border-pink-200">모두</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      <Card>
        <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-t-lg">
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            장소 관리
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex justify-end mb-4">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  onClick={handleAddNew}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                >
                  <Plus className="mr-1 h-4 w-4" /> 새 장소 등록
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    {locationToEdit ? '장소 정보 수정' : '새 장소 등록'}
                  </DialogTitle>
                </DialogHeader>
                <LocationForm 
                  onLocationSaved={handleLocationSaved} 
                  locationToEdit={locationToEdit}
                  onCancel={() => setIsDialogOpen(false)}
                />
              </DialogContent>
            </Dialog>
          </div>

          {locations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              등록된 장소가 없습니다. 위의 '새 장소 등록' 버튼을 클릭하여 장소를 추가하세요.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>장소명</TableHead>
                    <TableHead>별칭</TableHead>
                    <TableHead>카테고리</TableHead>
                    <TableHead>유형</TableHead>
                    <TableHead>등록일</TableHead>
                    <TableHead className="text-right">관리</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {locations.map((location) => (
                    <TableRow key={location.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">{location.name}</TableCell>
                      <TableCell>{location.alias || '-'}</TableCell>
                      <TableCell>{getCategoryBadge(location.category)}</TableCell>
                      <TableCell>{getTypeBadge(location.type)}</TableCell>
                      <TableCell>
                        {format(new Date(location.createdAt), 'yyyy-MM-dd', { locale: ko })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditClick(location)}
                            className="h-8 w-8 p-0 text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteLocation(location.id)}
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LocationManagement;
