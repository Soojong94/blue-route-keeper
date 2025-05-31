// src/components/UserProfile.tsx 수정
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogOut, User, Car, MapPin, Settings, Trash2, Database } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import ProfileSettingsDialog from '@/components/profile/ProfileSettingsDialog';
import AccountDeletionDialog from '@/components/profile/AccountDeletionDialog';
import VehicleManagementDialog from '@/components/profile/VehicleManagementDialog';
import LocationManagementDialog from '@/components/profile/LocationManagementDialog';
import DataManagementDialog from '@/components/profile/DataManagementDialog';

const UserProfile: React.FC = () => {
  const { user, signOut } = useAuth();
  const [isProfileSettingsOpen, setIsProfileSettingsOpen] = useState(false);
  const [isAccountDeletionOpen, setIsAccountDeletionOpen] = useState(false);
  const [isVehicleManagementOpen, setIsVehicleManagementOpen] = useState(false);
  const [isLocationManagementOpen, setIsLocationManagementOpen] = useState(false);
  const [isDataManagementOpen, setIsDataManagementOpen] = useState(false);

  if (!user) return null;

  const displayName = user.user_metadata?.full_name || user.user_metadata?.name || user.email;
  const avatarUrl = user.user_metadata?.avatar_url;
  const initials = displayName ? displayName.charAt(0).toUpperCase() : 'U';

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-8 w-8 rounded-full">
            <Avatar className="h-8 w-8">
              <AvatarImage src={avatarUrl} alt={displayName} />
              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-xs font-medium leading-none">{displayName}</p>
              <p className="text-[10px] leading-none text-muted-foreground">{user.email}</p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="cursor-pointer text-xs"
            onClick={() => setIsProfileSettingsOpen(true)}
          >
            <User className="mr-2 h-3 w-3" />
            <span>프로필 및 사용 통계</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            className="cursor-pointer text-xs"
            onClick={() => setIsVehicleManagementOpen(true)}
          >
            <Car className="mr-2 h-3 w-3" />
            <span>차량 관리</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            className="cursor-pointer text-xs"
            onClick={() => setIsLocationManagementOpen(true)}
          >
            <MapPin className="mr-2 h-3 w-3" />
            <span>장소 관리</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="cursor-pointer text-xs text-orange-600"
            onClick={() => setIsDataManagementOpen(true)}
          >
            <Database className="mr-2 h-3 w-3" />
            <span>데이터 관리</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="cursor-pointer text-xs text-red-600"
            onClick={() => setIsAccountDeletionOpen(true)}
          >
            <Trash2 className="mr-2 h-3 w-3" />
            <span>회원탈퇴</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="cursor-pointer text-xs" onClick={signOut}>
            <LogOut className="mr-2 h-3 w-3" />
            <span>로그아웃</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* 다이얼로그들 */}
      <ProfileSettingsDialog
        open={isProfileSettingsOpen}
        onOpenChange={setIsProfileSettingsOpen}
      />
      <AccountDeletionDialog
        open={isAccountDeletionOpen}
        onOpenChange={setIsAccountDeletionOpen}
      />
      <VehicleManagementDialog
        open={isVehicleManagementOpen}
        onOpenChange={setIsVehicleManagementOpen}
      />
      <LocationManagementDialog
        open={isLocationManagementOpen}
        onOpenChange={setIsLocationManagementOpen}
      />
      <DataManagementDialog
        open={isDataManagementOpen}
        onOpenChange={setIsDataManagementOpen}
      />
    </>
  );
};

export default UserProfile;