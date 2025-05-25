// src/components/LocationManagement.tsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { MapPin, Plus, Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { getLocations, saveLocation, updateLocation, deleteLocation } from '@/utils/storage';
import { Location } from '@/types/trip';

const LocationManagement: React.FC = () => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    category: 'company' as 'company' | 'client' | 'personal' | 'other',
  });

  const { toast } = useToast();

  useEffect(() => {
    loadLocations();
  }, []);

  const loadLocations = () => {
    setLocations(getLocations());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name) {
      toast({
        title: "입력 오류",
        description: "장소명은 필수 입력항목입니다.",
        variant: "destructive",
      });
      return;
    }

    try {
      const locationData = {
        name: formData.name,
        category: formData.category,
      };

      if (editingLocation) {
        updateLocation(editingLocation.id, locationData);
        toast({
          title: "수정 완료",
          description: "장소 정보가 수정되었습니다.",
        });
      } else {
        saveLocation(locationData);
        toast({
          title: "등록 완료",
          description: "장소가 등록되었습니다.",
        });
      }

      resetForm();
      setIsDialogOpen(false);
      loadLocations();
    } catch (error) {
      toast({
        title: "저장 실패",
        description: "장소 정보 저장 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (location: Location) => {
    setEditingLocation(location);
    setFormData({
      name: location.name,
      category: location.category,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('정말로 이 장소를 삭제하시겠습니까?')) {
      try {
        deleteLocation(id);
        toast({
          title: "삭제 완료",
          description: "장소가 삭제되었습니다.",
        });
        loadLocations();
      } catch (error) {
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
      category: 'company',
    });
    setEditingLocation(null);
  };

  const handleAddNew = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const getCategoryBadge = (category: string) => {
    const variants = {
      company: { className: 'bg-blue-50 text-blue-700 border-blue-200', label: '회사' },
      client: { className: 'bg-green-50 text-green-700 border-green-200', label: '고객사' },
      personal: { className: 'bg-purple-50 text-purple-700 border-purple-200', label: '개인' },
      other: { className: 'bg-gray-50 text-gray-700 border-gray-200', label: '기타' },
    };
    const variant = variants[category as keyof typeof variants] || variants.other;
    return (
      <Badge variant="outline" className={variant.className}>
        {variant.label}
      </Badge>
    );
  };

  return (
    <div className="w-full max-w-6xl mx-auto">
      <Card>
        <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            장소 관리
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex justify-end mb-4">
            <Button onClick={handleAddNew} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="mr-2 h-4 w-4" />
              장소 등록
            </Button>
          </div>

          {locations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              등록된 장소가 없습니다. 자주 사용하는 장소를 등록해주세요.
            </div>
          ) : (
            <>
              {/* 데스크톱 테이블 */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>장소명</TableHead>
                      <TableHead>카테고리</TableHead>
                      <TableHead>등록일</TableHead>
                      <TableHead className="text-center">관리</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {locations.map((location) => (
                      <TableRow key={location.id} className="hover:bg-gray-50">
                        <TableCell className="font-medium">{location.name}</TableCell>
                        <TableCell>{getCategoryBadge(location.category)}</TableCell>
                        <TableCell className="text-gray-500">
                          {format(new Date(location.createdAt), 'yyyy-MM-dd', { locale: ko })}
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(location)}
                              className="h-8 w-8 p-0 text-blue-500 hover:text-blue-700"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(location.id)}
                              className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
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

              {/* 모바일 카드 뷰 */}
              <div className="md:hidden space-y-4">
                {locations.map((location) => (
                  <Card key={location.id} className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-medium text-lg">{location.name}</h3>
                        <div className="mt-2">
                          {getCategoryBadge(location.category)}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(location)}
                          className="h-8 w-8 p-0 text-blue-500 hover:text-blue-700"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(location.id)}
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      등록일: {format(new Date(location.createdAt), 'yyyy-MM-dd', { locale: ko })}
                    </div>
                  </Card>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* 장소 등록/수정 다이얼로그 */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingLocation ? '장소 정보 수정' : '새 장소 등록'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">장소명 (필수)</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="예: 서울시청, 강남역"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">카테고리</Label>
              <Select
                value={formData.category}
                onValueChange={(value: 'company' | 'client' | 'personal' | 'other') =>
                  setFormData({ ...formData, category: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="company">회사</SelectItem>
                  <SelectItem value="client">고객사</SelectItem>
                  <SelectItem value="personal">개인</SelectItem>
                  <SelectItem value="other">기타</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsDialogOpen(false);
                  resetForm();
                }}
              >
                취소
              </Button>
              <Button type="submit">
                {editingLocation ? '수정' : '등록'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LocationManagement;