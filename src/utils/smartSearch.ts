// src/utils/smartSearch.ts
import { supabase } from '@/integrations/supabase/client';
import { SearchResult } from '@/components/SmartInput';
import { Vehicle, Location } from '@/types/trip';

// 최근 사용 기록 관리
class RecentItemsManager {
  private static getKey(type: string): string {
    return `recent_${type}`;
  }

  static add(type: string, item: string): void {
    const key = this.getKey(type);
    const recent = this.get(type);
    const updated = [item, ...recent.filter(r => r !== item)].slice(0, 10);
    localStorage.setItem(key, JSON.stringify(updated));
  }

  static get(type: string): string[] {
    const key = this.getKey(type);
    try {
      return JSON.parse(localStorage.getItem(key) || '[]');
    } catch {
      return [];
    }
  }

  static clear(type: string): void {
    const key = this.getKey(type);
    localStorage.removeItem(key);
  }
}

// 차량 검색 함수
export const searchVehicles = async (query: string): Promise<SearchResult[]> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const results: SearchResult[] = [];

    // 정확히 일치하는 차량
    const { data: exactVehicles } = await supabase
      .from('vehicles')
      .select('*')
      .eq('user_id', user.id)
      .eq('license_plate', query);

    if (exactVehicles) {
      exactVehicles.forEach(vehicle => {
        results.push({
          id: `exact-${vehicle.id}`,
          value: vehicle.license_plate,
          label: `${vehicle.license_plate}${vehicle.name ? ` (${vehicle.name})` : ''}`,
          type: 'exact',
          category: 'vehicle',
          metadata: { vehicleId: vehicle.id, vehicle }
        });
      });
    }

    // 부분 일치하는 차량
    const { data: searchVehicles } = await supabase
      .from('vehicles')
      .select('*')
      .eq('user_id', user.id)
      .ilike('license_plate', `%${query}%`)
      .not('license_plate', 'eq', query)
      .limit(5);

    if (searchVehicles) {
      searchVehicles.forEach(vehicle => {
        results.push({
          id: `search-${vehicle.id}`,
          value: vehicle.license_plate,
          label: `${vehicle.license_plate}${vehicle.name ? ` (${vehicle.name})` : ''}`,
          type: 'search',
          category: 'vehicle',
          metadata: { 
            vehicleId: vehicle.id, 
            vehicle,
            additionalInfo: vehicle.default_unit_price ? `${vehicle.default_unit_price.toLocaleString()}원` : undefined
          }
        });
      });
    }

    // 이름으로도 검색
    if (query.length > 1) {
      const { data: nameSearchVehicles } = await supabase
        .from('vehicles')
        .select('*')
        .eq('user_id', user.id)
        .ilike('name', `%${query}%`)
        .limit(3);

      if (nameSearchVehicles) {
        nameSearchVehicles.forEach(vehicle => {
          // 이미 추가된 차량인지 확인
          if (!results.some(r => r.metadata?.vehicleId === vehicle.id)) {
            results.push({
              id: `name-search-${vehicle.id}`,
              value: vehicle.license_plate,
              label: `${vehicle.license_plate} (${vehicle.name})`,
              type: 'search',
              category: 'vehicle',
              metadata: { 
                vehicleId: vehicle.id, 
                vehicle,
                additionalInfo: '이름 일치'
              }
            });
          }
        });
      }
    }

    // 최근 사용 차량번호
    const recentVehicles = RecentItemsManager.get('vehicles');
    recentVehicles
      .filter(recent => recent.toLowerCase().includes(query.toLowerCase()))
      .forEach((recent, index) => {
        if (!results.some(r => r.value === recent)) {
          results.push({
            id: `recent-vehicle-${index}`,
            value: recent,
            label: recent,
            type: 'recent',
            category: 'vehicle'
          });
        }
      });

    return results;
  } catch (error) {
    console.error('Vehicle search error:', error);
    return [];
  }
};

