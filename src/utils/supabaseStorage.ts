import { supabase } from '@/integrations/supabase/client';
import { Trip, Vehicle, Location } from '@/types/trip';

// 안정적인 날짜 포맷 함수
const formatDateForSupabase = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Supabase CRUD operations for trips
export const saveSupabaseTrip = async (tripData: {
  date: string;
  departure: string;
  destination: string;
  unitPrice: number;
  count: number;
  vehicleId: string;
  driverName?: string;
  memo?: string;
}): Promise<Trip> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const newTrip = {
    user_id: user.id,
    date: tripData.date,
    departure: tripData.departure,
    destination: tripData.destination,
    unit_price: tripData.unitPrice,
    count: tripData.count,
    total_amount: tripData.unitPrice * tripData.count,
    vehicle_id: tripData.vehicleId,
    driver_name: tripData.driverName,
    memo: tripData.memo,
  };

  const { data, error } = await supabase
    .from('trips')
    .insert([newTrip])
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id,
    date: data.date,
    departure: data.departure,
    destination: data.destination,
    unitPrice: data.unit_price,
    count: data.count,
    totalAmount: data.total_amount,
    vehicleId: data.vehicle_id,
    driverName: data.driver_name,
    memo: data.memo,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
};

export const getSupabaseTrips = async (): Promise<Trip[]> => {
  const { data, error } = await supabase
    .from('trips')
    .select('*')
    .order('date', { ascending: false });

  if (error) throw error;

  return data.map(trip => ({
    id: trip.id,
    date: trip.date,
    departure: trip.departure,
    destination: trip.destination,
    unitPrice: trip.unit_price,
    count: trip.count,
    totalAmount: trip.total_amount,
    vehicleId: trip.vehicle_id,
    driverName: trip.driver_name,
    memo: trip.memo,
    createdAt: trip.created_at,
    updatedAt: trip.updated_at,
  }));
};

export const getSupabaseTripsByDateRange = async (startDate: Date, endDate: Date): Promise<Trip[]> => {
  const startDateStr = formatDateForSupabase(startDate);
  const endDateStr = formatDateForSupabase(endDate);

  const { data, error } = await supabase
    .from('trips')
    .select('*')
    .gte('date', startDateStr)
    .lte('date', endDateStr)
    .order('date', { ascending: false });

  if (error) {
    console.error('Supabase 에러:', error);
    throw error;
  }

  return data.map(trip => ({
    id: trip.id,
    date: trip.date,
    departure: trip.departure,
    destination: trip.destination,
    unitPrice: trip.unit_price,
    count: trip.count,
    totalAmount: trip.total_amount,
    vehicleId: trip.vehicle_id,
    driverName: trip.driver_name,
    memo: trip.memo,
    createdAt: trip.created_at,
    updatedAt: trip.updated_at,
  }));
};

export const updateSupabaseTrip = async (id: string, updates: Partial<Omit<Trip, 'id' | 'createdAt'>>): Promise<Trip> => {
  const updateData: any = {};
  
  if (updates.date) updateData.date = updates.date;
  if (updates.departure) updateData.departure = updates.departure;
  if (updates.destination) updateData.destination = updates.destination;
  if (updates.unitPrice) updateData.unit_price = updates.unitPrice;
 if (updates.count) updateData.count = updates.count;
 if (updates.vehicleId) updateData.vehicle_id = updates.vehicleId;
 if (updates.driverName !== undefined) updateData.driver_name = updates.driverName;
 if (updates.memo !== undefined) updateData.memo = updates.memo;
 
 if (updates.unitPrice || updates.count) {
   const currentTrip = await supabase.from('trips').select('*').eq('id', id).single();
   const unitPrice = updates.unitPrice || currentTrip.data?.unit_price || 0;
   const count = updates.count || currentTrip.data?.count || 0;
   updateData.total_amount = unitPrice * count;
 }

 const { data, error } = await supabase
   .from('trips')
   .update(updateData)
   .eq('id', id)
   .select()
   .single();

 if (error) throw error;

 return {
   id: data.id,
   date: data.date,
   departure: data.departure,
   destination: data.destination,
   unitPrice: data.unit_price,
   count: data.count,
   totalAmount: data.total_amount,
   vehicleId: data.vehicle_id,
   driverName: data.driver_name,
   memo: data.memo,
   createdAt: data.created_at,
   updatedAt: data.updated_at,
 };
};

export const deleteSupabaseTrip = async (id: string): Promise<void> => {
 const { error } = await supabase
   .from('trips')
   .delete()
   .eq('id', id);

 if (error) throw error;
};

// Vehicle operations
export const saveSupabaseVehicle = async (vehicle: Omit<Vehicle, 'id' | 'createdAt'>): Promise<Vehicle> => {
 const { data: { user } } = await supabase.auth.getUser();
 if (!user) throw new Error('User not authenticated');

 const newVehicle = {
   user_id: user.id,
   name: vehicle.name || null,
   license_plate: vehicle.licensePlate,
   default_unit_price: vehicle.defaultUnitPrice,
 };

 const { data, error } = await supabase
   .from('vehicles')
   .insert([newVehicle])
   .select()
   .single();

 if (error) throw error;

 return {
   id: data.id,
   name: data.name,
   licensePlate: data.license_plate,
   defaultUnitPrice: data.default_unit_price,
   createdAt: data.created_at,
 };
};

