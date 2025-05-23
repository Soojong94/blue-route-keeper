
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { MapPin } from 'lucide-react';
import { saveLocation, updateLocation } from '@/utils/locationStorage';
import { useToast } from '@/hooks/use-toast';
import { Location } from '@/types/trip';

interface LocationFormProps {
  onLocationSaved: () => void;
  locationToEdit?: Location;
  onCancel?: () => void;
}

const LocationForm: React.FC<LocationFormProps> = ({ 
  onLocationSaved, 
  locationToEdit,
  onCancel
}) => {
  const [name, setName] = useState('');
  const [alias, setAlias] = useState('');
  const [category, setCategory] = useState<'company' | 'client' | 'personal' | 'other'>('company');
  const [type, setType] = useState<'departure' | 'destination' | 'both'>('both');
  const { toast } = useToast();

  // Load location data if editing
  useEffect(() => {
    if (locationToEdit) {
      setName(locationToEdit.name);
      setAlias(locationToEdit.alias || '');
      setCategory(locationToEdit.category);
      setType(locationToEdit.type);
    }
  }, [locationToEdit]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name) {
      toast({
        title: "입력 오류",
        description: "장소명은 필수 입력항목입니다.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (locationToEdit) {
        updateLocation(locationToEdit.id, { 
          name, 
          alias: alias || undefined,
          category, 
          type 
        });
        toast({
          title: "장소 정보 수정",
          description: "장소 정보가 성공적으로 수정되었습니다.",
        });
      } else {
        saveLocation({ 
          name, 
          alias: alias || undefined,
          category,
          type
        });
        toast({
          title: "장소 등록",
          description: "장소가 성공적으로 등록되었습니다.",
        });
      }

      // Reset form
      setName('');
      setAlias('');
      setCategory('company');
      setType('both');
      
      onLocationSaved();
    } catch (error) {
      toast({
        title: "저장 실패",
        description: "장소 정보 저장 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-t-lg">
        <CardTitle className="text-xl font-bold flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          {locationToEdit ? '장소 정보 수정' : '새 장소 등록'}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium text-gray-700">
              장소명 (필수)
            </Label>
            <Input
              id="name"
              type="text"
              placeholder="장소명을 입력하세요"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="alias" className="text-sm font-medium text-gray-700">
              별칭 (선택)
            </Label>
            <Input
              id="alias"
              type="text"
              placeholder="별칭을 입력하세요 (예: 본사, 지점A)"
              value={alias}
              onChange={(e) => setAlias(e.target.value)}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category" className="text-sm font-medium text-gray-700">
              카테고리
            </Label>
            <Select value={category} onValueChange={(value: 'company' | 'client' | 'personal' | 'other') => setCategory(value)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="카테고리 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="company">회사</SelectItem>
                <SelectItem value="client">고객사</SelectItem>
                <SelectItem value="personal">개인</SelectItem>
                <SelectItem value="other">기타</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">
              장소 유형
            </Label>
            <RadioGroup value={type} onValueChange={(value: 'departure' | 'destination' | 'both') => setType(value)} className="flex space-x-4">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="departure" id="r1" />
                <Label htmlFor="r1" className="cursor-pointer">출발지</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="destination" id="r2" />
                <Label htmlFor="r2" className="cursor-pointer">도착지</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="both" id="r3" />
                <Label htmlFor="r3" className="cursor-pointer">모두</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="flex gap-2 pt-2">
            <Button 
              type="submit" 
              className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
            >
              {locationToEdit ? '수정' : '등록'}
            </Button>
            
            {onCancel && (
              <Button 
                type="button"
                variant="outline"
                onClick={onCancel}
                className="flex-1"
              >
                취소
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default LocationForm;