// 장소 검색 함수
export const searchLocations = async (query: string): Promise<SearchResult[]> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const results: SearchResult[] = [];

    // 등록된 장소에서 정확히 일치
    const { data: exactLocations } = await supabase
      .from('locations')
      .select('*')
      .eq('user_id', user.id)
      .eq('name', query);

    if (exactLocations) {
      exactLocations.forEach(location => {
        results.push({
          id: `exact-${location.id}`,
          value: location.name,
          label: location.name,
          type: 'exact',
          category: 'location',
          metadata: { 
            locationId: location.id, 
            location,
            category: location.category
          }
        });
      });
    }

    // 등록된 장소에서 부분 일치
    const { data: favoriteLocations } = await supabase
      .from('locations')
      .select('*')
      .eq('user_id', user.id)
      .ilike('name', `%${query}%`)
      .not('name', 'eq', query)
      .limit(5);

    if (favoriteLocations) {
      favoriteLocations.forEach(location => {
        const categoryLabels = {
          company: '회사',
          client: '고객사',
          personal: '개인',
          other: '기타'
        };

        results.push({
          id: `favorite-${location.id}`,
          value: location.name,
          label: location.name,
          type: 'favorite',
          category: 'location',
          metadata: { 
            locationId: location.id, 
            location,
            category: categoryLabels[location.category as keyof typeof categoryLabels]
          }
        });
      });
    }

    // 운행 기록에서 출발지/목적지 검색
    const { data: tripLocations } = await supabase
      .from('trips')
      .select('departure, destination')
      .eq('user_id', user.id)
      .or(`departure.ilike.%${query}%,destination.ilike.%${query}%`)
      .limit(10);

    if (tripLocations) {
      const locationSet = new Set<string>();
      
      tripLocations.forEach(trip => {
        [trip.departure, trip.destination].forEach(location => {
          if (location && 
              location.toLowerCase().includes(query.toLowerCase()) && 
              !results.some(r => r.value === location)) {
            locationSet.add(location);
          }
        });
      });

      Array.from(locationSet).slice(0, 5).forEach((location, index) => {
        results.push({
          id: `trip-location-${index}`,
          value: location,
          label: location,
          type: 'search',
          category: 'location',
          metadata: { additionalInfo: '운행 기록' }
        });
      });
    }

    // 최근 사용 장소
    const recentLocations = RecentItemsManager.get('locations');
    recentLocations
      .filter(recent => recent.toLowerCase().includes(query.toLowerCase()))
      .forEach((recent, index) => {
        if (!results.some(r => r.value === recent)) {
          results.push({
            id: `recent-location-${index}`,
            value: recent,
            label: recent,
            type: 'recent',
            category: 'location'
          });
        }
      });

    return results;
  } catch (error) {
    console.error('Location search error:', error);
    return [];
  }
};

// 운전자 검색 함수
export const searchDrivers = async (query: string): Promise<SearchResult[]> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const results: SearchResult[] = [];

    // 운행 기록에서 운전자 검색
    const { data: drivers } = await supabase
      .from('trips')
      .select('driver_name')
      .eq('user_id', user.id)
      .not('driver_name', 'is', null)
      .ilike('driver_name', `%${query}%`)
      .limit(10);

    if (drivers) {
      const driverSet = new Set<string>();
      
      drivers.forEach(trip => {
        if (trip.driver_name && 
            trip.driver_name.toLowerCase().includes(query.toLowerCase())) {
          driverSet.add(trip.driver_name);
        }
      });

      Array.from(driverSet).forEach((driver, index) => {
        results.push({
          id: `driver-${index}`,
          value: driver,
          label: driver,
          type: driver === query ? 'exact' : 'search',
          category: 'driver'
        });
      });
    }

    // 최근 사용 운전자
    const recentDrivers = RecentItemsManager.get('drivers');
    recentDrivers
      .filter(recent => recent.toLowerCase().includes(query.toLowerCase()))
      .forEach((recent, index) => {
        if (!results.some(r => r.value === recent)) {
          results.push({
            id: `recent-driver-${index}`,
            value: recent,
            label: recent,
            type: 'recent',
            category: 'driver'
          });
        }
      });

    return results;
  } catch (error) {
    console.error('Driver search error:', error);
    return [];
  }
};

// 일반 검색 함수 (TripList에서 사용)
export const searchGeneral = async (query: string): Promise<SearchResult[]> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const results: SearchResult[] = [];

    // 출발지, 목적지, 운전자, 메모에서 검색
    const { data: trips } = await supabase
      .from('trips')
      .select('departure, destination, driver_name, memo')
      .eq('user_id', user.id)
      .or(`departure.ilike.%${query}%,destination.ilike.%${query}%,driver_name.ilike.%${query}%,memo.ilike.%${query}%`)
      .limit(15);

    if (trips) {
      const searchSet = new Set<string>();
      
      trips.forEach(trip => {
        [trip.departure, trip.destination, trip.driver_name, trip.memo]
          .filter(Boolean)
          .forEach(field => {
            if (field && field.toLowerCase().includes(query.toLowerCase())) {
              searchSet.add(field);
            }
          });
      });

      Array.from(searchSet).slice(0, 10).forEach((item, index) => {
        results.push({
          id: `general-${index}`,
          value: item,
          label: item,
          type: item === query ? 'exact' : 'search',
          category: 'general'
        });
      });
    }

    // 최근 검색어
    const recentGeneral = RecentItemsManager.get('general');
    recentGeneral
      .filter(recent => recent.toLowerCase().includes(query.toLowerCase()))
      .forEach((recent, index) => {
        if (!results.some(r => r.value === recent)) {
          results.push({
            id: `recent-general-${index}`,
            value: recent,
            label: recent,
            type: 'recent',
            category: 'general'
          });
        }
      });

    return results;
  } catch (error) {
    console.error('General search error:', error);
    return [];
  }
};

// 최근 사용 기록 추가 함수들
export const addRecentVehicle = (licensePlate: string) => {
  RecentItemsManager.add('vehicles', licensePlate);
};

export const addRecentLocation = (location: string) => {
  RecentItemsManager.add('locations', location);
};

export const addRecentDriver = (driver: string) => {
  RecentItemsManager.add('drivers', driver);
};

export const addRecentGeneral = (query: string) => {
  RecentItemsManager.add('general', query);
};

// 최근 사용 기록 가져오기 함수들
export const getRecentVehicles = () => RecentItemsManager.get('vehicles');
export const getRecentLocations = () => RecentItemsManager.get('locations');
export const getRecentDrivers = () => RecentItemsManager.get('drivers');
export const getRecentGeneral = () => RecentItemsManager.get('general');