import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Mail, Lock, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface ProfileSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ProfileSettingsDialog: React.FC<ProfileSettingsDialogProps> = ({
  open,
  onOpenChange
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    if (user && open) {
      setFormData(prev => ({
        ...prev,
        fullName: user.user_metadata?.full_name || user.user_metadata?.name || '',
        email: user.email || ''
      }));
    }
  }, [user, open]);

  const handleUpdateProfile = async () => {
    if (!formData.fullName.trim()) {
      toast({
        title: "입력 오류",
        description: "이름을 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: { full_name: formData.fullName }
      });

      if (error) throw error;

      toast({
        title: "프로필 업데이트 완료",
        description: "프로필 정보가 성공적으로 업데이트되었습니다.",
      });
    } catch (error) {
      console.error('Profile update error:', error);
      toast({
        title: "업데이트 실패",
        description: "프로필 업데이트 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!formData.newPassword || formData.newPassword.length < 6) {
      toast({
        title: "비밀번호 오류",
        description: "새 비밀번호는 6자 이상이어야 합니다.",
        variant: "destructive",
      });
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      toast({
        title: "비밀번호 불일치",
        description: "새 비밀번호와 확인 비밀번호가 일치하지 않습니다.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: formData.newPassword
      });

      if (error) throw error;

      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));

      toast({
        title: "비밀번호 변경 완료",
        description: "비밀번호가 성공적으로 변경되었습니다.",
      });
    } catch (error) {
      console.error('Password change error:', error);
      toast({
        title: "비밀번호 변경 실패",
        description: "비밀번호 변경 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-sm flex items-center gap-2">
            <User className="h-4 w-4" />
            프로필 설정
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {/* 기본 정보 */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs flex items-center gap-2">
                <User className="h-3 w-3" />
                기본 정보
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs">이름</Label>
                <Input
                  value={formData.fullName}
                  onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                  placeholder="이름을 입력하세요"
                  className="text-xs h-7"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">이메일</Label>
                <Input
                  value={formData.email}
                  disabled
                  className="text-xs h-7 bg-gray-50"
                />
                <p className="text-[10px] text-gray-500">이메일은 변경할 수 없습니다.</p>
              </div>
              <Button
                onClick={handleUpdateProfile}
                disabled={loading}
                className="w-full text-xs h-7"
              >
                <Save className="h-3 w-3 mr-1" />
                {loading ? '저장 중...' : '정보 저장'}
              </Button>
            </CardContent>
          </Card>

          {/* 비밀번호 변경 */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs flex items-center gap-2">
                <Lock className="h-3 w-3" />
                비밀번호 변경
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs">새 비밀번호</Label>
                <Input
                  type="password"
                  value={formData.newPassword}
                  onChange={(e) => setFormData(prev => ({ ...prev, newPassword: e.target.value }))}
                  placeholder="새 비밀번호 (6자 이상)"
                  className="text-xs h-7"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">비밀번호 확인</Label>
                <Input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  placeholder="새 비밀번호 확인"
                  className="text-xs h-7"
                />
              </div>
              <Button
                onClick={handleChangePassword}
                disabled={loading || !formData.newPassword}
                className="w-full text-xs h-7"
                variant="outline"
              >
                <Lock className="h-3 w-3 mr-1" />
                {loading ? '변경 중...' : '비밀번호 변경'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileSettingsDialog;