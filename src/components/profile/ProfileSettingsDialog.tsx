// src/components/profile/ProfileSettingsDialog.tsx 수정 (평균단가 제거)
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  User,
  Mail,
  Calendar,
  BarChart3,
  Car,
  MapPin,
  TrendingUp,
  Clock,
  Award
} from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useAuth } from '@/hooks/useAuth';
import { getTrips, getVehicles } from '@/utils/storage';
import { Trip, Vehicle } from '@/types/trip';

interface ProfileSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface UserStats {
  totalTrips: number;
  totalAmount: number;
  mostUsedVehicle?: {
    vehicle: Vehicle;
    tripCount: number;
    amount: number;
  };
  mostFrequentRoute?: {
    departure: string;
    destination: string;
    count: number;
    amount: number;
  };
  thisMonthTrips: number;
  thisMonthAmount: number;
  daysSinceFirstTrip: number;
  uniqueRoutes: number;
  topVehicles: Array<{
    vehicle: Vehicle;
    tripCount: number;
    amount: number;
  }>;
  recentActivity: {
    lastTripDate?: string;
    tripsLast7Days: number;
    tripsLast30Days: number;
  };
}

const ProfileSettingsDialog: React.FC<ProfileSettingsDialogProps> = ({
  open,
  onOpenChange
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<UserStats | null>(null);

  useEffect(() => {
    if (open) {
      loadUserStats();
    }
  }, [open]);

  const loadUserStats = async () => {
    try {
      setLoading(true);
      const [trips, vehicles] = await Promise.all([
        getTrips(),
        getVehicles()
      ]);

      const userStats = calculateUserStats(trips, vehicles);
      setStats(userStats);
    } catch (error) {
      console.error('Error loading user stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateUserStats = (trips: Trip[], vehicles: Vehicle[]): UserStats => {
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // 기본 통계
    const totalTrips = trips.reduce((sum, trip) => sum + trip.count, 0);
    const totalAmount = trips.reduce((sum, trip) => sum + trip.totalAmount, 0);

    // 이번 달 통계
    const thisMonthTrips = trips
      .filter(trip => new Date(trip.date) >= thisMonth)
      .reduce((sum, trip) => sum + trip.count, 0);
    const thisMonthAmount = trips
      .filter(trip => new Date(trip.date) >= thisMonth)
      .reduce((sum, trip) => sum + trip.totalAmount, 0);

    // 최근 활동
    const sortedTrips = trips.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const lastTripDate = sortedTrips[0]?.date;
    const tripsLast7Days = trips
      .filter(trip => new Date(trip.date) >= last7Days)
      .reduce((sum, trip) => sum + trip.count, 0);
    const tripsLast30Days = trips
      .filter(trip => new Date(trip.date) >= last30Days)
      .reduce((sum, trip) => sum + trip.count, 0);

    // 차량별 통계
    const vehicleStats = new Map<string, { tripCount: number; amount: number }>();
    trips.forEach(trip => {
      const existing = vehicleStats.get(trip.vehicleId) || { tripCount: 0, amount: 0 };
      vehicleStats.set(trip.vehicleId, {
        tripCount: existing.tripCount + trip.count,
        amount: existing.amount + trip.totalAmount
      });
    });

    const topVehicles = Array.from(vehicleStats.entries())
      .map(([vehicleId, stats]) => {
        const vehicle = vehicles.find(v => v.id === vehicleId);
        return vehicle ? { vehicle, ...stats } : null;
      })
      .filter(Boolean)
      .sort((a, b) => b!.tripCount - a!.tripCount)
      .slice(0, 3) as Array<{ vehicle: Vehicle; tripCount: number; amount: number }>;

    const mostUsedVehicle = topVehicles[0];

    // 경로별 통계
    const routeStats = new Map<string, { count: number; amount: number }>();
    trips.forEach(trip => {
      const routeKey = `${trip.departure}-${trip.destination}`;
      const existing = routeStats.get(routeKey) || { count: 0, amount: 0 };
      routeStats.set(routeKey, {
        count: existing.count + trip.count,
        amount: existing.amount + trip.totalAmount
      });
    });

    const mostFrequentRoute = Array.from(routeStats.entries())
      .map(([routeKey, stats]) => {
        const [departure, destination] = routeKey.split('-');
        return { departure, destination, ...stats };
      })
      .sort((a, b) => b.count - a.count)[0];

    const uniqueRoutes = routeStats.size;

    // 첫 운행일부터 경과일
    const firstTripDate = trips.length > 0 ?
      new Date(Math.min(...trips.map(trip => new Date(trip.date).getTime()))) :
      new Date();
    const daysSinceFirstTrip = Math.floor((now.getTime() - firstTripDate.getTime()) / (1000 * 60 * 60 * 24));

    return {
      totalTrips,
      totalAmount,
      mostUsedVehicle,
      mostFrequentRoute,
      thisMonthTrips,
      thisMonthAmount,
      daysSinceFirstTrip,
      uniqueRoutes,
      topVehicles,
      recentActivity: {
        lastTripDate,
        tripsLast7Days,
        tripsLast30Days
      }
    };
  };

  if (!user) return null;

  const displayName = user.user_metadata?.full_name || user.user_metadata?.name || user.email;
  const avatarUrl = user.user_metadata?.avatar_url;
  const userCreatedAt = user.created_at ? new Date(user.created_at) : new Date();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-sm flex items-center gap-2">
            <User className="h-4 w-4" />
            프로필 및 사용 통계
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* 기본 프로필 정보 */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs flex items-center gap-2">
                <User className="h-3 w-3" />
                기본 정보
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-3">
                {avatarUrl && (
                  <img src={avatarUrl} alt="프로필" className="w-12 h-12 rounded-full" />
                )}
                <div>
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-3 w-3" />
                    <span className="font-medium">{displayName}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Mail className="h-3 w-3" />
                    <span>{user.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Calendar className="h-3 w-3" />
                    <span>가입일: {format(userCreatedAt, 'yyyy년 MM월 dd일', { locale: ko })}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin inline-block h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full"></div>
              <p className="mt-2 text-sm text-gray-500">통계를 불러오는 중...</p>
            </div>
          ) : stats ? (
            <>
              {/* 주요 통계 - 3개 그리드로 변경 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-4 text-center">
                    <BarChart3 className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-blue-800">{stats.totalTrips.toLocaleString()}</div>
                    <div className="text-sm text-blue-600">총 운행 횟수</div>
                  </CardContent>
                </Card>

                <Card className="bg-green-50 border-green-200">
                  <CardContent className="p-4 text-center">
                    <TrendingUp className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-green-800">{stats.totalAmount.toLocaleString()}</div>
                    <div className="text-sm text-green-600">총 운행 금액 (원)</div>
                  </CardContent>
                </Card>

                <Card className="bg-orange-50 border-orange-200">
                  <CardContent className="p-4 text-center">
                    <MapPin className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-orange-800">{stats.uniqueRoutes}</div>
                    <div className="text-sm text-orange-600">이용한 경로 수</div>
                  </CardContent>
                </Card>
              </div>

              {/* 이번 달 & 최근 활동 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs flex items-center gap-2">
                      <Calendar className="h-3 w-3" />
                      이번 달 운행
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>운행 횟수:</span>
                      <span className="font-medium">{stats.thisMonthTrips}회</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>운행 금액:</span>
                      <span className="font-medium">{stats.thisMonthAmount.toLocaleString()}원</span>
                    </div>
                    {stats.thisMonthTrips > 0 && (
                      <div className="flex justify-between text-sm">
                        <span>이번 달 평균:</span>
                        <span className="font-medium">
                          {Math.round(stats.thisMonthAmount / stats.thisMonthTrips).toLocaleString()}원/회
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs flex items-center gap-2">
                      <Clock className="h-3 w-3" />
                      최근 활동
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>최근 운행:</span>
                      <span className="font-medium">
                        {stats.recentActivity.lastTripDate ?
                          format(new Date(stats.recentActivity.lastTripDate), 'MM/dd', { locale: ko }) :
                          '-'
                        }
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>지난 7일:</span>
                      <span className="font-medium">{stats.recentActivity.tripsLast7Days}회</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>지난 30일:</span>
                      <span className="font-medium">{stats.recentActivity.tripsLast30Days}회</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>사용 일수:</span>
                      <span className="font-medium">{stats.daysSinceFirstTrip}일</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* 최다 사용 차량 */}
              {stats.mostUsedVehicle && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs flex items-center gap-2">
                      <Award className="h-3 w-3" />
                      최다 사용 차량
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-blue-100 text-blue-800 border-blue-300">
                            {stats.mostUsedVehicle.vehicle.licensePlate}
                          </Badge>
                          {stats.mostUsedVehicle.vehicle.name && (
                            <span className="text-sm">({stats.mostUsedVehicle.vehicle.name})</span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {stats.mostUsedVehicle.tripCount}회 운행 • {stats.mostUsedVehicle.amount.toLocaleString()}원
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {Math.round((stats.mostUsedVehicle.tripCount / stats.totalTrips) * 100)}%
                        </div>
                        <div className="text-xs text-gray-500">전체 중</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* 최다 이용 경로 */}
              {stats.mostFrequentRoute && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs flex items-center gap-2">
                      <MapPin className="h-3 w-3" />
                      최다 이용 경로
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2 text-sm">
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            {stats.mostFrequentRoute.departure}
                          </Badge>
                          <span>→</span>
                          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                            {stats.mostFrequentRoute.destination}
                          </Badge>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {stats.mostFrequentRoute.count}회 이용 • {stats.mostFrequentRoute.amount.toLocaleString()}원
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {Math.round((stats.mostFrequentRoute.count / stats.totalTrips) * 100)}%
                        </div>
                        <div className="text-xs text-gray-500">전체 중</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* 상위 차량들 (3개 이상일 때만) */}
              {stats.topVehicles.length > 1 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs flex items-center gap-2">
                      <Car className="h-3 w-3" />
                      상위 이용 차량
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {stats.topVehicles.map((vehicleStats, index) => (
                        <div key={vehicleStats.vehicle.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs">
                              {index + 1}
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {vehicleStats.vehicle.licensePlate}
                            </Badge>
                            {vehicleStats.vehicle.name && (
                              <span className="text-xs text-gray-500">({vehicleStats.vehicle.name})</span>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="text-xs font-medium">{vehicleStats.tripCount}회</div>
                            <div className="text-xs text-gray-500">
                              {vehicleStats.amount.toLocaleString()}원
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <div className="text-center py-8 text-gray-500">
              아직 운행 기록이 없습니다.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileSettingsDialog;