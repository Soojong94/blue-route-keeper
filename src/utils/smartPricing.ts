import { supabase } from '@/integrations/supabase/client';

interface RoutePrice {
  departure: string;
  destination: string;
  unitPrice: number;
  lastUsed: string;
}

// 캐시 저장소
const routePriceCache = new Map<string, RoutePrice>();

export const getRecentUnitPrice = async (departure: string, destination: string): Promise<number | null> => {
  const cacheKey = `${departure}-${destination}`;
  
  // 캐시에서 먼저 확인
  if (routePriceCache.has(cacheKey)) {
    return routePriceCache.get(cacheKey)!.unitPrice;
  }

  try {
    // 3개월 이내의 데이터만 조회
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    const threeMonthsAgoStr = threeMonthsAgo.toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('trips')
      .select('unit_price, date')
      .eq('departure', departure)
      .eq('destination', destination)
      .gte('date', threeMonthsAgoStr)
      .order('date', { ascending: false })
      .limit(1);

    if (error) throw error;

    if (data && data.length > 0) {
      const unitPrice = data[0].unit_price;
      
      // 캐시에 저장
      routePriceCache.set(cacheKey, {
        departure,
        destination,
        unitPrice,
        lastUsed: data[0].date
      });

      return unitPrice;
    }

    return null;
  } catch (error) {
    console.error('Error fetching recent unit price:', error);
    return null;
  }
};

// 캐시 클리어 함수
export const clearRoutePriceCache = () => {
  routePriceCache.clear();
};