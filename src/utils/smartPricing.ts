// src/utils/smartPricing.ts
import { supabase } from '@/integrations/supabase/client';

interface RoutePrice {
  departure: string;
  destination: string;
  unitPrice: number;
  lastUsed: string;
}

// 캐시 저장소 - TTL 기능 추가
const routePriceCache = new Map<string, RoutePrice & { timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5분 캐시 유효 시간

export const getRecentUnitPrice = async (departure: string, destination: string): Promise<number | null> => {
  const cacheKey = `${departure}-${destination}`;
  
  // 캐시 TTL 체크
  if (routePriceCache.has(cacheKey)) {
    const cached = routePriceCache.get(cacheKey)!;
    const now = Date.now();
    
    if (now - cached.timestamp < CACHE_TTL) {
      return cached.unitPrice;
    } else {
      routePriceCache.delete(cacheKey);
    }
  }

  try {
    // 사용자 인증 확인
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return null;
    }

    // 3개월 이내의 데이터만 조회
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    const threeMonthsAgoStr = threeMonthsAgo.toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('trips')
      .select('unit_price, date, departure, destination, created_at')
      .eq('user_id', user.id)
      .eq('departure', departure)
      .eq('destination', destination)
      .gte('date', threeMonthsAgoStr)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      throw error;
    }

    if (data && data.length > 0) {
      const unitPrice = data[0].unit_price;
      
      // 캐시에 저장 (타임스탬프와 함께)
      routePriceCache.set(cacheKey, {
        departure,
        destination,
        unitPrice,
        lastUsed: data[0].date,
        timestamp: Date.now()
      });

      return unitPrice;
    }

    return null;
  } catch (error) {
    console.error('Error fetching recent unit price:', error);
    return null;
  }
};

// 캐시 클리어 함수 - 새로운 데이터 저장 시 호출
export const clearRoutePriceCache = (departure?: string, destination?: string) => {
  if (departure && destination) {
    const cacheKey = `${departure}-${destination}`;
    routePriceCache.delete(cacheKey);
  } else {
    routePriceCache.clear();
  }
};

// 만료된 캐시 정리 함수
export const cleanExpiredCache = () => {
  const now = Date.now();
  let cleanedCount = 0;
  
  for (const [key, value] of routePriceCache.entries()) {
    if (now - value.timestamp >= CACHE_TTL) {
      routePriceCache.delete(key);
      cleanedCount++;
    }
  }
};

// 전역에서 접근 가능하도록 (디버깅용)
if (typeof window !== 'undefined') {
  (window as any).clearRoutePriceCache = clearRoutePriceCache;
  (window as any).cleanExpiredCache = cleanExpiredCache;
}