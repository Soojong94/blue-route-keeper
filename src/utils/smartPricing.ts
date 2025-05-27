// src/utils/smartPricing.ts
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
 
 console.log('🔍 Looking for recent unit price:', { departure, destination });
 
 // 캐시에서 먼저 확인
 if (routePriceCache.has(cacheKey)) {
   const cachedPrice = routePriceCache.get(cacheKey)!.unitPrice;
   console.log('💰 Found cached price:', cachedPrice);
   return cachedPrice;
 }

 try {
   // ✅ 사용자 인증 확인 추가
   const { data: { user } } = await supabase.auth.getUser();
   if (!user) {
     console.log('❌ User not authenticated for smart pricing');
     return null;
   }

   console.log('👤 User authenticated:', user.id);

   // 3개월 이내의 데이터만 조회
   const threeMonthsAgo = new Date();
   threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
   const threeMonthsAgoStr = threeMonthsAgo.toISOString().split('T')[0];

   console.log('🔍 Querying database for:', {
     departure,
     destination,
     userId: user.id,
     sinceDate: threeMonthsAgoStr
   });

   const { data, error } = await supabase
     .from('trips')
     .select('unit_price, date, departure, destination')
     .eq('user_id', user.id) // ✅ 사용자 필터 추가
     .eq('departure', departure)
     .eq('destination', destination)
     .gte('date', threeMonthsAgoStr)
     .order('date', { ascending: false })
     .limit(1);

   if (error) {
     console.error('❌ Supabase query error:', error);
     throw error;
   }

   console.log('📊 Query result:', { 
     resultCount: data?.length || 0, 
     data: data?.[0] || null 
   });

   if (data && data.length > 0) {
     const unitPrice = data[0].unit_price;
     
     console.log('✅ Found recent price:', unitPrice);
     
     // 캐시에 저장
     routePriceCache.set(cacheKey, {
       departure,
       destination,
       unitPrice,
       lastUsed: data[0].date
     });

     return unitPrice;
   }

   console.log('🚫 No recent price found for this route');
   return null;
 } catch (error) {
   console.error('❌ Error fetching recent unit price:', error);
   return null;
 }
};

// 캐시 클리어 함수
export const clearRoutePriceCache = () => {
 console.log('🧹 Clearing route price cache');
 routePriceCache.clear();
};