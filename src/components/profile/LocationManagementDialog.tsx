import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Plus, Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { getLocations, saveLocation, updateLocation, deleteLocation } from '@/utils/storage';
import { Location } from '@/types/trip';
import SmartInput, { SearchResult } from '@/components/SmartInput';
import { searchLocations, addRecentLocation, getRecentLocations } from '@/utils/smartSearch';

interface LocationManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const LocationManagementDialog: React.FC<LocationManagementDialogProps> = ({
  open,
  onOpenChange
}) => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredLocations, setFilteredLocations] = useState<Location[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [formData, setFormData] = useState({
    name: '',
    category: 'other' as 'company' | 'client' | 'personal' | 'other',
  });

  const { toast } = useToast();

  const categoryLabels = {
    all: '전체',
    company: '회사',
    client: '고객사',
    personal: '개인',
    other: '기타'
  };

  useEffect(() => {
    if (open) {
      loadLocations();
    }
  }, [open]);

  useEffect(() => {
    let filtered = locations;

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(location => location.category === selectedCategory);
    }

    if (searchQuery) {
      filtered = filtered.filter(location =>
        location.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredLocations(filtered);
  }, [locations, searchQuery, selectedCategory]);

  const getFavoriteLocations = (): SearchResult[] => {
    return locations.map(location => ({
      id: `fav-location-${location.id}`,
      value: location.name,
      label: location.name,
      type: 'favorite',
      category: 'location',
      metadata: {
        locationId: location.id,
        location,
        category: categoryLabels[location.category]
      }
    }));
  };

  const handleSearchSelect = (result: SearchResult) => {
    setSearchQuery(result.value);
    addRecentLocation(result.value);
  };

  const loadLocations = async () => {
    try {
      const locationsData = await getLocations();
      setLocations(locationsData);
    } catch (error) {
      console.error('Error loading locations:', error);
      toast({
        title: "로드 실패",
        description: "장소 목록을 불러오는 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name) {
      toast({
        title: "입력 오류",
        description: "장소명은 필수 입력항목입니다.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      if (editingLocation) {
        await updateLocation(editingLocation.id, formData);
        toast({
          title: "수정 완료",
          description: "장소 정보가 수정되었습니다.",
        });
      } else {
        await saveLocation(formData);
        toast({
          title: "등록 완료",
          description: "장소가 등록되었습니다.",
        });
      }

      resetForm();
      setIsEditDialogOpen(false);
      await loadLocations();
    } catch (error) {
      console.error('Save location error:', error);
      toast({
        title: "저장 실패",
        description: "장소 정보 저장 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (location: Location) => {
    setEditingLocation(location);
    setFormData({
      name: location.name,
      category: location.category,
    });
    setIsEditDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('정말로 이 장소를 삭제하시겠습니까?')) {
      try {
        await deleteLocation(id);
        toast({
          title: "삭제 완료",
          description: "장소가 삭제되었습니다.",
        });
        await loadLocations();
      } catch (error) {
        console.error('Delete location error:', error);
        toast({
          title: "삭제 실패",
          description: "장소 삭제 중 오류가 발생했습니다.",
          variant: "destructive",
        });
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category: 'other',
    });
    setEditingLocation(null);
  };

  const handleAddNew = () => {
    resetForm();
    setIsEditDialogOpen(true);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-sm flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              장소 관리
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="flex flex-col sm:flex-row justify-between gap-2">
              <div className="flex gap-2 flex-1">
                <div className="flex-1 max-w-xs">
                  <SmartInput
                    value={searchQuery}
                    onChange={setSearchQuery}
                    onSelect={handleSearchSelect}
                    placeholder="장소명으로 검색..."
                    className="text-xs h-7"
                    searchFunction={searchLocations}
                    recentItems={getRecentLocations()}
                    favoriteItems={getFavoriteLocations()}
                    debounceMs={300}
                  />
                </div>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-24 text-xs h-7">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(categoryLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key} className="text-xs">
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={handleAddNew} className="text-xs h-7 px-3">
                <Plus className="mr-1 h-3 w-3" />
                장소 등록
              </Button>
            </div>

            {filteredLocations.length === 0 ? (
              <div className="text-center py-6 text-gray-500 text-xs">
                {searchQuery || selectedCategory !== 'all' ? '검색 결과가 없습니다.' : '등록된 장소가 없습니다.'}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredLocations.map((location) => (
                  <LocationCard
                    key={location.id}
                    location={location}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* 장소 등록/수정 다이얼로그 */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm">
              {editingLocation ? '장소 정보 수정' : '새 장소 등록'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3 py-2">
            <div className="space-y-1">
              <Label className="text-xs">장소명 (필수)</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="예: 서울역, 고객사 A"
                className="text-xs h-7"
                required
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">카테고리</Label>
              <Select value={formData.category} onValueChange={(value: any) => setFormData({ ...formData, category: value })}>
                <SelectTrigger className="text-xs h-7">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="company" className="text-xs">회사</SelectItem>
                  <SelectItem value="client" className="text-xs">고객사</SelectItem>
                  <SelectItem value="personal" className="text-xs">개인</SelectItem>
                  <SelectItem value="other" className="text-xs">기타</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsEditDialogOpen(false);
                  resetForm();
                }}
                className="flex-1 text-xs h-7"
                disabled={loading}
              >
                취소
              </Button>
              <Button type="submit" className="flex-1 text-xs h-7" disabled={loading}>
                {loading ? '저장 중...' : (editingLocation ? '수정' : '등록')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

const LocationCard: React.FC<{
  location: Location;
  onEdit: (location: Location) => void;
  onDelete: (id: string) => void;
}> = ({ location, onEdit, onDelete }) => {
  const categoryColors = {
    company: 'bg-blue-100 text-blue-800 border-blue-300',
    client: 'bg-green-100 text-green-800 border-green-300',
    personal: 'bg-purple-100 text-purple-800 border-purple-300',
    other: 'bg-gray-100 text-gray-800 border-gray-300'
  };

  const categoryLabels = {
    company: '회사',
    client: '고객사',
    personal: '개인',
    other: '기타'
  };

  return (
    <Card className="p-3">
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1">
          <h3 className="text-xs font-medium mb-1">{location.name}</h3>
          <Badge className={`${categoryColors[location.category]} text-xs px-2 py-0.5`}>
            {categoryLabels[location.category]}
          </Badge>
        </div>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(location)}
            className="h-6 w-6 p-0 text-blue-500 hover:text-blue-700"
          >
            <Edit className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(location.id)}
            className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      <div className="text-[10px] text-gray-500">
        등록일: {format(new Date(location.createdAt), 'yyyy-MM-dd', { locale: ko })}
      </div>
    </Card>
  );
};

export default LocationManagementDialog;