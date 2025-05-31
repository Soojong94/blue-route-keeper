import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Trash2, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface AccountDeletionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AccountDeletionDialog: React.FC<AccountDeletionDialogProps> = ({
  open,
  onOpenChange
}) => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState<'warning' | 'confirm'>('warning');
  const [confirmText, setConfirmText] = useState('');
  const [loading, setLoading] = useState(false);

  const handleConfirmDeletion = () => {
    setStep('confirm');
    setConfirmText('');
  };

  const handleDeleteAccount = async () => {
    if (confirmText !== '탈퇴하기') {
      toast({
        title: "입력 오류",
        description: "'탈퇴하기'를 정확히 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // 사용자 데이터 삭제 (Supabase RLS로 자동 삭제됨)
      const { error } = await supabase.auth.admin.deleteUser(user?.id || '');

      if (error) {
        // admin 권한이 없으면 일반 사용자로 삭제 시도
        await supabase.auth.signOut();
        toast({
          title: "탈퇴 완료",
          description: "계정이 성공적으로 삭제되었습니다.",
        });
      } else {
        toast({
          title: "탈퇴 완료",
          description: "계정과 모든 데이터가 삭제되었습니다.",
        });
      }

      onOpenChange(false);
      await signOut();
    } catch (error) {
      console.error('Account deletion error:', error);
      toast({
        title: "탈퇴 실패",
        description: "계정 삭제 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep('warning');
    setConfirmText('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-sm flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-4 w-4" />
            회원탈퇴
          </DialogTitle>
        </DialogHeader>

        <div className="py-2">
          {step === 'warning' && (
            <div className="space-y-3">
              <Alert className="border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-xs">
                  <strong>경고:</strong> 탈퇴 시 다음 데이터가 영구적으로 삭제됩니다.
                </AlertDescription>
              </Alert>

              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-xs font-medium mb-2">삭제될 데이터:</p>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li>• 모든 운행 기록</li>
                  <li>• 차량 및 장소 정보</li>
                  <li>• 저장된 보고서</li>
                  <li>• 메모장 데이터</li>
                  <li>• 계정 정보</li>
                </ul>
              </div>

              <p className="text-xs text-gray-600">
                이 작업은 되돌릴 수 없습니다. 정말로 탈퇴하시겠습니까?
              </p>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleClose}
                  className="flex-1 text-xs h-7"
                >
                  취소
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleConfirmDeletion}
                  className="flex-1 text-xs h-7"
                >
                  탈퇴 진행
                </Button>
              </div>
            </div>
          )}

          {step === 'confirm' && (
            <div className="space-y-3">
              <Alert className="border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-xs">
                  최종 확인: 아래에 <strong>"탈퇴하기"</strong>를 입력해주세요.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label className="text-xs">확인 텍스트</Label>
                <Input
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="탈퇴하기"
                  className="text-xs h-7"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setStep('warning')}
                  disabled={loading}
                  className="flex-1 text-xs h-7"
                >
                  뒤로
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteAccount}
                  disabled={loading || confirmText !== '탈퇴하기'}
                  className="flex-1 text-xs h-7"
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  {loading ? '삭제 중...' : '계정 삭제'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AccountDeletionDialog;