export const findSupabaseVehicleByLicensePlate = async (licensePlate: string): Promise<Vehicle | null> => {
 const { data: { user } } = await supabase.auth.getUser();
 if (!user) throw new Error('User not authenticated');

 const { data, error } = await supabase
   .from('vehicles')
   .select('*')
   .eq('user_id', user.id)
   .eq('license_plate', licensePlate)
   .single();

 if (error) {
   if (error.code === 'PGRST116') { // No rows found
     return null;
   }
   throw error;
 }

 return {
   id: data.id,
   name: data.name,
   licensePlate: data.license_plate,
   defaultUnitPrice: data.default_unit_price,
   createdAt: data.created_at,
 };
};

export const searchSupabaseVehiclesByLicensePlate = async (searchTerm: string): Promise<Vehicle[]> => {
 const { data: { user } } = await supabase.auth.getUser();
 if (!user) throw new Error('User not authenticated');

 const { data, error } = await supabase
   .from('vehicles')
   .select('*')
   .eq('user_id', user.id)
   .ilike('license_plate', `%${searchTerm}%`)
   .order('created_at', { ascending: false });

 if (error) throw error;

 return data.map(vehicle => ({
   id: vehicle.id,
   name: vehicle.name,
   licensePlate: vehicle.license_plate,
   defaultUnitPrice: vehicle.default_unit_price,
   createdAt: vehicle.created_at,
 }));
};

export const getSupabaseVehicles = async (): Promise<Vehicle[]> => {
 const { data, error } = await supabase
   .from('vehicles')
   .select('*')
   .order('created_at', { ascending: false });

 if (error) throw error;

 return data.map(vehicle => ({
   id: vehicle.id,
   name: vehicle.name,
   licensePlate: vehicle.license_plate,
   defaultUnitPrice: vehicle.default_unit_price,
   createdAt: vehicle.created_at,
 }));
};

export const updateSupabaseVehicle = async (id: string, updates: Partial<Omit<Vehicle, 'id' | 'createdAt'>>): Promise<Vehicle> => {
 const updateData: any = {};
 
 if (updates.name) updateData.name = updates.name;
 if (updates.licensePlate) updateData.license_plate = updates.licensePlate;
 if (updates.defaultUnitPrice !== undefined) updateData.default_unit_price = updates.defaultUnitPrice;

 const { data, error } = await supabase
   .from('vehicles')
   .update(updateData)
   .eq('id', id)
   .select()
   .single();

 if (error) throw error;

 return {
   id: data.id,
   name: data.name,
   licensePlate: data.license_plate,
   defaultUnitPrice: data.default_unit_price,
   createdAt: data.created_at,
 };
};

export const deleteSupabaseVehicle = async (id: string): Promise<void> => {
 const { error } = await supabase
   .from('vehicles')
   .delete()
   .eq('id', id);

 if (error) throw error;
};

// Location operations
export const saveSupabaseLocation = async (location: Omit<Location, 'id' | 'createdAt'>): Promise<Location> => {
 const { data: { user } } = await supabase.auth.getUser();
 if (!user) throw new Error('User not authenticated');

 const newLocation = {
   user_id: user.id,
   name: location.name,
   category: location.category,
 };

 const { data, error } = await supabase
   .from('locations')
   .insert([newLocation])
   .select()
   .single();

 if (error) throw error;

 return {
   id: data.id,
   name: data.name,
   category: data.category as 'company' | 'client' | 'personal' | 'other',
   createdAt: data.created_at,
 };
};

export const findSupabaseLocationByName = async (name: string): Promise<Location | null> => {
 const { data: { user } } = await supabase.auth.getUser();
 if (!user) throw new Error('User not authenticated');

 const { data, error } = await supabase
   .from('locations')
   .select('*')
   .eq('user_id', user.id)
   .eq('name', name)
   .single();

 if (error) {
   if (error.code === 'PGRST116') { // No rows found
     return null;
   }
   throw error;
 }

 return {
   id: data.id,
   name: data.name,
   category: data.category as 'company' | 'client' | 'personal' | 'other',
   createdAt: data.created_at,
 };
};

export const ensureSupabaseLocationExists = async (name: string): Promise<string> => {
 if (!name.trim()) {
   throw new Error('장소명이 없습니다.');
 }

 // 먼저 기존 장소 찾기
 let existingLocation = await findSupabaseLocationByName(name);

 if (existingLocation) {
   return existingLocation.id;
 }

 // 없으면 새로 생성 (기본 카테고리는 'other')
 try {
   const newLocation = await saveSupabaseLocation({
     name: name,
     category: 'other', // 기본값으로 '기타'로 설정
   });
   
   return newLocation.id;
 } catch (error) {
   console.error('Error creating new location:', error);
   throw new Error(`장소 ${name} 생성 중 오류가 발생했습니다.`);
 }
};

export const getSupabaseLocations = async (): Promise<Location[]> => {
 const { data, error } = await supabase
   .from('locations')
   .select('*')
   .order('created_at', { ascending: false });

 if (error) throw error;

 return data.map(location => ({
   id: location.id,
   name: location.name,
   category: location.category as 'company' | 'client' | 'personal' | 'other',
   createdAt: location.created_at,
 }));
};

export const updateSupabaseLocation = async (id: string, updates: Partial<Omit<Location, 'id' | 'createdAt'>>): Promise<Location> => {
 const updateData: any = {};
 
 if (updates.name) updateData.name = updates.name;
 if (updates.category) updateData.category = updates.category;

 const { data, error } = await supabase
   .from('locations')
   .update(updateData)
   .eq('id', id)
   .select()
   .single();

 if (error) throw error;

 return {
   id: data.id,
   name: data.name,
   category: data.category as 'company' | 'client' | 'personal' | 'other',
   createdAt: data.created_at,
 };
};

export const deleteSupabaseLocation = async (id: string): Promise<void> => {
 const { error } = await supabase
   .from('locations')
   .delete()
   .eq('id', id);

 if (error) throw error;
};