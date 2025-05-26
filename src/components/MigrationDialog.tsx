
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, AlertCircle, Upload } from 'lucide-react';
import { migrateLocalStorageToSupabase } from '@/utils/supabaseStorage';
import { useToast } from '@/hooks/use-toast';

interface MigrationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMigrationComplete: () => void;
}

const MigrationDialog: React.FC<MigrationDialogProps> = ({
  open,
  onOpenChange,
  onMigrationComplete,
}) => {
  const [ismigrating, setIsMigrating] = useState(false);
  const [migrationComplete, setMigrationComplete] = useState(false);
  const [migrationResults, setMigrationResults] = useState<{
    trips: number;
    vehicles: number;
    locations: number;
  } | null>(null);
  const { toast } = useToast();

  const handleMigration = async () => {
    setIsMigrating(true);
    try {
      const results = await migrateLocalStorageToSupabase();
      setMigrationResults(results);
      setMigrationComplete(true);
      
      toast({
        title: "마이그레이션 완료",
        description: `${results.trips}개 운행기록, ${results.vehicles}개 차량, ${results.locations}개 장소가 이전되었습니다.`,
      });
      
      // Clear localStorage after successful migration
      localStorage.removeItem('car-trips');
      localStorage.removeItem('car-vehicles');
      localStorage.removeItem('car-locations');
      
      setTimeout(() => {
        onMigrationComplete();
        onOpenChange(false);
      }, 2000);
    } catch (error) {
      console.error('Migration failed:', error);
      toast({
        title: "마이그레이션 실패",
        description: "데이터 이전 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsMigrating(false);
    }
  };

  const handleSkip = () => {
    localStorage.setItem('migration-skipped', 'true');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            데이터 마이그레이션
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {!migrationComplete ? (
            <>
              <div className="text-sm text-gray-600">
                기존 로컬 저장소에 저장된 데이터를 클라우드로 이전하시겠습니까?
                이전 후 모든 데이터를 안전하게 보관하고 다른 기기에서도 접근할 수 있습니다.
              </div>
              
              {isM완료igrating && (
                <div className="space-y-2">
                  <Progress value={50} className="w-full" />
                  <p className="text-sm text-center text-gray-600">
                    데이터를 이전하고 있습니다...
                  </p>
                </div>
              )}
              
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={handleSkip}
                  disabled={isM완료igrating}
                >
                  나중에
                </Button>
                <Button
                  onClick={handleMigration}
                  disabled={isM완료igrating}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isM완료igrating ? '이전 중...' : '지금 이전'}
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center space-y-4">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
              <div>
                <h3 className="font-medium text-green-700">마이그레이션 완료!</h3>
                {migrationResults && (
                  <div className="text-sm text-gray-600 mt-2">
                    <p>운행기록: {migrationResults.trips}개</p>
                    <p>차량정보: {migrationResults.vehicles}개</p>
                    <p>장소정보: {migrationResults.locations}개</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MigrationDialog;
